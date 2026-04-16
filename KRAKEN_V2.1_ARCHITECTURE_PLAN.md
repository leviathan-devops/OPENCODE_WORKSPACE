# KRAKEN V2.1 ARCHITECTURE PLAN
## System Brain: Device Memory Guardian

**Date:** 2026-04-12
**Status:** PLANNING PHASE
**Version:** 2.1

---

## 1. EXECUTIVE SUMMARY

Kraken V2.1 introduces a **Device Memory Guardian** - a new System Brain capability that monitors device resources and enforces micro-architecture stability. This prevents the memory thrashing, OOM crashes, and session context loss that plagued V2.0.

### Core Problem (from KRAKEN_ARCHITECTURE_AUDIT.md)
- OpenCode sessions consume excessive memory (5-7GB per worker)
- GC thrashing causes 90% CPU spikes
- Watchdog cannot identify/kill runaway processes
- Sessions crash, losing context
- Database bloat (2.76GB+) compounds memory issues

### Solution
System Brain gains a **Resource Guardian** sub-component that:
1. Monitors device memory in real-time
2. Detects memory pressure BEFORE OOM
3. Triggers proactive shedding instead of reactive crash
4. Enforces micro-architecture stability

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         KRAKEN V2.1                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   System    │  │  Execution  │  │  Planning   │            │
│  │   Brain     │◄─┤   Brain     │  │   Brain     │            │
│  └──────┬──────┘  └─────────────┘  └─────────────┘            │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              RESOURCE GUARDIAN (NEW)                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ Memory Watch │  │ Process Mgr  │  │  Context     │  │   │
│  │  │   (os.totalmem,   │   (ps list,    │  Compactor   │  │   │
│  │  │    free mem)      │    kill tree)   │  (proactive) │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              TWO-LAYER GUARDIAN (EXISTING)               │   │
│  │         Tool Guardian + Message Guardian                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. RESOURCE GUARDIAN SPECIFICATIONS

### 3.1 Memory Monitor

**Responsibility:** Track device memory usage and detect pressure

**Metrics Tracked:**
```typescript
interface MemoryMetrics {
  totalBytes: number;           // os.totalmem()
  freeBytes: number;            // os.freemem()
  usedBytes: number;            // total - free
  usedPercent: number;          // (used / total) * 100
  processRssBytes: number;      // current process RSS
  swapTotalBytes: number;       // swap total
  swapUsedBytes: number;        // swap used
  swapPercent: number;          // (swap used / swap total) * 100
}
```

**Thresholds:**
| Level | Used % | Action |
|-------|--------|--------|
| GREEN | < 70% | Normal operation |
| YELLOW | 70-85% | Warning, increase monitoring |
| ORANGE | 85-92% | Proactive compaction triggered |
| RED | > 92% | Emergency shedding + session review |
| CRITICAL | > 98% | Kill lowest priority processes |

### 3.2 Process Manager

**Responsibility:** Track and manage OpenCode processes

**Data Collected:**
```typescript
interface ProcessInfo {
  pid: number;
  ppid: number;
  command: string;
  cpuPercent: number;
  memBytes: number;
  memPercent: number;
  uptime: number;              // seconds
  sessionId?: string;
  isMainSession: boolean;
  children: number[];          // child PIDs
}
```

**Hierarchy Awareness:**
- Level 1: Manager processes (`node opencode`)
- Level 2: Worker processes (`.opencode`)
- Aggregate memory = Parent + All Children

**Kill Tree Logic:**
```
IF aggregate_memory > THRESHOLD:
  1. Identify session with highest memory
  2. Gracefully signal session (save state)
  3. If not responsive in 5s, SIGKILL
  4. Log termination for audit
```

### 3.3 Context Compactor (Proactive)

**Responsibility:** Shed context BEFORE memory is exhausted

**Triggers:**
- Memory Yellow: Compact sessions with largest context
- Memory Orange: Compact ALL sessions above threshold
- Memory Red: Emergency shed - keep only active session

**Compaction Priority:**
1. Inactive sessions (no input > 5 minutes)
2. Sessions with largest context windows
3. Sessions with highest memory per message ratio

**Compaction Strategy:**
```
1. Call session.save() on target session
2. Trim message history to last N messages (configurable)
3. Clear any cached tool outputs
4. Trigger GC hint: global.gc?.() 
5. Verify memory freed, log result
```

---

## 4. SYSTEM BRAIN INTEGRATION

### 4.1 New Gate: MEMORY_GATE

V2.1 adds a new gate checkpoint:

```typescript
enum GateType {
  PLAN = 'PLAN',
  BUILD = 'BUILD', 
  TEST = 'TEST',
  VERIFY = 'VERIFY',
  AUDIT = 'AUDIT',
  DELIVERY = 'DELIVERY',
  MEMORY = 'MEMORY',  // NEW
}
```

**MEMORY Gate Entry Criteria:**
```typescript
const memoryGateCriteria = {
  deviceMemoryHealthy: () => metrics.usedPercent < 85,
  noSwampSwap: () => metrics.swapPercent < 80,
  processCountOk: () => openCodeProcesses.length <= MAX_SESSIONS,
  noThrashing: () => gcFrequency < 5,  // per second
};
```

### 4.2 Guardian Enforcer Hooks

The Resource Guardian intercepts via hooks:

```typescript
// In hooks/index.ts
'resource.monitor': async (metrics: MemoryMetrics) => {
  const systemBrain = getSystemBrain();
  return systemBrain.evaluateMemoryGate(metrics);
},
```

### 4.3 Brain Communication

```typescript
// Brain Messenger signals
interface MemorySignal {
  type: 'MEMORY_PRESSURE' | 'MEMORY_CRITICAL' | 'MEMORY_RECOVERY';
  source: 'resource-guardian';
  target: 'system-brain';
  payload: {
    usedPercent: number;
    affectedSessions: string[];
    actionTaken?: string;
  };
}
```

---

## 5. IMPLEMENTATION DETAILS

### 5.1 File Structure Additions

```
kraken-agent-v2.1/src/
├── brains/
│   └── system/
│       ├── resource-guardian.ts    // NEW
│       ├── memory-monitor.ts        // NEW  
│       ├── process-manager.ts       // NEW
│       ├── context-compactor.ts     // NEW
│       ├── system-brain.ts         // MODIFIED
│       └── gate-manager.ts          // MODIFIED
```

### 5.2 Dependencies

```json
{
  "dependencies": {
    "systeminformation": "^5.21.0"  // Cross-platform system info
  }
}
```

**Why systeminformation instead of raw os/cpu?**
- Unified API across Linux/macOS/Windows
- Built-in process tree traversal
- Memory and process metrics in one library
- Lightweight (~2MB)

### 5.3 Configuration

```typescript
interface ResourceGuardianConfig {
  // Memory thresholds (percent)
  yellowThreshold: 70,
  orangeThreshold: 85,
  redThreshold: 92,
  criticalThreshold: 98,
  
  // Process limits
  maxOpenCodeProcesses: 6,
  maxMemoryPerSessionMB: 2048,
  
  // Compaction settings
  compactionMessageLimit: 100,     // Max messages to keep
  inactiveSessionMinutes: 5,      // Consider inactive after
  compactionBatchSize: 3,         // Sessions per compaction run
  
  // Timing
  monitorIntervalMs: 5000,         // Check every 5s
  gracefulShutdownTimeoutMs: 5000, // Wait before SIGKILL
}
```

---

## 6. BEHAVIOR FLOWS

### 6.1 Normal Operation (GREEN)

```
Every 5s: Memory Monitor checks metrics
  └─► usedPercent < 70%? 
      └─► YES: Log GREEN, no action
      └─► NO: Evaluate YELLOW
```

### 6.2 Yellow Alert Flow

```
Memory Monitor: usedPercent >= 70%
  └─► Emit MEMORY_PRESSURE signal
      └─► System Brain logs warning
          └─► Context Compactor: Target largest session
              └─► Compact to 80 messages
                  └─► Recheck memory
                      └─► Still yellow? Log and continue
```

### 6.3 Orange/Red Alert Flow

```
Memory Monitor: usedPercent >= 85%
  └─► Emit MEMORY_CRITICAL signal
      └─► System Brain triggers EMERGENCY SHEDDING
          └─► Process Manager: Identify heavy sessions
              └─► For each session (priority order):
                  1. Graceful save (SIGTERM)
                  2. Wait 5s for response
                  3. If alive: SIGKILL
                  4. Log termination
          └─► Context Compactor: Aggressive trim (50 msgs)
              └─► Force GC: global.gc?.()
                  └─► Verify memory freed
```

### 6.4 Recovery Flow

```
After shedding: usedPercent drops below threshold
  └─► Emit MEMORY_RECOVERY signal
      └─► System Brain logs recovery
          └─► Resume normal monitoring
              └─► 30s later: Reset alert state
```

---

## 7. MICRO-ARCHITECTURE BEHAVIOR ENFORCEMENT

Just as V2.0 has behavior firewalls for macro-architecture (Tool + Message guardians), V2.1 adds micro-architecture enforcement:

### 7.1 Process Behavior Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| No Nested Managers | Manager process should not spawn Manager | Process Manager detects and warns |
| Memory Budget | Per-session memory cap | Compactor enforces |
| Session Limit | Max concurrent sessions | Process Manager enforces |
| Graceful Exit | Sessions must save state on SIGTERM | Hook intercepts signal |

### 7.2 Anti-Spiral Logic

```typescript
class AntiSpiralMonitor {
  private gcEvents: number = 0;
  private lastCheck: number = Date.now();
  
  onGCEvent() {
    const now = Date.now();
    const elapsed = (now - this.lastCheck) / 1000; // seconds
    
    if (elapsed < 1) {  // GC in last second
      this.gcEvents++;
    } else {
      this.gcEvents = 1;
      this.lastCheck = now;
    }
    
    if (this.gcEvents > 5) {  // 5+ GCs in a second = thrashing
      this.triggerAntiSpiral();
    }
  }
  
  triggerAntiSpiral() {
    // Immediately shed 50% of sessions
    // This breaks the GC -> crash -> respawn -> GC loop
    processManager.emergencyShed(0.5);
  }
}
```

---

## 8. V2.1 VS V2.0 COMPARISON

| Feature | V2.0 | V2.1 |
|---------|------|------|
| Memory Monitoring | None | Real-time Guardian |
| Process Management | None | Hierarchy-aware kill tree |
| Context Compaction | Manual (65/75/85%) | Proactive + Reactive |
| Session Crash Prevention | None | Anti-spiral logic |
| Memory Gate | None | MEMORY gate checkpoint |
| Behavior Enforcement | Tool + Message only | Tool + Message + Resource |
| Database Bloat | No control | Compactor targets old sessions |

---

## 9. PHASED IMPLEMENTATION

### Phase 1: Core Guardian (Essential)
- Memory Monitor with thresholds
- Process Manager (list + tree)
- YELLOW/ORANGE/RED alerts
- Basic compaction

### Phase 2: Advanced Guardian (Complete)
- Anti-spiral logic
- Hierarchy-aware kill tree
- MEMORY gate integration
- Full micro-architecture enforcement

### Phase 3: Optimization (Polish)
- systeminformation library integration
- Configurable thresholds
- Recovery flow with logging
- Audit trail for all actions

---

## 10. OPEN QUESTIONS

1. **Session save reliability:** Does OpenCode session.save() work reliably under memory pressure?
2. **Process identification:** How to reliably distinguish Manager vs Worker without relying on command line args?
3. **Safe compaction:** What is a safe message limit that preserves context but frees memory?
4. **User notification:** Should user be warned before sessions are shed?
5. **Persistence:** Should Resource Guardian state be persisted across restarts?

---

## 11. DEPENDENCIES & BLOCKERS

### Blockers
- None currently identified

### Dependencies
- `systeminformation` package for cross-platform metrics
- OpenCode hooks for session interception
- Access to process list (may require elevated permissions)

### Risks
- Killing wrong process could corrupt session state
- Over-aggressive compaction could lose important context
- Memory check overhead itself could cause load

---

## 12. TEST PLAN

### Unit Tests
- Memory Monitor: Verify threshold detection
- Process Manager: Verify tree aggregation
- Context Compactor: Verify message trimming

### Integration Tests
- Full alert flow simulation
- Kill tree verification
- Anti-spiral trigger verification

### Load Tests
- Simulate 70% memory: Verify YELLOW alert
- Simulate 92% memory: Verify emergency shed
- Simulate GC thrashing: Verify spiral detection

---

**END OF V2.1 ARCHITECTURE PLAN**

*This document serves as the blueprint for V2.1 implementation.*
