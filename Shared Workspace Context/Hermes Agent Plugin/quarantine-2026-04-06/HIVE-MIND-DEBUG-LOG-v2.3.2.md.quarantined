# Hive Mind Plugin v2.3.2 — Debug Log for Agent

**Date:** April 6, 2026  
**Version:** 2.3.2 (incremental fixes from v4.1 audit + sessionID fix)  
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts`  
**Deployed:** `/home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts`

---

## BEFORE YOU START

**ALWAYS** after editing the plugin:
1. Sync to deployed: `cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts" "/home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts"`
2. Build verify: `cd /home/leviathan/.config/opencode/plugins && bun build hive-mind-plugin.ts --target=bun --outfile=/dev/null`
3. Run unit tests: `cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4" && bun test hive-mind-plugin.test.ts`
4. Check log: `tail -50 ~/.local/share/opencode/hive-mind/hive-mind-plugin.log`

**DO NOT ship code that fails build or unit tests.**

---

## BUGS FOUND AND FIXED

### BUG-FIX-001: Hook Returns Early When No sessionID — BLOCKS AUTO-CAPTURE

**Severity:** 🔴 CRITICAL  
**Problem:** `experimental.chat.messages.transform` hook returns early when `input?.sessionID` is undefined. OpenCode does NOT provide sessionID in this hook's input. This causes:
- All hooks return without processing
- Canary logs `ERROR: CRITICAL: No hook executions detected since plugin startup!` every minute
- Auto-capture never fires even when AI writes files
- `totalHookCalls` stays at 0

**Root cause:** The hook checked `if (!sessionId) { log('WARN', 'hook', 'No sessionId...'); return }` — and OpenCode literally never provides sessionID in the `chat.messages.transform` hook input.

**Fix:** Added `getOrCreateSessionId()` function that generates a pseudo-session ID (`hook-session-{timestamp}-{random}`) when no sessionID is provided. This ID persists for 1 hour, allowing proper activity tracking.

**Location:** Lines ~100–130 (new functions) + lines ~1851, ~1889 (hook handlers updated)

**Verification:**
```bash
grep "No sessionId in chat.messages.transform" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
# Should return NOTHING (the warning no longer exists)

grep "pseudo-session\|getOrCreateSessionId" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log | head -5
# Should show pseudo-session being created

grep "canary.*totalHookCalls" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
# Should show totalHookCalls incrementing
```

---

### BUG-FIX-002: Canary Spams ERROR Every Minute at Startup

**Severity:** 🟡 HIGH  
**Problem:** Canary interval logs `ERROR: CRITICAL: No hook executions detected since plugin startup!` immediately, starting at minute 1. This is normal behavior — a fresh plugin has 0 hook calls until the user sends a message. The ERROR floods the log and panics users.

**Root cause:** Canary checked `if (totalHookCalls === 0)` and logged ERROR unconditionally, even at startup when zero calls is expected.

**Fix:** Canary now distinguishes startup (0–2 min) from stale state (2+ min with zero calls):
- Startup window (< 2 min): DEBUG log "Waiting for first hook execution"
- Stale (> 2 min, zero calls): ERROR log "No hook executions detected — hooks may not be firing"
- Normal operation: only log on state changes

**Location:** Lines ~1540–1570 (canary interval callback)

**Verification:**
```bash
# After starting a fresh OpenCode session, check the log
tail -100 ~/.local/share/opencode/hive-mind/hive-mind-plugin.log | grep "canary"
# Should show DEBUG "Waiting for first hook" in first 2 minutes
# Should NOT show ERROR spam in first 2 minutes
```

---

### BUG-FIX-003: analyzeMessageForPatterns Missing await

**Severity:** 🟡 MODERATE  
**Problem:** `analyzeMessageForPatterns` is an async function but was called without `await` inside the hook callback. This means the analysis could fire after the hook returns, or be silently dropped.

**Fix:** Changed `analyzeMessageForPatterns(sessionId, msg)` to `await analyzeMessageForPatterns(sessionId, msg)`

**Location:** Line ~1865 (approximately)

---

### BUG-FIX-004: Message Content Structure Not Understood — Silently Skips Analysis

**Severity:** 🔴 CRITICAL  
**Problem:** The hook processes `output?.messages` but the code expected `content` to be an array of tool parts. OpenCode's message structure may differ from what the code assumes. When content is not an array, it logs "Message content is not an array, skipping" at DEBUG and returns — silently skipping all analysis.

**Fix:** Changed the no-array log from DEBUG to WARN, and added diagnostic data (message keys, role, first 500 chars of stringified message) so we can see what OpenCode actually sends.

**Location:** Lines ~810–820 (approximately, inside `analyzeMessageForPatterns`)

**This is a DIAGNOSTIC fix** — the real fix requires understanding what OpenCode's actual message structure is. The WARN now shows:
```
[WARN] [analysis] Message content is not an array, skipping
  Data: { contentType: "string", messageKeys: ["role", "content"], messageRole: "assistant", messageDataStr: "..." }
```

**Verification:**
```bash
# After a session with file writes, grep for the diagnostic WARN
grep "Message content is not an array" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
# If it appears, the message structure is unexpected — need to update the parsing logic
```

---

## BUGS ALREADY FIXED (from v4.1 audit — DO NOT REINTRODUCE)

These bugs were fixed in v4.1. The current source already has these fixes. Do NOT revert them.

### BUG-FIX-005: Stage 2 Commit Has No Timeout

**Severity:** 🔴 CRITICAL (was)  
**Status:** ✅ FIXED in v4.1 source  
**Fix:** Stage 2 commit now has `AbortController` + `setTimeout` just like Stage 1.

### BUG-FIX-006: No Log Rotation

**Severity:** 🔴 CRITICAL (was)  
**Status:** ✅ FIXED in v4.1 source  
**Fix:** `log()` function now rotates at 10 MB to `archives/` directory.

### BUG-FIX-007: Duplicate healthCheckInterval Variable

**Severity:** 🟡 MODERATE (was)  
**Status:** ✅ FIXED in v4.1 source  
**Fix:** Renamed to `openVikingHealthCheckInterval`.

### BUG-FIX-008: Log SPAM — "Analyzing message for patterns"

**Severity:** 🟡 HIGH (was)  
**Status:** ✅ FIXED in v4.1 source  
**Fix:** Removed unconditional log that fired for every part.

### BUG-FIX-009: Log SPAM — "Processing 0 content parts"

**Severity:** 🟡 HIGH (was)  
**Status:** ✅ FIXED in v4.1 source  
**Fix:** Now only logs when content length > 0.

### BUG-FIX-010: cross_module_import False Positives

**Severity:** 🟢 MINOR (was)  
**Status:** ✅ FIXED in v4.1 source  
**Fix:** Pattern now only applied to filePath, not content.

### BUG-FIX-011: Session Tracker Memory Leak

**Severity:** 🟢 MINOR (was)  
**Status:** ✅ FIXED in v4.1 source  
**Fix:** Periodic cleanup every canary tick for sessions inactive > 2 hours.

---

## REMAINING UNFIXED BUGS

### BUG-OPEN-001: Auto-Capture Not Triggering (Root Cause Unknown)

**Severity:** 🔴 CRITICAL  
**Problem:** Even when OpenCode AI writes substantial TypeScript files using the `write` tool, the plugin does NOT detect them. The `hive_context` tool returns no memories about the files. Log shows no "Substantial file write detected" entries.

**Diagnosis in progress:** We know:
- Hook fires (totalHookCalls increments) ✅
- Pseudo-session is created ✅
- Message processing happens ✅
- BUT analysis skips because message content structure is not an array ⚠️

**The issue:** The code parses `output?.messages` and looks for `msg?.content` as an array of parts. But OpenCode's message structure may use a different format. When content is not an array, analysis is skipped entirely.

**How to verify you're hitting this bug:**
```bash
# Run a session that writes files
rm -f ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
cd /tmp && timeout 60 opencode run -m 0-glm-coding/glm-4.7 << 'EOF'
write a new file /tmp/auto-test/test.ts with this code:
export interface User { id: string; name: string; email: string; }
export class UserService {
  public findAll(): User[] { return []; }
}
EOF

# Check if any analysis happened
grep "Substantial file write detected\|Architecture signal check\|Architecture breakthrough" \
  ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
# If nothing appears, auto-capture is broken
```

**What needs to happen:** The message parsing in `analyzeMessageForPatterns` needs to be updated to match OpenCode's actual message structure. Currently looking for `content: [{ type, tool, input }]` but OpenCode may send something different (e.g., `parts`, or content as a different shape).

**Status:** 🔴 OPEN — needs investigation of actual OpenCode message format

---

### BUG-OPEN-002: API Key Authentication Failures

**Severity:** 🔴 CRITICAL (uploads fail)  
**Status:** ⚠️ PARTIALLY FIXED  
**Problem:** Uploads to OpenViking fail with `UNAUTHENTICATED` because the API key in config is a placeholder.

**Current state:** `loadConfig()` reads `OPENVIKING_API_KEY` from environment with priority over config file. The real key is in the env var.

**What you need to do:**
1. Make sure `OPENVIKING_API_KEY` env var is set in the shell where OpenCode runs
2. The config file placeholder `"apiKey": "***"` is now ignored when env var exists

**Verification:**
```bash
echo $OPENVIKING_API_KEY
# Should show the real key, not empty

# Test upload
curl -X POST http://localhost:1933/api/v1/resources/temp_upload \
  -H "X-API-Key: $OPENVIKING_API_KEY" \
  -F "file=@/tmp/test.txt"
# Should return success, not 401
```

---

### BUG-OPEN-003: hive_remember Returns Local Path to Agent

**Severity:** 🟢 MINOR  
**Problem:** Returns absolute filesystem path in response to agent, polluting context.

**Fix needed:** Change return from `Saved to local fallback: {path}` to `Saved to Hive Mind: {key}` or similar.

**Status:** 🔴 OPEN — low priority

---

## VERIFICATION CHECKLIST

After any edit, ALL of these must pass before you claim the fix is done:

```bash
# 1. Build passes
cd /home/leviathan/.config/opencode/plugins
bun build hive-mind-plugin.ts --target=bun --outfile=/dev/null
# Must say "Bundled N modules" with NO errors

# 2. Unit tests pass
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4"
bun test hive-mind-plugin.test.ts
# Must show "41 pass, 0 fail"

# 3. Sync to deployed
cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts" \
   "/home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts"

# 4. Live session — hook fires without spurious ERROR
rm -f ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
timeout 30 opencode run -m 0-glm-coding/glm-4.7 "call hive_status"
grep -c "ERROR.*canary" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
# Must be 0 (no ERROR spam)

# 5. No "No sessionId" warnings
grep "No sessionId in chat.messages.transform" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
# Must return nothing

# 6. Pseudo-session is created
grep "pseudo-session" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log | head -3
# Should show session creation logs

# 7. Canary increments
grep "canary.*totalHookCalls" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
# Should show incrementing totalHookCalls
```

---

## MESSAGE STRUCTURE DEBUGGING

If auto-capture is still broken after all fixes, the message structure is wrong. To diagnose:

Add this temporarily inside the hook where messages are processed:

```typescript
// TEMPORARY DEBUG — REMOVE AFTER DIAGNOSIS
log('WARN', 'debug', `MESSAGE_DUMP`, {
  messageRole: msg?.role,
  messageKeys: msg ? Object.keys(msg) : [],
  contentType: Array.isArray(msg?.content) ? 'array' : typeof msg?.content,
  contentLength: Array.isArray(msg?.content) ? msg.content.length : 'N/A',
  firstPartType: Array.isArray(msg?.content) ? msg.content[0]?.type : 'N/A',
  fullMessage: JSON.stringify(msg)?.slice(0, 1000)
})
```

This will show exactly what OpenCode sends so we can fix the parsing.

---

## FILES

| File | Purpose |
|------|---------|
| `hive-mind-plugin.ts` | Source code (1930 lines) |
| `hive-mind-plugin.test.ts` | Unit tests (41 tests) |
| `BUILD-REPORT-v4.1.md` | v4.1 build audit (previous version) |
| `HIVE-MIND-DEBUG-LOG-v4.md` | v4.0 debug log (reference) |

---

## SHIPPING RULES

1. **Build must pass** — `bun build` with zero errors
2. **Unit tests must pass** — `bun test` showing `41 pass, 0 fail`
3. **Sync to deployed** — copy to `~/.config/opencode/plugins/` after every edit
4. **No ERROR spam** — `grep -c "ERROR.*canary"` must return 0 after a fresh session
5. **Hook must fire** — `totalHookCalls` must increment within 30 seconds of starting a chat
6. **No "No sessionId" warnings** — that code path is gone

Follow these exactly. Do not skip steps. Do not claim "looks good" without running the verification commands.

---

*Debug log generated by DevOps Manager. For full build history, see BUILD-REPORT-v4.1.md and HIVE-MIND-DEBUG-LOG-v4.md.*
