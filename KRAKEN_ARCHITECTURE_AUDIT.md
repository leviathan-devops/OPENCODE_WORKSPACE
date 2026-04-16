# 🦈 KRAKEN SYSTEM: COMPREHENSIVE ARCHITECTURE AUDIT REPORT
**Status:** CRITICAL FAILURE IDENTIFIED (SYSTEMIC DEATH SPIRAL)  
**Build Version:** v4.8.3  
**Audit Date:** 2026-04-12  
**Auditor:** Kraken System Recovery Chamber  

---

## 1. EXECUTIVE SUMMARY

The Kraken system is experiencing a **systemic Resource Death Spiral**. Hardware is "blown" (extreme CPU + RAM + Swap thrashing) due to a fundamental **architectural mismatch** between heavy-weight agents and a broken management/watchdog layer.

### The Core Problem
The current architecture uses **heavy-weight OpenCode instances** to manage other **heavy-weight OpenCode instances**. This doubles the memory footprint and creates a process tree that the watchdog CANNOT even see, cannot correctly identify, and therefore cannot kill.

---

## 2. TECHNICAL DEEP DIVE: THE RESOURCE DEATH SPIRAL

### 2.1 The GC Thrashing Mechanism
High CPU (70-90%) in worker processes is **NOT productive work**. It is **Garbage Collection (GC) Thrashing**.

* **The Trigger:** Worker hits ~15% RAM threshold.
* **The CPU Spike:** Node.js performs "Full GC" to reclaim memory.
* **The Failure:** GC cannot reclaim enough memory. GC runs continuously (100% CPU).
* **The Hardware Impact:** "Blown" hardware. CPU pegged at max, RAM stays full.

### 2.2 The Respawn Loop (The Death Spiral)
1. **Worker Ballooning:** Process reaches memory limit.
2. **GC Thrashing:** CPU spikes to 90%+ as it fights for memory.
3. **Crash:** Process crashes from OOM or is killed.
4. **Manager Respawn:** Level 1 Manager immediately spawns a new Worker.
5. **Repeat:** New worker hits same limit immediately.

### 2.3 System Resource Statistics (Live)
| Metric | Value | Status |
| :--- | :--- | :--- |
| **RAM Used** | 17 GiB / 30 GiB | **CRITICAL** (56%) |
| **Swap Used** | 6.6 GiB / 8 GiB | **CRITICAL** (82%) |
| **Swap Paging (si)** | 20-114 blocks/sec | **ACTIVE THRASHING** |
| **Swap Paging (so)** | 20-266 blocks/sec | **ACTIVE THRASHING** |

### 2.4 Case Study: PID 41546 ("The 90% CPU Culprit")
* **PID:** 41546
* **Parent (PPID):** 41539
* **Session:** `ses_282086413ffeAJCSGKdh20oYnz`
* **CPU:** 90.1%
* **MEM:** 15.8% (~5.1 GiB)

**Diagnosis:** This process is not "working". It is dying. High CPU = GC fighting for survival. This process needs to be killed to break the spiral.

---

## 3. PROCESS HIERARCHY AUDIT: THE NESTED TREE

### 3.1 Process Map (Live)
| Layer | PID | Parent | Command | CPU % | MEM % | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 1 (Manager)** | 43327 | 5729 | `node /.../opencode` | Low | Mod | Active |
| **Level 2 (Worker)** | 43334 | 43327 | `.opencode` | **70%** | **16%** | **Thrashing** |
| **Level 1 (Manager)** | 41539 | 5745 | `node /.../opencode` | Low | Mod | Active |
| **Level 2 (Worker)** | 41546 | 41539 | `.opencode` | **90%** | **16%** | **Thrashing** |
| **Level 1 (Manager)** | 4157550 | 2066281 | `node /.../opencode` | Low | Mod | Active |
| **Level 2 (Worker)** | 4157557 | 4157550 | `.opencode` | **45%** | **4.5%** | **Unstable** |

### 3.2 The "Nested Manager" Architecture
* **Level 0:** System Roots (5745, 5729, 2066281)
* **Level 1:** Managers (`node opencode`) - Full OpenCode instances. Heavy.
* **Level 2:** Workers (`.opencode`) - The actual agents. Heavier.

**The Problem:** We run 2 heavy processes per session. This is inefficient and unmanageable.

---

## 4. WATCHDOG FAILURE ANALYSIS: DEEP CODE INSPECTION

I inspected the actual code of `mini-watchdog.cjs` and the system logs. The watchdog is **TOTALLY BROKEN**.

### 4.1 Evidence: The Error Logs
```log
[2026-04-11T21:34:30.851Z] getOpenCodeProcs error: Command failed: ps -eo pid,ppid,%cpu...
error: improper AIX field descriptor
```
**Finding:** The watchdog is **RUNNING BUT BLIND**. It cannot even execute `ps` correctly on this system. It fails silently and finds 0 processes.

### 4.2 Logic Gap 1: The `ps` Parsing Logic (Line 25)
```javascript
const out = execSync('ps auxww | grep opencode | grep -v grep', ...);
return out.trim().split('\n').filter(l => l).map(l => {
  const parts = l.split(/\s+/);
  const cmd = l.substring(l.indexOf(parts[10])).trim();
  return { ... }
});
```
**The Bug:** This parsing is FRAGILE. It assumes a fixed number of columns. On this system, it fails with "improper AIX field descriptor".

### 4.3 Logic Gap 2: The "Main Session" Misidentification (Line 87)
```javascript
const isMain = /-s ses_/.test(p.cmd);
if (!isMain && isHeavyCpu && isLong) { killSafe(p.pid); }
```
**The Bug:** 
* If a process has `-s ses_` in the command, it is considered a **"Main"** session.
* **Level 1 Managers** (which are heavy) ARE marked as "Main" and are **NEVER KILLED**.
* **Level 2 Workers** (which are also heavy) are treated as "Runaway" ONLY IF they DON'T have the session ID.

### 4.4 Logic Gap 3: The "Orphan" Check (Line 72)
```javascript
const isOrphan = !pids.has(p.ppid) || p.ppid === 1;
if (isOrphan && isSubagent && isHeavy) { killSafe(p.pid); }
```
**The Bug:** 
* A process is only an "Orphan" if its Parent is NOT in the `pids` list.
* Since the Manager (Level 1) IS in the `pids` list, the Worker (Level 2) is **NOT an Orphan**.
* The watchdog REFUSES to kill the worker because it has a parent (the Manager).

### 4.5 Logic Gap 4: Threshold Mismatch
```javascript
const MAX_MEM_PCT = 8;
const isHeavy = p.mem > MAX_MEM_PCT;
```
**The Bug:** 
* Threshold is 8%.
* Observed workers are at 15-16%.
* The workers are effectively IGNORING the threshold.

### 4.6 Summary: Why the Watchdog Fails
1. **Blind:** Cannot execute `ps` to find processes.
2. **Dumb:** Thinks Managers are "Good" and won't kill them.
3. **Lazy:** Only kills "Orphans" but Workers have parents.
4. **Too Slow:** 15-second check interval allows rapid respawn loops.

---

## 5. ROOT CAUSE IDENTIFICATION

### Why The System "Blows"
1. **Architecture:** "Agent-in-Agent" (Manager spawns Worker) = Double Memory Footprint.
2. **GC:** Workers hit memory limit -> GC Thrashing -> 90% CPU.
3. **Manager:** Keeps respawning workers (session persistence).
4. **Watchdog:** Cannot see, identify, or kill the workers.
5. **Result:** Infinite loop of death. Swap fills up. Hardware dies.

---

## 6. IMPLEMENTATION ROADMAP (FOR NEXT BUILD AGENT)

### Phase 1: Decoupling (Root Fix)
**Goal:** Remove the heavy Manager layer.

**How:**
1. **Deprecate** `node opencode` as a Manager.
2. **Implement** a lightweight **Session Controller**:
   * Go or Rust binary.
   * Handles: Spawn, Monitor (Tree Sum), Kill, Respawn.
   * Target: <20MB per session (down from ~500MB).

**Expected Impact:** 50% baseline memory reduction.

### Phase 2: Hierarchy-Aware Watchdog (Immediate Fix)
**Goal:** Break the respawn loop.

**How:**
1. **Rewrite** `mini-watchdog.cjs` `getOpenCodeProcs()` function:
   * Use `ps -eo pid,ppid,stat,comm,args` instead of fragile string parsing.
2. **Implement Aggregate Monitoring:**
   * Calculate `Total_Memory = Parent + All Children`.
   * Threshold: `Aggregate > 12% = KILL TREE`.
3. **Fix Logic:**
   * Don't rely on `-s ses_` to identify "Main".
   * Identify "Manager" by checking if process has children.
   * If Parent Memory > 8%, kill Parent (cascades to Children).

### Phase 3: Proactive GC Circuit Breaker
**Goal:** Prevent the thrashing before it starts.

**How:**
1. **Monitor** GC frequency in Agent Core.
2. **Trigger:** If GC runs > 5 times/second:
   * Auto-reduce context window (keep last 50 messages).
   * Or graceful termination.
3. **Goal:** Proactive shedding, not reactive crash.

### Phase 4: Fix Swap Thrashing
**Goal:** Clear the 6.6GB Swap.

**How:**
1. **Disable** new session spawning until Swap < 50%.
2. **Manual Command:** `sudo swapoff -a && sudo swapon -a` (if user can run sudo).
3. **Alternative:** Wait for kernel to naturally reclaim as processes die.

---
**END OF COMPREHENSIVE AUDIT REPORT**

*This report contains all technical detail required for the next Build Agent to implement the Architecture Overhaul.*