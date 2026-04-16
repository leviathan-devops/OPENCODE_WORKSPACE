import { tool } from "./create-tool.js";
import { spawnSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, resolve, basename } from "path";

export const complexityHotspots = tool({
  description: "Get TypeScript compiler diagnostics and file statistics",
  args: {
    path: tool.schema.string().optional().describe("Path to analyze"),
    minComplexity: tool.schema.number().optional().default(10).describe("Minimum complexity threshold"),
  },
  execute: async (args, context) => {
    const target = args.path ?? "src";
    const result = spawnSync("npx", ["tsc", "--diagnostics"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    const output = result.stdout + result.stderr;
    if (result.status !== null && result.status === 0 && output) {
      return `Complexity analysis for ${target}:\n${output.substring(0, 1000)}`;
    }
    const grepResult = spawnSync("grep", ["-r", "-n", "-c", ";", target, "--include=*.ts"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    return `Complexity analysis:\n${grepResult.stdout || "No complex hotspots found."}`;
  },
});

export const detectDomains = tool({
  description: "Identify project domains/boundaries",
  args: {},
  execute: async (args, context) => {
    const srcPath = join(context.directory, "src");
    if (!existsSync(srcPath)) {
      return `No src/ directory found. Detected single-domain project.`;
    }
    try {
      if (!statSync(srcPath).isDirectory()) {
        return `No src/ directory found. Detected single-domain project.`;
      }
    } catch {
      return `No src/ directory found. Detected single-domain project.`;
    }
    const entries = readdirSync(srcPath);
    const domains = entries.filter(e => {
      try { return statSync(join(srcPath, e)).isDirectory(); } catch { return false; }
    });
    if (domains.length === 0) {
      return `No subdomains detected in src/.`;
    }
    const lines = domains.map(d => `- **${d}**`);
    return `## Detected Domains\n\n${lines.join("\n")}`;
  },
});

export const extractCodeBlocks = tool({
  description: "Parse code blocks from markdown or long outputs",
  args: {
    content: tool.schema.string().describe("Content to extract from"),
  },
  execute: async (args, context) => {
    if (typeof args.content !== "string") {
      return `Error: content must be a string.`;
    }
    const fenceOpen = "```";
    const blocks: string[] = [];
    let searchStart = 0;
    while (true) {
      const openIdx = args.content.indexOf(fenceOpen, searchStart);
      if (openIdx === -1) break;
      const lineEnd = args.content.indexOf("\n", openIdx);
      if (lineEnd === -1) break;
      const closeIdx = args.content.indexOf(fenceOpen, lineEnd + 1);
      if (closeIdx === -1) break;
      blocks.push(args.content.substring(lineEnd + 1, closeIdx).trim());
      searchStart = closeIdx + fenceOpen.length;
    }
    if (blocks.length === 0) {
      return `No code blocks found.`;
    }
    return `Extracted ${blocks.length} code block(s):\n${blocks.map((b, i) => `---\n// Block ${i + 1}\n${b}`).join("\n")}`;
  },
});

export const imports = tool({
  description: "Map import dependencies",
  args: {
    path: tool.schema.string().describe("File to analyze imports for"),
  },
  execute: async (args, context) => {
    try {
      const fullPath = join(context.directory, args.path);
      const resolved = resolve(fullPath);
      const allowedRoot = resolve(context.directory);
      if (!resolved.startsWith(allowedRoot)) {
        return `Error: Access denied. Path resolves outside project directory.`;
      }
      const content = readFileSync(resolved, "utf-8");
      if (typeof content !== "string") {
        return `Error: could not read file as string.`;
      }
      const lines = content.split("\n");
      const foundImports: string[] = [];
      for (const line of lines) {
        const importMatch = line.match(/^import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          foundImports.push(importMatch[1]);
        }
      }
      if (foundImports.length === 0) {
        return `No imports found in ${args.path}`;
      }
      return `## Imports for ${args.path}\n\n${foundImports.map(i => `- \`${i}\``).join("\n")}`;
    } catch {
      return `Could not read file: ${args.path}`;
    }
  },
});

export const symbols = tool({
  description: "Extract function/class symbols from file",
  args: {
    path: tool.schema.string().describe("File to extract symbols from"),
  },
  execute: async (args, context) => {
    const fullPath = join(context.directory, args.path);
    try {
      const content = readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      const symbols: { name: string; type: string; line: number }[] = [];
      lines.forEach((line, idx) => {
        const fnMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
        if (fnMatch) { symbols.push({ name: fnMatch[1], type: "function", line: idx + 1 }); return; }
        const clsMatch = line.match(/^(?:export\s+)?class\s+(\w+)/);
        if (clsMatch) { symbols.push({ name: clsMatch[1], type: "class", line: idx + 1 }); return; }
        const intMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
        if (intMatch) { symbols.push({ name: intMatch[1], type: "interface", line: idx + 1 }); return; }
        const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
        if (typeMatch) { symbols.push({ name: typeMatch[1], type: "type", line: idx + 1 }); return; }
      });
      if (symbols.length === 0) {
        return `No symbols found in ${args.path}`;
      }
      const rows = symbols.map(s => `| ${s.name} | ${s.type} | ${s.line} |`).join("\n");
      return `## Symbols in ${args.path}\n\n| Symbol | Type | Line |\n|--------|------|------|\n${rows}`;
    } catch {
      return `Could not read file: ${args.path}`;
    }
  },
});
