/**
 * src/hooks/utils.ts
 * 
 * Safe hook wrapper - Spider Agent pattern.
 * NEVER let a hook crash the plugin. Every handler is wrapped.
 */

import { incrementHookFired } from '../state.js';
import { logger } from '../utils/logger.js';
import { HOOK_EXECUTION_TIMEOUT_MS } from '../config/constants.js';

export type HookHandler<I = unknown, O = unknown> = (input: I, output: O) => Promise<void>;

export function safeHook<I = unknown, O = unknown>(
  handler: HookHandler<I, O>,
  hookName?: string
): HookHandler<I, O> {
  const name = hookName ?? handler.name ?? 'unknown';
  
  return async (input: I, output: O): Promise<void> => {
    const startTime = Date.now();
    incrementHookFired(name);
    
    try {
      await Promise.race([
        handler(input, output),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Hook timeout: ${name}`)), HOOK_EXECUTION_TIMEOUT_MS)
        ),
      ]);
    } catch (err) {
      logger.error(`Hook error in ${name}`, { 
        error: err instanceof Error ? err.message : String(err),
        duration: Date.now() - startTime,
      });
    }
  };
}

export function safeHookInputOnly<I = unknown>(
  handler: (input: I) => Promise<void>,
  hookName?: string
): HookHandler<I, unknown> {
  const name = hookName ?? handler.name ?? 'unknown';
  
  return safeHook(async (input: I, _output: unknown) => {
    await handler(input);
  }, name);
}

export function safeHookSync<I = unknown, O = unknown>(
  handler: (input: I, output: O) => void,
  hookName?: string
): HookHandler<I, O> {
  const name = hookName ?? handler.name ?? 'unknown';
  
  return safeHook(async (input: I, output: O) => {
    handler(input, output);
  }, name);
}
