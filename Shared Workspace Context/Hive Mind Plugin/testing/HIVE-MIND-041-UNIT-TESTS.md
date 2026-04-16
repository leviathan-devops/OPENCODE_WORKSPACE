# Hive Mind Plugin — Unit Tests

**Location:** `/home/leviathan/.config/opencode/plugins/tests/hive-mind-plugin.test.ts`  
**Status:** 41/41 PASS (verified 2026-04-02)  

---

## Test Summary

| Category | Count | Status |
|----------|-------|--------|
| Configuration | ~5 | ✅ PASS |
| Logging | ~3 | ✅ PASS |
| Session Tracker | ~5 | ✅ PASS |
| API Client | ~10 | ✅ PASS |
| Pattern Detection | ~8 | ✅ PASS |
| Breakthrough Commit | ~5 | ✅ PASS |
| Health Check | ~3 | ✅ PASS |
| Plugin Export | ~2 | ✅ PASS |
| **TOTAL** | **41** | **✅ PASS** |

---

## Running Tests

```bash
cd /home/leviathan/.config/opencode/plugins
bun test tests/hive-mind-plugin.test.ts
```

---

## What Tests Cover

### Configuration Tests
- Config loading
- Health check state initialization
- Default values

### Logging Tests
- Log format
- File output
- Category filtering

### Session Tracker Tests
- Session state creation
- File tracking
- Error tracking
- Breakthrough cooldown

### API Client Tests
- URL construction
- Request formatting
- Response parsing (MOCKED)
- Error handling

### Pattern Detection Tests
- Architecture signal scoring
- Error→fix window detection
- Batch file detection

### Breakthrough Commit Tests
- Content building
- Session extraction
- State reset

### Health Check Tests
- Health check loop
- Consecutive failure tracking
- Recovery detection

---

## What Tests DO NOT Cover

### ⚠️ IMPORTANT: What Tests Miss

The unit tests **mock the OpenViking API** responses. This means they don't test:

1. **Actual API field names** — `temp_path` vs `temp_file_id`
2. **Actual API response structure** — `result.resources` vs `result.memories`
3. **Real network conditions** — timeouts, errors
4. **Real embedding generation** — vector dimensions

### Critical Bugs NOT Caught by Unit Tests

| Bug | Why Not Caught |
|-----|----------------|
| `temp_file_id` → `path` | Mock returns generic object, doesn't verify field names |
| `result.resources` | Mock returns `memories`, test uses mock path |
| Threshold hardcoded | Test doesn't verify constant usage |

---

## Integration Tests Needed

**MISSING:** Integration tests against real OpenViking API

These would catch the bugs that unit tests miss:

```typescript
// Example integration test (NOT WRITTEN)
test('should upload to real OpenViking', async () => {
  const result = await uploadToOV('test-key', '# Test content')
  expect(result.success).toBe(true)
  expect(result.targetUri).toContain('viking://')
})
```

---

## Unit Test Limitations

| Aspect | Unit Tests | Integration Tests |
|--------|-----------|------------------|
| Speed | Fast | Slow |
| External dependencies | Mocked | Real |
| API field verification | ❌ | ✅ |
| Real error handling | ❌ | ✅ |
| Network conditions | ❌ | ✅ |

**Conclusion:** Unit tests passing is NECESSARY but NOT SUFFICIENT.

---

*Unit Tests v1.0 — Leviathan Agent — 2026-04-02*
