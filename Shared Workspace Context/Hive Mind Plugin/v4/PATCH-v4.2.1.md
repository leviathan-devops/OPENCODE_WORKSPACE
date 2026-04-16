# Hive Mind Plugin - v4.2.1 Patch Notes

**Date:** 2026-04-08  
**Version:** 4.2.1  
**Author:** Leviathan Agent (MiniMax-M2.7)

---

## Critical Issues Fixed

### 1. Context Firewall Failures (CRITICAL)

| Issue | Impact | Fix |
|-------|--------|-----|
| Local fallback ignored sessionId | Cross-session file collisions | Files now prefixed with `sessionId_` and stored in `LOCAL_FALLBACK_DIR/sessionId/` |
| Pseudo-session creation | Sessions lumped together or fragmented | `requireSessionId()` throws instead of creating pseudo-sessions |
| Search returned all sessions | Context spillover from unrelated projects | Added `SearchConfig` with `sessionId` filter; `hive_context` accepts optional `session_id` |
| Resync queue dedup by URI only | Different sessions' uploads could collide | Now uses `sessionId:targetUri` composite key |

### 2. OpenViking `wait:true` Hang (HIGH)

**Root Cause:** OpenViking's `wait_complete()` polls `is_all_complete()` which checks if `pending == 0 and in_progress == 0`. If the embedding queue worker isn't processing items (due to server startup state or embedding server being down), the queue never completes and `wait:true` hangs indefinitely.

**Symptom:** Commit with `wait:true` hangs forever (120+ seconds) even with `timeout:30` specified server-side.

**Workaround:** Plugin now uses `wait:false` (async commit). Resources are committed to OpenViking storage and indexed in background processing. The plugin relies on local fallback + resync queue for reliability.

**Note:** This is an OpenViking server issue, not a plugin bug. The integration test script was also updated to use `wait:false`.

### 3. T1/T2 Memory Tier System (NEW)

Implemented actual tier processing instead of just filename convention:

| Tier | Purpose | Size | Storage |
|------|---------|------|---------|
| L0 (Abstract) | Quick session identification | ~100 tokens | `sessionId/T0_ABSTRACT.md` |
| L1 (Overview) | Decision-making context | ~2k tokens | `sessionId/T1_OVERVIEW.md` |
| L2 (Details) | Full session data | Full | `sessionId/T2_DETAILS.json` |

---

## Test Results

| Test Suite | Before | After |
|------------|--------|-------|
| Unit tests | ✅ 41/41 | ✅ 41/41 |
| Integration tests | ❌ Timeout at Test 4 | ✅ 7/7 PASS |

---

## OpenViking Version Information

| Component | Running Version |
|-----------|-----------------|
| OpenViking Server | 0.2.9 (installed at `/home/leviathan/.local/lib/python3.12/site-packages/`) |
| Source Code | 0.2.16.dev3 (at `/home/leviathan/OPENCODE_WORKSPACE/projects/OpenViking/`) |
| Installed via | pip (not rebuilt from source) |

---

## Files Changed

- `hive-mind-plugin.ts` - All context firewall fixes + wait:false
- `tests/integration/run-integration-tests.sh` - Changed to use `wait:false`

---

## Verification Commands

```bash
# Run unit tests
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hive\ Mind\ Plugin/v4
bun test hive-mind-plugin.test.ts

# Run integration tests
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hive\ Mind\ Plugin/v4/tests/integration
bash run-integration-tests.sh

# Check OpenViking health
curl http://localhost:1933/health

# Check embedding server
curl http://localhost:8001/v1/models
```

---

## Known Limitations

1. **Embedding async only** - Plugin doesn't wait for embedding completion due to OpenViking bug
2. **Session ID required** - Operations fail loudly if no session ID available (by design - prevents cross-session pollution)
3. **Local fallback always written first** - No data loss when OpenViking is down
