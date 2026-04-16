# Plugin Agent Prototype Template

A **working OpenCode plugin scaffold** based on Spider Agent patterns. Copy this template and start building your custom plugin agent in minutes.

## Quick Start

```bash
# 1. Copy the template
cp -r Shared\ Workspace\ Context/templates/plugin-agent-prototype /path/to/your-plugin

# 2. Install dependencies
cd /path/to/your-plugin
npm install

# 3. Build
npm run build

# 4. Test
npm test
```

## What's Included

### Core Patterns (Spider Agent Reference)
- **Zero-imports singleton state** (`src/state.ts`)
- **Safe hook wrappers** - hooks NEVER crash the plugin (`src/hooks/utils.ts`)
- **Hook composition** - multiple handlers per hook type (`src/hooks/index.ts`)
- **Observable logging** - every decision point logged (`src/utils/logger.ts`)
- **Retry with backoff** - resilient external calls (`src/utils/retry.ts`)

### All 7 Hook Types
| Hook | Purpose |
|------|---------|
| `event` | Session lifecycle |
| `tool.execute.before` | Pre-flight checks |
| `tool.execute.after` | Result processing |
| `chat.message` | Delegation tracking |
| `command.execute.before` | Slash commands |
| `experimental.chat.messages.transform` | Pipeline logging |
| `experimental.session.compacting` | Session cleanup |

### Multi-Agent Architecture
- Architect (control brain)
- Coder (implementation)
- Reviewer (verification)
- Test Engineer (test generation)
- SME (domain expertise)

### Services
- **External API client** with retry
- **Fallback storage** - local disk when primary fails
- **Session DB** access patterns
- **Health checks** with caching

## Template Structure

```
plugin-agent-prototype/
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── state.ts              # Zero-imports singleton
│   ├── config/
│   │   ├── schema.ts        # Zod validation
│   │   ├── loader.ts         # Config + env vars
│   │   └── constants.ts      # Magic numbers
│   ├── hooks/
│   │   ├── utils.ts          # safeHook, composeHandlers
│   │   ├── event.ts          # Session hooks
│   │   ├── tool-before-after.ts
│   │   ├── command.ts        # Slash commands
│   │   ├── chat-message.ts   # Delegation tracking
│   │   ├── chat-messages-transform.ts
│   │   └── session-compacting.ts
│   ├── tools/
│   │   ├── health-check.ts   # Pre-flight check
│   │   └── my-tool.ts        # Example tool
│   ├── agents/
│   │   ├── architect.ts
│   │   ├── coder.ts
│   │   ├── reviewer.ts
│   │   └── test-engineer.ts
│   └── services/
│       ├── session-db.ts
│       ├── external-api.ts
│       └── fallback-storage.ts
└── tests/integration/
```

## Customization Guide

### 1. Rename Your Plugin
In `src/index.ts`:
```typescript
const PLUGIN_NAME = 'MyPlugin';  // Change this
```

### 2. Add Your Tools
In `src/tools/my-tool.ts`, replace with your tool implementation:
```typescript
export function createMyTool() {
  return tool({
    name: 'my_plugin_tool',
    description: 'What this tool does',
    args: MyToolSchema,
    execute: async (args) => {
      // Your logic here
    },
  });
}
```

### 3. Register Tools
In `src/tools/index.ts`:
```typescript
export function createToolRegistry(config: PluginConfig): ToolRegistry {
  return {
    // ... existing tools
    my_new_tool: createMyTool(),  // Add here
  };
}
```

### 4. Customize Config
In `src/config/schema.ts`, add your config fields:
```typescript
export const PluginConfigSchema = z.object({
  // ... existing fields
  mySetting: z.string().optional(),
});
```

### 5. Customize Hooks
In `src/hooks/`, modify hook handlers for your needs. Look for `// CUSTOMIZE` comments.

## Configuration

### Config File
Create `~/.config/opencode/plugins/your-plugin-config.json`:
```json
{
  "enabled": true,
  "debug": false,
  "storage": {
    "endpoint": "http://localhost:1933",
    "apiKey": "optional-key"
  }
}
```

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `PLUGIN_AGENT_ENABLED` | Enable/disable plugin |
| `PLUGIN_AGENT_DEBUG` | Enable debug logging |
| `PLUGIN_AGENT_STORAGE_ENDPOINT` | External storage URL |

## Testing

```bash
# Build
npm run build

# Type check
npm run typecheck

# Run tests
npm test
```

## Key Lessons (from Hive Mind failure)

1. **Every hook MUST be wrapped in safeHook** - never let a hook crash the plugin
2. **Always have fallback storage** - if primary storage fails, write to local disk
3. **Log every decision point** - observability is critical
4. **Test with real dependencies** - mocks pass, production fails
5. **Verify experimental hooks fire** - don't assume they work

## Reference

- [Spider Agent Architecture](https://github.com/leviathan-devops/spider-agent)
- [OpenCode Plugin SDK](https://www.npmjs.com/package/@opencode-ai/plugin)
- [Hive Mind Failure Log](../Spider%20Agent/spider-agent-rebrand/iteration-FINAL/docs/HIVE-MIND-PLUGIN-FAILURE-LOG.md) - What NOT to do
