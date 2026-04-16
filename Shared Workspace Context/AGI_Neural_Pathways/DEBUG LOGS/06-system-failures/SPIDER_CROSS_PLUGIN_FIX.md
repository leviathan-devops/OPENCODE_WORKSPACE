# Spider Agent Cross-Plugin Contamination Fix

## Date
2026-04-12

## Problem
Spider agent was writing to `.Spider/` directory for ALL active sessions, not just spider sessions. This caused:
- Hardware bloat from excessive telemetry writes
- Cross-agent contamination (spider events appearing for shark/build/plan sessions)
- UI spillover from spider's console.log calls
- Debugging confusion when analyzing shark-specific bugs

## Root Cause

### 1. Plugin Not Actually Disabled
The `opencode.json` file contained:
```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js",
  ...
]
```

Despite UI displaying commented versions, the **actual file on disk** had spider-agent fully enabled (no `//` prefix).

### 2. Global Hooks Without Agent Filtering
Spider's hooks (event, tool.execute.before, etc.) register for **ALL sessions**, not just spider agent sessions. Every tool call in every agent triggers spider's hooks because there's no `isSpiderAgent()` guard.

### 3. Stale Sessions Kept Contamination Active
6 opencode sessions were running with spider-agent loaded in memory. Even after config fix, these stale sessions continued writing to `.Spider/telemetry.jsonl`.

## Fix Applied

### 1. Disabled Problematic Plugins in opencode.json

```json
// BEFORE (enabled):
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js",
  "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.3-build/dist/index.js",
  "file:///home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/subagent-manager/dist/index.js",
  "file:///home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.1/dist/index.js",
  ...
]

// AFTER (disabled):
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.3.5-hotfix/dist/index.js",
  "list"
]
```

### 2. Active Plugins Now (Clean Setup)
- `coding-subagents` - qwen/gemma routing tools
- `opencode-plugin-engineering` - engineering knowledge base
- `shark-agent-v4.7-hotfix-v3` - shark execution brain (memory leak fixed)
- `manta-agent-v1.3.5-hotfix` - manta precision agent (memory leak fixed)

## Verification

### Before Fix
```bash
$ lsof .Spider/telemetry.jsonl
.opencode 2063226  ... telemetry.jsonl  # session_1 (spider writes here)
.opencode 2723708  ... telemetry.jsonl  # session_2 (spider writes here)  
.opencode 2726489  ... telemetry.jsonl  # session_3 (spider writes here)
...6 total processes
```

### After Fix (New Sessions)
Only shark/manta agents write to their own directories (`.shark/`, `.manta/`), no cross-contamination.

## Architectural Lesson

**All plugin hooks fire globally unless explicitly filtered.**

Plugins should implement agent-aware guards:
```typescript
// CORRECT - Only runs for spider agent
if (!isSpiderAgent(input)) return;
// ... spider logic

// WRONG - Runs for ALL agents, causes cross-contamination
// ... spider logic runs everywhere
```

## Related Files
- `/home/leviathan/.config/opencode/opencode.json` - Config file fixed
- `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/` - Plugin disabled
- `/home/leviathan/OPENCODE_WORKSPACE/.Spider/` - Old telemetry (can be cleaned)