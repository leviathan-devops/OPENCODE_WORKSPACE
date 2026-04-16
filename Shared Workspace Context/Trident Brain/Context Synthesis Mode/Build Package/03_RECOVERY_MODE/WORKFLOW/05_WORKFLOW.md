# Workflow — Recovery Mode

## Execution Sequence

### Step 1: Mode Selection

**When:** Trigger received
**What:** Determine if Recovery or Injection mode
**Who:** RecoveryModeSelector

```
IF trigger IN ['compaction', 'crash', 'recover-session']
  → SELECT Recovery MODE
ELSE
  → SELECT Injection MODE
```

### Step 2: Interruption Detection (Phase 1)

**When:** Recovery mode selected
**What:** Locate the interruption point
**Who:** InterruptionDetector

1. Parse pre/post compaction artifacts
2. Find the gap in session messages
3. Identify last known state (timestamp, message, tool call)
4. Assess recovery feasibility
5. Classify interruption type (COMPACTION, CRASH, MANUAL, UNKNOWN)

**Detection Heuristics:**

| Signal | Interruption Type |
|--------|-------------------|
| `session.compacted.md` exists | COMPACTION |
| `session-*.md` truncated | CRASH |
| Gap in timestamps > threshold | UNKNOWN |
| Last message ends mid-sentence | COMPACTION |
| Last message = tool result | CRASH |

### Step 3: Tool Sequence Analysis (Phase 2)

**When:** Interruption point located
**What:** Recover thought stream from tool patterns
**Who:** ToolSequenceAnalyzer

1. Collect last 10-30 tool calls
2. Match against known patterns:
   - `read(A) → write(A)` → Analyze-Edit
   - `read(A) → read(B) → write(A)` → Compare-Edit
   - `test → test → test` → Debug-Loop
   - etc.
3. Build action chain (what was being done)
4. Infer reasoning chain (what was being thought)

### Step 4: Intent Inference (Phase 2 continued)

**When:** Tool analysis complete
**What:** Parse last message for intent signals
**Who:** IntentInferrer

1. Get last message content
2. Match against intent patterns:
   - "About to X" → IMMINENT_ACTION
   - "Now I'll X" → PLANNED_ACTION
   - "I need to X" → RECOGNIZED_REQUIREMENT
   - Trailing code → INCOMPLETE_CODE
3. Extract pending action with confidence

### Step 5: Working Memory Recovery (Phase 2 continued)

**When:** Intent inference complete
**What:** Recover what was loaded in agent's mind
**Who:** WorkingMemoryRecoverer

1. Extract files from tool calls (read operations)
2. Identify data structures referenced
3. Extract decisions from reasoning chain
4. Build working memory model

### Step 6: Cognitive Snapshot Generation (Phase 3)

**When:** All Phase 2 components complete
**What:** Assemble CognitiveSnapshot
**Who:** CognitiveSnapshotGenerator

1. Build stream narrative (human-readable story)
2. Compile reasoning chain
3. Compile action chain
4. Compile pending actions
5. Identify incomplete code/thought
6. Calculate overall confidence score

### Step 7: Verification (Phase 4)

**When:** CognitiveSnapshot generated
**What:** Cross-reference with reality
**Who:** VerificationEngine

1. For each claimed file: Check FILE_EXISTS
2. For each claimed action: Check TIMESTAMP
3. Flag conflicts (claimed vs actual)
4. Calculate final confidence

### Step 8: Output

**When:** All phases complete
**What:** Produce ContextInjection with recovery data
**Who:** RecoveryModeCoordinator

```
OUTPUT:
  - CognitiveSnapshot
  - InterruptionPoint
  - ThoughtStream
  - VerificationResult
  - Confidence scores
```

## Critical Path

```
Trigger
   │
   ▼
Mode Selection ─────────────────────────────────┐
   │                                           │
   ▼ (Recovery)                                ▼ (Injection)
Interruption Detection                          [Existing Injection Flow]
   │
   ▼
Tool Sequence Analysis
   │
   ▼
Intent Inference
   │
   ▼
Working Memory Recovery
   │
   ▼
Cognitive Snapshot Generation
   │
   ▼
Verification
   │
   ▼
Output: ContextInjection + recoveryData
```

## Key Milestones

| Milestone | Criteria |
|-----------|----------|
| M1: Detection | Correctly identifies compaction vs crash |
| M2: Pattern Recognition | Tool patterns matched with >80% accuracy |
| M3: Intent Inference | Last message intent extracted |
| M4: Snapshot Generation | CognitiveSnapshot assembled |
| M5: Verification | Cross-reference complete with confidence |
| M6: Integration | Works with existing Context Synthesis trigger system |

## Timing Constraints

| Phase | Target Time |
|-------|-------------|
| Detection | <100ms |
| Tool Analysis | <200ms |
| Intent Inference | <100ms |
| Working Memory | <100ms |
| Snapshot Generation | <200ms |
| Verification | <300ms |
| **Total** | **<1 second** |

## Quality Gates

1. **Detection Gate:** InterruptionPoint with feasibility != NONE
2. **Collection Gate:** ThoughtStream with at least reasoningChain OR actionChain
3. **Synthesis Gate:** CognitiveSnapshot with confidenceScore >= 0.5
4. **Verification Gate:** verificationResult.finalConfidence calculated