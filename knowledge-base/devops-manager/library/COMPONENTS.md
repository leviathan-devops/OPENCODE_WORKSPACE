# DevOps Manager — Component Inventory

> Deep dive into each component of the Spider-Shark-Kraken stack

---

## 1. Spider Agent (Lead Orchestrator)

### Overview
Spider is the lead orchestrator for OpenCode multi-agent workflows. It replaces the "Architect" role. Spider plans, delegates, reviews, and coordinates worker agents without writing code directly.

### Properties
| Property | Value |
|----------|-------|
| Agent Name | `spider` |
| Former Names | `architect`, `shark-agent-v4`, `opencode-swarm` |
| Plugin Name | `spider-agent` |
| Session Prefix | `spider` |
| Source Directory | `~/agent-swarm/spider-agent/` |
| Entry Point | `~/.config/opencode/node_modules/spider-agent/dist/index.js` |

### Build Journey (40 Sessions)

| Phase | Sessions | Duration | Key Outputs |
|-------|----------|----------|-------------|
| Phase 1: Shark Agent Architecture | 8 | ~144h | Dual-brain AI, Safety Stack, KNOWLEDGE_BASE |
| Phase 2: Kraken Ecosystem | 6 | ~145h | Kraken Brain, Hive orchestrator |
| Phase 3: Agent Swarm & Orchestration | 4 | ~23h | Hub-and-spoke model, reviewer bug |
| Phase 4: OpenCode Integration | 4 | ~141h | GLM integration, VLLM setup |

### Authority Matrix

```
┌───────────┬────────────────┬──────────────────────────────────────────┐
│ Agent     │ Write Access   │ Restrictions                             │
├───────────┼────────────────┼──────────────────────────────────────────┤
│ spider    │ Full           │ Cannot write .swarm/plan.md, .swarm/    │
│           │                │ plan.json, generated zones               │
├───────────┼────────────────┼──────────────────────────────────────────┤
│ build     │ Full           │ No restrictions (native OpenCode agent) │
├───────────┼────────────────┼──────────────────────────────────────────┤
│ plan      │ Read-only      │ Cannot write any files                  │
├───────────┼────────────────┼──────────────────────────────────────────┤
│ coder     │ Limited        │ Only src/, tests/, docs/, scripts/;     │
│           │                │ blocked from .swarm/                    │
├───────────┼────────────────┼──────────────────────────────────────────┤
│ reviewer  │ Limited        │ Only .swarm/evidence/, .swarm/outputs/; │
│           │                │ blocked from src/                       │
├───────────┼────────────────┼──────────────────────────────────────────┤
│ unknown   │ Blocked        │ Must be in AGENT_AUTHORITY_RULES        │
└───────────┴────────────────┴──────────────────────────────────────────┘
```

### Critical Bug: Reviewer Sessions Idle Forever
- **Issue**: Task tool submissions stay idle indefinitely
- **Severity**: High
- **Workaround**: Use SME as temporary workaround

---

## 2. Shark Agent (Execution Engine)

### Overview
Shark is the execution engine with dual-brain architecture separating reasoning from execution.

### Dual-Brain Configuration

```
SHARK DUAL-BRAIN
├── MICRO ENGINEER (Free/Local)
│   ├── Thinker: DeepSeek Chat (API-based reasoning)
│   │   └── Used exclusively for planning, analysis, decision-making
│   ├── Executor: vLLM Qwen 2.5 Coder 7B AWQ
│   │   └── Lobotomized execution engine - zero-cost local
│   └── Fallback: Gemma 3 4B
│
└── MACRO ENGINEER (Paid/Cloud)
    ├── Primary Brain: GLM 5 (128K context window)
    ├── Advisory Brain: DeepSeek R1 (complex reasoning)
    └── Cost: ~$0.02-0.08 per task
```

### Safety Stack (4 Layers)

1. **Guardian** — Filesystem protection
   - Blocks: `/etc`, `/usr`, `~/.ssh/`, `/root/`, `/proc/`, `/sys/`
   - Zone-based: STRICT, BALANCED, PERMISSIVE, SANDBOX

2. **FirewallMesh** — 4 parallel firewalls
   - <50ms overhead
   - Parallel validation

3. **StagnationDetector** — Failure escalation
   - 3 identical failures → escalation to higher authority

4. **Workflow Enforcement** — SHARK workflow
   - PLAN → BUILD → TEST → VERIFY → SHIP
   - Brick-wall enforcement

### Plugin Versions

| Version | Location | Status |
|---------|----------|--------|
| v1 | `Shark Agent Plugin/v1/` | Basic integration |
| v2 | `Shark Agent Plugin/v2/` | Enhanced architecture |
| v3 | `Shark Agent Plugin/v3_hive_integration/` | Hive integration |

### Guardian Firewall Bug
- **Documented in**: `GUARDIAN_FIREWALL_FAILURE_LOG.md`
- **Severity**: Medium
- **Status**: Fix pending

---

## 3. Kraken Hive (Macro Orchestrator)

### Overview
Multi-agent swarm orchestration system with hub-and-spoke model.

### Components

| Component | Purpose |
|-----------|---------|
| Hub | Central orchestration point |
| Sisyphus | Single-task execution agent |
| Hephaestus | Build/compilation agent |
| Kraken Ultra | Enhanced variant |
| Kraken Brain | Dual-brain architecture for hive |

### Key Files

| File | Purpose |
|------|---------|
| `05_SISYPHUS_EXECUTION_WORKFLOW.md` | Sisyphus execution pattern |
| `03_INTEGRATION_POINTS.md` | Integration architecture |
| `KRAKEN_HIVE_CONTEXT.md` | Full context |

### Projects

| Project | Location | Status |
|---------|----------|--------|
| kraken-hive-engine | `projects/kraken-hive-engine/` | Built, `.venv` ready |
| hive-mind | `projects/hive-mind/` | OpenViking-based |

---

## 4. Hermes Agent (Context Keeper)

### Overview
2nd-brain system with long-term memory and Telegram bridge.

### Profile Structure

```
~/.hermes/profiles/
├── 2nd-brain/     ← This profile
├── coder/
├── debugger/
├── engineer/
├── researcher/
└── opencode-manager/
```

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| Sessions | `profiles/2nd-brain/sessions/` | All session JSON files |
| Context | `hermes-workspace/context/` | Shared context library |
| Synthesizer | `scripts/hermes-synthesizer.py` | Background daemon (v3) |
| Health Check | `scripts/health-check.sh` | Cron monitoring |

### Synthesizer Architecture (v3)

```
Sessions (CLI + Telegram JSON)
         │
         ▼
┌─────────────────────────────────────────┐
│      ABSORB PHASE (every 15 min)        │
│  • Scan sessions/ for new files         │
│  • Extract messages[].{role,content}    │
│  • Classify via regex                  │
│  • Write to category/YYYYMMDD_*.md     │
│  • Update bridge_state.json (dedup)    │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│     SYNTHESIS PHASE (every 4 hours)     │
│  ALGORITHMIC BY DEFAULT:               │
│  • Questions: regex "\?$"              │
│  • Code: regex "`([^`]+)`"            │
│  • URLs: regex "https?://\S+"          │
│  • Decisions: action verb patterns     │
│  • Deduplicate + format as Markdown    │
└─────────────────────────────────────────┘
         │
         ▼
   context/library/INDEX.md
```

### Key Metrics (v3)

| Metric | Model-First (v1/v2) | Algorithmic-First (v3) |
|--------|---------------------|------------------------|
| Model calls/synthesis | 1-3 | 0 |
| Synthesis time | 10-90s | <1s |
| Cost | $0.001-0.03 | $0 |
| Rate limit errors | Frequent | None |

---

## 5. Hive Mind (OpenViking)

### Overview
Shared context database enabling "hive mind" where all agents share context across sessions.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│  opencode session (any agent)                       │
│  Tools: memsearch, memread, membrowse, memcommit    │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│       OpenViking HTTP Server (localhost:1933)       │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
         viking://resources/hive-mind/shared/
         ├── workflows/    — SHARK artifacts
         ├── agents/       — Per-session context
         ├── memory/       — Cross-session memory
         ├── skills/       — Shared skill definitions
         └── projects/     — Project-specific context
```

### Tiered Context Loading (L0/L1/L2)

| Tier | Size | Purpose |
|------|------|---------|
| L0 | ~100 tokens | Quick retrieval summary |
| L1 | ~2k tokens | Decision-making |
| L2 | Full | Loaded on demand |

### Tools

| Tool | Purpose | Example |
|------|---------|---------|
| `memsearch` | Search shared context | `memsearch({query, target_uri, mode, limit})` |
| `memread` | Read from URI | `memread({uri, level: auto/abstract/overview/read})` |
| `membrowse` | Browse layout | `membrowse({uri, view: list/tree/stat})` |
| `memcommit` | Trigger extraction | `memcommit({})` |

### Projects

| Project | Location | Purpose |
|---------|----------|---------|
| OpenViking | `projects/OpenViking/` | Server source |
| hive-mind | `projects/hive-mind/` | Integration project |
| hive | `projects/hive/` | Main project |

### Shared Context Structure

```
viking://resources/hive-mind/shared/
├── README.md
├── workflows/
│   └── shark-enforcement.md     ← SHARK 5-step workflow
├── agents/
├── memory/
├── skills/
│   └── shark-enforcement.md     ← Shared skill definitions
└── projects/
```

---

## 6. OpenCode Plugin System

### Plugin Locations

| Plugin | Path |
|--------|------|
| Spider Agent | `~/.config/opencode/plugins/spider-agent/` |
| OpenViking Memory | `~/.config/opencode/plugins/openviking-memory.ts` |
| OpenViking Config | `~/.config/opencode/plugins/openviking-config.json` |

### Plugin Auto-Discovery
OpenCode automatically discovers plugins in `~/.config/opencode/plugins/`.

### Hermes Agent Plugin Build

```bash
cd ~/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin
bun install
bun run build.ts

# Latest build in v2.5-build/
ls v2.5-build/dist/
```

### Hook Architecture

The Spider Agent plugin integrates via OpenCode's hook system:
- `OPENCODE_PLUGIN_HOOK_ARCHITECTURE.md` — Full hook documentation
- `HOOKS/` directory — Hook definitions
- `AGENTS/` directory — Agent configurations
- `PERSPECTIVES/` directory — Perspective definitions
- `SKILLS/` directory — Skill definitions

---

## Component Communication

```
Leviathan (Human)
     │
     ├── Telegram ──► Hermes Gateway ──► 2nd-Brain Profile
     │                                    │
     │                                    └── hermes-synthesizer.py ──► hermes-workspace/
     │
     └── OpenCode CLI
              │
              ├── spider ──► spider-agent plugin
              │                  │
              │                  └──► Hive Mind (openviking)
              │
              ├── shark ──► shark-agent plugin
              │              │
              │              └──► Guardian Firewall
              │
              └── kraken ──► kraken-hive-engine
                              │
                              └──► Sisyphus / Hephaestus agents
```

---

*Last updated: 2026-04-02 20:15*
