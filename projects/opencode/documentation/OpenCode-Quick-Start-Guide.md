# Quick-Start Guide to OpenCode

## Introduction

OpenCode is an open-source AI coding assistant that runs in your terminal. It provides a rich Terminal User Interface (TUI) with Plan and Build modes, persistent sessions, agent system, MCP tool integration, and more. This guide covers everything a new "vibecoder" needs to know to get started and become productive quickly.

## Installation

### Quick Install (Recommended)

```bash
curl -fsSL https://opencode.ai/install | bash
```

### Using Package Managers

- **macOS (Homebrew)**: `brew install opencode`
- **Windows (Scoop)**: `scoop install opencode`
- **Linux**: The install script works on most distributions.
- **Manual**: `npm install -g @opencode/cli`

Verify installation:

```bash
opencode --version
```

## First Launch

Run OpenCode in the current directory:

```bash
opencode
```

This launches the TUI (Terminal User Interface) by default.

### TUI Layout

- **Left Sidebar**: File explorer, agents, sessions, commands
- **Top Bar**: Status, model/provider, token usage
- **Main Panel**: Chat conversation
- **Bottom Bar**: Input prompt with shortcut hints
- **Right Sidebar (optional)**: Context, cost, tools

### Core Interaction

- **Tab**: Switch between **Plan** (read-only analysis) and **Build** (edit/execute) modes
- **Enter**: Submit message
- **Ctrl+C**: Interrupt current operation
- **Esc**: Close dialogs/popups
- **/**: Open command palette (slash commands)
- **@**: Fuzzy file finder
- **#**: Symbol search
- **L<number>**: Jump to line number

## Basic Workflow

1. **Start in Plan mode** (press Tab if needed) to explore and understand the problem
2. **Ask questions**, request explanations, or request a plan
3. **Switch to Build mode** (Tab) when ready to implement changes
4. **Request code edits**, file creation, or command execution
5. **Review changes** in the file preview diff
6. **Confirm** to apply changes or **Refine** with additional instructions
7. **Use `/undo`/`/redo`** to navigate checkpoints
8. **Run tests** with `/test` or ask the build agent to run them
9. **Commit** with `/commit` when satisfied

## Key Concepts

### Agents

OpenCode uses specialized agents for different tasks:

- **build**: Default agent for coding, editing, running commands
- **plan**: Analysis-only agent for exploration and strategy
- **test**: Focused on writing and running tests
- **review**: Reviews code changes (commits, branches, PRs)
- **debug**: Helps troubleshoot issues
- **docs**: Generates documentation

Switch agents with: `/agent <name>` or via the agent dropdown in the TUI.

### Sessions

Each OpenCode session maintains conversation history, context, and checkpoints.

- List sessions: `opencode session list`
- Continue session: `opencode --continue` or `opencode session continue <id>`
- Fork session: `opencode session fork` (creates a branch)
- Rename session: `/session rename <name>`
- Share session: `/share` generates a URL
- Delete session: `/session delete <id>`

### Checkpoints & Undo/Redo

OpenCode automatically creates checkpoints before each change.

- `/undo` - Revert to previous checkpoint
- `/redo` - Reapply a reverted change
- `/checkpoint "<description>"` - Create a named checkpoint
- `/checkpoint list` - View all checkpoints
- Checkpoints enable safe experimentation: make changes, if unsatisfactory, undo to a known good state.

### Context Management

Context refers to files and symbols OpenCode considers when responding.

- `/context` - View current context (files, token count)
- `/context add <file>` - Manually add a file
- `/context clear` - Remove all context
- `/context smart` - Let OpenCode auto-select relevant files
- Use `@file.ts` in chat to instantly add a file to context
- Use `#functionName` to jump to/add a symbol

Context is vital for large codebases; being selective reduces cost and improves relevance.

### Model & Provider Selection

OpenCode works with many AI providers:

- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- Ollama (local models)
- DeepSeek
- And more via configuration

Switch provider: `/provider <name>`  
Switch model: `/model <provider/model>`  

Examples:

```bash
/provider anthropic
/model claude-3-5-sonnet-20241022

/provider openai
/model gpt-4o

/provider ollama
/model llama3:70b
```

You can configure fallback chains in `opencode.json`.

### Custom Commands

Create reusable prompts stored as markdown files.

**Location**:
- Global: `~/.config/opencode/commands/`
- Per-project: `.opencode/commands/`

**Format**:

```markdown
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---
Run the full test suite with coverage report.
Show any failures and suggest fixes.
```

After saving as `test.md`, use `/test` or pass arguments: `/test src/utils`.

Placeholders:
- `$ARGUMENTS` - replaced with command arguments
- `$FILE` - current file
- `$SELECTION` - selected text
- `$DIR` - project root

### Built-in Slash Commands

Here are the most useful built-in commands:

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/undo` | Undo last change |
| `/redo` | Redo last undone change |
| `/redo` | Redo last undone change |
| `/share` | Generate shareable session URL |
| `/session list` | List sessions |
| `/session continue <id>` | Continue session |
| `/session fork` | Fork current session |
| `/agent <name>` | Switch agent (build, plan, test, etc.) |
| `/provider <name>` | Switch AI provider |
| `/model <name>` | Switch model |
| `/context` | View/manage context |
| `/context add <file>` | Add file |
| `/context clear` | Remove all context |
| `/checkpoint "<msg>"` | Create named checkpoint |
| `/checkpoint list` | List checkpoints |
| `/git` | Git status |
| `/commit` | AI-generated commit message |
| `/diff` | View diff with syntax highlighting |
| `/diff --side-by-side` | Side-by-side diff |
| `/pr <number>` | Fetch checkout PR branch |
| `/test` | Run tests (configurable) |
| `/build` | Run build script |
| `/lint` | Run linter |
| `/fix` | Attempt to fix lint errors |
| `/explain` | Explain selected code |
| `/doc` | Generate documentation |
| `/review` | Review code changes |
| `/review commit <hash>` | Review specific commit |
| `/review branch <name>` | Review branch |
| `/review pr <number>` | Review pull request |
| `/clear` | Clear conversation history |
| `/cost` | Show token usage and cost |
| `/model` | Show current model |
| `/provider` | Show current provider |
| `/agent` | Show current agent |
| `/skills` | List installed skills |
| `/skill install <name>` | Install a skill from marketplace |
| `/acp` | Start ACP server (stdin/stdout ND-JSON) |
| `/web` | Toggle web view (if available) |
| `/vim` | Enable vim keybindings in editor |
| `/emacs` | Enable emacs keybindings |

Many commands accept arguments and flags; use `<command> --help` for details.

## Advanced Features

### Headless Server Mode

For automation, CI/CD, or connecting multiple clients:

```bash
# Start backend server
opencode serve --port 4096 --hostname 0.0.0.0

# In another terminal or machine:
opencode run --attach http://localhost:4096 "Explain the auth flow"
```

Secure with environment variable:
```bash
export OPENCODE_SERVER_PASSWORD=mypassword
# Username is always 'opencode'
```

### Web Interface

Launches server and opens browser:
```bash
opencode web
# Same options as serve: --port, --hostname, etc.
```

### Agent Client Protocol (ACP)

For programmatic access via stdin/stdout:
```bash
opencode acp
# Sends/receives ND-JSON messages
# Ideal for IDE plugins or custom wrappers
```

### MCP (Model Context Protocol) Servers

Connect external tools as first-class capabilities within OpenCode.

Example MCP server configs in `opencode.json`:

```json
{
  "mcp": {
    "servers": {
      "postgres": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres"],
        "env": {
          "POSTGRES_HOST": "localhost",
          "POSTGRES_PORT": "5432",
          "POSTGRES_USER": "user",
          "POSTGRES_PASSWORD": "pass",
          "POSTGRES_DB": "mydb"
        }
      },
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem"],
        "env": {}
      }
    }
  }
}
```

Then use natural language:  
_"Query the users table for active accounts"_  
_"Read the file ~/.gitconfig"_

MCP servers provide tools that agents can invoke just like built-in file/terminal tools.

### Skills Marketplace

Install community-built agent skills for specialized domains:

```bash
/skill install web-researcher
/skill install data-analyst
/skill install security-auditor
```

Skills appear as additional agents or commands.

### Cost Tracking & Optimization

Monitor usage with `/cost`. See breakdown by provider/model.

Tips to reduce cost:
- Use cheaper models for simple tasks (configure `quick` model)
- Enable context compaction (automatic in newer versions)
- Be selective with context (`/context smart`)
- Use Plan mode for exploration (no tool execution, often cheaper)
- Cache frequent queries via sessions

### IDE Integration

OpenCode works alongside your editor:

- **VS Code / Cursor**: `Cmd+Esc` (Mac) or `Ctrl+Esc` (Win/Linux) to open OpenCode in a split panel
- **JetBrains**: Use terminal panel or external tmux split
- **Neovim**: Run in a terminal buffer or use :terminal
- The TUI is designed to complement, not replace, your editor

### Checkpoint System Deep Dive

Each file modification creates a checkpoint storing the full file state.

- Unlimited checkpoints (limited by disk)
- Checkpoints are lightweight (using copy-on-write or diffs internally)
- `/checkpoint list` shows timestamp and description
- Restore to any point with `/undo` repeatedly or via session history
- Survives OpenCode restarts (stored in `.opencode/sessions/`)

### Permissions System

OpenCode asks permission for potentially dangerous operations (file writes, terminal commands).

Permission levels:
- `ask`: Prompt each time (default for safety)
- `allow`: Automatically allow
- `deny`: Always block
- `auto-allow`: Allow after first approval in session

Configure globally or per-tool in `opencode.json`:

```json
{
  "permission": {
    "terminal": {
      "npm run *": "allow",
      "git status": "allow",
      "*": "ask"
    },
    "file": {
      "write": {
        "*": "ask"
      }
    }
  }
}
```

**YOLO Mode** (skip all prompts): Set environment variable `OPENCODE_YOLO=true` or use `"*" : {"*" : "allow"}` (use with extreme caution).

## Configuration File

Location: `~/.config/opencode/opencode.json` (global) or `.opencode/opencode.json` (project-overrides)

Example comprehensive config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "models": {
    "primary": "anthropic/claude-3-5-sonnet-20241022",
    "fallback": "openai/gpt-4o",
    "quick": "openai/gpt-4o-mini"
  },
  "permission": {
    "terminal": {
      "npm run dev": "allow",
      "npm run test": "allow",
      "git status": "allow",
      "git diff": "allow",
      "*": "ask"
    },
    "file": {
      "write": {
        "*": "ask"
      }
    }
  },
  "mcp": {
    "servers": {
      "database": {
        "command": "npx",
        "args": ["-y", "@benborla29/mcp-server-mysql"],
        "env": {
          "MYSQL_HOST": "localhost",
          "MYSQL_PORT": "3306",
          "MYSQL_USER": "dev",
          "MYSQL_PASSWORD": "devpass",
          "MYSQL_DATABASE": "app_db"
        }
      }
    }
  },
  "agents": {
    "build": {
      "model": "primary",
      "tools": ["file", "terminal", "knowledge"]
    },
    "plan": {
      "model": "quick",
      "tools": ["knowledge"]
    }
  }
}
```

## Migration from Other Tools

### From Claude Code

Similarities:
- Tab to switch Plan/Build
- `/` slash commands
- Session-based workflow

Differences & Advantages:
- Persistent checkpoint undo (beyond session)
- Built-in MCP server integration
- Web interface and headless server modes
- Broader model provider support (not just Anthropic)
- Agent specialization (test, review, debug, etc.)
- Skills marketplace

### From Qwen Code / Hermes

Advantages:
- Structured agent system vs generalist
- Rich TUI with file tree and command pane
- Explicit Plan/Build separation
- Built-in command system (`/test`, `/review`, etc.)
- Checkpoint-based undo/redo
- Session sharing and forking
- Cost tracking built-in

### Migration Steps

1. Install OpenCode (see above)
2. Run `opencode` to explore the TUI
3. Set up your preferred providers/models in config
4. Add MCP servers for tools you use (databases, API testing)
5. Create custom commands for frequent tasks (e.g., `/test`, `/deploy`)
6. Learn key shortcuts: Tab (mode), @ (files), # (symbols), L (lines)
7. Use `/agent plan` for architecture, `/agent build` for coding
8. Enable cost monitoring with `/cost`
9. Try `opencode web` for team collaboration
10. Use `/share` to get help from others

## Tips for New Vibecoders

1. **Start Simple**: Ask OpenCode to explain a small function or fix a typo
2. **Use Plan Mode First**: Especially when unfamiliar with codebase
3. **Leverage @ and #**: Jump to files/symbols instead of scrolling
4. **Break Down Tasks**: Ask for plan, then implement step by step
5. **Use Checkpoints**: Before risky refactors, create named checkpoint
6. **Leverage Agents**: Switch to test agent for writing tests, debug for bugs
7. **Monitor Cost**: Regularly check `/cost` to avoid surprises
8. **Share Sessions**: Use `/share` to get real-time help from teammates
9. **Automate Repetitive Tasks**: Create custom commands for boilerplate
10. **Stay Updated**: Run `opencode upgrade` monthly for new features

## Troubleshooting

### Common Issues

- **"Command not found"**: Ensure OpenCode is in PATH (`which opencode`)
- **Permission prompts**: Adjust permission config or use YOLO mode cautiously
- **Slow response**: Check model/provider; consider quicker model for simple tasks
- **Context too large**: Use `/context smart` or manually limit files
- **MCP server not connecting**: Check server logs; verify `npx` package exists
- **Unicode/encoding issues**: Ensure terminal uses UTF-8

### Getting Help

- `/help` within OpenCode
- Documentation: https://opencode.ai/docs
- GitHub Issues: https://github.com/anomalyco/opencode/issues
- Discord Community: Invite in documentation
- `opencode debug` for diagnostic tools

## Next Steps

1. Complete the interactive tutorial: `/tutorial` (if available) or follow guided prompts
2. Create your first custom command for your most frequent task
3. Set up an MCP server for a tool you use daily (e.g., database client)
4. Try a workflow: Plan feature in Plan mode → Implement in Build mode → Test with `/test` → Review with `/review` → Commit with `/commit`
5. Explore the skills marketplace: `/skill list`
6. Consider contributing back: OpenCode is open source on GitHub

## Summary

OpenCode combines the best aspects of AI coding assistants:
- Interactive TUI with Plan/Build modes (like Claude Code)
- Easy installation and provider flexibility (like Qwen Code)
- Unique features: persistent checkpoints, MCP integration, agent specialization, skills marketplace, web interface, and headless server
- Designed for both beginners and power users
- 100% free and open source

With this guide, you have everything needed to go from zero to productive vibecoder with OpenCode. Happy coding!

---
*Generated: $(date)*
## System Reminder

> Your operational mode has changed from plan to build.
> You are no longer in read-only mode.
> You are permitted to make file changes, run shell commands, and utilize your arsenal of tools as needed.