import { tool } from "./create-tool.js";
import { PHASE_TRANSITIONS } from "../config/constants.js";
import { getCurrentPhase, setCurrentPhase } from "../hooks/brainstorm-gate.js";
export const phaseComplete = tool({
    description: "Mark current phase complete and advance state machine",
    args: {
        phase: tool.schema.enum(["analyze", "plan", "build", "review", "debug", "complete"]).describe("Phase to complete"),
        evidence: tool.schema.string().describe("Proof that phase requirements are met"),
    },
    execute: async (args, context) => {
        const currentPhase = getCurrentPhase();
        // args.phase is the phase the user wants to complete
        // Validate: args.phase must be the CURRENT phase
        if (args.phase !== currentPhase) {
            return `[BLOCKED] Cannot complete phase "${args.phase}". Current phase is "${currentPhase}".
You must complete phases in order.`;
        }
        const validTargets = PHASE_TRANSITIONS[currentPhase] || [];
        if (validTargets.length === 0) {
            return `Phase "${args.phase}" is already complete. No further phases.`;
        }
        // Find the NEXT phase (first valid transition target)
        const nextPhase = validTargets[0];
        setCurrentPhase(nextPhase);
        return `Phase "${args.phase}" complete.
Evidence: ${args.evidence}
Now in phase: ${nextPhase}`;
    },
});
