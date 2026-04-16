# Implementation Guide — System Brain L0-L7

## Target Files

```
kraken-agent-v1.2/src/brains/system/firewall/
├── l0-identity.ts           # Kraken Identity Wall
├── l1-orchestration-theater.ts
├── l2-false-completion.ts
├── l3-output-inspection.ts
├── l4-wrong-cluster.ts
├── l5-macro-derailment.ts
├── l6-kraken-protection.ts
├── l7-coordination-gates.ts
└── index.ts                # Combines all layers
```

---

## buildTextToCheck Function

**CRITICAL:** Only check toolArgs, never agentMessage or output.

```typescript
function buildTextToCheck(context: {
  toolName: string;
  toolArgs: Record<string, unknown>;
}): string {
  return JSON.stringify(context.toolArgs);
}
```

**Why:** `toolArgs` is what the agent IS DOING. `agentMessage` and `output` are not the action itself.

---

## L0: Kraken Identity Wall

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

export function checkKrakenIdentityWall(
  tool: string,
  toolArgs: Record<string, unknown>,
  getCurrentAgent: () => string | undefined
): void {
  const DANGEROUS_TOOLS = new Set([
    'write_file', 'mcp_write_file', 'edit', 'mcp_edit',
    'patch', 'mcp_patch', 'delete_file', 'mcp_delete_file',
    'terminal', 'mcp_terminal',
  ]);
  
  if (!DANGEROUS_TOOLS.has(tool)) return;
  
  const filePath = extractFilePath(tool, toolArgs);
  if (!filePath) return;
  
  const isKrakenPath = Array.from(KRAKEN_PROTECTED_PATHS).some(
    p => filePath.startsWith(p)
  );
  
  if (!isKrakenPath) return;
  
  const agent = getCurrentAgent();
  if (!agent) {
    throw new Error(`[KRAKEN_L0] Cannot write to Kraken paths when agent is uninitialized`);
  }
  
  if (!KRAKEN_AGENTS.has(agent)) {
    throw new Error(
      `[KRAKEN_L0] Agent "${agent}" cannot write to Kraken path: ${filePath}`
    );
  }
}
```

---

## L1: Orchestration Theater

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

export function checkOrchestrationTheater(
  toolArgs: Record<string, unknown>,
  context: { taskState: Map<string, any> }
): void {
  const textToCheck = JSON.stringify(toolArgs);
  
  // Check for theater patterns
  for (const pattern of ORCHESTRATION_THEATER_PATTERNS) {
    if (pattern.test(textToCheck)) {
      // Verify this isn't legitimate
      for (const legit of LEGITIMATE_ORCHESTRATION) {
        if (legit.test(textToCheck)) return;
      }
      
      throw new Error(
        `[KRAKEN_L1] Orchestration theater detected. ` +
        `"Task assigned" ≠ "Task complete". Must retrieve outputs.`
      );
    }
  }
}
```

---

## L2: False Completion

```typescript
const FALSE_COMPLETION_PATTERNS = [
  /status.*complete.*output.*missing/i,
  /task.*success.*files.*empty/i,
  /subagent.*done.*output.*not.*found/i,
  /completion.*verified.*no.*artifacts/i,
  /build.*finished.*no.*results/i,
  /test.*passed.*no.*output.*files/i,
];

export function checkFalseCompletion(
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
      if (taskId && context.pendingRetrievals.has(taskId)) {
        throw new Error(
          `[KRAKEN_L2] False completion detected. Task ${taskId} claims complete ` +
          `but outputs were never retrieved.`
        );
      }
    }
  }
}
```

---

## L3: Output Inspection

```typescript
const OUTPUT_VERIFICATION_PATTERNS = [
  /verify.*output.*exists/i,
  /check.*files.*created/i,
  /ls.*artifacts/i,
  /test.*-f.*output/i,
  /grep.*results.*dist/i,
];

export function checkOutputInspection(
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
      
      // Verify each expected output exists on host
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

## L4: Wrong Cluster

```typescript
const CLUSTER_DOMAIN_MAP = {
  'cluster-alpha': ['steamroll', 'build', 'feature', 'implement', 'from-scratch'],
  'cluster-beta': ['debug', 'fix', 'patch', 'refactor', 'precision', 'analyze'],
  'cluster-gamma': ['test', 'verify', 'audit', 'integration', 'coverage'],
};

export function checkWrongCluster(
  tool: string,
  toolArgs: Record<string, unknown>,
  context: { clusterAssignments: Map<string, string> }
): void {
  if (tool !== 'spawn_cluster_task' && 
      tool !== 'spawn_shark_agent' && 
      tool !== 'spawn_manta_agent') {
    return;
  }
  
  const task = extractTask(toolArgs);
  const targetCluster = extractCluster(toolArgs);
  
  // Detect task type from keywords
  const taskType = detectTaskType(task);
  const designatedCluster = getDesignatedCluster(taskType);
  
  if (designatedCluster && targetCluster !== designatedCluster) {
    throw new Error(
      `[KRAKEN_L4] Wrong cluster. Task type "${taskType}" ` +
      `should go to ${designatedCluster}, not ${targetCluster}.`
    );
  }
}
```

---

## L5.1: Focus Collision

```typescript
export function checkFocusCollision(
  toolArgs: Record<string, unknown>,
  context: { focusAnchors: Map<string, string[]> }
): void {
  const focus = extractFocus(toolArgs);
  if (!focus) return;
  
  const clustersWithFocus = context.focusAnchors.get(focus) || [];
  
  if (clustersWithFocus.length > 1) {
    throw new Error(
      `[KRAKEN_L5.1] Focus collision. Clusters ${clustersWithFocus.join(', ')} ` +
      `all anchored to "${focus}". Clusters must have unique focus.`
    );
  }
}
```

---

## L5.4: Premature Completion

```typescript
export function checkPrematureCompletion(
  toolArgs: Record<string, unknown>,
  context: { gateStatus: Map<string, boolean> }
): void {
  const textToCheck = JSON.stringify(toolArgs);
  
  const PREMATURE_COMPLETION_PATTERNS = [
    /task.*complete.*gate.*not.*met/i,
    /done.*without.*evidence/i,
    /finished.*early.*missing.*proof/i,
  ];
  
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

## L6: Kraken Protection

```typescript
const KRAKEN_ZONES = {
  SYSTEM: [
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/src',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/dist',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/src',
  ],
  CONFIG: [
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/.kraken',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/.clusters',
  ],
  STATE: [
    '/home/leviathan/.local/share/opencode/kraken-hive',
  ],
};

export function checkKrakenProtection(
  tool: string,
  toolArgs: Record<string, unknown>
): void {
  const filePath = extractFilePath(tool, toolArgs);
  if (!filePath) return;
  
  for (const [zone, paths] of Object.entries(KRAKEN_ZONES)) {
    if (paths.some(p => filePath.startsWith(p))) {
      if (zone === 'SYSTEM') {
        throw new Error(
          `[KRAKEN_L6] Cannot modify Kraken SYSTEM zone: ${filePath}`
        );
      }
      if (zone === 'CONFIG' && tool !== 'read_file') {
        throw new Error(
          `[KRAKEN_L6] Cannot modify Kraken CONFIG zone: ${filePath}`
        );
      }
    }
  }
}
```

---

## L7: Coordination Gates

```typescript
const COORDINATION_GATES = [
  {
    id: 'task-assignment-gate',
    criteria: ['task-assigned', 'cluster-selected', 'context-injected'],
  },
  {
    id: 'output-retrieval-gate',
    criteria: ['outputs-retrieved', 'files-verified', 'merge-prepared'],
  },
  {
    id: 'roundtable-sync-gate',
    criteria: ['all-clusters-reporting', 'no-focus-collision', 'council-aligned'],
  },
];

export function checkCoordinationGate(
  gateId: string,
  context: {
    taskAssignments: Map<string, any>;
    outputRetrievals: Map<string, string[]>;
    clusterStatuses: Map<string, any>;
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
    }
  }
}
```

---

## Guardian Hook Composition

```typescript
export function createKrakenGuardianHook(context: FirewallContext) {
  return async (input, output) => {
    const { tool } = input;
    const args = (output as { args: unknown }).args as Record<string, unknown>;
    
    // L0: Identity Wall
    checkKrakenIdentityWall(tool, args, context.getCurrentAgent);
    
    // L1: Orchestration Theater
    checkOrchestrationTheater(args, context);
    
    // L2: False Completion
    checkFalseCompletion(tool, args, context);
    
    // L3: Output Inspection
    checkOutputInspection(args, context);
    
    // L4: Wrong Cluster
    checkWrongCluster(tool, args, context);
    
    // L5: Macro Derailment
    checkMacroDerailment(args, context);
    
    // L6: Kraken Protection
    checkKrakenProtection(tool, args);
    
    // L7: Coordination Gates (on specific gates)
    if (shouldCheckGate(tool, args)) {
      checkCoordinationGate(args.gateId as string, context);
    }
  };
}
```

---
*Last Updated: 2026-04-12*