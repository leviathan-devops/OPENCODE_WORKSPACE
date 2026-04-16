# Shark Agent v4.8.1 Reload Package

**Version:** 4.8.1  
**Date:** April 9, 2026  
**Container Test:** 10/10 PASS (100%)  

## Contents

```
v4.8.1/
├── src/                      # Source code
│   ├── hooks/v4.1/          # Guardian, Gate, Session hooks
│   ├── shared/              # Guardian, Gates, Evidence
│   └── tools/               # shark-test-runner, etc.
├── dist/                    # Built plugin (index.js 1.0 MB)
├── package.json
├── container/                # Docker container for testing
│   ├── Dockerfile
│   ├── opencode-config.json
│   └── shark-agent-v481/
├── ContainerTestResult.json  # Container test evidence
├── changelog.md
├── build-log.md
└── debug-log.md
```

## Quick Reset

```bash
# If build breaks, restore from reload:
cp -r /home/leviathan/OPENCODE_WORKSPACE/.shark/reload/v4.8.1/src/* \
      /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/

cp -r /home/leviathan/OPENCODE_WORKSPACE/.shark/reload/v4.8.1/dist/* \
      /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/
```

## Ship History

- **v4.8.0** (2026-04-08): FAILED - deployed without container test
- **v4.8.1** (2026-04-09): PASSED - 100% container test

## Firewall Layers

| Layer | Status | Description |
|-------|--------|-------------|
| L1 | ✅ | Identity Wall - getCurrentAgent() |
| L2 | ✅ | Deployment Guard - blocks ship without test |
| L3 | ✅ | Container Test Block - hard block |
| L4 | ✅ | Slop Detector - file existence |
| L5 | ✅ | Escape Hatch REMOVED |
| L6 | ✅ | Sudo System - opencode.json protection |
| ANTI-SPOOF | ✅ | Blocks grep/wc/cat verification |

## To Reinstall Plugin

```bash
# Build
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun run build

# Copy to plugins folder
cp -r dist /home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v481/

# Update opencode.json to point to new plugin (NOTE: path is to DIRECTORY, not /dist suffix!)
# Change: file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v47/dist
# To:     file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v481
# WRONG:  file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v481/dist  (will fail!)
# CORRECT: file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v481     (no /dist suffix)
```

## Known Issues / TODO

### Ship Gate Missing opencode.json Path Validation
**Severity:** CRITICAL  

Ship gate checks for ContainerTestResult.json but does NOT verify that opencode.json plugin paths point to existing files.

**Required Fix:** Add `validate opencode.json plugin paths exist` to ship gate.

### Container Test Doesn't Actually Load Opencode
**Severity:** HIGH  

Container test ran but never actually launched opencode with the plugin to verify it works.

---
