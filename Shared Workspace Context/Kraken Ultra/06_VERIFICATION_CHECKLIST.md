# Kraken Ultra Integration - Verification Checklist

## Verification Protocol
**Rule**: Each task MUST pass ALL verification checks before proceeding to next task.

## Task 1: Surgical Debug Protocol Integration

### ✅ VERIFICATION CHECKS

#### 1. TypeScript Compilation
**Command**:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm run typecheck
```

**Expected Result**: 
- Zero TypeScript errors
- Compilation completes successfully

**Failure Action**:
- Fix import errors first
- Check DebugInjector import path
- Verify method signatures match

#### 2. DebugInjector Integration
**Check**: ToolExecutor constructor initializes debugInjector
**File**: `src/tools/executor_v2.ts`
**Lines**: Around 84
```typescript
this.debugInjector = this.autoDebug.getDebugInjector();
```

**Verification**:
```bash
grep -n "debugInjector" src/tools/executor_v2.ts | head -5
# Should show property, constructor initialization, and usage
```

#### 3. Escalation Alert Connection
**Check**: `executeRunCommand()` calls `debugInjector.injectDebugger()`
**File**: `src/tools/executor_v2.ts`
**Location**: After stagnation alert handling (around line 362)

**Verification**:
```bash
# Check for injectDebugger call
grep -n "injectDebugger" src/tools/executor_v2.ts
# Should show at least one call
```

#### 4. Basic Runtime Test
**Test**: Create simple test to verify no runtime errors
```bash
# Create test script
cat > /tmp/test-surgical.js << 'EOF'
const { ToolExecutor } = require('./dist/tools/executor_v2.js');
console.log('ToolExecutor loaded successfully');
EOF

# Run test (if build exists)
node /tmp/test-surgical.js 2>&1
```

**Expected**: No unhandled exceptions or import errors

### 📊 TASK 1 VERIFICATION MATRIX

| Check | Command | Expected Result | Status |
|-------|---------|----------------|--------|
| TypeScript Compilation | `npm run typecheck` | Zero errors | |
| DebugInjector Property | `grep -n "debugInjector" src/tools/executor_v2.ts` | Shows property & initialization | |
| injectDebugger Call | `grep -n "injectDebugger" src/tools/executor_v2.ts` | At least one call found | |
| No Runtime Errors | Simple import test | No exceptions | |

## Task 2: Nemotron Service Integration

### ✅ VERIFICATION CHECKS

#### 1. Files Copied
**Check**: All 7 source files copied to destination
```bash
ls -la src/nemotron-service/*.ts | wc -l
# Expected: 7
```

**Files Expected**:
- `compression.ts`
- `message-classifier.ts`
- `nemotron-bridge.ts`
- `routing.ts`
- `service.ts`
- `types.ts`
- `index.ts`

#### 2. Import Paths Updated
**Check**: No `../../` patterns in copied files
```bash
grep -r "from '../../" src/nemotron-service/ 2>/dev/null
# Expected: No results (or only intentional deep imports)
```

#### 3. TypeScript Compilation
**Command**:
```bash
npm run typecheck
```

**Expected**: No import errors for nemotron-service files

#### 4. Event Bus Instantiation
**Test**: Can import and instantiate NemotronEventBus
```typescript
// Quick test
import { NemotronEventBus } from './src/nemotron-service/service';
const bus = new NemotronEventBus();
console.log('Event bus created');
```

### 📊 TASK 2 VERIFICATION MATRIX

| Check | Command | Expected Result | Status |
|-------|---------|----------------|--------|
| Files Count | `ls src/nemotron-service/*.ts \| wc -l` | 7 files | |
| Import Paths | `grep -r "from '../../" src/nemotron-service/` | No results | |
| TypeScript | `npm run typecheck` | Zero errors | |
| Event Bus | Simple import test | No errors | |

## Task 3: Shark CLI Launch Script

### ✅ VERIFICATION CHECKS

#### 1. Script Exists
```bash
ls -la ~/OPENCODE_WORKSPACE/.shark/shark
# Expected: File exists, executable permission
```

#### 2. Executable Permission
```bash
test -x ~/OPENCODE_WORKSPACE/.shark/shark && echo "Executable" || echo "Not executable"
# Expected: "Executable"
```

#### 3. Help Output
```bash
~/OPENCODE_WORKSPACE/.shark/shark --help 2>&1 | head -3
# Expected: Shows "🦈 SHARK FRANKENSTEIN CLI"
```

#### 4. Mode Selection
```bash
~/OPENCODE_WORKSPACE/.shark/shark --micro "test" 2>&1 | head -2
# Expected: Shows micro mode detection or launch
```

### 📊 TASK 3 VERIFICATION MATRIX

| Check | Command | Expected Result | Status |
|-------|---------|----------------|--------|
| File Exists | `ls -la ~/OPENCODE_WORKSPACE/.shark/shark` | File exists | |
| Executable | `test -x ~/OPENCODE_WORKSPACE/.shark/shark` | Is executable | |
| Help Output | `~/OPENCODE_WORKSPACE/.shark/shark --help` | Shows Shark branding | |
| Mode Detection | `~/OPENCODE_WORKSPACE/.shark/shark --micro "test"` | Recognizes micro mode | |

## Task 4: Fragment Files Creation

### ✅ VERIFICATION CHECKS

#### 1. Directory Exists
```bash
ls -la ~/OPENCODE_WORKSPACE/.shark/fragments/
# Expected: Directory exists with 4 .md files
```

#### 2. File Count
```bash
ls ~/OPENCODE_WORKSPACE/.shark/fragments/*.md 2>/dev/null | wc -l
# Expected: 4
```

#### 3. File Names
**Expected Files**:
- `shark-agent.md`
- `kraken-brain.md`
- `architect.md`
- `code-review.md`

#### 4. Content Check
```bash
head -5 ~/OPENCODE_WORKSPACE/.shark/fragments/shark-agent.md
# Expected: Shows "# Shark Agent Instructions" or similar
```

### 📊 TASK 4 VERIFICATION MATRIX

| Check | Command | Expected Result | Status |
|-------|---------|----------------|--------|
| Directory | `ls -la ~/OPENCODE_WORKSPACE/.shark/fragments/` | Directory exists | |
| File Count | `ls *.md \| wc -l` | 4 files | |
| File Names | `ls *.md` | All 4 expected files | |
| Content | `head -5 shark-agent.md` | Contains instructions | |

## Task 5: OpenCode Zen Provider

### ✅ VERIFICATION CHECKS

#### 1. Config File Exists
```bash
ls -la ~/.config/opencode/opencode.json
# Expected: File exists
```

#### 2. Zen Provider Configuration
```bash
grep -i "opencode-zen" ~/.config/opencode/opencode.json
# Expected: Shows provider configuration
```

#### 3. OpenCode Loads
```bash
opencode --version 2>&1 | head -2
# Expected: Shows version without configuration errors
```

#### 4. No Provider Errors
```bash
opencode --help 2>&1 | grep -i "error\|missing\|invalid"
# Expected: No error messages
```

### 📊 TASK 5 VERIFICATION MATRIX

| Check | Command | Expected Result | Status |
|-------|---------|----------------|--------|
| Config File | `ls -la ~/.config/opencode/opencode.json` | File exists | |
| Zen Provider | `grep "opencode-zen" opencode.json` | Configuration present | |
| OpenCode Load | `opencode --version` | Shows version | |
| No Errors | `opencode --help \| grep -i error` | No error messages | |

## Final Integration Verification

### Comprehensive Test Suite
**After ALL tasks complete**:

#### 1. Full TypeScript Compilation
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm run typecheck 2>&1 | tail -20
# Expected: No errors
```

#### 2. Build Test
```bash
npm run build 2>&1 | tail -10
# Expected: Build succeeds
```

#### 3. Integration Smoke Test
```bash
# Test key components can be imported
cat > /tmp/integration-test.js << 'EOF'
console.log('Testing Kraken Ultra Integration...');
// Add specific component tests
EOF
```

#### 4. Git Status Check
```bash
git status --porcelain | head -10
# Check for uncommitted changes
```

## Verification Failure Protocol

### If Verification Fails:
1. **DO NOT** proceed to next task
2. **Diagnose** using error messages
3. **Fix** the issue
4. **Re-run** verification
5. **Document** the fix in context files

### Common Issues & Solutions:
- **TypeScript errors**: Check imports, update paths
- **Missing files**: Verify copy commands executed correctly
- **Permission errors**: Use `chmod +x` for scripts
- **Configuration errors**: Check JSON syntax, backup original

## Verification Log
Use this template to log verification results:

```
## TASK [X] VERIFICATION LOG
- Date: [Timestamp]
- Agent: [Agent name]
- Task: [Task description]

### Checks:
1. [Check name]: ✅ PASS / ❌ FAIL
   - Details: [Output/error]

2. [Check name]: ✅ PASS / ❌ FAIL
   - Details: [Output/error]

### Overall Status: ✅ VERIFIED / ❌ FAILED
- Next Action: [Proceed to next task / Fix issues]
```

---
**Verification Principle**: Trust but verify. Every integration point must be validated.