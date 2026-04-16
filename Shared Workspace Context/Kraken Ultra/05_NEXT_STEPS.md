# Kraken Ultra Integration - Next Steps Prompt for Sisyphus Agent

## 🎯 AGENT MISSION
**You are sisyphus (Kraken Brain orchestrator)**. Continue the Kraken Ultra integration build by executing the remaining tasks sequentially. Use the context library in this directory for reference.

## 📚 CONTEXT LIBRARY REFERENCE
All context files are in `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Ultra/`:

1. `00_PROJECT_OVERVIEW.md` - High-level mission and success criteria
2. `01_CURRENT_STATUS.md` - Detailed integration status (30% complete)
3. `02_CRITICAL_ISSUES.md` - Priority issues (surgical debug disconnect is CRITICAL)
4. `03_REMAINING_TASKS.md` - Sequential task list with actions
5. `04_INTEGRATION_POINTS.md` - Code locations and implementation details
6. `06_VERIFICATION_CHECKLIST.md` - Verification steps for each task
7. `07_ERROR_RECOVERY.md` - Error recovery protocol

## 🚨 IMMEDIATE PRIORITY
**FIX THE SURGICAL DEBUG PROTOCOL DISCONNECT** (Task 1 from `03_REMAINING_TASKS.md`)

Tool failures don't trigger surgical debug injection due to:
1. Two separate stagnation detectors with no coordination
2. Missing `debugInjector.injectDebugger()` call in `executeRunCommand()`

## 🛠️ EXECUTION PROTOCOL

### Phase 1: Surgical Debug Protocol Fix (TASK 1)
**Objective**: Connect tool stagnation detection to surgical debug injection

**Steps**:
1. **Examine current implementation**:
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
   grep -n "executeRunCommand" src/tools/executor_v2.ts
   ```
   Review lines 346-382 for stagnation handling.

2. **Add DebugInjector call** for escalation alerts:
   - Location: After line 362 in `executeRunCommand()`
   - Use template from `04_INTEGRATION_POINTS.md` (ToolExecutor Integration Points)
   - Agent ID format: `tool-executor-${toolCall.id}` or `tool-${toolCall.name}`

3. **Test the integration**:
   ```bash
   npm run typecheck
   ```
   Fix any TypeScript errors.

4. **Create simple test** to verify connection:
   - Simulate repeated command failures
   - Check if debug injection triggers
   - Log injection results

**Verification** (from `06_VERIFICATION_CHECKLIST.md`):
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] No runtime errors in basic execution
- [ ] Debug injection triggers on escalation alerts

### Phase 2: Nemotron Service Integration (TASK 2)
**Objective**: Copy Nemotron service components and integrate

**Steps**:
1. **Create destination directory**:
   ```bash
   mkdir -p src/nemotron-service
   ```

2. **Copy source files** from nemotron-communication-layer:
   ```bash
   cp /home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/*.ts src/nemotron-service/
   ```

3. **Update import paths**:
   ```bash
   find src/nemotron-service -name "*.ts" -exec sed -i "s@from '\\.\\./@from '../@g" {} \;
   ```

4. **Locate or create DualBrainCoordinator**:
   - Search for existing coordinator: `grep -r "DualBrainCoordinator" src/`
   - If missing, create basic implementation
   - Integrate `NemotronEventBus` for task events

5. **Test integration**:
   ```bash
   npm run typecheck
   ls -la src/nemotron-service/  # Should show 7 files
   ```

**Verification**:
- [ ] All 7 Nemotron files copied successfully
- [ ] TypeScript compilation passes
- [ ] Event bus can be instantiated without errors

### Phase 3: Shark CLI Launch Script (TASK 3)
**Objective**: Create `shark` command with micro/macro wizard

**Steps**:
1. **Create script directory**:
   ```bash
   mkdir -p ~/OPENCODE_WORKSPACE/.shark
   ```

2. **Create script** using template from workflow (lines 217-527):
   - Modify path: Use `~/OPENCODE_WORKSPACE/.shark/shark` not `/usr/local/bin/shark`
   - Add symlink instructions for user

3. **Make executable and test**:
   ```bash
   chmod +x ~/OPENCODE_WORKSPACE/.shark/shark
   ~/OPENCODE_WORKSPACE/.shark/shark --help
   ```

**Verification**:
- [ ] Script exists at `~/OPENCODE_WORKSPACE/.shark/shark`
- [ ] Script is executable
- [ ] Help output shows Shark Frankenstein branding

### Phase 4: Fragment Files Creation (TASK 4)
**Objective**: Create agent-specific instruction fragments

**Steps**:
1. **Create fragment directory**:
   ```bash
   mkdir -p ~/OPENCODE_WORKSPACE/.shark/fragments
   ```

2. **Create 4 fragment files** using content from workflow (lines 539-582):
   - `shark-agent.md` - Instructions for hephaestus
   - `kraken-brain.md` - Instructions for sisyphus  
   - `architect.md` - Instructions for oracle
   - `code-review.md` - Instructions for momus

**Verification**:
- [ ] 4 fragment files created
- [ ] Files contain appropriate agent instructions

### Phase 5: OpenCode Zen Provider (TASK 5)
**Objective**: Add free model provider to OpenCode configuration

**Steps**:
1. **Check existing config**:
   ```bash
   ls -la ~/.config/opencode/opencode.json
   ```

2. **Add Zen provider** configuration (workflow lines 620-632):
   - Provider: `0-opencode-zen`
   - Models: `minimax-m2.5-free`, `mimo-v2-omni-free`, `nemotron-3-super-free`

3. **Test configuration**:
   ```bash
   opencode --version
   ```

**Verification**:
- [ ] `opencode.json` contains Zen provider
- [ ] OpenCode loads without configuration errors

## 📋 EXECUTION CONSTRAINTS

### DO NOT:
- Skip task verification steps
- Proceed to next task without successful verification
- Modify core Shark Frankenstein functionality unrelated to integration
- Delete or corrupt existing working components

### DO:
- Execute tasks sequentially (1→2→3→4→5)
- Document changes and progress
- Update context files if you discover new information
- Use error recovery protocol from `07_ERROR_RECOVERY.md` if issues arise
- Commit changes with descriptive messages

## 🎪 COMMUNICATION PROTOCOL

### Progress Reporting Format:
```
🦈 KRAKEN ULTRA INTEGRATION - TASK [X] STATUS
- Task: [Task name]
- Status: ✅ COMPLETE / ⚠️ IN PROGRESS / ❌ FAILED
- Changes: [Brief description]
- Verification: [Pass/Fail with details]
- Next: [Next action]
```

### Completion Signal Format:
```
✅ KRAKEN ULTRA INTEGRATION COMPLETE
- Surgical debug protocol: OPERATIONAL (connected to tool stagnation)
- Nemotron event service: INTEGRATED
- Shark CLI launch: WORKING (workspace script)
- Fragment injection: CONFIGURED
- Zen provider: ADDED
- TypeScript compilation: PASSING
- Build status: SUCCESS
- Commit hash: [git rev-parse HEAD]
```

## 🚑 ERROR RECOVERY
If any task fails:
1. **Check `07_ERROR_RECOVERY.md`** for specific recovery procedures
2. **Rollback using git** if code changes cause issues
3. **Document the error** in context files for future agents
4. **Attempt fix** using systematic debugging approach

## 🔄 ITERATION WORKFLOW
1. Read relevant context files
2. Execute current task
3. Verify success criteria
4. Document progress
5. Move to next task
6. Report completion

---
**Execution Order**: TASK 1 → TASK 2 → TASK 3 → TASK 4 → TASK 5  
**Priority**: Surgical debug disconnect FIX FIRST  
**Start Time**: Immediately  
**Expected Duration**: 2-3 hours total