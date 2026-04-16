# OpenCode Configuration Schema

Complete reference for OpenCode configuration options.

---

## Top-Level Configuration

```yaml
# opencode.config.yaml
version: "1.0"              # Config version (required)
appName: "OpenCode"         # Application name
logLevel: "info"            # debug, info, warn, error
configDir: "~/.config/opencode"  # Config directory
dataDir: "~/.local/share/opencode"  # Data directory
```

---

## Providers

```yaml
providers:
  # OpenAI
  - name: openai
    provider: openai
    apiKey: ${OPENAI_API_KEY}
    model: gpt-4-turbo
    baseURL: https://api.openai.com/v1  # Optional
    
  # Anthropic
  - name: anthropic
    provider: anthropic
    apiKey: ${ANTHROPIC_API_KEY}
    model: claude-3-5-sonnet-20241022
    
  # Local/Ollama
  - name: ollama
    provider: ollama
    baseURL: http://localhost:11434/v1
    apiKey: ${OLLAMA_API_KEY}  # Usually not needed for local
    model: llama3.3
    
  # Azure OpenAI
  - name: azure
    provider: azure
    apiKey: ${AZURE_API_KEY}
    endpoint: https://my-resource.openai.azure.com
    apiVersion: "2024-02-01"
    model: gpt-4-turbo
    
  # Google AI
  - name: google
    provider: google
    apiKey: ${GOOGLE_API_KEY}
    model: gemini-2.0-flash
```

---

## Agents

```yaml
agents:
  - name: default
    provider: anthropic  # Which provider to use
    model: claude-3-5-sonnet-20241022
    systemPrompt: "You are a helpful coding assistant."
    temperature: 0.7
    maxTokens: 8192
    
  - name: code-review
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: "You are an expert code reviewer."
    temperature: 0.3
    
  - name: fast
    provider: openai
    model: gpt-4o-mini
    temperature: 0.5
```

---

## Tools

```yaml
tools:
  # Built-in tools (enabled by default)
  - name: bash
    enabled: true
    description: "Execute shell commands"
    
  - name: read
    enabled: true
    description: "Read file contents"
    
  - name: write
    enabled: true
    description: "Write file contents"
    
  - name: glob
    enabled: true
    description: "Find files by pattern"
    
  - name: grep
    enabled: true
    description: "Search file contents"
    
  - name: edit
    enabled: true
    description: "Edit files"
    
  # Disable built-in tool
  - name: bash
    enabled: false
```

---

## Plugins

```yaml
plugins:
  # From npm package
  - name: my-plugin
    package: opencode-plugin-example
    version: "^1.0.0"
    enabled: true
    options:
      customOption: value
        
  # From local path
  - name: local-plugin
    path: /path/to/plugin
    enabled: true
    debug: true
    
  # With hooks
  - name: hook-plugin
    path: ./plugins/hook-plugin
    hooks:
      - before-tool-call
      - after-agent-run
```

---

## Sessions

```yaml
sessions:
  storage: sqlite  # sqlite, file, memory
  path: "~/.local/share/opencode/sessions"
  ttl: 86400  # 24 hours in seconds
  maxSize: 1000  # Max concurrent sessions
  encrypt: true
```

---

## Permissions

```yaml
permissions:
  # Default permission set
  defaults:
    filesystem:
      read: ["~/**", "/workspace/**"]
      write: ["/workspace/**"]
    network:
      allowed:
        - "*.github.com"
        - "api.example.com"
      denied: []
    process:
      spawn: true
      kill: false
      
  # Per-session overrides
  sessions:
    "*":
      timeout: 3600
    "privileged-*":
      timeout: 7200
      elevated: true
```

---

## Hooks Configuration

```yaml
hooks:
  # Built-in hooks
  - name: logging
    enabled: true
    events:
      - tool-call
      - agent-run
      - error
      
  # Custom hooks
  - name: my-hook
    plugin: my-plugin
    events:
      - before-tool-call
      - after-tool-call
    options:
      logFile: /var/log/opencode/hooks.log
```

---

## Logging

```yaml
logging:
  level: info  # debug, info, warn, error
  format: json  # json, text, pretty
  output:
    - type: stdout
      filter: "level >= info"
    - type: file
      path: ~/.local/share/opencode/logs/opencode.log
      filter: "level >= debug"
      rotation:
        maxSize: 100MB
        maxFiles: 10
```

---

## Telemetry

```yaml
telemetry:
  enabled: false  # Set to true to enable
  endpoint: https://telemetry.opencode.ai
  sampling: 0.1  # 10% of events
```

---

## MCP (Model Context Protocol)

```yaml
mcp:
  # Ollama MCP server
  - name: ollama
    command: npx
    args:
      - "@modelcontextprotocol/server-ollama"
    env:
      OLLAMA_HOST: http://localhost:11434
      
  # Filesystem MCP server
  - name: filesystem
    command: npx
    args:
      - "@modelcontextprotocol/server-filesystem"
    env:
      ALLOWED_PATH: /workspace
      
  # Git MCP server
  - name: git
    command: npx
    args:
      - "@modelcontextprotocol/server-git"
    env:
      allowed_repos: /workspace/**
```

---

## Security

```yaml
security:
  # Sandbox settings
  sandbox:
    enabled: true
    isolation: process  # process, container, vm
    resources:
      cpu: 2
      memory: 2GB
      disk: 10GB
      
  # API key management
  secrets:
    provider: env  # env, vault, aws-secrets
    prefix: "OPENCODE_"
```

---

## Complete Example

```yaml
# Full opencode.config.yaml example
version: "1.0"
appName: "OpenCode"
logLevel: "info"

providers:
  - name: anthropic
    provider: anthropic
    apiKey: ${ANTHROPIC_API_KEY}
    model: claude-3-5-sonnet-20241022

agents:
  - name: default
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: "You are an expert coding assistant."
    temperature: 0.7
    maxTokens: 8192

tools:
  - name: bash
    enabled: true
  - name: read
    enabled: true
  - name: write
    enabled: true
  - name: glob
    enabled: true
  - name: grep
    enabled: true
  - name: edit
    enabled: true

plugins:
  - name: my-plugin
    package: opencode-plugin-example
    version: "^1.0.0"
    enabled: true

sessions:
  storage: sqlite
  path: "~/.local/share/opencode/sessions"
  ttl: 86400
  encrypt: true

permissions:
  defaults:
    filesystem:
      read: ["~/**", "/workspace/**"]
      write: ["/workspace/**"]
    network:
      allowed:
        - "*.github.com"
      denied: []

logging:
  level: info
  format: json
  output:
    - type: file
      path: ~/.local/share/opencode/logs/opencode.log
```

---

## Environment Variable Interpolation

All config values support ${ENV_VAR} syntax:

```yaml
apiKey: ${OPENAI_API_KEY}
secret: ${SECRET:-default_value}  # With fallback
```

---

## Config Loading Order

1. opencode.config.yaml in current directory
2. ~/.config/opencode/opencode.config.yaml
3. ${OPENCODE_CONFIG_DIR}/opencode.config.yaml
4. Command line --config flag (highest priority)
