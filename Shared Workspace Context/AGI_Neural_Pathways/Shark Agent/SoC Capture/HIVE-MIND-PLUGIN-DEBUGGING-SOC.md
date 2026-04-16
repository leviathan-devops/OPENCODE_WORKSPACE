# SoC Capture: Hive Mind Plugin v4.2.1 — Problem Solving Process

**Date:** 2026-04-08  
**Agent:** Leviathan (MiniMax-M2.7)  
**Duration:** ~4 hours of investigation and fixes

---

## Executive Summary

The Hive Mind Plugin passed all 41 unit tests and was declared "production ready" but had **critical context firewall failures** that would cause cross-session data leakage and system hangs. Tests passed because they used mocks, not real infrastructure. This document captures the systematic debugging process that revealed these failures.

---

## Problem Statement

**Initial Claim:** The Hive Mind Plugin has:
- 41/41 unit tests passing
- 7/7 integration tests passing
- Production ready deployment

**Observed Behavior:**
- Integration test 4 (Commit) timed out after 120 seconds
- 83 items stuck in resync queue
- Context could potentially leak between sessions

**Question:** Why do tests pass if the system doesn't work?

---

## Investigation Process

### Phase 1: Test Verification

**Action:** Ran integration tests to observe actual behavior.

**Result:** Test 4 (Commit) hung and timed out after 120 seconds.

**Finding 1:** The integration test was using `wait:true` which hangs indefinitely.

---

### Phase 2: Manual API Testing

**Action:** Tested OpenViking API endpoints manually via curl.

**Discovery:**
```
# Health check worked
curl http://localhost:1933/health
# {"status":"ok","healthy":true,"version":"0.2.9"}

# Embedding server was DOWN
curl http://localhost:8001/v1/models
# Connection refused
```

**Finding 2:** The embedding server (llama-server on port 8001) was not running. This caused `wait:true` to hang forever because the queue processing couldn't complete.

---

### Phase 3: Version Mismatch Investigation

**Action:** Checked OpenViking version between running server and source code.

**Discovery:**
| Component | Version |
|-----------|---------|
| Running server | 0.2.9 |
| Source code | 0.2.16.dev3 |

The installed server (0.2.9) was **not rebuilt** from the newer source code.

**Finding 3:** Server wasn't running from the source we were examining.

---

### Phase 4: Embedding Server Restart

**Action:** Restarted llama-server embedding service.

**Result:** Embedding server came back up and responded correctly to test requests.

**But:** `wait:true` still timed out after 30 seconds even with embedding server running.

**Finding 4:** The `wait:true` hang wasn't just about embedding server being down—there was a deeper queue processing issue.

---

### Phase 5: Queue Processing Analysis

**Action:** Examined OpenViking's `wait_complete()` implementation.

**Code path:**
1. `add_resource()` calls `qm.wait_complete(timeout=timeout)`
2. `wait_complete()` loops: `is_all_complete()` → `check_status()`
3. `check_status()` returns `QueueStatus` with `pending`, `in_progress`
4. `is_complete` = `pending == 0 and in_progress == 0`

**Finding 5:** If the queue worker thread isn't actively processing items (e.g., stuck in bad state), the queue never completes, and `wait_complete()` loops forever.

---

### Phase 6: Context Firewall Audit

While debugging the `wait:true` hang, I performed a systematic audit of the plugin's context isolation:

#### Finding 6a: Local Fallback Session Isolation
```typescript
// BEFORE (broken)
async function writeLocalFallback(filename, content, sessionId?: string) {
  const dir = sessionId ? path.join(baseDir, sessionId) : baseDir
  // If sessionId is undefined, ALL sessions write to same directory!
}
```
**Impact:** Files from different sessions could overwrite each other.

#### Finding 6b: Pseudo-Session Creation
```typescript
// BEFORE (broken)
function getOrCreateSessionId(preferredSessionId) {
  // If no sessionId provided, silently create pseudo-session
  const pseudoSessionId = `hook-session-${Date.now()}-${Math.random()}`
}
```
**Impact:** Multiple "real" sessions could get lumped into one pseudo-session.

#### Finding 6c: Search Without Filtering
```typescript
// BEFORE (broken)
body: JSON.stringify({
  target_uri: 'viking://resources/hive-mind/shared/',  // No session filter!
  query
})
```
**Impact:** `hive_context` returns memories from ALL sessions, causing context spillover.

#### Finding 6d: Resync Queue Deduplication
```typescript
// BEFORE (broken)
const existing = resyncQueue.findIndex(p => p.targetUri === pending.targetUri)
// Different sessions uploading same filename = collision!
```
**Impact:** Different sessions' uploads could overwrite each other in queue.

---

### Phase 7: T1/T2 Tier System Analysis

**Initial Claim:** "T1/T2 dynamic memory system with tiered retrieval"

**Reality:** Only a filename convention (`T1_OVERVIEW.md`). No actual:
- Tier size limits enforced
- Memory promotion/demotion
- Tier-aware retrieval

**Finding 7:** The T1/T2 was theater, not actual functionality.

---

## Root Cause Analysis

### Primary Root Cause: Mock-Based Testing

Unit tests passed because they used **mocks** that:
- Don't test actual OpenViking API behavior
- Don't test session isolation
- Don't test network timeouts
- Don't test queue processing

This is "verification theater" — tests pass but the system is unverified against real infrastructure.

### Secondary Root Causes:

1. **No session ID required** — Operations could proceed without explicit session context
2. **Local fallback ignored sessionId** — Breaks isolation
3. **Search unfiltered** — Returns all sessions' data
4. **OpenViking wait:true bug** — Queue processing can hang indefinitely

---

## Solution Implementation

### Fix 1: Session-Isolated Local Fallback
```typescript
// Files prefixed with sessionId and stored in session-specific directory
const safeFilename = `${sessionId}_${filename}`
const filepath = path.join(LOCAL_FALLBACK_DIR, sessionId, safeFilename)
```

### Fix 2: No Pseudo-Sessions
```typescript
// requireSessionId throws instead of creating pseudo-sessions
function requireSessionId(preferredSessionId, context) {
  if (!preferredSessionId) {
    throw new Error(`CRITICAL: No valid sessionID in ${context}`)
  }
  return preferredSessionId
}
```

### Fix 3: Search Filtering
```typescript
// SearchConfig allows session-scoped searches
interface SearchConfig {
  sessionId?: string  // When provided, searches only within session
  projectFilter?: string
  includeShared: boolean
  limit: number
}
```

### Fix 4: Composite Deduplication Key
```typescript
// Dedupe by sessionId + targetUri
const dedupKey = `${pending.sessionId}:${pending.targetUri}`
```

### Fix 5: Actual T1/T2 Tier System
```typescript
// Now generates all tiers with proper URIs
const tiers: MemoryTier = {
  l0_abstract: generateL0Abstract(overview, sessionId),
  l1_overview: generateL1Overview(sessionId, overview),
  l2_details: JSON.stringify(overview)
}
// Stored at session-isolated URIs
```

### Fix 6: OpenViking wait:false
```typescript
// Use async commit to avoid wait:true hang
const useWait = false  // ALWAYS async - wait:true hangs indefinitely
```

---

## Systemic Issues Revealed

### 1. Verification Theater
Tests passing ≠ System working. Mock-based tests verify logic, not integration.

**Remediation:** Integration tests must test against real infrastructure.

### 2. Version Drift
Running server (0.2.9) ≠ Source code (0.2.16.dev3)

**Remediation:** CI should verify server version matches expectations.

### 3. No Session Context Enforcement
Operations proceeded without session IDs, creating silent cross-session pollution.

**Remediation:** Session ID should be REQUIRED, not optional.

### 4. OpenViking wait:true Bug
Queue processing can hang indefinitely when worker thread is in bad state.

**Remediation:** Either fix OpenViking or use wait:false (async).

---

## What Worked

1. **Local fallback always written first** — No data loss when OpenViking is down
2. **Resync queue for retries** — Failed uploads queued for later retry
3. **Comprehensive logging** — Every operation logged with context
4. **Explicit error propagation** — Failures don't silently disappear

---

## Verification Commands

```bash
# Run unit tests
cd /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Hive\ Mind\ Plugin/v4
bun test hive-mind-plugin.test.ts

# Run integration tests
cd .../v4/tests/integration
bash run-integration-tests.sh

# Check OpenViking health
curl http://localhost:1933/health

# Check embedding server
curl http://localhost:8001/v1/models
```

---

## Lessons Learned

1. **Mock tests verify logic, not behavior** — Integration tests against real systems are essential
2. **Silent failures are dangerous** — Operations should fail loudly, not silently create pseudo-state
3. **Context isolation must be enforced** — Not just documented as a design principle
4. **Infrastructure must be monitored** — Embedding server down caused cascading failures
5. **Version alignment matters** — Source code != running server

---

## Related Files

- **Plugin:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts`
- **Patch Notes:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/PATCH-v4.2.1.md`
- **Integration Tests:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/tests/integration/run-integration-tests.sh`

---

*SoC Capture — Leviathan Agent — 2026-04-08*
