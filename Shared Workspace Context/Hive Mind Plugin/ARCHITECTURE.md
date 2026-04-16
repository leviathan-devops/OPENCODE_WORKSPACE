# Hive Mind OS — Architecture Specification

**Version:** 1.0
**Date:** 2026-03-31
**Status:** Active Build

---

## Executive Summary

Hive Mind OS is a distributed AGI agent orchestration system built on three pillars: **OpenCode** (mandatory execution engine for all workers), **OpenViking** (tiered semantic context database), and **Agent Swarm** (task delegation and swarm coordination). The system achieves persistent consciousness across sessions through bidirectional memory flow between all three systems, enabling agents to remember, learn, and compound knowledge indefinitely.

**Goal:** Build an AGI brain that achieves real-time awareness of everything that has led to where it is now, with pattern recognition from all historical session data, where the most relevant context is loaded dynamically via semantic search.

---

## Core Systems

### 1. OpenCode — Mandatory Agent Engine

**Role:** The sole execution engine for all worker agents. Every task, from coding to investigation, flows through OpenCode sessions.

**Why mandatory:** All agents — Spider Lead, Spider Worker, Kraken, or any new agent — delegate to OpenCode for actual implementation work. OpenCode provides the tool layer (edit, write, bash, task), permission enforcement, session isolation, and SQLite-backed message history.

**Database:** `/home/leviathan/.local/share/opencode/opencode.db`

| Table | Count | Purpose |
|-------|-------|---------|
| session | 240 | Session metadata, titles, parent_id chains |
| message | 13,355 | User prompts, assistant responses |
| part | 47,636 | Tool calls, text streams, reasoning traces, errors |

**Session Categories:**
- `architecture` — OpenCode setup, plugin config, MCP integration
- `build` — Implementation, coding, testing
- `investigation` — Codebase exploration, forensic analysis
- `orchestration` — Agent delegation, swarm coordination
- `failure` — Permission blocks, crashes, errors
- `gold_standard` — Space Invaders, Agent Build Logic Chain
- `integration` — GLM, Qwen, DeepSeek, OpenViking integration

**Noise Sessions (to DELETE from opencode.db):**
- Titles matching: `^2\+2`, `calculation`, `test message` (with < 3 messages)

**Key Files:**
- `~/.config/opencode/opencode.json` — MCP servers, plugins, agent definitions
- `~/.config/opencode/plugins/` — Plugin symlinks (hive-mind, spider-swarm, spider-agent-v1)

### 2. OpenViking — Context Database

**Role:** Tiered semantic memory with L0/L1/L2 context loading. The brain's long-term memory with filesystem paradigm (`viking://` URIs).

**Server:** `localhost:1933` (v0.2.16.dev3)
**Embedding Model:** DeepSeek `text-embedding-3-small` (1536 dim)
**VLM:** DeepSeek Chat
**Workspace:** `/home/leviathan/openviking_workspace/`
**Primary URI:** `viking://resources/hive-mind/shared/`

**Tiered Context Loading:**
```
L0 (Abstract): ~100 tokens — quick relevance check
L1 (Overview): ~2k tokens — understand structure and key points
L2 (Details): Full content — load on demand
```

**Target URI Structure:**
```
viking://resources/hive-mind/shared/
├── knowledge/           # Synthesized T2 macro contexts (build output)
├── sessions/            # Per-session T1 overviews (real-time)
├── swarm/               # Agent Swarm live memory (bidirectional sync)
├── skills/              # Spider enforcement rules
├── workflows/           # Active build workflows
├── agents/              # Per-session agent context
└── memory/             # Cross-session memory
```

### 3. Agent Swarm — Task Orchestration

**Role:** Lead/worker orchestration, task delegation, cross-agent messaging, scheduling.

**API Server:** `localhost:3013` (v1.57.0)
**API Key:** via `${AGENT_SWARM_API_KEY}` environment variable

**Registered Agents:**
| Agent | Role | Status | Capacity |
|-------|------|--------|---------|
| Spider Lead | Lead | offline | 0/2 |
| Spider Worker | Worker | idle | 0/3 |
| Events Test Agent (×4) | Worker | idle | 0/1 each |

**Memory Tools:**
- `agent_swarm_memory_search` — Search swarm's compounding memory
- `agent_swarm_memory_get` — Retrieve specific memory entry
- `agent_swarm_inject_learning` — Push learnings into another agent's memory

**Identity Files (per agent):**
- `SOUL.md` — Persona, values, behavioral directives
- `IDENTITY.md` — Expertise, working style, quirks
- `HEARTBEAT.md` — Periodic checklist (30-min interval)

---

## Neural Pathway Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  OPENCODE SESSION (any agent: Spider Lead, Spider Worker, Kraken)      │
│                                                                     │
│  Tools: memsearch, memread, membrowse, memcommit                    │
│       + hive_context, hive_status, hive_remember                    │
│       + all native OpenCode tools (edit, write, bash, task, etc.)    │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ opencode.db (240 sessions)                                   │   │
│  │ • session: metadata, parent_id, permission, summary_diffs     │   │
│  │ • message: role, summary, agent, model                        │   │
│  │ • part: reasoning, tool calls, text, errors                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼ [Phase 1: ETL Pipeline]               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ session_extractor.py                                         │   │
│  │ • Extracts 240 sessions from opencode.db                     │   │
│  │ • Filters + DELETES noise ("2+2 calculation", etc.)         │   │
│  │ • Classifies into 7 categories                               │   │
│  │ • Outputs: extracted_sessions.jsonl                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼ [Phase 2: Synthesizer]                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ session_synthesizer.py (MiniMax M2.7)                     │   │
│  │ • Reads extracted_sessions.jsonl                            │   │
│  │ • Generates T2 Macro Context per session                   │   │
│  │ • Organizes into AGI_Neural_Pathways/T2_SYNTHESIZED/       │   │
│  │   • architecture/, build/, investigation/, orchestration/  │   │
│  │   • failures/, gold_standard/, integration/                │   │
│  │   • BREAKTHROUGHS + PATTERNS + FAILURE_MODES captured       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼ [Phase 3: OpenViking Loader]        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ openviking_loader.py                                       │   │
│  │ • Bulk ingests T2_SYNTHESIZED/*.md into OpenViking         │   │
│  │ • URI: viking://resources/hive-mind/shared/knowledge/      │   │
│  │ • L0 abstracts auto-generated by OpenViking tiered loading │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  HIVE MIND PLUGIN (real-time bridge)                                │
│                                                                     │
│  Tools:                                                             │
│  • memsearch — semantic search across all OpenViking memory         │
│  • memread — read specific URI (L0/L1/L2 loading)                  │
│  • membrowse — filesystem-style browsing of URI tree                │
│  • memcommit — trigger immediate memory extraction                  │
│  • memread_session (NEW) — read session from opencode.db by ID      │
│  • memlink_parent (NEW) — link session to parent in OpenViking      │
│                                                                     │
│  Auto-sync:                                                         │
│  • On session end (20min inactivity) → generate T1 overview         │
│  • Write to viking://resources/hive-mind/shared/sessions/{id}/     │
│  • Pattern detection: breakthroughs auto-tagged to knowledge/          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT SWARM (bidirectional sync)                                   │
│                                                                     │
│  Swarm → OpenViking:                                                │
│  • send_task → writes task context to swarm/tasks/{id}/             │
│  • store_progress → writes result summary                          │
│  • inject_learning → writes to swarm/learnings/{id}/                │
│  • agent joins → writes identity to swarm/agents/{id}/             │
│  • task fails → writes failure pattern to swarm/failures/{id}/     │
│                                                                     │
│  OpenViking → Swarm:                                                │
│  • agent_swarm_memory_search → queries BOTH swarm + OpenViking      │
│  • OpenViking at viking://resources/hive-mind/shared/knowledge/     │
│                                                                     │
│  OpenCode Harness Adapter (Phase 4):                                 │
│  • Spider Lead delegates to OpenCode via OpenCodeAdapter             │
│  • OpenCode sessions become swarm workers                            │
│  • Timeout: 30 minutes per task                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Historical Memory Flow (One-Time ETL)
```
opencode.db (240 sessions)
    → session_extractor.py (filter + classify + DELETE noise)
    → extracted_sessions.jsonl (~150 meaningful sessions)
    → session_synthesizer.py (MiniMax M2.7, T2 generation)
    → T2_SYNTHESIZED/ (7 category directories)
    → openviking_loader.py (bulk ingest)
    → OpenViking: viking://resources/hive-mind/shared/knowledge/
```

### Real-Time Memory Flow (Ongoing)
```
OpenCode session ends (20min inactivity)
    → HiveMindPlugin auto-commit
    → T1 overview generated (title, category, tool count, outcome, breakthrough?)
    → OpenViking: viking://resources/hive-mind/shared/sessions/{id}/
    → Session index updated
```

### Query Flow (Real-Time)
```
Agent: "memsearch({ query: "how did we handle permission denied errors" })"
    → OpenViking semantic search (L0/L1/L2 tiered)
    → Top relevant contexts returned (T1 overviews)
    → Agent loads T1 for context, T2 for details on demand
```

### Swarm Memory Flow (Bidirectional)
```
Agent Swarm event (task created/completed/failed)
    → Sync rules fire
    → OpenViking updated at swarm/{category}/{id}/

agent_swarm_memory_search query
    → Agent Swarm memory (priority)
    → OpenViking knowledge/ (secondary)
    → Results merged by relevance
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| OpenCode mandatory for all workers | Consistent tool layer, session isolation, SQLite persistence |
| MiniMax M2.7 for synthesis | 1M token context, already available via API |
| DeepSeek embeddings only | Chinese models preferred (MiniMax, GLM, DeepSeek, Qwen); exceptions: Nemotron, Gemini for grunt work |
| 20-minute session end timer | Balance between responsiveness and not committing half-finished sessions |
| 30-minute OpenCode task timeout | Long enough for complex builds, short enough to recover from crashes |
| DELETE noise sessions from opencode.db | Keep database clean, meaningful sessions only |
| Archive old knowledge base files | Preserve history, don't lose context |
| L0/L1/L2 tiered loading | Token efficiency: cheap L0 for relevance check, L1 for understanding, L2 for details |
| `viking://resources/hive-mind/shared/` as primary URI | Existing structure, already wired into HiveMindPlugin |

---

## Directory Structure

```
/home/leviathan/OPENCODE_WORKSPACE/
├── knowledge-base/
│   ├── AGI_Neural_Pathways/               # [BUILD OUTPUT]
│   │   ├── T2_SYNTHESIZED/
│   │   │   ├── architecture/              # OpenCode forensics, MCP, plugin analysis
│   │   │   ├── build/                    # Build workflow sessions
│   │   │   ├── investigation/           # Forensic analysis sessions
│   │   │   ├── orchestration/           # Swarm coordination sessions
│   │   │   ├── failures/                # Error and crash patterns
│   │   │   ├── gold_standard/            # Space Invaders, Agent Build Logic Chain
│   │   │   │   ├── SPACE_INVADERS.md    # 13-agent swarm execution breakdown
│   │   │   │   └── AGENT_BUILD_LOGIC.md # Perfect single-agent dual-brain breakdown
│   │   │   └── integration/              # GLM, Qwen, DeepSeek, OpenViking
│   │   └── INDEX.md
│   └── ARCHIVE_PRE_NEURAL_PATHWAYS/       # [ARCHIVED]
│       ├── INDEX.md
│       ├── SPIDER_FRANKENSTEIN_COMPLETE_CONTEXT.md
│       └── Shared Macro Context/
├── tools/
│   └── neural-pathways/                   # [BUILD OUTPUT]
│       ├── session_extractor.py
│       ├── session_synthesizer.py
│       ├── openviking_loader.py
│       ├── session_monitor.py
│       ├── extracted_sessions.jsonl
│       └── monitor_state.json
└── Shared Workspace Context/
    └── Hive Mind Integration/
        ├── ARCHITECTURE.md               # This document
        ├── 00_OVERVIEW.md
        ├── 01_STATUS.md
        └── BUILD_PLAN.md                 # Execution checklist

/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/
└── src/providers/
    ├── opencode_adapter.ts               # [BUILD OUTPUT]
    └── opencode_session.ts               # [BUILD OUTPUT]

/home/leviathan/OPENCODE_WORKSPACE/projects/hive-mind/plugin/src/
└── index.ts                             # [ENHANCED] memread_session, memlink_parent
```

---

## Verification Checklist

- [ ] `python3 session_extractor.py` → `extracted_sessions.jsonl` with ≥150 sessions, noise deleted from db
- [ ] `python3 session_synthesizer.py` → `T2_SYNTHESIZED/` with all 7 categories
- [ ] `python3 openviking_loader.py` → zero errors, `ov tree` shows knowledge/
- [ ] `memsearch({ query: "permission evaluation" })` → forensic analysis as top result
- [ ] `memsearch({ query: "space invaders build" })` → gold standard session
- [ ] `memread_session({ session_id: "ses_xxx", level: "overview" })` → T1 for any session
- [ ] `ov tree viking://resources/hive-mind/shared/` → clean: knowledge/, sessions/, swarm/, skills/
- [ ] OpenCode adapter registered in agent-swarm (ProviderFactory includes "opencode")
- [ ] New session auto-commits T1 to OpenViking within 20 minutes of end
- [ ] `agent_swarm_memory_search` returns from both Agent Swarm and OpenViking

---

## Model Inventory & Usage Policy

### Model Registry

| Model | Context | Cost | Use For |
|-------|---------|------|---------|
| **MiniMax M2.7** | 200k | Paid | Primary synthesis engine — ALL synthesis and reasoning |
| **Qwen 3.6 Plus** | 1M | FREE (OpenCode Zen) | Intelligent tasks anywhere — DO NOT RELY ON (rate limit = all Zen models locked out) |
| **DeepSeek V3** | 64k | FREE (OpenRouter, 1000 RPD) | Intelligence tasks requiring DeepSeek reasoning without API cost |
| **Gemini 2.5 Flash** | 1M | FREE (OpenRouter) | Grunt work — stateless bulk tasks, ETL, data processing |
| **GLM-5** | 128k+ | Paid | Mechanical grunt work — heavy lifting that needs power |
| **OmniCoder 9B** | 256k | FREE (local, 0 cost) | Local grunt work — multi-agent spawnable, free compute |
| **DeepSeek Chat** | 64k | Paid (API) | VLM for OpenViking embeddings + specific reasoning tasks |

### Usage Rules (in priority order)

**Tier 0 — ALWAYS use first:**
- **OmniCoder 9B (local)** — Zero token cost, multi-agent spawnable. Use for ANY grunt work: ETL pipelines, bulk processing, data transformation, session extraction. FREE COMPUTE IS KING.

**Tier 1 — Primary intelligence:**
- **MiniMax M2.7** — Use for ALL synthesis: T2 macro context generation, architectural reasoning, pattern analysis, session synthesis. This is the brain.
- **DeepSeek V3 (OpenRouter)** — When you need DeepSeek intelligence but have no API budget. Free via OpenRouter with 1000 requests/day.

**Tier 2 — When available:**
- **Qwen 3.6 Plus (OpenCode Zen)** — 1M context, free, intelligent. Use for high-context intelligent tasks when available. WARNING: Rate limiting on Zen locks out ALL Zen models simultaneously. Do not build workflows that DEPEND on it.

**Tier 3 — Paid / Reserved:**
- **GLM-5** — Mechanical grunt work that needs power. Clear build workflow from architect required.
- **DeepSeek API** — Specific reasoning tasks requiring DeepSeek when OpenRouter quota exhausted.

### What NOT to use:
- Claude — not preferred, cost prohibitive for volume work
- GPT-4o — not preferred, cost prohibitive
- Any non-Chinese model for synthesis — not preferred

### Model Routing Logic

```
Task arrives → 
  Is it grunt work? → YES → OmniCoder 9B (local, free)
  Is it grunt work? → NO →
    Need 1M context deep scan/search? → Gemini 2.5 Flash (free OpenRouter)
    Need DeepSeek intelligence + no API budget? → DeepSeek V3 (OpenRouter, free)
    Need general synthesis? → MiniMax M2.7
    Have clear build workflow + need power grunt? → GLM-5
    High context + available + not relied upon? → Qwen 3.6 Plus (Zen)
```

### Model-Specific Best Uses

| Model | Best Use Case |
|-------|--------------|
| OmniCoder 9B | ETL pipelines, bulk processing, session extraction, data transformation |
| MiniMax M2.7 | T2 synthesis, architectural reasoning, pattern analysis, session synthesis |
| DeepSeek V3 (OpenRouter) | DeepSeek reasoning without API cost |
| Gemini 2.5 Flash | 1M context deep scans, searching large codebases, document analysis |
| GLM-5 | Mechanical grunt work with clear build workflow, heavy lifting |
| Qwen 3.6 Plus (Zen) | High-context intelligent tasks when Zen is available |

### Critical Warning: OpenCode Zen Rate Limiting

Qwen 3.6 Plus via OpenCode Zen shares rate limit pools across ALL Zen models. When Zen rate limits trigger:
- ALL Zen models lock out simultaneously
- Qwen 3.6, Gemini via Zen, etc. — all unavailable
- Only non-Zen models remain available

Use Zen models opportunistically. Never build critical paths that DEPEND on Zen availability.

---

## Build Sequence

```
PHASE 1: ETL Pipeline
├── 1.1  session_extractor.py — extract + classify + DELETE noise
├── 1.2  Run extractor → extracted_sessions.jsonl
└── 1.3  VERIFY: ≥150 sessions, noise deleted from opencode.db

PHASE 2: Synthesis
├── 2.1  session_synthesizer.py — T2 generation with MiniMax M2.7
├── 2.2  Run synthesizer → T2_SYNTHESIZED/ (7 categories)
├── 2.3  Gold standard sessions get extra breakdown treatment
└── 2.4  VERIFY: All categories populated, breakthrough patterns captured

PHASE 3: OpenViking Ingest
├── 3.1  openviking_loader.py — bulk ingest T2_SYNTHESIZED/*
├── 3.2  Delete old default workspace data (keep shared/ only)
└── 3.3  VERIFY: ov tree shows clean knowledge/ structure

PHASE 4: OpenCode Harness Adapter
├── 4.1  opencode_adapter.ts — ProviderAdapter implementation
├── 4.2  opencode_session.ts — session wrapper with event streaming
├── 4.3  Wire into provider factory (index.ts)
├── 4.4  Update Dockerfile with OpenCode CLI + workspace mount
└── 4.5  VERIFY: ProviderFactory("opencode") returns OpenCodeAdapter

PHASE 5: HiveMindPlugin Enhancement
├── 5.1  Add memread_session tool (read session from opencode.db)
├── 5.2  Add memlink_parent tool (trace delegation chains)
├── 5.3  Enhance auto-commit: T1 on 20min inactivity, breakthrough tagging
└── 5.4  VERIFY: New session commits T1 within 20min of end

PHASE 6: Session Monitor Daemon
├── 6.1  session_monitor.py — polls opencode.db every 60s
├── 6.2  Track session time_updated, generate T1 on 20min inactivity
├── 6.3  Write to viking://resources/hive-mind/shared/sessions/{id}/
└── 6.4  Start as background daemon

PHASE 7: Swarm ↔ OpenViking Sync
├── 7.1  Configure agent_swarm_* events → OpenViking writes
├── 7.2  Wire OpenViking as secondary source for agent_swarm_memory_search
└── 7.3  VERIFY: bidirectional memory flow operational
```

---

**This document is the source of truth for the Hive Mind OS architecture.**
**Any changes to the architecture must update this document first.**
