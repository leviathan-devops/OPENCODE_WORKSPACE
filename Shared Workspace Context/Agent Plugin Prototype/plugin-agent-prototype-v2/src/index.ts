/**
 * src/index.ts
 * 
 * Spider Agent Prototype - Test Plugin
 */

import type { Hooks } from '@opencode-ai/plugin';
import { loadConfig, getConfig } from './config/loader.js';
import { logger, setLogLevel } from './utils/logger.js';
import { getState } from './state.js';
import { createToolRegistry } from './tools/index.js';
import { createAgentRegistry } from './agents/index.js';
import {
  safeHook,
  composeHandlers,
  pipelineTrackerHook,
  contextBudgetHook,
  systemEnhancerHook,
  compactionHook,
  toolBeforeHook,
  toolAfterHook,
  commandHook,
  chatMessageHook,
} from './hooks/index.js';

const PLUGIN_NAME = 'SpiderAgentPrototype';
const PLUGIN_VERSION = '0.1.0';

export default async function SpiderAgentPrototype(): Promise<Hooks> {
  const config = loadConfig();
  
  if (config.debug) {
    setLogLevel('debug');
  }
  
  const state = getState();
  
  logger.info(`${PLUGIN_NAME} v${PLUGIN_VERSION} initializing`, {
    enabled: config.enabled,
    debug: config.debug,
  });
  
  state.initialized = true;
  state.configHash = hashConfig(config);
  
  const tools = createToolRegistry(config);
  const agents = createAgentRegistry(config);
  
  logger.info(`${PLUGIN_NAME} initialized`, {
    toolCount: Object.keys(tools).length,
    agentCount: Object.keys(agents).length,
  });
  
  return {
    event: safeHook(async (input: any, _output: unknown) => {
      const event = input.event;
      if (!event) return;
      
      logger.debug('Event received', { type: event.type });
      
      switch (event.type) {
        case 'session.created':
          handleSessionCreated(event);
          break;
        case 'session.started':
          handleSessionStarted(event);
          break;
        default:
          logger.debug('Unhandled event', { type: event.type });
      }
    }, 'event') as any,
    
    tool: tools,
    
    'tool.execute.before': toolBeforeHook,
    'tool.execute.after': toolAfterHook,
    
    'chat.message': chatMessageHook,
    
    'experimental.chat.messages.transform': composeHandlers(
      pipelineTrackerHook,
      contextBudgetHook,
    ),
    
    'experimental.chat.system.transform': systemEnhancerHook,
    
    'experimental.session.compacting': compactionHook,
    
    'command.execute.before': commandHook,
  };
}

function handleSessionCreated(event: { type?: string; sessionId?: string; data?: unknown }): void {
  if (!event.sessionId) return;
  
  const state = getState();
  const session = state.sessions.get(event.sessionId) ?? {
    sessionId: event.sessionId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    messages: 0,
    tools: 0,
  };
  state.sessions.set(event.sessionId, session);
  
  logger.info('Session created', { sessionId: event.sessionId });
}

function handleSessionStarted(event: { type?: string; sessionId?: string; data?: unknown }): void {
  if (!event.sessionId) return;
  
  logger.info('Session started', { sessionId: event.sessionId });
}

function hashConfig(config: ReturnType<typeof getConfig>): string {
  const str = JSON.stringify({
    enabled: config.enabled,
    debug: config.debug,
    hasStorage: !!config.storage,
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
