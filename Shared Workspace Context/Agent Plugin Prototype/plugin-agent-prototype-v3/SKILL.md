---
name: plugin-agent-prototype
description: >
  Use this skill when you need to build a new OpenCode plugin agent from scratch.
  This template provides a working scaffold with Spider Agent patterns.
  Load this skill to get started building a plugin quickly.
---

# Plugin Agent Prototype Template

Use this template to build OpenCode plugin agents that actually work.

## When To Load This Skill

- Building a new OpenCode plugin from scratch
- Creating a multi-agent orchestrator
- Adding custom hooks and tools to OpenCode
- Need a working plugin scaffold to customize

## How To Use

### Step 1: Copy the Template

```bash
cp -r "Shared Workspace Context/templates/plugin-agent-prototype" /path/to/your-plugin
cd /path/to/your-plugin
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build

```bash
npm run build
```

### Step 4: Customize

1. **Rename plugin** - Edit `src/index.ts` and change `PLUGIN_NAME`
2. **Add tools** - Create tools in `src/tools/`
3. **Configure agents** - Edit `src/agents/`
4. **Set up hooks** - Modify handlers in `src/hooks/`

## Key Patterns (Spider Agent Reference)

### 1. Plugin Entry Point

```typescript
export default async function MyPlugin(): Promise<Hooks> {
  const config = loadConfig();
  
  return {
    event: safeHook(eventHandler),
    tool: createToolRegistry(config),
    'tool.execute.before': toolBeforeHook,
    'tool.execute.after': toolAfterHook,
    // ... more hooks
  };
}
```

### 2. Safe Hook Wrapping

```typescript
export const myHook = safeHook(async (input, output) => {
  // Your logic
}, 'myHook');
```

### 3. Hook Composition

```typescript
'experimental.chat.messages.transform': composeHandlers(
  pipelineTrackerHook,
  contextBudgetHook,
),
```

### 4. Fallback Storage

```typescript
const storage = new FallbackStorage(primaryClient);
const result = await storage.write(key, content);
if (!result.ok) {
  // Handle error
}
```

### 5. Zero-Imports State

```typescript
const state = getState();
state.sessions.set(sessionId, session);
```

## Common Customization Points

Look for `// CUSTOMIZE` comments in these files:

| File | What to Customize |
|------|-------------------|
| `src/index.ts` | Plugin name, hook registration |
| `src/tools/my-tool.ts` | Your tool implementation |
| `src/hooks/event.ts` | Session lifecycle logic |
| `src/config/schema.ts` | Config fields |
| `src/agents/architect.ts` | Architect prompt |

## Critical Rules

1. **Every hook MUST use safeHook()** - never let a hook crash the plugin
2. **Always implement fallback** - if primary storage fails, use local disk
3. **Log everything** - every decision point at DEBUG level
4. **Test real scenarios** - not just mocks
5. **Verify hooks fire** - experimental hooks may not work in all versions

## Testing Your Plugin

```bash
# Build
npm run build

# Type check
npm run typecheck

# Test
npm test
```

## Template Structure

```
plugin-agent-prototype/
├── src/
│   ├── index.ts           # Plugin entry
│   ├── state.ts          # Zero-imports state
│   ├── config/           # Schema, loader, constants
│   ├── hooks/            # All 9 hook handlers
│   ├── tools/            # Tool registry
│   ├── agents/           # Multi-agent prompts
│   └── services/         # External API, fallback
└── tests/integration/    # Integration tests
```
