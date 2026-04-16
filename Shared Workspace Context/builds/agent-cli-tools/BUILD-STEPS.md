# Agent CLI Tools - Build Steps

**Document ID:** AGENT-CLI-TOOLS-STEPS-001  
**Date:** 2026-04-03  
**Status:** Ready to Execute

---

## Prerequisites

Verify these are available before starting:

```bash
# Check Node.js
node --version  # Must be >= 20.0.0

# Check bun
bun --version   # Must be >= 1.0.0

# Check Gemini CLI
gemini --version

# Check Qwen CLI  
qwen --version

# Verify both CLIs work with JSON output
echo "test" | gemini -p "echo this back" --output-format json
echo "test" | qwen -p "echo this back" --output-format json
```

---

## STEP 1: Create Directory Structure

```bash
mkdir -p ~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/{tools,utils}
mkdir -p ~/hermes-workspace/context/builds/agent-cli-tools/context
```

---

## STEP 2: Create package.json

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/package.json`

```json
{
  "name": "agent-cli-tools",
  "version": "0.1.0",
  "description": "Universal Gemini and Qwen CLI tools for OpenCode",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "engines": {
    "bun": ">=1.0.0",
    "node": ">=20.0.0"
  },
  "scripts": {
    "clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\"",
    "build": "bun build src/index.ts --outdir dist --target bun --format esm && tsc --emitDeclarationOnly",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "peerDependencies": {
    "@opencode-ai/plugin": "^1.1.53",
    "@opencode-ai/sdk": "^1.1.53"
  },
  "dependencies": {
    "zod": "^4.1.8"
  },
  "devDependencies": {
    "@opencode-ai/plugin": "^1.1.53",
    "@opencode-ai/sdk": "^1.1.53",
    "@types/bun": "^1.3.11",
    "@types/node": "^22.19.15",
    "bun-types": "latest",
    "typescript": "^5.7.3"
  }
}
```

---

## STEP 3: Create tsconfig.json

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## STEP 4: Create Types (src/tools/types.ts)

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/tools/types.ts`

```typescript
import { z } from 'zod';

// ============ GEMINI ============

export const geminiArgsSchema = z.object({
  prompt: z.string().describe('The prompt to send to Gemini'),
  model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']).default('gemini-2.5-flash'),
  sandbox: z.boolean().default(false).describe('Run in sandboxed mode'),
  outputFormat: z.enum(['json', 'text']).default('json'),
  timeout: z.number().default(120).describe('Timeout in seconds'),
});

export type GeminiArgs = z.infer<typeof geminiArgsSchema>;

export interface GeminiMetadata {
  model: string;
  tokensUsed?: number;
  reqCount: number;
  remaining: number;
}

export interface GeminiToolResult {
  success: boolean;
  response?: string | object;
  error?: {
    code: string;
    message: string;
  };
  metadata: GeminiMetadata;
}

// ============ QWEN ============

export const qwenArgsSchema = z.object({
  prompt: z.string().describe('The prompt to send to Qwen'),
  yolo: z.boolean().default(false).describe('Run without approval prompts'),
  model: z.string().default('qwen3-coder').describe('Model to use'),
  outputFormat: z.enum(['json', 'text']).default('json'),
  timeout: z.number().default(120).describe('Timeout in seconds'),
});

export type QwenArgs = z.infer<typeof qwenArgsSchema>;

export interface QwenMetadata {
  model: string;
  tokensUsed?: number;
  reqCount: number;
  remaining: number;
}

export interface QwenToolResult {
  success: boolean;
  response?: string | object;
  error?: {
    code: string;
    message: string;
  };
  metadata: QwenMetadata;
}
```

---

## STEP 5: Create CLI Invocation Utility (src/utils/cli.ts)

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/utils/cli.ts`

```typescript
import { spawn } from 'child_process';
import { logger } from './logger.js';

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

export async function invokeCli(
  command: string,
  args: string[],
  options: { timeout?: number; cwd?: string } = {}
): Promise<CliResult> {
  const timeout = options.timeout ?? 120;

  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGTERM');
    }, timeout * 1000);

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
        timedOut,
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      stderr += err.message;
      resolve({
        stdout,
        stderr,
        exitCode: 1,
        timedOut,
      });
    });
  });
}

export function buildGeminiArgs(args: {
  prompt: string;
  model?: string;
  sandbox?: boolean;
  outputFormat?: string;
}): string[] {
  const cmdArgs: string[] = ['-p', args.prompt];

  if (args.model && args.model !== 'gemini-2.5-flash') {
    cmdArgs.push('-m', args.model);
  }

  if (args.sandbox) {
    cmdArgs.push('-s');
  }

  if (args.outputFormat === 'json') {
    cmdArgs.push('--output-format', 'json');
  }

  return cmdArgs;
}

export function buildQwenArgs(args: {
  prompt: string;
  yolo?: boolean;
  model?: string;
  outputFormat?: string;
}): string[] {
  const cmdArgs: string[] = ['-p', args.prompt];

  if (args.yolo) {
    cmdArgs.push('--yolo');
  }

  if (args.model && args.model !== 'qwen3-coder') {
    cmdArgs.push('-m', args.model);
  }

  if (args.outputFormat === 'json') {
    cmdArgs.push('--output-format', 'json');
  }

  return cmdArgs;
}
```

---

## STEP 6: Create Logger Utility (src/utils/logger.ts)

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/utils/logger.ts`

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, meta?: object): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) {
    return;
  }

  const prefix = `[${formatTimestamp()}] [${level.toUpperCase()}]`;

  if (meta) {
    console.log(`${prefix} ${message}`, meta);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (msg: string, meta?: object) => log('debug', msg, meta),
  info: (msg: string, meta?: object) => log('info', msg, meta),
  warn: (msg: string, meta?: object) => log('warn', msg, meta),
  error: (msg: string, meta?: object) => log('error', msg, meta),
};
```

---

## STEP 7: Create JSON Parsing Utility (src/utils/parse.ts)

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/utils/parse.ts`

```typescript
export interface ParseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rawText?: string;
}

export function parseJsonOutput<T = unknown>(output: string): ParseResult<T> {
  const trimmed = output.trim();

  if (!trimmed) {
    return { success: false, error: 'Empty output' };
  }

  // Try direct JSON parse
  try {
    const data = JSON.parse(trimmed);
    return { success: true, data };
  } catch {
    // Not JSON, return as raw text
    return { success: true, data: trimmed as T, rawText: trimmed };
  }
}

export function extractGeminiResponse(output: string): ParseResult {
  // Gemini CLI outputs JSON with a "response" field
  const parsed = parseJsonOutput(output);

  if (parsed.success && parsed.data && typeof parsed.data === 'object') {
    const obj = parsed.data as Record<string, unknown>;
    if (obj.response) {
      return { success: true, data: obj.response };
    }
    // Return the whole object if no response field
    return { success: true, data: obj };
  }

  return parsed;
}

export function extractQwenResponse(output: string): ParseResult {
  // Qwen CLI outputs JSON with a "response" field
  const parsed = parseJsonOutput(output);

  if (parsed.success && parsed.data && typeof parsed.data === 'object') {
    const obj = parsed.data as Record<string, unknown>;
    if (obj.response) {
      return { success: true, data: obj.response };
    }
    return { success: true, data: obj };
  }

  return parsed;
}

export function buildErrorResponse(code: string, message: string) {
  return {
    success: false,
    error: { code, message },
    metadata: {
      model: 'unknown',
      reqCount: 0,
      remaining: 0,
    },
  };
}
```

---

## STEP 8: Create Gemini Tool (src/tools/gemini.ts)

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/tools/gemini.ts`

```typescript
import { tool as toolFn } from '@opencode-ai/plugin';
import { z } from 'zod';
import { geminiArgsSchema, type GeminiToolResult } from './types.js';
import { invokeCli, buildGeminiArgs } from '../utils/cli.js';
import { extractGeminiResponse, buildErrorResponse } from '../utils/parse.js';
import { logger } from '../utils/logger.js';

export function createGeminiTool() {
  return toolFn({
    description: 'Invoke Google Gemini CLI for coding tasks. Provides 1M token context, search grounding, and structured JSON output.',
    args: {
      prompt: z.string().describe('The prompt to send to Gemini'),
      model: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']).default('gemini-2.5-flash').describe('Model to use'),
      sandbox: z.boolean().default(false).describe('Run in sandboxed mode'),
      outputFormat: z.enum(['json', 'text']).default('json').describe('Output format'),
      timeout: z.number().default(120).describe('Timeout in seconds'),
    },
    execute: async (args): Promise<GeminiToolResult> => {
      const parsed = geminiArgsSchema.safeParse(args);
      if (!parsed.success) {
        logger.error('Invalid gemini args', { error: parsed.error });
        return buildErrorResponse('INVALID_ARGS', parsed.error.message) as GeminiToolResult;
      }

      const validArgs = parsed.data;
      const cmdArgs = buildGeminiArgs({
        prompt: validArgs.prompt,
        model: validArgs.model,
        sandbox: validArgs.sandbox,
        outputFormat: validArgs.outputFormat,
      });

      logger.debug('Invoking gemini', { args: cmdArgs });

      try {
        const result = await invokeCli('gemini', cmdArgs, { timeout: validArgs.timeout });

        if (result.timedOut) {
          logger.warn('Gemini timed out', { timeout: validArgs.timeout });
          return {
            success: false,
            error: { code: 'TIMEOUT', message: `Gemini timed out after ${validArgs.timeout}s` },
            metadata: { model: validArgs.model, reqCount: 1, remaining: 999 },
          };
        }

        if (result.exitCode !== 0) {
          logger.error('Gemini CLI error', { stderr: result.stderr, exitCode: result.exitCode });
          return {
            success: false,
            error: { code: 'CLI_ERROR', message: result.stderr || 'Unknown CLI error' },
            metadata: { model: validArgs.model, reqCount: 1, remaining: 999 },
          };
        }

        const extracted = extractGeminiResponse(result.stdout);

        if (!extracted.success) {
          return {
            success: false,
            error: { code: 'PARSE_ERROR', message: extracted.error || 'Failed to parse output' },
            metadata: { model: validArgs.model, reqCount: 1, remaining: 999 },
          };
        }

        return {
          success: true,
          response: extracted.data,
          metadata: { model: validArgs.model, reqCount: 1, remaining: 999 },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Gemini invocation failed', { error: message });
        return {
          success: false,
          error: { code: 'INVOCATION_ERROR', message },
          metadata: { model: validArgs.model, reqCount: 0, remaining: 0 },
        };
      }
    },
  });
}
```

---

## STEP 9: Create Qwen Tool (src/tools/qwen.ts)

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/tools/qwen.ts`

```typescript
import { tool as toolFn } from '@opencode-ai/plugin';
import { z } from 'zod';
import { qwenArgsSchema, type QwenToolResult } from './types.js';
import { invokeCli, buildQwenArgs } from '../utils/cli.js';
import { extractQwenResponse, buildErrorResponse } from '../utils/parse.js';
import { logger } from '../utils/logger.js';

export function createQwenTool() {
  return toolFn({
    description: 'Invoke Qwen Code CLI for coding tasks. Provides autonomous mode (--yolo), optimized code models, and structured JSON output.',
    args: {
      prompt: z.string().describe('The prompt to send to Qwen'),
      yolo: z.boolean().default(false).describe('Run without approval prompts'),
      model: z.string().default('qwen3-coder').describe('Model to use'),
      outputFormat: z.enum(['json', 'text']).default('json').describe('Output format'),
      timeout: z.number().default(120).describe('Timeout in seconds'),
    },
    execute: async (args): Promise<QwenToolResult> => {
      const parsed = qwenArgsSchema.safeParse(args);
      if (!parsed.success) {
        logger.error('Invalid qwen args', { error: parsed.error });
        return buildErrorResponse('INVALID_ARGS', parsed.error.message) as QwenToolResult;
      }

      const validArgs = parsed.data;
      const cmdArgs = buildQwenArgs({
        prompt: validArgs.prompt,
        yolo: validArgs.yolo,
        model: validArgs.model,
        outputFormat: validArgs.outputFormat,
      });

      logger.debug('Invoking qwen', { args: cmdArgs });

      try {
        const result = await invokeCli('qwen', cmdArgs, { timeout: validArgs.timeout });

        if (result.timedOut) {
          logger.warn('Qwen timed out', { timeout: validArgs.timeout });
          return {
            success: false,
            error: { code: 'TIMEOUT', message: `Qwen timed out after ${validArgs.timeout}s` },
            metadata: { model: validArgs.model, reqCount: 1, remaining: 999 },
          };
        }

        if (result.exitCode !== 0) {
          logger.error('Qwen CLI error', { stderr: result.stderr, exitCode: result.exitCode });
          return {
            success: false,
            error: { code: 'CLI_ERROR', message: result.stderr || 'Unknown CLI error' },
            metadata: { model: validArgs.model, reqCount: 1, remaining: 999 },
          };
        }

        const extracted = extractQwenResponse(result.stdout);

        if (!extracted.success) {
          return {
            success: false,
            error: { code: 'PARSE_ERROR', message: extracted.error || 'Failed to parse output' },
            metadata: { model: validArgs.model, reqCount: 1, remaining: 999 },
          };
        }

        return {
          success: true,
          response: extracted.data,
          metadata: { model: validArgs.model, reqCount: 1, remaining: 999 },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Qwen invocation failed', { error: message });
        return {
          success: false,
          error: { code: 'INVOCATION_ERROR', message },
          metadata: { model: validArgs.model, reqCount: 0, remaining: 0 },
        };
      }
    },
  });
}
```

---

## STEP 10: Create Tool Registry (src/tools/index.ts)

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/tools/index.ts`

```typescript
import { createGeminiTool } from './gemini.js';
import { createQwenTool } from './qwen.js';

export { createGeminiTool, createQwenTool };

export function createToolRegistry() {
  return {
    gemini: createGeminiTool(),
    qwen: createQwenTool(),
  };
}
```

---

## STEP 11: Create Plugin Entry Point (src/index.ts)

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/src/index.ts`

```typescript
import type { Hooks } from '@opencode-ai/plugin';
import { createToolRegistry } from './tools/index.js';
import { logger, setLogLevel } from './utils/logger.js';

const PLUGIN_NAME = 'AgentCliTools';
const PLUGIN_VERSION = '0.1.0';

export default async function AgentCliTools(): Promise<Hooks> {
  logger.info(`${PLUGIN_NAME} v${PLUGIN_VERSION} initializing`);

  const tools = createToolRegistry();

  logger.info(`${PLUGIN_NAME} initialized`, {
    toolCount: Object.keys(tools).length,
    tools: Object.keys(tools),
  });

  return {
    tool: tools,
  };
}
```

---

## STEP 12: Install Dependencies

```bash
cd ~/OPENCODE_WORKSPACE/plugins/agent-cli-tools
bun install
```

---

## STEP 13: Build Plugin

```bash
cd ~/OPENCODE_WORKSPACE/plugins/agent-cli-tools
bun run build
```

Expected output:
- `dist/index.js` created
- `dist/index.d.ts` created
- No TypeScript errors

---

## STEP 14: Create Context Library Files

**File:** `~/hermes-workspace/context/builds/agent-cli-tools/context/PURPOSE.md`

```markdown
# Agent CLI Tools - Purpose

## Why This Exists

Gemini CLI and Qwen Code CLI provide free coding agent capabilities:
- Gemini: 1000 req/day, 1M token context, Google Search grounding
- Qwen: 1000 req/day, autonomous mode (--yolo), optimized code models

The SKILL.md documents manual usage via bash. This plugin makes them
first-class OpenCode tools available to any agent.

## Design Goals

1. **Universal** - Any agent can call these tools
2. **Structured** - JSON output by default, parseable
3. **Resilient** - Timeout, fallbacks, structured errors
4. **Composable** - Chainable, parallelizable
5. **Minimal** - CLI wrapper, not a framework
```

**File:** `~/hermes-workspace/context/builds/agent-cli-tools/context/DESIGN.md`

```markdown
# Agent CLI Tools - Design

## Architecture

Plugin registers two tools: `gemini` and `qwen`.
Each tool wraps the respective CLI with:
- Zod validation for args
- Child process spawn for invocation
- JSON parsing for output
- Structured error handling

## Tool Comparison

| Feature | Gemini CLI | Qwen Code |
|---------|------------|-----------|
| Free tier | 1000 req/day | 1000 req/day |
| Context | 1M tokens | ~128k tokens |
| Search grounding | Yes | No |
| Autonomous mode | Sandbox | --yolo |
| Architecture rules | .gemini/GEMINI.md | .qwen/QWEN.md |
| Structured output | --output-format json | --output-format json |

## Security

- Sandbox mode for Gemini (`-s`) for untrusted code
- `--yolo` for Qwen = no approval prompts
- Architecture rules via context files
- No secrets in prompts
```

**File:** `~/hermes-workspace/context/builds/agent-cli-tools/context/TOOL-SPEC.md`

```markdown
# Agent CLI Tools - Tool Specification

## gemini

```typescript
gemini({
  prompt: string,           // Required
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro',  // Default: flash
  sandbox?: boolean,       // Default: false
  outputFormat?: 'json' | 'text',  // Default: json
  timeout?: number        // Default: 120
})
```

Returns:
```typescript
{
  success: boolean,
  response?: string | object,
  error?: { code: string, message: string },
  metadata: { model: string, tokensUsed?: number, reqCount: number, remaining: number }
}
```

## qwen

```typescript
qwen({
  prompt: string,           // Required
  yolo?: boolean,          // Default: false
  model?: string,           // Default: qwen3-coder
  outputFormat?: 'json' | 'text',  // Default: json
  timeout?: number         // Default: 120
})
```

Returns:
```typescript
{
  success: boolean,
  response?: string | object,
  error?: { code: string, message: string },
  metadata: { model: string, tokensUsed?: number, reqCount: number, remaining: number }
}
```
```

**File:** `~/hermes-workspace/context/builds/agent-cli-tools/context/EXAMPLES.md`

```markdown
# Agent CLI Tools - Examples

## Single Call

```
gemini({"prompt": "Review this code for security issues: $(cat src/auth.ts)"})
qwen({"prompt": "Refactor this to TypeScript strict", "yolo": true})
```

## Parallel Review

```javascript
const [security, quality, performance] = await Promise.all([
  gemini({ prompt: "Security review", model: "gemini-2.5-flash" }),
  qwen({ prompt: "Best practices review" }),
  gemini({ prompt: "Performance review", model: "gemini-2.5-pro" }),
]);
```

## Sequential Refinement

```javascript
const analysis = await gemini({ prompt: "Analyze and list issues by severity" });
const fixes = await qwen({ prompt: "Fix CRITICAL/HIGH issues", yolo: true });
const validation = await gemini({ prompt: "Validate fixes" });
```

## Research + Execution

```javascript
const research = await gemini({ prompt: "Best practices for auth" });
const implementation = await qwen({ prompt: "Implement auth", yolo: true });
```
```

---

## STEP 15: Create README.md

**File:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/README.md`

```markdown
# Agent CLI Tools

Universal Gemini and Qwen CLI tools for OpenCode.

## Features

- **Gemini CLI** - 1000 req/day, 1M token context, Search grounding
- **Qwen Code** - 1000 req/day, autonomous mode (--yolo)
- **Universal** - Available to any OpenCode agent
- **Structured** - JSON output by default

## Installation

```bash
cd ~/OPENCODE_WORKSPACE/plugins/agent-cli-tools
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
| model | enum | flash | gemini-2.5-flash or gemini-2.5-pro |
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
```

---

## Verification Commands

```bash
# Test CLI tools work
echo "test" | gemini -p "echo back" --output-format json
echo "test" | qwen -p "echo back" --output-format json

# Build plugin
cd ~/OPENCODE_WORKSPACE/plugins/agent-cli-tools
bun run build

# Check dist/
ls -la dist/
```

---

*Document ID: AGENT-CLI-TOOLS-STEPS-001*
*Status: Ready to Execute*
