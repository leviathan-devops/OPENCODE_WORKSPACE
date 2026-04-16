export type ExecutionModel = "fork" | "teammate" | "worktree";

export interface ExecutionConfig {
  model: ExecutionModel;
  options: {
    cacheOptimized?: boolean;
    persistent?: boolean;
    gitIsolated?: boolean;
    worktreeName?: string;
  };
}

export const EXECUTION_MODELS: Record<string, ExecutionConfig> = {
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

export interface AgentExecution {
  agentId: string;
  model: ExecutionModel;
  status: "pending" | "running" | "completed" | "failed";
  worktreeBranch?: string;
  tmuxSession?: string;
  startedAt?: number;
  completedAt?: number;
}

const activeExecutions: Map<string, AgentExecution> = new Map();

export function startExecution(
  agentId: string,
  model: ExecutionModel = "fork"
): AgentExecution {
  const exec: AgentExecution = {
    agentId,
    model,
    status: "pending",
  };

  if (model === "worktree") {
    exec.worktreeBranch = `hermes-${agentId}-${Date.now()}`;
  } else if (model === "teammate") {
    exec.tmuxSession = `hermes-${agentId}`;
  }

  exec.status = "running";
  exec.startedAt = Date.now();
  activeExecutions.set(agentId, exec);

  return exec;
}

export function completeExecution(
  agentId: string,
  status: "completed" | "failed"
): void {
  const exec = activeExecutions.get(agentId);
  if (exec) {
    exec.status = status;
    exec.completedAt = Date.now();
    activeExecutions.set(agentId, exec);
  }
}

export function getExecution(agentId: string): AgentExecution | undefined {
  return activeExecutions.get(agentId);
}

export function listActiveExecutions(): AgentExecution[] {
  return Array.from(activeExecutions.values()).filter(
    (e) => e.status === "running"
  );
}
