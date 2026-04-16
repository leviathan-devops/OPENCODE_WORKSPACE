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

  // Track state per-session to avoid cross-session contamination
  const sessionState = new Map<string, { brainstormCompleted: boolean; currentPhase: number }>();

  return async (input: any, _output: any) => {
    const sessionId = input?.sessionId || 'default';

    // Get or initialize session state
    let state = sessionState.get(sessionId);
    if (!state) {
      state = { brainstormCompleted: false, currentPhase: 0 };
      sessionState.set(sessionId, state);
    }

    // Update phase tracking
    if (input?.phase !== undefined) {
      state.currentPhase = input.phase;
    }

    // Mark brainstorm as completed
    if (input?.event === 'brainstorm_complete' || input?.phase > 0) {
      state.brainstormCompleted = true;
    }

    // Block coding tools before brainstorm
    const codingTools = ['write', 'edit', 'patch', 'create_file', 'insert', 'replace'];
    const isCodingTool = input?.tool && codingTools.includes(input.tool);

    if (isCodingTool && state.currentPhase < requiredPhase && !state.brainstormCompleted) {
      console.error(
        `[BrainstormGate] BLOCKED: ${input.tool} requires Phase 0 (brainstorm) completion. ` +
        `Current phase: ${state.currentPhase}. Complete brainstorm first.`
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
