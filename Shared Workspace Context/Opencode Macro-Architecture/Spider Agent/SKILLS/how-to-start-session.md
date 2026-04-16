# How to Start a Spider Agent Session

## Prerequisites

1. OpenCode is installed and running
2. Spider Agent plugin is installed at `~/OPENCODE_WORKSPACE/plugins/spider-agent/`
3. Plugin is registered in OpenCode configuration

## Starting a New Session

### Method 1: Via OpenCode CLI

```bash
opencode --agent spider
```

Or if you already have OpenCode running:
```
/agent spider
```

### Method 2: Start with a Task

```
/swarm specify Build a REST API for user management
```

This creates a spec and plan, then starts the pipeline.

### Method 3: Resume Existing Project

If you have an existing `.Spider/` directory in your project:

```bash
cd /path/to/project
opencode --agent spider
/swarm status
```

Spider will detect existing state and offer to resume or start fresh.

---

## First-Time Setup

### 1. Verify Plugin Installation

```bash
ls ~/OPENCODE_WORKSPACE/plugins/spider-agent/dist/
```

You should see `index.js` and various subdirectories.

### 2. Check OpenCode Configuration

In `~/.opencode/config.json` or project `.opencode.json`:

```json
{
  "plugins": {
    "enabled": ["spider-agent"]
  },
  "spider": {
    "agents": {
      "spider": {
        "model": "1-minimax/MiniMax-M2.7"
      }
    }
  }
}
```

### 3. Run Doctor Check

```
/swarm config doctor
```

This validates your configuration is correct.

---

## Starting Different Session Types

### Standard Development Session

```bash
# Start with exploration
/swarm specify [description of feature]

# Or start directly with plan
/swarm plan
```

### Debug/Investigation Session

```bash
/swarm turbo off   # Ensure full logging
/swarm diagnose    # Check state health
/swarm status      # View current state
```

### Knowledge Curation Session

```bash
/swarm knowledge
/swarm curate
```

---

## Verifying Session Started

Run `/swarm status` to verify Spider Agent is active:

```
$ /swarm status
Spider Agent State:
- Phase: planning
- Active Agent: architect
- Tasks: 3 pending, 1 in progress
- Context Budget: 45% used
- Last Update: 2 minutes ago
```

---

## Session Startup Checklist

- [ ] OpenCode is running
- [ ] Spider plugin is enabled
- [ ] Run `/swarm config doctor` to verify config
- [ ] Run `/swarm status` to confirm active state
- [ ] Verify models are accessible

---

## Troubleshooting Startup

### "Unknown command /swarm"

Plugin not loaded. Check:
```bash
opencode --plugins
# or
/opencode plugins list
```

### "Agent 'spider' not found"

Plugin registration issue. Verify:
```json
{
  "agents": {
    "spider": {
      "model": "..."
    }
  }
}
```

### "Model not available"

Check model IDs in config match provider format. Run:
```
/swarm config
```
