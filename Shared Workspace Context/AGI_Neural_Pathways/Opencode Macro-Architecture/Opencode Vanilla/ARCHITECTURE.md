# OpenCode Vanilla Architecture
## Complete Technical Reference

**Date:** 2026-04-03
**Source:** https://github.com/anomalyco/opencode (read from source)
**Purpose:** Canonical architecture reference for any agent building OpenCode infra or plugins

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Plugin System](#2-plugin-system)
3. [Hook System](#3-hook-system)
4. [Agent System](#4-agent-system)
5. [Permission System](#5-permission-system)
6. [Tool System](#6-tool-system)
7. [Configuration System](#7-configuration-system)
8. [Session Management](#8-session-management)
9. [CLI Entry Points](#9-cli-entry-points)
10. [Key Files Reference](#10-key-files-reference)

---

## 1. Architecture Overview

OpenCode is a modular AI coding agent built on a plugin-first architecture. The core is a thin runtime that coordinates providers, agents, tools, and plugins through a well-defined SDK.

### Package Structure

```
packages/
├── plugin/        # Plugin SDK — types, interfaces, tool factory
├── sdk/           # JS SDK for external integrations
├── opencode/      # Main CLI application
├── app/           # Desktop app (Electron)
├── console/       # Web console
├── ui/            # Shared UI components
└── ...
```

### Core Concept

```
Plugin = Function that returns Hooks
Input  = PluginInput (client, project, directory, worktree, serverUrl, shell)
Output = Hooks object (tools, agents, config modifiers, lifecycle hooks)
```

### Execution Flow

```
1. CLI parses arguments (yargs)
2. Log.init() — initialize logging
3. Load configuration (multi-source, priority ordered)
4. Load plugins (global → project → npm)
5. Create TUI (Text User Interface)
6. Enter main event loop
```

---

## 2. Plugin System

**File:** `packages/plugin/src/index.ts`

### Plugin Type

```typescript
export type Plugin = (
  input: PluginInput,
  options?: PluginOptions
) => Promise<Hooks>

export type PluginModule = {
  id?: string
  server: Plugin      // Main plugin entry point
  tui?: never         // Reserved for future TUI plugins
}
```

### PluginInput

Passed to the plugin factory function on initialization:

```typescript
export type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>  // OpenCode API client
  project: Project                                   // Current project metadata
  directory: string                                  // Project working directory
  worktree: string                                   // Worktree root path
  serverUrl: URL                                     // Server endpoint URL
  $: BunShell                                       // Bun shell interface for subprocess execution
}
```

### PluginOptions

```typescript
export type PluginOptions = Record<string, unknown>
```

### Plugin Spec Format (in opencode.json)

```typescript
// Simple string
"plugin-name"

// With options
["plugin-name", { option1: "value" }]

// File path
"file:///path/to/plugin.js"
```

### Plugin Loading Order

1. Global config: `~/.config/opencode/` or `/etc/opencode/`
2. Project config: `.opencode/plugins/`
3. NPM packages (via `plugin:` specifier)
4. Config array in `opencode.json`

### BunShell Interface

The `ctx.$` shell is a Bun-first template tag for subprocess execution:

```typescript
export interface BunShell {
  // Template tag
  (strings: TemplateStringsArray, ...expressions: ShellExpression[]): BunShellPromise
  
  braces(pattern: string): string[]
  escape(input: string): string
  env(newEnv?: Record<string, string | undefined>): BunShell
  cwd(newCwd?: string): BunShell
  nothrow(): BunShell
  throws(shouldThrow: boolean): BunShell
}

export interface BunShellPromise extends Promise<BunShellOutput> {
  stdin: WritableStream
  cwd(newCwd: string): this
  env(newEnv: Record<string, string> | undefined): this
  quiet(): this          // Buffer only, no stdout/stderr echo
  lines(): AsyncIterable<string>
  text(encoding?: BufferEncoding): Promise<string>
  json(): Promise<any>
  arrayBuffer(): Promise<ArrayBuffer>
  blob(): Promise<Blob>
  nothrow(): this
  throws(shouldThrow: boolean): this
}

export interface BunShellOutput {
  readonly stdout: Buffer
  readonly stderr: Buffer
  readonly exitCode: number
  text(encoding?: BufferEncoding): string
  json(): any
  arrayBuffer(): ArrayBuffer
  bytes(): Uint8Array
  blob(): Blob
}
```

**Usage example:**
```typescript
const result = await ctx.$`ls -la ${ctx.directory}`;
const files = await ctx.$`find . -name "*.ts"`.lines();
```

---

## 3. Hook System

**Files:** `packages/plugin/src/index.ts` (type defs), `packages/opencode/src/hooks/` (impl)

Hooks are the primary extension mechanism. All hooks are optional.

### Complete Hooks Interface

```typescript
export interface Hooks {
  // Lifecycle
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  
  // Tool registration
  tool?: { [key: string]: ToolDefinition }
  
  // Auth provider
  auth?: AuthHook
  
  // Provider resolution
  provider?: ProviderHook
  
  // Chat hooks
  "chat.message"?: (input: ChatMessageInput, output: ChatMessageOutput) => Promise<void>
  "chat.params"?: (input: ChatParamsInput, output: ChatParamsOutput) => Promise<void>
  "chat.headers"?: (input: ChatHeadersInput, output: ChatHeadersOutput) => Promise<void>
  
  // Permission hook
  "permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
  
  // Command hooks
  "command.execute.before"?: (input: CommandInput, output: { parts: Part[] }) => Promise<void>
  
  // Tool execution hooks
  "tool.execute.before"?: (input: ToolExecuteBeforeInput, output: { args: any }) => Promise<void>
  "tool.execute.after"?: (input: ToolExecuteAfterInput, output: ToolExecuteAfterOutput) => Promise<void>
  "tool.definition"?: (input: { toolID: string }, output: { description: string; parameters: any }) => Promise<void>
  
  // Shell hook
  "shell.env"?: (input: ShellEnvInput, output: { env: Record<string, string> }) => Promise<void>
  
  // Experimental hooks
  "experimental.chat.messages.transform"?: (input: {}, output: MessagesTransformOutput) => Promise<void>
  "experimental.chat.system.transform"?: (input: SystemTransformInput, output: { system: string[] }) => Promise<void>
  "experimental.session.compacting"?: (input: { sessionID: string }, output: CompactingOutput) => Promise<void>
  "experimental.text.complete"?: (input: TextCompleteInput, output: { text: string }) => Promise<void>
}
```

### Hook Execution Order

| Order | Hook | When |
|-------|------|------|
| 1 | `config` | On config load |
| 2 | `event` | Any system event |
| 3 | `provider` | Provider resolution |
| 4 | `auth` | Auth setup |
| 5 | `chat.message` | New message received |
| 6 | `chat.params` | Before LLM call (temperature, topP, topK) |
| 7 | `chat.headers` | Before LLM call (HTTP headers) |
| 8 | `tool.definition` | Before tool list sent to LLM |
| 9 | `tool.execute.before` | Before each tool call |
| 10 | Tool execution | The tool itself |
| 11 | `tool.execute.after` | After each tool call |
| 12 | `command.execute.before` | Before command execution |
| 13 | `shell.env` | Shell environment injection |
| 14 | `permission.ask` | Permission prompts |
| 15 | `experimental.chat.messages.transform` | Message transformation |
| 16 | `experimental.chat.system.transform` | System prompt modification |
| 17 | `experimental.session.compacting` | Session compaction |
| 18 | `experimental.text.complete` | Text completion post-processing |

### Key Hook Signatures

#### `tool.execute.before`

Most important hook for plugins. Can modify tool arguments or block execution by throwing.

```typescript
"tool.execute.before"?: (
  input: {
    tool: string        // Tool name e.g. "read", "write", "bash"
    sessionID: string
    callID: string
  },
  output: {
    args: any           // Modify tool arguments here
  }
) => Promise<void>

// Example: blocking a tool
"tool.execute.before": async (input, output) => {
  if (input.tool === "write" && isBlockedFile(output.args.filePath)) {
    throw new Error("Write blocked: protected file");
  }
}

// Example: modifying arguments
"tool.execute.before": async (input, output) => {
  if (input.tool === "bash") {
    output.args.command = output.args.command + " 2>&1";
  }
}
```

#### `tool.execute.after`

Capture or transform tool output after execution.

```typescript
"tool.execute.after"?: (
  input: {
    tool: string
    sessionID: string
    callID: string
    args: any
  },
  output: {
    title: string
    output: string      // The actual output text
    metadata: any
  }
) => Promise<void>
```

#### `chat.message`

Process incoming messages before they reach the LLM.

```typescript
"chat.message"?: (
  input: {
    sessionID: string
    agent?: string
    model?: { providerID: string; modelID: string }
    messageID?: string
    variant?: string
  },
  output: {
    message: UserMessage
    parts: Part[]
  }
) => Promise<void>
```

#### `experimental.chat.system.transform`

Modify the system prompt that goes to the LLM.

```typescript
"experimental.chat.system.transform"?: (
  input: {
    sessionID?: string
    model: Model
  },
  output: {
    system: string[]     // Array of system prompt strings
  }
) => Promise<void>
```

#### `experimental.chat.messages.transform`

Transform all messages in the conversation history.

```typescript
"experimental.chat.messages.transform"?: (
  input: {},
  output: {
    messages: {
      info: Message
      parts: Part[]
    }[]
  }
) => Promise<void>
```

#### `permission.ask`

Intercept and handle permission requests.

```typescript
"permission.ask"?: (
  input: Permission,
  output: { status: "ask" | "deny" | "allow" }
) => Promise<void>
```

---

## 4. Agent System

**File:** `packages/opencode/src/agent/agent.ts`

### Agent Modes

| Mode | UI Visible | Purpose |
|------|-----------|---------|
| `"primary"` | Yes — dropdown | Main agents user can select |
| `"subagent"` | No — hidden | Delegated agents, internal only |
| `"all"` | Yes — everywhere | Universal agents (default for custom) |

### Built-in Agents

OpenCode has 7 built-in agents:

| Agent | Mode | Hidden | Purpose |
|-------|------|--------|---------|
| `build` | `primary` | No | Default agent. Full tool access. |
| `plan` | `primary` | No | Read-only planning mode. |
| `general` | `subagent` | No | General-purpose research agent. |
| `explore` | `subagent` | No | Fast codebase exploration. |
| `compaction` | `primary` | Yes | Internal: session compaction. |
| `title` | `primary` | Yes | Internal: generate session titles. |
| `summary` | `primary` | Yes | Internal: generate session summaries. |

### Agent Info Schema

```typescript
export const Info = z.object({
  name: z.string(),
  description: z.string().optional(),
  mode: z.enum(["subagent", "primary", "all"]),
  native: z.boolean().optional(),
  hidden: z.boolean().optional(),
  topP: z.number().optional(),
  temperature: z.number().optional(),
  color: z.string().optional(),
  permission: Permission.Ruleset,
  model: z.object({
    modelID: ModelID.zod,
    providerID: ProviderID.zod
  }).optional(),
  variant: z.string().optional(),
  prompt: z.string().optional(),
  options: z.record(z.string(), z.any()),
  steps: z.number().int().positive().optional(),
})
```

### Agent Registration Flow

1. Built-in agents defined in `Agent.layer`
2. Config `agent` field merged on top
3. Custom agents from config added
4. Agents with `disable: true` removed

```typescript
// Custom agent override from config
for (const [key, value] of Object.entries(cfg.agent ?? {})) {
  if (value.disable) { delete agents[key]; continue }
  let item = agents[key]
  if (!item) {
    item = agents[key] = {
      name: key,
      mode: "all",
      native: false,
      permission: merge(defaults, user),
      options: {}
    }
  }
  // Override: model, variant, prompt, description, temperature, topP, mode, color, hidden, name, steps, options, permission
}
```

### Tab Toggle / Agent Selector

**Rules:**
1. Primary agents sorted first (default agent prioritized), then alphabetically
2. Visible agents filtered by `hidden !== true`
3. Default agent: uses config `default_agent` if set and valid → falls back to first visible primary → falls back to first visible non-subagent

### Default Agent Permission Config

#### build agent
```typescript
{
  name: "build",
  description: "The default agent. Executes tools based on configured permissions.",
  mode: "primary",
  native: true,
  permission: Permission.merge(defaults, {
    question: "allow",
    plan_enter: "allow",
  })
}
```

#### plan agent
```typescript
{
  name: "plan",
  description: "Plan mode. Disallows all edit tools.",
  mode: "primary",
  native: true,
  permission: Permission.merge(defaults, {
    question: "allow",
    plan_exit: "allow",
    edit: {
      "*": "deny",                           // Denies ALL edits
      ".opencode/plans/*.md": "allow",       // Only plan files
    },
    external_directory: {
      "$DATA/plans/*.md": "allow",
    }
  })
}
```

#### explore agent
```typescript
{
  name: "explore",
  description: "Fast agent specialized for exploring codebases",
  mode: "subagent",
  native: true,
  permission: Permission.merge(defaults, {
    "*": "deny",
    grep: "allow",
    glob: "allow",
    list: "allow",
    bash: "allow",
    webfetch: "allow",
    websearch: "allow",
    codesearch: "allow",
    read: "allow",
  })
}
```

---

## 5. Permission System

**File:** `packages/opencode/src/permission/index.ts`

### Permission Actions

```typescript
export const Action = z.enum(["allow", "deny", "ask"])
```

- `"allow"` — execute without prompt
- `"deny"` — block with error
- `"ask"` — prompt user

### Permission Ruleset

```typescript
type Rule = {
  permission: string   // e.g., "read", "edit", "bash"
  pattern: string       // glob pattern, e.g., "**/*.ts", "*.env"
  action: "allow" | "deny" | "ask"
}
```

### Default Permission Ruleset

```typescript
const defaults = Permission.fromConfig({
  "*": "allow",                              // Allow everything by default
  doom_loop: "ask",                          // Ask about doom loops
  external_directory: {
    "*": "ask",                              // Ask about external directories
    ...whitelistedDirs                       // Allow skill directories
  },
  question: "deny",                          // Deny question tool
  plan_enter: "deny",                        // Deny plan_enter
  plan_exit: "deny",                         // Deny plan_exit
  read: {
    "*": "allow",                            // Allow all reads
    "*.env": "ask",                          // Ask about .env files
    "*.env.*": "ask",
    "*.env.example": "allow",               // Allow .env.example
  }
})
```

### Evaluation Logic

```typescript
// packages/opencode/src/permission/evaluate.ts
function evaluate(permission: string, pattern: string, ...rulesets: Rule[][]): Rule {
  const rules = rulesets.flat()
  const match = rules.findLast(
    (rule) => Wildcard.match(permission, rule.permission) && 
              Wildcard.match(pattern, rule.pattern)
  )
  return match ?? { action: "ask", permission, pattern: "*" }
}
```

- **Last matching rule wins** (reverse iteration, most specific wins)
- **Wildcard matching** for both permission and pattern
- **Default**: `"ask"` if no rule matches

### Allow/Deny/Ask Flow

1. **Deny check first**: If any pattern evaluates to `deny` → throw `DeniedError` immediately
2. **Allow check**: If all patterns evaluate to `allow` → proceed without prompting
3. **Ask**: If any pattern evaluates to `ask` → publish `permission.asked` event and wait for user response

### Permission Interface

```typescript
interface Interface {
  ask(input: AskInput): Effect<void, Error>      // Request permission
  reply(input: ReplyInput): Effect<void>          // Respond to permission request
  list(): Effect<Request[]>                        // List pending requests
}

AskInput = {
  ruleset: Ruleset,
  sessionID: SessionID,
  permission: string,
  patterns: string[],
  metadata: Record<string, any>,
  always: string[],        // Patterns to auto-approve
  tool?: { messageID, callID }
}

Reply = "once" | "always" | "reject"
ReplyInput = { requestID, reply, message? }
```

### Tool-Specific Permissions

| Tool | Permission |
|------|-----------|
| `edit` | `edit` |
| `write` | `edit` |
| `apply_patch` | `edit` |
| `bash` | `bash` |
| `read` | `read` |
| `glob` | `glob` |
| `grep` | `grep` |
| `task` | `task` |
| `todowrite` | `todowrite` |
| `question` | `question` |
| `webfetch` | `webfetch` |
| `websearch` | `websearch` |
| `codesearch` | `codesearch` |
| `lsp` | `lsp` |
| `skill` | `skill` |

---

## 6. Tool System

**Files:** `packages/opencode/src/tool/*.ts`

### Tool Definition Pattern

```typescript
// Using the tool() factory
const myTool = tool({
  description: "What this tool does",
  args: {
    foo: tool.schema.string().describe("foo"),
    bar: tool.schema.number().optional().describe("bar"),
  },
  async execute(args, context) {
    return `Result: ${args.foo}`
  },
})
```

### ToolContext

Passed to every tool execute function:

```typescript
export type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  directory: string    // Current project directory (prefer over process.cwd())
  worktree: string     // Worktree root for stable relative paths
  abort: AbortSignal    // Cancellation signal
  metadata(input: { title?: string; metadata?: { [key: string]: any } }): void
  ask(input: AskInput): Promise<void>
}

type AskInput = {
  permission: string
  patterns: string[]
  always: string[]
  metadata: { [key: string]: any }
}
```

### Built-in Tools

| Tool | File | Permission | Description |
|------|------|-----------|-------------|
| `bash` | `bash.ts` | `bash` | Execute shell commands |
| `read` | `read.ts` | `read` | Read files/directories |
| `glob` | `glob.ts` | `glob` | Glob pattern matching |
| `grep` | `grep.ts` | `grep` | Search file contents |
| `edit` | `edit.ts` | `edit` | Edit files (text replacement) |
| `write` | `write.ts` | `edit` | Write/create files |
| `task` | `task.ts` | `task` | Spawn subagent tasks |
| `webfetch` | `webfetch.ts` | `webfetch` | Fetch web content |
| `todowrite` | `todowrite.ts` | `todowrite` | Write todo list |
| `websearch` | `websearch.ts` | `websearch` | Web search (OpenCode/exa only) |
| `codesearch` | `codesearch.ts` | `codesearch` | Code search (OpenCode/exa only) |
| `skill` | `skill.ts` | `skill` | Invoke skills |
| `apply_patch` | `apply_patch.ts` | `edit` | Apply diff patches (GPT only) |
| `question` | `question.ts` | `question` | Ask user questions |

### Model-Specific Tool Filtering

```typescript
// codesearch, websearch: Only for OpenCode provider or when EXA enabled
if (tool.id === "codesearch" || tool.id === "websearch") {
  return model.providerID === ProviderID.opencode || Flag.OPENCODE_ENABLE_EXA
}

// apply_patch: GPT models only (non-OSS, non-GPT-4)
if (tool.id === "apply_patch") {
  return model.modelID.includes("gpt-") && !model.modelID.includes("oss") && !model.modelID.includes("gpt-4")
}

// edit, write: Inverse of apply_patch
if (tool.id === "edit" || tool.id === "write") {
  return !usePatch
}
```

### Truncation

Tools truncate large outputs:
- **Default max bytes**: 50 KB
- **Default max lines**: 2000
- **Max line length**: 2000 chars
- Truncated output stored to disk, `metadata.outputPath` provided

---

## 7. Configuration System

**File:** `packages/opencode/src/config/config.ts`

### Config Loading Priority (lowest to highest)

1. Global config: `~/.config/opencode/` (config.json, opencode.json, opencode.jsonc)
2. Remote configs from auth providers
3. `OPENCODE_CONFIG` environment variable file
4. Project config: `.opencode/`, `opencode.json`, `opencode.jsonc`
5. Directory-based configs (commands, agents, modes, plugins)
6. `OPENCODE_CONFIG_CONTENT` environment variable
7. Remote account config (from active org)
8. Managed config directory (`/etc/opencode`, macOS MDM)

### Config File Locations

| Location | Type |
|----------|------|
| `~/.config/opencode/opencode.json` | User config |
| `.opencode/opencode.json` | Project config |
| `.opencode/opencode.jsonc` | Local config |
| `/etc/opencode/` | System managed |

### Full Config Schema

```typescript
interface Config {
  $schema?: string
  logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR"
  server?: ServerConfig
  command?: Record<string, Command>
  skills?: Skills
  watcher?: { ignore?: string[] }
  snapshot?: boolean
  plugin?: PluginSpec[]
  share?: "manual" | "auto" | "disabled"
  autoupdate?: boolean | "notify"
  disabled_providers?: string[]
  enabled_providers?: string[]
  model?: ModelId                           // Default: "provider/model"
  small_model?: ModelId                    // For titles/summaries
  default_agent?: string
  username?: string
  agent?: Record<string, AgentConfig>
  provider?: Record<string, Provider>
  mcp?: Record<string, Mcp>
  formatter?: false | Record<string, any>
  lsp?: false | Record<string, any>
  instructions?: string[]
  permission?: Permission
  compaction?: { auto: boolean; prune: boolean; reserved: boolean }
  experimental?: Record<string, boolean>
}
```

### Agent Configuration

```typescript
AgentConfig = {
  model?: ModelId,
  variant?: string,
  temperature?: number,
  top_p?: number,
  prompt?: string,
  description?: string,
  mode?: "subagent" | "primary" | "all",
  hidden?: boolean,
  options?: Record<string, unknown>,
  color?: string,
  steps?: number,
  permission?: Permission,
  disable?: boolean
}
```

### MCP Configuration

```typescript
// Local MCP server
McpLocal = {
  type: "local",
  command: string[],
  environment?: Record<string, string>,
  enabled?: boolean,
  timeout?: number  // ms, default 5000
}

// Remote MCP server
McpRemote = {
  type: "remote",
  url: string,
  enabled?: boolean,
  headers?: Record<string, string>,
  oauth?: McpOAuth | false,
  timeout?: number
}
```

### Permission Configuration

```typescript
Permission = {
  read?: PermissionRule,
  edit?: PermissionRule,
  glob?: PermissionRule,
  grep?: PermissionRule,
  list?: PermissionRule,
  bash?: PermissionRule,
  task?: PermissionRule,
  external_directory?: PermissionRule,
  todowrite?: PermissionAction,
  question?: PermissionAction,
  webfetch?: PermissionAction,
  websearch?: PermissionAction,
  codesearch?: PermissionAction,
  lsp?: PermissionRule,
  doom_loop?: PermissionAction,
  skill?: PermissionRule,
  "*"?: PermissionRule           // Catchall
}

PermissionAction = "ask" | "allow" | "deny"
PermissionRule = PermissionAction | Record<string, PermissionAction>
```

---

## 8. Session Management

**Files:** `packages/opencode/src/session/*.ts`

### Session Storage

- **SQLite**: `~/.local/share/opencode/opencode.db`
- **Sessions**: `~/.local/share/opencode/sessions/`

### Session Schema

```typescript
interface Session {
  id: string                    // Format: ses_xxxxxxxxxxxx
  title: string
  projectID: string
  directory: string
  created: Date
  updated: Date
  parentID?: string             // For forked sessions
}
```

### Session Features

1. **Forking**: Sessions can fork, creating parentID reference
2. **Persistence**: Sessions persist across restarts
3. **Compaction**: When context overflows, compaction agent summarizes older messages
4. **Permission scoping**: Sessions carry their own permission ruleset

### Session Permission Scoping

```typescript
// From llm.ts — sessions have merged agent + session permissions
const disabled = Permission.disabled(
  Object.keys(input.tools),
  Permission.merge(input.agent.permission, input.permission ?? []),
)
```

---

## 9. CLI Entry Points

**File:** `packages/opencode/src/cli/`

### Main Commands

| Command | File | Purpose |
|---------|------|---------|
| `opencode` | `cmd/run.ts` | Main interactive session |
| `opencode agent` | `cmd/agent.ts` | Agent management |
| `opencode mcp` | `cmd/mcp.ts` | MCP server management |
| `opencode plugin` | `cmd/plug.ts` | Plugin management |

### Run Command Flow

```
1. Parse CLI args
2. Load config (multi-source)
3. Initialize log
4. Setup plugins
5. Create TUI
6. Enter event loop
```

---

## 10. Key Files Reference

### Plugin SDK
- `packages/plugin/src/index.ts` — Main plugin interface (Hooks, Plugin, PluginInput)
- `packages/plugin/src/tool.ts` — tool() factory and ToolDefinition type
- `packages/plugin/src/shell.ts` — BunShell interface

### Core
- `packages/opencode/src/index.ts` — Main entry point
- `packages/opencode/src/agent/agent.ts` — All built-in agent definitions
- `packages/opencode/src/permission/index.ts` — Permission system
- `packages/opencode/src/config/config.ts` — Config schema and loading
- `packages/opencode/src/tool/*.ts` — All built-in tools
- `packages/opencode/src/session/*.ts` — Session management

### SDK
- `packages/sdk/js/src/` — JavaScript SDK for plugins and external integrations

---

## Quick Reference: Writing a Plugin

```typescript
import { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async (ctx) => {
  return {
    name: "my-plugin",
    
    // Register custom tools
    tool: {
      mytool: tool({
        description: "Does something useful",
        args: {
          input: tool.schema.string().describe("The input"),
        },
        async execute(args, context) {
          // Use ctx.$ for shell commands
          const result = await ctx.$`echo ${args.input}`
          return result.text()
        },
      }),
    },
    
    // Register hooks
    "tool.execute.before": async (input, output) => {
      // Log all tool calls
      console.log(`Tool: ${input.tool}`, output.args)
    },
    
    // Modify config
    config: async (cfg) => {
      // Add custom agent config
      cfg.agent = cfg.agent || {}
      cfg.agent.myagent = { mode: "primary" }
    },
  }
}
```

---

*Generated from source code analysis of https://github.com/anomalyco/opencode*
