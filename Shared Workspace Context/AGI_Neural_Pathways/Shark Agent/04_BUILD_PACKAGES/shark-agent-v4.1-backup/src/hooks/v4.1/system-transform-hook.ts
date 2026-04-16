/**
 * System Transform Hook — experimental.chat.system.transform integration
 * 
 * Injects enforcement context into system prompt.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shark/shared/gates.js';

export function createSystemTransformHook(
  gateManager: GateManager
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    const state = gateManager.getState();
    const criteria = gateManager.getCriteria(state.currentGate as any);

    const enforcementContext = `
[SHARK ENFORCEMENT CONTEXT]
Current Gate: ${(state.currentGate as string).toUpperCase()}
Iteration: ${state.currentIteration}
Verify Attempts: ${state.verifyAttempts}/3

Blocking Criteria for ${state.currentGate}:
${criteria.blockingCriteria.map((c: string) => `  - ${c}`).join('\n')}

Evidence Required:
${criteria.evidenceRequired.map((e: string) => `  - ${e}`).join('\n')}
`.trim();

    const systemOutput = output as { system: string[] };
    if (Array.isArray(systemOutput.system)) {
      systemOutput.system.push(enforcementContext);
    }
  };
}
