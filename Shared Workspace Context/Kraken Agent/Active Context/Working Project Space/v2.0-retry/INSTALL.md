# INSTALL — KRAKEN AGENT v2.0
## Complete Self-Contained Deployment

> **Version:** 2.0  
> **Build date:** 2026-04-14  
> **Verified:** All tests pass in `kraken-v2.0-test:v2-fixed` container

---

## ⚠️ BEFORE YOU START — PATH SUBSTITUTION

This install script contains paths for a specific deployment environment. **Before running any command, replace all path placeholders:**

| Placeholder | Replace with |
|-------------|--------------|
| `/home/leviathan` | Your actual `$HOME` |
| `/home/leviathan/OPENCODE_WORKSPACE` | Your actual `OPENCODE_WORKSPACE` path |

**Quick substitution (run before starting):**
```bash
# Set your paths as variables:
MY_HOME="$HOME"
MY_WORKSPACE="$OPENCODE_WORKSPACE"

# Replace all occurrences in this file:
sed -i "s|/home/leviathan|${MY_HOME}|g; s|SHIP_KRAKEN_V2.0|${MY_WORKSPACE}/SHIP_KRAKEN_V2.0|g" INSTALL.md
```

---

## WHAT IS IN THIS PACKAGE

```
SHIP_KRAKEN_V2.0/
├── build/dist/
│   ├── index.js          ← KRAKEN v2.0 primary bundle (526KB, Zod fix applied)
│   └── node_modules/     ← Required dependencies (bundled)
├── kraken-agent-source/  ← Full kraken source tree
│   ├── src/              ← TypeScript source (all tools)
│   └── wrappers/          ← Python wrappers (self-contained)
│       ├── opencode_agent.py
│       ├── container_pool.py
│       └── kraken-agent-wrapper.py
├── subagent-manager/     ← Subagent manager plugin
│   ├── dist/
│   │   └── index.js      ← Built: 966KB
│   └── wrappers/         ← Python wrappers
├── shark-agent-src/      ← Shark agent (NOT a separate plugin - internal only)
├── manta-agent-src/      ← Manta agent (NOT a separate plugin - internal only)
├── package.json          ← Project dependencies
└── INSTALL.md           ← This file
```

**IMPORTANT:** Shark and manta agents are NOT separate OpenCode plugins. They are spawned internally by kraken-agent. Do NOT add them to opencode.json.

---

## DEPENDENCY MAP

```
~/.config/opencode/opencode.json
  └── subagent-manager/dist/index.js     ← From SHIP: subagent-manager/dist/index.js
        └── wrappers/                    ← From SHIP: subagent-manager/wrappers/
  └── kraken-agent/dist/index.js         ← From SHIP: build/dist/index.js
        └── node_modules/               ← From SHIP: build/dist/node_modules/
              └── wrappers/              ← From SHIP: kraken-agent-source/wrappers/
```

---

## PREREQUISITES (system-level)

- OpenCode 1.4.3+
- Docker running on host
- Bun runtime ≥1.0 (only needed if building from source)

---

## STEP 1 — Prerequisites

1. **Docker running on host** (required for container spawning)
2. **OpenCode 1.4.3+ installed**
3. **Bun runtime** ≥1.0 (only needed if building from source)

---

## STEP 2 — Create Plugin Directories

```bash
mkdir -p ~/.config/opencode/plugins/kraken-agent/dist
mkdir -p ~/.config/opencode/plugins/subagent-manager/dist
```

---

## STEP 3 — Install Plugins

### Kraken Agent (primary)
```bash
# Copy bundle WITH node_modules (required for Zod)
cp -r SHIP_KRAKEN_V2.0/build/dist ~/.config/opencode/plugins/kraken-agent/

# Copy Python wrappers (required for container spawning)
cp -r SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers ~/.config/opencode/plugins/kraken-agent/
```

### Subagent Manager
```bash
cp SHIP_KRAKEN_V2.0/subagent-manager/dist/index.js ~/.config/opencode/plugins/subagent-manager/dist/
cp -r SHIP_KRAKEN_V2.0/subagent-manager/wrappers ~/.config/opencode/plugins/subagent-manager/
```

### Shark and Manta Agents
**DO NOT INSTALL AS SEPARATE PLUGINS.** They are handled internally by kraken-agent.

---

## STEP 4 — Configure opencode.json

Create or update `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "minimax": {}
  },
  "plugin": [
    "file:///opt/opencode/plugins/subagent-manager/dist/index.js",
    "file:///opt/opencode/plugins/kraken-agent/dist/index.js"
  ],
  "agent": {
    "architect": {
      "disable": true
    }
  },
  "permission": {
    "*": {
      "*": "allow"
    }
  }
}
```

**Note:** Plugin paths use `/opt/opencode/plugins/` which is correct for the standard opencode image. If your opencode uses `~/.config/opencode/` instead, adjust accordingly.

---

## STEP 5 — Verify Installation

```bash
opencode run "test"
```

Expected output:
```
[v4.1][kraken-agent] Initializing Kraken Agent Harness {
  clusters: 3,
  agents: 11,
}
[v4.1][kraken-agent] Kraken Agent Harness initialized {
  clusterCount: 3,
  totalAgents: 11,
  krakenHiveReady: true,
}
```

---

## STEP 6 — Verify Tools

```bash
opencode debug agent kraken | grep -A50 '"tools"'
```

Expected tools:
- `anchor_cluster` ✅
- `spawn_cluster_task` ✅
- `spawn_shark_agent` ✅
- `spawn_manta_agent` ✅
- `kraken_hive_search` ✅
- `kraken_hive_remember` ✅
- `kraken_hive_inject_context` ✅
- `get_cluster_status` ✅
- `aggregate_results` ✅
- `run_subagent_task` ✅
- `run_parallel_tasks` ✅
- `cleanup_subagents` ✅

---

## TROUBLESHOOTING

### Zod Schema Error
If you see `TypeError: undefined is not an object (evaluating 'schema._zod.def')`, ensure you copied the ENTIRE `build/dist/` directory including `node_modules/`.

### Wrapper Not Found
Ensure wrappers are copied to the correct location:
- `~/.config/opencode/plugins/kraken-agent/wrappers/`
- `~/.config/opencode/plugins/subagent-manager/wrappers/`

### Container Spawn Fails
Ensure Docker is running on the host and the container has access to `/var/run/docker.sock`.

---

## BUILD FROM SOURCE (optional)

If you modify the source and need to rebuild:

```bash
cd SHIP_KRAKEN_V2.0

# Install dependencies
bun install

# Build kraken-agent (bundles node_modules)
cd kraken-agent-source
bun run build

# Note: After build, copy the entire dist/ directory including node_modules
```

---

## FILES IN THIS PACKAGE

| File/Dir | Description | Size |
|----------|-------------|------|
| `build/dist/index.js` | Kraken v2.0 primary bundle | 526KB |
| `build/dist/node_modules/` | Required dependencies | ~12MB |
| `kraken-agent-source/src/` | TypeScript source | - |
| `kraken-agent-source/wrappers/` | Python wrappers | 49KB |
| `subagent-manager/dist/index.js` | Subagent manager bundle | 966KB |
| `subagent-manager/wrappers/` | Python wrappers | 49KB |
| `shark-agent-src/` | Shark agent source (internal only) | - |
| `manta-agent-src/` | Manta agent source (internal only) | - |