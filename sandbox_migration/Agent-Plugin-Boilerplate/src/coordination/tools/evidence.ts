/**
 * src/coordination/tools/evidence.ts
 * 
 * evidence_check tool - verifies evidence for a task.
 */

import { z } from 'zod';
import type { Evidence } from '../types.js';

export const EvidenceCheckToolSchema = z.object({
  taskId: z.string().optional().describe('Task ID to check evidence for'),
  phase: z.number().optional().describe('Phase number to check evidence for'),
  evidenceId: z.string().optional().describe('Specific evidence ID to verify'),
});

export type EvidenceCheckToolInput = z.infer<typeof EvidenceCheckToolSchema>;

export function createEvidenceCheckTool(pluginStateManager: any) {
  return {
    name: 'evidence_check',
    description: 'Check and verify evidence for tasks',
    schema: EvidenceCheckToolSchema,
    
    async execute(
      input: EvidenceCheckToolInput,
      _context: any
    ): Promise<{
      found: boolean;
      evidence: Array<{
        id: string;
        taskId: string;
        type: string;
        verdict: string;
        agent: string;
        timestamp: number;
      }>;
      verified: boolean;
      message: string;
    }> {
      const { taskId, phase, evidenceId } = input;
      
      // If specific evidence ID provided, check it directly
      if (evidenceId) {
        const verified = pluginStateManager.verifyEvidence(evidenceId);
        const allEvidence = await pluginStateManager.getEvidence();
        const evidence = allEvidence.find((e: Evidence) => e.id === evidenceId);
        
        return {
          found: !!evidence,
          evidence: evidence ? [{
            id: evidence.id,
            taskId: evidence.taskId,
            type: evidence.type,
            verdict: evidence.verdict,
            agent: evidence.agent,
            timestamp: evidence.timestamp,
          }] : [],
          verified,
          message: verified 
            ? 'Evidence verified' 
            : 'Evidence not found or invalid',
        };
      }
      
      // Get evidence by task or phase
      let evidence: Evidence[];
      if (taskId) {
        evidence = await pluginStateManager.getEvidence(taskId);
      } else if (phase) {
        evidence = await pluginStateManager.getEvidence();
        evidence = evidence.filter((e: Evidence) => e.phase === phase);
      } else {
        evidence = await pluginStateManager.getEvidence();
      }
      
      // Verify all found evidence
      const verified = evidence.every((e: Evidence) => 
        pluginStateManager.verifyEvidence(e.id)
      );
      
      return {
        found: evidence.length > 0,
        evidence: evidence.map((e: Evidence) => ({
          id: e.id,
          taskId: e.taskId,
          type: e.type,
          verdict: e.verdict,
          agent: e.agent,
          timestamp: e.timestamp,
        })),
        verified,
        message: evidence.length === 0
          ? 'No evidence found'
          : `Found ${evidence.length} evidence entries. Verified: ${verified}`,
      };
    },
  };
}
