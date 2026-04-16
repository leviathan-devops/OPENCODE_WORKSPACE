# PLAN: Kraken Ultra Integration - Next Steps Execution

**Date**: March 30, 2026
**Workflow**: Shark 5-Step Build Process
**Project**: Shark Frankenstein CLI - Full Integration Testing

---

## 1. USER REQUEST

Execute the "Next Steps Required" from BUILD_REPORT.md:
1. Test Full Integration: Run comprehensive end-to-end tests with actual OpenCode workflows
2. Create Integration Test Suite: Write automated tests in test/kraken-ultra-integration.test.ts
3. Configure API Keys: Set GLM_API_KEY, DEEPSEEK_API_KEY, OPENCODE_ZEN_API_KEY environment variables
4. Create System-wide Symlink: sudo ln -s ~/OPENCODE_WORKSPACE/.shark/shark /usr/local/bin/shark
5. Test Shark CLI: Run actual OpenCode sessions using micro/macro modes

**Requirements**:
- Follow Agent OS build workflow in /home/leviathan/OPENCODE_WORKSPACE/gold-standard-artifacts/Agent OS
- Actually test/verify everything before returning as complete
- Execute, don't simulate
- Verify with evidence, not claims

---

## 2. WHAT I KNOW

### Existing Infrastructure
- **Project Location**: /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/
- **Shark CLI Script**: /home/leviathan/OPENCODE_WORKSPACE/.shark/shark (executable)
- **Fragment Files**: /home/leviathan/OPENCODE_WORKSPACE/.shark/fragments/ (4 files)
- **Nemotron Service**: /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/nemotron-service/ (7 files)
- **OpenCode Config**: ~/.config/opencode/opencode.json (Zen provider configured)
- **TypeScript**: Compiles successfully (verified in BUILD_REPORT.md)

### Dependencies
- Node.js v18.0.0+
- TypeScript v5.9.3
- OpenCode CLI (@anomalyco/opencode)
- API Keys needed: GLM_API_KEY, DEEPSEEK_API_KEY, OPENCODE_ZEN_API_KEY

### Tools Available
- Bash tool for command execution
- Read/Write/Edit tools for file operations
- Glob/Grep tools for code search
- Spawn agent for parallel execution

---

## 3. IMPLEMENTATION PLAN

### Phase 1: API Key Configuration
**Goal**: Configure required API keys for full integration testing

**Actions**:
1. Check existing environment variables
2. Read ~/.config/opencode/opencode.json to verify provider configuration
3. Check for existing API keys in shell environment
4. Create .env file template if keys not set
5. Document which keys are configured vs need user input

**Verification**:
- Check `env | grep -E '(GLM|DEEPSEEK|OPENCODE_ZEN)_API_KEY'`
- Verify opencode.json has correct provider entries
- Test API key validity with simple curl request (if keys exist)

**Risk**: User may not have API keys configured - will need to ask for them

### Phase 2: System-wide Symlink Creation
**Goal**: Make `shark` command available globally

**Actions**:
1. Verify shark script exists and is executable
2. Check if symlink already exists
3. Create symlink: `sudo ln -sf ~/OPENCODE_WORKSPACE/.shark/shark /usr/local/bin/shark`
4. Verify symlink works: `which shark && shark --version`

**Verification**:
- `ls -la /usr/local/bin/shark` shows symlink
- `shark --help` executes successfully
- `which shark` returns /usr/local/bin/shark

**Risk**: Requires sudo access - may need password

### Phase 3: Integration Test Suite Creation
**Goal**: Create comprehensive test suite in test/kraken-ultra-integration.test.ts

**Test Categories**:
1. **Surgical Debug Protocol Tests**
   - Test tool stagnation detection
   - Test debug injection trigger
   - Test escalation alert generation

2. **Nemotron Service Tests**
   - Test event bus creation
   - Test message classification (2k/4k/6k/8k tokens)
   - Test agent routing
   - Test context compression

3. **Shark CLI Tests**
   - Test micro mode detection
   - Test macro mode detection
   - Test direct mode
   - Test auto-detection logic

4. **Fragment System Tests**
   - Test fragment file loading
   - Test fragment content validation
   - Test fragment injection into agent config

5. **OpenCode Integration Tests**
   - Test Zen provider configuration
   - Test API key detection
   - Test model availability

**Test Framework**: Node.js with TypeScript, using existing test infrastructure

**Actions**:
1. Create test/kraken-ultra-integration.test.ts
2. Write test cases for each category
3. Create test utilities and mocks
4. Configure test runner

**Verification**:
- `npm test` runs all tests
- All tests pass with exit code 0
- Test coverage report generated

### Phase 4: End-to-End Integration Testing
**Goal**: Run full OpenCode workflows with Shark integration

**Test Scenarios**:
1. **Micro Mode Workflow**
   - Launch: `shark --micro "fix bug in executor.ts"`
   - Verify: Shark Agent loads with fragment instructions
   - Verify: Tool execution triggers surgical debug on failure
   - Verify: Nemotron event bus active

2. **Macro Mode Workflow**
   - Launch: `shark --macro "implement new feature"`
   - Verify: Kraken Brain orchestrates with planning
   - Verify: Multiple agents coordinate
   - Verify: Fragment injection for each agent

3. **Direct Mode Workflow**
   - Launch: `shark --direct`
   - Verify: Standard OpenCode launches
   - Verify: No Shark enhancements active

**Actions**:
1. Run each test scenario
2. Capture output logs
3. Verify expected behavior
4. Document any issues

**Verification**:
- Each mode launches successfully
- Expected agents load with correct fragments
- Surgical debug triggers when appropriate
- Nemotron service handles events

**Risk**: Requires actual OpenCode installation and API keys

---

## 4. CLAIMS TO VERIFY

Each claim will have a corresponding test:

### Claim 1: API Keys Configured
**Test**: Check environment variables exist and are non-empty
**File**: test/kraken-ultra-integration.test.ts - testApiKeyConfiguration()
**Expected**: GLM_API_KEY, DEEPSEEK_API_KEY set (OPENCODE_ZEN_API_KEY optional)

### Claim 2: System-wide Symlink Created
**Test**: Verify symlink exists and points to correct location
**File**: test/kraken-ultra-integration.test.ts - testSymlinkCreation()
**Expected**: /usr/local/bin/shark -> ~/OPENCODE_WORKSPACE/.shark/shark

### Claim 3: Surgical Debug Protocol Works
**Test**: Simulate tool failure and verify debug injection
**File**: test/kraken-ultra-integration.test.ts - testSurgicalDebugInjection()
**Expected**: DebugInjector.injectDebugger() called on escalation

### Claim 4: Nemotron Service Operational
**Test**: Create event bus and send test message
**File**: test/kraken-ultra-integration.test.ts - testNemotronService()
**Expected**: Event received by subscribed agents

### Claim 5: Shark CLI Launches All Modes
**Test**: Execute shark with --micro, --macro, --direct flags
**File**: test/kraken-ultra-integration.test.ts - testSharkCliModes()
**Expected**: Correct mode detected, appropriate config generated

### Claim 6: Fragment System Loads Agent Instructions
**Test**: Load each fragment file and verify content
**File**: test/kraken-ultra-integration.test.ts - testFragmentLoading()
**Expected**: 4 fragment files with valid agent instructions

### Claim 7: OpenCode Integration Complete
**Test**: Run actual OpenCode session with Shark integration
**File**: test/kraken-ultra-integration.test.ts - testOpenCodeIntegration()
**Expected**: OpenCode launches with Shark enhancements active

---

## 5. EXECUTION ORDER

1. **API Key Configuration** (5 min)
   - Check existing keys
   - Document missing keys
   - Create .env template if needed

2. **System-wide Symlink** (2 min)
   - Create symlink with sudo
   - Verify execution

3. **Integration Test Suite** (30 min)
   - Create test file
   - Write all test cases
   - Configure test runner

4. **End-to-End Testing** (20 min)
   - Run micro mode test
   - Run macro mode test
   - Run direct mode test
   - Document results

5. **Verification & Reporting** (10 min)
   - Run all tests
   - Generate SHIP_REPORT.md
   - Update BUILD_REPORT.md

**Total Estimated Time**: 67 minutes

---

## 6. ROLLBACK PLAN

If any step fails:

### API Key Failure
- Continue with tests that don't require API keys
- Document which tests were skipped
- Mark integration as "partial" in SHIP_REPORT.md

### Symlink Failure
- Use full path to shark script: ~/OPENCODE_WORKSPACE/.shark/shark
- Continue testing with full path
- Document symlink issue for user to fix

### Test Suite Failure
- Fix failing tests
- Re-run until all pass
- If unfixable, document issue and mark as "needs attention"

### E2E Test Failure
- Capture error logs
- Analyze root cause
- Fix or document limitation
- Continue with other tests

---

## 7. SUCCESS CRITERIA

All of the following must be TRUE:

- [ ] API keys configured (or documented as user action required)
- [ ] System-wide symlink created and functional
- [ ] Integration test suite created with 7+ test categories
- [ ] All integration tests pass (exit code 0)
- [ ] Shark CLI launches in all 3 modes (micro, macro, direct)
- [ ] Fragment system loads agent instructions correctly
- [ ] Surgical debug protocol triggers on tool failure
- [ ] Nemotron service handles events correctly
- [ ] SHIP_REPORT.md generated with evidence
- [ ] BUILD_REPORT.md updated with test results

---

**Plan Created**: March 30, 2026 09:25 UTC
**Status**: Ready for BUILD phase
**Next Step**: Execute Phase 1 - API Key Configuration
