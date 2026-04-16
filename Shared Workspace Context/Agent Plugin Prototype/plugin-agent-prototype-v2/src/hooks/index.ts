/**
 * src/hooks/index.ts
 * 
 * Hook registry and composition utilities.
 */

import type { HookHandler } from './utils.js';

export { safeHook, safeHookInputOnly, safeHookSync } from './utils.js';

export function composeHandlers<I = unknown, O = unknown>(
  ...handlers: Array<HookHandler<I, O>>
): HookHandler<I, O> {
  return async (input: I, output: O) => {
    for (const handler of handlers) {
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
