# SHARK AGENT V4 — Shark Variants Reference

**Purpose:** T2 reference for Shark Micro vs Shark Macro comparison
**Usage:** Loaded on-demand via read_file, zero prompt overhead

---

## At a Glance

| Aspect | Shark Micro | Shark Macro |
|--------|-------------|-------------|
| **Brains** | 2 (Plan + Build) | 3 (Execution + Reasoning + System) |
| **Execution** | Sequential handoff | Parallel peer race |
| **Context** | Firewalled T1/T2 | Dynamic T1/T2 bridge |
| **Enforcement** | Coordinator + Guardian | System Brain active watchdog |
| **Complexity** | Simple, proven | Advanced, maximum parallelism |
| **Model coupling** | None (model-agnostic) | None (model-agnostic) |
| **Best for** | Standard builds | Complex/long builds |

---

## Shark Micro (Dual-Brain)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PLAN BRAIN                                                      │
│  ├── Role: Reasoning, planning, analysis                         │
│  ├── Context: T1 (identity + thinking) + T2 (full reference)    │
│  ├── Owns: plan-state, SPEC.md                                  │
│  └── Behavior: Strategic, reviews output                        │
│                                                                  │
│         ▲                                                        │
│         │ context-firewalled                                     │
│         │ (conscious overlap only)                              │
│         ▼                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ COORDINATOR (mechanical switch)                             │ │
│  │ - Flips between Plan/Build based on gate signals            │ │
│  │ - NOT agent-driven ("decide when to switch")               │ │
│  │ - HARD ENFORCEMENT: cannot be bypassed                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│         ▲                                                        │
│         │ context-firewalled                                     │
│         ▼                                                        │
│  BUILD BRAIN                                                     │
│  ├── Role: Execution, implementation                             │
│  ├── Context: T1 only (clean, no T2 by default)                │
│  ├── Owns: execution-state, artifact                            │
│  └── Behavior: Mechanical, precise, no reasoning                │
│                                                                  │
│  GUARDIAN                                                        │
│  └── Enforces scope, blocks zone violations                     │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Plan Brain activates**
   - Analyzes requirements
   - Generates SPEC.md
   - Defines scope
   - Coordinator detects "spec-complete" signal

2. **Mechanical switch**
   - Coordinator flips from Plan → Build
   - Build Brain T1 loaded (clean)
   - Plan Brain context suspended

3. **Build Brain executes**
   - Reads SPEC.md
   - Implements exactly what spec says
   - Guardian blocks scope violations
   - Coordinator detects "build-complete" signal

4. **Mechanical switch**
   - Coordinator flips from Build → Plan (review)
   - Plan Brain reviews output
   - Gates verified
   - Loop until all gates pass

5. **Delivery**
   - Plan Brain handles delivery
   - Evidence archived
   - Checkpoint created

### When to Use Shark Micro

- **Standard builds** — Web apps, simple APIs, CLI tools
- **Proven workflow** — Sequential is predictable, debuggable
- **Low complexity** — When you know what you're building
- **Teaching/learning** — Easier to trace what happened

### When NOT to Use Shark Micro

- **Complex orchestration** — Multi-file architecture with dependencies
- **Long-running builds** — 30+ minute builds where idle time matters
- **Unknown unknowns** — When Execution Brain might need context it doesn't have
- **Maximum speed** — When you want zero idle time

---

## Shark Macro (Triple-Brain Parallel Peer)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │ EXECUTION BRAIN   │  │  REASONING BRAIN  │  │  SYSTEM BRAIN     │  │
│  │                   │  │                   │  │                   │  │
│  │ Role: Primary     │  │ Role: 2nd Brain / │  │ Role: Watchdog /  │  │
│  │ autonomous agent  │  │ Context Bridge   │  │ Enforcer          │  │
│  │                   │  │                   │  │                   │  │
│  │ Owns:            │  │ Owns:            │  │ Owns:            │  │
│  │ execution-state  │  │ thinking-state   │  │ workflow-state   │  │
│  │ quality-state   │  │ context-bridge  │  │ security-state   │  │
│  │                   │  │                   │  │                   │  │
│  │ Reads:           │  │ Reads:           │  │ Reads:           │  │
│  │ plan-state       │  │ ALL (read-only)  │  │ ALL (read-only)  │  │
│  │ thinking-state   │  │                   │  │                   │  │
│  │ (from Reasoning) │  │                   │  │                   │  │
│  │                   │  │                   │  │                   │  │
│  │ Priority: 100     │  │ Priority: 90     │  │ Priority: 80     │  │
│  │ (highest)        │  │                   │  │ (lowest)         │  │
│  │                   │  │                   │  │                   │  │
│  │ Behavior:        │  │ Behavior:        │  │ Behavior:        │  │
│  │ Aggressive       │  │ Analytical       │  │ Defensive        │  │
│  │ steamroll        │  │ on-demand        │  │ enforce          │  │
│  │                   │  │                   │  │                   │  │
│  └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘  │
│            │                       │                       │            │
│            │         ┌─────────────┼─────────────┐         │            │
│            │         │             │             │         │            │
│            ▼         ▼             ▼             ▼         ▼            │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                     STATE STORE                                │     │
│  │  Domain Ownership: Each brain writes to its domain            │     │
│  │  Read Access: All brains read all domains (read-only)         │     │
│  │                                                               │     │
│  │  ┌─────────────────────────────────────────────────────┐    │     │
│  │  │ execution-state  │ thinking-state │ workflow-state  │    │     │
│  │  │ quality-state    │ context-bridge │ security-state │    │     │
│  │  └─────────────────────────────────────────────────────┘    │     │
│  └───────────────────────────────────────────────────────────────┘     │
│            │                       │                       │            │
│            ▼                       ▼                       ▼            │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                   BRAIN MESSENGER                               │   │
│  │  Priority signals: critical > high > normal > low             │   │
│  │  System Brain → Execution: "gate failed, pause and fix"       │   │
│  │  Reasoning → Execution: context injection                      │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  GATES (only synchronization point — all brains race until criteria met) │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Initialization**
   - All three brains loaded with T1
   - Reasoning Brain also has T2 (full reference)
   - StateStore initialized with domain ownership
   - BrainMessenger initialized
   - Guardian configured

2. **The Race Begins**
   - All three brains start simultaneously
   - **Execution Brain**: Steamrolls build, owns execution-state
   - **Reasoning Brain**: Monitors, detects gaps, synthesizes context, auto-debugs
   - **System Brain**: Watches all domains, enforces gates, catches derailments

3. **Context Injection (Reasoning → Execution)**
   ```
   Reasoning Brain observes:
     "Execution is struggling with Docker networking error"
     
   Reasoning Brain acts:
     → Gets T2 docker-patterns.md from knowledge base
     → Synthesizes: specific error + known fix
     → Writes to thinking-state
     
   Execution Brain reads:
     → Sees injected context
     → Continues with new knowledge
   ```

4. **Derailment Correction (System → Execution)**
   ```
   System Brain observes:
     "Execution is adding feature not in SPEC.md (scope creep)"
     
   System Brain acts:
     → Sends priority message: CRITICAL
     → Blocks execution of out-of-scope work
     → Execution Brain pauses
     → Execution corrects course
     
   System Brain re-evaluates:
     → If corrected: continue racing
     → If not: escalate to human
   ```

5. **Gate Synchronization**
   - All brains race until gate criteria must be evaluated
   - System Brain evaluates gate criteria
   - If criteria NOT met: BLOCK phase transition
   - All brains keep working until criteria met
   - If criteria ARE met: gate opens, all continue racing

### When to Use Shark Macro

- **Complex builds** — Microservices, complex architecture, unknown unknowns
- **Long-running** — Where idle time = significant waste
- **Maximum parallelism** — When you want all brains working
- **Self-healing** — When Execution needs dynamic context help
- **Active enforcement** — When you need real-time derailment correction

### When NOT to Use Shark Macro

- **Simple projects** — Overhead not worth it
- **Debugging required** — Harder to trace 3 brains vs 2
- **Limited resources** — Three brains = more compute
- **Sequential thinking** — Parallel model doesn't fit

---

## Side-by-Side Comparison

### Execution Model

| Aspect | Micro | Macro |
|--------|-------|-------|
| Brain count | 2 | 3 |
| Handoff style | Sequential (switch) | Parallel (race) |
| Execution brain idle during planning | Yes | No |
| Context management | Static (firewall) | Dynamic (injection) |
| Enforement | Coordinator + Guardian | System Brain active watchdog |

### Context Flow

| Aspect | Micro | Macro |
|--------|-------|-------|
| Plan Brain T1 | Loaded | N/A |
| Build Brain T1 | Clean slate | N/A |
| Execution Brain T1 | N/A | Clean + injected |
| Reasoning Brain | N/A | Manages T2 synthesis |
| System Brain | N/A | Enforces T1/T2 |

### Gate Handling

| Aspect | Micro | Macro |
|--------|-------|-------|
| Gate evaluation | Plan Brain | System Brain |
| Gate blocking | Coordinator | System Brain |
| Auto-debug | N/A | Reasoning Brain |
| Escalation | Plan Brain | System Brain |

### Complexity

| Aspect | Micro | Macro |
|--------|-------|-------|
| Setup complexity | Low | Medium |
| Runtime complexity | Low | High |
| Debugging complexity | Low | Medium-High |
| Traceability | High | Medium |

---

## Choosing Between Variants

```
START WITH: Shark Micro

UPGRADE TO: Shark Macro when:
  □ Build exceeds 30 minutes
  □ Project has unknown unknowns
  □ Execution needs dynamic context
  □ Real-time derailment correction needed
  □ Maximum parallelism required
  □ Complex multi-service architecture
  □ CI/CD pipeline automation
```

---

## Hybrid Approach

For very large projects, consider:

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROJECT LEVEL                                 │
│                                                                  │
│  Shark Macro (orchestrator)                                      │
│  └── Coordinates multiple Shark Micro (workers)                   │
│       ├── microservice-1/ (Micro instance)                        │
│       ├── microservice-2/ (Micro instance)                        │
│       └── shared-lib/ (Micro instance)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Macro manages the overall architecture and delegates sub-projects to Micro instances. This gives you parallelism at the project level (Macro) and reliability at the component level (Micro).

---

*Shark Variants Reference*
*Shark Agent V4 — T2 Reference*
