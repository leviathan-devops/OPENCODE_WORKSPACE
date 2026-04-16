# CHANGELOG - MILESTONE 6

## Date: 2026-04-14
## Status: **REAL CONTAINER SPAWN VERIFIED**

## Major Breakthrough

**docker ps now shows spawned containers!**

```
kraken-oc-agent-118   ghcr.io/anomalyco/opencode   "opencode serve --po…"   3 seconds ago   Up 2 seconds   kraken-oc-agent-118
```

## Verified Working Chain

1. ✅ Python wrapper called
2. ✅ `docker run` spawns opencode container
3. ✅ Health check via localhost:PORT works
4. ✅ Task executes (echo, ls, etc.)
5. ✅ `docker ps` shows spawned container
6. ✅ Container cleaned up after task

## Bug Fixes Applied

### 1. Wrong Health Host (FIXED)
**Problem:** `_get_health_host()` returned WiFi gateway (192.168.100.1) instead of localhost when using --network host

**Fix:** Check if docker0 is DOWN - if so, use localhost

### 2. Wait Time Too Short (FIXED)
**Problem:** Only waited 15 seconds for container health

**Fix:** Increased to 45 seconds (opencode can take 20+ seconds on first run due to db migration)

### 3. Port Hardcoded (FIXED earlier)
**Problem:** serve command used hardcoded 8080 instead of assigned port

**Fix:** Use `str(port)` in serve command

## Test Results

```json
{
  "success": true,
  "text": "test\ndone",
  "tokens": 10090,
  "reason": "stop",
  "container": "kraken-oc-agent-118",
  "port": 18082
}
```

## Next Milestone

**Milestone 7: Kraken Agent TUI Test**
- Test the full kraken agent with cluster spawning
- Verify spawn_cluster_task tool works
- Verify docker ps shows multiple containers during parallel tasks
