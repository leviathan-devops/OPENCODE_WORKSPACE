# edit

Perform exact string replacements in files using multiple matching strategies.

## Tool Definition

**Tool Name:** `edit`
**Source:** `vanilla-source/packages/opencode/src/tool/edit.ts`

## Arguments Schema (Zod)

```typescript
{
  filePath: string            // Absolute path to file to modify (required)
  oldString: string           // The text to replace (required)
  newString: string           // The replacement text (required, must differ from oldString)
  replaceAll?: boolean        // Replace all occurrences (optional, default: false)
}
```

## What It Does

Performs text replacement with sophisticated matching strategies:

1. **Simple match** - Direct string matching
2. **Line-trimmed match** - Matches ignoring leading/trailing whitespace
3. **Block anchor match** - Uses first/last lines as anchors, Levenshtein similarity for middle
4. **Whitespace-normalized match** - Normalizes all whitespace
5. **Indentation-flexible match** - Handles different indentation levels
6. **Escape-normalized match** - Handles escaped characters

The tool also:
- Preserves original line endings (LF vs CRLF)
- Handles empty oldString (append mode)
- Reports LSP errors after edit

## Permission Required

- `edit` permission for the file path

## Truncation Handling

No truncation of the replacement itself, but file read is subject to the 50KB limit.

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "edit",
  "parameters": {
    "filePath": "/path/to/file.ts",
    "oldString": "const oldValue = 1;",
    "newString": "const newValue = 2;"
  }
}
```

```json
{
  "tool": "edit",
  "parameters": {
    "filePath": "/path/to/file.ts",
    "oldString": "// TODO: old comment",
    "newString": "// TODO: new comment",
    "replaceAll": true
  }
}
```

## Key Behaviors

1. **MUST read before editing** - File must be read first in the conversation
2. **Preserve indentation** - Match exact indentation from read output
3. **Unique match required** - If oldString appears multiple times, provide more context
4. **Line endings preserved** - Automatically detects and preserves CRLF/LF
5. **Multiple strategies** - Falls back to increasingly flexible matching

## Output Format

Returns:
- `title`: Relative path to the edited file
- `output`: "Edit applied successfully." plus any LSP diagnostics
- `metadata.diff`: Unified diff of changes
- `metadata.filediff`: Statistics (additions, deletions)
- `metadata.diagnostics`: LSP errors if any

## Matching Strategy Details

The tool uses 6 matching strategies in order:
1. `SimpleReplacer` - Exact string match
2. `LineTrimmedReplacer` - Trim whitespace before comparing
3. `BlockAnchorReplacer` - First/last line anchors, similarity for middle
4. `WhitespaceNormalizedReplacer` - Normalize all whitespace
5. `IndentationFlexibleReplacer` - Handle different indentation
6. `EscapeNormalizedReplacer` - Handle escape sequences
