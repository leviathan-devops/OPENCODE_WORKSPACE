# Roundtable Council — Alpha/Beta/Gamma Coordination

## Purpose

The Roundtable Council is how the 3 cluster brains coordinate without sequential handoffs. Each cluster has its own brain with designated domain expertise, and they communicate via BrainMessenger.

## Architecture

```
        ┌─────────────────────────────────────────────────┐
        │            KRAKEN ORCHESTRATOR                    │
        │                                                  │
        │  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
        │  │Planning │  │Execution│  │ System  │        │
        │  │ Brain   │  │ Brain   │  │ Brain   │        │
        │  └────┬────┘  └────┬────┘  └────┬────┘        │
        │       │              │              │           │
        │       └──────────────┼──────────────┘           │
        │                      │                          │
        │             ┌────────┴────────┐                │
        │             │ BRAIN MESSENGER  │                │
        │             └────────┬────────┘                │
        └──────────────────────┼──────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│   ALPHA     │        │    BETA     │        │   GAMMA     │
│  CLUSTER    │◀──────▶│  CLUSTER    │◀──────▶│  CLUSTER    │
│  BRAIN      │        │  BRAIN      │        │  BRAIN      │
│             │        │             │        │             │
│ Lead: Exec  │        │ Lead: Reason│        │ Lead: System│
│ Focus:      │        │ Focus:      │        │ Focus:      │
│ Steamroll   │        │ Precision   │        │ Testing     │
└─────────────┘        └─────────────┘        └─────────────┘
```

## Domain Designation

| Cluster | Lead Sub-Brain | Focus | Task Types |
|--------|----------------|-------|------------|
| **Alpha** | Execution | Steamroll | from-scratch, new-feature, build, implement |
| **Beta** | Reasoning | Precision | debug, fix, patch, refactor, analyze |
| **Gamma** | System | Testing | test, verify, audit, integration |

## Brain Structure (Per Cluster)

Each cluster brain has same triple-brain structure internally:

```typescript
interface ClusterBrain {
  // Sub-brains
  execution: ExecutionSubBrain;  // Alpha leads
  reasoning: ReasoningSubBrain;  // Beta leads
  system: SystemSubBrain;       // Gamma leads
  
  // Shared state
  state: {
    clusterState: WritableState;
    thinkingState: WritableState;
    workflowState: WritableState;
  };
  
  // Communication
  messenger: BrainMessenger;
}
```

## Inter-Cluster Communication

### Priority Messages

```typescript
// Alpha → Beta: Context injection (high priority)
messenger.send({
  from: 'alpha-execution',
  to: 'beta-reasoning',
  type: 'context-inject',
  priority: 'high',
  payload: { 
    focus: 'api-handler',
    patterns: ['debug-pattern', 'fix-pattern']
  },
  requiresAck: false,
});

// Gamma → Alpha: Gate requirement (critical)
messenger.send({
  from: 'gamma-system',
  to: 'alpha-execution',
  type: 'gate-requirement',
  priority: 'critical',
  payload: {
    gate: 'test-gate',
    criteria: ['tests-pass', 'coverage-80+']
  },
  requiresAck: true,
});

// Beta → All: Sync point (normal)
messenger.send({
  from: 'beta-reasoning',
  to: '*',
  type: 'checkpoint',
  priority: 'normal',
  payload: { phase: 'analysis-complete' },
  requiresAck: false,
});
```

### Sync Points

Clusters synchronize at:
1. **Task assignment** — Which cluster takes which task
2. **Phase transitions** — Moving from spec → build → test
3. **Output merge** — Combining results from multiple clusters
4. **Incident escalation** — One cluster needs help

## Council Decisions

### Task Assignment Algorithm

```typescript
function assignTaskToCluster(task: string, taskType: string): string {
  // Check task type keywords
  if (isSteamrollTask(task)) return 'cluster-alpha';
  if (isPrecisionTask(task)) return 'cluster-beta';
  if (isTestingTask(task)) return 'cluster-gamma';
  
  // Check cluster load
  const loads = getClusterLoads();
  return loads.minLoad; // Fallback to least loaded
}
```

### Focus Anchoring

```typescript
function anchorFocusToCluster(focus: string, clusterId: string): void {
  // Check for collision
  const currentAnchors = clusterScheduler.getFocusAnchors();
  for (const [existingFocus, existingCluster] of currentAnchors) {
    if (existingFocus === focus && existingCluster !== clusterId) {
      throw new Error(
        `[COUNCIL] Focus collision: "${focus}" already anchored to ${existingCluster}`
      );
    }
  }
  
  clusterScheduler.anchorClusterToFocus(clusterId, focus);
}
```

## Alpha Brain (Steamroll)

```typescript
interface AlphaBrain {
  leadSubBrain: 'execution';
  
  focus: ['new-feature', 'from-scratch', 'build', 'implement'];
  
  strengths: [
    'Fast execution',
    'Aggressive problem-solving', 
    'Full autonomy'
  ];
  
  weaknesses: [
    'May over-engineer',
    'Less precise debugging'
  ];
  
  councilRole: 'Primary builder — gets the meat on the bones';
}
```

## Beta Brain (Precision)

```typescript
interface BetaBrain {
  leadSubBrain: 'reasoning';
  
  focus: ['debug', 'fix', 'patch', 'refactor', 'analyze'];
  
  strengths: [
    'Analytical thinking',
    'Minimal targeted fixes',
    'Root cause isolation'
  ];
  
  weaknesses: [
    'Slower than Alpha',
    'May over-analyze'
  ];
  
  councilRole: 'Problem solver — finds the needle in the haystack';
}
```

## Gamma Brain (Testing)

```typescript
interface GammaBrain {
  leadSubBrain: 'system';
  
  focus: ['test', 'verify', 'audit', 'integration'];
  
  strengths: [
    'Comprehensive coverage',
    'Gate enforcement',
    'Evidence collection'
  ];
  
  weaknesses: [
    'Can be bottleneck',
    'Too strict sometimes'
  ];
  
  councilRole: 'Quality guardian — ensures ship readiness';
}
```

## Council Protocol

### Startup Sync
```
1. All clusters report ready
2. Gamma checks no focus collisions
3. Planning Brain announces sprint focus
4. Alpha/Beta accept task assignments
5. Execution begins
```

### Mid-Sprint Sync
```
1. Beta reports issue (if any)
2. Gamma reports test status
3. Alpha reports build progress
4. Planning Brain adjusts if needed
5. Continue or escalate
```

### End-Sprint Sync
```
1. All clusters report completion
2. Gamma verifies all gates passed
3. System Brain collects evidence
4. Planning Brain archives to Hive
5. Roundtable declares sprint complete
```

## Override Authority

| Scenario | Who Can Override | Override Target |
|----------|-----------------|-----------------|
| Focus collision | System Brain | Both clusters |
| Wrong cluster assignment | System Brain | Tool call |
| Subagent output not retrieved | Execution Brain | Subagent |
| Premature completion claim | System Brain | Any brain |
| Context stale | Planning Brain | Execution Brain |

---
*Last Updated: 2026-04-12*