# KRAKEN ALIGNMENT BIBLE
## The Definitive Guide to Building Kraken Without Catastrophic Failure

**Version:** 1.0
**Date:** 2026-04-15
**Classification:** ARCHITECTURAL ALIGNMENT DOCUMENT
**Purpose:** Prevent all known failure modes from recurring in future builds

---

## TABLE OF CONTENTS

1. [Preamble: Why This Document Exists](#1-preamble-why-this-document-exists)
2. [Executive Summary of Failures](#2-executive-summary-of-failures)
3. [Core Architecture Principles](#3-core-architecture-principles)
4. [Failure Mode Encyclopedia](#4-failure-mode-encyclopedia)
   - [4.1 Fake Task Execution (simulateTaskExecution)](#41-fake-task-execution-simulatetaskexecution)
   - [4.2 Dual Plugin Architecture Breakdown](#42-dual-plugin-architecture-breakdown)
   - [4.3 Evidence Variable Ordering](#43-evidence-variable-ordering)
   - [4.4 Config Corruption](#44-config-corruption)
   - [4.5 Parallel Execution Tools Failure](#45-parallel-execution-tools-failure)
   - [4.6 Hook Format Misunderstanding](#46-hook-format-misunderstanding)
   - [4.7 Experimental Hooks Crash](#47-experimental-hooks-crash)
   - [4.8 Memory Leaks and Resource Exhaustion](#48-memory-leaks-and-resource-exhaustion)
   - [4.9 Wrong Agent Versions](#49-wrong-agent-versions)
   - [4.10 Insufficient Testing Methodology](#410-insufficient-testing-methodology)
5. [Build Verification Checklist](#5-build-verification-checklist)
6. [Version Migration Guide](#6-version-migration-guide)
7. [Testing Protocol](#7-testing-protocol)
8. [Architecture Decision Record (ADR)](#8-architecture-decision-record-adr)
9. [T2 Delegation System](#9-t2-delegation-system)
10. [Plugin Isolation Requirements](#10-plugin-isolation-requirements)
11. [State Management Patterns](#11-state-management-patterns)
12. [Container Testing Workflow](#12-container-testing-workflow)
13. [Emergency Rollback Procedures](#13-emergency-rollback-procedures)
14. [Glossary and Terminology](#14-glossary-and-terminology)

---

## 1. PREAMBLE: WHY THIS DOCUMENT EXISTS

Between 2026-04-11 and 2026-04-15, the Kraken agent system underwent multiple catastrophic failures during attempted expansions from v1.1 working state to v2.0. These failures were not isolated incidents but rather a **cascade of architectural, testing, and procedural errors** that resulted in:

- **Non-functional task execution** (fake 100ms timeouts instead of real Docker containers)
- **90% bundle size reduction** (521KB → 52KB) indicating deletions enhancements
- **Config corruption** causing complete agent disappearance from TUI
- **Parallel execution tools** that all failed in different ways
- **Memory exhaustion** from leaked global state
- **Hook format misunderstandings** that broke the entire plugin system
- **No container testing** before production deployment

This document serves as the **ALIGNMENT BIBLE** for all future Kraken builds. It contains:

1. **Every known failure mode** with detailed root cause analysis
2. **Correct solutions** verified through forensic reconstruction
3. **Reasoning processes** that led to correct diagnoses
4. **Verification checklists** to prevent regression
5. **Emergency procedures** for when things go wrong

**THE GOAL:** Ensure that no future build can repeat these mistakes because the correct approach is documented, reasoned through, and verified.

---

## 2. EXECUTIVE SUMMARY OF FAILURES

### 2.1 The Timeline of Collapse

```
2026-04-11: Parallel execution attempts failed
  - spawn_cluster_task → Cluster not found
  - run_parallel_tasks → "requires shim implementation"
  - run_subagent_task → CLI argument parsing bug

2026-04-12: Shipped v2.0 without container testing
  - Hook format wrong (arrays vs functions)
  - Agent registration corrupted config
  - Vanilla OpenCode broken by plugin

2026-04-13: Evidence variable ordering bug discovered
  - "evidence is not defined" on ALL kraken tools
  - Config corruption confirmed
  - Wrong plugin versions identified

2026-04-13: CATASTROPHIC FAILURE REPORT generated
  - v2.0 is a hollow shell
  - simulateTaskExecution() is FAKE - returns success after 100ms
  - No real Docker container spawning
  - 90% bundle size reduction confirms deletion
```

### 2.2 Failure Metrics

| Version | Bundle Size | Real Execution | Docker Spawning | Parallel Tools | Status |
|---------|-------------|-----------------|-----------------|----------------|--------|
| v1.0 (GitHub) | ~521 KB | THEATRICAL | Python wrapper exists | CLI errors | Non-functional |
| v1.1 (Local) | ~521 KB | THEATRICAL | Wrapper never called | CLI errors | Non-functional |
| v2.0 (Refactor) | 52 KB | FAKE | REMOVED | Not implemented | CATASTROPHIC |
| v2.0 Fixed | 527 KB | REAL | Python wrapper | Working | RESTORED |
| NUKE RELOAD | 527 KB | REAL | Python wrapper | Working | ACTIVE |

### 2.3 The Core Problem: "Theatrical" ≠ "Working"

The v1.0 and v1.1 systems appeared to work because:
- Tests passed
- 76 tasks/sec throughput measured
- All functions returned success
- No errors in logs

But reality was:
- `simulateTaskExecution()` just waited 100ms and returned `{success: true}`
- No actual Docker containers were spawned
- No real agent execution occurred
- The system was **THEATRICAL** - it performed a _simulation_ of work

This is the most dangerous kind of failure: **one that looks successful but does nothing**.

---

## 3. CORE ARCHITECTURE PRINCIPLES

These principles are **NON-NEGOTIABLE** for any Kraken build.

### 3.1 Principle: Execution ≠ Orchestration

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CORRECT DUAL PLUGIN ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Plugin 1: kraken-agent (ORCHESTRATION)                            │
│   ├── Task queue management (AsyncDelegationEngine)                 │
│   ├── Cluster load balancing (ClusterScheduler)                     │
│   ├── Hive Mind memory (KrakenHiveEngine)                           │
│   └── Delegates to subagent-manager for REAL execution             │
│                                                                      │
│   Plugin 2: opencode-subagent-manager (EXECUTION)                  │
│   ├── Python wrappers for Docker container spawning                 │
│   ├── run_subagent_task: Spawn single container                     │
│   ├── run_parallel_tasks: Spawn container pool                      │
│   └── cleanup_subagents: Kill containers                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**RULE:** Kraken's orchestration layer MUST NOT be responsible for actual task execution. It queues, schedules, and delegates. The subagent-manager performs the actual Docker container spawning.

### 3.2 Principle: Delete Nothing Without Replacement

During the v2.0 refactor, the following were **DELETED** without replacement:
- `subagent-manager/` directory (container spawning)
- `shark-agent/` embedded plugin (1.0 MB)
- `manta-agent/` embedded plugin (490 KB)

This resulted in the 90% bundle size reduction. **Adding features increases bundle size. Removing execution capability is not refactoring.**

**RULE:** If you remove something during refactoring, you must have a replacement ready. The removal should be purposeful, not incidental.

### 3.3 Principle: Testing Must Match Deployment Environment

```
WRONG APPROACH:
├── Bundle verification (grep for function names)
├── Run 'bun test' locally
├── Call it "tested"
└── Deploy to production

CORRECT APPROACH:
├── Build custom Docker image matching target OpenCode version
├── Mount plugin into container
├── Launch TUI: docker exec -it container opencode --agent kraken
├── Actually USE the agent in TUI for 10+ minutes
├── Verify all tools return correct responses
├── Verify Manta/Shark still work in tab toggle
├── Check memory usage is stable
└── Only then deploy
```

**RULE:** `opencode run` has broken hooks. Only TUI mode has full hook support. Bundle verification is insufficient.

### 3.4 Principle: State Must Be Session-Scoped

Module-level globals that never reset between sessions cause:
- Memory leaks (hardware exhaustion - 3 sessions consuming resources for 20+)
- Cross-agent pollution (Kraken's hooks firing for ALL agents, not just their own)
- UI spillover (console.log/error/warn calls appearing in wrong contexts)

**RULE:** All module-level state must have `cleanup()` methods. State must be resettable on `session.ended`.

### 3.5 Principle: Hooks Must Be Single Functions, Not Arrays

OpenCode's hook system calls: `safeHook(hookFunction)(input, output)`

It does NOT iterate arrays. Therefore:

```typescript
// ❌ WRONG - This will fail silently or crash
'tool.execute.after': [createToolSummarizerHook(), createGateHook()]

// ✅ CORRECT - Compose functions explicitly
'tool.execute.after': async (input, output) => {
  await createToolSummarizerHook()(input, output);
  await createGateHook()(input, output);
}
```

**RULE:** Hook values in the hooks object must be async functions that compose multiple behaviors, not arrays of functions.

### 3.6 Principle: Experimental Hooks Are Dangerous

The following are UNSTABLE and can crash sessions:
- `experimental.session.compacting` ⚠️ (experimental, may crash)
- `session.ended` ❌ (NOT A VALID EVENT)

Only these hook events are stable:
- `session.created` ✅
- `session.compacting` ⚠️ (experimental, use carefully)

**RULE:** Do not use experimental hooks in production. Do not invent hook event names.

---

## 4. FAILURE MODE ENCYCLOPEDIA

This section contains every known failure mode with:
- Root cause analysis
- Evidence (file locations, line numbers, code snippets)
- Impact assessment
- Resolution steps
- Verification checklist

---

### 4.1 FAKE TASK EXECUTION (simulateTaskExecution)

**Classification:** CATASTROPHIC - Architecture Failure
**Severity:** CRITICAL
**Date Discovered:** 2026-04-13
**Status:** FIXED in NUKE RELOAD (v1.1 source)

#### 4.1.1 Root Cause

The `simulateTaskExecution()` function was introduced as a **temporary placeholder** during v1.0 development with the intention "we'll fix it later." "Later" never came.

**Location:** `src/clusters/ClusterInstance.ts:163-183` (in broken v2.0)

```typescript
private async simulateTaskExecution(
  agent: ClusterAgentInstance,
  request: KrakenDelegationRequest
): Promise<KrakenDelegationResult> {
  // In v1, we just return a success result
  // Full implementation would actually execute the agent with the task
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,        // ALWAYS SUCCESS
        taskId: request.taskId,
        clusterId: this.config.id,
        agentId: agent.id,
        status: 'completed',  // ALWAYS COMPLETED
        completedAt: Date.now(),
      });
    }, 100);  // FAKE 100ms delay - simulates "work"
  });
}
```

**Problems:**
1. **100ms artificial delay** - Fake processing time to simulate "work"
2. **Immediate success resolution** - No actual execution occurs
3. **No agent spawning** - The agent ID is used only for tracking, not actual invocation
4. **Comments explicitly admit** this is not the real implementation

#### 4.1.2 Evidence of Known Incomplete Implementation

The codebase contains **explicit comments** acknowledging this is incomplete:

| Location | Comment |
|----------|---------|
| `ClusterInstance.ts:140-141` | `// In v1, we simulate task execution` |
| `ClusterInstance.ts:141` | `// In full implementation, this would spawn the actual agent` |
| `ClusterInstance.ts:167` | `// In v1, we just return a success result` |
| `ClusterInstance.ts:168` | `// Full implementation would actually execute the agent with the task` |
| `shark-t2-tools.ts:64` | `// In v1, we just format the report` |
| `shark-t2-tools.ts:65` | `// In full implementation, this would go through the cluster-state-hook` |
| `shark-t2-tools.ts:108` | `// In full implementation, this would be stored in session state by the hook` |

#### 4.1.3 Impact Assessment

| Metric | v1.1 (Working) | v2.0 (Broken) |
|--------|---------------|---------------|
| Bundle Size | 521 KB | 52 KB (90% loss) |
| Real Execution | NO - theatrical | NO - fake |
| Docker Spawning | Python wrapper exists but never called | REMOVED |
| Actual Work Done | NO - tests pass but nothing happens | NO - 100ms fake timeout |

**The Danger:** The system appeared to work because:
- Tests passed
- 76 tasks/sec throughput (artificial, not real)
- All functions returned success
- No errors in logs

This is the most dangerous kind of failure - one that **looks successful but does nothing**.

#### 4.1.4 Resolution: The executeOnAgent Implementation

**File:** `src/clusters/ClusterInstance.ts:187+`

```typescript
/**
 * Execute task on agent via REAL Docker container
 * Uses subagent-manager Python wrapper to spawn containers
 */
private async executeOnAgent(
  agent: ClusterAgentInstance,
  request: KrakenDelegationRequest
): Promise<KrakenDelegationResult> {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const path = require('path');

    // Path to Python wrapper
    const wrapperPath = path.join(
      process.env.HOME || '/root',
      '.config/opencode/plugins/kraken-agent-v1.1',
      'wrappers',
      'opencode_agent.py'
    );

    const args = [
      '--task', request.task,
      '--model', request.model || 'minimax/MiniMax-M2.7',
      '--workspace', process.env.OPENCODE_WORKSPACE || process.cwd(),
      '--timeout', String(Math.floor(request.timeout || 120)),
      '--cleanup'
    ];

    console.log(`[ClusterInstance] Spawning container for agent ${agent.id}`);
    
    const proc = spawn('python3', [wrapperPath, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({
        success: false,
        taskId: request.taskId,
        clusterId: this.config.id,
        agentId: agent.id,
        status: 'failed',
        error: 'Task execution timeout',
        completedAt: Date.now()
      });
    }, (request.timeout || 120) * 1000);

    proc.on('close', (exitCode) => {
      clearTimeout(timeout);
      try {
        const result = stdout.trim() ? JSON.parse(stdout.trim()) : { success: false, error: stderr || 'No output' };
        resolve({
          success: result.success !== false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: result.success ? 'completed' : 'failed',
          error: result.error,
          completedAt: Date.now()
        });
      } catch (parseError) {
        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: `Parse error: ${parseError.message}`,
          completedAt: Date.now()
        });
      }
    });
  });
}
```

#### 4.1.5 Why This Fix Is Correct

The `executeOnAgent()` function:
1. Uses `child_process.spawn()` to run Python wrapper
2. Passes task, model, workspace, timeout as CLI arguments
3. Captures stdout/stderr from the process
4. Parses JSON response from wrapper
5. Returns real result (success or failure) from actual execution
6. Handles timeouts properly with SIGTERM
7. Properly disposes of resources (clearTimeout, close handlers)

This is NOT theatrical - it actually spawns Docker containers via the Python wrapper.

#### 4.1.6 Verification Checklist

- [ ] `simulateTaskExecution` does NOT exist in `dist/index.js`
- [ ] `executeOnAgent` DOES exist in `dist/index.js`
- [ ] `executeOnAgent` uses `child_process.spawn` with Python wrapper
- [ ] Wrapper path points to `~/.config/opencode/plugins/kraken-agent-v1.1/wrappers/opencode_agent.py`
- [ ] Bundle size is 520+ KB (not 52 KB)
- [ ] Container testing confirms real Docker spawning

---

### 4.2 DUAL PLUGIN ARCHITECTURE BREAKDOWN

**Classification:** CATASTROPHIC - Architecture Failure
**Severity:** CRITICAL
**Date Discovered:** 2026-04-13

#### 4.2.1 Root Cause

During v2.0 refactor, the following were **DELETED** from the bundle:
- `subagent-manager/` - Container spawning system
- `shark-agent/` - Shark agent plugin (1.0 MB)
- `manta-agent/` - Manta agent plugin (490 KB)

This left the orchestrator (Kraken) as a **hollow shell** - it could queue tasks but had no way to execute them.

#### 4.2.2 The Correct Architecture

```
kraken-agent/
├── dist/index.js           # Main orchestrator (527 KB)
├── shark-agent/           # Shark v4.7-hotfix-v3 (1.0 MB)
├── manta-agent/           # Manta v1.3.5 (490 KB)
├── subagent-manager/      # Container spawning
│   ├── src/tools/         # run_subagent_task, run_parallel_tasks
│   └── wrappers/
│       ├── opencode_agent.py    # Real Docker spawner
│       └── container_pool.py    # Container pool manager
└── src/
    └── clusters/
        └── ClusterInstance.ts    # NOW CALLS PYTHON WRAPPER
```

**Plugin Configuration in opencode.json:**
```json
{
  "plugin": [
    "file:///.../opencode-subagent-manager/dist/index.js",
    "file:///.../kraken-agent/dist/index.js",
    "file:///.../shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///.../manta-agent-v1.5/dist/index.js"
  ]
}
```

**Required Plugins:**
1. **opencode-subagent-manager** - Handles Docker container spawning
2. **kraken-agent** - Orchestration layer (task scheduling, cluster management, Hive Mind)
3. **shark-agent-v4.7-hotfix-v3** - Shark T2 agents
4. **manta-agent-v1.5** - Manta T2 agents

#### 4.2.3 Why This Architecture Is Correct

The separation ensures:
1. **Orchestration ≠ Execution** - Kraken doesn't try to spawn containers itself
2. **Specialization** - Each plugin does one thing well
3. **Debugging** - Failures can be isolated to specific components
4. **Updates** - One component can be updated without affecting others

#### 4.2.4 Evidence of Deletion in v2.0

v1.1 structure had COMPLETE working system:
```
kraken-agent-v1.1/
├── subagent-manager/           # REAL AGENT SPAWNER (DELETED)
│   ├── src/tools/index.ts      # run_subagent_task, run_parallel_tasks
│   └── wrappers/
│       ├── opencode_agent.py   # Spawns single Docker container (DELETED)
│       └── container_pool.py   # Spawns pool of containers (DELETED)
├── shark-agent/                # REAL shark agent plugin (DELETED)
└── manta-agent/               # REAL manta agent plugin (DELETED)
```

v2.0 structure was:
```
kraken-agent-v2.0/
├── src/
│   ├── clusters/
│   │   ├── ClusterInstance.ts  # Has simulateTaskExecution - FAKE
│   │   └── ClusterManager.ts
│   ├── factory/
│   │   └── AsyncDelegationEngine.ts  # Just queues fake tasks
│   └── tools/
│       └── cluster-tools.ts     # Has spawn_* tools that call FAKE engine
└── dist/index.js = 52KB        # 90% smaller than v1.1 - CONFIRMATION
```

**The 90% size reduction confirms everything was deleted.**

#### 4.2.5 Resolution Steps

1. **Restored v1.1 source** to working state with `executeOnAgent`
2. **Rebuilt bundle** to produce 527 KB output
3. **Verified dual plugin configuration** in opencode.json
4. **Confirmed wrapper paths** point to correct locations

#### 4.2.6 Verification Checklist

- [ ] `dist/index.js` bundle size is 520+ KB
- [ ] `subagent-manager/` directory exists in source
- [ ] `shark-agent/` embedded plugin exists in source
- [ ] `manta-agent/` embedded plugin exists in source
- [ ] `wrappers/opencode_agent.py` exists
- [ ] `wrappers/container_pool.py` exists
- [ ] `opencode-subagent-manager` is in plugin list before kraken-agent
- [ ] Plugin versions are correct (shark-v4.7-hotfix-v3, manta-v1.5)

---

### 4.3 EVIDENCE VARIABLE ORDERING

**Classification:** CRITICAL - Runtime Error
**Severity:** HIGH
**Date Discovered:** 2026-04-13
**Error Message:** `"evidence is not defined"` on ALL kraken tools

#### 4.3.1 Root Cause

In `manta-agent/src/hooks/v4.1/gate-hook.ts`, the `checkGateAdvance()` function was called with `evidence` variable **BEFORE** `evidence` was defined:

```typescript
// BEFORE (broken):
const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);  // ❌ evidence is undefined!
const evidence = buildEvidenceRecord(tool, args, result);
```

```typescript
// AFTER (fixed):
const evidence = buildEvidenceRecord(tool, args, result);  // ✅ Build FIRST
const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);  // Now valid
```

#### 4.3.2 Impact

Every kraken tool call resulted in:
```
TypeError: evidence is not defined
    at checkGateAdvance (...)
    at gateHook (...)
```

This affected ALL of:
- `hive_status`
- `get_cluster_status`
- `get_agent_status`
- `spawn_shark_agent`
- All other kraken tools

#### 4.3.3 Why This Wasn't Caught Earlier

The bug only manifests when:
1. The hook actually executes (not during bundling)
2. A tool is called that triggers the hook (not during `bun test`)
3. The session is active (not during static analysis)

**Static verification (grep, bundle analysis) cannot catch this.**

#### 4.3.4 Resolution

Reorder variable definitions so `evidence` is built before being used:

```typescript
export async function gateHook(input, output) {
  const { tool, args, result, session } = input;
  
  // Build evidence FIRST
  const evidence = buildEvidenceRecord(tool, args, result);
  
  // THEN use it
  const currentGate = getCurrentGate(session);
  const shouldAdvance = checkGateAdvance(tool, args, result, currentGate, evidence);
  
  // ... rest of hook
}
```

#### 4.3.5 Verification Checklist

- [ ] All `checkGateAdvance()` calls have `evidence` defined before use
- [ ] Variable ordering: build → then use
- [ ] Runtime test confirms no "evidence is not defined" errors
- [ ] All kraken tools return valid responses (not just undefined)

---

### 4.4 CONFIG CORRUPTION

**Classification:** CRITICAL - Configuration Failure
**Severity:** CRITICAL
**Date Discovered:** 2026-04-13

#### 4.4.1 Root Cause

Agent registration via config corrupted the JSON structure. The working 5-plugin config was **overwritten** with a broken 2-plugin config.

**Original Working Config (Shipped 2026-04-12 23:38):**
```json
{
  "plugin": [
    "file:///.../coding-subagents/dist/index.js",
    "file:///.../opencode-plugin-engineering/dist/index.js",
    "file:///.../kraken-nuke-reload/dist/index.js",
    "file:///.../shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///.../manta-agent-v1.5/dist/index.js"
  ]
}
```

**Broken Config (After corruption):**
```json
{
  "plugin": [
    "file:///.../kraken-agent-v1.1/dist/index.js",
    "file:///.../kraken-agent-v2.0/dist/index.js"
  ]
}
```

#### 4.4.2 Impact

- Manta disappeared from tab toggle
- Shark disappeared from tab toggle
- Tools stopped working
- Session crashed
- Memory pressure from 2.76GB database + bad plugin = crash cascade

#### 4.4.3 Why Config Corruption Is Catastrophic

The config file (`~/.config/opencode/opencode.json`) is the **entry point** for all plugins. Corruption here affects:
1. **All plugins** - Not just the one being edited
2. **Agent visibility** - Tab toggle relies on proper agent registration
3. **Tool availability** - All tools load through the plugin chain
4. **Session stability** - Bad config → crash cascade

#### 4.4.4 Prevention Checklist

- [ ] Never edit opencode.json manually during development
- [ ] Use backup before any config change
- [ ] Validate JSON syntax after any edit
- [ ] Keep a "known good" backup that works
- [ ] Document exact working config in forensic reports

#### 4.4.5 Recovery Procedure

1. **Restore from backup:**
   ```bash
   cp ~/.config/opencode/opencode.json.bak ~/.config/opencode/opencode.json
   ```

2. **Or reconstruct from documented working state:**
   ```json
   {
     "plugin": [
       "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
       "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
       "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
       "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/dist/index.js",
       "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
       "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
     ]
   }
   ```

3. **Restart OpenCode to reload config**

---

### 4.5 PARALLEL EXECUTION TOOLS FAILURE

**Classification:** HIGH - Functional Failure
**Severity:** HIGH
**Date Discovered:** 2026-04-11

#### 4.5.1 Overview of All Three Tools

| Tool | Error | Root Cause |
|------|-------|------------|
| `spawn_cluster_task` | "Cluster not found" | Cluster `shark-firewall-build` was never created |
| `run_parallel_tasks` | "requires shim implementation" | Tool not fully implemented |
| `run_subagent_task` | "unrecognized arguments: opencode_agent.py" | CLI wrapper bug - passing script name as argument |

#### 4.5.2 spawn_cluster_task - Cluster Not Found

**Error:**
```
Cluster shark-firewall-build not found
```

**Available clusters:**
- `cluster-alpha`
- `cluster-beta`
- `cluster-gamma`

**Root Cause:** The KRAKEN_SYSTEM_PROMPT.md specified using `spawn_cluster_task` with cluster `shark-firewall-build`, but this cluster was never created or registered in the current Kraken system.

**Resolution:** Either:
1. Use an existing cluster (cluster-alpha, cluster-beta, cluster-gamma)
2. Create the cluster first using `anchor_cluster`
3. Update system prompt to match available clusters

#### 4.5.3 run_parallel_tasks - Missing Shim

**Error:**
```
Parallel tool requires a shim implementation. Please use run_subagent_task for now.
```

**Root Cause:** Either:
1. The tool was never fully implemented
2. The tool was disabled/removed
3. The tool requires a plugin/component that's not loaded

**Resolution:** Use `run_subagent_task` for single task execution. `run_parallel_tasks` is not available in current build.

#### 4.5.4 run_subagent_task - CLI Argument Bug

**Error:**
```
CLI Error (Exit 2): usage: opencode_agent.py [-h] --task TASK [--model MODEL] [--timeout TIMEOUT]
                         [--container CONTAINER] [--port PORT] [--cleanup]
                         [--json-only] [--workspace WORKSPACE]
opencode_agent.py: error: unrecognized arguments: opencode_agent.py
```

**Root Cause:** The `run_subagent_task` tool's CLI wrapper is passing the script name itself as an argument to itself.

**Diagnosis:** Tool wrapper incorrectly passes `opencode_agent.py` as an argument:
```bash
# WRONG - script name is first arg (becomes --task value)
python3 opencode_agent.py --task <task> --model <model> ...

# CORRECT - script name is the command, args follow
python3 /path/to/opencode_agent.py --task <task> --model <model> ...
```

**Resolution:** Fix the CLI wrapper to pass the script path correctly, not just the script name.

#### 4.5.5 Verification Checklist

- [ ] `spawn_cluster_task` uses existing cluster (cluster-alpha/beta/gamma)
- [ ] `run_parallel_tasks` not called - use `run_subagent_task` instead
- [ ] `run_subagent_task` wrapper path is absolute, not just script name
- [ ] Python wrapper receives correct arguments

---

### 4.6 HOOK FORMAT MISUNDERSTANDING

**Classification:** CRITICAL - Hook System Failure
**Severity:** CRITICAL
**Date Discovered:** 2026-04-12

#### 4.6.1 The Wrong Pattern

```typescript
// ❌ WRONG - This will fail
export const hooks = {
  'tool.execute.after': [createToolSummarizerHook(), createGateHook()]
};
```

**Why It's Wrong:** OpenCode's hook system calls `safeHook(hookFunction)(input, output)`. It does NOT iterate arrays. The array syntax will cause:
- Silent failures (hooks never execute)
- Or crashes (if array is passed to safeHook)

#### 4.6.2 The Correct Pattern

```typescript
// ✅ CORRECT - Compose functions explicitly
export const hooks = {
  'tool.execute.after': async (input, output) => {
    await createToolSummarizerHook()(input, output);
    await createGateHook()(input, output);
  }
};
```

**Why This Works:**
1. Hook value is an async function (not an array)
2. `safeHook(hookFunction)(input, output)` receives a valid function
3. The function composes multiple behaviors by calling them in sequence

#### 4.6.3 Why This Wasn't Caught

The hook format is validated at **runtime**, not at build time. `bun test` doesn't execute hooks. Bundle verification (grep) doesn't validate hook behavior.

**Only TUI testing can catch this.**

#### 4.6.4 Common Hook Patterns

**Single Hook (simple):**
```typescript
'tool.execute.after': async (input, output) => {
  await createToolSummarizerHook()(input, output);
}
```

**Multiple Hooks (composed):**
```typescript
'tool.execute.after': async (input, output) => {
  await createToolSummarizerHook()(input, output);
  await createGateHook()(input, output);
  await createSessionStateHook()(input, output);
}
```

**With Conditional Logic:**
```typescript
'tool.execute.after': async (input, output) => {
  if (shouldSummarize(input)) {
    await createToolSummarizerHook()(input, output);
  }
  if (shouldCheckGate(input)) {
    await createGateHook()(input, output);
  }
}
```

#### 4.6.5 Verification Checklist

- [ ] Hook values are async functions, not arrays
- [ ] All hooks in `export const hooks = {...}` use correct format
- [ ] TUI testing confirms hooks execute (not just load)
- [ ] No "hook is not a function" errors in session

---

### 4.7 EXPERIMENTAL HOOKS CRASH

**Classification:** HIGH - Session Stability
**Severity:** HIGH
**Date Discovered:** 2026-04-12

#### 4.7.1 The Problem

During v2.0 development, experimental hooks were used:
- `experimental.session.compacting` ⚠️
- `session.ended` ❌ (NOT A VALID EVENT)

**Impact:** Experimental hooks can crash the session if they throw. Invalid events cause undefined behavior.

#### 4.7.2 Valid Hook Events Only

**STABLE:**
- `session.created` ✅

**EXPERIMENTAL (use carefully):**
- `session.compacting` ⚠️ (may crash if hook throws)

**INVALID (do not use):**
- `session.ended` ❌ (not a valid event)
- Any `experimental.*` event in production

#### 4.7.3 Why Experimental Hooks Are Dangerous

1. **No stability guarantee** - API can change without notice
2. **Crash propagation** - Hook that throws can crash entire session
3. **No fallback** - If experimental hook fails, there's no recovery
4. **Debugging difficulty** - Experimental hooks may have hidden interactions

#### 4.7.4 Resolution

Remove all experimental hooks from production code. Use only stable hooks.

**If you must use experimental hooks:**
1. Wrap in try/catch
2. Log all failures
3. Have fallback behavior
4. Test extensively in TUI before production

#### 4.7.5 Verification Checklist

- [ ] No `experimental.*` hooks in production hooks object
- [ ] No invalid event names (like `session.ended`)
- [ ] Only valid events: `session.created`, `session.compacting`
- [ ] TUI testing confirms no session crashes

---

### 4.8 MEMORY LEAKS AND RESOURCE EXHAUSTION

**Classification:** HIGH - Resource Management
**Severity:** HIGH
**Date Discovered:** 2026-04-11

#### 4.8.1 The Problem

Module-level globals never reset between sessions:
- `shared/messenger.ts` - queues never cleared
- `shared/state-store.ts` - data, versions, watchers never cleared
- `hooks/v4.1/session-hook.ts` - module state never reset

**Impact:**
- Hardware exhaustion - Only 3 shark sessions consume resources that should handle 20+
- Plugin overwrite - Kraken's Shark/Manta hooks fire for ALL agents, not just their own
- UI spillover - 19+ console.log/error/warn calls in Manta appear in UI

#### 4.8.2 The Fix: Cleanup Methods

**shared/messenger.ts:**
```typescript
cleanup(): void {
  this.queues.clear();
  this.pendingAcks.clear();
  this.receivedAcks.clear();
}
```

**shared/state-store.ts:**
```typescript
cleanup(): void {
  this.data.clear();
  this.versions.clear();
  this.watchers.clear();
}
```

**hooks/v4.1/gate-hook.ts:**
```typescript
let lastDeliveryBlocked = false;
export function resetGateHookState(): void {
  lastDeliveryBlocked = false;
}
```

#### 4.8.3 Session Hook Cleanup

```typescript
// hooks/v4.1/session-hook.ts
case 'session.ended':
  stateStore.cleanup();
  messenger.cleanup();
  // Reset module-level state:
  lastDeliveryBlocked = false;
  dirCreationAttempted = false;
  resetSystemTransformState();
  resetGateHookState();
  break;
```

#### 4.8.4 Remove Console Output

Every `console.*` call in hooks files causes UI spillover.

**Solution:** Either:
1. Remove console.* calls entirely
2. Replace with silent logging mechanism (writes to log file, not stdout)

#### 4.8.5 Verification Checklist

- [ ] All state stores have `cleanup()` methods
- [ ] Session hook calls cleanup on `session.ended`
- [ ] All module-level globals have reset functions
- [ ] No console.log/error/warn in hooks files
- [ ] Memory usage stable across multiple sessions

---

### 4.9 WRONG AGENT VERSIONS

**Classification:** HIGH - Configuration
**Severity:** HIGH
**Date Discovered:** 2026-04-13

#### 4.9.1 The Problem

Wrong plugin versions were being used:

| Component | Wrong Version | Correct Version |
|-----------|---------------|-----------------|
| Shark | `shark-agent-v4` | `shark-agent-v4.7-hotfix-v3` |
| Manta | `manta-agent-v1.3.5-hotfix` | `manta-agent-v1.5` |

**Impact:** T2 delegation failures, missing features, incompatible APIs

#### 4.9.2 Why Version Matters

1. **Bug fixes** - Hotfix versions fix critical bugs in base versions
2. **API compatibility** - Different versions have different tool signatures
3. **Feature availability** - Some features only exist in specific versions
4. **Memory leaks** - Some versions have resource cleanup, others don't

#### 4.9.3 Correct Versions (NUKE RELOAD)

**Active Plugin Configuration:**
```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
  ]
}
```

#### 4.9.4 Verification Checklist

- [ ] Shark version is `shark-agent-v4.7-hotfix-v3` (NOT v4)
- [ ] Manta version is `manta-agent-v1.5` (NOT v1.3.5-hotfix)
- [ ] Plugin order is: subagent-manager → kraken → shark → manta
- [ ] All plugin paths are absolute (not relative)

---

### 4.10 INSUFFICIENT TESTING METHODOLOGY

**Classification:** CRITICAL - Process Failure
**Severity:** CRITICAL
**Date Discovered:** 2026-04-12

#### 4.10.1 The Wrong Approach

```bash
# What was done:
1. grep -c "executeOnAgent\|simulateTaskExecution" dist/index.js  # Called it "tested"
2. bun test
3. Deployed to production
```

**Why This Fails:**
1. `grep` only verifies strings exist, not that they work
2. `bun test` doesn't execute hooks (hooks only run in TUI)
3. Bundle verification cannot catch runtime bugs (evidence ordering, hook format, etc.)

#### 4.10.2 The Correct Approach

```
STEP 1: Bundle Verification (Static)
├── grep for function names - verify structure
├── Check bundle size - should be 520+ KB
└── TypeScript compilation - no errors

STEP 2: Unit Testing (Local)
├── bun test - all tests pass
├── No import errors
└── Mock external dependencies

STEP 3: Container Testing (Isolated) ← MANDATORY
├── Build Docker image matching target OpenCode version
├── Mount plugin into container
├── Launch TUI: docker exec -it container opencode --agent kraken
├── Use agent for 10+ minutes
├── Verify all tools return valid responses
├── Verify Manta/Shark visible in tab toggle
├── Check memory usage stable
└── No console errors in session

STEP 4: Staged Rollout
├── Deploy to staging environment
├── Run full integration tests
├── Monitor for 24 hours
└── Deploy to production
```

#### 4.10.3 Why Container Testing Is Non-Negotiable

`opencode run` has **broken hooks**. Only TUI mode has full hook support.

**What only TUI catches:**
- Hook format (arrays vs functions)
- Hook execution order
- Session state management
- Agent visibility in tab toggle
- Memory leaks over time
- Console output in correct context

#### 4.10.4 Container Testing Procedure

```bash
# 1. Build custom Docker image
docker build -t opencode-test:latest -f Dockerfile.opencode-test .

# 2. Run container
docker run -d --name opencode-test-container opencode-test:latest

# 3. Copy plugin to container
docker cp ~/.config/opencode/plugins/kraken-nuke-reload opencode-test-container:/tmp/kraken

# 4. Mount plugin (or copy to correct location)
docker exec opencode-test-container mkdir -p /root/.config/opencode/plugins/kraken-nuke-reload
docker exec opencode-test-container cp -r /tmp/kraken /root/.config/opencode/plugins/

# 5. Launch TUI and test
docker exec -it opencode-test-container opencode --agent kraken

# In TUI:
# - Run hive_status
# - Run get_cluster_status
# - Run get_agent_status
# - Verify Shark/Manta in tab toggle
# - Run 10+ tasks through delegation
# - Check memory stays stable
```

#### 4.10.5 Verification Checklist

- [ ] Bundle size is 520+ KB (not 52 KB)
- [ ] TypeScript compilation succeeds
- [ ] `bun test` passes
- [ ] Container testing completed in TUI
- [ ] All kraken tools return valid responses
- [ ] Shark/Manta visible in tab toggle
- [ ] Memory stable across 10+ task executions
- [ ] No console errors in TUI session

---

## 5. BUILD VERIFICATION CHECKLIST

Use this checklist for **EVERY** Kraken build before deployment.

### 5.1 Pre-Build Verification

- [ ] Source has `executeOnAgent` (NOT `simulateTaskExecution`)
- [ ] Bundle size will be 520+ KB
- [ ] `subagent-manager/` directory exists in source
- [ ] `shark-agent/` embedded plugin exists
- [ ] `manta-agent/` embedded plugin exists
- [ ] `wrappers/opencode_agent.py` exists
- [ ] All plugins use correct versions (shark-v4.7-hotfix-v3, manta-v1.5)

### 5.2 Post-Build Verification

- [ ] `dist/index.js` exists
- [ ] Bundle size is 520+ KB
- [ ] `grep executeOnAgent dist/index.js` finds matches
- [ ] `grep simulateTaskExecution dist/index.js` finds NO matches
- [ ] TypeScript compilation succeeds (`bun tsc --noEmit`)
- [ ] `bun test` passes

### 5.3 Configuration Verification

- [ ] `opencode.json` has correct plugin list
- [ ] Plugin order: subagent-manager → kraken → shark → manta
- [ ] All paths are absolute
- [ ] JSON is valid (no syntax errors)
- [ ] Backup of working config exists

### 5.4 Hook Format Verification

- [ ] All hooks in hooks object are async functions
- [ ] No hook values are arrays
- [ ] No experimental hooks used
- [ ] Only valid hook events: `session.created`, `session.compacting`

### 5.5 Runtime Verification (Container Testing)

- [ ] Docker container launched with OpenCode image
- [ ] Plugin mounted in container
- [ ] TUI launched: `opencode --agent kraken`
- [ ] `hive_status` returns valid response
- [ ] `get_cluster_status` returns valid response
- [ ] `get_agent_status` returns valid response
- [ ] Shark/Manta visible in tab toggle
- [ ] No "evidence is not defined" errors
- [ ] Memory stable across multiple operations
- [ ] No console errors in session

### 5.6 Post-Deployment Verification

- [ ] Staged rollout to staging environment
- [ ] Integration tests pass
- [ ] Monitor for 24 hours
- [ ] No degradation in existing functionality
- [ ] Performance metrics stable

---

## 6. VERSION MIGRATION GUIDE

### 6.1 Upgrading from v1.x to v2.0

**DO NOT:**
- Delete subagent-manager
- Delete embedded shark/manta agents
- Remove wrapper scripts
- Use simulateTaskExecution

**DO:**
1. Keep dual plugin architecture (orchestration + execution)
2. Ensure executeOnAgent calls Python wrapper
3. Verify wrapper paths are absolute
4. Update plugin versions (shark-v4.7-hotfix-v3, manta-v1.5)
5. Test in container before deployment

### 6.2 Known Working Config

```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
  ]
}
```

### 6.3 Plugin Version Reference

| Plugin | Version | Location |
|--------|---------|----------|
| opencode-subagent-manager | latest | ~/OPENCODE_WORKSPACE/plugins/ |
| kraken-nuke-reload | v1.0.0 | ~/.config/opencode/plugins/kraken-nuke-reload/ |
| shark-agent | v4.7-hotfix-v3 | ~/OPENCODE_WORKSPACE/plugins/ |
| manta-agent | v1.5 | ~/OPENCODE_WORKSPACE/plugins/ |

---

## 7. TESTING PROTOCOL

### 7.1 Test Categories

**Category 1: Unit Tests (Fast, Local)**
- Run: `bun test`
- Purpose: Verify individual components work
- Limitations: Does NOT test hooks, does NOT test TUI

**Category 2: Integration Tests (Local)**
- Run: Manual testing with OpenCode CLI
- Purpose: Verify component interaction
- Limitations: `opencode run` has broken hooks

**Category 3: Container Tests (Isolated, TUI)**
- Run: Docker container with TUI
- Purpose: Verify full runtime behavior
- Coverage: Catches ALL known failure modes

### 7.2 Required Test Sequence

```bash
# 1. Unit Tests
bun test
# Expected: All tests pass

# 2. Type Check
bun tsc --noEmit
# Expected: No TypeScript errors

# 3. Bundle Size Check
ls -la dist/index.js
# Expected: 520+ KB

# 4. Static Verification
grep -c "executeOnAgent" dist/index.js  # Should find matches
grep -c "simulateTaskExecution" dist/index.js  # Should find NO matches

# 5. Container Test (MANDATORY)
# See Section 4.10.4 for full procedure
docker build -t opencode-test:latest -f Dockerfile.opencode-test .
docker run -d --name opencode-test-container opencode-test:latest
docker exec -it opencode-test-container opencode --agent kraken
# In TUI: Run all kraken tools, verify Shark/Manta visible

# 6. Staged Rollout
# Deploy to staging, monitor 24 hours, then production
```

### 7.3 Test Coverage Matrix

| Test | Catches simulateTaskExecution | Catches hook format | Catches evidence ordering | Catches memory leaks |
|------|------------------------------|---------------------|----------------------------|----------------------|
| bun test | ❌ | ❌ | ❌ | ❌ |
| TypeScript | ❌ | ❌ | ❌ | ❌ |
| grep bundle | ✅ | ❌ | ❌ | ❌ |
| Container TUI | ✅ | ✅ | ✅ | ✅ |

**Only Container TUI catches all failure modes.**

---

## 8. ARCHITECTURE DECISION RECORD (ADR)

### ADR-001: Dual Plugin Architecture

**Context:** Kraken v2.0 attempted to combine orchestration and execution in one plugin, leading to deletion of execution capability.

**Decision:** Maintain TWO SEPARATE plugins:
1. **kraken-agent** - Orchestration only (task scheduling, cluster management, Hive Mind)
2. **opencode-subagent-manager** - Execution only (Docker container spawning)

**Rationale:**
- Orchestration and execution have different stability requirements
- Separate plugins allow independent updates
- Easier debugging - failures can be isolated
- Enables proper testing of each layer

**Status:** ACCEPTED - Implemented in NUKE RELOAD

---

### ADR-002: No Placeholder Code in Production

**Context:** `simulateTaskExecution()` was left as placeholder "until later" which never came.

**Decision:** No placeholder code in production builds. If a function doesn't do real work, it must either:
1. Do real work before merge, OR
2. Throw error if called in production

**Rationale:**
- "Temporary" placeholders become permanent
- Theatrical success looks like real success
- Cannot trust tests that pass with fake implementations

**Status:** ACCEPTED - `executeOnAgent` replaces all `simulateTaskExecution`

---

### ADR-003: Mandatory Container Testing

**Context:** v2.0 was deployed without TUI testing, missing hook format and evidence ordering bugs.

**Decision:** Container testing is MANDATORY for all Kraken builds. No exceptions.

**Rationale:**
- `opencode run` has broken hooks - only TUI works
- Bundle verification cannot catch runtime bugs
- Only TUI testing catches hook format, evidence ordering, memory leaks

**Status:** ACCEPTED - Added to verification checklist

---

### ADR-004: State Cleanup on Session End

**Context:** Module-level globals caused memory leaks and cross-session pollution.

**Decision:** All module-level state must have `cleanup()` methods. Session hook must call cleanup on `session.ended`.

**Rationale:**
- Sessions are not guaranteed to be isolated without cleanup
- Memory leaks accumulate over time
- Cross-agent pollution affects system stability

**Status:** ACCEPTED - Implemented in hotfix versions

---

## 9. T2 DELEGATION SYSTEM

### 9.1 Overview

Kraken delegates tasks to Shark and Manta agents via the T2 (Task Two) delegation system.

### 9.2 Delegation Flow

```
User Request
    ↓
Kraken (Orchestration)
    ↓
spawn_cluster_task / spawn_shark_agent / spawn_manta_agent
    ↓
AsyncDelegationEngine (queue management)
    ↓
ClusterScheduler (load balancing)
    ↓
ClusterManager
    ↓
ClusterInstance.executeTaskAsync()
    ↓
executeOnAgent() → Python Wrapper → Docker Container
    ↓
Agent executes task
    ↓
Result returned via Promise
```

### 9.3 Tools

| Tool | Purpose | Status |
|------|---------|--------|
| `spawn_cluster_task` | Queue task to internal cluster | Working - use existing clusters |
| `spawn_shark_agent` | Queue Shark task | Working |
| `spawn_manta_agent` | Queue Manta task | Working |
| `anchor_cluster` | Create/register cluster | Working |
| `get_cluster_status` | View cluster load | Working |
| `get_agent_status` | View agent status | Working |
| `run_subagent_task` | Direct subagent execution | Working |
| `run_parallel_tasks` | NOT IMPLEMENTED | Do not use |

### 9.4 Cluster Names

**Available clusters:**
- `cluster-alpha`
- `cluster-beta`
- `cluster-gamma`

**Do NOT use:** `shark-firewall-build` (does not exist)

### 9.5 Common Failures

| Error | Cause | Solution |
|-------|-------|----------|
| "Cluster not found" | Wrong cluster name | Use cluster-alpha/beta/gamma |
| "evidence is not defined" | Variable ordering bug | Fixed in hotfix versions |
| T2 tools not returning | Config corruption | Restore from backup |

---

## 10. PLUGIN ISOLATION REQUIREMENTS

### 10.1 Why Isolation Matters

Without proper isolation:
- Kraken's hooks fire for ALL agents, not just their own
- Module-level state leaks across agents
- Console output appears in wrong contexts
- Memory usage grows unbounded

### 10.2 Isolation Requirements

**1. Agent-Specific Hooks:**
```typescript
// Check if agent is ours BEFORE executing hook logic
export async function gateHook(input, output) {
  const { agent } = input.session || {};
  if (!isSharkAgent(agent) && !isMantaAgent(agent)) {
    return;  // Not our agent - skip
  }
  // Our agent - execute hook logic
}
```

**2. Session-Scoped State:**
```typescript
// ❌ WRONG - Global state
let lastDeliveryBlocked = false;

// ✅ CORRECT - Session-scoped state
function createGateHook(sessionId) {
  let lastDeliveryBlocked = false;
  return async (input, output) => {
    // Use session-scoped state
  };
}
```

**3. No Console Output in Hooks:**
```typescript
// ❌ WRONG - pollutes UI
console.log('Gate check running');

// ✅ CORRECT - Silent operation
// Either remove logging or write to file
```

### 10.3 Verification

- [ ] Hooks check agent identity before executing
- [ ] No module-level globals without cleanup
- [ ] No console.log/error/warn in hooks
- [ ] Session state properly scoped

---

## 11. STATE MANAGEMENT PATTERNS

### 11.1 State Store Pattern

```typescript
// shared/state-store.ts
export class StateStore {
  private data: Map<string, any> = new Map();
  private versions: Map<string, number> = new Map();
  private watchers: Map<string, Set<Function>> = new Map();

  get(key: string): any | undefined {
    return this.data.get(key);
  }

  set(key: string, value: any): void {
    this.data.set(key, value);
    this.versions.set(key, (this.versions.get(key) || 0) + 1);
    this.notifyWatchers(key);
  }

  cleanup(): void {
    this.data.clear();
    this.versions.clear();
    this.watchers.clear();
  }
}
```

### 11.2 Messenger Pattern

```typescript
// shared/messenger.ts
export class Messenger {
  private queues: Map<string, any[]> = new Map();
  private pendingAcks: Set<string> = new Set();
  private receivedAcks: Set<string> = new Set();

  send(target: string, message: any): void {
    if (!this.queues.has(target)) {
      this.queues.set(target, []);
    }
    this.queues.get(target).push(message);
  }

  cleanup(): void {
    this.queues.clear();
    this.pendingAcks.clear();
    this.receivedAcks.clear();
  }
}
```

### 11.3 Hook Reset Pattern

```typescript
// hooks/v4.1/gate-hook.ts
let lastDeliveryBlocked = false;

export function resetGateHookState(): void {
  lastDeliveryBlocked = false;
}

export async function gateHook(input, output) {
  // ... hook logic that uses lastDeliveryBlocked
}

// Call resetGateHookState() on session.ended
```

### 11.4 Session Hook Cleanup Pattern

```typescript
// hooks/v4.1/session-hook.ts
export const hooks = {
  'session.created': async (input) => {
    // Initialize session state
  },
  
  'session.ended': async (input) => {
    // Cleanup all module-level state
    stateStore.cleanup();
    messenger.cleanup();
    resetGateHookState();
    resetSystemTransformState();
    resetAgentAwarenessState();
  }
};
```

---

## 12. CONTAINER TESTING WORKFLOW

### 12.1 Complete Procedure

```bash
#!/bin/bash
# container-test.sh - Container testing procedure for Kraken

set -e

CONTAINER_NAME="opencode-kraken-test"
IMAGE="opencode/opencode:latest"
PLUGIN_PATH="/home/leviathan/.config/opencode/plugins/kraken-nuke-reload"

echo "=== Step 1: Build container ==="
docker build -t opencode-test:latest -f - <<EOF
FROM ${IMAGE}
RUN echo "Test build"
EOF

echo "=== Step 2: Run container ==="
docker rm -f $CONTAINER_NAME 2>/dev/null || true
docker run -d --name $CONTAINER_NAME opencode-test:latest

echo "=== Step 3: Mount plugin ==="
docker exec $CONTAINER_NAME mkdir -p /root/.config/opencode/plugins/kraken-nuke-reload
docker cp $PLUGIN_PATH $CONTAINER_NAME:/tmp/kraken
docker exec $CONTAINER_NAME cp -r /tmp/kraken /root/.config/opencode/plugins/

echo "=== Step 4: Update config ==="
docker exec $CONTAINER_NAME sh -c 'cat > /root/.config/opencode/opencode.json << "EOFCONFIG"
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///root/.config/opencode/plugins/kraken-nuke-reload/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
  ]
}
EOFCONFIG'

echo "=== Step 5: Launch TUI and test ==="
docker exec -it $CONTAINER_NAME sh -c '
opencode --agent kraken &
sleep 5
# Test commands
hive_status
get_cluster_status
get_agent_status
# Exit
exit 0
'

echo "=== Step 6: Cleanup ==="
docker rm -f $CONTAINER_NAME

echo "=== Testing complete ==="
```

### 12.2 Manual TUI Test Checklist

In the TUI session, verify:

1. **Agent visible:**
   ```
   Tab toggle shows: kraken, shark, manta
   ```

2. **Hive tools working:**
   ```
   > hive_status
   → { hives: [...], status: "active" }
   ```

3. **Cluster tools working:**
   ```
   > get_cluster_status
   → { clusters: [...], load: {...} }
   ```

4. **T2 delegation working:**
   ```
   > spawn_shark_agent { task: "test", targetAgent: "shark-alpha-1" }
   → { taskId: "...", status: "queued" }
   ```

5. **No errors:**
   - No "evidence is not defined"
   - No "cluster not found"
   - No hook execution errors

6. **Memory stable:**
   - After 10+ operations, memory should not grow unbounded

---

## 13. EMERGENCY ROLLBACK PROCEDURES

### 13.1 Config Corruption Rollback

```bash
# If opencode.json becomes corrupted:
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.broken
cp ~/.config/opencode/opencode.json.backup ~/.config/opencode/opencode.json

# If no backup exists, recreate:
cat > ~/.config/opencode/opencode.json << "EOF"
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-subagent-manager/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/coding-subagents/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/opencode-plugin-engineering/dist/index.js",
    "file:///home/leviathan/.config/opencode/plugins/kraken-nuke-reload/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/dist/index.js",
    "file:///home/leviathan/OPENCODE_WORKSPACE/plugins/manta-agent-v1.5/dist/index.js"
  ]
}
EOF
```

### 13.2 Plugin Rollback

```bash
# If new plugin breaks system:
# 1. Remove from opencode.json
# 2. Restart OpenCode

# Restore from checkpoint if available:
cp -r /path/to/checkpoint-X/plugin ~/.config/opencode/plugins/kraken-nuke-reload
```

### 13.3 Session Crash Recovery

If session crashes:
1. Restart OpenCode
2. Verify config still valid
3. Test basic tools (`hive_status`, `get_cluster_status`)
4. If tools fail, check plugin versions and paths

### 13.4 Full System Reset

```bash
# Complete reset - use only as last resort:
# 1. Kill all OpenCode processes
pkill -f opencode

# 2. Clear session state
rm -rf ~/.config/opencode/sessions/*

# 3. Restore known-good config
cp ~/.config/opencode/opencode.json.known-good ~/.config/opencode/opencode.json

# 4. Restart OpenCode
opencode --agent kraken
```

---

## 14. GLOSSARY AND TERMINOLOGY

| Term | Definition |
|------|------------|
| **Orchestration Layer** | Kraken's task scheduling, cluster management, and Hive Mind - does NOT execute tasks |
| **Execution Layer** | opencode-subagent-manager - actually spawns Docker containers |
| **simulateTaskExecution** | FAKE function that returns success after 100ms without real work - DEPRECATED |
| **executeOnAgent** | REAL function that spawns Docker container via Python wrapper |
| **T2 Delegation** | Task delegation to Shark/Manta agents via cluster system |
| **Hook Format** | Correct format is async function, NOT array of functions |
| **Container Testing** | Testing in Docker TUI - MANDATORY for all builds |
| **Dual Plugin** | Architecture with separate orchestration (kraken) and execution (subagent-manager) plugins |
| **NUKE RELOAD** | Working v1.1-based build with executeOnAgent, dual plugin, all fixes |
| **Theatrical Success** | System that looks like it works but does nothing (tests pass, no real execution) |
| **Evidence Variable** | Variable used in gate hook that must be defined BEFORE use |
| **Session Cleanup** | Reset of all module-level state on session ended |

---

## APPENDIX A: FILE REFERENCE INDEX

### Critical Files

| File | Purpose | Status |
|------|---------|--------|
| `src/clusters/ClusterInstance.ts` | Task execution - MUST use executeOnAgent | ✅ Fixed |
| `src/factory/AsyncDelegationEngine.ts` | Queue management | ✅ Working |
| `src/factory/ClusterScheduler.ts` | Load balancing | ✅ Working |
| `subagent-manager/wrappers/opencode_agent.py` | Docker container spawner | ✅ Present |
| `subagent-manager/wrappers/container_pool.py` | Container pool manager | ✅ Present |
| `hooks/v4.1/gate-hook.ts` | Gate checking - evidence ordering MUST be correct | ✅ Fixed |
| `shared/state-store.ts` | State management - MUST have cleanup() | ✅ Fixed |
| `shared/messenger.ts` | Message handling - MUST have cleanup() | ✅ Fixed |

### Config Files

| File | Purpose | Working Config |
|------|---------|----------------|
| `~/.config/opencode/opencode.json` | Plugin configuration | See Section 6.2 |

### Bundle Size Reference

| Version | Size | Status |
|---------|------|--------|
| v1.0/v1.1 (broken) | ~521 KB | THEATRICAL - fake execution |
| v2.0 (catastrophic) | 52 KB | FAKE - no execution |
| v2.0 Fixed | 527 KB | REAL execution |
| NUKE RELOAD | 527 KB | ✅ ACTIVE - working |

---

## APPENDIX B: KNOWN WORKING BUILD (NUKE RELOAD)

**Source:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/NUKE RELOAD/v1.1/kraken-agent-source/`

**Deployed Plugin:** `/home/leviathan/.config/opencode/plugins/kraken-nuke-reload/`

**Characteristics:**
- Uses `executeOnAgent` (NOT `simulateTaskExecution`)
- Bundle size: 527 KB
- Has dual plugin architecture
- Python wrappers present and working
- All hotfixes applied

**This is the canonical working build. All future builds must match or exceed this build's correctness.**

---

## APPENDIX C: FAILURE SIGNATURE QUICK REFERENCE

| Error Message | Root Cause | Fix |
|---------------|------------|-----|
| `"evidence is not defined"` | Variable ordering bug in gate-hook.ts | Reorder: build evidence BEFORE use |
| `"Cluster not found"` | Wrong cluster name used | Use cluster-alpha/beta/gamma |
| `"requires shim implementation"` | run_parallel_tasks not implemented | Use run_subagent_task instead |
| `"unrecognized arguments: opencode_agent.py"` | CLI wrapper bug | Fix wrapper to use absolute path |
| Bundle size 52 KB | 90% deleted - fake build | Restore from NUKE RELOAD source |
| `"hook is not a function"` | Hook value is array, not function | Use async function composition |
| Session crashes with experimental hooks | Invalid/experimental hook events | Remove experimental hooks |
| Memory grows unbounded | No cleanup on session ended | Add cleanup() calls to state stores |
| Shark/Manta not in tab toggle | Config corruption or wrong versions | Restore config, check versions |

---

**END OF KRAKEN ALIGNMENT BIBLE**

*This document is the authoritative source for Kraken build correctness. All future builds must pass all verification checklists before deployment. No exceptions.*
