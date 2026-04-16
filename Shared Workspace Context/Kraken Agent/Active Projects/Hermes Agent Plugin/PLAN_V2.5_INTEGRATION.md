# Hermes Agent v3.5 — v2.5 Integration Plan

**Build ID:** hermes-v3.5-integration  
**Parent:** hermes-v3-overhaul (v3.0)  
**Date:** 2026-04-14  
**Goal:** Integrate v2.5 Thread/Fork/Orchestration into v3.0 overhaul

---

## Executive Summary

The v3.0 overhaul fixed v2.3.5's operational issues (brainstorm gate, agent guards, dist rebuild) but **deferred v2.5 Thread/Fork/Orchestration** as "never built, entirely planned."

This plan integrates v2.5 into v3.0, creating **Hermes v3.5**.

### What v2.5 Adds

| Primitive | Description | v3.0 Status |
|-----------|-------------|--------------|
| **Thread** | Async, non-blocking subagent dispatch | Partially exists (delegate_task) |
| **Fork** | Synchronous, blocking subagent (takes over UI) | **MISSING** |
| **Orchestration** | Skill chains with conditional branching | **MISSING** |
| **Episode System** | Execution boundaries with context compression | **MISSING** |

### What Must Be Built

1. **ForkManager Service** — Fork lifecycle management
2. **EpisodeStore Service** — Episode tracking and history  
3. **OrchestrationEngine Service** — Chain execution
4. **Fork Tools** — fork_create, fork_complete, fork_feedback
5. **Episode Tools** — episode_list, episode_output
6. **Orchestration Tools** — orchestration_invoke, skill_register
7. **Fork Blocker Hook** — Block tools during Fork
8. **Skill Router Hook** — Route skills to Thread/Fork
9. **Output Chainer Hook** — Chain episode outputs
10. **Orchestration Skills** — /implement, /plan, /grill, etc.

---

## Phase Gate Criteria

Each phase must pass its gate before advancing.

| Phase | Gate | Pass Criteria |
|-------|------|---------------|
| 1-INVENTORY | Code Review | All v2.5 source files identified, gaps mapped |
| 2-FOUNDATION | Build | ForkManager + EpisodeStore compile |
| 3-HOOKS | Test | Fork blocker + skill router work |
| 4-TOOLS | Test | All fork/episode/orchestration tools work |
| 5-SKILLS | Integration | Orchestration skills chain correctly |
| 6-REGRESSION | Integration | v3.0 features still work |
| 7-SHIP | Container | TUI replica test passes |

---

## PHASE 1: INVENTORY

**Goal:** Map all v2.5 source files, identify what's reusable vs missing

### Tasks

- [ ] **1.1:** List all v2.5 source files
- [ ] **1.2:** Compare with v3.0 source structure  
- [ ] **1.3:** Identify duplicate/conflict files
- [ ] **1.4:** Map v2.5 services → v3.0 services
- [ ] **1.5:** Map v2.5 hooks → v3.0 hooks
- [ ] **1.6:** Map v2.5 tools → v3.0 tools
- [ ] **1.7:** Identify skill files to port
- [ ] **1.8:** Create inventory report

### Deliverables

- `v2.5_INVENTORY.md` — Complete file mapping

### Exit Gate

- All v2.5 files catalogued
- Conflicts identified
- Gap analysis complete

---

## PHASE 2: FOUNDATION

**Goal:** Build core ForkManager and EpisodeStore services

### Tasks

- [ ] **2.1:** Create `src/services/fork-manager.ts`
  - ForkState state machine (idle/active/waiting_input/completing/completed)
  - startFork(), sendFeedback(), completeFork(), timeoutFork()
  - Auto-complete stale fork on new Fork request
  - Fork history (max 5)

- [ ] **2.2:** Create `src/services/episode-store.ts`
  - Episode tracking (startEpisode, completeEpisode, timeoutEpisode)
  - Active episode management
  - Chain output retrieval
  - Max history per skill (10)

- [ ] **2.3:** Create `src/services/orchestration-engine.ts`
  - Chain execution (sequential)
  - Thread/Fork routing per step
  - Input template processing ({previous}, {user_request}, etc.)
  - Condition evaluation (JS expression)
  - Output combination

- [ ] **2.4:** Update `src/services/index.ts` to export new services

- [ ] **2.5:** Build and verify compilation

### Deliverables

- `src/services/fork-manager.ts` (ForkManager class)
- `src/services/episode-store.ts` (EpisodeStore class)
- `src/services/orchestration-engine.ts` (OrchestrationEngine class)

### Exit Gate

- `bun build.ts` exits 0
- All three services compile without errors
- TypeScript strict mode passes

---

## PHASE 3: HOOKS

**Goal:** Implement Fork Blocker and Skill Router hooks

### Tasks

- [ ] **3.1:** Create `src/hooks/fork-blocker-hook.ts`
  - Block non-Fork tools when Fork is active
  - Allow only fork-related tools through
  - Return blocked message with active Fork info

- [ ] **3.2:** Create `src/hooks/skill-router.ts`
  - Route skill activation to Thread or Fork
  - Based on skill type (action → thread, interactive → fork)
  - executionMode override support

- [ ] **3.3:** Create `src/hooks/output-chainer.ts`
  - Chain episode outputs to next step
  - Template variable substitution
  - Condition evaluation

- [ ] **3.4:** Create `src/hooks/episode-tracker.ts`
  - Track episode start/complete/timeout
  - Log to phase.json or separate episode store

- [ ] **3.5:** Verify all hooks have `isHermesAgent()` guard

### Deliverables

- `src/hooks/fork-blocker-hook.ts`
- `src/hooks/skill-router.ts`
- `src/hooks/output-chainer.ts`
- `src/hooks/episode-tracker.ts`

### Exit Gate

- All hooks compile
- Fork blocker returns blocked=true when Fork active
- Skill router routes correctly (thread vs fork)

---

## PHASE 4: TOOLS

**Goal:** Implement Fork, Episode, and Orchestration tools

### Tasks

- [ ] **4.1:** Create `src/tools/fork-tools.ts`
  - `fork_create` — Create new Fork session
  - `fork_complete` — Mark Fork done, return output
  - `fork_feedback` — Send user input to Fork
  - `fork_status` — Get active Fork info

- [ ] **4.2:** Create `src/tools/episode-tools.ts`
  - `episode_list` — List episodes (active, history)
  - `episode_output` — Get specific episode output
  - `episode_summary` — Get compressed summary

- [ ] **4.3:** Create `src/tools/orchestration-tools.ts`
  - `orchestration_invoke` — Start orchestration chain
  - `skill_register` — Register new orchestration skill
  - `orchestration_status` — Get chain progress

- [ ] **4.4:** Register tools in `src/index.ts`

- [ ] **4.5:** Run E2E tests — verify 144/147 maintained

### Deliverables

- `src/tools/fork-tools.ts`
- `src/tools/episode-tools.ts`
- `src/tools/orchestration-tools.ts`
- Updated `src/index.ts`

### Exit Gate

- `bun build.ts` exits 0
- E2E ≥ 144/147 (allow +3 for new tools)

---

## PHASE 5: SKILLS

**Goal:** Port orchestration skills from v2.5

### Tasks

- [ ] **5.1:** Create `src/skills/IMPLEMENT.md`
  - Orchestration: plan → build → review → grill → verify
  - Fork: plan, review, grill
  - Thread: build, verify

- [ ] **5.2:** Create `src/skills/PLAN.md`
  - Fork skill (interactive planning)
  - Template for plan output

- [ ] **5.3:** Create `src/skills/GRILL.md`
  - Fork skill (adversarial testing)
  - User interaction required

- [ ] **5.4:** Create `src/skills/TDD.md`
  - Thread skill (TDD cycle)
  - Already partially exists in v3.0

- [ ] **5.5:** Create `src/skills/VERIFY.md`
  - Thread skill (verification)

- [ ] **5.6:** Create skill registry in `src/services/skill-registry.ts`

- [ ] **5.7:** Update `src/index.ts` to register skills

### Deliverables

- `src/skills/` directory with orchestration skills
- `src/services/skill-registry.ts`
- Updated `src/index.ts`

### Exit Gate

- Skills compile and load
- Chain executes in correct order
- Thread vs Fork routing works

---

## PHASE 6: REGRESSION

**Goal:** Verify v3.0 features still work

### Tasks

- [ ] **6.1:** Run full E2E suite
- [ ] **6.2:** Verify brainstorm-gate still works
- [ ] **6.3:** Verify phase machine still works
- [ ] **6.4:** Verify delegation chain still works
- [ ] **6.5:** Verify memory tools still work
- [ ] **6.6:** Verify hermes-command.ts guard still works
- [ ] **6.7:** Create regression test for Fork blocking Spider

### Deliverables

- `REGRESSION_LOG.md`
- Updated `test-e2e.ts` with v3.5 tests

### Exit Gate

- E2E ≥ 144/147
- No regression in v3.0 features
- Fork does NOT block Spider Agent (critical)

---

## PHASE 7: SHIP

**Goal:** Container test and finalize ship package

### Tasks

- [ ] **7.1:** Update ship package with v3.5
- [ ] **7.2:** Update docs (HOOK_ARCHITECTURE, AGENT_DELEGATION)
- [ ] **7.3:** Update SHIP_GATE.md
- [ ] **7.4:** Container build
- [ ] **7.5:** Container TUI replica test
- [ ] **7.6:** Create v3.5 ship package

### Deliverables

- Updated `hermes-agent-v3.5/` ship package
- `SHIP_GATE.md` with v3.5 criteria

### Exit Gate

- Container test passes
- All ship criteria met

---

## Key Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Fork blocks Spider Agent | CRITICAL | Fork only activates in Hermes session, `.hermes/` guard |
| SDK doesn't support blocking | HIGH | Fork is cooperative (tool blocks itself, not SDK) |
| Thread vs Fork routing complex | MEDIUM | Simple routing based on skill type |
| Orchestration chaining bugs | MEDIUM | Unit test each chain step |

---

## Critical Design Rules

1. **Fork must NOT block Spider Agent** — Fork only activates when `isHermesAgent()` AND `.hermes/` directory exists
2. **Fork is cooperative** — Fork blocks the tool, not the SDK. Tools check `ForkManager.isActive()` before running
3. **Thread is default** — Most work should be Thread (async)
4. **Fork for user interaction** — Only skills that NEED user conversation should be Fork
5. **Episode compresses context** — Context cleared after episode to prevent pollution

---

## Files to Create (New)

```
src/services/
├── fork-manager.ts         # NEW
├── episode-store.ts        # NEW
├── orchestration-engine.ts # NEW
└── skill-registry.ts      # NEW

src/hooks/
├── fork-blocker-hook.ts   # NEW
├── skill-router.ts        # NEW
├── output-chainer.ts      # NEW
└── episode-tracker.ts     # NEW

src/tools/
├── fork-tools.ts          # NEW
├── episode-tools.ts       # NEW
└── orchestration-tools.ts # NEW

src/skills/
├── IMPLEMENT.md           # NEW
├── PLAN.md               # NEW (updated from v2.5)
├── GRILL.md              # NEW (updated from v2.5)
├── TDD.md                # NEW (updated from v2.5)
└── VERIFY.md             # NEW (updated from v2.5)
```

## Files to Modify

```
src/index.ts              # Add new services, hooks, tools, skills
src/services/index.ts     # Export new services
src/tools/index.ts        # Export new tools
src/hooks/index.ts        # Export new hooks
```

## Files from v2.5 to Reference (Do Not Copy)

- `v2.5-build/src/services/fork-manager.ts` — Reference architecture
- `v2.5-build/src/services/episode-store.ts` — Reference architecture
- `v2.5-build/src/services/orchestration-engine.ts` — Reference architecture
- `v2.5-build/src/skills/*.md` — Reference skill definitions

---

## Build Command

```bash
bun build.ts && ./scripts/BUILD_VERIFY.sh
```

**CRITICAL:** Use `bun build.ts` NOT `bun build dist/index.ts`
