# HERMES AGENT PLUGIN — V2.5 IMPLEMENTATION ROADMAP
## Phase-by-phase build plan for Thread/Fork/Orchestration Skills

**Version:** v2.5
**Date:** 2026-04-02

---

## PHASE 1: Fork Primitive (Foundation)
**Goal:** Add synchronous, blocking subagent dispatch capability

### 1.1 ForkManager Service
**File:** `src/services/fork-manager.ts`

Core state machine managing the Fork lifecycle.

```typescript
type ForkState = "idle" | "active" | "waiting_input" | "completing" | "completed";

interface ForkContext {
  id: string;
  skillName: string;
  state: ForkState;
  startedAt: number;
  lastActivityAt: number;
  input: EpisodeInput;
  accumulatedOutput: string;
  partialOutput: EpisodeOutput | null;
  timeoutMs: number;
}

class ForkManager {
  private activeFork: ForkContext | null = null;
  private forkHistory: ForkContext[] = [];
  private maxHistory = 5;
  
  startFork(skillName: string, input: EpisodeInput, timeoutMs?: number): ForkContext {
    if (this.activeFork) {
      this.autoCompleteStaleFork("New Fork requested");
    }
    
    const context: ForkContext = {
      id: generateId(),
      skillName,
      state: "active",
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      input,
      accumulatedOutput: "",
      partialOutput: null,
      timeoutMs: timeoutMs ?? 300000,
    };
    
    this.activeFork = context;
    return context;
  }
  
  sendFeedback(forkId: string, feedback: string): void {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} not active`);
    }
    this.activeFork.accumulatedOutput += `\nUser: ${feedback}`;
    this.activeFork.lastActivityAt = Date.now();
  }
  
  completeFork(forkId: string, output: EpisodeOutput): EpisodeOutput {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} not active`);
    }
    
    this.activeFork.state = "completed";
    this.activeFork.partialOutput = output;
    
    const result = { ...output, summary: this.compressOutput() };
    
    this.forkHistory.push(this.activeFork);
    if (this.forkHistory.length > this.maxHistory) {
      this.forkHistory.shift();
    }
    
    this.activeFork = null;
    return result;
  }
  
  timeoutFork(forkId: string): EpisodeOutput {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} not active`);
    }
    
    const partial: EpisodeOutput = {
      summary: `Fork timed out after ${this.activeFork.timeoutMs}ms`,
      artifacts: [],
      decisions: [],
      blockers: [{ reason: "timeout", description: `Fork '${this.activeFork.skillName}' timed out` }],
    };
    
    return this.completeFork(forkId, partial);
  }
  
  autoCompleteStaleFork(reason: string): void {
    if (!this.activeFork) return;
    
    const partial: EpisodeOutput = {
      summary: `Auto-completed: ${reason}`,
      artifacts: [],
      decisions: [],
      blockers: [{ reason: "auto_complete", description: `Fork '${this.activeFork.skillName}' auto-completed due to: ${reason}` }],
    };
    
    this.activeFork.state = "completed";
    this.completeFork(this.activeFork.id, partial);
  }
  
  isActive(): boolean { return this.activeFork !== null; }
  getActiveFork(): ForkContext | null { return this.activeFork; }
  getForkHistory(): ForkContext[] { return this.forkHistory; }
  
  private compressOutput(): string {
    if (!this.activeFork) return "";
    const transcript = this.activeFork.accumulatedOutput;
    return transcript.length > 2000 
      ? transcript.substring(0, 2000) + "... [truncated]"
      : transcript;
  }
}
```

### 1.2 Fork Manager Hook
**File:** `src/hooks/fork-manager-hook.ts`

Validates Fork requests and manages active state.

```typescript
export function createForkManagerHook(): Hook<"fork.start"> {
  return async (input, output) => {
    const fm = getForkManager();
    
    if (fm.isActive()) {
      output.blocked = true;
      output.message = `Fork '${fm.getActiveFork().skillName}' is already active. Auto-completing.`;
      fm.autoCompleteStaleFork("New Fork requested");
    }
    
    output.blocked = false;
  };
}
```

### 1.3 Modify delegate_task Tool
**File:** `src/tools/delegate_task.ts`

Add `blocking` parameter to existing delegate_task tool.

```typescript
export const delegate_task = tool({
  description: "Dispatch a subagent to accomplish a task",
  args: {
    goal: tool.schema.string().describe("The task goal for the subagent"),
    agent: tool.schema.string().optional().describe("Specific agent to dispatch"),
    toolsets: tool.schema.array(tool.schema.string()).optional(),
    blocking: tool.schema.boolean().default(false).describe("If true, wait for completion (Fork mode)"),
  },
  execute: async (args, context) => {
    const fm = getForkManager();
    
    if (args.blocking) {
      if (fm.isActive()) {
        fm.autoCompleteStaleFork("Replaced by new blocking request");
      }
      
      const forkContext = fm.startFork(args.agent ?? "subagent", {
        trigger: args.goal,
        context: { toolsets: args.toolsets },
      });
      
      return new Promise<any>((resolve) => {
        const checkCompletion = setInterval(() => {
          if (!fm.isActive() || fm.getActiveFork()?.id !== forkContext.id) {
            clearInterval(checkCompletion);
            const history = fm.getForkHistory();
            const completed = history.find(f => f.id === forkContext.id);
            resolve(completed?.partialOutput ?? { summary: "Fork completed" });
          }
        }, 500);
      });
    } else {
      dispatchThread(args.goal, args.agent, context);
      return { status: "dispatched", agent: args.agent ?? "subagent" };
    }
  },
});
```

### 1.4 Fork Blocker Hook
**File:** `src/hooks/fork-blocker-hook.ts`

Block non-fork tools while a Fork is active.

```typescript
const FORK_ALLOWED_TOOLS = ["fork_feedback", "fork_complete", "episode_list", "episode_output", "delegate_task"];

export function createForkBlockerHook(): Hook<"tool.execute.before"> {
  return async (input, output) => {
    const fm = getForkManager();
    
    if (fm.isActive() && !FORK_ALLOWED_TOOLS.includes(input.tool)) {
      throw new Error(
        `FORK_BLOCKED: Fork '${fm.getActiveFork().skillName}' is active. ` +
        `Only ${FORK_ALLOWED_TOOLS.join(", ")} tools allowed during Fork.`
      );
    }
  };
}
```

### 1.5 Fork Tools
**File:** `src/tools/fork-tools.ts`

```typescript
export const fork_create = tool({
  description: "Create a new Fork session (blocking subagent)",
  args: {
    skill: tool.schema.string(),
    input: tool.schema.string(),
    timeout: tool.schema.number().optional(),
  },
  execute: async (args, context) => {
    const fm = getForkManager();
    const fork = fm.startFork(args.skill, { trigger: args.input }, args.timeout);
    return { forkId: fork.id, status: "active", skill: args.skill };
  },
});

export const fork_complete = tool({
  description: "Complete an active Fork and return its output",
  args: {
    forkId: tool.schema.string(),
    summary: tool.schema.string(),
    artifacts: tool.schema.array(tool.schema.string()).optional(),
    decisions: tool.schema.array(tool.schema.string()).optional(),
    blockers: tool.schema.array(tool.schema.string()).optional(),
  },
  execute: async (args, context) => {
    const fm = getForkManager();
    const output: EpisodeOutput = {
      summary: args.summary,
      artifacts: args.artifacts ?? [],
      decisions: args.decisions ?? [],
      blockers: (args.blockers ?? []).map(b => ({ reason: "manual", description: b })),
    };
    return fm.completeFork(args.forkId, output);
  },
});

export const fork_feedback = tool({
  description: "Send user input to an active Fork",
  args: {
    forkId: tool.schema.string(),
    message: tool.schema.string(),
  },
  execute: async (args, context) => {
    const fm = getForkManager();
    fm.sendFeedback(args.forkId, args.message);
    return { status: "feedback_sent", forkId: args.forkId };
  },
});
```

### Phase 1 Verification

```bash
# Build
bun build.ts

# Test in OpenCode:
# 1. Send: delegate_task goal="build auth" blocking=true
# 2. Verify: orchestrator blocked (other tools fail)
# 3. Send: fork_complete forkId=<id> summary="plan done"
# 4. Verify: unblocked, output returned
```

---

## PHASE 2: Episode System
**Goal:** Track skill execution boundaries and store episode history

### 2.1 EpisodeStore Service
**File:** `src/services/episode-store.ts`

```typescript
interface Episode {
  id: string;
  skillName: string;
  mode: ExecutionMode;
  parentChainId: string | null;
  status: "active" | "completed" | "timeout" | "error";
  startedAt: number;
  endedAt: number | null;
  input: EpisodeInput;
  output: EpisodeOutput | null;
  contextSnapshot: string;
  chainPosition: number | null;
}

class EpisodeStore {
  private episodes: Map<string, Episode> = new Map();
  private activeBySkill: Map<string, string> = new Map();
  private maxHistory = 10;
  
  startEpisode(skillName: string, input: EpisodeInput, mode: ExecutionMode, chainId?: string): Episode {
    const existing = this.activeBySkill.get(skillName);
    if (existing) {
      this.timeoutEpisode(existing, { summary: "Replaced by new episode", artifacts: [], decisions: [], blockers: [] });
    }
    
    const episode: Episode = {
      id: generateId(),
      skillName,
      mode,
      parentChainId: chainId ?? null,
      status: "active",
      startedAt: Date.now(),
      endedAt: null,
      input,
      output: null,
      contextSnapshot: "",
      chainPosition: null,
    };
    
    this.episodes.set(episode.id, episode);
    this.activeBySkill.set(skillName, episode.id);
    
    getHookEngine().fire("episode.start", {
      episodeId: episode.id,
      skillName,
      mode,
    }, {});
    
    return episode;
  }
  
  completeEpisode(episodeId: string, output: EpisodeOutput): Episode {
    const episode = this.episodes.get(episodeId);
    if (!episode) throw new Error(`Episode ${episodeId} not found`);
    
    episode.status = "completed";
    episode.endedAt = Date.now();
    episode.output = output;
    episode.contextSnapshot = this.compressContext(output);
    
    this.activeBySkill.delete(episode.skillName);
    
    getHookEngine().fire("episode.complete", { episodeId, output }, {});
    
    this.pruneOldEpisodes();
    return episode;
  }
  
  timeoutEpisode(episodeId: string, partialOutput: EpisodeOutput): Episode {
    const episode = this.episodes.get(episodeId);
    if (!episode) throw new Error(`Episode ${episodeId} not found`);
    
    episode.status = "timeout";
    episode.endedAt = Date.now();
    episode.output = partialOutput;
    
    this.activeBySkill.delete(episode.skillName);
    
    getHookEngine().fire("episode.timeout", { episodeId, partialOutput }, {});
    
    return episode;
  }
  
  getActiveEpisode(skillName: string): Episode | null {
    const id = this.activeBySkill.get(skillName);
    return id ? this.episodes.get(id) ?? null : null;
  }
  
  getEpisodeHistory(skillName: string, limit = 10): Episode[] {
    return Array.from(this.episodes.values())
      .filter(e => e.skillName === skillName)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  }
  
  getChainOutputs(chainId: string): EpisodeOutput[] {
    return Array.from(this.episodes.values())
      .filter(e => e.parentChainId === chainId && e.output)
      .sort((a, b) => (a.chainPosition ?? 0) - (b.chainPosition ?? 0))
      .map(e => e.output!);
  }
  
  private compressContext(output: EpisodeOutput): string {
    const summary = output.summary;
    const decisions = output.decisions.map(d => d.description).join("; ");
    return `Summary: ${summary.substring(0, 500)}. Decisions: ${decisions.substring(0, 500)}`;
  }
  
  private pruneOldEpisodes(): void {
    const bySkill = new Map<string, Episode[]>();
    for (const ep of this.episodes.values()) {
      const list = bySkill.get(ep.skillName) ?? [];
      list.push(ep);
      bySkill.set(ep.skillName, list);
    }
    
    for (const [skill, eps] of bySkill) {
      if (eps.length > this.maxHistory) {
        const sorted = eps.sort((a, b) => b.startedAt - a.startedAt);
        for (const old of sorted.slice(this.maxHistory)) {
          this.episodes.delete(old.id);
        }
      }
    }
  }
}
```

### 2.2 Episode Tracker Hook
**File:** `src/hooks/episode-tracker.ts`

```typescript
export function createEpisodeTrackerHook() {
  return {
    toolBefore: async (input, output) => {
      // Track tool calls for debugging spiral detection
    },
    toolAfter: async (input, output) => {
      // Check for episode completion signals
    },
  };
}
```

### 2.3 Episode Tools
**File:** `src/tools/episode-tools.ts`

```typescript
export const episode_list = tool({
  description: "List active and recent episodes",
  args: {
    skillName: tool.schema.string().optional(),
    limit: tool.schema.number().optional(),
  },
  execute: async (args, context) => {
    const store = getEpisodeStore();
    const episodes = store.getEpisodeHistory(args.skillName, args.limit ?? 10);
    return JSON.stringify(episodes.map(e => ({
      id: e.id,
      skillName: e.skillName,
      mode: e.mode,
      status: e.status,
      startedAt: new Date(e.startedAt).toISOString(),
      endedAt: e.endedAt ? new Date(e.endedAt).toISOString() : null,
      outputSummary: e.output?.summary?.substring(0, 100),
    })), null, 2);
  },
});

export const episode_output = tool({
  description: "Get the full output from a completed episode",
  args: {
    episodeId: tool.schema.string(),
  },
  execute: async (args, context) => {
    const store = getEpisodeStore();
    const episodes = Array.from(store["episodes"].values());
    const episode = episodes.find(e => e.id === args.episodeId);
    if (!episode?.output) return { error: "Episode not found or still active" };
    return episode.output;
  },
});
```

### Phase 2 Verification

```bash
# Test episode tracking
# 1. Invoke /plan
# 2. episode_list should show "plan" as active
# 3. Complete the Fork
# 4. episode_list should show "plan" as completed with output
```

---

## PHASE 3: Orchestration Engine
**Goal:** Skill chains with conditional branching and output chaining

### 3.1 SkillRegistry Service
**File:** `src/services/skill-registry.ts`

```typescript
interface SkillDefinition {
  name: string;
  type: "action" | "interactive" | "orchestration";
  description: string;
  executionMode: "thread" | "fork" | "teammate";
  triggerPatterns?: string[];
  chain?: OrchestrationStep[];
  episodeTimeout?: number;
  contextScope: "isolated" | "shared";
  outputTemplate?: string;
  instructions: string;
}

class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();
  
  loadSkillsFromDirectory(dirPath: string): void {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".md"));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(dirPath, file), "utf-8");
      const skill = this.parseSkillFile(content, file.replace(".md", ""));
      this.skills.set(skill.name, skill);
    }
  }
  
  parseSkillFile(content: string, defaultName: string): SkillDefinition {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
      return { name: defaultName, type: "action", description: "", executionMode: "thread", contextScope: "isolated", instructions: content };
    }
    
    const frontmatter = yaml.parse(match[1]);
    const body = match[2];
    
    return {
      name: frontmatter.name ?? defaultName,
      type: frontmatter.type ?? "action",
      description: frontmatter.description ?? "",
      executionMode: frontmatter.executionMode ?? "thread",
      triggerPatterns: frontmatter.triggerPatterns,
      chain: frontmatter.chain,
      episodeTimeout: frontmatter.episodeTimeout,
      contextScope: frontmatter.contextScope ?? "isolated",
      outputTemplate: frontmatter.outputTemplate,
      instructions: body.trim(),
    };
  }
  
  getSkill(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }
  
  getSkillsByType(type: SkillDefinition["type"]): SkillDefinition[] {
    return Array.from(this.skills.values()).filter(s => s.type === type);
  }
  
  getTriggeredSkills(message: string): SkillDefinition[] {
    return Array.from(this.skills.values()).filter(skill => {
      if (!skill.triggerPatterns) return false;
      return skill.triggerPatterns.some(pattern => message.includes(pattern));
    });
  }
  
  registerSkill(name: string, definition: SkillDefinition): void {
    this.skills.set(name, definition);
  }
}
```

### 3.2 OrchestrationEngine Service
**File:** `src/services/orchestration-engine.ts`

```typescript
class OrchestrationEngine {
  private registry: SkillRegistry;
  private episodeStore: EpisodeStore;
  private forkManager: ForkManager;
  
  async invoke(skillName: string, input: EpisodeInput): Promise<EpisodeOutput> {
    const skill = this.registry.getSkill(skillName);
    if (!skill) throw new Error(`Skill not found: ${skillName}`);
    if (skill.type !== "orchestration") throw new Error(`Not an orchestration skill: ${skillName}`);
    
    const chainId = generateChainId();
    let previousOutput: EpisodeOutput | null = null;
    const allOutputs: EpisodeOutput[] = [];
    
    for (let i = 0; i < skill.chain.length; i++) {
      const step = skill.chain[i];
      
      if (step.condition && !this.evaluateCondition(step.condition, { previousOutput, input })) {
        continue;
      }
      
      const stepInput = this.buildStepInput(step, previousOutput, input);
      const stepOutput = await this.executeStep(step, stepInput, chainId, i);
      
      if (step.captureOutput) {
        allOutputs.push(stepOutput);
        previousOutput = stepOutput;
      }
      
      if (step.skill === "verify" && stepOutput.blockers?.length) {
        break;
      }
    }
    
    return this.combineOutputs(skill, allOutputs);
  }
  
  private async executeStep(
    step: OrchestrationStep, 
    input: EpisodeInput, 
    chainId: string, 
    position: number
  ): Promise<EpisodeOutput> {
    const episode = this.episodeStore.startEpisode(step.skill, input, step.mode, chainId);
    episode.chainPosition = position;
    
    if (step.mode === "fork") {
      const fork = this.forkManager.startFork(step.skill, input, step.timeout);
      
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (!this.forkManager.isActive() || this.forkManager.getActiveFork()?.id !== fork.id) {
            clearInterval(check);
            const history = this.forkManager.getForkHistory();
            const completed = history.find(f => f.id === fork.id);
            const output = completed?.partialOutput ?? { summary: "Fork completed", artifacts: [], decisions: [], blockers: [] };
            this.episodeStore.completeEpisode(episode.id, output);
            resolve(output);
          }
        }, 500);
      });
    } else {
      dispatchThread(step.skill, input);
      return { 
        summary: `[Thread dispatched: ${step.skill}]`, 
        artifacts: [], 
        decisions: [], 
        blockers: [] 
      };
    }
  }
  
  private buildStepInput(step: OrchestrationStep, previousOutput: EpisodeOutput | null, input: EpisodeInput): EpisodeInput {
    let resolved = step.inputTemplate
      .replace("{user_request}", input.trigger)
      .replace("{previous}", previousOutput?.summary ?? "")
      .replace("{previous.summary}", previousOutput?.summary ?? "")
      .replace("{previous.artifacts}", previousOutput?.artifacts?.join("\n") ?? "");
    
    resolved = resolved.replace(/\{context\.(\w+)\}/g, (_, k) => input.context?.[k] ?? "");
    
    return { trigger: resolved, context: { previousOutput } };
  }
  
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      return new Function("context", `with(context) { return ${condition}; }`)(context);
    } catch {
      return false;
    }
  }
  
  private combineOutputs(skill: SkillDefinition, outputs: EpisodeOutput[]): EpisodeOutput {
    if (!skill.outputTemplate) {
      return {
        summary: outputs.map(o => o.summary).join("\n---\n"),
        artifacts: outputs.flatMap(o => o.artifacts),
        decisions: outputs.flatMap(o => o.decisions),
        blockers: outputs.flatMap(o => o.blockers),
      };
    }
    
    let result = skill.outputTemplate;
    for (let i = 0; i < outputs.length; i++) {
      const prefix = i === 0 ? "verify" : skill.chain[i - 1]?.skill ?? `step${i}`;
      result = result.replace(new RegExp(`\\{${prefix}\\.output\\.summary\\}`, "g"), outputs[i].summary);
      result = result.replace(new RegExp(`\\{${prefix}\\.artifacts\\}`, "g"), outputs[i].artifacts.join("\n"));
    }
    result = result.replace(/{user_request}/g, outputs[0]?.summary ?? "");
    
    return {
      summary: result,
      artifacts: outputs.flatMap(o => o.artifacts),
      decisions: outputs.flatMap(o => o.decisions),
      blockers: outputs.flatMap(o => o.blockers),
    };
  }
}
```

### 3.3 Orchestration Tools
**File:** `src/tools/orchestration-tools.ts`

```typescript
export const orchestration_invoke = tool({
  description: "Invoke an orchestration skill by name",
  args: {
    skill: tool.schema.string(),
    input: tool.schema.string(),
  },
  execute: async (args, context) => {
    const engine = getOrchestrationEngine();
    return await engine.invoke(args.skill, { trigger: args.input, context: {} });
  },
});

export const skill_register = tool({
  description: "Register a new skill at runtime",
  args: {
    name: tool.schema.string(),
    definition: tool.schema.string(),
  },
  execute: async (args, context) => {
    const registry = getSkillRegistry();
    const def = yaml.parse(args.definition);
    registry.registerSkill(args.name, { ...def, instructions: "" });
    return { status: "registered", name: args.name };
  },
});

export const skill_list = tool({
  description: "List all registered skills",
  args: {},
  execute: async (args, context) => {
    const registry = getSkillRegistry();
    const skills = Array.from(registry["skills"].values()).map(s => ({
      name: s.name,
      type: s.type,
      executionMode: s.executionMode,
      description: s.description,
    }));
    return JSON.stringify(skills, null, 2);
  },
});
```

### 3.4 /implement Orchestration Skill
**File:** `src/skills/IMPLEMENT.md`

```markdown
---
name: implement
type: orchestration
description: Full feature implementation from plan to verify
executionMode: fork
chain:
  - skill: plan
    mode: fork
    inputTemplate: "{user_request}"
    captureOutput: true
  - skill: builder
    mode: thread
    inputTemplate: "{previous.summary}"
    captureOutput: true
  - skill: review
    mode: fork
    inputTemplate: "Implementation complete.\n\n{previous.summary}"
    captureOutput: true
  - skill: grill
    mode: fork
    inputTemplate: "Review passed.\n\n{previous.summary}"
    captureOutput: true
  - skill: verify
    mode: thread
    inputTemplate: "All reviews passed.\n\nAttack report:\n{previous.summary}"
    captureOutput: true
outputTemplate: |
  ## Implementation Complete
  
  {verify.output.summary}
  
  ### Artifacts
  {builder.artifacts}
  
  ### Review
  {review.output.summary}
  
  ### Security
  {grill.output.summary}
---
# /implement — Full Feature Implementation

Execute the full implementation chain: plan -> build -> review -> grill -> verify

## Activation
Triggered when user says: "build this", "implement", "add feature", "/implement"

## How It Works

1. **FORK /plan** (blocking)
   - User collaborates on the plan
   - Plan must be approved before proceeding

2. **THREAD @builder** (async)
   - Implementation runs in background
   - User can check progress with /status

3. **FORK /review** (blocking)
   - User reviews implementation
   - Must approve before grilling

4. **FORK /grill** (blocking)
   - Adversarial attack session
   - User probes for vulnerabilities

5. **THREAD /verify** (async)
   - Final verification
   - Tests, build, lint checks

## Output
Combined completion report with all episode summaries.
```

### Phase 3 Verification

```bash
# Test orchestration
# 1. Send: orchestration_invoke skill="implement" input="build user auth"
# 2. Verify: plan Fork blocks
# 3. Complete plan Fork
# 4. Verify: builder Thread dispatched
# 5. Complete builder
# 6. Verify: review Fork blocks
# 7. Complete review
# 8. Verify: grill Fork blocks
# 9. Complete grill
# 10. Verify: verify Thread dispatched
# 11. Combined output returned
```

---

## PHASE 4: Skill Routing & Output Chaining
**Goal:** Route skills to correct execution mode and chain outputs

### 4.1 Skill Router Hook
**File:** `src/hooks/skill-router.ts`

```typescript
export function createSkillRouterHook(): Hook<"skill.route"> {
  return async (input, output) => {
    const registry = getSkillRegistry();
    const skill = registry.getSkill(input.skillName);
    
    if (!skill) {
      output.mode = "thread"; // Default for unknown skills
      output.reason = "unknown skill, default to thread";
      return;
    }
    
    // Check trigger patterns first
    const triggered = registry.getTriggeredSkills(input.userMessage);
    if (triggered.length > 0) {
      output.mode = routeToExecutionMode(triggered[0]);
      output.reason = `triggered by pattern match: ${triggered[0].name}`;
      return;
    }
    
    // Default routing
    output.mode = routeToExecutionMode(skill);
    output.reason = `default for ${skill.type}`;
  };
}

function routeToExecutionMode(skill: SkillDefinition): ExecutionMode {
  if (skill.executionMode) return skill.executionMode;
  
  switch (skill.type) {
    case "action": return "thread";
    case "interactive": return "fork";
    case "orchestration": return "fork";
    default: return "thread";
  }
}
```

### 4.2 Output Chain Hook
**File:** `src/hooks/output-chainer.ts`

```typescript
export function createOutputChainerHook(): Hook<"output.chain"> {
  return async (input, output) => {
    // Pre-process episode output before feeding to next step
    const prev = input.previousOutput;
    
    let chained = prev.summary;
    
    // Add artifact list if next step needs it
    if (prev.artifacts?.length) {
      chained += `\n\nArtifacts created:\n${prev.artifacts.map(a => `- ${a}`).join("\n")}`;
    }
    
    // Add blockers as warnings
    if (prev.blockers?.length) {
      chained += `\n\nBlockers:\n${prev.blockers.map(b => `- ${b.description}`).join("\n")}`;
    }
    
    output.chainedInput = chained;
  };
}
```

---

## PHASE 5: Integration
**Goal:** Wire everything into index.ts and test end-to-end

### 5.1 Update index.ts

```typescript
// Add to imports
import { ForkManager, getForkManager } from "./services/fork-manager";
import { EpisodeStore, getEpisodeStore } from "./services/episode-store";
import { SkillRegistry, getSkillRegistry } from "./services/skill-registry";
import { OrchestrationEngine, getOrchestrationEngine } from "./services/orchestration-engine";
import { createForkBlockerHook } from "./hooks/fork-blocker-hook";
import { createSkillRouterHook } from "./hooks/skill-router";
import { createOutputChainerHook } from "./hooks/output-chainer";
import { createEpisodeTrackerHook } from "./hooks/episode-tracker";
import { fork_create, fork_complete, fork_feedback } from "./tools/fork-tools";
import { episode_list, episode_output } from "./tools/episode-tools";
import { orchestration_invoke, skill_register, skill_list } from "./tools/orchestration-tools";

// Modify delegate_task tool to add blocking support
// (see Phase 1.3 above)

// Add to plugin return
export default async (input: PluginInput) => {
  // Initialize services
  const forkManager = getForkManager();
  const episodeStore = getEpisodeStore();
  const skillRegistry = getSkillRegistry();
  const orchestrationEngine = getOrchestrationEngine();
  
  // Load skills from src/skills/
  skillRegistry.loadSkillsFromDirectory(path.join(__dirname, "skills"));
  
  return {
    name: "hermes-agent",
    agent: createAgents(),
    
    tool: {
      // Existing v2 tools
      ...v2Tools,
      
      // New v2.5 Fork tools
      fork_create,
      fork_complete,
      fork_feedback,
      
      // New v2.5 Episode tools
      episode_list,
      episode_output,
      
      // New v2.5 Orchestration tools
      orchestration_invoke,
      skill_register,
      skill_list,
    },
    
    "experimental.chat.messages.transform": composeHandlers([
      brainstormGateHook,
      planValidatorHook,
      strictWriteDisciplineHook,
      adversarialCheckHook,
      antiRationalizationHook,
      adversarialDetectorHook,
      intentMarkerHook,
      // NEW v2.5
      createSkillRouterHook(),
      createOutputChainerHook(),
    ]),
    
    "tool.execute.before": composeHandlers([
      tddEnforcerHook,
      delegationGateHook,
      guardrailsHook,
      scopeGuardHook,
      activityHook,
      // NEW v2.5
      createForkBlockerHook(),
      createEpisodeTrackerHook().toolBefore,
    ]),
    
    "tool.execute.after": composeHandlers([
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
      createEpisodeTrackerHook().toolAfter,
    ]),
    
    "experimental.session.compacting": composeHandlers([
      compactionHook,
      episodePrunerHook,
    ]),
  };
};
```

### 5.2 Add Frontmatter to Existing Skills

Update `src/skills/PLAN.md`, `src/skills/AUTOPILOT.md`, etc. to add YAML frontmatter:

```markdown
---
name: plan
type: interactive
description: No-placeholder planning with exact paths and code
executionMode: fork
episodeTimeout: 300000
contextScope: isolated
---
# /plan — Adaptive No-Placeholder Planning
[... existing content ...]
```

### Phase 5 Verification

```bash
# Full E2E test
bun build.ts
npx tsc --noEmit

# In OpenCode:
# 1. "implement user authentication" 
# 2. /implement orchestration fires
# 3. Plan Fork blocks -> user collaborates -> approved
# 4. Builder Thread in background
# 5. Review Fork blocks -> user reviews
# 6. Grill Fork blocks -> user attacks
# 7. Verify Thread runs
# 8. Combined output returned
```

---

## FILES TO CREATE SUMMARY

```
src/
├── services/
│   ├── fork-manager.ts          # Phase 1
│   ├── episode-store.ts          # Phase 2
│   ├── skill-registry.ts        # Phase 3
│   └── orchestration-engine.ts   # Phase 3
├── hooks/
│   ├── fork-manager-hook.ts     # Phase 1
│   ├── fork-blocker-hook.ts     # Phase 1
│   ├── episode-tracker.ts       # Phase 2
│   ├── skill-router.ts          # Phase 4
│   └── output-chainer.ts        # Phase 4
├── tools/
│   ├── fork-tools.ts            # Phase 1
│   ├── episode-tools.ts         # Phase 2
│   └── orchestration-tools.ts   # Phase 3
└── skills/
    ├── orchestrate.md           # Phase 3
    ├── thread-skill.md          # Phase 3
    ├── fork-skill.md            # Phase 3
    └── implement.md             # Phase 3
```

## FILES TO MODIFY SUMMARY

```
src/
├── index.ts                     # Phase 5: add new services, hooks, tools
├── tools/
│   └── delegate_task.ts         # Phase 1: add blocking parameter
└── skills/
    ├── PLAN.md                 # Phase 5: add frontmatter
    ├── AUTOPILOT.md            # Phase 5: add frontmatter
    ├── VERIFY.md               # Phase 5: add frontmatter
    └── [other skills]          # Phase 5: add frontmatter
```

---

## ESTIMATED IMPLEMENTATION TIME

- Phase 1 (Fork Primitive): 2-3 hours
- Phase 2 (Episode System): 2 hours
- Phase 3 (Orchestration Engine): 3-4 hours
- Phase 4 (Skill Routing): 1-2 hours
- Phase 5 (Integration): 2-3 hours
- **Total: 10-14 hours**

