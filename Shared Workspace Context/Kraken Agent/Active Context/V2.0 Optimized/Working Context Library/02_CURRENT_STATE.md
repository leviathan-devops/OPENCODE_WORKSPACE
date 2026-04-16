# CURRENT STATE — V1.2 vs V2.0 Target

## What Works in V1.1/V1.2

### Core Infrastructure
- [x] Plugin loads in OpenCode
- [x] 3 clusters configured (Alpha, Beta, Gamma)
- [x] Cluster load balancing via ClusterScheduler
- [x] Focus anchoring (cluster → project focus mapping)
- [x] Hotfix Shark/Manta agents working (separate plugins)

### Tools
- [x] `spawn_cluster_task` — Task queuing works
- [x] `spawn_shark_agent` / `spawn_manta_agent` — Agent spawning works
- [x] `anchor_cluster` — Focus anchoring works
- [x] `kraken-status` — Cluster status reporting
- [x] `subagent-manager` tools — Container execution available

### Context
- [x] T2 reference library (kraken-context/T2_*.md)
- [x] Shark/Manta have read-only T2 access
- [x] `report_to_kraken` — Agent communication works

---

## What's New in V2.0

### V2.0 Optimizations (NOT in V1.2)

| Optimization | Description | Status |
|--------------|-------------|--------|
| **Two-Layer Firewall** | Tool enforcement + Message enforcement | NEW |
| **Mechanical Output Verification** | fs.existsSync() checkpoint, not trust | NEW |
| **Structured Override Commands** | Typed schema, not natural language | NEW |
| **Explicit Gate Entry Criteria** | Per-brain criteria for gate advancement | NEW |
| **Interpretation Verification** | Message confidence scoring | NEW |

### Triple-Brain Orchestrator
- [ ] Planning Brain with T2 Master + T1 Generation
- [ ] Execution Brain with subagent supervision
- [ ] System Brain with **Two-Layer Firewall**
- [ ] Brain-to-brain messenger (structured schema)
- [ ] Domain ownership state store

### Roundtable Council
- [ ] Alpha cluster brain (steamroll focus)
- [ ] Beta cluster brain (precision focus)
- [ ] Gamma cluster brain (testing focus)
- [ ] Inter-cluster communication
- [ ] Designated lead per domain

### Subagent-Manager Integration
- [ ] **Output Checkpoint System** (V2.0 NEW)
- [ ] Execution Brain override authority
- [ ] Autonomous with supervision model
- [ ] FIRE-AND-FORGET trap prevention

### Context Layers
- [ ] T0 compaction system
- [ ] T1 dynamic generation from SPEC.md
- [ ] T2 Master context (Shark T2 + Kraken extensions)
- [ ] Context preservation across sessions

### System Brain Firewall (V2.0 ENHANCED)

| Layer | V1.2 | V2.0 |
|-------|------|------|
| L0 | Kraken Identity Wall | Unchanged |
| L1 | Orchestration Theater | Unchanged |
| L2 | False Completion | **Mechanical verification** |
| L3 | Output Inspection | **Checkpoint system** |
| L4 | Wrong Cluster | Unchanged |
| L5 | Macro Derailment | Unchanged |
| L6 | Kraken Protection | Unchanged |
| L7 | Coordination Gates | **Explicit criteria** |
| **NEW** | — | **Message-layer enforcement** |

---

## Critical Failures Addressed by V2.0

### V1.2 Incident: Trust-Based Output Retrieval

```
What Happened (V1.2 Plan):
- Subagent reports "outputs retrieved"
- Execution Brain trusts claim
- No mechanical verification

V2.0 Fix:
- Output Checkpoint System
- Every output has hostPath + verified boolean
- fs.existsSync() required before claiming complete
```

### V1.2 Incident: Natural Language Override

```
What Happened (V1.2 Plan):
- Override message: "ABORT - you claimed success without outputs"
- Subagent interprets: "User wants me to abort"
- Asks permission: "Can I abort?"
- Execution Brain: "YES"
- But original intent was about OUTPUTS, not abort authority

V2.0 Fix:
- Structured Override Command Schema
- action: 'CLAIM_COMPLETE' with constraints
- No interpretation ambiguity
```

### V1.2 Incident: Gate Sync Ambiguity

```
What Happened (V1.2 Plan):
- "All 3 brains run concurrently, sync at gates only"
- When is TEST gate "reached"?
- Planning generating T2, Execution supervising Alpha, System watching

V2.0 Fix:
- Explicit Gate Entry Criteria
- TEST gate requires:
  - Planning: T1 test plan generated
  - Execution: Alpha claims build complete
  - System: ContainerTestResult.json exists with passRate >= 0.96
- ALL THREE must be true simultaneously
```

---

## V2.0 Build Target

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v2.0`  
**Status:** Planning complete, context library ready  
**Architecture:** V1.2 triple-brain + V2.0 optimizations

---

## What's Different in Code

### V1.2: Trust-Based Completion

```typescript
// V1.2
function handleTaskComplete(taskId: string) {
  if (subagent.reportsComplete(taskId)) {
    markTaskComplete(taskId); // TRUST-BASED
  }
}
```

### V2.0: Mechanical Verification

```typescript
// V2.0
function handleTaskComplete(taskId: string) {
  const outputs = subagent.getDeclaredOutputs(taskId);
  
  for (const output of outputs) {
    if (!fs.existsSync(output.hostPath)) {
      throw new Error(
        `L2_OUTPUT_NOT_RETRIEVED: ${output.containerPath} → ${output.hostPath}`
      );
    }
    output.verified = true;
  }
  
  markTaskComplete(taskId); // MECHANICAL
}
```

---

## V2.0 Critical Rules

### Rule 1: MECHANICAL OVER TRUST

```
V1.2: "Subagent must retrieve outputs" (trust-based)
V2.0: "Every declared output must fs.existsSync() on host" (mechanical)
```

### Rule 2: STRUCTURED OVER NATURAL

```
V1.2: Override messages in natural language
V2.0: Override commands with typed schema
```

### Rule 3: EXPLICIT OVER IMPLICIT

```
V1.2: "Sync at gates" (whenever seems right)
V2.0: "Gate criteria: A must be true, B must be true, C must be true" (explicit)
```

### Rule 4: VERIFIED OVER ASSUMED

```
V1.2: Message interpretation assumed correct
V2.0: Message parsed, confidence checked, verified flag required
```

---

*End of Current State*