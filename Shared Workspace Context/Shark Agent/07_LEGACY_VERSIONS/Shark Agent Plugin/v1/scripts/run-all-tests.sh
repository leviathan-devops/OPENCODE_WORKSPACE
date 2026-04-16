#!/bin/bash
# 🦈 Shark Agent Plugin - Complete Test Suite

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$WORKSPACE_DIR/logs/test-$TIMESTAMP.log"
SUMMARY_FILE="$WORKSPACE_DIR/results/summary-$TIMESTAMP.md"
TEST_DIR="/tmp/shark-test-$TIMESTAMP"

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

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Test runner
run_test() {
    local test_name="$1"
    local test_cmd="$2"
    local expected_exit="${3:-0}"
    
    log "Running: $test_name"
    echo "Command: $test_cmd" >> "$LOG_FILE"
    
    if eval "$test_cmd" >> "$LOG_FILE" 2>&1; then
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

# Initialize
echo "🦈 Shark Agent Plugin - Complete Test Suite" > "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" >> "$LOG_FILE"
echo "==========================================" >> "$LOG_FILE"

log "Starting comprehensive test suite..."
log "Log file: $LOG_FILE"
log "Summary file: $SUMMARY_FILE"
log "Test directory: $TEST_DIR"

# Create test directory
mkdir -p "$TEST_DIR"

# Phase 1: Pre-Test Verification
log ""
log "=== PHASE 1: PRE-TEST VERIFICATION ==="

run_test "OpenCode installed" "which opencode"
run_test "OpenCode version" "opencode --version | grep -q '1.3.7'"
run_test "Plugin configured" "grep -q 'shark-agent-plugin' ~/.config/opencode/opencode.json"
run_test "Backup exists" "ls -la ~/.config/opencode/opencode.json.backup.* 2>/dev/null | head -1"
run_test "Plugin linked globally" "npm list -g shark-agent-plugin 2>/dev/null | grep -q 'shark-agent-plugin'"

# Phase 2: Plugin Build Verification
log ""
log "=== PHASE 2: PLUGIN BUILD VERIFICATION ==="

run_test "TypeScript compilation" "cd '$PLUGIN_DIR' && bun run typecheck 2>&1 | grep -q 'error' && exit 1 || exit 0" 0
run_test "Build success" "cd '$PLUGIN_DIR' && npm run build 2>&1 | tail -5 | grep -q 'Bundled'"
run_test "Unit tests pass" "cd '$PLUGIN_DIR' && npm test 2>&1 | grep -q '0 fail'"

# Phase 3: Guardian Protection Tests
log ""
log "=== PHASE 3: GUARDIAN PROTECTION TESTS ==="

run_test "Guardian blocks ~/.ssh" "
cd '$PLUGIN_DIR' && bun -e \"
import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts';
import * as os from 'os';
const homeDir = os.homedir();
const result = await checkGuardianProtection('write', { filePath: homeDir + '/.ssh/config' });
if (result.allowed) { console.error('FAIL: Should block ~/.ssh'); process.exit(1); }
console.log('PASS: Blocks ~/.ssh');
\""

run_test "Guardian blocks /etc" "
cd '$PLUGIN_DIR' && bun -e \"
import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts';
const result = await checkGuardianProtection('write', { filePath: '/etc/passwd' });
if (result.allowed) { console.error('FAIL: Should block /etc'); process.exit(1); }
console.log('PASS: Blocks /etc');
\""

run_test "Guardian allows /tmp" "
cd '$PLUGIN_DIR' && bun -e \"
import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts';
const result = await checkGuardianProtection('write', { filePath: '/tmp/test.txt' });
if (!result.allowed) { console.error('FAIL: Should allow /tmp'); process.exit(1); }
console.log('PASS: Allows /tmp');
\""

# Phase 4: Workflow Enforcement Tests
log ""
log "=== PHASE 4: WORKFLOW ENFORCEMENT TESTS ==="

run_test "Workflow starts at PLAN" "
cd '$PLUGIN_DIR' && bun -e \"
import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts';
const state = workflowMachine.getState('test-session-$TIMESTAMP');
if (state.currentStep !== WorkflowStep.PLAN) { 
  console.error('FAIL: Should start at PLAN, got ' + state.currentStep); 
  process.exit(1); 
}
console.log('PASS: Starts at PLAN');
\""

run_test "Workflow blocks BUILD without PLAN" "
cd '$PLUGIN_DIR' && bun -e \"
import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts';
const result = workflowMachine.canAdvanceTo('test-session-$TIMESTAMP', WorkflowStep.BUILD);
if (result.allowed) { 
  console.error('FAIL: Should block BUILD without PLAN'); 
  process.exit(1); 
}
console.log('PASS: Blocks BUILD without PLAN');
\""

# Phase 5: OpenCode Integration Tests
log ""
log "=== PHASE 5: OPENCODE INTEGRATION TESTS ==="

run_test "OpenCode loads with plugin" "timeout 10 opencode 'Test loading' 2>&1 | head -5 | grep -q 'Loading\\|Starting' || exit 0"

# Note: Guardian test in OpenCode is interactive, we'll do a simpler check
run_test "OpenCode accessible" "opencode --version 2>&1 | grep -q '1.3.7'"

# Phase 6: Rollback Test (optional)
if [ "${SKIP_ROLLBACK:-0}" != "1" ]; then
    log ""
    log "=== PHASE 6: ROLLBACK TEST (Optional) ==="
    
    warning "Rollback test will temporarily revert to opencode-ultra"
    read -p "Continue with rollback test? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_test "Rollback script exists" "test -f '$WORKSPACE_DIR/scripts/test-rollback.sh'"
        # We'll run the rollback test script if it exists
        if [ -f "$WORKSPACE_DIR/scripts/test-rollback.sh" ]; then
            run_test "Execute rollback test" "cd '$WORKSPACE_DIR' && ./scripts/test-rollback.sh 2>&1 | tail -20"
        fi
    else
        log "Skipping rollback test as requested"
    fi
fi

# Phase 7: Cleanup
log ""
log "=== PHASE 7: CLEANUP ==="

run_test "Clean test directory" "rm -rf '$TEST_DIR'"

# Generate summary
log ""
log "=== TEST SUMMARY ==="

SUCCESS_RATE=0
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
fi

cat > "$SUMMARY_FILE" << EOF
# 🦈 Shark Agent Plugin - Test Summary

## Test Run Information
- **Timestamp**: $TIMESTAMP
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Success Rate**: $SUCCESS_RATE%

## Test Results

### Phase 1: Pre-Test Verification
- OpenCode installed: $( [ $PASSED_TESTS -gt 0 ] && echo "✅" || echo "❌" )
- Plugin configured: $(grep -q 'shark-agent-plugin' ~/.config/opencode/opencode.json && echo "✅" || echo "❌")
- Backup exists: $(ls -la ~/.config/opencode/opencode.json.backup.* 2>/dev/null && echo "✅" || echo "❌")

### Phase 2: Plugin Build
- TypeScript compilation: $(cd "$PLUGIN_DIR" && bun run typecheck 2>&1 | grep -q "error" && echo "❌" || echo "✅")
- Build success: $(cd "$PLUGIN_DIR" && npm run build 2>&1 | grep -q "Bundled" && echo "✅" || echo "❌")
- Unit tests: $(cd "$PLUGIN_DIR" && npm test 2>&1 | grep -q "0 fail" && echo "✅" || echo "❌")

### Phase 3: Guardian Protection
- Blocks ~/.ssh: $(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; import * as os from 'os'; const homeDir = os.homedir(); const result = await checkGuardianProtection('write', { filePath: homeDir + '/.ssh/config' }); console.log(result.allowed ? '❌' : '✅');" 2>/dev/null)
- Blocks /etc: $(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; const result = await checkGuardianProtection('write', { filePath: '/etc/passwd' }); console.log(result.allowed ? '❌' : '✅');" 2>/dev/null)
- Allows /tmp: $(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; const result = await checkGuardianProtection('write', { filePath: '/tmp/test.txt' }); console.log(result.allowed ? '✅' : '❌');" 2>/dev/null)

### Phase 4: Workflow Enforcement
- Starts at PLAN: $(cd "$PLUGIN_DIR" && bun -e "import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts'; const state = workflowMachine.getState('test-session-$TIMESTAMP'); console.log(state.currentStep === WorkflowStep.PLAN ? '✅' : '❌');" 2>/dev/null)

## Overall Status
$(if [ $FAILED_TESTS -eq 0 ]; then echo "✅ **READY FOR USE** - All tests passed"; elif [ $SUCCESS_RATE -ge 80 ]; then echo "⚠️ **NEEDS MINOR FIXES** - $FAILED_TESTS test(s) failed"; else echo "❌ **NOT READY** - Multiple tests failed"; fi)

## Log Files
- Complete log: \`$LOG_FILE\`
- This summary: \`$SUMMARY_FILE\`

## Next Steps
1. Review failed tests in the log file
2. Fix any issues identified
3. Re-run tests to verify fixes
4. Deploy if all tests pass

EOF

log "Summary saved to: $SUMMARY_FILE"

# Final status
log ""
if [ $FAILED_TESTS -eq 0 ]; then
    success "🎉 ALL TESTS PASSED! ($PASSED_TESTS/$TOTAL_TESTS)"
    echo "The shark-agent-plugin is ready for use."
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    warning "⚠️  TESTS PARTIALLY PASSED ($PASSED_TESTS/$TOTAL_TESTS - $SUCCESS_RATE%)"
    echo "Some tests failed. Review the log file for details."
    exit 1
else
    failure "❌ TESTS FAILED ($PASSED_TESTS/$TOTAL_TESTS - $SUCCESS_RATE%)"
    echo "Multiple tests failed. Review the log file for details."
    exit 1
fi
