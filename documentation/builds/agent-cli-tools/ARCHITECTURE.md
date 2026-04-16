# Agent CLI Tools - Architecture Decisions

## Overview

A minimal OpenCode plugin that wraps two external CLI tools (Gemini CLI and Qwen Code) as native OpenCode tools. No orchestration, no state management — pure tool wrappers.

## Design Decisions

### 1. Single Generic CLI Invoker
**Decision:** One `invokeCli()` function in `src/utils/cli.ts` handles both tools.
**Rationale:** Both CLIs share the same invocation pattern (spawn, capture stdout/stderr, handle timeout). DRY principle.

### 2. Zod 4.x Schema Validation
**Decision:** Use Zod 4.1.8 (matching boilerplate) with `safeParse` for runtime validation.
**Rationale:** Zod 4.x uses `.issues` instead of `.errors` on ZodError. All schemas use `.default()` for optional fields.

### 3. No State Between Calls
**Decision:** Each tool invocation is independent. No session management.
**Rationale:** The ARCHITECTURE-PROMPT explicitly states "Do NOT manage session state between calls." Caller controls parallelism via `Promise.all`.

### 4. JSON Output by Default
**Decision:** Both tools default to `--output-format json` for structured parsing.
**Rationale:** Parseable output enables chaining and aggregation. Text output available as fallback.

### 5. Timeout Handling
**Decision:** SIGTERM first, SIGKILL after 2s grace period.
**Rationale:** Graceful shutdown preferred. Force kill prevents zombie processes.

### 6. Error Code Taxonomy
**Decision:** Five distinct error codes: `TIMEOUT`, `CLI_ERROR`, `PARSE_ERROR`, `INVALID_ARGS`, `INVOCATION_ERROR`.
**Rationale:** Each code maps to a specific failure mode, enabling callers to handle errors appropriately.

## File Structure

```
agent-cli-tools/
├── src/
│   ├── index.ts              # Plugin entry (Hooks export)
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── gemini.ts         # Gemini tool
│   │   ├── qwen.ts           # Qwen tool
│   │   └── types.ts          # Zod schemas + types
│   └── utils/
│       ├── cli.ts            # CLI invocation (spawn wrapper)
│       ├── logger.ts         # Logging utility
│       └── parse.ts          # JSON output parser
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- `@opencode-ai/plugin` (peer) — OpenCode plugin interface
- `zod` 4.1.8 — Runtime validation
- `child_process` (builtin) — CLI spawning
