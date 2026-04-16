import type { Hooks } from "@opencode-ai/plugin";
import { PHASES } from "../config/constants.js";
import { getCurrentPhase } from "./brainstorm-gate.js";

const DRIFT_CRITERIA: Record<string, string[]> = {
  analyze: ["requirements concrete", "design doc written"],
  plan: ["exact paths", "no placeholder"],
  build: ["tests written first", "all tests pass"],
  review: ["quality approved", "security approved"],
  debug: ["root cause identified", "fix verified"],
};

export function createDriftVerifierHook(): NonNullable<
  Hooks["tool.execute.after"]
> {
  return async (input, output) => {
    const { tool } = input;
    const currentPhase = getCurrentPhase();

    if (tool === "phase_complete") {
      const criteria = DRIFT_CRITERIA[currentPhase] || [];
      const output_lower = output.output.toLowerCase();

      const missingCriteria = criteria.filter(
        (c) => !output_lower.includes(c.toLowerCase())
      );

      if (missingCriteria.length > 0) {
        output.output = `${output.output}\n\n[DRIFT VERIFIER] Warning: Phase completion may be incomplete. Missing criteria: ${missingCriteria.join(", ")}`;
      }
    }
  };
}
