/**
 * src/coordination/tools/phase-complete.ts
 * 
 * phase_complete tool - marks a phase as complete with evidence verification.
 */

import { z } from 'zod';
import type { ToolContext } from '@opencode-ai/plugin';
import type { Phase } from '../types.js';

export const PhaseCompleteToolSchema = z.object({
  phase: z.number().min(1).describe('Phase number to complete'),
  evidence: z.array(z.object({
    taskId: z.string(),
    verdict: z.enum(['pass', 'fail', 'partial']),
    type: z.string(),
  })).optional().describe('Evidence entries for the phase'),
});

export type PhaseCompleteToolInput = z.infer<typeof PhaseCompleteToolSchema>;

export function createPhaseCompleteTool(
  swarmStateManager: any,
  stateMachine: any
) {
  return {
    name: 'phase_complete',
    description: 'Mark a phase as complete and verify all evidence',
    schema: PhaseCompleteToolSchema,
    
    async execute(
      input: PhaseCompleteToolInput,
      context: ToolContext
    ): Promise<{ success: boolean; phase: number; message: string }> {
      const { phase, evidence = [] } = input;
      
      // Add evidence entries
      for (const ev of evidence) {
        swarmStateManager.addEvidence({
          taskId: ev.taskId,
          phase,
          type: ev.type,
          verdict: ev.verdict,
          agent: context.agent,
          data: {},
        });
      }
      
      // Get plan and verify
      const plan = await swarmStateManager.loadPlan();
      if (!plan) {
        return {
          success: false,
          phase,
          message: 'No plan found',
        };
      }
      
      // Find and update phase
      const phaseDef = plan.phases.find((p: Phase) => p.id === phase);
      if (!phaseDef) {
        return {
          success: false,
          phase,
          message: `Phase ${phase} not found in plan`,
        };
      }
      
      // Mark all tasks in phase as completed
      for (const task of phaseDef.tasks) {
        const taskDef = stateMachine.getTask(task.id);
        if (taskDef && taskDef.status !== 'completed') {
          stateMachine.transition(task.id, 'completed');
        }
      }
      
      // Mark phase as completed
      phaseDef.status = 'completed';
      plan.currentPhase = `Phase ${phase + 1}`;
      
      await swarmStateManager.savePlan(plan);
      
      return {
        success: true,
        phase,
        message: `Phase ${phase} completed. ${evidence.length} evidence entries recorded.`,
      };
    },
  };
}
