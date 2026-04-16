import { tool } from "./create-tool.js";
import { PHASE_TRANSITIONS, PHASE_ORDER } from "../config/constants.js";
import { getCurrentPhase, setCurrentPhase } from "../hooks/brainstorm-gate.js";
export const phaseComplete = tool({
    description: "Mark current phase complete and advance state machine",
    args: {
        phase: tool.schema.enum(["analyze", "plan", "build", "review", "debug", "complete"]).describe("Phase to complete"),
        evidence: tool.schema.string().describe("Proof that phase requirements are met"),
    },
    execute: async (args, context) => {
        const currentPhase = getCurrentPhase();
        const validTargets = PHASE_TRANSITIONS[currentPhase] || [];
        if (!validTargets.includes(args.phase)) {
            return `[BLOCKED] Cannot complete phase "${args.phase}" from "${currentPhase}".
Valid next phase: ${validTargets.join(", ") || "none"}`;
        }
        const idx = PHASE_ORDER.indexOf(currentPhase);
        const nextPhase = PHASE_ORDER[Math.min(idx + 1, PHASE_ORDER.length - 1)];
        setCurrentPhase(nextPhase);
        return `Phase "${args.phase}" complete.
Evidence: ${args.evidence}
Now in phase: ${nextPhase}`;
    },
});
