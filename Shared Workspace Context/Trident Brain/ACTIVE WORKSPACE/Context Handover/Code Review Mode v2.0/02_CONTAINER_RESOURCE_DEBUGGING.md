# CONTAINER RESOURCE DEBUGGING INVESTIGATION
## Investigation Log - 2026-04-14

---

## SURFACE UNDERSTANDING

### Problem Statement
Containers spawned for agent testing were causing excessive hardware resource usage (CPU/RAM). User asked to investigate the source.

### Initial Observation

```bash
docker images | grep agent-swarm
agent-swarm-spider-worker-coder: 2.93GB (791MB content)
agent-swarm-worker-coder: 2.18GB (583MB content)
agent-swarm-worker: 2.82GB (780MB content)

vs.

ghcr.io/anomalyco/opencode:latest: 250MB (62.8MB content)
```

Custom agent-swarm images are **10x larger** than standard OpenCode image.

---

## INVESTIGATION STEPS

### Step 1: Check Active OpenCode Config

**Finding:** agent-swarm is NOT in active OpenCode config.

```json
// ~/.config/opencode/opencode.json
{
  "plugin": [
    "opencode-subagent-manager",
    "coding-subagents",
    "opencode-plugin-engineering",
    "kraken-agent-v1.1",
    "shark-agent-v4.7-hotfix-v3",
    "manta-agent-v1.5",
    "trident-brain"
  ]
}
```

**Result:** agent-swarm images not being loaded by local OpenCode.

### Step 2: Check Override Config

**Finding:** Same - no agent-swarm references.

```json
// ~/.opencode/opencode.jsonc
{
  "plugin": [
    "Hermes Agent Plugin",
    "manta-agent",
    "shark-agent",
    "trident-brain"
  ]
}
```

**Result:** agent-swarm not in any active OpenCode config.

### Step 3: Find Dockerfiles

```bash
find /home/leviathan/OPENCODE_WORKSPACE -name "Dockerfile*" 2>/dev/null
```

Found:
```
/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/Dockerfile
/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/Dockerfile.worker
/home/leviathan/OPENCODE_WORKSPACE/.shark/container/Dockerfile
/home/leviathan/OPENCODE_WORKSPACE/.shark/container-kraken-v2/Dockerfile
/home/leviathan/OPENCODE_WORKSPACE/container-build/Dockerfile
```

### Step 4: Analyze Dockerfile.worker

**Why it's 2.8GB:**

```dockerfile
FROM ubuntu:24.04

# Installs extensive packages
RUN apt-get install -y \
    nodejs npm \
    build-essential make cmake gcc g++ \
    python3 python3-pip python3-venv \
    ...

# Installs OpenCode globally
RUN npm install -g opencode-ai

# Installs AI SDK providers
RUN npm install -g vercel-minimax-ai-provider @ai-sdk/openai-compatible
```

**Root Cause:** Full ubuntu base + build tools + multiple runtimes = massive image.

### Step 5: Check Active Containers

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

**Result:**
```
shark-v483         opencode-test:1.4.3          Up 5 minutes
hermes-oc-agent-1266911   ghcr.io/anomalyco/opencode   Up 28 minutes
```

**No agent-swarm containers actively running.**

### Step 6: Check Process Resource Usage

```bash
docker stats --no-stream
shark-v483        0.00%     456KiB / 30.96GiB
hermes-oc-agent   0.00%     23.1MiB / 30.96GiB
```

**Active containers are using minimal resources.**

---

## ROOT CAUSE ANALYSIS

### The agent-swarm images were built but NOT actively used

| Component | Status |
|-----------|--------|
| agent-swarm Dockerfile.worker | EXISTS (2.8GB) |
| agent-swarm images built | YES |
| Active in OpenCode config | NO |
| Active containers | NO |

### Why Images Are Large

1. **Full Ubuntu 24.04 base** (not slim)
2. **Build essentials** (gcc, make, cmake)
3. **Multiple runtimes** (Node, Python, Bun)
4. **AI SDK providers** (multiple npm packages)
5. **No multi-stage optimization** (worker image doesn't use multi-stage)

### Potential Resource Drain Sources

Since agent-swarm containers weren't running, the heavy resource usage might be from:

1. **Orphaned opencode processes** - Multiple TTY sessions with opencode processes (found 18 running)
2. **Memory bloat in node_modules** - Large npm packages
3. **Electron/GUI overhead** - If using TUI

**However, user reported containers specifically were heavy - need further investigation.**

---

## FINDINGS

### Confirmed

1. **agent-swarm images are 10x larger** than standard OpenCode
2. **agent-swarm is NOT in active OpenCode config**
3. **No agent-swarm containers are running**
4. **Active containers use minimal resources** (456KiB, 23MiB)

### NOT Determined

1. **How/if agent-swarm images were being absorbed into other containers**
2. **Why user experienced heavy resource usage specifically from containers**
3. **If there was a container spawn mechanism pulling these images**

---

## EVIDENCE FILES

### Docker Image Evidence

```bash
# Image sizes
docker images | grep -E "agent-swarm|opencode"

# Image history (build layers)
docker history agent-swarm-worker:latest

# Inspect root filesystem
docker inspect agent-swarm-worker:latest | grep RootFS
```

### Config Evidence

```bash
# Active OpenCode config
cat ~/.config/opencode/opencode.json

# Override config
cat ~/.opencode/opencode.jsonc

# Search for swarm references
find ~/.config/opencode -name "*.json" | xargs grep -l "swarm"
```

---

## ACTION ITEMS

### Immediate

- [ ] User confirmed NOT to kill active opencode sessions
- [ ] Investigation paused until user provides more specific reproduction steps

### Potential Next Steps

1. **Audit spawn mechanism** - Find where containers are being spawned:
   - Check `ClusterInstance.ts` references to wrapper scripts
   - Check `subagent-manager` tool definitions
   - Check for `docker run` commands in plugin code

2. **Verify image sources** - Determine if agent-swarm images are being pulled by mistake:
   - Check docker-compose files
   - Check CI/CD pipelines
   - Check wrapper scripts

3. **Optimize Dockerfile.worker** - If agent-swarm is needed:
   - Use `ubuntu:slim` instead of `ubuntu:24.04`
   - Remove build essentials if not needed
   - Use multi-stage builds
   - Target <500MB

---

## REFERENCES

### Related Files

| Path | Purpose |
|------|---------|
| `/home/leviathan/OPENCODE_WORKSPACE/projects/agent-swarm/Dockerfile.worker` | 2.8GB worker image definition |
| `/home/leviathan/OPENCODE_WORKSPACE/.shark/container/Dockerfile` | Shark test container |
| `/home/leviathan/OPENCODE_WORKSPACE/container-build/Dockerfile` | Custom opencode container |
| `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/src/clusters/ClusterInstance.ts` | Container spawn logic |
| `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/container_testing_discovery.md` | Previous container test learnings |

### Key Learnings

1. **Container images can bloat easily** - Need multi-stage builds + slim base
2. **Custom images need auditing** - What gets included vs. what's needed
3. **Don't assume orphaned processes** - Verify before killing (learned the hard way)
4. **Active config isn't the only source** - Dockerfiles can exist without being used

---

*Investigation suspended pending user input on reproduction steps*
