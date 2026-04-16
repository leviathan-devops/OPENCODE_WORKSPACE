# OpenCode CLI Commands Reference

## Core Commands

### opencode

Main CLI entry point.

```bash
opencode [options] [command]
```

Options:
- --config <path> - Custom config file path
- --debug - Enable debug logging
- --verbose - Verbose output
- --version - Show version
- --help - Show help

---

### opencode ask

Ask a one-off question.

```bash
opencode ask "How do I center a div?"
opencode ask "Explain this code" --file src/App.tsx
opencode ask "Refactor this function" --inline "function foo() {}"
```

Options:
- --file <path> - Read file and include in context
- --inline <text> - Include inline code
- --model <name> - Use specific model
- --no-stream - Disable streaming response

---

### opencode chat

Start interactive chat session.

```bash
opencode chat
opencode chat --session my-session
opencode chat --agent code-review
```

Options:
- --session <id> - Resume existing session
- --agent <name> - Use specific agent
- --provider <name> - Use specific provider

---

### opencode edit

Edit files with AI assistance.

```bash
opencode edit src/App.tsx
opencode edit "Replace foo with bar" src/index.ts
opencode edit --all "*.js" "convert to TypeScript"
```

Options:
- --all - Apply to all matching files
- --dry-run - Show changes without applying
- --force - Skip confirmation

---

## Session Management

### opencode sessions

List all sessions.

```bash
opencode sessions list
opencode sessions list --archived
opencode sessions list --agent default
```

### opencode session show

Show session details.

```bash
opencode session show <session-id>
opencode session show <session-id> --messages
opencode session show <session-id> --tools
```

### opencode session delete

Delete a session.

```bash
opencode session delete <session-id>
opencode session delete <session-id> --force
opencode session delete --all --older-than 30d
```

### opencode session export

Export session data.

```bash
opencode session export <session-id> --format json
opencode session export <session-id> --format markdown --output ./export/
```

---

## Plugin Management

### opencode plugins

List installed plugins.

```bash
opencode plugins list
opencode plugins list --verbose
```

### opencode plugins install

Install a plugin.

```bash
opencode plugins install opencode-plugin-example
opencode plugins install ./local-plugin
opencode plugins install --global opencode-plugin-global
```

### opencode plugins uninstall

Uninstall a plugin.

```bash
opencode plugins uninstall opencode-plugin-example
opencode plugins uninstall --global
```

### opencode plugins update

Update plugins.

```bash
opencode plugins update
opencode plugins update opencode-plugin-example
opencode plugins update --all
```

---

## Configuration

### opencode config get

Get config value.

```bash
opencode config get providers
opencode config get agents.default.model
opencode config get --flat
```

### opencode config set

Set config value.

```bash
opencode config set logLevel debug
opencode config set agents.default.temperature 0.5
```

### opencode config validate

Validate config file.

```bash
opencode config validate
opencode config validate --config ./custom.yaml
```

### opencode config edit

Edit config interactively.

```bash
opencode config edit
```

---

## Tools & Providers

### opencode tools list

List available tools.

```bash
opencode tools list
opencode tools list --plugin my-plugin
opencode tools list --enabled
```

### opencode providers list

List configured providers.

```bash
opencode providers list
opencode providers list --verbose
```

### opencode providers add

Add a provider.

```bash
opencode providers add anthropic --api-key ${ANTHROPIC_API_KEY}
opencode providers add ollama --base-url http://localhost:11434
```

---

## Logging & Debugging

### opencode logs

View logs.

```bash
opencode logs
opencode logs --tail 100
opencode logs --level error
opencode logs --session <session-id>
opencode logs --plugin my-plugin
```

Options:
- --tail <n> - Show last N lines
- --level <level> - Filter by level (debug, info, warn, error)
- --session <id> - Filter by session
- --plugin <name> - Filter by plugin
- --since <duration> - Show logs since (e.g., 1h, 30m)

### opencode debug

Start debug mode.

```bash
opencode debug
opencode debug --breakpoint tool-call
opencode debug --breakpoint agent-run
```

---

## Health & Status

### opencode health

Check system health.

```bash
opencode health
opencode health --verbose
```

### opencode status

Show current status.

```bash
opencode status
opencode status --provider anthropic
```

### opencode doctor

Run diagnostics.

```bash
opencode doctor
opencode doctor --fix
```

---

## Database

### opencode db query

Query the session database.

```bash
opencode db query "SELECT * FROM sessions LIMIT 10"
opencode db query --format table "SELECT COUNT(*) FROM messages"
```

### opencode db export

Export database.

```bash
opencode db export --output ./backup/
opencode db export --sessions <id1,id2>
```

### opencode db vacuum

Optimize database.

```bash
opencode db vacuum
```

---

## Development

### opencode dev

Start development mode.

```bash
opencode dev
opencode dev --watch
opencode dev --port 3000
```

### opencode init

Initialize new project.

```bash
opencode init
opencode init --template typescript
opencode init --directory ./my-project
```

### opencode build

Build project.

```bash
opencode build
opencode build --watch
opencode build --outdir ./dist
```

---

## Help

### opencode help

Show general help.

```bash
opencode help
opencode help commands
opencode help <command>
```
