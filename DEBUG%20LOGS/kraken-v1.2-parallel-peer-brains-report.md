# KRAKEN V1.2 — PARALLEL PEER BRAINS ARCHITECTURE
## Complete System Documentation

**Status:** ✅ IMPLEMENTED & SHIPPED  
**Date:** 2026-04-12  
**Architecture:** Triple-Brain Parallel Orchestrator with Roundtable Council

---

## EXECUTIVE SUMMARY

Kraken V1.2 implemented a **parallel peer brains architecture** where three specialized brains (Planning, Execution, System) run concurrently and communicate via a priority Brain Messenger. This was inspired by Shark Agent's triple-brain architecture but reconfigured as an orchestrator that manages sub-agents through clusters.

The key insight was that **parallel brains operating with domain ownership** could coordinate without sequential handoffs, dramatically improving orchestration efficiency.

---

## CORE ARCHITECTURE

### Triple-Brain Parallel Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KRAKEN ORCHESTRATOR                                  │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │  PLANNING   │◀▶│  EXECUTION  │◀▶│   SYSTEM    │                          │
│  │   BRAIN     │  │   BRAIN     │  │   BRAIN     │                          │
│  │             │  │             │  │             │                          │
│  │ • T2 Master │  │ • Override  │  │ • L0-L7     │                          │
│  │ • T1 Gen    │  │ • Momentum  │  │ • Gates     │                          │
│  │ • Task Dec  │  │ • Quality   │  │ • Derail    │                          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                          │
│         └────────────────┼────────────────┘                                  │
│                          │                                                  │
│              ┌───────────┴───────────┐                                      │
│              │   BRAIN MESSENGER    │                                      │
│              │  (Priority messaging) │                                      │
│              └───────────┬───────────┘                                      │
└──────────────────────────┼──────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │   ALPHA     │◀─▶│    BETA     │◀─▶│   GAMMA     │
  │  CLUSTER    │   │  CLUSTER    │   │  CLUSTER    │
  │  Brain      │   │  Brain      │   │  Brain      │
  │             │   │             │   │             │
  │ Lead: Exec  │   │ Lead: Reason│   │ Lead: System│
  │ Focus:      │   │ Focus:      │   │ Focus:      │
  │ Steamroll   │   │ Precision   │   │ Testing     │
  └─────────────┘   └─────────────┘   └─────────────┘
```

---

## BRAIN SPECIFICATIONS

### 1. PLANNING BRAIN

**File:** `src/brains/planning/planning-brain.ts`

**Owns:** `planning-state`, `context-bridge`

**Responsibilities:**
- T2 Master context loading
- T1 dynamic generation from SPEC.md
- Task decomposition for cluster assignment
- Domain designation (mechanical)

**Key Code Pattern:**
```typescript
export class PlanningBrain {
  private t2MasterLoaded = false;
  private t1Generated = false;
  private tasksDecomposed = false;
  
  async loadT2Master(): Promise<void> {
    console.log('[PlanningBrain] Loading T2 Master context...');
    this.t2MasterLoaded = true;
  }
  
  async generateT1(specPath: string = 'SPEC.md'): Promise<{
    tasks: TaskSpec[];
    context: Record<string, unknown>;
  }> {
    // Read SPEC.md, analyze requirements, generate task structure
    this.t1Generated = true;
    return t1;
  }
  
  designateCluster(taskType: string): 'alpha' | 'beta' | 'gamma' {
    // Mechanical domain designation - no guesswork
    const designations: Record<string, 'alpha' | 'beta' | 'gamma'> = {
      'build': 'alpha', 'feature': 'alpha', 'implement': 'alpha',
      'debug': 'beta', 'fix': 'beta', 'refactor': 'beta',
      'test': 'gamma', 'verify': 'gamma', 'audit': 'gamma',
    };
    return designations[taskType.toLowerCase()] || 'alpha';
  }
}
```

---

### 2. EXECUTION BRAIN

**File:** `src/brains/execution/execution-brain.ts`

**Owns:** `execution-state`, `quality-state`

**Responsibilities:**
- Override Handler (structured commands)
- Output Verifier integration (mechanical verification)
- Subagent supervision

**Key Code Pattern:**
```typescript
export class ExecutionBrain {
  private outputVerifier: OutputVerifier;
  private overrideHandler: OverrideHandler;
  
  registerTaskOutputs(taskId: string, outputs: OutputDeclaration[]): void {
    this.outputVerifier.registerOutputs(taskId, outputs);
  }
  
  async enforceOutputRetrieval(taskId: string): Promise<void> {
    const command = this.overrideHandler.createRetrieveOutputsCommand(taskId);
    const response = await this.overrideHandler.executeCommand(command);
    if (response.status === 'failed') {
      throw new Error(`Output retrieval failed: ${response.error?.message}`);
    }
  }
  
  async verifyCompletion(taskId: string, evidencePaths: string[]): Promise<void> {
    const command = this.overrideHandler.createClaimCompleteCommand(
      taskId, evidencePaths, true
    );
    const response = await this.overrideHandler.executeCommand(command);
    if (response.status === 'failed') {
      throw new Error(`Completion verification failed`);
    }
  }
}
```

---

### 3. SYSTEM BRAIN

**File:** `src/brains/system/system-brain.ts`

**Owns:** `workflow-state`, `security-state`, `compaction-state`

**Responsibilities:**
- Two-Layer Guardian (Tool + Message enforcement)
- Gate Manager (explicit criteria)
- Compaction Manager (four-tier system)

**Key Code Pattern:**
```typescript
export class SystemBrain {
  private guardian: TwoLayerGuardian;
  private gateManager: GateManager;
  private compactionManager: CompactionManager;
  
  createHooks(): Hooks {
    return {
      'tool.execute.before': createToolGuardianHook(this.guardian),
      'chat.message': createMessageGuardianHook(this.guardian),
    };
  }
  
  evaluateGateEntry(gateId: GateId) {
    return this.gateManager.evaluateGateEntry(gateId);
  }
}
```

---

## BRAIN MESSENGER

**File:** `src/factory/BrainMessenger.ts`

Priority-based brain-to-brain messaging with at-least-once delivery.

```typescript
export function createBrainMessenger(): BrainMessenger {
  const PRIORITY_ORDER = {
    critical: 0,  // Gate failures, security blocks
    high: 1,      // Context injections, state changes
    normal: 2,    // Checkpoints, routine updates
    low: 3,       // Logging, monitoring
  };
  
  return {
    send(message: BrainMessage): void {
      // Priority queue sorted, ack tracking
    },
    
    receive(brainId: string): BrainMessage[] {
      // Drain queue for specific brain
    },
    
    waitForAck(messageId: string, timeoutMs: number): Promise<boolean> {
      // At-least-once delivery guarantee
    },
  };
}
```

**Message Types:**
- `context-inject` — Planning → Execution context transfer
- `gate-failure` — System → All brain failure signal
- `checkpoint` — Routine state sync
- `override` — Execution → Subagent control
- `sync` — Coordination between brains

---

## STATE STORE WITH DOMAIN OWNERSHIP

**File:** `src/factory/StateStore.ts`

**Key Principle:** A brain can only WRITE to domains it owns. ALL brains can READ all domains.

```typescript
export const DOMAIN_OWNERSHIP: Record<StateDomain, string[]> = {
  'plan-state': ['architect'],
  'execution-state': ['executor'],
  'quality-state': ['guardian', 'executor'],
};

export function createStateStore(): StateStore {
  return {
    set<T>(key: string, value: T, domain: StateDomain, ownerBrain?: string): WriteResult {
      // Domain ownership enforcement
      if (ownerBrain) {
        const owners = DOMAIN_OWNERSHIP[domain];
        if (owners && !owners.includes(ownerBrain)) {
          return {
            success: false,
            error: `Brain "${ownerBrain}" does not own domain "${domain}"`,
          };
        }
      }
      // Proceed with write...
    },
  };
}
```

---

## ROUNDTABLE COUNCIL

**File:** `src/brains/council/roundtable-council.ts`

Each cluster brain has the same triple-brain structure internally:

| Cluster | Lead Sub-Brain | Focus | Task Types |
|---------|---------------|-------|------------|
| **Alpha** | Execution | Steamroll | build, feature, implement, from-scratch |
| **Beta** | Reasoning | Precision | debug, fix, patch, refactor, analyze |
| **Gamma** | System | Testing | test, verify, audit, integration |

**Inter-Cluster Communication:**
```typescript
// Alpha → Beta: Context injection (high priority)
messenger.send({
  from: 'alpha-execution',
  to: 'beta-reasoning',
  type: 'context-inject',
  priority: 'high',
  payload: { focus: 'api-handler', patterns: ['debug-pattern'] },
  requiresAck: false,
});

// Gamma → Alpha: Gate requirement (critical)
messenger.send({
  from: 'gamma-system',
  to: 'alpha-execution',
  type: 'gate-requirement',
  priority: 'critical',
  payload: { gate: 'test-gate', criteria: ['tests-pass', 'coverage-80+'] },
  requiresAck: true,
});
```

---

## L0-L7 SYSTEM BRAIN FIREWALL

Unlike Shark's L0-L8 (code writing quality), Kraken's L0-L7 focuses on **ORCHESTRATION INTEGRITY**:

| Layer | Name | Patterns | Purpose |
|-------|------|----------|---------|
| **L0** | Identity Wall | 5 | Block non-Kraken agents from Kraken paths |
| **L1** | Orchestration Theater | 8 | "Task assigned" ≠ "Task complete" |
| **L2** | False Completion | 12 | Output retrieval must happen |
| **L3** | Output Inspection | 10 | File exists ≠ on host filesystem |
| **L4** | Wrong Cluster | 6 | Domain designation enforcement |
| **L5** | Macro Derailment | 50+ | Focus collision, desync, stale context |
| **L6** | Kraken Protection | 3 zones | SYSTEM/CONFIG/STATE zones |
| **L7** | Coordination Gates | 3 gates | Task assignment, output retrieval, sync |

---

## CONTEXT LAYERS (T0/T1/T2)

```
T0: Active Working Context — Session messages, tool calls (self-managed via compactions)
T1: Active Project Context — SPEC.md, project files (dynamically generated by Planning Brain)
T2: Master Context — Shark T2 + Kraken extensions (pre-loaded, never lost)
```

---

## OUTPUT VERIFIER (MECHANICAL VERIFICATION)

**File:** `src/shared/output-verifier.ts`

Key V2.0 innovation - fs.existsSync() checkpoints, not trust:

```typescript
verifier.registerOutputs(taskId, [
  { containerPath: '/app/out.js', hostPath: '/host/out.js' }
]);
await verifier.claimRetrieved(taskId, ['/host/out.js']);
if (verifier.canComplete(taskId)) markComplete();
```

---

## STRUCTURED OVERRIDE COMMANDS

**File:** `src/shared/brain-messenger.ts`

V2.0 replaced natural language overrides with typed schema:

```typescript
interface OverrideCommand {
  id: string;
  type: 'OVERRIDE';
  action: 'ABORT' | 'CLAIM_COMPLETE' | 'REASSIGN' | 'RETRIEVE_OUTPUTS' | 'RETRY' | 'SUSPEND' | 'RESUME';
  target: { brainId?: string; taskId?: string; clusterId?: string };
  payload: { reason?: string; force?: boolean; evidence?: string[] };
  constraints?: { requiresEvidence?: string[]; maxRetries?: number };
  priority: 'critical' | 'high';
  requiresAck: boolean;
}
```

---

## SOURCE FILES

### V1.2 Source Structure (Successfully Shipped)

```
kraken-agent-source/src/
├── index.ts                    # Main plugin export
├── hooks/
│   └── index.ts               # Hook registrations
├── shared/
│   ├── domain-ownership.ts    # Brain domain rules
│   ├── output-verifier.ts     # fs.existsSync() checkpoints
│   ├── state-store.ts         # Domain-owned state
│   └── brain-messenger.ts     # Override command schema (V2.0)
├── brains/
│   ├── planning/
│   │   └── planning-brain.ts  # T2 Master + T1 Gen
│   ├── execution/
│   │   ├── execution-brain.ts # Override + Output verification
│   │   └── override-handler.ts
│   ├── system/
│   │   ├── system-brain.ts    # Guardian + Gates
│   │   ├── two-layer-guardian.ts
│   │   ├── gate-manager.ts
│   │   └── compaction-manager.ts
│   └── council/
│       └── roundtable-council.ts
├── factory/
│   ├── ArchitectureFactory.ts # Brain orchestration
│   ├── BrainFactory.ts        # Brain creation
│   ├── BrainMessenger.ts      # Priority messaging
│   ├── ClusterFactory.ts
│   ├── ClusterScheduler.ts
│   ├── StateStore.ts          # Domain ownership
│   └── types.ts
├── clusters/
│   ├── ClusterManager.ts
│   └── ClusterInstance.ts
└── kraken-hive/
    └── index.ts               # Hive Mind integration
```

---

## CONTEXT LIBRARY FILES

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V1.2 Build/Working Context Library/`

| File | Purpose |
|------|---------|
| `00_INDEX.md` | Master index and architecture diagram |
| `01_ARCHITECTURE_OVERVIEW.md` | Complete system architecture |
| `02_CURRENT_STATE.md` | V1.1 vs V1.2 gap analysis |
| `03_PATTERNS_REFERENCE.md` | L0-L7 orchestration patterns (~100 patterns) |
| `04_IMPLEMENTATION_GUIDE.md` | Step-by-step implementation |
| `05_TESTING_WORKFLOWS.md` | Container testing methodology |
| `06_V1.2_MULTI_BRAIN_INTEGRATION.md` | **Critical brain wiring spec** |
| `07_BUILD_PLAN_PARALLEL.md` | Parallel execution plan |
| `08_SUCCESS_CRITERIA.md` | Ship gate requirements |
| `09_FULL_LAYER_BUILD_SPEC.md` | Complete L0-L7 specs with code |
| `10_COMPLETE_BUILD_PLAN.md` | Phase-by-phase workflow |
| `11_INCIDENT_ANALYSIS.md` | Fire-and-forget trap lessons |
| `12_ROUNDTABLE_COUNCIL.md` | Alpha/Beta/Gamma coordination |
| `13_SUBAGENT_MANAGER_BRAIN.md` | Subagent autonomy + override |
| `GOLDEN_BEHAVIOR_ENFORCEMENT.md` | Behavioral rules |

---

## KEY INSIGHTS FROM V1.2

### 1. Parallel Brains > Sequential Handoffs

Planning, Execution, and System brains run **concurrently**, not in sequence. They only synchronize at coordination gates.

### 2. Domain Ownership Prevents Conflicts

Each brain OWNS specific state domains. Writes are blocked if a brain tries to modify state it doesn't own.

### 3. Mechanical Enforcement > Text Matching

90% of enforcement uses `fs.existsSync()`, `Map.get()`, boolean checks. Only 10% uses regex/text matching.

### 4. Output Retrieval is First-Class

FIRE-AND-FORGET was the root failure. V1.2 makes output retrieval **mandatory** before declaring task complete.

### 5. Structured Override > Natural Language

Override commands use typed schemas, not natural language prompts. This prevents interpretation errors.

---

## WHAT COMES AFTER V1.2

### V2.0 Roundtable Council (Later Evolution)

V2.0 enhanced V1.2 by making the Roundtable Council more explicit:
- Each cluster brain has its own triple-brain structure internally
- Inter-cluster communication formalized
- Two-Layer Firewall added (Tool + Message enforcement)
- Compaction Manager for four-tier context management

### The Path

```
V1.0 (Single Brain) → V1.1 (Single Brain + Clusters) → V1.2 (Triple-Brain Parallel) → V2.0 (Roundtable Enhanced)
```

---

## FILES LOCATION SUMMARY

### Source Implementation
- **V1.2 Source:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/Working Project Space/v2.0-retry/kraken-agent-source/`

### Context Library
- **V1.2 Docs:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent/Active Context/V1.2 Build/Working Context Library/`

### Deployed Bundle
- **Working Bundle:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/dist/index.js`

---

*Document generated: 2026-04-15*  
*Architecture: Triple-Brain Parallel with Domain Ownership*  
*Status: Successfully shipped and operational*
