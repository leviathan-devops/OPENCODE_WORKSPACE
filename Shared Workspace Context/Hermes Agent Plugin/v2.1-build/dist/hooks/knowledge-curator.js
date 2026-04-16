import { existsSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
const LEARNINGS_PATH = resolve(process.env.HOME ?? "~", ".hermes", "learnings.md");
export function createKnowledgeCuratorHook() {
    return async (input, output) => {
        const { tool } = input;
        if (tool === "phase_complete" || tool === "checkpoint") {
            const summary = `## ${new Date().toISOString()}\nTool: ${tool}\nResult: ${output.output.substring(0, 200)}\n\n`;
            const dir = resolve(process.env.HOME ?? "~", ".hermes");
            if (!existsSync(dir)) {
                return;
            }
            const learnings = existsSync(LEARNINGS_PATH)
                ? readFileSync(LEARNINGS_PATH, "utf-8")
                : "# Learning Log\n\n";
            writeFileSync(LEARNINGS_PATH, learnings + summary);
        }
    };
}
