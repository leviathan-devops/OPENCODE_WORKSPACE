# Hive Mind Plugin — Context Library Catalog

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/`  
**Plugin Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/`  
**Plugin File:** `hive-mind-plugin.ts` (1,494 lines TypeScript)  
**Status:** PRODUCTION READY | 7/7 integration tests pass | 41/41 unit tests pass  
**Build:** Spider Agent → Leviathan pressure test → v4 production ready

---

## ⚠️ IMPORTANT: File Locations

**Old (outdated):** `/home/leviathan/.config/opencode/plugins/iteration-v4/`  
**Current (v4):** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/`

The plugin is registered in `~/.config/opencode/opencode.json` as a **local file**:
```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts"
]
```

---

## Directory Structure

```
Hive Mind Plugin/
├── v4/                                  # PRODUCTION VERSION
│   ├── hive-mind-plugin.ts              # Production plugin code
│   ├── hive-mind-plugin.test.ts         # Unit tests (41 pass)
│   ├── openviking-config.json           # Config
│   ├── openviking.service               # systemd service
│   ├── llama-embedding.service         # systemd service
│   ├── INSTALL-SERVICES.md             # Installation guide
│   ├── README.md                       # Master index
│   ├── SHIP.md                        # Ship report
│   └── tests/
│       └── integration/
│           └── run-integration-tests.sh  # Integration tests (7/7 pass)
├── 00-CATALOG.md                       # This file
├── 01_STATUS.md                        # Pre-v4 status
├── ARCHITECTURE.md                     # Architecture docs
└── [historical files...]
```

---

## Quick Access

| Need | File | Key Info |
|------|------|----------|
| **Production Plugin** | `v4/hive-mind-plugin.ts` | All code here |
| **Is it working?** | `v4/SHIP.md` | 7/7 integration tests pass |
| **Integration tests** | `v4/tests/integration/run-integration-tests.sh` | 7 tests |
| **Unit tests** | `v4/hive-mind-plugin.test.ts` | 41 tests |
| **How to deploy** | `v4/INSTALL-SERVICES.md` | systemd services |
| **Quick reference** | `v4/README.md` | Master index |

---

## Critical Findings

### Bugs Found & Fixed (v4)

| Bug | File:Line | Impact | Fix |
|-----|-----------|--------|-----|
| `temp_file_id` → `temp_path` | `hive-mind-plugin.ts` | All uploads fail with 422 | Changed commit body field |
| `data.memories` → `result.resources` | `hive-mind-plugin.ts` | All searches return empty | Fixed result extraction |
| Missing `wait: true` | `hive-mind-plugin.ts` | Embeddings never indexed | Added to commit call |
| Session buffer flush lie | `hive-mind-plugin.ts` | Logged "flushed" when discarded | Logged as discarded |

### Theatrical Code Status

| Pattern | Status |
|---------|--------|
| Empty catch blocks | ✅ Fixed |
| Silent error swallowing | ✅ Fixed |
| Wrong API field names | ✅ Fixed |
| Missing `wait:true` | ✅ Fixed |
| Integration tests | ✅ 7/7 pass |

---

## Test Results

### Unit Tests
```
41 pass, 0 fail
```

### Integration Tests (Real Infrastructure)
```
Test 1: Health check... PASS
Test 2: Embedding (768-dim)... PASS (dim=768)
Test 3: Temp upload... PASS
Test 4: Commit... PASS
Test 5: Semantic search... PASS (found=4)
Test 6: Fetch by URI... PASS
Test 7: Local fallback... PASS (dir exists)

7/7 PASS ✅
```

---

## Services Running

| Service | Port | Status |
|---------|------|--------|
| OpenViking | 1933 | ✅ Running (systemd) |
| llama.cpp embedding | 8001 | ✅ Running (systemd) |
| Local fallback | N/A | ✅ Verified |

---

## For More Information

- **Production Plugin:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts`
- **Ship Report:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/SHIP.md`
- **Installation Guide:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/INSTALL-SERVICES.md`

---

*Catalog v2.0 — Updated for v4 production release — 2026-04-02*