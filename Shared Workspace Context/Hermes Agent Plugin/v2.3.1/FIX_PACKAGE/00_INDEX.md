# HERMES AGENT PLUGIN v2.3.1 — FIX PACKAGE

**Build ID**: v2.3.1-fix-2026-0405
**Date**: 2026-04-05
**Source**: v2.3-build (BROKEN)
**Target**: v2.3.1-build/
**Status**: READY TO EXECUTE
**Pattern**: Mechanical enforcement — no placeholders, no vague instructions

---

## PURPOSE

v2.3 has 6 confirmed bugs that the build agent must fix mechanically.
Every fix has: exact file, exact line, exact change, exact verification command.
If verification fails, the build does not ship.

---

## PACKAGE CONTENTS

| File | Purpose |
|------|---------|
| `00_INDEX.md` | This file — manifest and executive summary |
| `01_BUG_SECRETSCAN.md` | CRITICAL: secretScan broken tool syntax |
| `02_BUG_SYMBOLS_TRAVERSAL.md` | HIGH: symbols tool path traversal |
| `03_BUG_COMPLEXITY_PATH.md` | MEDIUM: complexityHotspots unvalidated path |
| `04_FIX_DELEGATION_GATE.md` | HIGH: delegation gate doesn't block |
| `05_FIX_SUPERVISOR_METADATA.md` | MEDIUM: output.metadata not consumed |
| `06_FIX_CLI_HANDLERS.md` | MEDIUM: CLI commands have no handlers |
| `07_FIX_DEVOPS_PATH.md` | MEDIUM: hardcoded absolute path |
| `08_VERIFICATION_SUITE.md` | Commands to verify all fixes |
| `09_BUILD_STEPS.md` | Step-by-step build execution |

---

## EXECUTION ORDER

```
Step 1: Copy v2.3-build → v2.3.1-build (fresh directory)
Step 2: Apply 01_BUG_SECRETSCAN (CRITICAL — blocks compile)
Step 3: Apply 02_BUG_SYMBOLS_TRAVERSAL (HIGH — security)
Step 4: Apply 03_BUG_COMPLEXITY_PATH (MEDIUM)
Step 5: Apply 04_FIX_DELEGATION_GATE (HIGH)
Step 6: Apply 05_FIX_SUPERVISOR_METADATA (MEDIUM)
Step 7: Apply 06_FIX_CLI_HANDLERS (MEDIUM)
Step 8: Apply 07_FIX_DEVOPS_PATH (MEDIUM)
Step 9: Run 08_VERIFICATION_SUITE
Step 10: If all pass → run 09_BUILD_STEPS
Step 11: Deploy v2.3.1-build/dist/index.js
```

---

## FAILURE MODE

If ANY verification command in 08_VERIFICATION_SUITE fails:
1. Do NOT proceed to next fix
2. Do NOT mark as complete
3. Report which fix failed, what the failure was, what was expected
4. Wait for human intervention

---

## DEFINITIONS

**"MUST"**: Absolute requirement. No exception. Failure = build blocked.
**"MUST NOT"**: Absolute prohibition. Violation = build blocked.
**"EXACTLY"**: No variation allowed. Match byte-for-byte.
**"VERIFY"**: Run the specified command and confirm exact expected output.

---

*Package generated: 2026-04-05*
*This is a mechanical enforcement document. Follow it exactly.*
