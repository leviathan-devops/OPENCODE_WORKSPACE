# Components — Recovery Mode

## Component 1: Interruption Detector

- **Purpose:** Locate the interruption point in session
- **Inputs:** Pre/post compaction artifacts, session state
- **Outputs:** `InterruptionPoint` with timestamp, type, last known state
- **Boundaries:** Detection only, no recovery

**Responsibilities:**
- Detect compaction vs crash vs manual
- Find the gap in session
- Identify last known state
- Assess recovery feasibility

## Component 2: Tool Sequence Analyzer

- **Purpose:** Recover thought stream from tool call patterns
- **Inputs:** Recent tool calls (last 10-30 calls)
- **Outputs:** `ThoughtStream` with reasoning/action/intent chains
- **Boundaries:** Pattern analysis only, no inference

**Tool Patterns Recognized:**

| Pattern | Sequence | Meaning |
|---------|----------|---------|
| Analyze-Edit | `read(A) → write(A)` | Had A loaded, about to modify |
| Compare-Edit | `read(A) → read(B) → write(A)` | Comparing A and B before editing A |
| Re-Read | `read(A) → read(A)` | Confused, re-reading |
| Create-Test | `write(A) → test` | Just created A, testing |
| Debug | `test → test → test` | Debugging loop |
| Search-Edit | `read → grep → read → edit` | Finding spot to edit |

## Component 3: Intent Inferrer

- **Purpose:** Parse last message for "about to" patterns
- **Inputs:** Last message content
- **Outputs:** `IntentFragment[]` with type, content, confidence
- **Boundaries:** Pattern matching only

**Intent Patterns:**

| Pattern | Example | Confidence |
|---------|---------|------------|
| IMMINENT_ACTION | "About to write to user.ts" | 0.9 |
| PLANNED_ACTION | "Now I'll add the field" | 0.85 |
| RECOGNIZED_REQUIREMENT | "I need to add validation" | 0.7 |
| INTENDED_ACTION | "I'm going to run tests" | 0.8 |
| INCOMPLETE_CODE | Trailing code block | 0.95 |

## Component 4: Working Memory Recoverer

- **Purpose:** Recover what was loaded in agent's mind
- **Inputs:** Tool call history, session state
- **Outputs:** `WorkingMemory` with files, data, concepts
- **Boundaries:** Recovery only, no inference

**What Gets Recovered:**
- Files recently read (with line numbers if available)
- Data structures loaded
- Decisions made
- Concepts being considered

## Component 5: Cognitive Snapshot Generator

- **Purpose:** Assemble all recovered data into coherent snapshot
- **Inputs:** InterruptionPoint, ThoughtStream, WorkingMemory
- **Outputs:** `CognitiveSnapshot`
- **Boundaries:** Assembly only

**Output Structure:**
```typescript
interface CognitiveSnapshot {
  recoveredAt: number;
  interruptionTimestamp: number;
  gapDuration: number;
  lastKnownPosition: Position;
  streamNarrative: string;
  reasoningChain: string[];
  actionChain: string[];
  pendingActions: PendingAction[];
  workingMemory: WorkingMemory;
  incompleteCode: string | null;
  incompleteThought: string | null;
  confidenceScore: number;
  uncertainElements: string[];
  verifiedElements: string[];
}
```

## Component 6: Verification Engine

- **Purpose:** Cross-reference recovery with reality
- **Inputs:** CognitiveSnapshot, filesystem state
- **Outputs:** `VerificationResult` with verified/unverified claims
- **Boundaries:** Verification only, no recovery

**Verification Methods:**
- `FILE_EXISTS` — Check if file exists
- `TIMESTAMP` — Check if modification happened after interruption
- `CONTENT_MATCH` — Check if content matches claim

## Component 7: Recovery Mode Selector

- **Purpose:** Choose between Injection and Recovery mode
- **Inputs:** SynthesisRequest
- **Outputs:** `SynthesisMode`
- **Boundaries:** Selection only

**Trigger Mapping:**
| Trigger | Mode |
|---------|------|
| `manual` | INJECTION |
| `gate` | INJECTION |
| `error` | INJECTION |
| `compaction` | RECOVERY |
| `crash` | RECOVERY |
| `recover-session` | RECOVERY |

## Data Flow

```
Session Artifacts
      │
      ▼
┌─────────────────┐
│ Interruption    │ ← Detects gap type
│ Detector        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Tool Sequence    │ ← Analyzes tool patterns
│ Analyzer        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Intent          │ ← Parses last message
│ Inferrer        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Working Memory  │ ← Recovers loaded context
│ Recoverer       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cognitive       │ ← Assembles snapshot
│ Snapshot Gen    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verification    │ ← Cross-references reality
│ Engine          │
└────────┬────────┘
         │
         ▼
   CognitiveSnapshot
```