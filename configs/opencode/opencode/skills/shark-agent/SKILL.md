name: shark-agent
description: Dual-mode autonomous coding agent with build-test-verify loops. Micro mode uses DeepSeek R1 as brain with Qwen executor. Macro mode uses GLM Coding Plan as primary brain with optional DeepSeek consultation. Use when user mentions "shark agent", "micro/macro mode", "autonomous coding", "build and test automatically", or wants AI to manage the full development pipeline from code generation to verification.

## When to Use
- User explicitly requests "shark agent"
- User wants "micro mode" or "macro mode" coding
- User asks for autonomous build-test-verify loops
- User needs AI-managed development pipeline
- User mentions DeepSeek + Qwen orchestration

## Configuration
Before first use, verify or create `~/.shark-agent/config.json`:

```json
{
  "mode": "micro",
  "micro": {
    "deepseek_api_key": "your-deepseek-api-key",
    "executor": {
      "type": "local",
      "endpoint": "http://localhost:8080/v1",
      "model": "qwen2.5-coder-7b-instruct"
    }
  },
  "macro": {
    "glm_api_key": "your-glm-coding-plan-key",
    "glm_base_url": "https://api.z.ai/api/coding/paas/v4",
    "glm_model": "glm-4.5-flash",
    "deepseek_api_key": "your-deepseek-api-key"
  }
}
```

## Mode Selection
After reading config, determine mode:
- `micro`: DeepSeek R1 brain + Qwen executor (lobotomized)
- `macro`: GLM Coding Plan brain + DeepSeek (passive consultant)

## Core Workflow
### Phase 1: Initialize Session
1. Read config from `~/.shark-agent/config.json`
2. Load mode-specific reference
3. Initialize API clients
4. Confirm mode with user

### Phase 2: Execute Build-Test-Verify Loop
Shared pipeline both modes use:
1. **BUILD**: Active brain writes code
2. **TEST**: Run in sandbox (unit/integration/edge/security)
3. **VERIFY**: If fail → diagnose → fix → loop
4. **CLEAN-ENV**: Test in bare Ubuntu image
5. **OPTIMIZE**: Review for perf/security/edge cases
6. **APPROVAL** (Macro only): GLM calls DeepSeek for sign-off
7. **OUTPUT**: Return final artifact

## API Clients
### GLM Coding Plan (Macro primary brain)
```typescript
const response = await fetch(`${config.macro.glm_base_url}/chat/completions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.macro.glm_api_key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: config.macro.glm_model,
    messages: [...]
  })
});
```

### DeepSeek R1 (Micro brain / Macro secondary)
```typescript
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-reasoner',
    messages: [...]
  })
});
```

## Rules
### MUST
- Read config before every session
- Run ALL test types (unit, integration, edge, security)
- Run clean-environment verification
- In Macro mode: Get DeepSeek approval before final output
- Save session state after each phase

### NEVER
- Skip test phases
- Output without clean-env verification
- Let Micro executor make independent decisions
- In Macro mode: Output without DeepSeek approval