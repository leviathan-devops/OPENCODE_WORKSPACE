# OpenCode Plugin Development Guide

## Overview

OpenCode uses a plugin-based extension system. Plugins can register tools, hooks, and agents to extend functionality.

---

## Step-by-Step: Creating a New Plugin

### 1. Initialize Plugin Structure

```
my-plugin/
├── package.json
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── tools/            # Custom tools
│   ├── hooks/            # Hook handlers
│   └── agents/           # Custom agents
├── tests/
│   └── plugin.test.ts
└── README.md
```

### 2. Create package.json

```json
{
  "name": "opencode-plugin-example",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "opencode": {
    "plugins": [
      {
        "name": "example-plugin",
        "version": "1.0.0",
        "description": "Example plugin for OpenCode",
        "entry": "dist/index.js"
      }
    ]
  },
  "dependencies": {
    "opencode": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### 3. Write the Plugin Entry Point

```typescript
// src/index.ts
import { Plugin, PluginManifest, Tool, Hook, Agent } from 'opencode';

export default class ExamplePlugin implements Plugin {
  name = 'example-plugin';
  version = '1.0.0';

  private tools: Tool[] = [];
  private hooks: Hook[] = [];
  private agents: Agent[] = [];

  async initialize(manifest: PluginManifest): Promise<void> {
    // Register tools
    this.tools = await this.registerTools();
    
    // Register hooks
    this.hooks = await this.registerHooks();
    
    // Register agents
    this.agents = await this.registerAgents();
    
    console.log(`[${this.name}] Initialized successfully`);
  }

  getTools(): Tool[] {
    return this.tools;
  }

  getHooks(): Hook[] {
    return this.hooks;
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  async dispose(): Promise<void> {
    // Cleanup resources
    this.tools = [];
    this.hooks = [];
    this.agents = [];
  }
}
```

---

## Complete Plugin Template

```typescript
// src/index.ts
import { 
  Plugin, 
  PluginManifest, 
  Tool, 
  Hook, 
  Agent,
  ToolContext,
  HookPayload,
  AgentConfig
} from 'opencode';

// --- Tool Definition ---
interface GreetTool extends Tool {
  name: 'greet';
  description: 'Greet a user with a custom message';
  inputSchema: {
    type: 'object';
    properties: {
      name: { type: 'string'; description: 'Name to greet' };
      style: { type: 'string'; enum: ['formal', 'casual']; default: 'casual' };
    };
    required: ['name'];
  };
}

// --- Hook Handler ---
class ExampleHook implements Hook {
  name = 'before-tool-call';
  
  async handle(payload: HookPayload): Promise<HookPayload> {
    console.log(`[Hook] before-tool-call: ${payload.tool}`);
    return payload;
  }
}

// --- Agent Definition ---
class ExampleAgent implements Agent {
  name = 'example-agent';
  description = 'An example agent for demonstration';
  
  async run(input: string, context: AgentConfig): Promise<string> {
    return `Processed: ${input}`;
  }
}

// --- Plugin Class ---
export default class ExamplePlugin implements Plugin {
  name = 'example-plugin';
  version = '1.0.0';
  private tools: GreetTool[] = [];
  private hooks: Hook[] = [];
  private agents: Agent[] = [];

  async initialize(manifest: PluginManifest): Promise<void> {
    // Register greet tool
    this.tools.push({
      name: 'greet',
      description: 'Greet a user with a custom message',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name to greet' },
          style: { type: 'string', enum: ['formal', 'casual'], default: 'casual' }
        },
        required: ['name']
      },
      async execute(input: { name: string; style?: string }, context: ToolContext) {
        const greeting = input.style === 'formal' 
          ? `Good day, ${input.name}.` 
          : `Hey, ${input.name}!`;
        return { result: greeting };
      }
    } as GreetTool);

    // Register hook
    this.hooks.push(new ExampleHook());

    // Register agent
    this.agents.push(new ExampleAgent());

    console.log(`[${this.name}] v${this.version} initialized`);
  }

  getTools(): Tool[] {
    return this.tools;
  }

  getHooks(): Hook[] {
    return this.hooks;
  }

  getAgents(): Agent[] {
    return this.agents;
  }

  async dispose(): Promise<void> {
    this.tools = [];
    this.hooks = [];
    this.agents = [];
  }
}
```

---

## Registering Tools, Hooks, Agents

### Tools

Tools are functions the agent can call. Each tool needs:
- `name`: Unique identifier
- `description`: What the tool does
- `inputSchema`: JSON Schema for parameters
- `execute`: The implementation function

```typescript
const myTool: Tool = {
  name: 'my-tool',
  description: 'Does something useful',
  inputSchema: { type: 'object', properties: { ... } },
  async execute(input, context) {
    // context provides: sessionId, userId, permissions, logger
    return { success: true, data: input };
  }
};
```

### Hooks

Hooks intercept and process events at various points:

| Hook Name | When It Fires |
|-----------|---------------|
| `before-tool-call` | Before a tool executes |
| `after-tool-call` | After a tool completes |
| `before-agent-run` | Before an agent runs |
| `after-agent-run` | After an agent completes |
| `on-error` | When an error occurs |
| `on-session-start` | When a session begins |
| `on-session-end` | When a session ends |

```typescript
class MyHook implements Hook {
  name = 'before-tool-call';
  
  async handle(payload: HookPayload): Promise<HookPayload> {
    // Modify payload or log
    return payload;
  }
}
```

### Agents

Agents are specialized AI assistants:

```typescript
class MyAgent implements Agent {
  name = 'my-agent';
  description = 'Specialized in task X';
  
  async run(input: string, config: AgentConfig): Promise<string> {
    // Implementation
    return result;
  }
}
```

---

## How to Test a Plugin

### Unit Testing

```typescript
// tests/plugin.test.ts
import { describe, it, expect } from 'vitest';
import ExamplePlugin from '../src/index';

describe('ExamplePlugin', () => {
  it('should initialize successfully', async () => {
    const plugin = new ExamplePlugin();
    await plugin.initialize({ name: 'test', version: '1.0.0' });
    
    expect(plugin.getTools()).toHaveLength(1);
    expect(plugin.getHooks()).toHaveLength(1);
    expect(plugin.getAgents()).toHaveLength(1);
  });

  it('should execute greet tool', async () => {
    const plugin = new ExamplePlugin();
    await plugin.initialize({ name: 'test', version: '1.0.0' });
    
    const tool = plugin.getTools()[0];
    const result = await tool.execute({ name: 'World', style: 'casual' });
    
    expect(result.result).toBe('Hey, World!');
  });

  it('should dispose cleanly', async () => {
    const plugin = new ExamplePlugin();
    await plugin.initialize({ name: 'test', version: '1.0.0' });
    await plugin.dispose();
    
    expect(plugin.getTools()).toHaveLength(0);
  });
});
```

### Integration Testing

```typescript
// tests/integration.test.ts
import { OpenCode } from 'opencode';

async function testPluginLoading() {
  const opencode = new OpenCode({
    plugins: ['./dist']  // Path to plugin
  });
  
  await opencode.initialize();
  
  const tools = opencode.getTools();
  console.log('Loaded tools:', tools.map(t => t.name));
  
  await opencode.dispose();
}
```

---

## Debugging When Plugin Doesn't Load

### Checklist

1. **Check console for errors**
   ```bash
   opencode --verbose 2>&1 | grep -i plugin
   ```

2. **Verify plugin manifest**
   ```json
   {
     "opencode": {
       "plugins": [{ "name": "...", "entry": "..." }]
     }
   }
   ```

3. **Check file path resolution**
   - Entry file must be absolute or relative to cwd
   - Dist files must exist and be valid JS/TS

4. **Validate plugin interface**
   ```typescript
   // Ensure your class implements Plugin correctly
   class MyPlugin implements Plugin {
     name: string;
     version: string;
     // Must implement all required methods
   }
   ```

5. **Common Issues**

| Error | Solution |
|-------|----------|
| `Plugin not found` | Check file path; ensure `package.json` has correct `main` |
| `Plugin.initialize is not a function` | Class must implement `Plugin` interface |
| `Tool execute is not a function` | Each tool needs an `execute` method |
| `Permission denied` | Check plugin permissions in config |

### Debug Logging

```typescript
// Add debug output to your plugin
class DebugPlugin implements Plugin {
  async initialize(manifest: PluginManifest) {
    console.log('[DEBUG] Manifest:', JSON.stringify(manifest, null, 2));
    console.log('[DEBUG] Current dir:', process.cwd());
    console.log('[DEBUG] Config dir:', process.env.OPENCODE_CONFIG_DIR);
    // ... rest of init
  }
}
```

---

## Distributing a Plugin

### Option 1: npm Distribution

**Best for**: Public plugins, versioned releases

1. Publish to npm:
   ```bash
   npm publish
   ```

2. Users install via:
   ```bash
   npm install opencode-plugin-example
   ```

3. Reference in config:
   ```yaml
   plugins:
     - name: example-plugin
       package: opencode-plugin-example
       version: "^1.0.0"
   ```

### Option 2: file:// Distribution

**Best for**: Private plugins, local development

1. Reference via absolute path:
   ```yaml
   plugins:
     - name: my-local-plugin
       path: /Users/me/code/my-plugin/dist
   ```

2. Or via relative path (resolved from config location):
   ```yaml
   plugins:
     - name: my-local-plugin
       path: ./plugins/my-plugin
   ```

### Version Requirements

| Distribution | Version Format | Example |
|--------------|----------------|---------|
| npm | semver | `^1.0.0`, `~2.1.0` |
| file:// | path | `/abs/path` or `./relative` |

### Publishing Checklist

- [ ] `package.json` has correct `opencode.plugins` config
- [ ] `main` points to compiled entry (dist/)
- [ ] `types` points to TypeScript definitions
- [ ] README documents tools/hooks/agents
- [ ] CHANGELOG for version history
- [ ] Tests pass locally
- [ ] Version follows semver
