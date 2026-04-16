/**
 * Guardian Hook — tool.execute.before integration
 * 
 * V4.7: Source file edit protection.
 * 
 * NOTE: OpenCode plugin hooks do NOT receive agent identity in tool.execute.before.
 * The input only contains: tool, sessionID, callID.
 * Agent identity must be inferred from session context or tool usage patterns.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';

let currentAgent: string | undefined = undefined;

export function setSharkAgent(agent: string): void {
  currentAgent = agent;
}

export function clearSharkAgent(): void {
  currentAgent = undefined;
}

export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input;
    
    // Only process for shark agent sessions
    if (currentAgent !== 'shark') {
      return;
    }
    
    const args = (output as { args: unknown }).args;

    // V4.7: SOURCE FILE EDIT BLOCK - MECHANICAL ENFORCEMENT
    if (tool === 'edit' && args) {
      const editArgs = args as { filePath?: string };
      if (editArgs?.filePath) {
        const filePath = editArgs.filePath;
        const editCheck = guardian.canEdit(filePath);
        
        if (!editCheck.allowed) {
          const errorMsg = `[GUARDIAN] EDIT BLOCKED — SOURCE FILE PROTECTION

File: ${filePath}
Reason: ${editCheck.reason}

This file has not been edited by Shark in this session. 
Direct edits to source files are MECHANICALLY BLOCKED.

Required workflow:
1. DUPLICATE: cp ${filePath} ${filePath}.v1.0.0
2. EDIT COPY: edit filePath=${filePath}.v1.0.0
3. VERIFY: Confirm changes work
4. OPTIONAL REPLACE: Replace original if copy is verified

You MUST follow this sequence. No exceptions.`;

          console.error(errorMsg);
          throw new Error(`[GUARDIAN] SOURCE_FILE_EDIT_BLOCKED: ${editCheck.reason}`);
        }
      }
    }

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
        console.error(`[Shark Guardian] DANGEROUS command detected: ${truncated}...`);
        console.error(`[Shark Guardian] MECHANICAL BLOCK: Cannot execute dangerous commands.`);
        throw new Error(`[GUARDIAN] DANGEROUS_COMMAND_BLOCKED: ${command.slice(0, 50)}...`);
      }
    }

    // Check path-based write permissions (advisory only for non-edit tools)
    if (tool.includes('write_file') || tool.includes('patch')) {
      const a = args as Record<string, unknown>;
      const writePath = (a.path as string) || null;
      if (writePath && !guardian.canWrite(writePath)) {
        const zone = guardian.classifyZone(writePath);
        console.warn(`[Shark Guardian] ADVISORY: Write to ${zone} zone: ${writePath}`);
      }
    }

    return;
  };
}
