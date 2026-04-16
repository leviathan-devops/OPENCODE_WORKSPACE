export const EXECUTION_MODELS = {
    fork: {
        model: "fork",
        options: {
            cacheOptimized: true,
        },
    },
    teammate: {
        model: "teammate",
        options: {
            persistent: true,
        },
    },
    worktree: {
        model: "worktree",
        options: {
            gitIsolated: true,
        },
    },
};
const activeExecutions = new Map();
export function startExecution(agentId, model = "fork") {
    const exec = {
        agentId,
        model,
        status: "pending",
    };
    if (model === "worktree") {
        exec.worktreeBranch = `hermes-${agentId}-${Date.now()}`;
    }
    else if (model === "teammate") {
        exec.tmuxSession = `hermes-${agentId}`;
    }
    exec.status = "running";
    exec.startedAt = Date.now();
    activeExecutions.set(agentId, exec);
    return exec;
}
export function completeExecution(agentId, status) {
    const exec = activeExecutions.get(agentId);
    if (exec) {
        exec.status = status;
        exec.completedAt = Date.now();
        activeExecutions.set(agentId, exec);
    }
}
export function getExecution(agentId) {
    return activeExecutions.get(agentId);
}
export function listActiveExecutions() {
    return Array.from(activeExecutions.values()).filter((e) => e.status === "running");
}
