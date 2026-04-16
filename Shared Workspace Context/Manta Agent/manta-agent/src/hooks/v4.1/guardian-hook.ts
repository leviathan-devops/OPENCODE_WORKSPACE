/**
 * Guardian Hook — tool.execute.before integration
 * 
 * V4.6: FIXED - isMantaAgent(agent) always returns false in CLI mode because
 * the agent field is not present in tool.execute.before hook input.
 * Guardian is now ALWAYS ACTIVE and logs for all agents.
 * 
 * Guardian is ADVISORY-ONLY. OpenCode plugin hooks return Promise<void>
 * and cannot prevent tool execution. This hook logs dangerous commands for
 * audit purposes. The agent is responsible for self-rejection.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';

export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input;
    
    // V4.6: Guardian is always active since isMantaAgent() cannot work
    // without the agent field in hook inputs. This maintains audit coverage.

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
        const truncated = command.slice(0, 80);
        console.error(`[Manta Guardian] DANGEROUS command detected: ${truncated}...`);
        console.error(`[Manta Guardian] ADVISORY: OpenCode hooks cannot block. Agent must self-reject.`);
      }
    }

    // Check path-based write permissions (advisory only)
    if (tool.includes('write_file') || tool.includes('patch')) {
      const a = args as Record<string, unknown>;
      const writePath = (a.path as string) || null;
      if (writePath && !guardian.canWrite(writePath)) {
        const zone = guardian.classifyZone(writePath);
        console.warn(`[Manta Guardian] ADVISORY: Write to ${zone} zone: ${writePath}`);
      }
    }

    return;
  };
}
