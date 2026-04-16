# HERMES AGENT PLUGIN — V2 BUILD

## Quick Start

**Read first:** `BUILD_CONTEXT.md` — everything you need to know about what to build.

**Reference:** `../v1-build/AUDIT_REPORT.md` — full audit of the v1 build.

**Source code:** `src/` — all TypeScript source. The v1 build compiled to `dist/index.js` but all enforcement and tools are stubs.

---

## Directory Layout

```
v2-build/
├── BUILD_CONTEXT.md      ← START HERE
├── BUILD_INDEX.md         ← This file
├── BUILD/
│   ├── MASTER_PROMPT.md   ← Original agent specification
│   ├── BUILD_START_HERE.md
│   └── PHASE_CHECKLIST.md
├── src/                  ← All TypeScript source (YOUR WORKSPACE)
│   ├── index.ts
│   ├── agents/           — 19 agent prompts (✓ sound)
│   ├── hooks/            — 28 hooks
│   ├── config/           — constants, schema, loader
│   ├── services/         — SessionDB, supervisor-loop
│   └── tools/            — 12 tool files
├── dist/
│   └── index.js          ← Compiled output (your build target)
├── SDK/
│   ├── plugin_types.d.ts — @opencode-ai/plugin types
│   ├── tool_types.d.ts   — tool(), ToolContext types
│   └── sdk_client.d.ts   — OpenCode SDK client
├── REFERENCE/             — Architecture, permissions, hooks docs
├── PERSPECTIVES/         — Agent perspectives
└── SKILLS/              — Skill definitions
```

---

## Your Task

Implement the production-grade version. The v1 build has correct architecture but ALL enforcement and tool functions return hardcoded stubs.

**The 10 things you must fix (in order):**

1. `src/hooks/tdd-enforcer.ts` — replace `return true` with real `existsSync()` check
2. `src/hooks/delegation-gate.ts` — replace `return true` with SessionDB approval lookup
3. `src/tools/session-tools.ts` — replace stubs with real SessionDB calls
4. `src/tools/hermes-remember.ts` — fix path from `worktree` to `HOME/.hermes/memory`
5. `src/tools/hermes-recall.ts` — fix path
6. `src/tools/hermes-context.ts` — fix path
7. `src/tools/checkpoint.ts` — fix path
8. `src/tools/quality.ts` — replace 4 stub returns with real subprocess calls
9. `src/tools/security.ts` — replace 4 stub returns with real subprocess calls
10. `src/tools/analysis.ts` — implement real AST analysis or ts-morph calls

Then implement:
- `src/tools/verification.ts` — 5 real verification tools
- `src/hooks/snapshot-writer.ts` — wire SessionDB.saveSnapshot()

---

## Build Commands

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build"
bun install
bun build.ts              # Build dist/index.js
npx tsc --noEmit          # Type check
```

## Test in OpenCode

Add to `~/.config/opencode/opencode.json`:
```json
"plugins": {
  "hermes-agent": {
    "type": "local",
    "path": "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2-build/dist/index.js"
  }
}
```

## Verification

After building, verify:
1. `dist/index.js` exists and is ~15K+ lines
2. `npx tsc --noEmit` reports 0 errors
3. Load in OpenCode and test each tool with real project files
4. TDD enforcer should block source file writes when no test exists
5. Session tools should list/load real sessions from disk
6. Memory tools should read/write to `~/.hermes/memory/`

---

## Key Constraints

- **Use Bun APIs** where possible (Bun.spawnSync, Bun.file, etc.)
- **Tool execute functions** must be `async`
- **Context.worktree** is project root; **context.directory** is current dir
- **HOME env var** resolves to `/home/leviathan` — use for `~/.hermes/`
- **Don't return hardcoded strings** — always run real commands or analyze real files
- **Guardian firewall** protects `~/.hermes/` with `chattr +i` — your memory writes need to be deliberate

---

## SDK Reference

See `SDK/plugin_types.d.ts` and `SDK/tool_types.d.ts` for full type definitions.

Key patterns:
```typescript
import { tool } from "./create-tool.js";
import { existsSync } from "fs";
import { resolve } from "path";

// Tool with real implementation:
export const lint = tool({
  description: "Run linter on project files",
  args: {
    path: tool.schema.string().optional(),
    fix: tool.schema.boolean().optional().default(false),
  },
  execute: async (args, context) => {
    const cwd = args.path ?? context.directory;
    const result = Bun.spawnSync(
      ["npx", "eslint", cwd, "--format=json"],
      { cwd: context.directory }
    );
    if (result.exitCode !== 0) {
      return `Lint errors:\n${result.stderr}`;
    }
    return "✓ No lint errors";
  },
});
```
