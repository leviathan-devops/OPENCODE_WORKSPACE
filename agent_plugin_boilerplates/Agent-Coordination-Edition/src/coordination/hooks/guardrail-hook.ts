/**
 * src/coordination/hooks/guardrail-hook.ts
 * 
 * Resource limits per agent - duration, idle timeout, error tracking.
 */

import type { HookHandler } from '../../hooks/utils.js';

export interface GuardrailConfig {
  maxDuration?: number; // ms
  idleTimeout?: number; // ms
  errorThreshold?: number;
}

export function createGuardrailHook(config: GuardrailConfig = {}): HookHandler<any, any> {
  const {
    maxDuration = 300000, // 5 minutes default
    idleTimeout = 60000, // 1 minute default
    errorThreshold = 5,
  } = config;
  
  const agentTimers = new Map<string, { start: number; lastActivity: number; errors: number }>();
  
  return async (input: any, _output: any) => {
    const agentId = input?.agent || input?.context?.agent || 'unknown';
    const now = Date.now();
    
    let state = agentTimers.get(agentId);
    if (!state) {
      state = { start: now, lastActivity: now, errors: 0 };
      agentTimers.set(agentId, state);
    }
    
    // Check duration
    const duration = now - state.start;
    if (duration > maxDuration) {
      console.warn(
        `[Guardrail] Agent ${agentId} has been running for ${duration}ms, ` +
        `exceeding max duration of ${maxDuration}ms`
      );
    }
    
    // Check idle timeout
    const idleTime = now - state.lastActivity;
    if (idleTime > idleTimeout) {
      console.warn(
        `[Guardrail] Agent ${agentId} has been idle for ${idleTime}ms, ` +
        `exceeding idle timeout of ${idleTimeout}ms`
      );
    }
    
    // Track errors
    if (input?.error || input?.failed) {
      state.errors++;
      if (state.errors > errorThreshold) {
        console.error(
          `[Guardrail] Agent ${agentId} has ${state.errors} errors, ` +
          `exceeding threshold of ${errorThreshold}`
        );
      }
    }
    
    // Update last activity
    state.lastActivity = now;
  };
}
