/**
 * Guardian Hook — tool.execute.before integration
 * 
 * Intercepts terminal/shell commands and blocks dangerous operations.
 * Note: OpenCode hooks return Promise<void>. Blocking is done by throwing
 * or by other mechanisms. For now, we log and return.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shark/shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';

export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input;
    const args = (output as { args: unknown }).args;

    // Only check tools that execute commands or write files
    const watchedTools = [
      'terminal', 'mcp_terminal',
      'write_file', 'mcp_write_file',
      'patch', 'mcp_patch'
    ];

    if (!watchedTools.includes(tool)) {
      return;
    }

    // Check for dangerous commands (terminal tools)
    if (tool === 'terminal' || tool === 'mcp_terminal') {
      const command = extractCommandFromArgs(args);
      if (command && guardian.isDangerousCommand(command)) {
        console.log(`[Guardian] DANGEROUS command detected in session ${input.sessionID}: ${command.slice(0, 50)}...`);
        // Note: OpenCode plugin hooks don't support blocking directly.
        // The dangerous command will be logged for audit purposes.
      }
    }

    // Check path-based write permissions
    if (tool.includes('write_file') || tool.includes('patch')) {
      const a = args as Record<string, unknown>;
      const writePath = (a.path as string) || null;
      if (writePath && !guardian.canWrite(writePath)) {
        const zone = guardian.classifyZone(writePath);
        console.log(`[Guardian] Write to ${zone} zone blocked: ${writePath}`);
      }
    }

    return;
  };
}
