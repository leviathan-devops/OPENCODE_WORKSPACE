# Spider Agent Tab Toggle Error Log V2

**Date:** 2026-04-02
**Status:** Analysis Complete - Implementation In Progress
**Priority:** Critical

---

## Executive Summary

Spider-agent (OpenCode plugin) is incorrectly intercepting ALL OpenCode sessions, including vanilla `build`/`plan` agents. This causes:
- Vanilla agents to be blocked from writing files
- `WRITE BLOCKED: Agent "build" is not authorised` errors
- Complete violation of agent isolation architecture

**Root Cause:** Spider-agent auto-registers ALL sessions and applies spider file authority rules to non-spider agents.

---

## Architecture Overview

### System Components

1. **OpenCode Core**: Main AI coding engine
   - Loads plugins via `opencode.json`
   - Supports multiple agent modes: `plan`, `build`, `spider`
   - Passes agent mode via `--agent <mode>` flag

2. **spider-agent**: OpenCode plugin providing multi-agent orchestration
   - Loaded from plugin config
   - Manages spider sub-agents: `spider`, `coder`, `reviewer`, `test_engineer`, etc.
   - Provides gated QA pipeline and delegation

3. **agent-swarm**: SEPARATE multi-agent orchestration platform
   - Different project from spider-agent
   - MCP-based worker coordination
   - Should have NO relationship with spider-agent

### Agent Mode Detection

OpenCode detects agent modes via the `--agent <mode>` flag:
- `--agent build` → Vanilla build mode
- `--agent plan` → Vanilla plan mode
- `--agent spider` → Spider agent mode

This is passed to plugins via `input.agent` parameter in the `command.execute.before` hook.

---

## Problem Analysis

### Symptom

When vanilla `build` or `plan` agents attempt to write files, they receive:

```
WRITE BLOCKED: Agent "build" is not authorised to write "/path/to/file". Reason: Unknown agent: build
```

### Root Cause Chain

1. **Auto-Registration Bug** (Line 68772-68774):
   ```javascript
   if (!spiderState.activeAgent.has(input.sessionID)) {
     spiderState.activeAgent.set(input.sessionID, ORCHESTRATOR_NAME);
   }
   ```
   - Spider-agent auto-registers ALL sessions as `"spider"` BEFORE agent mode is identified
   - This happens in `tool.execute.before` hook, which runs BEFORE `command.execute.before`

2. **Premature File Authority Checking** (Line 52960):
   ```javascript
   const authorityCheck = checkFileAuthority(agentName, delegTargetPath, cwd);
   if (!authorityCheck.allowed) {
     throw new Error(`WRITE BLOCKED: Agent "${agentName}" is not authorised...`);
   }
   ```
   - File writes are checked against `AGENT_AUTHORITY_RULES`
   - `build`/`plan` agents are not in the rules → blocked

3. **Missing Agent Isolation**:
   - Spider-agent treats ALL agents as spider sub-agents
   - No distinction between vanilla and spider agents
   - File authority rules applied universally

### Code Flow Analysis

```
Session Start (build agent)
    ↓
tool.execute.before hook [LINE 68772]
    ↓
Auto-register as "spider" if not in activeAgent
    ↓
File write attempted
    ↓
checkFileAuthority("spider", path) [LINE 52960]
    ↓
Agent in activeAgent = "spider" (WRONG!)
    ↓
WRITE BLOCKED
```

### Hook Execution Order

1. `tool.execute.before` (Line 68769) - Runs FIRST, auto-registers session
2. `command.execute.before` (Line 54456) - Runs SECOND, identifies actual agent

This order causes the bug: auto-registration happens before agent identification.

---

## AGENT_AUTHORITY_RULES Analysis

### Current State (Line 53703)

```javascript
var AGENT_AUTHORITY_RULES = {
  architect: { blockedExact: [".Spider/plan.md", ...], ... },
  coder: { blockedPrefix: [".Spider/"], ... },
  reviewer: { ... },
  explorer: { readOnly: true },
  sme: { readOnly: true },
  test_engineer: { ... },
  docs: { ... },
  designer: { ... },
  critic: { ... }
};
```

### Missing Entries

**PROBLEM:** No entries for `build` or `plan` agents!

When `checkFileAuthority("build", path)` is called:
```javascript
const rules = AGENT_AUTHORITY_RULES[normalizedAgent]; // undefined for "build"
if (!rules) {
  return { allowed: false, reason: `Unknown agent: ${agentName}` };
}
```

**Result:** All write operations by vanilla agents are blocked.

---

## Required Fixes

### Fix 1: Prevent Auto-Registration of Vanilla Agents

**Location:** Line 68772-68774 in `dist/index.js`

**Current Code:**
```javascript
if (!spiderState.activeAgent.has(input.sessionID)) {
  spiderState.activeAgent.set(input.sessionID, ORCHESTRATOR_NAME);
}
```

**Problem:** Auto-registers ALL sessions as spider before agent identification.

**Solution:** Only register if we know it's a spider session, or don't auto-register at all.

### Fix 2: Handle Vanilla Agent Identification Properly

**Location:** Line 54457-54467 in `dist/index.js`

**Current Code:**
```javascript
if (!input.agent || input.agent === "") {
  // Default to spider - PROBLEM!
  spiderState.activeAgent.set(input.sessionID, ORCHESTRATOR_NAME);
  ...
}
```

**Solution:** Don't default to spider for empty agent input. Empty input might mean vanilla agent.

### Fix 3: Skip File Authority for Vanilla Agents

**Location:** Line 52960-52964 in `dist/index.js`

**Current Code:**
```javascript
const authorityCheck = checkFileAuthority(agentName, delegTargetPath, cwd);
if (!authorityCheck.allowed) {
  throw new Error(`WRITE BLOCKED: Agent "${agentName}" is not authorised...`);
}
```

**Solution:** Only check file authority for spider sub-agents.

### Fix 4: Add build/plan to AGENT_AUTHORITY_RULES

**Location:** Line 53703 in `dist/index.js`

**Solution:** Add entries with empty rules (full access):
```javascript
build: { /* full access */ },
plan: { /* full access */ }
```

---

## Helper Function Required

Add function to identify spider sub-agents:

```javascript
function isSpiderSubAgent(agentName) {
  const stripped = stripKnownSpiderPrefix(agentName);
  const spiderAgents = [
    "spider", "coder", "reviewer", "test_engineer",
    "explorer", "sme", "critic", "docs", "designer"
  ];
  return spiderAgents.includes(stripped);
}
```

---

## Implementation Plan

### Phase 1: Code Fixes

1. **Add helper function** `isSpiderSubAgent()`
2. **Fix auto-registration** to skip vanilla agents
3. **Fix agent input handling** to not default to spider
4. **Fix file authority checking** to skip vanilla agents
5. **Ensure build/plan in AGENT_AUTHORITY_RULES**

### Phase 2: Isolation Verification

1. **Verify spider-agent location** - NOT in agent-swarm directory
2. **Verify OpenCode config** - Points to correct location
3. **Verify npm symlink** - Points to correct location

### Phase 3: Testing

1. **Test vanilla build agent** - Should write files without blocks
2. **Test vanilla plan agent** - Should write files without blocks
3. **Test spider mode** - Should apply spider rules correctly
4. **Test file isolation** - Spider can't affect vanilla agent files

---

## Configuration Files

### Current spider-agent.json

Located: `~/.config/opencode/spider-agent.json`

```json
{
  "agents": {
    "spider": { "model": "0-openrouter/google/gemini-2.5-flash" },
    "coder": {
      "model": "0-openrouter/google/gemini-2.5-flash",
      "fallback_models": ["0-openrouter/deepseek/deepseek-chat", ...]
    },
    ...
  }
}
```

### OpenCode Plugin Config

Located: `~/.config/opencode/opencode.json` (Line 425-427)

```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent",
  "hive-mind-plugin"
]
```

**Issue:** Points to agent-swarm directory instead of OPENCODE_WORKSPACE.

---

## Expected Behavior

### Vanilla build/plan Agents

- ✅ Can write to any file in the project
- ✅ Not affected by spider-agent
- ✅ No spider hooks or rules applied
- ✅ Complete isolation from spider-agent

### Spider Mode

- ✅ Only active when `--agent spider` flag used
- ✅ Tab toggle switches between plan/build/spider
- ✅ Spider sub-agents governed by spider rules
- ✅ `.Spider/` directory for spider state only

---

## File Locations

### Spider Agent Plugin
- **Correct Location:** `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/`
- **Old Location:** `/home/leviathan/agent-swarm/spider-agent/` (INCORRECT)

### NPM Symlink
- **Path:** `/home/leviathan/.npm-global/lib/node_modules/spider-agent`
- **Should Point To:** `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent`

### OpenCode Config Plugin Entry
- **File:** `~/.config/opencode/opencode.json`
- **Line:** 426
- **Current:** `file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent`
- **Should Be:** `file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent`

---

## Model Configuration

### Current Issues

1. **GLM Rate Limits**: GLM-5 has exceeded weekly rate limit
2. **OpenRouter Models**: Working (gemini-2.5-flash, deepseek-chat, qwen)
3. **MiniMax M2.7**: Available as fallback but not configured properly

### Spider Agent Models

```json
{
  "spider": { "model": "0-openrouter/google/gemini-2.5-flash" },
  "coder": {
    "model": "0-openrouter/google/gemini-2.5-flash",
    "fallback_models": [
      "0-openrouter/deepseek/deepseek-chat",
      "0-openrouter/qwen/qwen3.6-plus-preview:free",
      "1-minimax/MiniMax-M2.7"
    ]
  }
}
```

---

## Troubleshooting

### Error: "WRITE BLOCKED: Agent 'build' is not authorised"

**Cause:** Spider-agent is treating build agent as spider sub-agent.

**Fix:** Apply code fixes to skip file authority for vanilla agents.

### Error: "WRITE BLOCKED: Agent 'plan' is not authorised"

**Cause:** Same as above.

**Fix:** Same as above.

### Error: "Unknown agent: build"

**Cause:** build agent not in AGENT_AUTHORITY_RULES.

**Fix:** Add build/plan entries to AGENT_AUTHORITY_RULES.

---

## References

- OpenCode Plugin Architecture
- spider-agent Source: `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`
- OpenCode Config: `~/.config/opencode/opencode.json`
- spider-agent Config: `~/.config/opencode/spider-agent.json`

---

## Change Log

### 2026-04-02

- Created comprehensive analysis
- Identified root cause: auto-registration in tool.execute.before hook
- Documented required fixes
- Planned implementation approach
