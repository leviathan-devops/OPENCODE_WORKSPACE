# GOLDEN BEHAVIOR — What Aligned Agent Behavior Looks Like

## Core Principle

> **Agents must SHOW their work, not claim it. Evidence > Claims.**

## Characteristic 1: Shows ACTUAL Outputs

```
❌ BAD: "The test passed"
✅ GOOD:
$ opencode run "shark-status" --agent shark
Output: { "brain": "shark", "gate": "build", "iteration": 3 }
```

## Characteristic 2: Uses Structured Todo Tracking

```
❌ BAD: "I'm making progress on the features"
✅ GOOD:
- [ ] Implement user authentication
- [x] Create database schema  
- [x] Add API endpoints
- Current: Implementing user authentication
```

## Characteristic 3: Provides Evidence for Claims

```
❌ BAD: "I fixed the bug"
✅ GOOD:
$ node test-fix.mjs
Test Results: 5/5 passed
Evidence: /home/user/project/test-results/2026-04-12-fix.json
```

## Characteristic 4: Uses Approved Tools Only

```
❌ BAD: Using hermes_* tools for memory (scope creep)
✅ GOOD: Using shark_* tools for shark agent tasks
```

## Characteristic 5: Follows Gate Sequence

```
PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY
```

Each gate requires specific evidence before advancement.

## Characteristic 6: Shows File Changes Explicitly

```
❌ BAD: "I updated the config"
✅ GOOD:
$ git diff config/default.json
-  "timeout": 30
+  "timeout": 60
```

## Characteristic 7: Test Commands Show Real Results

```
❌ BAD: "Tests are passing"
✅ GOOD:
$ npm test
PASS src/__tests__/auth.test.js
PASS src/__tests__/api.test.js
Test Suites: 2 passed, 2 total
Tests:      15 passed, 15 total
```

## Anti-Patterns (Blocked by Firewall)

| Pattern | What It Looks Like | Why Blocked |
|---------|-------------------|-------------|
| Theatrical | "I'll just grep and count" without doing it | Fake verification |
| Fake Test | Running `npm test` that doesn't test anything | False confidence |
| Source Inspection | `test -f dist/` before build | Assumes pre-built state |
| Host Fallback | "Just edit the file directly" | Bypasses build system |
| Success Claim | "It's working now" without evidence | Unverifiable |
| Model Restriction | "Don't use GPT-4 for this" | Unenforceable |
| Mock/Stub | "I mocked that function" | Not real integration |
| Simplification | "This is just a simple change" | Undermines review |
| Confusion Pretend | "I don't understand" to avoid work | Manipulation |
| Scope Creep | "While I'm in there..." | Expands beyond scope |
| Undermining | "This code is garbage anyway" | Bad faith |
| Impatience | "Just ship it" | Skips verification |
| Self-Reference | "Trust me, I'm a shark" | Authority appeal |

## Evidence Requirements by Gate

| Gate | Required Evidence |
|------|------------------|
| PLAN | project-spec.json, plan.md |
| BUILD | Compiled output, no build errors |
| TEST | ContainerTestResult.json, passRate >= 0.96 |
| VERIFY | Integration test results |
| AUDIT | Code review evidence |
| DELIVERY | Final artifact |