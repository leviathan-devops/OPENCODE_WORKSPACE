#!/bin/bash
# 🦈 Shark Agent Plugin - OpenCode Integration Test

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$WORKSPACE_DIR/logs/opencode-$TIMESTAMP.log"
TEST_DIR="/tmp/opencode-test-$TIMESTAMP"

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

# Initialize
echo "🦈 OpenCode Integration Test" > "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" >> "$LOG_FILE"
echo "============================" >> "$LOG_FILE"

log "Starting OpenCode integration tests..."
log "Test directory: $TEST_DIR"
log "Log file: $LOG_FILE"

# Create test directory
mkdir -p "$TEST_DIR"

# Check if OpenCode is available
if ! command -v opencode &> /dev/null; then
    failure "OpenCode not found in PATH"
    echo "Please install OpenCode: npm install -g opencode"
    exit 1
fi

# Test 1: OpenCode basic functionality
log ""
log "=== TEST 1: OPENCODE BASIC FUNCTIONALITY ==="

run_opencode_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    local timeout="${4:-10}"
    
    log "Running: $test_name"
    echo "Command: $command" >> "$LOG_FILE"
    
    local output
    output=$(timeout "$timeout" bash -c "$command" 2>&1 | tee -a "$LOG_FILE") || true
    
    if echo "$output" | grep -q -E "$expected_pattern"; then
        success "$test_name - Found expected pattern: $expected_pattern"
        return 0
    else
        failure "$test_name - Expected pattern not found: $expected_pattern"
        echo "Output:" >> "$LOG_FILE"
        echo "$output" >> "$LOG_FILE"
        return 1
    fi
}

# Basic OpenCode test
run_opencode_test "OpenCode version check" "opencode --version" "1\.[0-9]+\.[0-9]+"
run_opencode_test "OpenCode help" "opencode --help | head -5" "Usage:|Commands:"

# Test 2: Plugin loading
log ""
log "=== TEST 2: PLUGIN LOADING ==="

# Create a simple test to see if plugin loads
echo "Testing plugin loading..." > "$TEST_DIR/test-input.txt"
run_opencode_test "OpenCode starts with plugin" "timeout 15 opencode < '$TEST_DIR/test-input.txt' 2>&1 | head -10" "Loading|Starting|Hello|Hi"

# Test 3: Guardian enforcement in OpenCode
log ""
log "=== TEST 3: GUARDIAN ENFORCEMENT IN OPENCODE ==="

# Create test input for Guardian blocking
cat > "$TEST_DIR/guardian-test.txt" << 'EOF'
Try to write to ~/.ssh/config with test content
EOF

run_opencode_test "Guardian blocks ~/.ssh in OpenCode" \
    "timeout 15 opencode < '$TEST_DIR/guardian-test.txt' 2>&1" \
    "GUARDIAN|blocked|denied|not allowed"

# Test 4: Mock mode detection
log ""
log "=== TEST 4: MOCK MODE DETECTION ==="

cat > "$TEST_DIR/mock-test.txt" << 'EOF'
I would run npm install to test this
EOF

run_opencode_test "Mock mode detection" \
    "timeout 15 opencode < '$TEST_DIR/mock-test.txt' 2>&1" \
    "mock|simulation|would run"

# Test 5: Interactive test (if requested)
if [ "$1" = "--interactive" ]; then
    log ""
    log "=== TEST 5: INTERACTIVE TEST ==="
    
    warning "Starting interactive OpenCode test..."
    warning "Press Ctrl+C to exit interactive mode"
    
    echo "Interactive test commands:" | tee -a "$LOG_FILE"
    echo "1. Try to write to ~/.ssh/config" | tee -a "$LOG_FILE"
    echo "2. Say 'I would run npm install'" | tee -a "$LOG_FILE"
    echo "3. Ask 'What firewalls are active?'" | tee -a "$LOG_FILE"
    
    # Start interactive session with logging
    timeout 30 opencode 2>&1 | tee -a "$LOG_FILE" || true
    
    success "Interactive test completed"
fi

# Test 6: Error handling
log ""
log "=== TEST 6: ERROR HANDLING ==="

# Test with invalid command
run_opencode_test "Error handling" \
    "timeout 5 opencode 'INVALID_COMMAND_TEST_XYZ' 2>&1" \
    "error|Error|failed|Failed" "5"

# Test 7: Plugin-specific features
log ""
log "=== TEST 7: PLUGIN-SPECIFIC FEATURES ==="

# Check if shark-related features are available
run_opencode_test "Shark plugin features" \
    "timeout 10 opencode 'What firewalls are active?' 2>&1" \
    "firewall|guardian|shark|enforcement"

# Cleanup
log ""
log "=== CLEANUP ==="

rm -rf "$TEST_DIR"
success "Test directory cleaned up"

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
RESULTS_FILE="$WORKSPACE_DIR/results/opencode-$TIMESTAMP.md"
cat > "$RESULTS_FILE" << EOF
# OpenCode Integration Test Results

## Summary
- **Timestamp**: $TIMESTAMP
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Success Rate**: $SUCCESS_RATE%

## Test Results

### Basic Functionality
- OpenCode installed: $(command -v opencode &>/dev/null && echo "✅" || echo "❌")
- OpenCode version: $(opencode --version 2>/dev/null || echo "Not found")
- OpenCode starts: $(timeout 5 opencode --version &>/dev/null && echo "✅" || echo "❌")

### Plugin Integration
- Plugin loads: $(timeout 10 opencode "test" 2>&1 | grep -q "Loading\|Starting\|Hello" && echo "✅" || echo "❌")
- Guardian active: $(timeout 10 opencode "Try to write to ~/.ssh/config" 2>&1 | grep -q "GUARDIAN\|blocked\|denied" && echo "✅" || echo "❌")
- Mock mode detection: $(timeout 10 opencode "I would run npm install" 2>&1 | grep -q "mock\|simulation\|would run" && echo "✅" || echo "❌")

### Error Handling
- Graceful error handling: $(timeout 5 opencode "INVALID_COMMAND_TEST" 2>&1 | grep -q "error\|Error\|failed" && echo "✅" || echo "❌")

## Status
$(if [ $FAILED_TESTS -eq 0 ]; then echo "✅ **OPENCODE INTEGRATION WORKING**"; elif [ $SUCCESS_RATE -ge 70 ]; then echo "⚠️ **PARTIAL INTEGRATION** - Some tests failed"; else echo "❌ **INTEGRATION ISSUES** - Multiple tests failed"; fi)

## Issues Found
$(if [ $FAILED_TESTS -gt 0 ]; then
    echo "The following tests failed:"
    grep "❌" "$LOG_FILE" | sed 's/.*❌ //'
else
    echo "No issues found."
fi)

## Recommendations
1. $(if [ $FAILED_TESTS -eq 0 ]; then echo "Plugin is ready for use"; else echo "Review failed tests and fix integration issues"; fi)
2. $(if command -v opencode &>/dev/null; then echo "OpenCode is properly installed"; else echo "Install OpenCode: npm install -g opencode"; fi)
3. Monitor OpenCode sessions for any plugin-related errors

## Log Files
- Complete log: \`$LOG_FILE\`
- This summary: \`$RESULTS_FILE\`

## Next Steps
1. $(if [ $FAILED_TESTS -eq 0 ]; then echo "Proceed with deployment"; else echo "Fix the failed tests listed above"; fi)
2. Test with real-world OpenCode usage scenarios
3. Monitor performance during extended sessions

EOF

log "Results saved to: $RESULTS_FILE"

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 OpenCode integration tests passed!${NC}"
    echo "Plugin is correctly integrated with OpenCode."
    exit 0
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  OpenCode integration tests partially passed${NC}"
    echo "$FAILED_TESTS test(s) failed. Check $LOG_FILE for details."
    exit 1
else
    echo -e "${RED}❌ OpenCode integration tests failed!${NC}"
    echo "$FAILED_TESTS test(s) failed. Check $LOG_FILE for details."
    exit 1
fi
