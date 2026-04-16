/**
 * src/coordination/tools/index.ts
 * 
 * Coordination tools factory.
 */

import { createDelegateTool } from './delegate.js';
import { createCheckpointTool } from './checkpoint.js';
import { createPhaseCompleteTool } from './phase-complete.js';
import { createStatusTool } from './plugin-status.js';
import { createEvidenceCheckTool } from './evidence.js';

export interface CoordinationTools {
  [key: string]: any;
}

export function createCoordinationTools(
  delegationEngine: any,
  stateMachine: any,
  pluginStateManager: any,
  registry: any
): CoordinationTools {
  return {
    delegate_task: createDelegateTool(delegationEngine, stateMachine),
    checkpoint: createCheckpointTool(pluginStateManager),
    phase_complete: createPhaseCompleteTool(pluginStateManager, stateMachine),
    plugin_status: createStatusTool(pluginStateManager, stateMachine, registry),
    evidence_check: createEvidenceCheckTool(pluginStateManager),
  };
}
