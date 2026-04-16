# Agent CLI Tools - Purpose

## Why This Exists

Gemini CLI and Qwen Code CLI provide free coding agent capabilities:
- **Gemini**: 1000 req/day, 1M token context, Google Search grounding
- **Qwen**: 1000 req/day, autonomous mode (--yolo), optimized code models

The `plugin-coding-agent-cli` SKILL.md documents manual usage via bash. This plugin makes them first-class OpenCode tools available to any agent.

## Problem Solved

Currently, using Gemini/Qwen requires:
- Manual bash command execution
- String-based prompts with command substitution
- Manual JSON parsing
- No native tool interface

With this plugin:
- Native `/tool gemini {...}` interface
- Zod-validated arguments
- Structured JSON responses
- Proper error handling

## Design Goals

| Goal | Implementation |
|------|----------------|
| Universal | Plugin registers tools available to ANY agent |
| Structured | JSON by default, parseable responses |
| Resilient | Timeout, fallbacks, structured errors |
| Composable | Can be chained, parallelized by caller |
| Minimal | CLI wrapper, not a framework |

## Free Tier Leverage

| Agent | Daily Limit | Combined |
|-------|-------------|----------|
| Gemini CLI | 1000 req/day | |
| Qwen Code | 1000 req/day | |
| **Total** | **2000 req/day** | +2000 RPD |

Running 3 agents in parallel (Gemini Flash + Qwen + Gemini Pro) = 3000 effective req/day.

## Architecture Context

```
OpenCode Agent (any)
    │
    ├── /tool gemini {...}
    │       │
    │       └── gemini CLI (sub-agent)
    │               ├── 1M token context
    │               ├── Search grounding
    │               └── JSON output
    │
    └── /tool qwen {...}
            │
            └── qwen CLI (sub-agent)
                    ├── --yolo autonomy
                    ├── Qwen3-Coder model
                    └── JSON output
```

## Non-Goals

- This is NOT an orchestrator
- This is NOT a multi-agent coordination layer
- This does NOT manage session state between calls
- Caller controls parallelism, chaining, and workflow

The plugin is a tool wrapper, not a workflow engine.
