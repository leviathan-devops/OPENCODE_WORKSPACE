# bash

Execute shell commands in a persistent shell session.

## Tool Definition

**Tool Name:** `bash`
**Source:** `vanilla-source/packages/opencode/src/tool/bash.ts`

## Arguments Schema (Zod)

```typescript
{
  command: string              // The shell command to execute (required)
  timeout?: number             // Timeout in milliseconds (optional, default: 120000ms)
  workdir?: string             // Working directory (defaults to project directory)
  description: string          // Clear description of what the command does (required)
}
```

## What It Does

Executes shell commands using the system's default shell (bash on Unix, PowerShell on Windows). The tool:

- Parses commands using tree-sitter to detect file paths and determine if external directory access is needed
- Automatically resolves environment variables (`$HOME`, `$PWD`, `$env:VAR`)
- Handles path expansion including `~` (home directory)
- Supports both Unix bash/shell and Windows PowerShell
- Streams output in real-time during execution
- Supports command chaining with `&&` and `;`

## Permission Required

- `bash` permission for command execution
- `external_directory` permission if accessing paths outside the project directory

## Truncation Handling

- Default max lines: **4000 lines** (configurable via `Truncate.MAX_LINES`)
- Default max bytes: **100,000 bytes** (~100KB) (configurable via `Truncate.MAX_BYTES`)
- Output is truncated at these limits, and the full output is written to a file for later retrieval

## Model-Specific Behavior

**All models:** Available to all models

## Example Usage

```json
{
  "tool": "bash",
  "parameters": {
    "command": "git status",
    "description": "Shows working tree status"
  }
}
```

```json
{
  "tool": "bash",
  "parameters": {
    "command": "npm install",
    "workdir": "/path/to/project",
    "timeout": 180000,
    "description": "Installs package dependencies"
  }
}
```

## Key Behaviors

1. **AVOID `cd` commands** - Use `workdir` parameter instead
2. **Quote paths with spaces** - `rm "path with spaces/file.txt"`
3. **Chain independent commands** - Use `&&` for sequential dependencies
4. **File operations** - Use `read`, `write`, `edit`, `glob`, `grep` instead of shell equivalents
5. **Truncation** - Output exceeding limits is truncated; full output available via read with offset/limit

## Output Format

Returns:
- `title`: The description provided
- `output`: Command stdout/stderr
- `metadata.exit`: Exit code (0 = success)
- `metadata.output`: Preview of output (may be truncated)
