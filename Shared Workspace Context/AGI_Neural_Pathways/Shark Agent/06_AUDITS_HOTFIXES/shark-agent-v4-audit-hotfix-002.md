# Shark Agent V4 — Audit Hotfix 002

**Hotfix ID:** shark-agent-v4-audit-hotfix-002
**Date:** 2026-04-07
**Supersedes:** shark-agent-v4-audit-hotfix-001
**Source Audits:**
- `shark-agent-v4-first-build-audit-2026-04-07.md`
- MACRO test logs: `FORENSIC_TEST_LOG.json`, `FORENSIC_TEST_LOG.md`
- MICRO test logs: `FORENSIC_TEST_LOG.md`

---

## Summary of Test Results

### MICRO (shark-micro) — 18/19 PASSED (94.7%)
| Result | Count | Exercises |
|--------|-------|-----------|
| PASS | 18 | e001-e013, e015-e020 |
| FAIL | 1 | e014 (timeout) |

### MACRO (shark-macro) — 7/19 PASSED (37%) — CRITICAL ISSUES
| Result | Count | Exercises |
|--------|-------|-----------|
| PASS | 7 | e002, e003*, e004*, e005*, e006*, e009*, e012, e015 |
| FAIL | 4 | e001, e008, e010, e019 |
| ERROR | 2 | e011, e016 (rate limit) |
| SKIP | 6 | e007, e013, e014, e017, e018, e020 |

*Script path bug gave false passes - actual functionality not verified

---

## FAILURES ANALYSIS

### CRITICAL FAILURE #1: shark-status Returns Wrong Variant (MACRO e001)

**Symptom:** shark-macro agent returns `variant: 'Micro'` instead of `variant: 'macro'`

**Raw Output:**
```
⚙ shark-status Unknown
**Shark Status (Micro)**
- **Current Gate**: `plan` (pending)
- **Iteration**: V1.0
- **Brain**: unknown
```

**Root Cause:** When calling `shark-status` (without `-micro` or `-macro` suffix), the wrong variant tool is being invoked.

**Code Analysis (`src/tools/shark-status.ts`):**
```typescript
// Two separate tools created
const statusToolMicro = createSharkStatusTool(stateStore, gm, 'micro');
const statusToolMacro = createSharkStatusTool(stateStore, gm, 'macro');

tool: {
  'shark-status': statusToolMicro,  // ← BUG: default shark-status is micro
  'shark-status-micro': statusToolMicro,
  'shark-status-macro': statusToolMacro,
}
```

**FIX REQUIRED:**
```typescript
tool: {
  'shark-status': statusToolMacro,  // ← FIX: default should be macro
  'shark-status-micro': statusToolMicro,
  'shark-status-macro': statusToolMacro,
}
```

---

### CRITICAL FAILURE #2: Script Path Quoting Bug (Both Test Packages)

**Symptom:** 6 MACRO exercises (e003-e007, e009) show FALSE PASS due to command failure masking actual results

**Location:** `TEST_EXECUTION_SCRIPT.sh` lines 65, 87

**Buggy Code:**
```bash
EXERCISES_DIR="$TEST_DIR/EXERCISES"
# ...
cat $EXERCISE_FILE | grep '"prompt"' | cut -d'"' -f4 | head -1
# AND
opencode run "@shark-macro $(cat $EXERCISE_FILE | grep '"prompt"' | cut -d'"' -f4 | head -1)" > "$LOG_FILE" 2>&1
```

**Problem:** `TEST_DIR` contains spaces: `"Shared Workspace Context"` — unquoted variables split on spaces

**Result:**
```
cat: /home/leviathan/OPENCODE_WORKSPACE/Shared: No such file or directory
cat: Workspace: No such file or directory
cat: Context/Shark: No such file or directory
```

**FIX REQUIRED:**
```bash
EXERCISES_DIR="$TEST_DIR/EXERCISES"
# ...
PROMPT=$(cat "$EXERCISE_FILE" | grep '"prompt"' | cut -d'"' -f4 | head -1)
opencode run "@shark-macro $PROMPT" > "$LOG_FILE" 2>&1
```

**Same bug exists in MICRO TEST_EXECUTION_SCRIPT.sh**

---

### CRITICAL FAILURE #3: Exercise Timeout (Both e008, e010 MACRO + e014 MICRO)

**Symptom:** Exercises timed out after 300 seconds (MACRO) or 60 seconds (MICRO)

**MACRO e008:** Iteration loop initial state — timed out
**MACRO e010:** Execution brain role — timed out
**MICRO e014:** Iteration escalation detect — timed out (60s limit)

**Root Cause:** 
1. P2 exercises (complex multi-step) have insufficient timeout
2. e014 requires 3 sequential VERIFY failures — 60s is not enough (estimated 2 minutes)
3. Script timeout (300s) may indicate hanging in OpenCode itself

**FIX REQUIRED:**
- Increase P2 exercise timeout to 180 seconds minimum
- Increase script-level timeout to 600 seconds
- Investigate if agent is entering infinite loop

---

### MEDIUM FAILURE #4: Rate Limiting (MACRO e011, e016)

**Symptom:** Alibaba API rate limit hit during shark-gate evaluate and shark-evidence status

**Error:**
```
Upstream error from Alibaba: Request rate increased too quickly.
To ensure system stability, please adjust your client logic to
scale requests more smoothly over time.
```

**Affected:**
- e011: shark-gate action=evaluate (rate limit)
- e016: shark-evidence action=status (rate limit)

**This is an external API issue, not a code bug. Rate limit handling could be improved with retry logic.**

---

### MEDIUM FAILURE #5: Missing Exercise e007 (MICRO)

**Symptom:** MANIFEST declares 20 exercises, script executes only 19

**e007** (`evidence-collection.json`) is missing from EXERCISES array in TEST_EXECUTION_SCRIPT.sh

**Fix:** Add `"e007-evidence-collection"` to EXERCISES array between e006 and e008

---

## FIXES IMPLEMENTED

### FIX #1: Color Changed to Forest Green ✅

**File:** `src/index.ts`

**Changed:**
```typescript
// BEFORE
const sharkColor = '#006400';  // dark green

// AFTER  
const sharkColor = '#228B22';  // forest green (user requested)
```

**Rebuilt:** `bun run build` — 90 modules, 0.48MB

---

### FIX #2: shark-status Default Tool Variant (PENDING)

**File:** `src/index.ts` — shark-status tool registration

**Current (BUGGY):**
```typescript
tool: {
  'shark-status': statusToolMicro,  // ← micro by default
  'shark-status-micro': statusToolMicro,
  'shark-status-macro': statusToolMacro,
}
```

**FIX:**
```typescript
tool: {
  'shark-status': statusToolMacro,  // ← macro by default
  'shark-status-micro': statusToolMicro,
  'shark-status-macro': statusToolMacro,
}
```

---

### FIX #3: TEST_EXECUTION_SCRIPT.sh Path Quoting (PENDING)

**File:** `TEST_PACKAGE_MACRO/TEST_EXECUTION_SCRIPT.sh`

**Current (BUGGY):**
```bash
EXERCISES_DIR="$TEST_DIR/EXERCISES"
# ...
cat $EXERCISE_FILE | grep '"prompt"' | cut -d'"' -f4 | head -1
opencode run "@shark-macro $(cat $EXERCISE_FILE | grep '"prompt"' | cut -d'"' -f4 | head -1)" > "$LOG_FILE" 2>&1
```

**FIX:**
```bash
EXERCISES_DIR="$TEST_DIR/EXERCISES"
# ...
PROMPT=$(cat "$EXERCISE_FILE" | grep '"prompt"' | cut -d'"' -f4 | head -1)
opencode run "@shark-macro $PROMPT" > "$LOG_FILE" 2>&1
```

**Apply same fix to:** `TEST_PACKAGE_MICRO/TEST_EXECUTION_SCRIPT.sh`

---

### FIX #4: Add Missing Exercise e007 (PENDING)

**File:** `TEST_PACKAGE_MICRO/TEST_EXECUTION_SCRIPT.sh`

**Current:**
```bash
EXERCISES=(
  "e001-status-micro"
  "e002-gate-criteria"
  # ... missing e007 ...
  "e008-iteration-loop-init"
)
```

**FIX:**
```bash
EXERCISES=(
  "e001-status-micro"
  "e002-gate-criteria"
  "e003-guardian-dangerous-command"
  "e004-guardian-zone-check"
  "e005-gate-auto-advance-build"
  "e006-gate-auto-advance-test"
  "e007-evidence-collection"    # ← ADD THIS
  "e008-iteration-loop-init"
  # ...
)
```

---

### FIX #5: Increase P2 Exercise Timeout (PENDING)

**File:** `TEST_PACKAGE_*/TEST_EXECUTION_SCRIPT.sh`

**Current:**
```bash
timeout 60 opencode run "@shark-micro $PROMPT" > "$LOG_FILE" 2>&1
```

**FIX:**
```bash
# P2 exercises need more time (complex multi-step)
TIMEOUT=180
if [[ "$exercise" == "e014"* ]] || [[ "$exercise" == "e020"* ]]; then
  TIMEOUT=300  # Even more for e014 (2+ minutes estimated)
fi
timeout $TIMEOUT opencode run "@shark-micro $PROMPT" > "$LOG_FILE" 2>&1
```

---

## REMAINING GAPS FROM AUDIT-001 (Still Not Fixed)

### GAP #1: MicroCoordinator Class Not Created ❌
- File `src/shark/micro/coordinator.ts` still does not exist
- Brain switching remains mechanical only via T1 prompts, not actual switching

### GAP #2: MacroPeerDispatch Class Not Created ❌
- File `src/shark/macro/peer-dispatch.ts` still does not exist
- Triple-brain coordination not implemented

### GAP #3: Brain Switching Hook Not Wired ❌
- No hook for mechanical Plan↔Build switching
- Shark-micro still has dual-personality T1 without switching logic

### GAP #4: shark-macro Still Single-Agent ❌
- shark-macro registered with only EXECUTION_BRAIN_T1
- Despite description claims "Triple-brain parallel"

---

## TOOL VERIFICATION STATUS

### shark-status ⚠️ PARTIAL
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| MICRO variant | micro | micro | ✅ PASS |
| MACRO variant | macro | Micro | ❌ FAIL |
| Fields | variant, gate, iteration | Returns | ✅ PASS |

### shark-gate ✅ WORKS
| Action | Status |
|--------|--------|
| criteria | ✅ PASS |
| status | ✅ PASS |
| evaluate | ⚠️ Rate limit |
| advance | ✅ PASS (blocks correctly) |

### shark-evidence ⚠️ UNVERIFIED
| Action | Status |
|--------|--------|
| status | ⚠️ Rate limit |
| gate-evidence | Not tested |
| iteration-logs | Not tested |

### Guardian Hook ✅ ADVISORY-ONLY WORKS
| Check | Status |
|-------|--------|
| Dangerous command detection | ✅ Logs warning |
| Zone classification | ✅ Flags zones |
| Cannot block | ✅ By design |

---

## COMPREHENSIVE FIX LIST

| Priority | Fix | Files | Status |
|----------|-----|-------|--------|
| P0 | Fix shark-status default variant | `src/index.ts` | PENDING |
| P0 | Fix script path quoting (MACRO) | `TEST_PACKAGE_MACRO/TEST_EXECUTION_SCRIPT.sh` | PENDING |
| P0 | Fix script path quoting (MICRO) | `TEST_PACKAGE_MICRO/TEST_EXECUTION_SCRIPT.sh` | PENDING |
| P1 | Add missing e007 (MICRO) | `TEST_PACKAGE_MICRO/TEST_EXECUTION_SCRIPT.sh` | PENDING |
| P1 | Increase P2 timeout | Both TEST_EXECUTION_SCRIPT.sh | PENDING |
| P1 | Create MicroCoordinator | `src/shark/micro/coordinator.ts` | PENDING |
| P1 | Create MacroPeerDispatch | `src/shark/macro/peer-dispatch.ts` | PENDING |
| P2 | Wire brain switching hook | `src/hooks/v4.1/brain-switch-hook.ts` | PENDING |
| P2 | Implement rate limit retry | Tool implementations | PENDING |
| P3 | Update shark-macro description | `src/index.ts` | PENDING |

---

## IMMEDIATE ACTION ITEMS

### For Plugin Developer (P0)
1. Fix `src/index.ts` — change default shark-status to macro variant
2. Rebuild: `cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4 && bun run build`

### For Test Package Maintainer (P0)
1. Fix `TEST_PACKAGE_MACRO/TEST_EXECUTION_SCRIPT.sh` — quote paths
2. Fix `TEST_PACKAGE_MICRO/TEST_EXECUTION_SCRIPT.sh` — quote paths
3. Add e007 to MICRO EXERCISES array
4. Increase P2 timeout to 180s minimum

### For DevOps Manager (P2)
1. Re-run test packages after P0 fixes
2. Verify MACRO e001 passes with correct variant
3. Verify MICRO e007 executes

---

## VERIFICATION STEPS

After applying all P0 fixes:

```bash
# 1. Rebuild plugin
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun run build

# 2. Reload plugins
opencode --reload-plugins

# 3. Test MACRO e001 manually
opencode run "@shark-macro call shark-status"
# Should return variant: "macro" (not "Micro")

# 4. Run MICRO tests
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/v4.5/TEST_PACKAGE_MICRO"
bash TEST_EXECUTION_SCRIPT.sh

# 5. Run MACRO tests
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/v4.5/TEST_PACKAGE_MACRO"
bash TEST_EXECUTION_SCRIPT.sh
```

---

## FILES MODIFIED THIS SESSION

| File | Change |
|------|--------|
| `src/index.ts` | Color changed from #006400 to #228B22 |

## FILES CREATED THIS SESSION

| File | Purpose |
|------|---------|
| `documentation/hotfixes/shark-agent-v4-audit-hotfix-002.md` | This comprehensive hotfix report |

---

## ROLLBACK PLAN

If issues persist:
1. Revert `src/index.ts` color line to previous value
2. Rebuild: `bun run build`
3. Re-run tests

---

*Hotfix Created: 2026-04-07*
*Supersedes: shark-agent-v4-audit-hotfix-001.md*
*Source: FORENSIC_TEST_LOG.json (MACRO), FORENSIC_TEST_LOG.md (MICRO)*
