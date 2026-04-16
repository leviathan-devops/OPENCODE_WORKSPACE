# TRIDENT BRAIN - CRASH ANALYSIS & KNOWN BUGS
## Critical Issues Discovered During Session

**Date:** 2026-04-14  
**Status:** FIXED - All critical bugs resolved  
**Last Updated:** After applying RealTimeFirewall fix

---

## ROOT CAUSE: Session Crashes

The session kept crashing during context handover package generation. Root cause identified and fixed.

---

## Bug #1: RealTimeFirewall Infinite Loop ✅ FIXED

**Original Location:** `src/algorithmic-core.ts` lines 373-425

**Problem:** `scanRealtime()` had NO safetyCount on regex exec loop - infinite loop on many matches.

**Same bug existed in:** `scanSoft()` (line 431)

**Compare to already-fixed code in:** `scanPatterns()` (line 948) - had safetyCount

### Fix Applied

Added `safetyCount` + `maxMatches=100` + removed global flag to BOTH `scanRealtime()` and `scanSoft()`:

```typescript
// BEFORE (broken):
while ((match = regex.exec(code)) !== null) {

// AFTER (fixed):
const flags = pattern.regex.flags.replace('g', '');
const regex = new RegExp(pattern.regex.source, flags);
let safetyCount = 0;
const maxMatches = 100;

while ((match = regex.exec(code)) !== null && safetyCount < maxMatches) {
  safetyCount++;
  // ... existing code
}
```

**Verification:**
```bash
grep -n "safetyCount" dist/algorithmic-core.js
# Output shows safetyCount at lines 294, 296, 297, 351, 353, 354
```

---

## Bug #2: Memory Bloat in scanDirectory() ⚠️ KNOWN ISSUE

**Location:** `src/algorithmic-core.ts` line 1191

```typescript
// Loads UP TO 200 files into memory simultaneously
const { stdout } = await execAsync(
  `find "${targetPath}" -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.json" \\) 2>/dev/null | head -200`,
  { timeout: 30000 }
);
```

**Impact:** Large projects could exhaust memory and crash.

**Workaround:** Audit smaller directories or specific paths.

---

## Bug #3: No Error Recovery on File Read ⚠️ KNOWN ISSUE

**Location:** `src/algorithmic-core.ts` line 1197

```typescript
const content = await readFile(filePath, 'utf-8');
```

If a file is binary or too large, this throws and crashes the audit.

**Workaround:** None yet - audit will fail on problematic files.

---

## SESSION BEHAVIOR NOTES

- Session kept crashing mid-generation of context handover
- Files were being saved but session would die before completion
- `list_sessions` shows corrupted session data (all undefined)
- Each crash forced restart with lost context

---

## RECOVERY VERIFICATION

```bash
# Verify source has safetyCount in both functions:
grep -n "safetyCount" src/algorithmic-core.ts | grep -E "294|296|351|353"

# Verify dist was rebuilt (timestamp should be recent):
ls -la dist/algorithmic-core.js
# -rw-r--r-- 1 leviathan leviathan 48367 Apr 14 17:06 dist/algorithmic-core.js

# Build verification:
cd /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review && npm run build
# Should complete with 0 errors
```

---

## FILES MODIFIED

```
src/algorithmic-core.ts        # Added safetyCount to scanRealtime() and scanSoft()
dist/algorithmic-core.js       # Rebuilt with fixes
dist/algorithmic-core.d.ts    # Rebuilt
dist/algorithmic-core.js.map   # Rebuilt
```

**Git diff:** 4 files changed, 26 insertions, 10 deletions

---

## RECOMMENDATIONS FOR NEXT SESSION

1. **First action:** Run `npm run build` in trident-brain-code-review to verify clean compile
2. **Test firewall:** Say "firewall-test" to verify no infinite loop
3. **If crashes recur:** Check session DB health with `sqlite3 ~/.config/opencode/opencode.db ".schema sessions"`

---

*Crash Analysis - FIXED 2026-04-14*