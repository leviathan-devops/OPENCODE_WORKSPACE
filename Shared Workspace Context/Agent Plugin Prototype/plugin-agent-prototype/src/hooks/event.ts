/**
 * src/hooks/event.ts
 * 
 * Event hook handlers - session lifecycle.
 */

import { safeHook } from './utils.js';
import { getOrCreateSession, getState } from '../state.js';
import { logger } from '../utils/logger.js';

type AnyHookHandler = (input: any, output: any) => Promise<void>;

export function eventHandler(): AnyHookHandler {
  return safeHook(async (input: any, _output: unknown) => {
    const event = input.event;
    if (!event) return;
    
    logger.debug('Event received', { type: event.type });

    switch (event.type) {
      case 'session.created':
        await handleSessionCreated(event);
        break;
      case 'session.started':
        await handleSessionStarted(event);
        break;
      default:
        logger.debug('Unhandled event type', { type: event.type });
    }
  }, 'event');
}

async function handleSessionCreated(event: { type?: string; sessionId?: string; data?: unknown }): Promise<void> {
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
  
  logger.info('Session created', { 
    sessionId: event.sessionId,
    initialized: state.initialized,
  });
}

async function handleSessionStarted(event: { type?: string; sessionId?: string; data?: unknown }): Promise<void> {
  if (!event.sessionId) return;
  
  const session = getOrCreateSession(event.sessionId);
  
  logger.info('Session started', { 
    sessionId: event.sessionId,
    messages: session.messages,
    tools: session.tools,
  });
}

export const sessionCreated = safeHook(
  async (input: any, _out: unknown) => {
    const event = input.event;
    if (event) {
      await handleSessionCreated(event);
    }
  },
  'session.created'
);

export const sessionStarted = safeHook(
  async (input: any, _out: unknown) => {
    const event = input.event;
    if (event) {
      await handleSessionStarted(event);
    }
  },
  'session.started'
);
