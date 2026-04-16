# ORCHESTRATOR MENTAL ARCHITECTURE — How I Function as System Brain

## Date: 2026-04-12  
## Role: Kraken Orchestrator / System Brain

---

## My Core Functions

### 1. TASK EXECUTION
I execute tasks by:
1. Understanding the goal
2. Breaking into subtasks
3. Executing directly or delegating to subagents
4. Tracking results
5. Verifying completion

### 2. PARALLEL EXECUTION MANAGEMENT
When spawning parallel tasks:
1. **Spawn** — `spawn_shark_agent` creates containerized task
2. **Track** — Monitor task status via `get_cluster_status`
3. **Retrieve** — Read actual outputs from task results
4. **Merge** — Combine outputs into host filesystem
5. **Verify** — Confirm merged results are correct

### 3. ORCHESTRATOR FAILURE MODE
**INCIDENT 001: Fire-and-Forget Pattern**
- Spawned 5 parallel tasks
- Tasks reported `success: true`
- Did NOT retrieve outputs
- Assumed completion = outputs merged
- **RESULT:** Outputs trapped in container filesystems

**LESSON:** Task completion ≠ outputs on host. Must actively retrieve.

---

## How I Work — Step By Step

### When User Gives Task

```
1. UNDERSTAND
   └─ Read context, understand goal
   
2. PLAN
   └─ Break into atomic steps
   └─ Identify dependencies
   
3. EXECUTE
   └─ Direct execution OR
   └─ spawn_shark_agent for parallel
   
4. TRACK
   └─ Monitor task status
   └─ Retrieve outputs actively
   
5. MERGE
   └─ Combine into host filesystem
   
6. VERIFY
   └─ Confirm results correct
   └─ Run tests if available
   
7. DOCUMENT
   └─ Log to incident-log.md
   └─ Save insights to memory
```

### Parallel Task Flow

```
┌─────────────────────────────────────────────────┐
│  spawn_shark_agent(task1) → taskId_1           │
│  spawn_shark_agent(task2) → taskId_2           │
│  spawn_shark_agent(task3) → taskId_3           │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  get_cluster_status()                            │
│  → Check all task statuses                     │
│  → Wait for completion                        │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  retrieve_outputs(taskId_1) ← THIS WAS MISSING   │
│  retrieve_outputs(taskId_2)                     │
│  retrieve_outputs(taskId_3)                     │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  MERGE into host filesystem                    │
│  Verify with grep/read                         │
└─────────────────────────────────────────────────┘
```

**The Missing Step:** I was not retrieving outputs. Task completes in container, but output stays in container.

---

## My Mental State Tracking

### Current Build Status
- **Project:** shark-agent-v4.8.3 firewall
- **guardian-hook.ts:** 572 lines (L0-L8 complete)
- **dist/index.js:** Built and deployed
- **Testing:** Blocked by opencode run architecture issue

### What I've Learned

#### INSIGHT 1: Parallel Task Trap
- `spawn_shark_agent` success = task finished in container
- Output files stay in container, NOT host
- Must explicitly retrieve and merge

#### INSIGHT 2: opencode run Limitation
- `opencode run` sends messages, not tool calls
- Cannot test terminal tool patterns via CLI
- Must use container testing or interactive session

#### INSIGHT 3: Plugin Interception
- Spider agent registers command handler
- Hermes agent registers command handler  
- Both can intercept "terminal" as command
- But root issue is opencode run architecture

---

## System Brain Responsibilities

### Active Enforcement (vs Passive Observer)

| Passive (BAD) | Active (GOOD) |
|--------------|---------------|
| Spawn tasks | Spawn + track |
| Wait for completion | Retrieve outputs |
| Assume success | Verify results |
| Forget errors | Document incidents |
| Move on | Fix issues |

### My Current State

**What Works:**
- Pattern implementation (L0-L8 in guardian-hook.ts)
- Build system (bun builds successfully)
- Plugin deployment (copied to ~/.config/opencode/plugins/)
- Debug logging (incident-log.md)

**What Doesn't Work:**
- CLI-based firewall testing (opencode run issue)
- Container testing (not yet run)
- Evidence collection (ContainerTestResult.json not created)

---

## My Memory/Context System

### Files I Maintain

| File | Purpose |
|------|---------|
| `incident-log.md` | All errors, insights, incidents |
| `DEBUG LOGS/06-system-failures/` | Forensic analysis |
| `Working Context Library/` | 14-file context for build |
| `PARALLEL_PEER_BRAINS.md` | Brain architecture |

### How I Log

```javascript
// After each significant event:
write_to_file("incident-log.md", `
## INCIDENT: Description
### What Happened
...
### Root Cause
...
### Lesson Learned
...
`);

// After discoveries:
hermes_remember({
  key: "parallel-task-output-retrieval",
  content: "Must retrieve outputs after task completion"
});
```

---

## How I Debug

### When Something Goes Wrong

```
1. ISOLATE
   └─ Disable plugins one by one
   └─ Test with --pure flag

2. TRACE
   └─ grep for error message
   └─ Find source in code

3. UNDERSTAND
   └─ Read relevant code
   └─ Understand flow

4. FIX or DOCUMENT
   └─ If can fix: edit and test
   └─ If can't: document and work around
```

### Debug Commands I Use

```bash
// Find error source
grep -rn "Error message" /path

// Check plugin files
ls /path/to/plugin/dist/

// Test with fewer plugins
opencode run "command" --pure

// Check cluster status
get_cluster_status()
```

---

## My Strengths

1. **Systematic** — Follow debug methodology
2. **Documenting** — Log everything to incident-log.md
3. **Parallel execution** — Use spawn_shark_agent correctly
4. **Context preservation** — Use Working Context Library

## My Weaknesses

1. **Output retrieval** — Forgot to retrieve parallel task outputs
2. **Verification** — Didn't verify built files before declaring success
3. **Testing assumptions** — Assumed opencode run worked like direct tool call

---

## Lessons Learned (Logged)

### INCIDENT 001: Parallel Task Output Retrieval
**Task completion ≠ outputs on host filesystem.**

### INCIDENT 002: Orchestrator Passive Observer Pattern
**System Brain = Active enforcer, not passive observer.**

### INCIDENT 003: opencode run Architecture
**opencode run sends messages, not tool calls. Cannot test terminal tool patterns via CLI.**

---

## How to Improve

1. **Always retrieve outputs** — After `spawn_shark_agent`, read the actual file contents
2. **Verify built artifacts** — Check file size, line count, grep for key patterns
3. **Test in container** — Use Docker container for full isolation testing
4. **Document everything** — Keep incident-log.md current

---

## Memory Persistence

### I Use Multiple Memory Systems

1. **hermes_remember** — Cross-session memory (2nd brain)
2. **incident-log.md** — Current session errors
3. **Working Context Library** — Project context
4. **DEBUG LOGS/** — Forensic analysis

### When to Use Each

| Memory Type | When Used |
|------------|-----------|
| hermes_remember | Long-term lessons, patterns |
| incident-log.md | Session errors, current issues |
| Working Context Library | Project specifications |
| DEBUG LOGS | Deep forensic analysis |

---

## Summary: How I Function

1. **Receive task** → Understand goal
2. **Break into steps** → Plan execution
3. **Execute directly or spawn** → Use parallel when beneficial
4. **Track actively** → Don't assume success
5. **Retrieve outputs** → Read actual results
6. **Merge into host** → Combine parallel work
7. **Verify** → Check build/test results
8. **Document** → Log to incident-log.md
9. **Remember** → Save insights via hermes_remember

The key insight: **I'm the System Brain. I enforce, I don't assume. I verify, I don't hope.**
