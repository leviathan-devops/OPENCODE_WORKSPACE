# HERMES AGENT PLUGIN v2.3.5 — SHIP SOP
## Standard Operating Procedure for Deployment

**Version:** 2.3.5
**Date:** 2026-04-07
**Status:** DEPLOYMENT READY

---

## PRE-SHIP CHECKLIST

Before shipping, verify ALL items:

- [ ] dist/index.js exists and is freshly built
- [ ] Build exit code is 0
- [ ] E2E tests pass (144/147 minimum)
- [ ] Exercise tests pass (11/12 or better)
- [ ] All 5 critical fixes verified in dist:
  - [ ] lint: combinedOutput (line 15145)
  - [ ] grill: scanDir directory scanning (line 15633)
  - [ ] complexity_hotspots: nested loop patterns (line 15350)
  - [ ] symbols: Python file support (line 15519)
  - [ ] /Hermes CLI: command routing (line 16089)
- [ ] Path containment verified: `startsWith(allowedRoot)` present
- [ ] No hardcoded credentials or secrets
- [ ] Audit package complete (BUILD_AUDIT_REPORT.md)

---

## SHIP STEPS

### Step 1: Verify Build Environment

```bash
# Navigate to plugin directory
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.5-build"

# Verify dependencies installed
ls node_modules/.bin/bun
```

**Expected:** bun executable exists

---

### Step 2: Build dist/index.js

```bash
# Run the build script (NOT 'bun build dist/index.ts')
bun build.ts
```

**Expected output:**
```
Built: dist/index.js
Build exit code: 0
```

**Verify dist:**
```bash
stat -c%s dist/index.js  # Should be ~562,000 bytes
stat -c%y dist/index.js  # Should be today's date
```

---

### Step 3: Verify Fix Signatures in dist

```bash
# lint fix (ESLint stdout+stderr)
grep -n "combinedOutput" dist/index.js | head -1
# Expected: line ~15145

# grill directory scanning
grep -n "scanDir" dist/index.js | head -1
# Expected: line ~15633

# complexity nested loop detection
grep -n "nested loop" dist/index.js | head -1
# Expected: line ~15350

# symbols Python support
grep -n 'ext === "py"' dist/index.js | head -1
# Expected: line ~15519

# /Hermes CLI routing
grep -n "createHermesCommandHook" dist/index.js | head -1
# Expected: line ~13356

# Path containment
grep -c "startsWith(allowedRoot)" dist/index.js
# Expected: 5 or more
```

---

### Step 4: Run E2E Tests

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.5-build"
npx tsx test-e2e.ts
```

**Expected:** 144/147 passing (98.0%)

**Acceptable:** 140/147+ (95%+) — verify failed tests are pre-existing

---

### Step 5: Run Exercise Tests (Optional but Recommended)

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.5-build/TEST_PACKAGE_V2"
bash run-exercises.sh
```

**Expected:** 10/12+ passing (83%+)

---

### Step 6: Deploy dist/index.js

#### Option A: Copy to Plugin Directory

```bash
# Identify target plugin directory
TARGET_DIR="/path/to/your/opencode-plugins/hermes-agent-v2.3.5"

# Backup existing
cp "$TARGET_DIR/dist/index.js" "$TARGET_DIR/dist/index.js.backup" 2>/dev/null || true

# Copy new dist
cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.5-build/dist/index.js" "$TARGET_DIR/dist/index.js"

# Verify copy
stat -c%s "$TARGET_DIR/dist/index.js"
```

#### Option B: Rebuild In-Place

```bash
cd "/path/to/your/opencode-plugins/hermes-agent-v2.3.5"
bun build.ts
```

---

### Step 7: Reload OpenCode

```bash
# Restart OpenCode to reload the plugin
# This varies by installation method:
# - VS Code: Reload Window
# - CLI: Exit and restart
# - Server: Restart service
```

---

### Step 8: Verify Deployment

Run these commands in OpenCode to verify:

```bash
# Test lint
call lint target=src
# Expected: Non-empty output, no ESLint config error

# Test grill
call grill target=src
# Expected: Security report, not "Could not analyze"

# Test complexity
call complexity_hotspots target=src
# Expected: Complexity analysis output

# Test symbols
call symbols target=src/tools/analysis.ts
# Expected: Symbol extraction output

# Test /Hermes CLI
/Hermes status
# Expected: Hermes status (not vanilla agent)
```

---

## TROUBLESHOOTING

### lint shows "ESLint couldn't find an eslint.config"

**Cause:** lint fix not present in dist
**Fix:** Rebuild with `bun build.ts`, verify combinedOutput at line 15145

### grill shows "Could not analyze"

**Cause:** grill directory scanning fix not present
**Fix:** Verify scanDir at line 15633 in dist

### /Hermes commands route to vanilla agent

**Cause:** hermes-command hook not registered
**Fix:** Verify createHermesCommandHook at line 16089

### Path traversal not blocked

**Cause:** Path containment not implemented
**Fix:** Verify startsWith(allowedRoot) at 5+ locations in dist

### Tools fail with "Access denied" on valid paths

**Cause:** Absolute paths (/tmp) conflict with path containment
**Fix:** Use RELATIVE paths (src/, src/tools/) not absolute paths

### Exercise tests at 30% instead of 90%+

**Cause:** Using TEST_PACKAGE (absolute paths) not TEST_PACKAGE_V2 (relative paths)
**Fix:** Use TEST_PACKAGE_V2 for exercise tests

---

## ROLLBACK PROCEDURE

If deployment fails:

```bash
# Restore backup
cp "/path/to/plugin/dist/index.js.backup" "/path/to/plugin/dist/index.js"

# Or restore from previous version
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.4-build"
bun build.ts
cp dist/index.js "/path/to/plugin/dist/index.js"
```

---

## DEPLOYMENT SUMMARY

| Item | Value |
|------|-------|
| dist size | 562,059 bytes |
| Build command | `bun build.ts` |
| E2E pass rate | 98.0% (144/147) |
| Exercise pass rate | 91.7% (11/12) |
| Critical fixes | 5 verified |
| Path containment | 5 locations |

---

## CONTACTS

| Role | Agent | Notes |
|------|-------|-------|
| Build | Shark Agent | |
| Audit | DevOps Manager | |
| Deploy | Human | Requires manual approval |

---

*Ship SOP v2.3.5 — Follow exactly for first-try success*
