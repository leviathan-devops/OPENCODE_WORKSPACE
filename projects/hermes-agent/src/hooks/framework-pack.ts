import type { Hooks } from "@opencode-ai/plugin";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { isHermesAgent } from "../config/agent-identity.js";

const FRAMEWORK_PACKS: Record<string, string> = {
  "next.config": "Next.js",
  "nuxt.config": "Nuxt",
  "package.json": detectFrameworkPackage(),
  "tsconfig.json": "TypeScript project",
};

function detectFrameworkPackage(): string {
  return "Unknown";
}

export function createFrameworkPackHook(): NonNullable<
  Hooks["experimental.chat.system.transform"]
> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;

    const { directory } = input as any;

    const detectedFrameworks: string[] = [];

    for (const [file, framework] of Object.entries(FRAMEWORK_PACKS)) {
      if (existsSync(resolve(directory, file))) {
        detectedFrameworks.push(framework);
      }
    }

    if (detectedFrameworks.length > 0) {
      const msg = `\n[FRAMEWORK DETECTED] ${detectedFrameworks.join(", ")}`;
      if (Array.isArray(output.system)) {
        output.system.push(msg);
      }
    }
  };
}
