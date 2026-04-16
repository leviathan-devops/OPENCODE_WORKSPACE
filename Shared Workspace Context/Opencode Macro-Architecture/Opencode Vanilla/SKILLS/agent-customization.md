# Customizing Agent Behavior via Config

## Overview

OpenCode's agent behavior is highly configurable through the config file, including system prompts, model parameters, and tool access.

---

## Basic Agent Configuration

```yaml
agents:
  - name: default
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: "You are a helpful coding assistant."
    temperature: 0.7
    maxTokens: 8192
```

---

## System Prompt Engineering

### General Assistant

```yaml
agents:
  - name: default
    systemPrompt: |
      You are an expert programmer assistant.
      You help users write, debug, and understand code.
      Always explain your reasoning.
      Prefer clear, idiomatic code.
```

### Code Reviewer

```yaml
agents:
  - name: code-reviewer
    systemPrompt: |
      You are an expert code reviewer.
      Focus on:
      - Security vulnerabilities
      - Performance issues
      - Code readability
      - Best practices
      - Potential bugs
      Provide specific, actionable feedback.
```

### Debugger

```yaml
agents:
  - name: debugger
    systemPrompt: |
      You are a debugging expert.
      Help users find and fix bugs by:
      - Reading error messages carefully
      - Tracing code execution
      - Identifying root causes
      - Suggesting minimal fixes
      - Explaining what went wrong
```

### Documentation Writer

```yaml
agents:
  - name: docs-writer
    systemPrompt: |
      You are a technical documentation writer.
      Write clear, concise documentation that:
      - Explains WHY, not just what
      - Includes practical examples
      - Uses consistent formatting
      - Is accessible to the target audience
```

---

## Model Parameters

### Temperature

Controls randomness. Lower = more deterministic.

```yaml
# Precise, deterministic (code generation)
temperature: 0.2

# Balanced (general use)
temperature: 0.7

# Creative, varied (brainstorming)
temperature: 1.0
```

### maxTokens

Maximum response length.

```yaml
# Short responses
maxTokens: 512

# Medium responses
maxTokens: 2048

# Long responses
maxTokens: 8192
```

### topP and topK

Sampling parameters for response diversity.

```yaml
topP: 0.9    # Nucleus sampling
topK: 40     # Top-k sampling
```

---

## Tool Access Control

### Enable/Disable Built-in Tools

```yaml
tools:
  # Disable bash for safety
  - name: bash
    enabled: false
    
  # Keep file tools
  - name: read
    enabled: true
  - name: write
    enabled: true
  - name: glob
    enabled: true
  - name: grep
    enabled: true
```

### Per-Agent Tool Restrictions

```yaml
agents:
  - name: read-only
    tools:
      - read
      - glob
      - grep
    # Cannot write files
```

---

## Context Management

### Session History Limits

```yaml
sessions:
  maxHistory: 100  # Max messages to keep in context
  maxTokens: 100000  # Max total tokens
```

### Context Optimization

```yaml
agents:
  - name: default
    # Automatically summarize old messages
    summarizeHistory: true
    summaryThreshold: 0.8  # Summarize when 80% of context used
```

---

## Multi-Agent Configuration

```yaml
agents:
  - name: coordinator
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: |
      You coordinate a team of specialized agents.
      Delegate tasks appropriately.
    temperature: 0.5
    
  - name: coder
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: |
      You are a code implementation specialist.
      Write clean, efficient code.
    temperature: 0.3  # More precise for coding
    
  - name: reviewer
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: |
      You review code for issues.
      Be thorough and critical.
    temperature: 0.2  # Very precise
```

---

## Provider Fallback

```yaml
agents:
  - name: default
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    fallback:
      - provider: openai
        model: gpt-4o
```

---

## Custom System Prompts

### Project-Specific Context

```yaml
agents:
  - name: default
    systemPrompt: |
      You are helping work on the Acme Project.
      Tech stack: TypeScript, React, Node.js, PostgreSQL
      Code style: Functional, with TypeScript strict mode
      Testing: Jest, 80% coverage required
      Always check existing patterns before adding new code.
```

### Security-Focused

```yaml
agents:
  - name: secure
    systemPrompt: |
      You are a security-focused assistant.
      Always consider:
      - Input validation
      - SQL injection
      - XSS vulnerabilities
      - Authentication/authorization
      - Secret management
      Never suggest insecure patterns.
```

---

## Runtime Prompt Modification

You can also modify prompts at runtime:

```bash
# Temporary system prompt
opencode ask "Fix this" --system "You are debugging legacy PHP code"

# Override default agent
opencode chat --agent default --system "Today you are helping with Python"
```

---

## Agent Selection

### Default Agent

```yaml
agents:
  - name: default
    # This agent is used by default
    provider: anthropic
```

### Named Agents

```bash
# Use specific agent
opencode chat --agent code-reviewer

# Use for specific task
opencode ask "Review this" --agent reviewer --file code.ts
```

---

## Example: Complete Config

```yaml
version: "1.0"

providers:
  - name: anthropic
    provider: anthropic
    apiKey: ${ANTHROPIC_API_KEY}
    model: claude-3-5-sonnet-20241022

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

agents:
  - name: default
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: |
      You are an expert coding assistant.
      Help users write, debug, and understand code.
    temperature: 0.7
    maxTokens: 8192
    
  - name: code-review
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: |
      You are a code review specialist.
      Focus on security, performance, and correctness.
    temperature: 0.3
    maxTokens: 4096
    
  - name: fast
    provider: openai
    model: gpt-4o-mini
    systemPrompt: "Provide concise, quick answers."
    temperature: 0.5
    maxTokens: 2048

sessions:
  maxHistory: 100
  storage: sqlite
```
