# BUILD WORKFLOW MERGE — Spider Agent × Shark CLI × Superpowers
## The Definitive Production-Grade Autonomous Software Engineering Framework

**Date**: 2026-04-01
**Sources**: Spider Agent forensic (68K lines), Shark CLI architecture, Superpowers (125k stars), claw-code-rs architecture, Claude Code runtime analysis
**Status**: Synthesized — Ready for Implementation

---

## Executive Summary

You have three independently-built coding agent systems that solve the same problem (autonomous production software engineering) from different angles. Each has distinct strengths:

| System | Strength | Weakness |
|--------|----------|----------|
| **Spider Agent** | 11-agent specialization, hook-based pipeline enforcement, session snapshot/resume | UI-coupled, complex, no explicit brainstorm gate |
| **Shark CLI** | Dual-brain coordinator (DeepSeek + GLM), TypeScript-native, lightweight | Implied 5-phase pipeline, no formal TDD, no supervisor loop |
| **Superpowers** | 7-phase mandatory discipline, skill-based extensibility, TDD iron law | Skill framework only (no runtime), requires manual orchestration |

The goal is not to pick one — it's to extract the **best patterns from each** and merge them into a single coherent workflow that runs on the Leviathan/Shark/Kraken stack.

**Core insight from Claude Code source**: The real architecture is a **Runtime-first** system, not a Prompt-first system. Tools, Tasks, and Sessions are first-class runtime objects. Skills and prompts are configuration, not architecture.

---

## Part 1: Cross-Reference Analysis

### What Each System Does Well

#### Spider Agent (from forensic analysis)

**Best patterns to adopt:**

1. **Hub-and-Spoke Agent Specialization**
   - 1 orchestrator (`architect`) delegates to 10 specialized subagents
   - Each agent has a specific mode: `primary`, `subagent`, or `all`
   - Subagents are isolated — fresh context per task
   - Reviewer agents are separate from coder agents (no conflict of interest)

2. **Hook-Based Pipeline Enforcement**
   - 20+ lifecycle hooks enforce phase transitions
   - `hook.phase.approve` gates between pipeline stages
   - Hooks are registered at plugin init, executed by the runtime
   - This is how you make skills **mandatory** — not prompting, enforcement

3. **Session Snapshot and Resume**
   - Full session state persisted between turns
   - Can resume after interruption
   - Critical for long-running builds

4. **Tool Registry with Schema Validation**
   - Tools have input schemas validated before execution
   - Permission mode checked before tool runs
   - Tool execution is serialized or parallelized based on `concurrency` flag

5. **Drift Verification**
   - `critic_drift_verifier` agent checks that execution matches plan
   - Phase completion is verified, not assumed

#### Shark CLI (from context)

**Best patterns to adopt:**

1. **Dual-Brain Coordinator**
   - DeepSeek (reasoning/plan) + GLM (execution/act) as coordinated pair
   - Thinker/Doer separation at the coordinator level
   - This maps to Claude Code's `QueryEngine` (state) vs `query()` (execution) split

2. **TypeScript-Native**
   - Tool calls, agent configs, state objects all typed
   - Self-hostable, no Python dependency

3. **Lightweight Startup**
   - No Ink/React UI overhead
   - Headless-first, terminal-native

#### Superpowers (from skill analysis)

**Best patterns to adopt:**

1. **Brainstorm Gate (HARD-GATE)**
   - `<HARD-GATE>` — no implementation action until design approved
   - This is the single most valuable discipline pattern
   - Enforced at skill level, not convention

2. **No-Placeholder Planning**
   - Every plan must have exact file paths, actual code, exact commands
   - `TBD`, `TODO` in plans = plan failure
   - Self-review checklist before handoff

3. **TDD Iron Law**
   - `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`
   - Red-green-refactor enforced
   - Tests must fail for the right reason

4. **Two-Stage Code Review**
   - Stage 1: Spec compliance (does code do what plan says?)
   - Stage 2: Code quality (readability, security, patterns)
   - Separate reviewer agents for each stage

5. **Model Tiering**
   - Cheap/fast model for mechanical tasks
   - Standard model for integration tasks
   - Most capable model for architecture/review

6. **Subagent Status Protocol**
   - DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
   - Controller handles each status appropriately
   - Never ignores escalations

#### Claude Code Runtime (from source analysis)

**Best patterns to adopt:**

1. **8-Layer Architecture**
   - CLI Entrypoint → Bootstrap → UI/REPL → Input Processing → Query Runtime → Tool Execution → Task Runtime → Extensions
   - Clear separation: UI is not the runtime

2. **Recursive Query Loop**
   - `query()` drives multi-turn agent conversation
   - Stream → collect text/tool_use → execute tools → append results → recurse
   - Handles compact, retry, continuation internally

3. **Token Budget and Compaction**
   - `should_compact()` called before each request
   - Drops oldest messages when budget exceeded
   - Micro-compact for large tool outputs
   - Session continues reliably over long conversations

4. **ToolContext — Permission + CWD + Session as a unit**
   - Tools receive `ToolContext { cwd, permissions, session_id }`
   - Not global state — injected per call

5. **Event-driven UI updates**
   - `QueryEvent { TextDelta, ToolUseStart, ToolResult, TurnComplete, Usage }`
   - UI subscribes to events, doesn't block on query

6. **Task as first-class object**
   - Long-running tasks promoted to `Task` with lifecycle
   - Can be background, foreground, notified, terminated
   - Results surface as notifications to main session

---

## Part 2: The Merged Architecture

### Design Principles

1. **Runtime-first**: The runtime enforces discipline, not prompts. Skills are configuration; hooks are architecture.
2. **Hermes as the 2nd Brain Agent**: Instead of DeepSeek R1 as the reasoning substrate, Hermes IS the persistent agent with memory.
3. **Supervisor loop**: A monitoring agent continuously improves the system.
4. **Mechanical enforcement**: Phase gates are enforced, not suggested.

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: CLI ENTRYPOINT                                        │
│  ~/hermes-workspace/scripts/                                    │
│  - hermes-agent-manager.ts  (main CLI, worktree setup)          │
│  - hermes-supervisor.ts     (monitoring loop)                   │
│  - hermes-session.ts        (session state + compaction)        │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│  LAYER 2: AGENT RUNTIME (Query Engine)                           │
│  ~/hermes-workspace/src/runtime/                                 │
│  - query-engine.ts      (recursive agent loop)                   │
│  - session-state.ts     (messages, tokens, turn count)           │
│  - token-budget.ts      (compaction strategy)                   │
│  - event-bus.ts         (QueryEvent emissions)                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│  LAYER 3: TOOL EXECUTION                                        │
│  ~/hermes-workspace/src/tools/                                   │
│  - tool-registry.ts    (schema validation, permission check)     │
│  - tool-orchestrator.ts (serial/parallel execution)              │
│  - tool-context.ts     (cwd, permissions, session_id)            │
│  Built-in: Bash, ReadFile, EditFile, Glob, Grep, WebSearch,      │
│            AgentTool, MCPTool, TodoWrite, TaskTool               │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│  LAYER 4: TASK RUNTIME                                          │
│  ~/hermes-workspace/src/tasks/                                   │
│  - task-registry.ts    (background task lifecycle)               │
│  - local-agent-task.ts  (subagent execution)                     │
│  - remote-agent-task.ts (cross-machine agent)                    │
│  - notification-queue.ts (task→session results)                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│  LAYER 5: AGENT DEFINITIONS (11 agents)                          │
│  ~/hermes-workspace/src/agents/                                  │
│  Orchestrator: architect   (mode: primary, Hermes-2nd-brain)     │
│  Subagents:                                                                │
│    explorer        — codebase context gathering                    │
│    coder          — implementation (fresh context per task)       │
│    reviewer        — correctness + security                       │
│    test-engineer  — TDD enforcement                              │
│    sme             — subject matter expert consultation           │
│    critic          — plan critique before execution               │
│    drift-verifier  — phase completion verification               │
│    docs            — documentation updates                        │
│    quality-reviewer — code quality (stage 2 review)              │
│    spec-reviewer   — spec compliance (stage 1 review)           │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│  LAYER 6: WORKFLOW ENFORCEMENT (Hooks)                          │
│  ~/hermes-workspace/src/hooks/                                   │
│  - brainstorm-gate.ts    (HARD-GATE: no impl until approved)     │
│  - plan-validator.ts     (no TBD, exact paths required)         │
│  - tdd-enforcer.ts       (no prod code without failing test)     │
│  - review-gate.ts        (two-stage review before completion)    │
│  - debug-strike-rule.ts   (3 failures → architecture review)     │
│  - supervisor-hook.ts    (Graeme's self-improvement loop)        │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│  LAYER 7: SKILL SYSTEM (Text-based Extensions)                   │
│  ~/hermes-workspace/skills/                                      │
│  Each skill: SKILL.md (markdown + frontmatter)                    │
│  - brainstorming/        (Superpowers 9-step gate)                │
│  - writing-plans/        (no-placeholder plans)                   │
│  - subagent-driven-dev/  (parallel execution)                      │
│  - test-driven-dev/      (TDD iron law)                          │
│  - systematic-debugging/ (3-strike rule)                          │
│  - code-review/          (two-stage review)                      │
│  - finishing-branch/      (merge + cleanup)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 3: The Merged 7-Phase Workflow

This is the **best of all three systems**, enforced mechanically:

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 0: HERMES AGENT MANAGER (always running)                │
│  - Maintains session state (messages, tokens, turns)           │
│  - Emits events to UI/logs                                      │
│  - Routes incoming requests to Phase 1                         │
│  - Runs supervisor loop in background                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: BRAINSTORM GATE (Superpowers + Spider critic)        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ <HARD-GATE> — No implementation until design approved    │  │
│  │ 1. Explore project context (explorer agent)               │  │
│  │ 2. Ask clarifying questions — one at a time               │  │
│  │ 3. Propose 2-3 approaches with trade-offs + recommendation│  │
│  │ 4. Present design (scaled to complexity)                  │  │
│  │ 5. Write design doc to docs/YYYY-MM-DD-<topic>-design.md  │  │
│  │ 6. Self-review: placeholders? contradictions? scope?      │  │
│  │ 7. USER APPROVAL GATE — wait for explicit approval        │  │
│  │ 8. Invoke writing-plans skill                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: PLAN (Superpowers no-placeholder + Shark planner)   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Every step MUST have:                                     │  │
│  │   - Exact file paths (created AND modified)              │  │
│  │   - Actual code blocks (not "implement X")               │  │
│  │   - Exact test commands with expected output             │  │
│  │   - Exact acceptance criteria                            │  │
│  │ NO: TBD, TODO, "fill in later", "add validation"        │  │
│  │ Self-review checklist before handoff                     │  │
│  │ Save to: docs/plans/YYYY-MM-DD-<topic>-plan.md           │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: BUILD (Spider subagent + Superpowers + Claude Code)  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ FOR EACH TASK in plan (sequential — no parallel impl):    │  │
│  │   a. Dispatch coder subagent (fresh context, no history)  │  │
│  │   b. Coder follows TDD: write failing test FIRST         │  │
│  │   c. Watch test fail (RED)                               │  │
│  │   d. Write minimal code to pass (GREEN)                  │  │
│  │   e. Refactor (REFACTOR)                                 │  │
│  │   f. Self-review + commit                               │  │
│  │ Model tiering: cheap=mechanical, standard=integration,  │  │
│  │                capable=architecture                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: TWO-STAGE REVIEW (Spider + Superpowers)              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ STAGE 1 — Spec Compliance Review (spec-reviewer agent)   │  │
│  │   Does the code do exactly what the plan says?           │  │
│  │   No under-building? No over-building?                   │  │
│  │   Any extra features not in spec?                        │  │
│  │                                                        │  │
│  │ STAGE 2 — Code Quality Review (quality-reviewer agent)  │  │
│  │   Readability, security, performance, patterns          │  │
│  │   Exit criteria: all issues resolved                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: SYSTEMATIC DEBUGGING (Superpowers 3-strike rule)     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ IF bug found:                                             │  │
│  │   1. Reproduce — exact steps to see failure              │  │
│  │   2. Isolate — smallest possible reproduction            │  │
│  │   3. Hypothesis — one cause                              │  │
│  │   4. Fix — smallest change that fixes                    │  │
│  │   5. Verify — test passes                                │  │
│  │                                                        │  │
│  │ 3-STRIKE RULE:                                           │  │
│  │   After 3 failed fix attempts on same bug →              │  │
│  │   MANDATORY architecture review (critic agent)           │  │
│  │   User must approve before continuing                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 6: BRANCH COMPLETION (Superpowers finishing-branch)     │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ - Verify all tests pass                                  │  │
│  │ - Run full test suite                                    │  │
│  │ - Update relevant docs                                   │  │
│  │ - Commit with conventional commit message                │  │
│  │ - Create PR / merge request                             │  │
│  │ - Notify requester                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 7: SUPERVISOR LOOP (Graeme's self-improving framework) │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Runs continuously in background:                          │  │
│  │   - Monitor agent-swarm logs (localhost:3013)            │  │
│  │   - Detect: failed tasks, stale jobs, repeated bugs      │  │
│  │   - Classify risk: LOW (auto-fix) or HIGH (escalate)     │  │
│  │   - LOW risk: apply fix automatically, log change        │  │
│  │   - HIGH risk: notify Leviathan for approval             │  │
│  │   - Inject learnings: push insights to relevant agents   │  │
│  │     via agent_swarm_inject_learning                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Hermes Agent Manager — Architecture

### Hermes as the 2nd Brain Agent

Instead of DeepSeek R1 being the reasoning substrate, **Hermes IS the persistent agent**. The architecture change:

```
OLD:
  Leviathan → Hermes (stateless API) → DeepSeek R1 (reasoning) → OpenCode (execution)

NEW:
  Leviathan → Hermes Agent Manager (persistent, stateful)
                    │
                    ├── 2nd Brain Memory (hermes-workspace context)
                    ├── Supervisor Loop (self-improvement)
                    ├── Session State (long-running conversation)
                    └── Tool Execution (via OpenCode subprocess)
```

### Hermes Agent Manager — Core Components

#### `hermes-session.ts` — Session State

```typescript
interface HermesSession {
  id: string;
  messages: Message[];           // Full conversation history
  turnCount: number;
  tokenBudget: TokenBudget;
  cwd: string;
  permissionMode: PermissionMode;
  lastInputTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  snapshot(): void;              // Persist to hermes-workspace/.state/
  resume(): boolean;             // Restore from snapshot
}
```

#### `hermes-query-engine.ts` — The Recursive Loop

```typescript
async function hermesQuery(
  session: HermesSession,
  provider: ModelProvider,
  registry: ToolRegistry,
  orchestrator: ToolOrchestrator,
  onEvent: EventCallback
): Promise<void> {
  // 1. Pre-flight: compact if token budget exceeded
  // 2. Memory prefetch: load CLAUDE.md from cwd
  // 3. Build request: system prompt + messages + tools
  // 4. Stream response: collect text + tool_use
  // 5. Execute tools: permission check → schema validate → run
  // 6. Append results: tool_result as user message
  // 7. Recurse if tool calls or max_tokens hit
  // 8. Emit: TurnComplete, Usage events
}
```

#### `hermes-agent-manager.ts` — Main Entry

```typescript
// responsibilities:
// - Initialize session (or resume from snapshot)
// - Set up worktree for branch-based work
// - Register all 11 agent definitions
// - Register all hooks (brainstorm gate, tdd enforcer, etc.)
// - Start supervisor loop in background
// - Route CLI commands to appropriate handlers

async function main() {
  const session = await HermesSession.resume() || new HermesSession();
  
  // Worktree setup (like Superpowers)
  await setupWorktree(session.cwd);
  
  // Agent registry (Spider's 11 agents)
  const agents = registerHermesAgents();
  
  // Hook registration (mechanical enforcement)
  const hooks = registerWorkflowHooks();
  
  // Supervisor loop (Graeme's pattern)
  startSupervisorLoop(agents);
  
  // Main REPL or headless loop
  if (isInteractive) {
    launchREPL(session, agents, hooks);
  } else {
    await runHeadless(session);
  }
}
```

### Hermes Supervisor — Self-Improvement Loop

```typescript
async function supervisorLoop() {
  while (true) {
    const tasks = await agentSwarmGetTasks({ status: 'failed', unassigned: false });
    const logs = await fetchRecentLogs();
    
    const anomalies = detectAnomalies(logs); // failed tasks, stale jobs
    
    for (const anomaly of anomalies) {
      const risk = classifyRisk(anomaly);
      
      if (risk === 'LOW') {
        const fix = await generateFix(anomaly);
        await applyFix(fix);
        await notifyLeviathan(`Auto-fixed: ${anomaly.description}`);
        await agentSwarmInjectLearning(anomaly.agentId, {
          type: 'fix_applied',
          bug: anomaly.description,
          fix: fix.summary,
        });
      } else {
        await notifyLeviathan(`Needs review: ${anomaly.description}`);
        await agentSwarmStoreProgress(anomaly.taskId, {
          status: 'blocked',
          blocker: anomaly.description,
          suggested_fix: await generateFix(anomaly),
        });
      }
    }
    
    await sleep(60); // Check every minute
  }
}
```

---

## Part 5: Multi-Agent Orchestration — How Claude Code Does It

### The Three Orchestration Patterns

#### Pattern 1: Parallel Subagents (Superpowers)

```
Controller (Hermes)
  ├── Dispatch implementer subagent → Task 1 (fresh context, isolated)
  ├── Dispatch implementer subagent → Task 2 (fresh context, isolated)
  └── Dispatch implementer subagent → Task 3 (fresh context, isolated)
  
  [All run in parallel — independent files, no conflicts]
  
Controller receives results
  ├── Review subagent → Task 1 (spec compliance)
  ├── Review subagent → Task 2 (spec compliance)
  └── Review subagent → Task 3 (spec compliance)
  
Controller aggregates → next phase
```

**Rules:**
- Never dispatch two implementation subagents for the SAME file in parallel
- Each subagent gets exactly what it needs — no context inheritance
- Controller provides complete context upfront

#### Pattern 2: Sequential Specialist Pipeline (Spider Agent)

```
User Request
    │
    ▼
Architect (orchestrator)
    │
    ├── Dispatch: explorer → gather context
    │
    ├── Dispatch: critic → plan critique (BLOCK until approved)
    │
    ├── Dispatch: coder → implement (blocked by critic approval)
    │
    ├── Dispatch: test-engineer → write tests (parallel with coder)
    │
    ├── Dispatch: reviewer → correctness review
    │
    ├── Dispatch: drift-verifier → phase verification
    │
    └── Dispatch: docs → update docs
```

**Rules:**
- Each phase gates the next
- Reviewer doesn't run until coder finishes
- Drift verifier confirms before phase transition

#### Pattern 3: Background Task with Notification (Claude Code)

```
Main Session
    │
    ├── Execute: long_build_command (becomes Task)
    │
    [Task runs in background]
    │
    [Main session continues — user can do other things]
    │
    [Task completes → notification queued]
    │
    [Next user message consumes notification as attachment]
```

### Implementation for Leviathan Stack

```typescript
// In hermes-tasks.ts — task registry
const tasks = new Map<string, Task>();

async function executeWithTaskTracking(
  agentId: string,
  prompt: string,
  options: { background?: boolean; timeout?: number }
): Promise<TaskResult> {
  if (options.background) {
    const taskId = uuid();
    tasks.set(taskId, { status: 'running', agentId, prompt });
    
    // Fire and don't wait
    executeInBackground(taskId, agentId, prompt).then(result => {
      tasks.set(taskId, { status: 'completed', result });
      notifyMainSession(taskId, result); // attachment to session
    });
    
    return { taskId, status: 'background' };
  } else {
    return await executeSynchronously(agentId, prompt);
  }
}

// In hermes-subagent.ts — fresh context dispatch
async function dispatchSubagent(
  role: AgentRole,
  taskSpec: TaskSpec,
  sessionContext: SessionContext
): Promise<SubagentResult> {
  // NEVER pass inherited context — construct exact prompt
  const prompt = constructPrompt({
    role,
    taskSpec,           // Exact task text from plan
    workspaceFiles: sessionContext.relevantFiles,  // Only what they need
    systemPrompt: getAgentSystemPrompt(role),      // No conversation history
    constraints: getAgentConstraints(role),         // Permission boundaries
  });
  
  const result = await callModel(prompt, getModelForRole(role));
  
  // Handle status protocol
  if (result.status === 'NEEDS_CONTEXT') {
    return dispatchSubagent(role, taskSpec, { ...sessionContext, ...result.missingContext });
  }
  
  return result;
}
```

---

## Part 6: Implementation Roadmap

### Phase 1: Hermes Agent Manager Core (This Week)
**Effort**: ~6 hours

- [ ] `hermes-session.ts` — Session state with snapshot/resume
- [ ] `hermes-query-engine.ts` — The recursive query loop (from claw-code-rs patterns)
- [ ] `token-budget.ts` — Compaction strategy
- [ ] `event-bus.ts` — Event emission system
- [ ] `hermes-agent-manager.ts` — Main CLI entry

**Verify**: Session persists across restarts. Token compaction works at 70% budget.

### Phase 2: Tool System (This Week)
**Effort**: ~4 hours

- [ ] `tool-registry.ts` — Schema validation, permission mode, concurrency flags
- [ ] `tool-context.ts` — cwd + permissions + session_id injected
- [ ] Core tools: Bash, ReadFile, EditFile, Glob, Grep
- [ ] AgentTool (dispatch subagent), MCPTool (bridge to agent-swarm)

**Verify**: Tool calls fail gracefully with schema errors. Permissions enforced.

### Phase 3: 11-Agent Definitions (This Week)
**Effort**: ~3 hours

- [ ] Architect (mode: primary) — orchestrator with dual-brain
- [ ] Explorer, Coder, Reviewer, TestEngineer, SME, Critic, DriftVerifier, Docs, QualityReviewer, SpecReviewer (mode: subagent)
- [ ] Agent system prompts — each role has precise boundaries
- [ ] Model tiering config — which model per role

**Verify**: Each agent responds correctly to its role. No role bleed.

### Phase 4: Workflow Hooks (This Week)
**Effort**: ~4 hours

- [ ] `brainstorm-gate.ts` — HARD-GATE enforcement before Phase 1
- [ ] `plan-validator.ts` — No-placeholder checker
- [ ] `tdd-enforcer.ts` — No prod code without failing test
- [ ] `review-gate.ts` — Two-stage review enforcement
- [ ] `debug-strike-rule.ts` — 3-strike architecture review trigger

**Verify**: Phase gates actually block progression. No bypass possible.

### Phase 5: Skill System Integration (Next Week)
**Effort**: ~3 hours

- [ ] Install Superpowers skills as `~/hermes-workspace/skills/`
- [ ] Skill loader — parse SKILL.md, inject into agent prompts
- [ ] Hook each skill to appropriate phase
- [ ] Visual companion (optional browser mode for design)

**Verify**: Skills appear in agent prompts. `<HARD-GATE>` enforced.

### Phase 6: Hermes Supervisor Loop (Next Week)
**Effort**: ~4 hours

- [ ] `hermes-supervisor.ts` — Continuous monitoring
- [ ] Anomaly detection from agent-swarm logs
- [ ] Auto-fix for LOW risk, escalate HIGH risk
- [ ] Learning injection via `agent_swarm_inject_learning`

**Verify**: Supervisor catches failures. Auto-fixes apply. Notifications sent.

### Phase 7: Parallel Execution Polish (Next Week)
**Effort**: ~3 hours

- [ ] `task-registry.ts` — Background task lifecycle
- [ ] Notification queue — task results as session attachments
- [ ] Parallel subagent dispatch for independent tasks
- [ ] Conflict detection — no parallel writes to same file

**Verify**: Tasks run in background. Main session continues. Results surface correctly.

---

## Part 7: Comparison Table — Best of Each System

| Pattern | Source | Why Best | Where Implemented |
|---------|--------|----------|-----------------|
| Hard brainstorm gate | Superpowers | Catches wrong direction before code is written | `brainstorm-gate.ts` hook |
| No-placeholder planning | Superpowers | Eliminates "TBD" syndrome | `plan-validator.ts` hook |
| TDD iron law | Superpowers | Proves code works, not just "looks right" | `tdd-enforcer.ts` hook |
| Two-stage review | Superpowers + Spider | Spec compliance AND quality separately | `review-gate.ts` hook |
| 3-strike debug rule | Superpowers | Forces architecture thinking, not brute-force | `debug-strike-rule.ts` hook |
| Model tiering | Superpowers | Cost/speed optimization per task complexity | `model-tiering.ts` config |
| Subagent status protocol | Superpowers | Structured escalation, no ignored blockers | `dispatch-subagent.ts` |
| 11-agent specialization | Spider Agent | Clear role boundaries, no agent doing too much | `agents/` directory |
| Hook-based enforcement | Spider Agent | Skills become mandatory, not suggested | `hooks/` registry |
| Session snapshot/resume | Spider Agent | Survive restarts mid-build | `session-state.ts` |
| Drift verifier | Spider Agent | Phase completion verified, not assumed | `drift-verifier.ts` |
| ToolContext injection | Claude Code | No global state in tools | `tool-context.ts` |
| Token budget compaction | Claude Code | Long sessions don't degrade | `token-budget.ts` |
| Event-driven architecture | Claude Code | UI/runtime separation | `event-bus.ts` |
| Task as first-class object | Claude Code | Background work manageable | `task-registry.ts` |
| Dual-brain coordinator | Shark CLI | Thinker/Doer at runtime level | `architect/dual-brain.ts` |
| TypeScript-native | Shark CLI | Self-hostable, fast startup | `src/runtime/` |
| Supervisor self-improvement | Graeme | System gets better automatically | `hermes-supervisor.ts` |

---

## Part 8: Key Files Map

```
~/hermes-workspace/
├── hermes-agent-manager/              # Main TypeScript project
│   ├── src/
│   │   ├── main.ts                   # CLI entrypoint
│   │   ├── runtime/
│   │   │   ├── query-engine.ts       # Recursive agent loop
│   │   │   ├── session-state.ts      # Messages, tokens, resume
│   │   │   ├── token-budget.ts       # Compaction strategy
│   │   │   └── event-bus.ts          # Event emissions
│   │   ├── tools/
│   │   │   ├── registry.ts           # Schema validation
│   │   │   ├── orchestrator.ts       # Serial/parallel execution
│   │   │   ├── context.ts            # ToolContext (cwd, perms, session)
│   │   │   └── builtins/
│   │   │       ├── bash.ts
│   │   │       ├── file-ops.ts
│   │   │       ├── glob.ts
│   │   │       ├── grep.ts
│   │   │       ├── web-search.ts
│   │   │       ├── agent-tool.ts     # Subagent dispatch
│   │   │       └── mcp-tool.ts       # MCP bridge
│   │   ├── tasks/
│   │   │   ├── registry.ts           # Task lifecycle
│   │   │   ├── local-agent-task.ts   # Subagent execution
│   │   │   └── notification-queue.ts # Task→session results
│   │   ├── agents/
│   │   │   ├── architect.ts          # Orchestrator (primary)
│   │   │   ├── explorer.ts           # Context gathering
│   │   │   ├── coder.ts              # Implementation
│   │   │   ├── reviewer.ts            # Correctness + security
│   │   │   ├── test-engineer.ts       # TDD enforcement
│   │   │   ├── sme.ts                 # Subject matter expert
│   │   │   ├── critic.ts              # Plan critique
│   │   │   ├── drift-verifier.ts      # Phase verification
│   │   │   ├── docs.ts                # Documentation
│   │   │   ├── quality-reviewer.ts     # Stage 2 review
│   │   │   └── spec-reviewer.ts       # Stage 1 review
│   │   ├── hooks/
│   │   │   ├── brainstorm-gate.ts     # HARD-GATE enforcement
│   │   │   ├── plan-validator.ts       # No-placeholder checker
│   │   │   ├── tdd-enforcer.ts         # TDD enforcement
│   │   │   ├── review-gate.ts          # Two-stage review
│   │   │   ├── debug-strike-rule.ts    # 3-strike trigger
│   │   │   └── supervisor-hook.ts      # Self-improvement
│   │   └── skills/                     # Superpowers skills
│   │       ├── brainstorming/
│   │       ├── writing-plans/
│   │       ├── subagent-driven-dev/
│   │       ├── test-driven-dev/
│   │       ├── systematic-debugging/
│   │       ├── code-review/
│   │       └── finishing-branch/
├── .state/
│   ├── session-snapshots/             # Resume state
│   └── bridge_state.json
├── context/
│   ├── engineering/
│   │   ├── BUILD_WORKFLOW_MERGE.md    # This document
│   │   ├── CLAUDE_CODE_INTEGRATION.md
│   │   └── ...
│   └── telegram/
├── research/
│   └── claude-code-source/
│       ├── superpowers/               # 125k stars workflow
│       ├── claw-code-rs/              # Rust rewrite
│       └── claude-code-src/           # Original source
└── scripts/
    ├── hermes-supervisor.ts          # Supervisor daemon
    └── sync-to-railway.py
```

---

## Next Action

Tell me which phase to start building. I'd recommend:

1. **Start with Phase 1 (Hermes Session + Query Engine)** — this is the core runtime
2. Then Phase 3 (11 agents) on top of it
3. Then Phase 4 (hooks) to enforce the workflow

Or if you want quick wins first: **Phase 4 hooks on existing Shark CLI** — add the brainstorm gate and TDD enforcement without rebuilding the runtime.
