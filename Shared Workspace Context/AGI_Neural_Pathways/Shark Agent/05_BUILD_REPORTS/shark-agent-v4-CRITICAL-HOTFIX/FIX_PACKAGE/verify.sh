#!/bin/bash
#
# Shark Agent V4.4 Critical Hotfix — Mechanical Verification
#
# EXIT 0 = all checks pass, ready to build V4.4
# EXIT 1 = one or more checks failed, do not proceed
#

set -e

PROJECT="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4"

cd "$PROJECT"

PASS_COUNT=0
FAIL_COUNT=0
FAIL_REASONS=()

pass() { echo "  ✓ $1"; ((PASS_COUNT++)) || true; }
fail() { echo "  ✗ $1"; ((FAIL_COUNT++)) || true; FAIL_REASONS+=("  - $1"); }

echo "=============================================="
echo "Shark V4.3 → V4.4 Critical Hotfix Verification"
echo "=============================================="
echo ""

# ── Preconditions ─────────────────────────────────

echo "[Preconditions]"
test -f src/index.ts && pass "V4.3 source present" || fail "src/index.ts missing"
test -f src/hooks/v4.1/index.ts && pass "hooks/v4.1 exists" || fail "hooks/v4.1 missing"
echo ""

# ── FIX-01: Guardian Self-Rejection in T1 ────────

echo "[FIX-01: Agent T1 Self-Rejection]"

# Both brain files must have self-rejection language
MICRO=$(grep -c "self-reject\|must refuse\|must not execute.*dangerous\|mandatory.*refusal" src/shark/micro/brains.ts 2>/dev/null || echo "0")
MACRO=$(grep -c "self-reject\|must refuse\|must not execute.*dangerous\|mandatory.*refusal" src/shark/macro/brains.ts 2>/dev/null || echo "0")

echo "  Micro brains self-rejection refs: $MICRO"
echo "  Macro brains self-rejection refs: $MACRO"

if [ "$MICRO" -ge 2 ]; then
  pass "Micro brains T1 has self-rejection (≥2 refs)"
else
  fail "Micro brains T1 missing self-rejection language"
fi

if [ "$MACRO" -ge 1 ]; then
  pass "Macro brains T1 has self-rejection (≥1 ref)"
else
  fail "Macro brains T1 missing self-rejection language"
fi
echo ""

# ── FIX-02: Coordinator Dead Code Removed ─────────

echo "[FIX-02: Coordinator Dead Code Removal]"

# Files must be removed
if [ -f src/shark/micro/coordinator.ts ]; then
  fail "coordinator.ts still exists"
else
  pass "coordinator.ts removed"
fi

if [ -f src/shark/macro/peer-dispatch.ts ]; then
  fail "peer-dispatch.ts still exists"
else
  pass "peer-dispatch.ts removed"
fi

# No remaining imports
IMPORTS=$(grep -r "MicroCoordinator\|MacroPeerDispatch" src/ --include="*.ts" 2>/dev/null | grep -v "// " | wc -l)
echo "  Remaining coordinator imports: $IMPORTS"
if [ "$IMPORTS" -eq 0 ]; then
  pass "No remaining coordinator imports"
else
  fail "Found $IMPORTS remaining coordinator references"
fi

# COORDINATOR_T1 text can remain (it's just a string)
COORD_T1=$(grep -c "COORDINATOR_T1" src/shark/micro/brains.ts 2>/dev/null || echo "0")
if [ "$COORD_T1" -ge 1 ]; then
  pass "COORDINATOR_T1 text preserved (string constant, not class)"
else
  fail "COORDINATOR_T1 text removed (should remain as string)"
fi
echo ""

# ── FIX-03: Iteration Loop Wired ─────────────────

echo "[FIX-03: Iteration Loop Wired to Hook]"

# handleVerifyFailure must be called in gate-hook
HVF=$(grep -c "handleVerifyFailure" src/hooks/v4.1/gate-hook.ts 2>/dev/null || echo "0")
echo "  handleVerifyFailure refs in gate-hook: $HVF"
if [ "$HVF" -ge 1 ]; then
  pass "handleVerifyFailure called in gate-hook"
else
  fail "handleVerifyFailure not called in gate-hook"
fi

# Iteration escalation logging must exist
ESC=$(grep -c "ITERATION ESCALATION" src/hooks/v4.1/gate-hook.ts 2>/dev/null || echo "0")
if [ "$ESC" -ge 1 ]; then
  pass "Iteration escalation logging present"
else
  fail "Iteration escalation logging missing"
fi
echo ""

# ── Build Checks ──────────────────────────────────

echo "[Build Checks]"

# TypeScript
TS_OUTPUT=$(npx tsc --noEmit 2>&1)
TS_EXIT=$?
if [ "$TS_EXIT" -eq 0 ]; then
  pass "TypeScript: 0 errors"
else
  TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || echo "0")
  fail "TypeScript: $TS_ERRORS errors"
fi

# Bundle
BUILD_EXIT=$(bun build src/index.ts --outdir dist --target bun --format esm --bundle 2>&1; echo $?)
if [ "$BUILD_EXIT" -eq 0 ]; then
  pass "bun build succeeds"
else
  fail "bun build failed (exit $BUILD_EXIT)"
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
  echo "STATUS: READY TO BUILD V4.4"
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
