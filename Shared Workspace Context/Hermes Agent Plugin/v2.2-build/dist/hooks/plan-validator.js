import { PLACEHOLDER_PATTERNS, PHASES } from "../config/constants.js";
import { getCurrentPhase } from "./brainstorm-gate.js";
export function createPlanValidatorHook() {
    return async (input, output) => {
        const messages = output?.messages;
        if (!messages || messages.length === 0)
            return;
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage?.parts)
            return;
        const parts = lastMessage.parts;
        const content = JSON.stringify(parts);
        const currentPhase = getCurrentPhase();
        if (currentPhase !== PHASES.PLAN)
            return;
        for (const pattern of PLACEHOLDER_PATTERNS) {
            if (pattern.test(content)) {
                const textPartIndex = parts.findIndex((p) => p?.type === "text" && p.text !== undefined);
                if (textPartIndex !== -1) {
                    const originalText = parts[textPartIndex].text ?? "";
                    parts[textPartIndex].text = `${originalText}\n\n[PLAN VALIDATOR BLOCKED] Your plan contains "${pattern.source}" — this is not allowed.

Every step MUST have:
- Exact file paths
- Actual code (not stubs)
- Exact test commands with expected output
- Concrete acceptance criteria

Please revise the plan with specific, actionable items.`;
                }
                return;
            }
        }
    };
}
