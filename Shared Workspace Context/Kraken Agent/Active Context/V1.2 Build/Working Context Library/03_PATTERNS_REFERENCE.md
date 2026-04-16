# Patterns Reference — Kraken L0-L7 Orchestration Patterns

## L0: KRAKEN IDENTITY WALL (5 patterns)

Block non-Kraken agents from writing to Kraken infrastructure.

```typescript
const KRAKEN_PROTECTED_PATHS = [
  '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1',
  '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2',
  '/home/leviathan/.local/share/opencode/kraken-hive',
  '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/.kraken',
  '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/.clusters',
];

const KRAKEN_AGENTS = new Set([
  'kraken', 'kraken-executor', 'kraken-planning', 'kraken-execution', 'kraken-system',
  'shark-alpha-1', 'shark-alpha-2', 'shark-beta-1', 'shark-gamma-1',
  'manta-alpha-1', 'manta-beta-1', 'manta-beta-2', 'manta-gamma-1', 'manta-gamma-2',
]);
```

**Block:** Non-Kraken agents writing to any Kraken path  
**Allow:** Kraken agents, read operations, non-Kraken paths

---

## L1: ORCHESTRATION THEATER (8 patterns)

Block "task assigned" being treated as "task complete."

```typescript
const ORCHESTRATION_THEATER_PATTERNS = [
  /spawn.*success.*true/i,                    // spawn success = done
  /task.*assigned.*complete/i,               // assigned = finished
  /cluster.*queued.*done/i,                   // queued = done
  /subagent.*started.*finished/i,            // started = complete
  /output.*retrieved.*already/i,             // already retrieved
  /taskId.*status.*complete.*without/i,      // status complete without action
  /success.*no.*output.*needed/i,            // success without output
  /build.*finished.*merge.*not.*needed/i,   // finished without merge
];

const LEGITIMATE_ORCHESTRATION = [
  /spawn_.*taskId.*clusterId/i,              // Spawning with tracking
  /get_cluster_status/i,                      // Status checking
  /aggregate_results/i,                       // Aggregating results
  /report_to_kraken/i,                        // Reporting
  /retrieve.*output.*taskId/i,                 // Retrieving outputs
];
```

**Block:** Claiming completion without evidence of outputs  
**Allow:** Status checks with taskId, explicit retrieval calls

---

## L2: FALSE COMPLETION (12 patterns)

Block claims of task completion when outputs haven't been retrieved.

```typescript
const FALSE_COMPLETION_PATTERNS = [
  /status.*complete.*output.*missing/i,
  /task.*success.*files.*empty/i,
  /subagent.*done.*output.*not.*found/i,
  /completion.*verified.*no.*artifacts/i,
  /build.*finished.*no.*results/i,
  /test.*passed.*no.*output.*files/i,
  /verify.*success.*output.*not.*retrieved/i,
  /task.*complete.*merge.*skip.*already/i,
  /result.*success.*host.*empty/i,
  /execution.*done.*artifacts.*in.*container/i,
  /success.*true.*output.*false/i,
  /finished.*true.*files.*none/i,
];
```

**Why Block:** Task completion in container ≠ outputs on host filesystem

---

## L3: OUTPUT INSPECTION (10 patterns)

Block "file exists" being treated as "output retrieved."

```typescript
const OUTPUT_INSPECTION_PATTERNS = [
  /verify.*output.*exists/i,
  /check.*files.*created/i,
  /ls.*artifacts/i,
  /test.*-f.*output/i,
  /grep.*results.*dist/i,
  /wc.*-l.*build.*artifacts/i,
  /ls.*-l.*generated/i,
  /test.*-e.*expected/i,
  /file.*exists.*output/i,
  /artifacts.*present.*verified/i,
];
```

**Why Block:** File exists in container ≠ file exists on host  
**Correct:** Must call retrieve_outputs and verify actual host filesystem paths

---

## L4: WRONG CLUSTER (6 patterns)

Block task assignment to wrong cluster domain.

```typescript
const CLUSTER_DOMAINS = {
  'cluster-alpha': ['steamroll', 'build', 'feature', 'implement', 'from-scratch', 'new-project'],
  'cluster-beta': ['debug', 'fix', 'patch', 'refactor', 'precision', 'analyze', 'investigate'],
  'cluster-gamma': ['test', 'verify', 'audit', 'integration', 'coverage', 'validation'],
};

const STEAMROLL_KEYWORDS = ['from-scratch', 'new-feature', 'build', 'implement', 'create', 'new-project'];
const PRECISION_KEYWORDS = ['debug', 'fix', 'patch', 'refactor', 'precision', 'analyze', 'investigate', 'error'];
const TESTING_KEYWORDS = ['test', 'verify', 'audit', 'coverage', 'validation', 'integration-test'];
```

**Block:** Debug task → Alpha, Build task → Beta, etc.  
**Allow:** Correct domain matching task types

---

## L5: MACRO DERAILMENT (4 sublayers, 50+ patterns)

### L5.1: FOCUS COLLISION (10 patterns)

```typescript
const FOCUS_COLLISION_PATTERNS = [
  /two.*clusters.*same.*focus/i,
  /collision.*focus.*area/i,
  /overlapping.*work.*units/i,
  /focus.*already.*anchored/i,
  /another.*cluster.*same.*project/i,
  /duplicate.*focus.*assignment/i,
  /cluster.*conflict.*focus/i,
  /focus.*taken.*by.*another/i,
  /shared.*focus.*not.*allowed/i,
  /multiple.*anchors.*same.*name/i,
];
```

### L5.2: PLANNER-EXECUTOR DESYNC (15 patterns)

```typescript
const PLANNER_EXECUTOR_DESYNC_PATTERNS = [
  /planning.*outdated.*context/i,
  /spec.*changed.*without.*update/i,
  /task.*assigned.*different.*scope/i,
  /original.*plan.*modified/i,
  /planning.*version.*mismatch/i,
  /execution.*behind.*planning/i,
  /plan.*changed.*during.*build/i,
  /scope.*drift.*detected/i,
  /task.*context.*stale/i,
  /original.*spec.*outdated/i,
  /planning.*ahead.*execution.*gap/i,
  /design.*changed.*not.*reflected/i,
  /requirement.*updated.*plan.*old/i,
  /task.*spec.*version.*conflict/i,
  /context.*drift.*detected/i,
];
```

### L5.3: CONTEXT STALE (10 patterns)

```typescript
const CONTEXT_STALE_PATTERNS = [
  /context.*outdated/i,
  /t1.*t2.*mismatch/i,
  /memory.*exceeded/i,
  /compaction.*needed/i,
  /context.*too.*large/i,
  /session.*memory.*full/i,
  /working.*context.*stale/i,
  /active.*context.*outdated/i,
  /memory.*limit.*approaching/i,
  /context.*refresh.*needed/i,
];
```

### L5.4: PREMATURE COMPLETION (15 patterns)

```typescript
const PREMATURE_COMPLETION_PATTERNS = [
  /task.*complete.*gate.*not.*met/i,
  /done.*without.*evidence/i,
  /finished.*early.*missing.*proof/i,
  /claim.*complete.*verify.*false/i,
  /declared.*done.*gates.*open/i,
  /complete.*without.*retrieval/i,
  /finished.*skip.*verification/i,
  /done.*early.*missing.*outputs/i,
  /success.*claim.*gate.*blocked/i,
  /completion.*asserted.*proof.*missing/i,
  /task.*done.*verification.*pending/i,
  /assert.*complete.*evidence.*absent/i,
  /finish.*without.*coordination.*gate/i,
  /claim.*done.*criteria.*unmet/i,
  /status.*complete.*required.*pending/i,
];
```

---

## L6: KRAKEN INFRASTRUCTURE PROTECTION (3 zones)

### Zone Definitions

```typescript
const KRAKEN_ZONES = {
  SYSTEM: [
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/src',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/dist',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/node_modules',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/src',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/dist',
  ],
  CONFIG: [
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/.kraken',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/.clusters',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/.kraken',
    '/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/.clusters',
  ],
  STATE: [
    '/home/leviathan/.local/share/opencode/kraken-hive',
    '/home/leviathan/.local/share/opencode/kraken-hive/pending-reports',
    '/home/leviathan/.local/share/opencode/kraken-hive/clusters',
    '/home/leviathan/.local/share/opencode/kraken-hive/sessions',
  ],
};
```

**SYSTEM Zone:** Never modify, read-only  
**CONFIG Zone:** Only via cluster tools, no direct file edit  
**STATE Zone:** Managed by Hive engine only

---

## L7: COORDINATION GATES (3 gates)

### Gate Definitions

```typescript
const COORDINATION_GATES = [
  {
    id: 'task-assignment-gate',
    beforePhase: 'execution',
    criteria: ['task-assigned', 'cluster-selected', 'context-injected'],
    description: 'Task must be assigned, cluster selected, context provided before execution',
  },
  {
    id: 'output-retrieval-gate',
    beforePhase: 'merge',
    criteria: ['outputs-retrieved', 'files-verified', 'merge-prepared'],
    description: 'Outputs must be retrieved from containers before merge',
  },
  {
    id: 'roundtable-sync-gate',
    beforePhase: 'next-sprint',
    criteria: ['all-clusters-reporting', 'no-focus-collision', 'council-aligned'],
    description: 'All clusters must report, no collisions, council in sync',
  },
];
```

### Gate Criteria Details

| Criteria | What it means |
|----------|---------------|
| task-assigned | Task ID exists in taskAssignments map |
| cluster-selected | Cluster ID assigned to task |
| context-injected | Context object provided to task |
| outputs-retrieved | retrieve_outputs called for task |
| files-verified | All expected files exist on host |
| merge-prepared | Merge destination confirmed |
| all-clusters-reporting | All 3 clusters have recent heartbeat |
| no-focus-collision | No duplicate focus anchors |
| council-aligned | Council brains agree on next step |

---

## Summary Table

| Layer | Patterns | Purpose |
|-------|----------|---------|
| L0 | 5 | Block non-Kraken from Kraken paths |
| L1 | 8 | Orchestration theater |
| L2 | 12 | False completion |
| L3 | 10 | Output inspection |
| L4 | 6 | Wrong cluster |
| L5.1 | 10 | Focus collision |
| L5.2 | 15 | Planner-executor desync |
| L5.3 | 10 | Context stale |
| L5.4 | 15 | Premature completion |
| L6 | 3 zones | Kraken protection |
| L7 | 3 gates | Coordination gates |
| **TOTAL** | **~100** | **Orchestration integrity** |

---
*Last Updated: 2026-04-12*