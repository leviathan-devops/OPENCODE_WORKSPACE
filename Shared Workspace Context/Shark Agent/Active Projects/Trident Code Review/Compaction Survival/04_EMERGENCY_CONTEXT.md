# TRIDENT BRAIN v3.2 — EMERGENCY CONTEXT

**Date:** 2026-04-16T03:15 UTC
**Trigger:** Mid-testing phase, potential compaction risk

---

## IF COMPACTED - READ THIS FIRST

This is the emergency context. If you resume after compaction, read:
1. `00_COMPACTION_PROOF_KNOWLEDGE_BASE.md`
2. This file
3. `03_SESSION_STATE_TRACKER.md`

---

## RECOVERY PROCEDURE

### Step 1: Verify Plugin Deployment
```bash
ls -la ~/.config/opencode/plugins/trident-brain/
# Should show: index.js, algorithmic-core.js, artifact-writer.js
```

### Step 2: Run TUI Test
```bash
# Create FRESH container (DO NOT use other project containers)
docker stop trident-v32-test 2>/dev/null; docker rm trident-v32-test 2>/dev/null
docker run -dit --name trident-v32-test --entrypoint /bin/sh -v /home/leviathan:/home/leviathan leviathan/opencode:python3-enabled-1.4.3 -c "while true; do sleep 3600; done"

# Deploy plugin to container
docker exec trident-v32-test /bin/sh -c "mkdir -p ~/.config/opencode/plugins/trident-brain"
docker exec trident-v32-test /bin/sh -c "cp -r /home/leviathan/.config/opencode/plugins/trident-brain/* ~/.config/opencode/plugins/trident-brain/"

# Test artifact file writing
docker exec trident-v32-test /bin/sh -c "cd /home/leviathan/OPENCODE_WORKSPACE/projects/calculator && opencode"
```

### Step 3: In TUI, Run Audit
```
> audit /home/leviathan/OPENCODE_WORKSPACE/projects/calculator
```

### Step 4: Verify File Created
After audit completes, check for file:
```
ls -la /home/leviathan/OPENCODE_WORKSPACE/projects/TRIDENT_CODE_REVIEW_CALCULATOR_2026-04-16.md
```

---

## LAST KNOWN GOOD STATE

### What Was Working
- Mechanical tests: ALL PASSED
- Plugin builds: CLEAN
- Artifact generation: FIXED (was broken, now writes to disk)

### What Was Being Verified
- Artifact file is actually created on disk
- File contains 3-layer WHY/HOW structure
- Filepath shown in response

---

## DECISION POINT

**Decision:** User reported artifact not being created/disk
**Fix applied:** Added `fs.writeFileSync(artifactPath, artifactContent, 'utf-8')`
**Verification needed:** Run TUI test to confirm fix works

---

## API KEYS

**Google Gemma:** `<REDACTED_SET_VIA_ENV>`

---

## CONTEXT FILES

| File | Purpose |
|------|---------|
| `00_COMPACTION_PROOF_KNOWLEDGE_BASE.md` | Project overview, rules |
| `01_PROJECT_ANCHORS.md` | File tree, architecture |
| `02_CURRENT_STATE.md` | Last session state |
| `03_SESSION_STATE_TRACKER.md` | Stream of consciousness |
| `05_KNOWLEDGE_LIBRARY.md` | API keys, testing patterns |

---

## END OF EMERGENCY CONTEXT