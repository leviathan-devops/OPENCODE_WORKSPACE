/**
 * src/coordination/tools/plugin-status.ts
 * 
 * plugin_status tool - reports status of the plugin.
 */

import { z } from 'zod';
import type { ToolContext } from '@opencode-ai/plugin';

export const StatusToolSchema = z.object({
  verbose: z.boolean().optional().default(false).describe('Include detailed task information'),
});

export type StatusToolInput = z.infer<typeof StatusToolSchema>;

export function createStatusTool(
  pluginStateManager: any,
  stateMachine: any,
  registry: any
) {
  return {
    name: 'plugin_status',
    description: 'Report current status of the plugin',
    schema: StatusToolSchema,
    
    async execute(
      input: StatusToolInput,
      _context: ToolContext
    ): Promise<{
      plan: { id: string; title: string; phases: number; currentPhase?: string } | null;
      tasks: { total: number; byStatus: Record<string, number> };
      agents: { total: number; byMode: Record<string, number> };
      checkpoints: number;
    }> {
      const { verbose: _verbose } = input;
      
      const plan = await pluginStateManager.loadPlan();
      const agents = registry.listAgents();
      
      // Count tasks by status
      const allTasks = [
        ...stateMachine.getTasksByState('pending'),
        ...stateMachine.getTasksByState('in_progress'),
        ...stateMachine.getTasksByState('completed'),
        ...stateMachine.getTasksByState('failed'),
        ...stateMachine.getTasksByState('blocked'),
      ];
      
      const byStatus: Record<string, number> = {
        pending: stateMachine.getTasksByState('pending').length,
        in_progress: stateMachine.getTasksByState('in_progress').length,
        completed: stateMachine.getTasksByState('completed').length,
        failed: stateMachine.getTasksByState('failed').length,
        blocked: stateMachine.getTasksByState('blocked').length,
      };
      
      // Count agents by mode
      const byMode: Record<string, number> = {};
      for (const agent of agents) {
        byMode[agent.mode] = (byMode[agent.mode] || 0) + 1;
      }
      
      const checkpoints = await pluginStateManager.listCheckpoints();
      
      return {
        plan: plan ? {
          id: plan.id,
          title: plan.title,
          phases: plan.phases.length,
          currentPhase: plan.currentPhase,
        } : null,
        tasks: {
          total: allTasks.length,
          byStatus,
        },
        agents: {
          total: agents.length,
          byMode,
        },
        checkpoints: checkpoints.length,
      };
    },
  };
}
