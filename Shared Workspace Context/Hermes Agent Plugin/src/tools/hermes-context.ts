import { tool } from "./create-tool.js";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

export const hermesContext = tool({
  description: "Inject relevant 2nd-brain context into current session",
  args: {
    topic: tool.schema.string().describe("Topic to get context for"),
  },
  execute: async (args, context) => {
    const memoryDir = resolve(context.worktree, ".hermes", "memory");
    if (!existsSync(memoryDir)) {
      return `No context available. Memory directory does not exist.`;
    }

    const files = readdirSync(memoryDir).filter((f) =>
      f.endsWith(".md")
    );
    if (files.length === 0) {
      return `No context available.`;
    }

    const relevantMemories = files
      .map((f) => {
        const path = join(memoryDir, f);
        const content = readFileSync(path, "utf-8");
        return { file: f, content };
      })
      .filter((m) =>
        m.content.toLowerCase().includes(args.topic.toLowerCase())
      );

    if (relevantMemories.length === 0) {
      return `No context found for: ${args.topic}`;
    }

    return `## Relevant Context for "${args.topic}"\n\n${relevantMemories
      .map((m) => m.content)
      .join("\n\n---\n\n")}`;
  },
});
