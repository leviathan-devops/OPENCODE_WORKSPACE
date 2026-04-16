# Coding Subagents - Architecture Decisions

## Overview

An OpenCode plugin exposing two specialized coding agents as native tools:
- **gemma**: Gemma-4-31b-it via shark-gemini-proxy (code review, debugging, test engineering)
- **qwen**: Qwen Code CLI (natural language to code, prototyping, fast builds)

## Design Decisions

### 1. Two Separate Tools
**Decision:** `gemma` and `qwen` are completely separate tools with distinct purposes.
**Rationale:** Clear role separation matches mental model. Gemma = reviewer, Qwen = builder.

### 2. HTTPS API for Gemma
**Decision:** Use direct HTTPS calls to proxy instead of spawning `gemini` CLI.
**Rationale:** `gemini` CLI requires OAuth/browser auth. HTTPS works headlessly everywhere.
**Model:** Gemma-4-31b-it (dense, 31B params) - hardcoded as primary.

### 3. CLI Spawn for Qwen
**Decision:** Use `child_process.spawn` to invoke `qwen` CLI.
**Rationale:** Qwen CLI works headless with API key authentication. No OAuth needed.

### 4. Shared Utilities
**Decision:** Both tools use same `invokeCli`, `logger`, `parse` utilities from Spider's build.
**Rationale:** DRY. Spider's architecture was solid - no need to reinvent.

### 5. Zod 4.x Schema Validation
**Decision:** Use Zod 4.1.8 with `.safeParse()` for runtime validation.
**Rationale:** Matches boilerplate. Zod 4.x uses `.issues` not `.errors`.

## File Structure

```
coding-subagents/
├── src/
│   ├── index.ts              # Plugin entry (Hooks export)
│   ├── tools/
│   │   ├── index.ts         # Tool registry
│   │   ├── gemma.ts         # Gemma tool (HTTPS proxy)
│   │   ├── qwen.ts          # Qwen tool (CLI spawn)
│   │   └── types.ts         # Zod schemas + types
│   └── utils/
│       ├── cli.ts           # CLI spawn wrapper (from Spider)
│       ├── logger.ts        # Logging (from Spider)
│       └── parse.ts         # JSON parser (from Spider)
├── package.json
├── tsconfig.json
└── dist/
    └── index.js             # Bundled output (0.46 MB)
```

## Gemma Tool (Code Review Specialist)

**Endpoint:** `https://shark-gemini-proxy-production.up.railway.app/v1beta`

**Supported Models:**
- `gemma-4-31b-it` (default) - dense model, best for deep analysis
- `gemma-4-26b-a4b-it` - mixture of experts
- `gemma-3-4b-it` - smaller, faster

**Best For:**
- Code review and critique
- Bug detection and debugging
- Test engineering
- Production-grade verification

## Qwen Tool (Natural Language to Code)

**CLI:** `qwen -p "<prompt>" [options]`

**Best For:**
- Converting natural language to code
- Quick prototypes
- Scaffolding
- Fast builds

**Options:**
- `--yolo` - autonomous mode (no confirmation)
- `-m <model>` - specify model

## Error Taxonomy

| Code | Meaning |
|------|---------|
| `TIMEOUT` | Process exceeded timeout |
| `CLI_ERROR` | CLI exited non-zero |
| `PARSE_ERROR` | JSON parse failed |
| `INVALID_ARGS` | Zod validation failed |
| `INVOCATION_ERROR` | Failed to spawn process |

## Dependencies

- `@opencode-ai/plugin` (peer) — OpenCode plugin interface
- `zod` 4.1.8 — Runtime validation
- `child_process` (builtin) — CLI spawning for Qwen
- `https` (builtin) — HTTPS calls for Gemma
