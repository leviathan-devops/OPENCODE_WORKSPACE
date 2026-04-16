# HERMES AGENT PLUGIN — V2.5 BUILD CONTEXT
## Skill Stacking Architecture: Threads, Forks, and Orchestration Skills

**Build Version:** v2.5
**Started:** 2026-04-02
**Goal:** Integrate Slate's skill stacking primitives (Thread/Fork/Orchestration Skills) into the Hermes Agent Plugin
**Source:** `../v2-build/` (preserved, v2.5 is additive on top), `../v2-build/REFERENCE/ARCHITECTURE.md` (full v2 architecture)

---

## WHAT THIS IS

A **new build context** for implementing the Thread/Fork execution model and orchestration skills into the Hermes Agent Plugin. The v2 build has the agent taxonomy and 28 hooks but lacks the **blocking subagent** (Fork) primitive and **orchestration skill chaining**.

This is **not** a rewrite of v2 — it's an **extension layer** that adds:
1. Fork primitive (synchronous, blocking subagent dispatch)
2. Thread primitive (async subagent dispatch, already partially exists)
3. Orchestration skills that chain other skills with conditional activation
4. Episode output chaining between skills
5. Skill lifecycle management via hooks

**Reference documents to understand before starting:**
- `../v2-build/BUILD_CONTEXT.md` — v2 build context (foundation)
- `../v2-build/REFERENCE/ARCHITECTURE.md` — full v2 architecture (1,200+ lines)
- `../v2-build/REFERENCE/HOOK_INDEX.md` — all 28 hooks
- `../v2-build/SKILLS/PLAN.md` — existing /plan skill
- `../v2-build/SKILLS/AUTOPILOT.md` — existing /autopilot (partial orchestration)
- `../../context/telegram/library/ARTICLES_ANALYZED.md` — Slate's skill stacking article

---

## PLUGIN OVERVIEW

**Plugin Name:** `hermes-agent`
**Entry Point:** `dist/index.js`
**Framework:** @opencode-ai/plugin v1.1.53
**Runtime:** Bun, TypeScript 5.3+

### What v2.5 Adds

```
V2: 19 agents + 28 hooks + 28 tools
     └── Thread primitive (async delegate_task)
     └── Orchestration skills (partial — /autopilot)

V2.5: + Fork primitive (synchronous, blocking delegate_task)
      + Orchestration skill system (skill chaining + episode output)
      + Skill lifecycle hooks (episode entry/exit)
      + 3 execution modes: Thread / Fork / Teammate
```

---

## CORE CONCEPT: Thread vs Fork

### Thread (Async, Non-Blocking)
- Orchestrator dispatches subagent and **continues immediately**
- Subagent runs in background, isolated context
- Skill context **clears on episode exit** (doesn't pollute orchestrator)
- Used for: background tasks, parallel work, analysis, exploration

**Current implementation:** `delegate_task` tool (async, non-blocking)
**In v2.5:** Threads are the default for most subagent dispatches

### Fork (Synchronous, Blocking)
- Orchestrator **waits** for Fork to complete
- Fork takes over UI directly (continuous chat UX)
- **Cannot be continued** — returns compressed episode output to orchestrator
- Used for: interactive skills (plan, review, QA) that need continuous conversation with user

**In v2.5:** New `delegate_task(goal, { blocking: true })` option
**In v2.5:** New `ForkContext` class manages blocking UI state

### Execution Mode Routing

```typescript
type ExecutionMode = "thread" | "fork" | "teammate";

// In orchestrator prompt decisions:
// - "Run analysis in background"     → Thread (async)
// - "User needs to plan this"       → Fork (blocking, user interaction)
// - "Long-running build/test"       → Teammate (tmux pane, file mailbox)
```

---

## CORE CONCEPT: Orchestration Skills

An orchestration skill **references other skills**, not scripts. It defines conditional activation sequences where each skill's episode output feeds into the next.

### Example Orchestration Skill

```markdown
# /implement — Full feature implementation orchestration

## When User Says
"build this feature", "implement", "add functionality"

## Activation Sequence

### Step 1: FORK /plan (interactive)
- Blocks orchestrator
- User collaborates on plan
- Returns: approved plan document

### Step 2: THREAD @builder (async)
- Dispatches builder in background
- Returns: implementation complete

### Step 3: FORK /review (interactive)
- Blocks orchestrator
- User reviews output
- Returns: approved review

### Step 4: FORK /grill (interactive)
- Blocks orchestrator
- Adversarial testing session
- Returns: attack report

### Step 5: THREAD /verify (async)
- Dispatches verification
- Returns: verification report

## Output
Returns synthesized completion report to user

## Episode Chaining
Each step's output feeds into the next step's context:
- /plan output → @builder context (what to build)
- @builder output → /review context (what to review)
- /review output → /grill context (what to attack)
- /grill output → /verify context (what to verify)
```

### vs Current /autopilot

The current `/autopilot` skill does sequential looping. Orchestration skills add:
1. **Conditional branching** (if X then run Y else run Z)
2. **Episode output chaining** (each skill's output feeds into next)
3. **Fork vs Thread routing** (interactive vs async per step)
4. **User approval gates** embedded in the chain

---

## CORE CONCEPT: Episode Lifecycle

An **episode** is a skill execution boundary — skill context clears on exit, doesn't pollute the orchestrator's context.

### Episode Structure

```typescript
interface Episode {
  id: string;              // Unique per episode
  skill: string;            // Which skill ran
  mode: ExecutionMode;      // "thread" | "fork" | "teammate"
  startedAt: number;        // Timestamp
  endedAt: number | null;   // null if still running
  input: EpisodeInput;     // What was fed to the skill
  output: EpisodeOutput | null;  // What the skill returned
  contextSnapshot: string; // Compressed context at exit
}
```

### Episode Lifecycle Hooks

| Hook | When | Purpose |
|------|------|---------|
| `skill.episode.start` | Skill activation begins | Inject skill context, clear prior |
| `skill.episode.feedback` | Skill requests user input (Fork only) | Route user response to Fork |
| `skill.episode.complete` | Skill returns output | Compress output, chain to next |
| `skill.episode.timeout` | Skill exceeds time limit | Cancel, return partial output |
| `skill.episode.error` | Skill throws | Log, optionally retry or skip |

---

## ARCHITECTURE: V2.5 Layer

```
Plugin (src/index.ts)
├── Thread/Fork Router
│   └── Determines execution mode per dispatch
├── Orchestration Engine
│   ├── Skill registry (which skills exist)
│   ├── Chain executor (sequences skills)
│   └── Episode output store (chains between skills)
├── Fork Manager
│   ├── Active forks stack (only one active at a time)
│   ├── Fork context (what Fork is currently running)
│   └── Fork completion handler (routes output back)
└── Episode Tracker
    ├── Active episodes list
    ├── Episode history (last N episodes)
    └── Context snapshot manager

+ New Hooks
├── skill.router           — Route to Thread/Fork based on skill type
├── fork.manager           — Manage active fork state
├── episode.tracker        — Track episode lifecycle
├── orchestration.executor — Execute skill chains
└── output.chainer         — Chain episode outputs to next skill inputs

+ New/Modified Tools
├── delegate_task (add blocking: boolean option)
├── fork_create            — Create new Fork session
├── fork_complete          — Mark Fork done, return output
├── fork_feedback          — Send user input to Fork
├── episode_list           — List active episodes
├── episode_output         — Get output from completed episode
├── orchestration_invoke    — Invoke orchestration skill by name
└── skill_register         — Register a new orchestration skill
```

---

## FILE STRUCTURE (V2.5)

```
v2.5-build/
├── BUILD_CONTEXT.md              ← This file
├── BUILD/
│   ├── ARCHITECTURE.md            ← Full v2.5 architecture spec
│   ├── SKILL_STACKING_SPEC.md     ← Thread/Fork/Orchestration detailed spec
│   └── IMPLEMENTATION_ROADMAP.md ← Phased implementation plan
├── src/
│   ├── index.ts                  ← MODIFIED: Add Thread/Fork router, orchestration engine
│   ├── agents/
│   │   └── [... inherited from v2-build/agents ...]
│   ├── hooks/
│   │   ├── index.ts              ← MODIFIED: Add new hooks
│   │   ├── skill-router.ts       ← NEW: Route to Thread/Fork
│   │   ├── fork-manager.ts      ← NEW: Manage active fork state
│   │   ├── episode-tracker.ts    ← NEW: Track episode lifecycle
│   │   ├── orchestration-executor.ts ← NEW: Execute skill chains
│   │   └── output-chainer.ts     ← NEW: Chain episode outputs
│   ├── tools/
│   │   ├── index.ts              ← MODIFIED: Add new tools
│   │   ├── delegate_task.ts      ← MODIFIED: Add blocking option
│   │   ├── fork-tools.ts         ← NEW: fork_create, fork_complete, fork_feedback
│   │   ├── episode-tools.ts      ← NEW: episode_list, episode_output
│   │   └── orchestration-tools.ts ← NEW: orchestration_invoke, skill_register
│   ├── services/
│   │   ├── thread-manager.ts     ← NEW: Manage Thread executions
│   │   ├── fork-manager.ts       ← NEW: Manage Fork executions
│   │   ├── episode-store.ts      ← NEW: Store episode history + outputs
│   │   ├── orchestration-engine.ts ← NEW: Skill chain executor
│   │   └── [... inherited from v2-build/services ...]
│   └── skills/
│       ├── orchestrate.md        ← NEW: Orchestration skill format
│       ├── thread-skill.md       ← NEW: Thread skill template
│       ├── fork-skill.md         ← NEW: Fork skill template
│       ├── [... existing v2-build/skills ...]
│       └── IMPLEMENT.md          ← NEW: /implement orchestration skill
├── dist/
│   └── index.js                  ← Compiled output
└── REFERENCE/
    └── SKILL_STACKING_PATTERNS.md ← Copy of Slate patterns for reference
```

---

## SKILL DEFINITION FORMAT (V2.5)

```typescript
interface SkillDefinition {
  name: string;                    // e.g., "plan", "implement", "review"
  type: "action" | "interactive" | "orchestration";
  
  // Execution mode
  executionMode: "thread" | "fork" | "teammate";
  
  // For orchestration skills only
  chain?: OrchestrationStep[];
  
  // Core fields
  description: string;            // What this skill does
  triggerPatterns?: string[];      // Auto-activate on these patterns
  activationSequence?: string;    // For orchestrations: ordered step list
  episodeTimeout?: number;          // Max ms before auto-timeout
  contextScope: "isolated" | "shared"; // Does skill pollute orchestrator context?
}

// New: OrchestrationStep
interface OrchestrationStep {
  skill: string;                  // Name of skill to invoke
  mode: "thread" | "fork";         // Execution mode for this step
  input: string;                  // How to feed previous output as input
  condition?: string;             // Optional: only run if condition true
  captureOutput: boolean;          // Store this step's output for chaining
}

interface OrchestrationSkillDefinition extends SkillDefinition {
  type: "orchestration";
  chain: OrchestrationStep[];
  outputTemplate?: string;        // How to format final output
}
```

### Skill Registry

Skills are stored in `src/skills/` as `.md` files with YAML frontmatter:

```markdown
---
name: implement
type: orchestration
description: Full feature implementation from plan to verify
executionMode: orchestration
chain:
  - skill: plan
    mode: fork
    input: "{user_request}"
    captureOutput: true
  - skill: builder
    mode: thread
    input: "{plan_output}"
    captureOutput: true
  - skill: review
    mode: fork
    input: "{builder_output}"
    captureOutput: true
  - skill: grill
    mode: fork
    input: "{review_output}"
    captureOutput: true
  - skill: verify
    mode: thread
    input: "{grill_output}"
    captureOutput: true
outputTemplate: "{verify_output}"
---
# /implement — Full Feature Implementation

[Full skill instructions...]
```

---

## IMPLEMENTATION ORDER

### Phase 1: Fork Primitive (Foundation)
1. `src/services/fork-manager.ts` — Fork execution state machine
2. `src/hooks/fork-manager.ts` — Manage active fork state
3. Modify `delegate_task` tool to support `blocking: true`
4. Add `fork_create`, `fork_complete`, `fork_feedback` tools

### Phase 2: Episode Tracking
5. `src/services/episode-store.ts` — Episode history + output storage
6. `src/hooks/episode-tracker.ts` — Track episode lifecycle
7. Add `episode_list`, `episode_output` tools

### Phase 3: Orchestration Engine
8. `src/services/orchestration-engine.ts` — Skill chain executor
9. `src/hooks/orchestration-executor.ts` — Execute orchestration skills
10. Add `orchestration_invoke`, `skill_register` tools
11. Create `src/skills/IMPLEMENT.md` orchestration skill

### Phase 4: Skill Routing
12. `src/hooks/skill-router.ts` — Route skills to correct mode
13. `src/hooks/output-chainer.ts` — Chain episode outputs to next inputs
14. Modify existing skills (plan, verify, grill) to be compatible

### Phase 5: Integration + Testing
15. Update `src/index.ts` to compose all new hooks
16. Test Thread/Fork/Orchestration flow end-to-end
17. Document new skills in `src/skills/`

---

## BUILD COMMANDS

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.5-build"

# Install dependencies
bun install

# Build plugin
bun build.ts

# Typecheck
npx tsc --noEmit

# Test in OpenCode
```

### Deploy in OpenCode

Add to `~/.config/opencode/opencode.json`:
```json
"plugins": {
  "hermes-agent": {
    "type": "local",
    "path": "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.5-build/dist/index.js"
  }
}
```

---

## CRITICAL CONSTRAINTS

1. **Fork blocks orchestrator** — while a Fork is active, the orchestrator cannot dispatch other work. Only one Fork at a time.

2. **Episode context clears on exit** — skill context does NOT persist to orchestrator unless explicitly captured in episode output. This prevents context pollution.

3. **Orchestration skills are metadata** — the skill definition (YAML frontmatter) defines the chain. The actual skill instructions come from the markdown body.

4. **Output chaining is explicit** — each step must `captureOutput: true` to have its output fed to the next step. This prevents accidental context bloat.

5. **Fork timeout** — interactive skills (Fork) should have a `episodeTimeout` to prevent infinite blocking. Default: 5 minutes.

6. **Thread is default** — most subagent work should be Thread mode. Fork only for interactive skills that need user conversation.

---

## REFERENCE: Existing v2 Patterns to Preserve

- 19 agents with Full/Lite variants (keep)
- 28 hooks (add new ones, don't remove existing)
- SessionDB + snapshot/restore (keep)
- 6-phase workflow: brainstorm → plan → build → review → debug → complete (keep)
- TDD enforcement, plan validation, brainstorm gate (keep)
- Supervisor loop (keep, extend with orchestration awareness)
- Model tiering (keep)