import { tool } from "./create-tool.js";
import { spawnSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
export const complexityHotspots = tool({
    description: "Get TypeScript compiler diagnostics and file statistics",
    args: {
        path: tool.schema.string().optional().describe("Path to analyze"),
        minComplexity: tool.schema.number().optional().default(10).describe("Minimum complexity threshold"),
    },
    execute: async (args, context) => {
        const rawTarget = args.path ?? "src";
        const targetPath = join(context.directory, rawTarget);
        const resolvedTarget = resolve(targetPath);
        const allowedRoot = resolve(context.directory);
        if (!resolvedTarget.startsWith(allowedRoot)) {
            return `Error: Access denied. Path resolves outside project directory.`;
        }
        // Try tsc --diagnostics first (works on TypeScript projects)
        try {
            const tscResult = spawnSync("npx", ["tsc", "--diagnostics"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
            const tscOutput = tscResult.stdout + tscResult.stderr;
            if (tscResult.status === 0 && tscOutput.includes("files") && tscOutput.includes("lines")) {
                return `Complexity analysis for ${rawTarget}:\n${tscOutput.substring(0, 1500)}`;
            }
        }
        catch { /* tsc not available or failed */ }
        // Fallback: detect O(n²) algorithmic patterns manually
        const patterns = [
            { pattern: /\bfor\s*\([^)]*\)[^}]*for\s*\(/, name: "nested loop (possible O(n²))", severity: "MEDIUM" },
            { pattern: /\.filter\([^)]*\)\.filter\(/, name: "chained filters (O(n²) memory)", severity: "HIGH" },
            { pattern: /\.map\([^)]*\)\.map\(/, name: "chained maps", severity: "LOW" },
            { pattern: /for\s*\([^)]*\)[^}]*\.forEach\(/, name: "nested iteration", severity: "MEDIUM" },
            { pattern: /while\([^)]*\)[^}]*while\(/, name: "nested while loops", severity: "HIGH" },
            { pattern: /reduce\([^)]*\.reduce\(/, name: "nested reduce", severity: "HIGH" },
            { pattern: /sort\(\).*sort\(/, name: "double sort", severity: "HIGH" },
            { pattern: /O\(n\^2\)|O\(n\s*\*\s*n\)|quadratic/i, name: "explicit quadratic comment", severity: "INFO" },
        ];
        const hotspots = [];
        const scanDir = (dir) => {
            try {
                const entries = readdirSync(dir);
                for (const entry of entries) {
                    if (entry === "node_modules" || entry === ".git" || entry === "dist")
                        continue;
                    const entryPath = join(dir, entry);
                    try {
                        const entryStat = statSync(entryPath);
                        if (entryStat.isDirectory()) {
                            scanDir(entryPath);
                        }
                        else if (entryStat.isFile() && /\.(ts|js|tsx|jsx|py|java|c|cpp)$/.test(entry)) {
                            const content = readFileSync(entryPath, "utf-8");
                            for (const { pattern, name, severity } of patterns) {
                                if (pattern.test(content)) {
                                    hotspots.push(`- **${severity}**: ${name} in \`${entryPath.replace(context.directory + "/", "")}\``);
                                }
                            }
                        }
                    }
                    catch { /* skip */ }
                }
            }
            catch { /* skip */ }
        };
        scanDir(resolvedTarget);
        if (hotspots.length === 0) {
            return `Complexity analysis:\n✓ No complex hotspots found.`;
        }
        return `Complexity analysis:\n### Potential Complexity Issues\n${hotspots.slice(0, 20).join("\n")}`;
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
        }
        catch {
            return `No src/ directory found. Detected single-domain project.`;
        }
        const entries = readdirSync(srcPath);
        const domains = entries.filter(e => {
            try {
                return statSync(join(srcPath, e)).isDirectory();
            }
            catch {
                return false;
            }
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
        const blocks = [];
        let searchStart = 0;
        while (true) {
            const openIdx = args.content.indexOf(fenceOpen, searchStart);
            if (openIdx === -1)
                break;
            const lineEnd = args.content.indexOf("\n", openIdx);
            if (lineEnd === -1)
                break;
            const closeIdx = args.content.indexOf(fenceOpen, lineEnd + 1);
            if (closeIdx === -1)
                break;
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
            const foundImports = [];
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
        }
        catch {
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
        const resolved = resolve(fullPath);
        const allowedRoot = resolve(context.directory);
        if (!resolved.startsWith(allowedRoot)) {
            return `Error: Access denied. Path resolves outside project directory.`;
        }
        try {
            const content = readFileSync(resolved, "utf-8");
            const lines = content.split("\n");
            const symbols = [];
            const ext = args.path.split(".").pop()?.toLowerCase();
            if (ext === "py") {
                // Python patterns
                lines.forEach((line, idx) => {
                    const trimmed = line.trim();
                    const defMatch = trimmed.match(/^(?:async\s+)?def\s+(\w+)/);
                    if (defMatch) {
                        symbols.push({ name: defMatch[1], type: "function", line: idx + 1 });
                        return;
                    }
                    const clsMatch = trimmed.match(/^class\s+(\w+)/);
                    if (clsMatch) {
                        symbols.push({ name: clsMatch[1], type: "class", line: idx + 1 });
                        return;
                    }
                    const typeMatch = trimmed.match(/^[A-Z]\w*\s*=\s*(?:Type|Union|Optional|Literal)/);
                    if (typeMatch) {
                        symbols.push({ name: typeMatch[0].split("=")[0].trim(), type: "type_alias", line: idx + 1 });
                        return;
                    }
                    const constMatch = trimmed.match(/^(\w+)\s*:\s*\w+\s*=/);
                    if (constMatch) {
                        symbols.push({ name: constMatch[1], type: "constant", line: idx + 1 });
                        return;
                    }
                });
            }
            else {
                // JavaScript/TypeScript patterns
                lines.forEach((line, idx) => {
                    const fnMatch = line.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
                    if (fnMatch) {
                        symbols.push({ name: fnMatch[1], type: "function", line: idx + 1 });
                        return;
                    }
                    const clsMatch = line.match(/^(?:export\s+)?class\s+(\w+)/);
                    if (clsMatch) {
                        symbols.push({ name: clsMatch[1], type: "class", line: idx + 1 });
                        return;
                    }
                    const intMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
                    if (intMatch) {
                        symbols.push({ name: intMatch[1], type: "interface", line: idx + 1 });
                        return;
                    }
                    const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)/);
                    if (typeMatch) {
                        symbols.push({ name: typeMatch[1], type: "type", line: idx + 1 });
                        return;
                    }
                    const arrowMatch = line.match(/^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/);
                    if (arrowMatch) {
                        symbols.push({ name: arrowMatch[1], type: "arrow_function", line: idx + 1 });
                        return;
                    }
                    const enumMatch = line.match(/^(?:export\s+)?enum\s+(\w+)/);
                    if (enumMatch) {
                        symbols.push({ name: enumMatch[1], type: "enum", line: idx + 1 });
                        return;
                    }
                });
            }
            if (symbols.length === 0) {
                return `No symbols found in ${args.path}`;
            }
            const rows = symbols.map(s => `| ${s.name} | ${s.type} | ${s.line} |`).join("\n");
            return `## Symbols in ${args.path}\n\n| Symbol | Type | Line |\n|--------|------|------|\n${rows}`;
        }
        catch {
            return `Could not read file: ${args.path}`;
        }
    },
});
