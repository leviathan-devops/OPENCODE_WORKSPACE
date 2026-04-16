# SYSTEM DIAGNOSTIC REPORT
**Generated:** 2026-04-13  
**Scope:** Kraken Agent deployment status + full system health  

---

## EXECUTIVE SUMMARY

| Item | Status |
|------|--------|
| Kraken active version | v1.0.0 (package.json label) |
| v1.1 deployment | INCOMPLETE — plugin built, opencode.json NOT updated |
| v1.1 fix present in active dist | LIKELY YES (rebuilt Apr 13, 14 agentType refs vs 11 in v1.1 plugin dir) |
| All clusters online | ✅ 3/3 |
| All agents available | ✅ 9/9 |
| Hive Mind | ✅ Operational (local fallback) |
| OpenViking | ❌ Disconnected |
| System health score | 30/100 (build/test/lint unavailable at workspace level) |

---

## KRAKEN DEPLOYMENT AUDIT

### What v1.1 Was Supposed to Fix
**Bug:** `spawn_shark_agent` and `spawn_manta_agent` were not filtering by agent type.  
Any available agent (shark or manta) could be assigned regardless of requested type.

**Fix:** Added `agentType` parameter to `ClusterInstance.getAvailableAgents()` and updated `processLoop()` to extract required type from task context.

### Deployment Timeline Reconstruction

| Date | Event |
|------|-------|
| 2026-04-12 | v1.1 SHIP package built → copied to `~/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js` |
| 2026-04-12 | v1.1 container tests run → ALL PASSED (5/5 shark routing, 5/5 manta routing) |
| 2026-04-13 | `projects/kraken-agent/dist/index.js` rebuilt (14 agentType refs — more than v1.1 plugin dir's 11) |
| 2026-04-13 | **opencode.json NOT updated** — still points to `projects/kraken-agent/dist/index.js` |
| 2026-04-13 | `package.json` version NOT bumped — both dirs show `1.0.0` |

### Root Cause: Incomplete Deployment

**opencode.json currently loads:**
```
file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js
```

**Should load (per INSTALL.md):**
```
file:///home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js
```

The deployment stopped after the build step. The `opencode.json` config update was never applied.

### Additional Anomaly
The active `projects/kraken-agent/dist/index.js` (modified Apr 13, 527KB, 14 agentType references) appears to be a NEWER build than the official v1.1 plugin dir artifact (modified Apr 12, 523KB, 11 references). This suggests:
- Someone may have applied the fix directly to the `projects/kraken-agent` source on Apr 13
- The fix may be functionally present in the active deployment despite the wrong path and version label
- Neither file's `package.json` was bumped from `1.0.0`

**Confidence:** Medium — cannot confirm fix is active without live spawn_shark_agent routing test.

---

## PLUGIN LOAD ORDER (opencode.json)

| # | Plugin | Path | Status |
|---|--------|------|--------|
| 1 | opencode-subagent-manager | `plugins/opencode-subagent-manager/dist/index.js` | Loaded |
| 2 | coding-subagents | `plugins/coding-subagents/dist/index.js` | Loaded |
| 3 | opencode-plugin-engineering | `plugins/opencode-plugin-engineering/dist/index.js` | Loaded |
| 4 | **kraken-agent** | `projects/kraken-agent/dist/index.js` | Loaded (v1.0.0 label, ~v1.1 code) |
| 5 | shark-agent-v4.7-hotfix-v3 | `plugins/shark-agent-v4.7-hotfix-v3/dist/index.js` | Loaded |
| 6 | manta-agent-v1.5 | `plugins/manta-agent-v1.5/dist/index.js` | Loaded |

---

## CLUSTER STATUS

| Cluster | Agents | Sharks | Mantas | Active Tasks | Status |
|---------|--------|--------|--------|--------------|--------|
| cluster-alpha | shark-alpha-1, shark-alpha-2, manta-alpha-1 | 2 | 1 | 0 | ✅ Idle |
| cluster-beta | shark-beta-1, manta-beta-1, manta-beta-2 | 1 | 2 | 0 | ✅ Idle |
| cluster-gamma | shark-gamma-1, manta-gamma-1, manta-gamma-2 | 1 | 2 | 0 | ✅ Idle |
| **TOTAL** | **9** | **4** | **5** | **0** | **✅ All Available** |

Delegation queue: 0 queued / 0 pending / 0 active

---

## HIVE MIND STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| HiveMind Plugin | ✅ v2.0.0-fixed | Operational |
| OpenViking | ❌ Disconnected | Endpoint: localhost:1933 — not reachable |
| Local Fallback | ✅ Healthy | `/home/leviathan/.local/share/opencode/hive-mind` |
| Resync Queue | ✅ Clear | 0 pending |
| Canary Uptime | ~39s at check time | 2 total hook calls |

---

## v1.1 VERIFIED TEST RESULTS (from artifacts)

Tests run in container (opencode-test:1.4.3) with `opencode/big-pickle` model:

| Test | Iterations | Pass Rate | Notes |
|------|-----------|-----------|-------|
| `get_cluster_status` | 1 | ✅ 1/1 | All 3 clusters, 9 agents returned |
| `spawn_shark_agent` routing | 5 | ✅ 5/5 | All routed to shark agents |
| `spawn_manta_agent` routing | 5 | ✅ 5/5 | All routed to manta agents |

---

## RECOMMENDED ACTIONS

### Priority 1 — Confirm or Complete v1.1 Deployment
Two options:

**Option A — Verify active build has the fix (quick)**
Run a live routing test:
```bash
spawn_shark_agent task="routing test" priority="high"
```
If returned agent is `agentType: "shark"` → fix is live, just needs version label bump.

**Option B — Apply official v1.1 deployment (clean)**
Update `opencode.json` to replace:
```
file:///home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent/dist/index.js
```
with:
```
file:///home/leviathan/.config/opencode/plugins/kraken-agent-v1.1/dist/index.js
```
Then bump `package.json` version to `1.1.0` and restart OpenCode.

### Priority 2 — Version Label Hygiene
Both `projects/kraken-agent/package.json` and `~/.config/opencode/plugins/kraken-agent-v1.1/package.json` still read `1.0.0`. Should be `1.1.0` to match the changelog.

### Priority 3 — OpenViking Connection
OpenViking is disconnected (localhost:1933). Hive Mind is operating on local fallback. Not urgent but resync will not propagate until connection is restored.

---

## SHIP PACKAGES ON DISK

| Package | Path | Date |
|---------|------|------|
| kraken-v2.0 (shipped) | `SHIP_PACKAGES/kraken-v2.0-SHIPPED-20260412_233832/` | 2026-04-12 |
| kraken-v2.0 (build-ready tar) | `build-packages/kraken-v2.0-ship-ready-20260412.tar.gz` | 2026-04-12 |
| v1.1 SHIP package | `Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v1.1/SHIP_KRAKEN_V1.1/` | 2026-04-12/13 |

---

*Report generated by opencode diagnostic session — 2026-04-13*
