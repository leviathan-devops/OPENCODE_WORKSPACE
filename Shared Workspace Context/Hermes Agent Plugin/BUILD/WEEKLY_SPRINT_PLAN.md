# WEEKLY SPRINT PLAN — Hermes Agent Plugin

---

## Sprint 1 (Week 1) — Core Pipeline

**Goal**: End-to-end pipeline that can process a task through all 6 phases.

### Sprint 1.1 — Plugin Scaffold ✓
- [ ] `package.json`, `tsconfig.json`, `build.ts`
- [ ] Verify plugin loads in OpenCode
- [ ] Link into OpenCode workspace

### Sprint 1.2 — Config System
- [ ] `src/config/schema.ts` — HermesAgentConfig Zod schema
- [ ] `src/config/loader.ts` — Load from `~/.hermes/settings.json`
- [ ] `src/config/constants.ts` — AGENT_NAMES, QA_AGENTS, PHASE_ORDER

### Sprint 1.3 — HERMES.md System Enhancer Hook
- [ ] `src/hooks/system-enhancer.ts` — Inject HERMES.md every turn
- [ ] Verify content appears in new session context

### Sprint 1.4 — 3 Core Agents
- [ ] `src/agents/hermes.ts` — Orchestrator prompt
- [ ] `src/agents/analyst.ts` — Requirements → technical specs
- [ ] `src/agents/builder.ts` — TDD enforcement, one task at a time

### Sprint 1.5 — 5 Core Hooks
- [ ] `src/hooks/brainstorm-gate.ts` — HARD-GATE enforcement
- [ ] `src/hooks/plan-validator.ts` — No TBD/TODO/placeholder
- [ ] `src/hooks/tdd-enforcer.ts` — Test file before src file
- [ ] `src/hooks/delegation-gate.ts` — Coder blocked without reviewer
- [ ] `src/hooks/phase-monitor.ts` — State machine transitions

### Sprint 1.6 — Core Tools
- [ ] `src/tools/checkpoint.ts` — Git stash + state savepoint
- [ ] `src/tools/phase-complete.ts` — Advance state machine
- [ ] `src/tools/save-plan.ts` — plan.json → plan.md auto-generate
- [ ] `src/tools/hermes-recall.ts` — 2nd-brain query
- [ ] `src/tools/hermes-remember.ts` — 2nd-brain store
- [ ] `src/tools/hermes-context.ts` — Inject 2nd-brain context

### Sprint 1.7 — Session Persistence
- [ ] SessionDB schema and CRUD
- [ ] Snapshot on phase completion
- [ ] `--continue` / `--resume` / `--fork-session` support

### Sprint 1 End Conditions
- [ ] Plugin loads in OpenCode
- [ ] New session shows HERMES.md content
- [ ] "build a login system" → asks questions, does NOT code
- [ ] `phase_complete` advances state machine
- [ ] Builder creates test before src

---

## Sprint 2 (Week 2) — Full Enforcement

**Goal**: All 14 agents, all 28 hooks, full quality enforcement.

### Sprint 2.1 — Remaining 11 Agents
- [ ] `src/agents/planner.ts` — No-placeholder adaptive planning
- [ ] `src/agents/tdd.ts` — RED-GREEN-REFACTOR executor
- [ ] `src/agents/reviewer.ts` — Security + performance + patterns
- [ ] `src/agents/quality-reviewer.ts` — Spec compliance + readability
- [ ] `src/agents/grill.ts` — Adversarial attack vectors
- [ ] `src/agents/ripple.ts` — Cascading change analysis
- [ ] `src/agents/drift-verifier.ts` — Phase completion verification
- [ ] `src/agents/explorer.ts` — Codebase context mapping
- [ ] `src/agents/architect.ts` — Clean Architecture / DDD
- [ ] `src/agents/debugger.ts` — 4-phase systematic debugging
- [ ] `src/agents/supervisor.ts` — Graeme's self-improving loop

### Sprint 2.2 — Remaining 23 Hooks
- [ ] `src/hooks/strict-write-discipline.ts` — Verify before act
- [ ] `src/hooks/adversarial-check.ts` — Slop/bypass detection
- [ ] `src/hooks/anti-rationalization.ts` — Exit criteria checklist
- [ ] `src/hooks/knowledge-injector.ts` — 2nd-brain recall every turn
- [ ] `src/hooks/compaction.ts` — 5-tier token management
- [ ] `src/hooks/guardrails.ts` — Per-agent resource limits
- [ ] `src/hooks/scope-guard.ts` — File permission boundaries
- [ ] `src/hooks/activity.ts` — Tool call tracking
- [ ] `src/hooks/delegation-ledger.ts` — Delegation chain
- [ ] `src/hooks/self-review.ts` — Cannot approve own output
- [ ] `src/hooks/knowledge-curator.ts` — Extract learnings
- [ ] `src/hooks/snapshot-writer.ts` — Session snapshots
- [ ] `src/hooks/tool-summarizer.ts` — Truncate large outputs
- [ ] `src/hooks/debugging-spiral.ts` — 5 identical calls = spiral
- [ ] `src/hooks/adversarial-detector.ts` — Gate bypass patterns
- [ ] `src/hooks/ripple-check.ts` — Post-change cascading check
- [ ] `src/hooks/supervisor-ingest.ts` — Feed supervisor loop
- [ ] `src/hooks/complexity-routing.ts` — Auto-route by complexity
- [ ] `src/hooks/framework-pack.ts` — Framework auto-detection
- [ ] `src/hooks/intent-marker.ts` — 4-marker protocol
- [ ] `src/hooks/drift-verifier-hook.ts` — Phase completion check

### Sprint 2.3 — Full Tool System
- [ ] All Spider Agent tools adapted (lint, diff, build_check, etc.)
- [ ] All Specialist tools added (grill, verify, health, etc.)
- [ ] Agent dispatch tools (spawn, status, cancel subagents)

### Sprint 2.4 — Supervisor Loop
- [ ] Graeme's 3-agent loop (monitor → supervisor → auditor)
- [ ] Risk classifier (LOW auto-apply, HIGH escalate)
- [ ] 4-marker intent protocol enforcement

### Sprint 2 End Conditions
- [ ] All 14 agents respond correctly
- [ ] TDD Enforcement test passes
- [ ] QA Gate test passes (reviewer + quality-reviewer both verdict)
- [ ] 3-strike debugging triggers @architect review
- [ ] Supervisor auto-fixes LOW-risk issues

---

## Sprint 3 (Week 3) — Production Ready

**Goal**: Polish, optimize, and ship.

### Sprint 3.1 — Framework Packs
- [ ] Auto-detect Next.js, React, Vue, Svelte, Python, Go, Rust
- [ ] Inject framework-specific conventions
- [ ] Framework-specific test patterns

### Sprint 3.2 — Full Skill Library
- [ ] All 32 skills from Specialist Agent
- [ ] `/brainstorm`, `/plan`, `/tdd`, `/debug`, `/grill`, `/verify`, `/health`
- [ ] `/remember`, `/recall`, `/autopilot`, `/onboard`, `/finish`

### Sprint 3.3 — Permission Cascade
- [ ] settings.json 5-level cascade (policy > flag > local > project > user)
- [ ] `allow`/`deny` pattern matching
- [ ] Permission override modes (auto, manual, disabled)

### Sprint 3.4 — 3 Execution Models
- [ ] fork — cache-optimized (default for subagents)
- [ ] teammate — persistent tmux worker (long tasks)
- [ ] worktree — git-isolated branch per agent

### Sprint 3.5 — Performance & Polish
- [ ] Hook execution time < 50ms each
- [ ] Subagent cache hits confirmed
- [ ] Token budget stays under 80% in normal sessions
- [ ] Error recovery from partial failures

### Sprint 3.6 — Documentation
- [ ] README.md for plugin
- [ ] Quick start guide
- [ ] API reference for all tools
- [ ] Architecture diagram

### Sprint 3 End Conditions
- [ ] All 6 verification tests pass
- [ ] 2nd-brain recall test passes (session resume has context)
- [ ] Supervisor loop handles 10+ failures without crash
- [ ] Framework auto-detection works for 3+ frameworks
- [ ] Permission cascade blocks denied operations
