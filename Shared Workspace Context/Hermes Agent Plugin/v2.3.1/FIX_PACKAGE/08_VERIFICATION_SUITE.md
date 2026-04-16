# VERIFICATION SUITE — Run After Every Fix

**Purpose**: Mechanically verify each fix before proceeding to the next
**Rule**: ALL commands must pass. ANY failure = STOP and report.

---

## PRE-REQUISITES

```bash
# Set working directory
export WORKSPACE="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.1-build"

# Verify workspace exists
test -d "$WORKSPACE" && echo "WORKSPACE_OK" || echo "WORKSPACE_MISSING"
```

---

## VERIFY BUG 1: secretScan

```bash
# MUST NOT contain =*** pattern
grep -n "secretScan=\*" "$WORKSPACE/src/tools/security.ts" && echo "FAIL: =*** found" || echo "PASS: no =***"

# MUST contain proper tool() wrapper
grep -n "export const secretScan = tool({" "$WORKSPACE/src/tools/security.ts" || echo "FAIL: missing tool wrapper"

# MUST compile
cd "$WORKSPACE" && bun build.ts 2>&1 | tail -3
```

---

## VERIFY BUG 2: symbols path traversal

```bash
# MUST contain startsWith check
grep -n "startsWith(allowedRoot)" "$WORKSPACE/src/tools/analysis.ts" | wc -l
# Expected: 3 or more (imports, symbols, complexityHotspots)

# MUST use resolved path in readFileSync for symbols
grep -A5 "export const symbols" "$WORKSPACE/src/tools/analysis.ts" | grep "readFileSync(resolved" || echo "FAIL: symbols doesn't use resolved"

# MUST NOT use fullPath in readFileSync for symbols
grep -A10 "export const symbols" "$WORKSPACE/src/tools/analysis.ts" | grep "readFileSync(fullPath" && echo "FAIL: symbols still uses fullPath" || echo "PASS: no fullPath in symbols"
```

---

## VERIFY BUG 3: complexityHotspots path

```bash
# MUST validate target path
grep -n "startsWith(allowedRoot)" "$WORKSPACE/src/tools/analysis.ts" | wc -l
# Expected: 3 or more

# Build succeeds
cd "$WORKSPACE" && bun build.ts 2>&1 | tail -3
```

---

## VERIFY FIX 4: delegation gate blocks

```bash
# MUST contain blocked assignment
grep -n "blocked = true" "$WORKSPACE/src/hooks/delegation-gate.ts" || echo "FAIL: no blocked assignment"

# MUST be cast to any (TypeScript requires this)
grep -n "(output as any).blocked = true" "$WORKSPACE/src/hooks/delegation-gate.ts" || echo "FAIL: missing cast"

# Build succeeds
cd "$WORKSPACE" && bun build.ts 2>&1 | tail -3
```

---

## VERIFY FIX 5: supervisor metadata

```bash
# MUST have either:
# Option A: evidence that output.metadata is consumed (documented in code)
# Option B: new supervisor.ts tool exists

if [ -f "$WORKSPACE/src/tools/supervisor.ts" ]; then
    echo "PASS: supervisor.ts exists"
    grep -n "getSupervisorRecommendations" "$WORKSPACE/src/index.ts" && echo "PASS: tool registered" || echo "FAIL: tool not registered"
else
    echo "INFO: Option A chosen - verify output.metadata documentation"
    grep -n "output.metadata" "$WORKSPACE/src/hooks/supervisor-loop-hook.ts"
fi

# Build succeeds
cd "$WORKSPACE" && bun build.ts 2>&1 | tail -3
```

---

## VERIFY FIX 6: CLI handlers

```bash
# MUST have hermes-commands.ts
test -f "$WORKSPACE/src/config/hermes-commands.ts" && echo "PASS: hermes-commands.ts exists" || echo "FAIL: missing hermes-commands.ts"

# MUST NOT have Shark command
grep -n "Shark" "$WORKSPACE/src/index.ts" && echo "FAIL: Shark still registered" || echo "PASS: Shark removed"

# MUST have Hermes template
grep -n "Hermes" "$WORKSPACE/src/index.ts" | grep "template" || echo "FAIL: Hermes template missing"

# Build succeeds
cd "$WORKSPACE" && bun build.ts 2>&1 | tail -3
```

---

## VERIFY FIX 7: devops path configurable

```bash
# MUST reference HERMES_DEVOPS_CONTEXT_DIR
grep -n "HERMES_DEVOPS_CONTEXT_DIR" "$WORKSPACE/src/config/devops-manager.ts" || echo "FAIL: no env var reference"

# MUST have fallback path logic
grep -n "HERMES_WORKSPACE_DIR" "$WORKSPACE/src/config/devops-manager.ts" || echo "FAIL: no fallback"

# MUST have context directory
test -d "$WORKSPACE/context/devops-manager" && echo "PASS: context dir exists" || echo "FAIL: context dir missing"

# MUST have at least MENTAL_MODEL.md
test -f "$WORKSPACE/context/devops-manager/MENTAL_MODEL.md" && echo "PASS: MENTAL_MODEL.md exists" || echo "FAIL: MENTAL_MODEL.md missing"

# Build succeeds
cd "$WORKSPACE" && bun build.ts 2>&1 | tail -3
```

---

## FULL BUILD VERIFICATION

```bash
# TypeScript check — MUST be 0 errors
cd "$WORKSPACE" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"

# If TypeScript has errors, they must be documented as acceptable
# See: 00_INDEX.md DEFINITIONS section
# All errors in security.ts (secretScan) are NOW fixed — should be 0
```

---

## SUMMARY REPORT

After running all verifications, output:

```
=== v2.3.1 VERIFICATION SUMMARY ===

BUG 1 (secretScan):        [PASS/FAIL]
BUG 2 (symbols traversal): [PASS/FAIL]
BUG 3 (complexity path):   [PASS/FAIL]
FIX 4 (delegation gate):    [PASS/FAIL]
FIX 5 (supervisor meta):   [PASS/FAIL]
FIX 6 (CLI handlers):       [PASS/FAIL]
FIX 7 (devops path):       [PASS/FAIL]

TypeScript Errors:         [N]
Build Exit Code:           [N]

OVERALL: [READY TO SHIP / DO NOT SHIP]
```

---

## FAILURE PROTOCOL

If ANY verification fails:

1. **STOP** — do not apply additional fixes
2. **IDENTIFY** — which fix failed, exact command, exact output
3. **REPORT** — "Fix N (description) failed at verification step: [step]. Expected [X], got [Y]"
4. **AWAIT** — human instruction before retrying

**Do NOT:**
- Apply multiple fixes at once when one fails
- Skip failing verifications
- Proceed to build step
- Mark as complete with known failures
