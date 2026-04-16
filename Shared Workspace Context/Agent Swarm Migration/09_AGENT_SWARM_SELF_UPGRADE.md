# Agent Swarm Self-Upgrade: Spider Integration

**Classification:** Master prompt for autonomous swarm reconfiguration  
**Purpose:** Feed this to the Agent Swarm lead agent to make it autonomously reconfigure itself

---

## Context

You are the lead agent of this swarm. Your task is to reconfigure the entire system to use OpenCode with the Spider Agent V4 plugin as the worker harness, replacing the current Claude Code setup.

All context you need is in `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Agent Swarm Migration/`:
- `01_SPIDER_AGENT_OS_ORIGINAL.md` — Complete record of original Spider Agent OS (all versions)
- `02_OPENCODE_SWARM_AS_SPIDER.md` — What spider-swarm already provides
- `03_GAP_ANALYSIS.md` — What's missing and needs to be wired in
- `04_SPIDER_V5_BUILD_WORKFLOW.md` — Build workflow for Spider Agent V5
- `05_KRAKEN_V5_BUILD_WORKFLOW.md` — Build workflow for Kraken Brain V5
- `06_SPIDER_AGENT_V4_PLUGIN.md` — Rename operations for spider-swarm → Spider V4
- `07_SPIDER_IDENTITY_FILES.md` — Spider agent identity templates (SOUL, IDENTITY, TOOLS, SPIDER)
- `08_KRAKEN_IDENTITY_FILES.md` — Kraken agent identity templates (lightweight)

---

## Current State
- Agent Swarm API running on localhost:3013
- Workers configured for Claude Code
- Identity files use CLAUDE.md naming
- No anti-hallucination validators
- No surgical debug protocol
- No stagnation detection
- No Guardian zone classification

## Target State
- Workers run OpenCode with Spider Agent V4 plugin
- Identity files renamed: CLAUDE.md → SPIDER.md
- Each worker has role-specific model assignment
- SPIDER enforcement in every worker's system prompt
- Anti-hallucination validators active
- Surgical debug protocol active
- Stagnation detection active
- Guardian zone classification active

---

## Execution Steps

### Step 1: Update Dockerfile.worker
- Replace Claude Code installation with OpenCode
- Add Spider Agent V4 plugin installation
- Add vercel-minimax-ai-provider dependency
- Mount local model server from host (OmniCoder 9B on llama.cpp)
- Set environment variables for all API keys (OpenCode Zen, MiniMax, DeepSeek, GLM, NVIDIA)

### Step 2: Update docker-compose
- Create one service per worker role: coder, reviewer, test_engineer, explorer, sme
- Each service gets WORKER_ROLE env var
- Each service mounts the appropriate model config
- Local model server reachable via host.docker.internal:8000

### Step 3: Create Identity Templates
- Write SOUL.md with SPIDER enforcement philosophy (from 07_SPIDER_IDENTITY_FILES.md)
- Write IDENTITY.md templates per role (Macro Engineer = Lead, Micro Engineer = Worker)
- Write TOOLS.md with OpenCode tool inventory + local model server info
- Write SPIDER.md with quality gates, anti-hallucination, surgical debug, stagnation detection, Guardian zones

### Step 4: Update Startup Scripts
- Replace Claude Code verification with OpenCode verification
- Verify Spider Agent V4 plugin loads
- Verify model config is present
- Verify local model server is reachable

### Step 5: Update System Prompt Assembly
- Replace all CLAUDE references with SPIDER
- Inject SPIDER enforcement into base role instructions
- Inject anti-hallucination validators into quality gates
- Inject surgical debug protocol into error handling
- Inject stagnation detection into mission loop
- Inject Guardian zone classification into file operations

### Step 6: Verify Integration
- Start each worker container
- Verify OpenCode launches
- Verify Spider Agent V4 plugin loads
- Verify model assignments work
- Run a test task through the full pipeline
- Verify quality gates execute (diff → syntax_check → placeholder_scan → imports → lint → build_check → pre_check_batch → reviewer → test_engineer)
- Verify anti-hallucination validators trigger on simulated output
- Verify surgical debug protocol activates on errors
- Verify stagnation detection triggers on repeated failures
- Verify Guardian zones block SYSTEM/PERSONAL paths

---

## Constraints
- Do NOT change the Agent Swarm API architecture
- Do NOT change the task lifecycle (claim → execute → complete)
- Do NOT change the memory system or compounding learnings
- Do NOT change the dashboard or integrations
- ONLY change the worker harness and identity files

## Success Criteria
- All 5 worker roles start successfully
- Each worker uses its assigned model
- SPIDER enforcement is active in every worker
- A test task completes through the full quality gate pipeline
- Anti-hallucination validators catch simulated output
- Surgical debug protocol handles errors correctly
- Stagnation detection prevents doom loops
- Guardian zones block dangerous file operations

---

## Model Assignments for Workers
| Worker Role | Model | Provider |
|---|---|---|
| coder | GLM-5 | GLM Coding Plan |
| reviewer | MiniMax M2.7-highspeed | MiniMax |
| test_engineer | MiniMax M2.7 | MiniMax |
| explorer | OmniCoder 9B | Local llama.cpp (port 8000) |
| sme | DeepSeek Reasoner | DeepSeek |

## Orchestrator Model
| Role | Model | Provider |
|---|---|---|
| architect (lead) | Qwen 3.6 Plus Free | OpenCode Zen |
