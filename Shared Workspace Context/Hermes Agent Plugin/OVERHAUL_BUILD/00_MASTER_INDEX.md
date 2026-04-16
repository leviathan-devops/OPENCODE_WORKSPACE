# OVERHAUL BUILD — Master Index

**Version:** v3.0  
**Build ID:** hermes-v3-overhaul  
**Date:** 2026-04-14  
**Status:** READY TO EXECUTE  

---

## Overview

This is the **complete context library** for rebuilding the Hermes Agent Plugin v3 from the ground up. It was generated using the Trident Brain Deep Planning Mode process — 4 gates of mechanical reasoning, cross-domain synthesis from Kraken v1.1 and Hermes v2.3.5, and verification-first discipline.

**What you hold is a complete, executable build specification.** Every gate has pass/fail criteria. Every component has inputs/outputs/boundaries. Every test has an expected result. Nothing is "to be determined."

---

## Directory Structure

```
OVERHAUL_BUILD/
├── 00_MASTER_INDEX.md              ← This file
├── 01_INITIAL_PLAN/
│   └── 00_INITIAL_PLAN.md          ← Layer 1: First principles, success criteria
├── 02_WORKFLOW/
│   └── 00_WORKFLOW.md              ← Layer 2: 7-phase build workflow
├── 03_CONTEXT_LIBRARY/
│   ├── 00_INDEX.md                 ← How to use this library
│   ├── 01_SURFACE_ANALYSIS.md      ← What was broken and why
│   ├── 02_ARCHITECTURE.md          ← Full 14-part spec
│   ├── 03_COMPONENTS.md            ← Every component with I/O
│   ├── 04_DATA_FLOW.md             ← How data moves through system
│   ├── 05_INTERFACES.md            ← SDK contracts, tool schemas
│   ├── 06_STATE_MANAGEMENT.md      ← What persists, what doesn't
│   ├── 07_ERROR_HANDLING.md        ← Failure recovery, fallbacks
│   ├── 08_TESTING.md               ← Mechanical verification approach
│   ├── 09_DEPLOYMENT.md           ← Docker build, SHIP gate
│   └── 10_MENTAL_MODEL.md          ← Simplest explanation for onboarding
├── 04_TESTING/
│   └── 00_TESTING.md               ← Test suite commands, log templates
├── 05_CONTAINER_RUNTIME/
│   └── 00_CONTAINER_RUNTIME.md     ← Docker TUI replica test
├── 06_TRIDENT_PROBLEM_SOLVING/
│   └── 00_TRIDENT_PROBLEM_SOLVING.md ← 4-gate systematic debugging
└── 07_CODE_REVIEW/
    └── 00_CODE_REVIEW.md           ← Mechanical quality verification
```

---

## Read Order

**For Kraken Orchestrator (executing this build):**

1. Read this index — understand the structure
2. Read `01_INITIAL_PLAN/00_INITIAL_PLAN.md` — understand first principles and success criteria
3. Read `02_WORKFLOW/00_WORKFLOW.md` — understand the 7-phase build workflow
4. Read `03_CONTEXT_LIBRARY/00_INDEX.md` + `01_SURFACE_ANALYSIS.md` — understand what was broken
5. Read `03_CONTEXT_LIBRARY/02_ARCHITECTURE.md` + `03_COMPONENTS.md` — understand the architecture
6. Begin execution at Phase 1 (Foundation)

**For Architect (reviewing this build):**

1. Read `01_INITIAL_PLAN/00_INITIAL_PLAN.md` — understand success criteria
2. Read `02_WORKFLOW/00_WORKFLOW.md` — understand the critical path
3. Read `03_CONTEXT_LIBRARY/02_ARCHITECTURE.md` — understand key decisions
4. Read `06_TRIDENT_PROBLEM_SOLVING/00_TRIDENT_PROBLEM_SOLVING.md` — understand debugging approach
5. Read `07_CODE_REVIEW/00_CODE_REVIEW.md` — understand review gates

**For Onboarding (new to Hermes):**

1. Read `03_CONTEXT_LIBRARY/10_MENTAL_MODEL.md` — understand what Hermes is in 30 seconds
2. Read `03_CONTEXT_LIBRARY/02_ARCHITECTURE.md` — understand high-level design
3. Read `03_CONTEXT_LIBRARY/03_COMPONENTS.md` — understand the pieces
4. Read `03_CONTEXT_LIBRARY/09_DEPLOYMENT.md` — understand how to ship

---

## Key Constraints (From Layer 1)

| Constraint | Rule |
|------------|------|
| Plugin SDK | `@opencode-ai/plugin` v1.1.53 — must match exactly |
| Build command | `bun build.ts` — NOT `bun build dist/index.ts` |
| Workspace | All work in `v3-build/` — nothing affects local device |
| Agent identity | Every Hermes-specific hook MUST have `isHermesAgent()` guard |
| Phase persistence | Module-level variables reset on hot-reload — use disk state |
| Brainstorm gate | Must check `.hermes/` directory exists before firing |
| Hook order | Guardrails before knowledge injectors in opencode.json |
| No regressions | Must not break Spider Agent, Manta, or Shark |

---

## Success Criteria (10 Concrete Criteria)

| # | Criteria | Verification |
|---|----------|---------------|
| 1 | sast_scan, imports, symbols, grill work | Run each tool against real files |
| 2 | Brainstorm gate fires ONLY for Hermes sessions | Spider coder must NOT be blocked |
| 3 | 29/29 hooks verified in real session | Hook firing evidence in Trident log |
| 4 | 6-phase state machine works | All 7 transitions verified |
| 5 | 2nd-brain memory persists | Cross-session recall returns prior data |
| 6 | Delegation chain fires | Full hermes→analyst→builder→reviewer |
| 7 | Container TUI passes | docker exec test passes |
| 8 | dist rebuilt after every source change | Verify dist mtime |
| 9 | No regressions | Spider coder writes files while Hermes loaded |
| 10 | E2E ≥98% | 144+/147 tests passing |

---

## Build Phases

| Phase | Gate | Key Deliverables |
|-------|------|------------------|
| **1. Foundation** | Build | dist fresh with all fixes, E2E ≥144/147 |
| **2. Hook Verification** | Test | 29/29 hooks with firing evidence |
| **3. Delegation Chain** | Test | Full chain verified |
| **4. State Machine** | Test | All transitions + persistence |
| **5. Memory System** | Test | Cross-session recall verified |
| **6. Integration** | Test | Full TDD cycle, no regressions |
| **7. Container Ship** | SHIP | TUI replica passes all criteria |

---

## Integration with Other Contexts

| Source | What It Contributed | Where Used |
|--------|--------------------|------------|
| `../v2.3.5-build/` | Working source (best code base) | Reference for adaptation |
| `../REFERENCE/ARCHITECTURE.md` | Full 14-part spec (900+ lines) | 03_CONTEXT_LIBRARY/02_ARCHITECTURE.md |
| `../DEBUG-HERMES-BRAINSTORM-GATE...md` | Brainstorm gate fix | Incorporated in Phase 1 |
| `../../Trident Brain/` | Deep Planning Mode process | 06_TRIDENT_PROBLEM_SOLVING/ |
| `../../Kraken Agent/` | 3-cluster parallel verification | Workflow, 04_TESTING |
| Spider Agent | Hook composition pattern | src/hooks/ structure |

---

## Anti-Shallow Commitment

This build library was generated with **mechanical depth enforcement** — not "looks good" planning:

- **Layer 1** identified actual brokenness (not stated problem)
- **Layer 2** mapped 7 phases with concrete gate criteria
- **Layer 3** documented every component with inputs/outputs/boundaries
- **Phase 1-7** each have explicit PASS/FAIL criteria
- **Testing** has mechanical evidence requirements (not "tested informally")
- **Container** has explicit SHIP gate criteria (all-or-nothing)

---

## How to Execute

### Quick Start (Kraken Orchestrator)
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin/
mkdir -p v3-build
# Copy source from v2.3.5-build as foundation
cp -r v2.3.5-build/src v3-build/
cp v2.3.5-build/package.json v3-build/
cp v2.3.5-build/tsconfig.json v3-build/
cp v2.3.5-build/build.ts v3-build/
# Read this library top to bottom
# Execute Phase 1: Foundation
```

### Verify Build Is Clean
```bash
cd v3-build
bun install
bun build.ts  # Must exit 0
# Verify dist mtime > all src mtimes
stat -c '%Y' dist/index.js $(find src -name '*.ts' -exec stat -c '%Y' {} \; | sort -n | tail -1)
```

### Run Full Test Suite
```bash
./scripts/run-all-tests.sh  # Runs all phases in order
# Produces: FULL_TEST_REPORT.md
```

---

**BUILD STATUS: READY TO EXECUTE**  
**Next action: Copy v2.3.5-build source to v3-build/, apply fixes per Phase 1, begin build**
