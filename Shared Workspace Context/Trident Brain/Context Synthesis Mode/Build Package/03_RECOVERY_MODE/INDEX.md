# CONTEXT SYNTHESIS MODE — RECOVERY MODE BUILD PACKAGE

**Version:** 2.0.0
**Date:** 2026-04-15
**Status:** DESIGN COMPLETE — READY FOR IMPLEMENTATION

---

## What Is Recovery Mode?

Recovery Mode is a **stream-of-consciousness recovery system** that reconstructs the agent's cognitive state at the moment of interruption.

**Purpose:** After compaction or crash, the agent loses its "mental checkpoint" - what it was thinking and about to do. Recovery Mode reconstructs this so the agent can resume exactly where they left off.

**Key Difference from Injection Mode:**
- Injection Mode = Forward-looking synthesis (fresh context)
- Recovery Mode = Backward-looking stream recovery (regain lost cognitive state)

---

## Quick Reference

| Document | Purpose |
|----------|---------|
| [RECOVERY_MODE_DESIGN.md](./RECOVERY_MODE_DESIGN.md) | **START HERE** — Complete design specification |
| [01_SURFACE_ANALYSIS.md](./CONTEXT_LIBRARY/01_SURFACE_ANALYSIS.md) | What Recovery Mode is and isn't |
| [02_ARCHITECTURE.md](./CONTEXT_LIBRARY/02_ARCHITECTURE.md) | 4-phase recovery architecture |
| [03_COMPONENTS.md](./CONTEXT_LIBRARY/03_COMPONENTS.md) | Component breakdown |
| [04_INTERFACES.md](./CONTEXT_LIBRARY/04_INTERFACES.md) | Data contracts |
| [05_WORKFLOW.md](./WORKFLOW/05_WORKFLOW.md) | Execution sequence |
| [06_FAILURE_MODES.md](./WORKFLOW/06_FAILURE_MODES.md) | What can go wrong |

---

## Build Status

| Phase | Status |
|-------|--------|
| Design | ✅ Complete |
| Architecture | ✅ Derived from design |
| Components | ⏳ Pending |
| Implementation | ⏳ Pending |
| Testing | ⏳ Pending |

---

## Recovery Mode vs Injection Mode

| Aspect | Injection Mode | Recovery Mode |
|--------|---------------|---------------|
| **Purpose** | Forward synthesis | Stream recovery |
| **Trigger** | Manual, gate, error | Compaction, crash |
| **Input** | Fresh T1-T4 sources | Pre-compaction artifacts |
| **Output** | T0-ready context | Cognitive snapshot |
| **Focus** | What matters now | What was happening |

---

## Core Concept: Stream of Consciousness

When a session compacts or crashes:

```
BEFORE COMPACTION:
[08:00] Thinking about auth system design
[08:01] Reading user model to understand structure
[08:02] "I see the user model has these fields..."
[08:03] Now I need to add password hash field
[08:04] About to modify user.ts when → COMPACTION

AFTER COMPACTION:
[Empty] Agent has no idea what they were doing
[Empty] Must re-read files to figure out context
```

Recovery Mode reconstructs:
- **What I was thinking** (reasoning chain)
- **What I was doing** (action chain)
- **What was about to happen** (intent chain)
- **What was loaded in mind** (working memory)

---

## Key Innovation: Tool Pattern Recognition

An LLM agent's thought stream can be partially recovered from **tool call ordering patterns**:

| Pattern | Meaning | Recoverable Thought |
|---------|---------|---------------------|
| `read(A) → write(A)` | Just read it, about to change | "I had A loaded and was about to modify it" |
| `read(A) → read(B) → write(A)` | Researching before modifying | "I was understanding A and B before changing A" |
| `test → test → test` | Debugging loop | "I was debugging something" |
| `read(A) → [gap] → write(A)` | Research, interrupted, resumed | "Was mid-research when interrupted" |

---

## Implementation Approach

Recovery Mode is implemented as a **sub-mode** of Context Synthesis Mode. Both share the same trigger system and output format, but differ in:

1. **Trigger detection** — Recovery triggers on compaction/crash events
2. **Collection phase** — Recovery collects pre-interruption artifacts
3. **Synthesis phase** — Recovery reconstructs vs synthesizes
4. **Output** — Recovery produces CognitiveSnapshot vs context injection

Integration point: `selectMode()` in the synthesis coordinator

---

## File Structure

```
Context Synthesis Mode/
├── Build Package/
│   ├── 01_INITIAL_PLAN.md          # Original Injection Mode plan
│   ├── 02_WORKFLOW/               # Original workflow
│   ├── CONTEXT_LIBRARY/            # Original context library
│   └── 03_RECOVERY_MODE/          # NEW: Recovery Mode build package
│       ├── INDEX.md               # This file
│       ├── RECOVERY_MODE_DESIGN.md # Complete design
│       ├── CONTEXT_LIBRARY/       # Recovery-specific context
│       │   ├── 01_SURFACE_ANALYSIS.md
│       │   ├── 02_ARCHITECTURE.md
│       │   ├── 03_COMPONENTS.md
│       │   └── 04_INTERFACES.md
│       └── WORKFLOW/              # Recovery workflow
│           ├── 05_WORKFLOW.md
│           └── 06_FAILURE_MODES.md
```

---

*Build Package v2.0 - Recovery Mode for Context Synthesis*