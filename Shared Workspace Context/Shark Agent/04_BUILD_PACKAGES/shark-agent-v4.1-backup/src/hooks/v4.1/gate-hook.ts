/**
 * Gate + Evidence Hook — tool.execute.after integration
 * 
 * Collects evidence after tool execution and advances gates when criteria met.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shark/shared/gates.js';
import { EvidenceCollector, type GateEvidence, type GateName } from '../../shark/shared/evidence.js';
import { extractCommandFromArgs } from './utils.js';

export function createGateHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector
): Hooks['tool.execute.after'] {
  return async (input, output) => {
    const { tool, sessionID } = input;
    const args = (input as { args: unknown }).args;
    const result = (output as { output: unknown }).output;
    const currentGate = gateManager.getCurrentGate();

    // Build evidence record
    const evidence = buildEvidenceRecord(tool, args, result);
    if (evidence) {
      const gateEvidence: GateEvidence = {
        gate: currentGate,
        timestamp: Date.now(),
        passed: true,
        files: evidence.files || [],
        metadata: {
          tool,
          sessionID,
          workEvidence: evidence.workEvidence,
        },
      };
      evidenceCollector.collectEvidence(gateEvidence);
    }

    // Auto-advance gates based on tool results
    const shouldAdvance = checkGateAdvance(tool, args, result, currentGate);
    if (shouldAdvance && gateManager.canTransition(shouldAdvance)) {
      gateManager.passCurrentGate();
      gateManager.transitionTo(shouldAdvance);
      console.log(`[Shark] Gate advanced: ${currentGate} → ${shouldAdvance}`);
    }
  };
}

function buildEvidenceRecord(tool: string, args: unknown, result: unknown): { files: string[]; workEvidence: string } | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;

  switch (tool) {
    case 'write_file':
    case 'mcp_write_file': {
      const filePath = a.path as string;
      return { files: filePath ? [filePath] : [], workEvidence: `wrote:${filePath}` };
    }
    case 'patch':
    case 'mcp_patch': {
      const filePath = a.path as string;
      return { files: filePath ? [filePath] : [], workEvidence: `patched:${filePath}` };
    }
    case 'terminal':
    case 'mcp_terminal': {
      const cmd = extractCommandFromArgs(args) || '';
      return { files: [], workEvidence: `ran:${cmd.slice(0, 100)}` };
    }
    default:
      return null;
  }
}

function checkGateAdvance(
  tool: string,
  args: unknown,
  result: unknown,
  currentGate: GateName
): GateName | null {
  const resultStr = result ? JSON.stringify(result) : '';
  const hasError = resultStr.includes('"error"') || resultStr.includes('"status":"error"');
  const cmd = extractCommandFromArgs(args) || '';

  // Build gate advances when files are written
  if (!hasError && currentGate === 'build') {
    if (['write_file', 'mcp_write_file', 'patch', 'mcp_patch'].includes(tool)) {
      return 'test';
    }
  }

  // Test gate advances when tests pass
  if (!hasError && currentGate === 'test') {
    if (/test.*(pass|success|ok)/i.test(resultStr) || /passed.*tests?/i.test(cmd)) {
      return 'verify';
    }
  }

  return null;
}
