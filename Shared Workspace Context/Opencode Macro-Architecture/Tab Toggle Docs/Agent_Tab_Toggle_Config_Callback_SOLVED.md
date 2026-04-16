# Agent Tab Toggle Config Callback — SOLVED

**Date:** 2026-04-04
**Severity:** Critical (build-breaking)
**Status:** SOLVED
**Projects Affected:** Hermes Agent Plugin v2 (and likely any other plugin that returns `agent: [...]` as a plain array)

---

## The Symptom

Plugin loads without errors. All hooks and tools register fine. But when the user types `opencode` and looks at the agent tab toggle (top-right), **no custom agents appear**. Only the default OpenCode agents show.

User frustration: "Why won't my agents show up? I built this whole plugin and nothing happens."

---

## Root Cause — The Config Callback Is Required

The OpenCode SDK has **two ways** to return agents from a plugin:

### WRONG — Plain array (ignored by SDK)
```javascript
return {
  name: "my-plugin",
  agent: [          // ← SDK completely ignores this
    { name: "orchestrator", description: "...", instructions: PROMPT },
    { name: "coder", description: "...", instructions: PROMPT },
  ],
  // ...
};
```

**Result:** Plugin loads. Agents don't appear. No error. Silent failure.

### CORRECT — Via `config` callback
```javascript
return {
  name: "my-plugin",
  tool: { /* tools */ },
  config: async (opencodeConfig) => {
    // opencodeConfig.agent is the live agent registry object
    // Agents MUST be an object keyed by name, NOT a plain array
    const agents = {
      orchestrator: {
        name: "orchestrator",
        description: "...",
        instructions: PROMPT,
        mode: "primary",        // ← Required for tab toggle visibility
        permission: { task: "allow" },
        tools: {},
      },
      coder: {
        name: "coder",
        description: "...",
        instructions: PROMPT,
        mode: "subagent",       // ← Hidden from tab toggle
        tools: {},
      },
    };

    // Must use Object.assign or spread — agents is an object, not array
    if (!opencodeConfig.agent) {
      opencodeConfig.agent = { ...agents };
    } else {
      Object.assign(opencodeConfig.agent, agents);
    }
  }
};
```

**Result:** Agents appear in tab toggle immediately.

---

## The `mode` Field — Critical Detail

The OpenCode SDK `Agent` type is:
```typescript
type Agent = {
  name: string;
  mode: "subagent" | "primary" | "all";  // REQUIRED
  permission: {
    edit: "ask" | "allow" | "deny";
    bash: { [key: string]: "ask" | "allow" | "deny" };
    // ...
  };
  // ...
};
```

| `mode` value | Tab Toggle | Behavior |
|---|---|---|
| `"primary"` | **VISIBLE** | Shows as a tab. The orchestrator/lead agent. |
| `"subagent"` | Hidden | Does not appear in tab toggle. Used for delegated agents. |
| `"all"` | Unknown | Unclear — avoid unless documented. |

**The orchestrator MUST have `mode: "primary"` and `permission: { task: "allow" }`.**

---

## The `model` Field — Special Rule

When `mode === "primary"`:
```javascript
// WRONG
primaryConfig.model = "gpt-4o";

// CORRECT — delete the model field for primary agents
if (sdkConfig.mode === "primary") {
  delete sdkConfig.model;  // OpenCode resolves model for primary agents
}
```

Subagents retain their explicit model.

---

## The `tools` Field — Required Even If Empty

Every agent config needs a `tools` map:
```javascript
// Minimal (all tools disabled — use tool filter to enable specific ones)
coder: {
  name: "coder",
  mode: "subagent",
  tools: {
    write: false,
    edit: false,
    // ...
  },
  // ...
}
```

Without `tools`, the SDK may reject the agent config or fall back to defaults.

---

## Complete Pattern — `getAgentConfigs` from Spider Agent

This is the canonical implementation:
```javascript
function getAgentConfigs(config) {
  const agents = createAgents(config); // returns array of agent objects

  return Object.fromEntries(agents.map((agent) => {
    const sdkConfig = {
      ...agent.config,          // spread prompt, temperature, etc.
      description: agent.description,
    };

    // PRIMARY vs SUBAGENT
    if (agent.name === "spider" || agent.name.endsWith("_architect")) {
      sdkConfig.mode = "primary";
      sdkConfig.permission = { task: "allow" };
    } else {
      sdkConfig.mode = "subagent";
    }

    // Remove model for primary agents
    if (sdkConfig.mode === "primary") {
      delete sdkConfig.model;
    }

    // Tool filtering (optional but recommended)
    const allowedTools = AGENT_TOOL_MAP[baseAgentName];
    if (allowedTools) {
      sdkConfig.tools = Object.fromEntries(
        allowedTools.map(tool => [tool, true])
      );
    } else {
      // Default: minimal tools for unknown agents
      sdkConfig.tools = { write: false, edit: false };
    }

    return [agent.name, sdkConfig];
  }));
}
```

Then in the plugin return:
```javascript
config: async (opencodeConfig) => {
  const agentConfigs = getAgentConfigs(config);
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = { ...agentConfigs };
  } else {
    Object.assign(opencodeConfig.agent, agentConfigs);
  }
}
```

---

## Why This Fails Silently

OpenCode's plugin loader does **not** validate the `agent` array format at load time. It only reads `opencodeConfig.agent` when the config callback is invoked. A plain array is simply never referenced.

No error. No warning. Agents don't show.

---

## The Fix Applied

**Hermes Agent Plugin v2.1**:
- Converted `agent: [...]` array to `config: async (opencodeConfig) => { ... }` callback
- Built agent configs as an object via `Object.fromEntries`
- Set `mode: "primary"` on `hermes` (orchestrator)
- Set `mode: "subagent"` on all 18 sub-agents
- Added `permission: { task: "allow" }` on hermes
- Added `tools: {}` map on each agent
- Removed `model` field from primary agent config

---

## Lessons Learned

1. **The `config` callback is not optional for agent registration.** If you want agents in the tab toggle, you MUST use it.
2. **`mode: "primary"` is required for visibility.** Without it, the agent is invisible to the tab toggle.
3. **Return object, not array.** `opencodeConfig.agent` is an object keyed by agent name. Return format must match.
4. **The SDK validates nothing at load time.** Plugin will load "successfully" even if agents never register.
5. **Spider Agent is the reference implementation.** Copy its `getAgentConfigs` pattern exactly.

---

## Verification Checklist

After implementing agent registration, verify:
- [ ] Plugin loads without errors: `opencode --reload-plugins`
- [ ] Agent appears in tab toggle UI (top-right dropdown)
- [ ] Primary agent (`mode: "primary"`) is selectable as the active agent
- [ ] Subagents (`mode: "subagent"`) do NOT appear in tab toggle (correct — they are delegated)
- [ ] Switching to the custom agent works and loads its prompt
