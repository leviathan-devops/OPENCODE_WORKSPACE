#!/bin/bash
#
# Shark Agent V4.3 Fix Package — Mechanical Verification
#
# EXIT 0 = all checks pass, ready to build V4.3
# EXIT 1 = one or more checks failed, do not proceed
#

set -e

REPORT="/home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4.2-build-report-2026-04-06.md"

cd "$(dirname "$0")/.."

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
echo "Shark V4.2 → V4.3 Fix Verification"
echo "=============================================="
echo ""

# ── Preconditions ─────────────────────────────────

echo "[Preconditions]"
test -f "$REPORT" && pass "V4.2 report exists" || fail "Report missing"
test -f "/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/index.ts" && pass "V4.2 source present" || fail "Source missing"
echo ""

# ── FIX-01: Status Table ─────────────────────────

echo "[FIX-01: Status Table]"

# No V4.3 item commitment
if grep -q "V4.3 item\|V4.3 commitment" "$REPORT" 2>/dev/null; then
  fail "Report still contains 'V4.3 item' or 'V4.3 commitment'"
else
  pass "No unauthorized V4.3 commitment"
fi

# Status table uses TODO language
if grep -q "TODO in code" "$REPORT" 2>/dev/null; then
  pass "Coordinators row uses 'TODO in code' language"
else
  fail "Status table does not use 'TODO in code' language"
fi

# Verify the actual line content
if grep -q "Stubs removed, not wired (V4.3 item)" "$REPORT" 2>/dev/null; then
  fail "Old status row text still present: 'Stubs removed, not wired (V4.3 item)'"
else
  pass "Old status row text removed"
fi
echo ""

# ── FIX-02: Verification Output ───────────────────

echo "[FIX-02: Verification Output]"

# No bare "# Result:" claims without actual output
# A bare result looks like: "# Result: 3" on its own line after a command
# with no actual output shown

# Count occurrences of bare result claims
BARE_CLAIMS=$(grep -c "^# Result:" "$REPORT" 2>/dev/null || echo "0")
if [ "$BARE_CLAIMS" -eq 0 ]; then
  pass "No bare '# Result:' claims without actual output"
else
  fail "Found $BARE_CLAIMS bare '# Result:' claim(s) without actual output"
fi

# TypeScript section shows actual exit code
if grep -q "Exit: 0\|Exit code: 0" "$REPORT" 2>/dev/null; then
  pass "TypeScript verification shows actual exit code"
else
  fail "TypeScript verification missing actual exit code"
fi
echo ""

# ── Build Check ──────────────────────────────────

echo "[Source Build Check]"

cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# TypeScript must be clean
TS_OUTPUT=$(npx tsc --noEmit 2>&1)
TS_EXIT=$?

if [ "$TS_EXIT" -eq 0 ]; then
  pass "TypeScript: 0 errors"
else
  TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || echo "0")
  fail "TypeScript: $TS_ERRORS errors"
fi

# Bundle must build
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
  echo "STATUS: READY TO BUILD V4.3"
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
