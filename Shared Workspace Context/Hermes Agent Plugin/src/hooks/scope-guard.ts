import type { Hooks } from "@opencode-ai/plugin";

const ALLOWED_PATHS = [
  "/src/",
  "/tests/",
  "/docs/",
  "/lib/",
  "/utils/",
];

const DENIED_PATTERNS = [
  /\.env(?:\.local|\.development)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /credentials\.json$/i,
  /secrets\.ya?ml$/i,
];

export function createScopeGuardHook(): NonNullable<
  Hooks["tool.execute.before"]
> {
  return async (input, output) => {
    const { tool } = input;

    if (tool === "bash" || tool === "shell") {
      const argsObj = output.args as any;
      const command: string = argsObj?.command ?? "";

      if (command.includes("rm -rf /") || command.includes("sudo")) {
        output.args = {
          ...argsObj,
          _scope_blocked: {
            tool,
            message: `[SCOPE GUARD] Dangerous command blocked: ${command.substring(0, 50)}...`,
          },
        };
      }
    }

    if (tool === "write_file" || tool === "edit_file") {
      const argsObj = output.args as any;
      const filePath: string = argsObj?.path ?? "";

      for (const pattern of DENIED_PATTERNS) {
        if (pattern.test(filePath)) {
          output.args = {
            ...argsObj,
            _scope_blocked: {
              file: filePath,
              message: `[SCOPE GUARD] Writing to ${filePath} is not allowed. This path pattern is protected.`,
            },
          };
          return;
        }
      }
    }
  };
}
