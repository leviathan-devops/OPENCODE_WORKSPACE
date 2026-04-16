# SHIP REPORT — Hive Mind Plugin v4.2

**Version:** 4.2  
**Date:** April 3, 2026  
**Build:** 1918 lines, 66KB  
**Status:** PRODUCTION READY — ALL FIXES VERIFIED

---

## What Was Fixed

### Bug 1: Local Fallback Never Resynced (CRITICAL)

**Problem:** When OpenViking was down, uploads went to local disk. When it came back up, those files stayed local forever. Data was effectively lost from the shared memory layer.

**Fix:** Added a resync queue with automatic and manual retry:

| Component | Description |
|-----------|-------------|
| `RESYNC_QUEUE_PATH` | Persists queue to `~/.local/share/opencode/hive-mind/resync-queue.json` |
| `loadResyncQueue()` | Loads pending uploads on plugin startup |
| `addToResyncQueue()` | Deduplicates by `targetUri`, persists to disk |
| `processResyncQueue()` | Re-uploads pending items, removes local file on success |
| Auto-trigger | Health check detects recovery (`wasUnhealthy → healthy`) and triggers resync |
| Manual trigger | New `hive_resync` tool for on-demand retry |

**Files affected:** `hive-mind-plugin.ts` lines 37, 57-62, 367-373, 421-477, 791-820, 1607-1609

---

### Bug 2: Local Fallback Write Logged as WARN

**Problem:** `writeLocalFallback()` used `log('WARN', ...)` making it look like an error in logs.

**Fix:** Changed to `log('INFO', 'storage', 'Written to local fallback', ...)` — informational, not an error.

**Files affected:** `hive-mind-plugin.ts` line 385

---

### Bug 3: Plain Text API Key Has No Warning

**Problem:** API key loaded from `openviking-config.json` (plain text) gave no warning, even though the env var `OPENVIKING_API_KEY` exists as the preferred alternative.

**Fix:** One-time `WARN` log at startup when key comes from config file:
```
[WARN] [config] API key loaded from plain text config file — set OPENVIKING_API_KEY env var to avoid this warning
```

**Files affected:** `hive-mind-plugin.ts` lines 59, 259-261

---

### Bug 4: `hive_status` Didn't Show Resync Queue

**Problem:** No way to see pending uploads from `hive_status` output.

**Fix:** Added `resyncQueue` object to status:
```json
"resyncQueue": {
  "pending": 0,
  "inProgress": false,
  "queueFile": "/home/leviathan/.local/share/opencode/hive-mind/resync-queue.json"
}
```

**Files affected:** `hive-mind-plugin.ts` lines 1684-1688

---

### Bug 5: `hive_resync` Tool Missing

**Problem:** No manual override to trigger resync when OpenViking comes back.

**Fix:** Added `hive_resync` tool:
```
> hive_resync
Resync complete: 3 succeeded, 0 failed, 0 remaining in queue.
```

**Files affected:** `hive-mind-plugin.ts` lines 1815-1827

---

## Verification

### Build
```
Bundled 73 modules in 34ms
  null  0.49 MB  (entry point)
```

### Unit Tests
```
41 pass
 0 fail
54 expect() calls
Ran 41 tests across 1 file. [11.00ms]
```

### Sync
```
Source: 1918 lines, 66KB
Deployed: 1918 lines, 66KB
Status: SYNCED
```

### All Fixes Confirmed in Source

| Fix | Location | Status |
|-----|----------|--------|
| Resync queue path constant | Line 37 | ✅ |
| `resyncQueue` array | Line 57 | ✅ |
| `wasUnhealthy` tracking | Line 62 | ✅ |
| Recovery detection in health loop | Line 367 | ✅ |
| `loadResyncQueue()` on startup | Line 1607 | ✅ |
| `writeLocalFallback` INFO log | Line 385 | ✅ |
| API key plain-text WARN | Line 261 | ✅ |
| `resyncQueue` in `hive_status` | Line 1684 | ✅ |
| `hive_resync` tool | Line 1815 | ✅ |

---

## New Tools

### `hive_resync`
Manually trigger resync of pending local fallback uploads to OpenViking.

```
> hive_resync
Resync complete: N succeeded, M failed, K remaining in queue.
```

**When to use:**
- OpenViking was down, you brought it back up, and you want immediate sync
- You don't want to wait for the next health check cycle (60s)

---

## Breaking Changes

None. This is purely additive.

---

## Pre-Deploy Checklist

| Item | Status |
|------|--------|
| OpenViking running | ✅ `curl http://localhost:1933/health` |
| Plugin registered in `opencode.json` | ✅ Already done |
| Build succeeds | ✅ 73 modules bundled |
| Unit tests pass | ✅ 41/41 |
| Source synced to deployed path | ✅ |

---

## Post-Deploy Verification

After restarting an OpenCode session with the new plugin:

1. Check for plain-text API key warning in logs:
   ```
   grep "plain text config file" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
   ```

2. Call `hive_status` and verify `resyncQueue` field appears:
   ```
   Call hive_status and return the full JSON output
   ```

3. Verify resync queue file exists:
   ```
   cat ~/.local/share/opencode/hive-mind/resync-queue.json
   ```

---

## Upgrade Path from v4.1

1. Copy new plugin to deployed path:
   ```bash
   cp /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hive\ Mind\ Plugin/v4/hive-mind-plugin.ts \
      ~/.config/opencode/plugins/hive-mind-plugin.ts
   ```

2. Start new OpenCode session — plugin auto-upgrades on load.

No migration needed. The resync queue file is created automatically on first failed upload.
