import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";
import { isHermesAgent } from "../config/agent-identity.js";
export function createKnowledgeInjectorHook() {
    return async (input, output) => {
        if (!isHermesAgent(input.agent))
            return;
        const messages = output?.messages;
        if (!messages || messages.length === 0)
            return;
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage?.parts)
            return;
        const parts = lastMessage.parts;
        const textPartIndex = parts.findIndex((p) => p?.type === "text" && p.text !== undefined);
        if (textPartIndex === -1)
            return;
        const originalText = parts[textPartIndex].text ?? "";
        const memoryDir = resolve(process.env.HOME ?? "~", ".hermes", "memory");
        if (!existsSync(memoryDir))
            return;
        const files = readdirSync(memoryDir).filter((f) => f.endsWith(".md"));
        const relevantMemories = files
            .map((f) => {
            const path = join(memoryDir, f);
            const content = readFileSync(path, "utf-8");
            return { file: f, content };
        })
            .slice(0, 3);
        if (relevantMemories.length === 0)
            return;
        const memorySummary = relevantMemories
            .map((m) => `## ${m.file}\n${m.content}`)
            .join("\n\n");
        parts[textPartIndex].text = `${originalText}\n\n[2ND-BRAIN CONTEXT]\n${memorySummary}`;
    };
}
