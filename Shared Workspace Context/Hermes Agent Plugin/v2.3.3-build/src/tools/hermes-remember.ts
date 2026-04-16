import { tool } from "./create-tool.js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

export const hermesRemember = tool({
  description: "Store a decision, pattern, or learning to the 2nd-brain",
  args: {
    key: tool.schema.string().describe("Memory key/topic"),
    content: tool.schema.string().describe("Content to remember"),
    tags: tool.schema.array(tool.schema.string()).optional().describe("Tags for categorization"),
  },
  execute: async (args, context) => {
    const memoryDir = resolve(process.env.HOME ?? "~", ".hermes", "memory");
    if (!existsSync(memoryDir)) {
      mkdirSync(memoryDir, { recursive: true });
    }

    const safeKey = args.key.toLowerCase().replace(/\s+/g, "-");
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = join(memoryDir, `${timestamp}-${safeKey}.md`);

    const content = `# ${args.key}\n\n${args.content}\n\n${
      args.tags ? `Tags: ${args.tags.join(", ")}` : ""
    }\n`;
    writeFileSync(filename, content);

    return `Remembered: ${args.key}
Saved to: ${filename}`;
  },
});
