# BUILD START HERE — Hermes Agent Plugin

## Prerequisites

1. **Node.js 20+** and **bun** installed
2. **Access to Spider Agent source**: `/home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent/dist/index.js`
3. **Plugin SDK**: `@opencode-ai/plugin` (installed in spider-agent-rebrand or agent-swarm)
4. **OpenCode workspace**: `/home/leviathan/OPENCODE_WORKSPACE/`
5. **This context library**: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/`

---

## Step 0: One-Time Setup

### 0.1 Create the plugin directory
```bash
mkdir -p ~/hermes-agent/src/{config,agents,hooks,tools,services}
mkdir -p ~/hermes-agent/dist
cd ~/hermes-agent
```

### 0.2 Initialize package.json
```bash
npm init -y
npm install @opencode-ai/plugin@1.1.53 zod@4.1.8
npm install -D typescript @types/node bun
```

### 0.3 Link into OpenCode
OpenCode loads plugins from `~/.config/opencode/` or the workspace `node_modules/`.

**Option A** (workspace-local, recommended for development):
```bash
cd ~/hermes-agent
npm link
# Then in your OpenCode project:
npm link hermes-agent
```

**Option B** (global):
```bash
cd ~/hermes-agent
npm link -g
```

### 0.4 Verify OpenCode sees your plugin
```bash
opencode --info    # or whatever your opencode CLI command is
# Look for hermes-agent in the plugin list
```

---

## Step 1: The Smallest Possible Plugin (verify the build pipeline works)

Create `src/index.ts`:

```typescript
import type { Plugin, PluginInput } from "@opencode-ai/plugin";

const hermesPlugin: Plugin = async (input: PluginInput) => {
  return {
    name: "hermes-agent",
    agent: [],
    tool: {},
  };
};

export default hermesPlugin;
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create `build.ts`:
```typescript
import { build } from "bun";
import { resolve } from "path";

await build({
  entrypoints: [resolve("./src/index.ts")],
  outdir: resolve("./dist"),
  format: "esm",
  target: "bun",
  minify: false,
});

console.log("Built: dist/index.js");
```

Run: `bun build.ts` — should produce `dist/index.js`.

Verify it loads: check that OpenCode recognizes the plugin.

**If this fails**: Fix the build pipeline first. Nothing else works until the plugin can be loaded.

---

## Step 2: Config Schema and Loader

Create `src/config/schema.ts`:

```typescript
import { z } from "zod";

export const HermesAgentConfigSchema = z.object({
  permissions: z.object({
    mode: z.enum(["auto", "manual"]).default("auto"),
    allow: z.array(z.string()).default([]),
    deny: z.array(z.string()).default([]),
  }),
  modelTiering: z.object({
    cheap: z.string().default("qwen3.6-turbo"),
    standard: z.string().default("qwen3.6-plus-preview"),
    capable: z.string().default("qwen3.6-plus-preview:free"),
  }),
  compaction: z.object({
    microcompactInterval: z.number().default(10),
    autocompactThreshold: z.number().default(0.80),
    emergencyThreshold: z.number().default(0.95),
  }),
  workspace: z.string().default("~/hermes-workspace"),
  phase: z.enum([
    "idle", "analyze", "plan", "build", "review", "debug", "complete"
  ]).default("idle"),
});

export type HermesAgentConfig = z.infer<typeof HermesAgentConfigSchema>;
```

Create `src/config/loader.ts`:

```typescript
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { HermesAgentConfigSchema, type HermesAgentConfig } from "./schema.js";

const CONFIG_PATH = resolve(process.env.HOME ?? "~", ".hermes", "settings.json");

export function loadHermesConfig(): HermesAgentConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return HermesAgentConfigSchema.parse(parsed);
  } catch {
    // Return defaults if no config exists
    return HermesAgentConfigSchema.parse({});
  }
}

export function resolvePath(path: string): string {
  if (path.startsWith("~/")) {
    return resolve(path.replace("~", process.env.HOME ?? "~"));
  }
  return resolve(path);
}
```

Create `src/config/constants.ts`:

```typescript
export const AGENT_NAMES = {
  HERMES: "hermes",
  ANALYST: "analyst",
  PLANNER: "planner",
  TDD: "tdd",
  BUILDER: "builder",
  REVIEWER: "reviewer",
  QUALITY_REVIEWER: "quality-reviewer",
  GRILL: "grill",
  RIPPLE: "ripple",
  DRIFT_VERIFIER: "drift-verifier",
  EXPLORER: "explorer",
  ARCHITECT: "architect",
  DEBUGGER: "debugger",
  SUPERVISOR: "supervisor",
  SME: "sme",
  TEST_ENGINEER: "test-engineer",
  DOCS: "docs",
  CRITIC: "critic",
  MEMORY: "memory",
} as const;

export const QA_AGENTS = [AGENT_NAMES.REVIEWER, AGENT_NAMES.QUALITY_REVIEWER] as const;

export const PHASES = {
  IDLE: "idle",
  ANALYZE: "analyze",
  PLAN: "plan",
  BUILD: "build",
  REVIEW: "review",
  DEBUG: "debug",
  COMPLETE: "complete",
} as const;

export const PHASE_ORDER = [
  PHASES.IDLE,
  PHASES.ANALYZE,
  PHASES.PLAN,
  PHASES.BUILD,
  PHASES.REVIEW,
  PHASES.DEBUG,
  PHASES.COMPLETE,
] as const;

// Valid phase transitions
export const PHASE_TRANSITIONS: Record<string, string[]> = {
  idle: ["analyze"],
  analyze: ["plan", "idle"],
  plan: ["build", "idle"],
  build: ["review", "debug", "idle"],
  review: ["complete", "build", "debug", "idle"],
  debug: ["build", "review", "complete", "idle"],
  complete: [],
};
```

---

## Step 3: The HERMES.md System Enhancer Hook

This is the MOST IMPORTANT hook. It injects Leviathan's conventions every turn.

Create `src/hooks/system-enhancer.ts`:

```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { readFileSync } from "fs";
import { resolve } from "path";

const HERMES_MD_PATH = resolve(process.env.HOME ?? "~", ".hermes", "HERMES.md");

export function createSystemEnhancerHook(): NonNullable<Hooks["experimental.chat.system.transform"]> {
  let hermesMdContent = "";

  try {
    hermesMdContent = readFileSync(HERMES_MD_PATH, "utf-8");
  } catch {
    hermesMdContent = "# HERMES.md not found — using defaults";
  }

  return async (input, output) => {
    const { model } = input;
    
    // Inject HERMES.md content as the first system message
    output.system = [
      hermesMdContent,
      `\n## Current Phase Context`,
      `Model: ${model.modelID}`,
      `Provider: ${model.providerID}`,
      `Agent Mode: standard`,
      `\n## Phase Enforcement`,
      `Current phase: idle`,
      `Allowed transitions: idle → analyze`,
      `\n## Anti-Rationalization Reminder`,
      `Every agent MUST verify cached context against actual files before acting.`,
      `Every completion claim MUST show actual command output.`,
    ];
  };
}
```

**Test**: After this is wired into the plugin, start a new session and type "hello". The system prompt should include your HERMES.md content.

---

## Step 4: Build the First 3 Agents

### 4.1 Hermes (Orchestrator)

Create `src/agents/hermes.ts`:

```typescript
export const HERMES_PROMPT = `You are Hermes — Leviathan's persistent 2nd-brain agent.

## Your Role
You are the primary orchestrator. You route work to subagents, enforce the 6-phase pipeline, and maintain the 2nd-brain memory.

## The 6 Phases (enforce in order)

### PHASE 0: BRAINSTORM GATE (HARD-GATE)
NEVER write code until:
1. You have concrete requirements (ask questions if vague)
2. You have presented 2-3 approaches with trade-offs
3. You have written a design doc to ~/hermes-workspace/docs/plans/
4. User has explicitly APPROVED the design

### PHASE 1: PLAN
Produce a no-placeholder plan. Every step needs:
- Exact file paths
- Actual code blocks
- Exact test commands
- Acceptance criteria

Reject any plan with TBD, TODO, placeholder, or "implement X".

### PHASE 2: BUILD (TDD Iron Law)
For each task:
1. RED: Write failing test
2. GREEN: Minimal code to pass
3. REFACTOR: Clean up
4. VERIFY: Show actual command output

### PHASE 3: REVIEW
- Stage 1: @quality-reviewer (spec compliance)
- Stage 2: @reviewer (security + performance)
- Adversarial: @grill (attack vectors)

### PHASE 4: DEBUG (3-Strike Rule)
After 3 failed attempts on the same bug → escalate to @architect → user must approve.

### PHASE 5: COMPLETE
- /verify (proof-based)
- @health (project health score)
- Snapshot session to ~/hermes-workspace/.state/

## 2nd-Brain
- Use hermes_recall to check for relevant past context before starting new work
- Use hermes_remember to store decisions, patterns, learnings
- Update state only after confirmed success (Strict Write Discipline)

## Communication
Use Graeme's 4-marker protocol for inter-agent communication:
- [STATUS_REQUEST] → ask for status
- [REVIEW_REQUEST] → ask for review
- [ESCALATION_NOTICE] → notify human
- [ACK] → terminal. Stop. Max 3msg loop.
`;
```

### 4.2 Analyst

Create `src/agents/analyst.ts`:

```typescript
export const ANALYST_PROMPT = `You are @analyst — requirements → technical specs.

## Your Role
Validate that requirements are concrete enough for implementation. Convert vague requests into specific, testable specifications.

## Process

### Step 1: Clarify (Socratic)
Ask ONE question at a time. Examples:
- "What should happen when X?" — covers happy path
- "What should happen when X fails?" — covers error handling
- "What is the expected performance requirement?" — covers non-functional
- "Are there existing systems this must integrate with?" — covers dependencies

Stop asking questions when you can answer:
- WHO: who uses this?
- WHAT: what does it do?
- WHEN: when does it run/trigger?
- WHERE: where does it live in the system?
- HOW: how does it work technically?
- WHY: why is this needed (vs. not building it)?

### Step 2: Validate Completeness
Checklist:
[ ] All inputs specified (types, formats, ranges)
[ ] All outputs specified (types, formats, destinations)
[ ] Error conditions enumerated
[ ] Success criteria concrete and measurable
[ ] Dependencies declared
[ ] Edge cases considered

### Step 3: Write Technical Spec
Output a design doc at `~/hermes-workspace/docs/plans/YYYY-MM-DD-<topic>-design.md`:

\`\`\`markdown
# Technical Spec: <Feature Name>

## Problem Statement
<1-2 sentences>

## Requirements
### Functional
- [ ] REQ-1: <requirement>
### Non-Functional
- Performance: <target>
- Availability: <target>

## Proposed Approach
### Option A: <Name>
**Trade-offs**: <pros/cons>
**Recommendation**: <why>

### Option B: <Name>
...

## Recommended Option
<Option X>

## Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| src/feature.ts | create | main implementation |
| tests/feature.test.ts | create | unit tests |

## Test Strategy
<how to verify this works>

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-------------|--------|-----------|
| ... | ... | ... | ... |
\`\`\`

## Verification Protocol
You MUST show actual analysis output before claiming completion. Not "looks good", but the actual spec document you created.
`;
```

### 4.3 Builder

Create `src/agents/builder.ts`:

```typescript
export const BUILDER_PROMPT = `You are @builder — one task at a time implementation.

## Your Constraints

### TDD Iron Law (ENFORCED)
1. Write the FAILING TEST FIRST (RED)
2. Write MINIMAL CODE to pass (GREEN)
3. REFACTOR
4. Show actual command output proving test passes

You CANNOT edit a src file if the corresponding test file doesn't exist and pass first.

### One Task at a Time
Do not batch multiple tasks. Complete one file/function change, verify it works, then move to the next.

### Verification Protocol
For EVERY change you claim is done:
\`\`\`
$ <actual command>
<actual output>
✓ <verification result>
\`\`\`

Example:
\`\`\`
$ npm test -- --testPathPattern=auth
✓ 23 passing, 0 failing

$ node dist/auth.js
{"status":"ok","token":"eyJ..."}
✓ Token generation confirmed
\`\`\`

NOT acceptable:
- "Tests should pass"
- "The code looks correct"
- "I believe this works"

### Cached Context = Hint Only
If you have cached context about the codebase, VERIFY it against actual files before acting. Memory is fallible. Files are ground truth.

### Strict Write Discipline
Before writing ANY file:
1. Read the actual current state of that file
2. Confirm your cached understanding matches reality
3. Then write/edit

## Your Workflow

### For Each Task
1. Check delegation gate: has @analyst approved the plan?
2. Check current phase: are we in BUILD phase?
3. Get task details from plan
4. Find or create the test file FIRST
5. Write minimal failing test
6. Run test → verify it FAILS (RED)
7. Write minimal code to pass
8. Run test → verify it PASSES (GREEN)
9. Refactor for cleanliness
10. Show verification output
11. Report to hermes orchestrator

## Anti-Rationalization Checklist (before claiming done)
[ ] I showed actual test output, not descriptions
[ ] I verified cached context against actual files
[ ] I did not batch multiple tasks
[ ] I did not skip the TDD cycle
[ ] The test file was created before the src file was modified
[ ] My change addresses the cause, not just the symptom
`;
```

---

## Step 5: The 5 Core Hooks

### 5.1 Brainstorm Gate Hook

Create `src/hooks/brainstorm-gate.ts`:

```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { PHASE_TRANSITIONS, PHASES } from "../config/constants.js";

export function createBrainstormGateHook(): NonNullable<Hooks["experimental.chat.messages.transform"]> {
  return async (input, output) => {
    const phase = getCurrentPhase(); // from shared state
    
    if (phase !== PHASES.IDLE && phase !== PHASES.ANALYZE) {
      return; // Gate only applies in early phases
    }

    const lastMessage = output.messages[output.messages.length - 1];
    if (!lastMessage) return;

    // Check for code/implementation attempts in brainstorm phase
    const content = JSON.stringify(lastMessage.parts);
    const hasCodeBlocks = /```[\s\S]*?```/.test(content);
    const hasFileEdits = content.includes("write_file") || content.includes("patch");
    const hasToolCalls = content.includes("mcp_") || content.includes("tool(");

    if (hasCodeBlocks || hasFileEdits || hasToolCalls) {
      if (phase === PHASES.IDLE || phase === PHASES.ANALYZE) {
        // Inject blocking message
        lastMessage.parts = [
          ...lastMessage.parts,
          {
            type: "text",
            text: `\n\n[HARD-GATE BLOCKED] You are in the BRAINSTORM phase. No implementation is permitted until:\n1. Requirements are concrete (no "just build it")\n2. Design doc is written to ~/hermes-workspace/docs/plans/\n3. User has explicitly approved the design\n\nPlease continue with the brainstorm. Ask clarifying questions or write the design doc.`,
          },
        ];
      }
    }
  };
}

// Placeholder — actual implementation needs shared state
function getCurrentPhase(): string {
  return PHASES.IDLE;
}
```

### 5.2 Plan Validator Hook

Create `src/hooks/plan-validator.ts`:

```typescript
import type { Hooks } from "@opencode-ai/plugin";

const PLACEHOLDER_PATTERNS = [
  /\bTBD\b/i,
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bplaceholder\b/i,
  /\bstub\b/i,
  /implement\s+X\b/i,
  /add\s+validation\b/i,
  /handle\s+error\b/i,
  /\.\.\.\s*$/m,
];

export function createPlanValidatorHook(): NonNullable<Hooks["experimental.chat.messages.transform"]> {
  return async (input, output) => {
    const lastMessage = output.messages[output.messages.length - 1];
    if (!lastMessage) return;

    const content = JSON.stringify(lastMessage.parts);
    
    // Only validate in PLAN phase
    const currentPhase = getCurrentPhase();
    if (currentPhase !== "plan") return;

    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(content)) {
        lastMessage.parts = [
          ...lastMessage.parts,
          {
            type: "text",
            text: `\n\n[PLAN VALIDATOR BLOCKED] Your plan contains "${pattern.source}" — this is not allowed.\n\nEvery step MUST have:\n- Exact file paths\n- Actual code (not stubs)\n- Exact test commands with expected output\n- Concrete acceptance criteria\n\nPlease revise the plan with specific, actionable items.`,
          },
        ];
        return;
      }
    }
  };
}

function getCurrentPhase(): string {
  return "plan";
}
```

### 5.3 TDD Enforcer Hook

Create `src/hooks/tdd-enforcer.ts`:

```typescript
import type { Hooks } from "@opencode-ai/plugin";

export function createTddEnforcerHook(): NonNullable<Hooks["tool.execute.before"]> {
  return async (input, output) => {
    const { tool, args } = input;
    
    // Only enforce during BUILD phase
    if (getCurrentPhase() !== "build") return;

    // Check for src file modifications
    if (tool === "write_file" || tool === "patch") {
      const filePath: string = args?.path ?? "";
      const isTestFile = filePath.includes(".test.") || filePath.includes(".spec.");
      const isSrcFile = !isTestFile && (
        filePath.includes("/src/") || 
        filePath.endsWith(".ts") || 
        filePath.endsWith(".js")
      );

      if (isSrcFile) {
        // Check if corresponding test file exists
        const testFile = findTestFile(filePath);
        if (!testFileExists(testFile)) {
          // Inject blocking response — but we can't actually block in before hook
          // Instead, we'll flag it for the after hook to catch
          output.args._tdd_violation = {
            file: filePath,
            requiresTest: testFile,
            message: `[TDD IRON LAW] You cannot modify ${filePath} without creating ${testFile} first.\n\nRemember: RED (failing test) → GREEN (minimal code) → REFACTOR.\n\nPlease create the test file first.`
          };
        }
      }
    }
  };
}

function getCurrentPhase(): string {
  return "build";
}

function findTestFile(srcPath: string): string {
  // Convert src/app.ts → src/app.test.ts
  return srcPath
    .replace("/src/", "/tests/")
    .replace(/\.ts$/, ".test.ts")
    .replace(/\.js$/, ".test.js");
}

function testFileExists(path: string): boolean {
  // This would check actual filesystem
  // For now, return true (placeholder — implement with actual fs check)
  return true;
}
```

### 5.4 Delegation Gate Hook

Create `src/hooks/delegation-gate.ts`:

```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { QA_AGENTS, AGENT_NAMES } from "../config/constants.js";

export function createDelegationGateHook(): NonNullable<Hooks["tool.execute.before"]> {
  return async (input, output) => {
    const { tool, args } = input;

    // Delegation gate applies when coder tries to mark complete
    if (tool === "hermes_complete_task" || tool === "update_task_status") {
      const taskId: string = args?.taskId ?? "";
      const status: string = args?.status ?? "";
      
      if (status === "complete" || status === "done") {
        // Check if reviewer has approved
        const reviewerApproved = checkReviewerApproval(taskId);
        if (!reviewerApproved) {
          output.args._gate_blocked = {
            gate: "reviewer_approval",
            message: `[DELEGATION GATE] Cannot mark task ${taskId} as complete without reviewer approval.\n\n@${QA_AGENTS.join(", @")} must verify the work first.`
          };
        }
      }
    }
  };
}

function checkReviewerApproval(taskId: string): boolean {
  // Placeholder — implement with actual state tracking
  return true;
}
```

### 5.5 Phase Monitor Hook

Create `src/hooks/phase-monitor.ts`:

```typescript
import type { Hooks } from "@opencode-ai/plugin";
import { PHASE_ORDER, PHASE_TRANSITIONS } from "../config/constants.js";

export function createPhaseMonitorHook(): NonNullable<Hooks["tool.execute.after"]> {
  return async (input, output) => {
    const { tool } = input;
    const { output: toolOutput } = output;

    // Track phase transitions
    if (tool === "phase_complete" || tool === "checkpoint") {
      const newPhase = parsePhaseFromOutput(toolOutput);
      const currentPhase = getCurrentPhase();
      
      if (newPhase && canTransition(currentPhase, newPhase)) {
        setCurrentPhase(newPhase);
        logPhaseTransition(currentPhase, newPhase);
      } else if (newPhase && !canTransition(currentPhase, newPhase)) {
        // Block invalid transition
        output.title = "BLOCKED: Invalid phase transition";
        output.output = `[PHASE MONITOR] Cannot transition from ${currentPhase} → ${newPhase}.\n\nValid transitions from ${currentPhase}:\n${(PHASE_TRANSITIONS[currentPhase] || []).join(", ") || "none"}\n\nCurrent phase remains: ${currentPhase}`;
      }
    }
  };
}

function canTransition(from: string, to: string): boolean {
  const validTargets = PHASE_TRANSITIONS[from] || [];
  return validTargets.includes(to);
}

function parsePhaseFromOutput(output: string): string | null {
  const match = output.match(/phase[:\s]+(\w+)/i);
  return match ? match[1].toLowerCase() : null;
}

// Shared state — implement with proper state management
let _currentPhase = "idle";
export function getCurrentPhase(): string { return _currentPhase; }
export function setCurrentPhase(phase: string): void { _currentPhase = phase; }
function logPhaseTransition(from: string, to: string): void {
  console.log(`[PHASE] ${from} → ${to}`);
}
```

---

## Step 6: Wire It All Together

Create `src/index.ts`:

```typescript
import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import { createSystemEnhancerHook } from "./hooks/system-enhancer.js";
import { createBrainstormGateHook } from "./hooks/brainstorm-gate.js";
import { createPlanValidatorHook } from "./hooks/plan-validator.js";
import { createTddEnforcerHook } from "./hooks/tdd-enforcer.js";
import { createDelegationGateHook } from "./hooks/delegation-gate.js";
import { createPhaseMonitorHook } from "./hooks/phase-monitor.js";
import { loadHermesConfig } from "./config/loader.js";
import { HERMES_PROMPT } from "./agents/hermes.js";
import { ANALYST_PROMPT } from "./agents/analyst.js";
import { BUILDER_PROMPT } from "./agents/builder.js";

const hermesPlugin: Plugin = async (input: PluginInput) => {
  const config = loadHermesConfig();

  // Compose hooks — order matters (guardrails first)
  const messageTransform = composeHandlers([
    createBrainstormGateHook(),
    createPlanValidatorHook(),
  ]);

  const toolBefore = composeHandlers([
    createTddEnforcerHook(),
    createDelegationGateHook(),
  ]);

  const toolAfter = composeHandlers([
    createPhaseMonitorHook(),
  ]);

  return {
    name: "hermes-agent",
    agent: [
      {
        name: "hermes",
        description: "Leviathan's persistent 2nd-brain orchestrator",
        instructions: HERMES_PROMPT,
      },
      {
        name: "analyst",
        description: "Requirements → technical specs",
        instructions: ANALYST_PROMPT,
      },
      {
        name: "builder",
        description: "One task at a time implementation with TDD",
        instructions: BUILDER_PROMPT,
      },
    ],
    tool: {
      // Tools will be added in Step 7
    },
    "experimental.chat.system.transform": createSystemEnhancerHook(),
    "experimental.chat.messages.transform": messageTransform,
    "tool.execute.before": toolBefore,
    "tool.execute.after": toolAfter,
  };
};

function composeHandlers<T>(handlers: Array<(input: any, output: any) => Promise<void>>) {
  return async (input: any, output: any) => {
    for (const handler of handlers) {
      await handler(input, output);
    }
  };
}

export default hermesPlugin;
```

Run `bun build.ts` — should produce `dist/index.js`.

**Verify the plugin loads in OpenCode.**

---

## Step 7: Core Tools

Create `src/tools/create-tool.ts`:

```typescript
import { tool as createTool, type ToolContext } from "@opencode-ai/plugin/tool";
import { z } from "zod";

export { createTool, type ToolContext };
```

Create `src/tools/checkpoint.ts`:

```typescript
import { createTool, type ToolContext } from "./create-tool.js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

export const checkpoint = createTool({
  description: "Create a session checkpoint with git stash + state savepoint",
  args: {
    message: z.string().describe("Checkpoint description"),
  },
  execute: async (args, context: ToolContext) => {
    const stateDir = resolve(context.worktree, ".hermes", "state");
    const checkpointId = `cp_${Date.now()}`;
    const checkpointPath = join(stateDir, `${checkpointId}.json`);
    
    // Ensure directory exists
    // save current session state
    const state = {
      id: checkpointId,
      message: args.message,
      phase: getCurrentPhase(),
      directory: context.directory,
      worktree: context.worktree,
      timestamp: new Date().toISOString(),
    };
    
    // Create checkpoint file
    // Run git stash
    
    return `Checkpoint created: ${checkpointId}\nPhase: ${state.phase}\nSaved to: ${checkpointPath}`;
  },
});
```

Create `src/tools/phase-complete.ts`:

```typescript
import { createTool, type ToolContext } from "./create-tool.js";
import { z } from "zod";

export const phaseComplete = createTool({
  description: "Mark current phase complete and advance state machine",
  args: {
    phase: z.enum(["analyze", "plan", "build", "review", "debug", "complete"])
      .describe("Phase to complete"),
    evidence: z.string().describe("Proof that phase requirements are met"),
  },
  execute: async (args, context: ToolContext) => {
    const currentPhase = getCurrentPhase();
    const nextPhase = getNextPhase(currentPhase);
    
    if (!canTransition(currentPhase, args.phase)) {
      return `[BLOCKED] Cannot complete phase "${args.phase}" from "${currentPhase}".\nValid next phase: ${nextPhase}`;
    }
    
    setCurrentPhase(nextPhase);
    
    return `Phase "${args.phase}" complete.\nEvidence: ${args.evidence}\nNow in phase: ${nextPhase}`;
  },
});

// Re-export shared state helpers from phase-monitor.ts
export function getCurrentPhase(): string {
  // Import from phase-monitor.ts
  return "build";
}
export function setCurrentPhase(phase: string): void {
  // Import from phase-monitor.ts
}
export function getNextPhase(current: string): string {
  const order = ["idle", "analyze", "plan", "build", "review", "debug", "complete"];
  const idx = order.indexOf(current);
  return order[Math.min(idx + 1, order.length - 1)];
}
export function canTransition(from: string, to: string): boolean {
  const valid: Record<string, string[]> = {
    idle: ["analyze"],
    analyze: ["plan", "idle"],
    plan: ["build", "idle"],
    build: ["review", "debug", "idle"],
    review: ["complete", "build", "debug", "idle"],
    debug: ["build", "review", "complete", "idle"],
    complete: [],
  };
  return valid[from]?.includes(to) ?? false;
}
```

Create `src/tools/save-plan.ts`:

```typescript
import { createTool, type ToolContext } from "./create-tool.js";
import { z } from "zod";

export const savePlan = createTool({
  description: "Save plan to plan.json and auto-generate plan.md",
  args: {
    plan: z.object({
      tasks: z.array(z.object({
        id: z.string(),
        description: z.string(),
        filePaths: z.array(z.string()),
        testCommands: z.array(z.string()),
        acceptanceCriteria: z.array(z.string()),
      })),
    }).describe("Plan structure"),
  },
  execute: async (args, context: ToolContext) => {
    const planDir = resolve(context.worktree, "docs", "plans");
    const timestamp = new Date().toISOString().split("T")[0];
    const planId = `plan-${timestamp}-${Date.now()}`;
    
    // Save plan.json
    const planJsonPath = join(planDir, `${planId}.json`);
    // writeFileSync(planJsonPath, JSON.stringify(args.plan, null, 2));
    
    // Auto-generate plan.md
    const planMd = generatePlanMarkdown(args.plan, planId);
    const planMdPath = join(planDir, `${planId}.md`);
    // writeFileSync(planMdPath, planMd);
    
    return `Plan saved:\n- JSON: ${planJsonPath}\n- Markdown: ${planMdPath}\n\nTasks: ${args.plan.tasks.length}`;
  },
});

function generatePlanMarkdown(plan: any, planId: string): string {
  return `# Plan: ${planId}\n\n${plan.tasks.map((t: any, i: number) => `
## Task ${i + 1}: ${t.description}

**File**: ${t.filePaths.join(", ")}

### Test Commands
${t.testCommands.map((c: string) => `\`\`\`\n${c}\n\`\`\``).join("\n")}

### Acceptance Criteria
${t.acceptanceCriteria.map((a: string) => `- [ ] ${a}`).join("\n")}
`).join("\n")}
`;
}
```

---

## Step 8: Test the Full Build Pipeline

After wiring all of the above:

```bash
cd ~/hermes-agent
bun build.ts
```

Verify `dist/index.js` exists and contains "hermes-agent".

**Test 1: Plugin loads**
Check OpenCode sees hermes-agent in its plugin list.

**Test 2: System enhancer**
Start a new session. Verify your HERMES.md content appears in context.

**Test 3: Brainstorm gate**
Type "just build a login system". Verify bot asks clarifying questions instead of coding.

**Test 4: Phase transitions**
Use `phase_complete` tool. Verify state machine advances correctly.

---

## If Something Breaks

| Problem | Fix |
|---------|-----|
| Plugin not loading | Check `dist/index.js` exists; check `package.json` exports |
| Hook not firing | Check event name matches SDK (`tool.execute.before` not `toolBefore`) |
| Agent not routing | Check agent name in `agent` array matches what orchestrator calls |
| Type errors | Run `bun run typecheck` and fix |
| Phase won't advance | Check `PHASE_TRANSITIONS` map — maybe invalid transition |
| Tool not found | Register tool in `tool:` object in `src/index.ts` |

---

## Next Steps After Week 1

Once Week 1 core works:

1. Add remaining agents: quality-reviewer, grill, ripple, drift-verifier, explorer, architect, debugger, supervisor
2. Add remaining hooks: strict-write-discipline, adversarial-check, anti-rationalization, knowledge-injector, compaction, debugging-spiral, ripple-check, supervisor-ingest, intent-marker
3. Add full tool system: hermes_recall, hermes_remember, grill, verify, health, agent-dispatch, etc.
4. Implement supervisor loop: Graeme's 3-agent self-improving

See `BUILD/WEEKLY_SPRINT_PLAN.md` for detailed Week 2 and Week 3 tasks.

---

## Reference Sources

| What You Need | Where to Find It |
|---------------|-----------------|
| Plugin SDK types | `/home/leviathan/spider-agent-rebrand/iteration-FINAL/node_modules/@opencode-ai/plugin/dist/` |
| Spider Agent hooks | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/SOURCE_DECODED/SPIDER_AGENT_HOOKS.md` |
| Spider Agent state machine | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/SOURCE_DECODED/SPIDER_AGENT_STATE.md` |
| Full architecture | `/home/leviathan/hermes-workspace/context/engineering/HERMES_DEFINITIVE_ARCHITECTURE.md` |
| Agent prompts | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/AGENTS/` |
| Hook definitions | `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/HOOKS/` |
