# HERMES AGENT — Definitive Architecture
## Synthesized from Spider Agent, Superpowers, Specialist Agent, Aura Frog, mal_shaik, and Graeme

**Date**: 2026-04-01
**Status**: Complete synthesis — ready to build

---

## Architecture Overview

```
╔══════════════════════════════════════════════════════════════════════╗
║                      HERMES AGENT (OpenCode Plugin)                  ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  LEVIATHAN (human)                                                  ║
║       │                                                             ║
║       ▼                                                             ║
║  ┌─────────────────────────────────────────────────────────────┐     ║
║  │  ~/.hermes/HERMES.md         ← Leviathan's conventions      │     ║
║  │  ~/.hermes/settings.json     ← permissions, model tiering    │     ║
║  └─────────────────────────────────────────────────────────────┘     ║
║       │                                                             ║
║       ▼                                                             ║
║  ┌─────────────────────────────────────────────────────────────┐     ║
║  │  HERMES ORCHESTRATOR (primary agent)                         │     ║
║  │  • 7-phase workflow enforcement                             │     ║
║  │  • Brainstorm gate (HARD-GATE)                             │     ║
║  │  • Routes to subagents                                      │     ║
║  │  • Owns 2nd-brain memory                                    │     ║
║  └───────────────────────────┬─────────────────────────────────┘     ║
║                              │                                       ║
║       ┌──────────────────────┼──────────────────────┐                ║
║       ▼                      ▼                      ▼                ║
║  ┌──────────┐         ┌──────────────┐       ┌──────────────┐       ║
║  │ EXECUTION│         │  SUPERVISOR  │       │   2ND-BRAIN  │       ║
║  │  SPOKE   │         │    SPOKE     │       │    SPOKE     │       ║
║  │          │         │              │       │              │       ║
║  │14 agents │         │ 3-agent loop │       │ recall/      │       ║
║  │parallel  │         │monitor/log/  │       │ remember/    │       ║
║  │dispatch  │         │fix+Graeme 4- │       │ context      │       ║
║  │          │         │marker protocol│       │ injection    │       ║
║  │ @tdd     │         │              │       │              │       ║
║  │ @analyst │         │              │       │              │       ║
║  │ @ripple  │         │              │       │              │       ║
║  │ @grill   │         │              │       │              │       ║
║  │ (more)   │         │              │       │              │       ║
║  └──────────┘         └──────────────┘       └──────────────┘       ║
║                                                                      ║
║  ┌─────────────────────────────────────────────────────────────┐     ║
║  │  ~/hermes-workspace/           ← Hermes 2nd-brain           │     ║
║  │  • .state/session snapshots                                 │     ║
║  │  • context/engineering/                                   │     ║
║  │  • skills/                                                 │     ║
║  │  • Telegram backlog                                         │     ║
║  └─────────────────────────────────────────────────────────────┘     ║
║                                                                      ║
║  HERMES AGENT PLUGIN: ~/hermes-agent/                                ║
║  Plugin SDK: opencode-swarm/node_modules/@opencode-ai/plugin/         ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Part 1: The Source — What Each System Contributed

### Spider Agent (68,504-line compiled bundle)
**What it gave us**: The definitive proof that hook-based enforcement works at scale.

| Pattern | How We Use It |
|--------|--------------|
| 21 hook factories composed into one `Hooks` object | Template for our hook system |
| `createDelegationGateHook` — blocks coder without reviewer approval | Core enforcement mechanism, ported directly |
| `taskWorkflowStates` state machine: `idle→coder_delegated→pre_check_passed→reviewer_run→tests_run→complete` | Phase enforcement, ported directly |
| `AGENT_TOOL_MAP` — 40 tools per agent with tool filters | Tool permission model |
| `createSlopDetectorHook` — pattern-matches quality degradation | Quality gate, enhanced |
| `createDebuggingSpiralHook` — 5 same calls in 5min = spiral | Debug enforcement, ported directly |
| 11-agent hub-and-spoke with `primary`/`subagent` mode flags | Agent taxonomy base |
| Session snapshot on tool events | Session persistence, enhanced |
| `createSelfReviewHook` — agent cannot approve own output | Anti-rationalization, ported directly |

### Superpowers (obra/superpowers, 125k stars)
**What it gave us**: The workflow discipline. The prompts that enforce rigor.

| Pattern | How We Use It |
|--------|--------------|
| `<HARD-GATE>` — no implementation until design approved | Phase 0 brainstorm gate, verbatim |
| No-placeholder planning — exact paths, actual code, run commands | Phase 1 plan enforcement, verbatim |
| TDD iron law — no prod code without failing test first | Phase 2 build enforcement, verbatim |
| Two-stage review: spec compliance + quality | Phase 3 review structure, verbatim |
| 3-strike debugging rule → architecture review | Phase 4 debug enforcement, verbatim |
| 7-phase mandatory workflow | Our Phase 0-6 structure, verbatim |
| Subagent status protocol: DONE / NEEDS_CONTEXT / BLOCKED | Subagent communication, verbatim |

### Specialist Agent (36 agents, 32 skills, GitHub)
**What it gave us**: Agent taxonomy and the Full/Lite model.

| Pattern | How We Use It |
|--------|--------------|
| Full + Lite agent variants (60-80% cost reduction) | Every agent has Full/Lite modes |
| `@analyst` — requirements → technical specs | Phase 0 brainstorm gate |
| `@ripple` — cascading change analysis | Pre-build risk assessment |
| `@tdd` — explicit RED-GREEN-REFACTOR cycle | Phase 2 build |
| `@grill` — adversarial attack vectors | Phase 3 post-review |
| `/verify` — proof-based verification | Phase 5 completion |
| `/health` — project health score 0-100 | Phase 5 completion |
| `/brainstorm` — Socratic pre-planning | Phase 0 |
| `/debug` — 4-phase systematic debugging | Phase 4 |
| Anti-rationalization tables | Built into every agent prompt |
| Verification protocol — show command output before claiming done | Built into every agent prompt |
| Context isolation — fresh context per subtask | Subagent dispatch model |

### Aura Frog (10 agents, 43 skills, GitHub)
**What it gave us**: The LLM OS mental model and context discipline.

| Pattern | How We Use It |
|--------|--------------|
| LLM OS metaphor: Claude=kernel, agents=processes, context=RAM | Architecture framing |
| Memory That Heals Itself: verify cached context before use, update only after confirmed success | Strict Write Discipline, verbatim |
| 5-phase TDD: Understand→RED→GREEN→Refactor→Finalize | Phase 2 build, mapped to our workflow |
| 3-tier compaction: MicroCompact (every 10 turns) / AutoCompact (80%) / ManualCompact (handoff) | Token management |
| 26 conditional hooks (~40% fewer executions) | Hook efficiency pattern |
| Smart Complexity Routing — effort matches task size | Complexity classifier hook |
| Framework packs (Next.js, React, etc.) | Project auto-detection + context injection |

### mal_shaik (7 secrets from Claude Code source)
**What it gave us**: The runtime mechanics. Implementation-level truth from source code.

| Pattern | How We Use It |
|--------|--------------|
| CLAUDE.md read every TURN (40K chars) not just session start | `~/.hermes/HERMES.md` — Leviathan's conventions, read every turn |
| Subagent cache — 5 parallel agents cost ≈ 1 | All parallel dispatches happen simultaneously |
| 3 execution models: fork (cache) / teammate (tmux) / worktree (git) | Agent dispatch modes |
| Permission 5-level cascade: policy > flag > local > project > user | `~/.hermes/settings.json` permission config |
| 5 compaction strategies: micro / context collapse / session memory / full / PTL | Token budget + compaction hook |
| 25+ hook lifecycle events | Our hook system events |
| `--continue` / `--resume` / `--fork-session` persistence | SessionDB with resume + branch |

### Graeme (3-agent self-improving + 4-marker protocol)
**What it gave us**: The supervisor loop and inter-agent communication protocol.

| Pattern | How We Use It |
|--------|--------------|
| 3-agent loop: operator → supervisor → auditor | Phase 6 supervisor implementation |
| Low-risk fixes auto-apply, high-risk escalate | Risk classifier in supervisor hook |
| 4-marker intent protocol: [STATUS_REQUEST][REVIEW_REQUEST][ESCALATION_NOTICE][ACK] | Inter-agent messaging format |
| [ACK] = terminal stop, max 3-message loop | Supervisor loop termination |
| One message per turn, no reply chains | Inter-agent comms rules |

---

## Part 2: The Definitive 6-Phase Workflow

```
╔══════════════════════════════════════════════════════════════════════╗
║                      6-PHASE ENFORCEMENT PIPELINE                   ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  PHASE 0: BRAINSTORM GATE  ──────────────────────────────────────   ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │ <HARD-GATE> — No code until design approved                  │    ║
║  │                                                              │    ║
║  │ 1. @analyst: Validate requirements are concrete enough        │    ║
║  │ 2. Present 2-3 approaches with trade-offs + recommendation │    ║
║  │ 3. @ripple: "What else changes if we build this?"           │    ║
║  │ 4. Write design doc → ~/hermes-workspace/docs/plans/        │    ║
║  │ 5. Self-review: anti-rationalization checklist               │    ║
║  │ 6. USER APPROVAL GATE ← Explicit. Blocks until approved.    │    ║
║  │ 7. → PHASE 1                                                  │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                              │                                       ║
║                              ▼                                       ║
║  PHASE 1: PLAN  ────────────────────────────────────────────────   ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │ <NO-PLACEHOLDER> — Plan fails if any TBD/TODO/stub         │    ║
║  │                                                              │    ║
║  │ Every step MUST have:                                       │    ║
║  │   • Exact file paths (created AND modified)                  │    ║
║  │   • Actual code blocks (not "implement X")                  │    ║
║  │   • Exact test commands with expected output                │    ║
║  │   • Exact acceptance criteria                               │    ║
║  │                                                              │    ║
║  │ Anti-rationalization self-review checklist                  │    ║
║  │ @analyst verifies: requirements → spec completeness          │    ║
║  │ → PHASE 2 (only after plan passes validator hook)           │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                              │                                       ║
║                              ▼                                       ║
║  PHASE 2: BUILD  ────────────────────────────────────────────────   ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │ <TDD IRON LAW> — Test fails before src compiles            │    ║
║  │                                                              │    ║
║  │ FOR EACH TASK (sequential, no batching):                     │    ║
║  │   @tdd: RED → Failing test written, shown to user           │    ║
║  │   @tdd: GREEN → Minimal code to pass                        │    ║
║  │   @tdd: REFACTOR → Clean up                                 │    ║
║  │   @ripple: "What cascading changes?" (post each file)       │    ║
║  │   Verification: show actual command output before "done"     │    ║
║  │   Strict Write Discipline: verify cached context before act   │    ║
║  │ → PHASE 3 (only after all tasks pass)                       │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                              │                                       ║
║                              ▼                                       ║
║  PHASE 3: REVIEW  ──────────────────────────────────────────────   ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │ <TWO-STAGE + ADVERSARIAL>                                  │    ║
║  │                                                              │    ║
║  │ STAGE 1 — @quality-reviewer                                 │    ║
║  │   Spec compliance? Under-building? Over-building?            │    ║
║  │   Readability, patterns, conventions                        │    ║
║  │                                                              │    ║
║  │ STAGE 2 — @reviewer                                         │    ║
║  │   Security (OWASP Top 10)                                    │    ║
║  │   Performance implications                                  │    ║
║  │   Architecture fit                                          │    ║
║  │                                                              │    ║
║  │ ADVERSARIAL — @grill                                        │    ║
║  │   Attack vectors: "how would you break this?"               │    ║
║  │   Edge cases, failure modes, boundary conditions             │    ║
║  │ → PHASE 4 (only after all stages pass)                     │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                              │                                       ║
║                              ▼                                       ║
║  PHASE 4: DEBUG (if bug found)  ────────────────────────────────   ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │ <3-STRIKE RULE> — 3 failures → architecture review         │    ║
║  │                                                              │    ║
║  │ 1. Reproduce — exact steps to see failure                   │    ║
║  │ 2. Isolate — smallest possible reproduction               │    ║
║  │ 3. Hypothesis — one cause (not "probably")                  │    ║
║  │ 4. Fix — smallest change that fixes                        │    ║
║  │ 5. Verify — test passes                                    │    ║
║  │                                                              │    ║
║  │ After 3 failed attempts on same bug:                        │    ║
║  │   → MANDATORY @architect review                             │    ║
║  │   → User must approve before continuing                     │    ║
║  │ → PHASE 5                                                   │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                              │                                       ║
║                              ▼                                       ║
║  PHASE 5: COMPLETION  ──────────────────────────────────────────   ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │ • /verify — proof-based verification                        │    ║
║  │ • @health — project health score (0-100)                   │    ║
║  │ • Update relevant docs                                      │    ║
║  │ • Conventional commit message                               │    ║
║  │ • Create PR / merge request                                │    ║
║  │ • Snapshot session state → ~/hermes-workspace/.state/       │    ║
║  │ • Inject learnings into 2nd-brain                           │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
║  PHASE 6: SUPERVISOR LOOP (continuous background)  ──────────────   ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │ GRAEME 3-AGENT SELF-IMPROVING LOOP                         │    ║
║  │                                                              │    ║
║  │ Agent 2 (Supervisor):                                      │    ║
║  │   • Monitor agent-swarm logs (localhost:3013)              │    ║
║  │   • Detect: failed tasks, stale jobs, repeated bugs         │    ║
║  │   • Propose fixes with risk classification                  │    ║
║  │                                                              │    ║
║  │ Agent 3 (Auditor):                                         │    ║
║  │   • Verify supervisor proposals before apply               │    ║
║  │   • Cross-reference patterns from prior sessions            │    ║
║  │                                                              │    ║
║  │ Low-risk: auto-apply + log to audit trail                  │    ║
║  │ High-risk: [ESCALATION_NOTICE] → Leviathan notified        │    ║
║  │                                                              │    ║
║  │ 4-MARKER INTENT PROTOCOL (Graeme):                         │    ║
║  │   [STATUS_REQUEST] → ask for status                        │    ║
║  │   [REVIEW_REQUEST] → ask for review                        │    ║
║  │   [ESCALATION_NOTICE] → human notified                      │    ║
║  │   [ACK] → terminal. Stop. No reply. Max 3msg loop.         │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Part 3: The 14 Hermes Agents

Every agent has **Full** (capable model, complex work) and **Lite** (cheap model, scaffolding) modes.

### Orchestrator (1)
| Agent | Mode | Role |
|-------|------|------|
| `hermes` | primary | Persistent 2nd-brain orchestrator. Routes to subagents. Enforces Phase 0-5 pipeline. Owns HERMES.md context injection every turn. |

### Execution Spoke — Core (5)
| Agent | Mode | Role | Lite use |
|-------|------|------|----------|
| `@analyst` | subagent | Requirements → technical specs. Validates requirements are concrete enough for Phase 0. | Scaffolding specs |
| `@planner` | subagent | Adaptive planning by complexity. Produces no-placeholder Phase 1 plans. | Quick estimates |
| `@tdd` | subagent | RED-GREEN-REFACTOR cycle. Explicit TDD enforcement in Phase 2. | Scaffold tests |
| `@builder` | subagent | Implementation. One task at a time. Verification protocol: show output before claiming done. | Simple fixes |
| `@reviewer` | subagent | Stage 2 review: security, performance, architecture. | Quick review |

### Execution Spoke — Quality (4)
| Agent | Mode | Role |
|-------|------|------|
| `@quality-reviewer` | subagent | Stage 1 review: spec compliance, readability, conventions |
| `@grill` | subagent | Adversarial testing: attack vectors, edge cases, failure modes |
| `@ripple` | subagent | Cascading change analysis: "what else changes if we change X?" |
| `@drift-verifier` | subagent | Phase completion verification. Confirms state machine advanced correctly. |

### Execution Spoke — Support (3)
| Agent | Mode | Role |
|-------|------|------|
| `@explorer` | subagent | Codebase context gathering. Maps dependencies, conventions, architecture. |
| `@architect` | subagent | Clean Architecture / DDD / Hexagonal architecture advocacy. 3-strike escalation target. |
| `@debugger` | subagent | 4-phase systematic debugging. Hypothesis-driven, not brute-force. |

### Supervisor Spoke (1)
| Agent | Mode | Role |
|-------|------|------|
| `@supervisor` | subagent | Graeme's Agent 2. Monitors logs, proposes fixes with risk level. Agent 3 (auditor) is a separate invocation of this same agent in verification mode. |

### Always-Lite Agents (no Full mode needed)
| Agent | Mode | Role |
|-------|------|------|
| `@sme` | subagent | Subject matter expert consultation. Domain research. |
| `@test-engineer` | subagent | Test strategy, coverage analysis, test suite health |
| `@docs` | subagent | Documentation updates, README, API docs |
| `@critic` | subagent | Plan critique before implementation. Sounding board. |
| `@memory` | subagent | Cross-session decision persistence. `/remember` and `/recall` execution. |

---

## Part 4: Hook System — 28 Lifecycle Hooks

### Hook Architecture (from Spider + mal_shaik + Aura Frog)

```typescript
// Hook composition pattern (from Spider Agent)
return {
  name: "hermes-agent",
  agent: [...],      // SDK agent configs
  tool: {...},       // Custom tools
  
  // Hooks — composed from factories
  "experimental.chat.messages.transform": composeHandlers([
    delegationGateHook,          // Spider: blocks coder without reviewer
    contextBudgetHandler,        // mal_shaik: token budget at 70%
    planValidatorHook,           // Superpowers: no-placeholder
    tddEnforcerHook,             // Superpowers: test-first
    strictWriteDisciplineHook,   // Aura Frog: verify before act
    adversarialCheckHook,         // Specialist: slop/s椅op detection
    antiRationalizationHook,     // Specialist: exit criteria
    knowledgeInjectorHook,        // Spider: 2nd-brain recall
  ]),
  
  "experimental.chat.system.transform": composeHandlers([
    systemEnhancerHook,           // Inject HERMES.md every turn
    brainstormGateHook,           // HARD-GATE enforcement
    phaseMonitorHook,             // Phase transition enforcement
  ]),
  
  "experimental.session.compacting": compactionHook,
  
  "tool.execute.before": composeHandlers([
    guardrailsHook,              // Spider: resource limits per agent
    scopeGuardHook,              // Spider: file permission boundaries
    delegationGateHook.toolBefore, // Spider: blocks re-delegation
    activityHook.toolBefore,       // Spider: tool call tracking
    tddEnforcerHook.toolBefore,    // Superpowers: verify test-first
    strictWriteDisciplineHook.toolBefore, // Aura Frog
  ]),
  
  "tool.execute.after": composeHandlers([
    activityHook.toolAfter,        // Spider: track tool results
    guardrailsHook.toolAfter,      // Spider: update counters
    delegationLedgerHook.toolAfter, // Spider: delegation state machine
    selfReviewHook.toolAfter,      // Spider: cannot approve own work
    driftVerifierHook.toolAfter,    // Spider: phase completion
    knowledgeCuratorHook.toolAfter, // Spider: extract learnings
    snapshotWriterHook,            // Spider: session snapshot
    toolSummarizerHook,            // Spider: truncate large outputs
    debuggingSpiralHook,           // Spider: 5 same calls = spiral
    adversarialDetectorHook,       // Specialist: gate bypass detection
    rippleCheckHook,               // Specialist: cascading changes
    supervisorIngestHook,          // Graeme: feed supervisor logs
  ]),
  
  "chat.message": safeHook(delegationHandler), // Spider
  "command.execute.before": safeHook(commandHandler), // Spider
  
  automation: automationManager,  // Spider: background workers
};
```

### The 28 Hooks Defined

| # | Hook | Source | Purpose |
|---|------|--------|---------|
| 1 | `delegationGateHook` | Spider | Blocks coder without reviewer approval. Enforces state machine transitions. |
| 2 | `contextBudgetHandler` | mal_shaik | Triggers compaction at 70% token budget. |
| 3 | `planValidatorHook` | Superpowers | Rejects plans with TBD/TODO/placeholder. |
| 4 | `tddEnforcerHook` | Superpowers | Blocks src file change before test file created. |
| 5 | `strictWriteDisciplineHook` | Aura Frog | Verifies cached context against actual files before acting. |
| 6 | `adversarialCheckHook` | Specialist | Pattern-matches output for quality degradation (slop). |
| 7 | `antiRationalizationHook` | Specialist | Injects exit criteria checklist before completion claims. |
| 8 | `knowledgeInjectorHook` | Spider | Injects 2nd-brain recall results into context every turn. |
| 9 | `systemEnhancerHook` | Spider | Injects HERMES.md + phase reminders into system prompt. |
| 10 | `brainstormGateHook` | Superpowers | HARD-GATE: blocks implementation until user approval. |
| 11 | `phaseMonitorHook` | Spider | Tracks phase transitions, blocks out-of-order phases. |
| 12 | `compactionHook` | mal_shaik + Spider | 5-tier compaction: micro/auto/manual/session/full. |
| 13 | `guardrailsHook` | Spider | Per-agent resource limits (max_tool_calls, timeouts). |
| 14 | `scopeGuardHook` | Spider | Enforces file permission boundaries per agent. |
| 15 | `activityHook` | Spider | Tracks tool calls per agent, detects anomalies. |
| 16 | `delegationLedgerHook` | Spider | Records delegation chain, updates task state machine. |
| 17 | `selfReviewHook` | Spider | Agent cannot approve its own output. |
| 18 | `driftVerifierHook` | Spider | Confirms phase completion matches plan. |
| 19 | `knowledgeCuratorHook` | Spider | Extracts learnings from completed phases. |
| 20 | `snapshotWriterHook` | Spider | Writes session snapshot to `.state/` after key events. |
| 21 | `toolSummarizerHook` | Spider | Truncates large tool outputs to 8KB preview. |
| 22 | `debuggingSpiralHook` | Spider | 5 identical tool calls in 5min = debugging spiral detected. |
| 23 | `adversarialDetectorHook` | Spider | Pattern-matches for gate bypass attempts. |
| 24 | `rippleCheckHook` | Specialist | After file changes, queries ripple agent for cascading effects. |
| 25 | `supervisorIngestHook` | Graeme | Feeds supervisor agent from tool results and logs. |
| 26 | `complexityRoutingHook` | Aura Frog | Auto-routes task complexity (simple=direct, complex=workflow). |
| 27 | `frameworkPackHook` | Aura Frog | Auto-detects framework, injects ecosystem-specific context. |
| 28 | `intentMarkerHook` | Graeme | Enforces 4-marker protocol in inter-agent messages. |

---

## Part 5: Tool System

### Tool Categories (65+ tools total)

**Phase Enforcement Tools** (from Spider, enhanced)
```
checkpoint          — git stash + session savepoint
phase_complete      — mark phase done, verify state machine advanced
save_plan           — write plan.json → auto-generates plan.md
update_task_status  — mark tasks complete, advance state machine
check_gate_status   — query current phase + gate status
declare_scope       — document what's in/out of current task
```

**Knowledge Tools** (2nd-brain)
```
hermes_recall       — Query 2nd-brain: "what do we know about X?"
hermes_remember     — Store to 2nd-brain: decisions, patterns, learnings
hermes_forget       — Remove from 2nd-brain
hermes_context      — Inject relevant 2nd-brain context into current session
knowledgeAdd        — Spider's knowledge store (per-project + hive)
knowledgeRecall     — Spider's knowledge query
knowledgeRemove     — Spider's knowledge deletion
```

**Analysis Tools** (Specialist + Spider)
```
evidence_check      — Verify task evidence completeness
retrieve_summary    — Get compressed tool output summaries
complexity_hotspots — Find complex code regions needing attention
detect_domains      — Identify project domains/boundaries
extract_code_blocks — Parse code from markdown/long outputs
gitingest           — Ingest git history for context
imports             — Map import dependencies
symbols             — Extract function/class symbols
co_change_analyzer  — Detect coupled file changes (ripple)
```

**Quality Tools** (Spider + Specialist)
```
lint                — Run linter, parse output
diff                — Show uncommitted changes
build_check         — Verify build passes
syntax_check        — Verify syntax valid
test_runner         — Execute test suite, parse results
placeholder_scan    — Find TBD/TODO/placeholder in code
sast_scan           — Static analysis security scan
secretscan          — Detect secrets/credentials
sbom_generate       — Software bill of materials
doc_scan            — Scan for missing/outdated docs
doc_extract         — Extract documentation from code
quality_budget      — Enforce code quality thresholds
```

**Verification Tools** (Specialist)
```
grill               — Adversarial challenge: attack vectors
verify              — Proof-based completion verification
health              — Project health score (0-100)
```

**Agent Tools** (for dispatcher)
```
agent_dispatch      — Spawn subagent (Full or Lite mode)
agent_status        — Query subagent state
agent_cancel        — Cancel running subagent
```

### Tool Execution Model (mal_shaik)
```
CONCURRENT: read-only operations (glob, grep, read, analyze)
  → All run in parallel, share subagent cache

SERIAL: mutating operations (write, edit, bash, patch)
  → One at a time, in order
```

---

## Part 6: Token Management — 5-Tier Compaction

### From mal_shaik's Claude Code source (5 strategies)

| Strategy | Trigger | Action |
|----------|---------|--------|
| **MicroCompact** | Every 10 tool calls | Drop verbatim outputs of successful reads. Keep decisions. |
| **Context Collapse** | 50% token budget | Summarize spans of conversation into decisions. Keep tool schemas. |
| **AutoCompact** | 80% token budget | One `/compact` call — summaries preserved, history truncated. |
| **Session Memory** | Proactive | Extract key context to `~/hermes-workspace/.state/` files. |
| **Full Compact** | 95% token budget | Summarize entire history. Keep: current task, plan, open questions. |

### Large Tool Output Handling (mal_shaik)
```
Tool output > 8KB: stored to disk, 8KB preview sent to model
  → User can request full output if needed
  → Reduces context pollution from long outputs
```

### HERMES.md — 40K Char Every Turn (mal_shaik)
```
~/.hermes/HERMES.md — Leviathan's conventions, rules, patterns
  → Read on EVERY turn, not just session start
  → 40,000 characters available
  → Include: project conventions, "never do this" rules,
    preferred patterns, architectural decisions
```

---

## Part 7: Session Persistence

### mal_shaik's 3 Session Modes
```
--continue   → Resume last session, pick up where left off
--resume     → Pick specific past session from session list
--fork-session → Branch from past session (new conversation tree)
```

### Hermes SessionDB Schema
```typescript
HermesSession {
  id: string
  started_at: timestamp
  last_active: timestamp
  phase: Phase  // 0-5
  plan_id: string | null   // links to saved plan
  branch: string | null     // git branch if any
  turns: number
  total_tokens: number
  agents_used: string[]     // which subagents were dispatched
  decisions: Decision[]      // extracted learnings
  blockers: Blocker[]       // unresolved issues
  parent_session: string | null  // for fork-session
}
```

### Session Snapshot Triggers (Spider)
- After each phase completion
- After tool failure
- After supervisor auto-fix applied
- On request (`checkpoint` tool)

---

## Part 8: Permission System

### 5-Level Cascade (mal_shaik)
```
policy  >  flag  >  local  >  project  >  user
(highest override)              (lowest, per-user)
```

### ~/.hermes/settings.json (Leviathan's permissions)
```json
{
  "permissions": {
    "mode": "auto",
    "allow": [
      "Bash(git *)",
      "Bash(npm test -- *)",
      "Edit(~/hermes-workspace/**)",
      "Write(~/hermes-workspace/**)",
      "Read(*)"
    ],
    "deny": [
      "Bash(sudo *)",
      "Bash(chmod 777 *)",
      "Write(~/.ssh/**)"
    ]
  },
  "model_tiering": {
    "cheap": "qwen3.6-turbo",
    "standard": "qwen3.6-plus-preview",
    "capable": "qwen3.6-plus-preview:free"
  },
  "compaction": {
    "microcompact_interval": 10,
    "autocompact_threshold": 0.80,
    "emergency_threshold": 0.95
  }
}
```

---

## Part 9: 3 Execution Models (mal_shaik)

### fork — cache-optimized (default for subagents)
```
Parent context → byte-identical copy → API cache hit
Cost: ~1x for 5 parallel agents
Use for: most subagent work
```

### teammate — persistent worker (for long tasks)
```
Separate process + tmux pane + file-based mailbox
Use for: long-running builds, test suites
Cost: full context each poll
```

### worktree — git-isolated (for parallel features)
```
Own git worktree + isolated branch per agent
Use for: multiple features being built simultaneously
No branch conflicts, full isolation
```

---

## Part 10: Skills (32 reference skills from Specialist)

### Phase 0 — Brainstorm
```
/brainstorm    — Socratic questioning before planning
/analyze       — Requirements → technical specs (@analyst)
/estimate      — Token cost + time estimate before starting
/discovery     — Feasibility evaluation with GO/NO-GO verdict
```

### Phase 1 — Plan
```
/plan          — Adaptive planning by complexity
/plan-verify   — Anti-rationalization checklist validation
```

### Phase 2 — Build
```
/tdd           — RED-GREEN-REFACTOR cycle
/debug         — 4-phase systematic debugging
/autofix       — Automatic error resolution
/lint          — Lint + auto-fix
```

### Phase 3 — Review
```
/verify        — Proof-based verification
/grill         — Adversarial attack vectors
/codereview    — Multi-reviewer parallel review
/health        — Project health score (0-100)
/audit         — Multi-domain: security + perf + arch + deps
/design-review — Frontend audit: consistency, a11y, UX
```

### Phase 5 — Complete
```
/finish        — Finalize: metrics + conventional commit + PR
/checkpoint    — Save/restore progress with git
/worktree      — Git worktree isolation for parallel tasks
```

### Cross-Cutting
```
/remember      — Save decision to 2nd-brain
/recall        — Query 2nd-brain decisions
/onboard       — Codebase onboarding for new developers
/autopilot     — Autonomous iterative: PRD + progress + fresh context
/learn         — Learning mode: explains while building
/write-skill  — Create or improve custom skills
```

---

## Part 11: Anti-Rationalization Checklist

Every agent must self-certify before claiming DONE:

```
[ ] I verified the actual file contents before making claims
[ ] I showed command output, not just described what happened
[ ] I did not skip any required phase or step
[ ] I did not claim success before tests passed
[ ] I did not bypass any gate without explicit override
[ ] I documented blockers rather than ignoring them
[ ] I used the exact file paths from the plan
[ ] I did not add features not in the spec
[ ] I did not remove features from the spec
[ ] My fix addresses the cause, not just the symptom
```

If any item fails: agent must state what's wrong and what it will do to fix it.

---

## Part 12: File Structure

```
~/hermes-agent/                          # Plugin root
├── package.json
├── tsconfig.json
├── build.ts
├── src/
│   ├── index.ts                         # Plugin entry (OpenCodeSwarm analog)
│   ├── config/
│   │   ├── schema.ts                   # HermesAgentConfig Zod schema
│   │   ├── loader.ts                   # Config loader (user + project)
│   │   └── constants.ts                # AGENT_NAMES, QA_AGENTS, TOOL_NAMES
│   ├── agents/
│   │   ├── index.ts                    # createAgents() — all 14 agents
│   │   ├── hermes.ts                   # Orchestrator prompt
│   │   ├── analyst.ts
│   │   ├── planner.ts
│   │   ├── tdd.ts
│   │   ├── builder.ts
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
│   ├── hooks/
│   │   ├── index.ts                   # All 28 hooks composed
│   │   ├── brainstorm-gate.ts         # HARD-GATE enforcement
│   │   ├── plan-validator.ts         # No-placeholder checker
│   │   ├── tdd-enforcer.ts           # Test-first enforcement
│   │   ├── strict-write-discipline.ts # Aura Frog's memory heals
│   │   ├── adversarial-check.ts      # Slop + bypass detection
│   │   ├── anti-rationalization.ts   # Exit criteria checklist
│   │   ├── knowledge-injector.ts      # 2nd-brain recall every turn
│   │   ├── system-enhancer.ts         # HERMES.md injection
│   │   ├── phase-monitor.ts          # Phase transition enforcement
│   │   ├── compaction.ts             # 5-tier compaction
│   │   ├── guardrails.ts             # Per-agent resource limits
│   │   ├── scope-guard.ts            # File permission boundaries
│   │   ├── activity.ts               # Tool call tracking
│   │   ├── delegation-ledger.ts      # State machine transitions
│   │   ├── self-review.ts            # Cannot approve own output
│   │   ├── drift-verifier.ts        # Phase completion verification
│   │   ├── knowledge-curator.ts      # Extract learnings
│   │   ├── snapshot-writer.ts        # Session snapshots
│   │   ├── tool-summarizer.ts        # Truncate large outputs
│   │   ├── debugging-spiral.ts       # 5 identical calls = spiral
│   │   ├── adversarial-detector.ts   # Gate bypass patterns
│   │   ├── ripple-check.ts           # Cascading change analysis
│   │   ├── supervisor-ingest.ts      # Feed supervisor logs
│   │   ├── complexity-routing.ts     # Auto-route by complexity
│   │   ├── framework-pack.ts         # Framework auto-detection
│   │   └── intent-marker.ts          # 4-marker protocol
│   ├── tools/
│   │   ├── index.ts
│   │   ├── create-tool.ts            # createHermesTool() wrapper
│   │   ├── checkpoint.ts
│   │   ├── phase-complete.ts
│   │   ├── save-plan.ts
│   │   ├── hermes-recall.ts
│   │   ├── hermes-remember.ts
│   │   ├── hermes-forget.ts
│   │   ├── hermes-context.ts
│   │   ├── grill.ts
│   │   ├── verify.ts
│   │   ├── health.ts
│   │   ├── agent-dispatch.ts
│   │   ├── agent-status.ts
│   │   ├── agent-cancel.ts
│   │   └── [40 Spider tools adapted]
│   └── services/
│       ├── supervisor.ts              # Graeme 3-agent loop
│       ├── plan-sync.ts               # plan.json ↔ plan.md sync
│       ├── session-db.ts              # Session persistence
│       └── automation.ts              # Background workers
└── dist/
    └── index.js                       # Compiled plugin
```

---

## Part 13: What Makes Hermes Different

| From | Concept | Hermes Adaptation |
|------|---------|------------------|
| Spider | Hooks as architecture | Ported: all 21 Spider hooks, plus 7 new |
| Superpowers | HARD-GATE workflow | Ported: verbatim, with @analyst pre-validation |
| Specialist | Full/Lite agents | Ported: every agent has both modes |
| Specialist | Verification protocol | Ported: command output required before "done" |
| Aura Frog | Memory heals itself | Ported: verify before act, update only after confirmed |
| Aura Frog | 3-tier compaction | Ported: micro/auto/manual with thresholds |
| mal_shaik | CLAUDE.md every turn | Ported: HERMES.md with 40K chars available |
| mal_shaik | Subagent cache = free parallelism | Ported: all parallel dispatches simultaneous |
| mal_shaik | 3 execution models | Ported: fork/teammate/worktree dispatch |
| mal_shaik | 5 compaction strategies | Ported: integrated into compaction hook |
| mal_shaik | Permission cascade | Ported: settings.json with 5-level cascade |
| Graeme | 3-agent supervisor | Ported: Agent 2 = supervisor, Agent 3 = auditor |
| Graeme | 4-marker protocol | Ported: inter-agent intent markers |
| Spider | State machine | Enhanced: idle→analyze→plan→build→review→complete |
| Spider | 11 agents | Scaled to 14 with Specialist gap-fillers |
| Superpowers | 7-phase workflow | Consolidated to 6 phases (absorbed into Superpowers) |

---

## Part 14: Implementation Priority

### Week 1 — Core (can run end-to-end)
1. Plugin scaffold + config schema
2. HERMES.md + system enhancer hook
3. 7-phase orchestrator prompt
4. 5 core agents: hermes, analyst, planner, builder, reviewer
5. 5 core hooks: brainstorm-gate, plan-validator, tdd-enforcer, delegation-gate, phase-monitor
6. Core tools: checkpoint, phase_complete, save_plan, hermes_recall
7. SessionDB with snapshot/restore

### Week 2 — Quality (full enforcement)
8. Remaining agents: quality-reviewer, grill, ripple, drift-verifier
9. Remaining enforcement hooks: strict-write-discipline, adversarial-check, anti-rationalization
10. Tool system: all 65+ tools
11. Supervisor loop (Graeme 3-agent)

### Week 3 — Polish (production-ready)
12. Framework packs (auto-detect Next.js/React/etc)
13. Full skill library (32 skills)
14. Permission cascade config
15. 3 execution models (fork/teammate/worktree)
16. Testing + documentation

---

## Sources

| Source | Key Contribution | Lines/Doc |
|--------|-----------------|-----------|
| Spider Agent (68,504 lines) | Hook architecture, delegation gate, state machine, 21 hook factories | dist/index.js |
| Superpowers (125k stars) | 7-phase workflow, HARD-GATE, TDD iron law, no-placeholder planning | skills/* |
| Specialist Agent (36 agents) | Full/Lite variants, analyst, ripple, grill, verification protocol | README.md |
| Aura Frog (10 agents) | Memory heals itself, 3-tier compaction, framework packs, LLM OS | README.md |
| mal_shaik (1.4M impressions) | CLAUDE.md every turn, subagent cache, 3 exec models, 5 compaction strategies | THREAD_ANALYSIS_COMPLETE.md |
| Graeme (gkisokay) | 3-agent self-improving loop, 4-marker intent protocol | THREAD_ANALYSIS_COMPLETE.md |

**Primary docs**:
- `~/hermes-workspace/context/engineering/HERMES_AGENT_PLUGIN_SPEC.md` (1,167 lines) — full plugin spec
- `~/hermes-workspace/context/engineering/BUILD_WORKFLOW_MERGE.md` (806 lines) — merged architecture
- `~/hermes-workspace/context/engineering/THREAD_ANALYSIS_COMPLETE.md` (268 lines) — X thread analysis
- `~/.hermes/SOUL.md` (6,358 chars) — Hermes identity and voice
