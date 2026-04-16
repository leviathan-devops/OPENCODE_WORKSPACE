# Shark Cloud - File Storage Architecture

## Overview

Shark Cloud stores files persistently on Railway using a mounted volume. The `/workspace` directory is the **persistent root** for all Shark Agent operations.

## Storage Locations

### 1. Persistent Storage (Volume-mounted)

| Path | Purpose | Persists |
|------|---------|----------|
| `/workspace/.shark/` | Shark agent state | ✅ Yes |
| `/workspace/.shark/evidence/{gate}/` | Gate evidence, test results | ✅ Yes |
| `/workspace/.shark/state/` | Session state | ✅ Yes |
| `/workspace/.shark/checkpoints/` | Versioned snapshots | ✅ Yes |
| `/workspace/tasks/{userId}/` | Per-user task workspaces | ✅ Yes |
| `/workspace/projects/{name}/` | Generated project directories | ✅ Yes |

### 2. Ephemeral Storage (Container-local)

| Path | Purpose | Persists |
|------|---------|----------|
| `/tmp` | Temporary files | ❌ No (lost on restart) |
| `/root/.cache/opencode` | OpenCode cache | ❌ No |
| `/root/.config/opencode` | Config + plugins | ⚠️ Re-created |

## Directory Structure

```
/workspace/                          # Persistent volume root
├── .shark/                          # Shark agent state
│   ├── evidence/
│   │   ├── plan/
│   │   ├── build/
│   │   ├── test/
│   │   ├── verify/
│   │   ├── audit/
│   │   └── delivery/               # Contains ContainerTestResult.json
│   ├── state/
│   │   ├── brain-state.json
│   │   └── gate-state.json
│   └── checkpoints/
│       └── {version-name}/
│           └── (checkpoint files)
├── tasks/                           # Per-user task workspaces
│   └── {userId}/
│       └── {taskId}/
│           └── (task-specific files)
└── projects/                        # Generated projects
    └── {project-name}/
        ├── src/
        ├── package.json
        └── (generated code)
```

## How Shark Agent Uses Storage

### 1. Evidence Collection
```
User task → Shark executes → Gate advances → Evidence written to .shark/evidence/{gate}/
```

Evidence files include:
- `ContainerTestResult.json` - Required for delivery gate
- Test outputs
- Build verification
- Audit results

### 2. State Persistence
```
Session created → State stored in .shark/state/
Session resumed → State restored from .shark/state/
```

### 3. Checkpoints
```
Major milestone → Checkpoint created in .shark/checkpoints/{version}/
Can be restored on failure
```

## Volume Configuration in Railway

### railway.json
```json
{
  "deploy": {
    "numReplicas": 1,
    "volumes": {
      "/workspace": {
        "persistent": true,
        "description": "Shark agent working files"
      }
    }
  }
}
```

### Docker Compose (Local)
```yaml
volumes:
  shark-workspace:
    driver: local
```

## Data Durability

| Event | What Happens to Data |
|-------|---------------------|
| Container restart | `/workspace` survives, `/tmp` lost |
| Volume migration | All data preserved |
| New deployment | Data preserved if volume re-attached |
| Volume deleted | **ALL DATA LOST** |

## Backup Recommendations

1. **Git integration**: Commit `/workspace` to git periodically
2. **Volume snapshots**: Use Railway's snapshot feature
3. **External backup**: rsync to external storage

```bash
# Example: Backup workspace from container
docker exec shark-cloud tar -czf - /workspace > backup.tar.gz
```

## Cleanup

Old checkpoints and evidence can consume significant space. Add cleanup to your deployment:

```bash
# In container startup script
find /workspace/.shark/checkpoints -type d -mtime +30 -exec rm -rf {} \;
find /workspace/.shark/evidence -type f -mtime +30 -exec rm -f {} \;
```

## Security Notes

- `/workspace` is **isolated** to this service
- No other containers can access
- Volume encryption at rest (Railway default)
- Keys and secrets should be in Railway environment variables, not workspace
