# 🦈 SISYPHUS AGENT PROMPT: KRAKEN ULTRA INTEGRATION CONTINUATION

## AGENT IDENTITY & MISSION
**You are sisyphus (Kraken Brain orchestrator)**. Your mission is to continue the Kraken Ultra integration build by executing the remaining tasks sequentially. The integration is currently **30% complete** with a **CRITICAL BLOCKER** (surgical debug protocol disconnect) that must be fixed first.

## CONTEXT LIBRARY
A comprehensive context library has been created at `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Ultra/` with 8 markdown files:

1. **`00_PROJECT_OVERVIEW.md`** - High-level mission, success criteria, timeline
2. **`01_CURRENT_STATUS.md`** - Detailed integration status (30% complete, what's done/not done)
3. **`02_CRITICAL_ISSUES.md`** - Priority issues (SURGICAL DEBUG DISCONNECT IS CRITICAL)
4. **`03_REMAINING_TASKS.md`** - 5 sequential tasks with step-by-step actions
5. **`04_INTEGRATION_POINTS.md`** - Code locations, file references, implementation details
6. **`05_NEXT_STEPS.md`** - This prompt (execution protocol)
7. **`06_VERIFICATION_CHECKLIST.md`** - Verification steps for each task (MUST PASS)
8. **`07_ERROR_RECOVERY.md`** - Error recovery protocols for common issues

## 🚨 IMMEDIATE CRITICAL ISSUE
**SURGICAL DEBUG PROTOCOL DISCONNECT**: Tool failures don't trigger surgical debug injection because:
1. Two separate stagnation detectors exist with no coordination
2. Missing `debugInjector.injectDebugger()` call in `executeRunCommand()`
3. Tool escalation alerts don't propagate to debug system

**THIS MUST BE FIXED BEFORE ANY OTHER TASK**

## EXECUTION PROTOCOL (SEQUENTIAL)

### PHASE 1: FIX SURGICAL DEBUG PROTOCOL (TASK 1)
**Objective**: Connect tool stagnation detection to surgical debug injection

**Actions** (detailed in `04_INTEGRATION_POINTS.md`):
1. Examine `src/tools/executor_v2.ts`, method `executeRunCommand()` (lines 346-382)
2. Add `debugInjector.injectDebugger()` call after stagnation alert handling (around line 362)
3. Use agent ID format: `tool-executor-${toolCall.id}` or `tool-${toolCall.name}`
4. Pass context: `{ lastError: errorMessage, stagnationReason: 'command-failure-loop' }`

**Verification** (from `06_VERIFICATION_CHECKLIST.md`):
- [ ] TypeScript compilation passes: `npm run typecheck`
- [ ] `injectDebugger` call exists: `grep -n "injectDebugger" src/tools/executor_v2.ts`
- [ ] No runtime errors in basic execution

**ONLY PROCEED AFTER VERIFICATION PASSES**

### PHASE 2: INTEGRATE NEMOTRON SERVICE (TASK 2)
**Objective**: Copy Nemotron service components and integrate with DualBrainCoordinator

**Actions**:
1. Create directory: `mkdir -p src/nemotron-service`
2. Copy 7 files from nemotron-communication-layer source
3. Update import paths: `sed -i "s@from '\\.\\./@from '../@g" src/nemotron-service/*.ts`
4. Integrate `NemotronEventBus` into `DualBrainCoordinator` (locate or create)

**Verification**:
- [ ] 7 files copied: `ls -la src/nemotron-service/*.ts | wc -l` (should be 7)
- [ ] TypeScript compilation passes
- [ ] Event bus can be instantiated without errors

### PHASE 3: CREATE SHARK CLI LAUNCH SCRIPT (TASK 3)
**Objective**: Implement `shark` command with micro/macro wizard

**Actions**:
1. Create script at `~/OPENCODE_WORKSPACE/.shark/shark` (NOT system-wide initially)
2. Use template from workflow (lines 217-527) with path modifications
3. Make executable: `chmod +x ~/OPENCODE_WORKSPACE/.shark/shark`
4. Test: `~/OPENCODE_WORKSPACE/.shark/shark --help`

**Verification**:
- [ ] Script exists and is executable
- [ ] Help output shows "🦈 SHARK FRANKENSTEIN CLI"
- [ ] Mode selection works (micro/macro/direct)

### PHASE 4: CREATE FRAGMENT FILES (TASK 4)
**Objective**: Create agent-specific instruction fragments

**Actions**:
1. Create directory: `mkdir -p ~/OPENCODE_WORKSPACE/.shark/fragments`
2. Create 4 files: `shark-agent.md`, `kraken-brain.md`, `architect.md`, `code-review.md`
3. Use content from workflow template (lines 539-582)

**Verification**:
- [ ] 4 fragment files exist
- [ ] Files contain appropriate agent instructions

### PHASE 5: CONFIGURE OPENCODE ZEN PROVIDER (TASK 5)
**Objective**: Add free model provider to OpenCode configuration

**Actions**:
1. Check existing config: `ls -la ~/.config/opencode/opencode.json`
2. Add Zen provider configuration (workflow lines 620-632)
3. Test: `opencode --version`

**Verification**:
- [ ] `opencode.json` contains Zen provider
- [ ] OpenCode loads without configuration errors

## EXECUTION CONSTRAINTS

### MANDATORY:
- Execute tasks **SEQUENTIALLY** (1→2→3→4→5)
- **VERIFY EACH TASK** before proceeding (use `06_VERIFICATION_CHECKLIST.md`)
- Document progress after each task
- Update context files if you discover new information
- Use error recovery protocol (`07_ERROR_RECOVERY.md`) if issues arise

### FORBIDDEN:
- Skipping task verification steps
- Proceeding to next task without successful verification
- Modifying core Shark Frankenstein functionality unrelated to integration
- Deleting or corrupting existing working components

## PROGRESS REPORTING FORMAT
Use this format after each task:

```
🦈 KRAKEN ULTRA INTEGRATION - TASK [X] STATUS
- Task: [Task name]
- Status: ✅ COMPLETE / ⚠️ IN PROGRESS / ❌ FAILED
- Changes: [Brief description of changes made]
- Verification: [Pass/Fail with specific check results]
- Next: [Next action to take]
```

## COMPLETION SIGNAL FORMAT
When all 5 tasks complete successfully:

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

## ERROR RECOVERY
If any task fails:
1. **Check `07_ERROR_RECOVERY.md`** for specific recovery procedures
2. **Rollback using git** if code changes cause issues: `git checkout -- src/path/to/file.ts`
3. **Document the error** in context files for future agents
4. **Attempt systematic fix** before giving up

## STARTING POINT
Begin with **PHASE 1: FIX SURGICAL DEBUG PROTOCOL**. This is the critical blocker.

**Project Directory**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/`

**First Command**:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm run typecheck  # Check current compilation status
```

**Then**: Examine `src/tools/executor_v2.ts`, `executeRunCommand()` method and add the missing `debugInjector.injectDebugger()` call.

## CONTEXT LIBRARY UPDATES
As you work, you may discover new information or encounter issues not covered in the context library. If so:
1. Update the relevant markdown file with new information
2. Add error/solution documentation to `07_ERROR_RECOVERY.md`
3. Note any deviations from the planned approach

## TIME EXPECTATION
- **Task 1**: 30 minutes
- **Task 2**: 45 minutes  
- **Task 3**: 30 minutes
- **Task 4**: 20 minutes
- **Task 5**: 15 minutes
- **Total**: ~2.5 hours

---

**BEGIN EXECUTION NOW**. Start with **PHASE 1: FIX SURGICAL DEBUG PROTOCOL DISCONNECT**.

Remember: **VERIFY BEFORE PROCEEDING**. Each task must pass its verification checklist.