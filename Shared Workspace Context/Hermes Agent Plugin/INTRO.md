# INTRO.md — Hermes Agent Plugin Context Library

## Quick Orientation

This is the **build context library** for the Hermes Agent Plugin — an OpenCode plugin that implements Leviathan's 2nd-brain autonomous coding agent.

---

## What Is Hermes?

Hermes is a hub-and-spoke multi-agent orchestrator with:
- **14 specialized agents** (orchestrator + 13 subagents)
- **28 lifecycle hooks** for pipeline enforcement
- **6-phase workflow** (Brainstorm → Plan → Build → Review → Debug → Complete)
- **Graeme's 3-agent self-improving supervisor loop**
- **2nd-brain memory** injected every turn
- **Full/Lite model tiering** per agent

---

## What Is This Library?

This library contains everything a build team needs to construct Hermes from scratch:

```
Hermes Agent Plugin/
├── BUILD/              ← YOUR WORKSPACE
├── REFERENCE/          ← SPECS (ground truth)
├── SOURCE_DECODED/     ← REFERENCE IMPLEMENTATIONS
├── SKILLS/             ← AGENT SKILL DEFINITIONS
├── PLANS/              ← PHASE 0/1 OUTPUTS
├── TOOLS/              ← TOOL DEFINITIONS
├── HOOKS/              ← HOOK DEFINITIONS
├── AGENTS/             ← AGENT PROMPT DEFINITIONS
└── PERSPECTIVES/       ← CONTEXT FROM OTHER SYSTEMS
```

---

## Start Here

Read these files in order:

1. **`BUILD/MASTER_PROMPT.md`** — This file. What you're building and how to use this library.
2. **`BUILD/BUILD_START_HERE.md`** — Step-by-step implementation. Week 1 → Week 2 → Week 3.
3. **`BUILD/WEEKLY_SPRINT_PLAN.md`** — Current sprint goals and acceptance criteria.

---

## Key Constraints

1. **Plugin SDK**: `@opencode-ai/plugin` (v1.1.53) — must match interface
2. **Spider Agent is the reference** — copy patterns verbatim, then adapt
3. **Hook order matters** — guardrails first, knowledge injector last
4. **State machine is sacred** — phases advance in order only
5. **No subagent can approve its own output** — enforced by hooks

---

## Key Files

| File | Purpose |
|------|---------|
| `BUILD/MASTER_PROMPT.md` | This file — orientation |
| `BUILD/BUILD_START_HERE.md` | Step-by-step implementation |
| `REFERENCE/ARCHITECTURE.md` | Full 14-part spec (48KB) |
| `SOURCE_DECODED/PLUGIN_SDK_TYPES.md` | SDK type signatures |
| `SOURCE_DECODED/SPIDER_AGENT_FORENSIC.md` | Spider Agent patterns |

---

## What Was Synthesized

Hermes was built by reverse-engineering and synthesizing these systems:

| Source | What It Contributed |
|--------|-------------------|
| **Spider Agent** (68,504 lines) | Hook architecture, delegation gate, 21 hook factories, state machine |
| **Superpowers** (125k stars) | HARD-GATE brainstorm, no-placeholder planning, TDD iron law, 7-phase workflow |
| **Specialist Agent** (36 agents) | Full/Lite variants, @analyst, @ripple, @grill, verification protocol |
| **Aura Frog** (10 agents) | Memory heals itself, 3-tier compaction, framework packs |
| **mal_shaik** (7 secrets) | CLAUDE.md every turn, subagent cache, 3 exec models, permission cascade |
| **Graeme** (gkisokay) | 3-agent supervisor loop, 4-marker intent protocol |

---

## Verification Tests

After each sprint, run these tests:

1. **Brainstorm Gate**: "build a login system" → asks questions, does NOT code
2. **No-Placeholder Plan**: Plan has exact paths, actual code, no TBD
3. **TDD Enforcement**: Test file created BEFORE src file
4. **QA Gate**: reviewer + quality-reviewer both verdict before completion
5. **3-Strike Debugging**: 3 failures → @architect review triggered
6. **2nd-Brain Recall**: Session resume has prior context

---

## Directory Structure for Built Plugin

```
~/hermes-agent/                  # Plugin root (CREATE THIS)
├── package.json                  # @opencode-ai/plugin as peer dep
├── tsconfig.json
├── build.ts
├── src/
│   ├── index.ts                 # Plugin entry
│   ├── config/                  # Schema, loader, constants
│   ├── agents/                  # 14 agent prompts
│   ├── hooks/                   # 28 hooks
│   ├── tools/                   # 65+ tools
│   └── services/                # Supervisor, session-db
└── dist/
    └── index.js                 # Compiled plugin
```

---

## Where to Get Help

| Problem | Resource |
|---------|----------|
| Hook not firing | `SOURCE_DECODED/PLUGIN_SDK_TYPES.md` — check event name |
| Tool not registering | `SOURCE_DECODED/SPIDER_AGENT_STATE.md` — check tool pattern |
| Agent not routing | `AGENTS/AGENT_INDEX.md` — check agent name |
| Phase won't advance | `HOOKS/HOOK_INDEX.md` — check PHASE_TRANSITIONS |
| 2nd-brain not recalling | `TOOLS/TOOL_INDEX.md` — check knowledge tools |
