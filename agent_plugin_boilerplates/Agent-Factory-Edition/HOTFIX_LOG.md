# OpenCode Plugin Agent — Hotfix Log

## Agent Tab Toggle Color Registration (Critical)

**Date:** 2026-04-04
**Severity:** Critical
**Affected:** All OpenCode plugin agents (Hermes v2, Spider Agent, etc.)
**Pattern ID:** OPENCODE-SDK-AGENT-REGISTRATION

---

## The Bug

When building a plugin agent that should appear in the OpenCode tab toggle, the agent does NOT appear even though:
- The plugin loads without errors
- All tools and hooks register correctly
- The `/Command` registration works

**Root Cause:** The OpenCode SDK silently ignores the `agent` property when returned as a plain array. It also ignores `instructions` in favor of `prompt` inside a `config` object.

---

## The Fix (Two Required Changes)

### Fix 1 — Agent Config Structure

**WRONG:**
```typescript
// ❌ Array — SDK ignores this entirely
return {
  name: "my-agent",
  agent: [/* agents */],      // ← IGNORED
  tool: { ... },
  config: async (oc) => { Object.assign(oc.agent, agents); }
};
```

**WRONG:**
```typescript
// ❌ Top-level instructions — SDK expects prompt inside config
const agentConfigs = {
  myAgent: {
    name: "myAgent",
    instructions: MY_PROMPT,     // ← WRONG FIELD NAME
    mode: "primary",
    tools: {}
  }
};
```

**CORRECT:**
```typescript
// ✅ Object with config: { prompt }
const agentConfigs = {
  myAgent: {
    name: "myAgent",
    description: "What it does",
    config: {                   // ← MUST be nested config object
      prompt: MY_PROMPT         // ← MUST be "prompt", NOT "instructions"
    },
    mode: "primary",            // ← "primary" for orchestrator, "subagent" for rest
    color: "#D35400",           // ← Optional: hex color for tab toggle
    permission: {               // ← Optional: SDK requires edit/bash fields
      edit: "allow",
      bash: {},
      webfetch: "allow",
      doom_loop: "allow",
      external_directory: "allow"
    },
    tools: {}                   // ← MUST be present (even if empty)
  }
};
```

### Fix 2 — Return Object Must Have Direct `agent` Property

**WRONG:**
```typescript
// ❌ Only config callback — SDK may not call it for tab toggle init
return {
  name: "my-agent",
  // NO agent property here!
  config: async (opencodeConfig) => {
    opencodeConfig.agent = { ...agentConfigs };  // ← too late for tab toggle
  },
  tool: { ... },
  hooks: { ... }
};
```

**CORRECT:**
```typescript
// ✅ BOTH direct agent property AND config callback
return {
  name: "my-agent",
  agent: agentConfigs,                    // ← DIRECT property (SDK reads at init)
  config: async (opencodeConfig) => {     // ← runtime merge (still needed)
    if (!opencodeConfig.agent) {
      opencodeConfig.agent = { ...agentConfigs };
    } else {
      Object.assign(opencodeConfig.agent, agentConfigs);
    }
  },
  tool: { ... },
  hooks: { ... }
};
```

---

## SDK Type Reference

```typescript
// From @opencode-ai/sdk — Agent type:
export type Agent = {
  name: string;
  description?: string;
  mode: "subagent" | "primary" | "all";
  builtIn: boolean;                    // ← Required in SDK type
  color?: string;                     // ← Optional hex color
  permission: {                       // ← Required sub-fields
    edit: "ask" | "allow" | "deny";
    bash: { [key: string]: "ask" | "allow" | "deny" };
    webfetch?: "ask" | "allow" | "deny";
    doom_loop?: "ask" | "allow" | "deny";
    external_directory?: "ask" | "allow" | "deny";
  };
  model?: { modelID: string; providerID: string };
  prompt?: string;                    // ← Field is "prompt" not "instructions"
  tools: { [key: string]: boolean };
  options?: { [key: string]: unknown };
  maxSteps?: number;
};

// AgentConfig (inside config object):
export type AgentConfig = {
  model?: { modelID: string; providerID: string };
  temperature?: number;
  topP?: number;
  prompt?: string;                   // ← "prompt" inside config, not top-level
  tools?: { [key: string]: boolean };
  options?: { [key: string]: unknown };
  maxSteps?: number;
};
```

---

## Color Field

The `color` field in `AgentConfig` (inside the `config` object) sets the hex color of the agent's pill in the OpenCode tab toggle. Example:

```typescript
const agentConfigs = {
  orchestrator: {
    name: "orchestrator",
    config: {
      prompt: ORCHESTRATOR_PROMPT,
      color: "#D35400"           // ← Sets tab toggle color
    },
    mode: "primary",
    tools: {}
  }
};
```

---

## Verification Checklist

After applying the fix, verify:

```bash
# 1. Check dist has agentConfigs as direct return property
grep "^    agent: agentConfigs," dist/index.js

# 2. Check all agents use config: { prompt } not instructions
grep -c 'instructions:' dist/index.js   # should be 0

# 3. Check color field is set
grep 'color: "#' dist/index.js | head

# 4. Reload OpenCode and check tab toggle
opencode --reload-plugins
# Agent should appear in tab toggle
```

---

## Hotfix Applied To

| Plugin | Version | Fix Applied |
|--------|---------|-------------|
| Hermes Agent Plugin | v2.1-build | `config: { prompt }`, direct `agent` property, `color: "#D35400"` |
| Spider Agent | 6.41.3 (dist) | `architect.config.color = "#FF3B30"` (manual dist patch) |

---

## Lessons Learned

1. The OpenCode SDK silently ignores invalid patterns — no errors, no warnings. The tab toggle simply stays empty.
2. The SDK reads `agent` as a **direct property** at plugin load time for tab toggle registration. The `config` callback only handles runtime merging.
3. The SDK type uses `prompt` inside a `config` object — not `instructions` at the agent top level.
4. The `permission` type requires `edit` and `bash` as required fields. Omitting them may cause silent failures.
5. Color is set per-agent inside `config: { color: "#HEX" }` — not at the return object level.

---

*Last updated: 2026-04-04*
