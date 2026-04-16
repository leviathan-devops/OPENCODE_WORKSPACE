# 🦈 Shark Agent Plugin - Test Scripts Documentation

## Overview
This document describes the automated test scripts available for verifying shark-agent-plugin functionality.

## Script Directory Structure
```
scripts/
├── run-all-tests.sh         # Master script - runs all tests
├── test-guardian.sh         # Tests Guardian protection
├── test-opencode.sh         # Tests OpenCode integration
├── test-rollback.sh         # Tests rollback functionality
├── test-workflow.sh         # Tests workflow enforcement
├── test-other-firewalls.sh  # Tests other 7 firewalls
└── test-performance.sh      # Tests performance and edge cases
```

## Script Details

### 1. `run-all-tests.sh`
**Purpose**: Run complete test suite
**Usage**: `./scripts/run-all-tests.sh`
**Output**: 
- `logs/test-YYYYMMDD-HHMMSS.log` - Complete log
- `results/summary-YYYYMMDD-HHMMSS.md` - Test summary
**Tests Run**:
1. Pre-test verification
2. Guardian protection tests
3. Workflow enforcement tests
4. Other firewall tests
5. OpenCode integration tests
6. Rollback tests
7. Performance tests

### 2. `test-guardian.sh`
**Purpose**: Test Guardian path protection
**Usage**: `./scripts/test-guardian.sh [--verbose]`
**Tests**:
- Blocks ~/.ssh/config writes
- Blocks /etc/passwd writes
- Allows /tmp/test.txt writes
- Blocks ~/.aws/credentials writes
- Blocks /bin/bash writes
**Output**: Guardian test results with pass/fail status

### 3. `test-opencode.sh`
**Purpose**: Test OpenCode integration
**Usage**: `./scripts/test-opencode.sh [--interactive]`
**Tests**:
- Plugin loads in OpenCode
- Real-time enforcement during chat
- Tool execution blocking
- Error message display
**Note**: Uses non-destructive test commands

### 4. `test-rollback.sh`
**Purpose**: Test rollback functionality
**Usage**: `./scripts/test-rollback.sh`
**Tests**:
1. Rollback to opencode-ultra
2. Verify OpenCode works
3. Re-migrate to shark-agent-plugin
4. Verify plugin works again
**Output**: Rollback test results

### 5. `test-workflow.sh`
**Purpose**: Test workflow enforcement
**Usage**: `./scripts/test-workflow.sh`
**Tests**:
- Starts at PLAN step
- Blocks BUILD without PLAN
- Allows PLAN → BUILD progression
- Requires artifacts for SHIP
- Blocks backwards transitions

### 6. `test-other-firewalls.sh`
**Purpose**: Test remaining 7 firewalls
**Usage**: `./scripts/test-other-firewalls.sh`
**Tests**:
- Mock mode detection
- Theatrical code detection
- Style guide enforcement
- Repo root test prevention
- Verification gates
- Documentation validation
- Audit logging

### 7. `test-performance.sh`
**Purpose**: Test performance and edge cases
**Usage**: `./scripts/test-performance.sh`
**Tests**:
- Concurrent operations
- Large file operations
- Permission edge cases
- Error recovery
- Memory usage

## Script Execution Examples

### Quick Verification
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin"
./scripts/run-all-tests.sh
```

### Specific Component Testing
```bash
# Just test Guardian
./scripts/test-guardian.sh

# Test Guardian with verbose output
./scripts/test-guardian.sh --verbose

# Test OpenCode integration interactively
./scripts/test-opencode.sh --interactive
```

### Manual Test Execution
If scripts fail, you can run tests manually:
```bash
# Test Guardian manually
bun -e "
import { checkGuardianProtection } from '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin/src/enforcement/guardian-enhancer.ts';
import * as os from 'os';
const homeDir = os.homedir();
const result = await checkGuardianProtection('write', { filePath: homeDir + '/.ssh/config' });
console.log('Guardian test:', result.allowed ? 'FAIL' : 'PASS');
"
```

## Script Output Format

All scripts produce standardized output:
```
🦈 [SCRIPT NAME] - Starting
📋 Test 1: [Test Description]
   ✅ PASS / ❌ FAIL
📋 Test 2: [Test Description]
   ✅ PASS / ❌ FAIL
...
🦈 [SCRIPT NAME] - Complete
✅ X passed, Y failed
```

## Log Files

Scripts create log files in `logs/` directory:
- `guardian-YYYYMMDD-HHMMSS.log` - Guardian test logs
- `opencode-YYYYMMDD-HHMMSS.log` - OpenCode test logs
- `rollback-YYYYMMDD-HHMMSS.log` - Rollback test logs
- `complete-YYYYMMDD-HHMMSS.log` - Complete test run logs

## Error Handling

Scripts include error handling:
- **Non-zero exit code** on test failure
- **Configuration backup** before destructive operations
- **Automatic cleanup** of test directories
- **Graceful degradation** if OpenCode not available

## Customization

You can customize test behavior with environment variables:
```bash
# Set test directory
export SHARK_TEST_DIR="/tmp/my-test-dir"

# Enable verbose output
export SHARK_VERBOSE=1

# Skip specific tests
export SKIP_ROLLBACK_TESTS=1
export SKIP_OPENCODE_TESTS=1
```

## Safety Features
1. **Read-only by default** - Tests don't modify system files
2. **Uses /tmp** - All test files created in temporary directories
3. **Backup before changes** - Configuration backed up before modifications
4. **Rollback tested** - Rollback functionality verified
5. **Cleanup** - Test directories removed after tests
