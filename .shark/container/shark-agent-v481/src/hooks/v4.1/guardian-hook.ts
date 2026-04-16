/**
 * Guardian Hook — tool.execute.before integration (v4.8.1)
 * 
 * MECHANICAL ENFORCEMENT - AI for agent comms only
 * 
 * Guardian blocks:
 * 1. Dangerous terminal commands (rm -rf /, dd, mkfs, etc.)
 * 2. In-place modifications via terminal (sed -i, echo >, etc.)
 * 3. Editing existing files (PLAN phase) - must create new files instead
 * 4. Duplicate/copy operations (PLAN phase)
 * 
 * Guardian ALLOWS:
 * 1. READ operations (read, glob, grep) - always allowed
 * 2. WRITE new files (PLAN can create plan docs, specs)
 * 3. EDIT files created within grace period (60 min)
 * 
 * NO ESCAPE HATCHES. NO BYPASSES.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';
import { getCurrentAgent } from './agent-state.js';
import { getCurrentGate } from '../../shared/gates.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\//,
  /^rm\s+-rf\s+\/bin/,
  /^rm\s+-rf\s+\/usr/,
  /^rm\s+-rf\s+\/sys/,
  /^rm\s+-rf\s+\/proc/,
  /^dd\s+if=/,
  /^mkfs/,
  /^:(){ :|:& };:/,
];

const DUPLICATE_PATTERNS = [
  /^cp\s+/i,
  /^mv\s+.*\s+.*\.v\d+\.\d+\.\d+$/i,
];

const READ_TOOLS = new Set([
  'read', 'glob', 'grep', 'find', 'head', 'tail', 'cat', 'ls', 'pwd', 'tree'
]);

const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';
const OPENCODE_CONFIG_PATTERNS = [
  /opencode\.json$/,
  /\.config\/opencode\/opencode\.json$/,
  /OPENCODE_WORKSPACE.*opencode\.json$/,
];
const SUDO_APPROVAL_FILE = '.shark/.sudo-approval';
const DEPLOYMENT_PATTERNS = [
  /opencode.*install.*plugin/i,
  /plugin.*install/i,
  /npm.*install.*@opencode/i,
  /cp\s+.*\/dist\/.*\/opt\/opencode\/plugins/i,
  / ship's\w*/i,
  /release/i,
  /deploy/i,
  /deliver/i,
];
const VERIFICATION_SPOOF_PATTERNS = [
  /^grep\s+/i,
  /wc\s+-l/i,
  /cat\s+.*\|.*grep/i,
  /pattern.*verification.*local/i,
  /container.*verified.*grep/i,
];

export function createGuardianHook(guardian: Guardian, gateManager: GateManager): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool, sessionID } = input;
    const args = output as { args: unknown };

    // LAYER 1: IDENTITY WALL - Check FIRST
    if (!getCurrentAgent()) {
      return;
    }

    // LAYER 6: SUDO SYSTEM - opencode.json modification requires user approval
    if (tool === 'write_file' || tool === 'mcp_write_file' || tool === 'edit' || tool === 'mcp_patch') {
      const a = args.args as Record<string, unknown>;
      const filePath = (a.path as string) || (a.filePath as string) || null;
      
      if (filePath) {
        const isOpencodeConfig = OPENCODE_CONFIG_PATTERNS.some(pattern => pattern.test(filePath));
        if (isOpencodeConfig) {
          const approvalPath = path.join(process.cwd(), SUDO_APPROVAL_FILE);
          const sudoToken = process.env.SHARK_SUDO_TOKEN;
          
          if (!sudoToken && !fs.existsSync(approvalPath)) {
            throw new Error(`[SUDO BLOCKED] Editing opencode configuration requires user approval.
              Either:
              1. Set environment variable: export SHARK_SUDO_TOKEN=<approval-token>
              2. Create approval file: touch .shark/.sudo-approval
              
              This prevents agents from modifying OpenCode configuration without human oversight.`);
          }
          
          if (sudoToken && sudoToken.length < 16) {
            throw new Error(`[SUDO INVALID] SHARK_SUDO_TOKEN must be at least 16 characters.`);
          }
        }
      }
    }

    // LAYER 3: CONTAINER TEST ENFORCER (Hard Block for Plugin Edits)
    if (tool === 'write_file' || tool === 'mcp_write_file' || tool === 'edit' || tool === 'mcp_patch') {
      const a = args.args as Record<string, unknown>;
      const filePath = (a.path as string) || (a.filePath as string) || null;
      
      if (filePath && filePath.includes('shark-agent-plugin')) {
        const evidencePath = path.join(process.cwd(), '.shark', 'evidence', 'delivery', CONTAINER_TEST_RESULT_FILE);
        
        if (!fs.existsSync(evidencePath)) {
          throw new Error(`[CONTAINER TEST BLOCKED] Modification to plugin source detected. 
            You MUST run 'shark-test-runner action=run' in a container and provide evidence.
            Missing: ${evidencePath}`);
        }
        
        try {
          const testResult = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
          if (!testResult.overallPassed || testResult.passRate < 0.96) {
            throw new Error(`[CONTAINER TEST FAILED] Plugin modification blocked. 
              Pass rate ${testResult.passRate * 100}% is below required 96%.`);
          }
        } catch (e) {
          throw new Error(`[CONTAINER TEST ERROR] Could not verify evidence: ${e.message}`);
        }
      }
    }

    // LAYER 2: DEPLOYMENT GUARD - Blocks deployment without container test evidence
    if (tool === 'terminal' || tool === 'mcp_terminal' || tool === 'bash') {
      const command = extractCommandFromArgs(args.args) || '';
      
      // LAYER 0: ANTI-SPOOF - Block verification commands that don't run actual tests
      for (const pattern of VERIFICATION_SPOOF_PATTERNS) {
        if (pattern.test(command)) {
          throw new Error(`[ANTI-SPOOF] Verification via grep/wc/cat does not count as testing.
            You MUST run actual tests via shark-test-runner.
            Do not use 'grep -c' or 'wc -l' to verify patterns - run the actual test suite.`);
        }
      }
      
      for (const pattern of DEPLOYMENT_PATTERNS) {
        if (pattern.test(command)) {
          const evidencePath = path.join(process.cwd(), '.shark', 'evidence', 'delivery', CONTAINER_TEST_RESULT_FILE);
          
          if (!fs.existsSync(evidencePath)) {
            throw new Error(`[DEPLOYMENT GUARD] Deployment blocked - no container test evidence found.
              You MUST:
              1. Run: shark-test-runner action=run
              2. Achieve passing tests (96%+ pass rate)
              3. Verify: cat .shark/evidence/delivery/ContainerTestResult.json
              
              Deployment cannot proceed without container test verification.`);
          }
          
          try {
            const testResult = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
            if (!testResult.overallPassed) {
              throw new Error(`[DEPLOYMENT GUARD] Deployment blocked - container tests failed.
                Pass rate: ${testResult.passRate || 0}% (required: 96%+)`);
            }
            if ((testResult.passRate || 0) < 0.96) {
              throw new Error(`[DEPLOYMENT GUARD] Deployment blocked - container tests below threshold.
                Pass rate: ${testResult.passRate * 100}% (required: 96%+)`);
            }
          } catch (e) {
            if (e instanceof Error && e.message.includes('DEPLOYMENT GUARD')) {
              throw e;
            }
            throw new Error(`[DEPLOYMENT GUARD] Could not verify container test evidence: ${e.message}`);
          }
        }
      }
    }

    // Get current gate
    const currentGate = gateManager.getCurrentGate();

    // LAYER 3: PLAN GATE ENFORCEMENT
    if (currentGate === 'plan') {
      // READ operations always allowed in PLAN
      if (READ_TOOLS.has(tool)) {
        return; 
      }

      // Duplicate/copy blocked in PLAN
      if (tool === 'terminal' || tool === 'mcp_terminal') {
        const command = extractCommandFromArgs(args.args);
        if (command) {
          for (const pattern of DUPLICATE_PATTERNS) {
            if (pattern.test(command.trim())) {
              throw new Error(`[GUARDIAN] DUPLICATE_BLOCKED_IN_PLAN: ${command.trim()} — Plan phase cannot duplicate files.`);
            }
          }
        }
      }

      // WRITE new files: ALLOWED in PLAN
      if (tool === 'write_file' || tool === 'mcp_write_file') {
        const a = args.args as Record<string, unknown>;
        const writePath = (a.path as string) || null;
        if (writePath) {
          try {
            if (fs.existsSync(writePath)) {
              throw new Error(`[GUARDIAN] FILE_EXISTS_IN_PLAN: ${writePath} — Plan phase cannot overwrite existing files.`);
            }
          } catch {}
          guardian.registerCreate(writePath);
          return;
        }
      }

      // EDIT operations: ALLOWED only if within grace period
      if (tool === 'edit' || tool === 'mcp_patch') {
        const editArgs = args.args as { filePath?: string };
        if (editArgs?.filePath) {
          const filePath = editArgs.filePath;
          const editCheck = guardian.canEdit(filePath);
          if (!editCheck.allowed) {
            throw new Error(`[GUARDIAN] EDIT_BLOCKED_IN_PLAN: ${filePath} — Plan phase cannot edit existing files.`);
          }
          guardian.registerEdit(filePath);
          return;
        }
      }

      // Terminal commands in PLAN - block in-place modifications
      if (tool === 'terminal' || tool === 'mcp_terminal') {
        const command = extractCommandFromArgs(args.args);
        if (command) {
          const modifyPatterns = [/sed\s+-i/i, /echo\s+[^>]*\s+>/i, /printf\s+[^>]*\s+>/i, /cat\s+[^>]*\s+>/i];
          for (const pattern of modifyPatterns) {
            if (pattern.test(command)) {
              throw new Error(`[GUARDIAN] IN_PLACE_MODIFY_BLOCKED_IN_PLAN: ${command.trim()}`);
            }
          }
        }
      }
    }

    // NON-PLAN PHASE: Original guardian logic
    if (tool === 'edit' && args.args) {
      const editArgs = args.args as { filePath?: string };
      if (editArgs?.filePath) {
        const filePath = editArgs.filePath;
        const editCheck = guardian.canEdit(filePath);
        if (!editCheck.allowed) {
          throw new Error(`[GUARDIAN] SOURCE_FILE_EDIT_BLOCKED: ${filePath} — Use cp first.`);
        }
        guardian.registerEdit(filePath);
      }
    }

    const watchedTools = ['terminal', 'mcp_terminal', 'write_file', 'mcp_write_file', 'patch', 'mcp_patch'];
    if (!watchedTools.includes(tool)) return;

    if (currentGate !== 'plan' && (tool === 'terminal' || tool === 'mcp_terminal')) {
      const command = extractCommandFromArgs(args.args);
      if (command) {
        for (const pattern of DANGEROUS_PATTERNS) {
          if (pattern.test(command.trim())) {
            throw new Error(`[GUARDIAN] DANGEROUS_COMMAND_BLOCKED`);
          }
        }
        const modifyCheck = guardian.canModifyFile(command);
        if (!modifyCheck.allowed) {
          throw new Error(`[GUARDIAN] SOURCE_FILE_MODIFY_BLOCKED: ${modifyCheck.filePath}`);
        }
      }
    }

    if (tool.includes('write_file') || tool.includes('patch')) {
      const a = args.args as Record<string, unknown>;
      const writePath = (a.path as string) || null;
      if (writePath && !guardian.canWrite(writePath)) {
        const zone = guardian.classifyZone(writePath);
        throw new Error(`[GUARDIAN] ZONE_VIOLATION: ${zone} zone — ${writePath}`);
      }
      if (writePath) guardian.registerCreate(writePath);
    }

    return;
  };
}
