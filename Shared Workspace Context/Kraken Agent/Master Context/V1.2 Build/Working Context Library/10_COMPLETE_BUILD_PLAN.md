# Complete Build Plan — Phase-by-Phase

## Phase 0: Preparation

### 0.1: Read Context Files
- [ ] `00_INDEX.md` — Entry point
- [ ] `01_ARCHITECTURE_OVERVIEW.md` — System structure
- [ ] `02_CURRENT_STATE.md` — What works, what's missing
- [ ] `03_PATTERNS_REFERENCE.md` — All L0-L7 patterns
- [ ] `04_IMPLEMENTATION_GUIDE.md` — Code patterns
- [ ] `05_TESTING_WORKFLOWS.md` — How to test
- [ ] `06_V1.2_MULTI_BRAIN_INTEGRATION.md` — Brain wiring
- [ ] `07_BUILD_PLAN_PARALLEL.md` — Parallel execution plan
- [ ] `08_SUCCESS_CRITERIA.md` — Ship requirements
- [ ] `09_FULL_LAYER_BUILD_SPEC.md` — Complete specifications

### 0.2: Create v1.2 Directory Structure
```bash
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/src/{brains/{planning,execution,system/firewall,council},shared,hooks}
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/kraken-context
mkdir -p /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2/dist
```

### 0.3: Initialize Project
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2
npm init -y
bun add @opencode-ai/plugin zod
```

---

## Phase 1: Shared Infrastructure

### 1.1: Domain Ownership State Store
**File:** `src/shared/domain-ownership.ts`
```typescript
export const DOMAIN_OWNERSHIP = {
  'planning-state':   ['kraken-planning', 'kraken-system'],
  'execution-state':  ['kraken-execution', 'kraken-system'],
  'thinking-state':   ['kraken-reasoning', 'kraken-system'],
  'context-bridge':   ['kraken-planning'],
  'workflow-state':   ['kraken-system', 'kraken-execution'],
  'security-state':   ['kraken-system'],
  'quality-state':     ['kraken-execution', 'kraken-system'],
  'container-state':   ['kraken-subagent'],
  'execution-queue':   ['kraken-subagent', 'kraken-execution'],
  'alpha-state':       ['alpha-execution', 'alpha-system'],
  'beta-state':        ['beta-reasoning', 'beta-system'],
  'gamma-state':       ['gamma-system', 'gamma-execution'],
};
```

### 1.2: State Store Implementation
**File:** `src/shared/state-store.ts`
- Domain ownership rules
- Read/write permissions
- State snapshots

### 1.3: Brain Messenger
**File:** `src/shared/brain-messenger.ts`
- Priority messaging (critical/high/normal/low)
- Message queuing
- Ack tracking

### 1.4: Evidence Collector
**File:** `src/shared/evidence-collector.ts`
- Gate evidence storage
- File-based evidence
- Verification helpers

---

## Phase 2: System Brain

### 2.1: Firewall Layers
**Files:** `src/brains/system/firewall/*.ts`

| File | Layer | Patterns |
|------|-------|----------|
| `l0-identity.ts` | L0 | 5 (Kraken identity) |
| `l1-orchestration-theater.ts` | L1 | 8 |
| `l2-false-completion.ts` | L2 | 12 |
| `l3-output-inspection.ts` | L3 | 10 |
| `l4-wrong-cluster.ts` | L4 | 6 |
| `l5-macro-derailment.ts` | L5 | 50+ |
| `l6-kraken-protection.ts` | L6 | 3 zones |
| `l7-coordination-gates.ts` | L7 | 3 gates |

### 2.2: Gate Manager
**File:** `src/brains/system/gate-manager.ts`
- Gate evaluation
- Criteria checking
- Evidence verification

### 2.3: System Brain
**File:** `src/brains/system/system-brain.ts`
- Coordinates all firewall layers
- Real-time derailment detection
- Escalation handling

---

## Phase 3: Planning Brain

### 3.1: T2 Master Context
**File:** `src/brains/planning/t2-master-context.ts`
- Shark T2 patterns (pre-loaded)
- Kraken orchestrator extensions
- Always available, never lost

### 3.2: T1 Generator
**File:** `src/brains/planning/context-generator.ts`
- Reads SPEC.md
- Generates T1 from project files
- Dynamic, SPEC-driven

### 3.3: Planning Brain
**File:** `src/brains/planning/planning-brain.ts`
- Owns planning-state, context-bridge
- Task decomposition
- Council direction

---

## Phase 4: Execution Brain

### 4.1: Subagent Supervisor
**File:** `src/brains/execution/subagent-supervisor.ts`
- Override authority
- Mistake catching
- Momentum tracking

### 4.2: Execution Brain
**File:** `src/brains/execution/execution-brain.ts`
- Owns execution-state, quality-state
- Direct execution
- Error recovery

---

## Phase 5: Roundtable Council

### 5.1: Alpha Brain
**File:** `src/brains/council/alpha-cluster.ts`
- Steamroll focus
- Execution sub-brain lead

### 5.2: Beta Brain
**File:** `src/brains/council/beta-cluster.ts`
- Precision focus
- Reasoning sub-brain lead

### 5.3: Gamma Brain
**File:** `src/brains/council/gamma-cluster.ts`
- Testing focus
- System sub-brain lead

---

## Phase 6: Subagent Integration

### 6.1: Output Retrieval Enforcement
- retrieve_outputs must happen
- Verify host filesystem
- L2 false completion blocking

### 6.2: Override Authority
- Execution Brain can override subagent
- Autonomous with supervision
- Override triggers defined

---

## Phase 7: Integration

### 7.1: Main Entry
**File:** `src/index.ts`
- Wire all brains
- Initialize state store
- Register tools

### 7.2: Tools
- Brain control tools (status, gate, evidence)
- Cluster tools (spawn, anchor, status)
- Execution tools

### 7.3: Hooks
- Guardian hook (L0-L7 enforcement)
- Output retrieval hook
- Council state hook

---

## Phase 8: Testing

### 8.1: Build
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/kraken-agent-v1.2
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

### 8.2: Deploy
```bash
cp dist/index.js ~/.config/opencode/plugins/kraken-agent-v1.2/dist/
```

### 8.3: Host Test
```bash
opencode run "kraken-status" --agent kraken
```

### 8.4: Container Test
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'kraken-status' --agent kraken"
```

---

## Verification Checklist

| Criteria | Test |
|----------|------|
| Kraken loads | Check tab toggle |
| L0 blocks | write_file to kraken path from vanilla |
| L1 blocks | Claim "done" without retrieval |
| L2 blocks | Task complete without outputs |
| L4 blocks | Debug → Alpha |
| L5 blocks | Focus collision |
| L6 blocks | Modify SYSTEM zone |
| L7 blocks | Gate not passed |
| Output retrieval | Verify file on host |
| Context generation | SPEC.md → T1 |

---
*Last Updated: 2026-04-12*