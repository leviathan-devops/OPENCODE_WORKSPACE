# MCP Configuration Examples

## Model Context Protocol (MCP) Overview

MCP enables OpenCode to connect to external tools and resources via a standardized protocol.

---

## Basic MCP Configuration

```yaml
mcp:
  # Minimal MCP server
  - name: my-server
    command: npx
    args:
      - "@modelcontextprotocol/server-example"
```

---

## Filesystem Server

Access local filesystem through MCP.

```yaml
mcp:
  - name: filesystem
    command: npx
    args:
      - "@modelcontextprotocol/server-filesystem"
    env:
      ALLOWED_PATH: /workspace
```

Tools provided:
- read_file - Read file contents
- read_directory - List directory
- create_directory - Create directory
- move_file - Move/rename file
- delete_file - Delete file
- search_files - Search for files

---

## Git Server

Git integration through MCP.

```yaml
mcp:
  - name: git
    command: npx
    args:
      - "@modelcontextprotocol/server-git"
    env:
      allowed_repos:
        - /workspace/**
```

Tools provided:
- git_status - Show working tree status
- git_log - Show commit logs
- git_diff - Show changes
- git_commit - Commit changes
- git_branch - List branches

---

## Ollama Server

Local LLM integration via Ollama.

```yaml
mcp:
  - name: ollama
    command: npx
    args:
      - "@modelcontextprotocol/server-ollama"
    env:
      OLLAMA_HOST: http://localhost:11434
      OLLAMA_MODEL: llama3.3
```

Tools provided:
- ollama_list - List available models
- ollama_pull - Pull a model
- ollama_generate - Generate text

---

## Sequential Thinking

Enable step-by-step reasoning.

```yaml
mcp:
  - name: sequential-thinking
    command: npx
    args:
      - "@modelcontextprotocol/server-sequential-thinking"
    env:
      MAX_TOKENS: "4000"
      MODEL_NAME: claude-3-5-sonnet-20241022
```

---

## Brave Search

Web search integration.

```yaml
mcp:
  - name: brave-search
    command: npx
    args:
      - "@modelcontextprotocol/server-brave-search"
    env:
      BRAVE_API_KEY: ${BRAVE_SEARCH_API_KEY}
```

Tools provided:
- brave_search - Search the web

---

## Slack Integration

```yaml
mcp:
  - name: slack
    command: npx
    args:
      - "@modelcontextprotocol/server-slack"
    env:
      SLACK_BOT_TOKEN: ${SLACK_BOT_TOKEN}
      SLACK_TEAM_ID: T0123456789
```

Tools provided:
- slack_list_channels - List channels
- slack_history - Get channel history
- slack_post_message - Post message
- slack_create_channel - Create channel

---

## Google Maps

Location and mapping services.

```yaml
mcp:
  - name: google-maps
    command: npx
    args:
      - "@modelcontextprotocol/server-google-maps"
    env:
      GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
```

Tools provided:
- get_distance - Calculate distance
- geocode - Convert address to coordinates
- reverse_geocode - Convert coordinates to address
- directions - Get directions

---

## Memory (Knowledge Graph)

Persistent memory across sessions.

```yaml
mcp:
  - name: memory
    command: npx
    args:
      - "@modelcontextprotocol/server-memory"
    env:
      STORAGE_PATH: ~/.local/share/opencode/memory
```

Tools provided:
- memory_create - Create memory entry
- memory_search - Search memories
- memory_update - Update memory
- memory_delete - Delete memory

---

## Sentry (Error Tracking)

```yaml
mcp:
  - name: sentry
    command: npx
    args:
      - "@modelcontextprotocol/server-sentry"
    env:
      SENTRY_AUTH_TOKEN: ${SENTRY_AUTH_TOKEN}
      SENTRY_ORG: my-org
      SENTRY_PROJECT: my-project
```

Tools provided:
- sentry_list_issues - List issues
- sentry_search_issues - Search issues
- sentry_create_issue - Create issue
- sentry_assign_issue - Assign issue

---

## AWS SDK

AWS resource management.

```yaml
mcp:
  - name: aws
    command: npx
    args:
      - "@modelcontextprotocol/server-aws"
    env:
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: us-east-1
```

---

## EverArt (Image Generation)

```yaml
mcp:
  - name: everart
    command: npx
    args:
      - "@modelcontextprotocol/server-everart"
    env:
      EVERART_API_KEY: ${EVERART_API_KEY}
```

Tools provided:
- everart_generate_image - Generate image
- everart_list_models - List available models

---

## Multiple MCP Servers

```yaml
mcp:
  # Local resources
  - name: filesystem
    command: npx
    args:
      - "@modelcontextprotocol/server-filesystem"
    env:
      ALLOWED_PATH: /workspace

  # Git integration
  - name: git
    command: npx
    args:
      - "@modelcontextprotocol/server-git"
    env:
      allowed_repos:
        - /workspace/**

  # Web search
  - name: brave-search
    command: npx
    args:
      - "@modelcontextprotocol/server-brave-search"
    env:
      BRAVE_API_KEY: ${BRAVE_SEARCH_API_KEY}

  # Memory
  - name: memory
    command: npx
    args:
      - "@modelcontextprotocol/server-memory"
    env:
      STORAGE_PATH: ~/.local/share/opencode/memory
```

---

## MCP Server Arguments

### With Version

```yaml
mcp:
  - name: ollama
    command: npx
    args:
      - "@modelcontextprotocol/server-ollama@0.1.0"
```

### With URL

```yaml
mcp:
  - name: remote-server
    command: uvx
    args:
      - "mcp-server-remote@latest"
    url: "http://remote-server:3000/mcp"
```

### With Local Path

```yaml
mcp:
  - name: local-server
    command: node
    args:
      - "/path/to/local/server/dist/index.js"
```

---

## MCP with Environment Variables

```yaml
mcp:
  - name: configured-server
    command: npx
    args:
      - "@modelcontextprotocol/server-example"
    env:
      API_KEY: ${MCP_API_KEY}
      DEBUG: "true"
      TIMEOUT: "30000"
```

---

## Troubleshooting

### Check MCP Status

```bash
opencode mcp list
opencode mcp status
opencode mcp check <server-name>
```

### Debug MCP

```bash
opencode mcp debug <server-name>
opencode mcp logs --server <server-name>
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Server not starting | Check command and args |
| Permission denied | Verify env vars are set |
| Tools not appearing | Run opencode mcp reload |
| Timeout errors | Increase timeout in env |
