# How to Use /swarm Commands

## Command Syntax

All /swarm commands follow this pattern:
```
/swarm <command> [subcommand] [arguments]
```

Examples:
```
/swarm status
/swarm plan 2
/swarm checkpoint save "before refactor"
/swarm rollback 3
/swarm config doctor
```

---

## Essential Commands

### Check Status
```
/swarm status
```
Shows current phase, active agent, task counts, context usage.

### View Plan
```
/swarm plan
/swarm plan 3
```
Shows execution plan. With number, shows only that phase.

### List Agents
```
/swarm agents
```
Shows all registered agents and their current state.

---

## State Management

### Save Checkpoint
```
/swarm checkpoint save "before big change"
```

### Restore Checkpoint
```
/swarm checkpoint restore "before big change"
```

### List Checkpoints
```
/swarm checkpoint list
```

### Rollback to Phase
```
/swarm rollback 2
```
Restores state to start of phase 2.

### Clear Session (Keep Plan)
```
/swarm reset-session
```

### Full Reset (DANGER)
```
/swarm reset --confirm
```
Clears ALL Spider state including evidence and knowledge.

---

## Execution Control

### Turbo Mode (Faster)
```
/swarm turbo on
/swarm turbo off
```
When ON: bypasses some gates, uses smaller models for sub-agents.

### Close Project
```
/swarm close
```
Archives evidence and closes the swarm project.

---

## Investigation Commands

### Health Check
```
/swarm diagnose
```
Runs diagnostics on current state.

### Preflight Check
```
/swarm preflight
```
Runs automation readiness checks.

### Benchmark
```
/swarm benchmark
/swarm benchmark --cumulative
/swarm benchmark --ci-gate
```
Shows performance metrics.

---

## Evidence & Knowledge

### View Evidence
```
/swarm evidence
/swarm evidence task-123
```

### Evidence Summary
```
/swarm evidence summary
```
Shows completion ratio and blockers.

### Archive Old Evidence
```
/swarm archive --dry-run
/swarm archive
```

### Knowledge
```
/swarm knowledge
/swarm knowledge migrate
/swarm knowledge quarantine <id> [reason]
/swarm knowledge restore <id>
```

---

## Specification

### Create Specification
```
/swarm specify Build a login system with OAuth
```

### Clarify Existing
```
/swarm clarify
```

### Sync Plan Files
```
/swarm sync-plan
```

### Analyze Coverage
```
/swarm analyze
```

---

## Shortcuts

OpenCode registers shortcut commands. These work without the `swarm ` prefix:

| Full Command | Shortcut |
|-------------|----------|
| `/swarm status` | `swarm-status` |
| `/swarm plan` | `swarm-plan` |
| `/swarm agents` | `swarm-agents` |
| `/swarm config` | `swarm-config` |
| `/swarm turbo on/off` | `swarm-turbo` |
| `/swarm sync-plan` | `swarm-sync-plan` |

---

## Command Output

All commands return structured text output. If a command returns JSON or structured data, it's displayed in the chat as formatted text.

---

## Common Workflows

### Workflow: Start Feature
```
/swarm specify [feature description]
/swarm plan          # review the plan
/swarm turbo on      # speed up if confident
# ... implementation proceeds ...
/swarm status        # check progress
```

### Workflow: Debug Failed Gate
```
/swarm diagnose
/swarm evidence task-123
/swarm checkpoint save "before fix"
# make fixes manually
/swarm rollback [phase]  # if needed
```

### Workflow: Knowledge Curation
```
/swarm knowledge
/swarm curate
/swarm promote  # if something should be promoted
```
