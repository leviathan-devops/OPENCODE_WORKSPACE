# CROSS-PLUGIN FIREWALL ARCHITECTURE

**Purpose:** Ensure Kraken V2.0 and other plugins coexist without conflicts
**Critical:** Plugins must NOT interfere with each other's hooks or agent registration

---

## THE IDENTITY WALL PATTERN

Every hook MUST check the agent identity before acting. Without this, plugins step on each other's toes.

### The Problem

When multiple plugins register the same hook type (e.g., `chat.message`):
- Plugin A wants to process all messages
- Plugin B wants to process all messages  
- They conflict, crash, or corrupt state

### The Solution: Identity Wall

```typescript
// Every hook function checks agent identity FIRST
export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    const { message, agent } = input as { message: string; agent?: string };
    
    // IDENTITY WALL: Only act if THIS agent sent the message
    if (agent !== 'kraken') {
      return; // Not my agent, don't touch
    }
    
    // Now process for Kraken
    // ...
  };
}
```

---

## IDENTITY WALL RULES

### Rule 1: Check `agent` field on `chat.message`

```typescript
if (input.agent !== 'my-agent-name') {
  return; // Not my message
}
```

### Rule 2: Check identity wall BEFORE any processing

```typescript
export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    // IDENTITY WALL - FIRST CHECK
    const { agent } = input as { agent?: string };
    if (!agent || agent !== 'kraken') {
      return;
    }
    
    // NOW safe to process
    const { message } = input as { message: string };
    // ...
  };
}
```

### Rule 3: Agent field only exists on `chat.message`

- `session.created`: NO `agent` field - use session info
- `session.compacting`: NO `agent` field - process all
- `tool.execute.before`: NO `agent` field - use tool name filtering
- `chat.message`: HAS `agent` field - use identity wall

---

## HOOK COORDINATION MATRIX

| Hook | Has agent field | Identity Check | Notes |
|------|----------------|----------------|-------|
| `session.created` | ❌ | Session ID | Initialize all brains |
| `session.compacting` | ❌ | None | Process all compaction |
| `chat.message` | ✅ | `input.agent` | Use identity wall |
| `tool.execute.before` | ❌ | Tool name | Filter dangerous tools |
| `tool.execute.after` | ❌ | Tool name | Summarize output |

---

## DEFENSIVE AGENT REGISTRATION

When registering agents in config, use defensive assignment:

```typescript
// WRONG - can overwrite existing agents
config.agent = { myAgent };

// CORRECT - merges safely
if (!config.agent) config.agent = {};
Object.assign(config.agent, { myAgent });
```

### Defensive Pattern

```typescript
export default {
  name: 'kraken-agent-v2.0',
  version: '2.0.0',
  
  config: async (opencodeConfig) => {
    // DEFENSIVE: Don't overwrite existing agents
    if (!opencodeConfig.agent) {
      opencodeConfig.agent = {};
    }
    
    // Register our agents alongside existing ones
    Object.assign(opencodeConfig.agent, {
      kraken: {
        description: 'Multi-brain orchestrator',
        mode: 'primary',
      },
    });
  },
  
  hooks: () => ({ /* ... */ }),
  tools: () => ({ /* ... */ }),
} satisfies Plugin;
```

---

## TOOL FILTERING - AGENT-SPECIFIC

Different agents should only see/modify their own tools. Use tool name prefixes:

```typescript
const KRAKEN_TOOLS = new Set([
  'kraken-status',
  'kraken-gate-status',
  'kraken-decision',
]);

export function createToolGuardianHook(): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input as { tool: string };
    
    // Identity wall via tool name
    if (!KRAKEN_TOOLS.has(tool)) {
      return; // Not a Kraken tool
    }
    
    // Now validate Kraken tool usage
    // ...
  };
}
```

---

## SESSION STATE ISOLATION

Each plugin should maintain its own state store, isolated by session:

```typescript
// Per-session state store
const sessionStates = new Map<string, PluginState>();

export function getSessionState(sessionId: string): PluginState {
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, createInitialState());
  }
  return sessionStates.get(sessionId)!;
}

// Cleanup on session end
// NOTE: session.ended is NOT a valid hook
// Use session.created to initialize, rely on session ID for isolation
```

---

## CROSS-PLUGIN TESTING

### Test 1: Load All Plugins

```bash
cat > /tmp/test-config.json << 'EOF'
{
  "plugin": [
    "file:///plugins/kraken-agent-v2.0/dist/index.js",
    "file:///plugins/manta-agent/dist/index.js",
    "file:///plugins/shark-agent/dist/index.js"
  ]
}
EOF

docker run -it --rm \
  -v /tmp/test-config:/root/.config/opencode \
  opencode-test:1.4.3
```

### Test 2: Verify No Crashes

1. Open TUI with all plugins
2. Switch between agents via tab toggle
3. Run commands with each agent
4. Check for console errors

### Test 3: Verify Isolation

1. Kraken agent: `/kraken-status` → Should work
2. Manta agent: `manta-status` → Should work
3. Shark agent: `/shark-status` → Should work

Each should work independently without conflicts.

---

## COMMON CROSS-PLUGIN FAILURES

### Failure: Agent disappears from tab toggle

**Cause:** Defective agent registration overwrote existing agents

**Fix:** Use `Object.assign()` not direct assignment

### Failure: Hook fires for wrong agent

**Cause:** No identity wall check

**Fix:** Check `input.agent` on every `chat.message` hook

### Failure: Session crash with multiple plugins

**Cause:** State collision between plugins

**Fix:** Use session-isolated state stores

---

## KRAKEN V2.0 FIREWALL IMPLEMENTATION

```typescript
// Chat message hook with identity wall
export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    // IDENTITY WALL
    const { agent } = input as { agent?: string };
    if (agent !== 'kraken') {
      return; // Not Kraken's message
    }
    
    const { message } = input as { message: string };
    const systemBrain = getSystemBrain();
    
    if (!systemBrain.isInitialized()) return;
    
    try {
      systemBrain.checkMessage(message);
    } catch (error) {
      console.error(`[Kraken] Message blocked: ${error}`);
      throw error;
    }
  };
}

// Tool guardian with tool filtering
export function createToolGuardianHook(): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input as { tool: string };
    const args = output?.args as Record<string, unknown> || {};
    
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    
    try {
      systemBrain.checkTool(tool, args);
    } catch (error) {
      console.error(`[Kraken] Tool blocked: ${error}`);
      throw error;
    }
  };
}
```

---

## VERIFICATION COMMANDS

```bash
# Check all agents registered
opencode agent list

# Check plugin loading
opencode debug config

# Verify identity isolation
# 1. Run as Kraken agent
# 2. Run as Manta agent
# 3. Run as Shark agent
# Each should work independently
```

---

**NUCLEAR RULE:** No plugin should ever touch another plugin's agents or hooks without coordination.
