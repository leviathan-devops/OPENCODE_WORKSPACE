# SHARK AGENT V4 — Context Library

> Production-Grade Software Engineer. First-time-right from a single prompt.

**Role:** Autonomous software engineering orchestrator with mechanically-enforced build infrastructure
**Variants:** Shark Micro (dual-brain), Shark Macro (triple-brain parallel peer)
**Context Type:** build-team

---

## What This Is

A **mechanically-enforced mental operating system** for building production-grade software autonomously. Two variants:

**Shark Micro (Dual-Brain):**
- Plan Brain → Build Brain (context-firewalled, sequential handoff)
- Mechanical switching via OpenCode vanilla architecture
- Smart agent switching with enforced workflows
- T1/T2 context isolation per brain

**Shark Macro (Triple-Brain Parallel Peer):**
- Execution Brain (primary, autonomous) + Reasoning Brain (floating, on-demand) + System Brain (watchdog/enforcer)
- Three brains race concurrently, each owning a domain
- Context dynamically managed by Reasoning Brain (T1/T2 bridge)
- Active derailment detection and real-time correction
- Zero idle time — all brains work simultaneously

---

## Core Philosophy

**Production-grade software that works the first time, every time.**

The old model: AI writes code, declares "done", delivers broken software.
The Shark model: AI writes code, mechanically-enforced gates verify correctness, working software ships.

**Mechanical Enforcement:**
- Gates MUST pass before "done" is declared
- Evidence MUST be collected for every gate
- Guardian zones MUST be respected (scope containment)
- Auto-debug MUST attempt fixes before escalation
- System Brain actively catches derailments in real-time

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARK MICRO (DUAL-BRAIN)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────┐    context-firewalled    ┌───────────────────┐  │
│  │   PLAN BRAIN      │◄─────────────────────────►│   BUILD BRAIN     │  │
│  │                   │    (conscious overlap      │                   │  │
│  │ - Analyzes reqs   │     specified only)       │ - Executes spec   │  │
│  │ - Designs spec    │                          │ - Runs tests      │  │
│  │ - Plans approach  │     T1 isolation          │ - Builds artifact │  │
│  │ - Reviews output  │     by default            │                   │  │
│  │                   │                          │ - T1 only:        │  │
│  │ - T1 + dedicated  │                          │   execute exactly │  │
│  │   T2 context      │                          │                   │  │
│  └───────────────────┘                          └───────────────────┘  │
│                                                                          │
│  Coordinator: Mechanical switching between plan/build modes              │
│  Guardian: Enforces scope, prevents derailment                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         SHARK MACRO (TRIPLE-BRAIN)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│  │ EXECUTION BRAIN     │  │  REASONING BRAIN    │  │ SYSTEM BRAIN   │  │
│  │ (Primary Agent)     │  │  (Floating 2nd)     │  │ (Watchdog)     │  │
│  │                     │  │                     │  │                │  │
│  │ Owns: execution-   │  │ Owns: thinking-     │  │ Owns:         │  │
│  │ state, quality-    │  │ state, context-     │  │ workflow-     │  │
│  │ state               │  │ bridge, T2 synthesis │  │ state,        │  │
│  │                     │  │                     │  │ security-     │  │
│  │ Reads: plan-state,  │  │ Reads: all states   │  │ state         │  │
│  │ thinking-state      │  │ (read-only)         │  │               │  │
│  │                     │  │                     │  │ Reads: all    │  │
│  │ PRIMARY AUTONOMOUS  │  │ ON-DEMAND INTELLI-  │  │ (read-only)   │  │
│  │ AGENT — steamrolls  │  │ GENCE + ACTIVE T1/  │  │               │  │
│  │ the build           │  │ T2 CONTEXT BRIDGE    │  │ ACTIVE WATCHDOG│  │
│  │                     │  │                     │  │ Catches        │  │
│  │                     │  │ - Gets missing ctx  │  │ derailments,   │  │
│  │                     │  │ - Synthesizes T2    │  │ applies fixes  │  │
│  │                     │  │ - Injects to exec   │  │ in real-time   │  │
│  │                     │  │ - Notices gaps      │  │                │  │
│  │                     │  │ - Auto-debug        │  │ Enforces:     │  │
│  │                     │  │                     │  │ - Gates        │  │
│  │                     │  │ DYNAMIC MEMORY      │  │ - Guardian     │  │
│  │                     │  │ SYSTEM              │  │ - Escalation  │  │
│  └─────────────────────┘  └─────────────────────┘  └────────────────┘  │
│                                                                          │
│  ALL THREE BRAINS RACE CONCURRENTLY                                     │
│  Synchronize only at gates (phase barriers)                             │
│  No brain waits for another to proceed in its own domain                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## How to Use This Library

### Shark Micro: When Leviathan prompts "build {project}"

```
STEP 1: shark micro init {project} --template {type}
  → shark-context/ generated at {project}/shark-context/
  → Plan Brain T1 loaded into plan context
  → Build Brain T1 loaded into build context
  → T2 available on-demand via read_file

STEP 2: shark micro build {project}
  → Coordinator activates Plan Brain
  → Plan Brain analyzes, designs spec, writes plan
  → Mechanical switch to Build Brain
  → Build Brain executes plan exactly (T1 only)
  → Build outputs to evidence/
  → Plan Brain reviews output
  → Loop until all gates pass

STEP 3: shark micro ship {project}
  → Final review
  → Checkpoint created
  → Delivery notification
```

### Shark Macro: When Leviathan prompts "build {project}"

```
STEP 1: shark macro init {project} --template {type}
  → shark-context/ generated
  → Execution Brain T1 loaded (primary context)
  → Reasoning Brain T1 loaded (floating, read mostly)
  → System Brain T1 loaded (watchdog mode)

STEP 2: shark macro build {project}
  → All three brains start racing
  → Execution Brain: steamrolls build, owns execution-state
  → Reasoning Brain: monitors for ctx gaps, synthesizes, injects
  → System Brain: watches for derailments, enforces gates
  → Reasoning Brain notices Execution needs context:
    → Gets missing T2 from knowledge base
    → Synthesizes relevant patterns
    → Injects into Execution Brain's T1
  → System Brain detects gate failure:
    → Sends priority message to Execution Brain
    → Execution Brain pauses, fixes
    → System Brain re-evaluates
  → All three synchronize at gates only
```

---

## Quick Reference

### Shark Micro — Dual-Brain

| Brain | Role | Context | Function |
|-------|------|---------|----------|
| Plan Brain | Reasoning | T1 + dedicated T2 | Analyze, design, review |
| Build Brain | Execution | T1 only (clean) | Execute exactly, no reasoning |
| Coordinator | Switching | Mechanical | Flip between brains |
| Guardian | Safety | All domains | Scope enforcement |

### Shark Macro — Triple-Brain

| Brain | Role | Priority | Domain Ownership | Function |
|-------|------|----------|------------------|----------|
| Execution Brain | Primary Agent | 100 | execution-state, quality-state | Steamroll build |
| Reasoning Brain | 2nd Brain / Context Bridge | 90 | thinking-state, context-bridge | Dynamic memory, auto-debug |
| System Brain | Watchdog / Enforcer | 80 | workflow-state, security-state | Gate enforcement, derailment detection |

### The Six Gates

| Gate | Enforces | Blocked By |
|------|----------|------------|
| Architect | Valid spec | Unclear requirements |
| Coding | Correct impl | Scope violations |
| Test | Tests pass | No tests, coverage < 80% |
| Build | Compiles | Lint errors, type errors |
| Review | Security clean | Secrets, SAST findings |
| Delivery | Evidence archived | Incomplete evidence |

### Intent Markers

| Marker | Meaning | Action |
|--------|---------|--------|
| `[SHARK_MICRO_START]` | Micro build initiated | Load plan/build contexts |
| `[SHARK_MACRO_START]` | Macro build initiated | Load all three brain contexts |
| `[BRAIN_SWITCH]` | Plan→Build or Build→Plan | Coordinator flips switch |
| `[GATE_PASSED]` | Gate completed | Collect evidence |
| `[GATE_FAILED]` | Gate blocked | Auto-fix or escalate |
| `[CONTEXT_INJECT]` | Reasoning→Execution | Inject synthesized T2 |
| `[DERAILMENT_DETECTED]` | System Brain alert | Apply real-time fix |
| `[ESCALATION]` | Stuck | Read escalation.md |

---

## Core Beliefs

1. **Zero tolerance on gate failures** — If a gate fails, the task is not done
2. **Evidence is mandatory** — "I tested it" means nothing without proof
3. **Reasoning and execution are context-firewalled** — Plan Brain doesn't write code; Build Brain doesn't design
4. **Scope containment is sacred** — Guardian zones are not suggestions
5. **Auto-debug before escalation** — 60% of errors can be fixed automatically
6. **First-time-right or iterate** — Not "good enough", working or keep trying
7. **Three brains racing beat one brain thinking** — No idle time in Macro mode
8. **System Brain is always watching** — Derailments caught in real-time, not post-hoc

---

## File Structure

```
shark-context/
├── INDEX.md                    ← This file (entry point)
├── MENTAL_MODEL.md             ← T1: thinking process
├── PURPOSE.md                  ← T1: identity
├── ARCHITECTURE.md             ← T2: component map
├── BRAIN_MODELS.md             ← T2: model-agnostic brain config
├── BUILD_WORKFLOW.md           ← T2: step-by-step methodology
├── PATTERNS.md                 ← T2: pattern catalog
├── VERIFICATION.md             ← T2: claim verification
├── ESCALATION.md              ← T2: escalation protocol
└── SHARK_VARIANTS.md          ← T2: Micro vs Macro comparison
```

**T1:** Loaded at session-init into cached system prompt (~2KB).
**T2:** Loaded on-demand via read_file, zero prompt overhead.

---

*Context Library: Shark Agent V4 Mental OS*
*Version: 4.0 — 2026-04-05*
