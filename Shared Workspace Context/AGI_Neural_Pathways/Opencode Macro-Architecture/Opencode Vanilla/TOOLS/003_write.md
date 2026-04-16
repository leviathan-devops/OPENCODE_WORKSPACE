# write

Write content to a file, creating new files or overwriting existing ones.

## Tool Definition

**Tool Name:** `write`
**Source:** `vanilla-source/packages/opencode/src/tool/write.ts`

## Arguments Schema (Zod)

```typescript
{
  content: string             // The content to write to the file (required)
  filePath: string            // Absolute path to the file (required)
}
```

## What It Does

Writes files to the filesystem with the following features:

- **Creates parent directories** - Automatically creates necessary parent directories
- **Existing file check** - Reads old content and generates a diff for approval
- **LSP integration** - Triggers formatting and diagnostics after write
- **File watching** - Publishes file change events for hot reload support
- **Diagnostics reporting** - Reports LSP errors after write

## Permission Required

- `edit` permission for the file path

## Truncation Handling

No truncation - writes the full content provided.

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "write",
  "parameters": {
    "content": "Hello, world!\n",
    "filePath": "/path/to/file.txt"
  }
}
```

## Key Behaviors

1. **MUST read before overwriting** - If file exists, you must read it first
2. **Absolute paths** - Relative paths are resolved against project directory
3. **Creates directories** - Parent directories are created automatically
4. **Triggers formatting** - Calls LSP formatter after write
5. **Reports diagnostics** - Shows LSP errors if any

## Output Format

Returns:
- `title`: Relative path to the file
- `output`: "Wrote file successfully." plus any LSP diagnostics
- `metadata`: Diagnostics, filepath, exists flag

## Error Handling

If LSP reports errors in the file or other project files, these are included in the output for correction.
