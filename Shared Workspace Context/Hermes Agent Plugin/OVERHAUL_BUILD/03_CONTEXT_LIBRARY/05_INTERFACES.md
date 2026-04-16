# Interfaces — SDK Contracts and Tool Schemas

## Plugin SDK Interface (`@opencode-ai/plugin` v1.1.53)

### ToolContext
```typescript
type ToolContext = {
  sessionID: string;
  messageID: string;
  agent: string;
  directory: string;      // Current project directory
  worktree: string;       // Project worktree root (may be undefined!)
  abort: AbortSignal;
  metadata(input: { title?: string; metadata?: Record<string,any> }): void;
  ask(input: AskInput): Promise<void>;
};
```

**Critical note:** `worktree` may be `undefined` in some OpenCode contexts. Always use `context.directory ?? context.worktree ?? process.cwd()` as fallback chain.

### Tool Definition Pattern
```typescript
import { tool } from "./create-tool.js";

export const myTool = tool({
  description: "What this tool does",
  args: {
    param: tool.schema.string().describe("Parameter description"),
  },
  execute: async (args, context) => {
    // Always handle worktree being undefined:
    const baseDir = context.directory ?? context.worktree ?? process.cwd();
    return `result`;
  },
});
```

### Hook Handler Types
```typescript
// tool.execute.before
type BeforeHook = (input: { tool: string; sessionID: string; callID: string },
                   output: { args: any }) => Promise<void>

// tool.execute.after
type AfterHook = (input: { tool: string; sessionID: string; callID: string },
                  output: { title: string; output: string; metadata: any }) => Promise<void>

// messages.transform
type TransformHook = (input: {},
                      output: { messages: { info: Message; parts: Part[] }[] }) => Promise<void>

// chat.system.transform
type SystemTransformHook = (input: { sessionID?: string; model: Model },
                            output: { system: string[] }) => Promise<void>

// chat.params
type ParamsHook = (input: { sessionID, agent, model, provider, message },
                   output: { temperature, topP, topK, options }) => Promise<void>

// command.execute.before
type CommandHook = (input: { command: string; args: string[] },
                    output: { handled: boolean }) => Promise<void>

// session.compacting
type CompactingHook = (input: { sessionID: string },
                       output: { context: string[]; prompt?: string }) => Promise<void>
```

### Agent Registration Shape
```typescript
export default {
  name: "hermes-agent",
  agent: {
    hermes: {
      mode: "primary",
      permission: { task: "allow" },
      config: async (opencodeConfig) => {
        return {
          prompt: "...", // agent prompt
        };
      }
    },
    analyst: {
      mode: "subagent",
      config: async (opencodeConfig) => {
        return {
          prompt: "...",
        };
      }
    },
    // ... all 19 agents
  },
  hooks: composeHandlers([...29 hooks...]),
  tools: {
    checkpoint: {...},
    // ... all 28 tools
  },
};
```

---

## Tool Schemas

### phase_complete
```typescript
args: {
  phase: tool.schema.enum(["analyze", "plan", "build", "review", "debug", "complete"])
},
execute: async (args, context) => {
  // Validates transition is legal per PHASE_TRANSITIONS map
  // Writes to .hermes/phase.json
  // Returns { previousPhase, currentPhase, persisted }
}
```

### hermes_recall
```typescript
args: {
  query: tool.schema.string(),
  limit: tool.schema.number().optional().default(5),
},
execute: async (args, context) => {
  // Searches ~/.hermes/memory/*.json
  // Returns { memories: Array<{key, content, session, relevance}> }
}
```

### hermes_remember
```typescript
args: {
  key: tool.schema.string(),
  content: tool.schema.string(),
  tags: tool.schema.array(tool.schema.string()).optional(),
},
execute: async (args, context) => {
  // Writes to ~/.hermes/memory/[hash].json
  // Returns { stored: boolean, key }
}
```

### hermes_context
```typescript
args: {
  topic: tool.schema.string(),
},
execute: async (args, context) => {
  // Searches memory for topic, injects into context
  // Returns { injected: boolean, memoryCount: number }
}
```

### checkpoint
```typescript
args: {
  message: tool.schema.string(),
},
execute: async (args, context) => {
  // Creates git stash + session state savepoint
  // Writes to .hermes/checkpoints/[id].json
  // Returns { checkpointId, path, status }
}
```

### lint
```typescript
args: {
  path: tool.schema.string().optional(),
  fix: tool.schema.boolean().optional().default(false),
},
execute: async (args, context) => {
  // Runs ESLint with combined stdout+stderr (ESLint 10 fix)
  // Returns { stdout, stderr, exitCode, fixed }
}
```

### grill
```typescript
args: {
  target: tool.schema.string(),
},
execute: async (args, context) => {
  // Scans for vulnerabilities, handles directories recursively
  // Returns { vulnerabilities: Array<{file, line, pattern, severity}> }
}
```

### complexity_hotspots
```typescript
args: {
  path: tool.schema.string(),
  minComplexity: tool.schema.number().optional().default(10),
},
execute: async (args, context) => {
  // 8 pattern-based detectors for O(n²) complexity
  // Returns { hotspots: Array<{file, line, pattern, complexity}> }
}
```

### sast_scan
```typescript
args: {
  target: tool.schema.string(),
},
execute: async (args, context) => {
  // Bundled ESLint security plugin (FIXED: no more npm exec)
  // Returns { findings: Array<{rule, message, line, severity}> }
}
```

---

## Phase State Interface

```typescript
interface PhaseState {
  currentPhase: "idle" | "analyze" | "plan" | "build" | "review" | "debug" | "complete";
  previousPhase: string;
  lastTransition: number; // timestamp
  persisted: boolean;
}

const PHASE_TRANSITIONS: Record<string, string[]> = {
  idle: ["analyze"],
  analyze: ["plan", "idle"],
  plan: ["build", "idle"],
  build: ["review", "debug", "idle"],
  review: ["complete", "build", "debug", "idle"],
  debug: ["build", "review", "complete", "idle"],
  complete: [], // terminal
};
```

---

## Agent Identity Interface

```typescript
function isHermesAgent(agent: string | undefined): boolean {
  if (!agent) return false;
  return agent === "hermes";
}

function isSubagent(agent: string | undefined): boolean {
  if (!agent) return false;
  return !isHermesAgent(agent);
}
```

**Critical:** Every hook that should be Hermes-specific MUST call `isHermesAgent()` guard. The brainstorm-gate bug proved this.

---

## Session State Interface

```typescript
interface SessionState {
  sessionID: string;
  phase: PhaseState;
  memory: {
    keys: string[];
    lastAccessed: number;
  };
  checkpoints: string[];
  delegationChain: DelegationRecord[];
  lastActivity: number;
}
```

---

## Hermès Memory Store Interface

```typescript
interface MemoryEntry {
  key: string;
  content: string;
  tags: string[];
  sessionID: string;
  createdAt: number;
  accessedAt: number;
}

// Storage: ~/.hermes/memory/[hash].json
// Index: ~/.hermes/memory/index.json
```

---

## 4-Marker Intent Protocol (Graeme)

```typescript
const INTENT_MARKERS = {
  STATUS_REQUEST: "[STATUS_REQUEST]",
  REVIEW_REQUEST: "[REVIEW_REQUEST]",
  ESCALATION_NOTICE: "[ESCALATION_NOTICE]",
  ACK: "[ACK]", // Terminal stop, max 3-message loop
} as const;
```
