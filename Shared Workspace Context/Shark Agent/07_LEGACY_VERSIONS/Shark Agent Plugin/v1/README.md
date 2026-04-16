# 🦈 Shark Agent Plugin - Testing Workspace

## Overview
This workspace contains comprehensive testing tools and documentation for verifying the shark-agent-plugin installation and enforcement capabilities.

## Current Status
- **Plugin**: shark-agent-plugin v1.0.0
- **OpenCode**: 1.3.7
- **Migration**: Completed (replaced opencode-ultra)
- **Backup**: Available at `/home/leviathan/.config/opencode/opencode.json.backup.20260331_014731`

## Directory Structure
```
Shark Agent Plugin/
├── README.md                    # This file
├── TEST_PLAN.md                 # Comprehensive testing plan
├── TEST_SCRIPTS.md              # Automated test scripts
├── VERIFICATION_CHECKLIST.md    # Verification checklist
├── scripts/                     # Test automation scripts
│   ├── run-all-tests.sh         # Run all verification tests
│   ├── test-guardian.sh         # Test guardian protection
│   ├── test-opencode.sh         # Test OpenCode integration
│   └── test-rollback.sh         # Test rollback functionality
├── logs/                        # Test logs (generated during testing)
├── results/                     # Test results (generated during testing)
└── testing/                     # Existing documentation
    ├── ARCHITECTURE.md
    ├── BUILD_TEAM_IMPLEMENTATION_PLAN.md
    ├── CURRENT_STATE.md
    ├── NEXT_STEPS.md
    ├── PROJECT_OVERVIEW.md
    ├── ROADMAP.md
    ├── SHARK_AGENT_PLUGIN_ARCHITECTURE.md
    └── TECHNICAL_SPECIFICATION.md
```

## Quick Start

### 1. Run All Tests
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent Plugin"
./scripts/run-all-tests.sh
```

### 2. Test Specific Components
```bash
# Test Guardian protection
./scripts/test-guardian.sh

# Test OpenCode integration
./scripts/test-opencode.sh

# Test rollback functionality
./scripts/test-rollback.sh
```

### 3. Manual Verification
Follow the step-by-step guide in `VERIFICATION_CHECKLIST.md`

## Test Results
Test results will be saved to:
- `logs/test-YYYYMMDD-HHMMSS.log` - Complete test log
- `results/summary-YYYYMMDD-HHMMSS.md` - Test summary

## Important Notes
1. The plugin is currently active in OpenCode
2. Rollback is available if testing causes issues
3. All tests are non-destructive (read-only or use /tmp)
4. Guardian will block attempts to write to sensitive paths

## Contact
For issues or questions, refer to the original migration logs in:
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin/BUILD_FIXES_SUMMARY.md`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-plugin/scripts/`
