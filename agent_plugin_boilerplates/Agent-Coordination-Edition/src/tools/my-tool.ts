/**
 * src/tools/my-tool.ts
 * 
 * Example custom tool - demonstrates tool registration pattern.
 */

import { tool as toolFn } from '@opencode-ai/plugin';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { getConfig } from '../config/loader.js';

export function createMyTool() {
  return toolFn({
    description: 'Multi-purpose Spider Agent tool for task management and status queries',
    args: {
      action: z.string(),
      taskId: z.string().optional(),
      query: z.string().optional(),
    },
    execute: async (args) => {
      logger.debug('MyTool executed', { action: args.action });
      
      const config = getConfig();
      const action = args.action;
      
      switch (action) {
        case 'status': {
          const status = {
            plugin: 'SpiderAgentPrototype',
            version: '0.1.0',
            enabled: config.enabled,
            debug: config.debug,
            hasStorage: !!config.storage,
          };
          return JSON.stringify(status);
        }
        case 'delegate': {
          if (!args.taskId) {
            return JSON.stringify({ error: 'taskId required for delegate action' });
          }
          const result = {
            delegated: true,
            taskId: args.taskId,
            agent: 'coder',
            message: `Task ${args.taskId} delegated`,
          };
          return JSON.stringify(result);
        }
        case 'query': {
          if (!args.query) {
            return JSON.stringify({ error: 'query required for query action' });
          }
          const result = {
            query: args.query,
            response: `Query: ${args.query}`,
            context: 'Spider Agent Prototype ready',
          };
          return JSON.stringify(result);
        }
        default:
          return JSON.stringify({ error: `Unknown action: ${action}` });
      }
    },
  });
}
