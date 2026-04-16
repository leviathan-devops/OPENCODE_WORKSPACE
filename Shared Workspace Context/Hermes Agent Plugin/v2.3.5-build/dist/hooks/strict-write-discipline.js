import { PHASES } from "../config/constants.js";
import { getCurrentPhase } from "./brainstorm-gate.js";
import { existsSync, readFileSync } from "fs";
import { isHermesAgent } from "../config/agent-identity.js";
export function createStrictWriteDisciplineHook() {
    return async (input, output) => {
        if (!isHermesAgent(input.agent))
            return;
        const { tool } = input;
        if (getCurrentPhase() !== PHASES.BUILD)
            return;
        if (tool === "write_file" || tool === "edit_file" || tool === "patch") {
            const argsObj = output.args;
            const filePath = argsObj?.path ?? "";
            if (!filePath)
                return;
            if (existsSync(filePath)) {
                const content = readFileSync(filePath, "utf-8");
                const cachedUnderstanding = argsObj?._cached_content;
                if (cachedUnderstanding && cachedUnderstanding !== content) {
                    output.args = {
                        ...argsObj,
                        _write_warning: {
                            file: filePath,
                            message: `[STRICT WRITE DISCIPLINE] The file ${filePath} has changed since your last read.

Your cached understanding may be stale. Please re-read the file before writing.

Current file content hash does not match your cached version.`,
                        },
                    };
                }
            }
        }
    };
}
