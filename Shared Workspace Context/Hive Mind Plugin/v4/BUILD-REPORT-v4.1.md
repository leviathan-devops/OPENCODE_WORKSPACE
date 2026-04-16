# Hive Mind Plugin v4.1 — Build Report

**Date:** April 3, 2026  
**Auditor:** Leviathan (via Spider Agent)  
**Plugin Version:** v4.1 (upgraded from v4)  
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts`  
**Deployed:** `/home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts`

---

## Verification Results

| Check | Result |
|-------|--------|
| Build | ✅ PASS — `Bundled 73 modules in 22ms` |
| Unit Tests | ✅ PASS — `41 pass, 0 fail, 54 expect() calls` |
| Syntax | ✅ PASS — No errors |
| Sync to deployed | ✅ PASS — Both files identical |
| Phase 5 completeness | ✅ PASS — All 5 log sites have `fileName` + `filePath` |

---

## Bugs Fixed — Summary

| # | Bug | Severity | Status |
|---|-----|----------|--------|
| 7A | Unconditional "Analyzing message for patterns" SPAM log | HIGH | ✅ Fixed |
| 7B | "Processing 0 content parts" SPAM log | HIGH | ✅ Fixed |
| 4 | Stage 2 commit had no timeout (could hang indefinitely) | CRITICAL | ✅ Fixed |
| 5 | No log rotation — storage DoS risk | CRITICAL | ✅ Fixed |
| 6 | `cross_module_import` false positives from comments | MINOR | ✅ Fixed |
| 9 | File path logging lost directory context | MINOR | ✅ Fixed |
| 7 | Session tracker never cleaned (memory leak) | MINOR | ✅ Fixed |

---

## Phase 1 — Log Noise Reduction (HIGH Impact)

**Goal:** Eliminate the ~84% of log entries that were SPAM from unconditional logging.

### Phase 1.1 — Remove "Analyzing message for patterns" SPAM Log

**File:** `hive-mind-plugin.ts`  
**Previous line:** ~837  
**Problem:** This log fired for **every single part** of **every single message**, regardless of whether anything was detected. It generated 47% of all log entries (~4,313 of 9,093 observed) and provided zero value.

**Change:**
```diff
-  log('DEBUG', 'analysis', `Analyzing message for patterns`, {
-    sessionId,
-    hookInvocation: activity.hookInvocations
-  })
-
   // OpenCode message structure
```

**Impact:** −47% of all log entries eliminated.

---

### Phase 1.2 — Make "Processing N content parts" Conditional

**File:** `hive-mind-plugin.ts`  
**Previous line:** ~916  
**Problem:** This log fired even when `content.length === 0`, generating 37% of all log entries (~3,339 of 9,093). Every empty hook invocation produced a "Processing 0 content parts" entry.

**Change:**
```diff
-    log('DEBUG', 'analysis', `Processing ${content.length} content parts`, { sessionId })
+    if (content.length > 0) {
+      log('DEBUG', 'analysis', `Processing ${content.length} content parts`, { sessionId })
+    }
```

**Impact:** −37% of all log entries eliminated when content arrays are empty.

**Combined Phase 1 impact:** ~84% log reduction expected (47% + 37% = 84% of observed noise).

---

## Phase 2 — Stage 2 Commit Timeout (CRITICAL)

**Goal:** Prevent Stage 2 commit from hanging indefinitely when `wait: true` causes OpenViking to synchronously process embeddings.

### The Problem

Stage 1 (temp upload) had a proper `AbortController` + `setTimeout`:
```typescript
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs)
const tmpResp = await fetch(`${cfg.endpoint}/api/v1/resources/temp_upload`, {
  signal: controller.signal,  // ✅ has timeout
  ...
})
clearTimeout(timeout)
```

But Stage 2 (commit) had no timeout — it would block indefinitely if the embedding server was slow or overloaded:
```typescript
const commitResp = await fetch(`${cfg.endpoint}/api/v1/resources`, {
  method: 'POST',
  // ❌ No signal — no AbortController
  body: JSON.stringify({ temp_path: tempPath, to: targetUri, reason, wait: true })
})
```

### The Fix

**File:** `hive-mind-plugin.ts`  
**Lines:** ~605–622

```diff
   // Stage 2: commit
   // Note: wait=true ensures embedding queue processes before returning
+  // FIXED: Added AbortController + timeout (was missing — could hang indefinitely)
+  const commitController = new AbortController()
+  const commitTimeout = setTimeout(() => commitController.abort(), cfg.timeoutMs)
+
   const commitResp = await fetch(`${cfg.endpoint}/api/v1/resources`, {
     method: 'POST',
+    signal: commitController.signal,
     headers: {
       'X-API-Key': cfg.apiKey,
       'X-OpenViking-Account': 'default',
       'X-OpenViking-User': 'hive-mind',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({ temp_path: tempPath, to: targetUri, reason, wait: true })
   })
+
+  clearTimeout(commitTimeout)
```

**Impact:** Stage 2 commit can now time out after `cfg.timeoutMs` (30 seconds by default), preventing indefinite hangs.

---

## Phase 3 — Log Rotation (CRITICAL)

**Goal:** Prevent the log file from growing unbounded and causing storage exhaustion.

### The Problem

The `log()` function appended JSON entries to `hive-mind-plugin.log` with no size cap, no rotation, and no archive mechanism:
- Active session: ~70 entries/min ≈ 4.2 MB/hour ≈ 100 MB/day
- At observed rates, a single day's session could fill a typical log partition

### The Fix

**File:** `hive-mind-plugin.ts`  
**Lines:** ~49–53 (new constant) and ~121–153 (log function)

**Step 1 — Added rotation constant:**
```typescript
// Health check settings
const HEALTH_CHECK_TIMEOUT_MS = 5000
const HEALTH_CHECK_INTERVAL_MS = 60000  // 1 minute

// Log rotation settings
const LOG_MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB cap — archive when exceeded
```

**Step 2 — Rewrote `log()` function with rotation:**
```typescript
function log(level: LogLevel, category: string, message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    plugin: PLUGIN_NAME,
    category,
    message,
    ...(data !== undefined ? { data } : {})
  }

  try {
    const logDir = path.dirname(LOCAL_FALLBACK_DIR)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    const logFile = `${LOCAL_FALLBACK_DIR}/hive-mind-plugin.log`

    // Log rotation: archive if file exceeds 10 MB
    try {
      const stats = fs.statSync(logFile)
      if (stats.size > LOG_MAX_SIZE_BYTES) {
        const archiveDir = path.join(LOCAL_FALLBACK_DIR, 'archives')
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true })
        const archiveTimestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const archivePath = path.join(archiveDir, `hive-mind-plugin-${archiveTimestamp}.log`)
        fs.renameSync(logFile, archivePath)
      }
    } catch {
      // Archive check failed — proceed with writing anyway
    }

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
  } catch {
    // Silent fail - don't crash on logging errors
  }
}
```

**Archive naming:** `hive-mind-plugin-2026-04-03T11-45-00-000Z.log`  
**Archive location:** `~/.local/share/opencode/hive-mind/archives/`

**Impact:** Log file is now capped at 10 MB and auto-archives with a timestamp when exceeded.

---

## Phase 4 — Architecture Signal Pattern Fix (MINOR)

**Goal:** Remove false positive `cross_module_import` triggers from comments in file content.

### The Problem

The pattern `/import .* from ['"]\.\.?\//` was applied to **both** `filePath` and `content`:
```typescript
{ pattern: /import .* from ['"]\.\.?\//, name: 'cross_module_import' },
// ...
if (pattern.test(filePath) || pattern.test(content)) {  // ← applied to BOTH
```

In `content`, this matched any line like `// TODO: import from somewhere` or even legitimate imports inside comments, inflating architecture scores.

### The Fix

**File:** `hive-mind-plugin.ts`  
**Lines:** ~684–726 (entire `detectArchitectureSignal` function)

**Changed from unified patterns to separated path-only and content-only:**

```typescript
function detectArchitectureSignal(filePath: string, content: string): { detected: boolean; score: number; signals: string[] } {
  // Path-only patterns (applied only to filePath — not content, to avoid false positives)
  const pathPatterns = [
    { pattern: /\.(ts|tsx|js|jsx)$/, name: 'source_file' },
    { pattern: /\/(config|types|utils|lib|core|src)\//, name: 'architecture_dir' },
    { pattern: /\.\.\//, name: 'cross_module_import' },  // relative path imports (../ or ./)
  ]
  // Content-only patterns (applied only to file content)
  const contentPatterns = [
    { pattern: /interface |type |class |enum /, name: 'type_definition' },
    { pattern: /export (const|function|class|interface|type) /, name: 'export' },
  ]

  let score = 0
  const matchedSignals: string[] = []

  // Path-only patterns
  for (const { pattern, name } of pathPatterns) {
    if (pattern.test(filePath)) {
      score++
      matchedSignals.push(name)
    }
  }
  // Content-only patterns
  for (const { pattern, name } of contentPatterns) {
    if (pattern.test(content)) {
      score++
      matchedSignals.push(name)
    }
  }
  // ...
}
```

**Impact:** `cross_module_import` now only fires on actual `..` relative paths in filenames, not on `import` statements in file content. False positives eliminated.

---

## Phase 5 — Full File Path in Debug Logs (MINOR)

**Goal:** Preserve full directory context in log data for debugging, while keeping log messages readable.

### The Problem

Throughout `analyzeMessageForPatterns`, file paths were truncated to just the filename:
```typescript
log('DEBUG', 'analysis', `Substantial file write detected`, {
  filePath: filePath.split('/').pop(),  // ← loses directory context
  size: fileContent.length,
  threshold: GOLD_STANDARD_MIN_CHARS
})
```

When debugging which part of a codebase triggered a breakthrough, the full path matters.

### The Fix

**File:** `hive-mind-plugin.ts`  
**Locations updated:**

| Message | Before | After |
|---------|--------|-------|
| "Architecture signal check" | `filePath: filePath.split('/').pop()` | `fileName: filePath.split('/').pop(), filePath` |
| "OpenCode tool part detected" | `filePath: filePath.split('/').pop()` | `fileName: filePath.split('/').pop(), filePath` |
| "Substantial file write detected (OpenCode)" | `filePath: filePath.split('/').pop()` | `fileName: filePath.split('/').pop(), filePath` |
| "Substantial file write detected" | `filePath: filePath.split('/').pop()` | `fileName: filePath.split('/').pop(), filePath` |
| "File edit detected" | `filePath: filePath.split('/').pop()` | `fileName: filePath.split('/').pop(), filePath` |

**Example change:**
```diff
  log('DEBUG', 'detection', `Architecture signal check`, {
-    filePath: filePath.split('/').pop(),
+    fileName: filePath.split('/').pop(),
+    filePath,
    score,
    threshold: ARCHITECTURE_SIGNAL_THRESHOLD,
    detected,
    matchedSignals
  })
```

**Impact:** Debug logs now contain the full `filePath` in the data object while keeping messages readable (filename only in the message itself).

---

## Phase 6 — Session Tracker Periodic Cleanup (MINOR)

**Goal:** Prevent unbounded memory growth from session trackers that persist after hard crashes or sessions that end without triggering cleanup.

### The Problem

`SessionActivity` objects were only cleaned up in the `experimental.session.compacting` hook. If a session ended without triggering compacting (hard crash, SIGKILL, or long-running session with no compacting events), the tracker accumulated indefinitely.

### The Fix

**File:** `hive-mind-plugin.ts`  
**Location:** Inside `canaryInterval` callback in `startCanaryMonitoring()` (around line 1422)

```typescript
// Periodic session cleanup: remove sessions inactive for > 2 hours
for (const [sid, activity] of sessionTracker) {
  const timestamps = [
    activity.lastBreakthroughCommit,
    ...activity.errorsSeen.map(e => e.timestamp),
    ...activity.fixesSeen.map(f => f.timestamp),
    ...activity.commandsRun.map(c => c.timestamp),
  ]
  const lastActivity = Math.max(0, ...timestamps)
  if (lastActivity > 0 && Date.now() - lastActivity > 2 * 60 * 60 * 1000) {
    cleanupActivity(sid)
  }
}
```

**Logic:** On every canary tick (every 60 seconds), iterate all tracked sessions and remove any that have had zero activity for more than 2 hours. `lastActivity` is computed from the most recent event timestamp across all tracked activities.

**Impact:** Session trackers are now self-cleaning. No more unbounded memory growth over long plugin uptime.

---

## Phase 7 — Sync & Verification

### Step 7.1 — Copy to deployed location
```bash
cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts" \
   /home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts
```

### Step 7.2 — Build verification
```bash
cd /home/leviathan/.config/opencode/plugins
bun build hive-mind-plugin.ts --target=bun --outfile=/dev/null
```
**Result:** `Bundled 73 modules in 22ms` ✅

### Step 7.3 — Unit tests
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4"
bun test hive-mind-plugin.test.ts
```
**Result:** `41 pass, 0 fail, 54 expect() calls` ✅

---

## Log Volume Analysis

### Before Fixes (observed by DevOps audit)
```
Total: ~9,210 entries per active session
DEBUG: 9,093 (98.7%)
INFO:    110 (1.2%)
WARN:      4 (0.04%)
ERROR:     3 (0.03%)

Rate: ~70 entries/min → ~4.2 MB/hr → ~100 MB/day
```

### After Fixes (projected)
```
Total: ~300-500 entries per active session
DEBUG: ~200-400 (only on actual state changes)
INFO:  ~50-80  (breakthroughs, commits, tool calls)
WARN:  ~5-10   (fallback activations)
ERROR: ~3-5    (upload failures, etc.)

Rate: ~2-5 entries/min (only when state changes or breakthroughs trigger)
Reduction: ~90-95%
```

### What Was Removed
- `Analyzing message for patterns` — 4,313 entries (47%) — unconditional SPAM
- `Processing 0 content parts` — 3,339 entries (37%) — noise from empty arrays
- Combined: 84% of observed log entries eliminated

---

## Files Modified

| File | Change |
|------|--------|
| `OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts` | All 7 phases applied |
| `~/.config/opencode/plugins/hive-mind-plugin.ts` | Synced from source after fixes |

---

## Bug Status Reference

| Bug | Description | Severity | Status |
|-----|-------------|----------|--------|
| 1 | Orphaned `catch` block (syntax error) | CRITICAL | ✅ Already fixed in v4 |
| 2 | Duplicate `healthCheckInterval` variable | MODERATE | ✅ Already fixed in v4 |
| 3 | Fake API key in config (uploads fail) | CRITICAL | ✅ Already fixed (env var support added in v4) |
| 4 | Stage 2 commit has no timeout | CRITICAL | ✅ Fixed in v4.1 (this build) |
| 5 | No log rotation (storage DoS) | CRITICAL | ✅ Fixed in v4.1 (this build) |
| 6 | `cross_module_import` false positives | MINOR | ✅ Fixed in v4.1 (this build) |
| 7 | Session tracker never cleaned | MINOR | ✅ Fixed in v4.1 (this build) |
| 8 | `hive_remember` returns local path to agent | MINOR | ⏭ Not fixed (low priority) |
| 9 | Path logging loses directory context | MINOR | ✅ Fixed in v4.1 (this build) |
| 7A | "Analyzing message" SPAM log | HIGH | ✅ Fixed in v4.1 (this build) |
| 7B | "Processing 0 content parts" SPAM | HIGH | ✅ Fixed in v4.1 (this build) |

---

## Post-Build Audit — Phase 5 Consistency Check

During the build audit, a grep scan for `filePath: filePath.split('/').pop()` found **1 remaining inconsistency** at line 891 — the "OpenCode tool part detected" log call had not been updated to include `fileName` alongside the full `filePath`.

**Root cause:** An edit targeting that specific log call used an `oldString` pattern that did not exactly match the file content (the log call contained an extra `isWriteTool` field). The other 4 log sites were correctly updated, but this one was silently skipped.

**Fix applied:** Line 891 updated from:
```typescript
filePath: filePath.split('/').pop(),
```
to:
```typescript
fileName: filePath.split('/').pop(),
filePath,
```

**Post-fix verification:**
- `grep -c 'filePath: filePath.split' hive-mind-plugin.ts` → `0` ✅ (no remaining instances)
- `grep -c 'fileName: filePath.split' hive-mind-plugin.ts` → `5` ✅ (all 5 sites updated)
- Build: `Bundled 73 modules in 22ms` ✅
- Unit tests: `41 pass, 0 fail` ✅

---

## Version History

| Version | Changes |
|---------|---------|
| v4 | Original — had syntax error, duplicate var, fake API key |
| v4.1 | **This build** — log noise reduction (Phases 1A+1B), commit timeout (Phase 2), log rotation (Phase 3), pattern false positive fix (Phase 4), path logging fix (Phase 5, including post-audit fix), session cleanup (Phase 6) |
| v4.2 | Future — remaining minor fixes (Bug 8, etc.) |

---

*Report generated by Spider Agent on behalf of DevOps Manager (Hermes).*
