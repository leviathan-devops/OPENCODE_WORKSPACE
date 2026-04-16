# /swarm Commands Quick Reference

## Core Commands

| Command | Description |
|---------|-------------|
| `/swarm status` | Show current swarm state |
| `/swarm plan` | Show plan (optionally filter by phase number) |
| `/swarm agents` | List registered agents |
| `/swarm history` | Show completed phases summary |
| `/swarm config` | Show current resolved configuration |
| `/swarm config doctor` | Run config doctor checks |

## State Management

| Command | Description |
|---------|-------------|
| `/swarm diagnose` | Run health check on swarm state |
| `/swarm preflight` | Run preflight automation checks |
| `/swarm reset` | Clear swarm state files [--confirm] |
| `/swarm reset-session` | Clear session state (preserve plan, evidence, knowledge) |
| `/swarm rollback <phase>` | Restore swarm state to a checkpoint |
| `/swarm checkpoint [save\|restore\|delete\|list] <label>` | Manage project checkpoints |

## Execution

| Command | Description |
|---------|-------------|
| `/swarm turbo [on\|off]` | Toggle Turbo Mode for the active session |
| `/swarm promote` | Manually promote lesson to hive knowledge |
| `/swarm close` | Close swarm project and archive evidence |
| `/swarm handoff` | Prepare state for clean model switch (new session) |

## Knowledge & Evidence

| Command | Description |
|---------|-------------|
| `/swarm knowledge` | List knowledge entries |
| `/swarm knowledge migrate` | Migrate knowledge entries to current format |
| `/swarm knowledge quarantine <id> [reason]` | Move a knowledge entry to quarantine |
| `/swarm knowledge restore <id>` | Restore a quarantined knowledge entry |
| `/swarm evidence [taskId]` | Show evidence bundles |
| `/swarm evidence summary` | Generate evidence summary with completion ratio |
| `/swarm archive [--dry-run]` | Archive old evidence bundles |

## Analysis

| Command | Description |
|---------|-------------|
| `/swarm analyze` | Analyze spec.md vs plan.md for requirement coverage gaps |
| `/swarm dark-matter` | Detect hidden file couplings via co-change NPMI analysis |
| `/swarm simulate [--target <glob>]` | Dry-run impact analysis of proposed changes |
| `/swarm benchmark [--cumulative] [--ci-gate]` | Show performance metrics |

## Specification

| Command | Description |
|---------|-------------|
| `/swarm specify [description]` | Generate or import a feature specification |
| `/swarm clarify` | Clarify and refine an existing feature specification |
| `/swarm sync-plan` | Ensure plan.json and plan.md are synced |

## Export & Retrieval

| Command | Description |
|---------|-------------|
| `/swarm export` | Export plan and context as JSON |
| `/swarm retrieve <id>` | Retrieve full output from a summary |
| `/swarm write-retro <json>` | Write a retrospective evidence bundle |

## Special Commands

| Command | Description |
|---------|-------------|
| `/swarm curate` | Run knowledge curation and hive promotion review |

---

## Shortcut Commands

OpenCode registers these as standalone commands (no `swarm ` prefix needed):
- `swarm-status` → `/swarm status`
- `swarm-plan` → `/swarm plan`
- `swarm-agents` → `/swarm agents`
- `swarm-config` → `/swarm config`
- `swarm-turbo` → `/swarm turbo`
- `swarm-sync-plan` → `/swarm sync-plan`

---

## Common Usage Examples

```bash
# Start turbo mode for faster iteration
/swarm turbo on

# Check current state
/swarm status

# View the current plan
/swarm plan

# Run health diagnostics
/swarm diagnose

# Archive completed work
/swarm archive --dry-run
/swarm archive  # actual archive

# Rollback to phase 2
/swarm rollback 2

# Check knowledge base
/swarm knowledge

# Analyze requirement coverage
/swarm analyze
```
