# Agent CLI Tools - Design

## Overview

Universal OpenCode plugin that exposes `gemini` and `qwen` CLIs as native tools. No agent-specific code — available to any OpenCode agent.

## Architecture

```
┌─────────────────────────────────────────────┐
│         OpenCode Agent Session               │
│                                             │
│  /tool gemini({"prompt": "..."})            │
│       │                                     │
│       ▼                                     │
│  ┌─────────────────────────────────────┐    │
│  │      AgentCliTools Plugin           │    │
│  │                                     │    │
│  │  gemini tool ──► spawn("gemini")   │    │
│  │  qwen tool  ──► spawn("qwen")      │    │
│  └─────────────────────────────────────┘    │
│                    │                        │
│                    ▼                        │
│              Gemini CLI / Qwen CLI          │
│                    │                        │
│                    ▼                        │
│              JSON response                  │
└─────────────────────────────────────────────┘
```

## Component Design

### Tool Registry Pattern

```typescript
// src/tools/index.ts
export function createToolRegistry() {
  return {
    gemini: createGeminiTool(),
    qwen: createQwenTool(),
  };
}
```

### CLI Invocation Layer

```typescript
// src/utils/cli.ts
export async function invokeCli(
  command: string,
  args: string[],
  options: { timeout?: number; cwd?: string }
): Promise<CliResult>
```

- Uses Node.js `child_process.spawn`
- Captures stdout/stderr separately
- Handles timeout with `SIGTERM`
- Returns structured result

### Output Parsing

```typescript
// src/utils/parse.ts
export function extractGeminiResponse(output: string): ParseResult
export function extractQwenResponse(output: string): ParseResult
```

- Try JSON.parse first
- If fails, return raw text
- Extract `response` field if present

### Error Structure

```typescript
interface ToolError {
  code: string;   // TIMEOUT | CLI_ERROR | PARSE_ERROR | INVALID_ARGS | INVOCATION_ERROR
  message: string;
}
```

## Tool Comparison

| Feature | Gemini CLI | Qwen Code |
|---------|------------|-----------|
| Free tier | 1000 req/day | 1000 req/day |
| Context window | 1M tokens | ~128k tokens |
| Search grounding | Yes (Google) | No |
| Sandbox mode | `-s` flag | N/A |
| Autonomous mode | N/A | `--yolo` flag |
| Architecture rules | `.gemini/GEMINI.md` | `.qwen/QWEN.md` |
| Structured output | `--output-format json` | `--output-format json` |
| Specific models | `-m model-name` | `-m model-name` |

## Security Model

### Gemini Sandbox

Use sandbox mode (`sandbox: true`) for untrusted code:
```
gemini -s -p "analyze untrusted code"
```

### Qwen YOLO Mode

YOLO mode (`yolo: true`) runs without approval prompts:
```
qwen -p "refactor this" --yolo
```

CAUTION: Only use yolo on trusted codebases.

### Architecture Rules

Both CLIs auto-load context files:

```
project/
├── .gemini/GEMINI.md   # Gemini reads this
└── .qwen/QWEN.md       # Qwen reads this
```

Create these in project root to enforce development standards.

## Data Flow

```
1. Agent calls /tool gemini({"prompt": "..."})
       │
2. Plugin validates args with Zod
       │
3. Plugin builds CLI args: ["-p", prompt, "--output-format", "json"]
       │
4. Plugin spawns: spawn("gemini", args)
       │
5. CLI executes, outputs JSON to stdout
       │
6. Plugin captures stdout, parses JSON
       │
7. Plugin returns structured result
       │
8. Agent receives { success, response, metadata }
```

## Rate Limiting

| Agent | Daily Limit | Rate Limit |
|-------|-------------|------------|
| Gemini | 1000 req/day | 60 req/min |
| Qwen | 1000 req/day | Varies |

Metadata in response:
```typescript
{
  metadata: {
    reqCount: 1,
    remaining: 999,  // Estimated
  }
}
```

Caller is responsible for tracking and queuing.

## File Structure

```
agent-cli-tools/
├── src/
│   ├── index.ts              # Plugin entry (Hook interface)
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── gemini.ts         # Gemini tool wrapper
│   │   ├── qwen.ts           # Qwen tool wrapper
│   │   └── types.ts          # Zod schemas + types
│   └── utils/
│       ├── cli.ts             # CLI spawn wrapper
│       ├── logger.ts          # Logging utility
│       └── parse.ts           # JSON parsing
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| @opencode-ai/plugin | Plugin interface | ^1.1.53 |
| zod | Validation | ^4.1.8 |
| bun | Build/runtime | >=1.0.0 |

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CLI approach | child_process.spawn | Full CLI features, streaming capable |
| Output format | JSON default | Parseable, chainable |
| Error handling | Structured errors | Consistent, machine-readable |
| Timeout | 120s default | Prevents hanging, configurable |
| Parallelism | Caller-controlled | Caller uses Promise.all() |
| Rate limits | Metadata exposure | Caller tracks, plugin doesn't manage |
| Architecture rules | Context files | Both CLIs support natively |
