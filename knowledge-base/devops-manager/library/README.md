# DevOps Manager — Context Library

> Project management context for Hive Mind + Hermes Agent Plugins orchestration

**Version:** 1.1
**Date:** 2026-04-02
**Role:** 
- **Terminal-based Hermes supervisor** (ACTIVE NOW)
- **OpenCode plugin agent** (IS the plugin agent for now)
- Will be REPLACED by opencode-manager when plugin is fully online

**Two-Layer Architecture:**
```
Layer 1 (Active): devops-manager
  └── Terminal-based Hermes supervisor
      └── Manually reviews OpenCode agent work
      
Layer 2 (Future): opencode-manager
  └── Automated review agent
      └── Will access devops-manager's context library
      └── Full two-layer context injection via Hermes Agent Plugin
```

---

## Quick Navigation

- [System Overview](#system-overview) — Complete architecture of Spider-Shark-Kraken stack
- [Component Inventory](#component-inventory) — All agents, plugins, and their states
- [Project Status](#project-status) — What's built, what's running, what's pending
- [Active Operations](#active-operations) — Current workstreams and priorities
- [Build Reference](#build-reference) — How to build, deploy, and manage each component

---

## System Overview

### The Spider-Shark-Kraken Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LEVIATHAN ORCHESTRATION                         │
│                         (Human: Leviathan DevOps)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SPIDER AGENT                                   │
│                    Lead Orchestrator / Project Manager                   │
│                                                                            │
│  • Plans and delegates to worker agents                                  │
│  • Coordinates multi-agent workflows                                     │
│  • Reviews and approves agent outputs                                    │
│  • Does NOT write code directly                                          │
│                                                                            │
│  Entry: opencode --agent spider                                          │
└─────────────────────────────────────────────────────────────────────────┘
          │                           │                       │
          ▼                           ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌────────────────────────┐
│   SHARK AGENT    │    │   KRAKEN HIVE    │    │   HERMES AGENT        │
│   (Micro/Macro)  │    │   (Orchestrator) │    │   (Context Keeper)    │
│                  │    │                  │    │                       │
│  • Coder         │    │  • Hive Mind     │    │  • 2nd-Brain         │
│  • Reviewer      │    │  • Sisyphus      │    │  • Memory            │
│  • Test Engineer │    │  • Hephaestus    │    │  • Telegram Bridge   │
│  • SME           │    │  • Kraken Ultra  │    │                       │
└──────────────────┘    └──────────────────┘    └────────────────────────┘
          │                           │                       │
          ▼                           ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         OPENCODE PLUGIN LAYER                            │
│                                                                            │
│  • spider-agent     — Spider orchestrator plugin                          │
│  • shark-agent-v4   — Shark enforcement + dual-brain                     │
│  • hermes-agent     — Hermes context + memory integration                │
│  • openviking-memory — Hive Mind shared context (localhost:1933)          │
│                                                                            │
│  Location: ~/.config/opencode/plugins/                                    │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         HIVE MIND (OpenViking)                           │
│                    Shared Context Database                                │
│                                                                            │
│  Server: localhost:1933                                                   │
│  viking://resources/hive-mind/shared/                                     │
│                                                                            │
│  ├── workflows/     — SHARK artifacts + state                            │
│  ├── agents/        — Per-session context                                │
│  ├── memory/        — Cross-session memory                                │
│  ├── skills/        — Shared skill definitions                           │
│  └── projects/      — Project-specific context                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Inventory

### Spider Agent (Lead Orchestrator)

| Property | Value |
|----------|-------|
| **Agent Name** | `spider` (formerly `architect`) |
| **Plugin** | `spider-agent` (formerly `shark-agent-v4` / `opencode-swarm`) |
| **Source** | `~/agent-swarm/spider-agent/` |
| **Entry Point** | `~/.config/opencode/node_modules/spider-agent/dist/index.js` |
| **Session Prefix** | `spider` |

**Authority Rules:**
| Agent | Write Access | Restrictions |
|-------|-------------|--------------|
| `spider` | Full | Cannot write `.swarm/plan.md`, `.swarm/plan.json`, generated zones |
| `build` | Full | No restrictions — native OpenCode agent |
| `plan` | Read-only | Cannot write any files |
| `coder` | Limited | Only `src/`, `tests/`, `docs/`, `scripts/`; blocked from `.swarm/` |
| `reviewer` | Limited | Only `.swarm/evidence/`, `.swarm/outputs/`; blocked from `src/` |
| Unknown | Blocked | Must be in AGENT_AUTHORITY_RULES to write |

### Shark Agent (Execution Engine)

| Property | Value |
|----------|-------|
| **Variants** | Micro Engineer (free/local), Macro Engineer (paid/cloud) |
| **Micro Thinker** | DeepSeek Chat (API) |
| **Micro Executor** | vLLM Qwen 2.5 Coder 7B AWQ (local, zero-cost) |
| **Micro Fallback** | Gemma 3 4B |
| **Macro Primary** | GLM 5 (128K context) |
| **Macro Advisory** | DeepSeek R1 |
| **Plugin** | `shark-agent` (v1, v2, v3) |

### Kraken Hive (Macro Orchestrator)

| Property | Value |
|----------|-------|
| **Purpose** | Multi-agent swarm orchestration |
| **Components** | Hub-and-spoke model with named agent roles |
| **Sisyphus** | Single-task execution agent |
| **Hephaestus** | Build/compilation agent |
| **Kraken Ultra** | Enhanced variant |
| **Projects** | `kraken-hive-engine/`, `hive-mind/` |

### Hermes Agent (Context Keeper)

| Property | Value |
|----------|-------|
| **Purpose** | 2nd-brain, long-term memory, Telegram bridge |
| **Profiles** | 2nd-brain, coder, debugger, engineer, researcher, opencode-manager |
| **Bridge** | Telegram → Hermes Gateway → sessions/ |
| **Context Library** | `~/hermes-workspace/context/` |
| **Synthesizer** | `hermes-synthesizer.py` (algorithmic, v3) |

### Hive Mind (Shared Context)

| Property | Value |
|----------|-------|
| **Server** | OpenViking at localhost:1933 |
| **Version** | 0.2.16.dev3 |
| **Plugin** | `openviking-memory.ts` |
| **Workspace** | `~/openviking_workspace/` |
| **Shared URI** | `viking://resources/hive-mind/shared/` |

**Tools Available:**
| Tool | Purpose |
|------|---------|
| `memsearch` | Search shared context |
| `memread` | Read from viking:// URI |
| `membrowse` | Browse filesystem layout |
| `memcommit` | Trigger memory extraction |

---

## Project Status

### ✅ DEPLOYED AND RUNNING

| Component | Location | Status | Health Check |
|-----------|----------|--------|-------------|
| OpenViking Server | localhost:1933 | Running | `curl http://localhost:1933/health` |
| Hermes Gateway | localhost:5000 | Running | `ps aux \| grep telegram-bridge` |
| Hermes Synthesizer | daemon (PID 146793) | Running | `pgrep -f hermes-synthesizer` |
| Spider Agent Plugin | `~/.config/opencode/plugins/` | Installed | `ls ~/.config/opencode/plugins/spider*` |
| OpenViking Memory Plugin | `~/.config/opencode/plugins/openviking*` | Installed | `ls ~/.config/opencode/plugins/openviking*` |

### ⚠️  BUILT BUT NOT INTEGRATED

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Shark Agent Plugin (v3) | `Shared Workspace Context/Shark Agent Plugin/v3_hive_integration/` | Built | Needs testing |
| Hermes Agent Plugin (v2.5) | `Shared Workspace Context/Hermes Agent Plugin/v2.5-build/` | Built | Source exists |
| Kraken Hive Engine | `projects/kraken-hive-engine/` | Built | `.venv` ready |
| Hive Mind Plugin | `projects/hive-mind/plugin/` | Built | OpenViking-based |

### 🔲  NOT YET BUILT

| Component | Priority | Dependencies |
|-----------|----------|--------------|
| Spider Agent → Hive Mind auto-context | High | OpenViking running |
| Hermes Agent Plugin → OpenCode integration | High | Spider Agent stable |
| Shark Agent → Kraken Hive routing | Medium | Both stable |
| Unified PM dashboard | Low | All above |

---

## Active Operations

### Current Sprint (as of 2026-04-02)

| Priority | Task | Agent | Status |
|----------|------|-------|--------|
| 1 | Algorithmic Systems Library | Hermes (2nd-brain) | Documentation complete |
| 2 | Spider Agent context library | Spider | **IN PROGRESS** (this library) |
| 3 | Hive Mind → Spider auto-context | Spider + Hermes | Pending |
| 4 | Hermes Agent Plugin PM features | devops-manager | Pending |

### Known Issues

| Issue | Severity | Workaround |
|-------|----------|------------|
| Reviewer agent sessions idle indefinitely | High | Use SME as temporary workaround |
| OpenViking memory plugin log | Low | Check `~/.config/opencode/plugins/openviking-memory.log` |
| Guardian Firewall bug (in GUARDIAN_FIREWALL_FAILURE_LOG.md) | Medium | Documented, fix pending |

---

## Build Reference

### Spider Agent

```bash
# Build
cd ~/agent-swarm/spider-agent
npm run build

# Deploy
cp -r dist/* ~/.config/opencode/node_modules/spider-agent/

# Verify
opencode --agent spider --help
```

### Hermes Agent Plugin

```bash
# Build
cd ~/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hermes\ Agent\ Plugin
bun install
bun run build.ts

# The v2.5-build has the latest
ls v2.5-build/dist/
```

### OpenViking Server

```bash
# Start
/home/leviathan/OPENCODE_WORKSPACE/projects/hive-mind/scripts/start-openviking.sh

# Verify
curl http://localhost:1933/health

# Tree view
cd ~/OPENCODE_WORKSPACE/projects/OpenViking
source .venv/bin/activate
ov tree viking://resources/hive-mind/ --account default --user hive-mind --level-limit 3
```

### Hermes Synthesizer

```bash
# Run once
python3 ~/hermes-workspace/scripts/hermes-synthesizer.py --once

# Run daemon
python3 ~/hermes-workspace/scripts/hermes-synthesizer.py --watch

# Check health
pgrep -f hermes-synthesizer && echo "Running" || echo "Not running"
```

---

## Context Library Sources

This library synthesizes context from:

| Source | Location | Key Docs |
|--------|----------|----------|
| Hive Mind Integration | `Shared Workspace Context/Hive Mind Integration/` | 00_OVERVIEW, 01_STATUS, ARCHITECTURE, HIVE-MIND-001-SUMMARY |
| Hermes Agent Plugin | `Shared Workspace Context/Hermes Agent Plugin/` | BUILD/BUILD_REPORT, GUARDIAN_FIREWALL_FAILURE_LOG |
| Spider Agent | `Shared Workspace Context/Spider Agent/` | CONTEXT_LIBRARY, BUILD_REPORT, OPENCODE_PLUGIN_HOOK_ARCHITECTURE |
| Shark Agent Plugin | `Shared Workspace Context/Shark Agent Plugin/v3_hive_integration/` | AGENT_INSTRUCTIONS, TEST_PLAN |
| Kraken Hive | `Shared Workspace Context/Kraken Hive/` | 00_PROJECT_OVERVIEW, 05_SISYPHUS_EXECUTION_WORKFLOW |

---

## Quick Commands Reference

```bash
# Check all services
ps aux | grep -E "openviking|telegram-bridge|hermes-synthesizer" | grep -v grep

# OpenViking health
curl http://localhost:1933/health

# Spider agent test
opencode --agent spider "status"

# Hermes context library
ls ~/hermes-workspace/context/

# Hive Mind search
ov find "shark enforcement" --account default --user hive-mind

# Hermes synthesizer log
tail -20 ~/.hermes-workspace/.state/synthesizer.log
```

---

*Last updated: 2026-04-02 20:15*
*Built by: Hermes 2nd-Brain (Algorithmic Synthesis)*
