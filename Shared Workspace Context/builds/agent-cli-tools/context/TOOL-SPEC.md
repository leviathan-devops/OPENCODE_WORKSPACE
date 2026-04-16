# Agent CLI Tools - Tool Specification

## Overview

Two tools: `gemini` and `qwen`. Both follow the same pattern:
- Input: Validated arguments (Zod schema)
- Output: Structured JSON with success/error/response/metadata

---

## gemini

### Description

Invoke Google Gemini CLI for coding tasks. Provides 1M token context, Google Search grounding, and structured JSON output.

### Arguments

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | - | The prompt to send to Gemini |
| `model` | `'gemini-2.5-flash' \| 'gemini-2.5-pro'` | No | `gemini-2.5-flash` | Model to use |
| `sandbox` | `boolean` | No | `false` | Run in sandboxed mode |
| `outputFormat` | `'json' \| 'text'` | No | `json` | Output format |
| `timeout` | `number` | No | `120` | Timeout in seconds |

### Zod Schema

```typescript
const geminiArgsSchema = z.object({
  prompt: z.string(),
  model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']).default('gemini-2.5-flash'),
  sandbox: z.boolean().default(false),
  outputFormat: z.enum(['json', 'text']).default('json'),
  timeout: z.number().default(120),
});
```

### Result

```typescript
interface GeminiToolResult {
  success: boolean;
  response?: string | object;
  error?: {
    code: 'TIMEOUT' | 'CLI_ERROR' | 'PARSE_ERROR' | 'INVALID_ARGS' | 'INVOCATION_ERROR';
    message: string;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    reqCount: number;
    remaining: number;
  };
}
```

### Example

**Request:**
```json
{
  "prompt": "Review this code for security issues: $(cat src/auth.ts)",
  "model": "gemini-2.5-flash",
  "timeout": 60
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "issues": [
      { "severity": "HIGH", "line": 42, "description": "SQL injection risk" }
    ]
  },
  "metadata": {
    "model": "gemini-2.5-flash",
    "tokensUsed": 2048,
    "reqCount": 1,
    "remaining": 999
  }
}
```

---

## qwen

### Description

Invoke Qwen Code CLI for coding tasks. Provides autonomous mode (--yolo), optimized code models, and structured JSON output.

### Arguments

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | `string` | Yes | - | The prompt to send to Qwen |
| `yolo` | `boolean` | No | `false` | Run without approval prompts |
| `model` | `string` | No | `qwen3-coder` | Model to use |
| `outputFormat` | `'json' \| 'text'` | No | `json` | Output format |
| `timeout` | `number` | No | `120` | Timeout in seconds |

### Zod Schema

```typescript
const qwenArgsSchema = z.object({
  prompt: z.string(),
  yolo: z.boolean().default(false),
  model: z.string().default('qwen3-coder'),
  outputFormat: z.enum(['json', 'text']).default('json'),
  timeout: z.number().default(120),
});
```

### Result

```typescript
interface QwenToolResult {
  success: boolean;
  response?: string | object;
  error?: {
    code: 'TIMEOUT' | 'CLI_ERROR' | 'PARSE_ERROR' | 'INVALID_ARGS' | 'INVOCATION_ERROR';
    message: string;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    reqCount: number;
    remaining: number;
  };
}
```

### Example

**Request:**
```json
{
  "prompt": "Refactor this module to TypeScript strict",
  "yolo": true,
  "timeout": 180
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "filesModified": 3,
    "changes": ["src/auth.ts", "src/types.ts", "src/utils.ts"]
  },
  "metadata": {
    "model": "qwen3-coder",
    "tokensUsed": 4096,
    "reqCount": 1,
    "remaining": 999
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `TIMEOUT` | CLI did not complete within timeout |
| `CLI_ERROR` | CLI exited with non-zero code |
| `PARSE_ERROR` | CLI output was not valid JSON |
| `INVALID_ARGS` | Zod validation failed |
| `INVOCATION_ERROR` | Failed to spawn CLI process |

---

## CLI Mapping

### Gemini

```bash
gemini -p "<prompt>" [-m <model>] [-s] [--output-format json]
```

| Tool Arg | CLI Flag |
|----------|----------|
| `prompt` | `-p` |
| `model` | `-m` (when not default) |
| `sandbox` | `-s` |
| `outputFormat: json` | `--output-format json` |

### Qwen

```bash
qwen -p "<prompt>" [--yolo] [-m <model>] [--output-format json]
```

| Tool Arg | CLI Flag |
|----------|----------|
| `prompt` | `-p` |
| `yolo` | `--yolo` |
| `model` | `-m` (when not default) |
| `outputFormat: json` | `--output-format json` |
