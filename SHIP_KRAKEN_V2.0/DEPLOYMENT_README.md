# KRAKEN V2.0 — DEPLOYMENT GUIDE

**Version:** 2.0 | **Status:** DEPLOYED + FIXED  
**Bundle:** 572ff6d3b1867004e35d9baf7dcc4737 (FIXED hooks + wrapper path)
**Previous Bundle:** 9c01485490a7a344cffec782b99397b4
**Original Buggy Bundle:** 59cc4bba07bba0410d1f1dd074c691da

---

## POST-SHIP FIXES APPLIED

### Fix 4: V2.0 Hooks Wired Up ✅ (2026-04-15)
- **Bug:** V2.0 hooks (TwoLayerGuardian, CompactionManager, etc.) were defined but NOT registered
- **Fix:** Registered all V2.0 hooks in plugin factory:
  - `event`: createEventHook() - session.created, session.compacting
  - `chat.message`: createChatMessageHook() - Layer 2 message enforcement
  - `tool.execute.before`: createToolGuardianHook() - Layer 1 tool enforcement
  - `tool.execute.after`: createGateHook() - Post-tool gate evaluation
- **Result:** Multi-brain architecture now actively coordinates

### Fix 1: Wrapper Path Bug ✅
- **Bug:** Bundle looked for `~/.config/opencode/plugins/plugins/subagent-manager/` (WRONG)
- **Fix:** Changed to `~/.config/opencode/plugins/subagent-manager/` (CORRECT)
- **Files Fixed:**
  - `build/index.js` (line 816)
  - `kraken-agent/dist/index.js` (line 816)
  - `kraken-agent-source/src/clusters/ClusterInstance.ts` (source reference)

### Fix 2: Standalone Shark/Manta Plugins ✅
- **Bug:** Config overwriting removed standalone shark/manta agents
- **Fix:** Added to plugin list in opencode-config.json:
  - `file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v481/dist/index.js`
  - `file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js`

### Fix 3: Kraken Agent Color ✅
- **Added:** `"color": "#F5F0E8"` (warm cream/offwhite gold) to kraken agent config

---

## IMPORTANT: Read Before Deploying

**⚠️ CRITICAL: This package does NOT contain a complete opencode.json**

Deploying this package's opencode-config.json directly will **OVERWRITE** your existing config and **REMOVE ALL OTHER PLUGINS**.

---

## Correct Deployment Process

### Step 1: Backup Existing Config

```bash
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.backup-$(date +%Y%m%d_%H%M%S)
```

### Step 2: Deploy Bundle Only

```bash
# Copy bundle to plugin directory
mkdir -p ~/.config/opencode/plugins/kraken-agent-v2.0/
cp build/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/

# Copy subagent-manager wrappers
mkdir -p ~/.config/opencode/plugins/subagent-manager/
cp -r subagent-manager/wrappers ~/.config/opencode/plugins/subagent-manager/
```

### Step 3: Merge Plugin Into Existing Config

**DO NOT REPLACE** your existing opencode.json. **MERGE** the plugin entries into your existing plugin list.

**Keep ALL existing plugin entries and ADD these:**
```json
"file:///home/leviathan/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js",
"file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v481/dist/index.js",
"file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
```

### Step 4: Add Kraken Agent Config

Add to the `agent` section of your opencode.json:
```json
"kraken": {
  "name": "kraken",
  "description": "Kraken - Central orchestrator with full Hive access",
  "mode": "primary",
  "permission": { "task": "allow" },
  "color": "#F5F0E8"
}
```

### Step 5: Verify Deployment

```bash
opencode debug agent kraken
# Should show: clusterCount: 3, totalAgents: 11, krakenHiveReady: true

opencode debug plugins
# Should list: spider-agent, hive-mind-plugin, kraken-agent-v2.0, subagent-manager, shark-agent-v481, manta-agent-v1.5
```

---

## What's Included

```
SHIP_KRAKEN_V2.0/
├── build/
│   └── index.js          # Kraken v2.0 bundle (FIXED wrapper path)
├── kraken-agent-source/   # TypeScript source (reference)
├── subagent-manager/     # Subagent manager plugin
│   └── wrappers/         # Python wrappers (opencode_agent.py, container_pool.py, kraken-agent-wrapper.py)
├── shark-agent-src/      # Shark agent source
├── manta-agent-src/      # Manta agent source
├── Dockerfile.test       # Test container
├── opencode-config.json  # Reference config (DO NOT USE DIRECTLY - MERGE INSTEAD)
├── DEPLOYMENT_BUG_20260414.md  # Bug report from deployment
└── DEPLOYMENT_README.md  # This file
```

---

## Bundle Checksum

```
9c01485490a7a344cffec782b99397b4  build/index.js (FIXED)
```

---

## Bundle Contents

- 11 agents registered (1 primary kraken + 10 cluster agents)
- 3 clusters (alpha, beta, gamma)
- Kraken Hive Mind integration
- Subagent manager (run_subagent_task, run_parallel_tasks, cleanup_subagents)
- Full cluster task spawn via Python wrapper

---

## Requirements

- OpenCode 1.4.3+
- Docker (for container spawning)
- API key for LLM calls
- Python 3 with python3 command available

---

## Known Issues

1. **Docker socket required** for container spawning (not included in bundle)
2. **API key required** for actual LLM calls (configure in opencode.json)
3. **OpenViking** - Separate service, must be running at localhost:1933

---

## Troubleshooting

### Kraken agent not found
```bash
# Verify plugin is in config
cat ~/.config/opencode/opencode.json | grep kraken

# Verify bundle exists
ls ~/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js
```

### clusterCount shows 0
```bash
# Restart opencode
exit
# Then restart opencode
```

### Cluster Task Spawn fails
```bash
# Verify wrapper path
ls ~/.config/opencode/plugins/subagent-manager/wrappers/opencode_agent.py

# Check wrapper has correct path resolution
node -e "const path=require('path');console.log(path.resolve('/home/leviathan/.config/opencode/plugins/kraken-agent-v2.0/dist','..','..','subagent-manager','wrappers','opencode_agent.py'))"
# Should output: /home/leviathan/.config/opencode/plugins/subagent-manager/wrappers/opencode_agent.py
```

---

**END OF DEPLOYMENT GUIDE**
