# Spider Agent — Context Library

**Version:** 2.1 (Phase 5 Complete, Phase 7 Documented)
**Date:** 2026-04-01
**Orchestrator:** `spider` (formerly `architect`)
**Plugin:** `spider-agent` (formerly `shark-agent-v4` / `opencode-swarm`)

---

## Identity

The Spider agent is the lead orchestrator for OpenCode multi-agent workflows. It replaces the "Architect" role. The Spider plans, delegates, reviews, and coordinates worker agents (coder, reviewer, test_engineer, sme, etc.) without writing code directly.

### Key Properties
- **Orchestrator name:** `spider`
- **Agent prefix in sessions:** `spider`
- **Plugin entry point:** `~/.config/opencode/node_modules/spider-agent/dist/index.js`
- **Source directory:** `~/agent-swarm/spider-agent/`

### Authority Rules
| Agent | Write Access | Restrictions |
|-------|-------------|--------------|
| `spider` | Full (except .swarm/plan files) | Cannot write `.swarm/plan.md`, `.swarm/plan.json`, generated zones |
| `build` | Full | No restrictions — native OpenCode agent |
| `plan` | Read-only | Cannot write any files |
| `coder` | Limited | Only `src/`, `tests/`, `docs/`, `scripts/`; blocked from `.swarm/` |
| `reviewer` | Limited | Only `.swarm/evidence/`, `.swarm/outputs/`; blocked from `src/` |
| Unknown | Blocked | Must be in AGENT_AUTHORITY_RULES to write |

---

## Canonical Build Journey (40 Sessions)

### Phase 1: Shark Agent Architecture (8 sessions)
The foundation — building the Shark/Spider agent system from scratch.

| Session | Duration | Key Actions |
|---------|----------|-------------|
| **Shark Agent CLI** | 3046 min (50.8h) | 1465 msgs, 5295 parts. Built complete CLI with dual-brain AI, safety stack, KNOWLEDGE_BASE structure. 870 bash calls, 94 files written. |
| **Shark CLI Ultra + AGI DeepSeek Terminal** | 1546 min (25.8h) | 611 msgs, 2349 parts. Extended CLI with DeepSeek integration and AGI terminal capabilities. |
| **Shark Agent Plugin** | 1164 min (19.4h) | 685 msgs, 2437 parts. Built OpenCode plugin for Shark agent with V2 components. |
| **Shark Plugin V2** | 95 min | 189 msgs, 728 parts. Plugin V2 with improved architecture. |
| **Shark CLI build status review** | 64 min | 32 msgs, 122 parts. Review of CLI build progress. |
| **Firewall Crash Testing** | 38 min | 76 msgs, 225 parts. Security architecture testing. |
| **Execute Shark Plugin Realignment** | 16 min | 30 msgs, 125 parts. Plugin realignment via hephaestus subagent. |
| **Build Shark Agent Plugin** | 15 min | 66 msgs, 337 parts. Initial plugin build via hephaestus subagent. |

**Key Breakthroughs:**
- Dual-brain AI architecture (Shark + Guardian)
- Safety stack with firewall enforcement
- OpenCode plugin integration with hook system
- KNOWLEDGE_BASE structured documentation system

### Phase 2: Kraken Ecosystem (6 sessions)
Building the broader Kraken ecosystem around the Spider agent.

| Session | Duration | Key Actions |
|---------|----------|-------------|
| **Kraken Brain** | 7003 min (116.7h) | 1617 msgs, 5962 parts. Massive session building the core Kraken Brain architecture. |
| **Kraken Ultra** | 646 min (10.8h) | 700 msgs, 2647 parts. Ultra variant with enhanced capabilities. |
| **Kraken Hive Migration Build** | 10 min | 13 msgs, 72 parts. Migration build via sisyphus subagent. |
| **Inra Overhaul** | 321 min (5.4h) | 207 msgs, 814 parts. System overhaul. |
| **DeerFlow local development setup** | 661 min (11h) | 170 msgs, 632 parts. Local dev environment setup. |
| **TurboQuant Setup** | 51 min | 41 msgs, 149 parts. Quantization setup. |

**Key Breakthroughs:**
- Kraken Brain dual-brain architecture
- Hive orchestrator pattern
- Local development workflow

### Phase 3: Agent Swarm & Orchestration (4 sessions)
Setting up multi-agent orchestration infrastructure.

| Session | Duration | Key Actions |
|---------|----------|-------------|
| **Agent Swarm Setup** | 1204 min (20h) | 979 msgs, 3789 parts. Full agent swarm configuration. |
| **OpenDev Swarm Setup** | 1347 min (22.5h) | 568 msgs, 2036 parts. OpenDev variant setup. |
| **Swarm Plugin Setup** | 77 min | 301 msgs, 1134 parts. Plugin configuration for swarm. |
| **Reviewer agent bug investigation** | 44 min | 104 msgs, 404 parts. Critical bug: reviewer sessions idle indefinitely. |

**Key Breakthroughs:**
- Hub-and-spoke orchestration model
- Reviewer agent bug identified (Task tool submissions stay idle forever)
- SME as temporary workaround for broken reviewer

### Phase 4: OpenCode Integration (4 sessions)
Integrating with OpenCode ecosystem.

| Session | Duration | Key Actions |
|---------|----------|-------------|
| **Opencode Workspace Migration** | 7414 min (123.6h) | 879 msgs, 3100 parts. Massive workspace migration and reorganization. |
| **GLM 5.1 opencode model integration** | 182 min (3h) | 228 msgs, 835 parts. GLM model integration plan. |
| **VLLM setup with local Qwen2.5-Coder** | 229 min (3.8h) | 264 msgs, 927 parts. Local model serving setup. |
| **Analyze opencode-ultra tool interfaces** | 5 min | 51 msgs, 197 parts. Tool interface analysis. |

**Key Breakthroughs:**
- GLM API integration with correct endpoint (api.minimaxi.IO, x-api-key header)
- VLLM local model serving (disabled auto-restart via systemd)
- Model format matching for OpenCode provider

### Phase 5: Hive Mind OS (5 sessions)
Building the persistent AGI consciousness system.

| Session | Duration | Key Actions |
|---------|----------|-------------|
| **Hive Mind Plugin** | 1111 min (18.5h) | 789 msgs, 3135 parts. Core Hive Mind plugin with context sandboxing. |
| **Flowspec Planning Plugin** | 227 min (3.8h) | 410 msgs, 1525 parts. Planning plugin with artifact enforcement. |
| **Hive installation** | 43 min | 58 msgs, 190 parts. Hive system installation. |
| **Hermes Local** | 30 min | 78 msgs, 307 parts. Local Hermes setup. |
| **Phase 1: session_extractor.py** | 6 min | 17 msgs, 69 parts. Session extraction ETL pipeline. |

**Key Breakthroughs:**
- Context sandboxing: each session is a distinct "head", shared memory is subconscious
- Session extraction from opencode.db (195 sessions classified into 9 categories)
- T2 macro context synthesis with MiniMax M2.7
- OpenViking bulk ingest (40 canonical files → semantic chunks)

### Phase 6: Investigation & Discovery (8 sessions)
Deep exploration of the OpenCode ecosystem.

| Session | Duration | Key Actions |
|---------|----------|-------------|
| **Explore OpenCode auth** | 85 min | 131 msgs, 515 parts. Authentication system exploration. |
| **Explore opencode state and events** | 33 min | 147 msgs, 647 parts. State machine and event system. |
| **Read anchor documents** | 8 min | 24 msgs, 103 parts. Architecture document analysis. |
| **Analyze opencode-ultra plugin** | 8 min | 67 msgs, 252 parts. Plugin structure analysis. |
| **Explore opencode TUI status bar** | 6 min | 22 msgs, 96 parts. TUI component exploration. |
| **Investigate auto-switch logic** | 1 min | Model switching investigation. |
| **Check robotgo API for keyboard events** | 2 min | Keyboard event API exploration. |
| **Find Vosk Go API examples** | 1 min | Speech recognition API research. |

### Phase 7: Build Projects (5 sessions)
Various build projects and setups.

| Session | Duration | Key Actions |
|---------|----------|-------------|
| **Mattermost desktop setup** | 4309 min (71.8h) | 573 msgs, 2207 parts. Desktop client setup. |
| **Building Space Invaders replica plan** | 4090 min (68.2h) | 228 msgs, 801 parts. Game development planning. |
| **VTT Workshop** | 3397 min (56.6h) | 1321 msgs, 4827 parts. Workshop system. |
| **OmniCoder Space Invaders Test** | 6 min | 6 msgs, 19 parts. OmniCoder game test. |
| **Omnicoder Debug** | 39 min | 82 msgs, 357 parts. OmniCoder integration debugging. |

---

## Key Lessons Learned

1. **MiniMax API**: Endpoint is `api.minimaxi.IO` (not `.com`), auth is `x-api-key` header (not Bearer), model is `MiniMax-M2.7`
2. **Reviewer agent bug**: Task tool submissions stay idle forever — use SME as workaround
3. **VLLM auto-restart**: Was consuming GPU memory via systemd timer — disabled
4. **OpenViking concurrent workers**: >1 causes vector DB lock contention — use MAX_WORKERS=1
5. **Context sandboxing**: Each session is a distinct "head", shared memory is subconscious (on-demand tools only)
6. **Agent Swarm vs Plugin**: Agent Swarm (port 3013) and spider-agent plugin are completely separate systems
7. **Model format**: Must match OpenCode's internal provider format (e.g., `local-agent-models/omnicoder-9b-q4_k_m.gguf`)

---

## Running Services

| Service | URL | Status |
|---------|-----|--------|
| OpenViking | `http://localhost:1933` | Running |
| Agent Swarm API | `http://localhost:3013` | Running |
| Session Monitor | PID 2604465 | Running (polling every 60s) |

---

## File Paths Reference

```
# Spider Agent Plugin
~/.config/opencode/opencode.json              # Plugin config
~/.config/opencode/plugins/hive-mind-plugin.ts  # HiveMindPlugin
~/agent-swarm/spider-agent/                   # Plugin source
~/agent-swarm/Dockerfile.spider-worker        # Docker build
~/agent-swarm/docker-compose.spider.yml       # Docker compose

# Session Data
~/.local/share/opencode/opencode.db           # Session database (242 sessions)
~/.swarm/context.md                           # Active context
~/.swarm/knowledge.jsonl                      # Knowledge entries
~/.swarm/plan.md                              # Current plan

# Knowledge Base
~/OPENCODE_WORKSPACE/knowledge-base/AGI_Neural_Pathways/T2_SYNTHESIZED/  # 40 canonical T2 files
~/OPENCODE_WORKSPACE/tools/neural-pathways/    # ETL scripts

# OpenViking Storage
~/openviking_workspace/viking/default/resources/hive-mind/shared/knowledge/  # Ingested T2
~/openviking_workspace/viking/default/resources/hive-mind/shared/sessions/   # Session overviews
```

---

## Build Reports

| Report | URI | Status |
|--------|-----|--------|
| Phase 5-7 Build Report | `viking://resources/hive-mind/shared/skills/BUILD_REPORT_Hive_Mind_Phase5_Phase7.md` | ✅ Complete |

**Reference**: The canonical build report format is defined at `viking://resources/hive-mind/shared/skills/BUILD_REPORT_PROMPT.md`

---

## Rename History

| Old Name | New Name |
|----------|----------|
| `shark-agent-v4` | `spider-agent` |
| `opencode-swarm` | `spider-agent` (subdirectory removed, merged) |
| `Architect` | `Spider` (orchestrator role) |
| `swarm plan` | `spider plan` |
| `.shark/` | `.spider/` (directory references) |
| `Dockerfile.shark-worker` | `Dockerfile.spider-worker` |
| `docker-compose.shark.yml` | `docker-compose.spider.yml` |

---

**Last Updated:** 2026-04-01
**Maintained by:** Spider Agent (self-documenting)
