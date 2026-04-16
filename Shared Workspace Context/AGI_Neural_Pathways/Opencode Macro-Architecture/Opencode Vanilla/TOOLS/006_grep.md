# grep

Search file contents using regular expressions.

## Tool Definition

**Tool Name:** `grep`
**Source:** `vanilla-source/packages/opencode/src/tool/grep.ts`

## Arguments Schema (Zod)

```typescript
{
  pattern: string             // Regex pattern to search (required)
  path?: string               // Directory to search in (optional, defaults to project directory)
  include?: string            // File pattern filter (e.g., "*.js", "*.{ts,tsx}") (optional)
}
```

## What It Does

Content search using ripgrep with full regex support:

- Full Perl-compatible regex (PCRE) syntax
- Searches all hidden files
- Returns file paths, line numbers, and matching lines
- Results sorted by file modification time (newest first)
- Filters by file pattern with `include` parameter

## Permission Required

- `grep` permission with pattern and path

## Truncation Handling

- **Limited to 100 matches** - Shows first 100 matches sorted by mtime
- Message indicates truncation: `(Results truncated: showing 100 of X matches)`
- Lines over 2000 characters are truncated with `...`

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "grep",
  "parameters": {
    "pattern": "function\\s+\\w+"
  }
}
```

```json
{
  "tool": "grep",
  "parameters": {
    "pattern": "TODO",
    "path": "/path/to/project",
    "include": "*.{ts,tsx}"
  }
}
```

## Key Behaviors

1. **Full regex support** - Use `\s+`, `\w+`, character classes, etc.
2. **Hidden files included** - Searches dotfiles by default
3. **Context-rich output** - Shows file path and line number for each match
4. **File filtering** - Use `include` for language-specific searches

## Output Format

```
Found N matches (showing first 100)
/path/to/file1.ts:
  Line 10: export function hello() {
  Line 25: function helper() {

/path/to/file2.ts:
  Line 5: async function fetchData() {
```

## Metadata

Returns:
- `metadata.matches`: Total number of matches
- `metadata.truncated`: Boolean indicating truncation
