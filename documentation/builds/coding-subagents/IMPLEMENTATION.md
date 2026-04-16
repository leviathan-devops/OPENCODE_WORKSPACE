# Coding Subagents - Implementation Notes

## Build Status

✅ **TypeScript:** 0 errors
✅ **Bundle:** 0.46 MB
✅ **Ready for deployment**

## How Each Component Was Built

### 1. Types & Schemas (`src/tools/types.ts`)

- Zod schemas for both tool inputs and outputs
- `GemmaArgsSchema`: prompt (required), model (enum: gemma-4-31b-it default), outputFormat, timeout
- `QwenArgsSchema`: prompt (required), yolo (boolean default false), model, outputFormat, timeout
- Shared: `CliError`, `CliMetadata`, `ErrorCode` constants
- Zod 4.x: uses `.issues` on ZodError, not `.errors`

### 2. Gemma Tool (`src/tools/gemma.ts`)

**Key difference from Spider's `gemini.ts`:**
- Uses `https.request` to call proxy directly
- No OAuth required
- Hardcoded to `gemma-4-31b-it` (the dense model)
- Direct JSON response extraction from `candidates[0].content.parts[0].text`

**Implementation:**
```typescript
const req = https.request({
  hostname: 'shark-gemini-proxy-production.up.railway.app',
  path: `/v1beta/models/${modelPath}:generateContent?key=${API_KEY}`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
  timeout: timeoutMs,
}, (res) => {
  // Collect response, parse JSON, extract text
});
```

### 3. Qwen Tool (`src/tools/qwen.ts`)

**Identical to Spider's `qwen.ts`:**
- Uses `invokeCli` to spawn `qwen` CLI
- Same argument parsing: `-p`, `--yolo`, `-m`, `--output-format json`
- Same error handling pattern
- Same Zod validation

### 4. Plugin Entry (`src/index.ts`)

- `export default async function CodingSubagents(): Promise<Hooks>`
- Returns `{ tool: { gemma, qwen } }`
- No hooks, no events — pure tool registration

## Key Differences from Spider's Build

| Aspect | Spider's `agent-cli-tools` | Our `coding-subagents` |
|--------|----------------------------|------------------------|
| Gemini tool | Spawns `gemini` CLI | Direct HTTPS to proxy |
| Authentication | OAuth required | API key (headless) |
| Model | `gemini-2.5-flash` (quota exhausted) | `gemma-4-31b-it` (working) |
| Tool count | 2 tools | 2 tools |
| Architecture | `invokeCli` utility | HTTPS + `invokeCli` |

## Build Process

```bash
npm install
npm run typecheck  # tsc --noEmit
npm run build       # bun build → dist/index.js
```

## Testing

### Gemma (via proxy):
```bash
curl -X POST "https://shark-gemini-proxy-production.up.railway.app/v1beta/models/gemma-4-31b-it:generateContent" \
  -H "x-goog-api-key: AIzaSyCdzysjAXh0vmzn4vOKuMSWx1dGIjP44Z4" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Say hi in 3 words"}]}]}'
```

### Qwen (CLI):
```bash
qwen -p "Say hi in 3 words" --output-format json
```

## File Count

| File | Lines | Purpose |
|------|-------|---------|
| `src/tools/gemma.ts` | ~100 | Gemma HTTPS proxy wrapper |
| `src/tools/qwen.ts` | 87 | Qwen CLI spawn wrapper |
| `src/tools/types.ts` | 77 | Zod schemas + types |
| `src/tools/index.ts` | 17 | Tool registry |
| `src/index.ts` | 32 | Plugin entry point |
| `src/utils/cli.ts` | 100 | CLI spawn utility |
| `src/utils/logger.ts` | ~50 | Logging utility |
| `src/utils/parse.ts` | ~30 | JSON parser |
| **Total** | **~493** | |
