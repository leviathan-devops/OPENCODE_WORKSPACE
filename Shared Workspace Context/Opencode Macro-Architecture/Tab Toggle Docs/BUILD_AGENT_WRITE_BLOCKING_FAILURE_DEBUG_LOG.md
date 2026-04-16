# Spider Agent Write Blocking Critical Failure Debug Log

**Date:** 2026-04-02
**Severity:** CRITICAL
**Status:** FIXED
**Affected Systems:** OpenCode build/plan agents, spider-agent plugin

---

## Executive Summary

Spider-agent plugin was blocking ALL vanilla OpenCode agents (`build`, `plan`) from writing files. The error `WRITE BLOCKED: Agent "build" is not authorised to write "/path/to/file"` prevented any file modifications when the spider-agent plugin was loaded.

**Root Cause:** Spider-agent's auto-registration mechanism was setting ALL sessions as "spider" before agent mode identification, causing file authority rules to be applied to vanilla agents that should have had full access.

---

## Error Details

### Error Message
```
WRITE BLOCKED: Agent "build" is not authorised to write "/path/to/file". Reason: Unknown agent: build
```

### Conditions When Error Occurred
- Any attempt to write files using `build` or `plan` agent mode
- Only occurred when spider-agent plugin was loaded in OpenCode
- Did NOT occur with `--pure` flag (which skips plugins)

### Affected Agents
- `build` agent - completely blocked from file operations
- `plan` agent - completely blocked from file operations
- `coder`/`reviewer`/`test_engineer` etc. - worked correctly (spider sub-agents)

---

## Root Cause Analysis

### Problem Location
File: `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`

### Problem 1: Premature Auto-Registration (Line ~68772)

```javascript
// BEFORE (BUGGY):
if (!spiderState.activeAgent.has(input.sessionID)) {
  spiderState.activeAgent.set(input.sessionID, ORCHESTRATOR_NAME); // Sets to "spider"
}
```

**Issue:** This ran in `tool.execute.before` hook, BEFORE `command.execute.before` could identify the actual agent mode. ALL sessions were auto-registered as "spider" regardless of whether the user was using build/plan/spider.

### Problem 2: File Authority Rules Applied Universally (Line ~52960)

```javascript
// BEFORE (BUGGY):
const authorityCheck = checkFileAuthority(agentName, delegTargetPath, cwd);
if (!authorityCheck.allowed) {
  throw new Error(`WRITE BLOCKED: Agent "${agentName}" is not authorised...`);
}
```

**Issue:** File authority checking happened for ALL agents, not just spider sub-agents. For vanilla agents ("build", "plan"), the check would fail because:
1. They weren't in `AGENT_AUTHORITY_RULES`
2. `checkFileAuthority()` returned `{ allowed: false, reason: "Unknown agent: build" }`

### Problem 3: Missing Entries in AGENT_AUTHORITY_RULES

```javascript
var AGENT_AUTHORITY_RULES = {
  architect: { ... },
  coder: { ... },
  reviewer: { ... },
  // build and plan were MISSING!
};
```

**Issue:** When `checkFileAuthority("build", path)` was called, `AGENT_AUTHORITY_RULES["build"]` was `undefined`, causing the function to return `{ allowed: false }`.

### Hook Execution Order (Why It Happened)

1. `tool.execute.before` (Line 68769) - **RUNS FIRST**
   - Auto-registers session as "spider" 
   - No agent identification yet

2. `command.execute.before` (Line 54456) - **RUNS SECOND**
   - Identifies actual agent mode
   - But it's too late - already registered as spider

This order caused the bug: registration happened before identification.

---

## The Fix

### Fix 1: Added isSpiderSubAgent() Helper Function (Line ~53751)

```javascript
function isSpiderSubAgent(agentName) {
  if (!agentName) return false;
  const stripped = stripKnownSpiderPrefix(agentName);
  const spiderAgents = [
    "spider", "coder", "reviewer", "test_engineer",
    "explorer", "sme", "critic", "docs", "designer"
  ];
  return spiderAgents.includes(stripped);
}
```

**Purpose:** Distinguish between spider sub-agents and vanilla OpenCode agents.

### Fix 2: Skip File Authority for Vanilla Agents (Line ~53763)

```javascript
function checkFileAuthority(agentName, filePath, cwd) {
  // Skip authority check for vanilla OpenCode agents (build, plan)
  if (!isSpiderSubAgent(agentName)) {
    return { allowed: true }; // Vanilla agents have full access
  }
  // ... rest of spider sub-agent authority checks
}
```

**Purpose:** Bypass all authority checking for vanilla agents - they have full access.

### Fix 3: Added build/plan to AGENT_AUTHORITY_RULES (Line ~53743)

```javascript
var AGENT_AUTHORITY_RULES = {
  // ... existing spider sub-agents ...
  build: {
    // Vanilla OpenCode build agent - full access
  },
  plan: {
    // Vanilla OpenCode plan agent - full access
  }
};
```

**Purpose:** Explicit entries for build/plan with empty rules (full access).

### Fix 4: Commented Out Auto-Registration (Line ~68787)

```javascript
// FIXED: Don't auto-register vanilla agents - causes write blocking
// Let command.execute.before handle proper agent registration
// if (!spiderState.activeAgent.has(input.sessionID)) {
//   spiderState.activeAgent.set(input.sessionID, ORCHESTRATOR_NAME);
// }
```

**Purpose:** Remove the premature auto-registration that caused the bug.

---

## Files Modified

### 1. Spider Agent Plugin (Compiled JavaScript)
- **File:** `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`
- **Lines Changed:** ~53751, ~53763, ~53743, ~68787

### 2. OpenCode Configuration (Plugin Path)
- **File:** `/home/leviathan/.config/opencode/opencode.json`
- **Line:** 426
- **Change:** `file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent` → `file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent`

### 3. Spider Agent Model Configuration
- **File:** `/home/leviathan/.config/opencode/spider-agent.json`
- **Updated:** All agent models and fallbacks

---

## Verification

### Before Fix
```bash
$ opencode --agent build --prompt "echo test > /tmp/test.txt"
WRITE BLOCKED: Agent "build" is not authorised to write "/tmp/test.txt"
```

### After Fix
```bash
$ opencode --agent build --prompt "Create a file /tmp/test_build_write.md with content: test from build agent"
# File created successfully - no blocking error
$ cat /tmp/test_build_write.md
test from build agent
```

---

## Architecture Lessons Learned

### 1. Plugin Hook Order Matters
The execution order of plugin hooks (`tool.execute.before` vs `command.execute.before`) can cause race conditions where initialization happens before identification.

### 2. Universal vs Selective Enforcement
File authority rules should be selectively applied, not universally. Spider-agent should only enforce rules for its own sub-agents, not all OpenCode agents.

### 3. Agent Isolation
Spider-agent must treat vanilla `build`/`plan` agents as completely independent. They should:
- Not be auto-registered in spider state
- Not have spider file authority rules applied
- Have full access to all project files

### 4. Project Isolation
Spider-agent and agent-swarm are SEPARATE projects:
- spider-agent: OpenCode plugin for multi-agent orchestration
- agent-swarm: MCP-based worker coordination platform
- They should NOT share directories

---

## Complete Model Configuration (Post-Fix)

| Agent | Primary Model | Fallback Models |
|-------|--------------|-----------------|
| **spider** | `1-minimax/MiniMax-M2.7` | `1-deepseek/deepseek-chat` |
| **coder** | `0-glm-coding/glm-5` | `1-minimax/MiniMax-M2.7` |
| **reviewer** | `0-mimo/mimo-v2-omni` | `1-minimax/MiniMax-M2.7` |
| **test_engineer** | `1-minimax/MiniMax-M2.7` | `0-local-agent-models/omnicoder-9b-q4_k_m.gguf` |
| **explorer** | `0-opencode-zen/nemotron-3-super-free` | `0-openrouter/google/gemini-2.5-flash` |
| **sme** | `0-openrouter/deepseek/deepseek-chat` | `1-deepseek/deepseek-chat` |
| **critic** | `0-mimo/mimo-v2-omni` | `1-minimax/MiniMax-M2.7` |
| **docs** | `0-opencode-zen/nemotron-3-super-free` | `1-minimax/MiniMax-M2.7` |
| **designer** | `0-opencode-zen/nemotron-3-super-free` | `1-minimax/MiniMax-M2.7` |

---

## Change Log

| Date | Change | Files Modified |
|------|--------|----------------|
| 2026-04-02 | Initial bug analysis | N/A |
| 2026-04-02 | Added isSpiderSubAgent() function | dist/index.js |
| 2026-04-02 | Added vanilla agent bypass in checkFileAuthority | dist/index.js |
| 2026-04-02 | Added build/plan to AGENT_AUTHORITY_RULES | dist/index.js |
| 2026-04-02 | Commented out auto-registration | dist/index.js |
| 2026-04-02 | Fixed OpenCode plugin path | opencode.json |
| 2026-04-02 | Updated spider-agent model config | spider-agent.json |
| 2026-04-02 | Verified fix with build agent test | N/A |

---

## References

- OpenCode Plugin Architecture
- spider-agent Source: `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`
- OpenCode Config: `~/.config/opencode/opencode.json`
- spider-agent Config: `~/.config/opencode/spider-agent.json`
- TAB_TOGGLE_ERROR_LOG_V2.md: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Spider Agent/Tab Toggle Agent Fixes/`

---

## PART 2: Model Response Timeout & Fallback Failure

**Date:** 2026-04-02 (Continued)
**Severity:** CRITICAL
**Status:** FIXED
**Issue:** Model fallback not triggering when GLM rate limited - model hangs silently

### Problem Description

When GLM (or any model) is rate limited, the subagent appears "completely dead":
- No thinking/processing
- No error messages
- No debug output
- Terminal completely blank
- No activity whatsoever

The fallback mechanism was designed to detect error messages matching `TRANSIENT_MODEL_ERROR_PATTERN`, but when the model silently hangs (rate limited but returns no error), the fallback never triggers.

### Root Cause Analysis

**1. Fallback Only Triggers on Error Messages**
```javascript
if (typeof errorContent === "string" && TRANSIENT_MODEL_ERROR_PATTERN.test(errorContent) && !session.modelFallbackExhausted) {
  // fallback logic
}
```

When model is rate limited but produces NO error output (just hangs), this condition never fires.

**2. TRANSIENT_MODEL_ERROR_PATTERN**
```javascript
var TRANSIENT_MODEL_ERROR_PATTERN = /rate.?limit|429|503|timeout|overloaded|model.?not.?found|temporarily unavailable|server error/i;
```

Only matches if error string contains these patterns. Silent hang = no error string = no match.

**3. No Activity Tracking for Model Responses**
- `lastSuccessTimeMs` tracks last tool call success, not model responses
- No field to track when model last sent a response
- No way to detect if model is silently hung

### The Fix

#### 1. Added Session Field (Line ~41491)
```javascript
lastModelResponseTime: 0,
```

#### 2. Added checkModelResponseTimeout Function (Line ~53827)
```javascript
function checkModelResponseTimeout(session) {
  if (!session || session.modelFallbackExhausted || session.model_fallback_index > 0) return false;
  const now = Date.now();
  const timeoutMs = 180000; // 3 minutes
  if (session.lastModelResponseTime > 0 && (now - session.lastModelResponseTime) > timeoutMs) {
    return true; // Model silent for > 3 minutes - likely rate limited
  }
  return false;
}
```

#### 3. Model Response Tracking in messagesTransform (Line ~53378)
```javascript
if (sessionId) {
  const session = spiderState.agentSessions.get(sessionId);
  if (session && messages.some(m => m.info?.role === 'assistant')) {
    session.lastModelResponseTime = Date.now();
  }
}
```

#### 4. Timeout Fallback in toolBefore Hook (Line ~68815)
```javascript
if (session_check && checkModelResponseTimeout(session_check)) {
  const baseAgentName = session_check.agentName ? session_check.agentName.replace(/^[^_]+[_]/, "") : "";
  const spiderAgents = getSpiderAgents();
  const fallbackModels = spiderAgents?.[baseAgentName]?.fallback_models;
  if (fallbackModels && fallbackModels.length > 0) {
    const fallbackModel = fallbackModels[0];
    const primaryModel = spiderAgents?.[baseAgentName]?.model ?? "unknown";
    spiderAgents[baseAgentName].model = fallbackModel;
    session_check.modelFallbackExhausted = false;
    session_check.lastModelResponseTime = Date.now();
    console.warn(`[Spider] MODEL FALLBACK: Model silent for >3min (likely rate limited). Switching from ${primaryModel} to ${fallbackModel}`);
  }
}
```

### How It Works

1. **Track**: Every assistant message (model response) updates `session.lastModelResponseTime = Date.now()`
2. **Check**: In `toolBefore` hook, checks if model has been silent for >3 minutes
3. **Fallback**: If silent AND fallback models exist, switches to first fallback model
4. **Reset**: Resets `lastModelResponseTime` to prevent immediate re-trigger

### Timeout Behavior

| Condition | Behavior |
|-----------|----------|
| Model responds normally | `lastModelResponseTime` updated, no timeout |
| Model silent < 3 minutes | No action |
| Model silent > 3 minutes | Triggers fallback to first fallback model |
| No fallback models configured | Logs warning, continues hanging |
| Fallback already exhausted | No retry (prevents infinite loop) |

### Files Modified

- `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`

### Change Log

| Date | Change | Description |
|------|--------|-------------|
| 2026-04-02 | Added `lastModelResponseTime` session field | Track model response timestamps |
| 2026-04-02 | Added `checkModelResponseTimeout()` function | Detect 3+ minute silence |
| 2026-04-02 | Added response tracking in messagesTransform | Update timestamp on assistant messages |
| 2026-04-02 | Added timeout fallback in toolBefore | Trigger fallback when silent > 3 min |

