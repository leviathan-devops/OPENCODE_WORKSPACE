# SHARK AGENT V4 — Build Workflow Reference

**Purpose:** T2 reference for step-by-step build methodology
**Usage:** Loaded on-demand via read_file, zero prompt overhead

---

## Shark Micro Workflow (Dual-Brain Sequential)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SHARK MICRO BUILD FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER PROMPT                                                             │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 0: INITIALIZATION                                            │  │
│  │                                                                    │  │
│  │ 1. shark micro init {project} --template {type}                   │  │
│  │    → Generate shark-context/ at project root                     │  │
│  │    → Load Plan Brain T1                                           │  │
│  │    → Load Build Brain T1                                          │  │
│  │    → Initialize .shark/ state directory                           │  │
│  │    → Configure Guardian zones                                      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 1: PLAN (Plan Brain active, Build Brain idle)              │  │
│  │                                                                    │  │
│  │ Plan Brain:                                                        │  │
│  │  1. Parse user intent                                             │  │
│  │  2. Load appropriate template (web-app, api-service, etc.)        │  │
│  │  3. Generate SPEC.md with:                                          │  │
│  │     - Project name, description                                    │  │
│  │     - Functional requirements                                     │  │
│  │     - Acceptance criteria                                         │  │
│  │     - Critical path                                                │  │
│  │     - Gate definitions                                             │  │
│  │  4. Define scope boundaries (Guardian zones)                     │  │
│  │  5. Write plan to .shark/plan.md                                  │  │
│  │                                                                    │  │
│  │ Coordinator detects: spec-complete                                 │  │
│  │   → FLIP SWITCH                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 2: BUILD (Build Brain active, Plan Brain idle)             │  │
│  │                                                                    │  │
│  │ Build Brain (T1 only — no reasoning):                            │  │
│  │  1. Read SPEC.md from Plan Brain output                           │  │
│  │  2. Execute exactly what SPEC.md specifies                        │  │
│  │  3. Guardian blocks scope violations                              │  │
│  │  4. Write files, run commands as specified                        │  │
│  │  5. Report execution-state to Coordinator                         │  │
│  │                                                                    │  │
│  │ Coordinator detects: build-complete                                │  │
│  │   → FLIP SWITCH                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 3: REVIEW (Plan Brain active, Build Brain idle)            │  │
│  │                                                                    │  │
│  │ Plan Brain:                                                        │  │
│  │  1. Verify Build output matches SPEC.md                           │  │
│  │  2. Run Gate 3 (Test): verify tests pass                         │  │
│  │  3. Run Gate 4 (Build): verify compiles                          │  │
│  │  4. Run Gate 5 (Review): security checks                         │  │
│  │  5. If any gate fails:                                            │  │
│  │     → Send to Build Brain with specific fix instructions          │  │
│  │     → Coordinator flips back to Build Brain                       │  │
│  │     → Loop until all gates pass                                   │  │
│  │                                                                    │  │
│  │ Coordinator detects: all-gates-passed                              │  │
│  │   → Proceed to delivery                                            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 4: DELIVERY                                                  │  │
│  │                                                                    │  │
│  │ Plan Brain:                                                        │  │
│  │  1. Gate 6 (Delivery): archive evidence                           │  │
│  │  2. Create checkpoint (.shark/checkpoints/)                       │  │
│  │  3. Generate delivery summary                                      │  │
│  │  4. Notify completion                                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      ▼                                                                   │
│  COMPLETE                                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Shark Macro Workflow (Triple-Brain Parallel)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SHARK MACRO BUILD FLOW                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER PROMPT                                                             │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ PHASE 0: INITIALIZATION                                            │  │
│  │                                                                    │  │
│  │ 1. shark macro init {project} --template {type}                   │  │
│  │    → Generate shark-context/                                       │  │
│  │    → Load Execution Brain T1 (primary)                             │  │
│  │    → Load Reasoning Brain T1 + T2 (floating)                      │  │
│  │    → Load System Brain T1 + T2 (watchdog)                         │  │
│  │    → Initialize StateStore with domain ownership                   │  │
│  │    → Initialize BrainMessenger                                     │  │
│  │    → Configure Guardian                                            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ALL THREE BRAINS START RACING                                      │  │
│  │                                                                    │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │ EXECUTION       │  │ REASONING       │  │ SYSTEM          │   │  │
│  │  │ BRAIN           │  │ BRAIN           │  │ BRAIN           │   │  │
│  │  │                 │  │                 │  │                 │   │  │
│  │  │ Steamrolls      │  │ Monitors for    │  │ Watches for     │   │  │
│  │  │ the build       │  │ context gaps     │  │ derailments     │   │  │
│  │  │                 │  │                 │  │                 │   │  │
│  │  │ Owns:          │  │ Owns:          │  │ Owns:          │   │  │
│  │  │ execution-    │  │ thinking-      │  │ workflow-      │   │  │
│  │  │ state         │  │ state          │  │ state          │   │  │
│  │  │                 │  │                 │  │                 │   │  │
│  │  │ Reads:        │  │ Reads:        │  │ Reads:        │   │  │
│  │  │ plan-state    │  │ ALL (RO)      │  │ ALL (RO)      │   │  │
│  │  │ thinking-     │  │                 │  │                 │   │  │
│  │  │ state (from   │  │                 │  │                 │   │  │
│  │  │ Reasoning)     │  │                 │  │                 │   │  │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │  │
│  │           │                    │                    │            │  │
│  │           ▼                    ▼                    ▼            │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                    STATE STORE                              │  │  │
│  │  │  (Domain Ownership + Read-Only Observation)               │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ THE RACE                                                          │  │
│  │                                                                    │  │
│  │ Execution Brain races in execution-state:                          │  │
│  │  → Reads SPEC.md from plan-state                                  │  │
│  │  → Writes files, runs commands                                     │  │
│  │  → Updates execution-state as work completes                       │  │
│  │  → Checks thinking-state for injected context                     │  │
│  │  → Responds to priority messages from System Brain                │  │
│  │                                                                    │  │
│  │ Reasoning Brain races in thinking-state:                           │  │
│  │  → Reads execution-state (observes Execution working)              │  │
│  │  → Detects context gaps (Execution needs something it lacks)      │  │
│  │  → Gets T2 from knowledge base                                    │  │
│  │  → Synthesizes relevant context                                   │  │
│  │  → Injects into thinking-state (Execution reads next)             │  │
│  │  → Auto-debug: catches error patterns, applies fixes               │  │
│  │                                                                    │  │
│  │ System Brain races in workflow-state:                              │  │
│  │  → Reads all states (observes both brains)                        │  │
│  │  → Detects derailments (scope violations, premature done)          │  │
│  │  → Evaluates gate criteria                                         │  │
│  │  → If gate fails: sends priority message → Execution pauses       │  │
│  │  → If derailment: applies real-time fix                           │  │
│  │  → If stuck: triggers escalation                                   │  │
│  │                                                                    │  │
│  │ NO BRAIN WAITS FOR ANOTHER                                        │  │
│  │ All three advance in their own domain simultaneously               │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      ▼                                                                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ GATE SYNCHRONIZATION (only blocking point)                        │  │
│  │                                                                    │  │
│  │ System Brain evaluates gate criteria:                             │  │
│  │  → If criteria NOT met: BLOCK phase transition                    │  │
│  │  → Execution Brain keeps working in execution-state               │  │
│  │  → Reasoning Brain keeps synthesizing                             │  │
│  │  → All three race until criteria are met                          │  │
│  │                                                                    │  │
│  │  When criteria ARE met:                                           │  │
│  │  → Gate opens                                                      │  │
│  │  → All three proceed to next phase                                 │  │
│  │  → Continue racing                                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│      │                                                                   │
│      (Loop through all 6 gates)                                        │
│      │                                                                   │
│      ▼                                                                   │
│  DELIVERY                                                                │
│      │                                                                   │
│      ▼                                                                   │
│  COMPLETE                                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Gate-by-Gate Execution

### Gate 1: Architect

```
INPUT: User prompt
OUTPUT: SPEC.md, Guardian configured

MICRO:
  Plan Brain:
    1. Parse user intent
    2. Generate SPEC.md
    3. Configure Guardian zones
    4. Write to .shark/plan.md
  Evidence: SPEC.md

MACRO:
  Execution Brain: Writes SPEC.md to plan-state
  Reasoning Brain: Provides context for spec generation
  System Brain: Verifies spec completeness
  Evidence: SPEC.md, Guardian config
```

### Gate 2: Coding

```
INPUT: SPEC.md
OUTPUT: Implementation files

MICRO:
  Build Brain:
    1. Read SPEC.md
    2. Create directory structure
    3. Implement files exactly as specified
    4. Guardian blocks scope violations
  Evidence: File list, git diff

MACRO:
  Execution Brain: Writes files, owns execution-state
  Reasoning Brain: Injects context when gaps detected
  System Brain: Watches for scope violations
  Evidence: File list, execution-state snapshot
```

### Gate 3: Test

```
INPUT: Implementation
OUTPUT: Passing tests, coverage report

MICRO:
  Plan Brain triggers Build Brain:
    1. Generate tests per spec
    2. Run test suite
    3. Verify coverage ≥ 80%
    4. Block on weak assertions (toBeTruthy)
  Evidence: Test output, coverage report

MACRO:
  Execution Brain: Runs tests, owns quality-state
  Reasoning Brain: Auto-debug on test failures
  System Brain: Verifies coverage floor
  Evidence: Test output, coverage report, quality-state
```

### Gate 4: Build

```
INPUT: Tests passing
OUTPUT: Clean build artifact

MICRO:
  Plan Brain triggers Build Brain:
    1. Compile/lint/type-check
    2. Verify zero errors
    3. Produce artifact
  Evidence: Build output, lint report

MACRO:
  Execution Brain: Runs build, updates quality-state
  Reasoning Brain: Debug on build failures
  System Brain: Verifies build cleanliness
  Evidence: Build output, lint report
```

### Gate 5: Review

```
INPUT: Clean build
OUTPUT: Security-verified

MICRO:
  Plan Brain:
    1. SAST scan
    2. Secrets scan
    3. Dependency audit
    4. Zero tolerance on critical/high
  Evidence: Scan reports, audit results

MACRO:
  Execution Brain: Produces scan inputs
  Reasoning Brain: Analyzes scan results
  System Brain: Evaluates security-state, blocks if critical
  Evidence: SAST report, secrets scan, dependency audit
```

### Gate 6: Delivery

```
INPUT: Security-verified build
OUTPUT: Shipped artifact, evidence archived

MICRO/MACRO:
  1. Archive all evidence to .shark/evidence/
  2. Create git checkpoint
  3. Generate delivery summary
  4. Mark task complete
  Evidence: Checkpoint ref, delivery summary, all gate evidence
```

---

## Error Handling

### Auto-Debug Flow (60% of errors fixed automatically)

```
Error occurs in execution-state
         │
         ▼
Reasoning Brain detects error pattern
         │
         ▼
Match against known error signatures
         │
    ┌────┴────┐
    │ Match?  │
    └────┬────┘
      Yes │ No
         │  │
         ▼  ▼
   Auto-fix  Escalate to human
         │
         ▼
   Apply fix to execution-state
         │
         ▼
   Report to Execution Brain
         │
         ▼
   Execution continues
```

### Escalation Flow

```
Derailment detected OR Auto-debug failed
         │
         ▼
System Brain formats escalation
         │
         ▼
Block further execution
         │
         ▼
Send to human with:
  - Issue summary
  - Severity
  - Evidence
  - Recommended action
         │
         ▼
Human resolves
         │
         ▼
Execution resumes
```

---

*Build Workflow Reference*
*Shark Agent V4 — T2 Reference*
