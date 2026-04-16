# Shark Architecture — Concepts

## The Problem Shark Solves

Existing AI coding agents (Claude Code, etc.) have a structural flaw: the same model that plans is the same model that executes, and the same model that verifies its own work. This creates three failure modes:

1. **Hallucination**: The agent asserts completion without evidence because it's trained to be helpful
2. **Skipped steps**: The agent skips testing/verification because it wants to show progress
3. **Self-assessment bias**: The agent marks its own work as complete because it can't be objective

## How Shark Fixes It

### Dual-Brain Architecture

**Brain 1: Architect (DeepSeek R1 or equivalent reasoning model)**
- Pure planning: intent → claims → plan
- Never writes code directly
- Reviews execution for drift from plan
- Triggered when verification fails 3x

**Brain 2: Executor (any capable model)**
- Mechanical execution only
- Follows the plan step by step
- Cannot make autonomous decisions
- Must show evidence at every step

These are separate **agents** in OpenCode, not just prompts. They communicate via the Brain Messenger.

### Mechanical Enforcement

No amount of prompt engineering can stop a model from taking shortcuts. The enforcement must be structural:

```
PLAN ──[claims.json exists]──→ BUILD ──[manifest updated]──→ TEST ──[stage1+2 pass]──→ VERIFY ──[3 gates pass]──→ SHIP
```

The agent is **literally blocked** from writing `src/` files during VERIFY. The `phaseGateHook` intercepts `write_file` calls and returns an error if the phase doesn't permit it.

### Claims Over Assertions

Instead of asking "is the task complete?", Shark asks "which claims have passing tests?".

Every feature claim must be:
1. Written to `claims.json` at PLAN phase
2. Each claim must reference a test file
3. The test file must pass before the claim is marked complete

This transforms "it seems done" into "the tests pass".

## The State Machine

The `WorkflowMachine` persists state to `.shark/workflow.json` in the project directory. It tracks:

- Current phase
- Completed phases
- Loop count (BUILD → TEST → VERIFY loops up to 3x)
- Verification gate statuses
- Active claims

The machine is the source of truth. The agent cannot lie about what phase it's in.

## Guardian: The Other Brick Wall

Guardian operates orthogonally to the state machine. It doesn't care what phase you're in — it cares what **path** you're touching.

```
/home/user/project/src/       → WORKSPACE  → ALLOW
/tmp/shark-sandbox/          → SANDBOX    → ALLOW (isolated)
/home/user/.ssh/             → PERSONAL   → DENY
/etc/                        → CONFIG     → DENY
/bin                         → SYSTEM     → DENY (absolute)
```

Guardian runs as the **first** `tool.execute.before` hook. Nothing gets written to a protected path.

## Verification Gates

Three independent gates at VERIFY. All must pass to unlock SHIP:

| Gate | Question | Evidence |
|------|----------|----------|
| Functional | Does the code work? | `stage1.json` + `stage2.json` pass |
| Intent | Did we build what was claimed? | Each claim has a passing test |
| Security | Is it safe? | `guardian-report.json` shows no critical/high issues |

## Why v4 Boilerplate Is the Right Foundation

The v4 boilerplate gives you:
- **Factory pattern**: Create agents from config, not hardcoded
- **Shared state**: Architect and Executor can share state via domain ownership
- **Brain messenger**: Architect can send urgent handoffs to Executor
- **Cluster management**: Research/Execution/QA pools organized cleanly
- **Validator pipeline**: Catch config errors at startup, not runtime

Shark adds:
- **Guardian**: Path protection at the hook layer
- **WorkflowMachine**: Phase enforcement at the hook layer
- **Claims system**: Anti-hallucination via verifiable claims
- **Auto-debug**: Mechanical error fixes without AI
