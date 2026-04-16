# OPENCODE GARBAGE COLLECTOR - SYSTEM SPECIFICATION

**Version:** 2.0.0  
**Created:** 2026-04-14  
**Author:** Trident Brain

---

## OVERVIEW

The OpenCode Garbage Collector (opencode-gc) is a self-healing automated cleanup system that prevents memory/disk exhaustion caused by OpenCode's unbounded data growth.

**Design Goals:**
1. **Autonomous** - No manual intervention required
2. **Safe** - Never deletes active container images
3. **Self-healing** - Auto-regenerates via cron if died
4. **Non-blocking** - Lock mechanism prevents duplicate runs

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      opencode-gc.sh                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   init()    │───▶│ lock check  │───▶│   cleanup    │         │
│  │             │    │ & acquire   │    │   functions │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                                    │                 │
│         ▼                                    ▼                 │
│  ┌─────────────┐                      ┌─────────────┐         │
│  │  signals    │                      │   release   │         │
│  │  handlers   │                      │   lock      │         │
│  └─────────────┘                      └─────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │               CLEANUP FUNCTIONS                     │       │
│  ├─────────────────────────────────────────────────────┤       │
│  │  OpenCode Data:        Docker/Container:            │       │
│  │  - session_diffs      - stopped_containers         │       │
│  │  - large_session_diffs- dangling_images             │       │
│  │  - tool_output        - old_images (age-based)      │       │
│  │  - logs               - volumes                    │       │
│  │  - snapshot_global    - build_cache                │       │
│  │  - hive_mind                                        │       │
│  │  - opencode_db                                      │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## THRESHOLD CONFIGURATION

### OpenCode Data Limits

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_SNAPSHOT_GB` | 1 GB | Git pack repo size trigger |
| `MAX_SESSION_DIFF_GB` | 5 GB | Session diff total size |
| `MAX_HIVE_MIND_GB` | 2 GB | Hive mind total size |
| `MAX_TOOL_OUTPUT_GB` | 1 GB | Tool output total size |
| `MAX_LOG_MB` | 50 MB | Log directory size |
| `MAX_OPENCODE_DATA_GB` | 20 GB | Total OpenCode data |
| `MAX_CACHE_GB` | 10 GB | OpenCode cache size |

### Age-Based Cleanup

| Constant | Value | Description |
|----------|-------|-------------|
| `SESSION_DIFF_MAX_AGE_DAYS` | 7 | Delete diffs older than this |
| `TOOL_OUTPUT_MAX_AGE_DAYS` | 7 | Delete tool output older than this |
| `HIVE_MIND_MAX_AGE_DAYS` | 30 | Delete hive dirs older than this |
| `LOG_MAX_AGE_DAYS` | 3 | Delete logs older than this |
| `LARGE_DIFF_SIZE_MB` | 100 | Delete diffs larger than this |

### Docker/Container Limits

| Constant | Value | Description |
|----------|-------|-------------|
| `DOCKER_CONTAINER_TTL_HOURS` | 24 | Remove stopped containers older than this |
| `DOCKER_IMAGE_PRUNE_HOURS` | 168 | Prune images older than this (7 days) |
| `MAX_CONTAINER_COUNT` | 10 | Warn if more containers than this |
| `MAX_IMAGE_COUNT` | 20 | Warn if more images than this |
| `BUILD_CACHE_TTL_HOURS` | 72 | Remove build cache older than this |

---

## LOCK MECHANISM

### Files
```
~/.local/share/opencode/log/opencode-gc.lock   - Lock file
~/.local/share/opencode/log/opencode-gc.pid   - PID file
```

### Logic

```bash
acquire_lock() {
    if lock exists:
        if old_pid still running:
            exit 0  # Another instance is running
        else:
            remove stale lock
    write PID to lock file
    write PID to pid file
}
```

### Stale Lock Detection
- Checks if PID in lock file is still running via `kill -0`
- If not running, lock is considered stale and removed

---

## SIGNAL HANDLING

### Signals Caught

| Signal | Action |
|--------|--------|
| `EXIT` | Call cleanup_on_exit, always release locks |
| `SIGTERM` | Log shutdown, exit 143 |
| `SIGINT` | Log shutdown, exit 130 |
| `SIGHUP` | Log configuration reload |

### Cleanup on Exit
```bash
cleanup_on_exit() {
    if CLEANUP_DONE == 0:
        CLEANUP_DONE = 1
        remove lock file
        remove pid file
    log completion status
}
```

---

## CLEANUP FUNCTIONS

### OpenCode Data Functions

#### cleanup_session_diffs()
- Finds all `*.json` in `~/.local/share/opencode/storage/session_diff/`
- Deletes files older than `SESSION_DIFF_MAX_AGE_DAYS`
- Logs count before/after

#### cleanup_large_session_diffs()
- Finds all `*.json` in session_diff directory
- Deletes files larger than `LARGE_DIFF_SIZE_MB` (100MB)
- Used to clear bloated/corrupted diffs

#### cleanup_tool_output()
- Finds directories in `~/.local/share/opencode/tool-output/`
- Deletes contents older than `TOOL_OUTPUT_MAX_AGE_DAYS`

#### cleanup_logs()
- Finds `*.log` files in `~/.local/share/opencode/log/`
- Deletes logs older than `LOG_MAX_AGE_DAYS`
- Only runs if log size > 10MB

#### cleanup_snapshot_global()
- If `~/.local/share/opencode/snapshot/global/` > `MAX_SNAPSHOT_GB` (1GB):
  - Runs `git repack -ad` inside the git repo
  - Runs `git prune`
- Logs size before/after

#### cleanup_hive_mind()
- Finds directories in `~/.local/share/opencode/hive-mind/`
- Deletes directories older than `HIVE_MIND_MAX_AGE_DAYS` (30)

#### cleanup_opencode_db()
- Checks WAL file size (`opencode.db-wal`)
- If > 500MB, runs `PRAGMA wal_checkpoint(TRUNCATE)` via sqlite3

### Docker/Container Functions

#### cleanup_stopped_containers()
```bash
docker container prune -f --filter "until=${DOCKER_CONTAINER_TTL_HOURS}h"
```
Removes stopped containers older than 24 hours.

#### cleanup_dangling_images()
```bash
docker image prune -f
```
Removes all dangling (untagged) images.

#### cleanup_old_images()
**Key function - Age-based image cleanup with protection**

```bash
for each image:
    if matches PROTECTED_IMAGE_PATTERNS:
        skip
    if is_image_in_use(image):
        skip
    if get_image_age_hours(image) < 48:
        skip
    docker rmi image
```

**Protection Patterns:**
```
shark-|kraken-|opencode-|ghcr.io/anomalyco|leviathan/|
mattermost-|postgres|redis|python|nginx|telegram-bridge|
hermes-oc-agent|opencode-test|bot-bridge
```

#### cleanup_volumes()
```bash
docker volume prune -f
```
Removes all unused volumes.

#### cleanup_build_cache()
```bash
docker builder prune -f
```
Removes all builder cache.

---

## IMAGE AGE CHECK LOGIC

### is_image_in_use(image)
```bash
docker ps -aq --filter "ancestor=$image" | grep -q . && return 0
return 1
```
Returns 0 (true) if image is ancestor of any running container.

### get_image_age_hours(image)
```bash
created=$(docker inspect $image --format '{{.Created}}' | cut -d'.' -f1)
created_epoch=$(date -d "$created" +%s)
now_epoch=$(date +%s)
echo $(( (now_epoch - created_epoch) / 3600 ))
```
Returns hours since image creation.

---

## REPORTING FUNCTIONS

### report_sizes()
Shows sizes of all OpenCode data directories:
- OpenCode Data Total
- snapshot/global
- session_diff
- hive_mind
- tool_output
- logs
- opencode.db

### report_session_diffs()
Shows count of session diff files with warning thresholds:
- < 100: OK
- 100-500: WARNING
- > 500: CRITICAL

### report_docker()
Calls:
- report_docker_images()
- report_docker_volumes()
- report_docker_build_cache()

Shows container count with warning thresholds.

### check_disk_space()
Shows disk usage percentage:
- < 70%: OK
- 70-85%: WARNING
- > 85%: CRITICAL

### check_memory()
Shows:
- Available RAM (MB)
- Swap usage (used/total as %)
- Thresholds:
  - < 50%: OK
  - 50-80%: WARNING
  - 80-95%: HIGH
  - > 95%: CRITICAL

---

## COMMAND INTERFACE

### main()
```bash
main() {
    parse_args (--quiet, --dry-run, --force)
    if force:
        clear locks
    init()  # Sets up signals, acquires lock
    case command:
        status: show_status; release_lock
        install: install_cron; release_lock
        cleanup: show_status; run_cleanup; show_status; release_lock
        help: show_help; release_lock
        default: show_status; run_cleanup; show_status; release_lock
}
```

### Commands

| Command | Description |
|---------|-------------|
| `status` | Show system status only |
| `cleanup` | Run full cleanup (default) |
| `force` | Clear locks, force cleanup |
| `install` | Add to crontab |
| `help` | Show help |

### Options

| Option | Description |
|--------|-------------|
| `--quiet` | Suppress stdout (log only) |
| `--dry-run` | Show what would be cleaned |
| `--force` | Clear stuck locks |

---

## CRONTAB INSTALLATION

```bash
install_cron() {
    cron_entry="0 3 * * * $HOME/OPENCODE_WORKSPACE/projects/opencode-gc/opencode-gc.sh >> $HOME/.local/share/opencode/log/gc-cron.log 2>&1"
    if grep -q "opencode-gc" <(crontab -l 2>/dev/null); then
        ok "Cron job already installed"
    else
        echo "$cron_entry" | crontab -
    fi
}
```

Adds to crontab: `0 3 * * *` (3 AM daily)

---

## LOGGING

### Log Location
`~/.local/share/opencode/log/gc.log`

### Log Format
```
TIMESTAMP [LEVEL] message
```

### Levels
- `INFO` - Normal operations
- `WARN` - Warnings (thresholds exceeded)
- `ERROR` - Errors (failed operations)
- `OK` - Successful operations (with color)

### Functions
```bash
log()    # Generic log with level
info()   # INFO level
warn()   # WARN level (yellow)
error()  # ERROR level (red)
ok()     # OK level (green)
```

---

## EXIT CODES

| Code | Meaning |
|------|---------|
| 0 | Success - no issues |
| 1 | Completed with warnings |
| 130 | Received SIGINT (Ctrl+C) |
| 143 | Received SIGTERM |

---

## SELF-HEALING GUARANTEES

### Why GC Won't Stay Dead

1. **Crontab persistence** - Even if process crashes, cron re-runs it next day
2. **Stale lock detection** - Clears locks from dead processes
3. **Signal handlers** - Always releases locks on exit
4. **No external dependencies** - Only needs docker and standard bash tools

### Recovery Scenarios

| Scenario | Recovery |
|----------|----------|
| GC process killed mid-run | Locks released via EXIT trap |
| System reboot | Cron re-triggers at 3am next day |
| GC stuck (deadlock) | `force` command clears locks |
| Disk full (can't write log) | Gracefully exits, logs to stderr |
| Docker unavailable | Skips docker cleanup, continues |

---

## TESTING

### Lock Test
```bash
./opencode-gc.sh &
sleep 0.5
./opencode-gc.sh status
# Should show: GC is already running
```

### Signal Test
```bash
./opencode-gc.sh cleanup &
GC_PID=$!
kill -TERM $GC_PID
# Should clean up locks
```

### Dry Run Test
```bash
./opencode-gc.sh --dry-run
# Shows what would be cleaned
```

### Full Cleanup Test
```bash
./opencode-gc.sh cleanup
# Exit code 0 = success
```

---

## FILES

```
/home/leviathan/OPENCODE_WORKSPACE/projects/opencode-gc/
├── opencode-gc.sh       # Main script (823 lines)
├── package.json         # NPM metadata (v2.0.0)
└── README.md            # User documentation

~/.local/share/opencode/log/
├── gc.log               # Main log file
├── gc-cron.log          # Cron output log
├── opencode-gc.lock    # Lock file (runtime)
└── opencode-gc.pid     # PID file (runtime)
```

---

## VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-14 | Initial build - basic OpenCode cleanup |
| 2.0.0 | 2026-04-14 | Added Docker/container cleanup, lock mechanism, signal handling, cron install |

---

**END OF SPEC**