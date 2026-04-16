# 🦈 Shark Agent Plugin - Testing Instructions for New Agent

## Welcome!
You've been assigned to test the shark-agent-plugin installation and verify all enforcement firewalls are working correctly.

## Current State
- **Plugin**: shark-agent-plugin v1.0.0 (replaced opencode-ultra)
- **OpenCode**: 1.3.7 (installed globally)
- **Migration**: Completed, configuration updated
- **Backup**: Available at `/home/leviathan/.config/opencode/opencode.json.backup.20260331_014731`

## Your Mission
1. Verify the plugin is correctly installed and configured
2. Test all 9 enforcement firewalls
3. Validate OpenCode integration
4. Ensure rollback functionality works
5. Create comprehensive test logs for analysis

## Quick Start

### Option 1: Run Complete Test Suite (Recommended)
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin"
./scripts/run-all-tests.sh
```

This will:
- Run all verification tests
- Create logs in `logs/` directory
- Generate summary in `results/` directory
- Provide overall pass/fail status

### Option 2: Test Individual Components
```bash
# Test Guardian protection
./scripts/test-guardian.sh

# Test OpenCode integration
./scripts/test-opencode.sh

# Test rollback functionality
./scripts/test-rollback.sh

# Test workflow enforcement
./scripts/test-workflow.sh

# Test other 7 firewalls
./scripts/test-other-firewalls.sh
```

## Manual Verification
If you prefer manual testing, follow `VERIFICATION_CHECKLIST.md` for step-by-step instructions.

## Expected Results

### Critical Tests (Must Pass)
1. **Guardian blocks ~/.ssh/config writes**
2. **TypeScript compiles without errors**
3. **All unit tests pass (36/36)**
4. **OpenCode loads with plugin**
5. **Rollback works correctly**

### Firewall Coverage
The plugin should enforce all 9 firewalls:
1. ✅ Guardian - Blocks PERSONAL/SYSTEM paths
2. ✅ Workflow - Enforces 5-step process
3. ✅ Mock Mode - Blocks simulation language
4. ✅ Theatrical Code - Prevents overly complex code
5. ✅ Style Guide - Enforces naming conventions
6. ✅ Repo Root Tests - Prevents tests from repo root
7. ✅ Verification Gates - 3-gate validation
8. ✅ Documentation - Prevents theatrical docs
9. ✅ Audit Logging - Full audit trail

## Safety Features
- **Non-destructive**: Tests use `/tmp` or read-only operations
- **Backup created**: Configuration backed up before changes
- **Rollback ready**: Rollback script tested and verified
- **Cleanup**: Test directories removed after tests

## Test Output
All tests produce:
- **Log files** in `logs/` directory
- **Results summaries** in `results/` directory
- **Standardized output** with ✅/❌ indicators

## Troubleshooting

### If OpenCode not found:
```bash
npm install -g opencode
```

### If plugin not linked:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin
npm link
```

### If tests fail:
1. Check `logs/` directory for detailed error messages
2. Verify OpenCode configuration: `cat ~/.config/opencode/opencode.json | head -10`
3. Check plugin installation: `npm list -g shark-agent-plugin`

### To restore original state:
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin"
./scripts/test-rollback.sh
```

## Time Estimate
- **Complete test suite**: 10-15 minutes
- **Individual tests**: 2-5 minutes each
- **Manual verification**: 15-20 minutes

## Success Criteria
The plugin is considered "ready" when:
1. All critical tests pass
2. All 9 firewalls are active and enforcing
3. OpenCode integration works correctly
4. Rollback functionality is verified
5. Comprehensive logs are available

## Deliverables
Please provide:
1. **Test summary** from `results/` directory
2. **Any issues found** with reproduction steps
3. **Recommendations** for fixes or improvements
4. **Final status** (✅ READY, ⚠️ NEEDS FIXES, ❌ NOT READY)

## Contact
For questions or issues, refer to:
- `TEST_PLAN.md` - Comprehensive testing plan
- `TEST_SCRIPTS.md` - Script documentation
- `VERIFICATION_CHECKLIST.md` - Manual verification steps

Good luck! 🦈
