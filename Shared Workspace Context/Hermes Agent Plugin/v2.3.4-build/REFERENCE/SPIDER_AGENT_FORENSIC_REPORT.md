# Spider Agent (opencode-swarm) - Complete Forensic Analysis Report

**Date**: 2026-04-01
**Source**: `~/.npm-global/lib/node_modules/spider-agent/dist/index.js` (68,502 lines)
**Analysis**: Reverse-engineered from compiled bundle

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Plugin Architecture](#2-plugin-architecture)
3. [The 11 Agents](#3-the-11-agents)
4. [Execution Pipeline](#4-execution-pipeline)
5. [State Management](#5-state-management)
6. [Tool System](#6-tool-system)
7. [Command System](#7-command-system)
8. [The "Tab Toggle" Mechanism](#8-the-tab-toggle-mechanism)
9. [Hook System Deep Dive](#9-hook-system-deep-dive)
10. [Building Shark Agent Blueprint](#10-building-shark-agent-blueprint)
11. [Gap Analysis](#11-gap-analysis)

---

## 1. Executive Summary

The Spider Agent (opencode-swarm) is an OpenCode plugin implementing a **hub-and-spoke multi-agent orchestrator** with 11 specialized agents, gated QA pipeline, and comprehensive state persistence.

### Key Numbers
- **68,502 lines**: Compiled JavaScript bundle
- **11 agents**: 1 orchestrator + 10 specialized subagents
- **35+ custom tools**: For state management, evidence, checkpoints
- **40+ slash commands**: `/swarm *` command suite
- **20+ hooks**: Lifecycle hooks for pipeline enforcement

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenCode                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Plugin: opencode-swarm                                    │   │
│  │                                                           │   │
│  │  config hook ──────────► Agent Registry                  │   │
│  │                                                           │   │
│  │  ┌─────────────┐                                          │   │
│  │  │ architect  │ ◄─── mode: "primary" (UI dropdown)      │   │
│  │  │  (spider)  │                                          │   │
│  │  └──────┬──────┘                                          │   │
│  │         │ delegates to                                    │   │
│  │  ┌──────┴──────┬────────────┬─────────────┐               │   │
│  │  ▼             ▼            ▼             ▼               │   │
│  │ coder    reviewer    test_engineer    explorer           │   │
│  │                                            (subagent)      │   │
│  │  + sme, critic, critic_sounding_board,                    │   │
│  │    critic_drift_verifier, docs, designer                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Plugin Architecture

### Plugin Entry Point (Line ~67880)

```javascript
const OpenCodeSwarm = async (ctx, options) => {
  // 1. Load configuration
  const config = loadPluginConfigWithMeta(ctx.directory);
  
  // 2. Load state snapshot (for resumability)
  const snapshot = loadSnapshot(ctx.directory);
  
  // 3. Initialize telemetry
  initTelemetry(ctx.directory);
  
  // 4. Create agent configs
  const config3 = getResolvedConfig(config);
  const agentConfigs = getAgentConfigs(config3);
  
  // 5. Create agent definitions
  const agents = createAgents(agentConfigs);
  
  // 6. Register hooks
  const hooks = registerHooks(ctx, agents, config3);
  
  // 7. Return Hooks object
  return {
    name: "opencode-swarm",
    agent: agents,
    tool: { /* 28 custom tools */ },
    config: async (opencodeConfig) => { /* merges agents + commands */ },
    ...hooks
  };
};
```

### Plugin Interface Type

```typescript
type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>;

interface Hooks {
  name?: string;
  agent?: Record<string, SDKAgentConfig>;
  tool?: Record<string, ToolDefinition>;
  config?: (cfg: Config) => Promise<void>;
  "chat.message"?: ChatHook;
  "chat.params"?: ParamsHook;
  "chat.headers"?: HeadersHook;
  "permission.ask"?: PermissionHook;
  "command.execute.before"?: CommandHook;
  "tool.execute.before"?: ToolHook | ToolHook[];
  "tool.execute.after"?: ToolHook | ToolHook[];
  "shell.env"?: ShellEnvHook;
  "experimental.chat.messages.transform"?: MessagesTransformHook;
  "experimental.chat.system.transform"?: SystemTransformHook;
  "experimental.session.compacting"?: CompactingHook;
  "experimental.text.complete"?: TextCompleteHook;
  "tool.definition"?: ToolDefinitionHook;
  auth?: AuthHook;
  event?: EventHook;
  automation?: AutomationManager;
}
```

### Hook Utility Functions

| Function | Line | Purpose |
|----------|------|---------|
| `safeHook(fn)` | 15528 | Wraps hook with error catching |
| `composeHandlers(...fns)` | 15543 | Chains multiple handlers |

---

## 3. The 11 Agents

### Agent Configuration

```typescript
interface SDKAgentConfig {
  name: string;
  description?: string;
  model?: string;
  mode?: "primary" | "subagent" | "all";
  permission?: {
    task?: "allow" | "deny";
    file?: Record<string, "allow" | "deny">;
  };
  tools?: string[];
  system?: string;
}
```

### Mode Flags

| Mode | UI Behavior |
|------|-------------|
| `"primary"` | Shows as main agent in dropdown |
| `"subagent"` | Hidden from UI, used for delegation only |
| `"all"` | Shows everywhere including @ autocomplete |

### The 11 Agents

| # | Agent | Mode | Role |
|---|-------|------|------|
| 1 | `architect` | primary | Main orchestrator (the "spider") |
| 2 | `explorer` | subagent | Codebase scanning, context gathering |
| 3 | `coder` | subagent | Implements tasks one at a time |
| 4 | `reviewer` | subagent | Correctness + security review |
| 5 | `test_engineer` | subagent | Writes and runs tests |
| 6 | `sme` | subagent | Subject matter expert consultation |
| 7 | `critic` | subagent | Plan critique before execution |
| 8 | `critic_sounding_board` | subagent | Pre-escalation pushback |
| 9 | `critic_drift_verifier` | subagent | Phase completion verification |
| 10 | `docs` | subagent | Documentation updates |
| 11 | `designer` | subagent | UI scaffolds (only if `ui_review.enabled`) |

### Agent Creation (Lines ~44263-44355)

```javascript
function createSwarmAgents(swarmId, swarmConfig, isDefault, config) {
  const agents = [];
  
  // Architect (orchestrator) - always created
  agents.push(createArchitectAgent(architectConfig));
  
  // Pipeline agents
  if (!config.agents.explorer?.disabled) {
    agents.push(createExplorerAgent(...));
  }
  if (!config.agents.coder?.disabled) {
    agents.push(createCoderAgent(...));
  }
  if (!config.agents.test_engineer?.disabled) {
    agents.push(createTestEngineerAgent(...));
  }
  
  // QA agents
  if (!config.agents.reviewer?.disabled) {
    agents.push(createReviewerAgent(...));
  }
  if (!config.agents.critic?.disabled) {
    agents.push(createCriticAgent(...));
  }
  
  // Specialized agents
  if (!config.agents.sme?.disabled) {
    agents.push(createSMEDgent(...));
  }
  // ... etc
  
  return agents;
}
```

---

## 4. Execution Pipeline

### Pipeline Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXECUTION PIPELINE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────┐                                                        │
│  │ CLARIFY │ ◄── Ask missing questions                            │
│  └────┬────┘                                                        │
│       ▼                                                             │
│  ┌─────────┐                                                        │
│  │  PLAN   │ ◄── architect writes plan.md + plan.json              │
│  └────┬────┘                                                        │
│       ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                         BUILD                                │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────────┐               │   │
│  │  │ explorer│───►│  coder  │───►│test_engineer│               │   │
│  │  └─────────┘    └────┬────┘    └──────┬──────┘               │   │
│  │                      │                │                       │   │
│  │                      ▼                ▼                       │   │
│  │               ┌─────────────────────────────┐                  │   │
│  │               │     QA GATE (brick wall)    │                  │   │
│  │               │  • reviewer (correctness)  │                  │   │
│  │               │  • reviewer (security)      │                  │   │
│  │               │  • test_engineer (verify)  │                  │   │
│  │               │  • architect (regression)   │                  │   │
│  │               └─────────────────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│       ▼                                                             │
│  ┌─────────┐                                                        │
│  │ REVIEW  │ ◄── Final review, retrospective                     │
│  └────┬────┘                                                        │
│       ▼                                                             │
│  ┌─────────┐                                                        │
│  │COMPLETE │ ◄── Docs updated, evidence archived                  │
│  └─────────┘                                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### QA Gate Enforcement (Lines ~53976-53980)

The `delegationGateHook` enforces that after coder completes, it MUST delegate to reviewer and test_engineer before another coder task:

```javascript
// Example warning when gate is violated:
WARNING: QA GATE ENFORCEMENT: N consecutive coder delegations without reviewer/test_engineer.
```

### Delegation Mechanism

```javascript
// In architect agent - how it delegates to subagents:
const delegate = async (agentName: string, task: string, context: any) => {
  // Creates a task object for the subagent
  const taskObj = {
    to: agentName,
    task: task,
    context: context,
    mode: "subagent"  // Subagent mode
  };
  
  // OpenCode handles routing to the appropriate agent
  await context.delegate(taskObj);
};
```

---

## 5. State Management

### .swarm/ Directory Structure

```
.swarm/
├── plan.json                    # Structured execution plan
├── plan.md                     # Human-readable plan
├── spec.md                     # Feature specification
├── context.md                  # Technical decisions, SME guidance
├── events.jsonl                # Telemetry event stream
├── telemetry.jsonl             # Heartbeat + observability
├── evidence/
│   └── {taskId}/
│       ├── evidence.json       # Task evidence bundle
│       ├── trajectory.jsonl    # Delegation log
│       ├── review.json         # Reviewer output
│       ├── test.json           # Test results
│       └── retrospective.json  # Per-task lessons
├── evidence-summary.json       # Aggregated evidence
├── summaries/
│   └── {id}.json              # Tool output summaries
├── co-change.json             # Co-change analysis
├── dark-matter.md             # Hidden coupling reports
├── drift-report-phase-N.json   # Plan vs reality drift
├── checkpoints/
│   └── {label}/              # Named checkpoints
├── knowledge.jsonl            # Persistent knowledge base
└── curator-summary.json       # Curation results
```

### State Rehydration (Resumability)

```javascript
// On plugin initialization:
async function initializePlugin(ctx) {
  // 1. Load snapshot from disk
  const snapshot = loadSnapshot(ctx.directory);
  
  // 2. Build rehydration cache
  const cache = buildRehydrationCache(ctx.directory);
  
  // 3. Apply to session
  if (snapshot.exists) {
    rehydrateSessionFromDisk(ctx.directory, session);
    applyRehydrationCache(session);
  }
  
  // 4. If .swarm/plan.md exists → RESUME→EXECUTE
  //    Else → start fresh with CLARIFY
}
```

### Key State Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `plan.json` | Current plan | `loadPlan()`, `savePlan()`, `syncPlan()` |
| `evidence/*.json` | Task evidence | `collectEvidence()`, `verifyEvidence()` |
| `telemetry.jsonl` | Event log | `writeTelemetry()`, `readTelemetry()` |
| `summaries/*.json` | Tool output summaries | `writeSummary()`, `readSummary()` |
| `checkpoints/*/` | Named checkpoints | `createCheckpoint()`, `restoreCheckpoint()` |

---

## 6. Tool System

### Custom Tools Registered (28+ tools)

| Tool | Purpose |
|------|---------|
| `checkpoint` | Create named checkpoint |
| `save_plan` | Persist plan to disk |
| `evidence_check` | Verify task evidence |
| `phase_complete` | Mark phase done |
| `declare_scope` | Restrict coder file access |
| `swarm_status` | Show current state |
| `swarm_plan` | Display plan |
| `swarm_agents` | List all agents |
| `swarm_ev` | Show evidence |
| `swarm_knowledge` | Query knowledge base |
| `declare_done` | Mark task complete |

### Tool Definition Pattern

```typescript
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';

tool({
  description: "Create a named checkpoint for later restoration",
  args: {
    label: z.string().describe("Checkpoint label"),
    note: z.string().optional().describe("Optional note")
  },
  execute: async (args, context) => {
    const path = `${context.directory}/.swarm/checkpoints/${args.label}`;
    // ... create checkpoint
    return `Checkpoint created: ${args.label}`;
  }
})
```

### Tool Execution Context

```typescript
interface ToolContext {
  sessionID: string;
  messageID: string;
  agent: string;
  directory: string;      // Current project directory
  worktree: string;      // Project worktree root
  abort: AbortSignal;
  metadata(input: { title?: string; metadata?: any }): void;
  ask(input: AskInput): Promise<void>;
}
```

---

## 7. Command System

### Command Registration (Lines ~68127-68268)

```javascript
config: async (opencodeConfig) => {
  opencodeConfig.command = {
    // Main command
    swarm: { template: "/swarm $ARGUMENTS", description: "..." },
    
    // Shortcuts
    "swarm-status": { template: "/swarm status", description: "..." },
    "swarm-plan": { template: "/swarm plan $ARGUMENTS", description: "..." },
    "swarm-agents": { template: "/swarm agents", description: "..." },
    "swarm-evidence": { template: "/swarm evidence $ARGUMENTS", description: "..." },
    "swarm-reset": { template: "/swarm reset --confirm", description: "..." },
    "swarm-turbo": { template: "/swarm turbo", description: "..." },
    // ... 40+ total commands
  };
}
```

### Available Commands

| Command | Description |
|---------|-------------|
| `/swarm status` | Show current pipeline state |
| `/swarm plan` | Display/edit plan |
| `/swarm plan <task>` | Add task to plan |
| `/swarm agents` | List all agents |
| `/swarm evidence` | Show task evidence |
| `/swarm evidence summary` | Aggregated evidence |
| `/swarm diagnose` | Run diagnostics |
| `/swarm preflight` | Pre-execution checks |
| `/swarm sync-plan` | Sync plan.json with plan.md |
| `/swarm benchmark` | Run benchmarks |
| `/swarm export` | Export session data |
| `/swarm archive` | Archive completed work |
| `/swarm curate` | Curate knowledge |
| `/swarm dark-matter` | Show hidden couplings |
| `/swarm close` | Close current task |
| `/swarm simulate` | Simulate execution |
| `/swarm analyze` | Analyze session |
| `/swarm clarify` | Ask clarifying questions |
| `/swarm specify` | Specify requirements |
| `/swarm promote` | Promote to next phase |
| `/swarm reset` | Reset pipeline |
| `/swarm rollback` | Rollback to checkpoint |
| `/swarm retrieve` | Retrieve archived work |
| `/swarm handoff` | Handoff to another agent |
| `/swarm turbo` | Enable turbo mode |
| `/swarm knowledge` | Query knowledge |
| `/swarm checkpoint` | Create checkpoint |
| `/swarm doctor` | Run self-diagnostics |

### Command Handler

```javascript
"command.execute.before": safeHook(commandHandler)

// commandHandler:
1. Parse "/swarm <subcommand> <args>"
2. Look up handler in COMMAND_REGISTRY
3. Execute with { directory, args, sessionID, agents }
4. Return result as Part[]
```

---

## 8. The "Tab Toggle" Mechanism

### How Agents Appear in OpenCode UI

**Dual-layer mechanism:**

1. **Plugin config hook** (Layer 1): Injects agent definitions into OpenCode's agent registry
2. **opencode.json** (Layer 2): Manually specifies which agents to show/disable

### Layer 1: Plugin Config Hook (Lines ~68127-68268)

```javascript
config: async (opencodeConfig) => {
  // Inject agents into OpenCode's agent registry
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = {};
  }
  
  // Object.assign MERGES agents (doesn't replace)
  Object.assign(opencodeConfig.agent, {
    architect: { name: "architect", mode: "primary", ... },
    coder: { name: "coder", mode: "subagent", ... },
    // ...
  });
  
  // Register /swarm command shortcuts
  opencodeConfig.command = { /* ... */ };
}
```

### Layer 2: opencode.json

```json
{
  "agent": {
    "architect": { "disable": true },
    "explore": { "disable": true },
    "general": { "disable": true },
    "spider": {
      "model": "0-opencode-zen/qwen3.6-plus-free",
      "description": "Spider orchestrator..."
    }
  },
  "plugin": ["hive-mind-plugin", "spider-agent"]
}
```

### Agent Mode Flags

| Mode | Appears in UI? | Use Case |
|------|----------------|----------|
| `"primary"` | YES - dropdown | Orchestrator agents user can select |
| `"subagent"` | NO - hidden | Delegated agents, internal only |
| `"all"` | YES - everywhere | Universal agents, @ autocomplete |

### Making Shark Agent Appear in UI

```javascript
config: async (opencodeConfig) => {
  // Inject shark agents
  opencodeConfig.agent = {
    ...opencodeConfig.agent,  // preserve existing
    
    // These appear in UI dropdown
    shark_micro: {
      name: "shark_micro",
      description: "Shark Micro Engineer — dual-brain micro coding",
      model: "0-deepseek/deepseek-chat",
      mode: "primary"  // <-- KEY: makes it appear in UI
    },
    
    shark_macro: {
      name: "shark_macro",
      description: "Shark Macro Engineer — 3-brain orchestration",
      model: "0-deepseek/deepseek-reasoner",
      mode: "primary"
    },
    
    // Hidden subagents for delegation
    shark_coder: {
      name: "shark_coder",
      model: "0-local-agent-models/Qwen2.5-Coder-7B-AWQ",
      mode: "subagent"  // Hidden from UI
    }
  };
  
  // Register slash commands
  opencodeConfig.command = {
    shark: { template: "/shark $ARGUMENTS" },
    "shark-toggle": { template: "/shark toggle" }
  };
}
```

---

## 9. Hook System Deep Dive

### Hook Creator Factories (20+ factories)

| Factory | Line | Purpose |
|---------|------|---------|
| `createKnowledgeCuratorHook` | ? | Extract lessons from retrospectives |
| `createSnapshotWriterHook` | ? | Persist state to .swarm/ |
| `createHivePromoterHook` | ? | Promote to Hive Mind |
| `createCompactionCustomizerHook` | 51657 | Inject context during compaction |
| `createDelegationGateHook` | ? | Enforce QA gates |
| `createDelegationSanitizerHook` | ? | Clean delegation messages |
| `createDelegationTrackerHook` | ? | Track delegation trajectory |
| `createPhaseMonitorHook` | ? | Monitor phase completion |
| `createPipelineTrackerHook` | ? | Track pipeline progress |
| `createSystemEnhancerHook` | ? | Enhance system prompt |
| `createToolSummarizerHook` | ? | Summarize tool outputs |
| `createCoChangeSuggesterHook` | ? | Suggest related file changes |
| `createDarkMatterDetectorHook` | ? | Detect hidden couplings |
| `createDelegationLedgerHook` | ? | Ledger of delegations |
| `createIncrementalVerifyHook` | ? | Incremental verification |
| `createKnowledgeInjectorHook` | ? | Inject knowledge into context |
| `createScopeGuardHook` | ? | File path restrictions |
| `createSelfReviewHook` | ? | Self-review capability |
| `createSlopDetectorHook` | ? | Detect low-quality output |
| `createSteeringConsumedHook` | ? | Track directive consumption |

### Hook Chain (tool.execute.after) - 16+ Sub-hooks

```javascript
"tool.execute.after": [
  // 1. Activity tracking
  activityTrackHook,
  
  // 2. Guardrails
  guardrailsHook,
  
  // 3. Delegation ledger
  delegationLedgerHook,
  
  // 4. Self-review
  selfReviewHook,
  
  // 5. Delegation gate
  delegationGateHook,
  
  // 6. Adversarial pattern detection
  adversarialPatternHook,
  
  // 7. Knowledge curation
  knowledgeCuratorHook,
  
  // 8. Steering consumed tracking
  steeringConsumedHook,
  
  // 9. Co-change suggesting
  coChangeSuggesterHook,
  
  // 10. Dark matter detection
  darkMatterDetectorHook,
  
  // 11. Snapshot writing (state persistence)
  snapshotWriterHook,
  
  // 12. Tool output summarization
  toolSummarizerHook,
  
  // 13. Slop detection
  slopDetectorHook,
  
  // 14. Incremental verification
  incrementalVerifyHook,
  
  // 15. Compaction service
  compactionServiceHook
]
```

### Experimental Hooks

| Hook | Purpose |
|------|---------|
| `experimental.chat.messages.transform` | Transform message history |
| `experimental.chat.system.transform` | Modify system prompt |
| `experimental.session.compacting` | Pre-compaction context injection |
| `experimental.text.complete` | Post-completion text processing |

---

## 10. Building Shark Agent Blueprint

### Architecture to Replicate

```
┌─────────────────────────────────────────────────────────────┐
│                    Shark Agent Plugin                        │
├─────────────────────────────────────────────────────────────┤
│  Plugin Entry (index.ts)                                     │
│  ├── Returns Hooks { agent, tool, config, ... }             │
│  └── Registers with OpenCode via config hook                │
├─────────────────────────────────────────────────────────────┤
│  Agents                                                      │
│  ├── shark_micro (PRIMARY) - orchestrator (dual-brain)     │
│  │   └── Delegates to subagents                            │
│  ├── shark_macro (PRIMARY) - 3-brain specialized           │
│  ├── shark_coder - implementation                          │
│  ├── shark_reviewer - correctness gate                     │
│  └── shark_test_engineer - verification                   │
├─────────────────────────────────────────────────────────────┤
│  Hooks                                                       │
│  ├── tool.execute.before - safety, scope, guardrails       │
│  ├── tool.execute.after - evidence, compaction             │
│  ├── chat.message - delegation tracking                     │
│  └── experimental.chat.system.transform - system prompt     │
├─────────────────────────────────────────────────────────────┤
│  Tools (10+)                                                │
│  ├── checkpoint, save_plan, declare_scope                  │
│  ├── evidence_check, phase_complete                        │
│  └── shark_*, evidence_* commands                          │
├─────────────────────────────────────────────────────────────┤
│  State (.shark/)                                            │
│  ├── plan.json, plan.md                                     │
│  ├── evidence/{taskId}/                                    │
│  └── telemetry.jsonl                                       │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Phase 1: Plugin Structure

```typescript
// src/index.ts
import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin';
import { z } from 'zod';

export const SharkAgentPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  // Initialize state
  const state = await initializeSharkState(input.directory);
  
  // Create agents
  const agents = createSharkAgents();
  
  // Create hooks
  const hooks = createSharkHooks(state);
  
  return {
    name: "shark-agent",
    agent: agents,
    tool: createSharkTools(state),
    config: createSharkConfigHook(agents),
    ...hooks
  };
};
```

#### Phase 2: Agent Definitions

```typescript
function createSharkAgents() {
  return {
    // Primary orchestrators (appear in UI)
    shark_micro: {
      name: "shark_micro",
      description: "Shark Micro Engineer — dual-brain (Thinker + Doer)",
      model: "0-deepseek/deepseek-chat",
      mode: "primary",
      system: sharkMicroSystemPrompt
    },
    shark_macro: {
      name: "shark_macro",
      description: "Shark Macro Engineer — 3-brain specialized",
      model: "0-deepseek/deepseek-reasoner",
      mode: "primary",
      system: sharkMacroSystemPrompt
    },
    
    // Subagents (hidden from UI)
    shark_coder: {
      name: "shark_coder",
      model: "0-local-agent-models/Qwen2.5-Coder-7B-AWQ",
      mode: "subagent"
    },
    shark_reviewer: {
      name: "shark_reviewer",
      model: "0-deepseek/deepseek-chat",
      mode: "subagent"
    }
  };
}
```

#### Phase 3: Config Hook

```typescript
function createSharkConfigHook(agents) {
  return async (opencodeConfig) => {
    // Inject agents into registry
    opencodeConfig.agent = {
      ...opencodeConfig.agent,
      ...agents
    };
    
    // Register commands
    opencodeConfig.command = {
      shark: { template: "/shark $ARGUMENTS" },
      "shark-toggle": { template: "/shark toggle" },
      "shark-mode": { template: "/shark mode $ARGUMENTS" }
    };
  };
}
```

#### Phase 4: Mechanical Enforcement Hooks

```typescript
function createSharkHooks(state) {
  return {
    "tool.execute.before": async (input, output) => {
      // 1. Safety stack check
      const safety = await safetyStack.check(input.tool, output.args);
      if (!safety.allowed) {
        throw new Error(`Safety blocked: ${safety.reason}`);
      }
      
      // 2. Scope guard
      scopeGuard.check(input.tool, output.args, state);
      
      // 3. Repetition detection
      guardrails.checkRepetition(input.tool, state);
    },
    
    "tool.execute.after": async (input, output) => {
      // 1. Evidence collection
      evidenceCollector.collect(input, output, state);
      
      // 2. Snapshot writing
      snapshotWriter.write(state);
      
      // 3. Compaction check
      compactionChecker.check(state);
    },
    
    "experimental.session.compacting": async (input, output) => {
      // Inject Shark-specific context before compaction
      output.context.push(
        `Shark State: ${JSON.stringify(state.summary)}`
      );
    }
  };
}
```

---

## 11. Gap Analysis

| Component | Spider Agent | Shark Agent (current) | Shark Agent (needed) |
|-----------|-------------|----------------------|---------------------|
| Plugin entry | Yes | Yes | Yes |
| `config` hook | Yes | **NO** | Yes |
| Agent definitions | 11 | **NONE** | 3-5 |
| `mode: "primary"` | Yes | N/A | Yes |
| `tool` registration | 35+ | 1 | 10+ |
| State persistence | `.swarm/` | Partial | `.shark/` |
| Mechanical enforcement | QA gates | Safety stack | 4-layer stack |
| Commands | 40+ | 0 | 10+ |
| Hooks (tool.before) | 5+ | 1 | 5+ |
| Hooks (tool.after) | 16+ | 0 | 10+ |

### Critical Missing Piece

The current `shark-agent-plugin/src/index.ts` **only registers a tool**, not agents:

```javascript
return {
  tool: {
    shark_toggle: tool({ ... })  // Only registers TOOL
  }
  // ❌ Missing: agent, config, other hooks
};
```

---

## Appendix: File Locations

| File | Location | Key Lines |
|------|----------|-----------|
| Spider Agent bundle | `~/.npm-global/lib/node_modules/spider-agent/dist/index.js` | 68,502 total |
| Plugin entry | Same | ~67880 |
| Agent creation | Same | ~44263-44355 |
| Config hook | Same | ~68127-68268 |
| Hook registration | Same | ~68269-68497 |
| Hook utilities | Same | ~15528, 15543 |
| OpenCode Plugin types | `~/OPENCODE_WORKSPACE/projects/shark-agent-plugin/node_modules/@opencode-ai/plugin/dist/` | - |

---

## Appendix: OpenCode Plugin SDK Types

```typescript
// Plugin type
type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>;

// PluginInput
interface PluginInput {
  client: ReturnType<typeof createOpencodeClient>;
  project: Project;
  directory: string;
  worktree: string;
  serverUrl: URL;
  $: BunShell;
}

// Hooks interface (complete)
interface Hooks {
  event?: (input: { event: Event }) => Promise<void>;
  config?: (input: Config) => Promise<void>;
  tool?: { [key: string]: ToolDefinition };
  auth?: AuthHook;
  "chat.message"?: ChatHook;
  "chat.params"?: ParamsHook;
  "chat.headers"?: HeadersHook;
  "permission.ask"?: PermissionHook;
  "command.execute.before"?: CommandHook;
  "tool.execute.before"?: ToolHook | ToolHook[];
  "tool.execute.after"?: ToolHook | ToolHook[];
  "shell.env"?: ShellEnvHook;
  "experimental.chat.messages.transform"?: MessagesTransformHook;
  "experimental.chat.system.transform"?: SystemTransformHook;
  "experimental.session.compacting"?: CompactingHook;
  "experimental.text.complete"?: TextCompleteHook;
  "tool.definition"?: ToolDefinitionHook;
  automation?: AutomationManager;
}
```

---

*Report compiled: 2026-04-01*
*Source: Compiled bundle analysis of opencode-swarm v6.x*
