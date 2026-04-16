# Hive Mind Plugin — Executive Summary

**Plugin:** `hive-mind-plugin.ts`  
**Lines:** 1,487 TypeScript (Bun runtime)  
**Purpose:** Subconscious memory for AI agent sessions — silently captures significant work products and stores them for future retrieval  
**Status:** Deployed | Fixed from theatrical v1  

---

## What It Does

The Hive Mind plugin provides **subconscious memory** for OpenCode sessions:

1. **Silent Capture**: Automatically detects and commits substantial work (architecture decisions, file creations, error fixes) without agent intervention
2. **Cross-Session Retrieval**: Future sessions can query "hive_context" to find related memories
3. **Local Fallback**: Writes to local disk first if OpenViking is unavailable
4. **Health Monitoring**: Continuous OpenViking health checks with automatic failover

### Key Features

- **Context Sandboxing**: Each session gets clean context; shared memory is subconscious only
- **Breakthrough Detection**: Automatically commits when agent produces substantial work
  - Architecture signals (interfaces, exports, type definitions)
  - Error→fix patterns (error followed by correction within 5 min)
  - Batch file creation (3+ substantial files)
- **Local Fallback**: All uploads write to local disk first — no data loss when OpenViking is down
- **Health Monitoring**: Continuous health checks (60s interval)
- **Hook Execution Canary**: Verifies experimental hooks are actually firing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenCode Session                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Hive Mind Plugin (in-process)                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │   Session    │  │  Pattern    │  │   OpenViking    │ │ │
│  │  │   Tracker    │  │  Detector   │  │   API Client    │ │ │
│  │  │  (in-memory) │  │             │  │                 │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  │         │                │                    │        │ │
│  │         ▼                ▼                    ▼        │ │
│  │  ┌─────────────────────────────────────────────────────┐│ │
│  │  │    Local Fallback Storage (always writes first)     ││ │
│  │  │    /home/leviathan/.local/share/opencode/hive-mind/ ││ │
│  │  └─────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                  │
│                            ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   OpenViking Server                      │ │
│  │                  (localhost:1933)                        │ │
│  │  ┌─────────────────┐  ┌────────────────────────────┐   │ │
│  │  │    Vector DB     │  │  llama.cpp Embedding Server │   │ │
│  │  │   (768-dim)      │  │     (localhost:8001)        │   │ │
│  │  └─────────────────┘  └────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Plugin Main | `/home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts` | 1,487 lines TypeScript |
| Configuration | `/home/leviathan/.config/opencode/plugins/openviking-config.json` | API endpoint, keys |
| Unit Tests | `/home/leviathan/.config/opencode/plugins/tests/hive-mind-plugin.test.ts` | 41 tests |
| OpenViking | `/home/leviathan/.local/bin/openviking-server` | Memory storage (port 1933) |
| Embedding | `/home/leviathan/llama.cpp/build/bin/llama-server` | Text vectorization (port 8001) |
| Local Fallback | `/home/leviathan/.local/share/opencode/hive-mind/` | Disk fallback |

---

## Critical Finding: Verification Theater

**The Spider Agent build passed 41/41 unit tests but had 3 critical API integration bugs.**

| Bug | Impact |
|-----|--------|
| `temp_file_id` → `path` | Every upload to OpenViking failed with 422 |
| `data.memories` → `result.resources` | Every search returned empty results |
| Hardcoded threshold `2` vs constant `3` | Inconsistent breakthrough detection |

**Root Cause:** Unit tests mock the OpenViking API — they test internal logic in isolation, not the actual API integration.

**Lesson:** Unit tests passing is NECESSARY but NOT SUFFICIENT. Every API integration needs integration tests against the real service.

---

## Production Status

| Component | Status | Notes |
|-----------|--------|-------|
| Plugin Code | ✅ Fixed | 3 critical bugs resolved |
| Unit Tests | ✅ 41/41 Pass | Logic verified |
| Integration Tests | ❌ Missing | NOT YET WRITTEN |
| OpenViking Server | ✅ Running | localhost:1933 |
| Embedding Server | ✅ Running | localhost:8001 |
| Local Fallback | ✅ Verified | Writes confirmed |
| Health Monitoring | ✅ Active | 60s check interval |

---

## Current Blockers

| Priority | Blocker | Owner |
|----------|---------|-------|
| P0 | Integration tests missing | TODO |
| P0 | Live plugin loading unverified | TODO |
| P1 | Experimental hooks unverified | TODO |
| P1 | Breakthrough detection E2E | TODO |

---

## Key Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `LOCAL_FALLBACK_DIR` | `/home/leviathan/.local/share/opencode/hive-mind` | Local storage base |
| `GOLD_STANDARD_MIN_CHARS` | 2000 | Min file size for breakthrough |
| `ARCHITECTURE_SIGNAL_THRESHOLD` | 3 | Score needed for architecture commit |
| `ERROR_FIX_WINDOW_MS` | 300000 (5 min) | Error→fix detection window |
| `BREAKTHROUGH_COOLDOWN_MS` | 600000 (10 min) | Min between breakthroughs |
| `HEALTH_CHECK_INTERVAL_MS` | 60000 (1 min) | Health check frequency |

---

*Summary v1.0 — Leviathan Agent — 2026-04-02*
