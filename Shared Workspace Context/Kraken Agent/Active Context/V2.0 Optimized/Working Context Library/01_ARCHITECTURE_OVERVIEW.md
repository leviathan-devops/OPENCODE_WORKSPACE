# KRAKEN V2.0 — ARCHITECTURE OVERVIEW

**Version:** 2.0  
**Date:** 2026-04-12  
**Based on:** V1.2 + First-Hand Experience from Shark Agent v4.8.3 Firewall Build

---

## Executive Summary

V2.0 builds on V1.2's triple-brain architecture with **6 critical optimizations** discovered through first-hand experience building the Shark Agent v4.8.3 firewall system:

1. **Two-Layer Firewall** — Tool enforcement + Message enforcement
2. **Mechanical Output Verification** — Not trust-based, fs.existsSync() checkpoint
3. **Structured Override Commands** — Not natural language, typed schema
4. **Explicit Gate Entry Criteria** — Each brain declares satisfied criteria
5. **Interpretation Verification** — Inter-cluster messages verified, not assumed
6. **Dynamic Context Management** — Four-tier compaction system for stream preservation

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         KRAKEN V2.0 ORCHESTRATOR                             │
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│  │  PLANNING   │────────▶│  EXECUTION  │◀────────│   SYSTEM    │            │
│  │   BRAIN     │         │   BRAIN    │         │   BRAIN     │            │
│  │             │         │            │         │             │            │
│  │ owns:       │         │ owns:      │         │ owns:      │            │
│  │ planning-   │         │ execution- │         │ workflow-  │            │
│  │ state       │         │ state      │         │ state      │            │
│  │ context-    │         │ quality-   │         │ security-  │            │
│  │ bridge      │         │ state      │         │ state      │            │
│  └──────┬─────┘         └──────┬─────┘         └──────┬─────┘            │
│         │                       │                       │                   │
│         └───────────────────────┼───────────────────────┘                   │
│                                 │                                           │
│                     ┌───────────┴───────────┐                              │
│                     │   BRAIN MESSENGER     │                              │
│                     │   (Structured Schema)  │                              │
│                     └───────────┬───────────┘                              │
│                                 │                                           │
│  ┌─────────────────────────────┼─────────────────────────────────────┐   │
│  │                             │                                       │   │
│  ▼                             ▼                                       ▼     │
│ ┌─────────────┐         ┌─────────────┐         ┌─────────────┐           │
│ │   ALPHA     │         │    BETA     │         │   GAMMA     │           │
│ │  CLUSTER    │◀──────▶│  CLUSTER    │◀──────▶│  CLUSTER    │           │
│ │  BRAIN      │         │  BRAIN      │         │  BRAIN      │           │
│ │             │         │             │         │             │           │
│ │ Lead: Exec  │         │ Lead: Reason│         │ Lead: System│           │
│ │ Focus:      │         │ Focus:      │         │ Focus:      │           │
│ │ Steamroll   │         │ Precision   │         │ Testing     │           │
│ └─────────────┘         └─────────────┘         └─────────────┘           │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    SUBAGENT-MANAGER                                   │  │
│  │  Owns: container-state, execution-queue                               │  │
│  │  Can Override: false (asks permission)                                │  │
│  │                                                                       │  │
│  │  ⚡ MECHANICAL OUTPUT VERIFICATION ⚡                                 │  │
│  │  Every output declared must exist on host filesystem                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │               SYSTEM BRAIN — DYNAMIC CONTEXT MANAGEMENT                │  │
│  │                                                                       │  │
│  │  TIER 0: PROACTIVE TOKEN MANAGEMENT                                  │  │
│  │  • Monitor token budget continuously                                  │  │
│  │  • Dynamic pruning of low-value context                              │  │
│  │  • Prevents compaction, not just survives it                          │  │
│  │                                                                       │  │
│  │  TIER 1: PRE-COMPACTION EXPORT                                       │  │
│  │  • Triggered at 65% tokens                                           │  │
│  │  • Export: Chat history + Decision points + Brain state               │  │
│  │  • Captures everything before it's lost                              │  │
│  │                                                                       │  │
│  │  TIER 2: POST-COMPACTION SYNTHESIS                                   │  │
│  │  • Synthesize injection file from pre-compaction state                │  │
│  │  • Combines: Critical files + Last 100 lines + Decision chain        │  │
│  │  • Restores stream of consciousness                                  │  │
│  │                                                                       │  │
│  │  TIER 3: DYNAMIC CONTEXT INJECTION                                   │  │
│  │  • System Brain detects decision points                               │  │
│  │  • Injects relevant T1 context with algorithmic frameworks            │  │
│  │  • Facilitates thinking patterns (implementation/testing/debugging)   │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## V2.0 Key Optimizations (vs V1.2)

### Optimization 1: Two-Layer Firewall

**V1.2 Problem:** System Brain watches `tool.execute.before` only. But agents interpret messages naturally and may not call tools directly.

**V2.0 Solution:**
```typescript
interface SystemBrainHooks {
  // Layer 1: Tool enforcement (current)
  'tool.execute.before': ToolEnforcement;
  
  // Layer 2: Message enforcement (NEW)
  'chat.message': MessageEnforcement;
}
```

**Why:** First-hand experience showed guardian-hook.ts (155 patterns) passed all unit tests but failed at runtime because agents responded naturally instead of calling blocked tools.

---

### Optimization 2: Mechanical Output Verification

**V1.2 Problem:** Subagent-Manager "must retrieve outputs" was a behavioral rule, not mechanical enforcement. Trust-based.

**V2.0 Solution:**
```typescript
// Instead of trust-based:
if (subagent.reportsComplete()) return true;

// Use mechanical verification:
interface OutputCheckpoint {
  containerPath: string;
  hostPath: string;
  verified: boolean;
}

function verifyOutputs(outputs: OutputCheckpoint[]): void {
  for (const output of outputs) {
    if (!fs.existsSync(output.hostPath)) {
      throw new Error(
        `L2_OUTPUT_NOT_RETRIEVED: ${output.containerPath} → ${output.hostPath}`
      );
    }
    output.verified = true;
  }
}
```

**Why:** Task completion ≠ outputs on host filesystem. First-hand experience: spawned tasks reported success, but outputs trapped in container.

---

### Optimization 3: Structured Override Commands

**V1.2 Problem:** Override messages were natural language. Subagent could misinterpret.

**V2.0 Solution:**
```typescript
// Structured override schema
interface OverrideCommand {
  type: 'OVERRIDE';
  action: OverrideAction;
  target: {
    brainId: string;
    taskId?: string;
  };
  payload: Record<string, unknown>;
  constraints?: {
    requiresEvidence?: string[];
    evidenceCheck?: string;
  };
  priority: 'critical' | 'high';
}

type OverrideAction = 
  | 'ABORT'
  | 'CLAIM_COMPLETE' 
  | 'REASSIGN'
  | 'RETRIEVE_OUTPUTS'
  | 'RETRY';
```

**Why:** Natural language overrides could be misinterpreted. Structured commands eliminate ambiguity.

---

### Optimization 4: Explicit Gate Entry Criteria

**V1.2 Problem:** "Sync at gates" assumed all brains knew when a gate was reached. No explicit criteria.

**V2.0 Solution:**
```typescript
// Gate entry criteria per brain
interface GateCriteria {
  gateId: 'PLAN' | 'BUILD' | 'TEST' | 'VERIFY' | 'AUDIT' | 'DELIVERY';
  
  planningBrain?: {
    completed: string[];  // e.g., ['T1_generated', 'tasks_decomposed']
  };
  
  executionBrain?: {
    completed: string[];  // e.g., ['build_complete', 'containers_ready']
  };
  
  systemBrain?: {
    completed: string[];  // e.g., ['firewall_passed', 'evidence_collected']
  };
}

// Gate only advances when ALL criteria met
function evaluateGateEntry(criteria: GateCriteria): boolean {
  const planning = criteria.planningBrain?.every(c => planningBrain.hasCompleted(c));
  const execution = criteria.executionBrain?.every(c => executionBrain.hasCompleted(c));
  const system = criteria.systemBrain?.every(c => systemBrain.hasCompleted(c));
  
  return planning && execution && system;
}
```

**Why:** Brains running in parallel need explicit criteria to know when gate is reached.

---

### Optimization 5: Interpretation Verification

**V1.2 Problem:** Inter-cluster messages assumed interpretation was correct. No verification.

**V2.0 Solution:**
```typescript
// Message interpretation verification
interface VerifiedMessage {
  id: string;
  from: string;
  to: string;
  rawContent: string;
  parsedIntent: ParsedIntent | null;
  verified: boolean;
  verificationError?: string;
}

function parseAndVerify(message: string): VerifiedMessage {
  // Structured message format
  const parsed = tryParseStructured(message);
  
  if (parsed.success) {
    return { ...parsed, verified: true };
  }
  
  // Fallback: natural language interpretation
  const intent = interpretIntent(message);
  
  if (intent.confidence < 0.8) {
    return {
      id: generateId(),
      verified: false,
      verificationError: `Low confidence: ${intent.confidence}`
    };
  }
  
  return { ...intent, verified: true };
}
```

**Why:** Same issue as firewall — messages can be interpreted many ways.

---

## Core Components

### 1. Brains (V2.0)

| Brain | Role | V2.0 Enhancement |
|-------|------|-------------------|
| **Planning** | T2 Master, T1 Gen, Task Decomp | Explicit gate criteria |
| **Execution** | Supervisor, Override Authority | Structured override commands |
| **System** | Firewall, Gates, Derailment | **Two-layer enforcement** |

### 2. Roundtable Council (Same as V1.2)

| Cluster | Lead | Focus |
|---------|------|-------|
| Alpha | Execution | Steamroll builds |
| Beta | Reasoning | Precision tasks |
| Gamma | System | Testing |

### 3. Subagent-Manager (V2.0)

| Enhancement | Description |
|-------------|-------------|
| Output Checkpoints | Every output tracked with host path verification |
| Structured Claims | Task completion uses typed schema |
| Evidence Required | Must provide fs.existsSync() proof |

---

## Context Layers (T0/T1/T2) — Unchanged

```
T0: Active Working Context (session messages, tool calls)
T1: Active Project Context (SPEC.md, project files)
T2: Master Context (Shark T2 + Kraken extensions)
```

---

## Domain Ownership (Same as V1.2)

```typescript
const DOMAIN_OWNERSHIP = {
  'planning-state':   ['kraken-planning', 'kraken-system'],
  'execution-state':  ['kraken-execution', 'kraken-system'],
  'thinking-state':   ['kraken-reasoning', 'kraken-system'],
  'context-bridge':   ['kraken-planning'],
  'workflow-state':   ['kraken-system', 'kraken-execution'],
  'security-state':   ['kraken-system'],
  'quality-state':    ['kraken-execution', 'kraken-system'],
  'container-state':   ['kraken-subagent'],
  'execution-queue':  ['kraken-subagent', 'kraken-execution'],
  'alpha-state':      ['alpha-execution', 'alpha-system'],
  'beta-state':       ['beta-reasoning', 'beta-system'],
  'gamma-state':      ['gamma-system', 'gamma-execution'],
};
```

---

## V2.0 Files

| File | Purpose |
|------|---------|
| `01_ARCHITECTURE_OVERVIEW.md` | This file — system structure + V2.0 optimizations |
| `02_CURRENT_STATE.md` | V1.2 state vs V2.0 target |
| `03_PATTERNS_REFERENCE.md` | L0-L8 orchestration patterns |
| `04_IMPLEMENTATION_GUIDE.md` | Step-by-step with V2.0 code examples |
| `05_TESTING_WORKFLOWS.md` | Testing + evidence collection |
| `06_TWO_LAYER_FIREWALL.md` | **NEW:** Tool + Message enforcement spec |
| `07_MECHANICAL_OUTPUT_VERIFICATION.md` | **NEW:** Output checkpoint system |
| `08_STRUCTURED_OVERRIDE_COMMANDS.md` | **NEW:** Override command schema |
| `09_EXPLICIT_GATE_CRITERIA.md` | **NEW:** Gate entry criteria spec |
| `10_GOLDEN_BEHAVIOR_V2.md` | **UPDATED:** Behavioral rules with V2.0 |
| `11_COMPACTION_MANAGEMENT.md` | **NEW:** Four-tier context management system |
| `12_INCIDENT_ANALYSIS.md` | **UPDATED:** First-hand lessons |
| `13_SUCCESS_CRITERIA.md` | V2.0 ship gate requirements |
| `14_COMPLETE_BUILD_PLAN.md` | Phase-by-phase V2.0 build |
| `CHANGELOG_V1.2_to_V2.0.md` | **NEW:** What changed and why |

---

## Key Differences: V1.2 vs V2.0

| Aspect | V1.2 | V2.0 |
|--------|------|------|
| Firewall | Tool-based only | Tool + Message layers |
| Output verification | Trust-based | Mechanical fs.existsSync() |
| Override commands | Natural language | Structured typed schema |
| Gate sync | "Sync at gates" | Explicit per-brain criteria |
| Message interpretation | Assumed correct | Verified with confidence |
| Unit tests | Pattern matching | Pattern + integration |

---

## Why V2.0

These optimizations came from **first-hand experience** building the Shark Agent v4.8.3 firewall:

1. **155 patterns passed unit tests** — Regex matched strings correctly
2. **0/N blocked at runtime** — Agents responded naturally, didn't call tools
3. **Task completion ≠ outputs retrieved** — Had to explicitly retrieve
4. **Message interpretation varies** — Same message, different agent understanding

V2.0 addresses these with mechanical enforcement where possible.

---

*End of Architecture Overview*
