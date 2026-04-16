# OpenCode Plugin Engineering - Neural Pathway T1

**Type**: AGI Neural Pathway - T1 Canonical
**Date**: 2026-04-01
**Purpose**: Production-grade plugin engineering for OpenCode
**Audience**: Planning brain + build agents executing plugin development

---

## What This Is

A canonical T1 neural pathway for OpenCode plugin engineering. Contains everything needed to design, build, and deploy production-grade OpenCode plugins that function like the Spider Agent.

**Prerequisites**:
- Understand OpenCode plugin architecture
- Read `OPENCODE_HOOK_MAP.md` for hook reference
- Read `SPIDER_AGENT_FORENSIC_REPORT.md` for Spider Agent internals

---

## Table of Contents

1. [Plugin Architecture Fundamentals](#1-plugin-architecture-fundamentals)
2. [The Plugin Interface](#2-the-plugin-interface)
3. [Agent Design Patterns](#3-agent-design-patterns)
4. [Hook System Mastery](#4-hook-system-mastery)
5. [State Management](#5-state-management)
6. [Tool Development](#6-tool-development)
7. [Command Registration](#7-command-registration)
8. [UI Integration - The Tab Toggle](#8-ui-integration---the-tab-toggle)
9. [Pipeline Design](#9-pipeline-design)
10. [Mechanical Enforcement](#10-mechanical-enforcement)
11. [Performance Patterns](#11-performance-patterns)
12. [Testing Strategies](#12-testing-strategies)
13. [Deployment](#13-deployment)
14. [Plugin Blueprint Generator](#14-plugin-blueprint-generator)

---

## 1. Plugin Architecture Fundamentals

### The Plugin Contract

```
Plugin = Function that returns Hooks
Input = PluginInput (context, directory, client)
Output = Hooks object (agents, tools, hooks)
```

### Minimal Plugin Structure

```typescript
import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin';
import { z } from 'zod';

export const MyPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  // 1. Initialize state
  const state = await initializeState(input.directory);
  
  // 2. Create agents
  const agents = createAgents();
  
  // 3. Create tools
  const tools = createTools(state);
  
  // 4. Create hooks
  const hooks = createHooks(state);
  
  // 5. Return complete hooks object
  return {
    name: "my-plugin",
    agent: agents,
    tool: tools,
    config: createConfigHook(agents),
    ...hooks
  };
};
```

### Plugin Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                     PLUGIN LIFECYCLE                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. LOAD                                                     │
│     ├── OpenCode loads plugin                                │
│     ├── Calls plugin(PluginInput)                            │
│     └── Plugin returns Hooks                                 │
│                                                              │
│  2. REGISTER                                                 │
│     ├── config hook → modifies opencode.json equivalent      │
│     ├── agent hook → registers agents with OpenCode          │
│     └── tool hook → registers custom tools                   │
│                                                              │
│  3. EXECUTE                                                  │
│     ├── User selects agent from dropdown                     │
│     ├── OpenCode uses agent config for session               │
│     └── Hooks intercept all operations                       │
│                                                              │
│  4. SESSION                                                  │
│     ├── chat.message → intercept messages                   │
│     ├── tool.execute.before/after → tool lifecycle           │
│     ├── command.execute.before → slash commands             │
│     └── experimental.session.compacting → context management │
│                                                              │
│  5. UNLOAD                                                   │
│     └── Plugin unloaded when OpenCode closes                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### PluginInput Type

```typescript
interface PluginInput {
  client: ReturnType<typeof createOpencodeClient>;  // OpenCode client
  project: Project;                                   // Project info
  directory: string;                                  // Current working directory
  worktree: string;                                  // Project root
  serverUrl: URL;                                    // OpenCode server URL
  $: BunShell;                                       // Shell interface
}
```

---

## 2. The Plugin Interface

### Complete Hooks Interface

```typescript
interface Hooks {
  // === ENTRY HOOKS ===
  name?: string;                                      // Plugin identifier
  agent?: Record<string, SDKAgentConfig>;             // Agent definitions
  tool?: Record<string, ToolDefinition>;              // Custom tools
  config?: (cfg: Config) => Promise<void>;           // Modify OpenCode config
  
  // === CHAT HOOKS ===
  "chat.message"?: ChatHook;                          // Intercept messages
  "chat.params"?: ParamsHook;                        // Modify LLM params
  "chat.headers"?: HeadersHook;                       // Modify LLM headers
  
  // === TOOL HOOKS ===
  "tool.execute.before"?: ToolHook | ToolHook[];      // Pre-tool execution
  "tool.execute.after"?: ToolHook | ToolHook[];      // Post-tool execution
  "tool.definition"?: ToolDefinitionHook;            // Modify tool schemas
  
  // === COMMAND HOOKS ===
  "command.execute.before"?: CommandHook;             // Pre-command execution
  
  // === SESSION HOOKS ===
  "experimental.session.compacting"?: CompactingHook; // Pre-compaction
  
  // === EXPERIMENTAL HOOKS ===
  "experimental.chat.messages.transform"?: MessagesTransformHook;
  "experimental.chat.system.transform"?: SystemTransformHook;
  "experimental.text.complete"?: TextCompleteHook;
  
  // === SHELL/PERMISSION ===
  "shell.env"?: ShellEnvHook;
  "permission.ask"?: PermissionHook;
  
  // === OTHER ===
  auth?: AuthHook;
  event?: EventHook;
  automation?: AutomationManager;
}
```

### SDKAgentConfig Type

```typescript
interface SDKAgentConfig {
  name: string;
  description?: string;
  model?: string;
  mode?: "primary" | "subagent" | "all";
  permission?: {
    task?: "allow" | "deny";
    file?: Record<string, "allow" | "deny">;
  };
  tools?: string[];           // Whitelist of allowed tools
  system?: string;            // System prompt override
}
```

### Agent Modes

| Mode | Appears in Dropdown | @ Autocomplete | Use Case |
|------|---------------------|----------------|----------|
| `"primary"` | **YES** | NO | Orchestrators user selects |
| `"subagent"` | NO | NO | Delegated agents only |
| `"all"` | YES | **YES** | Universal agents |

### ToolDefinition Pattern

```typescript
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';

const myTool = tool({
  description: "What this tool does",
  args: {
    requiredArg: z.string().describe("Description"),
    optionalArg: z.string().optional().describe("Optional"),
    enumArg: z.enum(["a", "b"]).describe("Enum")
  },
  execute: async (args, context) => {
    // args is typed based on args schema
    // context has: sessionID, messageID, agent, directory, worktree, abort, metadata, ask
    
    const result = await doSomething(args);
    return JSON.stringify(result);
  }
});
```

---

## 3. Agent Design Patterns

### Pattern 1: Hub-and-Spoke Orchestrator

```
                    ┌─────────────────┐
                    │   architect     │ ◄── mode: "primary"
                    │  (orchestrator) │
                    └────────┬────────┘
                             │ delegates
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    coder      │    │   reviewer    │    │test_engineer │
│  (subagent)   │    │  (subagent)   │    │  (subagent)   │
└───────────────┘    └───────────────┘    └───────────────┘
```

```typescript
function createAgents() {
  return {
    // Primary orchestrator (visible in dropdown)
    architect: {
      name: "architect",
      description: "Orchestrates multi-agent workflows",
      model: "provider/model",
      mode: "primary",
      system: architectSystemPrompt,
      permission: { task: "allow" }
    },
    
    // Subagents (hidden, used for delegation)
    coder: {
      name: "coder",
      model: "provider/model",
      mode: "subagent",
      tools: ["Read", "Edit", "Bash", "Glob", "Grep"]
    },
    
    reviewer: {
      name: "reviewer",
      model: "provider/model",
      mode: "subagent",
      tools: ["Read", "Bash", "Grep"]
    },
    
    test_engineer: {
      name: "test_engineer",
      model: "provider/model",
      mode: "subagent",
      tools: ["Read", "Write", "Bash", "Glob"]
    }
  };
}
```

### Pattern 2: Mode Toggle Agents

For switching between different modes (like Shark micro/macro):

```typescript
function createAgents() {
  return {
    // Primary modes visible in dropdown
    micro_engineer: {
      name: "micro_engineer",
      description: "Micro-level implementation agent",
      model: "provider/fast-model",
      mode: "primary",
      system: microSystemPrompt
    },
    
    macro_engineer: {
      name: "macro_engineer", 
      description: "Macro-level architect agent",
      model: "provider/reasoning-model",
      mode: "primary",
      system: macroSystemPrompt
    },
    
    // Internal subagents
    coder_micro: {
      name: "coder_micro",
      model: "provider/coder-model",
      mode: "subagent"
    },
    
    coder_macro: {
      name: "coder_macro",
      model: "provider/coder-model", 
      mode: "subagent"
    }
  };
}
```

### Pattern 3: Single-Agent Plugin

For simple plugins that don't need multi-agent:

```typescript
function createAgents() {
  return {
    my_agent: {
      name: "my_agent",
      description: "My custom agent",
      model: "provider/model",
      mode: "primary",
      system: "You are a helpful coding assistant..."
    }
  };
}
```

### Delegation Pattern

```typescript
// In orchestrator agent's system prompt or tool execution:
async function delegateToAgent(agentName: string, task: string, context: any) {
  // Create delegation payload
  const delegation = {
    to: agentName,
    task: task,
    context: context,
    mode: "subagent"
  };
  
  // Use OpenCode's delegate mechanism
  // This routes the task to the specified subagent
  await context.delegate(delegation);
}
```

---

## 4. Hook System Mastery

### Hook Priority Matrix

| Hook | When | Blocking? | Use Case |
|------|------|-----------|----------|
| `tool.execute.before` | Pre-tool | Can block | Safety, validation |
| `tool.execute.after` | Post-tool | No | Evidence, tracking |
| `command.execute.before` | Pre-command | Can block | Command interception |
| `chat.message` | On message | Can block | Delegation, routing |
| `chat.params` | Pre-LLM | No | Parameter tuning |
| `experimental.session.compacting` | Pre-compact | No | Context injection |

### Hook Utility Functions

```typescript
// Error-safe hook wrapper
function safeHook(fn: HookFn): HookFn {
  return async (input, output) => {
    try {
      await fn(input, output);
    } catch (error) {
      console.error(`Hook error:`, error);
      // Don't rethrow - keeps plugin running
    }
  };
}

// Chain multiple handlers
function composeHandlers(...fns: HookFn[]): HookFn {
  return async (input, output) => {
    for (const fn of fns) {
      await fn(input, output);
    }
  };
}
```

### Common Hook Patterns

#### Pattern 1: Pre-Tool Safety Check

```typescript
"tool.execute.before": async (input, output) => {
  // Check dangerous tools
  if (input.tool === "Bash") {
    const command = output.args.command;
    
    // Block dangerous commands
    if (command.includes("rm -rf") && !command.includes("/safe")) {
      throw new Error(`Safety blocked: dangerous rm command`);
    }
    
    // Block system commands
    if (command.startsWith("sudo") || command.startsWith("systemctl")) {
      throw new Error(`Safety blocked: system command`);
    }
  }
  
  // Track tool usage
  await trackToolUsage(input.sessionID, input.tool);
}
```

#### Pattern 2: Post-Tool Evidence Collection

```typescript
"tool.execute.after": async (input, output) => {
  // Collect evidence for build tasks
  if (isBuildTool(input.tool)) {
    await collectEvidence({
      sessionID: input.sessionID,
      tool: input.tool,
      args: input.args,
      output: output.output,
      timestamp: Date.now()
    });
  }
  
  // Write state snapshot
  await writeSnapshot(input.directory, state);
}
```

#### Pattern 3: Context Injection

```typescript
"experimental.session.compacting": async (input, output) => {
  // Inject plugin state before compaction
  output.context.push(
    `Plugin State: ${JSON.stringify(state.summary)}`,
    `Current Phase: ${state.phase}`,
    `Active Tasks: ${state.tasks.join(', ')}`
  );
}
```

#### Pattern 4: Chat Message Interception

```typescript
"chat.message": async (input, output) => {
  // Detect delegation patterns
  if (output.message.content.includes("/delegate")) {
    const delegation = parseDelegation(output.message.content);
    await handleDelegation(delegation);
    // Clear message to prevent further processing
    output.parts = [];
  }
}
```

### Hook Chain Composition

```typescript
// For tool.execute.before - chain of responsibility
"tool.execute.before": [
  sessionStateHook,      // 1. Ensure session state exists
  safetyCheckHook,       // 2. Safety validation
  scopeGuardHook,        // 3. Scope enforcement
  repetitionCheckHook,   // 4. Repetition detection
  activityTrackHook      // 5. Activity logging
]

// For tool.execute.after - pipeline
"tool.execute.after": [
  evidenceCollectHook,   // 1. Collect evidence
  summarizerHook,        // 2. Summarize output
  snapshotWriterHook,    // 3. Persist state
  compactionCheckHook,   // 4. Check compaction need
  knowledgeCuratorHook   // 5. Extract lessons
]
```

---

## 5. State Management

### State Directory Structure

```
.{plugin-name}/
├── state.json              # Current state snapshot
├── plan.json              # Execution plan
├── plan.md                # Human-readable plan
├── evidence/
│   └── {taskId}/
│       ├── evidence.json  # Task evidence
│       ├── trajectory.jsonl  # Delegation log
│       └── results.json   # Task results
├── telemetry/
│   └── events.jsonl       # Event log
├── checkpoints/
│   └── {label}/           # Named checkpoints
└── knowledge.jsonl        # Persistent learnings
```

### State Interface

```typescript
interface PluginState {
  version: string;
  phase: "clarify" | "plan" | "build" | "review" | "complete";
  tasks: Task[];
  currentTask: string | null;
  agents: Record<string, AgentState>;
  evidence: EvidenceStore;
  checkpoints: string[];
  knowledge: KnowledgeEntry[];
  telemetry: TelemetryEvent[];
}

interface Task {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "done" | "failed";
  assignedAgent: string | null;
  evidence: TaskEvidence | null;
  createdAt: number;
  completedAt: number | null;
}

interface TaskEvidence {
  toolCalls: ToolCall[];
  outputs: string[];
  verified: boolean;
  verifiedBy: string | null;
}
```

### State Persistence Pattern

```typescript
class StateManager {
  constructor(private directory: string) {}
  
  async load(): Promise<PluginState | null> {
    const statePath = `${this.directory}/.my-plugin/state.json`;
    if (await fileExists(statePath)) {
      const data = await readFile(statePath);
      return JSON.parse(data);
    }
    return null;
  }
  
  async save(state: PluginState): Promise<void> {
    const statePath = `${this.directory}/.my-plugin/state.json`;
    await ensureDir(`${this.directory}/.my-plugin`);
    await writeFile(statePath, JSON.stringify(state, null, 2));
  }
  
  async createCheckpoint(label: string, state: PluginState): Promise<void> {
    const checkpointPath = `${this.directory}/.my-plugin/checkpoints/${label}`;
    await ensureDir(checkpointPath);
    await writeFile(`${checkpointPath}/state.json`, JSON.stringify(state));
  }
  
  async restoreCheckpoint(label: string): Promise<PluginState> {
    const checkpointPath = `${this.directory}/.my-plugin/checkpoints/${label}/state.json`;
    const data = await readFile(checkpointPath);
    return JSON.parse(data);
  }
}
```

### Snapshot Writer Hook

```typescript
function createSnapshotWriterHook(stateManager: StateManager) {
  return async (input: any, output: any, state: PluginState) => {
    // Debounce writes (max once per 5 seconds)
    if (Date.now() - state.lastSnapshot < 5000) {
      return;
    }
    
    // Update state
    state.lastSnapshot = Date.now();
    
    // Save to disk
    await stateManager.save(state);
  };
}
```

---

## 6. Tool Development

### Tool Anatomy

```typescript
tool({
  description: "Clear, concise description of what the tool does",
  args: {
    // Required arguments
    arg1: z.string().describe("Description of arg1"),
    
    // Optional arguments
    arg2: z.string().optional().describe("Optional arg2"),
    
    // With validation
    arg3: z.number().min(1).max(100).describe("Number 1-100"),
    
    // Enum
    arg4: z.enum(["option1", "option2"]).describe("Choose one"),
    
    // Complex objects
    arg5: z.object({
      field1: z.string(),
      field2: z.boolean()
    }).describe("Complex arg")
  },
  execute: async (args, context) => {
    // args is fully typed: { arg1: string; arg2?: string; ... }
    // context has: sessionID, messageID, agent, directory, worktree, abort, metadata, ask
    
    // Do work...
    const result = await doWork(args);
    
    // Return string result (displayed to user)
    return JSON.stringify({
      success: true,
      data: result
    });
  }
})
```

### ToolContext Interface

```typescript
interface ToolContext {
  sessionID: string;        // Current session ID
  messageID: string;        // Current message ID
  agent: string;            // Current agent name
  directory: string;         // Current project directory
  worktree: string;         // Project root
  abort: AbortSignal;        // Abort signal for cancellation
  metadata(input: { title?: string; metadata?: any }): void;
  ask(input: AskInput): Promise<void>;
}

interface AskInput {
  permission: string;        // Permission being requested
  patterns: string[];        // File patterns being accessed
  always: string[];          // Patterns to always allow
  metadata: Record<string, any>;
}
```

### Tool Patterns

#### Pattern 1: File Operations

```typescript
const read_file = tool({
  description: "Read contents of a file",
  args: {
    path: z.string().describe("Absolute path to file")
  },
  execute: async (args, context) => {
    // Use context.directory for project-relative paths
    const fullPath = `${context.directory}/${args.path}`;
    
    if (!await fileExists(fullPath)) {
      return JSON.stringify({ error: "File not found" });
    }
    
    const content = await readFile(fullPath);
    return JSON.stringify({ content });
  }
});
```

#### Pattern 2: State Management Tools

```typescript
const save_plan = tool({
  description: "Save execution plan to disk",
  args: {
    plan: z.object({
      tasks: z.array(z.object({
        id: z.string(),
        description: z.string()
      }))
    }).describe("Plan to save")
  },
  execute: async (args, context) => {
    const planPath = `${context.directory}/.my-plugin/plan.json`;
    await ensureDir(`${context.directory}/.my-plugin`);
    await writeFile(planPath, JSON.stringify(args.plan, null, 2));
    
    return JSON.stringify({ success: true, path: planPath });
  }
});
```

#### Pattern 3: Evidence Collection Tools

```typescript
const collect_evidence = tool({
  description: "Collect evidence for a task",
  args: {
    taskId: z.string().describe("Task ID"),
    toolCall: z.object({
      tool: z.string(),
      args: z.any(),
      output: z.string()
    }).describe("Tool call to record")
  },
  execute: async (args, context) => {
    const evidenceDir = `${context.directory}/.my-plugin/evidence/${args.taskId}`;
    await ensureDir(evidenceDir);
    
    const evidenceFile = `${evidenceDir}/evidence.json`;
    const existing = await fileExists(evidenceFile) 
      ? JSON.parse(await readFile(evidenceFile))
      : { toolCalls: [] };
    
    existing.toolCalls.push(args.toolCall);
    await writeFile(evidenceFile, JSON.stringify(existing, null, 2));
    
    return JSON.stringify({ success: true });
  }
});
```

#### Pattern 4: Checkpoint Tools

```typescript
const create_checkpoint = tool({
  description: "Create a named checkpoint",
  args: {
    label: z.string().describe("Checkpoint label"),
    note: z.string().optional().describe("Optional note")
  },
  execute: async (args, context) => {
    const state = await stateManager.load();
    
    const checkpointDir = `${context.directory}/.my-plugin/checkpoints/${args.label}`;
    await ensureDir(checkpointDir);
    await writeFile(`${checkpointDir}/state.json`, JSON.stringify(state));
    await writeFile(`${checkpointDir}/note.txt`, args.note || "");
    
    return JSON.stringify({ success: true, checkpoint: args.label });
  }
});
```

---

## 7. Command Registration

### Command Definition

```typescript
config: async (opencodeConfig) => {
  // Register slash commands
  opencodeConfig.command = {
    // Main command with argument placeholder
    mycmd: {
      template: "/mycmd $ARGUMENTS",
      description: "My plugin command - does X, Y, Z"
    },
    
    // Shorthand commands
    "mycmd-status": {
      template: "/mycmd status",
      description: "Show current status"
    },
    
    "mycmd-reset": {
      template: "/mycmd reset --confirm",
      description: "Reset plugin state"
    }
  };
}
```

### Command Handler Pattern

```typescript
"command.execute.before": async (input, output) => {
  // Parse command
  const [cmd, ...args] = input.command.split(" ");
  const argString = args.join(" ");
  
  switch (cmd) {
    case "/mycmd":
      await handleMyCommand(input, argString, output);
      break;
    case "/othercmd":
      await handleOtherCommand(input, argString, output);
      break;
  }
}

async function handleMyCommand(input, args, output) {
  // Parse arguments
  const parsed = parseArgs(args);
  
  // Execute
  const result = await myPluginCommand(parsed, {
    directory: input.directory,
    sessionID: input.sessionID
  });
  
  // Return result
  output.parts = [
    { type: "text", text: result }
  ];
}
```

### Built-in Command Parsing

```typescript
// Common patterns
"/mycmd status"           // → cmd="mycmd", action="status"
"/mycmd reset --confirm"  // → cmd="mycmd", action="reset", flag="confirm"
"/mycmd do thing arg"     // → cmd="mycmd", action="do", target="thing", rest="arg"
```

---

## 8. UI Integration - The Tab Toggle

### The Dual-Layer Mechanism

**Layer 1**: Plugin's `config` hook injects agents into OpenCode's registry
**Layer 2**: `opencode.json` specifies which agents to show/disable

### Layer 1: Config Hook Injection

```typescript
config: async (opencodeConfig) => {
  // Ensure agent registry exists
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = {};
  }
  
  // Inject our agents (MERGE, don't replace)
  Object.assign(opencodeConfig.agent, {
    my_orchestrator: {
      name: "my_orchestrator",
      description: "My orchestrator - coordinates workflows",
      model: "provider/model",
      mode: "primary",       // <-- KEY: appears in dropdown
      system: orchestratorSystemPrompt
    },
    
    my_coder: {
      name: "my_coder",
      description: "Implementation specialist",
      model: "provider/model",
      mode: "subagent"       // <-- Hidden from dropdown
    },
    
    my_reviewer: {
      name: "my_reviewer",
      model: "provider/model",
      mode: "subagent"
    }
  });
  
  // Register commands
  opencodeConfig.command = {
    myplugin: { template: "/myplugin $ARGUMENTS" },
    "myplugin-status": { template: "/myplugin status" }
  };
}
```

### Layer 2: opencode.json Configuration

```json
{
  "agent": {
    // Disable built-in agents we don't want
    "architect": { "disable": true },
    "explore": { "disable": true },
    "general": { "disable": true },
    
    // Configure our plugin agents
    "my_orchestrator": {
      "model": "provider/model",
      "description": "My orchestrator"
    }
  },
  "plugin": [
    "hive-mind-plugin",
    "spider-agent",
    "my-plugin"      // <-- Register our plugin
  ]
}
```

### How Tab Toggle Works

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode UI                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Agent Dropdown:                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ◉ my_orchestrator (mode: "primary")                 │    │
│  │   other_plugin_agent (mode: "primary")               │    │
│  │   spider (mode: "primary")                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  When "my_orchestrator" selected:                           │
│  ├── Uses my_orchestrator config                            │
│  ├── System prompt injected                                 │
│  ├── Model specified                                        │
│  └── Can delegate to my_coder (mode: "subagent")           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Making Agents Appear/Disappear Dynamically

```typescript
// In chat.message hook - detect mode switches
"chat.message": async (input, output) => {
  if (output.message.content.includes("/mode micro")) {
    // Dynamically switch which agent is "primary"
    await updateAgentMode(input.sessionID, "micro_engineer", "primary");
    await updateAgentMode(input.sessionID, "macro_engineer", "subagent");
  }
  
  if (output.message.content.includes("/mode macro")) {
    await updateAgentMode(input.sessionID, "macro_engineer", "primary");
    await updateAgentMode(input.sessionID, "micro_engineer", "subagent");
  }
}
```

---

## 9. Pipeline Design

### Pipeline Phases

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION PIPELINE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CLARIFY ──► PLAN ──► BUILD ──► REVIEW ──► COMPLETE              │
│     │         │        │         │          │                   │
│     ▼         ▼        ▼         ▼          ▼                   │
│  Questions  Plan.md  Tasks     QA Gates   Documentation         │
│             plan.json        Evidence   Archival                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase State Machine

```typescript
type Phase = "clarify" | "plan" | "build" | "review" | "complete";

const phaseTransitions: Record<Phase, Phase[]> = {
  clarify: ["plan"],
  plan: ["build", "clarify"],    // Can go back to clarify
  build: ["review", "plan"],      // Can iterate on plan
  review: ["complete", "build"],  // Can go back to build
  complete: []                    // Terminal
};

function transition(current: Phase, next: Phase): boolean {
  return phaseTransitions[current].includes(next);
}
```

### Multi-Agent Pipeline Implementation

```typescript
async function executeBuildPhase(task: Task, state: PluginState, context: ToolContext) {
  // Update phase
  state.phase = "build";
  
  // 1. Delegate to explorer for context
  const context = await delegate("explorer", `Gather context for: ${task.description}`);
  
  // 2. Delegate to coder for implementation
  const implementation = await delegate("coder", task.description);
  
  // 3. QA Gate - must pass reviewer before continuing
  const reviewResult = await delegate("reviewer", implementation);
  
  if (!reviewResult.passed) {
    // Loop back to coder with feedback
    const revised = await delegate("coder", `${task.description}\n\nFeedback: ${reviewResult.feedback}`);
    await delegate("reviewer", revised);
  }
  
  // 4. Test gate
  const testResult = await delegate("test_engineer", implementation);
  
  // 5. Evidence collection
  await collectBuildEvidence(task.id, {
    context,
    implementation,
    review: reviewResult,
    test: testResult
  });
  
  // 6. Mark task complete
  task.status = "done";
  task.evidence = collectedEvidence;
}
```

### Delegation with Evidence

```typescript
interface DelegationResult {
  output: string;
  evidence: {
    toolCalls: ToolCall[];
    output: string;
    verified: boolean;
  };
}

async function delegate(agentName: string, task: string): Promise<DelegationResult> {
  // Log delegation start
  await logDelegation(agentName, task);
  
  // Execute delegation
  const result = await context.delegate({
    to: agentName,
    task: task,
    mode: "subagent"
  });
  
  // Log delegation end
  await logDelegationComplete(agentName, result);
  
  return {
    output: result.output,
    evidence: {
      toolCalls: result.toolCalls,
      output: result.output,
      verified: false
    }
  };
}
```

---

## 10. Mechanical Enforcement

### Enforcement Layers

```
┌─────────────────────────────────────────────────────────────┐
│                 ENFORCEMENT LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Safety Stack (tool.execute.before)                │
│  ├── File path restrictions                                 │
│  ├── Command allowlisting                                   │
│  └── Dangerous pattern detection                            │
│                                                              │
│  Layer 2: Scope Guard (tool.execute.before)                  │
│  ├── Scope declarations                                     │
│  ├── File access boundaries                                 │
│  └── API call limits                                        │
│                                                              │
│  Layer 3: QA Gate (delegation gate)                         │
│  ├── Cannot skip reviewer                                   │
│  ├── Cannot skip test_engineer                              │
│  └── Evidence required                                      │
│                                                              │
│  Layer 4: Evidence Verification                              │
│  ├── Evidence must be collected                             │
│  ├── Evidence must be verified                              │
│  └── Verification logged                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Safety Stack Implementation

```typescript
class SafetyStack {
  private rules: SafetyRule[] = [
    // Block system commands
    { type: "command", pattern: /^sudo/, action: "block" },
    { type: "command", pattern: /^systemctl/, action: "block" },
    { type: "command", pattern: /^rm\s+-rf/, action: "block" },
    
    // Block sensitive paths
    { type: "path", pattern: /^\/etc/, action: "block" },
    { type: "path", pattern: /^\/root/, action: "block" },
    { type: "path", pattern: /^\/home\/.*\/.ssh/, action: "block" },
    
    // Allow specific patterns
    { type: "command", pattern: /^rm\s+-rf\s+\.\/node_modules/, action: "allow" },
    { type: "path", pattern: /^\/home\/leviathan\/project/, action: "allow" }
  ];
  
  async check(tool: string, args: any): Promise<SafetyResult> {
    if (tool === "Bash") {
      return this.checkCommand(args.command);
    }
    
    if (tool === "Write" || tool === "Edit") {
      return this.checkPath(args.file_path);
    }
    
    return { allowed: true };
  }
  
  private checkCommand(command: string): SafetyResult {
    for (const rule of this.rules) {
      if (rule.type === "command" && rule.pattern.test(command)) {
        return {
          allowed: rule.action === "allow",
          reason: rule.action === "block" ? `Blocked: ${rule.pattern}` : undefined
        };
      }
    }
    return { allowed: true };
  }
}
```

### QA Gate Implementation

```typescript
class QAGate {
  private delegationCounts: Record<string, number> = {};
  private lastDelegations: Record<string, string[]> = {};
  
  check(state: PluginState, proposedDelegation: string): QAGateResult {
    const agent = state.currentAgent;
    const delegations = this.lastDelegations[agent] || [];
    
    // If coder, enforce reviewer/test pattern
    if (agent === "coder") {
      const coderCount = this.delegationCounts[`${agent}_coder`] || 0;
      const reviewerCount = this.delegationCounts[`${agent}_reviewer`] || 0;
      
      if (coderCount >= 2 && reviewerCount === 0) {
        return {
          allowed: false,
          reason: "QA GATE: Cannot delegate to coder 2x without reviewer"
        };
      }
    }
    
    // If proposed delegation is to reviewer/test, reset counters
    if (["reviewer", "test_engineer"].includes(proposedDelegation)) {
      this.delegationCounts[`${agent}_coder`] = 0;
    }
    
    return { allowed: true };
  }
  
  recordDelegation(from: string, to: string): void {
    this.delegationCounts[`${from}_${to}`]++;
    const list = this.lastDelegations[from] || [];
    list.push(to);
    this.lastDelegations[from] = list.slice(-10); // Keep last 10
  }
}
```

### Scope Guard Implementation

```typescript
class ScopeGuard {
  private declaredScopes: Map<string, string[]> = new Map();
  
  declareScope(agent: string, scopes: string[]): void {
    this.declaredScopes.set(agent, scopes);
  }
  
  check(tool: string, args: any, agent: string): boolean {
    const scopes = this.declaredScopes.get(agent) || [];
    
    // If no scopes declared, allow all
    if (scopes.length === 0) {
      return true;
    }
    
    // Check tool scope
    if (!scopes.includes(tool)) {
      console.warn(`Scope violation: ${agent} attempted ${tool}`);
      return false;
    }
    
    // Check path scope for file operations
    if (["Read", "Edit", "Write"].includes(tool)) {
      const path = args.file_path || args.path;
      if (path && !this.isPathInScope(path, scopes)) {
        console.warn(`Scope violation: ${agent} accessed ${path}`);
        return false;
      }
    }
    
    return true;
  }
  
  private isPathInScope(path: string, scopes: string[]): boolean {
    for (const scope of scopes) {
      if (scope.startsWith("./")) {
        // Relative scope - check within project
        if (path.includes(scope.slice(2))) {
          return true;
        }
      } else if (scope.startsWith("/")) {
        // Absolute scope
        if (path.startsWith(scope)) {
          return true;
        }
      }
    }
    return false;
  }
}
```

---

## 11. Performance Patterns

### Debouncing

```typescript
class Debouncer {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  debounce(key: string, fn: () => Promise<void>, ms: number): void {
    const existing = this.timers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    
    this.timers.set(key, setTimeout(async () => {
      try {
        await fn();
      } finally {
        this.timers.delete(key);
      }
    }, ms));
  }
}

// Usage in hook
const snapshotDebouncer = new Debouncer();

"tool.execute.after": async (input, output) => {
  snapshotDebouncer.debounce("snapshot", async () => {
    await stateManager.save(state);
  }, 5000); // Max once per 5 seconds
}
```

### Caching

```typescript
class Cache<K, V> {
  private store: Map<K, { value: V; expires: number }> = new Map();
  private ttl: number;
  
  constructor(ttl: number) {
    this.ttl = ttl;
  }
  
  get(key: K): V | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  set(key: K, value: V): void {
    this.store.set(key, {
      value,
      expires: Date.now() + this.ttl
    });
  }
}

// Usage
const agentConfigCache = new Cache<string, any>(5 * 60 * 1000); // 5 min TTL
```

### Batch Processing

```typescript
class BatchProcessor<T> {
  private queue: T[] = [];
  private processing = false;
  
  async add(item: T, processor: (item: T) => Promise<void>): Promise<void> {
    this.queue.push(item);
    
    if (!this.processing) {
      this.processing = true;
      await this.drain(processor);
      this.processing = false;
    }
  }
  
  private async drain(processor: (item: T) => Promise<void>): Promise<void> {
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 10); // Process 10 at a time
      await Promise.all(batch.map(item => processor(item)));
    }
  }
}
```

### Memory Management

```typescript
class MemoryManager {
  private memoryUsage: Map<string, number> = new Map();
  
  track(label: string, size: number): void {
    this.memoryUsage.set(label, size);
    this.checkMemory();
  }
  
  private checkMemory(): void {
    const total = Array.from(this.memoryUsage.values()).reduce((a, b) => a + b, 0);
    
    // If approaching memory limits, trigger cleanup
    if (total > 100 * 1024 * 1024) { // 100MB
      this.cleanup();
    }
  }
  
  private cleanup(): void {
    // Clear caches
    agentConfigCache.clear();
    
    // Clear old summaries
    const oldSummaries = getOldSummaries(24 * 60 * 60 * 1000); // 24 hours
    oldSummaries.forEach(s => deleteSummary(s));
  }
}
```

---

## 12. Testing Strategies

### Unit Testing Hooks

```typescript
import { describe, it, expect, vi } from 'vitest';

describe("SafetyStack", () => {
  const safety = new SafetyStack();
  
  it("blocks dangerous commands", async () => {
    const result = await safety.check("Bash", { command: "sudo rm -rf /" });
    expect(result.allowed).toBe(false);
  });
  
  it("allows safe commands", async () => {
    const result = await safety.check("Bash", { command: "ls -la" });
    expect(result.allowed).toBe(true);
  });
  
  it("allows scoped commands", async () => {
    const result = await safety.check("Bash", { command: "rm -rf ./node_modules" });
    expect(result.allowed).toBe(true);
  });
});

describe("QAGate", () => {
  const gate = new QAGate();
  
  it("allows first coder delegation", () => {
    const result = gate.check(initialState, "coder");
    expect(result.allowed).toBe(true);
  });
  
  it("blocks second coder without reviewer", () => {
    gate.recordDelegation("architect", "coder");
    gate.recordDelegation("architect", "coder");
    const result = gate.check(state, "coder");
    expect(result.allowed).toBe(false);
  });
  
  it("resets after reviewer delegation", () => {
    gate.recordDelegation("architect", "reviewer");
    const result = gate.check(state, "coder");
    expect(result.allowed).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe("Plugin Integration", () => {
  const mockInput: PluginInput = {
    directory: "/tmp/test-project",
    worktree: "/tmp/test-project",
    sessionID: "test-session",
    // ... mock other fields
  };
  
  it("initializes and returns hooks", async () => {
    const plugin = await MyPlugin(mockInput);
    
    expect(plugin.name).toBe("my-plugin");
    expect(plugin.agent).toBeDefined();
    expect(plugin.tool).toBeDefined();
    expect(plugin.config).toBeDefined();
  });
  
  it("registers agents correctly", async () => {
    const plugin = await MyPlugin(mockInput);
    
    const config = {};
    await plugin.config!(config as any);
    
    expect(config.agent!.my_orchestrator).toBeDefined();
    expect(config.agent!.my_orchestrator!.mode).toBe("primary");
    expect(config.agent!.my_coder!.mode).toBe("subagent");
  });
  
  it("executes hooks safely", async () => {
    const plugin = await MyPlugin(mockInput);
    
    const toolInput = { tool: "Bash", command: "ls", sessionID: "test", callID: "1" };
    const toolOutput = { args: { command: "ls" } };
    
    // Should not throw
    if (Array.isArray(plugin["tool.execute.before"])) {
      for (const hook of plugin["tool.execute.before"]!) {
        await hook(toolInput as any, toolOutput as any);
      }
    } else {
      await plugin["tool.execute.before"]!(toolInput as any, toolOutput as any);
    }
  });
});
```

### E2E Testing with OpenCode

```typescript
describe("E2E: Agent Selection", () => {
  it("shows my agent in dropdown", async () => {
    // Start OpenCode with our plugin
    const opencode = await startOpenCode({
      plugins: ["my-plugin"]
    });
    
    // Get agent list
    const agents = await opencode.getAgents();
    
    // Verify our agent appears
    const myAgent = agents.find(a => a.name === "my_orchestrator");
    expect(myAgent).toBeDefined();
    expect(myAgent!.mode).toBe("primary");
  });
  
  it("hides subagents from dropdown", async () => {
    const agents = await opencode.getAgents({ mode: "primary" });
    const subagents = await opencode.getAgents({ mode: "subagent" });
    
    // Subagents should not appear in primary list
    expect(agents.find(a => a.name === "my_coder")).toBeUndefined();
    
    // But exist in full list
    expect(subagents.find(a => a.name === "my_coder")).toBeDefined();
  });
});
```

---

## 13. Deployment

### Package Structure

```
my-plugin/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Plugin entry
│   ├── agents/
│   │   └── index.ts       # Agent definitions
│   ├── hooks/
│   │   ├── index.ts       # Hook exports
│   │   ├── tool-hooks.ts  # Tool hooks
│   │   └── chat-hooks.ts  # Chat hooks
│   ├── tools/
│   │   └── index.ts       # Tool definitions
│   ├── state/
│   │   └── manager.ts     # State management
│   └── types/
│       └── index.ts       # Type definitions
├── dist/                  # Compiled output
└── README.md
```

### package.json

```json
{
  "name": "@myorg/opencode-my-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.0.0"
  }
}
```

### Build Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Installation

```bash
# Development
npm install -g ~/path/to/my-plugin

# Or symlink
npm link ~/path/to/my-plugin

# Verify
opencode --list-plugins
```

### opencode.json Configuration

```json
{
  "plugin": [
    "hive-mind-plugin",
    "spider-agent",
    "@myorg/opencode-my-plugin"
  ]
}
```

---

## 14. Plugin Blueprint Generator

Use this blueprint to generate new plugins:

```typescript
// ============================================================
// PLUGIN BLUEPRINT - Copy and customize for new plugins
// ============================================================

const PLUGIN_TEMPLATE = {
  name: "my-plugin",
  
  // 1. AGENTS - Define your agent hierarchy
  agents: {
    orchestrator: {
      mode: "primary",      // Visible in dropdown
      model: "provider/model",
      system: "You are orchestrator..."
    },
    coder: {
      mode: "subagent",     // Hidden, for delegation
      model: "provider/model"
    },
    reviewer: {
      mode: "subagent",
      model: "provider/model"
    }
  },
  
  // 2. TOOLS - Custom tools for your plugin
  tools: [
    {
      name: "my_tool",
      description: "Does something useful",
      args: {
        input: z.string().describe("Input description")
      }
    }
  ],
  
  // 3. STATE - Your state structure
  state: {
    version: "1.0.0",
    phase: "clarify",
    tasks: [],
    evidence: {}
  },
  
  // 4. HOOKS - Your hook implementations
  hooks: {
    beforeTool: [
      safetyCheckHook,
      scopeGuardHook
    ],
    afterTool: [
      evidenceCollectHook,
      snapshotWriterHook
    ],
    chat: [],
    compaction: []
  },
  
  // 5. COMMANDS - Slash commands
  commands: [
    { name: "myplugin", template: "/myplugin $ARGUMENTS" }
  ]
};
```

### Quick Start Checklist

- [ ] Name plugin uniquely (scope:name format)
- [ ] Define orchestrator as `mode: "primary"`
- [ ] Define subagents as `mode: "subagent"`
- [ ] Implement `config` hook to register agents
- [ ] Add `tool.execute.before` for safety checks
- [ ] Add `tool.execute.after` for evidence/state
- [ ] Create state persistence directory `.{plugin-name}/`
- [ ] Add slash commands in `config` hook
- [ ] Test with `opencode --list-plugins`
- [ ] Document in README with usage examples

### Common Pitfalls

1. **Forgetting `config` hook** - Agents won't appear in UI
2. **Not using `safeHook`** - One error crashes all hooks
3. **No state persistence** - State lost on restart
4. **Blocking in hooks** - Can freeze OpenCode
5. **No debouncing** - Performance issues
6. **Memory leaks** - Cache/summary accumulation
7. **Missing error handling** - Plugin crashes on edge cases

---

## Appendix: Complete Type Reference

```typescript
// Plugin entry
type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>;

// PluginInput
interface PluginInput {
  client: ReturnType<typeof createOpencodeClient>;
  project: Project;
  directory: string;
  worktree: string;
  serverUrl: URL;
  $: BunShell;
}

// Hooks (all possible hooks)
interface Hooks {
  name?: string;
  agent?: Record<string, SDKAgentConfig>;
  tool?: Record<string, ToolDefinition>;
  config?: (cfg: Config) => Promise<void>;
  "chat.message"?: (input: ChatInput, output: ChatOutput) => Promise<void>;
  "chat.params"?: (input: ParamsInput, output: ParamsOutput) => Promise<void>;
  "chat.headers"?: (input: HeadersInput, output: HeadersOutput) => Promise<void>;
  "tool.execute.before"?: ToolHook | ToolHook[];
  "tool.execute.after"?: ToolHook | ToolHook[];
  "tool.definition"?: (input: ToolDefInput, output: ToolDefOutput) => Promise<void>;
  "command.execute.before"?: (input: CommandInput, output: CommandOutput) => Promise<void>;
  "experimental.session.compacting"?: (input: CompactInput, output: CompactOutput) => Promise<void>;
  "experimental.chat.messages.transform"?: (input: any, output: MessagesOutput) => Promise<void>;
  "experimental.chat.system.transform"?: (input: SystemInput, output: SystemOutput) => Promise<void>;
  "experimental.text.complete"?: (input: CompleteInput, output: CompleteOutput) => Promise<void>;
  "shell.env"?: (input: ShellInput, output: ShellOutput) => Promise<void>;
  "permission.ask"?: (input: Permission, output: PermissionOutput) => Promise<void>;
}

// SDKAgentConfig
interface SDKAgentConfig {
  name: string;
  description?: string;
  model?: string;
  mode?: "primary" | "subagent" | "all";
  permission?: {
    task?: "allow" | "deny";
    file?: Record<string, "allow" | "deny">;
  };
  tools?: string[];
  system?: string;
}

// ToolContext
interface ToolContext {
  sessionID: string;
  messageID: string;
  agent: string;
  directory: string;
  worktree: string;
  abort: AbortSignal;
  metadata(input: { title?: string; metadata?: any }): void;
  ask(input: AskInput): Promise<void>;
}
```

---

*T1 Canonical - OpenCode Plugin Engineering*
*Version 1.0.0 - 2026-04-01*
