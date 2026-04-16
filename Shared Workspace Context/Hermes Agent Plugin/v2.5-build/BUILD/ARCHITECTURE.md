# HERMES AGENT PLUGIN — V2.5 ARCHITECTURE
## Skill Stacking: Threads, Forks, and Orchestration Skills

**Version:** v2.5
**Date:** 2026-04-02
**Status:** Complete specification — ready to build

---

## 1. MOTIVATION

The v2 build has 19 agents, 28 hooks, and a 6-phase workflow. It can dispatch subagents (Threads) and run automation (/autopilot). But it lacks:

1. **Blocking subagent dispatch** (Fork) — for interactive skills that need user conversation
2. **Explicit skill chaining** — orchestration skills that sequence other skills with conditional branching
3. **Episode output chaining** — each skill's output feeds into the next skill's context
4. **Skill lifecycle management** — hooks for episode start/exit/timeout/error

The v2.5 build adds these primitives while preserving all v2 functionality.

---

## 2. CORE PRIMITIVES

### 2.1 Thread

**Definition:** Async, non-blocking subagent dispatch.

**Behavior:**
- Orchestrator calls `delegate_task(goal)`
- Orchestrator **continues immediately** (does not wait)
- Subagent runs in background with isolated context
- Skill context **clears on episode exit** (does not pollute orchestrator)
- Compressed episode output stored when complete

**Use cases:**
- Background analysis, exploration, research
- Parallel independent workstreams
- Build/test tasks that don't need user interaction
- Verification and health checks

**Implementation:** Existing `delegate_task` tool (already async)

### 2.2 Fork

**Definition:** Synchronous, blocking subagent dispatch for interactive skills.

**Behavior:**
- Orchestrator calls `delegate_task(goal, { blocking: true })`
- Orchestrator **waits** (blocks) — no other work dispatched
- Fork takes over UI directly — continuous chat UX with user
- Fork **cannot be continued** — returns compressed episode output when done or times out
- Only **one Fork active at a time** (fork manager enforces)
- If user starts new Fork while one active → previous Fork auto-completes with partial output

**Use cases:**
- `/plan` — user collaborates on planning (needs back-and-forth)
- `/review` — user reviews and approves implementation
- `/grill` — user participates in adversarial testing
- `/brainstorm` — Socratic questioning needs user responses
- QA sessions that need user verification

**Implementation:** New `blocking: true` option in `delegate_task` + `ForkManager` service

### 2.3 Teammate

**Definition:** Persistent worker with own tmux pane and file-based mailbox.

**Behavior:**
- Long-running process separate from orchestrator
- Communicates via file-based mailbox (not message passing)
- Used for: long builds, test suites, background workers that outlive a single episode

**Implementation:** Already partially exists in v2 (mal_shaik's 3 exec models). In v2.5, formalize as execution mode option.

### 2.4 Execution Mode Routing

```typescript
type ExecutionMode = "thread" | "fork" | "teammate";

function routeToExecutionMode(skill: SkillDefinition): ExecutionMode {
  if (skill.executionMode) return skill.executionMode;
  
  // Default routing based on skill type
  switch (skill.type) {
    case "action":     return "thread";    // Background work
    case "interactive": return "fork";      // Needs user conversation
    case "orchestration": return "fork";   // Orchestrations block (start with plan)
    default: return "thread";
  }
}
```

---

## 3. EPISODE SYSTEM

### 3.1 Episode Definition

An **episode** is the execution boundary for a skill. When a skill starts, a new episode begins. When it completes (or times out), the episode ends and context is compressed.

```typescript
interface Episode {
  id: string;                    // UUID
  skillName: string;            // Which skill ran
  mode: ExecutionMode;          // thread | fork | teammate
  parentEpisodeId: string | null; // If this episode is part of an orchestration chain
  status: "active" | "completed" | "timeout" | "error";
  startedAt: number;            // Unix timestamp
  endedAt: number | null;
  input: EpisodeInput;          // What was fed to the skill
  output: EpisodeOutput | null; // What the skill returned
  contextSnapshot: string;       // Compressed context at episode end
  chainPosition: number | null;  // Position in orchestration chain (if applicable)
}

interface EpisodeInput {
  trigger: string;              // What activated the skill
  context: Record<string, any>;  // Skill-specific context
  previousOutput?: string;      // Previous episode's output (if chained)
}

interface EpisodeOutput {
  summary: string;              // Compressed summary (max 2KB)
  artifacts: Artifact[];         // Files created, decisions made
  decisions: Decision[];         // Decisions recorded during episode
  blockers: Blocker[];           // Unresolved issues
  nextAction?: string;           // Recommended next step
}
```

### 3.2 Episode Lifecycle

```
SKILL ACTIVATED
     │
     ▼
episode_start hook fires
     │
     ▼
┌─────────────────────────┐
│  SKILL EXECUTES        │
│  (Thread: background)   │
│  (Fork: blocks, user    │
│   interaction)          │
└─────────────────────────┘
     │
     ├─── SUCCESS ───────────────────────────────┐
     │                                            ▼
     │                                   episode_complete hook fires
     │                                   Episode output stored
     │                                   Context compressed (cleared)
     │                                            │
     ▼                                            ▼
┌─────────────────────────┐              Return output to orchestrator
│  SKILL FAILS/TIMEOUT   │                         │
└─────────────────────────┘                         │
     │                                            ▼
     ▼                                     Chain to next skill (if orch.)
episode_timeout/error hook fires
     │
     ├─── RETRY (if configured)
     │
     └─── RETURN PARTIAL OUTPUT
```

### 3.3 Episode Store

```typescript
class EpisodeStore {
  private episodes: Map<string, Episode> = new Map();
  private activeEpisodes: Map<string, string> = new Map(); // skillName → episodeId
  
  // Only keep last N episodes per skill type
  private maxHistory = 10;
  
  startEpisode(skillName: string, input: EpisodeInput): Episode;
  completeEpisode(episodeId: string, output: EpisodeOutput): void;
  timeoutEpisode(episodeId: string, partialOutput: EpisodeOutput): void;
  getActiveEpisode(skillName: string): Episode | null;
  getEpisodeHistory(skillName: string, limit?: number): Episode[];
  getChainOutput(chainId: string): EpisodeOutput[]; // Get outputs for orchestration chain
}
```

---

## 4. ORCHESTRATION SKILLS

### 4.1 Definition

An orchestration skill **references other skills** in a chain. It does not implement logic itself — it defines when and how to invoke other skills.

```typescript
interface OrchestrationSkillDefinition extends SkillDefinition {
  type: "orchestration";
  chain: OrchestrationStep[];
  outputTemplate?: string;  // How to format final combined output
}

interface OrchestrationStep {
  skill: string;            // Name of skill to invoke
  mode: "thread" | "fork";  // Execution mode for this step
  inputTemplate: string;    // Template for how to feed previous output
  condition?: string;       // Optional: only run if condition true (JS expression)
  captureOutput: boolean;   // Store this step's output for chaining
  timeout?: number;         // Override default episode timeout
}

// inputTemplate uses template syntax:
// "{previous}" → previous step's full output
// "{previous.summary}" → just the summary
// "{previous.artifacts}" → just the artifacts
// "{user_request}" → original user request
// "{context.key}" → context value
```

### 4.2 Example: /implement

```markdown
---
name: implement
type: orchestration
description: Full feature implementation from plan to verify
executionMode: fork  # Starts with plan (interactive), chains from there
chain:
  - skill: plan
    mode: fork
    inputTemplate: "{user_request}"
    captureOutput: true
  - skill: builder
    mode: thread
    inputTemplate: "{previous.output.summary}"
    captureOutput: true
  - skill: review
    mode: fork
    inputTemplate: "{previous.output.summary}\n\nArtifacts:\n{previous.artifacts}"
    captureOutput: true
  - skill: grill
    mode: fork
    inputTemplate: "{previous.output.summary}"
    captureOutput: true
  - skill: verify
    mode: thread
    inputTemplate: "Review passed. Attack report:\n{previous.output.summary}"
    captureOutput: true
outputTemplate: |
  ## Implementation Complete
  
  {verify.output.summary}
  
  ### Artifacts Created
  {builder.artifacts}
  
  ### Review Notes
  {review.output.summary}
  
  ### Security Review
  {grill.output.summary}
---
# /implement

Invokes the full implementation chain: plan → build → review → grill → verify

## When to Use
User says "build this feature", "implement this", "add this functionality"

## How It Works
1. FORK /plan — User collaborates on plan (blocking)
2. THREAD @builder — Implementation in background
3. FORK /review — User reviews implementation (blocking)
4. FORK /grill — User attacks the implementation (blocking)
5. THREAD /verify — Verification runs (async)

## Output
Synthesized completion report with all episode outputs combined.
```

### 4.3 Example: /debug-with-escalation

```markdown
---
name: debug-with-escalation
type: orchestration
description: Debug with automatic architecture review on repeated failures
executionMode: thread
chain:
  - skill: debugger
    mode: thread
    inputTemplate: "{user_request}"
    captureOutput: true
  - skill: verify
    mode: thread
    inputTemplate: "{debugger.output.summary}"
    captureOutput: true
  - skill: architect-review
    mode: fork
    condition: "{previous.failure_count} >= 3"
    inputTemplate: "Bug '{user_request}' failed {previous.failure_count} times.\n\nLast attempt:\n{previous.output.summary}"
    captureOutput: true
outputTemplate: |
  ## Debug Result
  
  {if architect-review then "Architecture review triggered after 3 failures" else verify.output.summary}
---
# /debug-with-escalation

Debug a bug with automatic architecture review escalation.

## When to Use
User says "debug this", "fix this bug", "what's wrong with X"

## How It Works
1. THREAD /debug — 4-phase debugging (reproduce, isolate, hypothesis, fix)
2. THREAD /verify — Verify the fix works
3. If fix failed 3+ times → FORK /architect-review (automatic escalation)

## 3-Strike Rule
After 3 failed fix attempts on the same bug, mandatory architecture review
triggers automatically via the condition field.
```

### 4.4 Skill Registry

Skills are stored as `.md` files in `src/skills/` with YAML frontmatter:

```yaml
# src/skills/plan.md (existing, enhanced with frontmatter)
---
name: plan
type: interactive
description: No-placeholder planning with exact paths and code
executionMode: fork
episodeTimeout: 300000  # 5 minutes
contextScope: isolated   # Clears on exit
---
# /plan — Adaptive No-Placeholder Planning
...
```

The skill loader parses frontmatter and registers skills in the `SkillRegistry`:

```typescript
class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();
  
  loadSkillsFromDirectory(path: string): void {
    // Parse all .md files in src/skills/
    // Extract frontmatter + body
    // Register in skills map
  }
  
  getSkill(name: string): SkillDefinition | undefined;
  getSkillsByType(type: "action" | "interactive" | "orchestration"): SkillDefinition[];
  getTriggeredSkills(userMessage: string): SkillDefinition[];
}
```

---

## 5. FORK MANAGER

### 5.1 State Machine

```typescript
type ForkState = "idle" | "active" | "waiting_input" | "completing" | "completed";

interface ForkContext {
  episodeId: string;
  skillName: string;
  state: ForkState;
  startedAt: number;
  lastActivityAt: number;
  input: EpisodeInput;
  accumulatedOutput: string;  // Chat transcript so far
  partialOutput: EpisodeOutput | null;
}

class ForkManager {
  private activeFork: ForkContext | null = null;
  private forkHistory: ForkContext[] = [];
  
  // Start a new Fork (blocks orchestrator)
  async startFork(skillName: string, input: EpisodeInput): Promise<ForkContext>;
  
  // Send user input to active Fork
  async sendFeedback(forkId: string, feedback: string): Promise<void>;
  
  // Complete Fork manually (from orchestrator or user signal)
  async completeFork(forkId: string, output: EpisodeOutput): Promise<void>;
  
  // Timeout a stuck Fork
  async timeoutFork(forkId: string): Promise<void>;
  
  // Check if Fork is currently active
  isActive(): boolean;
  getActiveFork(): ForkContext | null;
  
  // Auto-complete stale Fork (if new Fork requested)
  autoCompleteStaleFork(reason: string): void;
}
```

### 5.2 Fork Hook Events

| Event | Hook | Purpose |
|-------|------|---------|
| Fork requested | `fork.request` | Validate Fork request, check if one already active |
| Fork started | `fork.start` | Initialize Fork context, inject skill prompt |
| Fork feedback | `fork.feedback` | Route user input to Fork's conversation |
| Fork completing | `fork.complete` | Compress output, prepare for chaining |
| Fork timeout | `fork.timeout` | Handle stuck Fork |
| Fork error | `fork.error` | Handle Fork exceptions |

### 5.3 Blocking Behavior in Orchestrator

When orchestrator invokes a Fork:

```typescript
async function invokeSkill(skill: SkillDefinition, input: EpisodeInput): Promise<EpisodeOutput> {
  const mode = routeToExecutionMode(skill);
  
  if (mode === "fork") {
    // BLOCKING: wait for Fork to complete
    const forkManager = getForkManager();
    const context = await forkManager.startFork(skill.name, input);
    
    // These messages go to Fork's UI, not orchestrator
    // Orchestrator is BLOCKED here — no other work dispatched
    // Only Fork_feedback can unblock
    
    return await waitForForkCompletion(context.id);
  } else {
    // NON-BLOCKING: dispatch and continue
    return await dispatchThread(skill, input);
  }
}
```

---

## 6. HOOK SYSTEM EXTENSIONS

### 6.1 New Hooks (v2.5)

```typescript
// Skill routing — determine execution mode for a skill
"skill.route": (input: { skillName: string; userMessage: string }, 
               output: { mode: ExecutionMode; reason: string }) => Promise<void>

// Fork management
"fork.start": (input: { episodeId: string; skillName: string }, 
              output: { blocked: boolean; message?: string }) => Promise<void>
"fork.feedback": (input: { forkId: string; feedback: string }, 
                  output: { routed: boolean }) => Promise<void>
"fork.complete": (input: { forkId: string; output: EpisodeOutput }, 
                  output: { chained: boolean }) => Promise<void>
"fork.timeout": (input: { forkId: string; partialOutput: EpisodeOutput }, 
                 output: { action: "retry" | "skip" | "escalate" }) => Promise<void>

// Episode lifecycle
"episode.start": (input: { episodeId: string; skillName: string; mode: ExecutionMode }, 
                  output: { context: Record<string, any> }) => Promise<void>
"episode.complete": (input: { episodeId: string; output: EpisodeOutput }, 
                     output: { compressed: boolean }) => Promise<void>
"episode.timeout": (input: { episodeId: string; partialOutput: EpisodeOutput }, 
                    output: { action: "retry" | "skip" | "escalate" }) => Promise<void>

// Orchestration
"orchestration.invoke": (input: { orchestrationSkill: string; input: EpisodeInput }, 
                         output: { chainId: string; steps: OrchestrationStep[] }) => Promise<void>
"orchestration.step": (input: { chainId: string; stepIndex: number; output: EpisodeOutput }, 
                       output: { nextStep?: number; skip?: number[] }) => Promise<void>
"orchestration.complete": (input: { chainId: string; outputs: EpisodeOutput[] }, 
                           output: { combinedOutput: string }) => Promise<void>

// Output chaining
"output.chain": (input: { previousOutput: EpisodeOutput; nextSkill: string }, 
                 output: { chainedInput: string }) => Promise<void>
```

### 6.2 Hook Composition (v2.5)

```typescript
// In src/hooks/index.ts
export function createHooks(config: HermesConfig) {
  return {
    // Existing v2 hooks (preserve)
    "experimental.chat.messages.transform": composeHandlers([
      brainstormGateHook,
      planValidatorHook,
      strictWriteDisciplineHook,
      adversarialCheckHook,
      antiRationalizationHook,
      adversarialDetectorHook,
      intentMarkerHook,
      // NEW v2.5:
      skillRouterHook,        // Route skills to Thread/Fork
      outputChainerHook,       // Chain episode outputs
    ]),
    
    "experimental.chat.system.transform": composeHandlers([
      systemEnhancerHook,
      frameworkPackHook,
      // NEW:
      skillContextInjectorHook, // Inject skill-specific context
    ]),
    
    "tool.execute.before": composeHandlers([
      // Existing v2
      tddEnforcerHook,
      delegationGateHook,
      guardrailsHook,
      scopeGuardHook,
      activityHook,
      // NEW v2.5
      forkBlockerHook,         // Block tool execution during Fork
      episodeTrackerHook.toolBefore,
    ]),
    
    "tool.execute.after": composeHandlers([
      // Existing v2
      activityHook,
      guardrailsHook,
      delegationLedgerHook,
      selfReviewHook,
      phaseMonitorHook,
      knowledgeCuratorHook,
      snapshotWriterHook,
      toolSummarizerHook,
      debuggingSpiralHook,
      rippleCheckHook,
      supervisorIngestHook,
      // NEW v2.5
      episodeTrackerHook.toolAfter,
      orchestrationStepHook,   // Track orchestration chain progress
    ]),
    
    // NEW v2.5 hook points
    "skill.route": skillRouterHook,
    "fork.start": forkManagerHook,
    "fork.feedback": forkFeedbackHook,
    "fork.complete": forkCompleteHook,
    "fork.timeout": forkTimeoutHook,
    "episode.start": episodeStartHook,
    "episode.complete": episodeCompleteHook,
    "episode.timeout": episodeTimeoutHook,
    "orchestration.invoke": orchestrationInvokeHook,
    "orchestration.step": orchestrationStepHook,
    "orchestration.complete": orchestrationCompleteHook,
    "output.chain": outputChainerHook,
    
    "experimental.session.compacting": composeHandlers([
      compactionHook,
      episodePrunerHook,  // Prune old episodes on compaction
    ]),
  };
}
```

---

## 7. TOOL SYSTEM EXTENSIONS

### 7.1 Modified Tools (v2.5)

```typescript
// delegate_task — ADD blocking option
export const delegate_task = tool({
  description: "Dispatch a subagent to accomplish a task",
  args: {
    goal: tool.schema.string(),
    agent: tool.schema.string().optional(),
    toolsets: tool.schema.array(tool.schema.string()).optional(),
    blocking: tool.schema.boolean().default(false),  // NEW: fork mode
  },
  execute: async (args, context) => {
    if (args.blocking) {
      // Fork mode — orchestrator waits
      const forkManager = getForkManager();
      return await forkManager.startFork(args.goal, args.agent, context);
    } else {
      // Thread mode — orchestrator continues
      return await dispatchThread(args.goal, args.agent, context);
    }
  },
});
```

### 7.2 New Tools (v2.5)

```typescript
// Fork management tools
export const fork_create = tool({
  description: "Create a new Fork session (blocking subagent)",
  args: {
    skill: tool.schema.string(),
    input: tool.schema.string(),
    timeout: tool.schema.number().optional(),
  },
  execute: async (args, context) => {
    const forkManager = getForkManager();
    return await forkManager.startFork(args.skill, { trigger: args.input });
  },
});

export const fork_complete = tool({
  description: "Complete an active Fork and return output",
  args: {
    forkId: tool.schema.string(),
    summary: tool.schema.string(),
    artifacts: tool.schema.array(tool.schema.string()).optional(),
  },
  execute: async (args, context) => {
    const forkManager = getForkManager();
    return await forkManager.completeFork(args.forkId, {
      summary: args.summary,
      artifacts: args.artifacts ?? [],
    });
  },
});

export const fork_feedback = tool({
  description: "Send user input to an active Fork",
  args: {
    forkId: tool.schema.string(),
    message: tool.schema.string(),
  },
  execute: async (args, context) => {
    const forkManager = getForkManager();
    return await forkManager.sendFeedback(args.forkId, args.message);
  },
});

// Episode tools
export const episode_list = tool({
  description: "List active and recent episodes",
  args: {
    skillName: tool.schema.string().optional(),
    limit: tool.schema.number().optional(),
  },
  execute: async (args, context) => {
    const store = getEpisodeStore();
    return JSON.stringify(store.getEpisodeHistory(args.skillName, args.limit));
  },
});

export const episode_output = tool({
  description: "Get the output from a completed episode",
  args: {
    episodeId: tool.schema.string(),
  },
  execute: async (args, context) => {
    const store = getEpisodeStore();
    const episode = store.getEpisode(args.episodeId);
    return episode?.output ?? null;
  },
});

// Orchestration tools
export const orchestration_invoke = tool({
  description: "Invoke an orchestration skill by name",
  args: {
    skill: tool.schema.string(),
    input: tool.schema.string(),
  },
  execute: async (args, context) => {
    const engine = getOrchestrationEngine();
    return await engine.invoke(args.skill, { trigger: args.input });
  },
});

export const skill_register = tool({
  description: "Register a new orchestration skill at runtime",
  args: {
    name: tool.schema.string(),
    definition: tool.schema.string(), // YAML or JSON
  },
  execute: async (args, context) => {
    const registry = getSkillRegistry();
    return registry.registerSkill(args.name, parseSkillDefinition(args.definition));
  },
});
```

---

## 8. ORCHESTRATION ENGINE

### 8.1 Chain Execution

```typescript
class OrchestrationEngine {
  private registry: SkillRegistry;
  private episodeStore: EpisodeStore;
  private forkManager: ForkManager;
  
  async invoke(skillName: string, input: EpisodeInput): Promise<EpisodeOutput> {
    const skill = this.registry.getSkill(skillName);
    if (!skill || skill.type !== "orchestration") {
      throw new Error(`Not an orchestration skill: ${skillName}`);
    }
    
    const chainId = generateChainId();
    let previousOutput: EpisodeOutput | null = null;
    const allOutputs: EpisodeOutput[] = [];
    
    for (let i = 0; i < skill.chain.length; i++) {
      const step = skill.chain[i];
      
      // Check condition (if any)
      if (step.condition && !this.evaluateCondition(step.condition, { previousOutput, input })) {
        continue; // Skip this step
      }
      
      // Build input for this step
      const stepInput = this.buildStepInput(step, previousOutput, input);
      
      // Execute step (Thread or Fork)
      const stepOutput = await this.executeStep(step, stepInput);
      
      if (step.captureOutput) {
        allOutputs.push(stepOutput);
        previousOutput = stepOutput;
      }
      
      // Check for early termination
      if (stepOutput.blockers?.length && step.skill === "verify") {
        // If verify fails in an orchestrator chain, stop and report
        break;
      }
    }
    
    // Combine outputs per outputTemplate
    return this.combineOutputs(skill.outputTemplate, allOutputs);
  }
  
  private async executeStep(step: OrchestrationStep, input: EpisodeInput): Promise<EpisodeOutput> {
    const skill = this.registry.getSkill(step.skill);
    
    if (step.mode === "fork") {
      // Blocking — wait for completion
      return await this.forkManager.startFork(step.skill, input);
    } else {
      // Non-blocking — dispatch and return placeholder
      const episode = this.episodeStore.startEpisode(step.skill, input);
      dispatchThread(skill, input); // Don't await
      return { summary: `Thread dispatched: ${step.skill}`, blockers: [] };
    }
  }
  
  private buildStepInput(step: OrchestrationStep, previousOutput: EpisodeOutput | null, input: EpisodeInput): EpisodeInput {
    // Parse inputTemplate and substitute variables
    let resolved = step.inputTemplate
      .replace("{user_request}", input.trigger)
      .replace("{previous}", previousOutput?.summary ?? "")
      .replace("{previous.summary}", previousOutput?.summary ?? "")
      .replace("{previous.artifacts}", previousOutput?.artifacts?.join("\n") ?? "");
    
    return { trigger: resolved, context: { ...input.context, previousOutput } };
  }
  
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    // Simple JS expression evaluation (safe subset)
    // e.g., "{previous.failure_count} >= 3"
    try {
      return new Function("context", `with(context) { return ${condition}; }`)(context);
    } catch {
      return false;
    }
  }
}
```

---

## 9. SKILL LIFECYCLE HOOKS IMPLEMENTATION

### 9.1 Episode Start Hook

```typescript
function createEpisodeStartHook(): Hook<"episode.start"> {
  return async (input, output) => {
    const store = getEpisodeStore();
    const episode = store.startEpisode(input.skillName, input.input);
    
    // Inject skill-specific context into session
    const skill = getSkillRegistry().getSkill(input.skillName);
    output.context = {
      skillName: input.skillName,
      episodeId: episode.id,
      mode: input.mode,
      instructions: skill?.description ?? "",
      timeout: skill?.episodeTimeout ?? 300000,
    };
  };
}
```

### 9.2 Episode Complete Hook

```typescript
function createEpisodeCompleteHook(): Hook<"episode.complete"> {
  return async (input, output) => {
    const store = getEpisodeStore();
    const episode = store.completeEpisode(input.episodeId, input.output);
    
    // Compress context — only keep summary and key decisions
    output.compressed = true;
    
    // If this episode is part of a chain, notify the chain
    if (episode.parentEpisodeId) {
      notifyChainParent(episode.parentEpisodeId, episode);
    }
  };
}
```

### 9.3 Fork Blocker Hook

Prevents tool execution while a Fork is active (orchestrator is blocked):

```typescript
function createForkBlockerHook(): Hook<"tool.execute.before"> {
  return async (input, output) => {
    const forkManager = getForkManager();
    if (forkManager.isActive()) {
      const activeFork = forkManager.getActiveFork();
      // Only allow fork-related tools
      const allowedDuringFork = ["fork_feedback", "fork_complete", "episode_list"];
      if (!allowedDuringFork.includes(input.tool)) {
        throw new Error(
          `FORK_BLOCKED: Fork '${activeFork.skillName}' is active. ` +
          `Only ${allowedDuringFork.join(", ")} tools allowed during Fork. ` +
          `Use fork_feedback to send input to the Fork.`
        );
      }
    }
  };
}
```

---

## 10. INTEGRATION WITH V2 BUILD

### 10.1 Preserve Existing Functionality

- All 19 agents remain (add new agents if needed for orchestration)
- All 28 existing hooks remain (add new hooks, don't remove)
- SessionDB, supervisor loop, 6-phase workflow — all preserved
- Skills in `src/skills/` (PLAN.md, AUTOPILOT.md, etc.) — enhanced with frontmatter

### 10.2 Files to Create (v2.5)

```
src/
├── services/
│   ├── thread-manager.ts     # NEW
│   ├── fork-manager.ts       # NEW
│   ├── episode-store.ts       # NEW
│   ├── orchestration-engine.ts # NEW
│   └── skill-registry.ts     # NEW
├── hooks/
│   ├── skill-router.ts       # NEW
│   ├── fork-manager-hook.ts  # NEW
│   ├── fork-feedback-hook.ts # NEW
│   ├── fork-complete-hook.ts # NEW
│   ├── episode-tracker.ts    # NEW
│   ├── orchestration-executor.ts # NEW
│   ├── output-chainer.ts     # NEW
│   └── skill-context-injector.ts # NEW
├── tools/
│   ├── fork-tools.ts         # NEW
│   ├── episode-tools.ts      # NEW
│   └── orchestration-tools.ts # NEW
└── skills/
    ├── orchestrate.md        # NEW: orchestration format guide
    ├── thread-skill.md       # NEW: thread skill template
    ├── fork-skill.md         # NEW: fork skill template
    └── implement.md          # NEW: /implement orchestration
```

### 10.3 Files to Modify (v2.5)

```
src/
├── index.ts                  # Add Thread/Fork router, orchestration engine
├── hooks/index.ts            # Add new hooks to composition
├── tools/index.ts            # Add new tools
└── skills/PLAN.md           # Add frontmatter
    SKILLS/AUTOPILOT.md       # Add frontmatter
    SKILLS/VERIFY.md          # Add frontmatter
    SKILLS/GRILL.md           # Add frontmatter
    SKILLS/DEBUG.md           # Add frontmatter
```

---

## 11. TESTING PLAN

### 11.1 Unit Tests

```typescript
// fork-manager.test.ts
describe("ForkManager", () => {
  it("blocks orchestrator while Fork is active", async () => {
    const fm = new ForkManager();
    fm.startFork("plan", { trigger: "build auth" });
    expect(fm.isActive()).toBe(true);
    expect(() => fm.startFork("review", { trigger: "check" })).toThrow();
    fm.completeFork(fm.getActiveFork().id, { summary: "plan complete" });
    expect(fm.isActive()).toBe(false);
  });
  
  it("auto-completes stale Fork when new Fork requested", async () => {
    const fm = new ForkManager();
    fm.startFork("plan", { trigger: "build auth" });
    fm.startFork("review", { trigger: "check new" }); // Should auto-complete plan
    const history = fm.getForkHistory();
    expect(history[0].state).toBe("completed");
    expect(history[0].partialOutput).toBeDefined();
  });
});

// orchestration-engine.test.ts
describe("OrchestrationEngine", () => {
  it("executes chain in order", async () => { ... });
  it("skips steps with false condition", async () => { ... });
  it("chains output to next step input", async () => { ... });
  it("stops on verify failure", async () => { ... });
});

// episode-store.test.ts
describe("EpisodeStore", () => {
  it("tracks active episodes", async () => { ... });
  it("limits history to maxHistory", async () => { ... });
  it("stores outputs for chaining", async () => { ... });
});
```

### 11.2 Integration Tests

1. **Thread test**: Dispatch analysis task → verify it's non-blocking → check episode stored
2. **Fork test**: Start plan skill → verify orchestrator blocked → send feedback → verify routing → complete → verify unblocked
3. **Orchestration test**: Invoke /implement → verify chain executes in order → verify output chaining

### 11.3 E2E Tests

1. User says "implement user authentication" → /implement orchestration fires
2. Plan Fork blocks → user collaborates → approved
3. Builder Thread runs in background
4. Review Fork blocks → user reviews
5. Grill Fork blocks → user attacks
6. Verify Thread runs
7. Combined output returned

---

## 12. DEPLOYMENT

### 12.1 Build

```bash
cd v2.5-build
bun install
bun build.ts
# Output: dist/index.js
```

### 12.2 OpenCode Config

```json
"plugins": {
  "hermes-agent": {
    "type": "local",
    "path": "/path/to/v2.5-build/dist/index.js"
  }
}
```

### 12.3 Backward Compatibility

v2.5 is additive — it extends v2 without breaking existing functionality:
- Existing skills work unchanged (just enhanced with frontmatter)
- Existing hooks unchanged
- Fork is opt-in via `blocking: true` or via orchestration skills

---

## 13. PRIORITY IMPLEMENTATION ORDER

**Phase 1: Foundation (Thread/Fork core)**
1. ForkManager service + state machine
2. fork_start/fork_complete hooks
3. Modify delegate_task with blocking option
4. Fork blocker hook (block other tools during Fork)

**Phase 2: Episode System**
5. EpisodeStore service
6. episode.start/episode.complete hooks
7. episode_list/episode_output tools

**Phase 3: Orchestration**
8. SkillRegistry + skill loader
9. OrchestrationEngine
10. orchestration_invoke tool
11. /implement orchestration skill

**Phase 4: Output Chaining**
12. output.chain hook
13. Build step input from previous output

**Phase 5: Integration**
14. Update index.ts to compose all new hooks
15. Add frontmatter to existing skills
16. End-to-end test

---

## 14. REFERENCE: SKILL FRONTMATTER SCHEMA

```yaml
---
name: string              # Unique skill identifier (required)
type: action | interactive | orchestration  # Skill type (required)
description: string       # Human-readable description (required)
executionMode: thread | fork | teammate | orchestration  # How it runs
triggerPatterns:          # Auto-activate on these message patterns (optional)
  - string
chain:                    # For orchestration type only
  - skill: string
    mode: thread | fork
    inputTemplate: string
    condition: string     # JS expression (optional)
    captureOutput: boolean
    timeout: number       # Override default (optional)
episodeTimeout: number    # Max ms (default: 300000)
contextScope: isolated | shared  # Does it pollute orchestrator?
outputTemplate: string   # For orchestration: how to combine outputs
---
# Skill body (markdown)
[Instructions for the skill...]
```

---

*End of Architecture Document v2.5*
*For implementation details, see IMPLEMENTATION_ROADMAP.md*
*For skill stacking patterns from Slate, see ../../context/telegram/library/ARTICLES_ANALYZED.md*