# CHANGELOG - MILESTONE 4

## Date: 2026-04-14
## Status: WRAPPER PORT BUG FIXED - Container Spawn Verified

## Critical Bug Fixed

**Problem:** All three wrapper scripts had hardcoded port 8080 in the `serve` command:
```python
# BEFORE (BUGGY):
cmd += [IMAGE, "serve", "--port", "8080", "--hostname", "0.0.0.0"]
```

**Impact:**
- `opencode_agent.py`: Used `--network host` which ignores `-p` port mappings, so server always on port 8080 but health check tried port 18081 (or whatever was assigned)
- `container_pool.py` and `kraken-agent-wrapper.py`: Used bridge networking with `-p {port}:8080`, so external port was correct but internal was always 8080

**Fix:**
```python
# AFTER (FIXED):
cmd += [IMAGE, "serve", "--port", str(port), "--hostname", "0.0.0.0"]
```

**Files Fixed:**
- `opencode_agent.py` line 218
- `container_pool.py` line 236  
- `kraken-agent-wrapper.py` line 157

## Additional Fix: Container Health Host Detection

Added `_get_health_host()` function to detect when running inside a container and use the Docker gateway IP (172.17.0.1) instead of localhost for health checks.

## Verification Results

| Test | Result |
|------|--------|
| Python spawns container | ✅ Pass |
| Health check via gateway IP | ✅ Pass |
| Container runs opencode serve | ✅ Pass |
| Wrapper returns proper JSON | ✅ Pass |
| Container cleanup | ✅ Pass |

## Architecture Now Working

```
Host Machine
    │
    ├── Docker socket mounted into kraken-v2.0-test container
    │
    └── kraken-v2.0-test container (Python wrapper)
            │
            ├── spawn('python3', [opencode_agent.py, ...])
            │
            └── docker run --network host \
                    ghcr.io/anomalyco/opencode serve --port {assigned_port}
                            │
                            └── OpenCode server listens on 172.17.0.1:{assigned_port}
                                    │
                                    └── Health check: http://172.17.0.1:{assigned_port}/global/health
```

## Next Steps

1. **Container TUI Test**: Run full OpenCode TUI with kraken plugin loaded
2. **Verify real task execution**: Execute actual agent task, verify `docker ps` shows spawned containers
