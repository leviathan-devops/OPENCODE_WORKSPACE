# Hive Mind Integration - Context Library

## Overview

This context library contains the integration plan for using **OpenViking** as the shared context database for opencode agents, creating a "hive mind" where all agents share context across sessions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  opencode session (any agent)                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Tools available: memsearch, memread, membrowse, memcommit │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│              ┌─────────────────────────────┐                   │
│              │   OpenViking HTTP Server     │                   │
│              │       (localhost:1933)        │                   │
│              └─────────────────────────────┘                   │
│                            │                                     │
│              ┌─────────────┼─────────────┐                     │
│              ▼             ▼             ▼                     │
│    viking://resources/hive-mind/shared/                       │
│    ├── workflows/    # SHARK artifacts                         │
│    ├── agents/       # Per-session context                     │
│    ├── memory/       # Cross-session memory                    │
│    ├── skills/       # Shark enforcement rules                  │
│    └── projects/     # Project-specific context                 │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. OpenViking Server (if not running)

```bash
/home/leviathan/OPENCODE_WORKSPACE/projects/hive-mind/scripts/start-openviking.sh
```

Or manually:
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/OpenViking
source .venv/bin/activate
openviking-server --config ~/.openviking/ov.conf
```

### 2. Verify Server Running

```bash
curl http://localhost:1933/health
# {"status":"ok","healthy":true,"version":"0.2.16.dev3"}
```

### 3. OpenCode Plugin

The OpenViking Memory Plugin is already installed at:
```
~/.config/opencode/plugins/openviking-memory.ts
~/.config/opencode/plugins/openviking-config.json
```

**No additional configuration needed** - OpenCode auto-discovers plugins in `~/.config/opencode/plugins/`.

## Shared Context Structure

### `viking://resources/hive-mind/shared/`

| Directory | Purpose |
|-----------|---------|
| `workflows/` | SHARK enforcement artifacts and state |
| `agents/` | Per-session agent context |
| `memory/` | Cross-session memory and patterns |
| `skills/` | Shared skill definitions including Shark enforcement |
| `projects/` | Project-specific context |

## Tools Available to Agents

When using opencode with the plugin enabled:

| Tool | Purpose |
|------|---------|
| `memsearch` | Search shared context (query, target_uri, mode, limit) |
| `memread` | Read content from viking:// URI (uri, level: auto/abstract/overview/read) |
| `membrowse` | Browse filesystem layout (uri, view: list/tree/stat) |
| `memcommit` | Trigger memory extraction for current session |

## Example Usage

### Search for relevant context
```
memsearch({ query: "project build workflow", target_uri: "viking://resources/hive-mind/shared/" })
```

### Read Shark enforcement rules
```
memread({ uri: "viking://resources/hive-mind/shared/skills/shark-enforcement.md", level: "auto" })
```

### Browse shared structure
```
membrowse({ uri: "viking://resources/hive-mind/shared/", view: "tree" })
```

## Context Library Contents

- `01_SETUP.md` - Detailed setup instructions
- `02_SKILLS.md` - Shark enforcement rules and workflow
- `03_CONTEXT_STRUCTURE.md` - Context organization
- `PLAN.md` - Integration plan and phases

## Key Concepts

### Tiered Context Loading (L0/L1/L2)

OpenViking automatically processes content into three tiers:
- **L0 (Abstract)**: ~100 token summary for quick retrieval
- **L1 (Overview)**: ~2k tokens for decision-making
- **L2 (Details)**: Full content, loaded on demand

### Memory Self-Evolution

At session end, OpenViking automatically:
- Extracts key information to `viking://user/memories/`
- Updates agent skills based on successful patterns
- Compresses old context to save tokens

### Session Continuity

New agents can see previous agent context:
1. Query `viking://resources/hive-mind/shared/memory/` for patterns
2. Query `viking://resources/hive-mind/shared/workflows/` for active builds
3. Query `viking://resources/hive-mind/shared/projects/` for project state

## Troubleshooting

### Server not responding
```bash
# Check if running
ps aux | grep openviking

# Restart
/home/leviathan/OPENCODE_WORKSPACE/projects/hive-mind/scripts/start-openviking.sh
```

### Plugin not loaded
```bash
# Verify plugin files exist
ls -la ~/.config/opencode/plugins/openviking*

# Check opencode health
opencode --doctor
```

### Context not syncing
```bash
# Force commit
memcommit({})

# Check session map
cat ~/.config/opencode/plugins/openviking-session-map.json
```

---

**Created**: March 31, 2026
**Status**: Phase 0 Complete (Infrastructure Ready)
**Next**: Phase 1 - Auto-context attachment
