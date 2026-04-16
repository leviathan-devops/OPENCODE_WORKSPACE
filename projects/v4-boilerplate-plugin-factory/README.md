# V4.1 Boilerplate Plugin Factory

**Self-contained OpenCode plugin boilerplate with mandatory safety guardrails.**

---

## What This Is

A production-grade, fail-safe foundation for building OpenCode agent plugins. Every plugin built from this template is guaranteed to:

1. **Never corrupt vanilla OpenCode agents** (plan, build, etc.)
2. **Never clash with other plugins** (Spider, Hermes, etc.)
3. **Never leak session state** between users

---

## The Core Problem (v4.0)

The original v4.0 boilerplate provided factory patterns but **no safety guardrails**. This caused:

| Failure | Cause | Effect |
|---------|-------|--------|
| Context spillover | Hooks fire for ALL agents | Vanilla OpenCode agents corrupted by plugin hooks |
| Cross-plugin conflicts | No phase/agent awareness | Hermes blocks Spider Agent responses |
| State pollution | Global module state | Sessions influence each other |
| System prompt injection | `chat.system.transform` unguarded | Every agent gets plugin context |

---

## The v4.1 Solution

**Mandatory guardrails built into the framework itself:**

1. **AgentAwareness** — Built into every hook, not optional
2. **HookRegistry with agent filtering** — Framework-level enforcement
3. **Session-Isolated State** — No more global state leaks
4. **safeHook wrapper** — Agent check + session isolation + phase awareness

---

## Quick Start

### 1. Copy the Template

```bash
cp -r v4-boilerplate-plugin-factory /path/to/your-new-plugin/
```

### 2. Configure Your Identity

Edit `src/index.ts`:

```typescript
const MY_PLUGIN_IDENTITY = {
  name: 'my-plugin',           // Unique plugin identifier
  prefix: 'my_',              // Agent name prefix
  orchestrator: 'my-architect', // Lead agent name

  agents: new Set([
    'my-architect',           // Visible in tab toggle
    'my-coder',               // Hidden
    'my-reviewer',             // Hidden
  ]),

  primaryAgents: new Set(['my-architect']),
  subagents: new Set(['my-coder', 'my-reviewer']),
};
```

### 3. Define Your Agents

```typescript
const myAgents = new Map([
  ['my-architect', {
    description: 'Lead orchestrator',
    instructions: `You are the architect agent...`,
  }],
  // ... more agents
]);
```

### 4. Wire Your Hooks (Using safeHook)

```typescript
const myHook = safeHook(
  async (input, output, ctx) => {
    if (!ctx.isMyAgent()) return;  // MANDATORY FIRST CHECK
    
    // Your hook logic here
  },
  { 
    agentFilter: Array.from(MY_PLUGIN_IDENTITY.agents),
    pluginName: MY_PLUGIN_IDENTITY.name,
    managedAgents: MY_PLUGIN_IDENTITY.agents,
    agentPrefix: MY_PLUGIN_IDENTITY.prefix,
    orchestratorName: MY_PLUGIN_IDENTITY.orchestrator,
  }
);
```

### 5. Build and Register

```bash
cd your-new-plugin
bun install
bun run build

# Register in opencode.json:
# "file:///path/to/your-new-plugin/dist/index.js"
```

---

## Directory Structure

```
v4-boilerplate-plugin-factory/
├── src/
│   ├── index.ts                      # Plugin entry (COPY AND CUSTOMIZE)
│   ├── v4.1/                        # THE GUARDRAIL LAYER
│   │   ├── hooks/
│   │   │   ├── safe-hook.ts         # Agent-aware hook wrapper
│   │   │   └── compose-handlers.ts  # Hook chaining
│   │   ├── context/
│   │   │   ├── agent-awareness.ts  # isMyAgent(), identity
│   │   │   └── hook-context.ts     # HookContext interface
│   │   ├── state/
│   │   │   ├── session-state.ts     # Per-session isolation
│   │   │   └── global-state.ts     # Plugin-wide state
│   │   ├── config/
│   │   │   ├── identity.ts         # Plugin identity
│   │   │   └── agent-registration.ts # Tab toggle mapping
│   │   └── utils/
│   │       └── logger.ts
│   └── factory/                     # THE ENGINE
│       ├── StateStore.ts            # Domain ownership
│       ├── BrainMessenger.ts       # Priority signals
│       ├── ArchitectureFactory.ts   # Assembly
│       ├── AgentFactory.ts
│       ├── BrainFactory.ts
│       ├── ClusterFactory.ts
│       └── types.ts
├── package.json
├── tsconfig.json
└── BUILD_LIBRARY.md                 # Full documentation
```

---

## Key Concepts

### safeHook — The Safety Wrapper

Every hook **must** be wrapped with `safeHook`:

```typescript
safeHook(
  async (input, output, ctx) => {
    // 1. MANDATORY: Check if this is our agent
    if (!ctx.isMyAgent()) return;
    
    // 2. Your logic here
    ctx.log.info('Hook fired', { agent: ctx.agentName });
    
    // 3. Access session state safely
    const session = ctx.getSessionState();
    session.phase = 'BUILD';
  },
  {
    agentFilter: ['my-architect', 'my-coder'],  // Only fire for these
    pluginName: 'my-plugin',
    managedAgents: MY_PLUGIN_IDENTITY.agents,
    agentPrefix: 'my_',
    orchestratorName: 'my-architect',
  }
);
```

### HookContext — Available in Every Hook

| Property | Type | Description |
|----------|------|-------------|
| `ctx.sessionID` | `string` | Current session ID |
| `ctx.agentName` | `string \| undefined` | Current agent name |
| `ctx.phase` | `string \| undefined` | Current phase |
| `ctx.isMyAgent()` | `() => boolean` | Is this our agent? |
| `ctx.isVanillaAgent()` | `() => boolean` | Is this a vanilla agent? |
| `ctx.isOtherPluginAgent()` | `() => boolean` | Is this another plugin? |
| `ctx.getSessionState()` | `() => SessionState` | Per-session data |
| `ctx.log` | `Logger` | Logging |

### Session State — Never Global

**WRONG (v4.0):**
```typescript
let currentPhase = 'idle';  // LEAKS ACROSS SESSIONS!
```

**CORRECT (v4.1):**
```typescript
const session = ctx.getSessionState();
session.phase = 'BUILD';  // ISOLATED TO THIS SESSION
```

---

## Agent Registration (Tab Toggles)

Use the `config` callback to register agents:

```typescript
config: async (opencodeConfig) => {
  const sdkConfigs = {};
  
  for (const [id, agent] of myAgents) {
    sdkConfigs[id] = {
      name: id,
      description: agent.description,
      instructions: agent.instructions,
      mode: isPrimary(id) ? 'primary' : 'subagent',
      permission: { task: 'allow' },
      tools: {},
    };
  }
  
  // CRITICAL: Use Object.assign, not array
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = { ...sdkConfigs };
  } else {
    Object.assign(opencodeConfig.agent, sdkConfigs);
  }
}
```

---

## Testing Your Plugin

### The Vanilla Test
```bash
opencode --agent plan "What is 2+2?"
# Should NOT see any plugin context
```

### The Isolation Test
```bash
# Session 1: Your plugin agent
opencode --agent my-architect "Create a plan"

# Session 2: Vanilla agent (should be unaffected)
opencode --agent plan "Create a plan"
```

---

## Anti-Patterns to Avoid

### 1. No Agent Check on System Transform

```typescript
// WRONG — Would inject into EVERYONE
'experimental.chat.system.transform': async (input, output) => {
  output.system.push('[My plugin context]');
}

// CORRECT — Guards explicitly
safeHook(async (input, output, ctx) => {
  if (!ctx.isMyAgent()) return;
  output.system.push('[My plugin context]');
}, { agentFilter: MY_AGENTS });
```

### 2. Global Phase State

```typescript
// WRONG — Single global breaks cross-plugin
let _currentPhase = 'IDLE';

// CORRECT — Per-session via sessionState
const session = ctx.getSessionState();
session.phase = 'BUILD';
```

### 3. Blocking in After Hooks

```typescript
// WRONG — After hooks can't block
'tool.execute.after': async (input, output) => {
  throw new Error('Blocked');  // Too late!
}

// CORRECT — Use before hook for blocking
'tool.execute.before': async (input, output) => {
  if (somethingBad) {
    return { block: true, reason: 'Blocked' };
  }
}
```

---

## Migration from v4.0

1. **Update Hook Handlers** — Add `ctx` parameter and agent check
2. **Set Plugin Identity** — Configure `MY_PLUGIN_IDENTITY`
3. **Add Agent Filters** — Pass `agentFilter` to `safeHook`
4. **Replace Globals** — Use `ctx.getSessionState()` instead
5. **Rebuild and Test**

---

## Full Documentation

See `BUILD_LIBRARY.md` for the complete engineering guide.

---

*V4.1 Boilerplate Plugin Factory*
*Version: 1.0 — 2026-04-06*
