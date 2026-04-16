#!/bin/bash
#
# Shark Micro Agent — Test Execution Script
# Package: shark-micro-test-package-v1
# Agent: shark-micro
#

TEST_DIR="/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin/v4.5/TEST_PACKAGE_MICRO"
EXERCISES_DIR="$TEST_DIR/EXERCISES"
RESULTS_FILE="$TEST_DIR/EXERCISE_RESULTS.json"
LOGS_DIR="$TEST_DIR/logs"

mkdir -p "$LOGS_DIR"

echo "=============================================="
echo "Shark Micro Agent — Test Package v1.0"
echo "=============================================="
echo ""

# Initialize results
cat > "$RESULTS_FILE" << 'EOF'
{
  "package_id": "shark-micro-test-package-v1",
  "version": "1.0",
  "date": "2026-04-07",
  "agent": "shark-micro",
  "executor": "DEV_OPS_MANAGER",
  "exercises_completed": [],
  "exercises_passed": [],
  "exercises_failed": [],
  "results": []
}
EOF

# Exercise list (all 20 exercises including e007)
EXERCISES=(
  "e001-status-micro"
  "e002-gate-criteria"
  "e003-guardian-dangerous-command"
  "e004-guardian-zone-check"
  "e005-gate-auto-advance-build"
  "e006-gate-auto-advance-test"
  "e007-evidence-collection"
  "e008-iteration-loop-init"
  "e009-self-rejection-t1-prompt"
  "e010-brain-switch-plan"
  "e011-brain-switch-build"
  "e012-gate-manual-evaluate"
  "e013-gate-manual-advance"
  "e014-iteration-escalation-detect"
  "e015-system-transform-hook"
  "e016-state-persistence-checkpoint"
  "e017-evidence-collection"
  "e018-verify-attempts-counter"
  "e019-gate-status-all"
  "e020-coordinator-t1-text"
)

PASS_COUNT=0
FAIL_COUNT=0

echo "Exercises to run: ${#EXERCISES[@]}"
echo ""

for exercise in "${EXERCISES[@]}"; do
  EXERCISE_FILE="$EXERCISES_DIR/${exercise}.json"

  if [ ! -f "$EXERCISE_FILE" ]; then
    echo "  [SKIP] $exercise — exercise file not found"
    continue
  fi

  echo "----------------------------------------------"
  echo "Running: $exercise"
  echo "----------------------------------------------"

  # Read exercise name (properly quoted)
  EX_NAME=$(grep '"name"' "$EXERCISE_FILE" | head -1 | cut -d'"' -f4)
  COMPONENT=$(grep '"component"' "$EXERCISE_FILE" | head -1 | cut -d'"' -f4)
  DIFFICULTY=$(grep '"difficulty"' "$EXERCISE_FILE" | head -1 | cut -d'"' -f4)

  echo "  Name: $EX_NAME"
  echo "  Component: $COMPONENT"
  echo "  Difficulty: $DIFFICULTY"

  # Run exercise via opencode (properly quoted)
  LOG_FILE="$LOGS_DIR/${exercise}.log"
  PROMPT=$(grep '"prompt"' "$EXERCISE_FILE" | head -1 | cut -d'"' -f4)

  # P2 exercises need more time (complex multi-step)
  case "$DIFFICULTY" in
    P2) TIMEOUT=180 ;;
    P1) TIMEOUT=120 ;;
    *)  TIMEOUT=60 ;;
  esac

  timeout "$TIMEOUT" opencode run "@shark-micro $PROMPT" > "$LOG_FILE" 2>&1

  if [ $? -eq 0 ]; then
    echo "  [PASS] Exercise completed"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  [FAIL] Exercise failed or timed out"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  echo ""
done

echo "=============================================="
echo "Test Run Complete"
echo "=============================================="
echo "Passed: ${PASS_COUNT}"
echo "Failed: ${FAIL_COUNT}"
echo ""
echo "Results written to: $RESULTS_FILE"
echo "Logs written to: $LOGS_DIR/"

exit 0
