/**
 * src/coordination/commands/registry.ts
 * 
 * Command registry for slash commands.
 */

import type { CommandDefinition, CommandRegistry } from '../types.js';
import type { ToolContext } from '@opencode-ai/plugin';

export function createCommandRegistry(): CommandRegistry {
  const commands = new Map<string, CommandDefinition>();
  
  return {
    register(command: CommandDefinition): void {
      commands.set(command.name, command);
    },
    
    unregister(name: string): boolean {
      return commands.delete(name);
    },
    
    get(name: string): CommandDefinition | null {
      return commands.get(name) || null;
    },
    
    list(): CommandDefinition[] {
      return Array.from(commands.values());
    },
  };
}

// Default commands
export function createDefaultCommands(
  pluginStateManager: any,
  stateMachine: any,
  registry: any
): CommandDefinition[] {
  return [
    {
      name: 'plugin-status',
      description: 'Show current plugin status',
      handler: async (_context: ToolContext, _args: string[]) => {
        const plan = await pluginStateManager.loadPlan();
        const agents = registry.listAgents();
        const tasks = {
          pending: stateMachine.getTasksByState('pending').length,
          in_progress: stateMachine.getTasksByState('in_progress').length,
          completed: stateMachine.getTasksByState('completed').length,
        };
        
        console.log(`Plugin Status:
  Plan: ${plan?.title || 'No plan loaded'}
  Agents: ${agents.length}
  Tasks: ${tasks.pending} pending, ${tasks.in_progress} in progress, ${tasks.completed} completed
`);
      },
    },
    {
      name: 'checkpoint',
      description: 'Create a checkpoint of current state',
      handler: async (_context: ToolContext, args: string[]) => {
        const label = args.join(' ') || `Checkpoint at ${new Date().toISOString()}`;
        const checkpoint = await pluginStateManager.createCheckpoint(label);
        console.log(`Checkpoint created: ${checkpoint.id} - ${label}`);
      },
    },
    {
      name: 'list-checkpoints',
      description: 'List all checkpoints',
      handler: async (_context: ToolContext, _args: string[]) => {
        const checkpoints = await pluginStateManager.listCheckpoints();
        console.log('Checkpoints:');
        for (const cp of checkpoints) {
          console.log(`  ${cp.id}: ${cp.label} (${new Date(cp.createdAt).toISOString()})`);
        }
      },
    },
  ];
}
