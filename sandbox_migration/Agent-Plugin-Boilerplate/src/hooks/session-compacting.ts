/**
 * src/hooks/session-compacting.ts
 * 
 * Experimental session.compacting hook.
 */

import { safeHook } from './utils.js';
import { getOrCreateSession, getState } from '../state.js';
import { logger } from '../utils/logger.js';

type AnyHookHandler = (input: any, output: any) => Promise<void>;

export const compactionHook: AnyHookHandler = safeHook(
  async (input: { sessionID?: string }, _output: unknown) => {
    if (!input.sessionID) return;
    
    const session = getOrCreateSession(input.sessionID);
    const state = getState();
    
    logger.info('Session compacting', { 
      sessionID: input.sessionID,
      messages: session.messages,
      tools: session.tools,
      initialized: state.initialized,
    });
  },
  'experimental.session.compacting'
);
