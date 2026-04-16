# Parallel Peer Brains: Multi-Orchestrator Architecture
## A Deep Dive into Concurrent Workflow Execution

**Date**: 2026-04-03
**Status**: Architecture Deep-Dive
**Based on**: V4 Boilerplate Plan + Spider Agent patterns

---

## 1. The Core Insight

### Why Sequential Orchestration Bottlenecks

Traditional agent systems use a single orchestrator running phases sequentially:

```
PHASE 0: Plan      → [architect thinks for 30 seconds]
PHASE 1: Explore   → [explorer gathers context for 20 seconds]  
PHASE 2: Implement → [coder writes code for 2 minutes]
PHASE 3: Test      → [test-engineer runs tests for 30 seconds]
PHASE 4: Review    → [reviewer checks for 15 seconds]
PHASE 5: Iterate   → [back to architect if issues found]

Total time: ~4 minutes of wall-clock time, but MUCH of that is WAIT time
where the orchestrator is idle, waiting for sub-agents to complete.
```

**The bottleneck**: The orchestrator is a **serial processor**. It can only think about one thing at a time. While the coder is writing code, the architect is idle. While tests run, the entire system is stalled.

### Parallel Peer Brains: The Solution

Instead of one orchestrator running phases sequentially, we have **multiple orchestrators working concurrently** on different aspects:

```
PARALLEL MODEL (Dual Brain):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Architect (Planning)              Executor (Execution)
─────────────────────────         ─────────────────────────
[Thinks about next phase]         [Reviews current task output]
     ↓                                    ↓
[Delegates to research]          [Delegates to coder]
     ↓                                    ↓
[Reviews research findings]      [Reviews coder output]
     ↓                                    ↓
[Plans next phase]               [Delegates to tester]
     ↓                                    ↓
[Updates plan state]            [Reviews test results]
     ↓                                    ↓
[Monitors execution state] ←──→ [Updates execution state]
                                    
WALL CLOCK: Both orchestrators working simultaneously
             Throughput ≈ 2x single orchestrator
```

**Key insight**: The Architect is planning "what's next" while the Executor is managing "what's now." They operate on different time horizons concurrently.

---

## 2. Mental Models

### Model A: The Production Line

Think of a car factory:

```
Single Orchestrator = One worker doing everything: weld, paint, install windows, install seats...
                     (has to finish window before starting seat)

Parallel Peer Brains = Multiple stations working simultaneously:
                       Station A: welding body
                       Station B: painting
                       Station C: installing windows
                       Station D: installing seats
                       
                       Each station has its own queue of work.
                       They sync at assembly milestones.
```

**Analogy to agents**:
- Architect = Station A (planning/infrastructure)
- Executor = Station C (implementation/QA)
- Guardian = Station B (quality assurance/buffers)

### Model B: The Orchestra

```
Single Orchestrator = Solo violinist playing all parts sequentially

Parallel Peer Brains = Full orchestra with sections:
                       - Woodwinds: research/context
                       - Strings: implementation  
                       - Brass: QA/gates
                       - Percussion: coordination
                       
                       Conductor (shared state) keeps them in sync.
                       Each section plays its part independently.
```

### Model C: The Traffic Network

```
Single Orchestrator = One traffic light controlling all intersections
                     (green light moves ONE direction at a time)

Parallel Peer Brains = Coordinated traffic network:
                       - North/South highways: planning flow
                       - East/West arterials: execution flow
                       - Roundabouts: context/knowledge circles
                       
                       Each has its own flow, but they intersect at known junctions.
                       No single point controls everything.
```

---

## 3. Orchestrator Roles in Detail

### 3.1 The Architect (Planning & Strategy)

**Primary Concern**: "What should we build next? Is our approach sound?"

```
┌─────────────────────────────────────────────────────────────┐
│                      THE ARCHITECT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIME HORIZON: Long (minutes to entire session)             │
│                                                             │
│  OWNERSHIP:                                                 │
│  ├── Project plan and phase sequencing                      │
│  ├── Architecture and design decisions                      │
│  ├── Risk identification and mitigation                     │
│  ├── Scope definition and boundaries                        │
│  ├── Milestone definitions                                  │
│  └── Dependency analysis                                    │
│                                                             │
│  DELEGATES TO:                                              │
│  ├── research-pool (explorer, sme, analyst)                │
│  └── design-pool (designer, architect-assistant)           │
│                                                             │
│  READS (No Write):                                          │
│  ├── execution-state (what's being built)                   │
│  └── quality-state (what problems exist)                   │
│                                                             │
│  OUTPUTS:                                                   │
│  ├── Plan updates to shared-plan-state                      │
│  ├── Phase transition signals                               │
│  └── Delegation requests to pools                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Workflow**:
```
1. READ shared-plan-state to understand current phase and progress
2. READ execution-state to see what's being implemented
3. READ quality-state to understand existing problems
4. THINK about next steps, risks, architecture
5. DELEGATE research tasks to research-pool if needed
6. UPDATE plan in shared-plan-state
7. SIGNAL phase transitions when criteria met
```

### 3.2 The Executor (Execution & QA)

**Primary Concern**: "What's being built right now? Is it working correctly?"

```
┌─────────────────────────────────────────────────────────────┐
│                      THE EXECUTOR                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIME HORIZON: Immediate (seconds to current task)          │
│                                                             │
│  OWNERSHIP:                                                 │
│  ├── Task distribution and tracking                         │
│  ├── QA gate enforcement                                    │
│  ├── Test execution oversight                                │
│  ├── Completion verification                                │
│  ├── Blocker identification and escalation                   │
│  └── Progress reporting                                     │
│                                                             │
│  DELEGATES TO:                                              │
│  ├── execution-pool (coder, test-engineer)                 │
│  └── qa-pool (reviewer, critic)                           │
│                                                             │
│  READS (No Write):                                          │
│  ├── plan-state (what the architect wants)                  │
│  └── quality-state (current issues)                         │
│                                                             │
│  OUTPUTS:                                                  │
│  ├── Task assignments to pools                              │
│  ├── QA gate results to shared-state                       │
│  ├── Completion signals                                     │
│  └── Blocker escalations                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Workflow**:
```
1. READ shared-plan-state to know current tasks
2. READ execution-state to track what's running
3. ASSIGN tasks to execution-pool based on plan
4. MONITOR task progress
5. DELEGATE to qa-pool for testing/review
6. ENFORCE gates before accepting completion
7. UPDATE execution-state with progress
8. ESCALATE blockers to Architect if needed
```

### 3.3 The Guardian (Context & Knowledge) — Optional Third

**Primary Concern**: "What have we learned? What context is needed? Is quality maintained?"

```
┌─────────────────────────────────────────────────────────────┐
│                      THE GUARDIAN                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIME HORIZON: Persistent (across sessions)                │
│                                                             │
│  OWNERSHIP:                                                 │
│  ├── Context preservation and hydration                     │
│  ├── Knowledge base management                              │
│  ├── Quality trend analysis                                 │
│  ├── Technical debt tracking                                │
│  ├── Pattern recognition (recurring issues)                │
│  └── Session continuity                                     │
│                                                             │
│  DELEGATES TO:                                              │
│  ├── knowledge-pool (analyst, docs)                        │
│  └── quality-pool (sme for deep dives)                     │
│                                                             │
│  READS (No Write):                                          │
│  ├── plan-state (what's being planned)                      │
│  └── execution-state (what's being built)                  │
│                                                             │
│  OUTPUTS:                                                  │
│  ├── Context summaries to shared-state                     │
│  ├── Knowledge entries to knowledge-base                   │
│  ├── Quality reports                                        │
│  └── Technical debt annotations                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Workflow**:
```
1. READ plan-state and execution-state passively
2. OBSERVE patterns in team performance
3. UPDATE knowledge-base with learnings
4. GENERATE context summaries for handoffs
5. FLAG technical debt as it accumulates
6. TRACK quality metrics over time
7. PRESERVE state for session continuity
```

---

## 4. Synchronization Models

### 4.1 Shared State Sync (Recommended)

All orchestrators read/write to a **shared state store**:

```
┌─────────────────────────────────────────────────────────────┐
│                     SHARED STATE STORE                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ plan-state   │  │execution-state│ │quality-state │       │
│  │             │  │             │  │             │       │
│  │ phases:     │  │ current:    │  │ issues:     │       │
│  │ current: P2 │  │ task-123    │  │ [           ]│       │
│  │ next: P3    │  │ queue: [...]│  │  low: 2     │       │
│  │ milestones: │  │ progress:45%│  │  medium: 1  │       │
│  │ [...]       │  │ blocked: [] │  │  high: 0    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│         ↑               ↑               ↑                    │
│         │               │               │                    │
│    ┌────┴───────────────┴───────────────┴────┐            │
│    │         STATE SYNC PROTOCOL              │            │
│    │  • Optimistic updates with versioning    │            │
│    │  • Event-driven invalidation              │            │
│    │  • Conflict detection on write           │            │
│    └───────────────────────────────────────────┘            │
│                       ↑                                      │
│    ┌──────────────────┴──────────────────┐                  │
│    │        ORCHESTRATOR READS            │                  │
│    │  • Architect: plan + quality         │                  │
│    │  • Executor: plan + execution        │                  │
│    │  • Guardian: all (read-mostly)        │                  │
│    └───────────────────────────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**How it works**:
1. Each orchestrator reads the state they need
2. They make decisions based on local copy
3. They write updates with version numbers
4. If version conflict detected, last-write-wins or merge

**Advantages**:
- Simple to understand
- No direct coupling between orchestrators
- Can persist state for session recovery

**Disadvantages**:
- Eventual consistency (slight delay)
- Potential for version conflicts

### 4.2 Direct Peer Sync

Orchestrators communicate directly:

```
┌─────────────────────────────────────────────────────────────┐
│                   DIRECT PEER SYNC                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      Architect ──────────────── Executor                    │
│         │                            │                      │
│         │  "Phase 2 ready"           │                      │
│         │ ─────────────────────────> │                      │
│         │                            │                      │
│         │  "Task 123 passed QA"      │                      │
│         │ <───────────────────────── │                      │
│         │                            │                      │
│         │         Guardian           │                      │
│         │           │                │                      │
│         │  "Context updated"         │                      │
│         │ ─────────────────────────> │                      │
│         │ <───────────────────────── │                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**How it works**:
1. Orchestrators send messages directly
2. No shared state dependency
3. Messages are fire-and-forget or request-response

**Advantages**:
- Immediate sync
- Richer communication than state updates

**Disadvantages**:
- Tight coupling
- No persistence
- Complex error handling

### 4.3 Hybrid (Recommended for Production)

```
┌─────────────────────────────────────────────────────────────┐
│                     HYBRID SYNC                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRIMARY: Shared State Store                               │
│  ├── Plan state (architect writes, others read)            │
│  ├── Execution state (executor writes, others read)        │
│  ├── Quality state (guardian writes, others read)           │
│  └── Event log (append-only, all can write)                │
│                                                             │
│  SECONDARY: Direct Handoffs                                │
│  ├── "Task ready for QA" message from architect → executor│
│  ├── "Phase complete" message from executor → architect    │
│  └── "Blocker detected" from executor → architect          │
│                                                             │
│  PATTERN:                                                  │
│  1. State updates for persistence and sharing              │
│  2. Direct messages for urgent/one-time events            │
│  3. Event log for audit trail and recovery                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Delegation Patterns

### 5.1 Pool-Based Delegation

Each orchestrator delegates to **pools** of agents:

```
┌─────────────────────────────────────────────────────────────┐
│                    POOL-BASED DELEGATION                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ARCHITECT                                                 │
│   │                                                         │
│   └──> research-pool ──────────────────────────────────┐   │
│          ├── explorer (context gathering)                │   │
│          ├── sme (domain expertise)                     │   │
│          └── analyst (data analysis)                    │   │
│                                                             │
│   EXECUTOR                                                 │
│   │                                                         │
│   ├──> execution-pool ────────────────────────────────┐  │   │
│   │      ├── coder (implementation)                  │  │   │
│   │      └── test-engineer (test generation)         │  │   │
│   │                                                    │  │   │
│   └──> qa-pool ──────────────────────────────────┐    │  │   │
│          ├── reviewer (code review)              │    │  │   │
│          └── critic (risk assessment)            │    │  │   │
│                                                 │    │  │   │
│   GUARDIAN                                       │    │  │   │
│   │                                              │    │  │   │
│   └──> knowledge-pool ───────────────────────────┴────┴──┘   │
│          ├── docs (documentation)                            │
│          └── analyst (knowledge curation)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key principle**: Each pool has **one primary owner** (the orchestrator that delegates to it). This prevents conflicting delegation.

### 5.2 Delegation Rules

```typescript
// Each orchestrator has strict delegation boundaries
const delegationRules = {
  architect: {
    owns: ['research-pool', 'design-pool'],
    canDelegateTo: ['explorer', 'sme', 'analyst', 'designer'],
    cannotDelegateTo: ['coder', 'test-engineer', 'reviewer'],
  },
  
  executor: {
    owns: ['execution-pool', 'qa-pool'],
    canDelegateTo: ['coder', 'test-engineer', 'reviewer', 'critic'],
    cannotDelegateTo: ['explorer', 'sme', 'analyst'],
  },
  
  guardian: {
    owns: ['knowledge-pool'],
    canDelegateTo: ['docs', 'analyst'],
    canReadFrom: ['all-pools'],
  },
};
```

### 5.3 Cross-Orchestrator Requests

When one orchestrator needs work done by another pool:

```
ARCHITECT                        EXECUTOR
needs code review                owns qa-pool
    │                                │
    │  1. WRITE to plan-state:      │
    │     "Need review of task-123"  │
    │                                │
    │ ─────────────────────────────> │
    │                                │
    │         (via shared state)     │
    │                                │
    │                    EXECUTOR reads
    │                    plan-state, sees
    │                    review request
    │                    DELEGATES to reviewer
    │                    from qa-pool
    │                                │
    │                    UPDATES quality-state
    │                    with review results
    │                                │
    │  EXECUTOR writes               │
    │  "task-123 review complete"   │
    │ <───────────────────────────── │
    │                                │
    ARCHITECT reads quality-state     │
    sees review complete              │
```

**Rule**: Orchestrators don't directly delegate to each other's pools. They write requests to state, and the pool owner responds.

---

## 6. Conflict Resolution

### 6.1 Types of Conflicts

```
CONFLICT TYPE 1: State Write Conflict
──────────────────────────────────────
Architect writes: plan-state.phase = "Phase 3"
Executor writes:  plan-state.currentTask = "task-456"
Result: Both succeed (different fields)

Architect writes: plan-state.phase = "Phase 3"
Guardian writes:  plan-state.context = {...}
Result: Both succeed (different fields)

BUT:
Architect writes: plan-state.milestones[0].status = "complete"
Executor writes: plan-state.milestones[0].status = "blocked"
Result: CONFLICT - same field, different values


CONFLICT TYPE 2: Decision Conflict
───────────────────────────────────
Architect decides: "We should refactor first"
Executor decides: "We should ship as-is"

This isn't a state conflict - it's a disagreement
about approach. Requires escalation protocol.


CONFLICT TYPE 3: Resource Conflict
───────────────────────────────────
Both Architect and Executor try to delegate to 'sme' at same time
Result: sme can't do both. One waits.
```

### 6.2 Resolution Strategies

```typescript
// Resolution strategy 1: Last Write Wins (for state)
function resolveStateConflict(current: State, update: State): State {
  if (update.version > current.version) {
    return update; // Last writer wins
  }
  return current;
}

// Resolution strategy 2: Field-Level Merge (for state)
function mergeState(current: State, update: State): State {
  return {
    ...current,
    ...update,
    version: Math.max(current.version, update.version) + 1,
  };
}

// Resolution strategy 3: Escalation (for decisions)
function resolveDecisionConflict(a: Decision, b: Decision): Decision {
  // Primary orchestrator wins (architect for planning decisions)
  // Or escalate to human
  return a.priority >= b.priority ? a : b;
}

// Resolution strategy 4: Queue (for resource contention)
function resolveResourceConflict(requests: Request[]): Request[] {
  // First-come-first-served, or by priority
  return requests.sort((a, b) => b.priority - a.priority);
}
```

### 6.3 Escalation Protocol

```typescript
interface Escalation {
  type: 'decision' | 'resource' | 'quality' | 'blocker';
  from: 'architect' | 'executor' | 'guardian';
  to: 'architect' | 'human';
  description: string;
  options?: string[];
  deadline?: Date;
}

function escalate(escalation: Escalation) {
  if (escalation.to === 'human') {
    // Pause execution, ask human
    pauseExecution();
    notifyHuman(escalation);
  } else {
    // Send to primary orchestrator
    sendMessage(escalation.to, escalation);
  }
}

// Example escalation from Executor to Architect
const blockerEscalation: Escalation = {
  type: 'blocker',
  from: 'executor',
  to: 'architect',
  description: 'Coder blocked on missing API specification',
  options: [
    'Provide API spec from knowledge-base',
    'Delay task until spec available', 
    'Use placeholder and revisit later'
  ],
};
```

---

## 7. Concrete Workflow Examples

### Example 1: Simple Dual-Brain Session

**Scenario**: Build a REST API endpoint

```
T=0: Session Start
────────────────────────────────────────────────────────────

ARCHITECT reads: empty plan-state
EXECUTOR reads: empty plan-state

ARCHITECT thinks: "We need to build a REST API. Let me plan this out."
DELEGATES: explorer → "Gather context on similar APIs in codebase"
→ UPDATES plan-state: { phase: 'Discovery', tasks: ['gather-context'] }

T=1: Context Gathering (Parallel Work Begins)
────────────────────────────────────────────────────────────

EXECUTOR reads: plan-state shows Discovery phase
EXECUTOR thinks: "Nothing to execute yet. Monitoring."

ARCHITECT reads: explorer returned context (12 similar endpoints)
DELEGATES: sme → "Review context, identify patterns"
→ UPDATES plan-state: { phase: 'Discovery', tasks: [..., 'analyze-patterns'] }

T=2: Planning (Architect Active)
────────────────────────────────────────────────────────────

EXECUTOR continues monitoring (idle)

ARCHITECT reads: sme analysis complete
THINKS: "Now I can create the plan"
WRITES plan-state: {
  phase: 'Implementation',
  milestones: [
    { id: 'M1', task: 'Create endpoint skeleton', owner: 'coder' },
    { id: 'M2', task: 'Add request handling', owner: 'coder' },
    { id: 'M3', task: 'Write tests', owner: 'test-engineer' },
    { id: 'M4', task: 'Review code', owner: 'reviewer' },
  ],
  currentTask: 'M1'
}
SIGNALS: "Phase transition to Implementation"

T=3: Execution (Executor Active)
────────────────────────────────────────────────────────────

EXECUTOR reads: phase = 'Implementation', currentTask = 'M1'
DELEGATES: coder → "Create endpoint skeleton at /api/users"
→ UPDATES execution-state: { current: 'M1', status: 'in-progress' }

EXECUTOR monitors coder progress...

ARCHITECT reads: execution-state (observes progress)
THINKS: "Good progress. Let me plan M4 review criteria while M1-M3 run."

T=4: QA Gate (Executor Enforces)
────────────────────────────────────────────────────────────

EXECUTOR reads: M1 complete
DELEGATES: reviewer → "Review endpoint skeleton"
DELEGATES: test-engineer → "Write tests for /api/users"

REVIEWER returns: { issues: [], approved: true }
TEST-ENGINEER returns: { tests: 8, passed: 7, failed: 1 }

EXECUTOR reads: QA results
THINKS: "One test failing. Need to fix before proceeding."
DELEGATES: coder → "Fix failing test case for user validation"
→ UPDATES quality-state: { issues: ['failing-test'], severity: 'medium' }

EXECUTOR waits for fix...

T=5: Completion
────────────────────────────────────────────────────────────

EXECUTOR reads: fix applied, all tests pass
WRITES execution-state: { currentTask: null, status: 'complete' }
WRITES quality-state: { issues: [], allPassed: true }

ARCHITECT reads: execution complete, QA passed
WRITES plan-state: { phase: 'Complete', milestones: [all complete] }
SIGNALS: "All milestones complete"
```

### Example 2: Trio-Brain with Quality Focus

**Scenario**: Security-sensitive feature with Guardian oversight

```
T=0: Session Start
────────────────────────────────────────────────────────────

ARCHITECT reads: security-sensitive feature request
EXECUTOR reads: same request
GUARDIAN reads: same request

GUARDIAN thinks: "Security-sensitive feature. I need to watch closely."
WRITES quality-state: { risk: 'high', focus: 'security' }

ARCHITECT delegates: sme → "Analyze security requirements"
ARCHITECT delegates: analyst → "Review similar implementations for vulnerabilities"
→ UPDATES plan-state: { phase: 'Discovery', securityReview: true }

T=1: Parallel Discovery
────────────────────────────────────────────────────────────

EXECUTOR monitors

GUARDIAN reads: sme analysis (security requirements)
GUARDIAN reads: analyst findings (common vulnerabilities)
GUARDIAN THINKS: "These 3 vulnerability patterns are relevant"
WRITES quality-state: { 
 关注的patterns: ['SQL injection', 'XSS', 'CSRF'],
  securityChecks: ['input-validation', 'auth-verification']
}

ARCHITECT reads: discovery results
WRITES plan-state: {
  phase: 'Implementation',
  securityRequirements: ['input sanitization', 'auth middleware'],
  milestones: [...]
}

T=2: Security-Enforced Execution
────────────────────────────────────────────────────────────

EXECUTOR reads: plan-state with security requirements
EXECUTOR thinks: "Must enforce security gates before any completion"

DELEGATES: coder → "Implement endpoint with security middleware"
DELEGATES: test-engineer → "Write security tests for all 3 patterns"

GUARDIAN monitors: execution-state

TEST-ENGINEER returns: { tests: [...], SQL_injection: 'blocked', XSS: 'blocked' }
REVIEWER returns: { issues: ['missing CSRF token check'] }

EXECUTOR reads: security gate failed (missing CSRF)
DELEGATES: coder → "Add CSRF protection"
BLOCKS completion until fixed

GUARDIAN reads: fix applied, all security tests pass
WRITES quality-state: { securityStatus: 'approved' }

EXECUTOR reads: security approved
PROCEEDS to next task
```

---

## 8. State Schema

### 8.1 Shared State Structure

```typescript
interface SharedState {
  version: number;
  lastUpdated: Date;
  
  plan: PlanState;
  execution: ExecutionState;
  quality: QualityState;
  events: Event[];
}

interface PlanState {
  phase: 'Discovery' | 'Implementation' | 'Testing' | 'Review' | 'Complete';
  milestones: Milestone[];
  currentTask: string | null;
  architecture: ArchitectureDecision[];
  risks: Risk[];
  blockers: Blocker[];
}

interface ExecutionState {
  currentTask: string | null;
  taskQueue: Task[];
  progress: number; // 0-100
  status: 'idle' | 'running' | 'blocked' | 'complete';
  delegations: Delegation[];
}

interface QualityState {
  issues: Issue[];
  securityStatus: 'pending' | 'approved' | 'rejected';
  testCoverage: number;
  lastGateResult: GateResult | null;
  technicalDebt: TechnicalDebtEntry[];
}

interface Event {
  id: string;
  timestamp: Date;
  type: 'task_complete' | 'phase_change' | 'gate_pass' | 'gate_fail' | 'escalation';
  data: unknown;
}
```

### 8.2 Orchestrator State Views

```typescript
// What each orchestrator needs to read
interface ArchitectStateView {
  plan: PlanState;           // Owns this
  quality: Pick<QualityState, 'issues' | 'securityStatus'>;  // Read-only
  execution: Pick<ExecutionState, 'progress' | 'status'>;   // Read-only
}

interface ExecutorStateView {
  plan: Pick<PlanState, 'phase' | 'currentTask' | 'milestones'>;  // Read-only
  execution: ExecutionState;  // Owns this
  quality: QualityState;      // Owns this (mostly)
}

interface GuardianStateView {
  plan: PlanState;           // Read-only
  execution: ExecutionState;  // Read-only  
  quality: QualityState;      // Owns this
}
```

---

## 9. Error Handling

### 9.1 Orchestrator Failure

```typescript
interface OrchestratorHealth {
  id: string;
  lastHeartbeat: Date;
  status: 'healthy' | 'degraded' | 'failed';
  currentTask: string | null;
}

function monitorOrchestratorHealth(health: OrchestratorHealth) {
  const now = Date.now();
  const sinceLastHeartbeat = now - health.lastHeartbeat;
  
  if (sinceLastHeartbeat > 30000) { // 30 seconds
    if (health.status !== 'degraded') {
      setStatus(health.id, 'degraded');
      notifyOtherOrchestrators(`${health.id} is degraded`);
    }
  }
  
  if (sinceLastHeartbeat > 120000) { // 2 minutes
    setStatus(health.id, 'failed');
    triggerRecovery(health.id);
  }
}

function triggerRecovery(failedId: string) {
  // If architect fails: pause planning, continue execution if safe
  // If executor fails: pause execution, preserve state, escalate
  // If guardian fails: continue without context tracking
  
  const recovery: RecoveryPlan = {
    failed: failedId,
    impact: 'medium',
    actions: [
      'Preserve all state',
      'Ask human to decide: continue or abort',
    ],
  };
  
  pauseExecution();
  notifyHuman(recovery);
}
```

### 9.2 Sub-Agent Failure

```typescript
function handleSubAgentFailure(agent: string, task: Task, error: Error) {
  // Log the failure
  writeEvent({
    type: 'agent_failure',
    agent,
    task: task.id,
    error: error.message,
  });
  
  // Determine severity
  if (isCritical(task)) {
    // Escalate to executor
    escalateToExecutor({
      type: 'blocker',
      from: agent,
      task: task.id,
      error: error.message,
    });
  } else {
    // Retry with backoff
    retryWithBackoff(task, { maxAttempts: 3 });
  }
}
```

---

## 10. Scaling Considerations

### 10.1 Adding More Orchestrators

```
Dual (2) → Trio (3) → Quad (4)
───────────────────────────────
  Architect (planning)
  Executor (execution)     ← Add when execution becomes bottleneck
  Guardian (quality)       ← Add when context becomes bottleneck
  Analyst (research)      ← Add when research becomes bottleneck
```

**Rule**: Each new orchestrator should own a **distinct concern** that was previously a bottleneck.

### 10.2 Scaling the Pools

```
Pool Scaling:
- research-pool: 1-3 agents (context gathering is serial per domain)
- execution-pool: 2-5 agents (parallel coding)
- qa-pool: 1-3 agents (review/testing is serial per task)
- knowledge-pool: 1-2 agents (curation doesn't scale with volume)
```

### 10.3 Limitations

```
What doesn't scale:
───────────────────
• Shared state becomes contention point with 4+ orchestrators
• Direct peer sync becomes complex with 4+ orchestrators  
• Human readable plan state breaks down with 10+ concurrent tasks
• Single guardian can't track context for 100+ session history

When to consider different architecture:
───────────────────────────────────────
• 4+ orchestrators: Hierarchical brain structure (meta-orchestrator)
• 10+ agent pools: Pool federation
• 1000+ concurrent tasks: Task queue with dedicated executors
```

---

## 11. Implementation Priority

### Phase 1: Dual-Brain (MVP)
- 2 orchestrators: Architect + Executor
- Shared state with optimistic updates
- Simple escalation (executor → architect for decisions)
- 2-3 agent pools

### Phase 2: Add Guardian
- 3 orchestrators: Architect + Executor + Guardian
- Knowledge-base integration
- Quality trend tracking
- Session continuity

### Phase 3: Enhanced Sync
- Event log for audit trail
- Conflict resolution refinement
- Priority-based resource allocation

---

## 12. Anti-Patterns to Avoid

```
❌ DON'T: Multiple orchestrators delegating to same pool
   → Results in conflicting instructions
   
❌ DON'T: Shared state with strong consistency requirements
   → Performance bottlenecks, complex locking
   
❌ DON'T: Orchestrators making decisions about each other's domains
   → Architect shouldn't directly assign tasks to coder
   → Executor shouldn't modify the plan
   
❌ DON'T: No escalation path
   → System deadlocks when orchestrators disagree
   
❌ DON'T: Orchestrators blocking on each other
   → If architect is waiting for research, executor shouldn't wait
   
✅ DO: Clear ownership boundaries
✅ DO: Async communication via state
✅ DO: Explicit escalation protocols
✅ DO: Health monitoring and recovery
```

---

## 13. Comparison Table

| Aspect | Single Orchestrator | Parallel Peer Brains |
|--------|--------------------|--------------------|
| **Throughput** | Sequential phases | Concurrent execution |
| **Complexity** | Simple | Moderate |
| **Latency** | Sum of all phases | Max of parallel paths |
| **State Management** | Single view | Distributed with sync |
| **Failure Domain** | Total failure | Partial (one brain fails) |
| **Scaling** | Vertical only | Horizontal |
| **Debugging** | Linear trace | Concurrent traces |
| **Human Oversight** | Easier | Harder (parallel activity) |

---

**This document is a living architecture spec. Update as implementation learnings accumulate.**
