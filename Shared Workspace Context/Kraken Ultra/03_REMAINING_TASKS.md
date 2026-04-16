# Kraken Ultra Integration - Remaining Tasks

## Task List (Sequential Execution)

### 🟢 TASK 1: Complete Surgical Debug Protocol Integration

**Objective**: Connect tool stagnation detection to surgical debug injection
**Priority**: HIGH (Critical blocker)
**Estimated Time**: 30 minutes

**Actions**:
1. **Examine current implementation** in `src/tools/executor_v2.ts`
   - Method: `executeRunCommand()` (lines 346-382)
   - Current stagnation handling: lines 350-362
   - AutoDebug analysis: lines 364-382

2. **Add DebugInjector call** for escalation alerts
   ```typescript
   if (stagnationAlert && stagnationAlert.type === 'escalation') {
     const injectionResult = await this.debugInjector.injectDebugger(
       `tool-${toolCall.name}`,
       {
         lastError: errorMessage,
         stagnationReason: 'tool-failure-loop'
       }
     );
     
     if (injectionResult.success) {
       this.log(`🔧 Surgical debug injected: ${injectionResult.debugAgentId}`);
     }
   }
   ```

3. **Coordinate stagnation detectors**
   - Share failure data between tool detector and surgical detector
   - Consider creating adapter or unified interface

4. **Test integration**
   - Simulate repeated command failures
   - Verify debug injection triggers
   - Check surgical debug agent creation

**Verification**:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm run typecheck  # Should pass
```

**Success Criteria**:
- Tool escalation alerts trigger surgical debug injection
- TypeScript compilation passes
- No runtime errors in basic execution

### 🟡 TASK 2: Integrate Nemotron Event-Driven Service

**Objective**: Copy Nemotron service components and integrate with DualBrainCoordinator
**Priority**: MEDIUM
**Estimated Time**: 45 minutes

**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/`
**Destination**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/src/nemotron-service/`

**Actions**:
1. **Create destination directory**
   ```bash
   mkdir -p src/nemotron-service
   ```

2. **Copy all source files**
   ```bash
   cp /home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/*.ts src/nemotron-service/
   ```

3. **Update import paths** in copied files
   ```bash
   find src/nemotron-service -name "*.ts" -exec sed -i "s@from '\\.\\./@from '../@g" {} \;
   ```

4. **Integrate NemotronEventBus** into coordinator
   - Locate or create `DualBrainCoordinator`
   - Import `NemotronEventBus`
   - Emit events for: task start, completion, error
   - Subscribe to relevant events

5. **Add token sizing logic** to message classification
   - Ensure messages are auto-sized (2k/4k/6k/8k)
   - Implement "more context" request handling

**Verification**:
```bash
# Check files copied
ls -la src/nemotron-service/
# Count files (should be 7)
# TypeScript compilation
npm run typecheck
```

**Success Criteria**:
- All 7 Nemotron files copied to shark-frankenstein
- TypeScript compilation passes
- Event bus can be instantiated without errors

### 🟡 TASK 3: Create Shark CLI Launch Script

**Objective**: Implement `shark` command with micro/macro wizard
**Priority**: MEDIUM  
**Estimated Time**: 30 minutes

**Note**: Create script in workspace first (`~/OPENCODE_WORKSPACE/.shark/shark`), not system-wide

**Actions**:
1. **Create script directory**
   ```bash
   mkdir -p ~/OPENCODE_WORKSPACE/.shark
   ```

2. **Create script from template** (workflow lines 217-527)
   - Use template but modify installation path
   - Change `/usr/local/bin/shark` to `~/OPENCODE_WORKSPACE/.shark/shark`
   - Add setup instructions for symlink creation

3. **Make executable**
   ```bash
   chmod +x ~/OPENCODE_WORKSPACE/.shark/shark
   ```

4. **Test basic functionality**
   ```bash
   ~/OPENCODE_WORKSPACE/.shark/shark --help
   ~/OPENCODE_WORKSPACE/.shark/shark --micro "test"
   ~/OPENCODE_WORKSPACE/.shark/shark --macro "test"
   ```

5. **Add symlink instructions** for user
   ```bash
   echo "To install system-wide: sudo ln -s ~/OPENCODE_WORKSPACE/.shark/shark /usr/local/bin/shark"
   ```

**Verification**:
```bash
# Test script
~/OPENCODE_WORKSPACE/.shark/shark --help 2>&1 | head -10
# Should show "🦈 SHARK FRANKENSTEIN CLI"
```

**Success Criteria**:
- Script exists at `~/OPENCODE_WORKSPACE/.shark/shark`
- Script is executable
- Help output shows Shark Frankenstein branding
- Mode selection works (micro/macro/direct)

### 🟠 TASK 4: Create Fragment Files

**Objective**: Create agent-specific instruction fragments
**Priority**: LOW
**Estimated Time**: 20 minutes

**Location**: `~/OPENCODE_WORKSPACE/.shark/fragments/`

**Actions**:
1. **Create fragment directory**
   ```bash
   mkdir -p ~/OPENCODE_WORKSPACE/.shark/fragments
   ```

2. **Create fragment files** (4 files):
   - `shark-agent.md` - Instructions for Shark Agent (hephaestus)
   - `kraken-brain.md` - Instructions for Kraken Brain (sisyphus)
   - `architect.md` - Instructions for Architect (oracle)
   - `code-review.md` - Instructions for Code Review (momus)

3. **Populate with content** from workflow template (lines 539-582)

4. **Verify file structure**
   ```bash
   ls -la ~/OPENCODE_WORKSPACE/.shark/fragments/
   # Should show 4 .md files
   ```

**Verification**:
```bash
# Check files exist
ls ~/OPENCODE_WORKSPACE/.shark/fragments/*.md | wc -l
# Should output 4
```

**Success Criteria**:
- 4 fragment files created
- Files contain appropriate agent instructions
- Files are readable Markdown

### 🟠 TASK 5: Configure OpenCode Zen Provider

**Objective**: Add free model provider to OpenCode configuration
**Priority**: LOW
**Estimated Time**: 15 minutes

**Location**: `~/.config/opencode/opencode.json`

**Actions**:
1. **Check if opencode.json exists**
   ```bash
   ls -la ~/.config/opencode/opencode.json
   ```

2. **Backup existing config** (if exists)
   ```bash
   cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup
   ```

3. **Add Zen provider configuration** (see workflow lines 620-632)
   - Provider name: `0-opencode-zen`
   - Base URL: `https://opencode.ai/zen/v1/chat/completions`
   - Models: `minimax-m2.5-free`, `mimo-v2-omni-free`, `nemotron-3-super-free`

4. **Update model mappings** in opencode.json
   - Ensure Zen provider is in `providers` section
   - Update `model` field if needed

5. **Test configuration**
   ```bash
   opencode --version
   # Should load without configuration errors
   ```

**Verification**:
```bash
# Check config loads
opencode --help 2>&1 | head -5
# No error messages about missing provider
```

**Success Criteria**:
- `opencode.json` contains Zen provider configuration
- OpenCode loads without configuration errors
- Zen models appear in available providers

## Task Dependencies
```
TASK 1 (Surgical Debug) → TASK 2 (Nemotron) → TASK 3 (CLI Script) → TASK 4 (Fragments) → TASK 5 (Zen Provider)
```

## Completion Criteria
All tasks must pass their verification checks before proceeding to next agent.

---
**Last Updated**: March 30, 2026  
**Context Version**: 1.0  
**Execution Order**: Sequential (1→2→3→4→5)