# Agent Swarm Integration — Setup Documentation

**Date:** 2026-03-31
**Status:** Active — MCP-based integration operational
**Server:** agent-swarm v1.57.0 on localhost:3013

---

## What Was Done

### 1. OpenCode Configuration (`~/.config/opencode/opencode.json`)

**Added MCP server entry:**
```json
{
  "mcp": {
    "agent_swarm": {
      "type": "remote",
      "url": "http://localhost:3013",
      "headers": {
        "Authorization": "Bearer {env:AGENT_SWARM_API_KEY}"
      },
      "enabled": true
    }
  }
}
```

**Added tool filter patterns** (21 patterns, all `agent_swarm_*` tools enabled):
- `agent_swarm_memory*` — memory search and retrieval
- `agent_swarm_send*` — task delegation
- `agent_swarm_get*` — task details, swarm state
- `agent_swarm_poll*` — task polling
- `agent_swarm_join*` — swarm registration
- `agent_swarm_store*` — progress reporting
- `agent_swarm_my*` — self-info
- `agent_swarm_cancel*` — task cancellation
- `agent_swarm_task*` — task pool operations
- `agent_swarm_update*` — profile/service updates
- `agent_swarm_context*` — context history/diff
- `agent_swarm_inject*` — learning injection
- `agent_swarm_list*` — listing (channels, schedules, services, workflows)
- `agent_swarm_create*` — creation (channels, schedules, workflows)
- `agent_swarm_post*` — messaging
- `agent_swarm_read*` — message reading
- `agent_swarm_trigger*` — workflow triggering
- `agent_swarm_register*` — service registration
- `agent_swarm_unregister*` — service removal
- `agent_swarm_request*` — human-in-the-loop
- `agent_swarm_retry*` — workflow retry

**Plugins retained (not removed):**
- `spider-swarm` — still installed
- `hive-mind-plugin` — still installed

Plugins `spider-agent-v2` and `opencode-flowspec` were removed from the plugin array.

### 2. Agent Swarm Server Setup

**Repository cloned:** `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm`
- Source: https://github.com/desplega-ai/agent-swarm
- Version: 1.57.0 (commit cf69788)
- Dependencies installed via `bun install`

**API server configuration:**
- File: `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/.env`
- `API_KEY=${AGENT_SWARM_API_KEY}`
- `PORT=3013`
- `SWARM_URL=localhost`
- `SLACK_DISABLE=true`
- `GITHUB_DISABLE=true` (inherited from unset vars)
- `OPENAI_API_KEY=` (empty — memory search degrades to recency-based without it)

**Server process:**
- Command: `bun run start:http`
- Working directory: `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm`
- Log file: `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/api-server.log`
- Systemd service: `~/.config/systemd/user/agent-swarm.service` (enabled)

### 3. Environment Variable

Added to `~/.bashrc`:
```bash
export AGENT_SWARM_API_KEY=${AGENT_SWARM_API_KEY}  # Set in environment, never hardcode the actual value
```

### 4. AGENTS.md Created

Location: `/home/leviathan/AGENTS.md`

Contains the full architecture reference: MCP tool catalog, usage patterns (delegation, worker mode, memory, workflows), environment setup, and important notes about tool naming and context awareness.

### 5. Helper Scripts

**`~/swarm-ctl.sh`** — Control script with commands:
- `start` — Launch API server
- `stop` — Kill API server
- `status` — Check server, agents, and tasks
- `restart` — Stop and start
- `logs` — Tail API server logs
- `join-lead` — Register as lead via MCP
- `join-worker` — Register as worker via MCP

**`~/agent-swarm-start.sh`** — Standalone launcher script

### 6. Backup

Original config backed up to: `~/.config/opencode/opencode.json.backup.20260331_*`

---

## How to Use

### Registering as an Agent

Any agent (OpenCode session, CLI, or script) should use the MCP tools:

```
# Register as lead:
Use agent_swarm_join_swarm with lead=true, name="<agent-name>"

# Register as worker:
Use agent_swarm_join_swarm with lead=false, name="<agent-name>"
```

### Delegating Tasks

```
# Send task to specific agent:
Use agent_swarm_send_task with task="<description>", agentId="<uuid>"

# Send to task pool (any available worker):
Use agent_swarm_send_task with task="<description>" (no agentId)

# Poll for tasks (if acting as worker):
Use agent_swarm_poll_task
```

### Memory System

```
# Search for prior learnings:
Use agent_swarm_memory_search with query="<topic>"

# Retrieve specific memory:
Use agent_swarm_memory_get with id="<memory-id>"

# Save new learning:
Use agent_swarm_inject_learning with agentId="<target>", lesson="<content>"
```

### Workflows

```
# List available workflows:
Use agent_swarm_list_workflows

# Trigger a workflow:
Use agent_swarm_trigger_workflow with workflowId="<uuid>", input="<json>"
```

---

## Architecture

```
You (OpenCode TUI/IDE/CLI)
        |
   OpenCode (this session)
        |
   MCP: agent_swarm (localhost:3013)
        |
   Agent Swarm API Server (Bun + TypeScript, SQLite)
        |
   ┌────┼────┐
Worker  Worker  Worker
(Docker containers)
```

### Key Design Decisions

1. **MCP over plugins**: The primary integration path is through the MCP protocol, not OpenCode plugins. This gives access to the full agent-swarm toolset (50+ tools) with proper tool filtering.

2. **Plugins retained**: `spider-swarm` and `hive-mind-plugin` remain installed for backward compatibility. They may provide overlapping functionality — agents should prefer `agent_swarm_*` MCP tools for swarm operations.

3. **No OpenAI API key configured**: The memory embedding system will fall back to recency-based search. For full semantic memory search, set `OPENAI_API_KEY` in `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/.env`.

4. **Slack/GitHub disabled**: No external integrations configured. The server runs standalone with API + MCP only.

---

## File Locations

| File | Purpose |
|------|---------|
| `~/.config/opencode/opencode.json` | OpenCode config with MCP + plugins |
| `~/AGENTS.md` | Architecture reference for all agents |
| `~/OPENCODE_WORKSPACE/projects/agent-swarm/` | Agent swarm source + runtime |
| `~/OPENCODE_WORKSPACE/projects/agent-swarm/.env` | Server configuration |
| `~/agent-swarm/api-server.log` | Server log output |
| `~/swarm-ctl.sh` | Control script |
| `~/.config/systemd/user/agent-swarm.service` | Systemd unit |

---

## Verification

All endpoints confirmed working:

```bash
# API server
curl -H "Authorization: Bearer ${AGENT_SWARM_API_KEY}" http://localhost:3013/api/agents
# → {"agents":[]}

# MCP handshake
curl -X POST -H "Authorization: Bearer ${AGENT_SWARM_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  http://localhost:3013/mcp \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"opencode","version":"1.0.0"}}}'
# → {"result":{"serverInfo":{"name":"@desplega.ai/agent-swarm","version":"1.57.0"},...}}
```
