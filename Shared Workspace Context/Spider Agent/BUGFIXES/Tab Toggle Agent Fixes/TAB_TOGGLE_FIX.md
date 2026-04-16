# Spider Agent Tab Toggle Fix

**Date:** 2026-04-02  
**Problem:** Spider agent was not appearing as a selectable tab toggle in OpenCode UI. Only "architect" was visible.  
**Root Cause:** The compiled `dist/index.js` had hardcoded references to "architect" instead of "spider" despite the source being rebranded.

---

## Background

The spider-agent plugin (formerly shark-agent-v4) went through a partial rebrand:
- Directory renamed: `shark-agent-v4` → `spider-agent`
- Package name changed to `spider-agent`
- Many internal variables renamed to `spider*` (spiderState, [Spider] logs, etc.)

**However**, the rebrand was incomplete in the compiled bundle:
- `ORCHESTRATOR_NAME` was still `"architect"` in `src/config/constants.ts` (never changed in source)
- The compiled `dist/index.js` still referenced "architect" throughout
- Only "architect" was registered as a `mode: "primary"` agent (visible in UI tab toggle)

---

## What Was Fixed

The fix was applied directly to the compiled bundle at:
`/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`

### 1. Change ORCHESTRATOR_NAME constant
```bash
sed -i 's/ORCHESTRATOR_NAME = "architect"/ORCHESTRATOR_NAME = "spider"/g' dist/index.js
```
**Line affected:** ~135
**Why:** This constant determines the orchestrator agent name throughout the codebase.

### 2. Change mode assignment for primary agents
```bash
sed -i 's/agent\.name === "architect"/agent.name === "spider"/g' dist/index.js
```
**Line affected:** ~44614
**Why:** Only agents matching `agent.name === "spider"` (or ending in `_architect`) get `mode: "primary"` which makes them visible as tab toggles.

### 3. Change AGENT_TOOL_MAP key
```bash
sed -i 's/\barchitect: \[/spider: [/' dist/index.js
```
**Line affected:** ~156
**Why:** The tool map key must match the agent name. Changed from `architect:` to `spider:`.

### 4. Change createSpiderAgents function (architect creation)
**Lines affected:** ~44485-44488
```javascript
// Before:
if (!isAgentDisabled("architect", spiderAgents, spiderPrefix)) {
  const architectPrompts = getPrompts("architect");
  const architect = createArchitectAgent(getModel("architect"), ...);
  architect.name = prefixName("architect");

// After:
if (!isAgentDisabled("spider", spiderAgents, spiderPrefix)) {
  const architectPrompts = getPrompts("spider");
  const architect = createArchitectAgent(getModel("spider"), ...);
  architect.name = prefixName("spider");
```

### 5. Change createSpiderAgents function (spiderAgents reference)
```bash
sed -i 's/spiderAgents\.architect/spiderAgents.spider/g' dist/index.js
```
**Why:** The config lookup `spiderAgents.architect` needed to be `spiderAgents.spider` to read the correct model/temperature from config.

---

## How Agent Tab Toggle Works in OpenCode

1. **Plugin loads** → calls `config` hook with OpenCode config object
2. **getAgentConfigs()** is called → creates agent configs from `createSpiderAgents()`
3. **Each agent gets mode assigned:**
   - `mode: "primary"` → **visible in UI tab toggle**
   - `mode: "subagent"` → hidden from UI (used for delegation only)
4. **Mode assignment logic (line ~44614):**
   ```javascript
   if (agent.name === "spider" || agent.name.endsWith("_architect")) {
     sdkConfig.mode = "primary";  // Visible in tab toggle
     sdkConfig.permission = { task: "allow" };
   } else {
     sdkConfig.mode = "subagent";  // Hidden from tab toggle
   }
   ```
5. **Object.assign() merges** agents into OpenCode's agent registry (only if key doesn't already exist)

---

## Key Files and Line References

| Purpose | File | Line(s) |
|---------|------|---------|
| ORCHESTRATOR_NAME constant | `dist/index.js` | 135 |
| Mode assignment (primary check) | `dist/index.js` | 44614 |
| AGENT_TOOL_MAP spider key | `dist/index.js` | 156 |
| createSpiderAgents - disabled check | `dist/index.js` | 44485 |
| createSpiderAgents - prompt loading | `dist/index.js` | 44486 |
| createSpiderAgents - agent creation | `dist/index.js` | 44487 |
| createSpiderAgents - naming | `dist/index.js` | 44488 |
| spiderAgents config lookup | `dist/index.js` | 44492, 44510 |

---

## Agent Config File

The spider agent reads from:
`~/.config/opencode/spider-agent.json`

Example config:
```json
{
  "agents": {
    "spider": {
      "model": "1-minimax/MiniMax-M2.7"
    },
    "coder": {
      "model": "0-glm-coding/glm-5"
    },
    "reviewer": {
      "model": "local-agent-models/omnicoder-9b-q4_k_m.gguf"
    }
  },
  "max_iterations": 5
}
```

---

## Verification Commands

```bash
# Check ORCHESTRATOR_NAME
grep -n 'ORCHESTRATOR_NAME' /home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js | head -1

# Check mode assignment  
grep -n 'agent.name === "spider"' /home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js

# Check AGENT_TOOL_MAP key
grep -n "^    spider: \[" /home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js

# Run OpenCode and check logs
opencode --print-logs 2>&1 | grep -iE "spider|architect|primary"

# Check agent list
opencode agent list

# Debug config
opencode debug config 2>&1 | grep -A20 '"spider":'
```

---

## If Spider Still Doesn't Appear

1. **Restart OpenCode completely** - plugins only load at startup
2. **Check for errors** - `opencode --print-logs --log-level ERROR`
3. **Verify config file** - `~/.config/opencode/spider-agent.json` must exist and have "spider" key in agents
4. **Check mode is primary** - agent must have `mode: "primary"` not `mode: "subagent"`
5. **Verify plugin path in opencode.json**:
   ```json
   "plugin": [
     "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent"
   ]
   ```

---

## Backup

Before making changes, a backup was created:
```
/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js.bak.1775093612
```
