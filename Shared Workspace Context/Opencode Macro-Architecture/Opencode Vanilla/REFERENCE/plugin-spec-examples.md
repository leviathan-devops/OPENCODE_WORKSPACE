# Plugin Specification Examples

## Plugin Manifest

Every plugin requires a manifest.json or package.json with OpenCode plugin configuration.

---

## Minimal Plugin Manifest

```json
{
  "name": "my-minimal-plugin",
  "version": "1.0.0",
  "opencode": {
    "plugins": [
      {
        "name": "my-minimal-plugin",
        "version": "1.0.0",
        "description": "A minimal plugin",
        "entry": "dist/index.js"
      }
    ]
  }
}
```

---

## Full Plugin Manifest

```json
{
  "name": "opencode-plugin-complete",
  "version": "2.0.0",
  "description": "A complete example plugin with all features",
  "author": "Developer Name <dev@example.com>",
  "license": "MIT",
  "homepage": "https://github.com/example/opencode-plugin",
  "repository": {
    "type": "git",
    "url": "https://github.com/example/opencode-plugin"
  },
  "keywords": ["opencode", "plugin", "productivity"],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "opencode": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  },
  "opencode": {
    "plugins": [
      {
        "name": "complete-example",
        "version": "2.0.0",
        "description": "Complete example plugin",
        "entry": "dist/index.js",
        "permissions": [
          "filesystem:read",
          "filesystem:write",
          "network:http"
        ],
        "tools": [
          {
            "name": "custom-tool",
            "description": "A custom tool provided by this plugin",
            "inputSchema": {
              "type": "object",
              "properties": {
                "param1": {
                  "type": "string",
                  "description": "First parameter"
                }
              },
              "required": ["param1"]
            }
          }
        ],
        "hooks": [
          {
            "name": "before-tool-call",
            "description": "Hook before tool execution"
          }
        ],
        "agents": [
          {
            "name": "custom-agent",
            "description": "A custom agent",
            "systemPrompt": "You are a specialized assistant."
          }
        ]
      }
    ]
  }
}
```

---

## Plugin with Tool Registration

```typescript
// src/index.ts
import { Plugin, PluginManifest, Tool } from 'opencode';

interface CustomTool extends Tool {
  name: 'custom-tool';
  description: 'Performs a custom operation';
  inputSchema: {
    type: 'object';
    properties: {
      action: { type: 'string' };
      value: { type: 'number' };
    };
    required: ['action'];
  };
}

export default class ToolPlugin implements Plugin {
  name = 'tool-plugin';
  version = '1.0.0';
  private tools: CustomTool[] = [];

  async initialize(manifest: PluginManifest): Promise<void> {
    this.tools.push({
      name: 'custom-tool',
      description: 'Performs a custom operation',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'The action to perform' },
          value: { type: 'number', description: 'Numeric value' }
        },
        required: ['action']
      },
      async execute(input, context) {
        return { success: true, action: input.action, value: input.value };
      }
    } as CustomTool);
  }

  getTools(): Tool[] {
    return this.tools;
  }

  getHooks() { return []; }
  getAgents() { return []; }
  async dispose() { this.tools = []; }
}
```

---

## Plugin with Hook Registration

```typescript
// src/index.ts
import { Plugin, PluginManifest, Hook, HookPayload } from 'opencode';

class LoggingHook implements Hook {
  name = 'before-tool-call';
  
  async handle(payload: HookPayload): Promise<HookPayload> {
    console.log(`[Hook] Tool: ${payload.tool}, Args: ${JSON.stringify(payload.args)}`);
    return payload;
  }
}

class MetricsHook implements Hook {
  name = 'after-tool-call';
  
  async handle(payload: HookPayload): Promise<HookPayload> {
    const duration = Date.now() - payload.startTime;
    console.log(`[Metrics] ${payload.tool} took ${duration}ms`);
    return payload;
  }
}

export default class HookPlugin implements Plugin {
  name = 'hook-plugin';
  version = '1.0.0';
  private hooks: Hook[] = [];

  async initialize(manifest: PluginManifest): Promise<void> {
    this.hooks.push(new LoggingHook());
    this.hooks.push(new MetricsHook());
  }

  getTools() { return []; }
  getHooks(): Hook[] { return this.hooks; }
  getAgents() { return []; }
  async dispose() { this.hooks = []; }
}
```

---

## Plugin with Custom Agent

```typescript
// src/index.ts
import { Plugin, PluginManifest, Agent, AgentConfig } from 'opencode';

class CodeReviewAgent implements Agent {
  name = 'code-review';
  description = 'Specialized agent for code review';
  
  async run(input: string, config: AgentConfig): Promise<string> {
    // Implementation
    return `Code review complete for: ${input}`;
  }
}

class DebugAgent implements Agent {
  name = 'debug';
  description = 'Specialized agent for debugging';
  
  async run(input: string, config: AgentConfig): Promise<string> {
    // Implementation
    return `Debug analysis for: ${input}`;
  }
}

export default class AgentPlugin implements Plugin {
  name = 'agent-plugin';
  version = '1.0.0';
  private agents: Agent[] = [];

  async initialize(manifest: PluginManifest): Promise<void> {
    this.agents.push(new CodeReviewAgent());
    this.agents.push(new DebugAgent());
  }

  getTools() { return []; }
  getHooks() { return []; }
  getAgents(): Agent[] { return this.agents; }
  async dispose() { this.agents = []; }
}
```

---

## Plugin Package Layout

```
opencode-plugin-example/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── CHANGELOG.md
├── LICENSE
├── src/
│   ├── index.ts           # Plugin entry point
│   ├── tools/
│   │   ├── index.ts
│   │   └── my-tool.ts
│   ├── hooks/
│   │   ├── index.ts
│   │   └── my-hook.ts
│   └── agents/
│       ├── index.ts
│       └── my-agent.ts
├── dist/                  # Compiled output
│   ├── index.js
│   ├── tools/
│   ├── hooks/
│   └── agents/
└── tests/
    ├── plugin.test.ts
    └── integration.test.ts
```

---

## Plugin package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  }
}
```

---

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## Publishing to npm

```json
{
  "opencode": {
    "plugins": [
      {
        "name": "opencode-plugin-example",
        "version": "1.0.0",
        "description": "Example plugin for OpenCode",
        "entry": "dist/index.js"
      }
    ]
  }
}
```

---

## Using the Plugin

### Via npm

```bash
npm install opencode-plugin-example
```

```yaml
# opencode.config.yaml
plugins:
  - name: opencode-plugin-example
    package: opencode-plugin-example
    version: "^1.0.0"
```

### Via Local Path

```yaml
# opencode.config.yaml
plugins:
  - name: opencode-plugin-example
    path: /path/to/plugin
```

### Via file:// URL

```yaml
# opencode.config.yaml
plugins:
  - name: opencode-plugin-example
    path: file:///absolute/path/to/plugin
```
