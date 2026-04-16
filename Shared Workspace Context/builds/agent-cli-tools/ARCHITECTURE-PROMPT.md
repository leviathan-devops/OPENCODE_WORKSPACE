# Agent CLI Tools - Architecture Prompt

**For:** Spider Agent (independent build)  
**Purpose:** Build the same plugin independently, compare outputs  
**Document:** AGENT-CLI-TOOLS-PROMPT-001

---

## Task

Build a universal OpenCode plugin that exposes `gemini` and `qwen` CLI tools as native OpenCode tools.

**Location:** `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/`

---

## Context

### Why This Exists

Gemini CLI and Qwen Code CLI provide free coding agent capabilities:
- Gemini: 1000 req/day, 1M token context, Google Search grounding
- Qwen: 1000 req/day, autonomous mode (--yolo), optimized code models

Making these native OpenCode tools means ANY agent can use them without agent-specific code.

### Existing SKILL.md

There is an existing skill at:
```
~/OPENCODE_WORKSPACE/skills/plugin-coding-agent-cli/
├── SKILL.md
└── agent-coding-cli-architecture.md
```

This skill documents bash-level usage. The plugin should make these CLIs first-class tools.

---

## Requirements

### 1. Universal Availability

- Plugin registers two tools: `gemini` and `qwen`
- ANY OpenCode agent can call these tools
- No agent-specific code in the plugin

### 2. Tool Interface

**gemini tool:**
```typescript
interface GeminiArgs {
  prompt: string;                              // Required
  model?: 'gemini-2.5-flash' | 'gemini-2.5-pro';  // Default: flash
  sandbox?: boolean;                           // Default: false
  outputFormat?: 'json' | 'text';             // Default: json
  timeout?: number;                           // Default: 120
}

interface GeminiResult {
  success: boolean;
  response?: string | object;
  error?: { code: string; message: string; };
  metadata: { model: string; tokensUsed?: number; reqCount: number; remaining: number; };
}
```

**qwen tool:**
```typescript
interface QwenArgs {
  prompt: string;                              // Required
  yolo?: boolean;                             // Default: false
  model?: string;                             // Default: qwen3-coder
  outputFormat?: 'json' | 'text';             // Default: json
  timeout?: number;                            // Default: 120
}

interface QwenResult {
  success: boolean;
  response?: string | object;
  error?: { code: string; message: string; };
  metadata: { model: string; tokensUsed?: number; reqCount: number; remaining: number; };
}
```

### 3. CLI Commands

**Gemini:**
```bash
gemini -p "<prompt>" [-m <model>] [-s] [--output-format json]
```

| Arg | CLI Flag |
|-----|----------|
| prompt | `-p` |
| model | `-m` (when not default) |
| sandbox | `-s` |
| outputFormat: json | `--output-format json` |

**Qwen:**
```bash
qwen -p "<prompt>" [--yolo] [-m <model>] [--output-format json]
```

| Arg | CLI Flag |
|-----|----------|
| prompt | `-p` |
| yolo | `--yolo` |
| model | `-m` (when not default) |
| outputFormat: json | `--output-format json` |

### 4. Error Handling

Error codes:
- `TIMEOUT` - CLI did not complete within timeout
- `CLI_ERROR` - CLI exited with non-zero code
- `PARSE_ERROR` - CLI output was not valid JSON
- `INVALID_ARGS` - Zod validation failed
- `INVOCATION_ERROR` - Failed to spawn CLI process

### 5. Implementation Details

- Use `child_process.spawn` for CLI invocation
- Use Zod for argument validation
- JSON output by default
- 120s timeout default, configurable
- Structured error responses

---

## File Structure

```
agent-cli-tools/
├── src/
│   ├── index.ts              # Plugin entry
│   ├── tools/
│   │   ├── index.ts         # Tool registry
│   │   ├── gemini.ts        # Gemini tool
│   │   ├── qwen.ts          # Qwen tool
│   │   └── types.ts         # Zod schemas + types
│   └── utils/
│       ├── cli.ts            # CLI invocation
│       ├── logger.ts         # Logging
│       └── parse.ts          # JSON parsing
├── package.json
├── tsconfig.json
└── README.md
```

---

## Boilerplate Reference

Use this boilerplate as a reference for plugin structure:
```
~/OPENCODE_WORKSPACE/sandbox_migration/Agent-Plugin-Boilerplate/
```

Key files:
- `src/index.ts` - Plugin entry, exports Hooks interface
- `src/tools/my-tool.ts` - Example tool with Zod
- `src/tools/index.ts` - Tool registry
- `package.json` - Dependencies

---

## Context Library

Save your architecture and design decisions to:
```
~/hermes-workspace/context/builds/agent-cli-tools/
```

Required files:
- `ARCHITECTURE.md` - Your architecture decisions
- `IMPLEMENTATION.md` - How you implemented each component

---

## Verification

After building:

1. `bun run build` succeeds
2. `dist/index.js` and `dist/index.d.ts` created
3. TypeScript compilation clean
4. Tools appear when plugin loads

---

## Deliverables

1. Complete plugin at `~/OPENCODE_WORKSPACE/plugins/agent-cli-tools/`
2. Architecture doc at `~/hermes-workspace/context/builds/agent-cli-tools/ARCHITECTURE.md`
3. Implementation notes at `~/hermes-workspace/context/builds/agent-cli-tools/IMPLEMENTATION.md`

---

## Notes

- This is a tool wrapper, not an orchestrator
- Do NOT implement multi-agent coordination
- Do NOT manage session state between calls
- Caller controls parallelism (use Promise.all)
- Keep it simple and minimal
