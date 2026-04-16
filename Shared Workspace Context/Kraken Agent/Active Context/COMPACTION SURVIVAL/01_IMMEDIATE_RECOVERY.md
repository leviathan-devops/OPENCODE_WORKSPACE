# IMMEDIATE RECOVERY PROCEDURE

**FOR EMERGENCY USE AFTER COMPACTION**

---

## STEP 1: STOP AND ASSESS

You just experienced a context compaction. Your context has been compressed. DO NOT continue working until you have restored context.

---

## STEP 2: READ THIS FIRST

Read the full knowledge base: `00_COMPACTION_PROOF_KNOWLEDGE_BASE.md`

---

## STEP 3: CHECK WHAT'S MISSING

Common things lost in compaction:
- Recent chat history (older messages)
- File contents that were in context
- Recent tool outputs

Common things PRESERVED:
- Files on disk (NOT in context)
- Project directories
- Dist files

---

## STEP 4: RESTORE CRITICAL CONTEXT

### Architecture Overview
Kraken V2.0 is a triple-brain orchestrator:
- **Planning Brain**: Owns planning-state, context-bridge
- **Execution Brain**: Owns execution-state, quality-state
- **System Brain**: Owns workflow-state, security-state, DYNAMIC CONTEXT MANAGEMENT

### The ONE RULE
**IF IT'S NOT REAL, IT'S NOT DONE.**

Every function must do what it says. Every tool must execute for real. No theatrical placeholders.

---

## STEP 5: RESTORE PROJECT STATE

### Current Project
```
/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/
```

### What Exists
- `src/clusters/ClusterInstance.ts` - HTTP-based execution (REAL)
- `subagent-manager/wrappers/kraken-agent-wrapper.py` - HTTP daemon wrapper
- `dist/index.js` = 199 KB
- `shark-agent/dist` = 569 KB
- `manta-agent/dist` = 158 KB
- **Total ~926 KB** (proper bundle, not hollow)

### Wrapper Daemon
```bash
# Start wrapper daemon
nohup python3 /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/subagent-manager/wrappers/kraken-agent-wrapper.py > /tmp/kraken-wrapper.log 2>&1 &

# Check health
curl http://localhost:18086/health
```

---

## STEP 6: IDENTIFY WHERE YOU WERE

Check these files for context on what was happening:
1. `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/ACTIVE_BUILD_CONTEXT.md`
2. `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/13-kraken-catastrophic-failure-20260413_005709/CATASTROPHIC_FAILURE_REPORT.md`

---

## STEP 7: RESUME WORK

Document where you stopped, then continue.

**REMEMBER:**
- Real Docker container spawning (not simulation)
- Python3 NOT in opencode container (use HTTP wrapper)
- OpenCode auto-compacts at 85% - export at 75%
- Stream of consciousness is sacred

---

## CURRENT ISSUE BEING WORKED ON

**Wrapper daemon execute endpoint returns success: false**

The HTTP daemon wrapper starts fine and health checks work, but the `/execute` endpoint returns `success: false`.

**Debug:**
```bash
# View wrapper logs
tail -f /tmp/kraken-wrapper.log

# Test manually
curl -X POST http://localhost:18086/execute -H "Content-Type: application/json" -d '{"task": "echo hello", "model": "qwen", "timeout": 30}'
```

---

**END OF IMMEDIATE RECOVERY**