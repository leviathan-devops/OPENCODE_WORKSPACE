# Shark Macro Agent Test Package v1.0

## Overview

Mechanical exercise package for testing shark-macro agent (Single Primary Brain: Execution Mode).

**Agent:** shark-macro
**Plugin:** shark-agent-v4.5
**Date:** 2026-04-07

## Test Coverage

| Category | Exercises | Focus |
|----------|-----------|-------|
| P0 Critical | 10 | Core functionality (tools, hooks, gates) |
| P1 Important | 10 | Integration (execution brain, escalation, guardrails) |

## Exercises

1. **e001** - Status tool (macro variant)
2. **e002** - Gate criteria (all 6 gates)
3. **e003** - Guardian dangerous command detection
4. **e004** - Guardian zone classification
5. **e005** - Gate auto-advance BUILD→TEST
6. **e006** - Gate auto-advance TEST→VERIFY
7. **e008** - Iteration loop initial state
8. **e009** - Self-rejection T1 prompt
9. **e010** - Execution Brain role
10. **e011** - Gate manual evaluate
11. **e012** - Gate manual advance
12. **e013** - Iteration escalation detect
13. **e014** - System transform hook
14. **e015** - State persistence checkpoint
15. **e016** - Evidence collection
16. **e017** - Verify attempts counter
17. **e018** - Gate status all
18. **e019** - Guardrails enforcement
19. **e020** - Error handling complete

## Execution

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/v4.5/TEST_PACKAGE_MACRO"
bash TEST_EXECUTION_SCRIPT.sh
```

## Expected Results

All P0 exercises must pass. P1 exercises are important for integration verification.

## Files

- `EXERCISES/` — Individual exercise definitions (JSON)
- `TEST_EXECUTION_SCRIPT.sh` — Automated execution script
- `TEST_CHECKLIST.md` — Manual verification checklist
- `EXERCISE_RESULTS.json` — Structured results output
- `logs/` — Execution logs for each exercise