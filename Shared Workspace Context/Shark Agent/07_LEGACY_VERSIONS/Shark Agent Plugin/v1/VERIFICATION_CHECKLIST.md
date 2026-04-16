# 🦈 Shark Agent Plugin - Verification Checklist

## Pre-Test Setup
- [ ] **Workspace Ready**
  - [ ] Navigate to: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin`
  - [ ] Verify scripts directory exists: `ls -la scripts/`
  - [ ] Make scripts executable: `chmod +x scripts/*.sh`

- [ ] **Environment Verification**
  - [ ] Check OpenCode version: `opencode --version` (Expected: 1.3.7)
  - [ ] Check OpenCode path: `which opencode` (Expected: `/home/leviathan/.npm-global/bin/opencode`)
  - [ ] Check plugin installation: `npm list -g shark-agent-plugin` (Should show linked)

- [ ] **Configuration Check**
  - [ ] Verify config: `grep 'shark-agent-plugin' ~/.config/opencode/opencode.json` (Should show plugin)
  - [ ] Check backup exists: `ls -la ~/.config/opencode/opencode.json.backup.*` (At least one backup)

## Phase 1: Guardian Protection Verification

### Test 1: Personal Path Blocking
```bash
# Test ~/.ssh/config blocking
bun -e "
import { checkGuardianProtection } from '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin/src/enforcement/guardian-enhancer.ts';
import * as os from 'os';
const homeDir = os.homedir();
const result = await checkGuardianProtection('write', { filePath: homeDir + '/.ssh/config' });
console.log('~/.ssh/config:', result.allowed ? '❌ FAIL (should be blocked)' : '✅ PASS (blocked)');
"
```
- [ ] **Expected**: `false` (blocked)
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

### Test 2: System Path Blocking
```bash
# Test /etc/passwd blocking
bun -e "
import { checkGuardianProtection } from '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin/src/enforcement/guardian-enhancer.ts';
const result = await checkGuardianProtection('write', { filePath: '/etc/passwd' });
console.log('/etc/passwd:', result.allowed ? '❌ FAIL (should be blocked)' : '✅ PASS (blocked)');
"
```
- [ ] **Expected**: `false` (blocked)
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

### Test 3: Allowed Path
```bash
# Test /tmp/test.txt allowance
bun -e "
import { checkGuardianProtection } from '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin/src/enforcement/guardian-enhancer.ts';
const result = await checkGuardianProtection('write', { filePath: '/tmp/test.txt' });
console.log('/tmp/test.txt:', result.allowed ? '✅ PASS (allowed)' : '❌ FAIL (should be allowed)');
"
```
- [ ] **Expected**: `true` (allowed)
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

## Phase 2: Plugin Build Verification

### Test 4: TypeScript Compilation
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin
bun run typecheck 2>&1 | grep -q "error" && echo "❌ FAIL: TypeScript errors" || echo "✅ PASS: No TypeScript errors"
```
- [ ] **Expected**: No errors
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

### Test 5: Build Success
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin
npm run build 2>&1 | tail -5
```
- [ ] **Expected**: "Bundled X modules" success message
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

### Test 6: Unit Tests
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin
npm test 2>&1 | grep -E "(pass|fail)" | tail -2
```
- [ ] **Expected**: "X pass, 0 fail"
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

## Phase 3: OpenCode Integration

### Test 7: Plugin Loading
```bash
# Test OpenCode starts with plugin
timeout 10 opencode 'Test plugin loading' 2>&1 | head -20
```
- [ ] **Expected**: OpenCode starts without errors
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

### Test 8: Guardian in OpenCode
```bash
# Test Guardian blocking in OpenCode session
echo "Try to write to ~/.ssh/config" | timeout 15 opencode 2>&1 | grep -i "guardian\|blocked\|denied"
```
- [ ] **Expected**: Guardian blocking message
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

### Test 9: Mock Mode Detection
```bash
# Test mock mode detection
echo "I would run npm install" | timeout 15 opencode 2>&1 | grep -i "mock\|simulation"
```
- [ ] **Expected**: Mock mode detection message
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

## Phase 4: Rollback Verification

### Test 10: Rollback Script
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin"
./scripts/test-rollback.sh 2>&1 | tail -10
```
- [ ] **Expected**: Rollback test passes
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

### Test 11: Configuration Restored
```bash
# After rollback test, verify config
grep 'opencode-ultra\|shark-agent-plugin' ~/.config/opencode/opencode.json
```
- [ ] **Expected**: shark-agent-plugin (after re-migration)
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

## Phase 5: Other Firewalls

### Test 12: Workflow Enforcement
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin
bun -e "
import { workflowMachine, WorkflowStep } from './src/workflow/machine.ts';
const state = workflowMachine.getState('test-session');
console.log('Current step:', state.currentStep, state.currentStep === WorkflowStep.PLAN ? '✅ PASS' : '❌ FAIL');
"
```
- [ ] **Expected**: `PLAN`
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

### Test 13: Style Guide Enforcement
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin
bun -e "
import { enforceStyleGuide } from './src/validation/style-enforcer.ts';
const result = await enforceStyleGuide({
  tool: 'write',
  args: { content: 'const overlyComplexVariableName = {};', filePath: '/tmp/test.ts' }
});
console.log('Style guide:', result.allowed ? '❌ FAIL (should block)' : '✅ PASS (blocked)');
"
```
- [ ] **Expected**: `false` (blocked)
- [ ] **Actual**: ________
- [ ] **Status**: ✅ PASS / ❌ FAIL

## Summary

### Test Results Tally
- **Total Tests**: 13
- **Passed**: ________
- **Failed**: ________
- **Success Rate**: ________%

### Critical Tests
- [ ] Guardian blocks ~/.ssh/config
- [ ] TypeScript compiles without errors
- [ ] All unit tests pass
- [ ] OpenCode loads with plugin
- [ ] Rollback works correctly

### Issues Found
1. ________
2. ________
3. ________

### Recommendations
1. ________
2. ________
3. ________

### Final Status
- [ ] ✅ READY FOR USE
- [ ] ⚠️ NEEDS FIXES
- [ ] ❌ NOT READY

**Tested By**: ________  
**Date**: ________  
**Time**: ________
