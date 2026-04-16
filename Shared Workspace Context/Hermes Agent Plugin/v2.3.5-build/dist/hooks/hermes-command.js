import { executeHermesCommand, parseHermesCommand } from "../config/hermes-commands.js";
export function createHermesCommandHook() {
    return async (input, output) => {
        // Check: is this a Hermes command?
        // OpenCode passes command="Hermes" (the template key) or full input
        const cmd = input.command?.toLowerCase() ?? "";
        const args = input.arguments ?? "";
        // Match both "Hermes" (template key) and "/Hermes" (user input)
        if (cmd !== "hermes" && !args.toLowerCase().startsWith("/hermes")) {
            return;
        }
        // Parse the actual subcommand from arguments
        const fullInput = args.startsWith("/") ? args : `/Hermes ${args}`;
        const parsed = parseHermesCommand(fullInput);
        if (!parsed) {
            output.parts = output.parts || [];
            output.parts.push({
                type: "text",
                text: `Unknown Hermes command. Use \`/Hermes help\` for available commands.`,
            });
            return;
        }
        const result = await executeHermesCommand(fullInput);
        output.parts = output.parts || [];
        output.parts.push({
            type: "text",
            text: result,
        });
    };
}
