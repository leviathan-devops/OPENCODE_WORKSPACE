# Complete Build Specification — System Brain L0-L7

## Core Philosophy

> *"If a human can write a rule for it, write the rule. Reserve models for what rules literally cannot do."*

Every layer follows this pattern:
1. **Define problem mechanically** — Can I write a rule?
2. **Implement as pure algorithm** — Regex, state checks, evidence files
3. **Test with specific cases** — Exact matches, not "seems right"

---

## L0: KRAKEN IDENTITY WALL

### Purpose
Block non-Kraken agents from writing to Kraken infrastructure paths.

### Mechanical Implementation

```typescript
const KRAKEN_PROTECTED_PATHS = new Set([
  '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1',
  '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2',
  '/home/leviathan/.local/share/opencode/kraken-hive',
]);

const KRAKEN_AGENTS = new Set([
  'kraken', 'kraken-executor', 'kraken-planning', 'kraken-execution', 'kraken-system',
  'shark-alpha-1', 'shark-alpha-2', 'shark-beta-1', 'shark-gamma-1',
  'manta-alpha-1', 'manta-beta-1', 'manta-beta-2', 'manta-gamma-1', 'manta-gamma-2',
]);

const DANGEROUS_TOOLS = new Set([
  'write_file', 'mcp_write_file', 'edit', 'mcp_edit',
  'patch', 'mcp_patch', 'delete_file', 'mcp_delete_file',
  'terminal', 'mcp_terminal',
]);

function checkL0IdentityWall(
  tool: string,
  toolArgs: Record<string, unknown>,
  getCurrentAgent: () => string | undefined
): void {
  // Step 1: Is this a dangerous tool?
  if (!DANGEROUS_TOOLS.has(tool)) return;
  
  // Step 2: Extract path being written to
  const filePath = extractFilePath(tool, toolArgs);
  if (!filePath) return;
  
  // Step 3: Is this a Kraken path?
  const isKrakenPath = Array.from(KRAKEN_PROTECTED_PATHS).some(
    p => filePath.startsWith(p)
  );
  if (!isKrakenPath) return;
  
  // Step 4: Is the agent a Kraken agent?
  const agent = getCurrentAgent();
  if (!agent) {
    throw new Error(`[KRAKEN_L0] Cannot write to Kraken paths when agent uninitialized`);
  }
  
  if (!KRAKEN_AGENTS.has(agent)) {
    throw new Error(
      `[KRAKEN_L0] Agent "${agent}" cannot write to Kraken path: ${filePath}`
    );
  }
}
```

### Test Cases

| Tool | Agent | Path | Expected |
|------|-------|------|----------|
| write_file | vanilla | kraken-agent-v1.1/src | BLOCK |
| write_file | kraken | kraken-agent-v1.1/src | ALLOW |
| read_file | vanilla | kraken-agent-v1.1/src | ALLOW |
| write_file | vanilla | /tmp/build | ALLOW |

---

## L1: ORCHESTRATION THEATER

### Purpose
Block "task assigned" being treated as "task complete."

### Pattern Set

```typescript
const ORCHESTRATION_THEATER_PATTERNS = [
  /spawn.*success.*true/i,
  /task.*assigned.*complete/i,
  /cluster.*queued.*done/i,
  /subagent.*started.*finished/i,
  /output.*retrieved.*already/i,
  /success.*no.*output.*needed/i,
  /build.*finished.*merge.*not.*needed/i,
  /taskId.*status.*complete.*without/i,
];

const LEGITIMATE_ORCHESTRATION = [
  /spawn_.*taskId.*clusterId/i,
  /get_cluster_status/i,
  /aggregate_results/i,
  /report_to_kraken/i,
  /retrieve.*output.*taskId/i,
];
```

### Why These Patterns?

| Pattern | Why Blocked |
|---------|-------------|
| spawn.*success.*true | Spawn returns immediately, success≠complete |
| task.*assigned.*complete | Assigned to cluster ≠ outputs retrieved |
| cluster.*queued.*done | Queued ≠ executed |
| subagent.*started.*finished | Started ≠ finished |
| output.*retrieved.*already | "Already" claims without evidence |
| success.*no.*output.*needed | Success always needs outputs |

---

## L2: FALSE COMPLETION

### Purpose
Block claims of task completion when outputs haven't been retrieved.

### Key Insight
```
FIRE-AND-FORGET IS THE ROOT FAILURE.

Wrong: spawn → success:true → MOVE ON
Right: spawn → status check → retrieve → verify → MERGE
```

### Implementation

```typescript
const FALSE_COMPLETION_PATTERNS = [
  /status.*complete.*output.*missing/i,
  /task.*success.*files.*empty/i,
  /subagent.*done.*output.*not.*found/i,
  /completion.*verified.*no.*artifacts/i,
  /build.*finished.*no.*results/i,
];

function checkL2FalseCompletion(
  tool: string,
  toolArgs: Record<string, unknown>,
  context: { pendingRetrievals: Set<string> }
): void {
  const COMPLETION_REPORTING_TOOLS = new Set([
    'report_to_kraken', 'aggregate_results', 'get_cluster_status'
  ]);
  
  if (!COMPLETION_REPORTING_TOOLS.has(tool)) return;
  
  const textToCheck = JSON.stringify(toolArgs);
  
  for (const pattern of FALSE_COMPLETION_PATTERNS) {
    if (pattern.test(textToCheck)) {
      const taskId = extractTaskId(toolArgs);
      
      // If this task has pending retrievals, block
      if (taskId && context.pendingRetrievals.has(taskId)) {
        throw new Error(
          `[KRAKEN_L2] False completion. Task ${taskId} claims complete ` +
          `but outputs were never retrieved.`
        );
      }
    }
  }
}
```

---

## L3: OUTPUT INSPECTION

### Purpose
Block "file exists in container" being treated as "output on host."

### Key Difference from Shark's L3

| Shark L3 | Kraken L3 |
|----------|-----------|
| `test -f dist/index.js` = file exists | `test -f /tmp/build/output.js` in container ≠ on host |
| Checking source files | Checking retrieved outputs |
| File exists ≠ works | File exists ≠ on host filesystem |

### Implementation

```typescript
const OUTPUT_VERIFICATION_PATTERNS = [
  /verify.*output.*exists/i,
  /check.*files.*created/i,
  /ls.*artifacts/i,
  /test.*-f.*output/i,
  /grep.*results.*dist/i,
];

function checkL3OutputInspection(
  toolArgs: Record<string, unknown>,
  context: { taskOutputs: Map<string, string[]> }
): void {
  const textToCheck = JSON.stringify(toolArgs);
  
  for (const pattern of OUTPUT_VERIFICATION_PATTERNS) {
    if (pattern.test(textToCheck)) {
      const taskId = extractTaskId(toolArgs);
      const expectedOutputs = taskId ? context.taskOutputs.get(taskId) : null;
      
      if (!expectedOutputs || expectedOutputs.length === 0) {
        throw new Error(
          `[KRAKEN_L3] Output verification requires explicit file list. ` +
          `Cannot verify outputs without knowing expected files.`
        );
      }
      
      // Verify each expected output actually exists on HOST
      for (const outputPath of expectedOutputs) {
        if (!fs.existsSync(outputPath)) {
          throw new Error(
            `[KRAKEN_L3] Output file missing: ${outputPath}. ` +
            `Task claims complete but output not on host filesystem.`
          );
        }
      }
    }
  }
}
```

---

## L4: WRONG CLUSTER

### Purpose
Block task assignment to wrong cluster domain.

### Domain Map

```typescript
const CLUSTER_DOMAIN_MAP = {
  'cluster-alpha': {
    focus: 'steamroll',
    keywords: ['from-scratch', 'new-feature', 'build', 'implement', 'create', 'new-project'],
    agents: ['shark-alpha-1', 'shark-alpha-2', 'manta-alpha-1'],
  },
  'cluster-beta': {
    focus: 'precision',
    keywords: ['debug', 'fix', 'patch', 'refactor', 'precision', 'analyze', 'investigate', 'error'],
    agents: ['shark-beta-1', 'manta-beta-1', 'manta-beta-2'],
  },
  'cluster-gamma': {
    focus: 'testing',
    keywords: ['test', 'verify', 'audit', 'coverage', 'validation', 'integration'],
    agents: ['manta-gamma-1', 'manta-gamma-2', 'shark-gamma-1'],
  },
};
```

### Implementation

```typescript
function detectTaskType(task: string): string {
  for (const [clusterId, config] of Object.entries(CLUSTER_DOMAIN_MAP)) {
    for (const keyword of config.keywords) {
      if (task.toLowerCase().includes(keyword)) {
        return clusterId;
      }
    }
  }
  return 'cluster-alpha'; // default
}

function checkL4WrongCluster(
  tool: string,
  toolArgs: Record<string, unknown>,
  context: { clusterAssignments: Map<string, string> }
): void {
  if (!['spawn_cluster_task', 'spawn_shark_agent', 'spawn_manta_agent'].includes(tool)) {
    return;
  }
  
  const task = extractTask(toolArgs);
  const targetCluster = extractCluster(toolArgs);
  const designatedCluster = detectTaskType(task);
  
  if (targetCluster && targetCluster !== designatedCluster) {
    throw new Error(
      `[KRAKEN_L4] Wrong cluster. Task type should go to ${designatedCluster}, ` +
      `but was assigned to ${targetCluster}.`
    );
  }
}
```

---

## L5: MACRO DERAILMENT

### L5.1: Focus Collision

```typescript
function checkL5FocusCollision(
  toolArgs: Record<string, unknown>,
  context: { focusAnchors: Map<string, string[]> }
): void {
  const focus = extractFocus(toolArgs);
  if (!focus) return;
  
  const clustersWithFocus = context.focusAnchors.get(focus) || [];
  
  if (clustersWithFocus.length > 1) {
    throw new Error(
      `[KRAKEN_L5.1] Focus collision. Clusters ${clustersWithFocus.join(', ')} ` +
      `all anchored to "${focus}".`
    );
  }
}
```

### L5.2: Planner-Executor Desync

```typescript
const PLANNER_EXECUTOR_DESYNC_PATTERNS = [
  /planning.*outdated.*context/i,
  /spec.*changed.*without.*update/i,
  /task.*assigned.*different.*scope/i,
  /original.*plan.*modified/i,
  /planning.*version.*mismatch/i,
];

function checkL5PlannerExecutorDesync(
  toolArgs: Record<string, unknown>,
  context: { planningState: any; executionState: any }
): void {
  const textToCheck = JSON.stringify(toolArgs);
  
  for (const pattern of PLANNER_EXECUTOR_DESYNC_PATTERNS) {
    if (pattern.test(textToCheck)) {
      if (context.planningState.version !== context.executionState.planningVersion) {
        throw new Error(
          `[KRAKEN_L5.2] Planner-executor desync. ` +
          `Planning version ${context.planningState.version} ` +
          `!= execution version ${context.executionState.planningVersion}.`
        );
      }
    }
  }
}
```

### L5.3: Context Stale

```typescript
const CONTEXT_STALE_PATTERNS = [
  /context.*outdated/i,
  /memory.*exceeded/i,
  /compaction.*needed/i,
  /t1.*t2.*mismatch/i,
];

function checkL5ContextStale(
  toolArgs: Record<string, unknown>,
  context: { memoryUsage: number; maxMemory: number }
): void {
  if (context.memoryUsage > context.maxMemory * 0.9) {
    throw new Error(
      `[KRAKEN_L5.3] Context stale. Memory at ${context.memoryUsage}/${context.maxMemory}.`
    );
  }
}
```

### L5.4: Premature Completion

```typescript
const PREMATURE_COMPLETION_PATTERNS = [
  /task.*complete.*gate.*not.*met/i,
  /done.*without.*evidence/i,
  /finished.*early.*missing.*proof/i,
  /claim.*complete.*verify.*false/i,
];

function checkL5PrematureCompletion(
  toolArgs: Record<string, unknown>,
  context: { gateStatus: Map<string, boolean> }
): void {
  const textToCheck = JSON.stringify(toolArgs);
  
  for (const pattern of PREMATURE_COMPLETION_PATTERNS) {
    if (pattern.test(textToCheck)) {
      const taskId = extractTaskId(toolArgs);
      const requiredGates = getRequiredGates(taskId);
      
      for (const gate of requiredGates) {
        if (!context.gateStatus.get(gate)) {
          throw new Error(
            `[KRAKEN_L5.4] Premature completion. Gate "${gate}" not passed.`
          );
        }
      }
    }
  }
}
```

---

## L6: KRAKEN PROTECTION

### Zone Definitions

```typescript
const KRAKEN_ZONES = {
  SYSTEM: [
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/src',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/dist',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/node_modules',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/src',
  ],
  CONFIG: [
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/.kraken',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/.clusters',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/.kraken',
  ],
  STATE: [
    '/home/leviathan/.local/share/opencode/kraken-hive',
    '/home/leviathan/.local/share/opencode/kraken-hive/pending-reports',
    '/home/leviathan/.local/share/opencode/kraken-hive/clusters',
  ],
};

function classifyKrakenZone(filePath: string): string | null {
  for (const [zone, paths] of Object.entries(KRAKEN_ZONES)) {
    if (paths.some(p => filePath.startsWith(p))) {
      return zone;
    }
  }
  return null;
}

function checkL6KrakenProtection(
  tool: string,
  toolArgs: Record<string, unknown>
): void {
  const filePath = extractFilePath(tool, toolArgs);
  if (!filePath) return;
  
  const zone = classifyKrakenZone(filePath);
  if (!zone) return;
  
  if (zone === 'SYSTEM') {
    throw new Error(`[KRAKEN_L6] Cannot modify Kraken SYSTEM zone: ${filePath}`);
  }
  
  if (zone === 'CONFIG' && tool !== 'read_file') {
    throw new Error(`[KRAKEN_L6] Cannot modify Kraken CONFIG zone: ${filePath}`);
  }
}
```

---

## L7: COORDINATION GATES

### Gate Definitions

```typescript
const COORDINATION_GATES = [
  {
    id: 'task-assignment-gate',
    beforePhase: 'execution',
    criteria: ['task-assigned', 'cluster-selected', 'context-injected'],
  },
  {
    id: 'output-retrieval-gate',
    beforePhase: 'merge',
    criteria: ['outputs-retrieved', 'files-verified', 'merge-prepared'],
  },
  {
    id: 'roundtable-sync-gate',
    beforePhase: 'next-sprint',
    criteria: ['all-clusters-reporting', 'no-focus-collision', 'council-aligned'],
  },
];

function checkL7CoordinationGate(
  gateId: string,
  context: {
    taskAssignments: Map<string, any>;
    outputRetrievals: Map<string, string[]>;
    clusterStatuses: Map<string, any>;
    focusAnchors: Map<string, string[]>;
  }
): void {
  const gate = COORDINATION_GATES.find(g => g.id === gateId);
  if (!gate) return;
  
  for (const criterion of gate.criteria) {
    switch (criterion) {
      case 'task-assigned':
        if (context.taskAssignments.size === 0) {
          throw new Error(`[KRAKEN_L7] Gate "${gateId}" blocked: no tasks assigned`);
        }
        break;
      case 'cluster-selected':
        for (const [taskId, assignment] of context.taskAssignments) {
          if (!assignment.clusterId) {
            throw new Error(
              `[KRAKEN_L7] Gate "${gateId}" blocked: task ${taskId} has no cluster`
            );
          }
        }
        break;
      case 'context-injected':
        for (const [taskId, assignment] of context.taskAssignments) {
          if (!assignment.context) {
            throw new Error(
              `[KRAKEN_L7] Gate "${gateId}" blocked: task ${taskId} has no context`
            );
          }
        }
        break;
      case 'outputs-retrieved':
        for (const [taskId, outputs] of context.outputRetrievals) {
          if (!outputs || outputs.length === 0) {
            throw new Error(
              `[KRAKEN_L7] Gate "${gateId}" blocked: task ${taskId} has no retrieved outputs`
            );
          }
        }
        break;
      case 'all-clusters-reporting':
        for (const [clusterId, status] of context.clusterStatuses) {
          if (status.state === 'offline') {
            throw new Error(
              `[KRAKEN_L7] Gate "${gateId}" blocked: cluster ${clusterId} not reporting`
            );
          }
        }
        break;
      case 'no-focus-collision':
        const focusCounts = new Map<string, number>();
        for (const clusters of context.focusAnchors.values()) {
          for (const clusterId of clusters) {
            focusCounts.set(clusterId, (focusCounts.get(clusterId) || 0) + 1);
          }
        }
        for (const [focus, count] of focusCounts) {
          if (count > 1) {
            throw new Error(
              `[KRAKEN_L7] Gate "${gateId}" blocked: focus "${focus}" has multiple clusters`
            );
          }
        }
        break;
    }
  }
}
```

---
*Last Updated: 2026-04-12*