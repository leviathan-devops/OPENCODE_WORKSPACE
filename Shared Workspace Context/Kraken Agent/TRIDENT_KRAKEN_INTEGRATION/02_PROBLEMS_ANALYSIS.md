# TRIDENT-KRAKEN INTEGRATION — PROBLEMS ANALYSIS

**Version:** 1.0  
**Date:** 2026-04-13

---

## V2.0 Problems (Surface → Root Mapping)

| Surface Problem | Root Cause | Trident Fix |
|-----------------|------------|-------------|
| "V2.0 is broken" | Fake execution (100ms timeout) | Code Review Mode L2 |
| "Tasks complete but no outputs" | Fire-and-forget pattern | Problem Solving Mode 6-gate |
| "No deep planning" | Planning Brain just assigns tasks | Deep Planning Mode 3-gate |
| "Compaction loses context" | Disconnected compaction system | Context Synthesis Mode 4-layer |

---

## Problem 1: FAKE EXECUTION

**V2.0 Code:**
```typescript
private async simulateTaskExecution(...): Promise<KrakenDelegationResult> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true, status: 'completed' });
    }, 100);
  });
}
```

**Detection via Code Review Mode:**
```
Layer 2: Execution Verification

SimulatedExecutionDetector:
  Pattern: `setTimeout.*resolve.*success`
  Action: Flag as SIMULATED EXECUTION

PlaceholderCommentDetector:
  Pattern: `// In v1, we just return`
  Action: Flag as PLACEHOLDER

BundleSizeDetector:
  Pattern: size < 50% of previous version
  Action: Flag as SUSPICIOUS REDUCTION

DeadCodeDetector:
  Pattern: Functions that never call real systems
  Action: Flag as DEAD CODE
```

**Why V1.2 Worked:**
V1.2 had `run_subagent_task()` → Python wrapper → Docker container spawning. Real execution.

**Why V2.0 Failed:**
Replaced real execution with 100ms timeout. No one noticed because tests never tested actual execution.

---

## Problem 2: FIRE-AND-FORGET

**V2.0 Flow:**
```
spawn_cluster_task("build foo")
  → success returned
  → MOVE ON
  → Outputs never retrieved
  → Container filesystem contains outputs, but host doesn't
```

**Discovery:**
Parallel tasks completed successfully but outputs stayed in container filesystems. Orchestrator marked complete without retrieving outputs.

**Detection via Problem Solving Mode:**
```
GATE 1: ASSUMPTION
"Task will complete and outputs will be retrievable"
→ Explicit statement that outputs MUST be retrievable

GATE 3: OBSERVATION
"Show fs.existsSync() for each declared output"
→ Cannot skip, must show evidence

GATE 6: VERIFICATION
"Execute claimRetrieved() - prove outputs exist"
→ Mechanical verification, not trust
```

**Original V2.0 Mechanical Output Verification (Good):**
```typescript
class OutputVerifier {
  registerOutputs(taskId, outputs)  // Declares expected outputs
  claimRetrieved(taskId, paths)    // Requires fs.existsSync()
  canComplete(taskId): boolean      // False if checkpoints unverified
}
```

**Problem:** The OutputVerifier existed but was never CALLED. Fire-and-forget bypassed it entirely.

---

## Problem 3: NO DEEP PLANNING

**V2.0 Planning Brain:**
```typescript
// Planning Brain just assigns tasks
assignTask(request: KrakenDelegationRequest) {
  // No first principles analysis
  // No component decomposition
  // Just passes task to cluster
  this.delegationEngine.delegate(request);
}
```

**What Should Happen (Deep Planning Mode):**
```
GATE 1: INITIAL PLAN
├── "What is the CORE problem?"
├── "What 3 principles govern this?"
└── "What would make this succeed or fail?"

GATE 2: BUILD WORKFLOW
├── "5+ components identified"
├── "Critical path sequenced"
└── "3+ failure risks + verification per component"

GATE 3: CONTEXT LIBRARY
└── Output: INJECTABLE REASONING CHAIN
```

**Result:** Execution Brain receives structured reasoning, not just task description.

---

## Problem 4: DISCONNECTED COMPACTION

**V2.0 Four-Tier Compaction (Exists But Not Integrated):**
```
Tier 0 (65%): Proactive token management
Tier 1 (75%): Pre-compaction export
Tier 2 (85%): Post-compaction synthesis
Tier 3: Dynamic injection
```

**Problem:** Compaction is survival mechanism, not active problem-solving tool. No integration with Execution Brain's problem-solving loop.

**Context Synthesis Mode Fix:**
```
L1: COLLECTION (T1-T4 sources)
L2: SCORING (urgency × 0.6 + importance × 0.4)
L3: COMPRESSION (<2k tokens)
L4: INJECTION (T0-ready stream)
```

**Result:** Context injection happens DURING problem-solving, not just when about to die.

---

## Cross-Domain Pattern Mapping

| Failure Category | Source | Detection | Pattern |
|-----------------|--------|-----------|---------|
| SIMULATED EXECUTION | Kraken V2.0 | `setTimeout.*resolve.*success` | Trust-based fake |
| HOOK SPILLOVER | Manta V4.5 | `isXxxAgent()` guard check | Agent isolation |
| VERIFICATION THEATER | Hive Mind | 373 tests passing, core broken | Tests ≠ function |
| SILENT ERROR SWALLOWING | Multiple | `catch {}` AST analysis | Silent failures |
| RESOURCE LEAKS | Shark agent | Memory/token bloat | No cleanup |
| FIREWALL BYPASS | Spider agent | Rule scope analysis | Over-blocking |

---

## Root Cause Analysis

**All V2.0 problems share ONE root cause:**

> **TRUST-BASED SYSTEMS, NOT EVIDENCE-BASED**

| Trust-Based (V2.0) | Evidence-Based (Trident) |
|---------------------|--------------------------|
| "Task completed" | "fs.existsSync() proves output exists" |
| "Agent is initialized" | "Hook fired with proof" |
| "Tests passed" | "Code Review Mode validated execution" |
| "Output retrieved" | "claimRetrieved() mechanical check" |
| "Gateway safe" | "Structural requirements satisfied" |

---

## What Needs to Change

| Component | Change Required |
|-----------|----------------|
| System Brain | Add Code Review Mode pre-validation |
| Execution Brain | Add 6-gate evidence loop, call OutputVerifier |
| Planning Brain | Replace task assignment with 3-gate Deep Planning |
| Context Engine | Integrate Context Synthesis Mode as active layer |
| Council | Reconfigure Alpha/Beta/Gamma with Trident modes |

---

## Anti-Derailment Checklist

- [ ] Pre-execution: Code Review Mode validates no simulated execution
- [ ] Pre-execution: Bundle size check (flag <50% reduction)
- [ ] Pre-execution: Hook spillover detection
- [ ] Execution: G1 assumption explicit before any action
- [ ] Execution: G3 observation shows ACTUAL evidence
- [ ] Execution: G6 verification proves outputs mechanically
- [ ] Output: OutputVerifier.claimRetrieved() called for every task
- [ ] Planning: G1 core problem identified before decomposition
- [ ] Planning: G3 injectable reasoning chain generated
- [ ] Context: L1-L4 synthesis runs on active task, not just compaction