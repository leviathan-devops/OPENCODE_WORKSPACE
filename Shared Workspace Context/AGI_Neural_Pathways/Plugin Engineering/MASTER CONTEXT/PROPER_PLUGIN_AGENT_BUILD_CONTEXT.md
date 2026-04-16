# OpenCode Agent Plugin Engineering — Complete Build Context

**Purpose**: Inject this document into any build agent at the start of a plugin build to provide first-hand context on how to properly engineer OpenCode agent plugins that actually work.

**Status**: Production Grade
**Last Updated**: 2026-04-05
**Source Knowledge**: spider-agent source, Plugin Engineering knowledge base, Tab Toggle documentation, Agent Factory Edition boilerplate

---

## Table of Contents

1. [The Fundamental Distinction](#1-the-fundamental-distinction)
2. [What a Plugin Actually Is](#2-what-a-plugin-actually-is)
3. [Directory Structure](#3-directory-structure)
4. [The Plugin Entry Point](#4-the-plugin-entry-point)
5. [Agent Registration (Tab Toggles)](#5-agent-registration-tab-toggles)
6. [The Hook System](#6-the-hook-system)
7. [Build Process](#7-build-process)
8. [Registration in opencode.json](#8-registration-in-opencodejson)
9. [State Directory Pattern](#9-state-directory-pattern)
10. [Reference Implementation: Spider Agent](#10-reference-implementation-spider-agent)
11. [Common Failure Modes](#11-common-failure-modes)
12. [Quick Reference Commands](#12-quick-reference-commands)

---

## 1. The Fundamental Distinction

> **SKILL ≠ PLUGIN**
> - Skill = `.md` file in `~/.hermes/skills/` → Agent knowledge (Hermes reads it)
> - Plugin = `.js` bundle in `opencode.json` → OpenCode runtime (loads at startup)

**They are completely different systems.** Conflating them is the #1 reason plugins fail.

| Aspect | Skill | Plugin |
|--------|-------|--------|
| Location | `~/.hermes/skills/` | `opencode.json` plugin array |
| Format | Markdown (SKILL.md) | JavaScript bundle (dist/index.js) |
| Loaded by | Hermes agent (manual via `skill_view`) | OpenCode (at startup) |
| Purpose | Agent knowledge/context | Tools, agents, hooks |

---

## 2. What a Plugin Actually Is

A plugin is a **compiled JavaScript bundle** that OpenCode loads at startup. It exposes:

1. **Tools** — Executable functions agents can call
2. **Hooks** — Interceptors at various points in the agentic loop
3. **Agents** — Custom agent configurations (for tab toggles)
4. **Commands** — Custom slash commands (e.g., `/swarm`)

### Plugin Return Type

```typescript
import type { Plugin } from '@opencode-ai/plugin';

export default async function MyPlugin(input): Promise<Hooks> {
  return {
    name: 'my-plugin',           // Optional: plugin name
    tool: {                      // Optional: custom tools
      myTool: tool({ ... }),
    },
    config: async (opencodeConfig) => {  // Optional: agent registration
      // Agent configs go here
    },
    // ... hooks
  };
}
```

---

## 3. Directory Structure

```
plugins/my-agent/
├── src/
│   └── index.ts          ← Entry point (plugin function)
├── dist/                 ← Built output (what OpenCode loads)
│   └── index.js          ← MUST exist after build
├── package.json
├── tsconfig.json
└── SKILL.md              ← Optional (for plugin discovery, NOT the plugin itself)
```

**Critical Rules**:
- OpenCode loads `dist/index.js`, NOT the TypeScript source
- Never point `opencode.json` to a folder — always to `dist/index.js`
- The `SKILL.md` in the plugin folder is for skill discovery, NOT the plugin itself

---

## 4. The Plugin Entry Point

```typescript
import type { Plugin, PluginInput } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';

export default async function MyPlugin(input: PluginInput): Promise<Hooks> {
  // input provides: directory, client, ask, abort, metadata

  return {
    // Tool definitions
    tool: {
      myTool: tool({
        description: 'What it does',
        args: {
          name: z.string().describe('Required arg'),
          opt: z.string().optional().describe('Optional'),
        },
        execute: async (args, ctx) => {
          // ctx provides: sessionID, agent, directory, worktree, abort, metadata, ask
          return JSON.stringify({ result: 'ok' });
        },
      }),
    },

    // Agent registration via config callback
    config: async (opencodeConfig) => {
      // Register agents here (see Agent Registration section)
    },
  };
}
```

---

## 5. Agent Registration (Tab Toggles)

### The #1 Broken Part

**Agent registration is the most commonly failed part of plugin engineering.** It silently fails if done wrong.

### Wrong — Plain Array (SDK Completely Ignores This)

```javascript
return {
  agent: [  // ← SDK COMPLETELY IGNORES THIS
    { name: 'my-agent', instructions: '...' },
  ],
};
```

**Result**: Plugin loads. Agents don't appear. No error. Silent failure.

### Correct — Via `config` Callback with Object

```typescript
config: async (opencodeConfig: Record<string, unknown>) => {
  const agents = {
    'my-agent': {
      name: 'my-agent',
      description: 'What it does',
      instructions: 'SYSTEM PROMPT HERE',
      mode: 'primary',  // ← REQUIRED for tab toggle visibility
      permission: { task: 'allow' },
      tools: {},  // Required even if empty
    },
    'my-subagent': {
      name: 'my-subagent',
      description: 'Background worker',
      instructions: 'SYSTEM PROMPT HERE',
      mode: 'subagent',  // ← Hidden from tab toggle
      permission: { task: 'allow' },
      tools: {},
    },
  };

  // MUST use Object.assign — agents is an OBJECT, not array
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = { ...agents };
  } else {
    Object.assign(opencodeConfig.agent, agents);
  }
}
```

### The `mode` Field

| Value | Tab Toggle | Use |
|-------|-----------|-----|
| `"primary"` | **VISIBLE** | Orchestrator/lead agent (appears in tab toggle) |
| `"subagent"` | Hidden | Delegated agents only (used via delegation, not visible) |

### Special Rule for Primary Agents

When `mode === "primary"`, **do NOT set a `model` field**:

```typescript
// WRONG for primary
primaryConfig.model = 'gpt-4o';

// CORRECT — delete the model field for primary agents
if (sdkConfig.mode === 'primary') {
  delete sdkConfig.model;
}
```

OpenCode resolves the model for primary agents from the user's config.

### Complete Pattern from Spider Agent

```typescript
function getAgentConfigs(agents: AgentDefinition[]): Record<string, SDKAgentConfig> {
  return Object.fromEntries(
    agents.map((agent) => {
      const sdkConfig: SDKAgentConfig = {
        ...agent.config,
        description: agent.description,
      };

      // PRIMARY vs SUBAGENT
      if (agent.name === 'orchestrator' || agent.name.endsWith('_architect')) {
        sdkConfig.mode = 'primary';
        sdkConfig.permission = { task: 'allow' };
      } else {
        sdkConfig.mode = 'subagent';
      }

      // Remove model for primary agents
      if (sdkConfig.mode === 'primary') {
        delete sdkConfig.model;
      }

      return [agent.name, sdkConfig];
    })
  );
}

// In plugin return:
config: async (opencodeConfig) => {
  const agents = getAgentConfigs(createAgents(config));
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = { ...agents };
  } else {
    Object.assign(opencodeConfig.agent, agents);
  }
}
```

---

## 6. The Hook System

Hooks intercept the agentic loop at specific points:

| Hook | When | Blocking? | Use |
|------|------|-----------|-----|
| `tool.execute.before` | Pre-tool | **Yes** | Validate, block, modify args |
| `tool.execute.after` | Post-tool | No | Track, evidence, modify output |
| `command.execute.before` | Pre-command | Yes | Intercept slash commands |
| `chat.message` | On message | **Yes** | Route, delegate, modify message |
| `chat.params` | Pre-LLM | No | Tune system prompt |
| `experimental.session.compacting` | Pre-compact | No | Inject context |

### Hook Signature

```typescript
'tool.execute.before': async (input, output) => {
  // input = { tool: string, args: Record<string, unknown>, callID: string, sessionID: string }
  // output = { output: string | object } (can modify before returning)
  // Return value = determines if tool execution continues

  // Example: block a tool
  if (input.tool === 'secretscan' && !hasPermission(input.sessionID)) {
    return { block: true, reason: 'No permission' };
  }
}

'tool.execute.after': async (input, output) => {
  // input = tool call info
  // output = { output: string | object }
  // Can record evidence, modify output, etc.

  await recordEvidence(input);
}
```

### Hook Composition

Spider Agent uses `composeHandlers` to combine multiple hooks:

```typescript
import { composeHandlers } from './hooks';

const toolBeforeHook = composeHandlers(
  createGuardrailsHooks(),
  createScopeGuardHook(),
  createDelegationGateHook(),
  // ... more hooks
);

return {
  'tool.execute.before': toolBeforeHook,
};
```

---

## 7. Build Process

### Build Command

```bash
cd plugins/my-agent
bun install
bun build src/index.ts \
  --outdir dist \
  --target bun \
  --format esm \
  --bundle
```

### What the Flags Do

| Flag | Purpose |
|------|---------|
| `--outdir dist` | Output to dist/ directory |
| `--target bun` | Target Bun runtime |
| `--format esm` | ESM module format |
| `--bundle` | Bundle all dependencies into single file |

### Verify Build

```bash
ls -la dist/
# Should show: dist/index.js (and possibly .d.ts files)

# File size should be reasonable (not 0 bytes)
wc -l dist/index.js
```

### Rebuild After Changes

**After ANY change to src/, always rebuild:**

```bash
bun run build
```

OpenCode loads the bundled JS, not the TypeScript source.

---

## 8. Registration in opencode.json

### The Correct Path

```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/my-agent/dist/index.js"
  ]
}
```

### Path Resolution Rules

| Path Type | Resolution |
|-----------|------------|
| Ends in `.js` | Load directly |
| Ends in `.ts` | Compile and load |
| Is a directory | Look for `dist/index.js` or `index.js` |

### Verify Registration

```bash
# Check plugin loads
opencode --print-logs --agent default "test"

# Look for: service=plugin path=... loading plugin

# Check agent appears in tab toggle
# (Top-right dropdown in OpenCode UI)
```

---

## 9. State Directory Pattern

Plugins use a `.{plugin-name}/` directory for persistence:

```
project/
├── .shark/                    ← Shark plugin state
│   ├── state.json            ← Current workflow state
│   ├── plan.md               ← Active plan
│   ├── evidence/             ← Gate evidence
│   │   ├── architect-gate/
│   │   ├── build-gate/
│   │   ├── test-gate/
│   │   ├── verify-gate/
│   │   ├── audit-gate/
│   │   └── delivery-gate/
│   ├── iterations/           ← V1.0, V1.1, etc.
│   │   ├── v1.0/
│   │   │   └── debug-logs/
│   │   └── v1.1/
│   └── checkpoints/          ← Git snapshots
└── shark-context/            ← Context library (T1 + T2)
    ├── INDEX.md
    ├── MENTAL_MODEL.md
    ├── PURPOSE.md
    └── REFERENCE/
```

### State Management

Spider Agent uses a sophisticated state system:

```typescript
// From spider-agent/src/state.ts
export interface SwarmState {
  agentSessions: Map<string, AgentSession>;
  activeAgent: Map<string, string>;
  // ...
}

// State is persisted via snapshot hooks
const snapshotWriterHook = createSnapshotWriterHook(ctx.directory);
```

---

## 10. Reference Implementation: Spider Agent

Spider Agent is the canonical reference for OpenCode plugin engineering.

### Key Files to Study

| File | Purpose |
|------|---------|
| `spider-source/src/index.ts` | Main entry point, hook wiring, agent registration |
| `spider-source/src/agents/index.ts` | `getAgentConfigs()`, agent factory |
| `spider-source/src/hooks/` | 12 hook implementations |
| `spider-source/src/tools/` | 46 tool definitions |
| `spider-source/src/state.ts` | State management |
| `spider-source/src/config/` | Configuration schemas |

### Spider Agent Architecture

```
Spider Agent (11-agent swarm)
├── Architect (primary)     — Orchestrator, plan creator
├── Coder                  — Implementation
├── Reviewer               — Code review
├── Test Engineer          — Test generation
├── SME                    — Domain expert consultation
├── Explorer               — Investigation
├── Critic                 — Plan challenger
├── Curator Init           — Knowledge extraction (init)
├── Curator Phase          — Knowledge extraction (phase)
├── Docs                   — Documentation
└── Designer               — UI/UX design
```

### Hook Count: 12

| Hook | Purpose |
|------|---------|
| `system-enhancer` | System prompt enhancement |
| `guardrails` | Safety validation |
| `delegation-gate` | QA gate enforcement |
| `scope-guard` | File scope containment |
| `slop-detector` | Quality detection |
| `dark-matter-detector` | Unresolved gap reminders |
| `consolidateSystemMessages` | Message consolidation |
| `context-budget` | Context usage warnings |
| `knowledge-injector` | Knowledge injection |
| `knowledge-curator` | Knowledge extraction |
| `brainstorm-gate` | Phase 0 enforcement |
| `self-review` | Self-review |

---

## 11. Common Failure Modes

### 1. No dist/index.js

```
ERROR: Plugin path doesn't resolve to a .js file
FIX: Run `bun run build` in the plugin directory
```

### 2. Wrong Path in opencode.json

```
WRONG:  "file:///path/to/plugin-folder/"
RIGHT:  "file:///path/to/plugin-folder/dist/index.js"
```

### 3. Conflating SKILL with PLUGIN

```
WRONG:  "file:///path/to/SKILL.md"
WRONG:  "file:///path/to/handoff-folder/"
RIGHT:  "file:///path/to/plugin/dist/index.js"
```

### 4. Forgetting to Rebuild After Changes

```
FIX: After any src/ change, always run `bun run build`
```

### 5. Agent Array Instead of Object

```
WRONG:
  agent: [ { name: 'my-agent', ... } ]  // SDK ignores this

CORRECT:
  config: async (opencodeConfig) => {
    opencodeConfig.agent = { 'my-agent': { name: 'my-agent', ... } };
  }
```

### 6. Missing `mode: "primary"` for Tab Toggle

```
WRONG:
  agent: { name: 'my-agent', mode: 'subagent' }  // Hidden from tab toggle

CORRECT:
  agent: { name: 'my-agent', mode: 'primary' }  // Visible in tab toggle
```

### 7. Setting `model` on Primary Agent

```
WRONG:
  primaryConfig.model = 'gpt-4o';  // Breaks primary agent

CORRECT:
  delete primaryConfig.model;  // Let OpenCode resolve model
```

---

## 12. Quick Reference Commands

### Build Plugin

```bash
cd plugins/my-agent
bun install
bun run build
```

### Verify Bundle

```bash
ls -la dist/
wc -l dist/index.js
```

### Test Plugin Loads

```bash
opencode --print-logs --agent default "test"
# Look for: service=plugin path=... loading plugin
```

### Check Registration

```bash
cat ~/.config/opencode/opencode.json | jq '.plugin'
```

### Development Workflow

```bash
# 1. Make changes to src/
# 2. Rebuild
bun run build

# 3. Reload plugins
opencode --reload-plugins

# 4. Test
opencode --print-logs --agent my-agent "test task"

# 5. Check logs for errors
opencode --print-logs --agent my-agent "test task" 2>&1 | grep -i error
```

---

## Shark V4 Specific Patterns

### Two Tab Toggles (Micro + Macro)

Both Shark Micro and Shark Macro need `mode: "primary"`:

```typescript
config: async (opencodeConfig) => {
  if (!opencodeConfig.agent) opencodeConfig.agent = {};

  Object.assign(opencodeConfig.agent, {
    'shark-micro': {
      name: 'shark-micro',
      description: 'Dual-brain sequential (Plan ↔ Build)',
      instructions: 'SYSTEM PROMPT FOR SHARK MICRO',
      mode: 'primary',
      permission: { task: 'allow' },
      tools: {},
    },
    'shark-macro': {
      name: 'shark-macro',
      description: 'Triple-brain parallel (Execution + Reasoning + System)',
      instructions: 'SYSTEM PROMPT FOR SHARK MACRO',
      mode: 'primary',
      permission: { task: 'allow' },
      tools: {},
    },
  });
}
```

### Shark V4 Gate Chain

```
PLAN ──► BUILD ──► TEST ──► VERIFY ──► AUDIT ──► SHIP
                          ↑       │
                          └───────┘ (iteration loop)

If VERIFY fails 3x ──► back to PLAN (V1.0 ──► V1.1)
```

### Guardian Zones (SANDBOX Default)

| Zone | Access | Notes |
|------|--------|-------|
| SANDBOX | Full | Default, nothing blocked |
| WORKSPACE | Full | Project directory |
| PERSONAL | BLOCKED | ~/.ssh, ~/.aws, Documents |
| SYSTEM | BLOCKED | /bin, /usr, /System |

---

## V4 Boilerplate Components

The Agent Factory Edition boilerplate provides foundational components:

| Component | Purpose | Location |
|-----------|---------|----------|
| `StateStore` | Domain ownership enforcement | `src/factory/StateStore.ts` |
| `BrainMessenger` | Priority signaling (Critical > High > Normal > Low) | `src/factory/BrainMessenger.ts` |
| `ArchitectureFactory` | Assembly logic for configurable architectures | `src/factory/ArchitectureFactory.ts` |
| `AgentFactory` | Agent creation | `src/factory/AgentFactory.ts` |
| `ClusterFactory` | Cluster management | `src/factory/ClusterFactory.ts` |

**Self-containment rule**: Copy these into the plugin rather than importing. Every codebase should be self-contained.

---

## Documentation References

| Document | Location | Purpose |
|----------|----------|---------|
| PLUGIN_CHEATSHEET.md | Plugin Engineering/ | Single-page quick reference |
| QUICKSTART.md | Plugin Engineering/ | 1-page quickstart |
| PLUGIN_SHIP_SOP.md | Plugin Engineering/ | Shipping methodology |
| OPENCODE_HOOK_MAP.md | Plugin Engineering/ | Complete hook reference |
| Agent_Tab_Toggle_Config_Callback_SOLVED.md | Tab Toggle Docs/ | Tab toggle fix documentation |
| spider-source/src/index.ts | spider-source/ | Canonical plugin entry point |

---

*Build Context Document*
*Version: 1.0 — 2026-04-05*
