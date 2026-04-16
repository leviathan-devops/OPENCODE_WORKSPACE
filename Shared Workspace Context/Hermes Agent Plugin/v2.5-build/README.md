# Hermes Agent Plugin v2.5

Thread/Fork/Orchestration Skills Architecture.

## What is v2.5?

v2.5 adds three new execution primitives to the Hermes v2 agent:

1. **Thread** — Async, non-blocking subagent dispatch
2. **Fork** — Synchronous, blocking subagent (takes over UI)
3. **Orchestration** — Skill chains with conditional branching

## Architecture

```
src/
├── services/
│   ├── fork-manager.ts       # Fork lifecycle management
│   ├── episode-store.ts      # Episode tracking and history
│   ├── skill-registry.ts     # Skill loading and registration
│   └── orchestration-engine.ts # Chain execution
├── hooks/
│   ├── fork-blocker-hook.ts  # Block tools during Fork
│   ├── skill-router.ts       # Route skills to Thread/Fork
│   ├── output-chainer.ts     # Chain episode outputs
│   └── episode-tracker.ts    # Episode lifecycle tracking
├── tools/
│   ├── fork-tools.ts         # fork_create, fork_complete, fork_feedback
│   ├── episode-tools.ts      # episode_list, episode_output
│   └── orchestration-tools.ts # orchestration_invoke, skill_register
└── skills/
    ├── PLAN.md              # No-placeholder planning (fork)
    ├── TDD.md               # RED-GREEN-REFACTOR (thread)
    ├── VERIFY.md            # Proof-based verification (thread)
    ├── GRILL.md             # Adversarial testing (fork)
    ├── IMPLEMENT.md         # Full implementation orchestration
    └── [other skills]
```

## Build

```bash
bun install
bun build.ts
```

Output: `dist/index.js`

## Documentation

- `BUILD/ARCHITECTURE.md` — Full architecture specification
- `BUILD/IMPLEMENTATION_ROADMAP.md` — Phase-by-phase build plan
- `BUILD/SKILL_STACKING_SPEC.md` — Reference: Slate's skill stacking patterns

## Key Concepts

### Episode

An episode is the execution boundary for a skill:
- Episode starts when skill activates
- Episode ends when skill completes (or times out)
- Episode output is compressed and stored

### Fork

A Fork blocks the orchestrator and takes over the UI:
- Orchestrator waits while Fork runs
- User interacts directly with Fork
- On completion, compressed output returns to orchestrator
- Only one Fork active at a time

### Thread

A Thread is non-blocking:
- Orchestrator dispatches and continues
- Subagent runs in background
- Episode output stored when done

### Orchestration

An orchestration skill chains other skills:
- Each step can be Thread or Fork
- Output from step N feeds into step N+1
- Conditions can skip steps
- Early termination on verify failure

## Example: /implement

```
User: "implement user authentication"

Chain:
1. FORK /plan     — User collaborates on plan (blocking)
2. THREAD /tdd    — TDD cycle runs (async)
3. THREAD /verify — Verification runs (async)
4. FORK /grill    — User attacks implementation (blocking)

Output: Combined completion report
```

## Status

**Ready to implement.** All architecture docs complete. Stub implementations created. Full implementation following IMPLEMENTATION_ROADMAP.md.
