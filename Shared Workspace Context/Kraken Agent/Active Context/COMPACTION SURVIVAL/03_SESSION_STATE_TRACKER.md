# KRAKEN V2.0 — SESSION STATE TRACKER

**UPDATE EVERY 15-20K TOKENS** | **Last Updated:** 2026-04-14T20:30 UTC

---

## ⚠️ CRASH RECOVERY NEEDED

**Session crashed during pre-ship debugging.** Read recovery protocol FIRST:
```
Master Context/CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md
```

---

## CURRENT PHASE

- [x] PLAN
- [x] **BUILD** — INTERRUPTED (needs bundle rebuild)
- [ ] TEST
- [ ] VERIFY
- [ ] SHIP

---

## STREAM OF CONSCIOUSNESS

**What:** Kraken v2.0 build interrupted. Hardcoded paths fixed in source but bundle NOT rebuilt.

**Interrupted Work:**
1. Python wrapper hardcoded paths fixed (6 files)
2. TypeScript source hardcoded paths fixed (4 files)
3. Bundle was about to be rebuilt when crash occurred

**Where:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/`

**Status:**
- Fixed wrappers: `v2.0-retry/.../wrappers/` ✅
- Fixed source: `v2.0-retry/.../src/` ✅
- Bundle: NOT rebuilt ❌
- Ship package: OUTDATED ❌

---

## NEXT IMMEDIATE ACTIONS

1. **Rebuild bundle:**
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build && bun run build
   ```

2. **Copy fixed wrappers to ship package:**
   ```bash
   cp ".../v2.0-retry/kraken-agent-source/wrappers/"*.py ".../SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers/"
   ```

3. **Copy rebuilt bundle to ship:**
   ```bash
   cp .../kraken-agent/dist/index.js .../SHIP_KRAKEN_V2.0/build/dist/index.js
   ```

4. **Verify no hardcoded paths:**
   ```bash
   grep -n "/home/leviathan" .../SHIP_KRAKEN_V2.0/build/dist/index.js
   ```

5. **Build test container:**
   ```bash
   cd .../SHIP_KRAKEN_V2.0 && docker build -t kraken-v2.0-test:latest -f Dockerfile.test .
   ```

---

## FILES STATUS

### Python Wrappers (FIXED in v2.0-retry, NOT in ship)
```
v2.0-retry/kraken-agent-source/wrappers/opencode_agent.py        ✅
v2.0-retry/kraken-agent-source/wrappers/container_pool.py       ✅
v2.0-retry/kraken-agent-source/wrappers/kraken-agent-wrapper.py  ✅
v2.0-retry/subagent-manager/wrappers/opencode_agent.py           ✅
v2.0-retry/subagent-manager/wrappers/container_pool.py            ✅
v2.0-retry/subagent-manager/wrappers/kraken-agent-wrapper.py     ✅
```

### TypeScript Source (FIXED in v2.0-retry, NOT in ship bundle)
```
v2.0-retry/kraken-agent-source/src/kraken-hive/index.ts          ✅
v2.0-retry/kraken-agent-source/src/hooks/cluster-state-hook.ts    ✅
v2.0-retry/kraken-agent-source/src/tools/shark-t2-tools.ts        ✅
v2.0-retry/kraken-agent-source/src/hooks/index.ts                ✅
```

### Bundle (NEEDS REBUILD)
```
projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js      ❌
```

### Ship Package (OUTDATED)
```
SHIP_KRAKEN_V2.0/build/dist/index.js                              ❌ (526KB, OLD)
SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers/                   ❌ (OLD)
```

---

## CHECKSUMS (BEFORE rebuild)

```
v2.0-retry bundle:    4988835fbfadca0d0c1d28058a079d72  (needs rebuild)
SHIP_KRAKEN bundle:   dad4fa54cec2ed6d7cf23df24d82ebc7 (OUTDATED)
```

---

## HARDCODE PATHS TO VERIFY REMOVED (after rebuild)

```
/home/leviathan/.local/share/opencode/kraken-hive  (should be dynamic)
```

---

## KEY PATHS

| Purpose | Path |
|---------|------|
| Recovery Protocol | `Master Context/CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md` |
| Quick Recovery | `Master Context/QUICK_RECOVERY.md` |
| Active Project | `projects/kraken-v2.0-proper-build/` |
| Fixed Source | `.../Working Project Space/v2.0-retry/` |
| Ship Package | `/home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/` |
| Session State | `COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md` |

---

## CHECKPOINTS

```
projects/kraken-v2.0-proper-build/.checkpoints/
└── milestone-7c-zod-fix-verified/
```

---

## THE ONE RULE

**IF IT'S NOT REAL, IT'S NOT DONE.**

Every function must do what it says. Every tool must execute for real.

---

**END OF SESSION STATE**
