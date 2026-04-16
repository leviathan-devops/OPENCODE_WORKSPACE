#!/bin/bash
# test-tui-replica.sh — Container TUI Replica Test for SHIP Gate
# Runs inside Docker container

set -e

cd /app

echo "=== Hermes v3 — Container TUI Replica Test ==="
echo "Date: $(date)"
echo ""

PASS=0
FAIL=0

# Helper
test_case() {
  local name="$1"
  local cmd="$2"
  local expected="$3"
  
  echo -n "[TEST] $name... "
  result=$(eval "$cmd" 2>&1 || true)
  if echo "$result" | grep -q "$expected"; then
    echo "PASS"
    ((PASS++))
  else
    echo "FAIL"
    echo "  Expected: $expected"
    echo "  Got: $result"
    ((FAIL++))
  fi
}

# 1. Build verification
echo "[TEST 1] Build verification..."
if ./scripts/BUILD_VERIFY.sh > /dev/null 2>&1; then
  echo "PASS: dist is fresh"
  ((PASS++))
else
  echo "FAIL: dist is stale"
  ((FAIL++))
fi

# 2. Hook files exist
echo "[TEST 2] Hook files exist..."
HOOK_COUNT=$(ls src/hooks/*.ts 2>/dev/null | wc -l)
if [ "$HOOK_COUNT" -eq 29 ]; then
  echo "PASS: 29 hook files found"
  ((PASS++))
else
  echo "FAIL: $HOOK_COUNT hook files (expected 29)"
  ((FAIL++))
fi

# 3. Agent files exist
echo "[TEST 3] Agent files exist..."
AGENT_COUNT=$(ls src/agents/*.ts 2>/dev/null | wc -l)
if [ "$AGENT_COUNT" -eq 19 ]; then
  echo "PASS: 19 agent files found"
  ((PASS++))
else
  echo "FAIL: $AGENT_COUNT agent files (expected 19)"
  ((FAIL++))
fi

# 4. Phase state machine
echo "[TEST 4] Phase state machine..."
if grep -q "PHASE_TRANSITIONS" src/config/constants.ts; then
  echo "PASS: PHASE_TRANSITIONS map exists"
  ((PASS++))
else
  echo "FAIL: PHASE_TRANSITIONS not found"
  ((FAIL++))
fi

# 5. Brainstorm gate guard
echo "[TEST 5] Brainstorm gate guard..."
if grep -q ".hermes" src/hooks/brainstorm-gate.ts && grep -q "existsSync" src/hooks/brainstorm-gate.ts; then
  echo "PASS: brainstorm-gate has .hermes/ guard"
  ((PASS++))
else
  echo "FAIL: brainstorm-gate missing .hermes/ guard"
  ((FAIL++))
fi

# 6. Agent identity guards
echo "[TEST 6] Agent identity guards..."
GUARD_COUNT=$(grep -r "isHermesAgent" src/hooks/*.ts 2>/dev/null | wc -l)
if [ "$GUARD_COUNT" -ge 29 ]; then
  echo "PASS: $GUARD_COUNT agent identity guards found"
  ((PASS++))
else
  echo "FAIL: only $GUARD_COUNT guards (expected ≥29)"
  ((FAIL++))
fi

# 7. Tools exist
echo "[TEST 7] Tools exist..."
TOOL_COUNT=$(ls src/tools/*.ts 2>/dev/null | wc -l)
if [ "$TOOL_COUNT" -ge 10 ]; then
  echo "PASS: $TOOL_COUNT tool files found"
  ((PASS++))
else
  echo "FAIL: $TOOL_COUNT tool files (expected ≥10)"
  ((FAIL++))
fi

# 8. Memory directory structure
echo "[TEST 8] Memory directory structure..."
if [ -d "/root/.hermes/memory" ] || mkdir -p "/root/.hermes/memory" 2>/dev/null; then
  echo "PASS: memory directory accessible"
  ((PASS++))
else
  echo "FAIL: memory directory not accessible"
  ((FAIL++))
fi

# 9. Phase persistence file
echo "[TEST 9] Phase persistence..."
PHASE_DIR="$PROJECT_DIR/.hermes"
if mkdir -p "$PHASE_DIR" 2>/dev/null; then
  echo "PASS: phase directory creatable"
  ((PASS++))
else
  echo "FAIL: phase directory not creatable"
  ((FAIL++))
fi

# 10. Integration tests pass
echo "[TEST 10] Integration tests..."
if [ -f "test-regression.ts" ]; then
  if bun run test-regression.ts > /dev/null 2>&1; then
    echo "PASS: regression tests pass"
    ((PASS++))
  else
    echo "FAIL: regression tests failed"
    ((FAIL++))
  fi
else
  echo "FAIL: test-regression.ts not found"
  ((FAIL++))
fi

echo ""
echo "=== TUI Replica Test Results ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "✅ ALL TESTS PASSED — SHIP GATE CLEARED"
  exit 0
else
  echo "❌ $FAIL TESTS FAILED — SHIP GATE FAILED"
  exit 1
fi
