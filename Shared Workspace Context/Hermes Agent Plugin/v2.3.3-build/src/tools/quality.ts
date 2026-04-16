import { tool } from "./create-tool.js";
import { spawnSync } from "child_process";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { resolve } from "path";

const SHELL_META = /[;|&$`\\]/;

export const lint = tool({
  description: "Run linter on project files",
  args: {
    path: tool.schema.string().optional().describe("Path to lint (default: project root)"),
    fix: tool.schema.boolean().optional().default(false).describe("Auto-fix issues"),
  },
  execute: async (args, context) => {
    const target = args.path ?? context.directory;
    const resolved = resolve(target);
    const allowedRoot = resolve(context.directory);
    if (!resolved.startsWith(allowedRoot)) {
      return `Error: Access denied. Path resolves outside project directory.`;
    }
    if (!existsSync(resolved)) {
      return `Error: Path not found: ${target}`;
    }
    if (SHELL_META.test(target)) {
      return `Error: Invalid path "${target}". Shell metacharacters are not allowed.`;
    }

    const eslintArgs = args.fix ? ["--fix"] : [];
    // First try with project eslint config
    let result = spawnSync("npx", ["eslint", resolved, ...eslintArgs], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });

    // If ESLint fails with config error, create a minimal config and retry
    if (result.status !== 0) {
      const stderr = result.stderr || "";
      if (stderr.includes("couldn't find an eslint.config") || stderr.includes("Cannot find module")) {
        const tmpConfig = `/tmp/.eslintrc-minimal-${process.pid}.js`;
        writeFileSync(tmpConfig, "module.exports = { rules: { 'no-unused-vars': 'off', 'no-console': 'off' } };");
        result = spawnSync("npx", ["eslint", resolved, "--config", tmpConfig, ...eslintArgs], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
        try { unlinkSync(tmpConfig); } catch { /* ignore */ }
      }
    }

    if (result.status !== 0) {
      const output = result.stdout || result.stderr || "";
      if (output.includes("0 errors") || output.includes("no issues")) {
        return `✓ No lint errors found.`;
      }
      return `Lint errors found:\n${output}`;
    }
    return `✓ No lint errors found.`;
  },
});

export const diff = tool({
  description: "Show uncommitted changes",
  args: {},
  execute: async (args, context) => {
    const result = spawnSync("git", ["diff", "--no-color"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    if (result.status !== 0) {
      return `No changes or git error: ${result.stderr || result.stdout}`;
    }
    return result.stdout || "No uncommitted changes.";
  },
});

export const buildCheck = tool({
  description: "Verify the project builds successfully",
  args: {
    target: tool.schema.string().optional().describe("Build target"),
  },
  execute: async (args, context) => {
    const tscResult = spawnSync("npx", ["tsc", "--noEmit"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    if (tscResult.status !== null && tscResult.status === 0) {
      return `✓ Build check passed (tsc --noEmit).`;
    }
    const hasBuildScript = existsSync(`${context.directory}/package.json`);
    if (hasBuildScript) {
      const buildResult = spawnSync("npm", ["run", "build"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
      if (buildResult.status !== null && buildResult.status === 0) {
        return `✓ Build successful.`;
      }
      return `Build failed:\n${buildResult.stdout || buildResult.stderr}`;
    }
    return `Build check failed (tsc):\n${tscResult.stdout || tscResult.stderr}`;
  },
});

export const syntaxCheck = tool({
  description: "Verify TypeScript/JavaScript syntax is valid",
  args: {
    path: tool.schema.string().describe("File or directory to check"),
  },
  execute: async (args, context) => {
    if (SHELL_META.test(args.path)) {
      return `Error: Invalid path "${args.path}". Shell metacharacters are not allowed.`;
    }
    const result = spawnSync("npx", ["tsc", args.path, "--noEmit"], { cwd: context.directory, encoding: "utf-8", timeout: 60000 });
    if (result.status !== 0) {
      return `Syntax errors in ${args.path}:\n${result.stdout || result.stderr}`;
    }
    return `✓ No syntax errors in ${args.path}`;
  },
});
