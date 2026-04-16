#!/bin/bash
#
# Shark Agent V4.2 Fix Package — Mechanical Verification
#
# EXIT 0 = all checks pass, ready to build V4.2
# EXIT 1 = one or more checks failed, do not proceed
#

set -e

PROJECT="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4"
FIXPKG="/home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4.1-v4.2-fix-package/FIX_PACKAGE"

cd "$PROJECT"

PASS_COUNT=0
FAIL_COUNT=0
FAIL_REASONS=()

pass() {
  echo "  ✓ $1"
  ((PASS_COUNT++))
}

fail() {
  echo "  ✗ $1"
  ((FAIL_COUNT++))
  FAIL_REASONS+=("  - $1")
}

echo "=============================================="
echo "Shark V4.1 → V4.2 Fix Verification"
echo "=============================================="
echo ""

# ── Preconditions ─────────────────────────────────

echo "[Preconditions]"
test -f src/index.ts && pass "V4.1 source present" || fail "src/index.ts missing"
test -d src/hooks/v4.1 && pass "hooks/v4.1 directory exists" || fail "hooks/v4.1 missing"
test -d "$FIXPKG" && pass "Fix package exists" || fail "Fix package missing"
echo ""

# ── FIX-01: Guardian Blocking ────────────────────

echo "[FIX-01: Guardian Blocking]"

# Check that blocking-is-impossible comment is removed
if grep -q "OpenCode plugin hooks don't support blocking" src/hooks/v4.1/guardian-hook.ts 2>/dev/null; then
  fail "guardian-hook.ts still has 'don't support blocking' comment"
else
  pass "guardian-hook.ts: blocking acknowledgment removed"
fi

# Check guardian still calls isDangerousCommand
if grep -q "isDangerousCommand" src/hooks/v4.1/guardian-hook.ts 2>/dev/null; then
  pass "guardian calls isDangerousCommand"
else
  fail "guardian not calling isDangerousCommand"
fi
echo ""

# ── FIX-02: Coordinator Stubs ─────────────────────

echo "[FIX-02: Coordinator Stubs]"

# Check that throw-stubs are removed
if grep -q "Coordinator not yet wired to hooks" src/index.ts 2>/dev/null; then
  fail "src/index.ts still has 'Coordinator not yet wired' throw stubs"
else
  pass "Coordinator throw stubs removed"
fi

# Check placeholder exists
if grep -q "placeholder — future wiring" src/index.ts 2>/dev/null; then
  pass "Honest placeholder comments present"
else
  fail "No placeholder comments found"
fi
echo ""

# ── FIX-03: TypeScript ───────────────────────────

echo "[FIX-03: TypeScript Verification]"

# Run tsc --noEmit
TS_OUTPUT=$(npx tsc --noEmit 2>&1)
TS_EXIT=$?

if [ "$TS_EXIT" -eq 0 ]; then
  pass "TypeScript: 0 errors"
else
  TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || echo "0")
  fail "TypeScript: $TS_ERRORS errors"
  echo "$TS_OUTPUT" | head -10 | sed 's/^/    /'
fi
echo ""

# ── FIX-04: GateName Import ──────────────────────

echo "[FIX-04: GateName Import]"

# GateName IS defined in evidence.ts
if grep -q "^export type GateName" src/shark/shared/evidence.ts 2>/dev/null; then
  pass "GateName defined in evidence.ts"
else
  fail "GateName NOT in evidence.ts"
fi

# GateName NOT defined in gates.ts
if grep -q "^export type GateName\|^export interface GateName" src/shark/shared/gates.ts 2>/dev/null; then
  fail "GateName incorrectly defined in gates.ts"
else
  pass "GateName NOT defined in gates.ts"
fi

# gate-hook imports from evidence.ts (correct)
if grep -q "type GateName.*from.*evidence" src/hooks/v4.1/gate-hook.ts 2>/dev/null; then
  pass "gate-hook.ts imports GateName from evidence.ts (correct)"
else
  fail "gate-hook.ts GateName import not from evidence.ts"
fi
echo ""

# ── Build Check ──────────────────────────────────

echo "[Build Verification]"

BUILD_OUTPUT=$(bun build src/index.ts --outdir dist --target bun --format esm --bundle 2>&1)
BUILD_EXIT=$?

if [ "$BUILD_EXIT" -eq 0 ]; then
  pass "bun build succeeds"
else
  fail "bun build failed (exit $BUILD_EXIT)"
fi

# Bundle contains hook references
if grep -q "tool.execute.before" dist/index.js 2>/dev/null; then
  pass "Bundle: tool.execute.before present"
else
  fail "Bundle: tool.execute.before missing"
fi

if grep -q "experimental.session.compacting" dist/index.js 2>/dev/null; then
  pass "Bundle: experimental.session.compacting present"
else
  fail "Bundle: experimental.session.compacting missing"
fi

if grep -q "Guardian" dist/index.js 2>/dev/null; then
  pass "Bundle: Guardian referenced"
else
  fail "Bundle: Guardian missing"
fi
echo ""

# ── Final Verdict ────────────────────────────────

echo "=============================================="
echo "VERIFICATION RESULT"
echo "=============================================="
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "STATUS: READY TO BUILD V4.2"
  echo ""
  exit 0
else
  echo "STATUS: DO NOT PROCEED"
  echo ""
  echo "Failed checks:"
  for reason in "${FAIL_REASONS[@]}"; do
    echo "$reason"
  done
  echo ""
  exit 1
fi
