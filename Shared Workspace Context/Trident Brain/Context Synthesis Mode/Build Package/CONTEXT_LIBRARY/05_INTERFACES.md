# Interfaces - Context Synthesis Mode

## External Interface: Agent Trigger

```typescript
interface SynthesisRequest {
  trigger: 'manual' | 'gate' | 'error' | 'threshold' | 'stale';
  context?: {
    gate?: string;
    task?: string;
    blockers?: string[];
  };
}
```

## Layer 1 Output Interface

```typescript
interface Layer1Artifact {
  sourcesChecked: {
    t1: { status: 'available' | 'unavailable'; content: string };
    t2: { status: 'available' | 'unavailable'; content: string };
    t3: { status: 'available' | 'unavailable'; content: string };
    t4: { status: 'available' | 'unavailable'; content: string };
  };
  collectionComplete: boolean;
}
```

## Layer 2 Output Interface

```typescript
interface Layer2Artifact {
  scoredContext: {
    source: string;
    content: string;
    urgencyScore: number;
    importanceScore: number;
    finalScore: number;
  }[];
  rankingComplete: boolean;
}
```

## Layer 3 Output Interface

```typescript
interface Layer3Artifact {
  compressedContent: string;
  tokenCount: number;
  compressionRatio: number;
  decisionPointsPreserved: string[];
}
```

## Layer 4 Output Interface

```typescript
interface Layer4Artifact {
  injection: string;          // T0-ready markdown
  sections: string[];        // Included sections
  totalTokens: number;
  sourceCount: number;
}
```