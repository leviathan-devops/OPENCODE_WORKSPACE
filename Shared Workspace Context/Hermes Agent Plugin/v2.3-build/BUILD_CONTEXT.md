# HERMES AGENT PLUGIN — V2 BUILD CONTEXT

**Build Version:** v2  
**Started:** 2026-04-02  
**Goal:** Production-grade plugin with real implementations, not stubs  
**Source:** `../v1-build/` (preserved broken build with full audit)

---

## WHAT THIS IS

A fresh build context for a spider agent to implement the production-grade version of the Hermes Agent Plugin for OpenCode. The v1 build has correct architecture and hooks, but all enforcement functions and tools are stubs. The spider agent must implement the real functionality.

**Reference:** `../v1-build/AUDIT_REPORT.md` — full audit of what is broken and what is sound.

---

## PLUGIN OVERVIEW

**Plugin Name:** `hermes-agent`  
**Entry Point:** `dist/index.js` (compiled from `src/index.ts`)  
**Framework:** @opencode-ai/plugin v1.1.53  
**Runtime:** Bun (for building), TypeScript 5.3+  
**Build Command:** `cd /path/to/plugin && bun install && bun build.ts`

### What It Does
The Hermes Agent Plugin brings Leviathan's 6-phase workflow (brainstorm → plan → build → review → debug → complete) to OpenCode with 19 specialized agents, 28 hooks, and 28 tools. It enforces TDD, design review gates, placeholder-free planning, and adversarial testing.

### Architecture Pattern
```
Plugin → 19 agents (prompts) + 28 hooks (composed into 6 hook points) + 28 tools
```

---

## PLUGIN SDK REFERENCE

### ToolContext (available in all tool execute functions)

```typescript
type ToolContext = {
    sessionID: string;
    messageID: string;
    agent: string;
    directory: string;      // Current project directory
    worktree: string;       // Project worktree root
    abort: AbortSignal;
    metadata(input: { title?: string; metadata?: Record<string,any> }): void;
    ask(input: AskInput): Promise<void>;
};
```

### Tool Definition Pattern

```typescript
import { tool } from "./create-tool.js";

export const myTool = tool({
  description: "What this tool does",
  args: {
    param: tool.schema.string().describe("Parameter description"),
  },
  execute: async (args, context) => {
    // context.directory = current project dir
    // context.worktree = project root
    // Use spawn or Bun Shell to run real commands
    return `result`;
  },
});
```

### Hook Types

```typescript
// tool.execute.before — runs before a tool executes
(input: { tool: string; sessionID: string; callID: string }, 
 output: { args: any }) => Promise<void>

// tool.execute.after — runs after a tool executes  
(input: { tool: string; sessionID: string; callID: string },
 output: { title: string; output: string; metadata: any }) => Promise<void>

// experimental.chat.messages.transform — modify LLM messages
(input: {}, output: { messages: { info: Message; parts: Part[] }[] }) => Promise<void>

// experimental.chat.system.transform — modify system prompt
(input: { sessionID?: string; model: Model }, output: { system: string[] }) => Promise<void>

// experimental.session.compacting — customize compaction
(input: { sessionID: string }, output: { context: string[]; prompt?: string }) => Promise<void>

// chat.params — modify LLM parameters
(input: { sessionID, agent, model, provider, message }, 
 output: { temperature, topP, topK, options }) => Promise<void>
```

### Plugin Return Shape

```typescript
const hermesPlugin: Plugin = async (input: PluginInput) => {
  return {
    name: "hermes-agent",
    agent: [
      { name: "hermes", description: "...", instructions: HERMES_PROMPT },
      // ... 18 more agents
    ],
    tool: {
      checkpoint, phase_complete, save_plan,
      hermes_recall, hermes_remember, hermes_context,
      lint, diff, build_check, syntax_check,
      test_runner, placeholder_scan, sast_scan, secret_scan,
      complexity_hotspots, detect_domains, extract_code_blocks, imports, symbols,
      grill, verify, health, evidence_check, retrieve_summary,
      list_sessions, load_session, fork_session, create_snapshot,
    },
    "experimental.chat.system.transform": createSystemEnhancerHook(),
    "experimental.chat.messages.transform": composeHandlers([...]),
    "tool.execute.before": composeHandlers([...]),
    "tool.execute.after": composeHandlers([...]),
    "experimental.session.compacting": createCompactionHook(),
    "chat.params": createComplexityRoutingHook(),
  };
};
```

---

## WHAT NEEDS TO BE BUILT

### Priority 0 — Enforcement Stubs (THE BLOCKER)

#### 1. `src/hooks/tdd-enforcer.ts` — FIX THIS FIRST

**Current stub:**
```typescript
function testFileExists(path: string): boolean {
  return true;  // ← STUB, does nothing
}
```

**Fix:** Use Node.js `fs.existsSync()` to actually check:
```typescript
import { existsSync } from "fs";
function testFileExists(path: string): boolean {
  return existsSync(path);
}
```

The hook should block `write_file` tool when:
- Phase is BUILD
- File is a source file (not test)
- No corresponding test file exists

#### 2. `src/hooks/delegation-gate.ts`

**Current stub:**
```typescript
function checkReviewerApproval(taskId: string): boolean {
  return true;  // ← STUB, does nothing
}
```

**Fix:** Track approvals in a shared state. The SessionDB already has this infrastructure — use it. Query whether `@reviewer` or `@quality-reviewer` has approved the task before allowing `complete_task` with status="done".

### Priority 1 — Quality/Security Tools (Replace Stubs)

#### 3. `src/tools/quality.ts`

All 4 tools must run real subprocess commands:

| Tool | Real Implementation |
|------|---------------------|
| `lint` | `spawn("npx", ["eslint", path || "."])` or `tsc --noEmit` |
| `build_check` | `spawn("npm", ["run", "build"])` or `tsc --noEmit` |
| `syntax_check` | `spawn("npx", ["tsc", path, "--noEmit"])` |
| `diff` | `spawn("git", ["diff", "--no-color"])` |

#### 4. `src/tools/security.ts`

| Tool | Real Implementation |
|------|---------------------|
| `test_runner` | `spawn("npm", ["test"])` or find+run test framework |
| `placeholderScan` | `spawn("grep", ["-r", "-n", "-E", "TBD\|TODO\|FIXME", path])` |
| `sast_scan` | `spawn("npx", ["semgrep", "--config=auto", path || "."])` or `npm audit` |
| `secret_scan` | `spawn("git", ["log", "-p", "-S", "api_key"])` or pattern match |

#### 5. `src/tools/analysis.ts`

These need TypeScript compiler API or `ts-morph`:
```typescript
// For complexity_hotspots: use ts-morph or tsc --diagnostics
// For detect_domains: analyze project directory structure
// For imports: parse TypeScript with ts-morph
// For symbols: extract AST with ts-morph or tree-sitter
```

#### 6. `src/tools/verification.ts`

| Tool | Real Implementation |
|------|---------------------|
| `grill` | Actually analyze code for injection, XSS, auth bypass vectors |
| `verify` | Check actual test results, build output, lint status |
| `health` | Calculate real metrics: test coverage %, deps outdated, lint errors |
| `evidence_check` | Verify actual files in `.swarm/evidence/` exist |
| `retrieve_summary` | Use OpenCode SDK to get tool call metadata |

### Priority 2 — Session Persistence

#### 7. `src/tools/session-tools.ts` + `src/hooks/snapshot-writer.ts`

The `SessionDB` class in `src/services/session-db.ts` is fully implemented but **never wired up**. The session tools return stubs:
```typescript
// CURRENT STUB:
export const listSessions = tool({
  execute: async () => `Sessions found: (use --continue or --resume)`,
});

// FIX: Use SessionDB
const db = new SessionDB(context.worktree);
const sessions = db.listSessions();
return sessions.map(s => s.id).join("\n");
```

`createSnapshotWriterHook()` in `src/hooks/snapshot-writer.ts` needs to call `sessionDB.saveSnapshot()` on phase transitions.

### Priority 3 — 2nd-Brain Path Fix

#### 8. Fix Memory Path — `src/tools/hermes-remember.ts`

**Current bug:**
```typescript
const memoryDir = resolve(context.worktree, ".hermes", "memory");
// WRONG: writes to {workspace}/.hermes/memory/
```

**Fix:**
```typescript
import { resolve } from "path";
const memoryDir = resolve(process.env.HOME ?? "~", ".hermes", "memory");
```

**Same fix in:** `hermes-recall.ts`, `hermes-context.ts`, `checkpoint.ts`.

**Why it matters:** `context.worktree` is the user's project workspace (e.g. `~/OPENCODE_WORKSPACE/`). Memory files written there are OUTSIDE `~/.hermes/` and bypass the `chattr +i` guardian firewall.

### Priority 4 — Guardian Firewall Integration

#### 9. Guardian Firewall Compatibility

**Current situation:**
- `guardian-hermes.sh` locks `~/.hermes/` with `chattr +i`
- The plugin's 2nd-brain tools write to `context.worktree/.hermes/` (bypasses guardian — good for plugin)
- But 2nd-brain files should live in `~/.hermes/memory/` (protected by guardian — for institutional memory)

**Architecture decision needed:**
- Option A: Keep plugin memory in `worktree/.hermes/` (unprotected, works for plugin)
- Option B: Move to `~/.hermes/memory/` (protected, but need to handle `chattr +i`)
- Option C: Hybrid — critical identity in `~/.hermes/` (locked), project-specific in `worktree/.hermes/`

**Recommended:** Option C. The plugin should write project-specific data to `worktree/.hermes/` (snapshots, checkpoints) and critical institutional memory to `~/.hermes/memory/` (locked by guardian).

---

## ENFORCEMENT HOOKS THAT ARE CORRECT

These hooks have correct logic — just need the stub functions fixed:

### `src/hooks/brainstorm-gate.ts`
- ✅ Correctly blocks code in idle/analyze phases
- ✅ Injects `[HARD-GATE BLOCKED]` message
- Just needs `testFileExists()` and `checkReviewerApproval()` fixed

### `src/hooks/plan-validator.ts`
- ✅ Correctly rejects TBD/TODO/FIXME/placeholder patterns
- ✅ Only active in PLAN phase
- No stub dependencies

### `src/hooks/phase-monitor.ts`
- ✅ Correctly enforces PHASE_ORDER transitions
- ✅ Blocks invalid transitions
- No stub dependencies

---

## BUILD COMMANDS

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build"

# Install dependencies
bun install

# Build plugin
bun build.ts

# Typecheck
npx tsc --noEmit

# Test in OpenCode (load plugin from this path)
```

### Deploy in OpenCode

Add to `~/.config/opencode/opencode.json`:
```json
"plugins": {
  "hermes-agent": {
    "type": "local",
    "path": "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build/dist/index.js"
  },
  "agent_swarm": {
    "type": "remote",
    "url": "http://localhost:3013",
    "headers": {
      "Authorization": "Bearer {env:AGENT_SWARM_API_KEY}"
    },
    "enabled": true
  }
}
```

---

## FILE MAP

```
v2-build/
├── src/
│   ├── index.ts                  — Plugin entry, composeHandlers, 19 agents, 28 tools
│   ├── agents/                   — 19 agent prompt exports (✓ sound)
│   ├── hooks/
│   │   ├── brainstorm-gate.ts    — ✓ Logic OK, needs testFileExists()
│   │   ├── plan-validator.ts     — ✓ Logic OK
│   │   ├── tdd-enforcer.ts       — ❌ testFileExists() stub
│   │   ├── delegation-gate.ts    — ❌ checkReviewerApproval() stub
│   │   ├── phase-monitor.ts      — ✓ Logic OK
│   │   ├── snapshot-writer.ts    — ❌ Empty, needs SessionDB
│   │   └── [...24 more hooks]    — Various implementations
│   ├── config/
│   │   ├── constants.ts          — ✓ PHASES, PHASE_ORDER, PLACEHOLDER_PATTERNS
│   │   ├── loader.ts             — ✓ loadHermesConfig()
│   │   ├── schema.ts             — ✓ Zod schemas
│   │   └── [...more]
│   ├── services/
│   │   ├── session-db.ts         — ✓ Full implementation, NOT wired up
│   │   └── supervisor-loop.ts    — ✓ Implemented
│   └── tools/
│       ├── quality.ts            — ❌ All 4 stubs
│       ├── security.ts           — ❌ All 4 stubs
│       ├── analysis.ts           — ❌ All 5 stubs
│       ├── verification.ts        — ❌ All 5 stubs
│       ├── session-tools.ts       — ❌ Stubs, needs SessionDB
│       ├── hermes-remember.ts    — ❌ Wrong path (worktree vs HOME)
│       ├── hermes-recall.ts      — ❌ Wrong path
│       ├── hermes-context.ts     — ❌ Wrong path
│       ├── checkpoint.ts         — ❌ Wrong path
│       └── [...more]
├── dist/index.js                 — Compiled output (won't work until tools fixed)
├── BUILD_CONTEXT.md              — This file
└── BUILD/
    ├── MASTER_PROMPT.md          — Original agent prompt spec
    ├── BUILD_START_HERE.md       — Original implementation guide
    └── PHASE_CHECKLIST.md       — Phase tracking doc
```

---

## SDK FILES (in node_modules)

Key SDK files with full type definitions:

- `@opencode-ai/plugin/dist/index.d.ts` — Plugin type, Hooks interface
- `@opencode-ai/plugin/dist/tool.d.ts` — tool(), ToolContext, ToolDefinition
- `@opencode-ai/sdk/dist/client.d.ts` — createOpencodeClient
- `@opencode-ai/sdk/dist/gen/client/types.gen.d.ts` — Project, Model, etc.

---

## IMPLEMENTATION ORDER (Recommended)

1. **Fix `testFileExists()` in `tdd-enforcer.ts`** — Unblocks TDD enforcement
2. **Fix `checkReviewerApproval()` in `delegation-gate.ts`** — Unblocks reviewer requirement
3. **Wire SessionDB into session-tools.ts** — Enables real session persistence
4. **Fix memory paths in 4 files** — 2nd-brain writes to correct location
5. **Implement quality tools** — lint, build_check, syntax_check, diff
6. **Implement security tools** — test_runner, sast_scan, secret_scan, placeholder_scan
7. **Implement analysis tools** — complexity_hotspots, detect_domains, imports, symbols
8. **Implement verification tools** — grill, verify, health, evidence_check, retrieve_summary
9. **Implement snapshot-writer hook** — Call SessionDB.saveSnapshot()
10. **Rebuild and test** — `bun build.ts && test in OpenCode`

---

## TESTING APPROACH

After each fix:
1. `bun build.ts` — verify it compiles
2. `npx tsc --noEmit` — verify types
3. Load in OpenCode and test the specific tool/hook
4. Don't write e2e tests that return hardcoded values — test actual behavior

**Real test example for lint:**
```typescript
// WRONG (stub):
execute: async () => "✓ No lint errors"

// RIGHT (real):
execute: async (args, context) => {
  const result = Bun.spawnSync(
    ["npx", "eslint", args.path ?? context.directory, "--format=json"],
    { cwd: context.directory }
  );
  if (result.exitCode !== 0) {
    return `Lint errors found:\n${result.stderr}`;
  }
  return "✓ No lint errors";
}
```
