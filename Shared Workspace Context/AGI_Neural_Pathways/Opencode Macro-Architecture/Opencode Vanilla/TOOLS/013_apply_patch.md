# apply_patch

Apply unified diff patches to multiple files (GPT-only).

## Tool Definition

**Tool Name:** `apply_patch`
**Source:** `vanilla-source/packages/opencode/src/tool/apply_patch.ts`

## Arguments Schema (Zod)

```typescript
{
  patchText: string           // Full patch text describing all changes (required)
}
```

## What It Does

Applies high-level diff patches with support for:

- **Add files** - Create new files
- **Update files** - Patch existing files in place
- **Delete files** - Remove files
- **Move files** - Rename/move files with content

Uses unified diff format with special headers.

## Permission Required

- `edit` permission for affected file paths

## Truncation Handling

No truncation - applies full patch as provided.

## Model-Specific Behavior

**GPT only:** This tool is only available when using GPT models

## Patch Format

```
*** Begin Patch
*** Add File: <path>
+new file contents
*** Update File: <path>
*** Move to: <new-path>  (optional, for rename)
@@ context hint @@
-old line
+new line
*** Delete File: <path>
*** End Patch
```

## Example Usage

```json
{
  "tool": "apply_patch",
  "parameters": {
    "patchText": "*** Begin Patch\n*** Add File: hello.txt\n+Hello world\n*** Update File: src/app.py\n@@ def greet():\n-print(\"Hi\")\n+print(\"Hello, world!\")\n*** End Patch"
  }
}
```

## Key Behaviors

1. **Parse patch first** - Validates patch format before applying
2. **Atomic operations** - All file changes are validated together
3. **Hunk requirement** - Must have at least one valid hunk
4. **Line prefix required** - New lines must be prefixed with `+`
5. **LSP integration** - Triggers formatting and diagnostics

## Operation Types

| Type | Description |
|------|-------------|
| `Add File` | Creates a new file |
| `Update File` | Patches existing file |
| `Move to` | Renames/moves file |
| `Delete File` | Removes file |

## Output Format

Returns:
- `title`: Success message with changed files
- `output`: Summary of changes (A=add, M=modify, D=delete)
- `metadata.diff`: Full unified diff
- `metadata.files`: Per-file details
- `metadata.diagnostics`: LSP errors if any

## Error Handling

- "patch rejected: empty patch" - Empty patch text
- "no hunks found" - Invalid patch format
- "Failed to read file to update" - File doesn't exist for update
- LSP errors reported after patch application
