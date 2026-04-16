# HERMES AGENT PLUGIN — Complete Engineering Specification
## Plugin for OpenCode: Modeled After Spider Agent, Built for Leviathan

**Date**: 2026-04-01
**Status**: Complete reverse-engineering of Spider Agent (68,504 lines) + OpenCode plugin SDK + BUILD_WORKFLOW_MERGE.md synthesis
**Goal**: Build a production-grade OpenCode plugin that IS Claude Code, with all Leviathan enhancements built-in

---

## Executive Summary

Spider Agent is a 68,504-line OpenCode plugin that implements a hub-and-spoke multi-agent orchestrator. This document reverse-engineers every architectural pattern and specifies a new plugin — **Hermes Agent** — that replicates Spider's mechanics while incorporating:

- The 7-phase Superpowers workflow (brainstorm gate, no-placeholder planning, TDD iron law)
- Hermes as the persistent 2nd-brain agent (not DeepSeek R1)
- The merged architecture from BUILD_WORKFLOW_MERGE.md
- Leviathan's mechanical enforcement philosophy

The key insight from reverse-engineering: **the runtime IS the architecture**. Spider Agent's power comes not from its prompts but from its 20+ hooks that mechanically enforce behavior. The plugin interface is just the container.

---

## Part 1: Spider Agent — What We Reverse-Engineered

### 1.1 The Plugin Entry Point

The Spider Agent exports a single async function matching the OpenCode `Plugin` interface:

```typescript
// From Spider Agent (68,504-line compiled bundle)
var OpenCodeSwarm = async (ctx: PluginInput): Promise<Hooks> => {
  const { config } = loadPluginConfigWithMeta(ctx.directory);
  await loadSnapshot(ctx.directory);
  initTelemetry(ctx.directory);
  
  const agents = getAgentConfigs(config);
  const agentDefinitions = createAgents(config);
  
  // 20+ hook factories — each returns a partial Hooks object
  const pipelineHook = createPipelineTrackerHook(config, ctx.directory);
  const systemEnhancerHook = createSystemEnhancerHook(config, ctx.directory);
  const compactionHook = createCompactionCustomizerHook(config, ctx.directory);
  const contextBudgetHandler = createContextBudgetHandler(config);
  const commandHandler = createSwarmCommandHandler(...);
  const activityHooks = createAgentActivityHooks(config, ctx.directory);
  const delegationGateHooks = createDelegationGateHook(config, ctx.directory);
  const delegationSanitizerHook = createDelegationSanitizerHook(ctx.directory);
  const guardrailsHooks = createGuardrailsHooks(ctx.directory, undefined, guardrailsConfig);
  const scopeGuardHook = createScopeGuardHook({...}, ctx.directory, advisoryInjector);
  const selfReviewHook = createSelfReviewHook({...}, advisoryInjector);
  const toolSummarizerHook = createToolSummarizerHook(summaryConfig, ctx.directory);
  const knowledgeCuratorHook = knowledgeConfig.enabled ? createKnowledgeCuratorHook(...) : undefined;
  const knowledgeInjectorHook = knowledgeConfig.enabled ? createKnowledgeInjectorHook(...) : undefined;
  const steeringConsumedHook = createSteeringConsumedHook(ctx.directory);
  const coChangeSuggesterHook = createCoChangeSuggesterHook(ctx.directory);
  const darkMatterDetectorHook = createDarkMatterDetectorHook(ctx.directory);
  const slopDetectorHook = config.slop_detector?.enabled !== false ? createSlopDetectorHook(...) : null;
  const incrementalVerifyHook = config.incremental_verify?.enabled !== false ? createIncrementalVerifyHook(...) : null;
  const compactionServiceHook = config.compaction_service?.enabled !== false ? createCompactionService(...) : null;
  const snapshotWriterHook = createSnapshotWriterHook(ctx.directory);
  
  // Automation framework (PlanSyncWorker, PreflightTriggerManager)
  let automationManager;
  if (automationConfig.mode !== "manual") {
    automationManager = createAutomationManager(automationConfig);
    automationManager.start();
  }
  
  return {
    name: "spider-agent",
    agent: agents,           // SDK agent configs for OpenCode dropdown
    tool: { ...tools },      // 35+ custom tools
    config: async (cfg) => { /* merges agents + commands into OpenCode */ },
    
    // Hooks — the real enforcement machinery
    "experimental.chat.messages.transform": composeHandlers([
      pipelineHook["experimental.chat.messages.transform"],
      contextBudgetHandler,
      guardrailsHooks.messagesTransform,
      delegationGateHooks.messagesTransform,
      delegationSanitizerHook,
      knowledgeInjectorHook,
      // ... more
    ]),
    
    "experimental.chat.system.transform": composeHandlers([
      systemEnhancerHook["experimental.chat.system.transform"],
      // heartbeat, phase monitor
    ]),
    
    "experimental.session.compacting": compactionHook["experimental.session.compacting"],
    "command.execute.before": safeHook(commandHandler),
    
    "tool.execute.before": async (input, output) => {
      await guardrailsHooks.toolBefore(input, output);
      await scopeGuardHook.toolBefore(input, output);
      await delegationGateHooks.toolBefore(input, output);
      await activityHooks.toolBefore(input, output);
    },
    
    "tool.execute.after": async (input, output) => {
      await activityHooks.toolAfter(input, output);
      await guardrailsHooks.toolAfter(input, output);
      await delegationLedgerHook.toolAfter(input, output);
      await selfReviewHook.toolAfter(input, output);
      await delegationGateHooks.toolAfter(input, output);
      // adversarial detection, debugging spiral, knowledge curator...
      await snapshotWriterHook(input, output);
      await toolSummarizerHook?.(input, output);
    },
    
    "chat.message": safeHook(async (input, output) => {
      await delegationHandler(input, output);
    }),
    
    automation: automationManager
  };
};
```

### 1.2 The Agent Registry

Spider Agent creates 11 agents with mode flags:

```typescript
// Agent mode flags
type AgentMode = "primary" | "subagent" | "all";

// SDK agent config shape
interface SDKAgentConfig {
  name: string;
  description?: string;
  model?: string;        // Only for subagents; primary uses current session model
  mode: AgentMode;
  permission?: {
    task: "allow" | "deny";
    file?: Record<string, "allow" | "deny">;
  };
  tools?: Record<string, boolean>;  // Tool allowlist per agent
}
```

The tool filter (which tools each agent can use) is enforced via `AGENT_TOOL_MAP`:

```typescript
const AGENT_TOOL_MAP = {
  spider: [
    "checkpoint", "check_gate_status", "completion_verify", "complexity_hotspots",
    "detect_domains", "evidence_check", "extract_code_blocks", "gitingest",
    "imports", "knowledge_query", "lint", "diff", "pkg_audit", "pre_check_batch",
    "quality_budget", "retrieve_summary", "save_plan", "schema_drift", "secretscan",
    "symbols", "test_runner", "todo_extract", "update_task_status", "write_retro",
    "write_drift_evidence", "declare_scope", "sast_scan", "sbom_generate",
    "build_check", "syntax_check", "placeholder_scan", "phase_complete",
    "doc_scan", "doc_extract", "curator_analyze",
    "knowledgeAdd", "knowledgeRecall", "knowledgeRemove", "co_change_analyzer"
  ],
  explorer: ["complexity_hotspots", "detect_domains", "extract_code_blocks", "gitingest", "imports", ...],
  coder: ["write", "edit", "patch", "apply_patch", "create_file", "insert", "replace"],
  reviewer: ["evidence_check", "retrieve_summary", "knowledge_query", ...],
  test_engineer: ["test_runner", "retrieve_summary", "evidence_check", ...],
  // ...
};
```

### 1.3 The Enforcement Hooks — Deep Dive

#### Delegation Gate Hook (`createDelegationGateHook`)

This is the most critical enforcement mechanism. It intercepts Task tool calls:

**toolBefore**: Blocks coder re-delegation if task is in `coder_delegated` state without reviewer gate:
```typescript
if (targetAgent === "coder") {
  for (const [taskId, state] of session.taskWorkflowStates) {
    if (state === "coder_delegated") {
      throw new Error(
        `REVIEWER_GATE_VIOLATION: Cannot re-delegate to coder without reviewer delegation.`
      );
    }
  }
}
```

**messagesTransform**: Injects warnings into the agent's context:
- Batching detection ("and" in task, multiple FILE directives)
- QA skip detection (coder without reviewer/test_engineer after)
- Gate violation detection
- Task scope declaration tracking

**toolAfter**: Advances task state machine:
- `coder_delegated` → after coder Task → records evidence
- `reviewer_run` → after reviewer Task → advances to `tests_run`
- `tests_run` → after test_engineer Task → marks complete

#### Guardrails Hook (`createGuardrailsHooks`)

Per-agent resource limits enforced via circuit breakers:
- `max_tool_calls`, `max_duration_minutes`, `max_consecutive_errors`, `idle_timeout_minutes`
- Tracks per-agent invocations via `beginInvocation` / `completeInvocation`
- Fires warnings/advisory messages when thresholds approached

#### Slop Detector Hook (`createSlopDetectorHook`)

Pattern-matches agent output for quality degradation signals:
- Class threshold: repetitive structural patterns
- Comment strip threshold: excessive commenting
- Diff line threshold: suspiciously large diffs
- Import hygiene: missing/broken imports

#### Debugging Spiral Detection

Tracks last N tool calls with identical arguments. If same tool called 5+ times with same args in 5-minute window → debugging spiral detected:
1. Logs event to `events.jsonl`
2. Creates auto-checkpoint
3. Injects advisory message: "Consider escalating or different approach"

#### Adversarial Pattern Detection

Pattern-matches output for:
- `PRECEDENT_MANIPULATION`: "we skipped in phase X"
- `SELF_REVIEW`: "I verified it myself"
- `CONTENT_EXEMPTION`: "documentation doesn't need review"
- `GATE_DELEGATION_BYPASS`: "I'll just make this small fix directly"
- `GATE_MISCLASSIFICATION`: "tier 0 security"
- `VELOCITY_RATIONALIZATION`: "to save time"
- `INTER_AGENT_MANIPULATION`: "5th attempt", "user is waiting", "or I stop"

### 1.4 The State Machine

Each session maintains a `taskWorkflowStates` map:

```
idle → coder_delegated → pre_check_passed → reviewer_run → tests_run → complete
         (after coder)      (after precheck)   (after reviewer)  (after test_eng)
```

State transitions happen only in `toolAfter` when Task tool completes.

### 1.5 The Config System

Plugin config lives in `~/.config/opencode/spider-agent.json` (user-level) and `{project}/.opencode/spider-agent.json` (project-level), merged with project overriding user.

The full schema (from reverse-engineering):
```typescript
PluginConfigSchema = {
  agents: Record<string, { model?, temperature?, disabled?, fallback_models? }>,
  swarms: Record<string, { name?, agents: Record<string, AgentOverride> }>,
  max_iterations: number,          // default: 5
  pipeline: { parallel_precheck: boolean },
  phase_complete: { enabled, required_agents, require_docs, policy },
  qa_retry_limit: number,         // default: 3
  execution_mode: "strict" | "balanced" | "fast",
  inject_phase_reminders: boolean,
  hooks: {
    system_enhancer, compaction, agent_activity,
    delegation_tracker, delegation_gate, delegation_max_chars
  },
  gates: { syntax_check, placeholder_scan, sast_scan, sbom_generate, build_check, quality_budget },
  context_budget: { enabled, warn_threshold, critical_threshold, model_limits, ... },
  guardrails: { enabled, max_tool_calls, max_duration_minutes, profiles, ... },
  watchdog: { scope_guard, delegation_ledger },
  self_review: { enabled, skip_in_turbo },
  tool_filter: { enabled, overrides },
  automation: { mode: "manual"|"hybrid"|"auto", capabilities: { plan_sync, phase_preflight, ... } },
  knowledge: { enabled, swarm_max_entries, hive_enabled, auto_promote_days, ... },
  compaction_service: { enabled, observationThreshold, reflectionThreshold, emergencyThreshold },
  slop_detector: { enabled, classThreshold, commentStripThreshold, diffLineThreshold },
  incremental_verify: { enabled, command, timeoutMs, triggerAgents },
  tool_output: { truncation_enabled, max_lines, per_tool, truncation_tools },
  turbo_mode: boolean,
}
```

### 1.6 Custom Tools (35+)

All tools created with `createSwarmTool()` which wraps `tool()` from `@opencode-ai/plugin`:

```typescript
function createSwarmTool(opts) {
  return tool({
    description: opts.description,
    args: opts.args,   // Zod schema
    execute: async (args, directory, ctx) => {
      // Tools can access ctx.directory, ctx.sessionID, ctx.agent, ctx.abort
      return await opts.execute(args, directory, ctx);
    }
  });
}
```

Key tools:
- `phase_complete` — marks phase done, verifies all required agents ran
- `save_plan` — writes `plan.json` (auto-regenerates `plan.md` via PlanSyncWorker)
- `update_task_status` — marks tasks complete
- `checkpoint` — git stash + savepoint
- `evidence_check` — verifies task evidence completeness
- `write_retro` — documents phase retrospective
- `write_drift_evidence` — persists drift verification result
- `knowledgeAdd`, `knowledgeRecall`, `knowledgeRemove` — persistent knowledge store
- `co_change_analyzer` — detects coupled file changes

### 1.7 The System Prompt Template

Spider Agent's orchestrator prompt (1,000+ lines) follows this structure:

```
## IDENTITY
- Swarm ID, Agent prefix, available agents list

## PROJECT CONTEXT
- Language, framework, build/test/lint commands, entry points
- If unresolved → DISCOVER mode

## CONTEXT TRIAGE
- Priority order for preservation under context pressure

## ROLE
- "You THINK. Subagents DO."
- Never pass raw files, summarize only relevant parts

## RULES (14 total)
1. Delegate all coding to coder (Rule 1)
2. One agent per message (Rule 2)
3. One task per coder call — batching detection (Rule 3)
4. Architect coding boundaries — only self-code after QA_RETRY_LIMIT failures (Rule 4)
5. Never store swarm identity in memory blocks (Rule 5)
6. Critic gate before any implementation (Rule 6)
   - 6a: Sounding board protocol
   - 6b: Escalation discipline (3 tiers)
   - 6c: Retry circuit breaker
   - 6d: Spec-writing discipline
   - 6e: SME confidence routing
   - 6f: Documentation awareness
7. Tiered QA gate after every coder task (Rule 7)
   - TIER 0: Metadata (lint + diff only)
   - TIER 1: Docs (reviewer gen only)
   - TIER 2: Standard (full Stage A + Stage B)
   - TIER 3: Critical (Stage A + Stage B x2)
8. Coverage check (Rule 8)
9. UI/UX design gate (Rule 9)
10. Retrospective tracking (Rule 10)
11. Checkpoints (Rule 11)

## AGENTS
- @explorer, @sme, @coder, @reviewer, @test_engineer, @critic, @critic_sounding_board, @docs, @designer

## DELEGATION FORMAT
- Strict TASK/FILE/INPUT/OUTPUT/CONSTRAINT format
- No preamble, begin directly with agent name

## WORKFLOW MODES
- EXPLICIT COMMAND OVERRIDE → SPECIFY / CLARIFY-SPEC
- RESUME → continue at current task
- SPECIFY → create spec.md
- CLARIFY-SPEC → resolve [NEEDS CLARIFICATION] markers
- CLARIFY → ask up to 3 questions
- DISCOVER → explorer + complexity_hotspots
- CONSULT → SME domain research
- PRE-PHASE BRIEFING → read previous retrospective
- CODEBASE REALITY CHECK → verify file existence before spec/plan
```

---

## Part 2: Hermes Agent — Plugin Specification

### 2.1 Plugin Identity

```typescript
const HERMES_PLUGIN_NAME = "hermes-agent";

var HermesAgent = async (ctx: PluginInput): Promise<Hooks> => {
  // Identical structure to Spider Agent
  // Replaces "spider" references with "hermes"
  // Replaces "swarm" concepts with "hermes-workspace"
};
```

### 2.2 Hermes-Specific Adaptations

#### Swarm ID → Hermes ID
- Spider uses `swarmId` for multi-swarm isolation
- Hermes uses `hermesId` = "hermes-2nd-brain" (single swarm, identity is persistent)

#### Agent Prefix
- Spider: configurable (`${swarmId}_`), default "" for single swarm
- Hermes: fixed prefix "" (hermes-2nd-brain IS the identity)

#### Storage Paths
- Spider: `.swarm/` directory
- Hermes: `~/hermes-workspace/.swarm/` (Leviathan's 2nd brain)

#### Knowledge System
- Spider: per-project knowledge with hive (cross-project) sharing
- Hermes: global 2nd-brain knowledge (Leviathan's entire context)

### 2.3 The 11 Hermes Agents

| # | Agent | Mode | Role in Hermes |
|---|-------|------|---------------|
| 1 | `hermes` | primary | Orchestrator — persistent 2nd-brain coordinator |
| 2 | `explorer` | subagent | Codebase context gathering |
| 3 | `coder` | subagent | Implementation (one task at a time) |
| 4 | `reviewer` | subagent | Correctness + security review |
| 5 | `test-engineer` | subagent | TDD enforcement (write failing test first) |
| 6 | `sme` | subagent | Domain expertise |
| 7 | `critic` | subagent | Plan critique before implementation |
| 8 | `critic-sounding-board` | subagent | Pre-escalation pushback |
| 9 | `drift-verifier` | subagent | Phase completion verification |
| 10 | `docs` | subagent | Documentation updates |
| 11 | `quality-reviewer` | subagent | Code quality (readability, patterns) |

### 2.4 Hermes-Specific Hooks

All Spider Agent hooks are inherited. New Hermes-specific hooks:

#### `brainstorm-gate-hook`
Injects `<HARD-GATE>` enforcement — Phase 0 must complete before any Phase 1 action.

#### `plan-validator-hook`
Checks every plan step for:
- No `TBD`, `TODO`, `placeholder` in implementation steps
- Exact file paths for every created/modified file
- Actual code blocks (not "implement X")
- Exact commands with expected output

#### `tdd-enforcer-hook`
Monitors `coder` agent tool calls:
- Verifies a `test` file was written BEFORE the corresponding `src` file change
- If src changed without preceding test → inject error message
- Records test→implementation pairing in evidence

#### `supervisor-loop-hook`
Runs Graeme's self-improvement pattern:
- Monitors `agent_swarm_*` tool calls for failures
- Detects patterns in repeated failures
- Auto-generates fix suggestions for LOW-risk issues
- Escalates HIGH-risk issues as advisory messages

#### `2nd-brain-sync-hook`
Syncs context between OpenCode session and Hermes workspace:
- After each phase complete → write summary to `~/hermes-workspace/.state/`
- On session resume → load prior context from workspace
- On new session → check workspace for relevant prior context

### 2.5 Hermes Agent Tools

All Spider Agent tools are inherited. New Hermes-specific tools:

```typescript
const HERMES_TOOLS = {
  // From Spider Agent (inherited)
  checkpoint, check_gate_status, completion_verify, complexity_hotspots,
  detect_domains, evidence_check, extract_code_blocks, gitingest,
  imports, knowledge_query, lint, diff, pkg_audit, pre_check_batch,
  quality_budget, retrieve_summary, save_plan, schema_drift, secretscan,
  symbols, test_runner, todo_extract, update_task_status, write_retro,
  write_drift_evidence, declare_scope, sast_scan, sbom_generate,
  build_check, syntax_check, placeholder_scan, phase_complete,
  doc_scan, doc_extract, curator_analyze,
  knowledgeAdd, knowledgeRecall, knowledgeRemove, co_change_analyzer,
  
  // NEW Hermes tools
  hermes_recall:     // Recall from 2nd-brain knowledge store
  hermes_remember:   // Store to 2nd-brain knowledge store
  hermes_forget:     // Remove from 2nd-brain knowledge store
  hermes_context:    // Inject relevant 2nd-brain context into current session
  hermes_plan:       // Generate plan from spec (Hermes-specific formatting)
  hermes_review_plan: // Superpowers-style no-placeholder plan review
  hermes_tdd_check:  // Verify TDD cycle completed
  hermes_approve:    // User approval gate (blocks until explicit approve)
};
```

### 2.6 Hermes Agent Config Schema

```typescript
HermesAgentConfigSchema = {
  // Inherited from Spider Agent
  agents: Record<string, AgentOverride>,
  max_iterations: number,
  qa_retry_limit: number,
  execution_mode: "strict" | "balanced" | "fast",
  hooks: HooksConfig,
  gates: GateConfig,
  context_budget: ContextBudgetConfig,
  guardrails: GuardrailsConfig,
  automation: AutomationConfig,
  knowledge: KnowledgeConfig,
  compaction_service: CompactionConfig,
  slop_detector: SlopDetectorConfig,
  
  // NEW Hermes-specific config
  hermes: {
    workspace: string,           // ~/hermes-workspace
    2nd_brain_enabled: boolean,  // default: true
    supervisor_enabled: boolean, // default: true
    brainstorm_gate: {
      enabled: boolean,          // default: true
      require_explicit_approve: boolean, // default: true
    },
    plan_validation: {
      enabled: boolean,          // default: true
      deny_patterns: string[],   // TBD, TODO, placeholder, stub, wip
    },
    tdd_enforcement: {
      enabled: boolean,          // default: true
      require_test_first: boolean, // default: true
    },
    model_tiering: {
      cheap: string,             // Model for mechanical tasks
      standard: string,          // Model for integration tasks
      capable: string,            // Model for architecture/review
    },
    superpowers: {
      enabled: boolean,           // default: true
      skill_path: string,         // ~/hermes-workspace/skills/
    }
  }
};
```

---

## Part 3: Implementation — File Structure

```
~/hermes-agent/
├── package.json              # name: "hermes-agent", type: "module"
├── tsconfig.json
├── build.ts                  # bun build src/index.ts → dist/index.js
├── src/
│   ├── index.ts              # Plugin entry point — OpenCodeSwarm analog
│   ├── config/
│   │   ├── schema.ts         # HermesAgentConfigSchema (Zod)
│   │   ├── loader.ts          # loadPluginConfig, loadPluginConfigWithMeta
│   │   └── constants.ts       # AGENT_NAMES, QA_AGENTS, TOOL_NAMES, etc.
│   ├── agents/
│   │   ├── index.ts          # createAgents() — creates all 11 agents
│   │   ├── hermes.ts          # Architect/prompt — THE orchestrator
│   │   ├── explorer.ts
│   │   ├── coder.ts
│   │   ├── reviewer.ts
│   │   ├── test-engineer.ts
│   │   ├── sme.ts
│   │   ├── critic.ts
│   │   ├── critic-sounding-board.ts
│   │   ├── drift-verifier.ts
│   │   ├── docs.ts
│   │   └── quality-reviewer.ts
│   ├── tools/
│   │   ├── index.ts          # All tool exports
│   │   ├── create-tool.ts    # createHermesTool() wrapper
│   │   ├── checkpoint.ts
│   │   ├── phase-complete.ts
│   │   ├── save-plan.ts
│   │   ├── update-task-status.ts
│   │   ├── evidence-check.ts
│   │   ├── write-retro.ts
│   │   ├── write-drift-evidence.ts
│   │   ├── knowledge-add.ts
│   │   ├── knowledge-recall.ts
│   │   ├── knowledge-remove.ts
│   │   ├── hermes-recall.ts    # NEW: 2nd-brain recall
│   │   ├── hermes-remember.ts  # NEW: 2nd-brain store
│   │   ├── hermes-forget.ts    # NEW: 2nd-brain remove
│   │   ├── hermes-context.ts   # NEW: inject 2nd-brain context
│   │   ├── hermes-plan.ts      # NEW: Hermes-format plan
│   │   ├── hermes-review-plan.ts # NEW: no-placeholder review
│   │   ├── hermes-tdd-check.ts  # NEW: TDD verification
│   │   └── hermes-approve.ts    # NEW: user approval gate
│   ├── hooks/
│   │   ├── index.ts           # All hook exports
│   │   ├── brainstorm-gate.ts  # NEW: HARD-GATE enforcement
│   │   ├── plan-validator.ts   # NEW: no-placeholder checker
│   │   ├── tdd-enforcer.ts     # NEW: test-first enforcement
│   │   ├── supervisor-loop.ts  # NEW: self-improvement
│   │   ├── 2nd-brain-sync.ts   # NEW: workspace sync
│   │   ├── pipeline-tracker.ts # Inherited from Spider
│   │   ├── system-enhancer.ts  # Inherited from Spider
│   │   ├── compaction-customizer.ts # Inherited
│   │   ├── context-budget.ts   # Inherited
│   │   ├── delegation-gate.ts  # Inherited (critical)
│   │   ├── delegation-sanitizer.ts # Inherited
│   │   ├── delegation-tracker.ts   # Inherited
│   │   ├── guardrails.ts       # Inherited
│   │   ├── scope-guard.ts      # Inherited
│   │   ├── self-review.ts      # Inherited
│   │   ├── tool-summarizer.ts  # Inherited
│   │   ├── knowledge-curator.ts # Inherited
│   │   ├── knowledge-injector.ts # Inherited
│   │   ├── steering-consumed.ts # Inherited
│   │   ├── co-change-suggester.ts # Inherited
│   │   ├── dark-matter-detector.ts # Inherited
│   │   ├── slop-detector.ts    # Inherited
│   │   ├── incremental-verify.ts # Inherited
│   │   ├── compaction-service.ts # Inherited
│   │   ├── snapshot-writer.ts  # Inherited
│   │   ├── agent-activity.ts   # Inherited
│   │   └── adversarial-detector.ts # Inherited
│   ├── services/
│   │   ├── plan-schema.ts      # Plan/task/phase schemas
│   │   ├── evidence-schema.ts   # Evidence bundle schemas
│   │   ├── knowledge-store.ts   # Hermes 2nd-brain store
│   │   ├── supervisor.ts        # Graeme's self-improvement loop
│   │   ├── plan-sync-worker.ts  # Plan.json ↔ plan.md sync
│   │   ├── automation-manager.ts # Background automation
│   │   └── telemetry.ts         # Event logging
│   ├── state/
│   │   ├── session-state.ts    # Session state + snapshot
│   │   ├── swarm-state.ts      # Agent sessions, delegation chains
│   │   └── task-workflow.ts    # State machine (idle→complete)
│   └── prompts/
│       ├── hermes.md           # Main orchestrator prompt
│       ├── hermes-append.md     # User-level additions
│       ├── explorer.md
│       ├── coder.md
│       ├── reviewer.md
│       ├── test-engineer.md
│       ├── sme.md
│       ├── critic.md
│       ├── critic-sounding-board.md
│       ├── drift-verifier.md
│       ├── docs.md
│       └── quality-reviewer.md
├── dist/
│   ├── index.js               # Compiled plugin
│   └── cli/
│       └── index.js           # CLI entry (for /hermes commands)
└── README.md
```

---

## Part 4: The Hermes Orchestrator Prompt — Key Differences from Spider

The Hermes orchestrator prompt (`hermes.md`) modifies Spider's `ARCHITECT_PROMPT` in these critical ways:

### 4.1 Identity Section
```
## IDENTITY

You are Hermes — Leviathan's persistent 2nd-brain agent.

You have PERMANENT MEMORY across all sessions. Your context library lives in
~/hermes-workspace/. You are not a stateless worker — you remember.

Hermes ID: hermes-2nd-brain
Your agents: @explorer, @sme, @coder, @reviewer, @test-engineer, @critic,
@critic-sounding-board, @drift-verifier, @docs, @quality-reviewer
```

### 4.2 2nd-Brain Rule (NEW Rule 0)
```
## RULE 0 — 2ND BRAIN (Hermes-specific)

Before ANY implementation work:
1. Query your knowledge store: hermes_recall with relevant context
2. Check ~/hermes-workspace/context/ for prior relevant work
3. Inject relevant context into session via hermes_context tool

Your memory is a feature, not overhead. Always recall before starting.
```

### 4.3 Superpowers Integration (replaces Spider's rules 1-11)
```
## PHASE 0 — BRAINSTORM GATE (Superpowers HARD-GATE)

<HARD-GATE> — No implementation until design is approved.

1. Clarify: Ask up to 3 questions (one at a time)
2. Propose: 2-3 approaches with trade-offs + recommendation
3. Design: Scaled to complexity — 1 pager for simple, full spec for complex
4. Write to: docs/hermes/plans/YYYY-MM-DD-<topic>-design.md
5. Self-review: placeholders? contradictions? scope creep?
6. USER APPROVAL GATE: Wait for explicit approval
7. Invoke: writing-plans skill → produces implementation plan

## PHASE 1 — PLAN (Superpowers no-placeholder planning)

Every step MUST have:
- Exact file paths (created AND modified)
- Actual code blocks (not "implement X")
- Exact test commands with expected output
- NO: TBD, TODO, "fill in later", "add validation"

Self-review checklist before handoff:
[ ] Every file path exists or will be created
[ ] Every code block shows actual code
[ ] Every command is runnable with expected output
[ ] No TBD/TODO/placeholder in any step

## PHASE 2 — BUILD (Spider + Superpowers)

FOR EACH TASK in plan (sequential — no parallel impl):
a. Dispatch @coder subagent (fresh context, no history)
b. Coder follows TDD: write failing test FIRST (tdd_enforcer hook monitors)
c. Watch test fail (RED)
d. Write minimal code to pass (GREEN)
e. Refactor (REFACTOR)
f. Self-review + commit

Model tiering:
- Mechanical (rename, format, lint fix) → cheap model
- Implementation (feature code) → standard model
- Architecture/review/critique → capable model

## PHASE 3 — TWO-STAGE REVIEW

STAGE 1 — Spec Compliance (@quality-reviewer)
  Does the code do exactly what the plan says?
  No under-building? No over-building?

STAGE 2 — Code Quality (@reviewer)
  Readability, security, performance, patterns

## PHASE 4 — SYSTEMATIC DEBUGGING (Superpowers 3-strike rule)

IF bug found:
  1. Reproduce — exact steps to see failure
  2. Isolate — smallest possible reproduction
  3. Hypothesis — one cause
  4. Fix — smallest change that fixes
  5. Verify — test passes

3-STRIKE RULE:
  After 3 failed fix attempts on same bug →
  MANDATORY architecture review (@critic)
  User must approve before continuing

## PHASE 5 — BRANCH COMPLETION

- Verify all tests pass
- Run full test suite
- Update relevant docs
- Commit with conventional commit message
- Create PR / merge request

## PHASE 6 — SUPERVISOR LOOP

Graeme's self-improvement pattern:
- Runs continuously in background
- Monitor agent-swarm logs for failures
- Classify risk: LOW (auto-fix) or HIGH (escalate)
- LOW risk: apply fix automatically, log change
- HIGH risk: notify Leviathan for approval
- Inject learnings via agent_swarm_inject_learning
```

### 4.4 No-Placeholder Planning Constraint
```
PLAN VALIDATOR HOOK will reject any plan step containing:
- TBD, TODO, FIXME, XXX, placeholder, stub, wip
- "implement X" without actual code
- "add validation" without specifying what validation
- "handle edge cases" without listing specific cases

Every step must be immediately executable by a developer
who has never seen this project.
```

---

## Part 5: Implementation Order

### Week 1 — Foundation
1. **Plugin scaffold** — package.json, tsconfig, build script
2. **Config system** — schema.ts, loader.ts, constants.ts
3. **State management** — session-state.ts, swarm-state.ts, task-workflow.ts
4. **Tool framework** — create-tool.ts, all inherited tools from Spider
5. **Agent definitions** — createAgents() + all 11 agent prompts
6. **Hook framework** — composeHandlers, safeHook utilities
7. **Pipeline tracker** — inherited from Spider (works out of box)
8. **Delegation gate** — inherited from Spider (adapts to Hermes names)

### Week 2 — Core Hooks
9. **Brainstorm gate hook** — HARD-GATE enforcement
10. **Plan validator hook** — no-placeholder checking
11. **TDD enforcer hook** — test-first enforcement
12. **Context budget hook** — inherited from Spider (token management)
13. **Guardrails hooks** — inherited from Spider (resource limits)
14. **Slop detector hook** — inherited from Spider (quality signals)

### Week 3 — Intelligence Hooks
15. **Supervisor loop hook** — self-improvement pattern
16. **2nd-brain sync hook** — workspace integration
17. **Knowledge curator** — inherited from Spider (adapt to Hermes workspace)
18. **Knowledge injector** — inherited from Spider
19. **Adversarial detector** — inherited from Spider
20. **Debugging spiral detector** — inherited from Spider

### Week 4 — Integration & Polish
21. **Custom Hermes tools** — hermes_recall, hermes_remember, hermes_context, etc.
22. **Plan sync worker** — inherited from Spider
23. **Snapshot writer** — inherited from Spider
24. **CLI commands** — /hermes status, /hermes plan, /hermes agents, etc.
25. **Config** — opencode.json integration
26. **Testing** — run against real projects

---

## Part 6: OpenCode Config for Hermes Agent

```json
{
  "agent": {
    "hermes": {
      "model": "0-opencode-zen/qwen3.6-plus-free",
      "description": "Hermes — Leviathan's 2nd-brain orchestrator with Superpowers workflow"
    }
  },
  "plugin": ["hermes-agent"],
  "mcp": {
    "agent_swarm": {
      "type": "remote",
      "url": "http://localhost:3013",
      "headers": {
        "Authorization": "Bearer {env:AGENT_SWARM_API_KEY}"
      },
      "enabled": true
    }
  },
  "tools": {
    "hermes_recall": true,
    "hermes_remember": true,
    "hermes_context": true,
    "hermes_plan": true,
    "hermes_review_plan": true,
    "hermes_tdd_check": true,
    "hermes_approve": true,
    "agent_swarm_memory*": true,
    "agent_swarm_send*": true,
    "agent_swarm_get*": true,
    "agent_swarm_poll*": true,
    "agent_swarm_join*": true,
    "agent_swarm_store*": true,
    "agent_swarm_my*": true,
    "agent_swarm_cancel*": true,
    "agent_swarm_task*": true,
    "agent_swarm_update*": true,
    "agent_swarm_context*": true,
    "agent_swarm_inject*": true,
    "agent_swarm_list*": true,
    "agent_swarm_create*": true,
    "agent_swarm_post*": true,
    "agent_swarm_read*": true,
    "agent_swarm_trigger*": true,
    "agent_swarm_register*": true,
    "agent_swarm_unregister*": true,
    "agent_swarm_request*": true,
    "agent_swarm_retry*": true
  }
}
```

---

## Part 7: Critical Differences from Spider Agent

| Aspect | Spider Agent | Hermes Agent |
|--------|-------------|--------------|
| Identity | Multi-swarm, configurable prefix | Single identity, persistent memory |
| Storage | `.swarm/` per project | `~/hermes-workspace/` global |
| Orchestrator prompt | Spider-specific rules (14 rules) | Superpowers 7-phase + Rule 0 (2nd-brain) |
| Knowledge | Per-project + hive cross-project | Global 2nd-brain across all projects |
| Plan format | Spider format (plan.json ↔ plan.md) | Superpowers format (exact paths, actual code) |
| Gate style | QA gate (reviewer + test_engineer) | HARD-GATE (explicit user approval) |
| TDD | Implied in test_engineer role | Explicit TDD iron law + mechanical enforcement |
| Debugging | Ad-hoc | 3-strike rule → mandatory architecture review |
| Model tiering | Single model per agent | Tiered: cheap/standard/capable per task type |
| Supervisor | Spider's automation (PlanSyncWorker) | Graeme's self-improvement loop |
| Agent variants | None | Full + Lite (60-80% cheaper for scaffolding) |
| Context freshness | Session-based compaction | Aura Frog-style: verify cached context before use |
| Memory discipline | Spider snapshot on events | Strict Write Discipline: update only after confirmed success |
| Cascading changes | Implied in drift-verifier | Specialist's Ripple agent: explicit dependency analysis |
| Adversarial testing | Spider slop-detector | Specialist's /grill: attack vectors against own code |

---

## Part 8: New Patterns Discovered from X Threads

### 8.1 Specialist Agent — 36 Agents (Source: GitHub, specialistagent.com.br)

**Architecture**: Full vs Lite variants for every agent. Full for complex work, Lite for scaffolding at 60-80% lower cost. This is model tiering at the AGENT level, not just the runtime level.

**Agent Taxonomy by Category**:

| Category | Agents | Notes |
|----------|--------|-------|
| **Core** | @starter, @builder, @reviewer, @doctor, @migrator | Foundation — build, review, debug, migrate |
| **Workflow** | @planner, @executor, @tdd, @debugger, @pair, @analyst, @orchestrator, @scout, @memory | Plan, execute, coordinate, remember |
| **Engineering** | @api, @perf, @i18n, @docs, @refactor, @deps, @explorer, @finance, @cloud, @security, @designer, @data, @devops, @tester, @legal, @architect, @ripple | Domain specialists — 17 agents |
| **Business** | @marketing, @product, @support | Product, growth, support |
| **Automation** | @sentry-triage, @autopilot | Autonomous triage and resolution |

**Verification Protocol**: Every agent must show actual command output before claiming completion. No "should work."

**Anti-Rationalization**: Built-in tables prevent agents from cutting corners or skipping steps.

**Context Isolation**: Each subtask gets fresh context. No accumulated pollution across long sessions.

**@analyst (NEW — not in Spider or our current spec)**: Converts requirements to technical specs. Critical for the brainstorm gate — this is the agent that generates the design document before implementation.

**@ripple (NEW — not in Spider or our current spec)**: Analyzes cascading effects — "What breaks if I change the User model?" Maps ripple effects across the codebase before changes are made.

**Key Skill Patterns**:
- `/brainstorm` — Socratic brainstorming before planning
- `/tdd` — RED-GREEN-REFACTOR cycle
- `/debug` — 4-phase systematic debugging (distinct from Spider's debugging spiral detection)
- `/grill` — Adversarial code challenge with attack vectors
- `/verify` — Proof-based verification before completion
- `/health` — Project health score (0-100)
- `/autopilot` — Autonomous iterative development (PRD + progress + fresh context)
- `/remember` / `/recall` — Cross-session decision persistence

### 8.2 Aura Frog — 10 Agents, 5-Phase TDD (Source: GitHub, aura-frog)

**LLM OS Architecture**:
```
Claude = Kernel          Context Window = RAM           Project Files = Disk
Agents = Processes       5-Phase TDD = Scheduler        MCP = Device Drivers
TOON = Compression       Approval Gates = Interrupts    Handoffs = IPC
```

**5-Phase TDD Workflow** (maps to Superpowers, more explicit):
```
✋ Phase 1: Understand + Design    → You approve the plan
⚡ Phase 2: Test RED               → Failing tests written
✋ Phase 3: Build GREEN            → You approve the implementation
⚡ Phase 4: Refactor + Review      → Auto quality + security check
⚡ Phase 5: Finalize               → Docs + notifications
```

**Memory That Heals Itself**: All cached context is treated as a hint — agents verify against actual files before acting. State only updates after confirmed success (Strict Write Discipline). No stale assumptions propagate.

**3-Tier Context Compression**:
- **MicroCompact**: Free, every 10 turns — drops verbatim tool outputs
- **AutoCompact**: One /compact call at 80% budget — summarizes decisions
- **ManualCompact**: Full session snapshot — for handoffs

**Self-Improving Learning**: Detects patterns, remembers corrections, creates rules that persist across sessions. Optional Supabase sync for teams.

**Smart Complexity Routing**: Automatically matches effort to task size — typos get direct edits, features get full workflows, architecture gets collaborative planning. No configuration.

**26 Lifecycle Hooks** (conditional execution — ~40% fewer hook executions):
- PreToolUse, UserPromptSubmit, SessionStart, PostToolUse, Stop
- Each hook runs only when relevant (e.g., security guard only on Bash)

**10 Aura Frog Agents** (simpler than Spider, more specialized per-domain):
| Agent | Role |
|-------|------|
| `lead` | Coordinates workflows, team orchestration |
| `architect` | System design, databases, backend |
| `frontend` | React, Vue, Angular, Next.js + design systems |
| `mobile` | React Native, Flutter, Expo, NativeWind |
| `strategist` | ROI evaluation, MVP scoping, scope creep detection |
| `security` | OWASP audits, vulnerability scanning, SAST |
| `tester` | Jest, Cypress, Playwright, coverage |
| `devops` | Docker, K8s, CI/CD, monitoring |
| `scanner` | Project detection, config, context |
| `router` | Agent + model selection |

**Framework Packs** (7 packs): Next.js, React, Vue 3, SvelteKit, Angular, Astro, Nuxt. Each pack follows the idioms of its ecosystem: server components for Next.js, composables for Vue, stores for SvelteKit, signals for Angular, islands for Astro, auto-imports for Nuxt.

### 8.3 Graeme's Self-Improving Framework (gkisokay) — FULLY RECOVERED

**3-Agent Monitoring Loop**:
```
Agent 1 (Hermes): Main operator — executes workflows
Agent 2 (Supervisor): Monitors logs, finds stale jobs/bugs, proposes fixes
Agent 3 (Auditor): Verifies Agent 2 proposals, cross-references patterns
```

**Risk Classification**:
- Low-risk fixes: auto-apply
- High-risk fixes: escalate to human
- Loop: continuous monitoring, self-healing

**Second article: OpenClaw + Hermes Discord Coordination**
4-marker intent protocol for inter-agent communication:
```
[STATUS_REQUEST]  — Agent 1 asks Agent 2 for status
[REVIEW_REQUEST]  — Agent 2 asks for review of output
[ESCALATION_NOTICE] — Human notified of issue
[ACK]             — Terminal. Loop closed. Neither bot replies.
```
Rules: one marker + one @mention per message, [ACK] is terminal (stop immediately), one message per turn, no reply chains. Max loop depth: 3 messages.

### 8.4 mal_shaik — 7 Architectural Secrets from Claude Code Source (FULLY RECOVERED via CDP)

These are implementation-level patterns from reading Claude Code's actual source:

**1. CLAUDE.md loaded every TURN — not session start**
Claude Code reads `~/.claude/CLAUDE.md`, `./CLAUDE.md`, `.claude/rules/*.md`, and `CLAUDE.local.md` on every single query iteration. 40,000 characters available. Most people use ~200.
→ Hermes should create `~/.hermes/CLAUDE.md` with Leviathan's conventions, patterns, and "never do this" rules. Re-read every turn.

**2. Subagent cache — 5 agents cost the same as 1**
When Claude Code forks a subagent, it creates a byte-identical copy of the parent context. The API caches this. Spawning 5 agents in parallel barely costs more than 1.
→ All parallel subagent dispatches should happen simultaneously, not sequentially.

**3. Three execution models**
- **fork** — inherits parent context, cache-optimized
- **teammate** — separate tmux pane, file-based mailbox
- **worktree** — own git worktree, isolated branch per agent
→ Hermes should support all three: fork for cache efficiency, teammate for long-running workers, worktree for git-isolated tasks.

**4. Permission cascade — configure once, never click "allow" again**
5-level cascade: `policy > flag > local > project > user`
Three modes: bypass (no checks), allowEdits (auto-allow file edits), auto (LLM classifier races resolvers).
→ Configure `~/.hermes/settings.json` with allow patterns. Hermes should use "auto" mode.

**5. Five compaction strategies**
1. **microcompact** — time-based clearing of old tool results
2. **context collapse** — summarizes spans of conversation
3. **session memory** — extracts key context to a file
4. **full compact** — summarizes entire history
5. **PTL truncation** — drops oldest message groups
→ Use `/compact` proactively. Default window 200K tokens; opt into 1M with `[1m]` suffix. Large tool results stored to disk with only 8KB preview.

**6. Hook system — 25+ lifecycle events, the real extension API**
Hook types: command (shell), prompt (inject context), agent (full agent loop), HTTP (webhook), function (JavaScript).
Key hooks: `PreToolUse` / `PostToolUse` (wrap any tool), `UserPromptSubmit` (inject additionalContext every message), `SessionStart` / `SessionEnd`.
→ Hermes plugin hooks should cover all these event types.

**7. Session persistence and resumability**
Supports: `--continue` (resume last), `--resume` (pick specific past session), `--fork-session` (branch from past).
Session memory extraction preserves: task specs, file lists, workflow state, errors, learnings.
→ Hermes SessionDB should support `--continue` and `--fork-session` semantics.

### 8.5 Key Insights for Hermes Agent

From Specialist Agent and Aura Frog, these patterns are NOT in Spider Agent or our current spec and should be added:

1. **@analyst agent** — Converts requirements to technical specs. This is the missing link in the brainstorm gate (Phase 0): before producing a design doc, the @analyst should validate that requirements are concrete enough to spec.

2. **@ripple agent** — Cascading change analysis. Before Phase 2 (build), the @ripple agent should answer "what else changes if I change X?" This prevents the drift-verifier from catching problems after the fact.

3. **Full/Lite agent variants** — Every agent has a Lite mode (cheaper model, faster, 60-80% lower cost) for scaffolding and quick fixes. Full mode for complex work. This means model tiering at the agent level, not just the runtime level.

4. **Strict Write Discipline** — From Aura Frog's "Memory That Heals Itself": cached context is a HINT, not truth. Before any decision, verify against actual files. Update state only after confirmed success. This is a harder constraint than Spider's snapshot approach.

5. **Verification protocol** — Every agent must show actual command output before claiming completion. This is mechanical enforcement: the tool result must precede any "done" claim.

6. **Anti-rationalization tables** — Built into the orchestrator prompt: agents cannot claim completion without meeting exit criteria. Prevents "looks good to me" syndrome.

7. **/grill skill** — Adversarial code challenge. After Phase 3 (review), a separate adversarial pass attempts to break what was built. Adds attack vectors, not just quality checks.

8. **Framework packs** — Pre-configured agent behaviors for specific frameworks. When Hermes detects a Next.js project, @builder gets Next.js-specific instructions. This is auto-detection + context injection.

---

## Part 9: Revised Hermes Agent — Expanded Taxonomy

### Target: 14-16 Core Agents (between Spider's 11 and Specialist's 36)

We don't need all 36. We need the gap-fillers plus the patterns that are unique to Leviathan's stack:

**Keep from Spider (adapted)**:
- `hermes` (primary orchestrator) — add Rule 0 + Superpowers workflow
- `explorer` — keep
- `coder` — keep
- `reviewer` — keep (split into quality + spec compliance)
- `test-engineer` — keep
- `sme` — keep
- `critic` — keep
- `critic-sounding-board` — keep
- `drift-verifier` — keep (but enhance with Ripple-like cascading analysis)
- `docs` — keep
- `quality-reviewer` — keep (new name for Spider's second reviewer)

**Add from Specialist/Aura Frog gap analysis**:
- `@analyst` — requirements → technical specs (NEW — critical for brainstorm gate)
- `@ripple` — cascading change analysis (NEW — pre-build risk assessment)
- `@architect` — architecture migration (DDD, Clean, Hexagonal) (NEW — Leviathan's mechanical enforcement needs a Clean Architecture advocate)

**Enhanced with Full/Lite variants**:
Every agent has a Lite mode (cheap model, fast) for scaffolding and a Full mode (capable model) for complex work. Implement via model tiering config:

```typescript
// Model tiering per agent (from Specialist Agent's Full/Lite pattern)
const AGENT_MODEL_TIERING = {
  hermes:     { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
  analyst:     { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
  architect:   { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
  explorer:    { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
  coder:       { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
  reviewer:    { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
  quality:     { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
  ripple:      { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
  // Mechanical tasks always use cheap model
  sme:         { full: "qwen3.6-turbo", lite: "qwen3.6-turbo" },
  test_engineer: { full: "qwen3.6-turbo", lite: "qwen3.6-turbo" },
  docs:        { full: "qwen3.6-turbo", lite: "qwen3.6-turbo" },
  critic:      { full: "qwen3.6-plus", lite: "qwen3.6-turbo" },
};
```

### Revised 7-Phase Workflow (with new patterns integrated)

```
PHASE 0: BRAINSTORM GATE (Superpowers HARD-GATE + Specialist @analyst)
  ✋ @analyst: Convert requirements to technical specs
  ✋ Present 2-3 approaches with trade-offs + recommendation
  ✋ Write design doc to docs/hermes/plans/YYYY-MM-DD-<topic>-design.md
  ✋ USER APPROVAL GATE (explicit)
  ✋ @ripple: "What else changes?" — pre-build risk assessment

PHASE 1: PLAN (Superpowers no-placeholder + Spider + Specialist)
  ✋ @planner: Adaptive planning by complexity
  ✋ Exact file paths, actual code, runnable commands
  ✋ Self-review: anti-rationalization checklist
  ✋ @analyst verification: requirements → spec completeness check

PHASE 2: BUILD (Spider + Superpowers + Specialist /tdd)
  ✋ @tdd agent: RED-GREEN-REFACTOR (Specialist's explicit TDD cycle)
  ✋ Verification protocol: show actual command output before claiming done
  ✋ Strict Write Discipline: verify cached context before use
  ✋ @ripple check after each file change: cascading effects?

PHASE 3: TWO-STAGE REVIEW (Spider + Specialist @grill)
  ✋ STAGE 1: @quality-reviewer: spec compliance + readability
  ✋ STAGE 2: @reviewer: security + performance + patterns
  ✋ /grill adversarial pass: attack vectors against built code

PHASE 4: SYSTEMATIC DEBUGGING (Specialist /debug 4-phase)
  ✋ Reproduce → Isolate → Hypothesis → Fix → Verify
  ✋ 3-strike rule → mandatory @architect review
  ✋ Anti-rationalization: cannot skip steps

PHASE 5: BRANCH COMPLETION (Superpowers + Specialist /finish)
  ✋ /verify: proof-based verification
  ✋ @health: project health score
  ✋ /finish: metrics + conventional commit + PR

PHASE 6: SUPERVISOR LOOP (Graeme 3-agent self-improving)
  ✋ Agent 2: Monitor logs, propose fixes with risk level
  ✋ Agent 3: Verify supervisor proposals before apply
  ✋ Low-risk: auto-apply + log
  ✋ High-risk: escalate to Leviathan
  ✋ Self-healing: detect patterns, persist corrections as rules
  ✋ INTENT MARKER PROTOCOL (Graeme's OpenClaw+Hermes Discord setup):
      [STATUS_REQUEST] → Agent 1 asks Agent 2 for status
      [REVIEW_REQUEST] → Agent 2 asks for review
      [ESCALATION_NOTICE] → Human notified of issue
      [ACK] → Terminal. Stop immediately. Max 3msg loop depth.
```

---

## Part 10: Verification

After implementation, Hermes Agent should pass these tests:

1. **BRAINSTORM GATE**: Request "build a login system" → bot should NOT start coding → should ask clarifying questions → should produce design doc → should wait for explicit approval → THEN produce plan

2. **NO-PLACEHOLDER PLAN**: After brainstorm approval → plan should have exact file paths, actual code blocks, runnable test commands. No TBD, TODO, or "implement X" without showing how.

3. **TDD ENFORCEMENT**: When coder starts implementing → test file must be created BEFORE src file change. If src changes first → error injected.

4. **QA GATE**: After coder completes → must have reviewer verdict (APPROVED/NEEDS_REVISION) AND test_engineer verdict (PASS/FAIL). No completion without both.

5. **3-STRIKE DEBUGGING**: Same bug fixed 3 times unsuccessfully → architecture review triggered → user must approve before continuing.

6. **2ND-BRAIN RECALL**: After session resume → hermes_recall should surface relevant prior context from workspace before starting new work.

7. **SUPERVISOR LOOP**: After repeated agent failures → supervisor should detect pattern, suggest fix, apply if LOW risk, escalate if HIGH risk.
