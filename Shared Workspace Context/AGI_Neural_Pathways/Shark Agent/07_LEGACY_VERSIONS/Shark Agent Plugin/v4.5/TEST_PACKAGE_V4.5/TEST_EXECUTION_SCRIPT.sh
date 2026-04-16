#!/bin/bash
#
# Shark Agent V4.5 — Mechanical Validation Test Suite
# Tests coordinator initialization, brain switching, gate system, evidence collection
#

set -e

TEST_DIR="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/v4.5/TEST_PACKAGE_V4.5"
EXERCISES_DIR="$TEST_DIR/EXERCISES"
RESULTS_FILE="$TEST_DIR/RESULTS.json"
LOGS_DIR="$TEST_DIR/logs"
WORKSPACE="/home/leviathan/OPENCODE_WORKSPACE"

mkdir -p "$LOGS_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
ERROR_COUNT=0
TOTAL_COUNT=0

echo "=============================================="
echo "Shark Agent V4.5 — Mechanical Validation"
echo "=============================================="
echo ""

# Initialize results
cat > "$RESULTS_FILE" << 'EOF'
{
  "package": "shark-v4.5-mechanical-validation",
  "version": "1.0",
  "timestamp": "",
  "agent": "shark-micro + shark-macro",
  "results": [],
  "summary": {}
}
EOF

# Exercise list
EXERCISES=(
  "e001-status-variant-check"
  "e002-coordinator-init-check"
  "e003-macro-brain-context"
  "e004-gate-criteria-check"
  "e005-evidence-write-trigger"
  "e006-checkpoint-creation"
  "e007-gate-manual-evaluate"
  "e008-gate-advance-block"
  "e009-iteration-state-check"
  "e010-evidence-status"
)

# Agent to use per exercise
declare -A EXERCISE_AGENT=(
  ["e001-status-variant-check"]="@shark-micro"
  ["e002-coordinator-init-check"]="@shark-micro"
  ["e003-macro-brain-context"]="@shark-macro"
  ["e004-gate-criteria-check"]="@shark-micro"
  ["e005-evidence-write-trigger"]="@shark-micro"
  ["e006-checkpoint-creation"]="@shark-micro"
  ["e007-gate-manual-evaluate"]="@shark-micro"
  ["e008-gate-advance-block"]="@shark-micro"
  ["e009-iteration-state-check"]="@shark-micro"
  ["e010-evidence-status"]="@shark-micro"
)

# Timeout per difficulty
get_timeout() {
  local exercise=$1
  local difficulty=$(grep '"difficulty"' "$EXERCISES_DIR/${exercise}.json" 2>/dev/null | cut -d'"' -f4)
  case "$difficulty" in
    P0) echo "60" ;;
    P1) echo "90" ;;
    P2) echo "180" ;;
    *)  echo "60" ;;
  esac
}

# Verification check
verify_output() {
  local exercise=$1
  local output=$2

  # Parse required_strings from JSON using python
  local required_strings=$(python3 -c "
import json
import sys
try:
    with open('$EXERCISES_DIR/${exercise}.json') as f:
        data = json.load(f)
        verification = data.get('verification', {})
        strings = verification.get('required_strings', [])
        for s in strings:
            print(s)
except Exception as e:
    print('', file=sys.stderr)
" 2>/dev/null || echo "")

  local all_passed=true
  if [ -z "$required_strings" ]; then
    echo -e "  ${YELLOW}[WARN]${NC} No required_strings found"
    return 1
  fi

  for str in $required_strings; do
    if echo "$output" | grep -qi "$str"; then
      echo -e "  ${GREEN}✓${NC} Found: '$str'"
    else
      echo -e "  ${RED}✗${NC} MISSING: '$str'"
      all_passed=false
    fi
  done

  if $all_passed; then
    return 0
  else
    return 1
  fi
}

# Run each exercise
for exercise in "${EXERCISES[@]}"; do
  EXERCISE_FILE="$EXERCISES_DIR/${exercise}.json"

  if [ ! -f "$EXERCISE_FILE" ]; then
    echo -e "${YELLOW}[SKIP]${NC} $exercise — file not found"
    continue
  fi

  EXERCISE_NAME=$(grep '"name"' "$EXERCISE_FILE" | head -1 | cut -d'"' -f4)
  COMPONENT=$(grep '"component"' "$EXERCISE_FILE" | head -1 | cut -d'"' -f4)
  DIFFICULTY=$(grep '"difficulty"' "$EXERCISE_FILE" | head -1 | cut -d'"' -f4)
  PROMPT=$(grep '"prompt"' "$EXERCISE_FILE" | head -1 | cut -d'"' -f4)

  AGENT="${EXERCISE_AGENT[$exercise]:-@shark-micro}"
  TIMEOUT=$(get_timeout "$exercise")

  echo "----------------------------------------------"
  echo -e "${BLUE}[$exercise]${NC} $EXERCISE_NAME"
  echo "  Component: $COMPONENT | Difficulty: $DIFFICULTY | Agent: $AGENT"
  echo "----------------------------------------------"

  LOG_FILE="$LOGS_DIR/${exercise}.log"

  # Run the exercise
  cd "$WORKSPACE"
  set +e
  timeout $TIMEOUT opencode run "$AGENT $PROMPT" > "$LOG_FILE" 2>&1
  EXIT_CODE=$?
  set -e

  TOTAL_COUNT=$((TOTAL_COUNT + 1))

  if [ $EXIT_CODE -eq 124 ]; then
    echo -e "  ${YELLOW}[TIMEOUT]${NC} Exercise timed out after ${TIMEOUT}s"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    continue
  fi

  if [ $EXIT_CODE -ne 0 ]; then
    echo -e "  ${YELLOW}[ERROR]${NC} Exit code: $EXIT_CODE"
    ERROR_COUNT=$((ERROR_COUNT + 1))
    continue
  fi

  # Extract relevant output (last 30 lines, skip noise)
  OUTPUT=$(tail -30 "$LOG_FILE" | grep -v "^\[" | grep -v "^>" | grep -v "^$" | tr '\n' ' ')

  if [ -z "$OUTPUT" ]; then
    # Try to get any output
    OUTPUT=$(cat "$LOG_FILE" | tail -20 | tr '\n' ' ')
  fi

  echo "  Output: ${OUTPUT:0:200}..."

  # Verify output
  echo "  Verification:"
  if verify_output "$exercise" "$OUTPUT"; then
    echo -e "  ${GREEN}[PASS]${NC} $exercise"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo -e "  ${RED}[FAIL]${NC} $exercise"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  echo ""
done

echo "=============================================="
echo "Test Run Complete"
echo "=============================================="
echo -e "Total:  ${TOTAL_COUNT}"
echo -e "Passed: ${GREEN}${PASS_COUNT}${NC}"
echo -e "Failed: ${RED}${FAIL_COUNT}${NC}"
echo -e "Errors: ${YELLOW}${ERROR_COUNT}${NC}"
echo ""

# Calculate pass rate
if [ $TOTAL_COUNT -gt 0 ]; then
  PASS_RATE=$((PASS_COUNT * 100 / TOTAL_COUNT))
  echo "Pass Rate: ${PASS_RATE}%"
fi

echo ""
echo "Results written to: $RESULTS_FILE"
echo "Logs written to: $LOGS_DIR/"
echo ""
echo "Log files:"
ls -la "$LOGS_DIR/" | grep ".log" | awk '{print "  "$9}'

exit 0
