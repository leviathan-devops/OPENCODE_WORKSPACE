# 🦈 Shark Agent Plugin - Comprehensive Test Plan

## Test Objectives
1. Verify shark-agent-plugin is correctly installed and configured
2. Test all 9 enforcement firewalls are working
3. Validate OpenCode integration
4. Ensure rollback functionality works
5. Create comprehensive test logs for analysis

## Test Phases

### Phase 1: Pre-Test Verification (5 minutes)
- [ ] Verify OpenCode installation
- [ ] Check plugin configuration
- [ ] Confirm backup exists
- [ ] Test basic plugin functionality

### Phase 2: Guardian Protection Tests (10 minutes)
- [ ] Test blocking of PERSONAL paths (~/.ssh, ~/.aws, etc.)
- [ ] Test blocking of SYSTEM paths (/etc, /bin, etc.)
- [ ] Test allowance of workspace paths (/tmp, current directory)
- [ ] Test edge cases (home directory root, symlinks)

### Phase 3: Workflow Enforcement Tests (5 minutes)
- [ ] Test 5-step workflow (PLAN → BUILD → TEST → VERIFY → SHIP)
- [ ] Test step progression enforcement
- [ ] Test artifact validation
- [ ] Test blocked state handling

### Phase 4: Other Firewall Tests (10 minutes)
- [ ] Mock mode detection ("I would run...")
- [ ] Theatrical code detection (overly complex functions)
- [ ] Style guide enforcement (single-word naming)
- [ ] Repo root test prevention
- [ ] Verification gates (3-gate validation)
- [ ] Documentation validation
- [ ] Audit logging functionality

### Phase 5: OpenCode Integration Tests (10 minutes)
- [ ] Test plugin loads in OpenCode session
- [ ] Test real-time enforcement during chat
- [ ] Test tool execution blocking
- [ ] Test error handling and messages

### Phase 6: Rollback Tests (5 minutes)
- [ ] Test rollback to opencode-ultra
- [ ] Verify OpenCode works after rollback
- [ ] Test re-migration to shark-agent-plugin

### Phase 7: Performance & Edge Cases (5 minutes)
- [ ] Test concurrent operations
- [ ] Test large file operations
- [ ] Test permission edge cases
- [ ] Test error recovery

## Test Environment
- **OpenCode Version**: 1.3.7
- **Plugin Version**: shark-agent-plugin v1.0.0
- **Test Directory**: `/tmp/shark-test-XXXXXX`
- **Log Directory**: `logs/` in this workspace
- **Results Directory**: `results/` in this workspace

## Success Criteria
- All 9 firewalls must be active and enforcing
- No TypeScript compilation errors
- All unit tests must pass (36/36)
- Guardian must block sensitive path writes
- Rollback must restore original configuration
- OpenCode must remain functional throughout

## Risk Mitigation
1. **Backup First**: Configuration backed up before each test phase
2. **Non-Destructive**: Tests use `/tmp` or read-only operations
3. **Rollback Ready**: Rollback script tested and verified
4. **Incremental Testing**: Test one component at a time
5. **Log Everything**: All test output captured for analysis

## Test Scripts
See `TEST_SCRIPTS.md` for detailed script documentation and `VERIFICATION_CHECKLIST.md` for step-by-step manual verification.

## Expected Timeline
- **Total Time**: 45-60 minutes
- **Setup**: 5 minutes
- **Execution**: 35-45 minutes
- **Cleanup**: 5 minutes
- **Analysis**: 5-10 minutes

## Test Data
Test data will be generated in:
- `/tmp/shark-test-*` - Temporary test directories
- `logs/test-*.log` - Complete test logs
- `results/summary-*.md` - Test summaries

## Exit Criteria
Testing is complete when:
1. All test phases have been executed
2. Success criteria are met
3. Comprehensive logs are available
4. Any issues are documented
5. System is in a known good state (either shark-agent-plugin or rolled back)
