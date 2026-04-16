/**
 * src/index.ts
 * 
 * Spider Agent Prototype - Test Plugin v3
 * With Agent Coordination Layer
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
import { createCoordinationLayer } from './coordination/index.js';

const PLUGIN_NAME = 'SpiderAgentPrototype';
const PLUGIN_VERSION = '0.3.0';

export default async function SpiderAgentPrototype(): Promise<Hooks> {
  const config = loadConfig();
  
  if (config.debug) {
    setLogLevel('debug');
  }
  
  const state = getState();
  
  logger.info(`${PLUGIN_NAME} v${PLUGIN_VERSION} initializing`, {
    enabled: config.enabled,
    debug: config.debug,
    coordination: config.coordination?.enabled ?? false,
  });
  
  state.initialized = true;
  state.configHash = hashConfig(config);
  
  const tools = createToolRegistry(config);
  const agents = createAgentRegistry(config);
  
  // Create coordination layer if enabled
  let coordination = null;
  if (config.coordination?.enabled) {
    coordination = createCoordinationLayer({
      enabled: true,
      swarmId: config.coordination.swarmId || 'plugin-v3',
      swarmName: config.coordination.swarmName || 'Plugin Agent v3',
      agents: {},
      gates: config.coordination.gates,
      guardrails: config.coordination.guardrails,
      storage: config.coordination.storage,
    });
    
    logger.info(`${PLUGIN_NAME} coordination layer initialized`, {
      swarmId: coordination.config.swarmId,
    });
  }
  
  logger.info(`${PLUGIN_NAME} initialized`, {
    toolCount: Object.keys(tools).length,
    agentCount: Object.keys(agents).length,
    coordinationEnabled: !!coordination,
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
    
    tool: {
      ...tools,
      // Add coordination tools if enabled
      ...(coordination?.tools || {}),
    },
    
    'tool.execute.before': composeHandlers(
      coordination?.hooks['tool.execute.before'] ?? undefined,
      toolBeforeHook,
    ),
    
    'tool.execute.after': composeHandlers(
      coordination?.hooks['tool.execute.after'] ?? undefined,
      toolAfterHook,
    ),
    
    'chat.message': chatMessageHook,
    
    'experimental.chat.messages.transform': composeHandlers(
      pipelineTrackerHook,
      contextBudgetHook,
    ),
    
    'experimental.chat.system.transform': systemEnhancerHook,
    
    'experimental.session.compacting': compactionHook,
    
    'command.execute.before': composeHandlers(
      coordination?.hooks['task.created'] ?? undefined,
      commandHook,
    ),
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
