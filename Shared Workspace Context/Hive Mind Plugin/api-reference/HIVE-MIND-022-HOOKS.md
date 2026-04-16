# Hive Mind Plugin — Hook Handlers

---

## Overview

The Hive Mind plugin registers handlers for experimental hooks to automatically detect and capture agent activity.

---

## Hooks Used

| Hook | Purpose | Status |
|------|---------|--------|
| `experimental.chat.messages.transform` | Analyze messages for patterns | UNVERIFIED |
| `experimental.session.compacting` | Commit session data on end | UNVERIFIED |

---

## experimental.chat.messages.transform

**Purpose:** Analyze each message for breakthrough triggers

**Fires:** On every chat message

### What It Does

1. **Parse Message Content**
   - Extracts command outputs
   - Identifies file writes
   - Detects errors

2. **Pattern Analysis**
   - Check for architecture signals
   - Check for error→fix patterns
   - Check for batch file creation

3. **Trigger Breakthrough**
   - If threshold met → `commitBreakthrough()`

### Code Location
```typescript
// Line ~1100
"experimental.chat.messages.transform": async (messages) => {
  for (const message of messages) {
    await analyzeMessageForPatterns(message)
  }
  return messages
}
```

---

## experimental.session.compacting

**Purpose:** Commit session overview and remaining breakthroughs

**Fires:** On session compaction/end

### What It Does

1. **Commit Session Overview**
   - Query opencode.db for session metadata
   - Build overview content
   - Upload to OpenViking

2. **Commit Remaining Breakthrough**
   - Check for pending breakthrough
   - If exists → `commitBreakthrough()`

3. **Cleanup**
   - Clear session state
   - Reset counters

### Code Location
```typescript
// Line ~960
"experimental.session.compacting": async (session) => {
  await commitSessionOverview(session.id)
  await commitBreakthrough(session.id, 'session_end')
  await cleanupActivity(session.id)
}
```

---

## Canary Monitoring

**Purpose:** Verify hooks are actually firing

### Implementation
```typescript
// Line ~1144
let totalHookCalls = 0

// In each hook handler:
totalHookCalls++

// Periodic canary log (every 60s):
log('INFO', 'canary', 'Hook canary', { totalHookCalls })
```

### Why Needed
OpenCode experimental hooks may silently not fire. Canary monitoring provides visibility into whether hooks are actually being called.

### How to Check
```bash
# Check canary in logs
grep canary ~/.local/share/opencode/hive-mind/hive-mind-plugin.log

# Expected: periodic entries with incrementing totalHookCalls
```

---

## Verification Status

| Hook | Expected Behavior | Verified? |
|------|------------------|----------|
| `chat.messages.transform` | Fires on each message | ❌ UNVERIFIED |
| `session.compacting` | Fires on session end | ❌ UNVERIFIED |

### How to Verify

1. Enable verbose logging
2. Use OpenCode normally for a session
3. Check if `totalHookCalls` increments
4. If stays at 0 → hooks not firing

---

## If Hooks Don't Fire

### Symptoms
- Breakthrough detection never triggers
- `totalHookCalls` stays at 0
- Session overview never committed

### Possible Causes
1. OpenCode version doesn't support experimental hooks
2. Hook names changed
3. Plugin not properly registered

### Debug Steps
```bash
# 1. Check plugin loaded
grep -i "HiveMind" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log

# 2. Check hook registration
grep -i "hook\|Hook" ~/.local/share/opencode/hive-mind/hive-mind-plugin.log

# 3. Check canary
grep canary ~/.local/share/opencode/hive-mind/hive-mind-plugin.log
```

---

*Hooks v1.0 — Leviathan Agent — 2026-04-02*
