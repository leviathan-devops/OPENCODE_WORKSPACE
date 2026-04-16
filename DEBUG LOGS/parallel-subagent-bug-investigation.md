# Parallel Subagent Bug Investigation — RESOLVED

**Date:** 2026-04-13  
**Original Report:** `OPENCODE_WORKSPACE/DEBUG LOGS/parallel-subagent-bug-investigation.md`  
**Status:** RESOLVED ✅  

---

## Bug 1: Python Spawn Crash (`SyntaxError: null bytes`)

### Original Error
```javascript
await run_parallel_tasks({ tasks: [...], workspace: "...", poolSize: 2 })
```
```
success: false
error: "Parallel Error (Exit 1): SyntaxError: source code cannot contain null bytes"
```

### Root Cause
**File:** `plugins/opencode-subagent-manager/src/tools/index.ts`, line 81

```typescript
// BROKEN — executePythonWrapper prepends 'python3' to its first argument:
const result = await executePythonWrapper('/usr/bin/python3', ['-c', shim]);
// Produces: python3 /usr/bin/python3 -c "<inline code>"
// Python tries to execute /usr/bin/python3 (ELF binary) as a script
// Reads ELF magic bytes (\x7fELF) → SyntaxError: null bytes
```

`executePythonWrapper` was designed for script files (e.g., `python3 opencode_agent.py --task ...`). Calling it with `'/usr/bin/python3'` as the "script path" breaks because it double-wraps python3.

### Fix Applied
**File:** `plugins/opencode-subagent-manager/src/tools/index.ts`

Added `import { spawn } from 'child_process'` and replaced line 81 with direct spawn:

```typescript
// REPLACED:
const result = await executePythonWrapper('/usr/bin/python3', ['-c', shim]);

// WITH:
const result = await new Promise<{ stdout: string, stderr: string, exitCode: number }>((resolve) => {
  const proc = spawn('python3', ['-c', shim]);
  let stdout = '';
  let stderr = '';
  proc.stdout?.on('data', (data) => stdout += data.toString());
  proc.stderr?.on('data', (data) => stderr += data.toString());
  proc.on('close', (code) => resolve({ stdout, stderr, exitCode: code ?? 0 }));
});
```

**Same fix applied to:** `SHIP_KRAKEN_V1.1/kraken-agent-source/subagent-manager/src/tools/index.ts`

### Files Changed

| File | Change |
|------|--------|
| `plugins/opencode-subagent-manager/src/tools/index.ts` | Added `spawn` import, replaced line 81 |
| `plugins/opencode-subagent-manager/dist/index.js` | Rebuilt: `bun run build` → 967KB |
| `SHIP_KRAKEN_V1.1/kraken-agent-source/subagent-manager/src/tools/index.ts` | Same fix applied |
| `SHIP_KRAKEN_V1.1/kraken-agent-source/subagent-manager/dist/index.js` | Rebuilt: 967KB |

---

## Bug 2: Python 3.9 Incompatibility (`TypeError: unsupported operand type(s) for |`)

### Original Error
```
TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'
```
At: `container_pool.py:72` — `def get_api_key(name: str) -> str | None:`

### Root Cause
Container runs Python 3.9. `X | Y` union type hint syntax requires Python 3.10+.

### Fix Applied
Added `from __future__ import annotations` as the second line of both wrapper files:

**Files fixed:**
| File | Path |
|------|------|
| `container_pool.py` | `hermes-workspace/projects/Shadow Magic/OpenCode Subagents/wrappers/` |
| `opencode_agent.py` | `hermes-workspace/projects/Shadow Magic/OpenCode Subagents/wrappers/` |
| `container_pool.py` | `SHIP_KRAKEN_V1.1/kraken-agent-source/wrappers/` |
| `opencode_agent.py` | `SHIP_KRAKEN_V1.1/kraken-agent-source/wrappers/` |

### Verification
```bash
python3 -c "
import sys
sys.path.insert(0, '/home/leviathan/hermes-workspace/projects/Shadow Magic/OpenCode Subagents/wrappers')
from container_pool import ContainerPool
from opencode_agent import ensure_container
print('OK on Python', sys.version_info.major, '.', sys.version_info.minor)
"
# Output: OK on Python 3 . 9
```

---

## Container Test Results (2026-04-13)

All tests run in `opencode-test:1.4.3` with exact production replica config.

| Test | Command | Result |
|------|---------|--------|
| Both plugins load | `opencode debug config --log-level DEBUG` | ✅ kraken-agent + subagent-manager registered |
| `get_cluster_status` | Agent call | ✅ 3 clusters, 9 agents, all idle |
| `spawn_shark_agent` routing | Agent call | ✅ shark-gamma-1, agentType: shark |
| `spawn_manta_agent` routing | Agent call | ✅ manta-gamma-1, agentType: manta |
| `run_parallel_tasks` spawn | Agent call | ✅ No more SyntaxError — correctly reaches Docker |
| Wrapper import (Python 3.9) | Direct python3 import | ✅ Both wrappers import cleanly |

---

## Architecture Note: Dual-Plugin System

`opencode-subagent-manager` and `kraken-agent-v1.1` are **two separate plugins**:

```
opencode-subagent-manager (workspace plugin)
  └── Exposes: run_subagent_task, run_parallel_tasks, cleanup_subagents
  └── Uses: hermes-workspace wrappers (Python/Docker)

kraken-agent-v1.1 (SHIP package)
  └── Exposes: spawn_shark_agent, spawn_manta_agent, get_cluster_status, etc.
  └── Delegates to: opencode-subagent-manager for container execution
```

Both must be present in `opencode.json`. Order matters — subagent-manager must be loaded before kraken-agent.

---

## Verification Commands

### Quick health check:
```bash
opencode debug config --print-logs --log-level DEBUG 2>&1 | grep -E 'kraken|subagent' -i | grep -v Auth
```

### Spawn fix verification:
```bash
grep -n "spawn.*python3.*-c" /home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js
# Must show: spawn('python3', ['-c', shim])
# Must NOT show: executePythonWrapper('/usr/bin/python3'
```

### Python 3.9 compat verification:
```bash
python3 -c "
import sys; sys.path.insert(0, '/home/leviathan/hermes-workspace/projects/Shadow Magic/OpenCode Subagents/wrappers')
from container_pool import ContainerPool; print('wrapper import OK')
"
```

---

**Resolved by:** opencode diagnostic session  
**Date:** 2026-04-13  
**Tested in container:** opencode-test:1.4.3
