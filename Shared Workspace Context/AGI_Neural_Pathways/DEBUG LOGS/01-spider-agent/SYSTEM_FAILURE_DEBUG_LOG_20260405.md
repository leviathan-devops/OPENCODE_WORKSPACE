# SYSTEM FAILURE DEBUG LOG

**Date:** 2026-04-05
**Incident:** Spider Agent stuck in brainstorm mode + Vanilla OpenCode broken + Agent Swarm derailment
**Severity:** CRITICAL - Complete workflow disruption
**Status:** Root cause identified, full audit complete

---

## EXECUTIVE SUMMARY

Three concurrent failures occurred:

1. **Spider Agent BRAINSTORM Gate Block**: Hermes Agent Plugin's `createBrainstormGateHook()` was injecting `[HARD-GATE BLOCKED] You are in the BRAINSTORM phase` into every Spider Agent response because its `_currentPhase` module-level global variable stays at `"idle"` forever and never syncs with Spider Agent's phase tracking.

2. **Vanilla OpenCode Broken**: The `opencode.json` configuration disables `architect`, `explore`, and `general` agents, leaving no fallback when Spider Agent is toggled off.

3. **Agent Swarm Derailment**: `AGENTS.md` contains 161 lines of irrelevant Agent Swarm documentation that floods every debugging session's context, pulling attention away from the actual plugin conflict.

---

## FAILURE #1: Spider Agent BRAINSTORM Gate Block

### Symptom
User toggles to Spider Agent, gives a task, but gets stuck in "brainstorm mode" - every response gets blocked with:

```
[HARD-GATE BLOCKED] You are in the BRAINSTORM phase. No implementation is permitted until:
1. Requirements are concrete (no "just build it")
2. Design doc is written to ~/hermes-workspace/docs/plans/
3. User has explicitly approved the design

Please continue with the brainstorm. Ask clarifying questions or write the design doc.
```

### Root Cause

**File:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/dist/index.js`
**Lines:** 120, 127-158
**Function:** `createBrainstormGateHook()`
**Hook:** `experimental.chat.messages.transform`

```javascript
// Line 120: Module-level global, initialized to "idle", NEVER changes
var _currentPhase = PHASES.IDLE;

// Line 124-126: Setter exists but NOTHING calls it from outside Hermes
function setCurrentPhase(phase) {
  _currentPhase = phase;
}

// Line 127-158: The gate hook
function createBrainstormGateHook() {
  return async (input, output) => {
    const phase = getCurrentPhase();  // Always returns "idle"
    if (phase !== PHASES.IDLE && phase !== PHASES.ANALYZE) {
      return;  // Never reaches this when Spider Agent is running
    }
    // ... detects code blocks, file edits, tool calls ...
    if (hasCodeBlocks || hasFileEdits || hasToolCalls) {
      // Appends [HARD-GATE BLOCKED] message
    }
  };
}
```

### Why `_currentPhase` Never Changes

1. **Spider Agent and Hermes are separate plugins** with separate JS module instances
2. Spider Agent tracks phase in its own state (`plan.json`, `.Spider/` files)
3. Hermes tracks phase in its in-memory `_currentPhase` variable
4. **There is no cross-plugin phase synchronization** - Spider Agent has no mechanism to call `setCurrentPhase()` on the Hermes plugin
5. Hermes's own phase monitor hook (`createPhaseMonitorHook()`) only monitors Hermes agents' own phase transitions, not Spider Agent's phases

### The Injection Chain

```
1. Spider Agent generates response with code/tool calls
2. Hermes brainstorm-gate hook fires (phase === "idle" matches)
3. Hook detects code blocks / file edits / tool calls in the response
4. Hook appends "[HARD-GATE BLOCKED] You are in the BRAINSTORM phase..."
5. Spider Agent receives its own response with the injected block text
6. Spider Agent gets confused by the contradictory instruction
7. Spider Agent loops back into brainstorming/clarifying questions
8. User sees "stuck in brainstorm mode"
```

### Evidence
Session log at `/home/leviathan/.local/share/opencode/log/2026-04-05T055156.log` contains **3 occurrences** of `HARD-GATE BLOCKED` — confirming the hook is actively injecting the brainstorm block into Spider Agent's responses.

---

## FAILURE #2: Vanilla OpenCode Broken

### Symptom
When Spider Agent is toggled off, vanilla OpenCode has no functional agents.

### Root Cause

**File:** `/home/leviathan/.config/opencode/opencode.json`
**Lines:** 391-401

```json
"agent": {
  "architect": { "disable": true },
  "explore": { "disable": true },
  "general": { "disable": true }
}
```

This disables:
- **architect** — OpenCode's built-in planning/architecture agent
- **explore** — OpenCode's built-in codebase exploration agent
- **general** — OpenCode's default general-purpose agent

### Impact
When you toggle OFF Spider Agent and try to use vanilla OpenCode, the three default agents that would normally handle work are all disabled. There is no fallback agent available. The user has effectively removed all non-Spider agents from the system.

### Additional Issue: Permission Model Wide Open

**Lines:** 442-445
```json
"permission": {
  "*": { "*": "allow" }
}
```

This allows all tools without any permission gates. Not directly causing the brainstorm issue, but means there's no safety net.

---

## FAILURE #3: Agent Swarm Derailment

### Symptom
During debugging, the investigation went off-track focusing on Agent Swarm MCP tools instead of the actual root cause.

### Root Cause

**File:** `/home/leviathan/AGENTS.md` (entire file, 161 lines)

This file is loaded into every session as system context (it's the repo-level agent instructions file). It contains extensive Agent Swarm documentation that is **completely irrelevant** to the Spider Agent plugin:

```markdown
## Core Architecture

This system uses **agent-swarm** (desplega-ai/agent-swarm) as the multi-agent orchestration layer for OpenCode. OpenCode connects to agent-swarm via MCP (Model Context Protocol) to delegate tasks, share memory, and coordinate with worker agents.
```

This is **false**. Agent Swarm is an MCP connection configured in `opencode.json` lines 402-410, but it's a **separate system** — a remote service at `localhost:3013`. It has nothing to do with Spider Agent's plugin architecture or the brainstorm gate.

### Why It Derailed Debugging

1. AGENTS.md is loaded into every session as system context
2. It contains 161 lines of Agent Swarm documentation
3. Any debugging session that reads AGENTS.md gets flooded with Agent Swarm context
4. The `tools` section in `opencode.json` (lines 412-433) enables 20+ `agent_swarm_*` tools, further polluting context
5. Debugging sessions follow the false trail instead of checking plugin conflicts

### Verdict
Agent Swarm is **not involved** in the brainstorm mode bug. It's a parallel system that happens to be configured. The AGENTS.md file is misleading and should be corrected.

---

## FULL FAILURE CHAIN

```
USER ACTION: Toggle to Spider Agent, give a task
     │
     ▼
OPENCODE LOADS: 5 plugins from opencode.json lines 435-441:
  1. spider-agent (Spider's 11-agent swarm) ✅
  2. hive-mind-plugin (FAILS - missing @opencode-ai/plugin) ❌
  3. Hermes Agent Plugin v2.1-build/dist/index.js ✅ ← THE PROBLEM
  4. coding-subagents ✅
  5. opencode-plugin-engineering ✅
     │
     ▼
HERMES PLUGIN registers hooks:
  - experimental.chat.messages.transform → composeHandlers([
      createBrainstormGateHook(),     ← THIS IS THE KILLER
      createPlanValidatorHook(),
      createStrictWriteDisciplineHook(),
      ...
    ])
     │
     ▼
HERMES _currentPhase = "idle" (module global, never changes)
     │
     ▼
SPIDER AGENT generates a response with code/tool calls
     │
     ▼
HERMES brainstorm-gate hook fires (phase === "idle" matches)
  → Detects code blocks / file edits / tool calls
  → Appends "[HARD-GATE BLOCKED] You are in the BRAINSTORM phase..."
     │
     ▼
SPIDER AGENT receives its own response with the injected block text
  → Gets confused by the contradictory instruction
  → Loops back into brainstorming/clarifying questions
  → User sees "stuck in brainstorm mode"
     │
     ▼
DEBUGGING SESSION starts
  → Reads AGENTS.md → gets flooded with Agent Swarm context
  → Goes off-track investigating MCP/Agent Swarm instead of plugins
  → Never identifies the Hermes/Spider plugin conflict
```

---

## PLUGIN CONFLICT ANALYSIS

### Plugins Loaded (from `opencode.json` lines 435-441)

| Plugin | Path | Status | Hooks Registered |
|--------|------|--------|-----------------|
| spider-agent | `plugins/spider-agent` | ✅ Loads | system-enhancer, delegation-gate, scope-guard, messages transform, etc. |
| hive-mind-plugin | `Hive Mind Plugin/v4/hive-mind-plugin.ts` | ❌ FAILS | None (Cannot find module '@opencode-ai/plugin') |
| hermes-agent | `Hermes Agent Plugin/v2.1-build/dist/index.js` | ✅ Loads | **brainstorm-gate**, plan-validator, tdd-enforcer, phase-monitor, etc. (25+ hooks) |
| coding-subagents | `plugins/coding-subagents/dist/index.js` | ✅ Loads | qwen/gemma subagent tools |
| opencode-plugin-engineering | `plugins/opencode-plugin-engineering/dist/index.js` | ✅ Loads | Engineering knowledge base |

### The Conflict

**Both Spider Agent and Hermes Agent Plugin register `experimental.chat.messages.transform` hooks.** They run in plugin load order. The Hermes brainstorm-gate hook runs on EVERY message transform and has no awareness of which agent is speaking — it only checks its own stale `_currentPhase` variable.

Spider Agent has its own phase tracking (via `plan.json` and the `extractCurrentPhase`/`extractCurrentPhaseFromPlan` functions), but this is completely invisible to the Hermes plugin.

### Additional Plugin Load Failures

Two additional plugins fail to load silently:
1. `Hive Mind Plugin/v4/hive-mind-plugin.ts` — `Cannot find module '@opencode-ai/plugin'`
2. `path=list` — `Plugin export is not a function` (corrupted config entry)

These failures don't cause the brainstorm bug but add noise and wasted startup time.

---

## SUMMARY

| Problem | Root Cause | File | Fix |
|---------|-----------|------|-----|
| Spider stuck in brainstorm | Hermes `_currentPhase` global never synced with Spider's phase | `Hermes Agent Plugin/dist/index.js:120,127-158` | Remove Hermes plugin when using Spider, or add cross-plugin phase sync, or add Spider Agent pattern detection bypass |
| Vanilla OpenCode broken | `architect`, `explore`, `general` agents all disabled | `opencode.json:391-401` | Set `"disable": false` or remove the agent block |
| Debugging derailed | AGENTS.md contains irrelevant Agent Swarm docs | `AGENTS.md` (entire file) | Rewrite AGENTS.md to focus on Spider Agent, remove Agent Swarm |
| Plugin load noise | 2 plugins fail to load at startup | Session logs | Remove broken plugin paths from config |

---

## RECOMMENDED FIXES

### Immediate (Priority 1)
1. **Remove or disable Hermes Agent Plugin** when using Spider Agent — they conflict on `experimental.chat.messages.transform`
2. **Re-enable vanilla agents** in `opencode.json` — set `"disable": false` for `architect`, `explore`, `general`
3. **Fix AGENTS.md** — remove Agent Swarm documentation, focus on Spider Agent architecture

### Structural (Priority 2)
4. **Remove broken plugin paths** from `opencode.json` — `hive-mind-plugin.ts` and corrupted `path=list` entry
5. **Add plugin conflict detection** — log when multiple plugins hook into the same event
6. **Add cross-plugin phase sync** — if both plugins must coexist, they need to share phase state

### Process (Priority 3)
7. **Document plugin architecture** — create a plugin hook map for future debugging
8. **Add systematic debugging checklist** — when debugging plugin issues, check ALL plugins first

---

*Generated from forensic analysis of Spider Agent, Hermes Agent Plugin, OpenCode Vanilla architecture, and session logs.*
