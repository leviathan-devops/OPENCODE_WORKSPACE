# Context Synthesis Mode - Build Package Overview

**Version:** 2.0.0 (with Recovery Mode)
**Date:** 2026-04-15
**Purpose:** Context library for building Context Synthesis Mode

---

## How To Use This Library

Context Synthesis Mode has TWO sub-modes:

1. **INJECTION MODE** (Original) — Forward-looking context synthesis
2. **RECOVERY MODE** (New) — Backward-looking stream recovery

### For Injection Mode (Original)

1. Read `01_SURFACE_ANALYSIS.md` to understand Injection Mode
2. Read `02_ARCHITECTURE.md` to understand how it fits together
3. Read `03_COMPONENTS.md` for the build components
4. Use `04_DATA_FLOW.md` to trace execution
5. Reference `05_INTERFACES.md` for contracts
6. Check `06_STATE_MANAGEMENT.md` for persistence
7. Review `07_ERROR_HANDLING.md` for failure modes
8. Study `08_TESTING.md` for verification approach
9. Use `09_DEPLOYMENT.md` for shipping
10. Read `10_MENTAL_MODEL.md` for the simplest explanation

### For Recovery Mode (New)

1. Read `03_RECOVERY_MODE/RECOVERY_MODE_DESIGN.md` for complete design
2. Read `03_RECOVERY_MODE/CONTEXT_LIBRARY/01_SURFACE_ANALYSIS.md`
3. Read `03_RECOVERY_MODE/CONTEXT_LIBRARY/02_ARCHITECTURE.md`
4. Read `03_RECOVERY_MODE/CONTEXT_LIBRARY/03_COMPONENTS.md`
5. Reference `03_RECOVERY_MODE/CONTEXT_LIBRARY/04_INTERFACES.md`
6. Read `03_RECOVERY_MODE/WORKFLOW/05_WORKFLOW.md`
7. Review `03_RECOVERY_MODE/WORKFLOW/06_FAILURE_MODES.md`

---

## Build Status

### Injection Mode (Original)

| Component | Status |
|-----------|--------|
| Architecture | ✅ Complete (4 layers) |
| Templates | ✅ Complete (4 layer templates) |
| Source | ⏳ Pending |
| TypeScript | ⏳ Pending |
| Tests | ⏳ Pending |

### Recovery Mode (New)

| Component | Status |
|-----------|--------|
| Design | ✅ Complete |
| Architecture | ✅ Complete |
| Components | ⏳ Pending |
| Implementation | ⏳ Pending |
| Tests | ⏳ Pending |

---

## Sub-Mode Summary

### Injection Mode

- **Purpose:** Forward-looking context synthesis
- **Trigger:** Manual, gate transition, error, threshold, stale
- **Input:** Fresh T1-T4 sources
- **Output:** T0-ready context injection

### Recovery Mode

- **Purpose:** Backward-looking stream recovery
- **Trigger:** Compaction, crash, manual recovery request
- **Input:** Pre-interruption session artifacts
- **Output:** CognitiveSnapshot + stream narrative

---

## Directory Structure

```
Build Package/
├── 01_INITIAL_PLAN.md              # Original Injection Mode plan
├── 02_WORKFLOW/                    # Original workflow
├── CONTEXT_LIBRARY/                # Original context library
│   └── 00_INDEX.md               # This file
├── 03_RECOVERY_MODE/              # NEW: Recovery Mode build package
│   ├── INDEX.md                   # Recovery Mode overview
│   ├── RECOVERY_MODE_DESIGN.md    # Complete design spec
│   ├── CONTEXT_LIBRARY/           # Recovery-specific context
│   │   ├── 01_SURFACE_ANALYSIS.md
│   │   ├── 02_ARCHITECTURE.md
│   │   ├── 03_COMPONENTS.md
│   │   └── 04_INTERFACES.md
│   └── WORKFLOW/
│       ├── 05_WORKFLOW.md
│       └── 06_FAILURE_MODES.md
```

---

## Key Innovation: Two Modes, One System

Both modes share:
- Same trigger infrastructure
- Same output format (ContextInjection)
- Same integration with Trident Brain

Different:
- Different collection strategies
- Different synthesis algorithms
- Different output enrichment (injection vs recovery data)

---

*Build Package v2.0 - Context Synthesis Mode with Recovery Mode*