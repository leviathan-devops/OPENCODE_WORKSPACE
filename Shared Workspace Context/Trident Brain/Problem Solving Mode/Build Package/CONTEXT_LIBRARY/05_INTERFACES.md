# Interfaces - Problem Solving Mode

## External Interface: Agent Trigger

```typescript
interface SolveRequest {
  problem: string;           // What to solve
  context?: string;         // Additional context
  depth?: number;           // 1-6, default 6
}
```

## Layer 1 Output Interface

```typescript
interface Layer1Artifact {
  explicitAssumption: string;
  reasoningChain: string[];      // 3+ items
  successCriteria: string[];     // 2+ items
  confirmationEvidence: string;  // What would prove
  disproofEvidence: string;      // What would disprove
}
```

## Layer 2 Output Interface

```typescript
interface Layer2Artifact {
  exactCommand: string;
  expectedOutput: string;
  environmentState: {
    version?: string;
    config?: Record<string, string>;
  };
}
```

## Layer 3 Output Interface

```typescript
interface Layer3Artifact {
  rawEvidence: string;           // Copied, not described
  logsChecked: string[];         // Which logs
  expectedVsActual: {
    expected: string;
    actual: string;
  };
}
```

## Layer 4 Output Interface

```typescript
interface Layer4Artifact {
  gapAnalysis: string;            // "Expected X, got Y, therefore Z"
  updatedHypothesis: string;
  nextAction: string;            // Tied to insight
  nextActionRationale: string;   // Why this action
}
```

## Layer 5 Output Interface

```typescript
interface Layer5Artifact {
  whatIShouldHaveDone: string;
  patternExtracted: string;
  systemicIssue: string;
}
```

## Layer 6 Output Interface

```typescript
interface Layer6Artifact {
  targetEnvironmentExecution: string;
  behaviorMatchesRequirement: boolean;
  regressionsChecked: string[];
}
```