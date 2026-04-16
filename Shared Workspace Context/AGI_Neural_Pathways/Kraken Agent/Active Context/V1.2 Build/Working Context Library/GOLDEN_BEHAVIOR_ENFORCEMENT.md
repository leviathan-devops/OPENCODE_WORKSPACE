# GOLDEN BEHAVIOR ENFORCEMENT — Kraken v1.2

## Core Rules

### Rule 1: OUTPUT RETRIEVAL IS MANDATORY
```
Every task completion requires explicit output retrieval.
Task completion ≠ outputs on host filesystem.
Claim "done" without retrieval = L2_BLOCK.
```

### Rule 2: FIRE-AND-FORGET IS THE ROOT FAILURE
```
Wrong: spawn → success:true → MOVE ON → LOST OUTPUTS
Right: spawn → track → retrieve → verify → MERGE
```

### Rule 3: DOMAIN DESIGNATION IS ENFORCED
```
Alpha = steamroll (build, feature, implement)
Beta = precision (debug, fix, refactor)
Gamma = testing (test, verify, audit)
Wrong cluster = wrong approach = wasted time
```

### Rule 4: PROOF OVER INITIATION
```
Spawning a task ≠ task complete
Assigning to cluster ≠ cluster working
Queuing a task ≠ task in progress
Reporting success ≠ outputs retrieved
```

### Rule 5: KRAKEN PATHS ARE PROTECTED
```
Non-Kraken agents cannot write to Kraken paths.
Kraken SYSTEM zone is read-only.
STATE zone managed by Hive only.
```

---

## Behavioral Rules by Brain

### Planning Brain
- MUST generate T1 from SPEC.md
- MUST maintain T2 Master context loaded
- MUST decompose tasks for cluster assignment
- MUST NOT assign tasks without context injection
- MUST check domain designation before assignment

### Execution Brain
- MUST supervise subagent output retrieval
- MUST catch false completion claims
- MUST track momentum
- MUST trigger override when blocked
- MUST NOT let fire-and-forget happen

### System Brain
- MUST enforce L0-L7 firewall
- MUST evaluate coordination gates
- MUST detect derailments in real-time
- MUST block premature completion
- MUST protect Kraken zones

### Alpha Brain
- MUST focus on steamroll tasks
- MUST NOT attempt precision tasks
- MUST report build progress
- MUST get Gamma approval before declaring done

### Beta Brain
- MUST focus on precision tasks
- MUST NOT attempt steamroll tasks
- MUST isolate root causes
- MUST provide minimal targeted fixes

### Gamma Brain
- MUST focus on testing tasks
- MUST enforce all gates
- MUST collect evidence
- MUST verify outputs on host

### Subagent-Manager
- MUST retrieve outputs after task completion
- MUST verify host filesystem
- MUST merge outputs before reporting complete
- MUST ask permission for major decisions
- MUST acknowledge override authority

---

## Pattern Enforcement

### L0: Identity Wall
- Block non-Kraken agents from Kraken paths
- Allow Kraken agents to work
- Never block read operations

### L1: Orchestration Theater
- Block "assigned = complete"
- Block "spawned = done"
- Block "queued = in progress"
- Allow status checks with evidence

### L2: False Completion
- Block completion without retrieval
- Block merge without outputs
- Block success claim without host verification

### L3: Output Inspection
- Verify expected files exist on host
- Never trust container filesystem alone
- Always double-check retrieved paths

### L4: Wrong Cluster
- Alpha gets steamroll tasks
- Beta gets precision tasks
- Gamma gets testing tasks
- Block mismatched assignments

### L5: Macro Derailment
- Block focus collisions
- Block planner-executor desync
- Block stale context
- Block premature completion

### L6: Kraken Protection
- SYSTEM zone never modified
- CONFIG zone via tools only
- STATE zone managed by Hive

### L7: Coordination Gates
- task-assignment-gate before execution
- output-retrieval-gate before merge
- roundtable-sync-gate before next sprint

---

## Override Authority Matrix

| Override Scenario | Authority | Target | Action |
|-------------------|-----------|--------|--------|
| Output not retrieved | Execution | Subagent | retrieve_outputs |
| Focus collision | System | Both clusters | abort_and_reassign |
| Wrong cluster | System | Tool call | block_spawn |
| Premature completion | System | Any brain | block_completion |
| Context stale | Planning | Execution | compact_and_retry |
| Subagent error | Execution | Subagent | abort_and_restart |

---

## Anti-Patterns (BLOCKED)

### Fire-and-Forget
```typescript
// BLOCKED
spawn_shark_agent({...}).then(() => moveOn());

// CORRECT
const result = await spawn_shark_agent({...});
await trackTask(result.taskId);
const outputs = await retrieve_outputs({ taskId: result.taskId });
await verifyOutputs(outputs);
await mergeOutputs(outputs);
```

### Theater Completion
```typescript
// BLOCKED
if (task.status === 'complete') { /* done */ }

// CORRECT
if (task.status === 'complete' && task.outputsRetrieved && task.verifiedOnHost) {
  /* actually done */
}
```

### Wrong Domain
```typescript
// BLOCKED
spawn_shark_agent({ task: 'debug this', clusterId: 'cluster-alpha' });

// CORRECT
spawn_shark_agent({ task: 'debug this', clusterId: 'cluster-beta' });
```

### Premature Done
```typescript
// BLOCKED
report_to_kraken({ status: 'complete' });

// CORRECT
report_to_kraken({ 
  status: 'complete', 
  outputsRetrieved: true, 
  gatesPassed: ['test-gate', 'build-gate'] 
});
```

---

## State Transitions

### Task State Machine
```
PENDING → IN_PROGRESS → COMPLETED
    ↓            ↓            ↓
    └────────────┴── BLOCKED ←┘
              ↓
         Must pass output-retrieval-gate
```

### Cluster State Machine
```
OFFLINE → ONLINE → ASSIGNED → WORKING → REPORTING
    ↑                         ↓
    └───── CANNOT ASSIGN ──────┘
    (focus collision or offline)
```

### Brain State Machine
```
UNINITIALIZED → INITIALIZING → RUNNING → ERROR
        ↓                ↓           ↓
        └──── MUST NOT EXECUTE ────┘
```

---

## Evidence Requirements

### For Completion Claim
```json
{
  "taskId": "xyz",
  "status": "complete",
  "evidence": {
    "outputs-retrieved": true,
    "files-on-host": true,
    "merge-complete": true,
    "gate-passed": ["test-gate"]
  }
}
```

### For Gate Passage
```json
{
  "gateId": "output-retrieval-gate",
  "passed": true,
  "criteria": {
    "outputs-retrieved": true,
    "files-verified": true,
    "merge-prepared": true
  },
  "evidence": {
    "fileCount": 5,
    "hostPathsConfirmed": true
  }
}
```

---

## Golden Metrics

| Metric | Target | Blocked If |
|--------|--------|-----------|
| Output retrieval rate | 100% | Any task complete without retrieval |
| Host filesystem verification | 100% | Any output not verified on host |
| Domain designation match | 100% | Any wrong cluster assignment |
| Gate criteria passed | 100% | Any gate skipped |
| Kraken zone violations | 0 | Any SYSTEM/CONFIG/STATE modification |

---
*Last Updated: 2026-04-12*