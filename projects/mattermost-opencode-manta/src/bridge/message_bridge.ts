/**
 * Message Bridge
 * 
 * Main bridge logic that connects Mattermost messages to OpenCode containers
 * and routes responses back to Mattermost channels.
 */

import { EventEmitter } from 'events';
import { MattermostWSListener, MentionEvent } from '../mattermost/mattermost_ws.js';
import { MattermostPollingListener } from '../mattermost/mattermost_polling.js';
import { MattermostHTTPClient } from '../mattermost/mattermost_http.js';
import { SessionManager } from '../session/session_manager.js';
import { ContainerSpawner } from '../opencode/container_spawner.js';
import { CommandParser, ParsedCommand } from './command_parser.js';
import { ResponseFormatter } from './response_formatter.js';
import { MattermostConfig, ChannelSession } from '../mattermost/types.js';
import { ContainerConfig } from '../opencode/types.js';

export interface BridgeConfig {
  mattermost: MattermostConfig;
  session: {
    redisHost: string;
    redisPort: number;
    sessionTimeout: number;
  };
  opencode: {
    image: string;
    defaultAgent: string;
    defaultPlugins: string[];
    defaultModel: string;
    workspaceRoot: string;
  };
  channelConfigs: Map<string, {
    agentType: string;
    plugins: string[];
    model: string;
  }>;
}

export class MessageBridge extends EventEmitter {
  private wsListener: MattermostWSListener | null = null;
  private pollingListener: MattermostPollingListener | null = null;
  private httpClient: MattermostHTTPClient;
  private sessionManager: SessionManager;
  private containerSpawner: ContainerSpawner;
  private commandParser: CommandParser;
  private responseFormatter: ResponseFormatter;
  private config: BridgeConfig;
  private running = false;
  private usePolling = false;

  constructor(config: BridgeConfig) {
    super();
    this.config = config;

    this.httpClient = new MattermostHTTPClient({
      url: config.mattermost.url,
      token: config.mattermost.token,
    });
    this.sessionManager = new SessionManager(config.session);
    this.containerSpawner = new ContainerSpawner();
    this.commandParser = new CommandParser();
    this.responseFormatter = new ResponseFormatter();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // We'll set up handlers when we know which listener we're using
  }

  async start(): Promise<void> {
    if (this.running) {
      console.log('[MessageBridge] Already running');
      return;
    }

    await this.sessionManager.connect();

    // Try WebSocket first
    this.wsListener = new MattermostWSListener(this.config.mattermost);
    this.wsListener.on('mention', (event: MentionEvent) => {
      this.handleMention(event);
    });
    this.wsListener.on('error', (error: Error) => {
      console.error('[MessageBridge] WS Listener error:', error);
    });

    try {
      await this.wsListener.connect();
      console.log('[MessageBridge] Using WebSocket connection');
    } catch (error) {
      console.log('[MessageBridge] WebSocket failed, falling back to polling');
      if (this.wsListener) {
        await this.wsListener.disconnect();
        this.wsListener = null;
      }
      this.usePolling = true;
    }

    if (this.usePolling) {
      // Use polling listener as fallback
      this.pollingListener = new MattermostPollingListener({
        url: this.config.mattermost.url,
        token: this.config.mattermost.token,
        botUsername: this.config.mattermost.botUsername,
        botUserId: this.config.mattermost.botUserId,
        channelIds: this.config.channelConfigs.size > 0 
          ? Array.from(this.config.channelConfigs.keys())
          : ['sziyoi8633fgmj3ob8drtm44jw'],
        pollInterval: 3000,
        requireMention: this.config.mattermost.requireMention,
      });
      
      this.pollingListener.on('mention', (event: any) => {
        // Convert polling event to mention event format
        const mentionEvent: MentionEvent = {
          postId: event.postId,
          channelId: event.channelId,
          channelType: 'O',
          userId: event.userId,
          userName: 'user',
          message: event.message,
          mentions: event.mentions,
          timestamp: event.timestamp,
        };
        this.handleMention(mentionEvent);
      });

      await this.pollingListener.start();
      console.log('[MessageBridge] Using HTTP polling connection');
    }

    this.running = true;
    console.log('[MessageBridge] Started');
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    if (this.wsListener) {
      await this.wsListener.disconnect();
    }
    if (this.pollingListener) {
      await this.pollingListener.stop();
    }
    await this.sessionManager.disconnect();

    this.running = false;
    console.log('[MessageBridge] Stopped');
  }

  private async handleMention(event: MentionEvent): Promise<void> {
    console.log(`[MessageBridge] @mention from ${event.userName} in ${event.channelId}: ${event.message.substring(0, 50)}...`);

    const parsed = this.commandParser.parse(event.message);

    await this.httpClient.sendTyping(event.channelId, event.userId);

    switch (parsed.type) {
      case 'help':
        await this.handleHelp(event);
        break;
      case 'status':
        await this.handleStatus(event);
        break;
      case 'reset':
        await this.handleReset(event);
        break;
      case 'agent':
        await this.handleAgentSwitch(event, parsed);
        break;
      case 'code':
      case 'chat':
      case 'plan':
      case 'review':
        await this.handleCodingTask(event, parsed);
        break;
      default:
        await this.handleCodingTask(event, parsed);
    }
  }

  private async handleHelp(event: MentionEvent): Promise<void> {
    const helpText = `
**Manta Agent - Available Commands**

**Basic:**
• @manta help - Show this help message
• @manta status - Show current session status
• @manta reset - Reset session context

**Agent Control:**
• @manta agent <type> - Switch agent type (manta/shark/spider)
• @manta model <model> - Switch AI model

**Coding Tasks:**
• @manta chat <message> - Chat with the AI
• @manta code <description> - Generate code
• @manta plan <task> - Create implementation plan
• @manta review - Review workspace code

**Examples:**
• @manta code Create a REST API endpoint for user authentication
• @manta plan Build a todo app with React
• @manta review

_Reply will be sent as a threaded response to your message._
`;

    await this.sendReply(event, helpText);
  }

  private async handleStatus(event: MentionEvent): Promise<void> {
    const session = await this.sessionManager.getSession(event.channelId);

    if (!session) {
      const statusText = `
**Session Status:** No active session

This channel doesn't have an active coding session.
Send a message to start a new session with Manta Agent.
`;
      await this.sendReply(event, statusText);
      return;
    }

    const statusText = `
**Session Status**

• **Channel:** ${session.channelName}
• **Agent:** ${session.agentType}
• **Model:** ${session.model}
• **Plugins:** ${session.plugins.join(', ')}
• **Workspace:** ${session.workspacePath}
• **Status:** ${session.status}
• **Last Activity:** ${new Date(session.lastActivity).toISOString()}
• **Container:** ${session.containerName}
`;

    await this.sendReply(event, statusText);
  }

  private async handleReset(event: MentionEvent): Promise<void> {
    const session = await this.sessionManager.getSession(event.channelId);

    if (session) {
      await this.sessionManager.deleteSession(event.channelId);
      await this.containerSpawner.stopContainer(session.containerName);
    }

    const resetText = `
**Session Reset**

Your coding session has been reset. Context has been cleared.
Send a new message to start a fresh session.
`;

    await this.sendReply(event, resetText);
  }

  private async handleAgentSwitch(event: MentionEvent, parsed: ParsedCommand): Promise<void> {
    if (!parsed.args) {
      await this.sendReply(event, '**Error:** Please specify an agent type.\nUsage: @manta agent <manta|shark|spider>');
      return;
    }

    const agentType = parsed.args.toLowerCase() as ChannelSession['agentType'];

    if (!['manta', 'shark', 'spider', 'coder'].includes(agentType)) {
      await this.sendReply(event, `**Error:** Unknown agent type "${parsed.args}".\nValid types: manta, shark, spider, coder`);
      return;
    }

    const session = await this.sessionManager.getSession(event.channelId);

    if (session) {
      await this.sessionManager.updateSession(event.channelId, { agentType });
      await this.sendReply(event, `**Agent Switched:** Now using **${agentType}** agent.\nRestart your conversation for the change to take full effect.`);
    } else {
      await this.sendReply(event, `**Agent Set:** ${agentType} will be used for the next session.`);
    }
  }

  private async handleCodingTask(event: MentionEvent, _parsed: ParsedCommand): Promise<void> {
    let session = await this.sessionManager.getSession(event.channelId);

    if (!session) {
      const channelConfig = this.config.channelConfigs.get(event.channelId) || {
        agentType: this.config.opencode.defaultAgent,
        plugins: this.config.opencode.defaultPlugins,
        model: this.config.opencode.defaultModel,
      };

      const containerConfig: ContainerConfig = {
        name: `opencode-${channelConfig.agentType}-${this.sanitizeChannelName(event.channelId)}`,
        image: this.config.opencode.image,
        agent: channelConfig.agentType as ContainerConfig['agent'],
        model: channelConfig.model,
        plugins: channelConfig.plugins,
        workspace: event.channelId,
        env: {},
      };

      const spawnResult = await this.containerSpawner.spawnContainer(containerConfig);

      if (!spawnResult.success) {
        await this.sendReply(event, `**Error:** Failed to spawn agent container.\n${spawnResult.error}`);
        return;
      }

      session = await this.sessionManager.createSession({
        channelId: event.channelId,
        channelName: event.channelId,
        containerId: spawnResult.containerId,
        containerName: spawnResult.containerName,
        agentType: channelConfig.agentType as ChannelSession['agentType'],
        plugins: channelConfig.plugins,
        workspacePath: `${this.config.opencode.workspaceRoot}/channels/${event.channelId}`,
        model: channelConfig.model,
      });

      await this.sendReply(event, `**Session Started**\n\nUsing **${session.agentType}** agent with **${session.model}**.\n\nYour coding assistant is ready. What would you like to work on?`);
    }

    await this.forwardToContainer(session, event.message);
    await this.sessionManager.updateActivity(event.channelId);
  }

  private async forwardToContainer(session: ChannelSession, message: string): Promise<void> {
    const opencodeMessage = JSON.stringify({
      type: 'user_message',
      content: message,
      session_id: session.sessionId,
      channel_id: session.channelId,
      user_name: 'mattermost-user',
      timestamp: Date.now(),
    });

    await this.containerSpawner.execInContainer(
      session.containerName,
      ['sh', '-c', `echo '${opencodeMessage}' | opencode --agent ${session.agentType} --model ${session.model} --plugins ${session.plugins.join(',')}`],
      (data) => {
        this.streamToMattermost(session.channelId, data);
      }
    );
  }

  private streamToMattermost(channelId: string, data: string): void {
    console.log(`[MessageBridge] Stream from ${channelId}: ${data.substring(0, 100)}`);
  }

  private async sendReply(event: MentionEvent, text: string): Promise<void> {
    try {
      await this.httpClient.createPost(
        event.channelId,
        this.responseFormatter.format(text),
        event.rootId || event.threadId
      );
    } catch (error) {
      console.error('[MessageBridge] Failed to send reply:', error);
    }
  }

  private sanitizeChannelName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '-').substring(0, 50);
  }
}
