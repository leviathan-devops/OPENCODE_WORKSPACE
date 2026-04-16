# Plugin Coding Agent CLI

**What it is**: A skill for spawning OpenCode containers as sub-agents — giving Hermes/OpenCode agents the ability to run parallel, stateful coding sub-agents mid-build.

**Why it exists**: OpenCode containers are full OpenCode engines running in Docker, with access to all configured models (MiniMax M2.7, GLM-4, etc.), file tools, and the complete OpenCode plugin system. This is not an external CLI wrapper — it's a native sub-agent capability.

**When to use**:
- Test plugins in isolation without polluting the host environment
- Run parallel code reviews, analyses, or builds across multiple containers
- Give a sub-agent a complete OpenCode engine with tool execution
- Spawn a one-shot coding agent for a specific task then destroy it

---

## Quick Start

### 1. Single Task (one-liner)

```bash
python3 wrappers/opencode_agent.py \
  --task "Create /workspace/hello.py that prints 'Hello from sub-agent!'" \
  --workspace /path/to/project \
  --model minimax/MiniMax-M2.7 \
  --timeout 60
```

Output:
```json
{
  "success": true,
  "text": "Created `/workspace/hello.py`...",
  "tokens": 11499,
  "cost": 0.0,
  "reason": "stop",
  "container": "hermes-oc-agent-12345",
  "port": 18082
}
```

### 2. Parallel Sub-Agents (Container Pool)

```python
from wrappers.container_pool import ContainerPool

pool = ContainerPool(size=3)
pool.start()

results = pool.run_all([
    {"task": "Review /workspace/auth.ts for security issues", "model": "minimax/MiniMax-M2.7", "timeout": 60},
    {"task": "Review /workspace/api.ts for security issues", "model": "minimax/MiniMax-M2.7", "timeout": 60},
    {"task": "Review /workspace/db.ts for security issues", "model": "minimax/MiniMax-M2.7", "timeout": 60},
])

for r in results:
    print(f"Review: {r['text'][:100]}")

pool.cleanup()
```

### 3. CLI Pool Management

```bash
# Start a pool of 3 containers
python3 wrappers/container_pool.py --create 3

# List running containers
python3 wrappers/container_pool.py --list

# Kill all pool containers
python3 wrappers/container_pool.py --kill-all
```

---

## Architecture

```
Hermes (orchestrator)
  ├── spawns → opencode_agent.py → Docker container (ghcr.io/anomalyco/opencode)
  │                                        ├── /workspace mounted from host
  │                                        ├── Config mounted read-only
  │                                        ├── API keys passed as env vars
  │                                        └── Full OpenCode engine + all models
  │
  └── parallel → container_pool.py → N containers for parallel tasks
                                           └── ThreadPoolExecutor for concurrency
```

### What Each Container Gets

| Resource | Access |
|----------|--------|
| Models | minimax/MiniMax-M2.7, GLM-4.5-Flash, any configured provider |
| File tools | Read/write/glob within /workspace |
| OpenCode plugins | Configured plugins (if paths reachable) |
| Build tools | **None** — container is opencode runtime only |
| Network | Full network access |

---

## Wrapper Scripts

| Script | Purpose |
|--------|---------|
| `wrappers/opencode_agent.py` | Single-task sub-agent. Spawns container, runs task, returns JSON |
| `wrappers/container_pool.py` | Pool manager. Starts N containers, distributes tasks in parallel |

### opencode_agent.py

```bash
python3 opencode_agent.py [options]

Options:
  -t, --task TEXT        Task prompt (required)
  -m, --model MODEL     Model (default: minimax/MiniMax-M2.7)
  --timeout SECONDS     Timeout (default: 60)
  --container NAME      Reuse existing container
  --port PORT           Port for existing container
  -w, --workspace PATH  Host directory mounted at /workspace
  --cleanup             Kill container after task
  --json-only           Output only the text response
```

### container_pool.py

```bash
# CLI mode
python3 container_pool.py --create N     # Start N containers
python3 container_pool.py --list          # Show running
python3 container_pool.py --kill-all     # Destroy all

# Python mode
from container_pool import ContainerPool
pool = ContainerPool(size=3)
pool.start()
results = pool.run_all(tasks)
pool.cleanup()
```

---

## Workflows

### Plugin Testing Pipeline

```python
# 1. Build plugin on host (has npm/bun)
import subprocess
subprocess.run(["npm", "run", "build"], cwd="/path/to/plugin")

# 2. Test inside container (isolated OpenCode environment)
from wrappers.opencode_agent import run_task
result = run_task(
    task="Load the plugin at /workspace and run its test suite",
    model="minimax/MiniMax-M2.7",
    workspace="/path/to/plugin",
    timeout=90
)

# 3. Parse result
if result["success"]:
    print(f"Tests passed: {result['text']}")
else:
    print(f"Error: {result['error']}")
```

### Parallel Code Review

```python
pool = ContainerPool(size=4)
pool.start()

files = ["auth.py", "api.py", "db.py", "utils.py"]
tasks = [
    {"task": f"Security review: {open(f'/ws/{f}').read()}", "model": "minimax/MiniMax-M2.7"}
    for f in files
]

results = pool.run_all(tasks)
pool.cleanup()

# Aggregate findings
for r in results:
    print(r["text"][:200])
```

### Sequential Refinement

```python
# Round 1: Analysis
result = run_task("Analyze /workspace/module.ts, list issues by severity", workspace="/path")

# Round 2: Fix (autonomous)
result = run_task(f"Fix these issues: {result['text']}", workspace="/path", timeout=120)

# Round 3: Validation
result = run_task(f"Validate fixes against original: {open('/workspace/module.ts').read()}", workspace="/path")
```

---

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | This file |
| `agent-coding-cli-architecture.md` | Detailed architecture, patterns, anti-patterns |
| `wrappers/opencode_agent.py` | Single-task sub-agent wrapper |
| `wrappers/container_pool.py` | Parallel container pool manager |

---

## Limitations

1. **No build tools in container** — npm/bun not available. Build on host, test inside container.
2. **Container startup time** — ~4s overhead per new container. Pool reuse mitigates this.
3. **Workspace isolation** — Each container gets its own /workspace. Files created inside don't persist to host unless mounted.
4. **Port pool** — Limited to ~14 concurrent containers (ports 18081-18095). Adjust `PORTS` range if needed.
