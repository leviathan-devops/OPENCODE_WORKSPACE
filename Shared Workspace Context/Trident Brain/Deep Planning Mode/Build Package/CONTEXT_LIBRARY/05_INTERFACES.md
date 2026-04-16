# Interfaces - Deep Planning Mode

## External Interface: Agent Trigger

```typescript
interface PlanRequest {
  task: string;           // What to plan
  depth?: number;          // 1-3, default 3
  mode?: 'planning';       // Explicit mode
}
```

## Layer 1 Output Interface

```typescript
interface Layer1Artifact {
  surfaceUnderstanding: string;
  firstPrinciples: string[];      // 3+ items
  constraints: string[];          // 3+ items
  successCriteria: string[];      // 2+ items
  openQuestions: string[];         // 2+ items
  direction: string;
}
```

## Layer 2 Output Interface

```typescript
interface Layer2Artifact {
  components: Component[];         // 5+ items
  sequence: Phase[];               // Ordered phases
  dependencies: Dependency[];      // 3+ items
  failureModes: FailureMode[];     // 3+ items
  verification: Verification[];    // Per component
}
```

## Layer 3 Output Interface

```typescript
interface ContextLibrary {
  index: string;                    // 00_INDEX.md
  surfaceAnalysis: string;         // 01_SURFACE_ANALYSIS.md
  architecture: string;             // 02_ARCHITECTURE.md
  components: string;                // 03_COMPONENTS.md
  dataFlow: string;                 // 04_DATA_FLOW.md
  interfaces: string;               // 05_INTERFACES.md
  stateManagement: string;          // 06_STATE_MANAGEMENT.md
  errorHandling: string;            // 07_ERROR_HANDLING.md
  testing: string;                  // 08_TESTING.md
  deployment: string;                // 09_DEPLOYMENT.md
  mentalModel: string;              // 10_MENTAL_MODEL.md
}
```

## Internal Contracts

| Component | Method | Contract |
|-----------|--------|----------|
| Gate Validator | validate(layer) | Returns {valid: boolean, reasons: string[]} |
| State Manager | advance() | Increments layer or iteration |
| Template Engine | generate(type, context) | Returns filled template |