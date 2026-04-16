/**
 * src/coordination/hooks/brainstorm-gate.ts
 * 
 * Phase 0 completion enforcement - blocks coding tools before brainstorm.
 */

import type { HookHandler } from '../../hooks/utils.js';

export interface BrainstormGateConfig {
  requiredPhase?: number;
}

export function createBrainstormGateHook(config: BrainstormGateConfig = {}): HookHandler<any, any> {
  const { requiredPhase = 0 } = config;
  
  // Track if brainstorm has been completed
  let brainstormCompleted = false;
  let currentPhase = 0;
  
  return async (input: any, _output: any) => {
    // Update phase tracking
    if (input?.phase !== undefined) {
      currentPhase = input.phase;
    }
    
    // Mark brainstorm as completed
    if (input?.event === 'brainstorm_complete' || input?.phase > 0) {
      brainstormCompleted = true;
    }
    
    // Block coding tools before brainstorm
    const codingTools = ['write', 'edit', 'patch', 'create_file', 'insert', 'replace'];
    const isCodingTool = input?.tool && codingTools.includes(input.tool);
    
    if (isCodingTool && currentPhase < requiredPhase && !brainstormCompleted) {
      console.error(
        `[BrainstormGate] BLOCKED: ${input.tool} requires Phase 0 (brainstorm) completion. ` +
        `Current phase: ${currentPhase}. Complete brainstorm first.`
      );
      
      // Throw to block the operation
      throw new Error(
        `[BrainstormGate] Coding tools are blocked until Phase 0 (brainstorm) is complete. ` +
        `Use /Spider brainstorm or complete the planning phase first.`
      );
    }
  };
}

export function createPhaseGateHook(
  requiredPhase: number,
  blockedTools: string[] = ['write', 'edit']
): HookHandler<any, any> {
  return async (input: any, _output: any) => {
    const currentPhase = input?.phase || 0;
    const isBlockedTool = input?.tool && blockedTools.includes(input.tool);
    
    if (isBlockedTool && currentPhase < requiredPhase) {
      throw new Error(
        `[PhaseGate] Tool '${input.tool}' requires phase ${requiredPhase}. ` +
        `Current phase: ${currentPhase}.`
      );
    }
  };
}
