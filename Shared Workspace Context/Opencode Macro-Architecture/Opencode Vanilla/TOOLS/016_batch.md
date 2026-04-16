# batch

Execute multiple independent tool calls concurrently.

## Tool Definition

**Tool Name:** `batch`
**Source:** `vanilla-source/packages/opencode/src/tool/batch.ts`

## Arguments Schema (Zod)

```typescript
{
  tool_calls: array            // Array of tool calls to execute (min: 1, max: 25)
}
```

Each tool call:
```typescript
{
  tool: string                 // Name of the tool to execute
  parameters: object           // Parameters for the tool
}
```

## What It Does

Executes multiple tool calls in parallel:

- **Concurrency** - All tools start simultaneously
- **No ordering guarantee** - Results may arrive in any order
- **Partial failure handling** - Failures don't stop other calls
- **Up to 25 tools** - Exceeding 25 is rejected
- **Progress tracking** - Each tool has individual status

## Permission Required

- All individual tool permissions apply to their respective calls

## Truncation Handling

- Limited to 25 tool calls per batch
- Calls beyond 25 are rejected with error

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "batch",
  "parameters": {
    "tool_calls": [
      {
        "tool": "read",
        "parameters": {"filePath": "/path/to/file1.ts", "limit": 350}
      },
      {
        "tool": "grep",
        "parameters": {"pattern": "Session\\.updatePart", "include": "src/**/*.ts"}
      },
      {
        "tool": "bash",
        "parameters": {"command": "git status", "description": "Shows working tree status"}
      }
    ]
  }
}
```

## Good Use Cases

- Reading multiple files
- Combined grep + glob + read operations
- Multiple bash commands
- Multi-part edits on same or different files

## When NOT to Use

- Operations depending on prior tool output
- Ordered stateful mutations where sequence matters
- Nested batch calls (not allowed)

## Disallowed Tools

Cannot be batched:
- `batch` itself (prevents recursion)

Also filtered:
- `invalid`, `patch` (internal tools)

## Output Format

Returns:
- `title`: "Batch execution (N/M successful)"
- `output`: Summary message
- `attachments`: Attachments from successful calls
- `metadata.totalCalls`: Total number of calls
- `metadata.successful`: Successful call count
- `metadata.failed`: Failed call count
- `metadata.tools`: Array of tool names
- `metadata.details`: Per-call success/failure

## Per-Call Status

Each tool call in the batch records:
- `status`: "running" | "completed" | "error"
- `input`: Parameters provided
- `output` or `error`: Result or error message
- `time.start` and `time.end`: Execution timing

## Key Behaviors

1. **Parallel execution** - All tools start at once
2. **Results may be interleaved** - Order not guaranteed
3. **Individual errors** - Failed calls don't affect others
4. **No nesting** - Cannot batch within a batch
5. **2-5x efficiency gain** - Proven performance improvement
