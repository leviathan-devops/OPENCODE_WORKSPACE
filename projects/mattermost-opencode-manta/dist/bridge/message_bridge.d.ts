/**
 * Message Bridge
 *
 * Main bridge logic that connects Mattermost messages to OpenCode containers
 * and routes responses back to Mattermost channels.
 */
import { EventEmitter } from 'events';
import { MattermostConfig } from '../mattermost/types.js';
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
export declare class MessageBridge extends EventEmitter {
    private wsListener;
    private pollingListener;
    private httpClient;
    private sessionManager;
    private containerSpawner;
    private commandParser;
    private responseFormatter;
    private config;
    private running;
    private usePolling;
    constructor(config: BridgeConfig);
    private setupEventHandlers;
    start(): Promise<void>;
    stop(): Promise<void>;
    private handleMention;
    private handleHelp;
    private handleStatus;
    private handleReset;
    private handleAgentSwitch;
    private handleCodingTask;
    private forwardToContainer;
    private streamToMattermost;
    private sendReply;
    private sanitizeChannelName;
}
//# sourceMappingURL=message_bridge.d.ts.map