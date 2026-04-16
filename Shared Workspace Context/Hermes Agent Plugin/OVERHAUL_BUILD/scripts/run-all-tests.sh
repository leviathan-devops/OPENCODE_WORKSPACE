#!/bin/bash
# run-all-tests.sh — Run full test suite in order
# Produces FULL_TEST_REPORT.md
# Must be run from v3-build directory

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BUILD_DIR"

REPORT_FILE="FULL_TEST_REPORT.md"

echo "=== Hermes v3 Full Test Suite ==="
echo "Date: $(date)"
echo ""

# Initialize report
echo "# FULL TEST REPORT — Hermes v3" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Date:** $(date)" >> "$REPORT_FILE"
echo "**Build:** $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Phase 1: Build Verification
echo "[PHASE 1] Build Verification..."
if ./scripts/BUILD_VERIFY.sh; then
  echo "BUILD: PASS" >> "$REPORT_FILE"
else
  echo "BUILD: FAIL" >> "$REPORT_FILE"
  echo "Halting — build must pass first"
  exit 1
fi

# Phase 2: E2E Suite
echo "[PHASE 2] E2E Suite..."
E2E_OUTPUT=$(bun test-e2e.ts 2>&1 || true)
E2E_EXIT=$?
if [ $E2E_EXIT -eq 0 ]; then
  echo "E2E: PASS" >> "$REPORT_FILE"
else
  echo "E2E: FAIL (exit $E2E_EXIT)" >> "$REPORT_FILE"
fi
echo "$E2E_OUTPUT" | tail -5
echo ""

# Phase 3: Hook Verification
echo "[PHASE 3] Hook Verification..."
if [ -f test-real-session.ts ]; then
  HOOK_OUTPUT=$(bun test-real-session.ts --verbose 2>&1 || true)
  echo "$HOOK_OUTPUT" > HOOK_VERIFICATION_LOG.md
  HOOK_COUNT=$(echo "$HOOK_OUTPUT" | grep -c "VERIFIED" || echo "0")
  echo "HOOKS: $HOOK_COUNT/29 verified" >> "$REPORT_FILE"
else
  echo "HOOKS: SKIP (test-real-session.ts not found)" >> "$REPORT_FILE"
fi
echo ""

# Phase 4: Delegation Chain
echo "[PHASE 4] Delegation Chain..."
if [ -f test-delegation-chain.ts ]; then
  DELEG_OUTPUT=$(bun test-delegation-chain.ts 2>&1 || true)
  echo "$DELEG_OUTPUT" > DELEGATION_CHAIN_LOG.md
  if echo "$DELEG_OUTPUT" | grep -q "PASS"; then
    echo "DELEGATION: PASS" >> "$REPORT_FILE"
  else
    echo "DELEGATION: FAIL" >> "$REPORT_FILE"
  fi
else
  echo "DELEGATION: SKIP (test-delegation-chain.ts not found)" >> "$REPORT_FILE"
fi
echo ""

# Phase 5: State Machine
echo "[PHASE 5] State Machine..."
if [ -f test-state-machine.ts ]; then
  STATE_OUTPUT=$(bun test-state-machine.ts 2>&1 || true)
  echo "$STATE_OUTPUT" > STATE_MACHINE_LOG.md
  if echo "$STATE_OUTPUT" | grep -q "7/7"; then
    echo "STATE_MACHINE: PASS" >> "$REPORT_FILE"
  else
    echo "STATE_MACHINE: FAIL" >> "$REPORT_FILE"
  fi
else
  echo "STATE_MACHINE: SKIP (test-state-machine.ts not found)" >> "$REPORT_FILE"
fi
echo ""

# Phase 6: Memory System
echo "[PHASE 6] Memory System..."
if [ -f test-memory.ts ]; then
  MEM_OUTPUT=$(bun test-memory.ts 2>&1 || true)
  echo "$MEM_OUTPUT" > MEMORY_LOG.md
  if echo "$MEM_OUTPUT" | grep -q "PASS"; then
    echo "MEMORY: PASS" >> "$REPORT_FILE"
  else
    echo "MEMORY: FAIL" >> "$REPORT_FILE"
  fi
else
  echo "MEMORY: SKIP (test-memory.ts not found)" >> "$REPORT_FILE"
fi
echo ""

# Phase 7: Regression
echo "[PHASE 7] Regression..."
if [ -f test-regression.ts ]; then
  REG_OUTPUT=$(bun test-regression.ts 2>&1 || true)
  echo "$REG_OUTPUT" > REGRESSION_LOG.md
  if echo "$REG_OUTPUT" | grep -q "PASS"; then
    echo "REGRESSION: PASS" >> "$REPORT_FILE"
  else
    echo "REGRESSION: FAIL" >> "$REPORT_FILE"
  fi
else
  echo "REGRESSION: SKIP (test-regression.ts not found)" >> "$REPORT_FILE"
fi
echo ""

# Final verdict
echo "=== Verdict ==="
if grep -q "FAIL" "$REPORT_FILE"; then
  echo "STATUS: NOT READY — fix failures before ship"
  grep "FAIL" "$REPORT_FILE"
  exit 1
else
  echo "STATUS: READY TO SHIP"
  cat "$REPORT_FILE"
  exit 0
fi
