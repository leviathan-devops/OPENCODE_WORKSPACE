/**
 * src/coordination/tools/delegate.ts
 * 
 * delegate_task tool - delegates a task to an agent.
 */

import { z } from 'zod';
import type { ToolContext } from '@opencode-ai/plugin';

export const DelegateToolSchema = z.object({
  taskId: z.string().describe('Unique task identifier'),
  agentId: z.string().describe('Target agent ID'),
  agentMode: z.enum(['architect', 'coder', 'reviewer', 'test-engineer', 'sme', 'explorer', 'critic'])
    .describe('Target agent mode'),
  task: z.string().describe('Task description'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional().default('normal'),
  cluster: z.string().optional().describe('Target cluster ID'),
});

export type DelegateToolInput = z.infer<typeof DelegateToolSchema>;

export function createDelegateTool(
  delegationEngine: any,
  stateMachine: any
) {
  return {
    name: 'delegate_task',
    description: 'Delegate a task to an agent for execution',
    schema: DelegateToolSchema,
    
    async execute(
      input: DelegateToolInput,
      context: ToolContext
    ): Promise<{ success: boolean; taskId: string; reason?: string }> {
      const { taskId, agentId, agentMode, task, priority, cluster } = input;
      
      // Check if task exists
      const existingTask = stateMachine.getTask(taskId);
      if (!existingTask) {
        // Create the task first
        stateMachine.createTask({
          id: taskId,
          description: task,
          assignedAgent: agentId,
          phase: context.agent,
        });
      }
      
      // Attempt delegation
      const result = await delegationEngine.delegate({
        taskId,
        target: { agentId, agentMode, cluster },
        task,
        priority,
      });
      
      if (result.success) {
        // Transition task to in_progress
        stateMachine.transition(taskId, 'in_progress');
      }
      
      return {
        success: result.success,
        taskId: result.taskId,
        reason: result.reason,
      };
    },
  };
}
