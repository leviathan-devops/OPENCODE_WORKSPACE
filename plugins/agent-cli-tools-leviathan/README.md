# Agent CLI Tools - Leviathan Build

Universal Gemini and Qwen CLI tools for OpenCode.

## Features

- **Gemini CLI** - 1000 req/day, 1M token context, Google Search grounding
- **Qwen Code** - 1000 req/day, autonomous mode (--yolo)
- **Universal** - Available to any OpenCode agent
- **Structured** - JSON output by default

## Installation

```bash
cd ~/OPENCODE_WORKSPACE/plugins/agent-cli-tools-leviathan
bun install
bun run build
```

## Usage

```
/tool gemini {"prompt": "Review this code"}
/tool qwen {"prompt": "Refactor this", "yolo": true}
```

## Tools

### gemini

| Arg | Type | Default | Description |
|-----|------|---------|-------------|
| prompt | string | required | The prompt |
| model | enum | gemini-2.5-flash | gemini-2.5-flash or gemini-2.5-pro |
| sandbox | boolean | false | Run in sandboxed mode |
| outputFormat | enum | json | json or text |
| timeout | number | 120 | Timeout in seconds |

### qwen

| Arg | Type | Default | Description |
|-----|------|---------|-------------|
| prompt | string | required | The prompt |
| yolo | boolean | false | Run without approval prompts |
| model | string | qwen3-coder | Model to use |
| outputFormat | enum | json | json or text |
| timeout | number | 120 | Timeout in seconds |

## Parallel Execution

```javascript
const [a, b, c] = await Promise.all([
  gemini({ prompt: "Task A" }),
  qwen({ prompt: "Task B" }),
  gemini({ prompt: "Task C", model: "gemini-2.5-pro" }),
]);
```

## Error Codes

| Code | Description |
|------|-------------|
| TIMEOUT | CLI did not complete within timeout |
| CLI_ERROR | CLI exited with non-zero code |
| PARSE_ERROR | CLI output was not valid JSON |
| INVALID_ARGS | Zod validation failed |
| INVOCATION_ERROR | Failed to spawn CLI process |

## Architecture

```
src/
├── index.ts           # Plugin entry
├── tools/
│   ├── index.ts      # Tool registry
│   ├── gemini.ts     # Gemini tool wrapper
│   ├── qwen.ts      # Qwen tool wrapper
│   └── types.ts     # TypeScript types
└── utils/
    ├── cli.ts        # CLI invocation (child_process.spawn)
    ├── logger.ts     # Logging utility
    └── parse.ts      # JSON output parsing
```
