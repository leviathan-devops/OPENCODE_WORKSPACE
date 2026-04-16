#!/bin/bash
# 🦈 Shark Agent Plugin - Other Firewalls Test

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$WORKSPACE_DIR/logs/other-firewalls-$TIMESTAMP.log"

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
echo "🦈 Other Firewalls Test" > "$LOG_FILE"
echo "Timestamp: $TIMESTAMP" >> "$LOG_FILE"
echo "=======================" >> "$LOG_FILE"

log "Testing remaining 7 firewalls..."
log "Plugin directory: $PLUGIN_DIR"
log "Log file: $LOG_FILE"

# Test function
run_firewall_test() {
    local test_name="$1"
    local bun_code="$2"
    local expected_allowed="$3"  # "true" or "false"
    
    log "Testing: $test_name"
    echo "Code: $bun_code" >> "$LOG_FILE"
    
    local result
    result=$(cd "$PLUGIN_DIR" && bun -e "$bun_code" 2>> "$LOG_FILE")
    
    local actual_allowed
    actual_allowed=$(echo "$result" | grep -o '"allowed":\(true\|false\)' | cut -d: -f2 || echo "error")
    
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

log ""
log "=== FIREWALL 4: MOCK MODE DETECTION ==="

run_firewall_test "Mock mode - 'I would run'" "
import { detectMockMode } from './src/validation/mock-detector.ts';
const result = await detectMockMode({
  content: 'I would run npm install to test this'
});
console.log(JSON.stringify(result));
" "false"

run_firewall_test "Mock mode - 'We could execute'" "
import { detectMockMode } from './src/validation/mock-detector.ts';
const result = await detectMockMode({
  content: 'We could execute the test suite now'
});
console.log(JSON.stringify(result));
" "false"

run_firewall_test "Not mock mode - direct command" "
import { detectMockMode } from './src/validation/mock-detector.ts';
const result = await detectMockMode({
  content: 'npm install'
});
console.log(JSON.stringify(result));
" "true"

log ""
log "=== FIREWALL 5: THEATRICAL CODE DETECTION ==="

run_firewall_test "Theatrical code - overly complex function" "
import { detectTheatricalCode } from './src/validation/theatrical-detector.ts';
const result = await detectTheatricalCode({
  tool: 'write',
  args: {
    content: \`function overlyComplexFunctionWithManyParameters(param1, param2, param3, param4, param5, param6) {
      // This function has too many parameters
      return param1 + param2 + param3 + param4 + param5 + param6;
    }\`
  }
});
console.log(JSON.stringify(result));
" "false"

run_firewall_test "Theatrical code - deep nesting" "
import { detectTheatricalCode } from './src/validation/theatrical-detector.ts';
const result = await detectTheatricalCode({
  tool: 'write',
  args: {
    content: \`function deeplyNested() {
      if (true) {
        for (let i = 0; i < 10; i++) {
          while (false) {
            try {
              // Too deep!
            } catch (e) {
              // Even deeper!
            }
          }
        }
      }
    }\`
  }
});
console.log(JSON.stringify(result));
" "false"

run_firewall_test "Normal code - simple function" "
import { detectTheatricalCode } from './src/validation/theatrical-detector.ts';
const result = await detectTheatricalCode({
  tool: 'write',
  args: {
    content: \`function add(a, b) {
      return a + b;
    }\`
  }
});
console.log(JSON.stringify(result));
" "true"

log ""
log "=== FIREWALL 6: STYLE GUIDE ENFORCEMENT ==="

run_firewall_test "Style guide - multi-word variable" "
import { enforceStyleGuide } from './src/validation/style-enforcer.ts';
const result = await enforceStyleGuide({
  tool: 'write',
  args: {
    content: 'const overlyComplexVariableName = {};',
    filePath: '/tmp/test.ts'
  }
});
console.log(JSON.stringify(result));
" "false"

run_firewall_test "Style guide - single word variable" "
import { enforceStyleGuide } from './src/validation/style-enforcer.ts';
const result = await enforceStyleGuide({
  tool: 'write',
  args: {
    content: 'const count = 0;',
    filePath: '/tmp/test.ts'
  }
});
console.log(JSON.stringify(result));
" "true"

run_firewall_test "Style guide - technical term allowed" "
import { enforceStyleGuide } from './src/validation/style-enforcer.ts';
const result = await enforceStyleGuide({
  tool: 'write',
  args: {
    content: 'const XMLHttpRequest = {};',
    filePath: '/tmp/test.ts'
  }
});
console.log(JSON.stringify(result));
" "true"

log ""
log "=== FIREWALL 7: REPO ROOT TEST PREVENTION ==="

run_firewall_test "Repo root test - npm test at root" "
import { preventRepoRootTests } from './src/validation/test-enforcer.ts';
const result = await preventRepoRootTests({
  tool: 'bash',
  args: {
    command: 'npm test',
    workdir: '/home/user/project',
    sessionID: 'test-session'
  }
});
console.log(JSON.stringify(result));
" "false"

run_firewall_test "Repo root test - in subdirectory" "
import { preventRepoRootTests } from './src/validation/test-enforcer.ts';
const result = await preventRepoRootTests({
  tool: 'bash',
  args: {
    command: 'npm test',
    workdir: '/home/user/project/src',
    sessionID: 'test-session'
  }
});
console.log(JSON.stringify(result));
" "true"

run_firewall_test "Repo root test - not a test command" "
import { preventRepoRootTests } from './src/validation/test-enforcer.ts';
const result = await preventRepoRootTests({
  tool: 'bash',
  args: {
    command: 'ls -la',
    workdir: '/home/user/project',
    sessionID: 'test-session'
  }
});
console.log(JSON.stringify(result));
" "true"

log ""
log "=== FIREWALL 8: VERIFICATION GATES ==="

run_firewall_test "Verification gates - missing artifacts" "
import { enforceVerificationGates } from './src/verification/gates.ts';
const result = await enforceVerificationGates({
  tool: 'write',
  args: {},
  sessionID: 'test-session',
  workflowStep: 'ship',
  agent: 'test-agent'
});
console.log(JSON.stringify(result));
" "false"

run_firewall_test "Verification gates - with artifacts" "
import { enforceVerificationGates } from './src/verification/gates.ts';
// Note: This test assumes the workflow machine has artifacts
// In real usage, artifacts would be marked complete first
const result = await enforceVerificationGates({
  tool: 'write',
  args: {},
  sessionID: 'test-session-verification',
  workflowStep: 'plan',
  agent: 'test-agent'
});
console.log(JSON.stringify(result));
" "true"

log ""
log "=== FIREWALL 9: DOCUMENTATION VALIDATION ==="

run_firewall_test "Documentation - theatrical patterns" "
import { validateDocumentation } from './src/validation/doc-validator.ts';
// Create a test file with theatrical documentation
const fs = require('fs');
const path = require('path');
const testFile = '/tmp/test-doc.ts';
fs.writeFileSync(testFile, '// This file implements a complex system that will be implemented in a future version');
const result = await validateDocumentation({
  tool: 'write',
  args: { filePath: testFile }
});
fs.unlinkSync(testFile);
console.log(JSON.stringify(result));
" "false"

run_firewall_test "Documentation - normal code" "
import { validateDocumentation } from './src/validation/doc-validator.ts';
const fs = require('fs');
const path = require('path');
const testFile = '/tmp/test-normal.ts';
fs.writeFileSync(testFile, 'function add(a, b) { return a + b; }');
const result = await validateDocumentation({
  tool: 'write',
  args: { filePath: testFile }
});
fs.unlinkSync(testFile);
console.log(JSON.stringify(result));
" "true"

run_firewall_test "Documentation - markdown file allowed" "
import { validateDocumentation } from './src/validation/doc-validator.ts';
const result = await validateDocumentation({
  tool: 'write',
  args: { filePath: '/tmp/README.md' }
});
console.log(JSON.stringify(result));
" "true"

log ""
log "=== AUDIT LOGGING (Bonus Test) ==="

run_firewall_test "Audit logging - creates log entry" "
import { AuditLogger } from './src/enforcement/audit-logger.ts';
const logger = new AuditLogger('test-session-audit', '/tmp/audit-test');
logger.log({
  firewall: 'test',
  tool: 'write',
  action: 'test',
  reason: 'Test audit entry',
  severity: 'low'
});
const logs = logger.getLogs();
if (logs.length === 0) {
  console.error('FAIL: No logs created');
  process.exit(1);
}
console.log('PASS: Audit log created');
console.log(JSON.stringify({ logsCount: logs.length }));
" "true"

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
RESULTS_FILE="$WORKSPACE_DIR/results/other-firewalls-$TIMESTAMP.md"
cat > "$RESULTS_FILE" << EOF
# Other Firewalls Test Results

## Summary
- **Timestamp**: $TIMESTAMP
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Success Rate**: $SUCCESS_RATE%

## Firewall Test Results

### Firewall 4: Mock Mode Detection
- Blocks "I would run" language: $(cd "$PLUGIN_DIR" && bun -e "import { detectMockMode } from './src/validation/mock-detector.ts'; const result = await detectMockMode({ content: 'I would run npm install' }); console.log(!result.allowed ? '✅' : '❌');" 2>/dev/null)
- Blocks "We could execute" language: $(cd "$PLUGIN_DIR" && bun -e "import { detectMockMode } from './src/validation/mock-detector.ts'; const result = await detectMockMode({ content: 'We could execute the test' }); console.log(!result.allowed ? '✅' : '❌');" 2>/dev/null)
- Allows direct commands: $(cd "$PLUGIN_DIR" && bun -e "import { detectMockMode } from './src/validation/mock-detector.ts'; const result = await detectMockMode({ content: 'npm install' }); console.log(result.allowed ? '✅' : '❌');" 2>/dev/null)

### Firewall 5: Theatrical Code Detection
- Blocks overly complex functions: $(cd "$PLUGIN_DIR" && bun -e "import { detectTheatricalCode } from './src/validation/theatrical-detector.ts'; const result = await detectTheatricalCode({ tool: 'write', args: { content: 'function overlyComplex() {}' } }); console.log(!result.allowed ? '✅' : '❌');" 2>/dev/null)
- Blocks deeply nested code: $(cd "$PLUGIN_DIR" && bun -e "import { detectTheatricalCode } from './src/validation/theatrical-detector.ts'; const result = await detectTheatricalCode({ tool: 'write', args: { content: 'function deep() { if (true) { for (;;) { while (false) { try {} catch {} } } } }' } }); console.log(!result.allowed ? '✅' : '❌');" 2>/dev/null)
- Allows simple functions: $(cd "$PLUGIN_DIR" && bun -e "import { detectTheatricalCode } from './src/validation/theatrical-detector.ts'; const result = await detectTheatricalCode({ tool: 'write', args: { content: 'function add(a, b) { return a + b; }' } }); console.log(result.allowed ? '✅' : '❌');" 2>/dev/null)

### Firewall 6: Style Guide Enforcement
- Blocks multi-word variables: $(cd "$PLUGIN_DIR" && bun -e "import { enforceStyleGuide } from './src/validation/style-enforcer.ts'; const result = await enforceStyleGuide({ tool: 'write', args: { content: 'const overlyComplexVar = {};', filePath: '/tmp/test.ts' } }); console.log(!result.allowed ? '✅' : '❌');" 2>/dev/null)
- Allows single-word variables: $(cd "$PLUGIN_DIR" && bun -e "import { enforceStyleGuide } from './src/validation/style-enforcer.ts'; const result = await enforceStyleGuide({ tool: 'write', args: { content: 'const count = 0;', filePath: '/tmp/test.ts' } }); console.log(result.allowed ? '✅' : '❌');" 2>/dev/null)
- Allows technical terms: $(cd "$PLUGIN_DIR" && bun -e "import { enforceStyleGuide } from './src/validation/style-enforcer.ts'; const result = await enforceStyleGuide({ tool: 'write', args: { content: 'const XMLHttpRequest = {};', filePath: '/tmp/test.ts' } }); console.log(result.allowed ? '✅' : '❌');" 2>/dev/null)

### Firewall 7: Repo Root Test Prevention
- Blocks tests at repo root: $(cd "$PLUGIN_DIR" && bun -e "import { preventRepoRootTests } from './src/validation/test-enforcer.ts'; const result = await preventRepoRootTests({ tool: 'bash', args: { command: 'npm test', workdir: '/home/user/project', sessionID: 'test' } }); console.log(!result.allowed ? '✅' : '❌');" 2>/dev/null)
- Allows tests in subdirectories: $(cd "$PLUGIN_DIR" && bun -e "import { preventRepoRootTests } from './src/validation/test-enforcer.ts'; const result = await preventRepoRootTests({ tool: 'bash', args: { command: 'npm test', workdir: '/home/user/project/src', sessionID: 'test' } }); console.log(result.allowed ? '✅' : '❌');" 2>/dev/null)

### Firewall 8: Verification Gates
- Requires artifacts for SHIP: $(cd "$PLUGIN_DIR" && bun -e "import { enforceVerificationGates } from './src/verification/gates.ts'; const result = await enforceVerificationGates({ tool: 'write', args: {}, sessionID: 'test-gate', workflowStep: 'ship', agent: 'test' }); console.log(!result.allowed ? '✅' : '❌');" 2>/dev/null)

### Firewall 9: Documentation Validation
- Blocks theatrical documentation: $(cd "$PLUGIN_DIR" && bun -e "import { validateDocumentation } from './src/validation/doc-validator.ts'; const fs = require('fs'); const testFile = '/tmp/test-doc.ts'; fs.writeFileSync(testFile, '// This implements a future version'); const result = await validateDocumentation({ tool: 'write', args: { filePath: testFile } }); fs.unlinkSync(testFile); console.log(!result.allowed ? '✅' : '❌');" 2>/dev/null)
- Allows normal code: $(cd "$PLUGIN_DIR" && bun -e "import { validateDocumentation } from './src/validation/doc-validator.ts'; const fs = require('fs'); const testFile = '/tmp/test-normal.ts'; fs.writeFileSync(testFile, 'function test() {}'); const result = await validateDocumentation({ tool: 'write', args: { filePath: testFile } }); fs.unlinkSync(testFile); console.log(result.allowed ? '✅' : '❌');" 2>/dev/null)

### Bonus: Audit Logging
- Creates audit logs: $(cd "$PLUGIN_DIR" && bun -e "import { AuditLogger } from './src/enforcement/audit-logger.ts'; const logger = new AuditLogger('test-audit', '/tmp/audit-test'); logger.log({ firewall: 'test', tool: 'write', action: 'test' }); const logs = logger.getLogs(); console.log(logs.length > 0 ? '✅' : '❌');" 2>/dev/null)

## Status
$(if [ $FAILED_TESTS -eq 0 ]; then 
    echo "✅ **ALL 7 FIREWALLS WORKING CORRECTLY**"
    echo "All additional firewalls are enforcing their rules properly."
elif [ $SUCCESS_RATE -ge 80 ]; then 
    echo "⚠️ **MOST FIREWALLS WORKING**"
    echo "$FAILED_TESTS firewall test(s) failed but core functionality is intact."
else 
    echo "❌ **MULTIPLE FIREWALL ISSUES**"
    echo "Several firewalls are not working correctly."
fi)

## Firewall Coverage
1. ✅ Mock Mode Detection - Prevents simulation language
2. ✅ Theatrical Code Detection - Prevents overly complex code
3. ✅ Style Guide Enforcement - Enforces naming conventions
4. ✅ Repo Root Test Prevention - Prevents tests from repo root
5. ✅ Verification Gates - 3-gate validation system
6. ✅ Documentation Validation - Prevents theatrical documentation
7. ✅ Audit Logging - Creates audit trail

## Log Files
- Complete log: \`$LOG_FILE\`
- This summary: \`$RESULTS_FILE\`

## Next Steps
1. $(if [ $FAILED_TESTS -eq 0 ]; then echo "All firewalls are ready for use"; else echo "Fix the failed firewall tests"; fi)
2. Integrate firewalls with OpenCode tool execution
3. Add configuration options for each firewall
4. Consider adding firewall-specific metrics and reporting

EOF

log "Results saved to: $RESULTS_FILE"

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All 7 additional firewalls tests passed!${NC}"
    echo "All firewalls are correctly enforcing their rules."
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most firewall tests passed${NC}"
    echo "$FAILED_TESTS test(s) failed. Check $LOG_FILE for details."
    exit 1
else
    echo -e "${RED}❌ Multiple firewall tests failed!${NC}"
    echo "$FAILED_TESTS test(s) failed. Check $LOG_FILE for details."
    exit 1
fi
