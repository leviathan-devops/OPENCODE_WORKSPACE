import { existsSync } from "fs";
import { resolve } from "path";
const FRAMEWORK_PACKS = {
    "next.config": "Next.js",
    "nuxt.config": "Nuxt",
    "package.json": detectFrameworkPackage(),
    "tsconfig.json": "TypeScript project",
};
function detectFrameworkPackage() {
    return "Unknown";
}
export function createFrameworkPackHook() {
    return async (input, output) => {
        const { directory } = input;
        const detectedFrameworks = [];
        for (const [file, framework] of Object.entries(FRAMEWORK_PACKS)) {
            if (existsSync(resolve(directory, file))) {
                detectedFrameworks.push(framework);
            }
        }
        if (detectedFrameworks.length > 0) {
            output.system.push(`\n[FRAMEWORK DETECTED] ${detectedFrameworks.join(", ")}`);
        }
    };
}
