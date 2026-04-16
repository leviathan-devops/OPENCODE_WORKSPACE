import { PHASES } from "../config/constants.js";
import { getCurrentPhase } from "./brainstorm-gate.js";
import { existsSync } from "fs";
export function createTddEnforcerHook() {
    return async (input, output) => {
        const { tool } = input;
        if (getCurrentPhase() !== PHASES.BUILD)
            return;
        if (tool === "write_file" || tool === "edit_file" || tool === "patch") {
            const args = output.args;
            const filePath = args?.path ?? "";
            const isTestFile = filePath.includes(".test.") ||
                filePath.includes(".spec.") ||
                filePath.includes("/test/") ||
                filePath.includes("/tests/");
            const isSrcFile = !isTestFile &&
                (filePath.includes("/src/") ||
                    filePath.endsWith(".ts") ||
                    filePath.endsWith(".js"));
            if (isSrcFile) {
                const testFile = findTestFile(filePath);
                if (!testFileExists(testFile)) {
                    output.args = {
                        ...args,
                        _tdd_violation: {
                            file: filePath,
                            requiresTest: testFile,
                            message: `[TDD IRON LAW] You cannot modify ${filePath} without creating ${testFile} first.

Remember: RED (failing test) → GREEN (minimal code) → REFACTOR.

Please create the test file first.`,
                        },
                    };
                }
            }
        }
    };
}
function findTestFile(srcPath) {
    return srcPath
        .replace("/src/", "/tests/")
        .replace(/\.ts$/, ".test.ts")
        .replace(/\.js$/, ".test.js");
}
function testFileExists(path) {
    return existsSync(path);
}
