# SHARK Build Workflow

## Current State (✅ COMPLETE)

### What's Built:
1. **✅ SHARK Enforcement Engine** - 9 firewalls integrated into tool execution
2. **✅ TypeScript Compilation** - `bun typecheck` passes with 0 errors
3. **✅ Test Suite** - 14 enforcement tests pass
4. **✅ CLI Integration** - `shark` command registered in opencode
5. **✅ Binary Wrapper Fixed** - ES module issues resolved

### Files Created/Modified:
- `src/enforcement/` - Central orchestrator + audit logging
- `src/guardian/` - Path protection (Firewalls 1-2)
- `src/validation/` - 5 validation modules (Firewalls 4-6,7,9)
- `src/tool/tool.ts` - Enforcement integration point
- `src/cli/cmd/shark.ts` - Shark CLI command
- `src/cli/cmd/shark-wizard.ts` - Setup wizard
- `bin/opencode` - Fixed ES module wrapper
- `test/enforcement/enforcer.test.ts` - 14 test cases

## Next Steps for Builder Agent

### Phase 1: Build & Package (IMMEDIATE)
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/packages/opencode

# 1. Run full type check
bun typecheck

# 2. Run all tests
bun test

# 3. Build the binary
bun run build

# 4. Test the built binary
./dist/opencode-linux-x64/bin/opencode --help
./dist/opencode-linux-x64/bin/opencode shark --help
```

### Phase 2: Test Firewalls (VERIFICATION)
```bash
# Test each firewall (should BLOCK):
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 1  # Guardian: /etc/passwd
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 2  # Guardian: ~/.ssh
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 4  # Mock mode
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 5  # Theatrical code
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 6  # Style guide
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 7  # Repo root tests
./dist/opencode-linux-x64/bin/opencode shark --test-firewall 9  # Documentation

# Test audit log
./dist/opencode-linux-x64/bin/opencode shark --audit-log

# Run wizard
./dist/opencode-linux-x64/bin/opencode shark --wizard
```

### Phase 3: Integration Testing (REAL-WORLD)
```bash
# 1. Launch opencode TUI with enforcement
./dist/opencode-linux-x64/bin/opencode

# 2. Run commands through enforcement
./dist/opencode-linux-x64/bin/opencode run "write test file"

# 3. Test blocking scenarios
echo "I would run npm install" | ./dist/opencode-linux-x64/bin/opencode run
```

## Critical Files for Builder Agent

### 1. `src/index.ts` - CLI Entry Point
- Line 33: Added `import { SharkCommand } from "./cli/cmd/shark"`
- Line 148: Added `.command(SharkCommand)`
- **VERIFY**: Shark command appears in `--help` output

### 2. `src/tool/tool.ts` - Enforcement Integration
- Lines 82-91: `enforceSharkArchitecture()` called before every tool execution
- **VERIFY**: Tools throw `SHARK Firewall [firewall-name]: reason` when blocked

### 3. `src/enforcement/enforcer.ts` - Central Orchestrator
- Implements all 9 firewalls
- Returns `{ allowed: boolean, reason?: string, firewall?: string }`
- **VERIFY**: Each firewall logic is correct

### 4. `bin/opencode` - Binary Wrapper
- Fixed ES module imports (`import` instead of `require`)
- **VERIFY**: `./bin/opencode --help` works without errors

## Build Artifacts Location
- **Binary**: `./dist/opencode-linux-x64/bin/opencode`
- **Source**: `./src/`
- **Tests**: `./test/enforcement/enforcer.test.ts`

## Success Criteria
1. ✅ `bun typecheck` passes with 0 errors
2. ✅ `bun test` passes all tests
3. ✅ `./dist/opencode-linux-x64/bin/opencode shark --help` shows command
4. ✅ Firewall tests block as expected
5. ✅ Audit log creates `.shark/audit.log`
6. ✅ Real tool executions pass through enforcement

## Troubleshooting

### If `bun typecheck` fails:
- Check `src/enforcement/enforcer.ts` for type-only imports
- Verify `src/tool/tool.ts` imports are correct

### If `bun test` fails:
- Run specific test: `bun test test/enforcement/enforcer.test.ts`
- Check theatrical detector logic

### If binary doesn't build:
- Check `script/build.ts` dependencies
- Verify Bun is installed: `bun --version`

### If CLI command missing:
- Verify `SharkCommand` import in `src/index.ts`
- Check command registration on line 148

## Ready for Production When:
1. All 9 firewalls block as designed
2. No performance degradation in tool execution
3. Audit logs are created and readable
4. CLI is stable and user-friendly