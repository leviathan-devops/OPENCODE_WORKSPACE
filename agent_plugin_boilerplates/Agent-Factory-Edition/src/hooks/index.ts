/**
 * src/hooks/index.ts
 * 
 * Hook registry and composition utilities.
 */

import type { HookHandler } from './utils.js';

export { safeHook, safeHookInputOnly, safeHookSync } from './utils.js';

export function composeHandlers<I = unknown, O = unknown>(
  ...handlers: Array<HookHandler<I, O> | undefined>
): HookHandler<I, O> {
  const validHandlers = handlers.filter((h): h is HookHandler<I, O> => h !== undefined);
  
  return async (input: I, output: O) => {
    for (const handler of validHandlers) {
      await handler(input, output);
    }
  };
}

export { eventHandler, sessionCreated, sessionStarted } from './event.js';
export { toolBeforeHook, toolAfterHook } from './tool-before-after.js';
export { commandHook } from './command.js';
export { chatMessageHook } from './chat-message.js';
export { pipelineTrackerHook, contextBudgetHook } from './chat-messages-transform.js';
export { systemEnhancerHook } from './chat-system-transform.js';
export { compactionHook } from './session-compacting.js';
