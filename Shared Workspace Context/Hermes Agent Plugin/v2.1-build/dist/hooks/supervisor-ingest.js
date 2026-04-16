const supervisorLog = [];
export function createSupervisorIngestHook() {
    return async (input, output) => {
        const { tool } = input;
        if (tool === "bash" && output.output.includes("error")) {
            supervisorLog.push({
                timestamp: Date.now(),
                event: `bash error: ${output.output.substring(0, 100)}`,
                agent: input.sessionID,
                risk: "LOW",
            });
        }
        if (output.output.includes("EXCEPTION") || output.output.includes("FATAL")) {
            supervisorLog.push({
                timestamp: Date.now(),
                event: `critical error in ${tool}`,
                agent: input.sessionID,
                risk: "HIGH",
            });
        }
        while (supervisorLog.length > 100) {
            supervisorLog.shift();
        }
    };
}
export function getSupervisorLog() {
    return [...supervisorLog];
}
