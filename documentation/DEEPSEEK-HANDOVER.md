# LEVIATHAN SYSTEM — DEEPSEEK HANDOVER PROMPT

> Generated: 2026-03-16 by Claude Code (Opus 4.6)
> System: Ubuntu 24.04, i9, RTX 4080 Laptop (12GB VRAM), user `leviathan`, home `/home/leviathan`

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

Leviathan is a **hybrid local+cloud autonomous AI engineering platform**. The user wants to operate it entirely through Discord — type plain English commands and have the system autonomously build complex software projects using parallel "hydra pod" agent swarms.

### Organizational Structure
| Role | Component | Location | Status |
|------|-----------|----------|--------|
| **CEO** | Paperclip | Railway cloud | RUNNING (HTTP 200) |
| **CTO** | DeerFlow | Railway cloud | RUNNING (healthy) |
| **COO** | OpenViking | Railway cloud | RUNNING (healthy) |
| **Middle Management** | OpenFang | Local (port 50051) | RUNNING (5 agents) |
| **R&D** | Hermes-Lite | Local CLI | INSTALLED (import error) |
| **Executive Assistant** | Obsidian | Local AppImage | INSTALLED |
| **Workers** | Ollama (Qwen 3.5) | Local (port 11434) | RUNNING (5 models) |
| **Discord Interface** | Obliteratus Commander | OpenFang Discord channel | RUNNING (partially broken) |

### Model Routing Strategy
| Model | Role | Provider |
|-------|------|----------|
| DeepSeek Chat | Thinking, architecture, planning, execution | deepseek API |
| DeepSeek Reasoner | Deep chain-of-thought for hardest problems | deepseek API |
| Gemini 2.5 Flash | Fast Discord responses, vibecoding, parallel builds | Google API |
| Qwen 3.5 9B (local) | Small solo vibecoding tasks only (14 t/s, 1-2 agents max) | Ollama local |
| OpenRouter gemma-2-9b:free | Free vibecoding overflow | OpenRouter |
| GLM | **DISABLED** — account has zero credits, all calls return error 1113 | zhipu API (broken) |

---

## 2. COMPONENT STATUS (DETAILED)

### 2.1 LOCAL SERVICES

#### Ollama (LLM Inference)
- **Status**: Running, systemd enabled
- **Port**: 11434 (bound to 0.0.0.0 via systemd override)
- **Models**: qwen3.5:9b, qwen3.5:4b, qwen3.5-fast, nomic-embed-text, qwen2.5-coder:7b
- **Config override**: `/etc/systemd/system/ollama.service.d/override.conf` → `OLLAMA_HOST=0.0.0.0:11434`
- **Performance**: 13.9 tokens/sec single request, cannot handle parallel — 54% CPU / 46% GPU split, 9.3GB VRAM used
- **Note**: 12GB laptop GPU cannot fit full 9B model in VRAM. NOT suitable for parallel agent workloads.

#### OpenFang (Agent OS)
- **Status**: Running, daemon PID varies
- **Port**: 127.0.0.1:50051 (API + Dashboard)
- **Version**: 0.4.4
- **Config**: `~/.openfang/config.toml`
- **Env file**: `~/.openfang/.env` (contains all API keys)
- **Agent definitions**: `~/.openfang/agents/{assistant,coder,executor,orchestrator,thinker}/agent.toml`
- **Database**: `~/.openfang/data/openfang.db` (SQLite)
- **Memory**: `~/.openfang/memory.db` (SQLite, enabled)
- **5 Running Agents**:
  - `assistant` → gemini:gemini-2.5-flash (Discord interface)
  - `orchestrator` → deepseek:deepseek-chat (task decomposition)
  - `thinker` → deepseek:deepseek-chat (architecture/planning)
  - `executor` → deepseek:deepseek-chat (mechanical execution)
  - `coder` → gemini:gemini-2.5-flash (vibecoding)
- **Discord**: Connected to guild 1479569425844666381, bot "Obliteratus Commander#0676"
- **Binding**: All messages → assistant agent (created via API)
- **Workflow**: `hydra-build` was created but has a JSON validation error (missing field `name` at line 12). Needs to be fixed and re-registered.

#### Hermes-Lite (Skill Learning)
- **Status**: Installed but has import error
- **Location**: `~/leviathan/hermes-lite/`
- **Venv**: `~/leviathan/hermes-lite/.venv/`
- **Error**: `ModuleNotFoundError: No module named 'hermes_cli'` when running `hermes-lite`
- **Config**: `~/.hermes-lite/config.yaml` → uses local Qwen 3.5 9B, skills linked to Obsidian vault
- **Fix needed**: Reinstall the package in editable mode or fix the Python path

#### Obsidian (Executive Assistant)
- **Status**: Installed as AppImage
- **Binary**: `~/Applications/obsidian`
- **Vault**: `~/Documents/Obsidian/Leviathan/` with subdirs: Goals, Skills, Reports, Diagrams, Logs, Tasks
- **Task watcher**: Cron job running every minute (`/usr/local/bin/watch_tasks.sh`)
- **Model router**: `/usr/local/bin/route_model.py`

#### Cloudflare Tunnel
- **Status**: Running (quick tunnel, not named)
- **Current URL**: `https://paris-lodge-dylan-pas.trycloudflare.com` (CHANGES ON REBOOT)
- **Purpose**: Exposes local Ollama to Railway cloud services
- **Systemd**: `ollama-tunnel.service` enabled — auto-starts tunnel and updates Railway env vars
- **Script**: `~/leviathan/config/ollama-tunnel.sh`
- **Important**: Quick tunnel URL is ephemeral. On reboot, the script gets a new URL and updates Railway env vars for OpenViking and DeerFlow.

### 2.2 CLOUD SERVICES (Railway)

**Project**: robust-kindness (ID: `87f70a09-2b34-4fe2-b77d-7a65f7e18017`)
**Workspace**: leviathan-devops

#### OpenViking (Memory/Context DB)
- **URL**: https://openviking-production.up.railway.app
- **Status**: Healthy (`{"status":"ok","healthy":true}`)
- **Port**: 1933 (Railway routes to it)
- **Dockerfile**: `~/leviathan/openviking/Dockerfile.railway`
- **Config**: `~/leviathan/openviking/ov.cloud.conf` (template with `${OLLAMA_BASE_URL}` and `${ROOT_API_KEY}` substitution)
- **Entrypoint**: `~/leviathan/openviking/railway-entrypoint.sh` (does sed substitution then starts server)
- **Embedding**: Uses nomic-embed-text via Ollama tunnel
- **VLM**: Uses qwen3.5:9b via Ollama tunnel
- **Storage**: Local vectordb + AGFS in `/app/data` (non-persistent on Railway — will lose data on redeploy)
- **Railway env vars**: `OLLAMA_BASE_URL`, `ROOT_API_KEY`, `PORT=1933`

#### DeerFlow (Research Orchestration)
- **URL**: https://deerflow-production-9eea.up.railway.app
- **Status**: Healthy (`{"status":"healthy","service":"deer-flow-gateway"}`)
- **Architecture**: Single container running 4 services via supervisord:
  - nginx (port from Railway `$PORT`, default 2026) — reverse proxy
  - gateway (port 8001) — FastAPI REST API
  - langgraph (port 2024) — LangGraph agent runtime
  - frontend (port 3000) — Next.js UI
- **Dockerfile**: `~/leviathan/deerflow/Dockerfile.railway`
- **Start script**: `~/leviathan/deerflow/railway-start.sh` (generates nginx config, starts supervisord)
- **Supervisord**: `~/leviathan/deerflow/railway-supervisord.conf`
- **Config**: `~/leviathan/deerflow/config.cloud.yaml` (copied as config.yaml in Docker)
- **Models configured**: deepseek-chat (via API), glm-4-plus (via API, but GLM has no credits), qwen3.5-9b (via Ollama tunnel)
- **Railway env vars**: `DEEPSEEK_API_KEY`, `GLM_API_KEY`, `TAVILY_API_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_V1_URL`, `BETTER_AUTH_SECRET`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `PORT=2026`
- **Note**: Frontend works. Gateway works. LangGraph works. The `.dockerignore` was modified — important not to revert.

#### Paperclip (Agent Orchestration CEO)
- **URL**: https://paperclip-production-1be7.up.railway.app
- **Status**: Running (HTTP 200, serving UI)
- **Port**: 3100
- **Dockerfile**: `~/leviathan/paperclip/Dockerfile.railway` (removed VOLUME directive banned by Railway, added plugin-sdk build step)
- **Database**: Railway managed PostgreSQL (connected via `${{Postgres.DATABASE_URL}}` reference)
- **Mode**: `authenticated` (required for non-loopback binding)
- **Railway env vars**: `DATABASE_URL` (Postgres reference), `BETTER_AUTH_SECRET`, `PORT=3100`, `PAPERCLIP_DEPLOYMENT_MODE=authenticated`, `PAPERCLIP_ALLOWED_HOSTNAMES`, `PAPERCLIP_PUBLIC_URL`

### 2.3 SYSTEMD SERVICES (boot persistence)
| Service | Purpose | Status |
|---------|---------|--------|
| `ollama.service` | Ollama LLM server | enabled |
| `leviathan.service` | Starts local OpenFang + checks cloud health | enabled |
| `ollama-tunnel.service` | Cloudflare tunnel + Railway env var updates | enabled |
| `kbd-backlight.service` | Keyboard backlight (asus::kbd_backlight, brightness=3) | enabled |

---

## 3. CRITICAL PENDING ISSUES (FIX THESE FIRST)

### 3.1 🔴 Discord bot does NOT respond without @mention
**Root cause**: The Discord Developer Portal does NOT have the **Message Content Intent** privileged gateway intent enabled for bot application ID `1479058541011537940`.

**Proof**: `curl -s -H "Authorization: Bot $TOKEN" "https://discord.com/api/v10/oauth2/applications/@me"` returns `flags: 565248` which does NOT include bit 18 (MESSAGE_CONTENT = 262144).

**Fix**: The user must manually go to https://discord.com/developers/applications → select the bot → Bot settings → Privileged Gateway Intents → toggle **MESSAGE CONTENT INTENT** ON → Save.

**OpenFang side is already configured correctly**:
- `group_policy = "respond"` in config.toml
- Binding created: all messages → assistant agent
- `intents = 33281` (includes MESSAGE_CONTENT bit 32768)

Once the portal toggle is ON, it should work immediately. No restart needed — OpenFang already requests the intent.

### 3.2 🟡 GLM API has no credits
All GLM/Zhipu API calls return error 1113 ("余额不足或无可用资源包"). The executor agent was originally on GLM but has been moved to DeepSeek. If the user tops up their GLM account, executor should be switched back to `glm-4.7` or `glm-4.5` (those are the models available on this key).

Available GLM models on this key: `glm-4.5`, `glm-4.5-air`, `glm-4.6`, `glm-4.7`, `glm-5`

### 3.3 🟡 Hydra-build workflow not registered
The workflow JSON at `~/.openfang/workflows/hydra-build.json` fails validation: "missing field `name` at line 12 column 5". The `WorkflowStep` struct expects a `name` field in each step (not just `id`). Fix the JSON and re-register with `openfang workflow create`.

### 3.4 🟡 Hermes-lite import error
`hermes-lite` CLI fails with `ModuleNotFoundError: No module named 'hermes_cli'`. Needs `cd ~/leviathan/hermes-lite && .venv/bin/pip install -e .` or similar fix.

### 3.5 🟡 OpenViking data not persistent
Railway containers lose data on redeploy. OpenViking stores vectordb data in `/app/data` which is ephemeral. Need to either add a Railway volume or configure S3 backend for production persistence.

### 3.6 🟡 Cloudflare tunnel URL is ephemeral
Using a quick tunnel (trycloudflare.com). URL changes on every reboot. The `ollama-tunnel.service` handles updating Railway env vars, but there's a brief downtime window. For production, should set up a named Cloudflare tunnel with a permanent domain.

### 3.7 🟡 Agent crash loop
OpenFang agents that don't receive messages for 210 seconds get marked as "Crashed" and auto-recover. This is cosmetic but noisy. The thinker, executor, orchestrator, and coder agents crash-loop when idle because they have no incoming messages. This is normal OpenFang behavior but should be investigated for a cleaner solution.

---

## 4. API KEYS & CREDENTIALS

All stored in `~/.openfang/.env`:
```
DISCORD_BOT_TOKEN=MTQ3OTA1ODU0MTAxMTUzNzk0MA.GDG_6P.lpDP6tk2yPCW8vbQEQ2aL1SoYAw3koEixmBiFE
DEEPSEEK_API_KEY=Sk-e8e93e31b582423e9fdaa4ab8e9347e2
GLM_API_KEY=df8b2de8bbe145a4b9f8c2620043822c.n9mchou1c2fErKsK
TAVILY_API_KEY=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
ZHIPU_API_KEY=df8b2de8bbe145a4b9f8c2620043822c.n9mchou1c2fErKsK
GEMINI_API_KEY=AIzaSyBIIzyQA032RD0tmoFSW4cRW8WVyb50jAE
OPENROUTER_API_KEY=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
```

GitHub PAT: `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`
Railway login: `cryptoforex36963@gmail.com` (logged in via `railway login`)

Claude Code auth: Setup token in `~/.bashrc` as `CLAUDE_CODE_OAUTH_TOKEN` (Max subscription, ~1 year validity)

---

## 5. KEY FILE PATHS

```
~/leviathan/                          # Main project root
├── config/
│   ├── start-all.sh                  # Hybrid start script (local + cloud health check)
│   ├── stop-all.sh                   # Stop script
│   └── ollama-tunnel.sh              # Cloudflare tunnel + Railway env var updater
├── openviking/                       # OpenViking source + Railway Dockerfile
│   ├── Dockerfile.railway
│   ├── railway.json
│   ├── ov.cloud.conf                 # Cloud config template
│   └── railway-entrypoint.sh
├── deerflow/                         # DeerFlow source + Railway Dockerfile
│   ├── Dockerfile.railway
│   ├── railway.json
│   ├── config.cloud.yaml             # Cloud config (uses $ENV_VAR syntax)
│   ├── railway-start.sh              # Generates nginx config + starts supervisord
│   ├── railway-supervisord.conf
│   └── nginx.conf.template
├── paperclip/                        # Paperclip source + Railway Dockerfile
│   ├── Dockerfile.railway            # No VOLUME, added plugin-sdk build
│   └── railway.json
├── hermes-lite/                      # Hermes-lite source
│   └── .venv/
├── openfang/                         # OpenFang source (not the running config)
├── discord-bridge/                   # DISABLED old Node.js Discord bridge
├── logs/                             # Runtime logs
└── workspace/                        # Shared workspace

~/.openfang/                          # OpenFang runtime
├── config.toml                       # Main config (models, Discord, memory, bindings)
├── .env                              # API keys
├── agents/                           # Agent definitions (TOML)
│   ├── assistant/agent.toml
│   ├── coder/agent.toml
│   ├── executor/agent.toml
│   ├── orchestrator/agent.toml
│   └── thinker/agent.toml
├── workflows/hydra-build.json        # Broken — needs fix
├── data/openfang.db                  # Agent state database
├── memory.db                         # Memory database
├── workspaces/                       # Per-agent workspaces
└── daemon.json                       # Daemon PID file

~/.hermes-lite/config.yaml            # Hermes config
~/Documents/Obsidian/Leviathan/       # Obsidian vault
~/projects/                           # Where built projects go
~/Applications/obsidian               # Obsidian AppImage
/usr/local/bin/watch_tasks.sh         # Obsidian task watcher
/usr/local/bin/route_model.py         # Model routing helper
```

---

## 6. DISCORD DETAILS

- **Bot name**: Obliteratus Commander#0676
- **Bot ID**: 1479058541011537940
- **Guild ID**: 1479569425844666381
- **Channels**:
  - `#general` (1479569426784321652)
  - `#command-center` (1482930177561333771)
  - `#agent-logs` (1482930178740195379)
  - `#task-board` (1482930180614914159)
  - `#approvals` (1482930182045040803)
  - `#system` (1482930183429292204)

---

## 7. USER CONTEXT & PREFERENCES

- **User is NOT a coder**. All instructions must be GUI/plain-language friendly. Never tell them to write code.
- **User wants full autonomy**. Build first, ask later. Don't ask for permission on implementation details.
- **User is frustrated** about the Discord auto-respond issue. This has been the #1 priority for several attempts. The root cause is confirmed: Discord Developer Portal Message Content Intent is OFF. The user needs to toggle it ON manually.
- **Vision**: The user sees Leviathan as a futuristic AI engineering factory — like having "thousands of robotic engineers working in a factory" controlled via plain English Discord commands. They want to say "build me a music editing software" and have the system autonomously decompose, architect, and build a working prototype using parallel agent swarms.
- **Trading**: The user intends to build trading bots. OpenFang has a "trader" hand concept. This hasn't been implemented yet.
- **Hydra Pod concept**: Multiple coding agents running in parallel on different components of the same project. Backend agent (DeepSeek/executor), frontend agent (Gemini/coder), core logic agent (DeepSeek/executor) all building simultaneously, then an integration agent merges everything.
- **Local hardware limitations**: RTX 4080 Laptop with 12GB VRAM can only run 1-2 Qwen agents at ~14 t/s. All parallel coding work should go through cloud APIs (Gemini, DeepSeek, OpenRouter).

---

## 8. HANDOVER INSTRUCTIONS FOR DEEPSEEK

### Do first:
1. **Verify the system** — Run: `openfang status && openfang agent list && curl -s https://openviking-production.up.railway.app/health && curl -s https://deerflow-production-9eea.up.railway.app/health`
2. **Tell the user** to enable Message Content Intent in Discord Developer Portal (this is the #1 blocker, you cannot do this from terminal)
3. **Fix the hydra-build workflow** — The JSON at `~/.openfang/workflows/hydra-build.json` needs a `name` field in each step object. Fix and register with `openfang workflow create`
4. **Fix Hermes-lite** — `cd ~/leviathan/hermes-lite && .venv/bin/pip install -e .`

### Do next:
5. Set up a **named Cloudflare tunnel** with a permanent domain (requires user's Cloudflare account login)
6. Add a **Railway volume** to OpenViking for data persistence
7. Build the **trading bot** infrastructure via OpenFang hands
8. Create more sophisticated orchestrator workflows for multi-project parallel builds

### Communication style:
- Be concise. The user does not want verbose explanations.
- Be autonomous. Execute, don't ask.
- Don't claim something works unless you've verified it end-to-end.
- The user has been burned multiple times by confident claims that turned out wrong. Verify before reporting.

---

## 9. QUICK REFERENCE COMMANDS

```bash
# System status
openfang status
openfang agent list
openfang workflow list

# Restart OpenFang
openfang stop && sleep 3 && openfang start

# Spawn agents after restart
openfang agent spawn ~/.openfang/agents/thinker/agent.toml
openfang agent spawn ~/.openfang/agents/executor/agent.toml

# Hot-reload config
curl -s http://127.0.0.1:50051/api/config/reload -X POST
curl -s http://127.0.0.1:50051/api/channels/reload -X POST

# Recover crashed agent
curl -s http://127.0.0.1:50051/api/agents/<ID>/restart -X POST

# Test Discord
openfang channel test discord

# Check Railway deployments
cd ~/leviathan/deerflow && railway deployment list
cd ~/leviathan/openviking && railway deployment list
cd ~/leviathan/paperclip && railway deployment list

# Redeploy to Railway
cd ~/leviathan/<service> && railway up -d

# Check tunnel
curl -s https://paris-lodge-dylan-pas.trycloudflare.com/api/tags

# Full restart everything
bash ~/leviathan/config/start-all.sh
```
