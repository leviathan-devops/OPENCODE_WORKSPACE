---
name: opencode-plugin-engineering
description: Build production-grade OpenCode plugins using Spider Agent patterns
category: software-development
tags: [opencode, plugin, spider-agent, hooks, tools]
layer: master
version: 2.0
---

# OpenCode Plugin Engineering — Master Skill

**Type**: Neural Pathway — T2 Consolidated
**Location**: `OPENCODE_WORKSPACE/Shared Workspace Context/Plugin Engineering/`
**Audience**: Plugin engineers building OpenCode plugins
**Prerequisite**: Understand OpenCode basics

---

## CRITICAL: Skill ≠ Plugin — Read First

> **SKILL.md does NOT make a plugin.**
> - **Skill** = `.md` file in `~/.hermes/skills/` → Hermes agent knowledge/context
> - **Plugin** = compiled `.js` bundle registered in `opencode.json` → OpenCode extensions
>
> You MUST build to `dist/index.js`. See `cases/SKILL_VS_PLUGIN_CASE_STUDY.md` for full analysis.

---

## Layered Architecture

```
Plugin Engineering/
├── SKILL.md                    ← YOU ARE HERE (entry point, ~300 lines)
├── PROPER_PLUGIN_AGENT_BUILD_CONTEXT.md ← Complete build context (~600 lines)
├── layers/
│   ├── layer-1-CORE.md          ← Full T1 neural pathway (~1770 lines)
├── references/
│   ├── HOOK_MAP.md             ← All hook types with signatures
│   ├── HOOK_ARCHITECTURE.md    ← Hook execution order, session state
│   ├── PARALLEL_PEER_BRAINS.md ← Multi-brain peer execution architecture
│   ├── tool-template.md        ← Tool implementation template
│   └── hook-template.md        ← Hook implementation template
├── cases/
│   ├── SKILL_VS_PLUGIN_CASE_STUDY.md  ← The failure/success analysis
│   └── SPIDER_AGENT_FORENSIC_REPORT.md ← Spider Agent internals
├── coding-subagents case study/ ← Agent plugin case study
└── QUICKSTART.md               ← Optional: 1-page quickstart
```

**Layer loading strategy:**
1. Start at `SKILL.md` (this file)
2. For deep dives, load `layers/layer-1-CORE.md`
3. For hook details, load `references/HOOK_MAP.md`
4. For debugging, load `references/HOOK_ARCHITECTURE.md`
5. For failure analysis, load `cases/SKILL_VS_PLUGIN_CASE_STUDY.md`

---

## Quick Access

### "I need to build a plugin from scratch — give me everything!"
```
PROPER_PLUGIN_AGENT_BUILD_CONTEXT.md
```
This is the comprehensive build context document with all first-hand knowledge on properly engineering OpenCode agent plugins that work.

### "What does a plugin look like?"
```
layers/layer-1-CORE.md → Sections 1-2
```

### "What hooks are available?"
```
references/HOOK_MAP.md
```

### "How do I build one?"
```
layers/layer-1-CORE.md → Section 6 (Tool Development)
references/tool-template.md
```

### "Why did my plugin fail?"
```
cases/SKILL_VS_PLUGIN_CASE_STUDY.md
```

### "How does Spider Agent work?"
```
cases/SPIDER_AGENT_FORENSIC_REPORT.md
```

---

## Minimal Plugin Shell

```typescript
import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin';
import { z } from 'zod';

export const MyPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  const state = await initializeState(input.directory);
  
  return {
    name: "my-plugin",
    tool: createTools(state),
    ...createHooks(state)
  };
};
```

---

## Tool Definition

```typescript
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';

const myTool = tool({
  description: "What this tool does",
  args: {
    requiredArg: z.string().describe("Description"),
    optionalArg: z.string().optional().describe("Optional"),
    enumArg: z.enum(["a", "b"]).describe("Enum")
  },
  execute: async (args, context) => {
    // context: sessionID, messageID, agent, directory, worktree, abort, metadata, ask
    return JSON.stringify({ result: "ok" });
  }
});
```

---

## Hook Quick Reference

| Hook | When | Blocking? | Use Case |
|------|------|-----------|----------|
| `tool.execute.before` | Pre-tool | Can block | Safety, validation |
| `tool.execute.after` | Post-tool | No | Evidence, tracking |
| `command.execute.before` | Pre-command | Can block | Command interception |
| `chat.message` | On message | Can block | Delegation, routing |
| `chat.params` | Pre-LLM | No | Parameter tuning |
| `experimental.session.compacting` | Pre-compact | No | Context injection |

**Experimental hooks:**

| Hook | Purpose |
|------|---------|
| `experimental.chat.messages.transform` | Transform message history |
| `experimental.chat.system.transform` | Enhance system prompt |
| `experimental.session.compacting` | Inject context before compaction |

---

## State Directory Structure

```
.{plugin-name}/
├── state.json              # Current state snapshot
├── plan.md                 # Execution plan
├── evidence/               # QA evidence
├── knowledge/              # Learned patterns
├── checkpoints/            # Git-based snapshots
└── delegation-ledger.json  # Delegation history
```

---

## Hook Chain Composition

```typescript
"tool.execute.before": [
  sessionStateHook,      // 1. Ensure session state exists
  safetyCheckHook,       // 2. Safety validation
  scopeGuardHook,         // 3. Scope enforcement
  repetitionCheckHook,    // 4. Repetition detection
  activityTrackHook       // 5. Activity logging
]
```

---

## Hub-and-Spoke Orchestration

```
                    ┌─────────────────┐
                    │   architect     │ ◄── mode: "primary"
                    │  (orchestrator) │
                    └────────┬────────┘
                             │ delegates
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    coder      │    │   reviewer    │    │test_engineer │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## Build & Register

```bash
# Build
cd ~/OPENCODE_WORKSPACE/plugins/<plugin-name>
bun install
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Result: dist/index.js
```

**Registration in opencode.json:**
```json
{
  "plugin": [
    "file:///path/to/plugins/my-plugin/dist/index.js"
  ]
}
```

---

## Common Pitfalls

1. **SKILL.md ≠ Plugin** — Build to `dist/index.js`
2. **Hook key typos** — Use exact: `tool.execute.before`, not `toolBefore`
3. **Blocking in after hooks** — Use before hooks to block
4. **Missing state init** — Initialize in plugin function, not hooks
5. **No bundle** — OpenCode needs `dist/index.js`, not TypeScript source

---

## Debugging Checklist

### Hook Not Firing?
1. Check execution order
2. Check hook key exact match
3. Verify plugin in `opencode.json`
4. Check `Promise<void>` return

### Agent Blocked?
1. Run `spiderState.activeAgent.get(sessionId)`
2. Check `AGENT_AUTHORITY_RULES`
3. Verify vanilla agents have full access

### Model Fallback Issues?
1. Check `lastModelResponseTime` updating
2. Verify timeout threshold (default 3 min)
3. Check `fallback_models` array

---

## Verification

```bash
# Check plugin loads
opencode --print-logs --agent default "test"

# Should see:
# service=plugin path=.../dist/index.js loading plugin
# service=tool.registry status=started
```

---

## Working Plugin Examples

| Plugin | Path | Notes |
|--------|------|-------|
| spider-agent | `OPENCODE_WORKSPACE/plugins/spider-agent` | Directory auto-resolve |
| coding-subagents | `OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js` | Explicit .js |
| hive-mind-plugin | `Hive Mind Plugin/v4/hive-mind-plugin.ts` | TypeScript |
| hermes-agent-plugin | `Hermes Agent Plugin/v2-build/dist/index.js` | Explicit .js |

---

## Deep Dive Paths

### Path 1: Full Engineering (Start Here → Layer 1)
```
SKILL.md → layers/layer-1-CORE.md → references/HOOK_MAP.md
```

### Path 2: Hook Mastery
```
SKILL.md → references/HOOK_MAP.md → references/HOOK_ARCHITECTURE.md
```

### Path 3: Troubleshooting
```
SKILL.md → cases/SKILL_VS_PLUGIN_CASE_STUDY.md → cases/SPIDER_AGENT_FORENSIC_REPORT.md
```

### Path 4: Tool Implementation
```
SKILL.md → references/tool-template.md → cases/SPIDER_AGENT_FORENSIC_REPORT.md
```

---

## Related Skills

- `subagent-driven-development` — Multi-agent orchestration
- `systematic-debugging` — Debug plugin issues
- `claude-code` — Delegate to Claude Code during build

---

## Recent Updates (2026-04-07)

### Tab Toggle Plugin Docs Added
```
tab-toggle-plugin-docs/
├── Agent_Tab_Toggle_Config_Callback_SOLVED.md    ← Critical fix for config callback pattern
├── BUILD_AGENT_WRITE_BLOCKING_FAILURE_DEBUG_LOG.md ← Write blocking failures
├── BUILD_DEBUG_LOG.md                           ← General build debugging
├── OPENCODE_PLUGIN_AGENT_TAB_TOGGLE.md          ← v2.3.2 hermes version
├── TAB_TOGGLE_ERROR_LOG_V2.md                   ← Error patterns
└── TAB_TOGGLE_FIX.md                            ← Fix procedures
```

### Shark/Manta Plugin Conflict Audit Added
```
shark-manta-plugin-conflict-audit.md  ← Cross-agent activation bug analysis
```

### Key Lessons from Shark/Manta Split

**The critical insight documented in shark-manta-plugin-conflict-audit.md:**

1. **Plugins register global hooks** — ALL hooks fire for ALL sessions
2. **Spider uses session-scoped state** — `spiderState.activeAgent.get(sessionID)` to track which agent owns each session
3. **Shark/manta hooks lack agent filtering** — they fire regardless of which agent is active
4. **Fix pattern**: Either filter by tool prefix OR track active agent per session like Spider does

**See:** `shark-manta-plugin-conflict-audit.md` for full analysis

### Cross-Plugin Isolation Principles

| Principle | Implementation |
|-----------|----------------|
| State must be isolated | Each plugin has its own state store instance |
| Hooks must filter | Check `sessionID` or `activeAgent` before acting |
| Tools must be scoped | Tool names should have agent prefix (`manta-*`, `shark-*`) |
| No global pollution | Don't use shared module-level singletons |
| Separate dist directories | Each plugin builds to its own `dist/` |

---

## v4.1 Boilerplate — isVanillaAgent Fix Pattern

The v4.1 boilerplate was created specifically to fix hermes-spider hook conflicts.

**Key Files:**
```
v4.1-boilerplate-source/
├── agent-awareness.ts    ← isVanillaAgent() and isMyAgent() patterns
├── safe-hook.ts          ← Mandatory hook wrapper with agent filtering
├── hook-context.ts       ← Session/agent context utilities
├── README.md             ← Explains the hermes-spider conflict cause
└── HOOK_ARCHITECTURE.md  ← Hook execution order and architecture
```

**The Core Problem It Solved:**
- v4.0 hooks fired for ALL agents (including vanilla OpenCode agents like `plan`, `build`)
- This corrupted vanilla agents with plugin context
- Hermes hooks and Spider hooks clashed when both loaded

**The v4.1 Solution:**
```typescript
// Every hook MUST start with agent check
const myHook = safeHook(async (input, output, ctx) => {
  if (!ctx.isMyAgent()) return;  // MANDATORY FIRST CHECK
  // Your hook logic here
}, { agentFilter: [...], ... });
```

**Read this first:**
`v4.1-boilerplate-source/README.md` — Sections "The Core Problem (v4.0)" and "The v4.1 Solution"

**The isVanillaAgent function:**
```typescript
const VANILLA_AGENTS = new Set(['plan', 'build', 'general', 'explore']);

isVanillaAgent(agentName: string | undefined): boolean {
  return VANILLA_AGENTS.has(agentName ?? '');
}
```

**Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/v4-boilerplate-plugin-factory/src/v4.1/`

---

## Critical Docs: Hermes-Spider Hook Conflict (2026-04-04)

### The Key Document
```
hermes-context-spillover-fix.md  ← THE DOC YOU ASKED ABOUT
```

**This is the exact doc** that captured the hermes-spider hook conflict with live proof during the fix process.

### Also Added
```
CROSS-PLUGIN-ARCHITECTURE-AUDIT.md  ← Comprehensive cross-plugin architecture analysis
```

### What hermes-context-spillover-fix.md Documents

| Section | Content |
|---------|---------|
| Executive Summary | 26 hooks running for ALL agents without agent checks |
| Hook Spillover Matrix | Which hooks affected which agents |
| Live Proof | While editing hook files, old dist actively blocked edits with `[HARD-GATE BLOCKED]` messages |
| All Fixes Applied | Complete list of 26 guards added |
| Isolation Test Results | Verified fix with vanilla agents |

### Key Insight From The Doc

**The bug:** Hermes Agent Plugin's hooks ran for ALL agents including vanilla (`plan`, `build`, `general`, `explore`).

**Live proof:** While fixing the hooks, the OLD dist (still loaded in running OpenCode) actively blocked the edits:
```
[DEBUGGING SPIRAL DETECTED] Same tool (edit) called 5 times
[HARD-GATE BLOCKED] You are in the BRAINSTORM phase. No implementation is permitted.
[ANTI-RATIONALIZATION] You claimed completion without showing verification.
```

**The fix pattern:** Add `isHermesAgent()` checks to all 26 hooks.
