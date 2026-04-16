# OpenCode Harness Integration Plan

**Classification:** Detailed implementation plan  
**Purpose:** How to add OpenCode as a harness provider in Agent Swarm  
**Scope:** Create `opencode-adapter.ts`, update `index.ts`, update Dockerfile, update entrypoint

---

## What Pi-Mono Is

**Pi-mono** (`@mariozechner/pi-coding-agent`) is an open-source coding agent by Mario Zechner (badlogic). It's a standalone TypeScript library that implements an AI coding agent with:
- Session management with persistence
- MCP tool integration
- Multiple model providers (Anthropic, OpenAI, Google)
- Event-driven architecture

**Should you use it?** No. Here's why:
1. **It's a different paradigm** — Pi-mono uses its own `AgentSession` API, not a CLI. It's a library, not a harness. The adapter wraps it as a library call, not a spawned process.
2. **It's less mature** — Claude adapter is 599 lines, pi-mono adapter is 535 lines but relies on a third-party library with its own quirks.
3. **Model support is limited** — The `@mariozechner/pi-ai` package only supports Anthropic, OpenAI, and Google directly. Your model map (GLM-5, MiniMax, DeepSeek, Nemotron, MiMo) would need custom provider implementations.
4. **No OpenCode integration** — Pi-mono doesn't know about OpenCode's plugin system, Spider Agent V4, or the swarm's quality gates. You'd lose all the Spider enforcement.

**Verdict:** Pi-mono is usable for basic coding tasks with Claude/OpenAI/Google models, but it's the wrong fit for your Spider Agent ecosystem. Skip it.

---

## How the Provider System Works

The Agent Swarm has a clean provider adapter interface at `src/providers/types.ts`:

```typescript
interface ProviderAdapter {
  readonly name: string;
  createSession(config: ProviderSessionConfig): Promise<ProviderSession>;
  canResume(sessionId: string): Promise<boolean>;
  formatCommand(commandName: string): string;
}
```

Two adapters exist:
- **ClaudeAdapter** — Spawns `claude` CLI as a subprocess, reads JSON stdout, normalizes events
- **PiMonoAdapter** — Creates a pi-coding-agent `AgentSession` via library API, subscribes to events

The factory at `src/providers/index.ts`:
```typescript
export function createProviderAdapter(provider: string): ProviderAdapter {
  switch (provider) {
    case "claude": return new ClaudeAdapter();
    case "pi": return new PiMonoAdapter();
    default: throw new Error(`Unknown HARNESS_PROVIDER: "${provider}"`);
  }
}
```

Selection is via `HARNESS_PROVIDER` env var (default: `claude`).

---

## The OpenCode Adapter Architecture

### Design Decision: CLI vs Library

OpenCode has two integration paths:
1. **CLI approach** (like Claude adapter): Spawn `opencode run` as subprocess, parse output
2. **SDK approach** (like pi-mono adapter): Use `@opencode-ai/sdk` as library

**Recommendation: CLI approach.** Here's why:
- OpenCode's CLI already supports `--print-logs --log-level DEBUG` for structured output
- The Spider Agent V4 plugin is already installed and configured in the Docker image
- CLI approach matches the Claude adapter pattern (proven, well-tested)
- SDK approach would require replicating the plugin loading logic

### What the OpenCode Adapter Needs to Do

1. **Spawn `opencode run`** with the right flags:
   ```bash
   opencode run --print-logs --log-level DEBUG --model <model> "<prompt>"
   ```

2. **Parse the JSON log output** — OpenCode emits structured JSON lines when `--print-logs` is enabled

3. **Normalize events** to the `ProviderEvent` union (same as Claude adapter does)

4. **Handle MCP tool integration** — OpenCode already has the swarm MCP tools via the plugin

5. **Track cost/usage** — Extract from OpenCode's output

6. **Handle errors** — Parse stderr for failures

---

## Implementation Steps

### Step 1: Create `src/providers/opencode-adapter.ts`

```typescript
import { unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getContextWindowSize } from "../utils/context-window";
import {
  parseStderrForErrors,
  SessionErrorTracker,
  trackErrorFromJson,
} from "../utils/error-tracker";
import type {
  CostData,
  ProviderAdapter,
  ProviderEvent,
  ProviderResult,
  ProviderSession,
  ProviderSessionConfig,
} from "./types";

class OpenCodeSession implements ProviderSession {
  private proc: ReturnType<typeof Bun.spawn>;
  private listeners: Array<(event: ProviderEvent) => void> = [];
  private eventQueue: ProviderEvent[] = [];
  private _sessionId: string | undefined;
  private completionPromise: Promise<ProviderResult>;
  private errorTracker = new SessionErrorTracker();
  private contextWindowSize: number;

  constructor(
    private config: ProviderSessionConfig,
    private model: string,
  ) {
    this.contextWindowSize = getContextWindowSize(model);
    const cmd = this.buildCommand();

    console.log(
      `\x1b[2m[${config.role}]\x1b[0m \x1b[35m▸\x1b[0m Spawning OpenCode (model: ${model}) for task ${config.taskId.slice(0, 8)}`,
    );

    this.proc = Bun.spawn(cmd, {
      cwd: this.config.cwd,
      env: {
        ...(config.env || process.env),
      } as Record<string, string>,
      stdout: "pipe",
      stderr: "pipe",
    });

    this.completionPromise = this.processStreams();
  }

  private buildCommand(): string[] {
    const cmd = [
      "opencode",
      "run",
      "--print-logs",
      "--log-level", "DEBUG",
      "--model", this.model,
      "-p", this.config.prompt,
    ];

    if (this.config.systemPrompt) {
      cmd.push("--append-system-prompt", this.config.systemPrompt);
    }

    return cmd;
  }

  private emit(event: ProviderEvent): void {
    if (this.listeners.length > 0) {
      for (const listener of this.listeners) {
        listener(event);
      }
    } else {
      this.eventQueue.push(event);
    }
  }

  private async processStreams(): Promise<ProviderResult> {
    const logFileHandle = Bun.file(this.config.logFile).writer();
    let stderrOutput = "";
    let stdoutChunks = 0;
    let stderrChunks = 0;
    let lastCost: CostData | undefined;
    let partialLine = "";

    const stdoutPromise = (async () => {
      const stdout = this.proc.stdout as ReadableStream<Uint8Array> | null;
      if (!stdout) return;

      for await (const chunk of stdout) {
        stdoutChunks++;
        const text = new TextDecoder().decode(chunk);
        logFileHandle.write(text);

        const combined = partialLine + text;
        const parts = combined.split("\n");
        partialLine = parts.pop() || "";

        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          this.emit({ type: "raw_log", content: trimmed });
          this.processJsonLine(trimmed, (cost) => {
            lastCost = cost;
          });
        }
      }
    })();

    const stderrPromise = (async () => {
      const stderr = this.proc.stderr as ReadableStream<Uint8Array> | null;
      if (!stderr) return;

      for await (const chunk of stderr) {
        stderrChunks++;
        const text = new TextDecoder().decode(chunk);
        stderrOutput += text;
        parseStderrForErrors(text, this.errorTracker);
        logFileHandle.write(
          `${JSON.stringify({ type: "stderr", content: text, timestamp: new Date().toISOString() })}\n`,
        );
        this.emit({ type: "raw_stderr", content: text });
      }
    })();

    await Promise.all([stdoutPromise, stderrPromise]);
    await logFileHandle.end();
    const exitCode = await this.proc.exited;

    return {
      exitCode: exitCode ?? 1,
      sessionId: this._sessionId,
      cost: lastCost,
      isError: (exitCode ?? 1) !== 0,
    };
  }

  private processJsonLine(trimmed: string, setCost: (cost: CostData) => void): void {
    try {
      const json = JSON.parse(trimmed);

      // Session ID from init message
      if (json.type === "system" && json.subtype === "init" && json.session_id) {
        this._sessionId = json.session_id;
        this.emit({ type: "session_init", sessionId: json.session_id });
      }

      // Cost data from result
      if (json.type === "result" && json.total_cost_usd !== undefined) {
        const cost: CostData = {
          sessionId: "",
          taskId: this.config.taskId,
          agentId: this.config.agentId,
          totalCostUsd: json.total_cost_usd || 0,
          inputTokens: json.usage?.input_tokens ?? 0,
          outputTokens: json.usage?.output_tokens ?? 0,
          cacheReadTokens: json.usage?.cache_read_input_tokens ?? 0,
          cacheWriteTokens: json.usage?.cache_creation_input_tokens ?? 0,
          durationMs: json.duration_ms || 0,
          numTurns: json.num_turns || 1,
          model: this.model,
          isError: json.is_error || false,
        };
        setCost(cost);
        this.emit({ type: "result", cost, isError: json.is_error || false });
      }

      // Tool use from assistant messages
      if (json.type === "assistant" && json.message?.content) {
        for (const block of json.message.content) {
          if (block.type === "tool_use" && block.name) {
            this.emit({
              type: "tool_start",
              toolCallId: block.id || "",
              toolName: block.name,
              args: block.input || {},
            });
          }
        }
      }

      trackErrorFromJson(json, this.errorTracker);
    } catch {
      // Not JSON — ignore
    }
  }

  get sessionId(): string | undefined {
    return this._sessionId;
  }

  onEvent(listener: (event: ProviderEvent) => void): void {
    this.listeners.push(listener);
    for (const event of this.eventQueue) {
      listener(event);
    }
    this.eventQueue = [];
  }

  async waitForCompletion(): Promise<ProviderResult> {
    return this.completionPromise;
  }

  async abort(): Promise<void> {
    this.proc.kill("SIGTERM");
  }
}

export class OpenCodeAdapter implements ProviderAdapter {
  readonly name = "opencode";

  async createSession(config: ProviderSessionConfig): Promise<ProviderSession> {
    const model = config.model || "0-glm-coding/glm-5";

    console.log(`\x1b[2m[opencode]\x1b[0m Spawning OpenCode for task ${config.taskId.slice(0, 8)}`);

    return new OpenCodeSession(config, model);
  }

  async canResume(_sessionId: string): Promise<boolean> {
    return true;
  }

  formatCommand(commandName: string): string {
    return `/${commandName}`;
  }
}
```

### Step 2: Update `src/providers/index.ts`

Add the import and case:

```typescript
import { OpenCodeAdapter } from "./opencode-adapter";

export function createProviderAdapter(provider: string): ProviderAdapter {
  switch (provider) {
    case "claude": return new ClaudeAdapter();
    case "pi": return new PiMonoAdapter();
    case "opencode": return new OpenCodeAdapter();
    default: throw new Error(`Unknown HARNESS_PROVIDER: "${provider}". Supported: claude, pi, opencode`);
  }
}
```

### Step 3: Update `docker-entrypoint.sh`

Add OpenCode to the validation section:

```bash
# Validate required environment variables based on provider
HARNESS_PROVIDER="${HARNESS_PROVIDER:-claude}"

if [ "$HARNESS_PROVIDER" = "opencode" ]; then
    # OpenCode auth: no special auth needed, just verify binary
    if ! command -v opencode > /dev/null 2>&1; then
        echo "Error: opencode binary not found"
        exit 1
    fi
elif [ "$HARNESS_PROVIDER" = "pi" ]; then
    # ... existing pi validation ...
else
    # ... existing claude validation ...
fi
```

### Step 4: Update `Dockerfile.spider-worker`

The Dockerfile already has OpenCode installed. Just need to ensure the entrypoint uses `HARNESS_PROVIDER=opencode`:

```dockerfile
ENV HARNESS_PROVIDER=opencode
```

### Step 5: Update `docker-compose.spider.yml`

Add `HARNESS_PROVIDER=opencode` to each worker's environment:

```yaml
environment:
  - HARNESS_PROVIDER=opencode
  - API_KEY=${API_KEY}
  - SWARM_API_URL=http://host.docker.internal:3013
  # ... rest of env vars ...
```

---

## Complexity Assessment

| Step | Effort | Risk | Notes |
|---|---|---|---|
| Create opencode-adapter.ts | Medium | Medium | ~200 lines, mostly copied from Claude adapter |
| Update index.ts | Trivial | None | 3 lines |
| Update docker-entrypoint.sh | Trivial | Low | Add opencode validation |
| Update Dockerfile.spider-worker | Trivial | None | Add HARNESS_PROVIDER env |
| Update docker-compose.spider.yml | Trivial | None | Add HARNESS_PROVIDER env |
| **Test end-to-end** | Medium | Medium | Need to verify JSON output format matches |

**Total effort:** ~2-3 hours of coding + testing

**Biggest risk:** OpenCode's `--print-logs --log-level DEBUG` output format may not exactly match the Claude CLI's JSON format. The adapter may need adjustment based on actual output.

---

## Alternative: Simpler Path

If the JSON output format doesn't match, there's a simpler approach:

**Use OpenCode's `run` command as a one-shot executor** — don't try to parse streaming JSON. Just:
1. Spawn `opencode run -p "<prompt>"`
2. Capture stdout as the result
3. Exit code 0 = success, non-zero = failure
4. No event normalization, no cost tracking

This loses real-time event streaming and cost tracking but gets the workers functional immediately. You can add the full streaming adapter later.

---

## What NOT to Do

- **Don't use pi-mono** — wrong paradigm, limited model support, no Spider integration
- **Don't try to use OpenCode SDK as a library** — would require replicating plugin loading, MCP setup, etc.
- **Don't modify the Agent Swarm API** — the API is fine, only the worker harness needs changing
