import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
const HERMES_MD_PATH = resolve(process.env.HOME ?? "~", ".hermes", "HERMES.md");
export function createSystemEnhancerHook() {
    let hermesMdContent = "";
    try {
        if (existsSync(HERMES_MD_PATH)) {
            hermesMdContent = readFileSync(HERMES_MD_PATH, "utf-8");
        }
        else {
            hermesMdContent = "# HERMES.md not found — using defaults";
        }
    }
    catch {
        hermesMdContent = "# HERMES.md not found — using defaults";
    }
    return async (input, output) => {
        const modelId = input.model?.id ?? "unknown";
        const providerId = input.model?.providerID ?? "unknown";
        output.system = [
            hermesMdContent,
            `\n## Current Phase Context`,
            `Model: ${modelId}`,
            `Provider: ${providerId}`,
            `Agent Mode: standard`,
            `\n## Phase Enforcement`,
            `Current phase: idle`,
            `Allowed transitions: idle → analyze`,
            `\n## Anti-Rationalization Reminder`,
            `Every agent MUST verify cached context against actual files before acting.`,
            `Every completion claim MUST show actual command output.`,
        ];
    };
}
