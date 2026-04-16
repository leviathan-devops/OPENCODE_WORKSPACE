/**
 * src/hooks/chat-message.ts
 * 
 * Chat message hook - tracks delegation and agent activity.
 */

import { safeHook } from './utils.js';
import { getOrCreateSession } from '../state.js';
import { logger } from '../utils/logger.js';

type AnyHookHandler = (input: any, output: any) => Promise<void>;

interface MessagePart {
  type: string;
  text?: string;
  tool?: string;
  toolName?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  parts?: MessagePart[];
  content?: string;
}

export const chatMessageHook: AnyHookHandler = safeHook(
  async (input: { sessionID?: string; message?: Message }, _output: unknown) => {
    if (!input.sessionID || !input.message) return;
    
    const session = getOrCreateSession(input.sessionID);
    session.messages++;
    
    const role = input.message.role;
    
    if (role === 'assistant' && input.message.parts) {
      await trackAgentDelegation(input.sessionID, input.message.parts);
    }
    
    logger.debug('Chat message', { 
      sessionID: input.sessionID,
      role,
      partCount: input.message.parts?.length ?? 0,
    });
  },
  'chat.message'
);

async function trackAgentDelegation(sessionId: string, parts: MessagePart[]): Promise<void> {
  for (const part of parts) {
    if (part.type === 'text' && part.text) {
      const text = part.text.toLowerCase();
      
      if (text.includes('@coder')) {
        logger.debug('Coder delegation detected', { sessionID: sessionId });
      }
      
      if (text.includes('@reviewer')) {
        logger.debug('Reviewer delegation detected', { sessionID: sessionId });
      }
    }
  }
}
