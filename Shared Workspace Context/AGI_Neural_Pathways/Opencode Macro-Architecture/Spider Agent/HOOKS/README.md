# Spider Agent Hooks (12 Hook Systems)

**Note**: This directory contains per-hook documentation. See individual hook files below.

---

## Hook Index

### System Transform Hooks (Fire on system message)

| Hook | Purpose | File |
|------|---------|------|
| `system-enhancer` | Injects phase context, retrospectives, knowledge | `system-enhancer.md` |
| `context-budget` | Injects context usage warnings | *(pending)* |
| `knowledge-injector` | Scores and injects relevant knowledge | *(pending)* |

### Messages Transform Hooks (Fire on message processing)

| Hook | Purpose | File |
|------|---------|------|
| `consolidateSystemMessages` | Merges consecutive system messages | `consolidateSystemMessages.md` |

### Tool Before Hooks (Fire before tool execution)

| Hook | Purpose | File |
|------|---------|------|
| `delegation-gate` | QA gate for architect/coder delegations | `delegation-gate.md` |
| `scope-guard` | Enforces file scope containment | `scope-guard.md` |
| `guardrails` (before) | Validates tool names and args | `guardrails.md` |

### Tool After Hooks (Fire after tool completion)

| Hook | Purpose | File |
|------|---------|------|
| `guardrails` (after) | Validates tool outputs | `guardrails.md` |
| `slop-detector` | Detects code quality issues | `slop-detector.md` |
| `dark-matter-detector` | Reminds about unresolved gaps | `dark-matter-detector.md` |
| `knowledge-curator` | Extracts and stores knowledge | *(pending)* |

---

## Hook Execution Order

### System Transform Pipeline

1. `system-enhancer` — Phase context, drift detection, knowledge
2. `context-budget` — Context usage warnings
3. `knowledge-injector` — Knowledge injection
4. System message sent to LLM

### Messages Transform Pipeline

1. `consolidateSystemMessages` — Merge consecutive system messages
2. Messages sent to LLM

### Tool Before Pipeline (all run before tool)

1. `delegation-gate` — Validates delegations (architect/coder only)
2. `scope-guard` — Validates file scope (write/edit only)
3. `guardrails` — Validates tool names and args

### Tool After Pipeline (all run after tool)

1. `slop-detector` — Detects code quality issues
2. `dark-matter-detector` — Rate-limited gap reminders
3. `knowledge-curator` — Extracts knowledge

---

## State Mutations Summary

| Hook | Reads | Writes | Blocks? |
|------|-------|--------|---------|
| `system-enhancer` | plan.md, drift-report.json, activity/, knowledge/ | None | No |
| `consolidateSystemMessages` | messages | None | No |
| `delegation-gate` | plan.json, evidence-ledger.json | delegation-ledger.json | YES |
| `scope-guard` | declaredCoderScope | lastScopeViolation (memory) | YES |
| `guardrails` (before) | tool args | telemetry | YES |
| `guardrails` (after) | tool output | telemetry | No |
| `slop-detector` | file system | None | No |
| `dark-matter-detector` | dark-matter.md | None | No |
| `context-budget` | context state | None | No |
| `knowledge-curator` | tool outputs | knowledge/ | No |
| `knowledge-injector` | knowledge/ | None | No |

---

## Error Handling Patterns

| Pattern | Hooks | Behavior |
|---------|-------|----------|
| **Throws to block** | delegation-gate, scope-guard, guardrails (before) | Stops execution |
| **Fails silently** | dark-matter-detector, slop-detector, system-enhancer | Logs, continues |
| **Pure transform** | consolidateSystemMessages, context-budget | Returns original on error |

---

## Hook Categories

### Spider-Specific Hooks

These hooks are unique to Spider Agent and implement the swarm's QA methodology:

- `delegation-gate` — Enforces planning before doing
- `scope-guard` — Enforces bounded file access
- `slop-detector` — Prevents abstraction bloat
- `dark-matter-detector` — Tracks unresolved items
- `brainstorm-gate` — Phase 0 enforcement

### Standard OpenCode Hooks (enhanced by Spider)

These are standard OpenCode hooks that Spider enhances or configures:

- `systemTransform` — Enhanced with phase context
- `messagesTransform` — Added consolidation
- `toolBefore` / `toolAfter` — Added guardrails
