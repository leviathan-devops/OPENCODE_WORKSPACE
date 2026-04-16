# SHARK/MANTA PLUGIN CONFLICT AUDIT — CROSS-AGENT ACTIVATION BUG

**Created:** 2026-04-07  
**Auditor:** claude-code (mechanical audit)  
**Status:** DOCUMENT ONLY — Shark agent will self-fix  
**Source Config:** `/home/leviathan/.config/opencode/opencode.json`

---

## BUG SYMPTOM

When `spider-agent` is active, BOTH `shark-agent` and `manta-agent` plugins activate alongside it, contaminating the session with wrong coordinator initialization messages:

```
[MantaCoordinator] Initialized with Plan Brain
[SharkPeerDispatch] Triple-brain initialized: Execution + Reasoning + System
```

This happens even though neither `shark` nor `manta` agent was invoked via `@shark` or `@manta`.

**Expected Behavior:** Plugins should ONLY activate when their registered agent is explicitly invoked.

---

## ROOT CAUSE ANALYSIS

### The Config File Has TWO plugin definitions

**File:** `/home/leviathan/.config/opencode/opencode.json` (primary config)
**File:** `/home/leviathan/.opencode/opencode.jsonc` (session config)

Both files list plugins. The `.config` version is the actual one loaded by OpenCode.

**Current plugins in `.config/opencode/opencode.json`:**
```json
"plugin": [
  "file:///.../spider-agent",
  "file:///.../Hermes Agent Plugin/v2.3.3-build/dist/index.js",
  "file:///.../coding-subagents/dist/index.js",
  "file:///.../opencode-plugin-engineering/dist/index.js",
  "file:///.../manta-agent/dist",           ← NEW
  "file:///.../shark-agent/dist",           ← NEW
  "list"
]
```

**Current plugins in `.opencode/opencode.jsonc`:**
```json
"plugin": [
  "file:///.../Hermes Agent Plugin/v2.3.2-build/dist/index.js",
  "file:///.../manta-agent/dist",
  "file:///.../shark-agent/dist"
]
```

---

## BUG MECHANISM

### How OpenCode Plugin Loading Works

1. OpenCode reads `opencode.json` from `~/.config/opencode/`
2. Loads ALL plugins listed in the `plugin` array
3. Each plugin exports a default function: `export default async function Plugin(input: PluginInput): Promise<Hooks>`
4. ALL plugins' hooks are registered globally
5. When an agent is invoked via `@agent-name`, OpenCode activates that agent AND its registered hooks

### Why This Causes Cross-Contamination

The `shark-agent` and `manta-agent` plugins register global hooks:

```typescript
// shark-agent and manta-agent BOTH register these hooks:
return {
  event: createSessionHook(...),           // ← fires on ALL session.created events
  'tool.execute.before': createGuardianHook(...),  // ← fires on ALL tool calls
  'tool.execute.after': createGateHook(...),       // ← fires on ALL tool calls
  'experimental.session.compacting': createCompactingHook(...),
  'experimental.chat.system.transform': createSystemTransformHook(...),
  ...
}
```

When `spider-agent` creates a session, the `session.created` event fires. The `event` hook from BOTH shark AND manta ALSO fires because they're registered globally.

**The Critical Insight:** Plugins with `event` hooks that don't filter by agent name will fire for ALL sessions regardless of which agent is running.

---

## EXACT BUG LOCATION IN SHARK/MANTA CODE

### Bug Location 1: session-hook.ts — No Agent Filtering

**File:** `manta-agent/src/hooks/v4.1/session-hook.ts` and `shark-agent/src/hooks/v4.1/session-hook.ts`

```typescript
export function createSessionHook(...) {
  return async (input) => {
    const event = input.event as { type?: string; sessionId?: string };
    
    if (!event?.type) return;

    switch (event.type) {
      case 'session.created':
        await handleSessionCreated(...);  // ← ALWAYS runs, no agent filter
        break;
    }
  };
}
```

**Problem:** No check for which agent this session belongs to. It should only initialize for its own agent.

### Bug Location 2: tool.execute.before — No Agent Filtering

**File:** `manta-agent/src/hooks/v4.1/guardian-hook.ts` and `shark-agent/src/hooks/v4.1/guardian-hook.ts`

```typescript
export function createGuardianHook(guardian: Guardian) {
  return async (input, _output) => {
    // No session.agent check — fires for ALL agents
    if (!input.sessionID || !input.tool) return;
    // Guardian logic runs for EVERY tool call from EVERY agent
  };
}
```

### Bug Location 3: tool.execute.after — No Agent Filtering

**File:** `manta-agent/src/hooks/v4.1/gate-hook.ts` and `shark-agent/src/hooks/v4.1/gate-hook.ts`

```typescript
export function createGateHook(...) {
  return async (input, _output) => {
    // No agent filter — gate advancement runs for ALL agents
    if (!input.sessionID || !input.tool) return;
    // Gate logic runs for EVERY tool completion from EVERY agent
  };
}
```

### Bug Location 4: system-transform-hook.ts — No Agent Filtering

**File:** `manta-agent/src/hooks/v4.1/system-transform-hook.ts` and `shark-agent/src/hooks/v4.1/system-transform-hook.ts`

```typescript
export function createSystemTransformHook(...) {
  return async (input, output) => {
    // No agent filter — enforcement context injected into ALL sessions
    const systemOutput = output as { system: string[] };
    if (Array.isArray(systemOutput.system)) {
      systemOutput.system.push(enforcementContext);  // ←污染ALL sessions
    }
  };
}
```

---

## THE FIX: AGENT-AWARE HOOK FILTERING

### Pattern: Only Activate for Your Agent

Each hook must check if the current session belongs to its agent BEFORE doing any work.

**The challenge:** OpenCode's hook interface doesn't pass agent name directly. But the `sessionID` is available, and OpenCode stores session metadata somewhere.

### Fix Approach 1: Environment Variable (Quick Hack)

Set an agent-specific environment variable during plugin initialization:

```typescript
// In index.ts of each plugin:
export default async function MantaAgent(input: PluginInput): Promise<Hooks> {
  // Set agent identifier that hooks can read
  process.env.MANTA_ACTIVE = 'true';  // ← Only set when manta plugin loads
  
  const hooks = createSharkHooks(guardian, gm, ec, coordinator);
  
  return {
    ...hooks,
    config: async (cfg) => {
      cfg.agent['manta'] = { ... };
    },
  };
}
```

Then in hooks:
```typescript
export function createSessionHook(...) {
  return async (input) => {
    // QUICK FILTER: Only run if MANTA is the active agent
    if (process.env.MANTA_ACTIVE !== 'true') return;  // ← This doesn't actually work because env vars are global
  };
}
```

**Problem:** Environment variables are process-global. ALL plugins see ALL env vars.

### Fix Approach 2: Session-Based Filter (Correct)

Use the `sessionID` to determine which agent owns the session. The challenge is OpenCode doesn't expose this directly in hooks.

**Better pattern:** Have the hook do nothing on first call, and only activate AFTER the agent configuration has been set. But there's no reliable signal for "this session is now manta".

### Fix Approach 3: Agent Isolation via Separate Plugin Loading (Architectural Fix)

**The REAL fix:** Don't load both `manta-agent` and `shark-agent` in the same config unless you're running in a multi-agent mode. Each should be loadable independently.

**If you MUST load both:**
- Only register hooks that are truly global (like logging)
- Don't register enforcement hooks globally — instead, inject them via the agent's `instructions` or via a tool that the agent calls explicitly

### Fix Approach 4: Scoped Hook Registration (OpenCode Native)

**If OpenCode supports it:** Register hooks only for the specific agent. The `config` callback sets up the agent, and hooks should be tied to that agent scope.

Looking at how `spider-agent` and `hermes` work without conflicts would reveal the correct pattern. But the evidence suggests they use a different hook registration approach.

---

## VERIFICATION CHECKLIST

After fixing, verify:

```bash
# Test 1: spider-agent alone — no shark/manta contamination
opencode run "@spider test-message"
# Should show: NO [MantaCoordinator] or [SharkPeerDispatch] messages

# Test 2: manta alone — only manta coordinator initializes
opencode run "@manta manta-status"
# Should show: ONLY [MantaCoordinator] messages, NO [SharkPeerDispatch]

# Test 3: shark alone — only shark peer dispatch initializes  
opencode run "@shark shark-status"
# Should show: ONLY [SharkPeerDispatch] messages, NO [MantaCoordinator]

# Test 4: Cross-contamination check — grep the session output
opencode run "@spider test" 2>&1 | grep -E "Manta|Shark|Coordinator"
# Should return EMPTY — no cross-contamination
```

---

## RECOMMENDED FIX SEQUENCE FOR SHARK AGENT

### Step 1: Audit Current Hook Implementation

In `shark-agent/src/hooks/v4.1/`:
- [ ] `session-hook.ts` — what does it do on session.created?
- [ ] `guardian-hook.ts` — what does it block?
- [ ] `gate-hook.ts` — what gates does it advance?
- [ ] `system-transform-hook.ts` — what context does it inject?

### Step 2: Classify Hooks by Scope

| Hook | Current Scope | Correct Scope |
|------|--------------|---------------|
| `event: session.created` | ALL sessions | MANTA ONLY |
| `tool.execute.before` | ALL tools | MANTA ONLY |
| `tool.execute.after` | ALL tools | MANTA ONLY |
| `chat.system.transform` | ALL sessions | MANTA ONLY |
| `session.compacting` | ALL sessions | MANTA ONLY |

### Step 3: Implement Agent Filter

**Option A:** Filter by tool prefix (if OpenCode passes tool name)
- Only act if tool starts with `manta-` or `shark-`

**Option B:** Filter by agent config (requires OpenCode session API)
- Check if current session's agent matches plugin's registered agent

**Option C:** Remove global hooks entirely
- Move enforcement to explicit tool calls (agent calls `manta-gate --action advance`)
- Only `event: session.created` hook should initialize state, and only when agent matches

### Step 4: Self-Contained Verification

Each plugin must pass:
```bash
# No cross-talk with other agents
opencode run "@spider echo test" 2>&1 | grep -i "shark\|manta\|coordinator" → EMPTY

# Only activates for its own agent  
opencode run "@manta manta-status" 2>&1 | grep "MantaCoordinator" → FOUND
opencode run "@shark shark-status" 2>&1 | grep "SharkPeerDispatch" → FOUND
```

---

## ARCHITECTURAL PRINCIPLE FOR SELF-CONTAINED PLUGINS

A self-contained OpenCode plugin MUST NOT affect other plugins' sessions.

**Test:**
1. Load plugin in OpenCode alongside existing working plugins (spider, hermes)
2. Run existing agents — verify they work exactly as before
3. Run new plugin's agent — verify it works
4. Run existing agents again — verify no regression

**The bar is very high:** A plugin that breaks spider-agent or hermes is NOT production-ready.

---

## FILES TO AUDIT AND FIX

### manta-agent/
```
src/hooks/v4.1/session-hook.ts       ← Add agent filter or remove hook
src/hooks/v4.1/guardian-hook.ts     ← Add agent filter or scope to manta-tools
src/hooks/v4.1/gate-hook.ts          ← Add agent filter or scope to manta-tools  
src/hooks/v4.1/system-transform-hook.ts  ← Remove or scope to manta session
src/hooks/v4.1/compacting-hook.ts    ← Add agent filter or remove
src/index.ts                         ← Verify no global state leakage
```

### shark-agent/
```
src/hooks/v4.1/session-hook.ts       ← Add agent filter or remove hook
src/hooks/v4.1/guardian-hook.ts     ← Add agent filter or scope to shark-tools
src/hooks/v4.1/gate-hook.ts          ← Add agent filter or scope to shark-tools
src/hooks/v4.1/system-transform-hook.ts  ← Remove or scope to shark session
src/hooks/v4.1/compacting-hook.ts    ← Add agent filter or remove
src/index.ts                         ← Verify no global state leakage
```

---

## EXTERNAL REFERENCES

- **Plugin Boilerplate Pattern:** `/home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/hooks/`
- **Shark V4 Hook Integration Doc:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/build-context/REFERENCE/HOOKS_INTEGRATION.md`
- **Shark V4 Audit:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/build-context/REFERENCE/AUDIT.md`
- **Manta/Shark Split Build Prompt:** `/home/leviathan/OPENCODE_WORKSPACE/documentation/build-prompts/manta-shark-split-build-prompt.md`
- **OpenCode Plugin API:** `@opencode-ai/plugin` (installed in node_modules)

---

## SUMMARY FOR SHARK AGENT SELF-FIX

**The bug is not in the plugin architecture — it's in the hook implementations.**

Each hook fires globally regardless of which agent is running. The fix is NOT to make the plugins "self-contained" in terms of file structure (that's already done). The fix is to make the hooks SELF-CONSCIOUS — they must know whether they should be running for the current session.

**Recommended fix for shark-agent:**
1. Remove all hooks that fire on session lifecycle events
2. Keep only tool-based hooks that can filter by tool prefix
3. OR: Request OpenCode team for agent-scoped hook registration

**Interim workaround:**
Load only ONE of manta-agent OR shark-agent in the config at a time. Don't load both simultaneously unless agent scoping is confirmed working.
