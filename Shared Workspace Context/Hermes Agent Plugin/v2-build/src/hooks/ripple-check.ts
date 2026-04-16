import type { Hooks } from "@opencode-ai/plugin";

export function createRippleCheckHook(): NonNullable<
  Hooks["tool.execute.after"]
> {
  return async (input, output) => {
    const { tool } = input;

    if (tool === "write_file" || tool === "edit_file" || tool === "patch") {
      output.output = `${output.output}\n\n[RIPPLE CHECK] File modified. Run @ripple to analyze cascading effects before proceeding with more changes.`;
    }
  };
}
