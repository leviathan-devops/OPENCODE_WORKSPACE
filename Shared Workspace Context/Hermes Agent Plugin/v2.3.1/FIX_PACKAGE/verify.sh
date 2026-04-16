#!/bin/bash
# v2.3.1 Mechanical Verification Script
# Run this AFTER applying each fix to verify it
# Exit 0 = pass, Exit 1 = fail

set -e

WORKSPACE="${WORKSPACE:-/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.1-build}"
cd "$WORKSPACE"

FAIL_COUNT=0
PASS_COUNT=0

pass() { echo "  ✓ $1"; ((PASS_COUNT++)); }
fail() { echo "  ✗ $1"; ((FAIL_COUNT++)); }

echo "=== v2.3.1 VERIFICATION ==="
echo "Workspace: $WORKSPACE"
echo ""

# BUG 1: secretScan
echo "[BUG 1] secretScan tool syntax"
if grep -q "secretScan = tool({" src/tools/security.ts 2>/dev/null; then
    pass "secretScan wrapped in tool()"
else
    fail "secretScan NOT wrapped in tool()"
fi

if grep -q "secretScan=\*" src/tools/security.ts 2>/dev/null; then
    fail "=*** pattern still exists"
else
    pass "No =*** placeholder"
fi

# BUG 2: symbols path traversal
echo "[BUG 2] symbols path containment"
SYMBOLS_FIXED=0
if grep -A15 "export const symbols" src/tools/analysis.ts | grep -q "startsWith(allowedRoot)"; then
    pass "symbols has startsWith check"
    ((SYMBOLS_FIXED++))
else
    fail "symbols missing startsWith check"
fi

if grep -A15 "export const symbols" src/tools/analysis.ts | grep -q "readFileSync(resolved"; then
    pass "symbols uses resolved path"
    ((SYMBOLS_FIXED++))
else
    fail "symbols doesn't use resolved path"
fi

# BUG 3: complexityHotspots path
echo "[BUG 3] complexityHotspots path validation"
if grep -B2 -A15 "complexityHotspots" src/tools/analysis.ts | grep -q "startsWith(allowedRoot)"; then
    pass "complexityHotspots validates path"
else
    fail "complexityHotspots missing path validation"
fi

# FIX 4: delegation gate blocking
echo "[FIX 4] delegation gate blocks"
if grep -q "(output as any).blocked = true" src/hooks/delegation-gate.ts 2>/dev/null; then
    pass "delegation gate sets blocked = true"
else
    fail "delegation gate doesn't set blocked"
fi

# FIX 5: supervisor metadata
echo "[FIX 5] supervisor recommendations wired"
if [ -f src/tools/supervisor.ts ]; then
    pass "supervisor.ts tool file exists"
    if grep -q "getSupervisorRecommendations" src/index.ts 2>/dev/null; then
        pass "supervisor tool registered in index.ts"
    else
        fail "supervisor tool NOT registered"
    fi
else
    fail "supervisor.ts NOT found (Option B not implemented)"
fi

# FIX 6: CLI handlers
echo "[FIX 6] Hermes CLI commands"
if [ -f src/config/hermes-commands.ts ]; then
    pass "hermes-commands.ts exists"
    if grep -q "HERMES_COMMANDS" src/config/hermes-commands.ts 2>/dev/null; then
        pass "HERMES_COMMANDS defined"
    else
        fail "HERMES_COMMANDS not defined"
    fi
else
    fail "hermes-commands.ts NOT found"
fi

if grep -q "Shark" src/index.ts 2>/dev/null; then
    fail "Shark command still registered (should be removed)"
else
    pass "Shark command removed"
fi

# FIX 7: devops path
echo "[FIX 7] DevOps context path"
if grep -q "HERMES_DEVOPS_CONTEXT_DIR" src/config/devops-manager.ts 2>/dev/null; then
    pass "HERMES_DEVOPS_CONTEXT_DIR env var referenced"
else
    fail "HERMES_DEVOPS_CONTEXT_DIR not referenced"
fi

if [ -d context/devops-manager ]; then
    pass "context/devops-manager directory exists"
    if [ -f context/devops-manager/MENTAL_MODEL.md ]; then
        pass "MENTAL_MODEL.md exists"
    else
        fail "MENTAL_MODEL.md missing"
    fi
else
    fail "context/devops-manager directory missing"
fi

# Build test
echo ""
echo "[BUILD] bun build.ts"
if bun build.ts > /dev/null 2>&1; then
    pass "build succeeds"
    if [ -f dist/index.js ]; then
        pass "dist/index.js generated"
    else
        fail "dist/index.js NOT generated"
    fi
else
    fail "build FAILED"
fi

# TypeScript check
echo ""
echo "[TYPESCRIPT] npx tsc --noEmit"
TSC_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")
if [ "$TSC_ERRORS" = "0" ]; then
    pass "TypeScript: 0 errors"
else
    echo "$TSC_OUTPUT" | grep "error TS" | head -5
    fail "TypeScript: $TSC_ERRORS errors"
fi

echo ""
echo "=== SUMMARY ==="
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "RESULT: DO NOT SHIP"
    exit 1
else
    echo "RESULT: READY TO SHIP"
    exit 0
fi
