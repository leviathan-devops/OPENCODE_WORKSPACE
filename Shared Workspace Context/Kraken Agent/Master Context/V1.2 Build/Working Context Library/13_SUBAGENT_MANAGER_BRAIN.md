# Subagent-Manager Brain — Autonomy + Override Authority

## Purpose

The Subagent-Manager is the execution layer that actually spawns containerized agents. It runs autonomously between override interventions but is always supervised by the Execution Brain.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              EXECUTION BRAIN (Supervisor)                   │
│                                                              │
│  Owns: execution-state, quality-state                        │
│  Reads: all states                                           │
│  Can Override: true                                          │
│                                                              │
│  Functions:                                                  │
│  - Direct execution                                         │
│  - Subagent supervision                                      │
│  - Mistake catching                                         │
│  - Momentum tracking                                        │
│  - Error recovery                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ Override authority
                           ▼ (when triggered)
┌─────────────────────────────────────────────────────────────┐
│              SUBAGENT-MANAGER BRAIN                          │
│                                                              │
│  Owns: container-state, execution-queue                      │
│  Reads: planning-state (tasks), execution-state (context)   │
│  Can Override: false (asks permission)                       │
│                                                              │
│  Functions:                                                  │
│  - Container pool management                                │
│  - Task queuing                                             │
│  - Output retrieval                                         │
│  - Merge integration                                        │
└─────────────────────────────────────────────────────────────┘
```

## Autonomy Levels

```typescript
const AUTONOMY_LEVELS = {
  // Subagent can do these without asking
  HIGH: [
    'execute_task',
    'allocate_container',
    'queue_subtask',
    'report_progress',
  ],
  
  // Subagent must ask permission for these
  MEDIUM: [
    'merge_outputs',
    'change_task_priority',
    'allocate_extra_resources',
  ],
  
  // Subagent cannot do these without Execution Brain approval
  LOW: [
    'abort_task',
    'change_task_scope',
    'reassign_to_cluster',
    'claim_task_complete',
  ],
};
```

## Override Triggers

The Execution Brain monitors for these conditions and sends overrides:

### Trigger 1: Output Not Retrieved
```typescript
// Pattern: Subagent reports success but outputs not retrieved
if (status.success && !status.outputsRetrieved) {
  sendOverride(taskId, {
    action: 'retrieve_outputs',
    priority: 'critical',
    reason: 'L2_FALSE_COMPLETION_BLOCK'
  });
}
```

### Trigger 2: Focus Collision
```typescript
// Pattern: Two clusters working same focus
if (detectFocusCollision()) {
  sendOverride(taskId, {
    action: 'abort_and_reassign',
    targetCluster: resolveCollision(),
    priority: 'critical',
    reason: 'L5.1_FOCUS_COLLISION'
  });
}
```

### Trigger 3: Premature Completion
```typescript
// Pattern: Subagent claims done but gates not passed
if (claimComplete && !allGatesPassed(taskId)) {
  sendOverride(taskId, {
    action: 'block_completion',
    priority: 'critical',
    reason: 'L5.4_PREMATURE_COMPLETION'
  });
}
```

### Trigger 4: Context Stale
```typescript
// Pattern: Memory critical, compaction needed
if (memoryUsage > maxMemory * 0.9) {
  sendOverride(taskId, {
    action: 'compact_and_retry',
    priority: 'high',
    reason: 'L5.3_CONTEXT_STALE'
  });
}
```

## Output Retrieval — First-Class Concern

The most critical function of Subagent-Manager is OUTPUT RETRIEVAL:

### The Fire-and-Forget Trap
```
WRONG Pattern (v1.1):
  spawn_shark_agent → success:true → MOVE ON → LOST OUTPUTS

RIGHT Pattern (v1.2):
  spawn_shark_agent → track → retrieve_outputs → verify → MERGE
```

### Implementation
```typescript
async function executeAndRetrieve(request: TaskRequest): Promise<TaskResult> {
  // 1. Execute task in container
  const execResult = await spawnContainerTask(request);
  
  // 2. Track until completion
  await trackTask(execResult.taskId);
  
  // 3. MANDATORY: Retrieve outputs
  const outputs = await retrieve_outputs({
    taskId: execResult.taskId,
    expectedFiles: request.expectedOutputs,
  });
  
  // 4. Verify outputs on host filesystem
  for (const outputPath of outputs) {
    if (!fs.existsSync(outputPath)) {
      throw new Error(
        `[SUBAGENT] Output missing on host: ${outputPath}. ` +
        `Fire-and-forget trap blocked.`
      );
    }
  }
  
  // 5. Return result with verified outputs
  return {
    success: true,
    taskId: execResult.taskId,
    outputs,
    verified: true,
  };
}
```

## Container Pool Management

```typescript
interface ContainerPool {
  maxContainers: number;      // e.g., 10
  activeContainers: number;    // currently running
  availableContainers: number; // idle, ready
  
  // Allocation
  allocate(): ContainerHandle;
  release(handle: ContainerHandle): void;
  
  // Health
  isHealthy(): boolean;
  restartIfNeeded(): void;
}

interface ContainerHandle {
  id: string;
  agent: string;
  taskId: string;
  state: 'running' | 'idle' | 'error';
  startedAt: number;
}
```

## Task Queue Management

```typescript
interface TaskQueue {
  // Priority ordering
  enqueue(task: TaskRequest, priority: TaskPriority): void;
  
  // Execution
  dequeue(): TaskRequest | null;
  
  // Tracking
  getStatus(taskId: string): TaskStatus;
  getAllStatuses(): Map<string, TaskStatus>;
}
```

## Merge Integration

After output retrieval, Subagent-Manager must merge:

```typescript
async function mergeOutputs(taskId: string, outputs: string[]): Promise<void> {
  // Each output file needs to be moved/copied to final location
  for (const outputPath of outputs) {
    const finalPath = resolveFinalPath(outputPath);
    await fs.promises.mkdir(path.dirname(finalPath), { recursive: true });
    await fs.promises.cp(outputPath, finalPath);
  }
  
  // Notify Execution Brain of merge completion
  messenger.send({
    from: 'kraken-subagent',
    to: 'kraken-execution',
    type: 'merge-complete',
    priority: 'high',
    payload: { taskId, outputs, finalPaths },
    requiresAck: false,
  });
}
```

## Reporting to Execution Brain

Subagent-Manager reports via `report_to_kraken`:

```typescript
// Progress report
report_to_kraken({
  taskId: 'xyz',
  status: 'in_progress',
  details: 'Building feature X, 60% complete',
});

// Completion report
report_to_kraken({
  taskId: 'xyz',
  status: 'complete',
  details: 'Feature built, outputs retrieved',
  files: ['/tmp/build/output.js', '/tmp/build/manifest.json'],
});

// Error report
report_to_kraken({
  taskId: 'xyz',
  status: 'error',
  details: 'Build failed - missing dependency',
  errorDetails: 'Cannot find module: express',
});
```

## Override Protocol

```typescript
// Execution Brain sends override
messenger.send({
  from: 'kraken-execution',
  to: 'kraken-subagent',
  type: 'override',
  priority: 'critical',
  payload: {
    taskId: 'xyz',
    action: 'abort_and_reassign',
    targetCluster: 'cluster-beta',
    reason: 'DEBUG_TASK_WRONG_CLUSTER',
  },
  requiresAck: true,
});

// Subagent acknowledges
messenger.send({
  from: 'kraken-subagent',
  to: 'kraken-execution',
  type: 'override-ack',
  priority: 'high',
  payload: {
    originalTaskId: 'xyz',
    action: 'aborted',
    newTaskId: 'xyz-reassigned',
  },
  requiresAck: false,
});
```

---
*Last Updated: 2026-04-12*