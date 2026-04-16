/**
 * Mattermost-OpenCode-Manta Integration
 * 
 * Main entry point for the bridge service.
 */

import { MessageBridge } from './bridge/message_bridge.js';
import { BridgeConfig } from './bridge/message_bridge.js';
import * as fs from 'fs';
import * as path from 'path';

function loadConfig(): BridgeConfig {
  const mattermostUrl = process.env.MATTERMOST_URL || 'https://mattermost-production-a9b9.up.railway.app';
  const mattermostToken = process.env.MATTERMOST_TOKEN || '';
  const botUsername = process.env.MATTERMOST_BOT_USERNAME || 'opencode-bot';
  const botUserId = process.env.MATTERMOST_BOT_USER_ID || '';
  const allowedUsers = (process.env.MATTERMOST_ALLOWED_USERS || '*').split(',').map(s => s.trim());
  const requireMention = process.env.MATTERMOST_REQUIRE_MENTION !== 'false';
  const freeChannels = (process.env.MATTERMOST_FREE_RESPONSE_CHANNELS || '').split(',').filter(Boolean);

  const channelConfigs = new Map<string, { agentType: string; plugins: string[]; model: string }>();
  const channelConfigPath = path.join(process.cwd(), 'config', 'channel-defaults.json');
  if (fs.existsSync(channelConfigPath)) {
    const channelData = JSON.parse(fs.readFileSync(channelConfigPath, 'utf-8'));
    for (const [channelName, config] of Object.entries(channelData)) {
      channelConfigs.set(channelName, config as { agentType: string; plugins: string[]; model: string });
    }
  }

  const config: BridgeConfig = {
    mattermost: {
      url: mattermostUrl,
      token: mattermostToken,
      botUsername,
      botUserId,
      allowedUsers,
      requireMention,
      freeResponseChannels: freeChannels,
    },
    session: {
      redisHost: process.env.REDIS_HOST || 'localhost',
      redisPort: parseInt(process.env.REDIS_PORT || '6379'),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800'),
    },
    opencode: {
      image: process.env.OPENCODE_IMAGE || 'opencodeai/opencode:latest',
      defaultAgent: process.env.DEFAULT_AGENT || 'manta',
      defaultPlugins: (process.env.DEFAULT_PLUGINS || 'manta-agent-v1.5').split(','),
      defaultModel: process.env.DEFAULT_MODEL || 'minimax/MiniMax-M2.7',
      workspaceRoot: process.env.WORKSPACE_ROOT || '/workspace',
    },
    channelConfigs,
  };

  return config;
}

async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Mattermost-OpenCode-Manta Bridge Service               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  const config = loadConfig();

  console.log('[Config] Mattermost URL:', config.mattermost.url);
  console.log('[Config] Bot Username:', config.mattermost.botUsername);
  console.log('[Config] Redis:', `${config.session.redisHost}:${config.session.redisPort}`);
  console.log('[Config] OpenCode Image:', config.opencode.image);
  console.log('[Config] Default Agent:', config.opencode.defaultAgent);
  console.log('[Config] Default Plugins:', config.opencode.defaultPlugins.join(', '));

  const bridge = new MessageBridge(config);

  const shutdown = async (signal: string) => {
    console.log(`\n[Main] Received ${signal}, shutting down...`);
    await bridge.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await bridge.start();
    console.log('[Main] Bridge service started successfully');
    process.stdin.resume();
  } catch (error) {
    console.error('[Main] Failed to start bridge:', error);
    process.exit(1);
  }
}

main().catch(console.error);
