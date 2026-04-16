# Spider Agent Architecture Spillover - Complete Debug Log

**Date**: 2026-04-03
**Issue**: Spider Agent corrupting vanilla OpenCode agent sessions + MODEL FALLBACK spurious warnings
**Severity**: CRITICAL
**Status**: FIXED - All 6 Issues Resolved
**File**: `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problems Identified](#problems-identified)
3. [All Fixes Applied](#all-fixes-applied)
4. [Hook Spillover Matrix](#hook-spillover-matrix)
5. [Root Cause Analysis](#root-cause-analysis)
6. [Vanilla Agent List](#vanilla-agent-list)
7. [Architect Model Selection](#architect-model-selection)
8. [Verification](#verification)
9. [Files Modified](#files-modified)

---

## Executive Summary

Spider Agent's hooks were running for **ALL agents** (including vanilla `plan` and `build`), causing:
- Spider state pollution (`activeAgent`, `agentSessions`)
- Interference with OpenCode's native permission system
- Spurious "MODEL FALLBACK SUPPRESSED" warnings for vanilla agents
- Context pressure warnings leaking to vanilla agents

**Root Cause**: Multiple hooks in the plugin entry point (`tool.execute.before`, `tool.execute.after`, `chat.message`) were not checking if the active agent was a vanilla agent before applying Spider-specific logic.

**Total Fixes Applied**: 6 (3 primary + 3 defense-in-depth)

---

## Problems Identified

### Problem 1: `chat.message` Hook Spillover (CRITICAL)
**Symptom**: Vanilla `plan` agent could write files when it should have been read-only
**Root Cause**: `delegationHandler` in `createDelegationTrackerHook()` set `activeAgent`, `delegationActive`, and called `beginInvocation()` for ALL agents
**Severity**: CRITICAL

### Problem 2: Model Timeout Check Spillover (HIGH)
**Symptom**: "MODEL FALLBACK SUPPRESSED" warnings appearing for vanilla agents
**Root Cause**: `checkModelResponseTimeout()` in `tool.execute.before` ran for ALL agents
**Severity**: HIGH

### Problem 3: Model Error Fallback Spillover (HIGH)
**Symptom**: Model fallback triggering for vanilla agents on transient errors
**Root Cause**: `guardrailsHooks.toolAfter` model error fallback logic ran for ALL agents
**Severity**: HIGH

### Problem 4: Context Pressure Warning Spillover (MEDIUM)
**Symptom**: Context pressure warnings pushed to vanilla agent sessions
**Root Cause**: Context pressure check in `tool.execute.before` ran for ALL agents
**Severity**: MEDIUM

---

## All Fixes Applied

### Fix 1: PRIMARY - `createDelegationTrackerHook()` - Line ~54522

**BEFORE**:
```javascript
function createDelegationTrackerHook(config3, guardrailsEnabled = true) {
  return async (input, _output) => {
    const agentName = input.agent;
    // BUG: No check for vanilla agents
    spiderState.activeAgent.set(input.sessionID, agentName);
    // ...
  };
}
```

**AFTER**:
```javascript
function createDelegationTrackerHook(config3, guardrailsEnabled = true) {
  return async (input, _output) => {
    const agentName = input.agent;
    // SKIP for vanilla agents - let OpenCode handle them natively
    if (agentName && !isSpiderSubAgent(agentName)) {
      return;
    }
    // ... rest only runs for spider agents
  };
}
```

**Purpose**: Prevents spider from setting state or tracking vanilla agents entirely.

---

### Fix 2: DEFENSE IN DEPTH - `resolveSessionAndWindow()` - Line ~53148

**BEFORE**:
```javascript
function resolveSessionAndWindow(sessionID) {
  const rawActiveAgent = spiderState.activeAgent.get(sessionID);
  const strippedAgent = rawActiveAgent ? stripKnownSpiderPrefix(rawActiveAgent) : undefined;
  if (strippedAgent === ORCHESTRATOR_NAME)
    return null;
  // ... continues even for vanilla agents
```

**AFTER**:
```javascript
function resolveSessionAndWindow(sessionID) {
  const rawActiveAgent = spiderState.activeAgent.get(sessionID);
  // Defense in depth: if vanilla agent somehow got past delegationHandler, skip here too
  if (rawActiveAgent && !isSpiderSubAgent(rawActiveAgent)) {
    return null;
  }
  // ... rest only runs for spider agents
```

**Purpose**: Ensures no spider guardrails run for vanilla agents even if delegationHandler is bypassed.

---

### Fix 3: DEFENSE IN DEPTH - `guardrailsHooks.toolBefore` - Line ~53215

**BEFORE**:
```javascript
return {
  toolBefore: async (input, output) => {
    consecutiveNoToolTurns.set(input.sessionID, 0);
    handleDelegatedWriteTracking(input.sessionID, input.tool, output.args);
    // ... continues for all agents
```

**AFTER**:
```javascript
return {
  toolBefore: async (input, output) => {
    // Defense in depth: skip guardrails for vanilla agents
    const activeAgent = spiderState.activeAgent.get(input.sessionID);
    if (activeAgent && !isSpiderSubAgent(activeAgent)) {
      return;
    }
    // ... rest only runs for spider agents
```

**Purpose**: Blocks all spider guardrails from running for vanilla agents.

---

### Fix 4: Model Timeout Check - `tool.execute.before` - Line ~68849

**BEFORE**:
```javascript
// Check for silent model (rate limited) - if model hasn't responded in 3 minutes
const session_check = spiderState.agentSessions.get(input.sessionID);
if (session_check && checkModelResponseTimeout(session_check)) {
  // ... model fallback logic runs for vanilla agents too!
}
```

**AFTER**:
```javascript
// Check for silent model (rate limited) - only for spider sub-agents, not vanilla or architect
if (activeAgent && isSpiderSubAgent(activeAgent) && activeAgent !== ORCHESTRATOR_NAME && activeAgent !== "spider") {
  const session_check = spiderState.agentSessions.get(input.sessionID);
  if (session_check && checkModelResponseTimeout(session_check)) {
    // ... only runs for spider sub-agents
  }
}
```

**Purpose**: Prevents "MODEL FALLBACK SUPPRESSED" warnings for vanilla agents.

---

### Fix 5: Model Error Fallback - `guardrailsHooks.toolAfter` - Line ~53352

**BEFORE**:
```javascript
if (typeof errorContent === "string" && TRANSIENT_MODEL_ERROR_PATTERN.test(errorContent) && !session.modelFallbackExhausted) {
  session.model_fallback_index++;
  const baseAgentName = session.agentName ? session.agentName.replace(/^[^_]+[_]/, "") : "";
  // ... applies fallback for ALL agents including vanilla
}
```

**AFTER**:
```javascript
const baseAgentName = session.agentName ? session.agentName.replace(/^[^_]+[_]/, "") : "";
// Skip fallback for vanilla agents and architect - only apply to spider sub-agents
if (!isSpiderSubAgent(baseAgentName) || baseAgentName === "spider") {
  // Skip - vanilla agents and architect use native model selection
} else if (typeof errorContent === "string" && TRANSIENT_MODEL_ERROR_PATTERN.test(errorContent) && !session.modelFallbackExhausted) {
  // ... only runs for spider sub-agents
}
```

**Purpose**: Model fallback only applies to sub-agents (coder, reviewer, etc.), not vanilla or architect.

---

### Fix 6: Context Pressure Warning - `tool.execute.before` - Line ~68870

**BEFORE**:
```javascript
if (spiderState.lastBudgetPct >= 50) {
  const pressureSession = ensureAgentSession(input.sessionID, spiderState.activeAgent.get(input.sessionID) ?? ORCHESTRATOR_NAME);
  // ... pushes advisory messages for ALL agents
}
```

**AFTER**:
```javascript
// Context pressure warning - only for spider sub-agents, not vanilla or architect
const pressureActiveAgent = spiderState.activeAgent.get(input.sessionID);
if (spiderState.lastBudgetPct >= 50 && pressureActiveAgent && isSpiderSubAgent(pressureActiveAgent) && pressureActiveAgent !== ORCHESTRATOR_NAME && pressureActiveAgent !== "spider") {
  const pressureSession = ensureAgentSession(input.sessionID, pressureActiveAgent ?? ORCHESTRATOR_NAME);
  // ... only pushes for spider sub-agents
}
```

**Purpose**: Context pressure warnings only shown for spider sub-agents.

---

## Defense Layer Summary

| Layer | Fix | Line | What It Blocks |
|-------|-----|------|----------------|
| 1 PRIMARY | `delegationHandler` early return | ~54522 | `chat.message` won't set spider state for vanilla |
| 2 | `resolveSessionAndWindow` | ~53148 | Spider guardrails won't track vanilla sessions |
| 3 | `guardrailsHooks.toolBefore` | ~53215 | All spider tool hooks exit early for vanilla |
| 4 | Model timeout check | ~68849 | Model fallback skipped for vanilla/architect |
| 5 | Model error fallback | ~53352 | Model fallback only for spider sub-agents |
| 6 | Context pressure warning | ~68870 | Pressure warnings only for spider sub-agents |

---

## Hook Spillover Matrix

| Hook | Runs for All? | Has Vanilla Check? | Status |
|------|--------------|-------------------|--------|
| `chat.message` → `delegationHandler` | YES | YES ✅ | FIXED |
| `tool.execute.before` - stale delegation revert | YES | YES ✅ | OK |
| `tool.execute.before` - model timeout check | YES | YES ✅ | FIXED |
| `tool.execute.before` - context pressure warning | YES | YES ✅ | FIXED |
| `tool.execute.before` - guardrailsHooks | YES | YES ✅ | FIXED |
| `tool.execute.before` - scopeGuardHook | YES | YES ✅ | OK |
| `tool.execute.before` - delegationGateHooks | YES | YES ✅ | OK |
| `tool.execute.before` - activityHooks | YES | NO | OK |
| `guardrailsHooks.toolAfter` - model error fallback | YES | YES ✅ | FIXED |
| `guardrailsHooks.messagesTransform` - lastModelResponseTime | YES | NO | OK (harmless) |
| `messagesTransform` chain | YES | YES ✅ | OK |
| `systemTransform` chain | YES | YES ✅ | OK |
| `experimental.session.compacting` | YES | NO | OK |

---

## Root Cause Analysis

### The Spillover Chain (Before Fixes)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  chat.message hook fires (for ANY agent including vanilla plan/build)          │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  delegationHandler runs for ALL agents                                        │
│  Location: createDelegationTrackerHook() line ~54497                          │
│                                                                              │
│  PROBLEM CODE:                                                               │
│    const agentName = input.agent;  // "plan", "build", etc.                 │
│    spiderState.activeAgent.set(input.sessionID, agentName);  // SPILLS OVER! │
│    session.delegationActive = !isArchitect2;  // true for "plan"!           │
│    if (!isArchitect2 && guardrailsEnabled) {                                  │
│      beginInvocation(sessionID, agentName);  // SPIDER TRACKING FOR VANILLA │
│    }                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### What Got Polluted for Vanilla `plan` (Before Fix)

| Spider State Key | Value for Vanilla `plan` | Should Be |
|-----------------|-------------------------|-----------|
| `activeAgent` | `"plan"` | NOT SET |
| `agentSessions[sessionId]` | Created | NOT CREATED |
| `delegationActive` | `true` | `false` |
| `beginInvocation` called | YES | NO |

---

## Vanilla Agent List

Spider Agent should ONLY apply to spider agents:

| Agent | Type | Spider Applies? |
|-------|------|----------------|
| `plan` | Vanilla OpenCode | **NO - Skip** |
| `build` | Vanilla OpenCode | **NO - Skip** |
| `spider` | Spider orchestrator | YES - Full functionality |
| `coder` | Spider subagent | YES - Has fallback |
| `reviewer` | Spider subagent | YES - Has fallback |
| `test_engineer` | Spider subagent | YES - Has fallback |
| `explorer` | Spider subagent | YES - Has fallback |
| `sme` | Spider subagent | YES - Has fallback |
| `critic` | Spider subagent | YES - Has fallback |
| `docs` | Spider subagent | YES - Has fallback |
| `designer` | Spider subagent | YES - Has fallback |

---

## Architect Model Selection

**Finding**: The architect/spider model is **NOT hardcoded**. It uses:

1. Explicit config if set (`spiderAgents?.spider?.model`)
2. `DEFAULT_MODELS["spider"]` as fallback
3. **OpenCode can override via its native model selection**

This is correct behavior. The architect should use whatever model is selected in the OpenCode UI tab toggle.

**Model fallback only applies to sub-agents** (coder, reviewer, test_engineer, explorer, sme, critic, docs, designer) - NOT to architect/spider.

---

## Verification

### Code Verification
```
Fix 1 (delegationHandler):           Line 54522 - CONFIRMED
Fix 2 (resolveSessionAndWindow):     Line 53148 - CONFIRMED
Fix 3 (guardrailsHooks.toolBefore):  Line 53215 - CONFIRMED
Fix 4 (model timeout):              Line 68849 - CONFIRMED
Fix 5 (model error fallback):       Line 53352 - CONFIRMED
Fix 6 (context pressure):            Line 68870 - CONFIRMED
File size: 69023 lines
Syntax check: PASS
```

### Logic Verification

```
isSpiderSubAgent Logic Tests:
  [PASS] Vanilla plan:       plan => false
  [PASS] Vanilla build:     build => false
  [PASS] Spider orchestrator: spider => true
  [PASS] Spider coder:       coder => true
  [PASS] Spider reviewer:     reviewer => true

Fix 1 (delegationHandler) - Skip for Vanilla:
  [PASS] Vanilla plan: shouldSkip=true
  [PASS] Vanilla build: shouldSkip=true
  [PASS] Spider orchestrator: shouldSkip=false
  [PASS] Spider coder: shouldSkip=false
  [PASS] Spider reviewer: shouldSkip=false

Overall: ALL TESTS PASS
```

### Live Verification Checklist

After restart of OpenCode:

- [ ] Vanilla `plan` agent cannot write files (OpenCode native permissions)
- [ ] Vanilla `build` agent CAN write files
- [ ] Spider `spider` (orchestrator) agent has full spider functionality
- [ ] Spider `coder` agent has limited tools as expected
- [ ] Spider `reviewer` agent cannot write to `src/`
- [ ] No "MODEL FALLBACK SUPPRESSED" warnings for vanilla agents
- [ ] No context pressure warnings for vanilla agents
- [ ] No spider state pollution for vanilla sessions
- [ ] `DEBUG_SPIDER=1` shows no activity for vanilla agents
- [ ] Model fallback still works for spider sub-agents

---

## Files Modified

| File | Changes |
|------|---------|
| `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js` | 6 fixes applied |

**Note**: This was a direct dist patch. Source TypeScript files were NOT modified.

---

## Lessons Learned

1. **Plugin hooks run for ALL sessions**: When a plugin is loaded, its hooks execute for every session, not just plugin-specific sessions.

2. **Check agent type BEFORE setting state**: Any hook that sets plugin state or applies plugin logic MUST check if the agent is a plugin agent or vanilla agent first.

3. **Defense in depth**: Multiple layers of checks prevent spillover even if one layer is bypassed.

4. **The `chat.message` hook is entry point**: This hook fires before `tool.execute.before` and is often where agent identity is established. It MUST be guarded.

5. **`isSpiderSubAgent()` is key function**: Use this to distinguish spider agents from vanilla agents.

6. **Architect should use native model selection**: Model fallback should only apply to sub-agents, not the orchestrator.

---

## Debug Commands

Enable debug logging to verify fixes:
```bash
DEBUG_SPIDER=1 opencode
```

Check for spurious spider activity in vanilla mode:
```bash
# Should see NO "[DIAG] chat.message agent=plan" or "agent=build"
# Should see NO "MODEL FALLBACK" warnings for vanilla agents
```

---

**Debug Log Created**: 2026-04-03
**Fixes Applied By**: Spider Agent DevOps (via Leviathan session)
**Verification Completed**: 2026-04-03 (code verification)
**Status**: ✅ ALL FIXES APPLIED - Awaiting Live User Test

---

## Related Documentation

- Spider Agent Architecture: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/Spider Agent/ARCHITECTURE.md`
- OpenCode Vanilla Architecture: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Opencode Macro-Architecture/Opencode Vanilla/ARCHITECTURE.md`
- Test Plan: `./TEST_PLAN.md`