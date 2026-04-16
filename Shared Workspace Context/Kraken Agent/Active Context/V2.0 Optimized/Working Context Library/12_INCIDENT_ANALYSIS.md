# INCIDENT ANALYSIS — V1.2/V2.0 Failures

## V1.1 Incidents (Documented in V1.2)

### INCIDENT 001: Fire-and-Forget Pattern

**Date:** 2026-04-11  
**Severity:** CRITICAL  
**Impact:** Build appeared complete but outputs trapped in containers

**What Happened:**
1. Spawned 5 parallel tasks via `spawn_shark_agent`
2. Tasks reported `success: true`
3. Did NOT call `retrieve_outputs`
4. Assumed completion = outputs merged

**Lesson Learned:**
```
FIRE-AND-FORGET IS THE ROOT FAILURE.
Task completion ≠ outputs on host filesystem.
Must explicitly retrieve and merge.
```

**V2.0 Fix:** Mechanical Output Verification with fs.existsSync() checkpoints

---

### INCIDENT 002: Single-Brain Bottleneck

**Date:** 2026-04-11  
**Severity:** HIGH  
**Impact:** Clusters sat idle while Kraken reasoned sequentially

**What Happened:**
1. One "kraken" agent trying to coordinate all 3 clusters
2. No parallel reasoning while executing
3. System Brain couldn't watch Execution Brain in real-time
4. Errors caught after-the-fact

**Lesson Learned:**
```
One brain cannot both reason AND execute simultaneously.
Planning takes 30-60s during which execution sits idle.
```

**V2.0 Fix:** Triple-brain parallel execution

---

### INCIDENT 003: Wrong Cluster Assignment

**Date:** 2026-04-11  
**Severity:** MEDIUM  
**Impact:** Task took 3x longer than needed

**What Happened:**
1. Debug task assigned to Alpha (steamroll cluster)
2. Alpha tried to "steamroll" through debugging
3. Precision task got wrong approach

**Lesson Learned:**
```
Clusters have designated domains:
Alpha = steamroll, Beta = precision, Gamma = testing
```

**V2.0 Fix:** Domain designation enforcement

---

## V2.0 Incidents (First-Hand from Shark Agent Build)

### INCIDENT 004: Unit Tests ≠ Container Tests

**Date:** 2026-04-12  
**Severity:** CRITICAL  
**Impact:** 155 patterns passed unit tests, 0/N blocked at runtime

**What Happened:**
1. Built guardian-hook.ts with 155 regex patterns
2. Unit tests showed all patterns matched correctly
3. Container tests showed NO blocking
4. Root cause: `opencode run` sends messages, agents respond naturally

**Discovery:**
```
opencode run "grep | wc" → Message to agent
    ↓
Agent says: "I'll count the lines for you"
    ↓
No terminal tool call → Guardian never fires
    ↓
155 patterns passed, 0 blocked
```

**Lesson Learned:**
```
Guardian fires at tool.execute.before hook.
opencode run sends messages, not tool calls.
Agents interpret messages and respond naturally.
Pattern matching works on strings, not on agent interpretation.
```

**V2.0 Fix:** Two-Layer Firewall (Tool + Message enforcement)

---

### INCIDENT 005: Parallel Task Outputs Trapped

**Date:** 2026-04-12  
**Severity:** HIGH  
**Impact:** Orchestrator declared success, files never merged

**What Happened:**
1. `spawn_shark_agent` tasks completed successfully
2. Tasks reported completion
3. Outputs stayed in container filesystems
4. Orchestrator assumed outputs were on host

**Lesson Learned:**
```
Task completion in container ≠ outputs on host filesystem.
Must explicitly retrieve and merge.
Orchestrator must verify outputs exist before declaring success.
```

**V2.0 Fix:** Output Checkpoint System with mechanical verification

---

### INCIDENT 006: Message Interpretation Risk

**Date:** 2026-04-12  
**Severity:** MEDIUM  
**Impact:** Override messages could be misinterpreted

**What Happened:**
1. Execution Brain sent: "ABORT - you claimed success without outputs"
2. Subagent interpreted: "User wants me to abort"
3. Subagent asked permission to abort
4. Original intent was about OUTPUTS, not abort authority

**Lesson Learned:**
```
Natural language overrides have interpretation risk.
Structured commands eliminate ambiguity.
```

**V2.0 Fix:** Structured Override Command Schema

---

### INCIDENT 007: Gate Sync Ambiguity

**Date:** 2026-04-12  
**Severity:** MEDIUM  
**Impact:** Brains didn't know when gate was "reached"

**What Happened:**
1. "All 3 brains run concurrently, sync at gates only"
2. No explicit criteria for gate advancement
3. Each brain had to guess when to sync
4. No verification of actual progress

**Lesson Learned:**
```
"Sync at gates" is ambiguous without explicit criteria.
Each brain needs specific completions + evidence requirements.
```

**V2.0 Fix:** Explicit Gate Entry Criteria per brain

---

## V2.0 Optimization Incidents

### INCIDENT 008: Context Compaction Disruption

**Date:** 2026-04-12  
**Severity:** HIGH  
**Impact:** Stream of consciousness disrupted by auto-compaction

**What Happened:**
1. Long build session with complex context
2. OpenCode auto-compacted at 85% tokens
3. Older files deleted, chat history compressed
4. After compaction: "Continue from where we were" → Missing context

**Lesson Learned:**
```
Compaction deletes context BEFORE anyone notices.
Need proactive export before compaction hits.
Need injection file to restore stream of consciousness.
```

**V2.0 Fix:** Four-Tier Compaction Management System

---

## Pattern: Fire-and-Forget Is The Root Failure

Across all incidents, the common thread:

```
WRONG: spawn → success:true → MOVE ON → LOST OUTPUTS
RIGHT: spawn → track → retrieve → verify → MERGE
```

**Why It Happens:**
1. Subagents report success optimistically
2. No mechanical verification of actual state
3. Orchestrator trusts the report
4. Move on before verification

**V2.0 Enforcement:**
```typescript
// Every completion claim requires:
1. OutputCheckpoint[] — declared outputs
2. fs.existsSync() — each output exists on host
3. verified: true — marked by OutputVerifier
4. canComplete() — ALL checkpoints verified
```

---

## Anti-Patterns to Block

### Fire-and-Forget Variants

| Pattern | Description | Block |
|---------|-------------|-------|
| Spawn and move on | Task spawned, success assumed | L1 |
| Output not retrieved | Claims complete, no files | L2 |
| Trust without verify | "looks fine" | L2 |
| Skip evidence | "no need for that" | L5.2 |
| Partial retrieval | Some outputs, not all | L2 |
| Container-only | Files in container, not host | L3 |

---

## V2.0 Improvements Summary

| Incident | V1.2 | V2.0 |
|----------|-------|-------|
| Fire-and-forget | Trust-based | Mechanical checkpoints |
| Unit ≠ Container | Tool-only firewall | Two-layer firewall |
| Outputs trapped | No retrieval tracking | OutputCheckpoint system |
| Override ambiguity | Natural language | Structured schema |
| Gate sync | Implicit | Explicit criteria |
| Compaction loss | No protection | Four-tier system |

---

*End of Incident Analysis*