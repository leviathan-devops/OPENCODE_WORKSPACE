# OpenCode Plugin — Anatomy & Registration

## Plugin Entry Point

Every OpenCode plugin exports a function that receives a `plugin` object. The plugin object provides:

- `registerAgent(agent)` — Register an agent that appears as a tab toggle
- `registerTool(definition, handler)` — Register a tool callable by agents
- `registerHook(type, handler)` — Register hooks for tool execution, chat, etc.
- `getContext()` — Get current execution context (directory, user info, etc.)

## Minimal Working Plugin

```typescript
// src/index.ts
import type { OpenCodePlugin } from '@opencode-ai/plugin';

const plugin: OpenCodePlugin = (api) => {
  // Register the agent tab
  api.registerAgent({
    id: 'shark',
    name: 'Shark',
    description: 'Autonomous DevOps Engineer — mechanical enforcement, no hallucinations',
    color: '#1DA0C3',
    tools: ['phase_status', 'advance_phase', 'extract_claims', 'guardian_classify'],
  });

  // Register tools
  api.registerTool(
    {
      name: 'phase_status',
      description: 'Get current phase, blockers, and available actions',
      schema: {},
    },
    async (args, context) => {
      const workflow = readWorkflow(context.directory);
      return formatPhaseStatus(workflow);
    },
  );
};

export default plugin;
```

## Agent Registration Fields

| Field | Type | Required | Description |
|-------|------|---------|-------------|
| `id` | string | Yes | Unique agent ID (used in API calls) |
| `name` | string | Yes | Display name in the tab |
| `description` | string | Yes | Description shown in the tab tooltip |
| `color` | string | No | Tab color as hex (e.g., `'#1DA0C3'`) |
| `tools` | string[] | No | Tool names available to this agent |

## How the Tab Toggle Works

OpenCode renders each registered agent as a tab in the UI. When a user clicks the tab:
1. The agent's `description` and `color` are displayed
2. The agent's `tools` are loaded into the tool registry
3. Chat messages are routed to this agent's system prompt
4. The agent can use any registered tools

## The Agent Identity Problem

OpenCode routes chat messages to the active agent tab. But **all hooks run for all agents**, including vanilla OpenCode agents. This is a critical design constraint.

Every Shark hook MUST check if the current agent is Shark before running:

```typescript
function isSharkAgent(context: ToolContext): boolean {
  // The active agent ID is available in context
  // Or via a shared HERMES_AGENTS set
  return context.agent?.id === 'shark';
}
```

**Pattern from HOTFIX_LOG** — The Hermes plugin checks `HERMES_AGENTS.has(context.agent?.id ?? '')` before running any hook. This prevents Hermes hooks from interfering with vanilla agents.

## Tool Context

The `ToolContext` object passed to every tool and hook:

```typescript
interface ToolContext {
  directory: string;       // Project directory (use this, NOT worktree!)
  agent: {
    id: string;          // Active agent ID ('shark', 'claude', etc.)
    name: string;
    mode?: string;
  };
  user: {
    id: string;
    name: string;
  };
  session: {
    id: string;
  };
  // ... other fields
}
```

**Critical**: Use `context.directory` for file operations. Do NOT use `context.worktree` — it can point to the wrong directory.
