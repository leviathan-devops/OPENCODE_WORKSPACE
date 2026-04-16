# SHARK Agent CLI - Build Context Library

## Overview
This directory contains all files needed to build and test the SHARK-enhanced opencode CLI with 9 architectural firewalls.

## Quick Start

### Build & Test Commands
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/packages/opencode

# 1. Type check
bun typecheck

# 2. Run tests
bun test

# 3. Build binary
bun run build

# 4. Test CLI
./dist/opencode-linux-x64/bin/opencode shark --help
```

### Verification Script
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/packages/opencode

echo "=== SHARK FINAL VERIFICATION ==="
bun typecheck && echo "✅ Type check passed"
bun test test/enforcement/enforcer.test.ts && echo "✅ Unit tests passed"
bun run build && echo "✅ Build successful"
./dist/opencode-linux-x64/bin/opencode --help | grep -q shark && echo "✅ CLI command registered"
```

## Documentation Files

### 1. `BUILD-WORKFLOW.md`
**Purpose**: Step-by-step build instructions for builder agent  
**Contents**: Build phases, verification steps, troubleshooting

### 2. `SHARK-ARCHITECTURE.md`  
**Purpose**: Technical architecture of 9 firewalls  
**Contents**: Firewall implementations, integration points, data flow

### 3. `TESTING-PLAN.md`
**Purpose**: Comprehensive test plan with verification script  
**Contents**: Test phases, expected results, troubleshooting guide

### 4. `CONTEXT-LIBRARY.md`
**Purpose**: Builder agent reference guide  
**Contents**: Project structure, critical files, success criteria

## Source Files

### Core Implementation
- `src/enforcement/` - Central orchestrator + audit logging
- `src/guardian/` - Path protection (Firewalls 1-2)  
- `src/validation/` - 5 validation modules (Firewalls 4-6,7,9)

### Integration Points
- `src/tool/tool.ts` - Enforcement hook (lines 82-91)
- `src/index.ts` - CLI entry point with `SharkCommand`
- `src/cli/cmd/shark.ts` - Shark CLI command implementation

### Supporting Files
- `bin/opencode` - Fixed ES module binary wrapper
- `enforcer.test.ts` - 14 unit tests

## Firewall Status

| Firewall | Module | Status | Test Command |
|----------|--------|--------|--------------|
| 1-2 | Guardian | ✅ | `--test-firewall 1` |
| 4 | Mock Detection | ✅ | `--test-firewall 4` |
| 5 | Theatrical Code | ✅ | `--test-firewall 5` |
| 6 | Style Guide | ✅ | `--test-firewall 6` |
| 7 | Repo Root Tests | ✅ | `--test-firewall 7` |
| 9 | Documentation | ✅ | `--test-firewall 9` |

## Success Criteria

The build is **READY FOR PRODUCTION** when:

1. ✅ `bun typecheck` passes with 0 errors
2. ✅ `bun test` passes all tests (1375+)
3. ✅ `./dist/opencode-linux-x64/bin/opencode shark --help` works
4. ✅ All 9 firewalls block as designed
5. ✅ Audit log is created at `.shark/audit.log`
6. ✅ Normal tool execution is not blocked
7. ✅ CLI is stable and user-friendly

## Next Steps

1. **Execute build** using `BUILD-WORKFLOW.md`
2. **Run tests** using `TESTING-PLAN.md`  
3. **Verify integration** with real tool executions
4. **Document results** in build report

## Troubleshooting

### Common Issues:
- **TypeScript errors**: Check `type` imports in `enforcer.ts`
- **CLI command missing**: Verify `SharkCommand` in `src/index.ts`
- **Binary wrapper errors**: Check ES module imports in `bin/opencode`
- **Firewall not blocking**: Verify `enforceSharkArchitecture` call in `tool.ts`

### Quick Fixes:
```bash
# Disable enforcement if needed
SHARK_DISABLED=1 ./dist/opencode-linux-x64/bin/opencode run "command"

# Check specific integration
grep -n "enforceSharkArchitecture" src/tool/tool.ts
# Should show lines 82-91
```

## Ready for Builder Agent

All files are organized and accessible. The builder agent can now:

1. **Read the documentation** for build guidance
2. **Execute the build** using provided commands  
3. **Verify the implementation** with test scripts
4. **Report results** with clear success/failure indicators

**Build location**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-opencode-integration/packages/opencode`