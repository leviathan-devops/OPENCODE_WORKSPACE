# Fork vs Thread — Orchestration Primitives

**Version:** 3.5  

---

## Overview

Hermes v3.5 introduces two orchestration primitives for subagent dispatch:

| Primitive | Blocking | Use Case |
|-----------|----------|----------|
| **Thread** | No | Background work, parallel tasks |
| **Fork** | Yes | Interactive planning, code review |

---

## Thread (Async)

```
hermes → dispatch → continues immediately → background work
```

### Characteristics

- **Non-blocking** — Hermes continues immediately
- **Fire-and-forget** — No user interaction
- **Parallel** — Multiple threads can run concurrently
- **Default** — Most work uses threads

### Use Cases

- TDD cycles (red-green-refactor runs in background)
- Verification (proof checks run async)
- Debugging (systematic debugging runs in background)
- Health checks (system health runs in background)
- Memory operations (remember/recall)

### Example Flow

```
User: "implement login"
    ↓
hermes → THREAD /tdd → continues immediately
    ↓
hermes → THREAD /verify → continues immediately
    ↓
Results come back when complete
```

---

## Fork (Blocking)

```
hermes → dispatch → WAITS → user interacts → returns output
```

### Characteristics

- **Blocking** — Hermes waits for completion
- **Interactive** — User can provide input
- **Takes over UI** — Full user attention
- **Synchronous** — One fork at a time

### Use Cases

- `/plan` — Collaborative planning (user shapes the plan)
- `/grill` — Adversarial testing (user reviews findings)
- `/brainstorm` — Socratic requirements (user explores problem)

### Example Flow

```
User: "plan login system"
    ↓
hermes → FORK /plan → WAITS
    ↓
User collaborates on plan
    ↓
User approves or revises
    ↓
Fork completes → results returned
```

---

## Orchestration (Skill Chains)

```
User: "implement login"

Chain:
1. FORK /plan     — User collaborates on plan (blocking)
2. THREAD /tdd    — TDD cycle runs (async)
3. THREAD /verify — Verification runs (async)
4. FORK /grill    — Adversarial testing (blocking)
```

### Conditional Branching

The OrchestrationEngine supports:
- **If/else** — Branch based on results
- **Loop** — Repeat until condition
- **Parallel** — Execute in parallel, wait for all
- **Race** — Execute in parallel, return first

---

## Fork Blocker

When a Fork is active, non-fork tools are blocked:

```typescript
// In fork-blocker-hook.ts
if (ForkManager.isActive() && !isForkTool(toolName)) {
  throw new Error(`Tool ${toolName} blocked while Fork active`);
}
```

This ensures:
- No background noise during interactive sessions
- User attention stays on fork task
- Clean separation of concerns

---

## Episode Context

Episodes compress context after execution:

```
Episode Start:
  - Save context snapshot

Episode End:
  - Compress context
  - Clear intermediate data
  - Retain only key decisions
```

This prevents context explosion during long orchestration chains.