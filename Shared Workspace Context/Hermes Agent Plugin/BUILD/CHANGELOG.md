# CHANGELOG — Hermes Agent Plugin

---

## [0.1.0] — 2026-04-02 — Initial Implementation

### Added

#### Plugin Core
- `src/index.ts` — Plugin entry point wiring all components
- `package.json` — @opencode-ai/plugin@1.1.53 peer dependency
- `tsconfig.json` — ES2022, ESNext module resolution
- `build.ts` — Bun build script → dist/index.js

#### Agents (19)
- `hermes.ts` — Primary orchestrator with 6-phase workflow
- `analyst.ts` — Socratic requirements → technical specs
- `builder.ts` — TDD enforcement, one task at a time
- `planner.ts` — No-placeholder adaptive planning
- `tdd.ts` — RED-GREEN-REFACTOR executor
- `reviewer.ts` — Security + performance + patterns
- `quality-reviewer.ts` — Spec compliance + readability
- `grill.ts` — Adversarial attack testing
- `ripple.ts` — Cascading change analysis
- `drift-verifier.ts` — Phase completion verification
- `explorer.ts` — Codebase context mapping
- `architect.ts` — Clean Architecture / DDD advocacy
- `debugger.ts` — 4-phase systematic debugging
- `supervisor.ts` — Graeme's self-improving loop
- `sme.ts` — Subject matter expert
- `test-engineer.ts` — Test strategy + coverage
- `docs.ts` — Documentation updates
- `critic.ts` — Plan critique
- `memory.ts` — Cross-session persistence

#### Hooks (28)
- `brainstorm-gate.ts` — HARD-GATE: no code until design approved
- `plan-validator.ts` — Reject TBD/TODO/placeholder
- `tdd-enforcer.ts` — Test file before src file
- `delegation-gate.ts` — Coder blocked without reviewer
- `phase-monitor.ts` — State machine transitions
- `system-enhancer.ts` — HERMES.md injection every turn
- `strict-write-discipline.ts` — Verify cached context before act
- `adversarial-check.ts` — Slop/bypass detection
- `anti-rationalization.ts` — Exit criteria checklist
- `knowledge-injector.ts` — 2nd-brain recall every turn
- `compaction.ts` — 5-tier token management
- `guardrails.ts` — Per-agent resource limits
- `scope-guard.ts` — File permission boundaries
- `activity.ts` — Tool call tracking
- `delegation-ledger.ts` — Delegation chain state
- `self-review.ts` — Cannot approve own output
- `knowledge-curator.ts` — Extract learnings
- `snapshot-writer.ts` — Session snapshots
- `debugging-spiral.ts` — 5 identical calls = spiral
- `adversarial-detector.ts` — Gate bypass patterns
- `ripple-check.ts` — Post-change cascading
- `supervisor-ingest.ts` — Feed supervisor loop
- `complexity-routing.ts` — Auto-route by complexity
- `framework-pack.ts` — Framework auto-detection
- `intent-marker.ts` — 4-marker protocol
- `drift-verifier-hook.ts` — Phase completion check
- `context-budget.ts` — Trigger compaction at 70% budget

#### Tools (28)
- `checkpoint.ts` — Git stash + session savepoint
- `phase-complete.ts` — Advance state machine
- `save-plan.ts` — plan.json → plan.md
- `hermes-recall.ts` — 2nd-brain query
- `hermes-remember.ts` — 2nd-brain store
- `hermes-context.ts` — Inject 2nd-brain context
- `quality.ts` — lint, diff, build_check, syntax_check
- `security.ts` — test_runner, placeholder_scan, sast_scan, secret_scan
- `analysis.ts` — complexity_hotspots, detect_domains, extract_code_blocks, imports, symbols
- `verification.ts` — grill, verify, health, evidence_check, retrieve_summary
- `session-tools.ts` — list_sessions, load_session, fork_session, create_snapshot
- `create-tool.ts` — SDK tool factory wrapper

#### Config (7)
- `schema.ts` — HermesAgentConfig Zod schema
- `loader.ts` — ~/.hermes/settings.json loader
- `constants.ts` — AGENT_NAMES, PHASES, PHASE_ORDER, PLACEHOLDER_PATTERNS
- `frameworks.ts` — 12 framework detection patterns
- `skills.ts` — 12 skill definitions
- `permissions.ts` — 5-level permission cascade
- `execution.ts` — fork/teammate/worktree execution models

#### Services (2)
- `session-db.ts` — SessionDB with snapshots
- `supervisor-loop.ts` — Risk classification and issue tracking

### Build Output
- `dist/index.js` — 14,850 lines, 515KB compiled plugin

### Testing
- E2E verification: 101/104 tests passing
- Clean compile verified: npm install → bun build → bun tsc --noEmit

---

## [Unreleased] — Context Library

### Context Files Created During Investigation
- `INTRO.md` — Project overview
- `AGENTS/AGENT_INDEX.md` — All 14 Hermes agents
- `HOOKS/HOOK_INDEX.md` — All 28 lifecycle hooks
- `TOOLS/TOOL_INDEX.md` — All 65+ tools
- `SKILLS/BRAINSTORM.md` — Socratic pre-planning
- `SKILLS/TDD.md` — RED-GREEN-REFACTOR cycle
- `BUILD/BUILD_START_HERE.md` — Implementation guide
- `BUILD/WEEKLY_SPRINT_PLAN.md` — 3-week sprint plan
- `BUILD/PHASE_CHECKLIST.md` — Implementation tracking
- `BUILD/PROGRESS_LOG.md` — Daily progress entries
- `REFERENCE/PLUGIN_SPEC.md` — SDK types and implementation spec
- `SOURCE_DECODED/PLUGIN_SDK_TYPES.md` — @opencode-ai/plugin SDK v1.1.53
