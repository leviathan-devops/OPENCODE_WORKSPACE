# glob

Find files by glob patterns (name-based, not content search).

## Tool Definition

**Tool Name:** `glob`
**Source:** `vanilla-source/packages/opencode/src/tool/glob.ts`

## Arguments Schema (Zod)

```typescript
{
  pattern: string             // Glob pattern to match (e.g., "**/*.js", "src/**/*.ts") (required)
  path?: string               // Directory to search in (optional, defaults to project directory)
}
```

## What It Does

Fast file pattern matching using ripgrep's glob functionality:

- Supports standard glob patterns (`*`, `**`, `?`, `[abc]`)
- Searches recursively with `**`
- Returns absolute paths sorted by modification time (newest first)
- Limits results to 100 files

## Permission Required

- `glob` permission with pattern and path

## Truncation Handling

- **Limited to 100 results** - If more matches exist, returns first 100 sorted by mtime
- Message indicates truncation: `(Results are truncated: showing first 100 results. Consider using a more specific path or pattern.)`

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "glob",
  "parameters": {
    "pattern": "**/*.ts"
  }
}
```

```json
{
  "tool": "glob",
  "parameters": {
    "pattern": "src/**/*.js",
    "path": "/path/to/project"
  }
}
```

## Common Patterns

| Pattern | Meaning |
|---------|---------|
| `*.ts` | All .ts files in root |
| `**/*.ts` | All .ts files recursively |
| `src/**/*` | All files in src directory |
| `**/*.test.ts` | Test files |
| `**/node_modules/**` | Exclude node_modules |

## Output Format

Returns:
- `title`: The search path/directory
- `output`: Newline-separated list of file paths
- `metadata.count`: Number of matches
- `metadata.truncated`: Boolean indicating truncation
