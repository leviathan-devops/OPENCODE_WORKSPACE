# Hermes Agent — System Architecture

**Version:** 3.5  

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenCode                                 │
│                          ↓                                      │
│                    hermes-agent                                 │
│                          ↓                                      │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │    TOOLS     │    AGENTS    │    HOOKS    │   SERVICES   │  │
│  │    (40)      │    (19)      │    (33)     │    (4)      │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                          ↓                                      │
│                    11 Skills (orchestration)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool Categories (40 Total)

### Fork Tools
- `fork_create` — Create a blocking fork session
- `fork_complete` — Complete a fork session
- `fork_feedback` — Send feedback to fork
- `fork_status` — Check fork status

### Episode Tools
- `episode_list` — List episodes
- `episode_output` — Get episode output
- `episode_summary` — Get episode summary

### Orchestration Tools
- `orchestration_invoke` — Invoke a skill chain
- `skill_register` — Register a new skill
- `skill_list` — List available skills
- `orchestration_status` — Check orchestration status

### Quality Tools
- `lint` — Run linter
- `diff` — Show uncommitted changes
- `build_check` — Verify project builds
- `syntax_check` — Verify TypeScript syntax

### Security Tools
- `test_runner` — Run test suite
- `placeholder_scan` — Find TBD/TODO patterns
- `sast_scan` — Static analysis security scan
- `secret_scan` — Detect secrets in code

### Analysis Tools
- `complexity_hotspots` — Find high complexity areas
- `detect_domains` — Identify project domains
- `extract_code_blocks` — Parse code from markdown
- `imports` — Map import dependencies
- `symbols` — Extract function/class symbols

### Verification Tools
- `grill` — Adversarial attack testing
- `verify` — Proof-based completion verification
- `health` — Project health score
- `evidence_check` — Verify task evidence
- `retrieve_summary` — Get compressed tool output

### Session Tools
- `list_sessions` — List saved sessions
- `load_session` — Load a saved session
- `fork_session` — Fork from checkpoint
- `create_snapshot` — Create session snapshot

### Supervisor Tools
- `get_supervisor_recommendations` — Get open issues

### Memory Tools
- `hermes_remember` — Store to 2nd-brain
- `hermes_recall` — Retrieve from 2nd-brain
- `hermes_context` — Inject relevant context

### Planning Tools
- `checkpoint` — Create checkpoint
- `phase_complete` — Mark phase complete
- `save_plan` — Save plan to file

---

## Agent Hierarchy (19 Agents)

### Primary
- **hermes** — DevOps Manager, quality guardian, build overseer

### Analysis & Planning
- **analyst** — Requirements → technical specs
- **planner** — No-placeholder adaptive planning
- **architect** — Clean Architecture / DDD advocacy

### Implementation
- **builder** — One task at a time with TDD
- **tdd** — RED-GREEN-REFACTOR executor

### Review & Testing
- **reviewer** — Security + performance + patterns
- **quality-reviewer** — Spec compliance + readability
- **grill** — Adversarial attack testing
- **test-engineer** — Test strategy and coverage

### Specialized
- **debugger** — 4-phase systematic debugging
- **critic** — Plan critique before implementation
- **ripple** — Cascading change analysis
- **drift-verifier** — Phase completion verification

### Support
- **explorer** — Codebase context mapping
- **supervisor** — Self-improving loop
- **sme** — Subject matter expert
- **docs** — Documentation updates
- **memory** — Cross-session decision persistence

---

## Hook Architecture (33 Hooks)

### Message Transform (9 hooks)
```
messages.transform → brainstorm-gate → plan-validator → strict-write-discipline 
                    → adversarial-check → adversarial-detector → anti-rationalization 
                    → self-review → intent-marker → context-budget → knowledge-injector
```

### Tool Execute Before (4 hooks)
```
tool.execute.before → tdd-enforcer → delegation-gate → guardrails → scope-guard
```

### Tool Execute After (9 hooks)
```
tool.execute.after → phase-monitor → activity → delegation-ledger → knowledge-curator 
                  → snapshot-writer → debugging-spiral → ripple-check 
                  → supervisor-ingest → supervisor-loop → drift-verifier
```

### System Transform (2 hooks)
```
chat.system.transform → system-enhancer → framework-pack
```

### Other Hooks
- `chat.params` → complexity-routing
- `command.execute.before` → hermes-command
- `experimental.session.compacting` → compaction

---

## Services (4)

### ForkManager
Manages fork lifecycle: start, complete, timeout, feedback
- Guard: `.hermes/` directory check
- Cooperative: tools check `ForkManager.isActive()`

### EpisodeStore
Tracks episode history and output compression
- Context cleared after episode execution

### SkillRegistry
Dynamic skill loading and registration
- 11 built-in skills auto-loaded

### OrchestrationEngine
Chain execution with conditional branching
- Supports Thread (async) and Fork (blocking)

---

## Data Flow

```
User Message
    ↓
experimental.chat.messages.transform (hooks)
    ↓
Agent Delegation (if needed)
    ↓
Tool Execution
    ↓
tool.execute.before (hooks)
    ↓
[Tool Logic]
    ↓
tool.execute.after (hooks)
    ↓
Response to User
```

---

## Key Design Rules

1. **Fork only for Hermes** — ForkManager has `.hermes/` guard
2. **Fork is cooperative** — tools check `ForkManager.isActive()`
3. **Thread is default** — most work is async
4. **Episode compresses** — context cleared after episode