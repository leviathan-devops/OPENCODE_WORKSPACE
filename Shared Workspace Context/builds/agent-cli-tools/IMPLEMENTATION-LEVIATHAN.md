# Agent CLI Tools - Leviathan Implementation

**Document ID:** AGENT-CLI-TOOLS-IMPL-LEVIATHAN-001  
**Date:** 2026-04-03  
**Status:** Complete

---

## Build Summary

Plugin built successfully at:
```
~/OPENCODE_WORKSPACE/plugins/agent-cli-tools-leviathan/
```

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/index.ts` | 18 | Plugin entry point |
| `src/tools/types.ts` | 58 | Zod schemas and TypeScript types |
| `src/tools/gemini.ts` | 92 | Gemini CLI tool wrapper |
| `src/tools/qwen.ts` | 90 | Qwen CLI tool wrapper |
| `src/tools/index.ts` | 9 | Tool registry |
| `src/utils/cli.ts` | 90 | CLI invocation via child_process.spawn |
| `src/utils/logger.ts` | 33 | Logging utility |
| `src/utils/parse.ts` | 53 | JSON output parsing |
| `package.json` | 27 | Dependencies |
| `tsconfig.json` | 19 | TypeScript config |
| `README.md` | 85 | Documentation |

**Total:** ~480 lines of code

---

## Key Implementation Decisions

### 1. Tool Execute Returns JSON String

Per OpenCode plugin API, `execute` must return `Promise<string>`. All results are JSON-stringified.

```typescript
execute: async (args) => {
  return JSON.stringify({ success: true, response: ..., metadata: ... });
}
```

### 2. Zod Schema Uses Raw Shape

OpenCode's `tool()` expects `args: { [key: string]: ZodType }` not a pre-built ZodObject.

```typescript
args: {
  prompt: z.string(),
  model: z.enum([...]).default('gemini-2.5-flash'),
  // ...
}
```

### 3. CLI Invocation via child_process.spawn

```typescript
const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
```

Captures stdout/stderr separately. Handles timeout via `setTimeout` + `proc.kill('SIGTERM')`.

### 4. JSON Parsing Strategy

1. Try `JSON.parse()` on trimmed output
2. If success with object, check for `response` field
3. If not JSON, return raw text as `data`

### 5. Rate Limit Tracking

Fixed `DAILY_LIMIT = 1000`. Decrement `remaining` on each call. Does NOT persist across sessions.

---

## Error Handling

| Error Code | Trigger | Response |
|------------|---------|----------|
| `TIMEOUT` | CLI didn't finish in `timeout` seconds | `{ success: false, error: { code: 'TIMEOUT', message: '...' } }` |
| `CLI_ERROR` | CLI exited with non-zero | `{ success: false, error: { code: 'CLI_ERROR', message: stderr } }` |
| `PARSE_ERROR` | Output not valid JSON | `{ success: false, error: { code: 'PARSE_ERROR', message: '...' } }` |
| `INVOCATION_ERROR` | spawn() threw exception | `{ success: false, error: { code: 'INVOCATION_ERROR', message: err.message } }` |

---

## Build Verification

```bash
cd ~/OPENCODE_WORKSPACE/plugins/agent-cli-tools-leviathan
bun run build
# Output: Bundled 149 modules in 31ms
#         index.js  0.90 MB  (entry point)
```

No TypeScript errors. Declaration files generated.

---

## What Could Be Different (Spider's Choice)

Potential divergence points:
1. **Rate limit tracking** - Could persist to file/db
2. **Streaming** - Could support `--output-format stream-json`
3. **Architecture rules** - Could auto-inject `.gemini/GEMINI.md` content
4. **Parallel execution** - Could add built-in parallel tool
5. **Validation** - Could add pre-execution validation

---

## Next Steps for Testing

1. Load plugin in OpenCode
2. Verify tools appear in `/tools list`
3. Test basic invocation:
   ```
   /tool gemini {"prompt": "What is 2+2?"}
   /tool qwen {"prompt": "What is 2+2?"}
   ```
4. Test timeout handling
5. Test error cases (invalid args, CLI not found, etc.)
