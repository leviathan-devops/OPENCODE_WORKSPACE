/**
 * src/hooks/chat-messages-transform.ts
 * 
 * Experimental chat.messages.transform hooks.
 */

import { safeHook } from './utils.js';
import { getOrCreateSession } from '../state.js';
import { logger } from '../utils/logger.js';

type AnyHookHandler = (input: any, output: any) => Promise<void>;

const CONTEXT_BUDGET = {
  warnThreshold: 0.7,
  criticalThreshold: 0.9,
  maxTokens: 128000,
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length * 0.33);
}

export const pipelineTrackerHook: AnyHookHandler = safeHook(
  async (input: { sessionID?: string; messages?: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> }, _output: unknown) => {
    if (!input.sessionID || !input.messages) return;
    
    // session tracking enabled
    
    const lastMessage = input.messages[input.messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      logger.debug('Pipeline: assistant response', { 
        sessionID: input.sessionID,
        parts: lastMessage.parts?.length ?? 0,
      });
    }
  },
  'experimental.chat.messages.transform:pipelineTracker'
);

export const contextBudgetHook: AnyHookHandler = safeHook(
  async (input: { sessionID?: string; messages?: Array<{ role: string; parts?: Array<{ type: string; text?: string }> }> }, _output: unknown) => {
    if (!input.sessionID || !input.messages) return;
    
    const totalTokens = input.messages.reduce((sum, msg) => {
      const text = msg.parts?.map(p => p.text ?? '').join('') ?? '';
      return sum + estimateTokens(text);
    }, 0);
    
    const ratio = totalTokens / CONTEXT_BUDGET.maxTokens;
    
    if (ratio >= CONTEXT_BUDGET.criticalThreshold) {
      logger.warn('Context critical', { 
        sessionID: input.sessionID,
        ratio: `${Math.round(ratio * 100)}%`,
        tokens: totalTokens,
      });
    } else if (ratio >= CONTEXT_BUDGET.warnThreshold) {
      logger.debug('Context warning', { 
        sessionID: input.sessionID,
        ratio: `${Math.round(ratio * 100)}%`,
        tokens: totalTokens,
      });
    }
  },
  'experimental.chat.messages.transform:contextBudget'
);
