# KRAKEN ENGINEER — WORKING CONTEXT V1.2

## Purpose
This directory contains the active working context for building Kraken v1.2 multi-brain architecture.

## Context Files

| File | Purpose |
|------|---------|
| `01_ARCHITECTURE_OVERVIEW.md` | Complete system architecture (L0-L7 layers) |
| `02_CURRENT_STATE.md` | What works in v1.1, what's missing for v1.2 |
| `03_PATTERNS_REFERENCE.md` | All Kraken orchestration patterns |
| `04_IMPLEMENTATION_GUIDE.md` | Step-by-step implementation with code examples |
| `05_TESTING_WORKFLOWS.md` | How testing works, container testing, evidence |
| `06_V1.2_MULTI_BRAIN_INTEGRATION.md` | Critical brain architecture to implement |
| `07_BUILD_PLAN_PARALLEL.md` | Parallel execution plan (cluster distribution) |
| `08_SUCCESS_CRITERIA.md` | Ship gate requirements, verification |
| `09_FULL_LAYER_BUILD_SPEC.md` | Complete L0-L7 specifications with code |
| `10_COMPLETE_BUILD_PLAN.md` | Phase-by-phase build workflow |
| `11_INCIDENT_ANALYSIS.md` | Lessons from v1.1 failures + fire-and-forget trap |
| `12_ROUNDTABLE_COUNCIL.md` | Alpha/Beta/Gamma cluster brain coordination |
| `13_SUBAGENT_MANAGER_BRAIN.md` | Subagent-manager autonomy + override authority |
| `GOLDEN_BEHAVIOR_ENFORCEMENT.md` | Behavioral rules for all brains |

## Key Principles

1. **Orchestration Proof > Initiation** — Every task requires proof of completion, not just start
2. **Mechanical Enforcement > Text Matching** — 90% mechanical, 10% text
3. **Cluster Sharks Have Their Own Firewalls** — Kraken's L0-L7 is about ORCHESTRATION integrity
4. **toolArgs ONLY** — Never check agentMessage or output
5. **Output Retrieval is First-Class** — FIRE-AND-FORGET is the root failure

## Design Decisions (from user input)

| Decision | Choice |
|----------|--------|
| **Council Logic** | Designated lead per domain (Alpha=steamroll, Beta=precision, Gamma=testing) |
| **Subagent-Manager** | Autonomous with Execution Brain override authority |
| **Planning Context** | Dynamic SPEC-driven (T1) + Hardcoded Master Context (T2) |
| **L0 Scope** | Block non-kraken agents from Kraken paths |
| **L1-L7 Scope** | Orchestration integrity patterns (not code quality) |

## Build Target

**Project:** `/home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2`  
**Status:** Planning, starting context library
**Architecture:** Triple-brain orchestrator + Roundtable Council + Subagent-Manager

## Critical Rules (From Incident Analysis)

### FIRE-AND-FORGET IS THE ROOT FAILURE
```
WRONG: spawn_shark_agent → task.success = true → MOVE ON
RIGHT: spawn_shark_agent → get_cluster_status → retrieve_outputs → MERGE → VERIFY
```

### OUTPUT RETRIEVAL IS MANDATORY
- Task completion ≠ outputs on host filesystem
- Must explicitly retrieve and merge
- Verify outputs exist before declaring success

### CLUSTER DOMAIN DESIGNATION
```
Alpha Cluster = steamroll builds (from-scratch, new-feature)
Beta Cluster = precision tasks (debug, fix, refactor)
Gamma Cluster = testing/verification (test, audit, integration)
```

### CONTEXT LAYERS (T0/T1/T2)
```
T0: Active Working Context (session messages, tool calls) — self-managed via compactions
T1: Active Project Context (SPEC.md, project files, task context) — dynamically generated
T2: Master Context (Shark T2 + Kraken extensions) — pre-loaded into Planning Brain
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    KRAKEN ORCHESTRATOR BRAIN                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  PLANNING   │  │  EXECUTION  │  │   SYSTEM    │                      │
│  │   BRAIN     │  │   BRAIN    │  │   BRAIN     │                      │
│  │ (T2 Master) │  │(Supervisor)│  │ (Firewall)  │                      │
│  └──────┬──────┘  └──────┬─────┘  └──────┬─────┘                      │
│         │                │                │                             │
│         └────────────────┼────────────────┘                             │
│                          │                                              │
│         ┌────────────────┼────────────────┐                            │
│         │      ROUNDTABLE COUNCIL          │                            │
│         ▼                ▼                ▼                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │
│  │   ALPHA     │  │    BETA     │  │   GAMMA     │                     │
│  │  (Steamroll)│  │ (Precision)│  │  (Testing)  │                     │
│  │  Cluster    │  │  Cluster   │  │  Cluster    │                     │
│  └─────────────┘  └─────────────┘  └─────────────┘                     │
│                          │                                              │
│              ┌───────────┴───────────┐                                  │
│              │  SUBAGENT-MANAGER    │                                  │
│              │    (Autonomous)      │                                  │
│              └──────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Next Steps

1. [x] Deploy kraken-agent-v1.1 with hotfix agents
2. [ ] Create full context library (this directory)
3. [ ] Create v1.2 source directory structure
4. [ ] Implement shared/state-store.ts
5. [ ] Implement shared/brain-messenger.ts
6. [ ] Implement shared/evidence-collector.ts
7. [ ] Implement Planning Brain
8. [ ] Implement Execution Brain
9. [ ] Implement System Brain (L0-L7 firewall)
10. [ ] Implement Roundtable Council
11. [ ] Wire Subagent-Manager into Execution Brain
12. [ ] Container test full system

---
*Last Updated: 2026-04-12*