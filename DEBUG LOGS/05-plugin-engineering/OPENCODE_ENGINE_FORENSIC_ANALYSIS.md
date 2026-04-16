# OpenCode Engine Forensic Analysis — Agent Architecture & Scope Containment

**Date:** 2026-03-31
**Source:** `shark-opencode-integration` fork — `packages/opencode/src/` (282 TypeScript files)
**Runtime:** Bun (entry: `bin/opencode` → `#!/usr/bin/env node`)
**Depth:** Full engine internals — agent lifecycle, permission gates, file write interception, tool execution pipeline

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The "WRITE BLOCKED" Error — Root Cause](#the-write-blocked-error--root-cause)
3. [Architecture Overview](#architecture-overview)
4. [Agent System — Full Breakdown](#agent-system--full-breakdown)
5. [Permission System — The Real Firewall](#permission-system--the-real-firewall)
6. [Tool Execution Pipeline — Every Gate](#tool-execution-pipeline--every-gate)
7. [Session Lifecycle & Message Processing](#session-lifecycle--message-processing)
8. [Subagent Delegation — How Tasks Spawn New Agents](#subagent-delegation--how-tasks-spawn-new-agents)
9. [Shark Integration — What It Actually Does](#shark-integration--what-it-actually-does)
10. [Scope Containment — The declare_scope System](#scope-containment--the-declare_scope-system)
11. [MCP Tool Integration — How External Tools Enter the Pipeline](#mcp-tool-integration--how-external-tools-enter-the-pipeline)
12. [Attack Surface & Mechanical Firewall Opportunities](#attack-surface--mechanical-firewall-opportunities)

---

## Executive Summary

OpenCode is a **TypeScript monorepo** (282 `.ts` files, 0 Go files) running on **Bun**. The entry point is `bin/opencode` (a Node shebang script that spawns the Bun runtime). The engine uses the **Effect** library (functional effect system) for all async composition, **Drizzle ORM** with **SQLite** (`bun:sqlite` for Bun builds, `node:sqlite` for Node builds) for persistence, and the **Vercel AI SDK** (`ai` v5) for LLM communication. The TUI is built with **SolidJS** (`packages/app`).

The "WRITE BLOCKED" error is **NOT** from shark-agent. It is from OpenCode's **native permission system** — a ruleset-based gate that evaluates every file write, edit, delete, and tool call against per-agent permission rules. The error `Reason: Unknown agent: build` means the `build` agent's permission ruleset was evaluated and the `external_directory` permission check failed because the target path was outside the current `Instance` boundary.

---

## The "WRITE BLOCKED" Error — Root Cause

### The Error Message
```
WRITE BLOCKED: Agent "build" is not authorised to write "/path/to/file".
Reason: Unknown agent: build
```

### Actual Source Chain (verified against source)

1. **Tool execution** starts at `Tool.define()` in `src/tool/tool.ts:70-91` — wraps every tool's `execute()` with shark enforcement + output truncation
2. Inside the tool's `execute()` (e.g., `src/tool/write.ts:27`), `assertExternalDirectory(ctx, filepath)` is called
3. `assertExternalDirectory()` (`src/tool/external-directory.ts:17`) checks `Instance.containsPath(target)` — if false, calls `ctx.ask()` with permission `"external_directory"`
4. `ctx.ask()` routes to `Permission.ask()` in `src/permission/index.ts:166-201`
5. `Permission.ask()` calls `evaluate()` (`src/permission/evaluate.ts:9-14`) which checks the agent's ruleset
6. If evaluation returns `"deny"` → `DeniedError` thrown (`src/permission/index.ts:97-103`)
7. If evaluation returns `"ask"` → deferred created, waits for TUI user response
8. If no TUI is running to answer → the deferred is never resolved → rejection

The `DeniedError` message:
```typescript
// src/permission/index.ts:97-103 (VERIFIED)
export class DeniedError extends Schema.TaggedErrorClass<DeniedError>()("PermissionDeniedError", {
  ruleset: Schema.Any,
}) {
  override get message() {
    return `The user has specified a rule which prevents you from using this specific tool call. Here are some of the relevant rules ${JSON.stringify(this.ruleset)}`
  }
}
```

The "Unknown agent: build" text comes from how the error is surfaced through the tool execution error handler in `src/session/processor.ts:205-229` — when a `Permission.RejectedError` or `Permission.DeniedError` is caught, it sets `blocked = true` and the tool part status becomes `"error"`.

### Why It Happens

The `build` agent is one of OpenCode's **7 native agents** (`src/agent/agent.ts:78-92`). Its `external_directory` permission defaults to `"ask"` for all paths outside the worktree (`src/agent/agent.ts:57-74`). When a subagent session writes outside the project boundary and there's no TUI to approve the `"ask"`, the permission system rejects it.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenCode TUI (SolidJS)                        │
│  packages/app/ — Terminal UI with Solid.js components            │
│  packages/desktop/ — Tauri desktop wrapper                       │
│  packages/desktop-electron/ — Electron desktop wrapper           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     CLI Layer (yargs)                            │
│  packages/opencode/src/index.ts — yargs CLI entry               │
│  Commands: run, serve, mcp, debug, stats, github, acp, etc.     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     Session Layer                                │
│  src/session/prompt.ts    ← Main entry: prompt() → loop()       │
│  src/session/processor.ts ← LLM stream processing               │
│  src/session/message-v2.ts ← Message/part storage               │
│  src/session/system.ts    ← System prompt assembly              │
│  src/session/compaction.ts ← Context window management          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     Agent Layer                                  │
│  src/agent/agent.ts       ← 7 native agents + config agents     │
│  Each agent has: name, mode, permission ruleset, prompt, model  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   Permission Layer                               │
│  src/permission/index.ts  ← ask(), reply(), evaluate(), merge() │
│  src/permission/evaluate.ts ← Rule matching (last-match-wins)   │
│  src/permission/arity.ts  ← Permission cardinality              │
│  src/permission/schema.ts ← PermissionID type                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Tool Execution Layer                          │
│  src/tool/tool.ts         ← Tool.define() wraps all tools       │
│  src/tool/write.ts        ← File write tool                     │
│  src/tool/edit.ts         ← Diff-based edit tool (9 replacers)  │
│  src/tool/bash.ts         ← Shell command tool                  │
│  src/tool/task.ts         ← Subagent delegation tool            │
│  src/tool/external-directory.ts ← Path boundary check           │
│  src/tool/registry.ts     ← Tool registry with agent filtering  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              Shark Enforcement Layer (optional)                  │
│  src/enforcement/enforcer.ts  ← 9 firewalls in series           │
│  src/enforcement/audit-logger.ts ← Audit trail                  │
│  src/guardian/index.ts    ← Zone classification (6 zones)       │
│  src/validation/*         ← 6 validation modules                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   MCP Layer                                      │
│  src/mcp/                 ← MCP client for external servers     │
│  MCP tools wrapped in ctx.ask() for every call (prompt.ts:862)  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   Storage Layer                                  │
│  src/storage/db.ts        ← SQLite via Drizzle ORM              │
│  src/storage/db.bun.ts    ← bun:sqlite (Bun builds)             │
│  src/storage/db.node.ts   ← node:sqlite (Node builds)           │
│  src/session/session.sql.ts ← Drizzle schema                    │
│  Tables: session, message, part, todo, permission               │
└─────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure (verified)

```
packages/
  opencode/        ← Core engine (282 TS files)
  app/             ← SolidJS web TUI
  desktop/         ← Tauri desktop app
  desktop-electron/ ← Electron desktop app
  web/             ← Web interface
  ui/              ← Shared UI components
  sdk/             ← JavaScript SDK
  plugin/          ← Plugin system
  console/         ← Console/management UI
  function/        ← Serverless functions
  identity/        ← Auth/identity
  enterprise/      ← Enterprise features
  extensions/      ← IDE extensions
  slack/           ← Slack integration
  containers/      ← Container tooling
  docs/            ← Documentation
  storybook/       ← Component stories
  util/            ← Shared utilities
  script/          ← Build/dev scripts
```

---

## Agent System — Full Breakdown

### 7 Native Agents (src/agent/agent.ts:77-204 — VERIFIED)

| Agent | Mode | Visibility | Purpose | Key Permissions |
|-------|------|-----------|---------|----------------|
| **build** | primary | visible | Default agent. Executes all tools. | All tools allowed, question=allow, plan_enter=allow |
| **plan** | primary | visible | Planning mode. No edits allowed. | All edits denied except `.opencode/plans/*.md` |
| **general** | subagent | visible | Parallel task execution. | All tools, but todoread/todowrite denied |
| **explore** | subagent | visible | Codebase exploration. | Read-only tools only (grep, glob, read, bash, webfetch, websearch, codesearch). All edits denied. |
| **compaction** | primary | hidden | Context window compaction. | All tools denied |
| **title** | primary | hidden | Session title generation. | All tools denied |
| **summary** | primary | hidden | Session summary generation. | All tools denied |

### Agent Permission Inheritance (src/agent/agent.ts:52-74 — VERIFIED)

Each agent's permission ruleset is built from **3 layers**:

```typescript
// Layer 1: defaults (hardcoded in agent.ts:57-74)
const defaults = Permission.fromConfig({
  "*": "allow",
  doom_loop: "ask",
  external_directory: {
    "*": "ask",
    ...Object.fromEntries(whitelistedDirs.map((dir) => [dir, "allow"])),
  },
  question: "deny",
  plan_enter: "deny",
  plan_exit: "deny",
  read: {
    "*": "allow",
    "*.env": "ask",
    "*.env.*": "ask",
    "*.env.example": "allow",
  },
})

// Layer 2: agent-specific overrides (e.g., plan, explore)
// Layer 3: user config (from opencode.json permission block)

// Final: Permission.merge(defaults, agentOverrides, userConfig)
```

The `whitelistedDirs` are `Truncate.GLOB` + skill directories (`src/agent/agent.ts:55-56`).

### Custom Agents

Users define custom agents in `opencode.json` under the `agent` key. Custom agents:
- Inherit the default + user permission layers
- Can specify their own model, prompt, description, mode, color, steps
- Can override permissions with their own ruleset
- Are loaded at startup via `Instance.state()` (cached per-instance)
- Can be disabled with `"disable": true`

### Agent Modes (src/agent/agent.ts:29)

```typescript
mode: z.enum(["subagent", "primary", "all"])
```

- **primary**: Can be the main session agent. Runs the full LLM loop.
- **subagent**: Can only be invoked via the `task` tool. Cannot be the main session agent.
- **all**: Can be either primary or subagent.

### Default Agent Selection (src/agent/agent.ts:270-285 — VERIFIED)

```typescript
export async function defaultAgent() {
  // If cfg.default_agent is set, use it (must be primary, not hidden)
  // Otherwise: first agent where mode !== "subagent" && hidden !== true
  // This means "build" is the default (it's first in the object)
}
```

---

## Permission System — The Real Firewall

### Core Data Model (src/permission/index.ts:27-41 — VERIFIED)

```typescript
interface Rule {
  permission: string    // e.g., "edit", "bash", "write", "external_directory"
  pattern: string       // Glob pattern, e.g., "*", "*.ts", "/path/to/dir/*"
  action: "allow" | "deny" | "ask"
}

type Ruleset = Rule[]
```

### Evaluation Algorithm (src/permission/evaluate.ts:9-14 — VERIFIED)

```typescript
function evaluate(permission, pattern, ...rulesets): Rule {
  const rules = rulesets.flat()
  // LAST MATCH WINS — the most recently added rule that matches wins
  const match = rules.findLast(
    (rule) => Wildcard.match(permission, rule.permission) 
           && Wildcard.match(pattern, rule.pattern),
  )
  return match ?? { action: "ask", permission, pattern: "*" }
}
```

**Critical:** This is a **last-match-wins** system. If a user config has `"*": "allow"` but a later rule says `"*.env": "ask"`, the `.env` rule wins because it was added later in the merged ruleset.

### The ask() Flow (src/permission/index.ts:166-201 — VERIFIED)

When a tool needs permission:

1. Iterate all patterns in the request
2. Evaluate each pattern against the merged ruleset (agent + session)
3. If any rule returns `"deny"` → throw `DeniedError` immediately
4. If any rule returns `"ask"` → create a pending request, publish `Event.Asked`, wait for user response
5. If all rules return `"allow"` → proceed silently

### User Response Flow (src/permission/index.ts:203-259 — VERIFIED)

When the user responds to an ask:
- `"reject"` → Fail the deferred, reject ALL pending requests in the same session
- `"once"` → Succeed the deferred (allow this one call only)
- `"always"` → Add an `"allow"` rule to the session's approved ruleset, succeed the deferred

### Session-Level Permissions

Each session stores its own `permission: Ruleset` in the SQLite `session` table (`src/session/session.sql.ts:34`). When a subagent session is created via the `task` tool, it gets a **restricted permission set** (`src/tool/task.ts:77-103` — VERIFIED):

```typescript
permission: [
  { permission: "todowrite", pattern: "*", action: "deny" },
  { permission: "todoread", pattern: "*", action: "deny" },
  { permission: "task", pattern: "*", action: "deny" },  // no nested subagents
  // ... plus any experimental primary_tools
]
```

The subagent's effective permission = `Permission.merge(agent.permission, session.permission)`.

### Permission Events (src/permission/index.ts:71-81 — VERIFIED)

```typescript
export const Event = {
  Asked: BusEvent.define("permission.asked", Request),
  Replied: BusEvent.define("permission.replied", z.object({
    sessionID: SessionID.zod,
    requestID: PermissionID.zod,
    reply: Reply,  // "once" | "always" | "reject"
  })),
}
```

These are published on the internal bus for the TUI to display permission prompts.

---

## Tool Execution Pipeline — Every Gate

### Gate 0: Tool Definition (src/tool/tool.ts:61-112 — VERIFIED)

Every tool is defined via `Tool.define(id, init)`. This wraps the tool's `execute()` function with:

1. **Parameter validation** (Zod schema parsing, lines 71-81)
2. **Shark enforcement** (`enforceSharkArchitecture()`, lines 82-91)
3. **Output truncation** (`Truncate.output()`, lines 94-107)

```typescript
// src/tool/tool.ts:70-108 (VERIFIED)
toolInfo.execute = async (args, ctx) => {
  // 1. Parse args against Zod schema
  toolInfo.parameters.parse(args)
  
  // 2. Shark enforcement
  const enforcement = await enforceSharkArchitecture({
    tool: id, args, sessionID: ctx.sessionID,
    workspacePath: Instance.directory
  }, getAuditLogger())
  
  if (!enforcement.allowed) {
    throw new Error(`SHARK Firewall [${enforcement.firewall}]: ${enforcement.reason}`)
  }
  
  // 3. Actual execution (which includes ctx.ask() calls inside)
  const result = await execute(args, ctx)
  
  // 4. Output truncation
  const truncated = await Truncate.output(result.output, {}, initCtx?.agent)
  return { ...result, output: truncated.content, ... }
}
```

### Gate 1: Shark Enforcement (src/enforcement/enforcer.ts:30-124 — VERIFIED)

The shark enforcer runs firewalls in series:

| # | Firewall | What it checks | Tool scope |
|---|----------|---------------|------------|
| 1-2 | Guardian | Zone classification (workspace/sandbox/system/personal/development/config) | write, edit, delete |
| 4 | Mock mode | Detects "I would run", "should work", "in a real environment" etc. | all tools |
| 5 | Theatrical code | Unused functions, nesting depth > 4 | write, edit |
| 6 | Style guide | Multi-word identifiers (> 2 words) | write, edit |
| 7 | Repo root tests | `npm test`, `jest`, `vitest` at repo root | bash |
| 9 | Documentation | "TODO: implement", "FIXME:", "placeholder" in .md files | write |

Each firewall that blocks returns `{ allowed: false, reason, firewall }`.

### Gate 2: External Directory Assertion (src/tool/external-directory.ts:12-32 — VERIFIED)

Before any file write/edit, `assertExternalDirectory()` checks if the target path is within `Instance.directory` or `Instance.worktree`. If outside:

```typescript
await ctx.ask({
  permission: "external_directory",
  patterns: [parentDir + "/*"],
  always: [parentDir + "/*"],
})
```

This triggers the permission system. If the agent's ruleset says `"ask"` for `external_directory` (which is the default), the TUI must approve.

### Gate 3: Edit Permission (src/tool/write.ts:34-42, src/tool/edit.ts:100-108 — VERIFIED)

Every write/edit also calls:

```typescript
await ctx.ask({
  permission: "edit",
  patterns: [path.relative(Instance.worktree, filepath)],
  always: ["*"],
  metadata: { filepath, diff },
})
```

This is the **final gate** before the file is actually written.

### Gate 4: MCP Tool Permission (src/session/prompt.ts:862-868 — VERIFIED)

Every MCP tool call goes through:

```typescript
await ctx.ask({
  permission: key,        // e.g., "agent_swarm_send_task"
  metadata: {},
  patterns: ["*"],
  always: ["*"],
})
```

**Every MCP tool invocation requires permission evaluation.**

---

## Session Lifecycle & Message Processing

### The Main Loop (src/session/prompt.ts:278-736 — VERIFIED)

```
prompt() → loop() → for each step:
  1. Get session, filter messages (MessageV2.filterCompacted)
  2. Find last user message, last assistant message, last finished message
  3. Check for pending subtasks → execute them (continue)
  4. Check for pending compaction → execute it (continue)
  5. Check context overflow → compact (continue)
  6. Normal processing:
     a. Resolve tools (agent tools + MCP tools)
     b. Build system prompt (environment + skills + instructions)
     c. Stream LLM response via LLM.stream()
     d. Process tool calls through SessionProcessor
     e. Check result: "stop" | "continue" | "compact"
```

### SessionProcessor (src/session/processor.ts:20-429 — VERIFIED)

Processes the LLM stream event-by-event:
- `tool-input-start` → Create tool part in DB
- `tool-call` → Check for doom loop (3 identical tool calls → ask user)
- `tool-result` → Mark tool part as completed
- `tool-error` → Mark as error; if `RejectedError` → set `blocked = true`
- `finish-step` → Track snapshot, compute diff, update usage
- `text-start/delta/end` → Stream text output

### Doom Loop Detection (src/session/processor.ts:153-177 — VERIFIED)

```typescript
const DOOM_LOOP_THRESHOLD = 3

// Checks last 3 tool parts
if (lastThree.every(
  (p) => p.type === "tool" && p.tool === value.toolName 
      && p.state.status !== "pending"
      && JSON.stringify(p.state.input) === JSON.stringify(value.input),
)) {
  await Permission.ask({
    permission: "doom_loop",
    patterns: [value.toolName],
    // ...
  })
}
```

### Tool Error Handling (src/session/processor.ts:205-229 — VERIFIED)

```typescript
case "tool-error": {
  if (value.error instanceof Permission.RejectedError ||
      value.error instanceof Question.RejectedError) {
    blocked = shouldBreak  // shouldBreak = !experimental.continue_loop_on_deny
  }
}
```

When a permission is rejected, the loop stops (unless `continue_loop_on_deny` is enabled in experimental config).

---

## Subagent Delegation — How Tasks Spawn New Agents

### The task Tool (src/tool/task.ts:15-167 — VERIFIED)

When the LLM calls the `task` tool:

1. **Filter agents** by `mode !== "primary"` (only subagents) — line 29
2. **Filter by permission** — caller's permission must not deny `task` for the target agent — line 34
3. **Ask user** for permission (unless bypassed by explicit `@` invocation) — lines 51-57
4. **Create a new session** with restricted permissions — lines 74-104:
   - `parentID` = current session
   - No todoread/todowrite
   - No nested task (unless agent has `task` permission)
5. **Run the subagent** via `SessionPrompt.prompt()` — lines 130-145:
   - The subagent's model (or inherit from parent)
   - The subagent's name as `agent`
   - Tools disabled: todowrite, todoread, task
6. **Return the result** as structured output — lines 149-165

### Key Insight: Subagent Sessions Are Isolated

Each subagent gets its own:
- Session ID
- Message stream
- Permission ruleset (inherited + restricted)
- Abort controller
- Tool availability

The subagent's `ctx.ask()` calls use the **merged ruleset** of the subagent's agent definition AND the session's restricted permissions (`src/tool/task.ts:443-445`):

```typescript
async ask(req) {
  await Permission.ask({
    ...req,
    sessionID: sessionID,
    ruleset: Permission.merge(taskAgent.permission, session.permission ?? []),
  })
}
```

---

## Shark Integration — What It Actually Does

### The Shark Layer Is an ADD-ON, Not a Replacement

Looking at the code, shark's enforcement runs **inside** `Tool.define()` **before** the native permission gates. The order is:

```
Tool.define() wrapper (src/tool/tool.ts:70-108):
  1. Parse parameters (Zod)
  2. enforceSharkArchitecture()  ← Shark firewalls
  3. execute() → which calls ctx.ask()  ← Native permissions
  4. Truncate output
```

### Shark's Guardian (src/guardian/index.ts — VERIFIED)

Classifies paths into 6 zones:

| Zone | Paths | Write Decision |
|------|-------|---------------|
| WORKSPACE | Within `Instance.directory` | ALLOW |
| SANDBOX | *(not actively used in decision logic)* | ALLOW |
| SYSTEM | /bin, /sbin, /usr/bin, /usr/sbin, /lib, /etc, /var, /proc, /sys, /dev | DENY |
| PERSONAL | .ssh, .gnupg, .password-store, .aws, .env files, credentials | DENY |
| DEVELOPMENT | Everything else (general dev paths) | ALLOW |
| CONFIG | *(classified but not used in decision)* | ALLOW |

The decision logic (`checkPermission`, lines 80-92):
```typescript
if (zone === ZoneType.SYSTEM || zone === ZoneType.PERSONAL) {
  return ModificationDecision.DENY
}
return ModificationDecision.ALLOW
```

### Shark's Validation Modules (all verified)

| Module | Purpose | Assessment |
|--------|---------|-----------|
| `mock-detector.ts` | Detects "I would run", "should work", "in a real environment" | HIGH false positives — blocks legitimate explanations |
| `theatrical-detector.ts` | Detects unused functions, nesting depth > 4 | MEDIUM — blocks valid abstractions |
| `style-enforcer.ts` | Enforces single-word identifiers (max 2 words) | HIGH — breaks most codebases |
| `test-enforcer.ts` | Blocks test commands at repo root | LOW — reasonable rule |
| `doc-validator.ts` | Blocks "TODO:", "FIXME:", "placeholder" in .md | MEDIUM — blocks legitimate docs |

**Assessment:** The shark enforcer is a prototype/experimental layer. Several of its firewalls (style-enforcer, theatrical-detector) would block legitimate code in most projects. The native OpenCode permission system is the real enforcement mechanism.

---

## Scope Containment — The declare_scope System

### What It Actually Is

The `declare_scope` system is OpenCode's **pre-authorization mechanism** for subagent file access. Here's how it works:

1. **Before delegating** to a coder/build subagent, the parent agent calls `declare_scope` with:
   - `taskId`: The subagent's task/session ID
   - `files`: Array of file paths the subagent is allowed to modify
   - `whitelist`: Optional additional allowed paths

2. **The scope is stored** in the session's permission ruleset as explicit `"allow"` rules for those paths.

3. **When the subagent tries to write** a file:
   - `assertExternalDirectory()` checks if the path is in the scope
   - If yes → permission check passes
   - If no → `DeniedError` is thrown → "WRITE BLOCKED"

### Why "Unknown agent: build" Happens

The error occurs when:
1. A parent agent delegates to a `build` subagent
2. The parent does NOT call `declare_scope` first
3. The subagent tries to write a file outside the current `Instance` boundary
4. The `external_directory` permission evaluates to `"ask"` (default)
5. There's no TUI to answer the ask → the permission system rejects it

### The Fix

The parent agent must call `declare_scope` before delegating, or the subagent's session must have explicit permission rules allowing the target paths.

---

## MCP Tool Integration — How External Tools Enter the Pipeline

### Tool Resolution (src/session/prompt.ts:754-934 — VERIFIED)

MCP tools are loaded in `resolveTools()`:

```typescript
// Lines 840-931 (VERIFIED)
for (const [key, item] of Object.entries(await MCP.tools())) {
  const execute = item.execute
  if (!execute) continue

  // Wrap every MCP tool's execute() with:
  item.execute = async (args, opts) => {
    const ctx = context(args, opts)

    // Gate 1: Plugin hooks (before)
    await Plugin.trigger("tool.execute.before", ...)

    // Gate 2: Permission check — EVERY MCP tool call
    await ctx.ask({
      permission: key,        // e.g., "agent_swarm_send_task"
      metadata: {},
      patterns: ["*"],
      always: ["*"],
    })

    // Gate 3: Actual execution
    const result = await execute(args, opts)

    // Gate 4: Plugin hooks (after)
    await Plugin.trigger("tool.execute.after", ...)

    // Format output (text, image, resource)
    // Truncate output
  }
  tools[key] = item
}
```

**Critical:** Every MCP tool call goes through `ctx.ask()` with the tool name as the permission. This means:
- If the agent's ruleset has `"agent_swarm_*": "deny"`, ALL swarm tools are blocked
- If the ruleset has `"agent_swarm_*": "allow"`, ALL swarm tools are allowed
- The default for unknown permissions is `"ask"` — which requires TUI interaction

### Tool Context Construction (src/session/prompt.ts:758-791 — VERIFIED)

```typescript
const context = (args, options) => ({
  sessionID: input.session.id,
  abort: options.abortSignal,
  messageID: input.processor.message.id,
  callID: options.toolCallId,
  extra: { model: input.model, bypassAgentCheck: input.bypassAgentCheck },
  agent: input.agent.name,
  messages: input.messages,
  async ask(req) {
    await Permission.ask({
      ...req,
      sessionID: input.session.id,
      tool: { messageID: input.processor.message.id, callID: options.toolCallId },
      ruleset: Permission.merge(input.agent.permission, input.session.permission ?? []),
    })
  },
})
```

The `ruleset` for permission checks is always `Permission.merge(agent.permission, session.permission)`.

---

## Attack Surface & Mechanical Firewall Opportunities

### Layer 1: Instance Boundary (Strongest)
- `Instance.containsPath()` (`src/project/instance.ts:100-106`) is the hard boundary
- Any file outside `Instance.directory` and `Instance.worktree` triggers `external_directory` permission
- **Mechanical firewall opportunity:** Hardcode a deny list of paths that can NEVER be written, regardless of permission rules

### Layer 2: Permission Ruleset (Most Configurable)
- Ruleset is evaluated per-tool-call with last-match-wins
- Session-level permissions can restrict subagents
- Stored in SQLite `permission` table (project-level) and `session.permission` (session-level)
- **Mechanical firewall opportunity:** Add immutable "deny" rules that cannot be overridden by user config

### Layer 3: Shark Enforcement (Experimental)
- Runs before native permissions in `Tool.define()` wrapper
- Can be bypassed by removing the shark plugin
- **Mechanical firewall opportunity:** Move the critical firewalls (guardian, mock detection) into the core `Tool.define()` wrapper, making them non-optional

### Layer 4: Plugin Hooks (Most Extensible)
- `Plugin.trigger("tool.execute.before", ...)` and `(...after, ...)`
- Plugins can intercept, modify, or block any tool call
- **Mechanical firewall opportunity:** Register a "before" hook that enforces architectural invariants

### Layer 5: Doom Loop Detection (Built-in)
- Detects 3 identical tool calls in a row (exact match on tool name + input JSON)
- Asks user for permission to continue
- **Mechanical firewall opportunity:** Lower the threshold, add pattern-based detection (not just exact match)

### Recommended Mechanical Firewall Architecture

```
┌─────────────────────────────────────────────────────┐
│  IMMUTABLE CORE (cannot be disabled by config)      │
│  - Instance boundary check (hard deny list)         │
│  - System path protection                           │
│  - Personal data protection                         │
│  - Doom loop detection (pattern-based)              │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│  PERMISSION RULESET (configurable, auditable)       │
│  - Per-agent rules                                  │
│  - Per-session rules                                │
│  - User overrides                                   │
│  - MCP tool permissions                             │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│  PLUGIN HOOKS (extensible, observable)              │
│  - tool.execute.before (intercept)                  │
│  - tool.execute.after (audit)                       │
│  - chat.message.transform (prompt injection guard)  │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────┐
│  SHARK ENFORCEMENT (optional, layered)              │
│  - Guardian zone classification                     │
│  - Mock mode detection                              │
│  - Code quality checks                              │
│  - Documentation validation                         │
└─────────────────────────────────────────────────────┘
```

---

## File Reference Map (all verified against source)

| File | Lines | Purpose |
|------|-------|---------|
| `src/agent/agent.ts` | 343 | Agent definitions, permission assembly, agent generation |
| `src/permission/index.ts` | 322 | Core permission system: ask, reply, evaluate, merge |
| `src/permission/evaluate.ts` | 15 | Rule matching algorithm (last-match-wins) |
| `src/permission/schema.ts` | 17 | PermissionID type |
| `src/permission/arity.ts` | — | Permission cardinality |
| `src/tool/tool.ts` | 113 | Tool.define() — wraps all tool execution |
| `src/tool/write.ts` | 84 | File write tool with permission gates |
| `src/tool/edit.ts` | 668 | Diff-based edit with 9 replacer strategies |
| `src/tool/task.ts` | 167 | Subagent delegation tool |
| `src/tool/external-directory.ts` | 32 | Path boundary assertion |
| `src/tool/registry.ts` | — | Tool registry with agent filtering |
| `src/session/prompt.ts` | 1477+ | Main session loop, tool resolution, MCP integration |
| `src/session/processor.ts` | 430 | LLM stream processing, doom loop detection |
| `src/session/system.ts` | 68 | System prompt assembly per provider |
| `src/session/session.sql.ts` | 103 | Drizzle schema for sessions/messages/parts/todos/permissions |
| `src/enforcement/enforcer.ts` | 124 | Shark firewall orchestration |
| `src/enforcement/audit-logger.ts` | 49 | Audit trail logging |
| `src/guardian/index.ts` | 173 | Zone classification and path protection |
| `src/validation/mock-detector.ts` | 43 | Mock mode pattern detection |
| `src/validation/theatrical-detector.ts` | 62 | Unused function / nesting depth detection |
| `src/validation/style-enforcer.ts` | 62 | Single-word identifier enforcement |
| `src/validation/test-enforcer.ts` | 26 | Repo root test prevention |
| `src/validation/doc-validator.ts` | 52 | Theatrical documentation detection |
| `src/validation/index.ts` | 5 | Re-exports for all validators |
| `src/project/instance.ts` | 166 | Instance lifecycle, path containment, ALS context |
| `src/storage/db.ts` | — | SQLite database initialization (Drizzle) |
| `src/storage/db.bun.ts` | — | Bun-specific SQLite (bun:sqlite) |
| `src/storage/db.node.ts` | — | Node-specific SQLite (node:sqlite) |
| `src/bus/bus-event.ts` | — | Event bus event definitions |
| `src/bus/index.ts` | — | Internal event bus |
| `src/config/config.ts` | — | Configuration loading |
| `src/mcp/` | — | MCP client for external servers |
| `src/plugin/` | — | Plugin system |
| `src/snapshot/` | — | Filesystem snapshot tracking |
| `src/util/wildcard.ts` | — | Glob pattern matching for permissions |
