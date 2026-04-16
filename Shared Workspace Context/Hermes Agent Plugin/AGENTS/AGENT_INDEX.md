# AGENT INDEX — All 14 Hermes Agents

Every agent has **Full** (capable model, complex work) and **Lite** (cheap model, scaffolding) modes.

---

## Orchestrator (1)

| Agent | Mode | Primary | Subagent | Role |
|-------|------|---------|----------|------|
| `hermes` | Full | ✓ | | Primary orchestrator. Routes to subagents. Enforces 6-phase pipeline. Owns HERMES.md context injection. |

---

## Execution Spoke — Core (5)

| Agent | Mode | Primary | Subagent | Role | Lite Use |
|-------|------|---------|----------|------|----------|
| `@analyst` | Both | | ✓ | Requirements → technical specs. Socratic validation. | Scaffolding specs |
| `@planner` | Both | | ✓ | No-placeholder adaptive planning. | Quick estimates |
| `@tdd` | Both | | ✓ | RED-GREEN-REFACTOR executor. | Scaffold tests |
| `@builder` | Both | | ✓ | Implementation. One task at a time. Verification protocol. | Simple fixes |
| `@reviewer` | Both | | ✓ | Stage 2: security + performance + patterns. | Quick review |

---

## Execution Spoke — Quality (4)

| Agent | Mode | Primary | Subagent | Role |
|-------|------|---------|----------|------|
| `@quality-reviewer` | Both | | ✓ | Stage 1: spec compliance + readability |
| `@grill` | Both | | ✓ | Adversarial: attack vectors, edge cases |
| `@ripple` | Both | | ✓ | Cascading change analysis |
| `@drift-verifier` | Both | | ✓ | Phase completion verification |

---

## Execution Spoke — Support (3)

| Agent | Mode | Primary | Subagent | Role |
|-------|------|---------|----------|------|
| `@explorer` | Both | | ✓ | Codebase context mapping |
| `@architect` | Both | | ✓ | Clean Architecture / DDD advocacy. 3-strike escalation target. |
| `@debugger` | Both | | ✓ | 4-phase systematic debugging |

---

## Supervisor Spoke (1)

| Agent | Mode | Primary | Subagent | Role |
|-------|------|---------|----------|------|
| `@supervisor` | Both | | ✓ | Graeme's Agent 2. Monitor logs, propose fixes with risk. |

---

## Always-Lite Agents (no Full mode)

| Agent | Mode | Role |
|-------|------|------|
| `@sme` | Lite | Subject matter expert. Domain research. |
| `@test-engineer` | Lite | Test strategy, coverage analysis. |
| `@docs` | Lite | Documentation updates. |
| `@critic` | Lite | Plan critique before implementation. |
| `@memory` | Lite | Cross-session decision persistence. /remember and /recall. |

---

## Agent Interaction Map

```
hermes (orchestrator)
    │
    ├── @analyst        → Phase 0: requirements → design doc
    ├── @planner        → Phase 1: no-placeholder plan
    ├── @tdd            → Phase 2: RED-GREEN-REFACTOR
    ├── @builder        → Phase 2: implementation
    │
    ├── @quality-reviewer → Phase 3: spec compliance
    ├── @reviewer       → Phase 3: security + performance
    ├── @grill          → Phase 3: adversarial testing
    │
    ├── @ripple         → After each file change: cascading effects
    ├── @drift-verifier → After each phase: completion check
    │
    ├── @explorer       → Codebase context when needed
    ├── @architect      → 3-strike escalation + DDD review
    ├── @debugger       → Phase 4: systematic debugging
    │
    └── @supervisor     → Continuous: monitor → propose → escalate
```

---

## Model Tiering by Agent

| Agent | Full Mode | Lite Mode |
|-------|-----------|----------|
| hermes | qwen3.6-plus | qwen3.6-turbo |
| analyst | qwen3.6-plus | qwen3.6-turbo |
| planner | qwen3.6-plus | qwen3.6-turbo |
| tdd | qwen3.6-plus | qwen3.6-turbo |
| builder | qwen3.6-plus | qwen3.6-turbo |
| reviewer | qwen3.6-plus | qwen3.6-turbo |
| quality-reviewer | qwen3.6-plus | qwen3.6-turbo |
| grill | qwen3.6-plus | qwen3.6-turbo |
| ripple | qwen3.6-plus | qwen3.6-turbo |
| drift-verifier | qwen3.6-plus | qwen3.6-turbo |
| explorer | qwen3.6-plus | qwen3.6-turbo |
| architect | qwen3.6-plus | qwen3.6-turbo |
| debugger | qwen3.6-plus | qwen3.6-turbo |
| supervisor | qwen3.6-plus | qwen3.6-turbo |
| sme | qwen3.6-turbo | qwen3.6-turbo |
| test-engineer | qwen3.6-turbo | qwen3.6-turbo |
| docs | qwen3.6-turbo | qwen3.6-turbo |
| critic | qwen3.6-turbo | qwen3.6-turbo |
| memory | qwen3.6-turbo | qwen3.6-turbo |

---

## Tool Access by Agent

| Agent | Phase Tools | Knowledge Tools | Quality Tools | Analysis Tools |
|-------|-------------|-----------------|--------------|----------------|
| hermes | ✓ | ✓ | ✓ | ✓ |
| analyst | | ✓ | | ✓ |
| planner | ✓ | ✓ | | ✓ |
| builder | ✓ | ✓ | ✓ | ✓ |
| reviewer | | | ✓ | ✓ |
| quality-reviewer | | ✓ | ✓ | ✓ |
| grill | | | ✓ | ✓ |
| ripple | | ✓ | ✓ | ✓ |
| drift-verifier | ✓ | ✓ | ✓ | ✓ |
| explorer | | ✓ | | ✓ |
| architect | | ✓ | ✓ | ✓ |
| debugger | | ✓ | ✓ | ✓ |
| supervisor | ✓ | ✓ | ✓ | ✓ |
| sme | | ✓ | | ✓ |
| test-engineer | ✓ | ✓ | ✓ | ✓ |
| docs | | ✓ | | ✓ |
| critic | | ✓ | ✓ | ✓ |
| memory | | ✓ | | |
