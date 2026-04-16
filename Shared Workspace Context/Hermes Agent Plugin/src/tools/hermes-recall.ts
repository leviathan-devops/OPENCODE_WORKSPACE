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
    const memoryDir = resolve(context.worktree, ".hermes", "memory");
    if (!existsSync(memoryDir)) {
      return `No memories found. Memory directory does not exist: ${memoryDir}`;
    }

    const files = readdirSync(memoryDir).filter((f) =>
      f.endsWith(".md")
    );
    if (files.length === 0) {
      return `No memories found.`;
    }

    const memories = files
      .map((f) => {
        const path = join(memoryDir, f);
        const content = readFileSync(path, "utf-8");
        return { file: f, content };
      })
      .filter((m) => m.content.toLowerCase().includes(args.query.toLowerCase()))
      .slice(0, args.limit ?? 5);

    if (memories.length === 0) {
      return `No memories found matching: ${args.query}`;
    }

    return `Found ${memories.length} memory(ies):
${memories.map((m) => `\n## ${m.file}\n${m.content}`).join("\n")}`;
  },
});
