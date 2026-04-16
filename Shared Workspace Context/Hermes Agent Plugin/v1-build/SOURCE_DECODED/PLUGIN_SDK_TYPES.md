# @opencode-ai/plugin — SDK Type Signatures

**Source**: `/home/leviathan/spider-agent-rebrand/iteration-FINAL/node_modules/@opencode-ai/plugin/dist/`
**Version**: 1.1.53

---

## Plugin Entry Point

```typescript
// The plugin MUST export a function matching this signature
type Plugin = (input: PluginInput) => Promise<Hooks>;

type PluginInput = {
    client: ReturnType<typeof createOpencodeClient>;
    project: Project;
    directory: string;
    worktree: string;
    serverUrl: URL;
    $: BunShell;  // shell utility for executing commands
};
```

**Example plugin**:
```typescript
import type { Plugin } from "@opencode-ai/plugin";

const myPlugin: Plugin = async (input: PluginInput) => {
  return {
    name: "my-plugin",
    agent: [...],  // agent definitions
    tool: {...},   // custom tools
    ...hooks,
  };
};

export default myPlugin;
```

---

## Agent Definition

```typescript
type Agent = {
    name: string;
    description?: string;
    instructions: string;
    tools?: string[];       // tool names this agent can use
    mode?: "primary" | "subagent";
};
```

---

## Tool Definition

```typescript
import { z } from "zod";

type ToolContext = {
    sessionID: string;
    messageID: string;
    agent: string;
    directory: string;      // current project directory
    worktree: string;       // project worktree root
    abort: AbortSignal;
    metadata(input: { title?: string; metadata?: Record<string, any> }): void;
    ask(input: AskInput): Promise<void>;
};

type AskInput = {
    permission: string;
    patterns: string[];
    always: string[];
    metadata: Record<string, any>;
};

// Create a tool
function tool<Args extends z.ZodRawShape>(input: {
    description: string;
    args: Args;
    execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string>;
}): {
    description: string;
    args: Args;
    execute: (args: any, context: ToolContext) => Promise<string>;
};
```

**Example tool**:
```typescript
import { tool } from "@opencode-ai/plugin/tool";

const myTool = tool({
  description: "Get current git branch",
  args: {},
  execute: async (args, context) => {
    const branch = await context.$.bash("git branch --show-current");
    return `Current branch: ${branch}`;
  },
});
```

---

## Hooks

```typescript
interface Hooks {
    // Called on config
    config?: (input: Config) => Promise<void>;

    // Called when a new message is received
    "chat.message"?: (input: {
        sessionID: string;
        agent?: string;
        model?: { providerID: string; modelID: string };
        messageID?: string;
        variant?: string;
    }, output: {
        message: UserMessage;
        parts: Part[];
    }) => Promise<void>;

    // Modify LLM parameters
    "chat.params"?: (input: {
        sessionID: string;
        agent: string;
        model: Model;
        provider: ProviderContext;
        message: UserMessage;
    }, output: {
        temperature: number;
        topP: number;
        topK: number;
        options: Record<string, any>;
    }) => Promise<void>;

    // Modify chat headers
    "chat.headers"?: (input: {
        sessionID: string;
        agent: string;
        model: Model;
        provider: ProviderContext;
        message: UserMessage;
    }, output: {
        headers: Record<string, string>;
    }) => Promise<void>;

    // Permission request
    "permission.ask"?: (input: Permission, output: {
        status: "ask" | "deny" | "allow";
    }) => Promise<void>;

    // Before command execution
    "command.execute.before"?: (input: {
        command: string;
        sessionID: string;
        arguments: string;
    }, output: {
        parts: Part[];
    }) => Promise<void>;

    // Before tool execution
    "tool.execute.before"?: (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        args: any;
    }) => Promise<void>;

    // Modify shell environment
    "shell.env"?: (input: {
        cwd: string;
    }, output: {
        env: Record<string, string>;
    }) => Promise<void>;

    // After tool execution
    "tool.execute.after"?: (input: {
        tool: string;
        sessionID: string;
        callID: string;
    }, output: {
        title: string;
        output: string;
        metadata: any;
    }) => Promise<void>;

    // Transform chat messages before LLM
    "experimental.chat.messages.transform"?: (input: {}, output: {
        messages: { info: Message; parts: Part[] }[];
    }) => Promise<void>;

    // Transform system prompt
    "experimental.chat.system.transform"?: (input: {
        sessionID?: string;
        model: Model;
    }, output: {
        system: string[];
    }) => Promise<void>;

    // Session compaction
    "experimental.session.compacting"?: (input: {
        sessionID: string;
    }, output: {
        context: string[];
        prompt?: string;
    }) => Promise<void>;

    // Text completion
    "experimental.text.complete"?: (input: {
        sessionID: string;
        messageID: string;
        partID: string;
    }, output: {
        text: string;
    }) => Promise<void>;
}
```

---

## Event Types

```typescript
type Event = 
    | { type: "chat.start" }
    | { type: "chat.message", sessionID: string, messageID: string }
    | { type: "tool.execute", tool: string, sessionID: string }
    | { type: "session.compact", sessionID: string };
```

---

## Key Implementation Patterns from Spider Agent

### Pattern 1: Hook Composition
```typescript
// Spider Agent composes multiple hooks into one handler
"experimental.chat.messages.transform": composeHandlers([
    delegationGateHook,
    contextBudgetHandler,
    planValidatorHook,
    tddEnforcerHook,
    strictWriteDisciplineHook,
    adversarialCheckHook,
    antiRationalizationHook,
    knowledgeInjectorHook,
]),
```

### Pattern 2: Safe Hook Wrappers
```typescript
// Wrap hooks to prevent errors from blocking the pipeline
const safeHook = (fn: HookFunction) => async (...args: any[]) => {
    try {
        await fn(...args);
    } catch (err) {
        console.error("Hook error:", err);
    }
};
```

### Pattern 3: Hook Order
1. Guardrails (first — block bad actions fast)
2. Delegation gate (block unauthorized delegation)
3. Phase monitor (enforce correct phase)
4. TDD enforcer (test-first check)
5. Strict write discipline (verify before act)
6. Knowledge injector (2nd-brain recall)
7. Activity tracker (audit log)
8. Supervisor ingest (feed supervisor loop)

---

## Tool Naming Convention

Tools are registered in the `tool:` object:
```typescript
tool: {
    checkpoint: checkpointTool,
    phase_complete: phaseCompleteTool,
    hermes_recall: hermesRecallTool,
    // ...
}
```

They're called by the agent as `tool_name` (snake_case), not camelCase.

---

## Agent Routing

Agents are defined in the `agent:` array. To route to a subagent, the orchestrator uses the agent name:
```
@analyst Please analyze these requirements...
@builder Implement task 3...
```

The mode field:
- `"primary"` — appears in OpenCode agent dropdown
- `"subagent"` — only callable by other agents, not by user directly

---

## State Management

Spider Agent stores state in:
- `~/.swarm/state.json` — current session state
- `~/.swarm/snapshots/` — session snapshots
- `~/.swarm/tasks/` — task state

Hermes should use:
- `~/.hermes/state/` — current session state
- `~/.hermes/snapshots/` — session snapshots  
- `~/hermes-workspace/.state/` — persistent state across sessions
