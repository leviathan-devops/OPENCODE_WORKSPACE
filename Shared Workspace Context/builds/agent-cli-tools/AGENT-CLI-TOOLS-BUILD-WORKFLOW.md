# Agent CLI Tools Plugin - Build Workflow

**Document ID:** AGENT-CLI-TOOLS-WORKFLOW-001  
**Date:** 2026-04-03  
**Author:** Leviathan Agent (MiniMax-M2.7)  
**Status:** DRAFT - Ready for Execution  
**Comparison Target:** Spider Agent will build same plugin independently

---

## Overview

**Purpose:** Build a universal OpenCode plugin that exposes `gemini` and `qwen` CLI tools as native OpenCode tools — available to ANY agent without agent-specific code.

**Core Value:**
- +2000 free RPD (1000 Gemini + 1000 Qwen per day)
- Universal: works with Spider, Shark, Kraken, Hermes, or any agent
- Parallel execution capability via background terminals
- Search grounding (Gemini) + autonomous mode (Qwen)

---

## Architecture

### Context Library Location

```
~/hermes-workspace/context/builds/agent-cli-tools/
├── ARCHITECTURE.md                    # This document
├── BUILD-STEPS.md                     # Step-by-step implementation
└── context/
    ├── PURPOSE.md                      # Why this exists
    ├── DESIGN.md                       # Design decisions
    ├── TOOL-SPEC.md                    # Tool interfaces
    └── EXAMPLES.md                     # Usage examples
```

### Plugin Location

```
~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/
├── src/
│   ├── index.ts                       # Plugin entry
│   ├── tools/
│   │   ├── index.ts                   # Tool registry
│   │   ├── gemini.ts                 # Gemini CLI wrapper
│   │   ├── qwen.ts                   # Qwen CLI wrapper
│   │   └── types.ts                  # Shared types
│   └── utils/
│       ├── cli.ts                     # CLI invocation
│       └── parse.ts                   # JSON output parsing
├── package.json
├── tsconfig.json
└── README.md
```

---

## Context Library Contents

### PURPOSE.md

**Why This Exists:**
- Gemini CLI + Qwen Code = free coding agents with 1000 RPD each
- Current SKILL.md documents usage but requires manual bash calls
- Plugin approach makes them first-class OpenCode tools
- Universal = not tied to any specific agent architecture

**Design Goals:**
1. Universal availability — any agent can call these tools
2. Structured output — JSON by default, parseable
3. Error resilience — timeout, fallbacks, structured errors
4. Composable — can be chained, parallelized
5. Minimal overhead — CLI wrapper, not a framework

### DESIGN.md

**Architecture Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tool registration | OpenCode plugin | Native integration, not bash |
| CLI invocation | Child process spawn | Full CLI features, streaming capable |
| Output format | JSON default | Parseable, chainable results |
| Error handling | Structured JSON errors | Consistent, machine-readable |
| Timeout | 120s default, configurable | Prevent hanging |
| Parallelism | Caller-controlled | Caller uses Promise.all() |
| Rate limit exposure | In response metadata | Caller can track |

**Tool Comparison:**

| Feature | Gemini CLI | Qwen Code |
|---------|------------|-----------|
| Free tier | 1000 req/day | 1000 req/day |
| Context window | 1M tokens | ~128k tokens |
| Search grounding | Yes | No |
| Autonomous mode | Sandbox | `--yolo` |
| Architecture rules | `.gemini/GEMINI.md` | `.qwen/QWEN.md` |
| Structured output | `--output-format json` | `--output-format json` |

**Security Model:**
- Sandbox mode for Gemini (`-s`) for untrusted code
- `--yolo` for Qwen = no approval prompts (use cautiously)
- Architecture rules via context files (`.gemini/GEMINI.md`)
- No secrets in prompts — use env vars

### TOOL-SPEC.md

```typescript
// Gemini Tool
interface GeminiToolArgs {
  prompt: string;                              // Required
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro'; // Default: flash
  sandbox?: boolean;                           // Default: false
  outputFormat?: 'json' | 'text';             // Default: json
  timeout?: number;                           // Default: 120 (seconds)
}

interface GeminiToolResult {
  success: boolean;
  response?: string | object;
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    reqCount: number;
    remaining: number;
  };
}

// Qwen Tool
interface QwenToolArgs {
  prompt: string;                              // Required
  yolo?: boolean;                             // No approval prompts
  model?: string;                              // Default: qwen3-coder
  outputFormat?: 'json' | 'text';             // Default: json
  timeout?: number;                            // Default: 120
}

interface QwenToolResult {
  success: boolean;
  response?: string | object;
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    reqCount: number;
    remaining: number;
  };
}
```

### EXAMPLES.md

```typescript
// Single call
const geminiResult = await tools.gemini({
  prompt: "Review this code for security issues: $(cat src/auth.ts)"
});

// Parallel calls
const [security, quality, performance] = await Promise.all([
  tools.gemini({ prompt: "Security review: $(git diff)", model: "gemini-2.5-flash" }),
  tools.qwen({ prompt: "Best practices review: $(git diff)" }),
  tools.gemini({ prompt: "Performance review: $(git diff)", model: "gemini-2.5-pro" }),
]);

// Sequential refinement
const analysis = await tools.gemini({ 
  prompt: "Analyze and list issues by severity: $(cat src/module.ts)"
});
const fixes = await tools.qwen({ 
  prompt: "Fix the CRITICAL/HIGH issues: $(cat /tmp/issues.json)",
  yolo: true 
});
const validation = await tools.gemini({ 
  prompt: "Validate fixes: $(cat src/module.ts)" 
});

// Research + Execution
const research = await tools.gemini({ 
  prompt: "Best practices for auth implementation" 
});
const implementation = await tools.qwen({ 
  prompt: "Implement auth following: $(cat /tmp/research.json)",
  yolo: true 
});
```

---

## Build Steps

### PHASE 1: Scaffold

1. Create plugin directory structure
2. Create package.json with dependencies
3. Create tsconfig.json
4. Create plugin entry point (src/index.ts)

### PHASE 2: Core Tools

5. Create types (src/tools/types.ts)
6. Create CLI invocation utility (src/utils/cli.ts)
7. Create JSON parsing utility (src/utils/parse.ts)
8. Create Gemini tool (src/tools/gemini.ts)
9. Create Qwen tool (src/tools/qwen.ts)
10. Create tool registry (src/tools/index.ts)

### PHASE 3: Integration

11. Wire tools into plugin entry point
12. Add logging
13. Add error handling middleware

### PHASE 4: Testing

14. Build plugin
15. Test Gemini tool in isolation
16. Test Qwen tool in isolation
17. Test parallel execution
18. Test error cases (timeout, invalid JSON, etc.)

### PHASE 5: Documentation

19. Create README.md
20. Update context library with final state

---

## Verification Checklist

### Pre-Flight
- [ ] Node.js >= 20.0.0 available
- [ ] bun >= 1.0.0 available
- [ ] `gemini` CLI installed and in PATH
- [ ] `qwen` CLI installed and in PATH
- [ ] Plugin directory created

### Build
- [ ] `bun run build` succeeds
- [ ] `dist/` directory created
- [ ] TypeScript compilation clean

### Functional
- [ ] `gemini -p "test" --output-format json` works
- [ ] `qwen -p "test" --output-format json` works
- [ ] Plugin loads in OpenCode
- [ ] Tools appear in `/tools list`
- [ ] Calling tool returns structured JSON
- [ ] Timeout works
- [ ] Error handling returns structured errors

### Parallel Execution
- [ ] Background gemini processes spawn
- [ ] Results aggregate correctly
- [ ] Rate limit tracking works

---

## Comparison Criteria (Spider Agent vs Leviathan)

When Spider Agent builds the same plugin independently, compare:

| Criterion | Spider Output | Leviathan Output |
|-----------|---------------|------------------|
| File structure | Matches expected? | Matches expected? |
| Tool interface | Same args/returns? | Same args/returns? |
| Error handling | Same error structure? | Same error structure? |
| CLI invocation | Same spawn approach? | Same spawn approach? |
| Type safety | Zod schemas match? | Zod schemas match? |
| Code clarity | Readable? | Readable? |
| Edge cases | Covered? | Covered? |

---

## File Manifest

| File | Purpose | Priority |
|------|---------|----------|
| `AGENT-CLI-TOOLS-BUILD-WORKFLOW.md` | This document | Required |
| `BUILD-STEPS.md` | Step-by-step implementation | Required |
| `context/PURPOSE.md` | Why this exists | Required |
| `context/DESIGN.md` | Architecture decisions | Required |
| `context/TOOL-SPEC.md` | Tool interfaces | Required |
| `context/EXAMPLES.md` | Usage examples | Required |
| `src/index.ts` | Plugin entry | Required |
| `src/tools/gemini.ts` | Gemini wrapper | Required |
| `src/tools/qwen.ts` | Qwen wrapper | Required |
| `src/tools/types.ts` | Shared types | Required |
| `src/utils/cli.ts` | CLI invocation | Required |
| `src/utils/parse.ts` | JSON parsing | Required |
| `package.json` | Dependencies | Required |
| `tsconfig.json` | TypeScript config | Required |
| `README.md` | Documentation | Medium |

---

*Document ID: AGENT-CLI-TOOLS-WORKFLOW-001*
*Status: DRAFT*
*Next: Execute BUILD-STEPS.md*
