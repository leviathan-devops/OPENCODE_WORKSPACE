# OpenCode Vanilla - Built-in Tools

Documentation for all 16 built-in tools in OpenCode Vanilla.

Source: `vanilla-source/packages/opencode/src/tool/`

## Tools Index

| # | Tool | Description | File |
|---|------|-------------|------|
| 1 | [bash](001_bash.md) | Execute shell commands | bash.ts |
| 2 | [read](002_read.md) | Read files/directories | read.ts |
| 3 | [write](003_write.md) | Write files | write.ts |
| 4 | [edit](004_edit.md) | String replacement in files | edit.ts |
| 5 | [glob](005_glob.md) | Find files by pattern | glob.ts |
| 6 | [grep](006_grep.md) | Content search with regex | grep.ts |
| 7 | [task](007_task.md) | Spawn subagent | task.ts |
| 8 | [todowrite](008_todowrite.md) | Todo list management | todo.ts |
| 9 | [webfetch](009_webfetch.md) | HTTP fetch with conversion | webfetch.ts |
| 10 | [websearch](010_websearch.md) | Web search via Exa AI | websearch.ts |
| 11 | [codesearch](011_codesearch.md) | Code search via Exa API | codesearch.ts |
| 12 | [skill](012_skill.md) | Load specialized skills | skill.ts |
| 13 | [apply_patch](013_apply_patch.md) | Apply diff patches | apply_patch.ts |
| 14 | [question](014_question.md) | Ask user questions | question.ts |
| 15 | [lsp](015_lsp.md) | LSP code intelligence | lsp.ts |
| 16 | [batch](016_batch.md) | Parallel tool execution | batch.ts |

## Tool Categories

### File Operations
- `read` - Read files and directories
- `write` - Write/create files
- `edit` - String replacement
- `glob` - Pattern-based file finding
- `grep` - Content search

### Shell/Execution
- `bash` - Shell command execution
- `batch` - Parallel tool execution

### Agent/Task Management
- `task` - Spawn subagents
- `todowrite` - Todo list tracking
- `skill` - Load specialized skills

### Web/API
- `webfetch` - URL content fetching
- `websearch` - Web search (Exa AI)
- `codesearch` - Code search (Exa API)

### Code Intelligence
- `lsp` - Language Server Protocol features

### Interactive
- `question` - User questions (app/cli/desktop)
- `apply_patch` - Diff patch application (GPT only)

## Model Availability

| Tool | All Models | OpenCode/Exa Only | GPT Only | App/CLI/Desktop |
|------|------------|-------------------|----------|-----------------|
| bash | Yes | - | - | - |
| read | Yes | - | - | - |
| write | Yes | - | - | - |
| edit | Yes | - | - | - |
| glob | Yes | - | - | - |
| grep | Yes | - | - | - |
| task | Yes | - | - | - |
| todowrite | Yes | - | - | - |
| webfetch | Yes | - | - | - |
| websearch | - | Yes | - | - |
| codesearch | - | Yes | - | - |
| skill | Yes | - | - | - |
| apply_patch | - | - | Yes | - |
| question | - | - | - | Yes |
| lsp | Yes | - | - | - |
| batch | Yes | - | - | - |

## Common Parameters

Most tools accept:
- `filePath` - Path to file (absolute or relative to project)
- `pattern` or `query` - Search/filter patterns

## Output Format

All tools return:
```typescript
{
  title: string           // Human-readable title
  output: string         // Main output content
  metadata: object       // Tool-specific metadata
  attachments?: array    // Optional file attachments
}
```
