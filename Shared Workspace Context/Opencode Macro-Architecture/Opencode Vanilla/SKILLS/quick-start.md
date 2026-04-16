# OpenCode Quick Start Guide

## Installation

### Install OpenCode

```bash
# Via npm (global)
npm install -g opencode

# Via Homebrew (macOS)
brew install opencode

# Via pip
pip install opencode
```

### Verify Installation

```bash
opencode --version
opencode doctor
```

---

## Basic Usage

### Ask a Question

```bash
# One-off question
opencode ask "How do I parse JSON in Python?"

# With file context
opencode ask "Explain this code" --file src/app.py

# With inline code
opencode ask "Fix this bug" --inline "const x = fn()"
```

### Interactive Chat

```bash
# Start chat session
opencode chat

# With specific agent
opencode chat --agent code-review

# Resume existing session
opencode chat --session abc123
```

### Edit Files

```bash
# Edit single file
opencode edit src/index.ts

# Apply transformation to all matching files
opencode edit --all "*.js" "convert to TypeScript"

# Dry run to preview changes
opencode edit --dry-run src/app.py
```

---

## First-Time Setup

### 1. Configure API Keys

```bash
# Set environment variables
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."

# Or use opencode config
opencode config set providers.anthropic.apiKey "sk-ant-..."
```

### 2. Create Config File

```yaml
# ~/.config/opencode/opencode.config.yaml
version: "1.0"
providers:
  - name: anthropic
    provider: anthropic
    apiKey: ${ANTHROPIC_API_KEY}
    model: claude-3-5-sonnet-20241022

agents:
  - name: default
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: "You are a helpful coding assistant."
```

### 3. Test Configuration

```bash
opencode config validate
opencode doctor
```

---

## Common Workflows

### Code Review

```bash
opencode chat --agent code-review
# Paste code or use --file flag
```

### Debugging

```bash
opencode ask "Debug this error" --file error.log
opencode ask "Why is this function slow?" --inline "function foo() { ... }"
```

### Refactoring

```bash
opencode edit --all "*.js" "convert to ES modules"
opencode edit --all "*.tsx" "migrate from class to hooks"
```

### Documentation

```bash
opencode ask "Document this function" --file src/utils.ts
opencode ask "Generate README for this project"
```

---

## Session Management

```bash
# List sessions
opencode sessions list

# Show session details
opencode session show <session-id>

# Delete old session
opencode session delete <session-id>

# Export session
opencode session export <session-id> --format markdown
```

---

## Help

```bash
# General help
opencode help

# Specific command
opencode help chat
opencode help edit
opencode help config
```
