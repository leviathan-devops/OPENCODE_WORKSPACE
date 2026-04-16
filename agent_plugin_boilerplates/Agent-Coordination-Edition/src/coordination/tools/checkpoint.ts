/**
 * src/coordination/tools/checkpoint.ts
 * 
 * checkpoint tool - creates named checkpoints.
 */

import { z } from 'zod';
import type { ToolContext } from '@opencode-ai/plugin';

export const CheckpointToolSchema = z.object({
  label: z.string().describe('Checkpoint label/description'),
  metadata: z.record(z.string(), z.any()).optional().describe('Additional metadata'),
});

export type CheckpointToolInput = z.infer<typeof CheckpointToolSchema>;

export function createCheckpointTool(pluginStateManager: any) {
  return {
    name: 'checkpoint',
    description: 'Create a named checkpoint of the current plan state',
    schema: CheckpointToolSchema,
    
    async execute(
      input: CheckpointToolInput,
      _context: ToolContext
    ): Promise<{ checkpointId: string; label: string; createdAt: number }> {
      const { label, metadata } = input;
      
      const checkpoint = await pluginStateManager.createCheckpoint(label, metadata);
      
      return {
        checkpointId: checkpoint.id,
        label: checkpoint.label,
        createdAt: checkpoint.createdAt,
      };
    },
  };
}
