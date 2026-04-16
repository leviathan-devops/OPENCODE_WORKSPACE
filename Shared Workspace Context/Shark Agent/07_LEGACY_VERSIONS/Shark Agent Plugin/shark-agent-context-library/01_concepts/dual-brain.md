# Dual-Brain Architecture

## The Core Idea

Separate the brain that **THINKS** from the brain that **DOES**.

A reasoning model (DeepSeek R1) excels at planning but is slow and expensive for mechanical execution. An execution model (GLM, Gemini, etc.) is fast and cheap for code writing but unreliable for strategic decisions. Mixing them = hallucination. Keeping them separate = mechanical discipline.

## Shark's Dual-Brain Model

### Shark-Architect (Planning Brain)

**Model**: DeepSeek R1 or equivalent reasoning model

**Responsibilities**:
- Parse user intent → extract claims
- Generate implementation plan per claim
- Review executor output for drift from plan
- Trigger reset when verification fails 3x
- Maintain `claims.json`

**Never does**: Write production code files

### Shark-Executor (Execution Brain)

**Model**: Any capable model (GLM, Gemini, etc.)

**Responsibilities**:
- Execute plan step by step
- Write code per claim, always writing test before src
- Update `build-manifest.json` after each file
- Run Stage 1 (Docker sandbox) + Stage 2 (local) tests
- Present evidence to architect for review

**Never does**: Make strategic decisions, skip phases, self-approve

## Communication: Brain Messenger

The v4 `BrainMessenger` handles inter-brain communication:

```typescript
// Architect → Executor: new task
messenger.send({
  id: 'msg_001',
  from: 'shark-architect',
  to: 'shark-orchestrator',
  type: 'handoff',
  priority: 'high',
  payload: {
    claims: [...],
    plan: '...',
    currentPhase: 'BUILD'
  },
  requiresAck: true,
  timestamp: Date.now(),
});

// Executor → Architect: task complete
messenger.send({
  id: 'msg_002',
  from: 'shark-orchestrator',
  to: 'shark-architect',
  type: 'ack',
  priority: 'normal',
  payload: { taskId: 'msg_001', result: 'complete' },
  requiresAck: false,
  timestamp: Date.now(),
});
```

Priority ordering: `critical > high > normal > low`. Critical messages (gate failures, security blocks) bypass normal queue ordering.

## Shared State via StateStore

The v4 `StateStore` provides domain ownership:

```
Domain: plan-state
  Owners: [architect]
  Writable by: architect only
  Readable by: all

Domain: execution-state
  Owners: [executor]
  Writable by: executor only
  Readable by: all

Domain: quality-state
  Owners: [guardian, executor]
  Writable by: guardian, executor
  Readable by: all
```

Example: Architect writes claims to `plan-state`, Executor reads from `plan-state` to know what to build.

## Why Not a Single Model?

A single model performing both roles creates:

1. **Planning bias**: The model commits to a plan before seeing all the implementation challenges
2. **Confirmation bias**: The model that wrote the code reviews its own work favorably
3. **Shortcut temptation**: Fast models want to show progress; they skip verification steps
4. **Cost inefficiency**: Reasoning models (R1) are 10-100x more expensive per token than execution models

Dual-brain forces mechanical discipline: the executor cannot skip steps because the architect reviews evidence, not self-reports.
