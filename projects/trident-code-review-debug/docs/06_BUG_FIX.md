# TRIDENT BRAIN - BUG FIX REPORT
## Critical Bug Found and Fixed During Audit

**Date:** 2026-04-14  
**Status:** FIXED ✅

---

## Bug: Non-Global regex.exec() Infinite Duplication

### Problem

When using `regex.exec()` with a **non-global** regex (no `g` flag), the same match is returned repeatedly forever because `lastIndex` stays at 0.

```javascript
const regex = /return.*success.*true/i;
regex.exec(code); // Returns match
regex.exec(code); // Returns SAME match again!
regex.exec(code); // Returns SAME match again!
// Infinite loop prevented only by safetyCount
```

### Symptom

Audit of trident-brain source found **400 findings** from a file with only 3 theatrical patterns. Each actual match was being reported 100 times.

### Root Cause

The code was removing the global flag:
```typescript
const flags = pattern.regex.flags.replace('g', '');  // WRONG
const regex = new RegExp(pattern.regex.source, flags);
```

### Fix

Instead of removing global, **add global** if not present:
```typescript
const flags = pattern.regex.flags.includes('g') 
  ? pattern.regex.flags 
  : pattern.regex.flags + 'g';
const regex = new RegExp(pattern.regex.source, flags);
```

### Files Fixed

| File | Method |
|------|--------|
| `src/algorithmic-core.ts` | `scanPatterns()` |
| `src/algorithmic-core.ts` | `scanRealtime()` |
| `src/algorithmic-core.ts` | `scanSoft()` |

### Verification

```
Before fix: 400 findings (100x duplicates)
After fix:  5 findings (no duplicates)
```

---

## Ship Readiness Status

| Check | Status |
|-------|--------|
| Build | ✅ Clean |
| Pattern matching | ✅ No more duplicates |
| Console clean | ✅ 0 statements |
| Tool blocking | ✅ Active |
| SafetyCount | ✅ Working |
| Real audit test | ✅ Passed |

---

*Bug Fixed 2026-04-14*