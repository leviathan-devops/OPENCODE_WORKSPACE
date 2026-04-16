/**
 * Shark Evidence Tool
 * 
 * View and manage evidence collection.
 */

import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { EvidenceCollector, type GateName } from '../shark/shared/evidence.js';

export function createSharkEvidenceTool(evidenceCollector: EvidenceCollector) {
  return tool({
    description: 'View evidence collection status and debug logs',
    args: {
      action: z.enum(['status', 'gate-evidence', 'iteration-logs', 'complete']).describe('Action to perform'),
      gate: z.enum(['plan', 'build', 'test', 'verify', 'audit', 'delivery']).optional().describe('Gate to view evidence for'),
      iteration: z.string().optional().describe('Iteration to view logs for (e.g., V1.0)'),
    },
    execute: async (args) => {
      const { action, gate, iteration } = args;

      if (action === 'status') {
        const complete = evidenceCollector.hasCompleteEvidence();
        const gates: GateName[] = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];
        const gateStatuses: Record<string, { count: number; latest: string | null }> = {};

        for (const g of gates) {
          const evidence = evidenceCollector.getGateEvidence(g);
          gateStatuses[g] = {
            count: evidence.length,
            latest: evidence[0]?.timestamp 
              ? new Date(evidence[0].timestamp).toISOString() 
              : null,
          };
        }

        return JSON.stringify({ complete, gates: gateStatuses }, null, 2);
      }

      if (action === 'gate-evidence') {
        if (!gate) {
          return JSON.stringify({ error: 'Gate required' });
        }
        const evidence = evidenceCollector.getGateEvidence(gate);
        return JSON.stringify({ gate, evidence }, null, 2);
      }

      if (action === 'iteration-logs') {
        if (!iteration) {
          return JSON.stringify({ error: 'Iteration required' });
        }
        const logs = evidenceCollector.getIterationLogs(iteration);
        return JSON.stringify({ iteration, logs }, null, 2);
      }

      if (action === 'complete') {
        const complete = evidenceCollector.hasCompleteEvidence();
        return JSON.stringify({ complete }, null, 2);
      }

      return JSON.stringify({ error: 'Unknown action' });
    },
  });
}
