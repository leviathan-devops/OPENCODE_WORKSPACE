# Spider Agent Architecture
## Complete Technical Reference

**Date:** 2026-04-03
**Source:** https://github.com/zaxbysauce/opencode-swarm (branded as "spider-agent")
**Note:** All "swarm" references in source = "spider" in our implementation. Mentally translate: `ORCHESTRATOR_NAME = "architect"` → `"spider"`, `opencode-swarm` → `spider-agent`.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Plugin Entry Point](#2-plugin-entry-point)
3. [State Management](#3-state-management)
4. [The 13 Agents](#4-the-13-agents)
5. [Hook System](#5-hook-system)
6. [Tool System](#6-tool-system)
7. [Command System](#7-command-system)
8. [Configuration](#8-configuration)
9. [Session Persistence & Rehydration](#9-session-persistence--rehydration)
10. [Workflow State Machine](#10-workflow-state-machine)
11. [Quick Reference](#11-quick-reference)

---

## 1. Architecture Overview

Spider Agent is a **hub-and-spoke multi-agent orchestrator** implemented as an OpenCode plugin. It wraps vanilla OpenCode with a gated QA pipeline where code never ships without reviewer and test engineer approval.

### Architecture Diagram

```
                        ┌─────────────┐
                        │  ARCHITECT  │  ← Central orchestrator (PRIMARY)
                        │  (spider)   │
                        └──────┬──────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                       │
        ▼                      ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   EXPLORER   │     │     SME       │     │   CRITICS     │
│  (discovery) │     │ (advisory)    │     │  (QA gates)   │
└───────────────┘     └───────────────┘     └───────────────┘
        │                      │                       │
        ▼                      ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    CODER      │     │  TEST ENG.    │     │   REVIEWER    │
│(implement)    │     │  (verify)     │     │  (correct)    │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Critical Distinction: Spider vs Vanilla OpenCode

> **Spider Agent ONLY activates when you explicitly select a Spider Architect agent in the OpenCode GUI dropdown.**

Using vanilla `build` or `plan` agents bypasses Spider completely — no hooks fire, no agents activate, no pipeline runs.

### Key Design Principles

1. **One Architect** owns all decisions
2. **One task executes at a time** (no parallel writes)
3. **Every task gets QA'd** before the next starts
4. **Project state persists in files** (`.swarm/`), not memory
5. **Sessions are resumable** — pick up any project any day

---

## 2. Plugin Entry Point

**File:** `src/index.ts`

### Plugin Declaration

```typescript
const OpenCodeSwarm: Plugin = async (ctx) => {
  // 1. Load plugin config
  const { config, loadedFromFile } = loadPluginConfigWithMeta(ctx.directory);
  
  // 2. Store OpenCode client
  swarmState.opencodeClient = ctx.client;
  
  // 3. Load session snapshot (v6.18 — session persistence)
  await loadSnapshot(ctx.directory);
  
  // 4. Initialize telemetry
  initTelemetry(ctx.directory);
  
  // 5. Create agent definitions
  const agents = getAgentConfigs(config);
  const agentDefinitions = createAgents(config);
  
  // 6. Build hooks
  const pipelineHook = buildPipelineHook(...);
  const systemEnhancerHook = buildSystemEnhancerHook(...);
  const guardrailsHooks = buildGuardrailsHooks(...);
  const knowledgeHooks = buildKnowledgeHooks(...);
  const delegationGateHooks = buildDelegationGateHooks(...);
  
  // 7. Initialize automation (if not manual mode)
  if (automation.mode !== 'manual') {
    createAutomationManager(automationConfig).start();
  }
  
  // 8. Return plugin manifest
  return {
    name: 'opencode-swarm',       // Note: renamed to spider-agent in our build
    agent: agents,
    tool: { /* 35+ custom tools */ },
    config: async (opencodeConfig) => {
      Object.assign(opencodeConfig.agent, agents);
      // Register /swarm command + 30+ subcommands
    },
    "command.execute.before": safeHook(commandHandler),
    "tool.execute.before": toolBeforeHook,
    "tool.execute.after": toolAfterHook,
    "chat.message": delegationHandler,
    "experimental.chat.messages.transform": messagesTransformHook,
    "experimental.chat.system.transform": systemTransformHook,
    "experimental.session.compacting": compactionHook,
    automation: automationManager,
  };
};
```

### Curator Agent Name Registration

```typescript
// Collected for multi-swarm support (factory resolves correct name at call time)
swarmState.curatorInitAgentNames = Object.keys(agents).filter(
  (k) => k === 'curator_init' || k.endsWith('_curator_init'),
);
swarmState.curatorPhaseAgentNames = Object.keys(agents).filter(
  (k) => k === 'curator_phase' || k.endsWith('_curator_phase'),
);
```

---

## 3. State Management

**File:** `src/state.ts`

### Module-Level Singleton: `swarmState`

```typescript
export const swarmState = {
  // OpenCode SDK client (set at plugin init)
  opencodeClient: OpencodeClient | null,
  
  // Per-session agent identity: sessionID → agentName
  activeAgent: Map<string, string>,
  
  // Tool call tracking: callID → ToolCallEntry
  activeToolCalls: Map<string, ToolCallEntry>,
  
  // Delegation chains: sessionID → DelegationEntry[]
  delegationChains: Map<string, DelegationEntry[]>,
  
  // Per-session state: sessionID → AgentSessionState
  agentSessions: Map<string, AgentSessionState>,
  
  // Context budget (0-100, updated by system-enhancer)
  lastBudgetPct: number,
  
  // Curator agent names for multi-swarm
  curatorInitAgentNames: string[],
  curatorPhaseAgentNames: string[],
  
  // In-flight rehydration promises
  pendingRehydrations: Set<Promise<void>>,
};
```

### AgentSessionState (Per Session)

```typescript
interface AgentSessionState {
  // Identity
  agentName: string;
  currentTaskId: string | null;
  
  // Timing
  lastToolCallTime: number;
  lastAgentEventTime: number;
  
  // Delegation
  delegationActive: boolean;
  lastCoderDelegationTaskId: string | null;
  
  // Invocation tracking
  activeInvocationId: number;
  lastInvocationIdByAgent: Record<string, number>;
  windows: Record<string, InvocationWindow>;
  
  // Task workflow (v6.21 forward-only state machine)
  taskWorkflowStates: Map<string, TaskWorkflowState>;
  
  // QA tracking
  qaSkipCount: number;
  qaSkipTaskIds: string[];
  reviewerCallCount: Map<number, number>;
  lastGateFailure: { tool, taskId, timestamp } | null;
  partialGateWarningsIssuedForTask: Set<string>;
  selfFixAttempted: boolean;
  catastrophicPhaseWarnings: Set<number>;
  
  // Phase tracking
  lastPhaseCompleteTimestamp: number;
  lastPhaseCompletePhase: number;
  phaseAgentsDispatched: Set<string>;
  declaredCoderScope: string[] | null;
  lastScopeViolation: string | null;
  modifiedFilesThisCoderTask: string[];
  coderRevisions: number;
  revisionLimitHit: boolean;
  
  // Model fallback
  model_fallback_index: number;
  modelFallbackExhausted: boolean;
  
  // Turbo mode
  turboMode: boolean;
  
  // Loop detection
  loopDetectionWindow: Array<{ hash, timestamp }>;
  loopWarningPending: { agent, message, timestamp } | undefined;
  
  // Context pressure
  contextPressureWarningSent: boolean;
  
  // Advisory message queue
  pendingAdvisoryMessages: string[];
  
  // Rehydration
  sessionRehydratedAt: number;
  
  // Gate tracking
  gateLog: Map<string, Set<string>>;
  lastGateOutcome: { gate, taskId, passed, timestamp } | null;
}
```

### InvocationWindow

```typescript
interface InvocationWindow {
  id: number;
  agentName: string;           // Agent name (stripped of swarm prefix)
  startedAtMs: number;
  toolCalls: number;
  consecutiveErrors: number;
  hardLimitHit: boolean;
  lastSuccessTimeMs: number;
  recentToolCalls: Array<{ tool, argsHash, timestamp }>;  // Circular buffer, max 20
  warningIssued: boolean;
  warningReason: string;
}
```

### TaskWorkflowState Enum (v6.21)

Forward-only state machine:
```
idle → coder_delegated → pre_check_passed → reviewer_run → tests_run → complete
```

### Key State Functions

| Function | Purpose |
|----------|---------|
| `startAgentSession(sessionId, agentName, staleDurationMs?, directory?)` | Create session, evict stale sessions, apply rehydration cache |
| `ensureAgentSession(sessionId, agentName?, directory?)` | Get existing or create new; runs extensive migration safety checks |
| `beginInvocation(sessionId, agentName)` | Start new invocation window; architect returns null |
| `getActiveWindow(sessionId)` | Get current active window |
| `pruneOldWindows(sessionId, maxAgeMs?, maxWindows?)` | Memory management |
| `advanceTaskState(session, taskId, newState)` | Forward-only state machine transition |
| `buildRehydrationCache(directory)` | Read `.swarm/plan.json` + `.swarm/evidence/*.json` at plugin init |
| `applyRehydrationCache(session)` | Apply cached data to new session synchronously |
| `rehydrateSessionFromDisk(directory, session)` | Async rehydration from durable files |
| `hasActiveTurboMode(sessionID?)` | Check turbo mode status |

---

## 4. The 13 Agents

All 13 agents are created by `createSwarmAgents()` in `src/agents/index.ts`.

### Agent Inventory

| # | Name | Role | Mode | Type |
|---|------|------|------|------|
| 1 | `architect` | Orchestrator | PRIMARY | Orchestrator |
| 2 | `explorer` | Codebase analysis | SUBAGENT | Specialist |
| 3 | `sme` | Subject Matter Expert | SUBAGENT | Specialist |
| 4 | `coder` | Implementation | SUBAGENT | Pipeline |
| 5 | `reviewer` | Code review | SUBAGENT | QA |
| 6 | `critic` | Plan review | SUBAGENT | QA (3 roles) |
| 7 | `critic_sounding_board` | Pre-escalation pushback | SUBAGENT | QA |
| 8 | `critic_drift_verifier` | Phase drift verification | SUBAGENT | QA |
| 9 | `test_engineer` | Test generation/execution | SUBAGENT | Pipeline |
| 10 | `docs` | Documentation synthesis | SUBAGENT | Specialist |
| 11 | `designer` | UI/UX design specs | SUBAGENT | Specialist |
| 12 | `curator_init` | Session context consolidation | SUBAGENT | Curator |
| 13 | `curator_phase` | Phase digest consolidation | SUBAGENT | Curator |

### Agent Tool Permission Matrix

| Agent | write | edit | patch | Access |
|-------|-------|------|-------|--------|
| `architect` | ✓ | ✓ | ✓ | Full |
| `explorer` | ✗ | ✗ | ✗ | Read-only |
| `sme` | ✗ | ✗ | ✗ | Read-only |
| `coder` | ✓ | ✓ | ✓ | Full |
| `reviewer` | ✗ | ✗ | ✗ | Read-only |
| `critic` | ✗ | ✗ | ✗ | Read-only |
| `critic_sounding_board` | ✗ | ✗ | ✗ | Read-only |
| `critic_drift_verifier` | ✗ | ✗ | ✗ | Read-only |
| `test_engineer` | ✓ | ✓ | ✓ | Full (test files) |
| `docs` | ✓ | ✓ | ✓ | Full (docs) |
| `designer` | ✗ | ✗ | ✗ | Read-only |
| `curator_init` | ✗ | ✗ | ✗ | Read-only |
| `curator_phase` | ✗ | ✗ | ✗ | Read-only |

### Default Model Assignments

| Agent | Default Model | Temperature |
|-------|---------------|-------------|
| `architect` | Inherits from OpenCode UI | 0.1 |
| `explorer` | `opencode/trinity-large-preview-free` | 0.1 |
| `sme` | `opencode/trinity-large-preview-free` | 0.2 |
| `coder` | `opencode/minimax-m2.5-free` | 0.2 |
| `reviewer` | `opencode/big-pickle` | 0.1 |
| `critic` | `opencode/trinity-large-preview-free` | 0.1 |
| `critic_sounding_board` | `opencode/trinity-large-preview-free` | 0.1 |
| `critic_drift_verifier` | `opencode/trinity-large-preview-free` | 0.1 |
| `test_engineer` | `opencode/gpt-5-nano` | 0.2 |
| `docs` | `opencode/trinity-large-preview-free` | 0.2 |
| `designer` | `opencode/trinity-large-preview-free` | 0.3 |
| `curator_init` | `opencode/trinity-large-preview-free` | 0.1 |
| `curator_phase` | `opencode/trinity-large-preview-free` | 0.1 |

### Architect (Central Orchestrator)

**File:** `src/agents/architect.ts` (~1163 lines)

- **Role**: Central orchestrator that owns all decisions, delegates all coding
- **Mode**: PRIMARY (unlimited context, strongest reasoning)
- **Tools**: 39 tools (checkpoint, lint, diff, secretscan, test_runner, knowledge*, save_plan, etc.)
- **Key constraints**: NEVER writes code directly — delegates to coder
- **QA gates**: Mandatory two-stage pipeline (Stage A: automated tools → Stage B: agent review)
- **Phase naming**: "Phase N" = project phases in plan.md ONLY; operational modes never called "phases"

### Explorer

**File:** `src/agents/explorer.ts` (~259 lines)

- **Role**: Fast codebase discovery and analysis
- **Mode**: SUBAGENT
- **Tools**: `complexity_hotspots`, `detect_domains`, `extract_code_blocks`, `gitingest`, `imports`, `retrieve_summary`, `schema_drift`, `symbols`, `todo_extract`, `doc_scan`, `knowledgeRecall`
- **Output format**: PROJECT, LANGUAGES, FRAMEWORK, STRUCTURE, KEY FILES, PATTERNS, DOMAINS, REVIEW NEEDED

### SME (Subject Matter Expert)

**File:** `src/agents/sme.ts` (~139 lines)

- **Role**: Open-domain technical guidance (security, iOS, Kubernetes, Python, etc.)
- **Mode**: SUBAGENT
- **Tools**: `complexity_hotspots`, `detect_domains`, `extract_code_blocks`, `imports`, `retrieve_summary`, `schema_drift`, `symbols`, `knowledgeRecall`
- **Confidence calibration**: HIGH/MEDIUM/LOW with explicit calibration rules

### Coder

**File:** `src/agents/coder.ts` (~178 lines)

- **Role**: Production-quality code implementation
- **Mode**: SUBAGENT
- **Tools**: `diff`, `imports`, `lint`, `symbols`, `extract_code_blocks`, `retrieve_summary`, `search`, `build_check`, `syntax_check`, `knowledgeAdd`, `knowledgeRecall`
- **Output format**: `DONE:` or `BLOCKED:` — mandatory structured output
- **Anti-hallucination**: Verifies imports exist before using them

### Reviewer

**File:** `src/agents/reviewer.ts` (~203 lines)

- **Role**: Code correctness and vulnerability verification
- **Mode**: SUBAGENT
- **Tools**: `diff`, `imports`, `lint`, `pkg_audit`, `pre_check_batch`, `secretscan`, `symbols`, `complexity_hotspots`, `test_runner`, `sast_scan`, `placeholder_scan`, `knowledgeRecall`, `search`, `batch_symbols`, `suggest_patch`
- **Three tier review**: TIER 1 (correctness) → TIER 2 (safety MODERATE+) → TIER 3 (quality, COMPLEX only)
- **Verdict**: APPROVED/REJECTED with RISK: LOW/MEDIUM/HIGH/CRITICAL

### Critic (Plan Critic)

**File:** `src/agents/critic.ts` (~384 lines)

Three role variants via `CriticRole` parameter:

1. **`plan_critic`** (default): Reviews architect's plan before implementation
   - 5 rubric axes: Feasibility, Completeness, Dependency ordering, Scope containment, Risk assessment
   - Verdict: APPROVED / NEEDS_REVISION / REJECTED

2. **`sounding_board`**: Pre-escalation pushback
   - Acts as senior engineer reviewing colleague's proposal
   - Verdict: UNNECESSARY / REPHRASE / APPROVED / RESOLVE

3. **`phase_drift_verifier`**: Independent phase verification
   - Verifies every task in a completed phase was actually implemented
   - Reads every target file independently (does not trust implementation notes)
   - Verdict: APPROVED / NEEDS_REVISION

### Test Engineer

**File:** `src/agents/test-engineer.ts` (~221 lines)

- **Role**: Test generation and execution
- **Mode**: SUBAGENT
- **Tools**: `test_runner`, `diff`, `symbols`, `extract_code_blocks`, `retrieve_summary`, `imports`, `complexity_hotspots`, `pkg_audit`, `build_check`, `syntax_check`, `search`
- **Assertion quality**: No `toBeTruthy()` / `toBeDefined()` — must use exact values
- **Coverage floor**: 80% of public functions must be tested

### Docs

**File:** `src/agents/docs.ts` (~124 lines)

- **Role**: Documentation synthesis
- **Mode**: SUBAGENT
- **Tools**: `detect_domains`, `extract_code_blocks`, `gitingest`, `imports`, `retrieve_summary`, `schema_drift`, `symbols`, `todo_extract`, `knowledgeRecall`
- **Scope**: README.md, API docs (JSDoc), CONTRIBUTING.md, installation guides, CLI help
- **Excluded**: `.swarm/context.md`, `.swarm/plan.md` (architect-owned)

### Designer

**File:** `src/agents/designer.ts` (~182 lines)

- **Role**: UI/UX design specification
- **Mode**: SUBAGENT
- **Tools**: `extract_code_blocks`, `retrieve_summary`, `symbols`, `knowledgeRecall`
- **Note**: Only created when `pluginConfig?.ui_review?.enabled === true`
- **Design checklist**: Component architecture, layout/responsiveness, accessibility (WCAG 2.1 AA), visual design, interaction design

### Curator Init

**File:** `src/agents/curator-agent.ts` (~69 lines)

- **Role**: Session context consolidation at session start
- **Mode**: SUBAGENT
- **Tools**: `knowledgeRecall` only
- **Output**: BRIEFING (< 2000 chars), CONTRADICTIONS, KNOWLEDGE_STATS
- **Reads**: Prior summary + knowledge entries + project context

### Curator Phase

**File:** `src/agents/curator-agent.ts`

- **Role**: Phase digest consolidation at phase boundaries
- **Mode**: SUBAGENT
- **Tools**: `knowledgeRecall` only
- **Output**: PHASE_DIGEST, COMPLIANCE, KNOWLEDGE_UPDATES, EXTENDED_DIGEST
- **Extends** prior digest, never replaces

---

## 5. Hook System

Spider Agent registers hooks on the OpenCode plugin SDK. These are the primary extension mechanism.

### Hook Execution Order

#### `tool.execute.before` Chain

```
1. Set activeAgent if not already set
2. Detect stale delegations (>10s without activity) → revert to architect
3. guardrailsHooks.toolBefore  → throws CAN block
4. scopeGuardHook.toolBefore    → throws CAN block
5. delegationGateHooks.toolBefore → throws CAN block
6. Context pressure warning (50%+ budget)
7. activityHooks.toolBefore    → non-blocking
```

#### `tool.execute.after` Chain

```
1. activityHooks.toolAfter
2. guardrailsHooks.toolAfter
3. delegationLedgerHook.toolAfter
4. selfReviewHook.toolAfter
5. delegationGateHooks.toolAfter
6. detectAdversarialPatterns
7. recordToolCall + detectDebuggingSpiral
8. knowledgeCuratorHook
9. hivePromoterHook
10. steeringConsumedHook
11. coChangeSuggesterHook
12. darkMatterDetectorHook
13. snapshotWriterHook
14. toolSummarizerHook
15. slopDetectorHook.toolAfter (strict mode)
16. incrementalVerifyHook.toolAfter (strict mode)
17. compactionServiceHook.toolAfter (non-fast mode)
18. Tool output truncation
```

### `experimental.chat.messages.transform` Chain

| Handler | Purpose |
|---------|---------|
| `delegationLedgerHook.onArchitectResume` | Inject delegation summary when architect resumes |
| `pipelineHook['experimental.chat.messages.transform']` | Track phase/state progression |
| `contextBudgetHandler` | Enforce context window budgets |
| `guardrailsHooks.messagesTransform` | Guardrail message injection |
| `delegationGateHooks.messagesTransform` | Gate status injection |
| `delegationSanitizerHook` | Sanitize delegation parameters |
| `knowledgeInjectorHook` | Inject retrieved knowledge |
| `consolidateSystemMessages` | Merge multiple system messages |

### `experimental.chat.system.transform` Chain

| Handler | Purpose |
|---------|---------|
| `systemEnhancerHook['experimental.chat.system.transform']` | System prompt additions |
| Heartbeat telemetry (30s throttle) | Keep-alive events |
| `createPhaseMonitorHook(...)` | Phase preflight monitoring |

---

## 6. Tool System

Spider Agent registers 35+ custom tools in `src/tools/`.

### Tool Categories

#### Gate/Evidence Tools
| Tool | Purpose |
|------|---------|
| `check_gate_status` | Verify gate completion |
| `checkpoint` | Create git checkpoint |
| `completion_verify` | Deterministic completion check |
| `evidence_check` | Verify evidence completeness |
| `write_drift_evidence` | Persist drift verification |
| `schema_drift` | Check API drift |

#### Code Tools
| Tool | Purpose |
|------|---------|
| `diff` | Show changes (AST diff) |
| `extract_code_blocks` | Parse code blocks |
| `symbols` | Extract symbols |
| `batch_symbols` | Batch symbol extraction |
| `imports` | Map dependencies |
| `lint` | Run linter (biome/eslint + 10 non-JS linters) |
| `secretscan` | Detect secrets (17 types + entropy) |
| `gitingest` | Git-aware file ingestion |
| `doc_scan` | Documentation discovery |
| `doc_extract` | Documentation extraction |

#### QA Tools
| Tool | Purpose |
|------|---------|
| `test_runner` | Run tests |
| `pre_check_batch` | Parallel verification |
| `complexity_hotspots` | Find complex code |
| `pkg_audit` | Dependency audit |
| `sast_scan` | Security analysis |
| `placeholder_scan` | Detect placeholder patterns |
| `build_check` | Verify build succeeds |
| `syntax_check` | Verify syntax |

#### Knowledge Tools
| Tool | Purpose |
|------|---------|
| `knowledgeAdd` | Store learning |
| `knowledgeRecall` | Query knowledge |
| `knowledgeRemove` | Delete entry |
| `knowledge_query` | Query knowledge |
| `curator_analyze` | Analyze knowledge |

#### Planning Tools
| Tool | Purpose |
|------|---------|
| `save_plan` | Save implementation plan |
| `retrieve_summary` | Get compressed summaries |
| `todo_extract` | Extract todo items |
| `phase_complete` | Complete a phase |
| `update_task_status` | Mark tasks complete |
| `declare_scope` | Declare coder scope |

#### Analysis Tools
| Tool | Purpose |
|------|---------|
| `co_change_analyzer` | Co-change analysis |
| `detect_domains` | Identify domains |
| `search` | Search |
| `suggest_patch` | Suggest patches |

#### Output Tools
| Tool | Purpose |
|------|---------|
| `write_retro` | Write retrospective |
| `write_drift_evidence` | Persist drift evidence |
| `sbom_generate` | Generate SBOM |

---

## 7. Command System

All commands are prefixed with `/swarm`:

### Full Command Tree

```
/swarm status          — Current phase and task
/swarm plan            — Full project plan
/swarm agents          — List registered agents
/swarm history         — View history
/swarm config          — Show configuration
/swarm evidence        — View evidence bundles
/swarm evidence summary — Evidence summary
/swarm handoff         — Generate handoff prompt
/swarm archive         — Archive project
/swarm diagnose        — Health checks
/swarm preflight       — Run preflight checks
/swarm sync-plan       — Sync plan.json ↔ plan.md
/swarm export          — Export data
/swarm reset           — Clear state
/swarm rollback        — Rollback
/swarm retrieve        — Retrieve summaries
/swarm clarify         — Clarify task
/swarm analyze         — Analyze project
/swarm specify         — Specify details
/swarm dark-matter     — Dark matter detection
/swarm knowledge       — Knowledge operations
/swarm curate          — Curation
/swarm turbo           — Enable turbo mode
/swarm write-retro     — Write retrospective
/swarm reset-session   — Reset session
/swarm simulate        — Simulation
/swarm promote         — Promote
/swarm checkpoint      — Create checkpoint
/swarm config doctor   — Config diagnostic
/swarm close           — Close task
```

---

## 8. Configuration

**File:** `src/config/`

### Config File Location

`.opencode/opencode-swarm.json` or `~/.config/opencode/opencode-swarm.json`

### Config Schema

```typescript
interface SwarmConfig {
  agents?: {
    architect?: AgentOverride
    coder?: AgentOverride
    reviewer?: AgentOverride
    test_engineer?: AgentOverride
    // ... all agent names
  }
  execution_mode?: "strict" | "balanced" | "fast"
  max_iterations?: number
  guardrails?: {
    enabled?: boolean
    scope_guard?: boolean
    delegation_gate?: boolean
  }
  automation?: {
    mode?: "manual" | "auto"
    // ...
  }
  knowledge?: {
    enabled?: boolean
    // ...
  }
  ui_review?: {
    enabled?: boolean  // Enables designer agent
  }
}

interface AgentOverride {
  model?: string
  temperature?: number
  prompt?: string
  disable?: boolean
}
```

---

## 9. Session Persistence & Rehydration

### Persistence Directory: `.swarm/`

```
.swarm/
├── plan.md              # Project roadmap
├── plan.json           # Structured plan
├── context.md          # Technical decisions, learnings
├── events.jsonl        # Event stream
├── evidence/
│   └── {taskId}/
│       ├── evidence.json
│       ├── trajectory.jsonl
│       └── results.json
├── telemetry/
│   └── events.jsonl
├── snapshots/
│   └── {label}/
├── summaries/          # Tool output summaries (large outputs)
├── doc-manifest.json   # Documentation index
└── knowledge.jsonl     # Persistent learnings
```

### Rehydration System (v6.18)

1. **At plugin init**: `buildRehydrationCache()` reads `.swarm/plan.json` + `.swarm/evidence/*.json`
2. **Sync**: `applyRehydrationCache()` applies cached data to every new session
3. **Async**: `rehydrateSessionFromDisk()` runs async for new sessions
4. **Merge rules**: evidence-derived state wins over plan-only; never downgrade in-memory state

---

## 10. Workflow State Machine

v6.21 introduces a forward-only task state machine:

```
idle
  ↓
coder_delegated
  ↓
pre_check_passed
  ↓
reviewer_run
  ↓
tests_run
  ↓
complete
```

**Key constraint**: State can only advance forward. No backward transitions.

---

## 11. Quick Reference

### Plugin Name
- Source: `'opencode-swarm'`
- Our build: `'spider-agent'`

### Orchestrator Name
- Source: `'architect'`
- Our build: `'spider'`

### Key Constants (src/config/constants.ts)
```typescript
ORCHESTRATOR_NAME = "architect"  // → "spider" in our build
AGENT_TOOL_MAP = {                // Which tools each agent can use
  architect: [...39 tools],
  coder: [...11 tools],
  reviewer: [...17 tools],
  // ...
}
DEFAULT_MODELS = {               // Per-agent model defaults
  architect: "opencode/trinity-large-preview-free",
  coder: "opencode/minimax-m2.5-free",
  reviewer: "opencode/big-pickle",
  // ...
}
```

### Stale Delegation Detection
```typescript
// If >10s without agent event and delegation not active → revert to orchestrator
const staleDelegation = !session.delegationActive && 
                        Date.now() - session.lastAgentEventTime > 10000;
```

### Tab Toggle Fix (If Broken)
Spider Agent appears in OpenCode UI via dual-layer mechanism:
1. Plugin `config` hook injects agent definitions
2. `opencode.json` specifies which agents visible

If tab toggle shows "architect" instead of "spider", apply:
```bash
sed -i 's/ORCHESTRATOR_NAME = "architect"/ORCHESTRATOR_NAME = "spider"/g' dist/index.js
sed -i 's/agent\.name === "architect"/agent.name === "spider"/g' dist/index.js
sed -i 's/\barchitect: \[/spider: [/' dist/index.js
```

---

*Generated from source code analysis of https://github.com/zaxbysauce/opencode-swarm*
