# BUILD PROMPT — Hermes Agent Plugin v2.3.3
## For manual handoff to Shark Agent

---

CONTEXT:
You are fixing the Hermes Agent Plugin v2.3.3.
Project: /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.3-build/

Read these files first:
- /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.3-build/SHIP.md
- /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.3-build/BUILD_REPORT.md

---

## ACTUAL TEST RESULTS (from EXERCISE_RESULTS.json)

```
Total: 30 exercises
PASS: 9 (30%)
FAIL: 7
ERROR: 14
Pass Rate: 30%
```

### IMPROVEMENTS FROM v2.3.2:
- secret_scan: Fixed — no longer flags node_modules false positives
- list_sessions: Fixed — no longer crashes

---

## STILL FAILING — FIX THESE (5 tools)

### 1. lint (CRITICAL)
- **Error:** ESLint couldn't find an eslint.config file
- **Exercise:** e004
- **Command:** `opencode run "call lint target=/tmp"`
- **Expected:** No ESLint config error. Either clean result or real lint findings.
- **FAIL IF:** "ESLint couldn't find an eslint.config" or "Lint errors found" with config error
- **Fix:** ESLint config fallback not working — ensure eslint.config.js/ts exists or inline config

### 2. grill (CRITICAL)
- **Error:** Could not analyze: /tmp/hermes-test-project
- **Exercise:** e006
- **Command:** `opencode run "call grill target=/tmp"`
- **Expected:** Scan report or "no issues found"
- **FAIL IF:** "Could not analyze"
- **Fix:** Directory scanning broken — scanForVulnerabilities not traversing directories

### 3. complexity_hotspots (HIGH)
- **Error:** No complex hotspots found (O(n²) missed)
- **Exercise:** e007
- **Command:** `opencode run "call complexity_hotspots target=/tmp/test-project"`
- **Expected:** Nested loop detected
- **FAIL IF:** "No hotspots found"
- **Fix:** Nested loop pattern detection not working

### 4. symbols (HIGH)
- **Error:** Could not read file: /tmp/hermes-test-project/src/core/processor.py
- **Exercise:** e008
- **Command:** `opencode run "call symbols target=/tmp/test.py"` (with Python file)
- **Expected:** Python symbols extracted (def, class, etc.)
- **FAIL IF:** "Could not read file" or empty
- **Fix:** Python files not readable — ensure .py extension handled

### 5. /Hermes CLI (CRITICAL)
- **Error:** Vanilla agent responds instead of Hermes plugin
- **Exercise:** e009-e012
- **Command:** `opencode run "/Hermes status"`
- **Expected:** Hermes plugin response
- **FAIL IF:** Vanilla agent response or "unknown command"
- **Fix:** hermes-command hook not parsing /Hermes prefix correctly

---

## SECURITY FIX (CRITICAL)

### Path Traversal (s004 — CRITICAL)
- **Evidence:** `/tmp/hermes-stress-test/../../../etc/passwd` SUCCEEDED
- **Impact:** Attacker can read any file accessible to the process
- **Fix:** Add path traversal protection before file access — block `../` in paths

---

## MACHINE FIX PACKAGE

```bash
# 1. Navigate to project
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.3-build/"

# 2. Build
bun build dist/index.ts --target=bun --outfile=dist/index.js

# 3. Run tests
bun test dist/index.test.js  # if exists

# 4. For each failing tool — grep the source, find the bug, fix it:
grep -n "eslintConfig\|tmpConfig\|.eslintrc" dist/index.js   # lint fix location
grep -n "scanForVulnerabilities" dist/index.js              # grill fix location
grep -n "nested.*loop\|loop.*nested\|O(n" dist/index.js     # complexity fix location
grep -n "\.py\|\.py\b\|python" dist/index.js                 # symbols fix location
grep -n "parseHermesCommand\|/Hermes\|hermes-command" dist/index.js  # CLI fix location

# 5. After each fix — verify manually:
opencode run "call lint target=/tmp"
opencode run "call grill target=/tmp"
opencode run "call complexity_hotspots target=/tmp"
opencode run "call symbols target=/tmp/test.py"  # create /tmp/test.py first
opencode run "/Hermes status"

# 6. Path traversal fix — verify:
opencode run "call grill target=/tmp/../../../etc/passwd"  # should fail or block

# 7. Run test package:
bash TEST_PACKAGE/run-exercises.sh

# 8. Before/after pass rate must improve (delta > 0)
# BEFORE: 30% (9/30)
# AFTER: must be > 30%
```

---

## DELIVERABLES

- dist/index.js with fixes applied
- Verify: Exercise pass rate improved from 30%
- Security: Path traversal blocked
- All 5 critical tools execute without error

---

## ENFORCEMENT

DevOps Manager is watching. Before any approval:
1. Exercise tests must execute (not just E2E)
2. Before/after pass rate comparison (delta must be > 0)
3. Manual tool execution for each fix
4. Path traversal blocked

NO AUTONOMY. Report findings, wait for instruction.
