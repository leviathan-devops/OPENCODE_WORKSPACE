import { isHermesAgent } from "../config/agent-identity.js";
const delegationChain = [];
export function createDelegationLedgerHook() {
    return async (input, output) => {
        if (!isHermesAgent(input.agent))
            return;
        const { tool } = input;
        if (tool === "task" || tool === "agent_dispatch") {
            const args = output.output;
            const match = args.match(/delegated to (\w+) for task (\w+)/);
            if (match) {
                delegationChain.push({
                    from: "hermes",
                    to: match[1],
                    taskId: match[2],
                    timestamp: Date.now(),
                    completed: false,
                });
            }
        }
        if (tool === "complete_task" || tool === "update_task_status") {
            const taskIdMatch = output.output.match(/task (\w+) completed/);
            if (taskIdMatch) {
                const entry = delegationChain.find((d) => d.taskId === taskIdMatch[1]);
                if (entry) {
                    entry.completed = true;
                }
            }
        }
    };
}
export function getDelegationChain() {
    return [...delegationChain];
}
export function getActiveDelegations() {
    return delegationChain.filter((d) => !d.completed);
}
