# TRIDENT-KRAKEN INTEGRATION — ARCHITECTURE

**Version:** 1.0  
**Date:** 2026-04-13  
**Type:** Layer 3 Self-Contained Context Library

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           TRIDENT-ENHANCED KRAKEN V2.0 ORCHESTRATOR                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    PLANNING BRAIN                                        │ │
│  │                         ↓                                               │ │
│  │              TRIDENT DEEP PLANNING MODE                                  │ │
│  │                                                                          │ │
│  │  GATE 1: INITIAL PLAN                                                    │ │
│  │  └── First principles, core problem, success criteria                    │ │
│  │                                                                          │ │
│  │  GATE 2: BUILD WORKFLOW                                                  │ │
│  │  └── 5+ components, critical path, risks, verification                  │ │
│  │                                                                          │ │
│  │  GATE 3: CONTEXT LIBRARY                                                 │ │
│  │  └── Injectable reasoning chain → Execution Brain                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │               SYSTEM BRAIN                                               │ │
│  │                         ↓                                               │ │
│  │              TRIDENT CODE REVIEW MODE (Pre-Validation)                   │ │
│  │                                                                          │ │
│  │  Layer 1: Structure Map (bundle size, entry points)                      │ │
│  │  Layer 2: Execution Verification ← CATCHES SIMULATED EXECUTION           │ │
│  │  Layer 3: Security Analysis                                              │ │
│  │  Layer 4: Architecture Analysis                                          │ │
│  │  Layer 5: Quality Analysis                                               │ │
│  │                         ↓                                                │ │
│  │              TWO-LAYER GUARDIAN (Original V2.0)                          │ │
│  │  ├── Layer 1: tool.execute.before                                        │ │
│  │  └── Layer 2: chat.message                                               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    ↓                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │               EXECUTION BRAIN                                             │ │
│  │                         ↓                                                │ │
│  │              TRIDENT PROBLEM SOLVING MODE                                 │ │
│  │                                                                          │ │
│  │  G1: Assumption (what will succeed, why)                                 │ │
│  │  G2: Action (exact command, expected output)                            │ │
│  │  G3: Observation (ACTUAL evidence, raw output)                           │ │
│  │  G4: Gap Analysis (what gap tells, adjust hypothesis)                    │ │
│  │  G5: Meta-Reflection (what to do differently?)                          │ │
│  │  G6: Verification (prove fix worked, no regression)                      │ │
│  │                         ↓                                                │ │
│  │              MECHANICAL OUTPUT VERIFICATION (Original V2.0)               │ │
│  │  └── registerOutputs() → claimRetrieved() → canComplete()               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════════  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │               CONTEXT ENGINE                                             │ │
│  │                         ↓                                                │ │
│  │              TRIDENT CONTEXT SYNTHESIS MODE                              │ │
│  │                                                                          │ │
│  │  L1: Collection (T1-T4 sources)                                         │ │
│  │  L2: Scoring (urgency × 0.6 + importance × 0.4)                         │ │
│  │  L3: Compression (<2k tokens)                                           │ │
│  │  L4: Injection (T0-ready stream)                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │               ROUNDTABLE COUNCIL                                         │ │
│  │                                                                          │ │
│  │  Alpha Brain → Deep Planning Mode (steamroll focus)                      │ │
│  │  Beta Brain → Problem Solving Mode (precision focus)                       │ │
│  │  Gamma Brain → Context Synthesis Mode (testing focus)                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Brain-by-Brain Architecture

### PLANNING BRAIN — Deep Planning Mode

**Role:** Generate injectable reasoning chain, not just task descriptions

**3-Gate Structure:**
```
GATE 1: INITIAL PLAN
├── Core problem identification (not symptoms)
├── First principles analysis (3+ non-negotiable principles)
├── Success criteria defined upfront
└── Open questions identified

GATE 2: BUILD WORKFLOW
├── 5+ component decomposition
├── Critical path sequencing
├── 3+ failure risks identified
└── Verification strategy per component

GATE 3: CONTEXT LIBRARY
├── Architecture documented
├── Interfaces specified
├── State management defined
└── Output: INJECTABLE REASONING CHAIN for Execution Brain
```

**Output Format:**
```typescript
interface PlanningBrainOutput {
  coreProblem: string;
  principles: string[];
  successCriteria: string[];
  components: Component[];
  criticalPath: string[];
  risks: Risk[];
  verification: VerificationStep[];
  injectableChain: string; // Full reasoning for Execution
}
```

---

### SYSTEM BRAIN — Code Review Mode + Two-Layer Guardian

**Role:** Pre-execution validation + runtime enforcement

**Code Review Mode (Pre-Validation):**
```
Layer 1: Structure Map
├── Bundle size analysis (flag <50% vs previous)
├── Entry point detection
├── Version diff analysis
└── File size anomalies

Layer 2: Execution Verification ← PRIMARY FIX
├── SimulatedExecutionDetector
│   └── Regex: `setTimeout.*resolve.*success`
├── PlaceholderCommentDetector
│   └── Regex: `// In v1, we just return success`
├── BundleSizeDetector
├── DeadCodeDetector
└── StubFunctionDetector

Layer 3: Security Analysis
├── SQLInjectionDetector
├── XSSDetector
├── CommandInjectionDetector
├── HardcodedSecretDetector
└── PathTraversalDetector

Layer 4: Architecture Analysis
├── HookSpilloverDetector
├── AgentIsolationDetector
├── GlobalStateDetector
└── ImportCycleDetector

Layer 5: Quality Analysis
├── MemoryLeakDetector
├── TokenBloatDetector
├── EmptyCatchDetector
└── SilentFailureDetector
```

**Two-Layer Guardian (Runtime - Original V2.0):**
```
Layer 1: tool.execute.before
└── Blocks dangerous tools based on pattern matching

Layer 2: chat.message (NEW)
└── Blocks dangerous intent in messages to agents
```

---

### EXECUTION BRAIN — Problem Solving Mode

**Role:** Evidence-based iteration, no fire-and-forget

**6-Gate Evidence Loop:**
```
GATE 1: ASSUMPTION STATEMENT
├── Explicit assumption: "Task will complete, outputs will be retrievable"
├── Reasoning chain: WHY I believe this
├── Success criteria: How I know task succeeded
└── Disproof condition: What would prove this wrong

GATE 2: ACTION WITH PREDICTION
├── Exact command: spawn_subagent_task with output declarations
├── Expected output: declared file paths on host
├── Environment state: versions, config
└── Observation point: what I'll check to verify

GATE 3: OBSERVATION & EVIDENCE
├── Raw output captured (not paraphrased)
├── fs.existsSync() for each declared output
├── Expected vs Actual table
└── Logs checked for side effects

GATE 4: GAP ANALYSIS
├── If outputs missing: WHY?
├── What does gap tell about hypothesis?
├── Adjusted understanding
└── Next action tied to insight

GATE 5: META-REFLECTION
├── Pattern extraction from iteration
├── Systemic issue identification
└── What should have been done differently?

GATE 6: VERIFICATION
├── Execute claimRetrieved()
├── Prove outputs exist mechanically
└── Confirm no regression
```

**Mechanical Output Verification:**
```typescript
interface OutputCheckpoint {
  taskId: string;
  containerPath: string;
  hostPath: string;
  verified: boolean;
  verifiedAt?: Date;
}

class OutputVerifier {
  registerOutputs(taskId, outputs)  // BEFORE task
  claimRetrieved(taskId, paths)     // fs.existsSync() required
  canComplete(taskId): boolean       // ALL checkpoints verified
}
```

---

### CONTEXT ENGINE — Context Synthesis Mode

**Role:** Active context injection, not just compaction survival

**4-Layer Injection Engine:**
```
LAYER 1: COLLECTION
├── T1: Session state (gate, task, brain state)
├── T2: Knowledge context (hermes_remember, hive_context)
├── T3: File context (recent files, changes)
└── T4: Tool context (recent commands, patterns)

LAYER 2: SCORING
├── Urgency Score (0-10):
│   ├── Current task blocker = 10
│   ├── Gate transition pending = 8
│   ├── Active debugging = 7
│   ├── Recent error = 6
│   └── Stale context = 1
├── Importance Score (0-10):
│   ├── Decision point = 10
│   ├── Pattern from memory = 8
│   ├── Config/architecture = 7
│   └── Documentation = 3
└── Final = (Urgency × 0.6) + (Importance × 0.4)

LAYER 3: COMPRESSION
├── Deduplicate
├── Summarize
└── Target: <2k tokens

LAYER 4: INJECTION
└── T0-ready stream with sections:
    [CURRENT_GATE] [ACTIVE_TASK] [CONTEXT_HINTS]
```

---

### ROUNDTABLE COUNCIL — Multi-Mode

**Role:** Each brain operates in its native Trident mode

```
Alpha Brain → Deep Planning Mode
└── Focus: "Build this fast"
└── Output: Steamroll reasoning chain

Beta Brain → Problem Solving Mode
└── Focus: "Why is this broken?"
└── Output: Evidence-based debugging chain

Gamma Brain → Context Synthesis Mode
└── Focus: "What context do I need?"
└── Output: Dynamic injection requests
```

---

## State Management

```typescript
interface TridentKrakenState {
  planningBrain: {
    currentGate: 'INITIAL_PLAN' | 'BUILD_WORKFLOW' | 'CONTEXT_LIBRARY';
    iterationDepth: number;
    outputReady: boolean;
  };
  executionBrain: {
    currentGate: 1 | 2 | 3 | 4 | 5 | 6;
    checkpoints: OutputCheckpoint[];
    assumption: string;
    prediction: string;
  };
  systemBrain: {
    codeReviewComplete: boolean;
    preValidationPassed: boolean;
    twoLayerGuardianActive: boolean;
  };
  contextEngine: {
    lastInjection: string;
    tokenBudget: number;
    nextInjectionThreshold: number;
  };
  council: {
    alphaMode: 'deep_planning';
    betaMode: 'problem_solving';
    gammaMode: 'context_synthesis';
  };
}
```

---

## File Structure

```
TRIDENT_KRAKEN_INTEGRATION/
├── 00_INDEX.md                    # This file - navigation
├── 01_ARCHITECTURE.md             # This file - full architecture
├── 02_PROBLEMS_ANALYSIS.md        # Problem decomposition
├── 03_TRIDENT_MODES.md            # Mode integration details
├── 04_BRAIN_INTEGRATION.md        # Brain implementation specs
├── 05_COUNCIL_RECONFIG.md         # Council reconfiguration
├── 06_CONTEXT_ENGINE.md           # Context synthesis integration
├── 07_IMPLEMENTATION_PHASES.md    # Implementation priority
├── 08_EXECUTION_TEMPLATES.md      # Coding templates
└── EXECUTION_HANDOFF.md           # Injectable reasoning chain
```

---

## Key Principles

1. **Trident modes are DEPTH, not phases** — Each mode deepens understanding
2. **Evidence over trust** — Cannot claim success without proof
3. **Structural requirements** — Must think about X, not write Y chars
4. **Injectable output** — Artifacts designed for other agents to consume
5. **Mechanical gates** — Cannot advance without satisfying requirements