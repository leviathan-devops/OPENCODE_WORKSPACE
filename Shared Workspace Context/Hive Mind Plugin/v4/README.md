# Hive Mind Plugin v4 — MASTER INDEX

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/`  
**Status:** PRODUCTION READY  
**Last Updated:** 2026-04-02

---

## ⚠️ IMPORTANT: Plugin Path in opencode.json

The plugin is registered in `~/.config/opencode/opencode.json` as:
```json
"plugin": [
  "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/spider-agent",
  "file:///home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Plugin/v4/hive-mind-plugin.ts"
]
```

**NOT** as an npm package. This is a LOCAL FILE plugin.

---

## Quick Start

### Running Services
```bash
systemctl status openviking.service      # Memory server (port 1933)
systemctl status llama-embedding.service  # Embedding server (port 8001)
```

### Run Integration Tests
```bash
./tests/integration/run-integration-tests.sh
```

---

## Directory Contents

| File | Purpose |
|------|---------|
| `hive-mind-plugin.ts` | **Production plugin code** (1,494 lines) |
| `hive-mind-plugin.test.ts` | Unit tests (41 pass) |
| `openviking-config.json` | OpenViking connection config |
| `openviking.service` | systemd service for OpenViking |
| `llama-embedding.service` | systemd service for llama.cpp embedding |
| `INSTALL-SERVICES.md` | Service installation guide |
| `RUN-INTEGRATION-TESTS.sh` | Shell-based integration tests (7/7 pass) |
| `SHIP.md` | Ship report and deployment checklist |
| `README.md` | This file |

---

## Architecture

```
OpenCode Session
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  hive-mind-plugin.ts (1,494 lines)                            │
│  ├── Health check loop (60s interval)                         │
│  ├── Canary monitoring (hook execution tracking)              │
│  ├── Local fallback storage                                  │
│  └── Pattern detection                                       │
│       ├── Architecture signals (interfaces, exports, etc.)   │
│       ├── Error→fix sequences (5-min window)                 │
│       └── Batch file creation (3+ files)                      │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  OpenViking (localhost:1933)                                │
│  └── Semantic search with 768-dim embeddings                │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  llama.cpp embedding server (localhost:8001)                 │
│  └── nomic-embed-text-v1.5.Q4_K_M.gguf                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Tools Provided

| Tool | Purpose |
|------|---------|
| `hive_context` | Semantic search of shared memory |
| `hive_status` | Plugin health and connection status |
| `hive_remember` | Manually persist a memory |
| `memread_session` | Read past session from opencode.db |
| `memlink_parent` | Link sessions in lineage chain |

---

## Hooks Registered

| Hook | Purpose |
|------|---------|
| `experimental.chat.messages.transform` | Pattern detection on messages |
| `experimental.session.compacting` | Session-end memory commit |

---

## Theatrical Code Status

| Issue | Status |
|-------|--------|
| Empty catch blocks | ✅ Fixed |
| Silent error swallowing | ✅ Fixed |
| Wrong API field names | ✅ Fixed |
| Missing `wait:true` | ✅ Fixed |
| Session buffer flush lie | ✅ Fixed |

**Full audit:** See `SHIP.md`

---

## Integration Test Results

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

## Common Tasks

### Run Integration Tests
```bash
./tests/integration/run-integration-tests.sh
```

### Check Service Status
```bash
systemctl status openviking.service
systemctl status llama-embedding.service
```

### Restart Services
```bash
sudo systemctl restart openviking.service
sudo systemctl restart llama-embedding.service
```

### View Logs
```bash
journalctl -u openviking.service -u llama-embedding.service -f
```

### Enable on Boot
```bash
sudo systemctl enable openviking.service
sudo systemctl enable llama-embedding.service
```

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| v1 | 2026-04-01 | Theatrical — 8 critical failures |
| v2 | 2026-04-01 | Fixes attempted but not verified |
| v3 | 2026-04-02 | Snapshot of broken state |
| v4 | 2026-04-02 | **PRODUCTION READY** |

---

## For More Information

- **Ship Report:** `SHIP.md`
- **Installation Guide:** `INSTALL-SERVICES.md`
- **Unit Tests:** `hive-mind-plugin.test.ts`
- **Integration Tests:** `tests/integration/`