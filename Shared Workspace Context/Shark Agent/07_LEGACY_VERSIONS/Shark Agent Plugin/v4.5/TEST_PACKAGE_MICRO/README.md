# Shark Micro Agent Test Package v1.0

## Overview

Mechanical exercise package for testing shark-micro agent (Dual-Brain Sequential: Plan ↔ Build).

**Agent:** shark-micro
**Plugin:** shark-agent-v4.5
**Date:** 2026-04-07

## Test Coverage

| Category | Exercises | Focus |
|----------|-----------|-------|
| P0 Critical | 10 | Core functionality (tools, hooks, gates) |
| P1 Important | 8 | Integration (brain switching, escalation) |
| P2 Complex | 1 | Coordinator T1 text |

## Exercises

1. **e001** - Status tool (micro variant)
2. **e002** - Gate criteria (all 6 gates)
3. **e003** - Guardian dangerous command detection
4. **e004** - Guardian zone classification
5. **e005** - Gate auto-advance BUILD→TEST
6. **e006** - Gate auto-advance TEST→VERIFY
7. **e008** - Iteration loop initial state
8. **e009** - Self-rejection T1 prompt
9. **e010** - Brain switch Plan Brain
10. **e011** - Brain switch Build Brain
11. **e012** - Gate manual evaluate
12. **e013** - Gate manual advance
13. **e014** - Iteration escalation detect
14. **e015** - System transform hook
15. **e016** - State persistence checkpoint
16. **e017** - Evidence collection
17. **e018** - Verify attempts counter
18. **e019** - Gate status all
19. **e020** - Coordinator T1 text

## Execution

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/v4.5/TEST_PACKAGE_MICRO"
bash TEST_EXECUTION_SCRIPT.sh
```

## Expected Results

All P0 exercises must pass. P1 and P2 are important but some architectural limitations may affect complex tests.

## Files

- `EXERCISES/` — Individual exercise definitions
- `TEST_EXECUTION_SCRIPT.sh` — Automated execution script
- `TEST_CHECKLIST.md` — Manual verification checklist
- `EXERCISE_RESULTS.json` — Structured results output
- `logs/` — Execution logs for each exercise