# Configuring OpenCode Providers

## Overview

Providers are the AI model backends that OpenCode uses. OpenCode supports multiple providers simultaneously.

---

## Supported Providers

| Provider | Models | Notes |
|---------|--------|-------|
| Anthropic | claude-3-5-sonnet, claude-3-opus | Best for complex reasoning |
| OpenAI | gpt-4o, gpt-4-turbo, gpt-3.5-turbo | Wide model selection |
| Ollama | Any local model | Self-hosted, local inference |
| Azure OpenAI | GPT-4, GPT-3.5 | Enterprise |
| Google AI | gemini-2.0-flash, gemini-pro | Google models |
| AWS Bedrock | Claude, Llama, Titan | AWS hosted |

---

## Anthropic Configuration

```yaml
providers:
  - name: anthropic
    provider: anthropic
    apiKey: ${ANTHROPIC_API_KEY}
    model: claude-3-5-sonnet-20241022
    # Optional overrides
    maxTokens: 8192
    temperature: 0.7
```

### Environment Variable

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

---

## OpenAI Configuration

```yaml
providers:
  - name: openai
    provider: openai
    apiKey: ${OPENAI_API_KEY}
    model: gpt-4o
    # Optional
    baseURL: https://api.openai.com/v1  # Default
    maxTokens: 4096
    temperature: 0.7
```

### Environment Variable

```bash
export OPENAI_API_KEY="sk-..."
```

---

## Ollama (Local) Configuration

```yaml
providers:
  - name: ollama
    provider: ollama
    baseURL: http://localhost:11434/v1
    model: llama3.3
    # Usually no API key needed for local
```

### Install Ollama

```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Then pull models
ollama pull llama3.3
ollama pull codellama

# Start server
ollama serve
```

---

## Azure OpenAI Configuration

```yaml
providers:
  - name: azure-openai
    provider: azure
    apiKey: ${AZURE_API_KEY}
    endpoint: https://my-resource.openai.azure.com
    apiVersion: "2024-02-01"
    model: gpt-4-turbo
```

### Environment Variable

```bash
export AZURE_API_KEY="..."
```

---

## Google AI Configuration

```yaml
providers:
  - name: google
    provider: google
    apiKey: ${GOOGLE_API_KEY}
    model: gemini-2.0-flash
```

### Environment Variable

```bash
export GOOGLE_API_KEY="..."
```

---

## AWS Bedrock Configuration

```yaml
providers:
  - name: bedrock
    provider: aws
    region: us-east-1
    model: anthropic.claude-3-5-sonnet-20241022-v1:0
    # Uses AWS credentials from environment or ~/.aws/credentials
```

### Environment Variables

```bash
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
```

---

## Multi-Provider Setup

```yaml
providers:
  - name: anthropic
    provider: anthropic
    apiKey: ${ANTHROPIC_API_KEY}
    model: claude-3-5-sonnet-20241022
    
  - name: openai
    provider: openai
    apiKey: ${OPENAI_API_KEY}
    model: gpt-4o
    
  - name: ollama
    provider: ollama
    baseURL: http://localhost:11434/v1
    model: llama3.3

agents:
  - name: default
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    
  - name: fast
    provider: openai
    model: gpt-4o-mini
    
  - name: local
    provider: ollama
    model: llama3.3
```

---

## Testing Provider Connection

```bash
# Test all providers
opencode doctor

# Test specific provider
opencode status --provider anthropic

# Quick inference test
opencode ask "Hello" --provider openai
```

---

## Provider-Specific Agent Settings

```yaml
agents:
  - name: default
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    temperature: 0.7
    maxTokens: 8192
    systemPrompt: "You are an expert programmer."
    
  - name: fast-response
    provider: openai
    model: gpt-4o-mini
    temperature: 0.5
    maxTokens: 2048
    systemPrompt: "Provide concise answers."
```

---

## Troubleshooting

### Connection Errors

```bash
# Check provider health
opencode health --verbose

# Verify API key
opencode config get providers.anthropic.apiKey

# Test network
curl -v https://api.anthropic.com
```

### Model Not Found

```bash
# List available models for provider
opencode providers list --verbose

# Update model name
opencode config set agents.default.model "claude-3-5-sonnet-20241022"
```

### Rate Limiting

```yaml
# Add retry configuration
providers:
  - name: anthropic
    provider: anthropic
    apiKey: ${ANTHROPIC_API_KEY}
    maxRetries: 3
    retryDelay: 1000  # ms
```
