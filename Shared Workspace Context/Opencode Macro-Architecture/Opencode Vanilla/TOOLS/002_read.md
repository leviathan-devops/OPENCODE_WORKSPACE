# read

Read files or directories from the local filesystem.

## Tool Definition

**Tool Name:** `read`
**Source:** `vanilla-source/packages/opencode/src/tool/read.ts`

## Arguments Schema (Zod)

```typescript
{
  filePath: string             // Absolute path to file or directory (required)
  offset?: number             // Line number to start from, 1-indexed (optional, default: 1)
  limit?: number              // Maximum lines to read (optional, default: 2000)
}
```

## What It Does

Reads file or directory contents with the following features:

- **Files**: Returns content with line numbers prefixed (format: `line: content`)
- **Directories**: Lists entries with `/` suffix for subdirectories
- **Binary detection**: Rejects binary files with an error
- **Image/PDF support**: Returns images and PDFs as base64 attachments
- **System reminders**: Injects `<system-reminder>` blocks with resolved instructions
- **Line truncation**: Lines over 2000 characters are truncated

## Permission Required

- `read` permission with file/directory path pattern

## Truncation Handling

- **File truncation at 50KB** - Maximum total bytes read is 50KB
- **Line truncation** - Lines exceeding 2000 characters are truncated with `... (line truncated to 2000 chars)`
- **Directory truncation** - Shows first 2000 entries by default; use offset/limit for pagination
- Output includes guidance like `(Showing lines X-Y of Z. Use offset=N to continue.)`

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "read",
  "parameters": {
    "filePath": "/path/to/file.ts",
    "offset": 1,
    "limit": 100
  }
}
```

```json
{
  "tool": "read",
  "parameters": {
    "filePath": "/path/to/directory"
  }
}
```

## Key Behaviors

1. **Absolute paths required** - Relative paths are resolved against project directory
2. **File must exist** - Returns "File not found" error with suggestions for similar names
3. **Must read before edit** - The edit tool requires reading a file first
4. **Images/PDFs returned as attachments** - Uses data URI format with base64 encoding
5. **Binary files rejected** - Common binary extensions (.zip, .exe, .dll, etc.) are rejected

## Output Format

Files:
```
<path>/path/to/file</path>
<type>file</type>
<content>
1: first line
2: second line
...
</content>
```

Directories:
```
<path>/path/to/dir</path>
<type>directory</type>
<entries>
file1.txt
file2.txt/
subdir/
</entries>
```
