import type { Hooks } from "@opencode-ai/plugin";
import { isHermesAgent } from "../config/agent-identity.js";
import { PHASE_TRANSITIONS } from "../config/constants.js";
import { getCurrentPhase, setCurrentPhase } from "./brainstorm-gate.js";

export function createPhaseMonitorHook(): NonNullable<
  Hooks["tool.execute.after"]
> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;
    const { tool } = input;
    const toolOutput = output.output;

    if (tool === "phase_complete" || tool === "checkpoint") {
      const newPhase = parsePhaseFromOutput(toolOutput);
      const currentPhase = getCurrentPhase();

      if (newPhase && canTransition(currentPhase, newPhase)) {
        setCurrentPhase(newPhase);
        console.log(`[PHASE] ${currentPhase} → ${newPhase}`);
      } else if (newPhase && !canTransition(currentPhase, newPhase)) {
        output.title = "BLOCKED: Invalid phase transition";
        output.output = `[PHASE MONITOR] Cannot transition from ${currentPhase} → ${newPhase}.

Valid transitions from ${currentPhase}:
${(PHASE_TRANSITIONS[currentPhase] || []).join(", ") || "none"}

Current phase remains: ${currentPhase}`;
      }
    }
  };
}

function canTransition(from: string, to: string): boolean {
  const validTargets = PHASE_TRANSITIONS[from] || [];
  return validTargets.includes(to);
}

function parsePhaseFromOutput(output: string): string | null {
  const match = output.match(/phase[:\s]+(\w+)/i);
  return match ? match[1].toLowerCase() : null;
}
