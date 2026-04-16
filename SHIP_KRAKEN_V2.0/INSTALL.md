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
├── build/index.js                        ← KRAKEN v2.0 primary bundle (526KB, Zod fix applied)
├── kraken-agent-source/                  ← Full kraken source tree
│   ├── src/                              ← TypeScript source (all tools)
│   └── wrappers/                         ← Python wrappers (self-contained)
│       ├── opencode_agent.py
│       ├── container_pool.py
│       └── kraken-agent-wrapper.py
├── subagent-manager/                     ← Subagent manager plugin
│   ├── dist/index.js                     ← Built: 966KB
│   └── wrappers/                         ← Python wrappers
├── shark-agent-src/                      ← Shark agent source
├── manta-agent-src/                      ← Manta agent source
├── package.json                          ← Project dependencies
└── INSTALL.md                            ← This file
```

**Everything needed is inside this folder.** No need to chase down external subagent-manager or wrappers.

---

## DEPENDENCY MAP

```
~/.config/opencode/opencode.json
  └── subagent-manager/dist/index.js      ← From SHIP: subagent-manager/dist/index.js
        └── wrappers/                     ← From SHIP: subagent-manager/wrappers/
  └── kraken-agent/dist/index.js          ← From SHIP: build/index.js
        └── wrappers/                     ← From SHIP: kraken-agent-source/wrappers/
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
mkdir -p ~/.config/opencode/plugins/shark-agent/dist
mkdir -p ~/.config/opencode/plugins/manta-agent/dist
```

---

## STEP 3 — Install Plugins

### Kraken Agent (primary)
```bash
cp SHIP_KRAKEN_V2.0/build/index.js ~/.config/opencode/plugins/kraken-agent/dist/
cp -r SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers ~/.config/opencode/plugins/kraken-agent/
```

### Subagent Manager
```bash
cp SHIP_KRAKEN_V2.0/subagent-manager/dist/index.js ~/.config/opencode/plugins/subagent-manager/dist/
cp -r SHIP_KRAKEN_V2.0/subagent-manager/wrappers ~/.config/opencode/plugins/subagent-manager/
```

### Shark Agent
```bash
cp SHIP_KRAKEN_V2.0/shark-agent-src/dist/index.js ~/.config/opencode/plugins/shark-agent/dist/
```

### Manta Agent
```bash
cp SHIP_KRAKEN_V2.0/manta-agent-src/dist/index.js ~/.config/opencode/plugins/manta-agent/dist/
```

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

**Note:** Plugin paths use `/opt/opencode/plugins/` which is correct for the standard opencode image. If your opencode uses a different path, adjust accordingly.

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

---

## TROUBLESHOOTING

### Zod Schema Error
If you see `TypeError: undefined is not an object (evaluating 'schema._zod.def')`, you're using an old bundle. Ensure you copied `build/index.js` from this ship package.

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

# Build kraken-agent
bun run build

# Build subagent-manager
cd subagent-manager
bun run build
```

---

## FILES IN THIS PACKAGE

| File/Dir | Description | Size |
|----------|-------------|------|
| `build/index.js` | Kraken v2.0 primary bundle | 526KB |
| `kraken-agent-source/src/` | TypeScript source | - |
| `kraken-agent-source/wrappers/` | Python wrappers | 49KB |
| `subagent-manager/dist/index.js` | Subagent manager bundle | 966KB |
| `subagent-manager/wrappers/` | Python wrappers | 49KB |
| `shark-agent-src/dist/index.js` | Shark agent bundle | 569KB |
| `manta-agent-src/dist/index.js` | Manta agent bundle | 158KB |