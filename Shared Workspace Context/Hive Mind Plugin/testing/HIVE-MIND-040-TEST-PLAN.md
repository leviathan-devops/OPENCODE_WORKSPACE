# Hive Mind Plugin — Deployment Test Plan

**Test Plan ID:** HIVE-MIND-TEST-001  
**Date:** 2026-04-02  
**Status:** PENDING - Integration tests not written

---

## Pre-deployment Checks

- [ ] Bun runtime 1.3+ installed: `bun --version`
- [ ] Python 3.12+ installed: `python3 --version`
- [ ] llama.cpp built: `ls -la /home/leviathan/llama.cpp/build/bin/llama-server`
- [ ] Embedding model present: `ls -la /home/leviathan/models/nomic-embed-text*.gguf`
- [ ] OpenViking installed: `/home/leviathan/.local/bin/openviking-server --version`
- [ ] Plugin file present: `ls -la /home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts`

---

## Test 1: Embedding Server

**Objective:** Verify embedding server starts and responds correctly

**Steps:**
1. Start embedding server
2. Wait 10 seconds
3. Run: `curl -s http://localhost:8001/v1/models`
4. Run: `curl -s -X POST http://localhost:8001/v1/embeddings -d '{"model":"nomic-embed-text-v1.5.Q4_K_M.gguf","input":"hello world"}'`

**Expected:**
- Models endpoint returns nomic model info
- Embeddings endpoint returns 768-dim vector

**Acceptance Criteria:** ✅ Both commands return valid JSON with embedding data

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Models endpoint | ☐ | ☐ | |
| Embeddings endpoint | ☐ | ☐ | |

---

## Test 2: OpenViking Server

**Objective:** Verify OpenViking starts and health check works

**Steps:**
1. Start OpenViking
2. Wait 5 seconds
3. Run: `curl -s http://localhost:1933/health`
4. Check vectordb dimension

**Expected:**
- Health returns `{"status":"ok","healthy":true,"version":"..."}`
- Vector DB dimension is 768 (not 1024)

**Acceptance Criteria:** ✅ Health OK, dimension 768

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Health endpoint | ☐ | ☐ | |
| Vector dimension | ☐ | ☐ | |

---

## Test 3: Plugin Loading

**Objective:** Verify plugin loads and starts health monitoring

**Steps:**
1. Start OpenCode with the plugin
2. Check logs for "HiveMind Plugin loaded"

**Expected:**
- Plugin startup messages appear in logs
- Health check loop starts

**Acceptance Criteria:** ✅ Startup messages present

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Plugin loads | ☐ | ☐ | |
| Health loop starts | ☐ | ☐ | |

---

## Test 4: Manual Upload (hive_remember)

**Objective:** Verify upload flow works end-to-end

**Steps:**
1. Call `hive_remember` tool with test memory
2. Check OpenViking for content
3. Check local fallback

**Expected:**
- Content appears in OpenViking OR local fallback
- Plugin log shows success

**Acceptance Criteria:** ✅ Content retrievable from at least one location

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| OpenViking upload | ☐ | ☐ | |
| Local fallback | ☐ | ☐ | |
| Retrieval works | ☐ | ☐ | |

---

## Test 5: Search (hive_context)

**Objective:** Verify semantic search works

**Steps:**
1. Ensure at least one memory exists
2. Call `hive_context` tool
3. Check results

**Expected:**
- Results returned with URIs and scores
- No errors in plugin logs

**Acceptance Criteria:** ✅ Search returns results without errors

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Search succeeds | ☐ | ☐ | |
| Results returned | ☐ | ☐ | |
| No errors | ☐ | ☐ | |

---

## Test 6: Health Check Tool (hive_status)

**Objective:** Verify status reporting

**Steps:**
1. Call `hive_status` tool
2. Check output includes expected fields

**Expected:**
- JSON status with all expected fields
- openViking.connected = true (if healthy)

**Acceptance Criteria:** ✅ Status returns complete information

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Status returns | ☐ | ☐ | |
| Fields complete | ☐ | ☐ | |
| Connection correct | ☐ | ☐ | |

---

## Test 7: Database Query (memread_session)

**Objective:** Verify opencode.db access works

**Steps:**
1. Identify a recent session ID
2. Call `memread_session` with that session ID

**Expected:**
- Session data returned with metadata

**Acceptance Criteria:** ✅ Session data retrieved

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Query succeeds | ☐ | ☐ | |
| Data complete | ☐ | ☐ | |

---

## Test 8: Canary Monitoring

**Objective:** Verify hook execution tracking

**Steps:**
1. Check plugin logs for canary entries
2. Run `hive_status` and check canary section

**Expected:**
- Canary entries appear periodically
- `totalHookCalls` counter present

**Acceptance Criteria:** ✅ Canary reporting works

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Canary entries | ☐ | ☐ | |
| Periodic logging | ☐ | ☐ | |

---

## Test 9: OpenViking Outage Resilience

**Objective:** Verify local fallback when OpenViking is down

**Steps:**
1. Start upload
2. Kill OpenViking
3. Wait 2 minutes (health check will detect down)
4. Perform another upload
5. Check local fallback
6. Restart OpenViking

**Expected:**
- First upload to OpenViking succeeds
- After kill, uploads go to local fallback
- After restart, OpenViking comes back healthy

**Acceptance Criteria:** ✅ Fallback used during outage

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| Pre-outage upload | ☐ | ☐ | |
| Fallback during outage | ☐ | ☐ | |
| Recovery after restart | ☐ | ☐ | |

---

## Test 10: Unit Tests

**Objective:** Verify all unit tests pass

**Steps:**
```bash
cd /home/leviathan/.config/opencode/plugins
bun test tests/hive-mind-plugin.test.ts
```

**Expected:** 41 tests pass, 0 fail

**Acceptance Criteria:** ✅ All 41 tests pass

**Results:**
| Check | Pass | Fail | Notes |
|-------|------|------|-------|
| All 41 tests | ☐ | ☐ | |

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Reviewer | | | |
| Approver | | | |

---

*Test Plan v1.0 — Leviathan Agent — 2026-04-02*
