# HERMES AGENT PLUGIN — BUILD PROGRESS REPORT

**Generated:** 2026-04-13  
**Version:** v2.3.5 (latest build)  
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.5-build/`  
**Status:** REMOVED FROM OPENCOD — not currently active

---

## EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| **Build Status** | 94% complete |
| **Source Files** | 68 TypeScript files, ~3,700 lines |
| **Compiled Output** | 562KB at `dist/index.js` (April 12, 2026) |
| **Agents Registered** | 19 (1 primary, 18 subagents) |
| **Hooks Wired** | 29 hooks across 6 hook events |
| **Tools Registered** | 28 tools with Zod schemas |
| **E2E Test Pass Rate** | 144/147 (98.0%) at time of v2.3.5 build |
| **OpenCode Registration** | ❌ REMOVED — not in opencode.json |

---

## WHAT WORKS

### ✅ Core Architecture

| Component | Status | Notes |
|-----------|--------|-------|
| Plugin scaffold | ✅ WORKS | package.json, tsconfig.json, build.ts all functional |
| Plugin loads in OpenCode | ✅ WORKS | No import errors, all exports resolve |
| Agent tab toggle | ✅ WORKS | `hermes` appears as primary agent after v2.1 SDK fix |
| All 19 agents registered | ✅ WORKS | 1 primary (hermes), 18 subagents |
| Agent config SDK pattern | ✅ WORKS | `agent: {}` object + `config` callback, not `[]` array |

### ✅ Agents (19/19 — All Built)

| Agent | Role | Status |
|-------|------|--------|
| `hermes` | Orchestrator, 6-phase workflow enforcement | ✅ Built |
| `analyst` | Requirements → technical specs | ✅ Built |
| `builder` | TDD iron law, one task at a time | ✅ Built |
| `planner` | No-placeholder adaptive planning | ✅ Built |
| `tdd` | RED-GREEN-REFACTOR executor | ✅ Built |
| `reviewer` | Security + performance + patterns | ✅ Built |
| `quality-reviewer` | Spec compliance + readability | ✅ Built |
| `grill` | Adversarial attack vectors | ✅ Built |
| `ripple` | Cascading change analysis | ✅ Built |
| `drift-verifier` | Phase completion verification | ✅ Built |
| `explorer` | Codebase context mapping | ✅ Built |
| `architect` | Clean Architecture / DDD advocacy | ✅ Built |
| `debugger` | 4-phase systematic debugging | ✅ Built |
| `supervisor` | Graeme's self-improving loop | ✅ Built |
| `sme` | Subject matter expert | ✅ Built |
| `test-engineer` | Test strategy + coverage | ✅ Built |
| `docs` | Documentation updates | ✅ Built |
| `critic` | Critical analysis | ✅ Built |
| `memory` | Memory management | ✅ Built |

**Note:** All 19 agent prompts are built and compiled into dist/index.js. Whether they function correctly in actual delegation flows has not been verified end-to-end.

### ✅ Hooks (29/28 Specified — All Wired)

All hooks follow Spider Agent's `composeHandlers()` pattern with `isHermesAgent` guard:

| Hook | Event | Purpose |
|------|-------|---------|
| `brainstorm-gate` | `messages.transform` | HARD-GATE: no code until design approved |
| `plan-validator` | `messages.transform` | Reject TBD/TODO/placeholder |
| `tdd-enforcer` | `tool.execute.before` | Test file must exist before src change |
| `delegation-gate` | `tool.execute.before` | Coder blocked without reviewer approval |
| `phase-monitor` | `tool.execute.after` | Phase transition enforcement |
| `strict-write-discipline` | `messages.transform` | Verify cached context before acting |
| `adversarial-check` | `messages.transform` | Slop/bypass detection |
| `anti-rationalization` | `messages.transform` | Exit criteria checklist |
| `self-review` | `tool.execute.after` | Agent cannot approve own output |
| `debugging-spiral` | `tool.execute.after` | 5 identical calls = spiral detected |
| `knowledge-injector` | `tool.execute.after` | 2nd-brain recall every turn |
| `system-enhancer` | `chat.system.transform` | HERMES.md injection |
| `knowledge-curator` | `tool.execute.after` | Extract learnings from phases |
| `snapshot-writer` | `tool.execute.after` | Session snapshots on events |
| `compaction` | `session.compacting` | 5-tier token management |
| `guardrails` | `tool.execute.before` | Per-agent resource limits |
| `scope-guard` | `tool.execute.before` | File permission boundaries |
| `activity` | `tool.execute.before` | Tool call tracking |
| `delegation-ledger` | `tool.execute.after` | Delegation chain state |
| `drift-verifier-hook` | `tool.execute.after` | Phase completion verification |
| `adversarial-detector` | `messages.transform` | Gate bypass pattern detection |
| `ripple-check` | `tool.execute.after` | Cascading change analysis |
| `supervisor-ingest` | `tool.execute.after` | Feed supervisor loop |
| `complexity-routing` | `chat.params` | Auto-route by task complexity |
| `framework-pack` | `chat.system.transform` | Framework auto-detection |
| `intent-marker` | `messages.transform` | 4-marker protocol enforcement |
| `context-budget` | `chat.params` | Trigger compaction at 70% budget |
| `hermes-command` | `command.execute.before` | `/Hermes` CLI command routing |
| `supervisor-loop-hook` | `tool.execute.after` | Supervisor loop integration |

**Note:** All 29 hooks are wired in `src/index.ts`. Whether they fire correctly in actual OpenCode sessions has not been verified end-to-end.

### ✅ Tools (28/28 — All Built)

| Tool | Category | Status |
|------|----------|--------|
| `checkpoint` | Phase enforcement | ✅ Built |
| `phase_complete` | Phase enforcement | ✅ Built |
| `save_plan` | Phase enforcement | ✅ Built |
| `hermes_recall` | 2nd-brain | ✅ Built |
| `hermes_remember` | 2nd-brain | ✅ Built |
| `hermes_context` | 2nd-brain | ✅ Built |
| `lint` | Quality | ✅ Fixed in v2.3.5 (ESLint config fallback) |
| `diff` | Quality | ✅ Built |
| `build_check` | Quality | ✅ Built |
| `syntax_check` | Quality | ✅ Built |
| `test_runner` | Quality | ✅ Built |
| `placeholder_scan` | Quality | ✅ Built |
| `sast_scan` | Security | ⚠️ BROKEN — npm executable not found |
| `secret_scan` | Security | ✅ Built |
| `complexity_hotspots` | Analysis | ✅ Fixed in v2.3.5 (O(n²) detection) |
| `detect_domains` | Analysis | ✅ Built |
| `extract_code_blocks` | Analysis | ✅ Built |
| `imports` | Analysis | ⚠️ PARTIALLY BROKEN — path resolution |
| `symbols` | Analysis | ⚠️ PARTIALLY BROKEN — path resolution |
| `grill` | Verification | ⚠️ CONFLICTING — may be fixed, unclear |
| `verify` | Verification | ✅ Built |
| `health` | Verification | ✅ Built |
| `evidence_check` | Verification | ✅ Built |
| `retrieve_summary` | Verification | ✅ Built |
| `list_sessions` | Session | ✅ Fixed in v2.3.5 (worktree fallback) |
| `load_session` | Session | ✅ Fixed in v2.3.5 (worktree fallback) |
| `fork_session` | Session | ✅ Built |
| `create_snapshot` | Session | ✅ Built |

### ✅ Phase State Machine

| Phase | Transitions Allowed | Status |
|-------|---------------------|--------|
| `idle` | → analyze | ✅ Working |
| `analyze` | → plan, → idle | ✅ Working |
| `plan` | → build, → idle | ✅ Working |
| `build` | → review, → debug, → idle | ✅ Working |
| `review` | → complete, → build, → debug, → idle | ✅ Working |
| `debug` | → build, → review, → complete, → idle | ✅ Working |
| `complete` | (terminal) | ✅ Working |

**Phase persistence:** ✅ Fixed in v2.3.5 — phase state saved to `.hermes/phase.json` to survive hot-reload.

### ✅ Framework Detection (12 Frameworks)

| Framework | Detection Pattern | Status |
|-----------|-----------------|--------|
| Next.js | `next.config.js` / `next.config.ts` | ✅ Built |
| React | `package.json` + `components/` | ✅ Built |
| Vue | `vue.config.js` | ✅ Built |
| Svelte | `svelte.config.js` | ✅ Built |
| Python | `requirements.txt`, `setup.py` | ✅ Built |
| Django | `manage.py`, `settings.py` | ✅ Built |
| FastAPI | `main.py`, `requirements.txt` | ✅ Built |
| Go | `go.mod` | ✅ Built |
| Rust | `Cargo.toml` | ✅ Built |
| Kubernetes | `Dockerfile`, `*.yaml` | ✅ Built |
| Docker | `Dockerfile`, `docker-compose.yml` | ✅ Built |

### ✅ 2nd-Brain Memory System

| Tool | Status | Storage Location |
|------|--------|-------------------|
| `hermes_recall` | ✅ Functional | `~/.hermes/memory/` |
| `hermes_remember` | ✅ Functional | `~/.hermes/memory/` |
| `hermes_context` | ✅ Functional | Injected via hook every turn |
| Phase persistence | ✅ Fixed in v2.3.5 | `~/.hermes/phase.json` |

### ✅ Session Persistence

| Tool | Status | Notes |
|------|--------|-------|
| `list_sessions` | ✅ Fixed in v2.3.5 | worktree fallback added |
| `load_session` | ✅ Fixed in v2.3.5 | worktree fallback added |
| `fork_session` | ✅ Built | Branch from past session |
| `create_snapshot` | ✅ Built | Session snapshot creation |

---

## WHAT IS BROKEN

### ❌ UNRESOLVED BUGS (3)

#### 1. `sast_scan` — npm executable not found

```
npm error could not determine executable to run
```

| Attribute | Value |
|-----------|-------|
| **Bug ID** | BUG-007 |
| **File** | `src/tools/security.ts` |
| **Severity** | HIGH |
| **Status** | **UNFIXED** — not addressed in v2.3.5 |
| **Root Cause** | SAST tool (eslint-plugin-security) not installed globally, and plugin doesn't use npx or bundle its own tool |
| **Fix Required** | Either install the tool globally, use `npx` with explicit package, or bundle a local SAST tool |

#### 2. `imports` / `symbols` — File path resolution broken

```
Could not read file: /home/leviathan/OPENCODE_WORKSPACE/hermes-test-project/src/api/routes.ts
Could not read file: /home/leviathan/OPENCODE_WORKSPACE/hermes-test-project/src/core/processor.py
```

| Attribute | Value |
|-----------|-------|
| **Bug ID** | BUG-006 |
| **File** | `src/tools/analysis.ts` |
| **Severity** | HIGH |
| **Status** | **UNFIXED** — not addressed in v2.3.5 |
| **Root Cause** | Path resolution doesn't account for workspace prefix — tools receive relative paths but try to read them as absolute |
| **Fix Required** | Add workspace root prefix resolution to both `imports` and `symbols` tools |

#### 3. `grill` — "Could not analyze" for all targets

```
Could not analyze
```

| Attribute | Value |
|-----------|-------|
| **Bug ID** | BUG-008 |
| **File** | `src/tools/verification.ts` |
| **Severity** | MEDIUM |
| **Status** | **CONFLICTING** — v2.3.5 BUILD_REPORT.md claims fix at line 15325 (scanDir), but v2.1 BUILD_LOG.md still shows as NEEDS FIX. Unclear if actually fixed. |
| **Root Cause** | Directory scanning calls `readFileSync` on directory path without checking if target is a directory first |
| **Fix Required** | Verify against current v2.3.5 dist, confirm scanDir is actually present and functional |

---

## WHAT HAS NOT BEEN VERIFIED

The following features are **built but never tested in a real OpenCode session**. They may work, partially work, or be completely broken — no verification exists.

### Unverified Core Flows

| Feature | Built | Verified |
|---------|-------|----------|
| **Brainstorm Gate** — blocks code in idle phase until design approved | ✅ | ❌ NEVER TESTED |
| **No-placeholder Plan** — plan-validator rejects TBD/TODO | ✅ | ❌ NEVER TESTED |
| **TDD Enforcement** — tdd-enforcer blocks src without test | ✅ | ❌ NEVER TESTED |
| **Phase transitions** — phase_complete actually advances state machine | ✅ | ❌ NEVER TESTED |
| **3-Strike Debugging** — debugging-spiral triggers architect review | ✅ | ❌ NEVER TESTED |
| **5-tier Compaction** — triggers at 70%/80%/95% thresholds | ✅ | ❌ NEVER TESTED |
| **Graeme's Supervisor Loop** — monitor→supervisor→auditor self-improving | ✅ | ❌ NEVER TESTED |
| **Multi-agent delegation** — hermes→analyst→builder→reviewer chain | ✅ | ❌ NEVER TESTED |

### Unverified Hooks (27 of 29)

Only `brainstorm-gate` and `tdd-enforcer` have documented test coverage. All other hooks are verified only by existence — not by actual firing in a session.

| Hook | Event | Verified in Session? |
|------|-------|---------------------|
| plan-validator | messages.transform | ❌ NO |
| delegation-gate | tool.execute.before | ❌ NO |
| phase-monitor | tool.execute.after | ❌ NO |
| strict-write-discipline | messages.transform | ❌ NO |
| adversarial-check | messages.transform | ❌ NO |
| anti-rationalization | messages.transform | ❌ NO |
| self-review | tool.execute.after | ❌ NO |
| debugging-spiral | tool.execute.after | ❌ NO |
| knowledge-injector | tool.execute.after | ❌ NO |
| system-enhancer | chat.system.transform | ❌ NO |
| knowledge-curator | tool.execute.after | ❌ NO |
| snapshot-writer | tool.execute.after | ❌ NO |
| compaction | session.compacting | ❌ NO |
| guardrails | tool.execute.before | ❌ NO |
| scope-guard | tool.execute.before | ❌ NO |
| activity | tool.execute.before | ❌ NO |
| delegation-ledger | tool.execute.after | ❌ NO |
| drift-verifier-hook | tool.execute.after | ❌ NO |
| adversarial-detector | messages.transform | ❌ NO |
| ripple-check | tool.execute.after | ❌ NO |
| supervisor-ingest | tool.execute.after | ❌ NO |
| complexity-routing | chat.params | ❌ NO |
| framework-pack | chat.system.transform | ❌ NO |
| intent-marker | messages.transform | ❌ NO |
| context-budget | chat.params | ❌ NO |
| hermes-command | command.execute.before | ❌ NO |
| supervisor-loop-hook | tool.execute.after | ❌ NO |

### Unverified Tools (12 of 28)

The following tools passed E2E tests but E2E tests execute tools in isolation with a mock context — they don't verify the tools work in actual OpenCode agent sessions:

- `save_plan` — JSON + Markdown output, never tested with real plan content
- `placeholder_scan` — pattern matching, never tested with real placeholder-heavy code
- `build_check` — npm build, never tested on actual project with build failures
- `syntax_check` — tsc, never tested on actual project with type errors
- `test_runner` — npm test, never tested on actual project with failing tests
- `detect_domains` — pattern matching, never tested on real domain structures
- `extract_code_blocks` — parsing, only tested on simple snippets
- `drift-verifier` — phase completion, never verified against actual phase transitions
- `verify` — proof-based, never tested with actual completion claims
- `health` — project health score, never tested across different project states
- `evidence_check` — never tested with real evidence vs claims
- `retrieve_summary` — never tested with actual session history

---

## BUILD HISTORY

| Version | Date | Key Changes | Status |
|---------|------|-------------|--------|
| v1 | Early | Initial build attempt | ❌ FAILED — no dist |
| v2 | 2026-04-02 | First build with agents | ❌ FAILED — SDK ignored agent array |
| v2.1 | 2026-04-04 | Fixed SDK pattern, agent registration | ⚠️ PARTIAL — 3 bugs unfixed |
| v2.2 | 2026-04-05 | Iterative fixes | ⚠️ PARTIAL — still had unfixed bugs |
| v2.3 | 2026-04-06 | More fixes | ⚠️ PARTIAL — dist never rebuilt |
| v2.3.1 | 2026-04-07 | Copy of v2.3 | ⚠️ PARTIAL |
| v2.3.2 | 2026-04-07 | Copy of v2.3 | ⚠️ PARTIAL |
| v2.3.3 | 2026-04-07 | Exercise fixes (source only) | ⚠️ PARTIAL — dist not rebuilt |
| v2.3.4 | 2026-04-07 | Copy of v2.3.3 | ⚠️ PARTIAL |
| **v2.3.5** | **2026-04-07** | **lint fix + rebuild dist** | **BEST BUILD** — 98% E2E pass rate |

---

## CRITICAL LESSONS LEARNED

### 1. Build command errors caused months of confusion

The BUILD_PROMPT.md told agents to run `bun build dist/index.ts` (WRONG) instead of `bun build.ts`. This meant v2.3.3's dist was NEVER rebuilt with its fixes — E2E tests ran against stale v2.3.2 code.

**Fix:** Always verify dist is newer than source: `stat dist/index.js` vs `stat src/index.ts`

### 2. Document conflicts obscure true state

v2.3.5's BUILD_REPORT.md claims `grill` is fixed at line 15325, but BUILD_LOG.md (still referencing v2.1 state) shows it as NEEDS FIX. When fixing, always verify against actual source and dist — not documentation.

### 3. E2E tests ≠ integration tests

E2E tests run tools in isolation with a mock context. They pass even when tools are broken in actual OpenCode sessions because:
- Real context.worktree values differ from mock
- Real file paths resolve differently than test fixtures
- Real OpenCode hooks fire in different order than test assumes

### 4. Hook verification is the gap

Every hook exists on paper. Zero hooks have been verified firing in a real multi-turn OpenCode session with actual agent delegation.

---

## PATH FORWARD — OPTIONS

### Option A: Fix and Verify (4-8 hours)

**Fix the 3 unfixed bugs:**
1. `sast_scan` — use `npx eslint-plugin-security` or bundle a local tool
2. `imports`/`symbols` — add workspace root prefix resolution
3. `grill` — verify actual fix state, rebuild if needed

**Run full integration tests:**
1. Start OpenCode with hermes-agent-plugin loaded
2. Run a complete feature through all 6 phases
3. Verify hooks fire correctly at each transition
4. Test multi-agent delegation: hermes→analyst→builder→reviewer

**Expected outcome:** ~85% verified working

### Option B: Simplify Scope (2-4 hours)

The original spec (19 agents, 28 hooks, 28 tools) was over-ambitious for a single build cycle. Strip down to:

- **Core:** hermes orchestrator + 3 subagents (analyst, builder, reviewer)
- **Phase enforcement:** brainstorm-gate + phase_complete only
- **Memory:** hermes_recall/remember only
- **Verification:** lint + test_runner only

**Expected outcome:** ~60% of current code, but fully verified working

### Option C: Remove (5 minutes)

Remove the plugin entirely. The 3 broken tools, unverified hooks, and untested delegation flow mean the plugin provides negative value — it looks functional in the tab toggle but fails on any meaningful task.

**Expected outcome:** No maintenance burden, but all build work is shelved.

---

## APPENDIX: FILE MANIFEST

### Source Structure

```
v2.3.5-build/
├── src/
│   ├── index.ts                    # Plugin entry, wires all components
│   ├── agents/                     # 19 agent prompt definitions
│   │   ├── hermes.ts
│   │   ├── analyst.ts
│   │   ├── builder.ts
│   │   ├── planner.ts
│   │   ├── tdd.ts
│   │   ├── reviewer.ts
│   │   ├── quality-reviewer.ts
│   │   ├── grill.ts
│   │   ├── ripple.ts
│   │   ├── drift-verifier.ts
│   │   ├── explorer.ts
│   │   ├── architect.ts
│   │   ├── debugger.ts
│   │   ├── supervisor.ts
│   │   ├── sme.ts
│   │   ├── test-engineer.ts
│   │   ├── docs.ts
│   │   ├── critic.ts
│   │   └── memory.ts
│   ├── hooks/                     # 29 hook implementations
│   │   ├── brainstorm-gate.ts
│   │   ├── plan-validator.ts
│   │   ├── tdd-enforcer.ts
│   │   ├── delegation-gate.ts
│   │   ├── phase-monitor.ts
│   │   ├── strict-write-discipline.ts
│   │   ├── adversarial-check.ts
│   │   ├── anti-rationalization.ts
│   │   ├── self-review.ts
│   │   ├── debugging-spiral.ts
│   │   ├── knowledge-injector.ts
│   │   ├── system-enhancer.ts
│   │   ├── knowledge-curator.ts
│   │   ├── snapshot-writer.ts
│   │   ├── compaction.ts
│   │   ├── guardrails.ts
│   │   ├── scope-guard.ts
│   │   ├── activity.ts
│   │   ├── delegation-ledger.ts
│   │   ├── drift-verifier-hook.ts
│   │   ├── adversarial-detector.ts
│   │   ├── ripple-check.ts
│   │   ├── supervisor-ingest.ts
│   │   ├── complexity-routing.ts
│   │   ├── framework-pack.ts
│   │   ├── intent-marker.ts
│   │   ├── context-budget.ts
│   │   ├── hermes-command.ts
│   │   └── supervisor-loop-hook.ts
│   ├── tools/                     # 28 tool implementations
│   │   ├── analysis.ts            # imports, symbols, complexity_hotspots, detect_domains, extract_code_blocks
│   │   ├── checkpoint.ts
│   │   ├── create-tool.ts
│   │   ├── hermes-context.ts
│   │   ├── hermes-recall.ts
│   │   ├── hermes-remember.ts
│   │   ├── phase-complete.ts
│   │   ├── quality.ts             # lint, diff, build_check, syntax_check, test_runner, placeholder_scan
│   │   ├── save-plan.ts
│   │   ├── security.ts            # sast_scan, secret_scan
│   │   ├── session-tools.ts       # list_sessions, load_session, fork_session, create_snapshot
│   │   ├── supervisor.ts
│   │   └── verification.ts        # grill, verify, health, evidence_check, retrieve_summary
│   ├── config/
│   │   ├── constants.ts           # AGENT_NAMES, PHASES, PHASE_TRANSITIONS
│   │   └── schema.ts              # HermesAgentConfig Zod schema
│   └── services/
│       └── session-db.ts          # Session persistence
├── dist/
│   └── index.js                   # 562KB compiled plugin
├── test-e2e.ts                    # E2E test suite
├── build.ts                       # Build script
├── package.json
└── tsconfig.json
```

### OpenCode Registration (REMOVED)

```json
// Current opencode.json — hermes-agent-plugin NOT present
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
  ]
}

// To re-register v2.3.5:
// Add: "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.5-build/dist/index.js"
```