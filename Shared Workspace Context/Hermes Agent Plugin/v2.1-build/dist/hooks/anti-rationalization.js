import { getCurrentPhase } from "./brainstorm-gate.js";
const COMPLETION_CLAIMS = [
    /looks?\s+good/i,
    /seems?\s+correct/i,
    /should\s+work/i,
    /I\s+believe/i,
    /probably\s+fine/i,
    /that's\s+all/i,
    /done/i,
    /finished/i,
    /complete/i,
];
export function createAntiRationalizationHook() {
    return async (input, output) => {
        const phase = getCurrentPhase();
        const messages = output?.messages;
        if (!messages || messages.length === 0)
            return;
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage?.parts)
            return;
        const parts = lastMessage.parts;
        const content = JSON.stringify(parts);
        const hasCompletionClaim = COMPLETION_CLAIMS.some((p) => p.test(content));
        if (hasCompletionClaim) {
            const textPartIndex = parts.findIndex((p) => p?.type === "text" && p.text !== undefined);
            if (textPartIndex !== -1) {
                const originalText = parts[textPartIndex].text ?? "";
                parts[textPartIndex].text = `${originalText}\n\n[ANTI-RATIONALIZATION] You claimed completion without showing verification. You MUST show:
1. Actual command output
2. Actual test results
3. Specific file changes

Unspecific claims like "looks good" are not acceptable.`;
            }
        }
    };
}
