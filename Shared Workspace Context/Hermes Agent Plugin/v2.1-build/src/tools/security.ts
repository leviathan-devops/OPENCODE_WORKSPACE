import { tool } from "./create-tool.js";
import { spawnSync } from "child_process";

export const testRunner = tool({
  description: "Execute test suite and parse results",
  args: {
    pattern: tool.schema.string().optional().describe("Test pattern to match"),
    verbose: tool.schema.boolean().optional().default(false).describe("Verbose output"),
  },
  execute: async (args, context) => {
    const result = spawnSync("npm", ["test"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    const output = result.stdout + result.stderr;
    if (result.status !== null && result.status === 0) {
      return `✓ All tests passed.\n${args.verbose ? output : ""}`;
    }
    return `Tests failed:\n${output}`;
  },
});

export const placeholderScan = tool({
  description: "Find TBD/TODO/placeholder patterns in code",
  args: {
    path: tool.schema.string().optional().describe("Path to scan"),
  },
  execute: async (args, context) => {
    const target = args.path ?? ".";
    const result = spawnSync("grep", ["-r", "-n", "-E", "TBD|TODO|FIXME|PLACEHOLDER", target, "--include=*.ts", "--include=*.js", "--include=*.tsx", "--include=*.jsx"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    if (result.stdout && result.stdout.trim()) {
      const lines = result.stdout.trim().split("\n").slice(0, 50);
      return `Placeholders found:\n${lines.join("\n")}`;
    }
    return `✓ No placeholders found.`;
  },
});

export const sastScan = tool({
  description: "Static analysis security scan",
  args: {
    path: tool.schema.string().optional().describe("Path to scan"),
  },
  execute: async (args, context) => {
    const target = args.path ?? ".";
    const semgrepResult = spawnSync("npx", ["semgrep", "--config=auto", target], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    const semgrepOutput = semgrepResult.stdout + semgrepResult.stderr;
    // Semgrep: exit 0 = no findings, exit 1 = findings found, exit 2+ = error
    if ((semgrepResult.status === 0 || semgrepResult.status === 1) && semgrepOutput.length > 0) {
      if (!semgrepOutput.includes("Couldn't find") && !semgrepOutput.includes("command not found")) {
        return `SAST scan results:\n${semgrepOutput}`;
      }
    }
    const auditResult = spawnSync("npm", ["audit", "--audit-level=high"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    const output = auditResult.stdout + auditResult.stderr;
    if (output.includes("found 0 vulnerabilities")) {
      return `✓ No security vulnerabilities found.`;
    }
    return `SAST/Audit results:\n${output}`;
  },
});

export const secretScan = tool({
  description: "Detect secrets/credentials in code",
  args: {
    path: tool.schema.string().optional().describe("Path to scan"),
  },
  execute: async (args, context) => {
    const target = args.path ?? ".";
    const result = spawnSync("grep", [
      "-r", "-n", "-i", "-E",
      "(api[_-]?key|secret[ly]?|password|token|credential|private[_-]?key|access[_-]?key)",
      target,
      "--include=*.ts", "--include=*.js", "--include=*.json",
      "--include=*.env*", "--include=*.yaml", "--include=*.yml"
    ], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    if (result.stdout && result.stdout.trim()) {
      const lines = result.stdout.trim().split("\n").slice(0, 30);
      const redacted = lines.map(line => {
        const colonIdx = line.indexOf(":");
        if (colonIdx !== -1) {
          const pathPart = line.substring(0, colonIdx + 1);
          return `${pathPart} [REDACTED - potential secret detected]`;
        }
        return line;
      });
      return `Potential secrets found (verify manually):\n${redacted.join("\n")}`;
    }
    return `✓ No obvious secrets detected.`;
  },
});
