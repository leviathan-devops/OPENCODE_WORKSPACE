# Agent Timeout Analysis & Recommendations

## Current Timeout Configuration

**Location**: `/home/leviathan/OPENCODE_WORKSPACE/.bun/install/cache/opencode-ultra@0.9.9@@@1/dist/index.js`

### Default Timeouts

| Constant | Value | Line | Purpose |
|----------|-------|------|---------|
| `DEFAULT_AGENT_TIMEOUT_MS` | 180000 (3 min) | 28241 | Per-agent execution timeout |
| `DEFAULT_ITERATION_TIMEOUT_MS` | 180000 (3 min) | 28471 | Ralph loop iteration timeout |
| `DEFAULT_ITERATION_TIMEOUT_MS2` | 120000 (2 min) | 29465 | Secondary iteration timeout |
| `DEFAULT_TOTAL_TIMEOUT_MS` | 600000 (10 min) | 29466 | Total operation timeout |

### Tool-Specific Timeouts

| Tool | Timeout | Line |
|------|---------|------|
| git commands | 30000ms (30s) | 29524 |
| git diff | 10000ms (10s) | 29622 |
| bun test | 120000ms (2 min) | 29811 |
| bun build | 60000ms (1 min) | 29821 |
| spawn_agent | 300000ms (5 min) | observed |

---

## Timeout Hits During This Session

| Agent | Task | Timeout Hit | Expected Duration |
|-------|------|-------------|-------------------|
| explore | Absorb Shark CLI context | 300s | ~180s needed |
| hephaestus | Build Anti-Hallucination | 300s | ~240s needed |
| hephaestus | Build Surgical Debug | 300s | ~240s needed |
| oracle | Sisyphus UI glitch | 300s | ~120s needed |

**Total timeout hits: 4**

---

## Root Cause

1. **Default 5-minute timeout** is enforced by `spawn_agent` tool
2. Complex build tasks require 6-8 minutes for full implementation + tests
3. Context-heavy tasks (reading multiple files) exceed timeout during processing

---

## Recommendations

### Option A: Increase Default Timeouts (Recommended)

Modify `dist/index.js`:

```javascript
// Line 28241
var DEFAULT_AGENT_TIMEOUT_MS = 600000;  // 3min → 10min

// Line 28471  
var DEFAULT_ITERATION_TIMEOUT_MS = 300000;  // 3min → 5min

// Line 29466
var DEFAULT_TOTAL_TIMEOUT_MS = 1800000;  // 10min → 30min
```

### Option B: Add Config Override

Add to `~/.config/opencode/opencode-ultra.json`:

```json
{
  "agents": {
    "hephaestus": { "timeout": 600000 },
    "oracle": { "timeout": 450000 },
    "explore": { "timeout": 300000 }
  }
}
```

### Option C: Task-Based Timeouts

Specify timeout per task:

```typescript
spawn_agent({
  agent: "hephaestus",
  prompt: "...",
  timeout: 600000  // Override per-task
})
```

---

## Proposed Timeout Values

| Agent Type | Current | Proposed | Reason |
|------------|---------|----------|--------|
| hephaestus (build) | 180s | 600s | Complex implementation + tests |
| oracle (analysis) | 180s | 300s | Deep investigation needed |
| explore (search) | 180s | 240s | File reading overhead |
| librarian (docs) | 180s | 300s | Documentation generation |
| momus (review) | 180s | 240s | Code review analysis |
| sisyphus (orchestrator) | 180s | 600s | Multi-step coordination |

---

## Implementation

To apply fixes immediately:

```bash
# Patch opencode-ultra dist
sed -i 's/DEFAULT_AGENT_TIMEOUT_MS = 180000/DEFAULT_AGENT_TIMEOUT_MS = 600000/' \
  /home/leviathan/OPENCODE_WORKSPACE/.bun/install/cache/opencode-ultra@0.9.9@@@1/dist/index.js

sed -i 's/DEFAULT_ITERATION_TIMEOUT_MS = 180000/DEFAULT_ITERATION_TIMEOUT_MS = 300000/' \
  /home/leviathan/OPENCODE_WORKSPACE/.bun/install/cache/opencode-ultra@0.9.9@@@1/dist/index.js
```

---

## Files to Monitor

1. `/home/leviathan/OPENCODE_WORKSPACE/.config/opencode/opencode-ultra.json` - Agent configs
2. `/home/leviathan/OPENCODE_WORKSPACE/.bun/install/cache/opencode-ultra@*/dist/index.js` - Plugin dist

---

**Status**: Documented for future reference
**Action**: Apply timeout increases before next agent deployment
