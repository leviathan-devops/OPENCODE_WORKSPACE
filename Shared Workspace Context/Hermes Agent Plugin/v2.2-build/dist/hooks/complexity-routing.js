export function createComplexityRoutingHook() {
    return async (input, output) => {
        const { agent } = input;
        if (agent === "hermes") {
            output.temperature = 0.5;
        }
        else {
            output.temperature = 0.3;
        }
    };
}
