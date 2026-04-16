---
name: tdd
type: action
description: Test-driven development with RED-GREEN-REFACTOR
executionMode: thread
episodeTimeout: 600000
contextScope: isolated
triggerPatterns:
  - "^/tdd"
  - "tdd"
  - "test first"
  - "red green"
---

# /tdd — Test-Driven Development

Execute TDD cycles: RED (write failing test) → GREEN (make it pass) → REFACTOR

## Activation
Triggered by: "/tdd", "tdd", "test first", "red green"

## How It Works

### Phase 1: RED — Write Failing Test
- Write a test that describes what the code SHOULD do
- Test MUST fail initially (nothing to test yet)
- No production code yet

### Phase 2: GREEN — Make It Pass
- Write MINIMUM production code to make test pass
- No optimization, no "while I'm here" additions
- Just enough to make tests green

### Phase 3: REFACTOR
- Improve code WITHOUT changing behavior
- Tests still pass
- Remove duplication
- Improve readability

## TDD Enforcement
- NO production code without a failing test first
- NO "I'll write tests later" (TDD iron law)
- Tests MUST be actual assertions, not just "test exists"

## Anti-Rationalization Traps
- "I'll write tests at the end" → BLOCKED
- "The code is simple, no test needed" → BLOCKED
- "Tests are for other people" → BLOCKED
