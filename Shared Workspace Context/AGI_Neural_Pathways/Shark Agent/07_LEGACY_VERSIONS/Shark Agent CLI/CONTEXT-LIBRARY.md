# Context Library for Builder Agent

## Project Structure
```
/home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/
├── packages/opencode/                    # Main opencode package
│   ├── src/
│   │   ├── enforcement/                  # SHARK enforcement engine
│   │   │   ├── enforcer.ts              # Central orchestrator (9 firewalls)
│   │   │   └── audit-logger.ts          # Audit logging
│   │   ├── guardian/                    # Path protection (Firewalls 1-2)
│   │   │   └── index.ts                 # Zone classification, safe operations
│   │   ├── validation/                  # Validation modules
│   │   │   ├── mock-detector.ts         # Firewall 4
│   │   │   ├── theatrical-detector.ts   # Firewall 5
│   │   │   ├── style-enforcer.ts        # Firewall 6
│   │   │   ├── test-enforcer.ts         # Firewall 7
│   │   │   ├── doc-validator.ts         # Firewall 9
│   │   │   └── index.ts                 # Exports
│   │   ├── tool/
│   │   │   └── tool.ts                  # Enforcement integration (lines 82-91)
│   │   ├── cli/cmd/
│   │   │   ├── shark.ts                 # Shark CLI command
│   │   │   └── shark-wizard.ts          # Setup wizard
│   │   └── index.ts                     # CLI entry point (SharkCommand added)
│   ├── bin/
│   │   └── opencode                     # Binary wrapper (ES modules fixed)
│   ├── dist/                            # Built binaries
│   │   └── opencode-linux-x64/
│   │       └── bin/opencode             # Working binary
│   └── test/enforcement/
│       └── enforcer.test.ts             # 14 test cases
├── BUILD-WORKFLOW.md                    # Build instructions
├── SHARK-ARCHITECTURE.md               # Technical architecture
├── TESTING-PLAN.md                      # Comprehensive test plan
└── CONTEXT-LIBRARY.md                   # This file
```

## Critical Integration Points

### 1. Tool Execution Hook (`src/tool/tool.ts:82-91`)
```typescript
// ADDED: SHARK enforcement before tool execution
const enforcement = await enforceSharkArchitecture({
  tool: id,
  args,
  sessionID: ctx.sessionID,
  workspacePath: Instance.directory
}, getAuditLogger())

if (!enforcement.allowed) {
  throw new Error(`SHARK Firewall [${enforcement.firewall}]: ${enforcement.reason}`)
}
```

### 2. CLI Command Registration (`src/index.ts`)
```typescript
// Line 33: Import added
import { SharkCommand } from "./cli/cmd/shark"

// Line 148: Command registered
.command(SharkCommand)
```

### 3. Binary Wrapper Fix (`bin/opencode`)
- **Problem**: Used `require()` in ES module
- **Solution**: Converted to `import` statements
- **Status**: ✅ Fixed

## Build Commands

### Essential Commands
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/packages/opencode

# 1. Type check
bun typecheck

# 2. Run tests
bun test

# 3. Build binary
bun run build

# 4. Test binary
./dist/opencode-linux-x64/bin/opencode --help
```

### Quick Verification
```bash
# Verify all components
./verify-shark.sh  # See TESTING-PLAN.md for script
```

## Key Files to Verify

### 1. `src/enforcement/enforcer.ts`
- **Purpose**: Central orchestrator for 9 firewalls
- **Check**: All firewalls implemented (1-2, 4-7, 9)
- **Test**: `./dist/... shark --test-firewall <N>` for N in [1,2,4,5,6,7,9]

### 2. `src/tool/tool.ts`
- **Purpose**: Enforcement integration point
- **Check**: Lines 82-91 exist and call `enforceSharkArchitecture()`
- **Test**: Any tool execution should pass through enforcement

### 3. `src/index.ts`
- **Purpose**: CLI entry point
- **Check**: `SharkCommand` imported and registered
- **Test**: `./dist/... --help` shows `shark` command

### 4. `bin/opencode`
- **Purpose**: Binary wrapper
- **Check**: Uses ES module imports (`import` not `require`)
- **Test**: `./bin/opencode --help` works without errors

## Firewall Implementation Status

| Firewall | Module | Status | Test Command |
|----------|--------|--------|--------------|
| 1-2 | `guardian/index.ts` | ✅ | `--test-firewall 1` |
| 4 | `validation/mock-detector.ts` | ✅ | `--test-firewall 4` |
| 5 | `validation/theatrical-detector.ts` | ✅ | `--test-firewall 5` |
| 6 | `validation/style-enforcer.ts` | ✅ | `--test-firewall 6` |
| 7 | `validation/test-enforcer.ts` | ✅ | `--test-firewall 7` |
| 9 | `validation/doc-validator.ts` | ✅ | `--test-firewall 9` |

## Testing Strategy

### 1. Build Verification
```bash
bun typecheck  # Must pass with 0 errors
bun test       # Must pass all tests
bun run build  # Must create binary
```

### 2. CLI Verification
```bash
./dist/opencode-linux-x64/bin/opencode shark --help  # Must show help
./dist/opencode-linux-x64/bin/opencode --help | grep shark  # Must list command
```

### 3. Firewall Verification
```bash
# Each should show "BLOCKED"
for i in 1 2 4 5 6 7 9; do
  ./dist/opencode-linux-x64/bin/opencode shark --test-firewall $i
done
```

### 4. Integration Verification
```bash
# Should work (allowed)
echo "test" | ./dist/opencode-linux-x64/bin/opencode run "write test.txt --content 'normal code'"

# Should block (mock mode)
echo "I would run" | ./dist/opencode-linux-x64/bin/opencode run
```

## Common Issues & Solutions

### Issue: TypeScript compilation errors
**Solution**: Check `type` imports in `enforcer.ts`
```typescript
// Correct:
import { type AuditEntry } from './audit-logger'
import { type GuardianResult } from '@/guardian'

// Wrong:
import { AuditEntry } from './audit-logger'
```

### Issue: CLI command not showing
**Solution**: Verify command registration in `src/index.ts`
```typescript
// Should have:
import { SharkCommand } from "./cli/cmd/shark"
// ... and later:
.command(SharkCommand)
```

### Issue: Binary wrapper errors
**Solution**: Check ES module imports in `bin/opencode`
```javascript
// Correct:
import { spawnSync } from "child_process"
import { existsSync } from "fs"

// Wrong:
const childProcess = require("child_process")
const fs = require("fs")
```

### Issue: Firewall not blocking
**Solution**: Check `enforceSharkArchitecture` call in `tool.ts`
- Must be before `execute(args, ctx)` call
- Must throw error when `!enforcement.allowed`

## Success Criteria

The builder agent has **SUCCESSFULLY COMPLETED** when:

1. ✅ `bun typecheck` passes with 0 errors
2. ✅ `bun test` passes all tests (1375+)
3. ✅ `./dist/opencode-linux-x64/bin/opencode shark --help` works
4. ✅ All 9 firewalls block as designed
5. ✅ Audit log is created at `.shark/audit.log`
6. ✅ Normal tool execution is not blocked
7. ✅ CLI is stable and user-friendly

## Next Steps After Build

Once verification passes:

1. **Documentation**: Update README with SHARK features
2. **Packaging**: Create install script for `shark` command
3. **Testing**: Run extended real-world tests
4. **Deployment**: Package for distribution

## Emergency Rollback

If SHARK causes issues:
```bash
# Disable enforcement
SHARK_DISABLED=1 ./dist/opencode-linux-x64/bin/opencode run "command"

# Or use disable flag
./dist/opencode-linux-x64/bin/opencode shark --disable
```

## Support Files

- **`BUILD-WORKFLOW.md`**: Step-by-step build instructions
- **`SHARK-ARCHITECTURE.md`**: Technical architecture details
- **`TESTING-PLAN.md`**: Comprehensive test plan with scripts
- **`CONTEXT-LIBRARY.md`**: This file - builder agent reference

## Ready for Builder Agent

The builder agent should now:
1. Read `BUILD-WORKFLOW.md` for build steps
2. Follow `TESTING-PLAN.md` for verification
3. Refer to `SHARK-ARCHITECTURE.md` for technical details
4. Use this `CONTEXT-LIBRARY.md` as quick reference

**All files are in place. The builder agent can now execute the build and verification process.**