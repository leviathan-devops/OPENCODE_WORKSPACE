/**
 * src/hooks/tool-before-after.ts
 * 
 * Tool execution hooks - pre/post processing.
 */

import { safeHook } from './utils.js';
import { getOrCreateSession, recordToolMetric } from '../state.js';
import { logger } from '../utils/logger.js';

type AnyHookHandler = (input: any, output: any) => Promise<void>;

export const toolBeforeHook: AnyHookHandler = safeHook(
  async (input: { tool?: string; sessionID?: string; callID?: string; args?: unknown }, _output: unknown) => {
    if (!input.sessionID || !input.tool) return;
    
    const session = getOrCreateSession(input.sessionID);
    session.tools++;
    
    logger.debug('Tool before', { 
      tool: input.tool, 
      argsKeys: input.args ? Object.keys(input.args as object) : [],
    });
  },
  'tool.execute.before'
);

export const toolAfterHook: AnyHookHandler = safeHook(
  async (input: { tool?: string; sessionID?: string; callID?: string; result?: unknown; error?: unknown }, _output: unknown) => {
    if (!input.sessionID || !input.tool) return;
    
    const startTime = Date.now();
    const success = !input.error;
    
    logger.debug('Tool after', { 
      tool: input.tool, 
      success,
      hasError: !!input.error,
    });
    
    recordToolMetric(input.tool, Date.now() - startTime, success);
  },
  'tool.execute.after'
);
