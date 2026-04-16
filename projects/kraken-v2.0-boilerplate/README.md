# Kraken v2.0 Boilerplate

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-boilerplate/`
**Date Created:** 2026-04-14 22:42
**Last Modified:** 2026-04-15 15:34
**Status:** BOILERPLATE PROTOTYPE - Not production ready

---

## WHAT IS THIS?

This is a **multi-brain Kraken orchestrator boilerplate** - a partially-implemented prototype with working cluster execution but incomplete brain wiring.

**Use this as a starting point for building a production multi-brain orchestrator.**
**Do NOT deploy this as-is** - the brain system exists but is not wired together.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KRAKEN ORCHESTRATOR                         │
│                                                                      │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐  │
│  │  PLANNING    │         │  EXECUTION  │         │   SYSTEM    │  │
│  │   BRAIN     │         │   BRAIN    │         │   BRAIN     │  │
│  │  (stub)     │         │  (stub)    │         │  (stub)     │  │
│  └──────┬─────┘         └──────┬─────┘         └──────┬─────┘  │
│         │                      │                      │          │
│         └──────────────────────┼──────────────────────┘          │
│                                │                                   │
│                    ┌───────────┴───────────┐                      │
│                    │   BRAIN MESSENGER      │                      │
│                    │   (exists, not used)   │                      │
│                    └───────────┬───────────┘                      │
│                                │                                   │
│         ┌──────────────────────┼──────────────────────┐           │
│         ▼                      ▼                      ▼            │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐ │
│  │   ALPHA     │         │    BETA     │         │   GAMMA     │ │
│  │  CLUSTER    │         │  CLUSTER    │         │  CLUSTER    │ │
│  │  (WORKS)    │         │  (WORKS)    │         │  (WORKS)    │ │
│  └──────┬─────┘         └──────┬─────┘         └──────┬─────┘   │
│         │                      │                      │           │
│         └──────────────────────┼──────────────────────┘           │
│                    ┌──────────┴──────────┐                         │
│                    │  SUBAGENT-MANAGER  │                          │
│                    │    (WORKS)         │                          │
│                    └───────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## WHAT WORKS (CAN BE USED AS-IS)

### 1. Cluster System ✅

**Files:** `src/clusters/ClusterInstance.ts`, `src/clusters/ClusterManager.ts`

The cluster system is fully functional with real Docker container spawning:

```typescript
// ClusterInstance.executeOnAgent() spawns actual containers
private async executeOnAgent(
  agent: ClusterAgentInstance,
  request: KrakenDelegationRequest
): Promise<KrakenDelegationResult> {
  // Real spawn of Python wrapper → Docker
  const proc = spawn('python3', [wrapperPath, ...args], {...});
  // Returns actual output from container
}
```

**Features:**
- 3 clusters (Alpha, Beta, Gamma) with 3 agents each (9 total)
- Async task queue with priority support
- Real Docker container spawning via Python wrapper
- 120 second timeout with proper cleanup
- JSON output parsing from container stdout

**Use this:** Copy `src/clusters/` to any working Kraken project.

---

### 2. BrainMessenger Schema ✅

**File:** `src/shared/brain-messenger.ts`

The BrainMessenger class is complete and matches v1.2 spec:

```typescript
export class BrainMessenger {
  createOverrideCommand(params: {...}): OverrideCommand
  send(message: BrainMessage): void
  broadcast(message: BrainMessage): void
  subscribe(brainId: string, callback: (msg: BrainMessage) => void): void
}
```

**Override Actions Defined:**
- `ABORT` - Abort a task
- `CLAIM_COMPLETE` - Mark task complete
- `REASSIGN` - Move task to different cluster
- `RETRIEVE_OUTPUTS` - Force output retrieval
- `RETRY` - Retry failed task
- `SUSPEND` / `RESUME` - Task lifecycle

**Use this:** Copy `src/shared/brain-messenger.ts` to any project needing brain messaging.

---

### 3. OverrideCommand Schema ✅

**File:** `src/shared/brain-messenger.ts`

Complete OverrideCommand interface matching v1.2 spec:

```typescript
export interface OverrideCommand {
  id: string;
  type: 'OVERRIDE';
  action: OverrideAction;
  target: OverrideTarget;
  payload: OverridePayload;
  constraints?: OverrideConstraints;
  priority: OverridePriority;
  requiresAck: boolean;
  createdAt: Date;
  expiresAt?: Date;
}
```

**Use this:** Use as reference for override command design.

---

### 4. Brain Classes (Structure Only) ⚠️

**Files:**
- `src/brains/planning/planning-brain.ts` - PlanningBrain class
- `src/brains/execution/execution-brain.ts` - ExecutionBrain class
- `src/brains/system/system-brain.ts` - SystemBrain class
- `src/brains/council/roundtable-council.ts` - CouncilCoordinator + Alpha/Beta/Gamma brains

**What's implemented:**
- Class structure with initialize(), isInitialized()
- Internal state management (but not shared)
- Method stubs for brain operations

**What's missing:** Brain-to-brain communication, shared state store.

**Use this:** As template for brain class implementation. Do NOT use as-is - needs wiring.

---

### 5. Subagent Manager ✅

**File:** `subagent-manager/dist/index.js` (945 KB)

Working subagent-manager with Python wrappers:
- `opencode_agent.py` - Single container spawning
- `container_pool.py` - Parallel container pool

**Tools:**
- `run_subagent_task` - Spawn single agent
- `run_parallel_tasks` - Spawn multiple agents
- `cleanup_subagents` - Kill containers

**Use this:** Already production-ready, can copy directly.

---

## WHAT DOESN'T WORK (MUST BE FIXED)

### 1. No Shared State Store ❌

**Problem:** Each brain has internal state, but there's no shared state store with DOMAIN_OWNERSHIP.

**v1.2 Spec Requires:**
```typescript
const stateStore = createStateStore(DOMAIN_OWNERSHIP);

// DOMAIN_OWNERSHIP = {
  'planning-state': ['kraken-planning', 'kraken-system'],
  'execution-state': ['kraken-execution', 'kraken-system'],
  // ...
// }
```

**Current State:** Brains call `createStateStore()` internally, but there's no shared instance and no DOMAIN_OWNERSHIP.

**Fix Required:**
1. Create shared state store in `hooks/index.ts`
2. Pass to all brain instances
3. Add DOMAIN_OWNERSHIP configuration

---

### 2. No Brain Linking ❌

**Problem:** BrainMessenger is created but not connected to brains.

**v1.2 Spec Requires:**
```typescript
const messenger = createBrainMessenger();
messenger.linkBrain('kraken-planning', planningBrain);
messenger.linkBrain('kraken-execution', executionBrain);
messenger.linkBrain('kraken-system', systemBrain);
```

**Current State:** Brains are initialized independently in hooks:
```typescript
// hooks/index.ts - session.created:
const systemBrain = createSystemBrain();
systemBrain.initialize();
const executionBrain = createExecutionBrain();
executionBrain.initialize();
// These are independent, not communicating
```

**Fix Required:**
1. Create messenger instance
2. Call `messenger.linkBrain()` for each brain
3. Store linked brains for later access

---

### 3. No Brain-to-Brain Communication ❌

**Problem:** PlanningBrain.decomposeTasks() returns data but doesn't send via messenger.

**v1.2 Spec Requires:**
```typescript
// Planning → Execution: context injection
messenger.send({
  from: 'kraken-planning',
  to: 'kraken-execution',
  type: 'context-inject',
  priority: 'high',
  payload: { thinking-state: {...} },
  requiresAck: false,
});
```

**Current State:** Brain methods return data but don't send messages.

**Fix Required:**
1. Wire messenger to brains
2. Add `messenger.send()` calls in brain methods
3. Add brain subscriptions to receive messages

---

### 4. Override Authority Not Wired ❌

**Problem:** ExecutionBrain has sendOverride() but it's not connected to cluster execution.

**v1.2 Spec Requires:**
```typescript
// ExecutionBrain supervises subagent
async function superviseSubagent(taskId: string) {
  if (outputsNotRetrieved) {
    const cmd = executionBrain.sendOverride({
      action: 'RETRIEVE_OUTPUTS',
      target: { taskId },
    });
    await executeOverride(cmd);
  }
}
```

**Current State:** ClusterInstance.executeOnAgent() runs independently.

**Fix Required:**
1. Add OutputVerifier checks in cluster execution
2. Wire ExecutionBrain.sendOverride() to cluster control
3. Add override result handling

---

### 5. Session Hook Issues ❌

**Problem:** `session.compacting` event type doesn't exist in OpenCode's hook system.

**Current (Broken):**
```typescript
// hooks/index.ts - line 72
if (event.type === 'session.compacting') {  // ❌ Never fires
```

**Fix Required:**
1. Remove session.compacting handler or use correct event type
2. Implement compaction context building differently

---

## HOW TO USE AS BOILERPLATE

### Step 1: Copy Working Components

```bash
# Copy cluster system (works)
cp -r src/clusters/ /your-project/src/clusters/

# Copy BrainMessenger (complete)
cp -r src/shared/brain-messenger.ts /your-project/src/shared/

# Copy subagent-manager (works)
cp -r subagent-manager/ /your-project/subagent-manager/
```

### Step 2: Start from NUKE_RELOAD v1.1

NUKE_RELOAD v1.1 has working cluster execution. Use it as base and add brain features incrementally.

```bash
# Base on NUKE_RELOAD v1.1
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Kraken\ Agent/Master\ Context/NUKE_RELOAD_v1.1_working/kraken-agent /your-project/kraken-agent
```

### Step 3: Add Brain Features Incrementally

**Phase 1: Add Shared State Store**
- Create `stateStore` with DOMAIN_OWNERSHIP
- Inject into all brain instances
- Test that brains can read/write shared state

**Phase 2: Add Brain Linking**
- Create messenger instance
- Call `linkBrain()` for each brain
- Add subscription handlers
- Test brain-to-brain messaging

**Phase 3: Wire Execution Overrides**
- Add OutputVerifier to cluster execution
- Connect ExecutionBrain.sendOverride() to cluster control
- Test abort/retry/reassign flows

**Phase 4: Add Session Hooks**
- Implement proper hook handlers
- Add context injection for session lifecycle

---

## FILE INVENTORY

### Source Structure

```
kraken-v2.0-boilerplate/
├── dist/index.js                    (526 KB) - Compiled plugin
├── src/
│   ├── index.ts                     (18 KB) - Main entry, agent registration
│   ├── clusters/
│   │   ├── ClusterInstance.ts       (11 KB) - ✅ WORKS: Real Docker spawning
│   │   └── ClusterManager.ts        (4 KB)  - ✅ WORKS: Cluster lifecycle
│   ├── factory/
│   │   ├── BrainFactory.ts          (3 KB)  - Brain creation from config
│   │   ├── BrainMessenger.ts        (9 KB)  - ⚠️ EXISTS: Not wired
│   │   ├── AsyncDelegationEngine.ts (7 KB) - Task queue + priority
│   │   ├── ClusterScheduler.ts       (5 KB) - Load balancing
│   │   └── kraken-types.ts          (5 KB) - Type definitions
│   ├── brains/
│   │   ├── planning/
│   │   │   └── planning-brain.ts    (6 KB)  - ⚠️ STUB: Methods exist, no wiring
│   │   ├── execution/
│   │   │   ├── execution-brain.ts   (6 KB)  - ⚠️ STUB: OutputVerifier exists
│   │   │   └── override-handler.ts  (8 KB)  - Override command execution
│   │   ├── council/
│   │   │   └── roundtable-council.ts (5 KB)  - ✅ WORKS: Alpha/Beta/Gamma defined
│   │   └── system/
│   │       ├── system-brain.ts      (6 KB)  - ⚠️ STUB: Guardian exists
│   │       ├── gate-manager.ts      (9 KB)  - Gate criteria management
│   │       ├── compaction-manager.ts (17 KB) - Session compaction
│   │       └── two-layer-guardian.ts (9 KB)  - Tool/message enforcement
│   ├── shared/
│   │   └── brain-messenger.ts       (9 KB)  - ✅ COMPLETE: Schema matches v1.2
│   ├── hooks/
│   │   └── index.ts                (18 KB)  - ❌ BROKEN: session.compacting
│   ├── kraken-hive/
│   │   └── index.ts                (6 KB)  - ✅ WORKS: Hive Mind integration
│   └── tools/
│       ├── cluster-tools.ts         - spawn_cluster_task, etc.
│       ├── monitoring-tools.ts      - get_cluster_status, etc.
│       └── kraken-hive-tools.ts     - kraken_hive_store, etc.
├── shark-agent/
│   └── dist/index.js               (556 KB) - Shark agent plugin
├── manta-agent/
│   └── dist/index.js               (155 KB) - Manta agent (embedded, smaller)
├── subagent-manager/
│   ├── dist/index.js               (945 KB) - ✅ WORKS: Container spawning
│   └── wrappers/
│       ├── opencode_agent.py       (21 KB) - Single container
│       └── container_pool.py       (18 KB) - Parallel pool
└── test-image/                    - Docker test image
```

---

## BUILD COMMAND

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-boilerplate
bun run build
```

Output: `dist/index.js` (526 KB)

---

## TEST IN CONTAINER

```bash
docker run --rm \
  -v /tmp/kraken-v2.0-test/config:/root/.config/opencode \
  -v /home/leviathan/.npm-global:/root/.npm-global \
  -e OPENCODE_CONFIG_DIR=/root/.config/opencode \
  node:20-bullseye \
  bash -c "ln -sf /root/.npm-global/bin/opencode /usr/local/bin/opencode && opencode debug config"
```

Expected output:
```
[SubAgentManager][INFO] OpenCodeSubagentManager v1.0.0 initializing {
  toolCount: 3,
  tools: [ "run_subagent_task", "run_parallel_tasks", "cleanup_subagents" ],
}
[v4.1][kraken-agent] Initializing Kraken Agent Harness {
  clusters: 3,
  agents: 11,
}
[v4.1][kraken-agent] Kraken Agent Harness initialized {
  clusterCount: 3,
  totalAgents: 11,
  krakenHiveReady: true,
}
```

---

## BRAIN CLASS API REFERENCE

### PlanningBrain

```typescript
class PlanningBrain {
  initialize(): void
  isInitialized(): boolean

  async loadT2Master(): Promise<void>
  isT2MasterLoaded(): boolean

  async generateT1(specPath?: string): Promise<{
    tasks: TaskSpec[];
    context: Record<string, unknown>;
  }>
  isT1Generated(): boolean

  async decomposeTasks(t1: {...}): Promise<TaskSpec[]>
  async designateDomains(tasks: TaskSpec[]): Promise<DomainMap>
}
```

### ExecutionBrain

```typescript
class ExecutionBrain {
  initialize(): void
  isInitialized(): boolean

  registerTaskOutputs(taskId: string, outputs: OutputSpec[]): void
  async claimOutputsRetrieved(taskId: string, hostPaths: string[]): Promise<void>
  canCompleteTask(taskId: string): boolean
  getOutputEvidence(taskId: string): Evidence

  sendOverride(params: OverrideParams): OverrideCommand
  async abortTask(taskId: string, reason: string): Promise<void>
  async enforceOutputRetrieval(taskId: string): Promise<void>
}
```

### SystemBrain

```typescript
class SystemBrain {
  initialize(): void
  isInitialized(): boolean

  recordDecision(decision: DecisionPoint): void
  getRecentDecisionPoints(): DecisionPoint[]

  recordTaskStart(taskId: string): void
  recordTaskComplete(taskId: string): void
  getCompletedTasks(): string[]

  checkTool(tool: string, args: Record<string, unknown>): void
  checkMessage(message: string): void

  getCurrentGate(): GateId | null
  evaluateGate(gateId: GateId, context: any): GateResult

  getCompactionContext(): CompactionContext
}
```

### CouncilCoordinator

```typescript
class CouncilCoordinator {
  initialize(): void

  getAlpha(): AlphaBrain  // Steamroll focus
  getBeta(): BetaBrain    // Precision focus
  getGamma(): GammaBrain  // Testing focus

  coordinateTask(task: TaskSpec): ClusterRecommendation
}
```

---

## COMPARISON: V1.2 SPEC VS BOILERPLATE

| v1.2 Requirement | Boilerplate Status | Fix Needed |
|-----------------|-------------------|------------|
| Shared state store with DOMAIN_OWNERSHIP | ❌ Not implemented | Create and inject |
| BrainMessenger with send/broadcast | ⚠️ Exists, not wired | Wire to brains |
| PlanningBrain owns planning-state | ⚠️ Internal state only | Connect to shared store |
| ExecutionBrain owns execution-state | ⚠️ Internal state only | Connect to shared store |
| SystemBrain owns workflow/security state | ⚠️ Internal state only | Connect to shared store |
| messenger.linkBrain() called | ❌ Not called | Add linking |
| Planning → Execution context-inject | ❌ Not implemented | Add messenger.send() |
| Execution → Subagent override | ⚠️ Method exists | Wire to cluster |
| Output retrieval enforced | ❌ Not implemented | Add OutputVerifier checks |
| Gate evaluation in hooks | ⚠️ Defined, not triggered | Fix hook registration |
| Session.compacting event | ❌ Wrong event type | Use correct type |

---

## KNOWN BUGS

1. **Hook event type wrong** - `session.compacting` doesn't exist
2. **Brain methods are stubs** - Return empty data, don't actually process
3. **No error handling** - Brain methods swallow errors
4. **No timeout on brain operations** - Could hang

---

## RELOAD ANCHOR

To reload this boilerplate after loss:

1. **Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-v2.0-boilerplate/`
2. **Key files:** `src/brains/`, `src/shared/brain-messenger.ts`, `src/clusters/`
3. **Dist:** `dist/index.js` (526 KB)
4. **Build:** `bun run build`

---

## RECOMMENDED DEVELOPMENT PATH

1. **Start:** NUKE_RELOAD v1.1 (working cluster execution)
2. **Add:** BrainMessenger from boilerplate
3. **Add:** Shared state store with DOMAIN_OWNERSHIP
4. **Add:** Brain classes (Planning, Execution, System, Council)
5. **Wire:** Brain linking and communication
6. **Test:** Override authority flow
7. **Deploy:** Functional multi-brain orchestrator

---

**END README**