# KRAKEN V2.0 REBUILD - WITH PYTHON3 ENABLED IMAGE
## Complete Context Library for Proper Rebuild

**Version:** 2.0.0-PROPER  
**Date:** 2026-04-13  
**Status:** READY FOR BUILD  
**Image:** `opencode-python3:latest` (Python 3.12.13 enabled)

---

## Layer 1: Initial Plan

### Surface Understanding

**The Problem:** The shipped Kraken v2.0 (2026-04-12) was a **catastrophic failure** - a 52KB hollow shell that simulated task execution via 100ms timeouts instead of actually spawning Docker containers. Real execution never occurred.

**What We Need:** A Kraken v2.0 that:
1. Actually spawns Docker containers via Python wrappers
2. Uses a custom OpenCode image with Python3 pre-installed
3. Has no theatrical/simulated code
4. Verifies real execution via `docker ps`

**Core Insight:** The original v2.0 used an HTTP daemon workaround because OpenCode's base image didn't have Python. We now have a **custom image with Python3** built and ready. This simplifies the architecture - no more HTTP daemon dependency.

### First Principles

1. **Real Execution = Real Processes:** Any `execute`, `spawn`, or `run` function MUST spawn a real process. No timeouts pretending to work.

2. **Bundle Size = Code Truth:** Adding real features increases size. v1.1 = 521KB (real). v2.0 shipped = 52KB (fake). Size doesn't lie.

3. **Python3 Enables Direct Spawn:** With `opencode-python3:latest`, we can call `spawn('python3', [...])` directly inside containers instead of HTTP daemon workarounds.

4. **No Wrapper Daemon Dependency:** The custom image eliminates the `kraken-agent-wrapper.py` daemon on port 18086.

5. **Tests Must Verify Real Execution:** Tests passing = nothing. `docker ps` showing containers = real work.

### Constraints

1. **Must use `opencode-python3:latest`** - Custom image with Python 3.12.13
2. **Must call real Docker via Python wrappers** - `opencode_agent.py`, `container_pool.py`
3. **Must not break existing OpenCode** - Standard image still works for non-Kraken tasks
4. **Bundle size must be ~199KB+** - Plus 569KB shark, 158KB manta agent bundles
5. **No HTTP daemon required** - Direct spawn simplifies architecture

### Success Criteria

| Criteria | Verification |
|----------|-------------|
| Python3 in container | `docker run opencode-python3 python3 --version` → 3.12.13 |
| Bundle size proper | `ls -la kraken-agent/dist/` → ~199KB+ |
| No simulateTaskExecution | `grep -r "simulateTaskExecution" src/` → 0 results |
| Real Docker spawn | `docker ps` during task → containers visible |
| Container test passes | Run `kraken-self-test.sh` → real completion |

### Open Questions

1. ✅ **Resolved:** Python3 can be installed (Alpine `apk add python3 py3-pip`)
2. ✅ **Resolved:** Image built and tested (`opencode-python3:latest`)
3. ❓ **Pending:** Does ClusterInstance.ts need updating for direct spawn vs HTTP?
4. ❓ **Pending:** Should we deprecate `kraken-agent-wrapper.py` daemon?

---

## Layer 2: Detailed Workflow

### Component Architecture

```
kraken-agent-v2.0/
├── opencode-python3/               # NEW: Custom image with Python3
│   ├── Dockerfile                  # Builds opencode-python3:latest
│   └── README.md                   # Image documentation
│
├── subagent-manager/               # Execution Layer
│   ├── src/tools/index.ts         # run_subagent_task, run_parallel_tasks
│   └── wrappers/
│       ├── opencode_agent.py      # Python: spawns single Docker container
│       └── container_pool.py      # Python: manages container pool
│
├── kraken-agent/                   # Orchestration Layer (~199KB)
│   ├── dist/index.js
│   ├── shark-agent/               # Shark brain (~569KB) - REAL
│   ├── manta-agent/               # Manta brain (~158KB) - REAL
│   └── src/
│       └── clusters/
│           └── ClusterInstance.ts  # MUST use spawn('python3', [...])
│
└── kraken-context/                 # Context library
```

### Critical Path

```
User submits task
    ↓
spawn_cluster_task tool
    ↓
AsyncDelegationEngine.delegate()
    ↓
ClusterScheduler.assignCluster()
    ↓
ClusterInstance.executeTaskAsync()
    ↓
ClusterInstance.executeOnAgent()  ← NOW with Python3 image
    ↓
spawn('python3', [opencode_agent.py, ...args])
    ↓
Docker spawns opencode-python3 container
    ↓
Real agent executes real task
    ↓
JSON result returned
```

### What Changed from v2.0-BROKEN

| Aspect | v2.0-BROKEN | v2.0-PROPER |
|--------|-------------|-------------|
| Container Image | Standard (no Python) | `opencode-python3:latest` |
| Execution | HTTP to daemon (fake) | Direct `spawn('python3', [...])` |
| Wrapper | `kraken-agent-wrapper.py` on port 18086 | `opencode_agent.py` via spawn |
| Bundle Size | 52KB (hollow) | ~199KB+ (real) |
| simulateTaskExecution | EXISTS (theatrical) | REMOVED |

### Failure Modes to Prevent

| Mode | How v2.0 Failed | Prevention |
|------|-----------------|------------|
| Simulated execution | 100ms timeout | Use real `spawn()` |
| Missing Python | No python3 in container | Use `opencode-python3:latest` |
| HTTP daemon dependency | Daemon must run on host | Direct spawn, no daemon |
| Bundle size reduction | 521KB → 52KB | Verify sizes before ship |

---

## Layer 3: Self-Contained Context Library

### 00_INDEX.md

**Project:** Kraken v2.0 Rebuild with Python3 Image  
**Purpose:** Real multi-agent Docker container spawning  
**Image:** `opencode-python3:latest` (Alpine + Python 3.12.13)  
**Key Change:** Direct `spawn('python3', [...])` instead of HTTP daemon

### 01_SURFACE_ANALYSIS.md

**Problem:** Rebuild Kraken v2.0 to actually execute tasks via real Docker containers.

**Scope:**
- **In:** Using `opencode-python3:latest` for container spawning
- **Out:** HTTP daemon workarounds, theatrical code, simulated execution

### 02_ARCHITECTURE.md

```
┌─────────────────────────────────────────────────────────┐
│                    HOST MACHINE                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Docker Daemon (docker.sock)              │   │
│  └─────────────────────────────────────────────────┘   │
│                          ↑                             │
│                    spawns containers                    │
│                          │                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  opencode-python3:latest container               │   │
│  │  (OpenCode + Python 3.12.13)                     │   │
│  │                                                 │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │  ClusterInstance.executeOnAgent()          │  │   │
│  │  │  spawn('python3', ['opencode_agent.py']) │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  │                    │                             │   │
│  │                    ↓                             │   │
│  │  ┌───────────────────────────────────────────┐  │   │
│  │  │  opencode_agent.py                        │  │   │
│  │  │  (spawns another container on host)       │  │   │
│  │  └───────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Architectural Decision:** Python3 in container enables direct wrapper script execution without HTTP daemon on host.

### 03_COMPONENTS.md

| Component | Purpose | API |
|-----------|---------|-----|
| **opencode-python3** | Custom container image with Python 3.12 | Docker image |
| **ClusterInstance** | Task execution coordinator | `executeOnAgent()` → `spawn('python3', [...])` |
| **opencode_agent.py** | Wrapper script for container spawn | `python3 opencode_agent.py --task X --model Y` |
| **container_pool.py** | Pool manager for parallel tasks | `ContainerPool.run_all(tasks)` |

### 04_DATA_FLOW.md

```
spawn_cluster_task(task="Build React app")
    ↓
AsyncDelegationEngine.delegate()
    ↓
ClusterScheduler.assignCluster()
    ↓
ClusterInstance.executeTaskAsync(agent, request)
    ↓
ClusterInstance.executeOnAgent(agent, request)
    ↓
spawn('python3', [
    'subagent-manager/wrappers/opencode_agent.py',
    '--task', request.task,
    '--model', 'minimax/MiniMax-M2.7',
    '--workspace', '/home/leviathan/OPENCODE_WORKSPACE',
    '--timeout', '120'
])
    ↓
Python wrapper calls Docker SDK
    ↓
docker run opencode-python3:latest opencode --agent shark-alpha-1 --prompt "Build React app"
    ↓
Real container executes real task
    ↓
JSON result returned via stdout
    ↓
Kraken stores result and patterns in Hive
```

### 05_INTERFACES.md

**executeOnAgent() - NOW DIRECT SPAWN:**
```typescript
private async executeOnAgent(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
): Promise<KrakenDelegationResult> {
    const wrapperPath = path.join(
        __dirname, '..', '..', 'subagent-manager', 'wrappers', 'opencode_agent.py'
    );
    
    // Direct spawn - Python3 is available in opencode-python3:latest
    const proc = spawn('python3', [
        wrapperPath,
        '--task', request.task,
        '--model', request.model || 'minimax/MiniMax-M2.7',
        '--workspace', process.cwd(),
        '--timeout', '120'
    ]);
    
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });
        
        proc.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (e) {
                    resolve({ success: false, error: `Parse error: ${e.message}` });
                }
            } else {
                resolve({ success: false, error: stderr || `Exit code: ${code}` });
            }
        });
    });
}
```

**BEFORE (HTTP daemon):**
```typescript
// Required daemon on host at port 18086
const req = http.request({
    hostname: '127.0.0.1',
    port: 18086,
    path: '/execute',
    method: 'POST'
});
```

**AFTER (Direct spawn):**
```typescript
// No daemon needed - Python3 in container
const proc = spawn('python3', [wrapperScript, ...args]);
```

### 06_STATE_MANAGEMENT.md

- **Task Queue:** In-memory per cluster
- **Agent State:** `busy`, `currentTaskId`
- **Container State:** Managed by Docker daemon on host
- **No persistent wrapper process** - spawns fresh each time

### 07_ERROR_HANDLING.md

| Error | Handling |
|-------|----------|
| Python not found | Image validation error - use `opencode-python3:latest` |
| Wrapper script missing | Build verification failed - check wrappers/ directory |
| Docker socket unavailable | Host configuration error |
| Container timeout | Return `{ success: false, status: 'timeout' }` |
| Exit code != 0 | Return `{ success: false, error: stderr }` |

### 08_TESTING.md

**Image Verification:**
```bash
docker run --rm opencode-python3:latest --entrypoint /bin/sh -c "python3 --version"
# Expected: Python 3.12.13
```

**ClusterInstance Verification:**
```bash
grep -n "spawn.*python3" src/clusters/ClusterInstance.ts
# Should show: spawn('python3', [wrapperPath, ...])

grep -n "simulateTaskExecution" src/clusters/ClusterInstance.ts
# Should show: (nothing - theatrical code removed)
```

**Bundle Size Verification:**
```bash
ls -la kraken-agent/dist/index.js      # ~199KB
ls -la shark-agent/dist/index.js       # ~569KB
ls -la manta-agent/dist/index.js       # ~158KB
```

**Real Execution Verification:**
```bash
# In OpenCode with kraken-agent:
# Call spawn_cluster_task with a real task
# Then check:
docker ps  # Should show opencode-python3 containers running
```

### 09_DEPLOYMENT.md

**1. Build the image (if needed):**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/opencode-python3
docker build -t opencode-python3:latest \
              -t opencode:python3-enabled-1.4.3 \
              -t leviathan/opencode:python3-enabled-1.4.3 .
```

**2. OpenCode configuration:**
```json
{
  "plugins": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/shark-agent/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/manta-agent/dist/index.js"
  ]
}
```

**3. Container image (for subagent spawning):**
```json
{
  "container": {
    "image": "opencode-python3:latest"
  }
}
```

### 10_MENTAL_MODEL.md

**Think of Kraken v2.0 as a "traffic controller" that now has Python3 built-in:**

1. **User submits task** → "Build a React app"
2. **Kraken receives** → Routes to cluster
3. **Cluster assigns** → Selects Shark or Manta agent
4. **Direct spawn** → `spawn('python3', [wrapper])` - no HTTP daemon!
5. **Real work** → Actual agent in actual container
6. **Real result** → JSON returned with actual completion

**Key improvement:** The HTTP daemon workaround is gone. With Python3 in the container, we can directly spawn wrapper scripts just like we would on a normal system.

---

## Anti-Theatrical Checklist

- [ ] `opencode-python3:latest` image exists and has Python 3.12+
- [ ] `simulateTaskExecution` does NOT exist in codebase
- [ ] `spawn('python3', [...])` IS used in ClusterInstance.ts
- [ ] No HTTP daemon dependency in execution path
- [ ] Bundle sizes are proper (~199KB+ kraken, ~569KB shark, ~158KB manta)
- [ ] `docker ps` shows containers during task execution
- [ ] Tests verify real Docker spawn, not just "success: true"

---

## Image Registry

| Tag | Purpose | Size |
|-----|---------|------|
| `opencode-python3:latest` | Latest build | 782MB |
| `opencode:python3-enabled-1.4.3` | Versioned tag | 782MB |
| `leviathan/opencode:python3-enabled-1.4.3` | Local registry | 782MB |

**Location:** Local Docker registry on host  
**Base:** `ghcr.io/anomalyco/opencode:latest` (Alpine 3.23)

---

## Files Created

| File | Purpose |
|------|---------|
| `/home/leviathan/OPENCODE_WORKSPACE/opencode-python3/Dockerfile` | Image build spec |
| `/home/leviathan/OPENCODE_WORKSPACE/opencode-python3/README.md` | Image documentation |
| `/home/leviathan/OPENCODE_WORKSPACE/opencode-python3/CONTEXT_LIBRARY.md` | This document |

---

## Next Steps for v2.0 Proper Build

1. ✅ **DONE:** Built `opencode-python3:latest` with Python 3.12.13
2. ❓ **PENDING:** Update ClusterInstance.ts to use direct `spawn('python3', [...])` instead of HTTP
3. ❓ **PENDING:** Remove HTTP daemon dependency from documentation
4. ❓ **PENDING:** Rebuild subagent-manager if needed
5. ❓ **PENDING:** Verify all bundle sizes
6. ❓ **PENDING:** Run container test with `kraken-self-test.sh`
7. ❓ **PENDING:** Ship with new image reference
