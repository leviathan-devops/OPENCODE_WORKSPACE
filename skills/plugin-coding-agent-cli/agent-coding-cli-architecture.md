# Plugin Coding Agent CLI Architecture

## Overview

A multi-agent orchestration pattern where **OpenCode/Hermes agents** act as conductors, delegating specialized coding tasks to **Gemini CLI** and **Qwen Code** as sub-agents. This architecture enables:

- **Parallel execution** of multiple AI coding agents
- **Unbiased code review** from external model perspectives
- **Reduced API costs** by leveraging free-tier CLI tools
- **Architecture plugin injection** to enforce dev processes
- **Double-dipping on free usage** across multiple agents

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode/Hermes (Lead Agent)              │
│                    ─────────────────────────────              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Orchestrate │  │   Inject    │  │   Aggregate &       │ │
│  │  & Delegate │  │  Arch Rules │  │   Validate Results  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────────┼────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│   Gemini CLI    │ │   Qwen Code    │ │  Gemini CLI         │
│   (Sub-Agent)   │ │   (Sub-Agent)  │ │  (Sub-Agent #N)     │
│                 │ │                 │ │                     │
│ • Google Search │ │ • Qwen3-Coder  │ │ • Parallel Review   │
│ • 1M Token ctx  │ │ • --yolo mode  │ │ • Different Model   │
│ • Sandbox mode  │ │ • Free OAuth   │ │ • Fresh Perspective │
└─────────────────┘ └─────────────────┘ └─────────────────────┘
          │                │                    │
          └────────────────┴────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  JSON/JSONL  │
                    │   Results   │
                    │   Pipeline  │
                    └─────────────┘
```

## Components

### 1. Lead Agent (OpenCode/Hermes)

**Role**: Orchestrator, router, validator

**Responsibilities**:
- Decompose tasks into sub-tasks for external agents
- Inject architecture plugins (dev process rules)
- Route to appropriate sub-agent based on task type
- Aggregate and validate results
- Handle errors and retry logic

**Tools Used**:
- `Bash` — invoke CLI commands
- `Task` — spawn sub-agents for parallel work
- `Read/Write` — manage context files and results

### 2. Sub-Agents (Gemini CLI & Qwen Code)

**Role**: Specialized execution engines

**Gemini CLI Strengths**:
- Google Search grounding for real-time info
- 1M token context window
- Sandbox mode for security
- 60 req/min, 1000 req/day free (Google account)

**Qwen Code Strengths**:
- `--yolo` mode for autonomous operation
- Qwen3-Coder models optimized for code
- 1000 req/day free (Qwen OAuth)
- OpenAI-compatible API support

### 3. Architecture Plugin Layer

**Purpose**: Ensure sub-agents follow your team's development process

**Injection Methods**:

```bash
# Method 1: Context files in project
.gemini/GEMINI.md    # Gemini CLI reads this automatically
.qwen/QWEN.md        # Qwen Code reads this automatically

# Method 2: Inline in prompt
gemini -p "TASK: ...
ARCHITECTURE RULES:
- Max function length: 50 lines
- No any types
- Tests required..."

# Method 3: Trusted Folders
~/.gemini/settings.json  # Define trusted dirs for permissionless exec
```

### 4. Result Pipeline

```bash
# JSON output for easy parsing
gemini -p "<task>" --output-format json > result.json

# Streaming for real-time monitoring
gemini -p "<task>" --output-format stream-json | tee stream.jsonl

# Parallel execution with wait
gemini ... &
qwen ... &
gemini-2.5-pro ... &
wait
```

## Usage Patterns

### Pattern 1: Parallel Code Review

```bash
# Lead agent spawns 3 reviewers simultaneously
┌─────────────────────────────────────────────────┐
│ Lead Agent: "Review PR #42 for security issues" │
└────────────────────┬────────────────────────────┘
                     │
       ┌─────────────┼─────────────┬─────────────┐
       ▼             ▼             ▼             ▼
   ┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐
   │Gemini │    │ Qwen  │    │Gemini │    │Merge  │
   │Flash  │    │Code   │    │ Pro   │───▶│Findings│
   │Review │    │Review │    │Review │    │& Prior│
   └───┬───┘    └───┬───┘    └───┬───┘    └───┬───┘
       └────────────┴────────────┘             │
                                             ▼
                                       ┌───────────┐
                                       │Final Report│
                                       │to Human    │
                                       └───────────┘
```

**Implementation**:
```bash
# Each sub-agent reviews independently
gemini -p "SECURITY REVIEW: $(git diff PR #42)" --output-format json > /tmp/sec1.json &
qwen -p "SECURITY REVIEW: $(git diff PR #42)" --output-format json > /tmp/sec2.json &
gemini -m gemini-2.5-pro -p "SECURITY REVIEW: $(git diff PR #42)" --output-format json > /tmp/sec3.json &

wait

# Lead agent aggregates
jq -s 'map(.response) | map(split("\n")) | flatten | group_by(.) | map({issue: .[0], count: length}) | sort_by(.count) | reverse' /tmp/sec*.json
```

### Pattern 2: Multi-Agent Consensus

```bash
# Three agents analyze same code, lead agent reconciles
gemini -p "Architecture analysis: $(cat design.md)" --output-format json > /tmp/arch1.json &
qwen -p "Architecture analysis: $(cat design.md)" --output-format json > /tmp/arch2.json &
gemini -m gemini-2.0-pro -p "Architecture analysis: $(cat design.md)" --output-format json > /tmp/arch3.json &

wait

# Check consensus
# If all 3 agree on issue X → high confidence
# If split → need human arbitration
```

### Pattern 3: Sequential Refinement

```bash
# Round 1: Analysis
gemini -p "Analyze this code, list issues by severity: $(cat src/module.ts)" \
  --output-format json > /tmp/analysis.json

# Round 2: Fix (Qwen autonomous)
qwen -p "Fix the CRITICAL and HIGH issues: $(cat /tmp/analysis.json)" --yolo \
  --output-format json > /tmp/fixes.json

# Round 3: Validation
gemini -p "Validate fixes in original code: $(cat src/module.ts), fixes: $(cat /tmp/fixes.json)" \
  --output-format json > /tmp/validation.json

# Lead agent checks validation.json, escalates if needed
```

### Pattern 4: Research with Grounding

```bash
# Gemini with Search grounding for real-time info
gemini -p "Research latest React Server Components best practices" \
  --output-format json > /tmp/react-research.json

# Qwen for code-specific patterns
qwen -p "Find examples of RSC patterns in production apps" \
  --output-format json > /tmp/rsc-examples.json

# Combine for decision doc
```

## Architecture Plugin Injection

### Project-Level Context Files

Create these in your project root:

**`.gemini/GEMINI.md`**:
```markdown
# Project Architecture Rules

## Code Style
- TypeScript strict mode enabled
- No `any` types — use `unknown` + type guards
- Max function length: 50 lines
- No barrel imports

## Testing Requirements
- Vitest for all unit tests
- Minimum 80% coverage
- Snapshot tests for UI components

## Git Workflow
- Conventional commits (conventionalcommits.org)
- PR required for main branch
- Squash merge to main

## Error Handling
- Result<E, T> pattern for expected errors
- Never swallow exceptions
- Log with structured logging (pino)

## Security
- No secrets in code
- Input validation on all boundaries
- SQL injection prevention
```

**`.qwen/QWEN.md`**:
```markdown
# Project Rules for Qwen Code

Same as .gemini/GEMINI.md - Qwen reads this file when present.
```

### Per-Task Injection

```bash
# Inline architecture for specific tasks
gemini -p "REFACTOR TASK:
File: $(cat src/legacy.ts)

Rules:
1. Convert to TypeScript strict
2. Add error handling
3. Add unit tests
4. Max function length: 50 lines

DO NOT proceed if rules cannot be met.
"
```

## File Structure

```
project/
├── .gemini/
│   └── GEMINI.md           # Architecture rules (Gemini auto-loads)
├── .qwen/
│   └── QWEN.md             # Architecture rules (Qwen auto-loads)
├── .github/
│   └── workflows/
│       └── ai-review.yml   # CI with parallel agent review
└── docs/
    └── agent-architecture.md  # This document
```

## Security Considerations

### Sandbox Mode

```bash
# Gemini: Run in isolated container
gemini -s -p "analyze untrusted code"

# Qwen: Use yolo mode cautiously
qwen -p "refactor this" --yolo
```

### Trusted Folders

```json
// ~/.gemini/settings.json
{
  "security": {
    "trustedFolders": [
      "/home/user/workspace/trusted-project"
    ]
  }
}
```

### Secrets Management

```bash
# Use env vars, not hardcoded keys
export GEMINI_API_KEY="..."
export DASHSCOPE_API_KEY="..."

# Sub-agents inherit env vars from parent shell
```

## Free Tier Management

| Agent | Daily Limit | Rate Limit | Strategy |
|-------|-------------|-------------|----------|
| Gemini | 1,000 req/day | 60 req/min | Queue requests, batch by priority |
| Qwen | 1,000 req/day | Varies | Use --yolo for bulk refactors |

**Optimization Tips**:
- Use streaming for large outputs (avoid retry burn)
- Cache responses for similar queries
- Parallelize to maximize daily throughput
- Use headless mode only (no tokens wasted on UI)

## OpenCode Agent Pilotability

### Can OpenCode Agents Pilot These?

**Yes** — Both CLIs are fully scriptable:

```bash
# OpenCode agent uses Bash tool
const result = await bash(`gemini -p "review: $(cat file)" --output-format json`);
const { response } = JSON.parse(result);

// Can also use Task tool for true parallelism
const subagents = await Promise.all([
  task({ prompt: "Review auth: ...", agent: "coder" }),
  task({ prompt: "Review api: ...", agent: "coder" }),
  task({ prompt: "Review utils: ...", agent: "coder" }),
]);
```

### Integration via MCP (Future)

If OpenCode MCP tools are extended:
- `mcp__gemini__invoke({ prompt, outputFormat })`
- `mcp__qwen__invoke({ prompt, yolo })`

Currently, Bash tool wrapper is sufficient.

## Anti-Patterns to Avoid

1. **No infinite loops** — Set max iterations, validate each round
2. **No blind trust** — Re-validate critical advice from sub-agents
3. **No missing timeouts** — Sub-agent hangs block orchestrator
4. **No unmapped secrets** — Don't pass API keys in prompts
5. **No unbounded context** — Pre-summarize large codebases

## Example: Full Code Review Pipeline

```bash
#!/bin/bash
# .github/workflows/ai-review.yml (simplified)

ISSUE_NUMBER=$1
PR_DIFF=$(git diff main...PR-$ISSUE_NUMBER)

# Parallel review
echo "Starting parallel reviews..."
gemini -p "Security review: $PR_DIFF" --output-format json > /tmp/sec.json &
qwen -p "Best practices review: $PR_DIFF" --output-format json > /tmp/bp.json &
gemini -m gemini-2.5-pro -p "Performance review: $PR_DIFF" --output-format json > /tmp/perf.json &

wait

# Aggregate
jq -s '{
  security: .[0].response,
  bestPractices: .[1].response, 
  performance: .[2].response,
  totalTokens: [.[].stats.totalTokens] | add
}' /tmp/sec.json /tmp/bp.json /tmp/perf.json > /tmp/final-review.json

# Post comment
gh pr comment $ISSUE_NUMBER --body "$(cat /tmp/final-review.json)"

echo "Review complete. Tokens used: $(jq '.totalTokens' /tmp/final-review.json)"
```

## Success Metrics

- **Time saved**: Human reviewer hours vs agent minutes
- **Issues caught**: Bug frequency pre/post agent review
- **Cost reduction**: API calls saved by using free-tier CLIs
- **Parallelism gain**: Tasks completed per hour with multi-agent execution
