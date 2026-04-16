# Hive Mind Plugin — Pressure Test Audit Log

**Test ID:** HIVE-MIND-AUDIT-001  
**Date:** 2026-04-02 04:52  
**Tester:** Leviathan Agent (MiniMax-M2.7)  
**Subject:** Spider Agent Build — Pressure Test  

---

## Executive Summary

The Spider Agent delivered a build with **41/41 unit tests passing** but **3 critical API integration bugs** that would cause complete functional failure.

**Verification theater:** Tests verify internal logic in isolation against mocks, not actual OpenViking API behavior.

---

## Bugs Found

### Bug #1: temp_file_id → path (CRITICAL)

**File:** `hive-mind-plugin.ts`  
**Line:** 529  
**Severity:** CRITICAL  
**Impact:** Every upload to OpenViking fails with 422  

**Before:**
```typescript
body: JSON.stringify({ temp_file_id: tempId, to: targetUri, reason })
```

**After:**
```typescript
body: JSON.stringify({ path: tempId, to: targetUri, reason })
```

**Root Cause:** Unit tests mock the API response, never verify actual field names.

---

### Bug #2: result.resources vs result.memories (CRITICAL)

**File:** `hive-mind-plugin.ts`  
**Lines:** 390-392  
**Severity:** CRITICAL  
**Impact:** Every search returns empty results  

**Before:**
```typescript
const results = data.result.memories || []
```

**After:**
```typescript
const result = data.result || {}
const results = result.resources || result.memories || []
```

**Root Cause:** Mock returns `memories`, test follows mock. Real API returns `resources`.

---

### Bug #3: Architecture Threshold Hardcoded (MEDIUM)

**File:** `hive-mind-plugin.ts`  
**Line:** 591  
**Severity:** MEDIUM  
**Impact:** Inconsistent breakthrough detection  

**Before:**
```typescript
const detected = score >= 2  // Hardcoded
```

**After:**
```typescript
const detected = score >= ARCHITECTURE_SIGNAL_THRESHOLD  // Uses constant (3)
```

**Root Cause:** Test doesn't verify constant usage, just that threshold logic works.

---

## Testing Performed

### Unit Tests (Spider Agent's)
```bash
cd /home/leviathan/.config/opencode/plugins
bun test tests/hive-mind-plugin.test.ts
# Result: 41/41 PASS
```

### Direct API Tests (Leviathan)
```bash
# Test 1: temp_upload
curl -s -X POST http://localhost:1933/content/upload \
  -H "X-API-Key: hive-mind-key" \
  -H "X-OpenViking-Account: default" \
  -H "X-OpenViking-User: hive-mind" \
  -H "Content-Type: application/json" \
  -d '{"content":"# Test","mimeType":"text/markdown"}'
# Response: { temp_path: "/tmp/..." } ← NOTE: temp_path

# Test 2: resources/commit
curl -s -X POST http://localhost:1933/resources/commit \
  -H "X-API-Key: hive-mind-key" \
  -H "X-OpenViking-Account: default" \
  -H "X-OpenViking-User: hive-mind" \
  -H "Content-Type: application/json" \
  -d '{"path":"/tmp/...","to":"viking://...","reason":"test"}'
# Result: 422 if using temp_file_id, SUCCESS if using path

# Test 3: Search
curl -s -X POST http://localhost:1933/resources/search \
  -H "X-API-Key: hive-mind-key" \
  -H "X-OpenViking-Account: default" \
  -H "X-OpenViking-User: hive-mind" \
  -H "Content-Type: application/json" \
  -d '{"query_vector":[...768 dims...],"limit":5}'
# Response: { result: { resources: [...] } } ← NOTE: resources
```

### E2E Upload/Search/Read Test
1. Upload memory via `uploadToOV()`
2. Search via `searchInOV()`
3. Read via `fetchFromOV()`
4. Result: **PASS** after fixes applied

---

## Verification Theater Evidence

### Claim (Spider Agent Build Report)
```
✅ 41 unit tests passing
✅ Plugin ready for deployment
```

### Reality (Leviathan Pressure Test)
```
❌ Upload: 422 error every time (field name wrong)
❌ Search: Empty results every time (response path wrong)
❌ Detection: Inconsistent threshold (hardcoded vs constant)
```

### Root Cause Analysis
1. **Unit tests mock the OpenViking API** — They test internal logic in isolation
2. **No integration tests exist** — 41/41 pass but 0 E2E tests
3. **Agent doesn't pressure-test its own work** — The coder wrote tests, not independent QA
4. **Silent failures** — `catch {}` blocks swallow errors without logging

---

## Timeline

| Time | Phase | Agent | Action |
|------|-------|-------|--------|
| 2026-04-01 | Build | Spider Agent | Delivered plugin with 41 unit tests |
| 2026-04-02 04:35 | Audit Start | Leviathan | Started pressure test |
| 2026-04-02 05:00 | Bug Found #1 | Leviathan | temp_file_id field |
| 2026-04-02 05:10 | Bug Found #2 | Leviathan | result.resources path |
| 2026-04-02 05:15 | Bug Found #3 | Leviathan | Threshold hardcoded |
| 2026-04-02 05:20 | Fixes Applied | Leviathan | All 3 critical bugs fixed |
| 2026-04-02 05:30 | Unit Tests | Leviathan | 41/41 PASS |
| 2026-04-02 05:35 | E2E API Test | Leviathan | Upload/Search/Read PASS |

---

## Recommendations

### Immediate
- [x] Fixed 3 critical bugs (done)
- [ ] Write integration tests against real API (TODO)
- [ ] Verify plugin loads in live OpenCode (TODO)

### Short-term
- [ ] Add ESLint rule: no empty catch blocks
- [ ] Add CI gate: integration tests must pass
- [ ] Independent QA before any build ships

### Culture
- [ ] Test count is NOT quality
- [ ] Independent verification is mandatory
- [ ] "Tests pass" is necessary but not sufficient

---

## Sign-off

| Role | Agent | Date |
|------|-------|------|
| Pressure Tester | Leviathan (MiniMax-M2.7) | 2026-04-02 |
| Bugs Fixed | Leviathan | 2026-04-02 |
| Next Phase Owner | **UNASSIGNED** | — |

---

*Audit Log v1.0 — Leviathan Agent — 2026-04-02*
