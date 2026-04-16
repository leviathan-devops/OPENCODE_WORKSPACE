# Agent CLI Tools

OpenCode plugin that exposes [Gemini CLI](https://github.com/google-gemini/gemini-cli) and [Qwen Code](https://github.com/QwenLM/qwen-code) as native OpenCode tools.

## Installation

```bash
cd ~/OPENCODE_WORKSPACE/plugins/agent-cli-tools
bun install
bun run build
```

## Tools

### `gemini`

Invoke Gemini CLI for code analysis, review, and generation.

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `prompt` | `string` | (required) | The prompt to send to Gemini |
| `model` | `'gemini-2.5-flash' \| 'gemini-2.5-pro'` | `'gemini-2.5-flash'` | Model to use |
| `sandbox` | `boolean` | `false` | Enable sandbox mode |
| `outputFormat` | `'json' \| 'text'` | `'json'` | Response format |
| `timeout` | `number` | `120` | Timeout in seconds (1-600) |

**Example:**
```typescript
const result = await tools.gemini({
  prompt: "Review this code for bugs: " + code,
  model: "gemini-2.5-pro",
});
```

### `qwen`

Invoke Qwen Code CLI for autonomous code generation and review.

| Argument | Type | Default | Description |
|----------|------|---------|-------------|
| `prompt` | `string` | (required) | The prompt to send to Qwen |
| `yolo` | `boolean` | `false` | Enable autonomous mode (no approval prompts) |
| `model` | `string` | `'qwen3-coder'` | Model to use |
| `outputFormat` | `'json' \| 'text'` | `'json'` | Response format |
| `timeout` | `number` | `120` | Timeout in seconds (1-600) |

**Example:**
```typescript
const result = await tools.qwen({
  prompt: "Fix the bugs in this file: " + code,
  yolo: true,
});
```

## Response Format

Both tools return a JSON string with this structure:

```typescript
interface Result {
  success: boolean;
  response?: string | object;    // Present on success
  error?: {                       // Present on failure
    code: string;
    message: string;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    reqCount?: number;
    remaining?: number;
  };
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `TIMEOUT` | CLI did not complete within the specified timeout |
| `CLI_ERROR` | CLI exited with a non-zero exit code |
| `PARSE_ERROR` | CLI output was not valid JSON |
| `INVALID_ARGS` | Zod validation failed on input arguments |
| `INVOCATION_ERROR` | Failed to spawn the CLI process |

## Prerequisites

- `gemini` CLI installed globally (`npm install -g @google/gemini-cli`)
- `qwen` CLI installed globally (`npm install -g @qwen-code/qwen-code`)

## Development

```bash
bun run build          # Build for production
bun run build:watch    # Watch mode
bun run typecheck      # TypeScript type check
bun test               # Run tests
```
