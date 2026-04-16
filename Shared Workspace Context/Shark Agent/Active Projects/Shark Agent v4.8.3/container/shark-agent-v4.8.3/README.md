# Shark Agent v4.8.3

**Status:** SHIP READY ✅
**Test Pass Rate:** 13/13 (100%)

## Quick Start

```bash
# Install
npm install

# Build
npm run build

# Run container tests
node src/tools/shark-test-runner-container.js

# Or run opencode with shark agent
opencode run "your task" --agent shark
```

## What Was Fixed

| Issue | File | Fix |
|-------|------|-----|
| L1/L2 check order | `src/hooks/v4.1/guardian-hook.ts` | Checks now run BEFORE identity verification |
| Hardcoded BUILD_CONTEXT | `src/hooks/v4.1/compacting-hook.ts` | Dynamic generation |
| Duplicate state domain | `src/shared/state-store.ts` | Removed duplicate |
| Package identity | `package.json` | `shark-agent` v4.8.3 |
| L6 ANSI codes | `src/tools/shark-test-runner-container.ts` | `stripAnsi()` added |

## Container Testing

The container-aware test runner (`shark-test-runner-container.ts`) auto-detects the container environment and runs actual functional tests rather than file-existence checks.

```bash
# Inside container
CONTAINER=true node src/tools/shark-test-runner-container.js

# Results saved to ContainerTestResult.json
```

## Package Structure

```
├── src/              # TypeScript source
├── dist/             # Compiled JavaScript
├── docs/            # Documentation
├── evidence/        # Test evidence
├── debug-logs/      # Debug reports
├── checkpoints/    # Build checkpoints
└── dist/index.js   # Main bundle (174 modules)
```

## Ship Package

This is a self-contained ship package with:
- All source code with fixes applied
- Compiled bundle
- Container test runner
- All debug logs and evidence
- Checkpoint snapshots
- Full documentation

**Bundle MD5:** `3c33af32115c5a7421fefc768b44a0fb`
**Size:** ~1.5MB