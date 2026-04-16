# Kraken Ultra Integration - Error Recovery Protocol

## Recovery Principles
1. **Minimal disruption**: Fix only what's broken, preserve working components
2. **Incremental rollback**: Step back through changes until stable state
3. **Documentation**: Record errors and solutions for future agents
4. **Systematic approach**: Diagnose → Isolate → Fix → Verify

## Common Error Categories & Recovery Procedures

### Category 1: TypeScript Compilation Errors

#### Symptoms:
- `npm run typecheck` fails
- Import errors, type mismatches, missing modules

#### Recovery Steps:
1. **Identify error source**:
   ```bash
   npm run typecheck 2>&1 | grep -A5 -B5 "error TS"
   ```

2. **Fix import paths** (most common):
   ```bash
   # For nemotron-service imports
   find src/nemotron-service -name "*.ts" -exec sed -i "s@from '\\.\\./@from '../@g" {} \;
   
   # For surgical-debug imports  
   find src/surgical-debug -name "*.ts" -exec sed -i "s@from '\\.\\./@from '../@g" {} \;
   ```

3. **Check missing dependencies**:
   ```bash
   grep -r "import.*from" src/ | grep "Cannot find module"
   ```

4. **Rollback problematic file**:
   ```bash
   git checkout -- src/path/to/problematic-file.ts
   ```

#### Specific Error Patterns:

**Error TS2307: Cannot find module**
```bash
# Find and fix import
sed -i "s@from '../old/path'@from './new/path'@g" src/file.ts
```

**Error TS2345: Argument of type 'X' is not assignable**
- Check interface compatibility
- Add type assertions if appropriate: `as DesiredType`

**Error TS2554: Expected X arguments, got Y**
- Check method signatures in copied files
- Update calls to match new interface

### Category 2: File Copy/Integration Errors

#### Symptoms:
- Missing files after copy operations
- Permission errors
- Incorrect file locations

#### Recovery Steps:
1. **Verify source files exist**:
   ```bash
   ls -la /home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/
   # Should show 7 .ts files
   ```

2. **Recopy missing files**:
   ```bash
   mkdir -p src/nemotron-service
   cp /home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/*.ts src/nemotron-service/
   ```

3. **Check permissions**:
   ```bash
   chmod +x ~/OPENCODE_WORKSPACE/.shark/shark  # For CLI script
   ```

4. **Verify directory structure**:
   ```bash
   find src -name "*.ts" -type f | grep -E "(nemotron|surgical|anti-hallucination)" | sort
   ```

### Category 3: Runtime/Execution Errors

#### Symptoms:
- Script crashes on execution
- Unhandled exceptions
- Missing dependencies

#### Recovery Steps:
1. **Enable verbose logging**:
   ```bash
   # Add debug logging to ToolExecutor
   sed -i 's/private verbose = false;/private verbose = true;/g' src/tools/executor_v2.ts
   ```

2. **Test incrementally**:
   ```bash
   # Test individual component
   node -e "const { DebugInjector } = require('./dist/surgical-debug/injector'); console.log('OK');"
   ```

3. **Check for circular dependencies**:
   ```bash
   npx madge --circular src/
   ```

4. **Add error handling**:
   ```typescript
   try {
     // Problematic code
   } catch (error) {
     console.error(`Recoverable error: ${error.message}`);
     // Fallback behavior
   }
   ```

### Category 4: Configuration Errors

#### Symptoms:
- OpenCode fails to load
- Missing provider errors
- Invalid JSON syntax

#### Recovery Steps:
1. **Backup original config**:
   ```bash
   cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup
   ```

2. **Validate JSON syntax**:
   ```bash
   python3 -m json.tool ~/.config/opencode/opencode.json > /tmp/validated.json && mv /tmp/validated.json ~/.config/opencode/opencode.json
   ```

3. **Check provider configuration**:
   ```bash
   grep -n "0-opencode-zen" ~/.config/opencode/opencode.json
   ```

4. **Test with minimal config**:
   ```bash
   # Create minimal test config
   cat > /tmp/test-config.json << 'EOF'
   {
     "$schema": "https://opencode.ai/config.json",
     "plugin": ["opencode-ultra"],
     "model": "0-glm-coding/glm-5"
   }
   EOF
   
   OPENCODE_CONFIG_DIR=/tmp opencode --version
   ```

### Category 5: Git/Version Control Issues

#### Symptoms:
- Uncommitted changes causing conflicts
- Merge conflicts
- Lost changes

#### Recovery Steps:
1. **Check current status**:
   ```bash
   git status
   git diff --name-only
   ```

2. **Stash changes** (temporary save):
   ```bash
   git stash push -m "WIP: Kraken Ultra integration"
   ```

3. **Reset to clean state**:
   ```bash
   # Soft reset (keep changes as unstaged)
   git reset --soft HEAD~1
   
   # Hard reset (discard changes)
   git reset --hard HEAD
   ```

4. **Selective rollback**:
   ```bash
   # Rollback specific integration directories
   git checkout -- src/nemotron-service/
   git checkout -- src/surgical-debug/
   git checkout -- src/anti-hallucination/
   ```

## Task-Specific Recovery Procedures

### Task 1: Surgical Debug Protocol
**Common issues**:
- DebugInjector not initialized
- Missing injectDebugger call
- Stagnation detector mismatch

**Recovery**:
```bash
# Check initialization
grep -n "debugInjector" src/tools/executor_v2.ts

# Add missing call if needed
# Use template from 04_INTEGRATION_POINTS.md
```

### Task 2: Nemotron Service
**Common issues**:
- Missing files after copy
- Import path errors
- Type mismatches

**Recovery**:
```bash
# Recopy all files
rm -rf src/nemotron-service
mkdir -p src/nemotron-service
cp /home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/*.ts src/nemotron-service/

# Fix imports
find src/nemotron-service -name "*.ts" -exec sed -i "s@from '\\.\\./@from '../@g" {} \;
```

### Task 3: Shark CLI Script
**Common issues**:
- Permission denied
- Script not found
- Syntax errors

**Recovery**:
```bash
# Recreate script
cat > ~/OPENCODE_WORKSPACE/.shark/shark << 'EOF'
#!/bin/bash
# Script content...
EOF

# Set permissions
chmod +x ~/OPENCODE_WORKSPACE/.shark/shark
```

### Task 4: Fragment Files
**Common issues**:
- Missing directory
- Incorrect file names
- Empty files

**Recovery**:
```bash
# Recreate directory and files
rm -rf ~/OPENCODE_WORKSPACE/.shark/fragments
mkdir -p ~/OPENCODE_WORKSPACE/.shark/fragments
# Copy from workflow template or recreate
```

### Task 5: OpenCode Zen Provider
**Common issues**:
- Invalid JSON
- Missing provider config
- OpenCode load failures

**Recovery**:
```bash
# Restore from backup
cp ~/.config/opencode/opencode.json.backup ~/.config/opencode/opencode.json

# Add Zen provider incrementally
# Use minimal addition approach
```

## Emergency Rollback Procedures

### Complete Rollback (Nuclear Option)
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein

# Rollback all Kraken Ultra changes
git checkout -- src/anti-hallucination/
git checkout -- src/surgical-debug/
git checkout -- src/nemotron-service/ 2>/dev/null || true
git checkout -- src/tools/executor_v2.ts
git checkout -- src/debug/autodebug.ts

# Remove created directories
rm -rf src/nemotron-service 2>/dev/null || true

# Clean build
npm run clean
npm run build
```

### Partial Rollback (Selective)
```bash
# Rollback specific component
COMPONENT="nemotron-service"  # or "surgical-debug", "anti-hallucination"
git checkout -- src/$COMPONENT/
npm run typecheck
```

## Diagnostic Commands

### System Health Check
```bash
# TypeScript compilation
npm run typecheck 2>&1 | tail -20

# File structure
find src -name "*.ts" -type f | grep -E "(nemotron|surgical|anti)" | sort

# Import verification
grep -r "import.*from" src/ | grep -v "node_modules" | head -20

# Dependencies
npm ls --depth=0
```

### Integration Point Verification
```bash
# Check key integration points
grep -n "DebugInjector" src/tools/executor_v2.ts
grep -n "NemotronEventBus" src/brain/*.ts 2>/dev/null || echo "Not found"
grep -n "injectDebugger" src/tools/executor_v2.ts
```

## Error Documentation Template
When encountering new errors, document them here:

```
## New Error: [Error description]
- Date: [Timestamp]
- Task: [Which task failed]
- Symptoms: [Error messages, behavior]
- Root Cause: [Analysis]
- Solution: [Steps taken]
- Prevention: [How to avoid in future]
```

## Recovery Success Verification
After recovery, verify with:
```bash
# Basic health check
npm run typecheck
npm run build 2>&1 | tail -5

# Key functionality test
node -e "console.log('Integration points operational')"
```

---
**Recovery Priority**: Fix → Verify → Document → Continue  
**Backup Strategy**: Always backup before major changes  
**Documentation Rule**: Every recovery action must be documented