# OpenCode Vanilla — Plugin Hook System

Complete documentation for the plugin hook system in OpenCode.

---

## Hook Interface

Plugins return a `Hooks` object from their main function:

```typescript
export interface Hooks {
  event?: (input: { event: Event }) => Promise<void>
  config?: (input: Config) => Promise<void>
  tool?: { [key: string]: ToolDefinition }
  auth?: AuthHook
  provider?: ProviderHook
  "chat.message"?: (input: ChatMessageInput, output: ChatMessageOutput) => Promise<void>
  "chat.params"?: (input: ChatParamsInput, output: ChatParamsOutput) => Promise<void>
  "chat.headers"?: (input: ChatHeadersInput, output: ChatHeadersOutput) => Promise<void>
  "permission.ask"?: (input: Permission, output: PermissionOutput) => Promise<void>
  "command.execute.before"?: (input: CommandInput, output: CommandOutput) => Promise<void>
  "tool.execute.before"?: (input: ToolExecuteInput, output: ToolExecuteBeforeOutput) => Promise<void>
  "shell.env"?: (input: ShellEnvInput, output: ShellEnvOutput) => Promise<void>
  "tool.execute.after"?: (input: ToolExecuteAfterInput, output: ToolExecuteAfterOutput) => Promise<void>
  "experimental.chat.messages.transform"?: (input: any, output: MessagesTransformOutput) => Promise<void>
  "experimental.chat.system.transform"?: (input: SystemTransformInput, output: SystemTransformOutput) => Promise<void>
  "experimental.session.compacting"?: (input: CompactingInput, output: CompactingOutput) => Promise<void>
  "experimental.text.complete"?: (input: TextCompleteInput, output: TextCompleteOutput) => Promise<void>
  "tool.definition"?: (input: ToolDefinitionInput, output: ToolDefinitionOutput) => Promise<void>
}
```

---

## All 18 Hook Types

### 1. `event`

**Signature:**
```typescript
event?: (input: { event: Event }) => Promise<void>
```

**Purpose:** Generic event handler for all events.

---

### 2. `config`

**Signature:**
```typescript
config?: (input: Config) => Promise<void>
```

**Purpose:** Called with full config on load.

---

### 3. `tool`

**Signature:**
```typescript
tool?: { [key: string]: ToolDefinition }
```

**Purpose:** Register custom tools. See `ToolDefinition` type.

---

### 4. `auth`

**Signature:**
```typescript
auth?: AuthHook
```

**Purpose:** Define authentication methods (oauth, api keys).

---

### 5. `provider`

**Signature:**
```typescript
provider?: ProviderHook
```

**Purpose:** Override or extend provider model listings.

---

### 6. `chat.message`

**Signature:**
```typescript
"chat.message"?: (
  input: {
    sessionID: string
    agent?: string
    model?: { providerID: string; modelID: string }
    messageID?: string
    variant?: string
  },
  output: { message: UserMessage; parts: Part[] }
) => Promise<void>
```

**Purpose:** Called when a new message is received. Can modify message content and parts.

**What hook can do:**
- Modify `output.message` content
- Modify `output.parts` array

---

### 7. `chat.params`

**Signature:**
```typescript
"chat.params"?: (
  input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
  output: { temperature: number; topP: number; topK: number; options: Record<string, any> }
) => Promise<void>
```

**Purpose:** Modify parameters sent to LLM.

**What hook can do:**
- Modify `output.temperature`
- Modify `output.topP`
- Modify `output.topK`
- Modify `output.options`

---

### 8. `chat.headers`

**Signature:**
```typescript
"chat.headers"?: (
  input: { sessionID: string; agent: string; model: Model; provider: ProviderContext; message: UserMessage },
  output: { headers: Record<string, string> }
) => Promise<void>
```

**Purpose:** Modify HTTP headers sent to LLM API.

**What hook can do:**
- Add/modify `output.headers`

---

### 9. `permission.ask`

**Signature:**
```typescript
"permission.ask"?: (input: Permission, output: { status: "ask" | "deny" | "allow" }) => Promise<void>
```

**Purpose:** Intercept permission requests. **Most important for security.**

**What hook can do:**
- Set `output.status` to `"allow"`, `"deny"`, or `"ask"`
- Can throw to block the action entirely

---

### 10. `command.execute.before` ⭐

**Signature:**
```typescript
"command.execute.before"?: (
  input: { command: string; sessionID: string; arguments: string },
  output: { parts: Part[] }
) => Promise<void>
```

**Purpose:** Called before a command executes. Can inject parts into the output.

**What hook can do:**
- Modify `output.parts` to inject content before command runs

---

### 11. `tool.execute.before` ⭐⭐ (MOST IMPORTANT)

**Signature:**
```typescript
"tool.execute.before"?: (
  input: { tool: string; sessionID: string; callID: string },
  output: { args: any }
) => Promise<void>
```

**Purpose:** Called before ANY tool executes. **Critical for interception and modification.**

**What hook can do:**
- **Modify `output.args`** — change tool arguments before execution
- Throw to **block** tool execution
- Log for auditing

**Example:**
```typescript
"tool.execute.before": async (input, output) => {
  if (input.tool === "bash" && output.args.command?.includes("rm -rf")) {
    throw new Error("Blocked dangerous rm -rf command")
  }
  // Sanitize arguments
  output.args.command = output.args.command.replace(/password=\w+/g, "password=***")
}
```

---

### 12. `shell.env`

**Signature:**
```typescript
"shell.env"?: (
  input: { cwd: string; sessionID?: string; callID?: string },
  output: { env: Record<string, string> }
) => Promise<void>
```

**Purpose:** Modify environment variables for shell commands.

**What hook can do:**
- Add/modify `output.env`
- Useful for injecting API keys, paths, etc.

---

### 13. `tool.execute.after` ⭐⭐ (MOST IMPORTANT)

**Signature:**
```typescript
"tool.execute.after"?: (
  input: { tool: string; sessionID: string; callID: string; args: any },
  output: {
    title: string
    output: string
    metadata: any
  }
) => Promise<void>
```

**Purpose:** Called after ANY tool executes. **Critical for post-processing and auditing.**

**What hook can do:**
- Modify `output.title` — change tool result title
- Modify `output.output` — change tool result content
- Modify `output.metadata` — add custom metadata
- Throw to indicate error (blocks further processing)

**Example:**
```typescript
"tool.execute.after": async (input, output) => {
  // Log all tool executions
  console.log(`Tool ${input.tool} executed with args:`, input.args)
  
  // Post-process bash output
  if (input.tool === "bash") {
    output.output = sanitizeOutput(output.output)
  }
  
  // Add metadata
  output.metadata = { ...output.metadata, executedAt: Date.now() }
}
```

---

### 14. `experimental.chat.messages.transform`

**Signature:**
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

**Purpose:** Transform chat messages before sending to LLM.

**What hook can do:**
- Modify `output.messages` array
- Add, remove, or modify message entries

---

### 15. `experimental.chat.system.transform`

**Signature:**
```typescript
"experimental.chat.system.transform"?: (
  input: { sessionID?: string; model: Model },
  output: { system: string[] }
) => Promise<void>
```

**Purpose:** Modify system prompts.

**What hook can do:**
- Modify `output.system` array of system prompt strings

---

### 16. `experimental.session.compacting`

**Signature:**
```typescript
"experimental.session.compacting"?: (
  input: { sessionID: string },
  output: { context: string[]; prompt?: string }
) => Promise<void>
```

**Purpose:** Customize session compaction prompt.

**What hook can do:**
- Add to `output.context` array
- Set `output.prompt` to replace default entirely

---

### 17. `experimental.text.complete`

**Signature:**
```typescript
"experimental.text.complete"?: (
  input: { sessionID: string; messageID: string; partID: string },
  output: { text: string }
) => Promise<void>
```

**Purpose:** Transform completed text.

**What hook can do:**
- Modify `output.text`

---

### 18. `tool.definition`

**Signature:**
```typescript
"tool.definition"?: (
  input: { toolID: string },
  output: { description: string; parameters: any }
) => Promise<void>
```

**Purpose:** Modify tool definitions (description and parameters) sent to LLM.

**What hook can do:**
- Modify `output.description`
- Modify `output.parameters`

---

## Execution Order

Hooks execute in this order:

1. `config` — on plugin load
2. `event` — on each event
3. `tool.definition` — when tool schema is sent to LLM
4. `chat.headers` — before chat request
5. `chat.params` — before chat request
6. `chat.message` — when message received
7. `experimental.chat.system.transform` — system prompt preparation
8. `experimental.chat.messages.transform` — messages preparation
9. `permission.ask` — when permission needed
10. `command.execute.before` — before command
11. `tool.execute.before` — **BEFORE** tool execution ⭐⭐
12. `shell.env` — shell environment setup
13. Tool execution...
14. `tool.execute.after` — **AFTER** tool execution ⭐⭐
15. `experimental.text.complete` — text completion
16. `experimental.session.compacting` — session compaction

---

## Tool Definition Type

```typescript
function tool<Args extends z.ZodRawShape>(input: {
  description: string
  args: Args
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<string>
})

type ToolContext = {
  sessionID: string
  messageID: string
  agent: string
  directory: string      // Current project directory
  worktree: string      // Project worktree root
  abort: AbortSignal
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

---

## Shell Type (BunShell)

```typescript
interface BunShell {
  (strings: TemplateStringsArray, ...expressions: ShellExpression[]): BunShellPromise
  braces(pattern: string): string[]
  escape(input: string): string
  env(newEnv?: Record<string, string | undefined>): BunShell
  cwd(newCwd?: string): BunShell
  nothrow(): BunShell
  throws(shouldThrow: boolean): BunShell
}

interface BunShellPromise extends Promise<BunShellOutput> {
  stdin: WritableStream
  cwd(newCwd: string): this
  env(newEnv: Record<string, string> | undefined): this
  quiet(): this
  lines(): AsyncIterable<string>
  text(encoding?: BufferEncoding): Promise<string>
  json(): Promise<any>
  arrayBuffer(): Promise<ArrayBuffer>
  blob(): Promise<Blob>
  nothrow(): this
  throws(shouldThrow: boolean): this
}

interface BunShellOutput {
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

---

## Complete Plugin Example

```typescript
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"

export default async (input, options) => {
  return {
    tool: {
      myTool: tool({
        description: "Does something useful",
        args: { input: z.string() },
        async execute(args, ctx) {
          ctx.metadata({ title: "My Tool Result" })
          return `Processed: ${args.input}`
        }
      })
    },
    "tool.execute.before": async (input, output) => {
      console.log(`Tool ${input.tool} about to execute with:`, output.args)
    },
    "tool.execute.after": async (input, output) => {
      console.log(`Tool ${input.tool} executed, output:`, output.output)
      output.metadata = { ...output.metadata, finishedAt: Date.now() }
    },
    "permission.ask": async (input, output) => {
      // Auto-allow read-only permissions
      if (input.permission === "read" && input.action === "read") {
        output.status = "allow"
      }
    }
  }
}
```
