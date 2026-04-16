import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const DEVOPS_CONTEXT_DIR = resolve("/home/leviathan/hermes-workspace/context/devops-manager");

function readContextFile(filename: string): string {
  const path = join(DEVOPS_CONTEXT_DIR, filename);
  if (!existsSync(path)) return `[Context file not found: ${filename}]`;
  return readFileSync(path, "utf-8");
}

export const DEVOPS_MANAGER_PROMPT = readContextFile("MENTAL_MODEL.md");
export const DEVOPS_INDEX = readContextFile("INDEX.md");
export const DEVOPS_AUDIT_FRAMEWORK = readContextFile("AUDIT_FRAMEWORK.md");
export const DEVOPS_PATTERNS = readContextFile("PATTERNS.md");
export const DEVOPS_VERIFICATION = readContextFile("VERIFICATION.md");
export const DEVOPS_ESCALATION = readContextFile("ESCALATION.md");
export const DEVOPS_PLUGIN_REF = readContextFile("HERMES_AGENT_PLUGIN.md");
export const DEVOPS_README = readContextFile("README.md");
