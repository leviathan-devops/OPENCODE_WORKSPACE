# TRIDENT-KRAKEN INTEGRATION — TRIDENT MODES

**Version:** 1.0  
**Date:** 2026-04-13

---

## Mode-by-Mode Integration

### DEEP PLANNING MODE → Planning Brain

**Original Purpose:** Generate complete, injectable project plans from first principles

**Integration with Planning Brain:**
```
Planning Brain receives task
       ↓
Deep Planning Mode activates
       ↓
GATE 1: INITIAL PLAN
├── "What is the CORE problem?"
├── "What 3 principles govern this domain?"
└── "What would make this succeed or fail?"
       ↓
GATE 2: BUILD WORKFLOW
├── "5+ components identified"
├── "Critical path sequenced"
└── "3+ risks + verification per component"
       ↓
GATE 3: CONTEXT LIBRARY
└── Output: INJECTABLE REASONING CHAIN
                   ↓
            Execution Brain receives
            structured reasoning, not just
            task description
```

**Why This Fixes Planning Brain:**
Original Planning Brain just assigned tasks. Deep Planning Mode forces first-principles analysis and generates injectable reasoning.

---

### PROBLEM SOLVING MODE → Execution Brain

**Original Purpose:** Evidence-based debugging with 6-gate iteration loop

**Integration with Execution Brain:**
```
Execution Brain receives task
       ↓
Problem Solving Mode activates
       ↓
GATE 1: ASSUMPTION
"Task will complete and outputs will be retrievable"
       ↓
GATE 2: ACTION
"spawn_subagent_task with output declarations"
       ↓
GATE 3: OBSERVATION
"Show fs.existsSync() for each output"
       ↓
GATE 4: GAP ANALYSIS
"If missing, why? What does gap tell?"
       ↓
GATE 5: META-REFLECTION
"What should have been done differently?"
       ↓
GATE 6: VERIFICATION
"Execute claimRetrieved() - prove it"
       ↓
Output: VERIFIED COMPLETION or EVIDENCE OF FAILURE
```

**Why This Fixes Execution Brain:**
Original Execution Brain had fire-and-forget pattern. Problem Solving Mode forces evidence-based iteration. Cannot skip verification.

---

### CODE REVIEW MODE → System Brain

**Original Purpose:** Static analysis with 25+ self-contained detectors

**Integration with System Brain:**
```
Before any task execution:
       ↓
Code Review Mode runs
       ↓
LAYER 1: Structure Map
├── Bundle size analysis
├── Entry points
└── Version diff
       ↓
LAYER 2: Execution Verification ← PRIMARY
├── SimulatedExecutionDetector (catches 100ms fake)
├── PlaceholderCommentDetector
├── BundleSizeDetector (flag <50% reduction)
└── DeadCodeDetector
       ↓
LAYER 3: Security Analysis
├── SQLInjection, XSS, CommandInjection
├── HardcodedSecret, PathTraversal
       ↓
LAYER 4: Architecture Analysis
├── HookSpilloverDetector (catches Manta V4.5 issue)
├── AgentIsolationDetector
├── GlobalStateDetector
       ↓
LAYER 5: Quality Analysis
├── MemoryLeak, TokenBloat
├── EmptyCatch, SilentFailure
       ↓
Result: PRE-VALIDATION REPORT
        ↓
If SIMULATED EXECUTION detected:
        → ABORT deployment
        → Flag for fix
        ↓
If passed:
        → Continue to Two-Layer Guardian
        → Execute task
```

**Why This Fixes System Brain:**
Original System Brain had Two-Layer Guardian but no pre-execution validation. Code Review Mode catches simulated execution BEFORE deployment.

---

### CONTEXT SYNTHESIS MODE → Context Engine

**Original Purpose:** Dynamic synthesis of T1/T2/T3/T4 context into <2k token injection

**Integration with Context Engine:**
```
During active problem-solving:
       ↓
Context Synthesis Mode runs
       ↓
LAYER 1: COLLECTION
├── T1: Session state (gate, task, brain state)
├── T2: Knowledge (hermes_remember, hive_context)
├── T3: Files (recent changes)
└── T4: Tools (recent commands)
       ↓
LAYER 2: SCORING
├── Urgency × 0.6 + Importance × 0.4
├── Current task blocker = 10
├── Gate transition pending = 8
       ↓
LAYER 3: COMPRESSION
├── Deduplicate
├── Summarize
└── Target: <2k tokens
       ↓
LAYER 4: INJECTION
└── T0-ready stream:
    [CURRENT_GATE] [ACTIVE_TASK] [CONTEXT_HINTS]
```

**Why This Fixes Context Engine:**
Original Context Engine had four-tier compaction but was disconnected. Context Synthesis Mode integrates as active layer during problem-solving.

---

## Mode Activation Triggers

| Mode | Trigger | Deactivate When |
|------|---------|-----------------|
| Deep Planning | Planning Brain receives task | GATE 3 complete, injectable chain generated |
| Problem Solving | Execution Brain receives task | GATE 6 complete, outputs verified |
| Code Review | Before any task execution | All 5 layers pass OR critical failure detected |
| Context Synthesis | Token budget >65% OR decision point | <2k tokens injected |

---

## Mode Output Contracts

### Deep Planning Output:
```typescript
interface DeepPlanningOutput {
  coreProblem: string;
  principles: string[];
  successCriteria: string[];
  components: Component[];
  criticalPath: string[];
  risks: Risk[];
  verification: VerificationStep[];
  injectableChain: string;
}
```

### Problem Solving Output:
```typescript
interface ProblemSolvingOutput {
  assumption: string;
  prediction: string;
  evidence: Evidence[];
  gapAnalysis: string;
  metaReflection: string;
  verified: boolean;
  checkpointsVerified: string[];
}
```

### Code Review Output:
```typescript
interface CodeReviewOutput {
  passed: boolean;
  blockers: Block[];
  warnings: Warning[];
  suggestions: Suggestion[];
  structureMap: StructureMap;
  executionVerification: ExecutionVerification;
}
```

### Context Synthesis Output:
```typescript
interface ContextSynthesisOutput {
  injection: string;  // <2k tokens
  sources: string[];
  score: number;
  injectionType: 'gate_transition' | 'task_blocker' | 'token_budget';
}
```

---

## Mode Conflict Resolution

**Scenario:** Code Review Mode detects SIMULATED EXECUTION but Execution Brain has task in progress.

**Resolution:**
1. System Brain pauses Execution Brain
2. Code Review Mode reports BLOCKER
3. Planning Brain re-activates Deep Planning to fix
4. Once fixed, Code Review Mode re-validates
5. Execution Brain resumes

**No bypass allowed.** Evidence-based, not trust-based.