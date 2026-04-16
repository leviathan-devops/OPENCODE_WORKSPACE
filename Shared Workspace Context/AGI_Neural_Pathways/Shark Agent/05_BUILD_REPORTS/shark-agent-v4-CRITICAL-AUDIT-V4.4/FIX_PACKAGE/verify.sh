#!/bin/bash
#
# Shark Agent V4.5 Critical Hotfix — Mechanical Verification
#
# EXIT 0 = all checks pass, ready to build V4.5
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
echo "Shark V4.4 → V4.5 Critical Hotfix Verification"
echo "=============================================="
echo ""

# ── Preconditions ─────────────────────────────────

echo "[Preconditions]"
test -f src/index.ts && pass "src/index.ts present" || fail "src/index.ts missing"
test -f src/hooks/v4.1/gate-hook.ts && pass "gate-hook.ts present" || fail "gate-hook.ts missing"
test -f src/shark/micro/brains.ts && pass "brains.ts present" || fail "brains.ts missing"
echo ""

# ── FIX-A: Ghost File Removed ─────────────────────

echo "[FIX-A: Ghost File Removal]"
test ! -f src/index.v4.0.ts && pass "Ghost file index.v4.0.ts removed" || fail "Ghost file index.v4.0.ts still exists"

# TypeScript must pass
TS_OUTPUT=$(npx tsc --noEmit 2>&1)
TS_EXIT=$?
if [ "$TS_EXIT" -eq 0 ]; then
  pass "TypeScript: 0 errors"
else
  TS_ERRORS=$(echo "$TS_OUTPUT" | grep "error TS" | wc -l)
  fail "TypeScript: $TS_ERRORS errors (exit $TS_EXIT)"
fi
echo ""

# ── FIX-B: Structured State Emission ─────────────

echo "[FIX-B: Iteration Escalation Structured State]"
SHARK_STATE=$(grep -c "\[SHARK STATE\] iteration=" src/hooks/v4.1/gate-hook.ts 2>/dev/null || echo "0")
echo "  Structured state emission refs: $SHARK_STATE"
if [ "$SHARK_STATE" -ge 1 ]; then
  pass "Structured state emission present"
else
  fail "Structured state emission missing"
fi

# Verify handleVerifyFailure is still called
HVF=$(grep -c "handleVerifyFailure" src/hooks/v4.1/gate-hook.ts 2>/dev/null || echo "0")
echo "  handleVerifyFailure refs: $HVF"
if [ "$HVF" -ge 1 ]; then
  pass "handleVerifyFailure still called"
else
  fail "handleVerifyFailure not called"
fi
echo ""

# ── FIX-C: Version Comment ─────────────────────────

echo "[FIX-C: Version Comment Update]"
VERSION=$(head -5 src/index.ts | grep -o "V4\.[0-9]" | head -1)
echo "  Version in index.ts: $VERSION"
if [ "$VERSION" = "V4.4" ]; then
  pass "Version updated to V4.4"
else
  fail "Version still shows $VERSION (expected V4.4)"
fi
echo ""

# ── Build Check ───────────────────────────────────

echo "[Build Check]"
BUILD_OUTPUT=$(bun build src/index.ts --outdir dist --target bun --format esm --bundle 2>&1)
BUILD_EXIT=$?
if [ "$BUILD_EXIT" -eq 0 ]; then
  pass "bun build succeeds"
  echo "  $BUILD_OUTPUT" | head -2
else
  fail "bun build failed (exit $BUILD_EXIT)"
fi
echo ""

# ── Bundle Audit ──────────────────────────────────

echo "[Bundle Audit]"
test -f dist/index.js && pass "dist/index.js exists" || fail "dist/index.js missing"

BUNDLE_SIZE=$(stat -c%s dist/index.js 2>/dev/null || stat -f%z dist/index.js 2>/dev/null)
echo "  Bundle size: $BUNDLE_SIZE bytes"
if [ "$BUNDLE_SIZE" -gt 100000 ]; then
  pass "Bundle size reasonable"
else
  fail "Bundle size suspiciously small"
fi

# Key hooks present
for hook in "tool.execute.before" "tool.execute.after" "experimental.session.compacting" "experimental.chat.system.transform"; do
  COUNT=$(grep -c "$hook" dist/index.js 2>/dev/null || echo "0")
  echo "  $hook: $COUNT"
  if [ "$COUNT" -ge 1 ]; then
    pass "$hook present"
  else
    fail "$hook missing"
  fi
done
echo ""

# ── Final Verdict ────────────────────────────────

echo "=============================================="
echo "VERIFICATION RESULT"
echo "=============================================="
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "STATUS: READY TO BUILD V4.5"
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