/**
 * src/coordination/hooks/index.ts
 * 
 * Coordination hooks - enforcement hooks for the coordination layer.
 */

import type { HookHandler } from '../../hooks/utils.js';

export { createDelegationGateHook, createQAEnforcementHook, type GateHookConfig } from './gate-hook.js';
export { createGuardrailHook, type GuardrailConfig } from './guardrail-hook.js';
export { createSlopDetectorHook, type SlopDetectorConfig } from './slop-detector-hook.js';
export { createBrainstormGateHook, createPhaseGateHook, type BrainstormGateConfig } from './brainstorm-gate.js';

export interface CoordinationHooks {
  'delegation.before': HookHandler<any, any>;
  'delegation.after': HookHandler<any, any>;
  'tool.execute.before': HookHandler<any, any>;
  'tool.execute.after': HookHandler<any, any>;
  'task.created': HookHandler<any, any>;
  'task.transition': HookHandler<any, any>;
  'gate.evaluated': HookHandler<any, any>;
}

export function createCoordinationHooks(
  gateHook: HookHandler<any, any>,
  guardrailHook: HookHandler<any, any>,
  slopDetectorHook: HookHandler<any, any>,
  brainstormGateHook: HookHandler<any, any>
): CoordinationHooks {
  return {
    'delegation.before': gateHook,
    'delegation.after': gateHook,
    'tool.execute.before': guardrailHook,
    'tool.execute.after': slopDetectorHook,
    'task.created': brainstormGateHook,
    'task.transition': brainstormGateHook,
    'gate.evaluated': gateHook,
  };
}
