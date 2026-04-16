import type { Hooks } from "@opencode-ai/plugin";
import { executeHermesCommand } from "../config/hermes-commands.js";

export function createHermesCommandHook(): NonNullable<Hooks["command.execute.before"]> {
  return async (input, output) => {
    // Only handle /Hermes commands
    const command = input.command?.toLowerCase();
    if (command !== "hermes") return;

    // Check if it's a Hermes subcommand
    const fullInput = `/hermes ${input.arguments}`;
    const result = await executeHermesCommand(fullInput);

    // Inject the result as a text part
    output.parts = output.parts || [];
    output.parts.push({
      type: "text",
      text: result,
    });
  };
}
