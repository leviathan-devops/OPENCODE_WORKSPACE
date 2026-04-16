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
  
  let consecutiveCoderCalls = 0;
  
  return async (input: any, _output: any) => {
    // Check for delegation patterns that need enforcement
    if (input?.tool === 'delegate_task' || input?.name === 'delegate_task') {
      consecutiveCoderCalls++;
      
      if (consecutiveCoderCalls > maxConsecutiveCoderCalls) {
        // Inject warning
        if (warnOnRejection) {
          console.warn(
            `[GateHook] WARNING: ${consecutiveCoderCalls} consecutive coder delegations detected. ` +
            `Consider if the delegation pattern is correct.`
          );
        }
      }
    }
    
    // Reset counter on non-delegation tools
    if (input?.tool && input?.tool !== 'delegate_task' && input?.name !== 'delegate_task') {
      consecutiveCoderCalls = 0;
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
