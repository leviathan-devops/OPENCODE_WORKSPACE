import { isHermesAgent } from "../config/agent-identity.js";
const agentStats = new Map();
const LIMITS = {
    maxToolCalls: 100,
    maxDurationMinutes: 30,
    maxConsecutiveErrors: 5,
    idleTimeoutMinutes: 10,
};
export function createGuardrailsHook() {
    return async (input, output) => {
        if (!isHermesAgent(input.agent))
            return;
        const { tool, sessionID } = input;
        const agent = sessionID;
        let stats = agentStats.get(agent);
        if (!stats) {
            stats = { toolCalls: 0, lastCallTime: Date.now(), consecutiveErrors: 0 };
            agentStats.set(agent, stats);
        }
        stats.toolCalls++;
        stats.lastCallTime = Date.now();
        if (stats.toolCalls > LIMITS.maxToolCalls) {
            output.args = {
                ...output.args,
                _guardrails_warning: {
                    agent,
                    message: `[GUARDRAILS] Agent ${agent} has exceeded ${LIMITS.maxToolCalls} tool calls. Consider checkpointing.`,
                },
            };
        }
        if (stats.consecutiveErrors > LIMITS.maxConsecutiveErrors) {
            output.args = {
                ...output.args,
                _guardrails_warning: {
                    agent,
                    message: `[GUARDRAILS] Agent ${agent} has ${stats.consecutiveErrors} consecutive errors. Consider debugging.`,
                },
            };
        }
    };
}
export function recordToolError(agent) {
    const stats = agentStats.get(agent);
    if (stats) {
        stats.consecutiveErrors++;
    }
}
export function recordToolSuccess(agent) {
    const stats = agentStats.get(agent);
    if (stats) {
        stats.consecutiveErrors = 0;
    }
}
