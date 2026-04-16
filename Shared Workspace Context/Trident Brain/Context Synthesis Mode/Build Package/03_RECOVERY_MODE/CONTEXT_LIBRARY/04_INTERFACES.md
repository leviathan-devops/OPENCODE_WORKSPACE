# Interfaces — Recovery Mode

## Core Types

```typescript
// Recovery Mode activation
type SynthesisMode = 'INJECTION' | 'RECOVERY';

interface SynthesisRequest {
  mode?: SynthesisMode;
  trigger?: 'manual' | 'gate' | 'error' | 'compaction' | 'crash' | 'recover-session';
  recoveryTarget?: SessionContext;
  context?: {
    gate?: string;
    task?: string;
    blockers?: string[];
  };
}
```

## Phase 1: Interruption Detection

```typescript
interface InterruptionPoint {
  timestamp: number;
  type: 'COMPACTION' | 'CRASH' | 'MANUAL' | 'UNKNOWN';
  lastMessageId: string;
  lastToolCall: ToolCall | null;
  incompleteAction: IncompleteAction | null;
  gapDuration: number;  // Seconds between last state and now
  recoveryFeasibility: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
}

interface ToolCall {
  tool: string;
  path?: string;
  timestamp: number;
  success: boolean;
}

interface IncompleteAction {
  action: string;      // "write", "edit", "test", etc.
  target: string;      // File path or resource
  details: string;    // Specifics of the action
  code?: string;      // If applicable
}
```

## Phase 2: Thought Stream Recovery

```typescript
interface ThoughtStream {
  reasoningChain: ReasoningFragment[];
  actionChain: ActionFragment[];
  intentChain: IntentFragment[];
  workingMemory: WorkingMemory;
}

interface ReasoningFragment {
  type: 'ANALYSIS' | 'UNDERSTANDING' | 'DECISION' | 'CONFUSION';
  content: string;
  confidence: number;
  source: 'TOOL_PATTERN' | 'LAST_MESSAGE' | 'SESSION_STATE';
}

interface ActionFragment {
  tool: string;
  path?: string;
  description: string;
  timestamp: number;
  type: 'READ' | 'WRITE' | 'EDIT' | 'EXEC' | 'SEARCH';
}

interface IntentFragment {
  type: 'IMMINENT_ACTION' | 'PLANNED_ACTION' | 'RECOGNIZED_REQUIREMENT' | 'INTENDED_ACTION' | 'INCOMPLETE_CODE';
  content: string;
  confidence: number;
  source: string;  // Original text snippet
}

interface WorkingMemory {
  filesOpen: FileContext[];
  dataLoaded: string[];
  conceptsActive: string[];
  decisionsMade: Decision[];
}

interface FileContext {
  path: string;
  lines?: string;      // Line range if known
  lastRead: number;     // Timestamp
}

interface Decision {
  decision: string;
  rationale: string;
  timestamp: number;
}
```

## Phase 3: Cognitive Snapshot

```typescript
interface CognitiveSnapshot {
  recoveredAt: number;
  interruptionTimestamp: number;
  gapDuration: number;

  lastKnownPosition: {
    gate: string;
    taskId: string;
    fileBeingEdited: string | null;
    lineNumber: number | null;
  };

  streamNarrative: string;      // "I was analyzing X, about to do Y"
  reasoningChain: string[];       // ["Reading A to understand B", ...]
  actionChain: string[];         // ["read user.ts", "read auth.ts", ...]

  pendingActions: PendingAction[];
  pendingDecisions: string[];

  workingMemory: {
    filesOpen: string[];
    dataLoaded: string[];
    conceptsActive: string[];
  };

  incompleteCode: string | null;
  incompleteThought: string | null;

  confidenceScore: number;
  uncertainElements: string[];
  verifiedElements: string[];
}

interface PendingAction {
  action: string;
  target: string;
  details: string;
  code?: string;
  confidence: number;
}
```

## Phase 4: Verification

```typescript
interface VerificationResult {
  canVerify: boolean;
  verifiedClaims: VerifiedClaim[];
  unverifiedClaims: UnverifiedClaim[];
  conflictsDetected: Conflict[];
  finalConfidence: number;
}

interface VerifiedClaim {
  claim: string;
  evidence: string[];
  verificationMethod: 'FILE_EXISTS' | 'TIMESTAMP' | 'CONTENT_MATCH';
}

interface UnverifiedClaim {
  claim: string;
  reason: string;
}

interface Conflict {
  type: 'CLAIM_VS_REALITY' | 'CLAIM_VS_TIMESTAMP' | 'MUTUAL_EXCLUSION';
  description: string;
  claimed: string;
  actual: string;
}
```

## Integration with Context Synthesis

```typescript
interface ContextInjection {
  timestamp: string;
  sessionId: string;
  mode: 'INJECTION' | 'RECOVERY';

  currentPosition: {
    gate: string;
    task: string;
    blockers: string[];
  };

  priorities: Priority[];
  injectedKnowledge: string;
  activeFiles: string[];
  executionPatterns: string[];
  synthesizedInsight: string;

  // Recovery-specific (populated when mode=RECOVERY)
  recoveryData?: {
    cognitiveSnapshot: CognitiveSnapshot;
    interruptionPoint: InterruptionPoint;
    streamReconstruction: ThoughtStream;
    verificationResult: VerificationResult;
  };
}
```

## Tool Pattern Recognition

```typescript
type ToolPattern =
  | 'ANALYZE_EDIT'      // read(A) → write(A)
  | 'COMPARE_EDIT'      // read(A) → read(B) → write(A)
  | 'REREAD'             // read(A) → read(A)
  | 'CREATE_TEST'        // write(A) → test
  | 'DEBUG_LOOP'         // test → test → test
  | 'SEARCH_EDIT'        // read → grep → read → edit
  | 'MULTI_EDIT'         // edit → edit → edit
  | 'RESEARCH'           // read → read → read (no writes)
  | 'UNKNOWN';

interface ToolPatternMatch {
  pattern: ToolPattern;
  confidence: number;
  interpretation: string;  // Human-readable interpretation
  inferredThought: string; // "Was analyzing A before modifying it"
}
```

## Confidence Scores

```typescript
const CONFIDENCE_LEVELS = {
  EXACT: { min: 0.95, max: 1.0, use: 'Use as-is' },
  HIGH: { min: 0.85, max: 0.94, use: 'Use with minor note' },
  MEDIUM: { min: 0.70, max: 0.84, use: 'Use with caution' },
  LOW: { min: 0.50, max: 0.69, use: 'Use as hints only' },
  SPECULATIVE: { min: 0.30, max: 0.49, use: 'Debugging only' },
  GUESS: { min: 0.0, max: 0.29, use: 'Do not use' },
} as const;
```