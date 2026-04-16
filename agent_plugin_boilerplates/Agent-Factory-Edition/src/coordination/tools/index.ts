/**
 * src/coordination/tools/index.ts
 * 
 * Coordination tools factory.
 */

import { createDelegateTool } from './delegate.js';
import { createCheckpointTool } from './checkpoint.js';
import { createPhaseCompleteTool } from './phase-complete.js';
import { createSwarmStatusTool } from './swarm-status.js';
import { createEvidenceCheckTool } from './evidence.js';

export interface CoordinationTools {
  [key: string]: any;
}

export function createCoordinationTools(
  delegationEngine: any,
  stateMachine: any,
  swarmStateManager: any,
  registry: any
): CoordinationTools {
  return {
    delegate_task: createDelegateTool(delegationEngine, stateMachine),
    checkpoint: createCheckpointTool(swarmStateManager),
    phase_complete: createPhaseCompleteTool(swarmStateManager, stateMachine),
    swarm_status: createSwarmStatusTool(swarmStateManager, stateMachine, registry),
    evidence_check: createEvidenceCheckTool(swarmStateManager),
  };
}
