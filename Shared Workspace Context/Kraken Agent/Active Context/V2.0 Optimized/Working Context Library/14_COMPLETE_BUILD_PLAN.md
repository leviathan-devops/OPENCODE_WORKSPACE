# COMPLETE BUILD PLAN — Kraken V2.0

## Phase 0: Preparation

### 0.1: Read Context Files
- [ ] `01_ARCHITECTURE_OVERVIEW.md` — System structure + V2.0 optimizations
- [ ] `02_CURRENT_STATE.md` — V1.2 vs V2.0 differences
- [ ] `06_TWO_LAYER_FIREWALL.md` — Tool + Message enforcement
- [ ] `07_MECHANICAL_OUTPUT_VERIFICATION.md` — Output checkpoint system
- [ ] `08_STRUCTURED_OVERRIDE_COMMANDS.md` — Override schema
- [ ] `09_EXPLICIT_GATE_CRITERIA.md` — Gate criteria spec
- [ ] `10_GOLDEN_BEHAVIOR_V2.md` — Behavioral rules
- [ ] `11_COMPACTION_MANAGEMENT.md` — Four-tier compaction

### 0.2: Create Project Structure
```bash
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v2.0/src/{brains/{planning,execution,system, council},shared,hooks}
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v2.0/kraken-context
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v2.0/dist
```

### 0.3: Initialize Project
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v2.0
npm init -y
bun add @opencode-ai/plugin zod
```

---

## Phase 1: Shared Infrastructure

### 1.1: Domain Ownership State Store
**File:** `src/shared/domain-ownership.ts`

### 1.2: State Store
**File:** `src/shared/state-store.ts`

### 1.3: Brain Messenger (Structured Schema)
**File:** `src/shared/brain-messenger.ts`

### 1.4: Evidence Collector
**File:** `src/shared/evidence-collector.ts`

### 1.5: Output Verifier (NEW)
**File:** `src/shared/output-verifier.ts`
```typescript
class OutputVerifier {
  checkpoints: Map<string, OutputCheckpoint[]>;
  registerOutputs(taskId, outputs);
  claimRetrieved(taskId, paths);
  canComplete(taskId): boolean;
}
```

---

## Phase 2: System Brain Core

### 2.1: Two-Layer Guardian (NEW)
**File:** `src/brains/system/two-layer-guardian.ts`
```typescript
interface SystemBrainHooks {
  'tool.execute.before': ToolEnforcement;
  'chat.message': MessageEnforcement;  // NEW
}
```

### 2.2: Tool Guardian (Existing pattern)
**File:** `src/brains/system/tool-guardian.ts`

### 2.3: Message Guardian (NEW)
**File:** `src/brains/system/message-guardian.ts`

### 2.4: Message Pattern Sets (NEW)
**File:** `src/brains/system/message-patterns.ts`
```typescript
const THEATRICAL_MESSAGE_PATTERNS = [...];
const FAKE_COMPLETION_MESSAGE_PATTERNS = [...];
const HOST_FALLBACK_MESSAGE_PATTERNS = [...];
```

### 2.5: Gate Manager (Enhanced)
**File:** `src/brains/system/gate-manager.ts`
```typescript
interface GateCriteria {
  gateId: GateId;
  planningBrain: { completed: string[]; evidence: EvidenceRequirement[] };
  executionBrain: { completed: string[]; evidence: EvidenceRequirement[] };
  systemBrain: { completed: string[]; evidence: EvidenceRequirement[] };
}
```

### 2.6: System Brain
**File:** `src/brains/system/system-brain.ts`

---

## Phase 3: Compaction Management (NEW)

### 3.1: Token Budget Monitor
**File:** `src/brains/system/compaction/token-monitor.ts`
```typescript
// Thresholds calibrated to OpenCode auto-compaction at 85%
warningThreshold: 0.65;        // Light cleanup
preCompactionThreshold: 0.75; // Pre-compaction export
compactionAnchor: 0.85;        // AUTO-COMPACTION
```

### 3.2: Compaction Event Detector
**File:** `src/brains/system/compaction/event-detector.ts`
```typescript
interface CompactionEvent {
  timestamp: Date;
  decisionPoints: DecisionPoint[];
  brainState: BrainState;
}
```

### 3.3: Pre-Compaction Exporter
**File:** `src/brains/system/compaction/pre-exporter.ts`
```typescript
interface CompactionExport {
  chatExport: ChatExport;
  contextExport: ContextExport;
  decisionsExport: DecisionExport;
  brainStateExport: BrainStateExport;
}
```

### 3.4: Post-Compaction Synthesizer
**File:** `src/brains/system/compaction/post-synthesizer.ts`
```typescript
interface InjectionFile {
  streamAnchor: string;
  situationSummary: string;
  criticalFiles: CriticalFile[];
  recentChat: string;
  decisionContext: string;
  nextSteps: string;
}
```

### 3.5: Dynamic Context Injector
**File:** `src/brains/system/compaction/context-injector.ts`
```typescript
// Phase detection + context library lookup + algorithmic frameworks
interface ExecutionPhase {
  'implementation' | 'testing' | 'building' | 'debugging';
}
```

### 3.6: Context Library
**File:** `src/brains/system/compaction/context-library.ts`
```typescript
interface ContextFile {
  id: string;
  phase: ExecutionPhase;
  taskTypes: TaskType[];
  content: string;
  priority: number;
}
```

---

## Phase 4: Execution Brain

### 4.1: Execution Brain
**File:** `src/brains/execution/execution-brain.ts`

### 4.2: Override Command Handler (NEW)
**File:** `src/brains/execution/override-commands.ts`
```typescript
interface OverrideCommand {
  type: 'OVERRIDE';
  action: 'ABORT' | 'CLAIM_COMPLETE' | 'RETRIEVE_OUTPUTS' | 'REASSIGN';
  constraints?: { requiresEvidence: string[] };
}

interface OverrideResponse {
  status: 'acknowledged' | 'executing' | 'completed' | 'rejected' | 'failed';
}
```

### 4.3: Subagent Manager Integration
**File:** `src/brains/execution/subagent-manager.ts`

---

## Phase 5: Planning Brain

### 5.1: Planning Brain
**File:** `src/brains/planning/planning-brain.ts`

### 5.2: T1 Generator
**File:** `src/brains/planning/t1-generator.ts`

### 5.3: Task Decomposer
**File:** `src/brains/planning/task-decomposer.ts`

---

## Phase 6: Roundtable Council

### 6.1: Alpha Brain
**File:** `src/brains/council/alpha-brain.ts`

### 6.2: Beta Brain
**File:** `src/brains/council/beta-brain.ts`

### 6.3: Gamma Brain
**File:** `src/brains/council/gamma-brain.ts`

### 6.4: Council Coordinator
**File:** `src/brains/council/coordinator.ts`

---

## Phase 7: Integration

### 7.1: Hook Registration
**File:** `src/hooks/index.ts`
```typescript
export function createKrakenHooks(): Hooks {
  return {
    'session.created': createSessionHook(),
    'chat.message': createMessageHook(),
    'tool.execute.before': createToolGuardianHook(),
    'tool.execute.after': createGateHook(),
  };
}
```

### 7.2: Main Index
**File:** `src/index.ts`

---

## Phase 8: Testing

### 8.1: Unit Tests

#### Tool Guardian Tests
```typescript
const toolTests = [
  { name: 'grep | wc blocks', expect: { blocked: true, layer: 'TOOL' } },
  { name: 'legitimate grep allowed', expect: { blocked: false } },
];
```

#### Message Guardian Tests (NEW)
```typescript
const messageTests = [
  { name: '"just grep" theatrical blocks', expect: { blocked: true, layer: 'MESSAGE' } },
  { name: 'legitimate message allowed', expect: { blocked: false } },
];
```

#### Output Verifier Tests (NEW)
```typescript
const outputTests = [
  { name: 'All outputs verified → can complete', setup, expect: true },
  { name: 'Output not on host → throws', setup, expect: throws('L2_OUTPUT_NOT_RETRIEVED') },
];
```

#### Override Command Tests (NEW)
```typescript
const overrideTests = [
  { name: 'Valid abort command', command: validAbortCmd, expect: { status: 'completed' } },
  { name: 'Missing evidence → rejected', command: missingEvidenceCmd, expect: { status: 'rejected' } },
];
```

#### Gate Criteria Tests (NEW)
```typescript
const gateTests = [
  { name: 'All criteria met → advance', criteria, expect: true },
  { name: 'Missing evidence → blocked', criteria, expect: { blockers: [...] } },
];
```

### 8.2: Container Tests

#### Two-Layer Firewall Test
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  -c "opencode run 'shark-status' --agent kraken"
```

#### Compaction Recovery Test
```bash
# Fill context to 85%, trigger auto-compaction
# Verify POST-COMPACTION-INJECTION.md created
# Verify stream of consciousness restored
```

---

## Phase 9: Documentation

### 9.1: README.md
### 9.2: API Documentation
### 9.3: Deployment Guide

---

## Build Commands

```bash
# Build
cd /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v2.0
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Deploy
cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v2.0/dist/

# Test
opencode run "kraken-status" --agent kraken
```

---

## Timeline Estimate

| Phase | Hours | Cumulative |
|-------|-------|------------|
| Phase 0: Prep | 1 | 1 |
| Phase 1: Shared | 2 | 3 |
| Phase 2: System Brain | 4 | 7 |
| Phase 3: Compaction | 4 | 11 |
| Phase 4: Execution | 2 | 13 |
| Phase 5: Planning | 2 | 15 |
| Phase 6: Council | 3 | 18 |
| Phase 7: Integration | 2 | 20 |
| Phase 8: Testing | 4 | 24 |
| Phase 9: Docs | 1 | 25 |

**Total: ~25 hours (6-day build at 4 hours/day)**

---

*End of Build Plan*