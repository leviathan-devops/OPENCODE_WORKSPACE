# Architecture - Problem Solving Mode

## High-Level Design

```
PROBLEM SOLVING MODE
│
├── LAYER 1: ASSUMPTION STATEMENT
│   └── Gate: Explicit assumption + reasoning chain
│
├── LAYER 2: ACTION WITH PREDICTION
│   └── Gate: Exact command + expected output
│
├── LAYER 3: OBSERVATION & EVIDENCE
│   └── Gate: Raw evidence + logs checked
│
├── LAYER 4: GAP ANALYSIS & ADJUSTMENT
│   └── Gate: Updated hypothesis + insight
│
├── LAYER 5: META-COGNITIVE REFLECTION
│   └── Gate: Pattern extraction + systemic issue
│
└── LAYER 6: VERIFICATION & CONFIRMATION
    └── Gate: Target environment test + behavior match
```

## Key Architectural Decisions

1. **Evidence-Based Iteration**
   - Cannot advance without raw evidence
   - Expected vs actual comparison required
   - External verification (logs, not self-assessment)

2. **6 Mechanical Gates**
   - Each gate has explicit "Cannot advance until..."
   - Structural requirements, not quantitative
   - Anti-derailment checks per layer

3. **Iteration for Depth**
   - V1.0 → V1.1 → V1.2 deepens same problem
   - Each failure adds information
   - Root cause emerges through iteration

4. **Anti-Derailment Focus**
   - Prevents Host Fallback ("host testing proves it")
   - Prevents Mock/Stub suggestions
   - Prevents Success Claims Without Proof

## State Machine

```typescript
enum ProblemSolvingLayer {
  LAYER_1 = 1,  // Assumption Statement
  LAYER_2 = 2,  // Action with Prediction
  LAYER_3 = 3,  // Observation & Evidence
  LAYER_4 = 4,  // Gap Analysis & Adjustment
  LAYER_5 = 5,  // Meta-Cognitive Reflection
  LAYER_6 = 6,  // Verification & Confirmation
  COMPLETE = 7
}
```

## Layer Dependencies

- Layer 1 → Layer 2: Requires explicit assumption + success criteria
- Layer 2 → Layer 3: Requires exact command + expected output
- Layer 3 → Layer 4: Requires raw evidence + comparison
- Layer 4 → Layer 5: Requires gap analysis + updated hypothesis
- Layer 5 → Layer 6: Requires pattern extraction
- Layer 6 → COMPLETE: Requires target environment verification