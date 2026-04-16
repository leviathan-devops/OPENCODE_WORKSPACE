const GATE_BYPASS_PATTERNS = [
    /skipping\s+(review|test|phase)/i,
    /I'll\s+handle\s+it\s+myself/i,
    /don't\s+need\s+to\s+verify/i,
    /it's\s+just\s+a\s+small\s+change/i,
    /we\s+can\s+skip\s+this\s+step/i,
    /trust\s+me/i,
];
export function createAdversarialDetectorHook() {
    return async (input, output) => {
        const messages = output?.messages;
        if (!messages || messages.length === 0)
            return;
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage?.parts)
            return;
        const parts = lastMessage.parts;
        const content = JSON.stringify(parts);
        for (const pattern of GATE_BYPASS_PATTERNS) {
            if (pattern.test(content)) {
                const textPartIndex = parts.findIndex((p) => p?.type === "text" && p.text !== undefined);
                if (textPartIndex !== -1) {
                    const originalText = parts[textPartIndex].text ?? "";
                    parts[textPartIndex].text = `${originalText}\n\n[GATE BYPASS DETECTED] Pattern "${pattern.source}" suggests attempting to skip required verification. This is not allowed. Please follow the proper workflow.`;
                }
                return;
            }
        }
    };
}
