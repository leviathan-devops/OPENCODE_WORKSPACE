# OpenCode Garbage Collector

**Version:** 2.0.0  
**Purpose:** Automated cleanup of OpenCode bloat to prevent memory/disk exhaustion  
**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/opencode-gc/`

---

## Quick Start

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/opencode-gc

# View status (no cleanup)
./opencode-gc.sh status

# Run cleanup
./opencode-gc.sh cleanup

# Install to crontab (runs daily at 3am)
./opencode-gc.sh install

# Show help
./opencode-gc.sh help
```

---

## Commands

| Command | Description |
|---------|-------------|
| `status` | Show system status and sizes (no cleanup) |
| `cleanup` | Run full cleanup (default) |
| `force` | Force cleanup even if another instance is running |
| `install` | Install cron job for automatic cleanup |
| `help` | Show full help with thresholds |

**Options:**
- `--quiet` - Suppress output to stdout (log only)
- `--dry-run` - Show what would be cleaned without actually cleaning

---

## What Gets Cleaned

### OpenCode Data
| Component | Age/Size Limit | Description |
|-----------|---------------|-------------|
| Session diffs | 7 days | Incremental session state diffs |
| Large diffs | >100MB | Abnormally large session files |
| Tool output | 7 days | Tool execution output directories |
| Logs | 3 days | Log files |
| Hive mind | 30 days | Cross-session memory directories |
| Snapshot | 1GB | Git pack repository for snapshots |

### Docker/Container
| Component | Limit | Description |
|-----------|-------|-------------|
| Stopped containers | 24h old | Containers not running |
| Dangling images | any | Untagged images |
| Unused images | 48h old | Images not matching protected patterns |
| Unused volumes | any | Orphaned volumes |
| Build cache | any | Builder cache entries |

---

## Protected Docker Images

The following image patterns are **never** cleaned:
```
shark-|kraken-|opencode-|ghcr.io/anomalyco|leviathan/|
mattermost-|postgres|redis|python|nginx|telegram-bridge|
hermes-oc-agent|opencode-test|bot-bridge
```

**Why:** These are active system images or actively used in containers.

---

## Self-Healing Design

The GC system is designed to be "set and forget":

### Lock Mechanism
- Lock file: `~/.local/share/opencode/log/opencode-gc.lock`
- PID file: `~/.local/share/opencode/log/opencode-gc.pid`
- Prevents duplicate instances from running simultaneously
- Stale locks are automatically cleared

### Signal Handling
- **SIGTERM/SIGINT**: Graceful shutdown, completes current operation, releases locks
- **Exit**: Always cleans up lock and PID files
- **SIGHUP**: Logs configuration reload

### Cron Auto-Regeneration
- Installs to crontab: `0 3 * * *` (daily at 3am)
- If cron dies, next scheduled run re-triggers it
- No external watchdog needed

---

## Logging

- **Main log:** `~/.local/share/opencode/log/gc.log`
- **Cron log:** `~/.local/share/opencode/log/gc-cron.log`
- Format: `[TIMESTAMP] [LEVEL] message`
- Levels: INFO, WARN, ERROR, OK

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Completed with warnings (e.g., disk >85%) |
| 143 | Received SIGTERM |
| 130 | Received SIGINT |

---

## History

| Date | Version | Change |
|------|---------|--------|
| 2026-04-14 | 1.0.0 | Initial build - basic OpenCode cleanup |
| 2026-04-14 | 2.0.0 | Added Docker/container cleanup, lock mechanism, signal handling, cron install |

---

## For Agents

### Debugging Stuck GC
```bash
# Check if GC is running
ps aux | grep opencode-gc

# Check lock files
ls -la ~/.local/share/opencode/log/opencode-gc.*

# Force clear locks and run
./opencode-gc.sh force
```

### Adding Protected Patterns
Edit line 38 in `opencode-gc.sh`:
```bash
readonly PROTECTED_IMAGE_PATTERNS="shark-|kraken-|YOUR_PATTERN|..."
```

### Manual Cleanup
```bash
# Clean session diffs older than 7 days
find ~/.local/share/opencode/storage/session_diff -name "*.json" -mtime +7 -delete

# Clean Docker build cache
docker builder prune -f

# Clean Docker volumes
docker volume prune -f
```