# Shark Agent v4.8.3 - Active Project Space

## Quick Status
**✅ SHIPPED** - L1-L5 Anti-Slop Firewall Complete (2026-04-12)

## Key Achievement
Fixed L1-L4 tool-level blocking. L5 message-level blocking was already working.
Theatrical patterns (`ls | wc`, `grep | wc`, `cat | wc`) and fake test runners (`npm test`) now properly blocked.

## Architecture
- `src/hooks/v4.1/chat-message-hook.ts` - Main hook with L1-L5 patterns (THEATRICAL_PATTERNS, FAKE_TEST_PATTERNS, etc.)
- `src/hooks/v4.1/agent-state.ts` - Session-based Map for getCurrentAgent() persistence
- `dist/index.js` - Built plugin (~620KB)

## Pattern Categories (15 total, 159 patterns)
1. THEATRICAL_PATTERNS - 12 patterns
2. LEGITIMATE_PATTERNS - 3 patterns  
3. FAKE_TEST_PATTERNS - 9 patterns
4. SOURCE_INSPECTION_PATTERNS - 2 patterns
5. WRONG_CONTAINER_PATTERNS - 4 patterns
6. HOST_FALLBACK_PATTERNS - 15 patterns
7. SUCCESS_CLAIM_PATTERNS - 15 patterns
8. MODEL_RESTRICTION_PATTERNS - 15 patterns
9. MOCK_STUB_PATTERNS - 12 patterns
10. SIMPLIFICATION_PATTERNS - 11 patterns
11. CONFUSION_PRETENSE_PATTERNS - 12 patterns
12. SCOPE_CREEP_PATTERNS - 12 patterns
13. UNDERMINING_PATTERNS - 11 patterns
14. IMPATIENCE_PATTERNS - 11 patterns
15. SELF_REFERENCE_PATTERNS - 11 patterns

## Anti-Slop Firewall Layers
- **L1**: Theatrical patterns (fake verification)
- **L2**: Fake test runners
- **L3**: Dangerous tools (rm -rf, mkfs, dd, etc.)
- **L4**: Scope creep
- **L5**: Anti-derailment (host fallback, ship gate bypass)

## Critical Fixes
1. **agent-state.ts**: Module-level variable didn't persist between hooks. Replaced with session-based Map.
2. **chat-message-hook.ts**: `opencode run` bypasses `command.execute.before` hook, triggers `chat.message` instead. Added theatrical + fake test patterns to chat-message-hook.ts.
3. **Function collisions**: Added THEATRICAL_PATTERNS, LEGITIMATE_PATTERNS, FAKE_TEST_PATTERNS with new function names (checkTheatricalVerification, checkFakeTestRunner) to avoid collisions with guardian-hook.ts.

## Container Test Results
- L1: `opencode run "ls | wc -l"` → ANTI-SLOP L1 blocked ✓
- L1: `opencode run "grep pattern file | wc -l"` → ANTI-SLOP L1 blocked ✓
- L1: `opencode run "cat file | wc -l"` → ANTI-SLOP L1 blocked ✓
- L2: `opencode run "npm test"` → ANTI-SLOP L2 blocked ✓
- L5: `opencode run "skip container test"` → ANTI-DERAILMENT L5.1 blocked ✓
- Pattern tests: 15/15 PASSED ✓

## Directory Structure
```
Active Project Space/
├── src/                    # TypeScript source hooks & patterns
├── dist/                   # Built plugin bundle
├── checkpoints/           # Checkpoint snapshots
├── debug-logs/            # 40+ forensic reports
├── docs/                  # BUILD_REPORT, README, package.json
├── tests/                 # Pattern test files
├── MANIFEST.md            # Full package manifest
└── PROJECT_CONTEXT.md     # This file
```

## Build Commands
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle --external @opencode-ai/plugin
cp dist/index.js /tmp/shark-container/plugins/shark-agent-v4.8.3/
```

## Container Test Commands
```bash
# L1 (should block)
docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "ls | wc -l" --agent shark --model opencode/big-pickle 2>&1 | grep -i anti-slop

# L2 (should block)
docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "npm test" --agent shark --model opencode/big-pickle 2>&1 | grep -i anti-slop

# L5 (should block)
docker run --rm -v /tmp/shark-container/config:/root/.config/opencode -v /tmp/shark-container/plugins:/root/.config/opencode/plugins opencode-test:1.4.3 run "skip container test" --agent shark --model opencode/big-pickle 2>&1 | grep -i anti-derailment
```

## Pattern Test
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun run test-patterns.ts
```

## Debug Logs (40+ files)
Key files in debug-logs/:
- `ANTI_SLOP_FIREWALLS.md` - Firewall architecture
- `ARCHITECTURE_DEBUG_PLAN_PLUGIN_ISOLATION.md` - Plugin isolation
- `CROSS-PLUGIN-ARCHITECTURE-AUDIT.md` - Cross-plugin issues
- `DERAILMENT_FORENSIC_ANALYSIS.md` - Derailment analysis
- `L5_FIREWALL_INFRASTRUCTURE_PROMPT.md` - L5 patterns
- `MECHANICAL_FIREWALL_ARCHITECTURE.md` - Mechanical design
- `SYSTEM_BRAIN_FIREWALL_CONTEXT_LIBRARY.md` - Brain firewall
- `shark-agent-v483-brain-fix.md` - Brain fix history
- `container_testing_discovery.md` - Container testing

## Checkpoints
- v4.8.3 (initial)
- v4.8.3-checkpoint-1 through v4.8.3-checkpoint-4.0

## Related Documentation
- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/09-complete-forensic-report.md`
- `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/ANTI_SLOP_FIREWALLS.md`
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/BUILD_REPORT.md`
