# Spider Agent V4 Swarm Setup — Next Steps

**Classification:** Actionable setup guide for architect agent  
**Purpose:** Step-by-step plan to get the full Agent Swarm running with Spider Agent V4 workers  
**Scope:** V4 only — NO V5 build. V5 enhancements come later.

---

## Current State Assessment

### What's Done ✅
- **Agent Swarm installed**: `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/` — full source, dependencies installed, DB initialized
- **Agent Swarm API key set**: via `${AGENT_SWARM_API_KEY}` environment variable (never hardcoded)
- **Spider Agent V4 plugin created**: `/home/leviathan/.npm-global/lib/node_modules/spider-agent-v1/` (copy of spider-swarm with renamed package)
- **OpenCode config updated**: Plugin array now loads `spider-agent-v1`
- **Model map configured**: All 9 agents have distinct model assignments in `spider-swarm.json`
- **Context library built**: 9 files in `Agent Swarm Migration/` with full Spider OS record, gap analysis, build workflows, identity files
- **Local model server running**: OmniCoder 9B on llama.cpp at `localhost:8000` with `--reasoning-format deepseek-legacy` and fixed Jinja template
- **All API keys available**: OpenCode Zen, MiniMax, DeepSeek, GLM, NVIDIA, MiMo

### What's NOT Done ❌
- **Agent Swarm API not running**: No containers up, API not serving on port 3013
- **Worker Docker image not built**: Still uses Claude Code, not OpenCode + Spider V4
- **Identity files not replaced**: Templates still have CLAUDE.md, not SPIDER.md
- **No Spider enforcement in workers**: Workers are vanilla Claude Code, not OpenCode sessions
- **No model routing for workers**: Workers don't know which model to use
- **No local model mount**: Workers can't reach OmniCoder 9B on host

---

## Phase 1: Start Agent Swarm API Server

### Step 1.1: Start via PM2 (Recommended)
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm
bun run pm2-start
```

### Step 1.2: Verify API is Running
```bash
# Check API health
curl -s -H "Authorization: Bearer ${AGENT_SWARM_API_KEY}" http://localhost:3013/api/agents

# Check PM2 status
bun run pm2-status

# Check logs
bun run pm2-logs
```

### Step 1.3: Verify MCP Connection from OpenCode
```bash
# From OpenCode session, verify swarm tools are available
# Should see: agent_swarm_join_swarm, agent_swarm_send_task, etc.
```

### Acceptance Criteria
- [ ] API responds on `http://localhost:3013` with valid auth
- [ ] PM2 shows api, lead, and worker processes running
- [ ] OpenCode can see swarm MCP tools

---

## Phase 2: Replace Claude Code Workers with OpenCode + Spider V4

### Step 2.1: Create OpenCode Worker Dockerfile
**File:** `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/Dockerfile.spider-worker`

```dockerfile
FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

# System packages
RUN apt-get update && apt-get install -y \
    curl ca-certificates gnupg git nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Install OpenCode globally
RUN npm install -g opencode-ai

# Install Spider Agent V4 plugin
RUN npm install -g /workspace/spider-agent-v1

# Install MiniMax provider
RUN npm install -g vercel-minimax-ai-provider

# Create workspace
WORKDIR /workspace

# Copy Spider Agent V4 plugin
COPY spider-agent-v1/ /workspace/spider-agent-v1/

# Copy identity files
COPY identity/ /workspace/identity/

# Copy model config
COPY spider-swarm.json /root/.config/opencode/

# Entrypoint — OpenCode in headless mode
ENTRYPOINT ["opencode", "run"]
```

### Step 2.2: Create Worker Identity Directory Structure
**Directory:** `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/identity/`

```
identity/
├── lead/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   └── SPIDER.md
├── coder/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   └── SPIDER.md
├── reviewer/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   └── SPIDER.md
├── test_engineer/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   └── SPIDER.md
├── explorer/
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── TOOLS.md
│   └── SPIDER.md
└── sme/
    ├── SOUL.md
    ├── IDENTITY.md
    ├── TOOLS.md
    └── SPIDER.md
```

### Step 2.3: Populate Identity Files from Context Library
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Agent Swarm Migration/07_SPIDER_IDENTITY_FILES.md`

For each role, create the 4 identity files:
- **SOUL.md** — Core persona (from 07_SPIDER_IDENTITY_FILES.md SOUL.md section)
- **IDENTITY.md** — Role-specific expertise (Macro Engineer = Lead, Micro Engineer = Worker)
- **TOOLS.md** — Environment knowledge (OpenCode tools, local model server, API keys)
- **SPIDER.md** — Persistent notes (quality gates, anti-hallucination, surgical debug, stagnation detection, Guardian zones)

### Step 2.4: Create Worker Model Config
**File:** `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/identity/spider-swarm.json`

Copy from current config:
```json
{
  "agents": {
    "architect": { "model": "0-opencode-zen/qwen3.6-plus-free" },
    "coder": { "model": "0-glm-coding/glm-5" },
    "reviewer": { "model": "1-minimax/MiniMax-M2.7-highspeed" },
    "test_engineer": { "model": "1-minimax/MiniMax-M2.7" },
    "explorer": { "model": "0-local-agent-models/omnicoder-9b-q4_k_m.gguf" },
    "sme": { "model": "0-deepseek/deepseek-reasoner" },
    "critic": { "model": "0-nemotron/nemotron-3-super" },
    "docs": { "model": "0-nemotron/nemotron-3-super" },
    "designer": { "model": "0-mimo/mimo-v2-omni" }
  },
  "max_iterations": 5
}
```

### Step 2.5: Update docker-compose.local.yml
Replace the existing worker service with Spider worker services:

```yaml
services:
  api:
    # ... existing api config unchanged ...

  worker-coder:
    build:
      context: .
      dockerfile: Dockerfile.spider-worker
    environment:
      - API_KEY=${API_KEY}
      - SWARM_API_URL=http://host.docker.internal:3013
      - OPENCODE_ZEN_API_KEY=${OPENCODE_ZEN_API_KEY}
      - MINIMAX_API_KEY=${MINIMAX_API_KEY}
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
      - WORKER_ROLE=coder
    volumes:
      - ./work/worker-coder:/workspace
      - ./identity/coder:/workspace/identity/coder
      - ./spider-agent-v1:/workspace/spider-agent-v1
    extra_hosts:
      - "host.docker.internal:host-gateway"

  worker-reviewer:
    # ... same pattern, WORKER_ROLE=reviewer ...

  worker-test_engineer:
    # ... same pattern, WORKER_ROLE=test_engineer ...

  worker-explorer:
    # ... same pattern, WORKER_ROLE=explorer ...

  worker-sme:
    # ... same pattern, WORKER_ROLE=sme ...
```

### Step 2.6: Update .env with All API Keys
Add to `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/.env`:
```bash
# Existing
API_KEY=${AGENT_SWARM_API_KEY}  # Set in environment, never commit the actual value
PORT=3013

# Model API Keys — all sourced from environment variables, never hardcoded
OPENCODE_ZEN_API_KEY=${OPENCODE_ZEN_API_KEY}
MINIMAX_API_KEY=${MINIMAX_API_KEY}
DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
GLM_API_KEY=${GLM_API_KEY}
NVIDIA_API_KEY=${NVIDIA_API_KEY}
MIMO_API_KEY=${MIMO_API_KEY}

# Disable unused integrations
SLACK_DISABLE=true
GITHUB_DISABLE=true
```

### Acceptance Criteria
- [ ] Dockerfile.spider-worker builds successfully
- [ ] Identity files populated for all 5 worker roles
- [ ] docker-compose.local.yml updated with Spider worker services
- [ ] .env contains all required API keys
- [ ] `docker compose -f docker-compose.local.yml up --build` starts all services

---

## Phase 3: Replace Template Identity Files (CLAUDE → SPIDER)

### Step 3.1: Update Official Templates
**Directory:** `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/templates/official/`

For each template (lead, coder, reviewer, tester, researcher):
1. Rename `CLAUDE.md` → `SPIDER.md`
2. Replace all "Claude" references with "Spider"
3. Inject SPIDER enforcement rules from context library

### Step 3.2: Create Spider-Specific Templates
**New Directory:** `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/templates/official/spider-*`

Create Spider-specific templates that inherit from official templates but add:
- SPIDER enforcement in SOUL.md
- Anti-hallucination validators in SPIDER.md
- Surgical debug protocol in SPIDER.md
- Guardian zone classification in SPIDER.md
- Model assignment in config.json

### Acceptance Criteria
- [ ] All official templates have CLAUDE.md renamed to SPIDER.md
- [ ] All "Claude" references replaced with "Spider"
- [ ] Spider-specific templates created for each worker role
- [ ] Templates inject SPIDER enforcement into system prompts

---

## Phase 4: Test End-to-End Pipeline

### Step 4.1: Verify API Server
```bash
# Check API health
curl -s -H "Authorization: Bearer ${AGENT_SWARM_API_KEY}" http://localhost:3013/api/agents

# List available agents
curl -s -H "Authorization: Bearer ${AGENT_SWARM_API_KEY}" http://localhost:3013/api/agents | jq
```

### Step 4.2: Verify Worker Containers
```bash
# Check all containers running
docker ps

# Check worker logs
docker logs swarm-worker-coder
docker logs swarm-worker-reviewer
```

### Step 4.3: Test Task Delegation
From OpenCode session (architect role):
1. Send a simple task to the swarm
2. Verify lead agent receives and delegates it
3. Verify worker executes with Spider enforcement
4. Verify quality gates execute (lint → build → test → review)
5. Verify evidence is captured

### Step 4.4: Test Spider Enforcement
1. **Anti-hallucination**: Try to submit code without running tests → should be blocked
2. **Surgical debug**: Introduce a bug → verify debug protocol activates
3. **Stagnation**: Create a repeating failure → verify escalation after 3 attempts
4. **Guardian zones**: Try to write to ~/.ssh → should be blocked

### Acceptance Criteria
- [ ] API server responds with agent list
- [ ] All worker containers running
- [ ] Test task completes through full pipeline
- [ ] Spider enforcement active in all workers
- [ ] Quality gates execute correctly
- [ ] Evidence captured for all tasks

---

## Phase 5: Production Polish

### Step 5.1: Set Up Dashboard
```bash
# Start the Next.js dashboard
cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/new-ui
npm install
npm run dev
```

### Step 5.2: Configure Scheduled Tasks
Set up periodic health checks and status reports via the scheduler.

### Step 5.3: Set Up Memory Persistence
Configure OpenViking memory for cross-session learning.

### Acceptance Criteria
- [ ] Dashboard accessible and showing agent status
- [ ] Scheduled tasks running
- [ ] Memory persisting across sessions

---

## Execution Order Summary

```
Phase 1: Start API Server (15 minutes)
  → bun run pm2-start
  → Verify API responds

Phase 2: Replace Workers (1-2 hours)
  → Create Dockerfile.spider-worker
  → Create identity files for 5 roles
  → Update docker-compose.local.yml
  → Build and start containers

Phase 3: Replace Templates (30 minutes)
  → Rename CLAUDE.md → SPIDER.md in all templates
  → Create Spider-specific templates

Phase 4: Test Pipeline (30 minutes)
  → Verify API, containers, task delegation
  → Test Spider enforcement

Phase 5: Polish (30 minutes)
  → Dashboard, scheduled tasks, memory
```

---

## Key Files to Create/Modify

| File | Action | Source |
|---|---|---|
| `Dockerfile.spider-worker` | Create new | This document |
| `docker-compose.local.yml` | Modify | Replace worker services |
| `.env` | Modify | Add API keys |
| `identity/{role}/SOUL.md` | Create | 07_SPIDER_IDENTITY_FILES.md |
| `identity/{role}/IDENTITY.md` | Create | 07_SPIDER_IDENTITY_FILES.md |
| `identity/{role}/TOOLS.md` | Create | 07_SPIDER_IDENTITY_FILES.md |
| `identity/{role}/SPIDER.md` | Create | 07_SPIDER_IDENTITY_FILES.md |
| `identity/spider-swarm.json` | Copy | Current config |
| `templates/official/*/CLAUDE.md` | Rename → SPIDER.md | Replace content |
| `templates/official/spider-*/` | Create new | Based on official + SPIDER |

---

## What NOT to Do Yet

- **Do NOT build Spider Agent V5** — V5 enhancements (anti-hallucination validators, surgical debug protocol, etc.) don't exist yet. V4 is the current production plugin.
- **Do NOT modify the Agent Swarm API architecture** — The API server, task lifecycle, memory system, and dashboard stay as-is.
- **Do NOT change the model map** — The current model assignments are correct and tested.
