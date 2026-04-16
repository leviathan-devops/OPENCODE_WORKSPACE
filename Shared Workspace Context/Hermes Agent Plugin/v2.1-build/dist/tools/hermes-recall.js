import { tool } from "./create-tool.js";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
export const hermesRecall = tool({
    description: "Query the 2nd-brain knowledge store",
    args: {
        query: tool.schema.string().describe("Query to search memories"),
        limit: tool.schema.number().optional().default(5).describe("Max results to return"),
    },
    execute: async (args, context) => {
        const memoryDir = resolve(process.env.HOME ?? "~", ".hermes", "memory");
        if (!existsSync(memoryDir)) {
            return `No memories found. Memory directory does not exist: ${memoryDir}`;
        }
        const files = readdirSync(memoryDir).filter((f) => f.endsWith(".md"));
        if (files.length === 0) {
            return `No memories found.`;
        }
        const maxFiles = Math.min(files.length, 100);
        const resultLimit = args.limit ?? 5;
        const memories = [];
        for (let i = 0; i < maxFiles && memories.length < resultLimit * 3; i++) {
            const path = join(memoryDir, files[i]);
            const content = readFileSync(path, "utf-8");
            if (content.toLowerCase().includes(args.query.toLowerCase())) {
                memories.push({ file: files[i], content });
            }
        }
        const trimmed = memories.slice(0, resultLimit);
        if (trimmed.length === 0) {
            return `No memories found matching: ${args.query}`;
        }
        return `Found ${trimmed.length} memory(ies):
${trimmed.map((m) => `\n## ${m.file}\n${m.content}`).join("\n")}`;
    },
});
