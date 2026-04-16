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

## Additional Bugs Found (v2.1 — second round)

After fixing the config callback pattern, agents still didn't appear in the tab toggle. Additional issues were found:

### Bug 2 — `instructions` instead of `prompt`

**Wrong:**
```javascript
hermes: {
  name: "hermes",
  description: "...",
  instructions: HERMES_PROMPT,  // ← WRONG field name
  mode: "primary",
  ...
}
```

**Correct (Spider pattern):**
```javascript
hermes: {
  name: "hermes",
  description: "...",
  config: {
    prompt: HERMES_PROMPT   // ← Nested config object with `prompt` field
  },
  mode: "primary",
  ...
}
```

The SDK `AgentConfig` type uses `prompt`, not `instructions`. Spider Agent's agents all use `config: { prompt: ... }`.

### Bug 3 — Missing direct `agent` property on return object

Spider Agent has BOTH:
```javascript
return {
  name: "spider-agent",
  agent: agents,           // ← DIRECT property (SDK reads this for tab toggle)
  tool: { ... },
  config: async (...) => {  // ← callback for runtime merging
    Object.assign(opencodeConfig.agent, agents);
  }
};
```

The SDK reads `agent` as a **direct property** at init time for tab toggle registration. The `config` callback only handles runtime merging. If only `config` callback is present and no direct `agent` property, the tab toggle may not see agents at startup.

### Bug 4 — Wrong `permission` structure

**Wrong:**
```javascript
permission: { task: "allow" }  // ← Wrong field names
```

**Correct (full structure):**
```javascript
permission: { edit: "allow", bash: {}, webfetch: "allow", doom_loop: "allow", external_directory: "allow" }
// OR just remove it entirely — Spider Agent doesn't set permission at all
```

The SDK `Agent.permission` type has `edit` and `bash` as **required** fields (no `?`). Spider Agent doesn't set permission — the SDK must provide defaults.

## The Fix Applied (v2.1 — final)

**Hermes Agent Plugin v2.1** now matches Spider Agent exactly:

```javascript
const agentConfigs = {
  hermes: {
    name: "hermes",
    description: "Leviathan's persistent 2nd-brain orchestrator",
    config: {
      prompt: HERMES_PROMPT    // ← Nested config with `prompt`
    },
    mode: "primary",
    permission: { edit: "allow", bash: {}, webfetch: "allow", doom_loop: "allow", external_directory: "allow" },
    tools: {}
  },
  analyst: {
    name: "analyst",
    description: "Requirements → technical specs",
    config: {
      prompt: ANALYST_PROMPT
    },
    mode: "subagent",
    tools: {}
  },
  // ... all 19 agents
};

return {
  name: "hermes-agent",
  agent: agentConfigs,           // ← DIRECT property for tab toggle
  config: async (opencodeConfig) => {   // ← runtime merge
    Object.assign(opencodeConfig.agent, agentConfigs);
    opencodeConfig.command = { ... };
  },
  tool: { /* 28 tools */ },
  // hooks...
};
```

**Also fixed:** The opencode.json config path was still pointing to `v2-build` (broken) instead of `v2.1-build` (fixed). Updated the path.

**Build output:** 15,329 lines, 534KB. All 19 agents verified:
- 1 `mode: "primary"` (hermes)
- 18 `mode: "subagent"`
- 19 `config: { prompt }` structures

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
