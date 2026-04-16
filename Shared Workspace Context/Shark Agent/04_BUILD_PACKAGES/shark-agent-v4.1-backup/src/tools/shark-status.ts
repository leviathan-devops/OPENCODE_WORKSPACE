import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import type { StateStore } from '../shark/shared/state-store.js';
import type { GateManager } from '../shark/shared/gates.js';

export function createSharkStatusTool(
  stateStore: StateStore,
  gateManager: GateManager,
  variant: 'micro' | 'macro'
) {
  return tool({
    description: 'Show current Shark V4 state: brain, gate, iteration, and evidence status',
    args: {},
    execute: async (_, ctx) => {
      const gateState = gateManager.getState();
      const currentGate = gateManager.getCurrentGate();
      const iteration = gateManager.getCurrentIteration();
      
      let brainState = 'N/A';
      if (variant === 'micro') {
        const microState = stateStore.get<any>('micro-state');
        brainState = microState?.currentBrain || 'unknown';
      } else {
        const macroState = stateStore.get<any>('macro-state');
        brainState = macroState?.activeBrains?.join(', ') || 'unknown';
      }

      const evidence = gateManager.getEvidenceCollector();
      const evidenceStatus: Record<string, boolean> = {};
      const gates = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'] as const;
      
      for (const gate of gates) {
        const latest = evidence.getLatestEvidence(gate);
        evidenceStatus[gate] = latest?.passed || false;
      }

      const status = {
        variant,
        brain: brainState,
        currentGate,
        iteration,
        gateStatuses: gateState.gateStatus,
        evidenceStatus,
        verifyAttempts: gateState.verifyAttempts,
      };

      return JSON.stringify(status, null, 2);
    },
  });
}
