#!/bin/bash
# 🦈 Shark Agent Plugin - Guardian Protection Test

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$WORKSPACE_DIR/logs/guardian-$TIMESTAMP.log"

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

# Initialize log
echo "🦈 Guardian Protection Test" > "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" >> "$LOG_FILE"
echo "==========================" >> "$LOG_FILE"

log "Starting Guardian protection tests..."
log "Plugin directory: $PLUGIN_DIR"
log "Log file: $LOG_FILE"

# Test function
test_guardian() {
    local test_name="$1"
    local test_path="$2"
    local expected_allowed="$3"  # "true" or "false"
    
    log "Testing: $test_name"
    echo "Path: $test_path" >> "$LOG_FILE"
    echo "Expected: $expected_allowed" >> "$LOG_FILE"
    
    local result
    result=$(cd "$PLUGIN_DIR" && bun -e "
import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts';
const result = await checkGuardianProtection('write', { filePath: '$test_path' });
console.log(JSON.stringify({ allowed: result.allowed, reason: result.reason || '' }));
" 2>> "$LOG_FILE")
    
    local actual_allowed
    actual_allowed=$(echo "$result" | grep -o '"allowed":\(true\|false\)' | cut -d: -f2)
    
    echo "Result: $result" >> "$LOG_FILE"
    echo "Actual allowed: $actual_allowed" >> "$LOG_FILE"
    
    if [ "$actual_allowed" = "$expected_allowed" ]; then
        success "$test_name - Correctly $( [ "$expected_allowed" = "false" ] && echo "blocked" || echo "allowed" )"
        return 0
    else
        failure "$test_name - Expected $( [ "$expected_allowed" = "false" ] && echo "blocked" || echo "allowed" ), got $( [ "$actual_allowed" = "false" ] && echo "blocked" || echo "allowed" )"
        return 1
    fi
}

# Get home directory for tests
HOME_DIR=$(cd "$PLUGIN_DIR" && bun -e "import * as os from 'os'; console.log(os.homedir());" 2>/dev/null)

log ""
log "=== PERSONAL PATH TESTS ==="

# Personal path tests (should be blocked)
test_guardian "~/.ssh/config" "$HOME_DIR/.ssh/config" "false"
test_guardian "~/.aws/credentials" "$HOME_DIR/.aws/credentials" "false"
test_guardian "~/.kube/config" "$HOME_DIR/.kube/config" "false"
test_guardian "~/.env" "$HOME_DIR/.env" "false"

log ""
log "=== SYSTEM PATH TESTS ==="

# System path tests (should be blocked)
test_guardian "/etc/passwd" "/etc/passwd" "false"
test_guardian "/bin/bash" "/bin/bash" "false"
test_guardian "/usr/bin/python" "/usr/bin/python" "false"
test_guardian "/var/log/syslog" "/var/log/syslog" "false"

log ""
log "=== ALLOWED PATH TESTS ==="

# Allowed path tests (should be allowed)
test_guardian "/tmp/test.txt" "/tmp/test.txt" "true"
test_guardian "/tmp/shark-test/file.txt" "/tmp/shark-test/file.txt" "true"
test_guardian "relative/path.txt" "relative/path.txt" "true"

log ""
log "=== EDGE CASE TESTS ==="

# Edge case tests
test_guardian "Home directory root" "$HOME_DIR" "false"
test_guardian "Home with trailing slash" "$HOME_DIR/" "false"
test_guardian "Current directory" "." "true"
test_guardian "Parent directory" ".." "true"

# Test with spaces in path
TEST_DIR_WITH_SPACES="/tmp/shark test with spaces"
mkdir -p "$TEST_DIR_WITH_SPACES"
test_guardian "Path with spaces" "$TEST_DIR_WITH_SPACES/file.txt" "true"
rm -rf "$TEST_DIR_WITH_SPACES"

# Test symlink (to allowed path)
ln -sf /tmp "$HOME_DIR/temp-link" 2>/dev/null || true
test_guardian "Symlink to /tmp" "$HOME_DIR/temp-link/test.txt" "true"
rm -f "$HOME_DIR/temp-link" 2>/dev/null || true

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
RESULTS_FILE="$WORKSPACE_DIR/results/guardian-$TIMESTAMP.md"
cat > "$RESULTS_FILE" << EOF
# Guardian Protection Test Results

## Summary
- **Timestamp**: $TIMESTAMP
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Success Rate**: $SUCCESS_RATE%

## Test Categories

### Personal Paths (Should Block)
- ~/.ssh/config: $( [ "$(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; import * as os from 'os'; const homeDir = os.homedir(); const result = await checkGuardianProtection('write', { filePath: homeDir + '/.ssh/config' }); console.log(result.allowed ? '❌' : '✅');" 2>/dev/null)" = "✅" ] && echo "✅" || echo "❌" )
- ~/.aws/credentials: $( [ "$(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; import * as os from 'os'; const homeDir = os.homedir(); const result = await checkGuardianProtection('write', { filePath: homeDir + '/.aws/credentials' }); console.log(result.allowed ? '❌' : '✅');" 2>/dev/null)" = "✅" ] && echo "✅" || echo "❌" )
- ~/.kube/config: $( [ "$(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; import * as os from 'os'; const homeDir = os.homedir(); const result = await checkGuardianProtection('write', { filePath: homeDir + '/.kube/config' }); console.log(result.allowed ? '❌' : '✅');" 2>/dev/null)" = "✅" ] && echo "✅" || echo "❌" )

### System Paths (Should Block)
- /etc/passwd: $( [ "$(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; const result = await checkGuardianProtection('write', { filePath: '/etc/passwd' }); console.log(result.allowed ? '❌' : '✅');" 2>/dev/null)" = "✅" ] && echo "✅" || echo "❌" )
- /bin/bash: $( [ "$(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; const result = await checkGuardianProtection('write', { filePath: '/bin/bash' }); console.log(result.allowed ? '❌' : '✅');" 2>/dev/null)" = "✅" ] && echo "✅" || echo "❌" )

### Allowed Paths (Should Allow)
- /tmp/test.txt: $( [ "$(cd "$PLUGIN_DIR" && bun -e "import { checkGuardianProtection } from './src/enforcement/guardian-enhancer.ts'; const result = await checkGuardianProtection('write', { filePath: '/tmp/test.txt' }); console.log(result.allowed ? '✅' : '❌');" 2>/dev/null)" = "✅" ] && echo "✅" || echo "❌" )

## Status
$(if [ $FAILED_TESTS -eq 0 ]; then echo "✅ **GUARDIAN WORKING CORRECTLY**"; else echo "❌ **GUARDIAN HAS ISSUES**"; fi)

## Log Files
- Complete log: \`$LOG_FILE\`
- This summary: \`$RESULTS_FILE\`

EOF

log "Results saved to: $RESULTS_FILE"

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 Guardian protection tests passed!${NC}"
    echo "All sensitive paths are correctly blocked."
    exit 0
else
    echo -e "${RED}❌ Guardian protection tests failed!${NC}"
    echo "$FAILED_TESTS test(s) failed. Check $LOG_FILE for details."
    exit 1
fi
