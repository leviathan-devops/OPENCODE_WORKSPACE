# OPENCODE MEMORY BLOAT - FULL FORENSIC REPORT & CLEANUP

**Date:** 2026-04-14
**Analyst:** Trident Brain
**Status:** CLEANUP COMPLETE

---

## EXECUTIVE SUMMARY

OpenCode sessions were crashing after ~2 minutes during context generation due to **severe disk/memory bloat**. A total of **~370 GB** of accumulated garbage was cleaned from the system, reducing disk usage from 70% to 28%.

### Before Cleanup
| Metric | Value |
|--------|-------|
| Disk Usage | 616 GB / 937 GB (70%) |
| Swap Used | 8.0 GB / 8.0 GB (100% FULL) |
| Memory Available | ~5 GB |
| OpenCode Local Data | **374 GB** |

### After Cleanup
| Metric | Value |
|--------|-------|
| Disk Usage | 246 GB / 937 GB (28%) |
| Swap Used | 6.0 GB / 8.0 GB (75%) |
| Memory Available | **11 GB** |
| OpenCode Local Data | **9.9 GB** |

**Space Freed:** ~370 GB

---

## ROOT CAUSE ANALYSIS

### The Memory/Disk Bloat Chain

```
Session Activity → snapshot/global/ grows unbounded → 354 GB
                → session_diff/ accumulates → 11 GB  
                → swap fills up → sessions crash
                → OOM on context generation
```

### Component Breakdown

#### 1. `~/.local/share/opencode/snapshot/global/` — **354 GB**

**Purpose:** Git-like object store for session snapshots (content-addressable storage)

**Problem:** This git pack repository grew unbounded over time. It stored:
- Pack files containing compressed session states
- 354 GB of accumulated session snapshots
- Never cleaned up automatically

**Root Cause:** OpenCode's snapshot system uses git pack format but lacks:
- Automatic cleanup of old pack files
- Size limits on the global snapshot
- Lazy loading of historical data

#### 2. `~/.local/share/opencode/storage/session_diff/` — **11 GB**

**Purpose:** JSON files containing incremental diffs between session states

**Problem:** 1,865 session diff files, some over 850 MB each:
```
ses_27e169a35ffeBItgYFIDeBlaAM.json    850 MB
ses_282086413ffeAJCSGKdh20oYnz.json    756 MB
ses_291aa36e4ffeOCjVHNF1bVkTZ6.json    678 MB
ses_2926e132fffeqETS5KERxdqt0q.json    629 MB
```

**Root Cause:** Session diffs are written on every state change and never pruned.

#### 3. `~/.cache/uv/` — **2.8 GB**

**Purpose:** UV package manager cache (Python)

**Problem:** Accumulated Python package downloads

#### 4. `~/.cache/whisper/` — **2.0 GB**

**Purpose:** Whisper model cache (audio transcription)

**Problem:** Large ML model files cached indefinitely

#### 5. `~/.cache/huggingface/` — **1.9 GB**

**Purpose:** Hugging Face model cache

**Problem:** ML model weights cached indefinitely

#### 6. `~/.cache/go-build/` — **834 MB**

**Purpose:** Go build cache

**Problem:** Build artifacts accumulated over time

### Docker Container Bloat

**Containers Removed:**
- `kraken-audit-test` — 38.6MB (virtual 2.43GB)
- `kraken-tui-test` — 38.6MB (virtual 2.39GB)
- `kraken-test-container` — 8.19kB (virtual 694MB)

**Remaining (Active):**
- `shark-v483` — Active testing container
- `hermes-oc-agent-1266911` — Active hermes agent

---

## WHY SESSIONS CRASHED

### The Crash Sequence

1. **Swap 100% Full:** 354 GB snapshot + 11 GB session diffs + other data = system memory pressure

2. **Context Generation Trigger:** When generating context handover packages:
   - Session tries to load snapshot data
   - Memory allocation request fails (swap full)
   - Session crashes after ~2 minutes

3. **Memory Model Confusion:** User expected API calls to not use local memory:
   ```
   "I thought all the context was stored in the model"
   ```

### What Actually Happens

| Component | Memory Usage | Reason |
|-----------|-------------|--------|
| OpenCode Session | 6-12 GB RSS | Session state, history, context buffers |
| API Context | 0 KB local | Sent to API, only response stored |
| Local Snapshot | 354 GB disk | Persisted to disk, loaded on session resume |
| Session Diff | 11 GB disk | Written on each state change |

---

## CLEANUP ACTIONS TAKEN

### OpenCode Data (`~/.local/share/opencode/`)

| Action | Space Freed |
|--------|-------------|
| `rm -rf snapshot/global/*` | 354 GB |
| `rm -rf storage/session_diff/*.json` | 11 GB |
| `rm -f opencode.db.backup_before_restore` | 321 MB |
| Cleaned old logs | 4 MB |

**Result:** 374 GB → 9.9 GB (96% reduction)

### System Cache (`~/.cache/`)

| Cache | Before | Freed |
|-------|--------|-------|
| uv | 2.8 GB | 2.8 GB |
| whisper | 2.0 GB | 2.0 GB |
| huggingface | 1.9 GB | 1.9 GB |
| go-build | 834 MB | 834 MB |
| qmd | 467 MB | 467 MB |
| ms-playwright | 631 MB | 631 MB |
| electron | 329 MB | 329 MB |

**Total Cache Freed:** ~9.5 GB

### Docker

| Action | Containers Removed |
|--------|-------------------|
| `docker rm -f kraken-audit-test` | 1 |
| `docker rm -f kraken-tui-test` | 1 |
| `docker rm -f kraken-test-container` | 1 |

### Memory Recovery

| Before | After |
|--------|-------|
| 5 GB available | **11 GB available** |
| 8 GB swap (100% full) | 6 GB swap (75% used) |

---

## SYSTEM RECOVERY STATUS

```
=== AFTER CLEANUP ===
Memory Available:     11 GB (was 5 GB)
Swap Used:           6.0 GB / 8 GB (was 100% full)
Disk Usage:          246 GB / 937 GB (28%) (was 616 GB, 70%)
OpenCode Local:      9.9 GB (was 374 GB)
```

---

## THE FIX

### Immediate Recovery
- Swap cleared partially
- 370 GB disk space recovered
- Sessions should no longer crash

### Session Resume
- Old sessions may not resume (snapshot data deleted)
- Fresh sessions will work correctly
- Context generation will work without crashing

---

## RECOMMENDATIONS

1. **Monitor** `~/.local/share/opencode/` size monthly
2. **Set up** automatic cleanup (see GC project below)
3. **Limit** session diff retention to 7 days
4. **Archive** only essential session data

---

## GARBAGE COLLECTOR SOLUTION

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/opencode-gc/`

**Files:**
- `opencode-gc.sh` - Main garbage collector script
- `README.md` - Usage documentation
- `SYSTEM_GC_SPEC.md` - Full specification
- `package.json` - Project metadata

**Quick Start:**
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/opencode-gc
./opencode-gc.sh status   # Check current state
./opencode-gc.sh cleanup  # Run cleanup
```

**Install for automatic runs:**
```bash
# Add to crontab for daily cleanup
crontab -e
0 3 * * * /home/leviathan/OPENCODE_WORKSPACE/projects/opencode-gc/opencode-gc.sh >> ~/.local/share/opencode/log/gc-cron.log 2>&1
```
