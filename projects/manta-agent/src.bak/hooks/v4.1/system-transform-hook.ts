/**
 * System Transform Hook — manta enforcement context injection
 * 
 * V4.6: FIXED - isMantaAgent(agent) always returns false in CLI mode because
 * the agent field is not present in chat.system.transform hook input.
 * Hook is now ALWAYS ACTIVE - enforcement context injected for all sessions.
 * 
 * This injects gate/brain context into every chat turn, which is safe to do
 * even for non-manta agents (they simply won't use the context).
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import type { MantaCoordinator } from '../manta/coordinator.js';

export function createSystemTransformHook(
  gateManager: GateManager,
  coordinator?: MantaCoordinator
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    // V4.6: Hook is always active since isMantaAgent() cannot work
    // without the agent field in hook inputs. The context is harmless
    // for non-manta agents and critical for manta enforcement.

    const state = gateManager.getState();
    const criteria = gateManager.getCriteria(state.currentGate as any);

    const enforcementContext = `
[MANT A ENFORCEMENT CONTEXT]
Current Gate: ${(state.currentGate as string).toUpperCase()}
Iteration: ${state.currentIteration}
Verify Attempts: ${state.verifyAttempts}/3

Blocking Criteria for ${state.currentGate}:
${criteria.blockingCriteria.map((c: string) => `  - ${c}`).join('\n')}

Evidence Required:
${criteria.evidenceRequired.map((e: string) => `  - ${e}`).join('\n')}
`.trim();

    const systemOutput = output as { system: string[]; agent?: string };
    if (Array.isArray(systemOutput.system)) {
      systemOutput.system.push(enforcementContext);

      // Inject brain context
      if (coordinator) {
        const currentBrain = coordinator.getCurrentBrain();
        const brainContext = `
[MANT A BRAIN CONTEXT]
Active Brain: ${currentBrain.toUpperCase()}
Brain switching is MECHANICAL — the Coordinator controls which brain is active.
Do NOT switch brains manually. Wait for Coordinator signals.
`.trim();
        systemOutput.system.push(brainContext);
      }
    }
  };
}
