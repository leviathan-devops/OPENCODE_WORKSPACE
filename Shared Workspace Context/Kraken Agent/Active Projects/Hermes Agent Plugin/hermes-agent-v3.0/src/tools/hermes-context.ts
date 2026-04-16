import { tool } from "./create-tool.js";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

export const hermesContext = tool({
  description: "Inject relevant 2nd-brain context into current session",
  args: {
    topic: tool.schema.string().describe("Topic to get context for"),
  },
  execute: async (args, context) => {
    const memoryDir = resolve(process.env.HOME ?? "~", ".hermes", "memory");
    if (!existsSync(memoryDir)) {
      return `No context available. Memory directory does not exist.`;
    }

    const files = readdirSync(memoryDir).filter((f) =>
      f.endsWith(".md")
    );
    if (files.length === 0) {
      return `No context available.`;
    }

    const maxFiles = Math.min(files.length, 100);
    const relevantMemories: { file: string; content: string }[] = [];

    for (let i = 0; i < maxFiles && relevantMemories.length < 15; i++) {
      const path = join(memoryDir, files[i]);
      const content = readFileSync(path, "utf-8");
      if (content.toLowerCase().includes(args.topic.toLowerCase())) {
        relevantMemories.push({ file: files[i], content });
      }
    }

    if (relevantMemories.length === 0) {
      return `No context found for: ${args.topic}`;
    }

    return `## Relevant Context for "${args.topic}"\n\n${relevantMemories
      .map((m) => m.content)
      .join("\n\n---\n\n")}`;
  },
});
