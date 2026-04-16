# Architecture — Agent Identity System

## High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      OPENCODE SESSION                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AGENT HARNESS                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │   SOUL.md   │  │ IDENTITY.md │  │   EXECUTION.md  │  │  │
│  │  │  (Essence)  │  │   (Role)    │  │   (Behavior)   │  │  │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │  │
│  │         └────────────────┼──────────────────┘           │  │
│  │                          ▼                               │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │              IDENTITY INJECTOR                       │ │  │
│  │  │   (session.started hook or tab-toggle event)        │ │  │
│  │  └──────────────────────┬──────────────────────────────┘ │  │
│  └─────────────────────────┼───────────────────────────────┘  │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              AGENT CONTEXT (System Prompt)                ││
│  │  "You ARE the Kraken orchestrator. You are not a chatbot. ││
│  │   You are an execution engine with parallel processing..."  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## The 4-File Identity Pattern

Each agent role has a dedicated identity directory:

```
identity/
├── {role}.json           # Agent-to-model mapping (optional)
└── {role}/
    ├── SOUL.md          # WHO YOU ARE (core identity)
    ├── IDENTITY.md      # WHAT YOU DO (role definition)
    ├── EXECUTION.md     # HOW YOU WORK (behavior patterns)
    ├── SPIDER.md        # HOW YOU VERIFY (quality gates)
    └── TOOLS.md         # WHAT YOU CAN USE (tool access)
```

### File Purposes

| File | Purpose | Content |
|------|---------|---------|
| **SOUL.md** | Core identity | "You ARE a {role} agent. You are not..." |
| **IDENTITY.md** | Role definition | Expertise, working style, track record |
| **EXECUTION.md** | Behavior patterns | How to delegate, when to escalate |
| **SPIDER.md** | Quality enforcement | Gates, debug protocol, stagnation detection |
| **TOOLS.md** | Tool access | Available tools with descriptions |

---

## Key Architectural Decisions

### Decision 1: File-Based vs. Generated Identity

**Choice:** File-based identity (load from pre-written files)

**Why:** Generated identity is subject to hallucination and inconsistency. Pre-written files provide deterministic, reviewable identity that can be audited.

**Tradeoff:** Requires upfront authoring effort per agent role

---

### Decision 2: 4-File Structure vs. Single File

**Choice:** 4-file structure (SOUL, IDENTITY, EXECUTION, SPIDER)

**Why:** Separation of concerns allows focused reinforcement:
- SOUL = essence (rarely changes)
- IDENTITY = role (medium frequency)
- EXECUTION = behavior (changes with workflow)
- SPIDER = quality (changes with process)

**Tradeoff:** More files to maintain, but more targeted injection

---

### Decision 3: Hook-Based Injection vs. Tab-Toggle

**Choice:** Both, with hook as primary

**Why:**
- `session.started` hook = automatic on session init
- Tab-toggle event = reinforcement when user switches context

**Tradeoff:** Hook is cleaner but requires plugin support; tab-toggle is more explicit

---

### Decision 4: Per-Session vs. Persistent Identity

**Choice:** Per-session (with persistence for compaction recovery)

**Why:** Identity is session-scoped by design. Long sessions may need reinforcement via additional hook calls.

**Tradeoff:** Identity doesn't survive session death unless explicitly persisted

---

## Component Overview

| Component | Responsibility |
|-----------|---------------|
| **Identity Loader** | Reads identity files from disk |
| **Identity Injector** | Integrates identity into agent context |
| **Model Router** | Selects model based on identity/{role}.json |
| **Identity Cache** | Caches loaded identity for session |
| **Compaction Handler** | Persists identity during session compaction |

---

## Data Flow

```
1. Session Start
   └── Plugin loads → Reads identity/{role}/ directory
   └── Loads all .md files into memory
   └── session.started hook fires
   └── Identity Injector formats and injects into context

2. Agent Receives Task
   └── Reads task description
   └── Identity already in context → knows to delegate
   └── Uses spawn_shark_agent or run_parallel_tasks

3. Compaction Event
   └── Identity persisted to compaction survival docs
   └── Session recovers → Identity re-loaded
   └── Context continuity maintained
```

---

## The Spider/Agent-Swarm Pattern (Reference Implementation)

The Spider agent swarm implements this pattern successfully:

```
projects/agent-swarm-fork/identity/
├── spider-agent.json     # Model routing
├── coder/
│   ├── SOUL.md          # "You are a Shark software engineering agent..."
│   ├── IDENTITY.md      # "You are a Micro Engineer..."
│   ├── SPIDER.md        # Quality gates, debug protocol
│   └── TOOLS.md         # Tool access list
├── reviewer/
│   └── ...              # Same structure
├── lead/
│   ├── SOUL.md          # "You are a Shark software engineering agent..."
│   ├── IDENTITY.md      # "You are the Macro Engineer..."
│   └── SPIDER.md        # Orchestrator-specific quality gates
└── explorer/
    └── ...
```

**Result:** When user selects "Spider Architect" in GUI, agent KNOWS it's the orchestrator and delegates appropriately.

---

## The Kraken Problem (What Went Wrong)

```
kraken-agent/
├── (no identity/ directory)
└── src/
    └── index.ts        # No identity loading code
```

**What happened:** Kraken had the ORCHESTRATOR TOOLS but no ORCHESTRATOR IDENTITY. The agent defaulted to "I'll just do it myself" because it didn't know it was supposed to delegate.

---

## The Fix (Kraken v1.2+)

```
kraken-agent/
├── identity/
│   ├── KRAKEN.json
│   └── orchestrator/
│       ├── SOUL.md     # "You ARE the Kraken orchestrator..."
│       ├── IDENTITY.md # Role, brain architecture
│       ├── EXECUTION.md# How to delegate, parallel patterns
│       ├── SPIDER.md   # Quality gates
│       └── TOOLS.md    # Full tool access
└── src/
    └── index.ts        # + Identity loading on init
```

**Expected result:** Agent knows it's the Kraken orchestrator → automatically delegates via `spawn_shark_agent`