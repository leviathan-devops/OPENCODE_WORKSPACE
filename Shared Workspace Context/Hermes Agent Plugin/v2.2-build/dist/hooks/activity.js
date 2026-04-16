const recentActivity = [];
const ACTIVITY_WINDOW_MS = 5 * 60 * 1000;
const MAX_ACTIVITY_ENTRIES = 1000;
export function createActivityHook() {
    return async (input, output) => {
        const { tool, sessionID } = input;
        const { output: toolOutput } = output;
        const entry = {
            tool,
            agent: sessionID,
            timestamp: Date.now(),
            success: !toolOutput.includes("error") && !toolOutput.includes("fail"),
        };
        recentActivity.push(entry);
        while (recentActivity.length > MAX_ACTIVITY_ENTRIES) {
            recentActivity.shift();
        }
    };
}
export function getRecentActivity(agent) {
    const cutoff = Date.now() - ACTIVITY_WINDOW_MS;
    return recentActivity.filter((e) => e.timestamp > cutoff && (!agent || e.agent === agent));
}
