# Spider Agent vs Vanilla OpenCode Agents

## What Are Vanilla Agents?

OpenCode comes with built-in agents:
- **build** - compiles and packages code
- **plan** - creates implementation plans
- **general** - handles arbitrary tasks
- **architect** - system design (separate from Spider's architect)

These are single-pass, task-focused agents.

## Quick Comparison

| Aspect | Spider Agent | Vanilla Agents |
|--------|--------------|----------------|
| Approach | Multi-phase pipeline | Single task execution |
| State | Persistent (.Spider/) | Ephemeral |
| QA Gates | Mandatory | None |
| Context | Managed/compacted | Unlimited until OOM |
| Handoffs | Orchestrated | Direct (you tell it) |
| Model selection | Per-agent optimized | Single model |
| Recovery | Stateful rollback | Manual restart |
| Complexity | High | Low |

## Task Execution Model

### Vanilla OpenCode

```
User: "Build a login system"
  └─► build agent (single pass)
        └─► Output: login.js
              Done.
```

One shot. If it fails, you restart and try again. No memory of previous attempts.

### Spider Agent

```
User: "Build a login system"
  └─► spider (orchestrator)
        ├─► explorer: index project
        ├─► architect: create plan
        ├─► coder: implement
        ├─► test_engineer: write tests
        ├─► reviewer: gate checks
        └─► complete or loop back on failure
```

Guided pipeline with checkpoints and gates.

## File Access Control

### Vanilla Agents

```javascript
// In vanilla OpenCode:
- build agent: FULL ACCESS to entire project
- plan agent: FULL ACCESS to entire project
- general agent: FULL ACCESS to entire project
```

No restrictions. Can read/write/delete anything.

### Spider Agents

| Agent | Allowed Paths | Notes |
|-------|---------------|-------|
| coder | src/, lib/, tests/, generated/ | No root files |
| reviewer | All (read-only) + evidence/ | Can't write implementation |
| explorer | All (read-only) | Can't modify files |
| test_engineer | tests/, spec/, generated/ | Only test files |

Enforced via `checkFileAuthority()` hook.

## Context Management

### Vanilla: Unlimited Context Problem

```
User: "Refactor module A"
  └─► agent reads 50 files into context
        └─► context window: 90% full
              └─► Adding more files...
                    └─► OOM crash or degraded quality
```

Vanilla agents keep adding to context until they break.

### Spider: Managed Context

```
Phase 3: coder
  ├─► Task 3.1: Implement User model
  │     └─► Context: 45% used
  │           └─► On complete: compact
  │                 └─► Context: 35% (summary stored)
  ├─► Task 3.2: Implement Auth service
  │     └─► Context: 38% + new files
  │           └─► On complete: compact
  └─► ...
```

Compaction happens between tasks. Context budget enforced.

## Error Recovery

### Vanilla: Start Over

```
Attempt 1: Failed at step 47
  └─► "What was I doing? Let's start fresh"
        └─► Attempt 2: Different approach, same failure mode
              └─► ...
```

No memory of what was tried.

### Spider: State Recovery

```
Attempt 1: Fails at task 3.2 (build gate)
  └─► Evidence stored: build.log shows error
  └─► State: phase 3, task 3.2
  └─► /swarm rollback 3.2
        └─► Restores to start of task 3.2
  └─► Attempt 2: Knows exact failure point
        └─► Fix the specific issue
```

Checkpoint/rollback means never truly starting over.

## QA and Quality

### Vanilla: Trust the Agent

```
"Agent, write tests too"
  └─► Agent: "Sure!" *writes weak tests*
        └─► No validation
              └─► Ship it
```

QA is optional and agent-dependent.

### Spider: Mandatory Gates

```
coder ──► GATES ──► test_engineer
          ├─ syntax_check
          ├─ sast_scan  
          ├─ build_check
          ├─ quality_budget
          └─ ...
                └─► Must pass all to proceed
```

Quality enforced by the system, not the agent's mood.

## Use Case Suitability

| Task | Vanilla Better | Spider Better |
|------|---------------|---------------|
| Quick file edit | ✓ | |
| Single script | ✓ | |
| Complex multi-file feature | | ✓ |
| Test suite creation | | ✓ |
| Security-sensitive code | | ✓ |
| Exploratory coding | ✓ | |
| Production feature | | ✓ |
| spike/prototype | ✓ | |

## When to Use Spider

Use Spider Agent when:
- Multi-file implementation with dependencies
- Need for test coverage enforcement
- Security-sensitive or compliance-required code
- Long-running projects with many phases
- Need for rollback/audit trail
- Want to prevent technical debt accumulation

## When to Use Vanilla

Use vanilla agents when:
- Quick one-off tasks
- Single file edits
- Exploration/spike coding
- Low-stakes scripts
- When Spider overhead isn't worth it

## Hybrid Approach

You can combine:
- Use vanilla `build` for quick compilations
- Use Spider for complex features
- Use `/swarm turbo on` to speed up Spider when quality less critical
- Switch between as needed

## The Key Insight

| Vanilla | Spider |
|---------|--------|
| Fast to start | Structured to complete |
| Flexible | Opinionated |
| You manage quality | System enforces quality |
| Memory: none | Memory: full state |
| Failure: restart | Failure: rollback |

Spider trades flexibility for reliability. For production code where quality matters, Spider's structure prevents the "start over" loop that vanilla agents fall into.
