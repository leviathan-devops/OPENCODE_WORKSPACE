/**
 * src/coordination/hooks/gate-hook.ts
 * 
 * Delegation gate hook - prevents invalid delegation patterns.
 */

import type { HookHandler } from '../../hooks/utils.js';

export interface GateHookConfig {
  maxConsecutiveCoderCalls?: number;
  warnOnRejection?: boolean;
}

export function createDelegationGateHook(config: GateHookConfig = {}): HookHandler<any, any> {
  const {
    maxConsecutiveCoderCalls = 5,
    warnOnRejection = true,
  } = config;

  // Track state per-session to avoid cross-session contamination
  const sessionState = new Map<string, number>();

  return async (input: any, _output: any) => {
    const sessionId = input?.sessionId || 'default';

    // Check for delegation patterns that need enforcement
    if (input?.tool === 'delegate_task' || input?.name === 'delegate_task') {
      const current = sessionState.get(sessionId) || 0;
      const next = current + 1;
      sessionState.set(sessionId, next);

      if (next > maxConsecutiveCoderCalls) {
        // Inject warning
        if (warnOnRejection) {
          console.warn(
            `[GateHook] WARNING: ${next} consecutive coder delegations detected for session ${sessionId}. ` +
            `Consider if the delegation pattern is correct.`
          );
        }
      }
    }

    // Reset counter on non-delegation tools
    if (input?.tool && input?.tool !== 'delegate_task' && input?.name !== 'delegate_task') {
      sessionState.delete(sessionId);
    }
  };
}

export function createQAEnforcementHook(): HookHandler<any, any> {
  return async (input: any, _output: any) => {
    // Inject QA gate reminders before certain operations
    if (input?.tool === 'edit' || input?.tool === 'write') {
      console.info(
        `[QA Gate] Remember: All changes require reviewer approval before commit.`
      );
    }
  };
}
