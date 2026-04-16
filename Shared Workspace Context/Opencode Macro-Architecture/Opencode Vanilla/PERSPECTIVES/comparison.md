# OpenCode vs Claude Code vs Codex Comparison

## Overview

This document compares OpenCode with other AI coding assistants: Anthropic's Claude Code and OpenAI's Codex (ChatGPT).

---

## Architecture Comparison

### OpenCode

```
┌─────────────────────────────────────────────────────┐
│                    OpenCode Core                    │
├─────────────┬─────────────┬─────────────┬──────────┤
│   Plugins   │    Hooks    │   Agents    │   Tools  │
├─────────────┴─────────────┴─────────────┴──────────┤
│              Permission System                      │
├─────────────────────────────────────────────────────┤
│                    Session DB                       │
├─────────────────────────────────────────────────────┤
│    Provider Abstraction (Anthropic/OpenAI/Ollama)  │
└─────────────────────────────────────────────────────┘
```

### Claude Code (Anthropic)

```
┌─────────────────────────────────────────────────────┐
│                  Claude Code CLI                    │
├─────────────────────────────────────────────────────┤
│   Built-in Tools (bash, editor, filesystem)        │
├─────────────────────────────────────────────────────┤
│          MCP Server Integration (optional)          │
├─────────────────────────────────────────────────────┤
│              Claude API (Anthropic)                 │
└─────────────────────────────────────────────────────┘
```

### Codex / ChatGPT (OpenAI)

```
┌─────────────────────────────────────────────────────┐
│                   Codex CLI                         │
├─────────────────────────────────────────────────────┤
│         Codex API (GPT-4)                          │
└─────────────────────────────────────────────────────┘
```

---

## Feature Comparison Matrix

| Feature | OpenCode | Claude Code | Codex |
|---------|----------|-------------|-------|
| Plugin System | Yes | No | No |
| Hook System | Yes | No | No |
| Custom Agents | Yes | No | No |
| Permission Security | Yes | Limited | No |
| Session History | SQLite | File | Memory |
| Multi-Provider | Yes | Anthropic only | OpenAI only |
| MCP Integration | Yes | Yes | Limited |
| Config Format | YAML | ENV/flags | ENV/flags |
| Hot Reload Plugins | Yes | N/A | N/A |
| Sandboxed Execution | Yes | No | No |

---

## Plugin Ecosystem

### OpenCode: Full Plugin Support

```yaml
# OpenCode plugin manifest
{
  "opencode": {
    "plugins": [{
      "name": "my-plugin",
      "tools": [...],
      "hooks": [...],
      "agents": [...]
    }]
  }
}
```

**Benefits:**
- Extend tools
- Register hooks
- Add custom agents
- npm distribution
- Permission declarations
- Hot reload

### Claude Code: MCP Only

- Connects to MCP servers
- Cannot create custom plugins
- Limited to MCP-provided capabilities

### Codex: No Extension

- Closed system
- No plugin architecture
- Limited to built-in commands

---

## Permission Systems

### OpenCode: Comprehensive

```yaml
permissions:
  filesystem:
    read: ["/workspace/**"]
    write: ["/workspace/src/**"]
  network:
    allowed: ["api.example.com"]
  process:
    spawn: true
```

- Declarative permissions
- Path-based restrictions
- Per-agent permissions
- Audit logging
- Sandboxing

### Claude Code: Basic

- REPL permissions via TOOL_USE permissions
- No granular filesystem control
- No network restrictions

### Codex: None

- Full system access
- No permission model
- Trust-based operation

---

## Session Management

### OpenCode: SQLite-backed

```bash
# Query sessions
opencode db query "SELECT * FROM sessions"

# Export
opencode session export <id> --format markdown

# SQLite schema for analysis
opencode db query "SELECT tool, COUNT(*) FROM tool_calls GROUP BY tool"
```

### Claude Code: File-based

```bash
# Sessions stored as JSON files
~/.claude/projects/*/sessions/
```

### Codex: In-memory

```bash
# No persistent sessions
# Context lost on restart
```

---

## Provider Support

### OpenCode: Multi-Provider

```yaml
providers:
  - name: anthropic
    provider: anthropic
  - name: openai
    provider: openai
  - name: ollama
    provider: ollama
  - name: azure
    provider: azure
```

### Claude Code: Anthropic Only

- Uses Claude models exclusively
- Cannot use OpenAI or local models
- Locked to Anthropic ecosystem

### Codex: OpenAI Only

- Uses GPT-4 models
- Cannot use Claude or local models
- Locked to OpenAI ecosystem

---

## Configuration

### OpenCode: YAML

```yaml
# ~/.config/opencode/opencode.config.yaml
version: "1.0"
providers:
  - name: anthropic
    apiKey: ${ANTHROPIC_API_KEY}
agents:
  - name: default
    provider: anthropic
    systemPrompt: "You are..."
```

### Claude Code: ENV + Project Config

```bash
# Environment
export ANTHROPIC_API_KEY=...

# .claude/settings.json
{
  "permissions": {...}
}
```

### Codex: ENV + .codex/

```bash
# Environment
export OPENAI_API_KEY=...

# .codex/config
OPENAI_MODEL=gpt-4
```

---

## Extension Model

### OpenCode: Full Plugin System

| Extension Type | Description |
|----------------|-------------|
| Tools | New capabilities for agents |
| Hooks | Intercept events/behaviors |
| Agents | Custom AI personalities |
| Providers | New model backends |

### Claude Code: MCP Only

| Extension Type | Description |
|----------------|-------------|
| MCP Servers | External tool providers |

### Codex: None

No extension mechanism.

---

## Use Case Recommendations

### Use OpenCode When:

1. **Multi-provider needed**: Mix Anthropic, OpenAI, Ollama
2. **Plugin ecosystem**: Need custom tools/agents
3. **Security priority**: Need permissions/sandboxing
4. **Session persistence**: Need SQL queries on history
5. **Team collaboration**: Shared configs and plugins
6. **Custom workflows**: Hook into execution pipeline

### Use Claude Code When:

1. **Anthropic-only**: Already using Claude
2. **Simpler needs**: Standard coding tasks
3. **MCP integration**: Have MCP servers to use
4. **Quick setup**: Minimal configuration

### Use Codex When:

1. **OpenAI ecosystem**: Already using OpenAI
2. **Simple scripts**: Basic automation
3. **Legacy systems**: Existing Codex integration

---

## Summary

| Aspect | OpenCode | Claude Code | Codex |
|--------|----------|-------------|-------|
| Flexibility | Highest | Medium | Low |
| Security | Highest | Medium | Low |
| Extensibility | Highest | Low | None |
| Simplicity | Medium | Highest | High |
| Provider Choice | All | Anthropic | OpenAI |
| Session Depth | SQLite | File | Memory |

OpenCode prioritizes extensibility, security, and flexibility at the cost of some simplicity. Claude Code is simpler but less extensible. Codex is the most limited but easiest to use for basic tasks.
