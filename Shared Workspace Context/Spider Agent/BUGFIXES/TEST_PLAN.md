# Spider Agent Vanilla Agent Spillover Fix - Test Plan

## Objective
Verify that the six-layer defense-in-depth fixes prevent Spider Agent plugin from interfering with vanilla OpenCode agents (`plan` and `build` modes) and that MODEL FALLBACK and CONTEXT PRESSURE warnings don't leak to vanilla agents.

## Fixes Being Tested
1. `delegationHandler` - Prevents spider state pollution for vanilla agents
2. `resolveSessionAndWindow` - Defense in depth
3. `guardrailsHooks.toolBefore` - Defense in depth
4. Model timeout check - Prevents MODEL FALLBACK for vanilla/architect
5. Model error fallback - Prevents MODEL FALLBACK for vanilla/architect
6. Context pressure warning - Prevents CONTEXT PRESSURE for vanilla/architect

## Test Environment
- OpenCode with Spider Agent plugin installed at `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/`
- Ability to switch between agent modes: `plan`, `build`, `spider` (orchestrator), `coder`, etc.
- Debug logging capability via `DEBUG_SPIDER=1` environment variable
- Test files in `/home/leviathan/OPENCODE_WORKSPACE/test/` directory

## Test Cases

### Test Case 1: Vanilla `plan` Agent Read-Only Enforcement
**Objective**: Verify vanilla `plan` agent respects OpenCode's native read-only permissions and spider hooks don't interfere.

**Steps**:
1. Start OpenCode with `DEBUG_SPIDER=1` environment variable
2. Switch to vanilla `plan` agent mode
3. Attempt to write to a test file: `echo "test" > /home/leviathan/OPENCODE_WORKSPACE/test/plan-write-test.txt`
4. Observe results:
   - File write should FAIL with permission denied error (OpenCode native enforcement)
   - Debug log should SHOW NO spider hook activity for this session
   - Spider state should NOT be set for this session
5. Clean up: Remove test file if somehow created

**Expected Results**:
- ✅ File write blocked by OpenCode native permissions (`edit: { "*": "deny" }`)
- ✅ No `[DIAG] chat.message agent=plan` in debug logs
- ✅ No spider state pollution (`activeAgent` not set for session)
- ✅ No guardrails or tracking hooks executed for vanilla plan

### Test Case 2: Vanilla `build` Agent Full Access
**Objective**: Verify vanilla `build` agent has full file access and spider hooks don't interfere.

**Steps**:
1. Start OpenCode with `DEBUG_SPIDER=1` environment variable
2. Switch to vanilla `build` agent mode
3. Attempt to write to a test file: `echo "test" > /home/leviathan/OPENCODE_WORKSPACE/test/build-write-test.txt`
4. Observe results:
   - File write should SUCCEED (OpenCode native permissions)
   - Debug log should SHOW NO spider hook activity for this session
   - Spider state should NOT be set for this session
5. Clean up: Remove test file

**Expected Results**:
- ✅ File write succeeds (OpenCode native permissions: `edit: { "*": "allow" }`)
- ✅ No `[DIAG] chat.message agent=build` in debug logs
- ✅ No spider state pollution
- ✅ No guardrails or tracking hooks executed for vanilla build

### Test Case 3: Spider `architect` Agent Full Functionality
**Objective**: Verify spider `architect` (orchestrator) agent retains full spider functionality.

**Steps**:
1. Start OpenCode with `DEBUG_SPIDER=1` environment variable
2. Switch to spider `architect` agent mode
3. Attempt to write to a test file: `echo "test" > /home/leviathan/OPENCODE_WORKSPACE/test/architect-write-test.txt`
4. Observe results:
   - File write behavior should follow spider agent rules
   - Debug log should SHOW spider hook activity for this session
   - Spider state SHOULD be set for this session
5. Clean up: Remove test file

**Expected Results**:
- ✅ File write behavior follows spider agent permissions
- ✅ `[DIAG] chat.message agent=architect` visible in debug logs
- ✅ Spider state properly set (`activeAgent` = "architect")
- ✅ Spider guardrails and tracking hooks executed
- ✅ Full spider functionality intact

### Test Case 4: Spider `coder` Agent Limited Functionality
**Objective**: Verify spider `coder` agent has appropriate limited functionality.

**Steps**:
1. Start OpenCode with `DEBUG_SPIDER=1` environment variable
2. Switch to spider `coder` agent mode
3. Attempt to write to a test file in allowed location: `echo "test" > /home/leviathan/OPENCODE_WORKSPACE/test/coder-write-test.txt`
4. Attempt to write to a test file in restricted location: `echo "test" > /home/leviathan/OPENCODE_WORKSPACE/src/restricted-test.txt`
5. Observe results:
   - First write should SUCCEED (allowed location)
   - Second write should FAIL (restricted location per spider rules)
   - Debug log should SHOW spider hook activity for this session
   - Spider state SHOULD be set for this session
6. Clean up: Remove test files

**Expected Results**:
- ✅ Write to allowed location succeeds
- ✅ Write to restricted location blocked by spider guardrails
- ✅ `[DIAG] chat.message agent=coder` visible in debug logs
- ✅ Spider state properly set (`activeAgent` = "coder")
- ✅ Spider guardrails and tracking hooks executed
- ✅ Limited spider functionality working correctly

### Test Case 5: Cross-Agent State Isolation
**Objective**: Verify spider state doesn't leak between different agent types.

**Steps**:
1. Start OpenCode with `DEBUG_SPIDER=1` environment variable
2. Switch to vanilla `plan` agent mode
3. Perform a read operation (should not trigger spider state)
4. Switch to spider `architect` agent mode
5. Perform a write operation
6. Switch back to vanilla `plan` agent mode
7. Perform another read operation
8. Observe debug logs throughout:
   - Spider hooks should ONLY appear during spider agent sessions
   - No spider activity during vanilla agent sessions
   - State should be properly isolated between sessions

**Expected Results**:
- ✅ Spider hook activity only visible during spider agent sessions
- ✅ Zero spider hook activity during vanilla agent sessions
- ✅ Proper state isolation between agent type switches
- ✅ No cross-contamination of spider state

## Success Criteria
All test cases must pass with expected results for the fix to be considered successful.

## Verification Methodology
1. Manual testing via OpenCode interface following test steps above
2. Primary evidence: Debug log output with `DEBUG_SPIDER=1`
3. Secondary evidence: File operation success/failure results
4. Tertiary evidence: Behavioral observation of agent capabilities

## Dependencies
- OpenCode must be restarted to load patched Spider Agent plugin
- Test directory `/home/leviathan/OPENCODE_WORKSPACE/test/` must exist
- User must be able to switch agent modes via OpenCode interface

## Risk Mitigation
- If tests fail, revert to previous plugin version and investigate
- If only partial failure, identify which defense layer needs adjustment
- Document any unexpected behaviors for further analysis

## Approval
This test plan requires user approval before execution begins.

**Submitted by**: OpenCode Assistant  
**Date**: 2026-04-03  
**Status**: Awaiting Approval