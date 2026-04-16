# Incident Analysis — v1.1 Failures

## INCIDENT 001: Fire-and-Forget Pattern

**Date:** 2026-04-11  
**Severity:** CRITICAL  
**Impact:** Build appeared complete but outputs trapped in containers

### What Happened
1. Spawned 5 parallel tasks via `spawn_shark_agent`
2. Tasks reported `success: true`
3. Did NOT call `retrieve_outputs`
4. Assumed completion = outputs merged to host
5. Moved on to next phase

### Root Cause
No enforcement that output retrieval MUST happen after task completion.  
System trusted subagent's "success" claim without verifying outputs.

### Lesson Learned
```
FIRE-AND-FORGET IS THE ROOT FAILURE.

Task completion in container ≠ outputs on host filesystem.

Must explicitly retrieve and merge.
Output retrieval is MANDATORY, not optional.
```

### Fix in v1.2
- L2 False Completion pattern: Block claims of completion without retrieval
- L3 Output Inspection pattern: Verify outputs exist on host filesystem
- System Brain enforces output-retrieval-gate before merge phase

---

## INCIDENT 002: Single-Brain Bottleneck

**Date:** 2026-04-11  
**Severity:** HIGH  
**Impact:** Clusters sat idle while Kraken reasoned sequentially

### What Happened
1. One "kraken" agent trying to coordinate all 3 clusters
2. No parallel reasoning while executing
3. System Brain couldn't watch Execution Brain in real-time
4. Errors caught after-the-fact, too late to fix automatically

### Root Cause
Single-brain architecture. No triple-brain parallel execution.

### Lesson Learned
```
One brain cannot both reason AND execute simultaneously.
Planning takes 30-60s during which execution sits idle.
Need triple-brain parallel execution.
```

### Fix in v1.2
- Planning Brain: reasons, generates context
- Execution Brain: executes, supervises subagents
- System Brain: watches all domains in real-time
- All 3 run concurrently, sync at gates only

---

## INCIDENT 003: Wrong Cluster Assignment

**Date:** 2026-04-11  
**Severity:** MEDIUM  
**Impact:** Task took 3x longer than needed

### What Happened
1. Debug task assigned to Alpha (steamroll cluster)
2. Alpha tried to "steamroll" through debugging
3. Precision task got wrong approach
4. Beta sat idle
5. Had to re-assign to Beta after Alpha failed

### Root Cause
No domain designation enforcement. Any cluster could get any task type.

### Lesson Learned
```
Clusters have designated domains:
Alpha = steamroll (from-scratch, build)
Beta = precision (debug, fix, refactor)
Gamma = testing (verify, audit)

Wrong cluster = wrong approach = wasted time
```

### Fix in v1.2
- L4 Wrong Cluster pattern: Block task→wrong cluster assignment
- `spawn_shark_agent` with debug task → must go to Beta
- `spawn_shark_agent` with build task → must go to Alpha

---

## INCIDENT 004: No Context Layers

**Date:** 2026-04-11  
**Severity:** MEDIUM  
**Impact:** Manual context injection required for every task

### What Happened
1. User manually injected context before each task
2. No automatic T1 generation from SPEC.md
3. T2 library existed but not integrated into Planning Brain
4. Context not preserved across compactions

### Root Cause
No T0/T1/T2 layer separation. Memory grew unbounded.

### Lesson Learned
```
T0: Active working context (session) — self-managed via compactions
T1: Active project context (SPEC.md) — dynamically generated
T2: Master context (Shark T2 + Kraken) — pre-loaded, never lost

Need layer separation + compaction
```

### Fix in v1.2
- Planning Brain generates T1 from SPEC.md automatically
- T0 compaction system preserves context across sessions
- T2 always available, never affected by compaction

---

## INCIDENT 005: Focus Collision

**Date:** 2026-04-11  
**Severity:** LOW  
**Impact:** Two clusters working on same focus area

### What Happened
1. anchor_cluster called multiple times for same focus
2. No collision detection
3. Two clusters claimed same project

### Root Cause
No focus collision detection in ClusterScheduler.

### Lesson Learned
```
Focus anchors must be unique:
One focus → One cluster
No sharing, no overlapping
```

### Fix in v1.2
- L5.1 Focus Collision pattern: Block duplicate anchors
- System Brain monitors focusAnchors map
- Throws if two clusters anchor to same focus

---

## Golden Data

### Fire-and-Forget Trace
```
spawn_shark_agent({task: "build feature X"})
  → returns {success: true, taskId: "xyz"}  ← CONTAINER success
  
get_cluster_status({taskId: "xyz"})
  → returns {state: "completed"}  ← CONTAINER completed
  
// WRONG: Assumed outputs on host here
// RIGHT: Must call retrieve_outputs

retrieve_outputs({taskId: "xyz"})
  → returns {files: ["/tmp/build/output.js"]}  ← ACTUAL host files
  
// Now safe to merge
```

### Wrong Cluster Trace
```
spawn_shark_agent({task: "debug error in API handler", clusterId: "cluster-alpha"})
  → BLOCKED by L4 Wrong Cluster
  → Task type "debug" should go to cluster-beta

// CORRECT:
spawn_shark_agent({task: "debug error in API handler", clusterId: "cluster-beta"})
  → Accepted, Beta precision brain handles debug task
```

### Output Retrieval Enforcement
```
report_to_kraken({taskId: "xyz", status: "complete"})
  → BLOCKED by L2 False Completion
  → Task claims complete but outputs not retrieved

// Must retrieve first:
retrieve_outputs({taskId: "xyz"})
  → returns {files: [...]}

// Then report:
report_to_kraken({taskId: "xyz", status: "complete", outputsRetrieved: true})
  → Accepted
```

---
*Last Updated: 2026-04-12*