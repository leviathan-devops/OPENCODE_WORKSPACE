# KRAKEN V2.0 — CRASH RECOVERY & BUILD CONTINUATION PROTOCOL

**Version:** 2.0 | **Status:** ACTIVE | **Location:** `Master Context/`

---

## PURPOSE

This is the **SINGLE SOURCE OF TRUTH** for recovering Kraken build sessions after crashes or context compactions. Any Kraken agent, at any point in the build, can use this document to:

1. Immediately regain full stream of consciousness
2. Understand exactly where the build was interrupted
3. Resume work without losing progress
4. Maintain checkpoint hygiene throughout

**IF IT'S NOT REAL, IT'S NOT DONE.**

---

## THE GOLDEN RULE

**Every session start = Read this document FIRST. Always.**

```bash
# IMMEDIATE FIRST ACTION ON ANY SESSION START
cat "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Master Context/CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md"
```

---

## CURRENT BUILD STATE

### Project Being Built
**Kraken Agent v2.0 — Ship Package**

### Build Phase
- [x] PLAN
- [x] **BUILD** — COMPLETE (interrupted during pre-ship debugging)
- [ ] TEST
- [ ] VERIFY
- [ ] SHIP

### Last Known State (2026-04-14, ~20:12 UTC)

The build was in **pre-ship debugging phase**. The following work was completed:

#### ✅ COMPLETED
1. **Zod schema bug FIXED** — Removed unused standalone schemas causing `_zod.def` errors
2. **Python wrapper hardcoded paths FIXED** — 6 wrapper files patched in `v2.0-retry/`
3. **TypeScript source hardcoded paths FIXED** — 4 source files patched
4. **Ship package GENERATED** — `SHIP_KRAKEN_V2.0/` exists but is OUTDATED
5. **Plugin initialization verified** — 11 agents, 3 clusters, `krakenHiveReady: true`

#### ❌ INTERRUPTED BY CRASH
1. **Bundle was NEVER rebuilt** after source fixes — `v2.0-retry/build/dist/index.js` still has hardcoded paths
2. **Ship package not updated** with fixed wrappers and rebuilt bundle
3. **Container runtime verification** not completed

### Hardcoded Paths Still Present in Bundle (NEEDS FIX)

```
/home/leviathan/.local/share/opencode/kraken-hive  (lines 1126, 14115, 14134, 14165)
```

### What The Bundle Needs

```typescript
// CURRENT (BROKEN):
var LOCAL_FALLBACK_DIR = "/home/leviathan/.local/share/opencode/kraken-hive";

// NEEDS TO BE:
var LOCAL_FALLBACK_DIR = path.join(os.homedir(), '.local/share/opencode/kraken-hive');
```

---

## KEY FILE LOCATIONS

### Project & Source
| Purpose | Path |
|---------|------|
| **Active Project** | `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/` |
| **TypeScript Source** | `projects/kraken-v2.0-proper-build/kraken-agent-source/src/` |
| **Wrappers (FIXED)** | `Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/kraken-agent-source/wrappers/` |
| **Wrappers (SHIP)** | `SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers/` (NOT YET UPDATED) |

### Build Outputs
| Purpose | Path |
|---------|------|
| **Bundle Source** | `projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js` (NEEDS REBUILD) |
| **Bundle Retry** | `Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/build/dist/index.js` |
| **Ship Package** | `/home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/` |

### Checkpoints
| Path |
|------|
| `projects/kraken-v2.0-proper-build/.checkpoints/` |

### Compaction Survival System
| Purpose | Path |
|---------|------|
| **Root** | `Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/` |
| **Session State** | `COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md` |
| **Knowledge Base** | `COMPACTION SURVIVAL/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md` |
| **Handover Packages** | `COMPACTION SURVIVAL/HANDOVER_PACKAGES/` |

### Context Anchors (READ THESE)
| Priority | Document | Purpose |
|----------|----------|---------|
| 1 | `Master Context/CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md` | THIS FILE |
| 2 | `COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md` | Current session state |
| 3 | `COMPACTION SURVIVAL/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md` | Build workflow & architecture |
| 4 | `Working Project Space/v2.0-retry/CONTEXT_HANDOVER.md` | Detailed fix history & verification steps |
| 5 | `NUKE RELOAD/v2.0/COMPLETE_AUDIT_LOG.md` | Full audit with before/after code |

---

## COMPACTION SURVIVAL WORKFLOW

### Tier 0: Light Pruning (65% context)
DynamicContextPruner auto-removes low-value context.

### Tier 1: PRE-EXPORT (140-150K tokens)
**CRITICAL — DO THIS MANUALLY EVERY 100K TOKENS:**

```typescript
// Before compaction hits, create a checkpoint:
1. Write current state to COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md
2. Export key context to COMPACTION SURVIVAL/HANDOVER_PACKAGES/
3. Create checkpoint: .checkpoints/auto-save-{timestamp}/
```

### Tier 2: AUTO-COMPACT (~170-175K tokens)
OpenCode native compaction fires. Context reduced to ~15%.

### Tier 3: POST-COMPACTION RECOVERY

**IMMEDIATE ACTIONS (in order):**

1. **Read this document** (you're already doing it)
2. **Read session state tracker:**
   ```
   cat "Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md"
   ```
3. **Read handover package if exists:**
   ```
   cat "Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/HANDOVER_PACKAGES/"*/BUILD_STATE.txt
   ```
4. **Check for manual checkpoints:**
   ```
   ls -la projects/kraken-v2.0-proper-build/.checkpoints/
   ```
5. **Assess what was lost and resume**

---

## CONTINUATION STEPS (What to do RIGHT NOW)

### STEP 1: Assess Current State
```bash
# Check if bundle was rebuilt (it wasn't according to context)
md5sum "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/build/dist/index.js"

# Expected (OLD): 4988835fbfadca0d0c1d28058a079d72
# Should be (NEW): Different after rebuild
```

### STEP 2: Rebuild Bundle
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build
bun run build
```

### STEP 3: Verify Hardcoded Paths Gone
```bash
grep -n "/home/leviathan" kraken-agent/dist/index.js
# Expected: Only non-executable references or comments
```

### STEP 4: Copy Fixed Wrappers to Ship Package
```bash
# Copy fixed wrappers from v2.0-retry to SHIP_KRAKEN_V2.0
cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/kraken-agent-source/wrappers/"*.py \
   "/home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers/"

# Copy fixed subagent-manager wrappers
cp "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/subagent-manager/wrappers/"*.py \
   "/home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/subagent-manager/wrappers/"
```

### STEP 5: Copy Rebuilt Bundle to Ship Package
```bash
cp /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js \
   /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/build/dist/index.js

# Update checksum
md5sum /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/build/dist/index.js
```

### STEP 6: Verify Ship Package Wrappers
```bash
grep -n "/home/leviathan" /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers/*.py
# Expected: NO OUTPUT (all paths should be dynamic)
```

### STEP 7: Build Test Container
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0
docker build -t kraken-v2.0-test:latest -f Dockerfile.test .
```

### STEP 8: Run Container TUI Test
```bash
docker run -it --rm kraken-v2.0-test:latest
# Verify plugin loads with 11 agents, 3 clusters
```

---

## CHECKPOINT SYSTEM

### When to Create Checkpoints

| Milestone | Action |
|-----------|--------|
| Before any major change | Create checkpoint |
| After any fix verified | Create checkpoint |
| Every 50-100 tokens of context | Update 03_SESSION_STATE_TRACKER.md |
| Before session end | Export full state |

### Checkpoint Naming
```
.checkpoints/{milestone-name}/
├── BUILD_STATE.txt
├── CHECKSUMS.md5
└── snapshot.md (optional)
```

### Example Checkpoint Creation
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build
mkdir -p .checkpoints/pre-bundle-rebuild

# Export current state
cat > .checkpoints/pre-bundle-rebuild/BUILD_STATE.txt << 'EOF'
=== PRE-BUNDLE-REBUILD CHECKPOINT ===
Date: {CURRENT_DATE}
Status: About to rebuild bundle
Last action: Copied fixed wrappers to ship package
Next action: Run bun run build
EOF

# Save checksums
md5sum build/dist/index.js > .checkpoints/pre-bundle-rebuild/CHECKSUMS.md5
```

---

## STREAM OF CONSCIOUSNESS RESTORATION

### What Makes Stream of Consciousness

The "stream" is the continuous narrative of:
1. **What** you're building
2. **Why** each decision was made
3. **Where** you are in the build
4. **What failed** and **what worked**
5. **What's next**

### How to Maintain It

**RULE: Update state tracker EVERY significant action**

```bash
# After ANY significant action, append to stream:
cat >> "Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md" << 'EOF'

**[{TIMESTAMP}] {ACTION}**
What: {1 sentence}
Result: {Success/Failure}
Next: {Next immediate action}
EOF
```

### Stream of Consciousness Template

```markdown
**[{TIMESTAMP}] {ACTION}**
- What: {brief description}
- Where: {file/location}
- Result: {outcome}
- Next: {immediate next step}
```

### Example Entry
```markdown
**[(Auto-inserted)] BUNDLE_REBUILD**
- What: Rebuilt kraken-agent bundle after source path fixes
- Where: projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js
- Result: SUCCESS — MD5: abc123..., hardcoded paths removed
- Next: Copy rebuilt bundle to SHIP_KRAKEN_V2.0
```

---

## CONTEXT ANCHOR MAINTENANCE

### Anchor Update Schedule

| Trigger | Update |
|---------|--------|
| Every 20K tokens | Update 03_SESSION_STATE_TRACKER.md |
| After each fix | Update relevant doc (HANDOVER, AUDIT_LOG) |
| After each milestone | Create checkpoint |
| Before compaction | Export to HANDOVER_PACKAGES |

### Anchor Hierarchy

```
Tier 0 (Memory):     Current working context (ephemeral)
Tier 1 (This Doc):    CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md
Tier 2 (Session):     03_SESSION_STATE_TRACKER.md
Tier 3 (Project):     HANDOVER_PACKAGES/ and BUILD_STATE.txt
Tier 4 (Long-term):   COMPACTION SURVIVAL/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md
```

### Dynamic Anchor Resolution

On session start, read anchors in order until context is complete:

```bash
# 1. Check if session state tracker is fresh (< 1 hour)
stat -c %Y "Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md"

# 2. If stale, check for latest handover package
ls -t "Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/HANDOVER_PACKAGES/" | head -1

# 3. If no recent handover, rebuild from:
#    - This document (build state)
#    - COMPACTION SURVIVAL/00_COMPACTION_PROOF_KNOWLEDGE_BASE.md (architecture)
#    - NUKE RELOAD/v2.0/COMPLETE_AUDIT_LOG.md (audit trail)
```

---

## IMPORTANT CONSTANTS

### Build Commands
```bash
# Rebuild bundle
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build && bun run build

# Syntax check
node --check /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js

# Build test container
cd /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0 && docker build -t kraken-v2.0-test:latest -f Dockerfile.test .

# Run container test
docker run -it --rm kraken-v2.0-test:latest
```

### Key Checksums (BEFORE rebuild)
```
v2.0-retry bundle: 4988835fbfadca0d0c1d28058a079d72
SHIP_KRAKEN_V2.0 bundle: dad4fa54cec2ed6d7cf23df24d82ebc7 (OUTDATED)
```

### Plugin Initialization Verified Output
```
[v4.1][kraken-agent] Kraken Agent Harness initialized {
  clusterCount: 3,
  totalAgents: 11,
  krakenHiveReady: true,
}
```

### Known Bundle Hardcoded Paths (BEFORE fix)
```
Line 1126:  var LOCAL_FALLBACK_DIR = "/home/leviathan/.local/share/opencode/kraken-hive";
Line 14115: const reportPath = `/home/leviathan/.local/share/opencode/kraken-hive/pending-reports/...`;
Line 14134: const contextPath = `/home/leviathan/.local/share/opencode/kraken-hive/task-context/...`;
Line 14165: var ACTIVITY_LOG_DIR = "/home/leviathan/.local/share/opencode/kraken-hive/activity";
Line 14356: - Reference format examples: /home/leviathan/OPENCODE_WORKSPACE/...
```

---

## COMPACTION SURVIVAL FOLDER STRUCTURE

```
COMPACTION SURVIVAL/
├── 00_COMPACTION_PROOF_KNOWLEDGE_BASE.md    ← Architecture, workflow, tier system
├── 01_IMMEDIATE_RECOVERY.md                 ← Emergency recovery steps
├── 02_EMERGENCY_CONTEXT_TEMPLATE.md         ← Template for emergency exports
├── 03_SESSION_STATE_TRACKER.md              ← CURRENT session state (updated frequently)
├── 04_POST_COMPACTION_SYSTEM_PROMPT.md      ← System prompt for post-compaction
├── GOLDEN_BEHAVIOR_ENFORCEMENT.md           ← The ONE RULE + behavior guidelines
├── HANDOVER_PACKAGES/
│   └── KRAKEN_V2_0_BUILD_STATE_*/
│       ├── 00_COMPACTION_PROOF_KNOWLEDGE_BASE.md
│       ├── 03_SESSION_STATE_TRACKER.md
│       └── BUILD_STATE.txt
├── Algorithmic Systems/
├── Container Testing Context/
└── Plugin Engineering Context/
```

---

## WRAPPER PATH FIX REQUIREMENTS

### Files That Need Dynamic Paths (All FIXED in v2.0-retry)

| File | Issue | Fix |
|------|-------|-----|
| `opencode_agent.py` | `PLUGIN_MOUNTS` hardcoded `/home/leviathan/...` | Use `str(OPENCODE_WORKSPACE / ".shark")` |
| `container_pool.py` | `PLUGIN_MOUNTS` hardcoded `/home/leviathan/...` | Use `str(OPENCODE_WORKSPACE / ".shark")` |
| `kraken-agent-wrapper.py` | `PLUGIN_MOUNTS` hardcoded `/home/leviathan/...` | Use `str(OPENCODE_WORKSPACE / ".shark")` |
| `cluster-tools.ts` | N/A - already uses `import.meta.url` | N/A |
| `shark-t2-tools.ts` | `__dirname` hardcoded, `LOCAL_FALLBACK_DIR` hardcoded | Use `fileURLToPath`, `os.homedir()` |
| `hooks/cluster-state-hook.ts` | `LOCAL_FALLBACK_DIR` hardcoded | Use `path.join(os.homedir(), ...)` |
| `hooks/index.ts` | `ACTIVITY_LOG_DIR` hardcoded | Use `path.join(os.homedir(), ...)` |

### Verification Command
```bash
grep -rn "/home/leviathan" {wrappers,src}/ --include="*.py" --include="*.ts" | grep -v node_modules | grep -v ".checkpoints"
# Expected: Only comments or test code
```

---

## SESSION START CHECKLIST

When resuming after crash/compaction:

- [ ] Read this document (CRASH_RECOVERY_AND_BUILD_CONTINUATION_PROTOCOL.md)
- [ ] Read 03_SESSION_STATE_TRACKER.md
- [ ] Check for new handover packages in HANDOVER_PACKAGES/
- [ ] Assess bundle rebuild status (has it been rebuilt?)
- [ ] Verify which wrappers are in SHIP_KRAKEN_V2.0 vs v2.0-retry
- [ ] Determine next immediate action
- [ ] Execute next action
- [ ] Update 03_SESSION_STATE_TRACKER.md with result
- [ ] Create checkpoint if milestone reached

---

## ARCHITECTURE SUMMARY

### Triple-Brain System
- **Planning Brain**: Owns `planning-state`, `context-bridge`
- **Execution Brain**: Owns `execution-state`, `quality-state`
- **System Brain**: Owns `workflow-state`, `security-state`, **DYNAMIC CONTEXT MANAGEMENT**

### 4-Tier Context Management
| Threshold | Tier | Action |
|-----------|------|--------|
| 65% (~110K) | 0 | Light pruning (DynamicContextPruner) |
| 140-150K | 1 | PRE-EXPORT via compaction hook |
| ~170-175K | 2 | AUTO-COMPACT (OpenCode native) |
| Post-compact | 3 | Recovery via this protocol |

### Hive Mind Integration
- **kraken_hive_search**: Query past sessions/patterns
- **kraken_hive_remember**: Store decisions/discoveries
- **kraken_hive_inject_context**: Inject relevant context into tasks
- **kraken_hive_get_cluster_context**: Get cluster-specific memories

### Cluster Architecture
| Cluster | Agents | Purpose |
|---------|--------|---------|
| alpha | shark-alpha-1, shark-alpha-2, manta-alpha-1 | Aggressive/precision |
| beta | shark-beta-1, manta-beta-1, manta-beta-2 | Balanced/linear |
| gamma | shark-gamma-1, manta-gamma-1, manta-gamma-2 | Debug/specialized |

---

## QUICK REFERENCE COMMANDS

```bash
# Session state
cat "Shared Workspace Context/Kraken Agent/Active Context/COMPACTION SURVIVAL/03_SESSION_STATE_TRACKER.md"

# Bundle rebuild
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build && bun run build

# Verify no hardcoded paths
grep -n "/home/leviathan" /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/kraken-agent/dist/index.js

# Ship package checksums
md5sum /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/build/dist/index.js

# Wrapper path check
grep -rn "/home/leviathan" /home/leviathan/OPENCODE_WORKSPACE/SHIP_KRAKEN_V2.0/kraken-agent-source/wrappers/

# Create checkpoint
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-proper-build/.checkpoints/{name}
```

---

## LAST UPDATE

**Date:** 2026-04-14  
**Event:** Crash during pre-ship debugging  
**Interrupted:** Bundle rebuild after source path fixes  
**Next Action:** Rebuild bundle, copy to ship package, verify container runtime

---

**END OF CRASH RECOVERY AND BUILD CONTINUATION PROTOCOL**
