export function createRippleCheckHook() {
    return async (input, output) => {
        const { tool } = input;
        if (tool === "write_file" || tool === "edit_file" || tool === "patch") {
            output.output = `${output.output}\n\n[RIPPLE CHECK] File modified. Run @ripple to analyze cascading effects before proceeding with more changes.`;
        }
    };
}
