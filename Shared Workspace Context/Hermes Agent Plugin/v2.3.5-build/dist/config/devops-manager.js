import { readFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
// Resolve from environment variable or default to ./context relative to this file
function getDevopsContextDir() {
    if (process.env.HERMES_DEVOPS_CONTEXT_DIR) {
        return resolve(process.env.HERMES_DEVOPS_CONTEXT_DIR);
    }
    // Default: <plugin-root>/context/devops-manager
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return resolve(__dirname, "../../context/devops-manager");
}
const DEVOPS_CONTEXT_DIR = getDevopsContextDir();
function readContextFile(filename) {
    const path = join(DEVOPS_CONTEXT_DIR, filename);
    if (!existsSync(path)) {
        // Fallback to workspace-relative path for backwards compatibility
        const workspacePath = resolve(process.env.HERMES_WORKSPACE_DIR ?? ".", "context/devops-manager", filename);
        if (existsSync(workspacePath)) {
            return readFileSync(workspacePath, "utf-8");
        }
        return `[Context file not found: ${filename}] (looked in: ${DEVOPS_CONTEXT_DIR})`;
    }
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
