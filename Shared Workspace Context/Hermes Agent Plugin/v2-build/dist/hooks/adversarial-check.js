import { getCurrentPhase } from "./brainstorm-gate.js";
const ADVERSARIAL_PATTERNS = [
    /we\s+skipped\s+in\s+phase/i,
    /I\s+verified\s+it\s+myself/i,
    /documentation\s+doesn't\s+need\s+review/i,
    /I'll\s+just\s+make\s+this\s+small\s+fix/i,
    /tier\s+0\s+security/i,
    /to\s+save\s+time/i,
    /5th\s+attempt/i,
    /user\s+is\s+waiting/i,
    /or\s+I\s+stop/i,
];
export function createAdversarialCheckHook() {
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
        for (const pattern of ADVERSARIAL_PATTERNS) {
            if (pattern.test(content)) {
                const textPartIndex = parts.findIndex((p) => p?.type === "text" && p.text !== undefined);
                if (textPartIndex !== -1) {
                    const originalText = parts[textPartIndex].text ?? "";
                    parts[textPartIndex].text = `${originalText}\n\n[ADVERSARIAL CHECK] Detected rationalization pattern: "${pattern.source}". This type of reasoning is not acceptable. Please provide actual evidence.`;
                }
                return;
            }
        }
    };
}
