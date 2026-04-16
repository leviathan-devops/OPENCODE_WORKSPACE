# CURRENT STATE — Kraken v1.1 vs v1.2 Target

## What Works in v1.1

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

## What's Missing for v1.2

### Triple-Brain Orchestrator
- [ ] Planning Brain with T2 Master + T1 Generation
- [ ] Execution Brain with subagent supervision
- [ ] System Brain with L0-L7 firewall
- [ ] Brain-to-brain messenger (priority messaging)
- [ ] Domain ownership state store

### Roundtable Council
- [ ] Alpha cluster brain (steamroll focus)
- [ ] Beta cluster brain (precision focus)
- [ ] Gamma cluster brain (testing focus)
- [ ] Inter-cluster communication
- [ ] Designated lead per domain

### Subagent-Manager Integration
- [ ] Output retrieval as first-class concern
- [ ] Execution Brain override authority
- [ ] Autonomous with supervision model
- [ ] FIRE-AND-FORGET trap prevention

### Context Layers
- [ ] T0 compaction system
- [ ] T1 dynamic generation from SPEC.md
- [ ] T2 Master context (Shark T2 + Kraken extensions)
- [ ] Context preservation across sessions

### System Brain Firewall
- [ ] L0: Kraken Identity Wall
- [ ] L1: Orchestration Theater
- [ ] L2: False Completion
- [ ] L3: Output Inspection
- [ ] L4: Wrong Cluster
- [ ] L5: Macro Derailment
- [ ] L6: Kraken Protection
- [ ] L7: Coordination Gates

---

## Critical v1.1 Failures

### INCIDENT: Fire-and-Forget Pattern
```
What Happened:
- Spawned 5 parallel tasks via spawn_shark_agent
- Tasks reported success: true
- Did NOT retrieve outputs
- Assumed completion = outputs merged

RESULT:
- Outputs trapped in container filesystems
- Build appeared complete but files never merged to host
- Had to re-run entire build

LESSON LEARNED:
- Task completion ≠ outputs on host filesystem
- Must explicitly retrieve and merge
- Output retrieval is MANDATORY, not optional
```

### INCIDENT: No Context Layers
```
What Happened:
- User manually injected context before each task
- No automatic T1 generation from SPEC.md
- T2 library existed but wasn't integrated into Planning Brain
- Context not preserved across compactions

RESULT:
- User had to be "context engineer" for every task
- Planning Brain didn't self-generate context
- Memory grew unbounded without compaction

LESSON LEARNED:
- Need T0/T1/T2 layer separation
- Planning Brain must generate T1 from SPEC automatically
- T0 compaction needed to prevent memory exhaustion
```

### INCIDENT: Single-Brain Bottleneck
```
What Happened:
- One "kraken" agent trying to coordinate all 3 clusters
- No parallel reasoning while executing
- System Brain couldn't watch Execution Brain in real-time
- Derailments caught after-the-fact

RESULT:
- Clusters sat idle while Kraken reasoned
- Errors propagated too late to fix automatically
- No "council" decision-making

LESSON LEARNED:
- Need triple-brain parallel execution
- Planning/Execution/System must run concurrently
- Need Roundtable Council for cluster-level reasoning
```

### INCIDENT: Wrong Cluster Assignment
```
What Happened:
- Debug task assigned to Alpha (steamroll cluster)
- Alpha tried to "steamroll" through debugging
- Precision task got wrong approach
- Beta sat idle

RESULT:
- Task took 3x longer than needed
- Had to re-assign to Beta after Alpha failed
- Wasted Alpha capacity on wrong task type

LESSON LEARNED:
- Need domain designation enforcement
- L4 Wrong Cluster pattern needed
- Alpha=steamroll, Beta=precision, Gamma=testing
```

---

## Build Status

| Component | Status | Notes |
|-----------|--------|-------|
| Context Library | IN PROGRESS | This directory |
| Source Structure | TODO | Create kraken-agent-v1.2/ |
| State Store | TODO | Domain ownership |
| Brain Messenger | TODO | Priority messaging |
| Planning Brain | TODO | T2 Master + T1 Gen |
| Execution Brain | TODO | Supervisor + Override |
| System Brain | TODO | L0-L7 Firewall |
| Alpha Brain | TODO | Steamroll focus |
| Beta Brain | TODO | Precision focus |
| Gamma Brain | TODO | Testing focus |
| Subagent Manager | TODO | Output retrieval |
| Integration | TODO | Wire all together |
| Container Test | TODO | Full system test |

---
*Last Updated: 2026-04-12*