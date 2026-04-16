# Spider Agent - Agent Swarm Integration Verification

## Status: IN PROGRESS

**Date:** 2026-04-01  
**Build Agent:** Completed initial setup  
**Verification Agent:** Pending

---

## What Was Completed

### 1. Spider Agent Plugin Installation ✅
- Created `~/.npm-global/lib/node_modules/spider-agent/` → symlink to `shark-agent-v4`
- OpenCode config updated to use `spider-agent` plugin
- Plugin loads successfully in OpenCode sessions

### 2. Docker Build Context ✅
- Copied `shark-agent-v4` to `agent-swarm/spider-agent/` for Docker build
- `Dockerfile.spider-worker` updated to use `opencode serve` (headless mode)
- Image builds successfully: `spider-agent-worker:latest`

### 3. Identity Files ✅
- Renamed all `SHARK.md` → `SPIDER.md` in identity directories:
  - `identity/coder/SPIDER.md`
  - `identity/reviewer/SPIDER.md`
  - `identity/test_engineer/SPIDER.md`
  - `identity/explorer/SPIDER.md`
  - `identity/sme/SPIDER.md`
  - `identity/lead/SPIDER.md`

### 4. `declare_scope` Fix ✅
- Applied fix to `shark-agent-v4/dist/index.js` (line ~59086)
- When no `.swarm/plan.json` exists, `declare_scope` returns success with warning instead of failure
- Fix verified in code: `grep -c "No swarm plan active" ~/.npm-global/lib/node_modules/spark-agent-v4/dist/index.js` returns `1`

---

## Current Architecture Issue

### The Problem
The `docker-entrypoint.sh` script (line 747) always runs:
```bash
exec gosu worker /usr/local/bin/agent-swarm "$ROLE" "$@"
```

The `agent-swarm` binary handles:
1. Task polling from the swarm API
2. Delegating task execution to the harness (pi, claude, or opencode)
3. Agent lifecycle management

But `Dockerfile.spider-worker` uses:
```dockerfile
ENTRYPOINT ["opencode", "serve"]
```

`opencode serve` just starts an HTTP server - it doesn't have:
1. Task polling loop
2. Swarm API integration
3. Agent lifecycle management

### What's Needed
For spider-agent to work as a swarm worker, there are two options:

**Option A: Use agent-swarm binary with HARNESS_PROVIDER=opencode**
- Modify `Dockerfile.spider-worker` to use the standard entrypoint
- The `agent-swarm` binary already has code to detect `HARNESS_PROVIDER=opencode`
- But it expects OpenCode to be run as a sub-process, not as a server

**Option B: Create OpenCode-specific worker runner**
- Create a new runner that polls swarm API and spawns OpenCode for each task
- Similar to how `agent-swarm` spawns Claude Code or Pi agents

---

## Verification Workflow (For Debugger Agent)

### Pre-Flight Checks

```bash
#!/bin/bash
# verify-spider-agent.sh

set -e

echo "=== Spider Agent Verification ==="
echo ""

# 1. Verify plugin installation
echo "1. Checking plugin installation..."
if [ -L ~/.npm-global/lib/node_modules/spider-agent ]; then
    echo "   ✓ spider-agent symlink exists"
else
    echo "   ✗ spider-agent symlink missing"
    exit 1
fi

# 2. Verify declare_scope fix
echo "2. Checking declare_scope fix..."
FIX_COUNT=$(grep -c "No swarm plan active" ~/.npm-global/lib/node_modules/spider-agent/dist/index.js || echo "0")
if [ "$FIX_COUNT" -gt 0 ]; then
    echo "   ✓ declare_scope fix applied"
else
    echo "   ✗ declare_scope fix missing"
    exit 1
fi

# 3. Verify Docker image builds
echo "3. Checking Docker image..."
if docker image inspect spider-agent-worker:latest > /dev/null 2>&1; then
    echo "   ✓ spider-agent-worker image exists"
else
    echo "   ✗ spider-agent-worker image not found"
    exit 1
fi

# 4. Verify identity files renamed
echo "4. Checking identity files..."
for role in coder reviewer test_engineer explorer sme lead; do
    if [ -f agent-swarm/identity/$role/SPIDER.md ]; then
        echo "   ✓ $role/SPIDER.md exists"
    else
        echo "   ✗ $role/SPIDER.md missing"
    fi
done

echo ""
echo "=== Verification Complete ==="
```

### Integration Test (Requires Debugger Agent)

**Test 1: OpenCode Plugin Loading**
```bash
cd /tmp && mkdir test-session && cd test-session
opencode run "test" --print-logs 2>&1 | grep -E "spider-agent|declare_scope"
```
Expected: `spider-agent loading plugin` and `declare_scope` registered

**Test 2: Vanilla Mode (No Swarm Plan)**
```bash
cd /tmp/vanilla-test  # No .swarm directory
opencode run "call declare_scope with taskId=1.1 files=['test.txt']"
```
Expected: Success with warning about vanilla mode

**Test 3: Docker Worker Build**
```bash
cd agent-swarm
docker build -f Dockerfile.spider-worker -t spider-agent-worker:test .
```
Expected: Build succeeds

**Test 4: Worker Registration (BLOCKED - needs architecture fix)**
```bash
docker run --rm \
  -e API_KEY=<key> \
  -e SWARM_API_URL=http://host.docker.internal:3013 \
  -e HARNESS_PROVIDER=opencode \
  -e WORKER_ROLE=coder \
  spider-agent-worker:latest
```
Expected: Worker should register with API and appear in `GET /api/agents`
Actual: `opencode serve` doesn't integrate with swarm API

---

## Open Issues

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| `opencode serve` doesn't poll swarm API | Critical | Open | Need agent-swarm binary integration or new runner |
| Worker not registering with swarm | Critical | Open | Blocked by above |
| `declare_scope` fix not in source | Low | Deferred | Source is in separate repo (zaxbysauce/opencode-swarm) |

---

## Next Steps for Debugger Agent

1. **Investigate `agent-swarm` binary with `HARNESS_PROVIDER=opencode`**
   - How does the binary use OpenCode?
   - Can it spawn `opencode serve` and interact with it?

2. **Check if there's an existing OpenCode harness integration**
   - Look at `src/providers/opencode-adapter.ts`
   - Understand how agent-swarm spawns OpenCode agents

3. **Determine if we need a new worker runner**
   - If `agent-swarm` can't use OpenCode as harness, create a new integration
   - Or use MCP client approach where OpenCode polls tasks via `agent_swarm_poll_task`

4. **Verify swarm MCP tools work in OpenCode**
   ```bash
   opencode run "call poll_task tool"
   ```
   Should return available tasks from the swarm API

---

## Architecture Reference

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Swarm API                         │
│                    (localhost:3013)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Lead Agent  │  │ Worker 1   │  │ Worker N    │         │
│  │ (claude)   │  │ (spider)   │  │ (pi)        │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │
│         │    MCP         │    MCP         │    MCP         │
│         └────────────────┴────────────────┘                │
│                      ^                                     │
│                      │                                     │
│         ┌───────────┴───────────┐                          │
│         │  agent-swarm binary  │                          │
│         │  (task polling &     │                          │
│         │   harness dispatch)   │                          │
│         └───────────┬───────────┘                          │
│                     │                                      │
│         ┌───────────┴───────────┐                          │
│         │   HARNESS_PROVIDER    │                          │
│         │  ┌─────────────────┐ │                          │
│         │  │ claude | pi |    │ │                          │
│         │  │ opencode        │ │                          │
│         │  └─────────────────┘ │                          │
│         └───────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

For OpenCode (spider-agent) to work as a worker, it needs to be integrated as a HARNESS_PROVIDER, similar to how pi and claude are used.

---

## File Locations

| File | Path |
|------|------|
| Spider Agent Plugin | `~/.npm-global/lib/node_modules/spider-agent/` (symlink → shark-agent-v4) |
| Docker Context | `agent-swarm/spider-agent/` |
| Dockerfile | `agent-swarm/Dockerfile.spider-worker` |
| Docker Compose | `agent-swarm/docker-compose.spider.yml` |
| Identity Files | `agent-swarm/identity/{role}/SPIDER.md` |
| OpenCode Config | `~/.config/opencode/opencode.json` |
| Agent Swarm API | Running on `localhost:3013` |

---

**Created:** 2026-04-01  
**Last Updated:** 2026-04-01  
**Next Action:** Debugger agent to investigate harness integration
