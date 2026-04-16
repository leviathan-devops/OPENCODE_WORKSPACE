import type { Hooks } from "@opencode-ai/plugin";
import { isHermesAgent } from "../config/agent-identity.js";

export function createComplexityRoutingHook(): NonNullable<Hooks["chat.params"]> {
  return async (input, output) => {
    if (!isHermesAgent(input.agent)) return;
    const { agent } = input;

    if (agent === "hermes") {
      output.temperature = 0.5;
    } else {
      output.temperature = 0.3;
    }
  };
}
