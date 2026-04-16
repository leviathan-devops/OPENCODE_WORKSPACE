# Agent CLI Tools - Implementation Notes

## How Each Component Was Built

### 1. Types & Schemas (`src/tools/types.ts`)
- Zod schemas define the shape of both tool inputs and outputs
- `GeminiArgsSchema`: prompt (required), model (enum with default), sandbox (boolean default false), outputFormat (enum default json), timeout (number 1-600, default 120)
- `QwenArgsSchema`: prompt (required), yolo (boolean default false), model (string default qwen3-coder), outputFormat, timeout
- Shared types: `CliError`, `CliMetadata`, `ErrorCode` constants
- Zod 4.x compatibility: uses `.issues` on ZodError, not `.errors`

### 2. CLI Invoker (`src/utils/cli.ts`)
- Uses `child_process.spawn` with `stdio: ['ignore', 'pipe', 'pipe']`
- Captures stdout and stderr as strings via data event accumulation
- Timeout via `setTimeout` → `SIGTERM` → 2s grace → `SIGKILL`
- Returns structured `CliResult` with optional error field
- Handles spawn errors (command not found) with `INVOCATION_ERROR`

### 3. JSON Parser (`src/utils/parse.ts`)
- Simple `JSON.parse` wrapper with error catching
- Returns `{ success, data }` or `{ success: false, error }`
- Empty output treated as parse error

### 4. Logger (`src/utils/logger.ts`)
- Adapted from boilerplate pattern
- Leveled logging (debug/info/warn/error)
- `createLogger(prefix)` factory for namespaced loggers
- Default prefix: `AgentCLITools`

### 5. Gemini Tool (`src/tools/gemini.ts`)
- Uses `toolFn` from `@opencode-ai/plugin`
- Validates args with `GeminiArgsSchema.safeParse()`
- Builds CLI arg array: `-p <prompt>`, `-m <model>` (if not default), `-s` (if sandbox), `--output-format json`
- Returns `GeminiResult` as JSON string
- All 5 error codes handled

### 6. Qwen Tool (`src/tools/qwen.ts`)
- Same pattern as Gemini tool
- CLI arg array: `-p <prompt>`, `--yolo` (if enabled), `-m <model>` (if not default), `--output-format json`
- Returns `QwenResult` as JSON string

### 7. Plugin Entry (`src/index.ts`)
- `export default async function AgentCLITools(): Promise<Hooks>`
- Returns `{ tool: { gemini, qwen } }`
- No hooks, no event handlers — pure tool registration

## Build Process
- `bun build` bundles all modules into single `dist/index.js` (0.46 MB)
- `tsc --emitDeclarationOnly` generates `dist/index.d.ts`
- `tsc --noEmit` for type checking (zero errors)

## Key Challenges
- Zod 4.x API differences: `.issues` vs `.errors` on ZodError
- `bun build --bundle` doesn't generate `.d.ts` files — requires separate `tsc --emitDeclarationOnly`
- Type assertions needed for `parsed_output.data` to satisfy `string | Record<string, unknown>` union
