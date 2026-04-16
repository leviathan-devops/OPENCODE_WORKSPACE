import { isHermesAgent } from "../config/agent-identity.js";
const recentCalls = [];
const SPIRAL_THRESHOLD = 5;
const SPIRAL_WINDOW_MS = 5 * 60 * 1000;
export function createDebuggingSpiralHook() {
    return async (input, output) => {
        if (!isHermesAgent(input.agent))
            return;
        const { tool, callID } = input;
        const argsStr = JSON.stringify(output.output?.substring(0, 200));
        const existing = recentCalls.find((r) => r.tool === tool && r.args === argsStr);
        if (existing) {
            existing.count++;
            const windowMs = Date.now() - existing.firstCall;
            if (existing.count >= SPIRAL_THRESHOLD && windowMs < SPIRAL_WINDOW_MS) {
                output.output = `[DEBUGGING SPIRAL DETECTED] Same tool (${tool}) called ${existing.count} times with similar args in ${Math.round(windowMs / 1000)}s. Consider a different approach or escalate to @architect.`;
            }
        }
        else {
            recentCalls.push({
                tool,
                args: argsStr,
                count: 1,
                firstCall: Date.now(),
            });
        }
        while (recentCalls.length > 100) {
            recentCalls.shift();
        }
    };
}
