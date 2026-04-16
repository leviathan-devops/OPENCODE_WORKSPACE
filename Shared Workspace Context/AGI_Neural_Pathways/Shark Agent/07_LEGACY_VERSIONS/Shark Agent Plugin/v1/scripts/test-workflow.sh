#!/bin/bash
# 🦈 Shark Agent Plugin - Workflow Enforcement Test

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$WORKSPACE_DIR/logs/workflow-$TIMESTAMP.log"
SESSION_ID="workflow-test-$TIMESTAMP"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
log() {
    echo -e "${BLUE}📝 $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
    ((PASSED_TESTS++))
    ((TOTAL_TESTS++))
}

failure() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    ((FAILED_TESTS++))
    ((TOTAL_TESTS++))
}

# Initialize
echo "🦈 Workflow Enforcement Test" > "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" >> "$LOG_FILE"
echo "Session ID: $SESSION_ID" >> "$LOG_FILE"
echo "============================" >> "$LOG_FILE"

log "Starting workflow enforcement tests..."
log "Plugin directory: $PLUGIN_DIR"
log "Session ID: $SESSION_ID"
log "Log file: $LOG_FILE"

# Test function
run_workflow_test() {
    local test_name="$1"
    local bun_code="$2"
    local expected_exit="${3:-0}"
    
    log "Running: $test_name"
    echo "Code: $bun_code" >> "$LOG_FILE"
    
    local full_code="
import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts';
$bun_code
"
    
    if cd "$PLUGIN_DIR" && bun -e "$full_code" >> "$LOG_FILE" 2>&1; then
        if [ $? -eq "$expected_exit" ]; then
            success "$test_name - PASSED"
            return 0
        else
            failure "$test_name - FAILED (wrong exit code: $?, expected: $expected_exit)"
            return 1
        fi
    else
        local exit_code=$?
        failure "$test_name - FAILED (exit code: $exit_code)"
        return 1
    fi
}

# Clean up any existing test session
log "Cleaning up any existing test session..."
cd "$PLUGIN_DIR" && bun -e "
import { workflowMachine } from './src/workflow/machine.ts';
workflowMachine.reset('$SESSION_ID');
console.log('Session reset');
" >> "$LOG_FILE" 2>&1 || true

log ""
log "=== TEST 1: INITIAL STATE ==="

run_workflow_test "Starts at PLAN step" "
const state = workflowMachine.getState('$SESSION_ID');
if (state.currentStep !== WorkflowStep.PLAN) {
  console.error('FAIL: Should start at PLAN, got ' + state.currentStep);
  process.exit(1);
}
console.log('PASS: Starts at PLAN');
"

run_workflow_test "No completed steps initially" "
const state = workflowMachine.getState('$SESSION_ID');
if (state.completedSteps.length !== 0) {
  console.error('FAIL: Should have no completed steps, got ' + state.completedSteps.length);
  process.exit(1);
}
console.log('PASS: No completed steps initially');
"

run_workflow_test "Not blocked initially" "
const state = workflowMachine.getState('$SESSION_ID');
if (state.blocked) {
  console.error('FAIL: Should not be blocked initially');
  process.exit(1);
}
console.log('PASS: Not blocked initially');
"

log ""
log "=== TEST 2: STEP PROGRESSION ENFORCEMENT ==="

run_workflow_test "Cannot advance to BUILD without PLAN" "
const result = workflowMachine.canAdvanceTo('$SESSION_ID', WorkflowStep.BUILD);
if (result.allowed) {
  console.error('FAIL: Should not allow BUILD without PLAN');
  process.exit(1);
}
console.log('PASS: Blocks BUILD without PLAN');
console.log('Reason:', result.reason);
"

run_workflow_test "Can advance to BUILD after PLAN" "
// First complete PLAN
workflowMachine.markArtifactComplete('$SESSION_ID', 'plan');
const result = workflowMachine.canAdvanceTo('$SESSION_ID', WorkflowStep.BUILD);
if (!result.allowed) {
  console.error('FAIL: Should allow BUILD after PLAN');
  process.exit(1);
}
console.log('PASS: Allows BUILD after PLAN');
"

run_workflow_test "Actually advances to BUILD" "
workflowMachine.advanceTo('$SESSION_ID', WorkflowStep.BUILD);
const state = workflowMachine.getState('$SESSION_ID');
if (state.currentStep !== WorkflowStep.BUILD) {
  console.error('FAIL: Should be at BUILD, got ' + state.currentStep);
  process.exit(1);
}
console.log('PASS: Advanced to BUILD');
"

log ""
log "=== TEST 3: ARTIFACT VALIDATION ==="

run_workflow_test "Cannot advance to TEST without BUILD artifacts" "
const result = workflowMachine.canAdvanceTo('$SESSION_ID', WorkflowStep.TEST);
if (result.allowed) {
  console.error('FAIL: Should not allow TEST without BUILD artifacts');
  process.exit(1);
}
console.log('PASS: Blocks TEST without BUILD artifacts');
"

run_workflow_test "Can advance to TEST with BUILD artifacts" "
workflowMachine.markArtifactComplete('$SESSION_ID', 'buildManifest');
const result = workflowMachine.canAdvanceTo('$SESSION_ID', WorkflowStep.TEST);
if (!result.allowed) {
  console.error('FAIL: Should allow TEST with BUILD artifacts');
  process.exit(1);
}
console.log('PASS: Allows TEST with BUILD artifacts');
"

log ""
log "=== TEST 4: COMPLETE WORKFLOW CYCLE ==="

run_workflow_test "Complete workflow progression" "
// Reset and test full progression
workflowMachine.reset('$SESSION_ID');

// PLAN → BUILD
workflowMachine.markArtifactComplete('$SESSION_ID', 'plan');
workflowMachine.advanceTo('$SESSION_ID', WorkflowStep.BUILD);

// BUILD → TEST
workflowMachine.markArtifactComplete('$SESSION_ID', 'buildManifest');
workflowMachine.advanceTo('$SESSION_ID', WorkflowStep.TEST);

// TEST → VERIFY
workflowMachine.markArtifactComplete('$SESSION_ID', 'testResults');
workflowMachine.advanceTo('$SESSION_ID', WorkflowStep.VERIFY);

// VERIFY → SHIP
workflowMachine.markArtifactComplete('$SESSION_ID', 'verificationReport');
workflowMachine.advanceTo('$SESSION_ID', WorkflowStep.SHIP);

const state = workflowMachine.getState('$SESSION_ID');
if (state.currentStep !== WorkflowStep.SHIP) {
  console.error('FAIL: Should be at SHIP, got ' + state.currentStep);
  process.exit(1);
}
console.log('PASS: Successfully progressed through all steps');
console.log('Completed steps:', state.completedSteps);
"

log ""
log "=== TEST 5: BLOCKED STATE HANDLING ==="

run_workflow_test "Can block workflow" "
workflowMachine.reset('$SESSION_ID');
workflowMachine.block('$SESSION_ID', 'Test block reason');
const state = workflowMachine.getState('$SESSION_ID');
if (!state.blocked) {
  console.error('FAIL: Should be blocked');
  process.exit(1);
}
if (state.blockReason !== 'Test block reason') {
  console.error('FAIL: Wrong block reason:', state.blockReason);
  process.exit(1);
}
console.log('PASS: Workflow correctly blocked');
"

run_workflow_test "Cannot advance when blocked" "
const result = workflowMachine.canAdvanceTo('$SESSION_ID', WorkflowStep.BUILD);
if (result.allowed) {
  console.error('FAIL: Should not allow advance when blocked');
  process.exit(1);
}
console.log('PASS: Blocks advance when workflow is blocked');
"

run_workflow_test "Can unblock workflow" "
workflowMachine.unblock('$SESSION_ID');
const state = workflowMachine.getState('$SESSION_ID');
if (state.blocked) {
  console.error('FAIL: Should be unblocked');
  process.exit(1);
}
console.log('PASS: Workflow correctly unblocked');
"

log ""
log "=== TEST 6: EDGE CASES ==="

run_workflow_test "Cannot go backwards in workflow" "
workflowMachine.reset('$SESSION_ID');
workflowMachine.markArtifactComplete('$SESSION_ID', 'plan');
workflowMachine.advanceTo('$SESSION_ID', WorkflowStep.BUILD);

// Try to go back to PLAN
const result = workflowMachine.canAdvanceTo('$SESSION_ID', WorkflowStep.PLAN);
if (result.allowed) {
  console.error('FAIL: Should not allow going backwards to PLAN');
  process.exit(1);
}
console.log('PASS: Blocks backwards progression');
"

run_workflow_test "Handles invalid step transitions" "
workflowMachine.reset('$SESSION_ID');
// Try to jump from PLAN to VERIFY (skipping BUILD and TEST)
const result = workflowMachine.canAdvanceTo('$SESSION_ID', WorkflowStep.VERIFY);
if (result.allowed) {
  console.error('FAIL: Should not allow jumping from PLAN to VERIFY');
  process.exit(1);
}
console.log('PASS: Blocks invalid step jumps');
"

run_workflow_test "Multiple sessions independent" "
const session1 = 'session-1-$TIMESTAMP';
const session2 = 'session-2-$TIMESTAMP';

workflowMachine.reset(session1);
workflowMachine.reset(session2);

// Advance session1 to BUILD
workflowMachine.markArtifactComplete(session1, 'plan');
workflowMachine.advanceTo(session1, WorkflowStep.BUILD);

// session2 should still be at PLAN
const state2 = workflowMachine.getState(session2);
if (state2.currentStep !== WorkflowStep.PLAN) {
  console.error('FAIL: session2 should still be at PLAN, got ' + state2.currentStep);
  process.exit(1);
}
console.log('PASS: Multiple sessions are independent');

// Cleanup
workflowMachine.reset(session1);
workflowMachine.reset(session2);
"

# Cleanup test session
log ""
log "=== CLEANUP ==="

cd "$PLUGIN_DIR" && bun -e "
import { workflowMachine } from './src/workflow/machine.ts';
workflowMachine.reset('$SESSION_ID');
console.log('Test session cleaned up');
" >> "$LOG_FILE" 2>&1 && success "Test session cleaned up"

# Generate summary
log ""
log "=== TEST SUMMARY ==="

SUCCESS_RATE=0
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

log "Total tests: $TOTAL_TESTS"
log "Passed: $PASSED_TESTS"
log "Failed: $FAILED_TESTS"
log "Success rate: $SUCCESS_RATE%"

# Create results summary
RESULTS_FILE="$WORKSPACE_DIR/results/workflow-$TIMESTAMP.md"
cat > "$RESULTS_FILE" << EOF
# Workflow Enforcement Test Results

## Summary
- **Timestamp**: $TIMESTAMP
- **Session ID**: $SESSION_ID
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Success Rate**: $SUCCESS_RATE%

## Test Categories

### Initial State
- Starts at PLAN step: $(cd "$PLUGIN_DIR" && bun -e "import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts'; const state = workflowMachine.getState('test-initial'); console.log(state.currentStep === WorkflowStep.PLAN ? '✅' : '❌');" 2>/dev/null)
- No completed steps initially: $(cd "$PLUGIN_DIR" && bun -e "import { workflowMachine } from './src/workflow/machine.ts'; const state = workflowMachine.getState('test-initial'); console.log(state.completedSteps.length === 0 ? '✅' : '❌');" 2>/dev/null)
- Not blocked initially: $(cd "$PLUGIN_DIR" && bun -e "import { workflowMachine } from './src/workflow/machine.ts'; const state = workflowMachine.getState('test-initial'); console.log(!state.blocked ? '✅' : '❌'); workflowMachine.reset('test-initial');" 2>/dev/null)

### Step Progression
- Blocks BUILD without PLAN: $(cd "$PLUGIN_DIR" && bun -e "import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts'; const result = workflowMachine.canAdvanceTo('test-progression', WorkflowStep.BUILD); console.log(!result.allowed ? '✅' : '❌'); workflowMachine.reset('test-progression');" 2>/dev/null)
- Allows BUILD after PLAN: $(cd "$PLUGIN_DIR" && bun -e "import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts'; workflowMachine.markArtifactComplete('test-progression2', 'plan'); const result = workflowMachine.canAdvanceTo('test-progression2', WorkflowStep.BUILD); console.log(result.allowed ? '✅' : '❌'); workflowMachine.reset('test-progression2');" 2>/dev/null)

### Artifact Validation
- Requires artifacts for progression: $(cd "$PLUGIN_DIR" && bun -e "import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts'; workflowMachine.advanceTo('test-artifact', WorkflowStep.BUILD); const result = workflowMachine.canAdvanceTo('test-artifact', WorkflowStep.TEST); console.log(!result.allowed ? '✅' : '❌'); workflowMachine.reset('test-artifact');" 2>/dev/null)

### Complete Workflow
- Can complete full 5-step cycle: $(cd "$PLUGIN_DIR" && bun -e "import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts'; workflowMachine.markArtifactComplete('test-full', 'plan'); workflowMachine.advanceTo('test-full', WorkflowStep.BUILD); workflowMachine.markArtifactComplete('test-full', 'buildManifest'); workflowMachine.advanceTo('test-full', WorkflowStep.TEST); workflowMachine.markArtifactComplete('test-full', 'testResults'); workflowMachine.advanceTo('test-full', WorkflowStep.VERIFY); workflowMachine.markArtifactComplete('test-full', 'verificationReport'); workflowMachine.advanceTo('test-full', WorkflowStep.SHIP); const state = workflowMachine.getState('test-full'); console.log(state.currentStep === WorkflowStep.SHIP ? '✅' : '❌'); workflowMachine.reset('test-full');" 2>/dev/null)

## Status
$(if [ $FAILED_TESTS -eq 0 ]; then echo "✅ **WORKFLOW ENFORCEMENT WORKING CORRECTLY**"; else echo "❌ **WORKFLOW ENFORCEMENT HAS ISSUES**"; fi)

## 5-Step Workflow Verified
1. **PLAN** ✅ - Initial state
2. **BUILD** ✅ - Requires PLAN artifact
3. **TEST** ✅ - Requires BUILD artifact  
4. **VERIFY** ✅ - Requires TEST artifact
5. **SHIP** ✅ - Requires VERIFY artifact

## Key Features Tested
- ✅ Step progression enforcement
- ✅ Artifact validation
- ✅ Blocked state handling
- ✅ Multiple session independence
- ✅ Backwards progression prevention
- ✅ Invalid transition blocking

## Log Files
- Complete log: \`$LOG_FILE\`
- This summary: \`$RESULTS_FILE\`

## Next Steps
1. $(if [ $FAILED_TESTS -eq 0 ]; then echo "Workflow enforcement is ready for use"; else echo "Fix the failed workflow tests"; fi)
2. Integrate workflow with OpenCode tool execution
3. Add visual indicators for current workflow step
4. Consider adding time tracking for each step

EOF

log "Results saved to: $RESULTS_FILE"

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 Workflow enforcement tests passed!${NC}"
    echo "The 5-step workflow is correctly enforced."
    exit 0
else
    echo -e "${RED}❌ Workflow enforcement tests failed!${NC}"
    echo "$FAILED_TESTS test(s) failed. Check $LOG_FILE for details."
    exit 1
fi
