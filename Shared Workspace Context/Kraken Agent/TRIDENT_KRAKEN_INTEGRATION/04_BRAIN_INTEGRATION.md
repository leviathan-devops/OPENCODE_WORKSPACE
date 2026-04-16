# TRIDENT-KRAKEN INTEGRATION — BRAIN INTEGRATION

**Version:** 1.0  
**Date:** 2026-04-13

---

## PLANNING BRAIN — Deep Planning Integration

### Current State (Broken V2.0)
```typescript
// V2.0 Planning Brain just assigns tasks
assignTask(request: KrakenDelegationRequest) {
  this.delegationEngine.delegate(request);  // No analysis
}
```

### Target State (Trident-Enhanced)
```typescript
class PlanningBrain {
  private currentGate: 'INITIAL_PLAN' | 'BUILD_WORKFLOW' | 'CONTEXT_LIBRARY';
  private injectableChain: string = '';
  
  async processTask(task: Task): Promise<DeepPlanningOutput> {
    // GATE 1: INITIAL PLAN
    const coreProblem = this.identifyCoreProblem(task);
    const principles = this.analyzeFirstPrinciples(task);
    const successCriteria = this.defineSuccessCriteria(task);
    
    // Cannot advance until GATE 1 satisfied
    if (!this.gate1Satisfied(coreProblem, principles, successCriteria)) {
      throw new Error('GATE_1_INCOMPLETE');
    }
    
    // GATE 2: BUILD WORKFLOW
    const components = this.decomposeComponents(task);
    const criticalPath = this.sequenceCriticalPath(components);
    const risks = this.identifyRisks(components);
    const verification = this.defineVerification(components);
    
    // Cannot advance until GATE 2 satisfied
    if (!this.gate2Satisfied(components, risks, verification)) {
      throw new Error('GATE_2_INCOMPLETE');
    }
    
    // GATE 3: CONTEXT LIBRARY
    const injectableChain = this.generateInjectableChain(
      coreProblem,
      principles,
      components,
      criticalPath,
      risks,
      verification
    );
    
    return {
      coreProblem,
      principles,
      successCriteria,
      components,
      criticalPath,
      risks,
      verification,
      injectableChain
    };
  }
  
  private gate1Satisfied(problem: string, principles: string[], criteria: string[]): boolean {
    return principles.length >= 3 && criteria.length >= 1;
  }
  
  private gate2Satisfied(components: Component[], risks: Risk[], verification: VerificationStep[]): boolean {
    return components.length >= 5 && risks.length >= 3;
  }
  
  private generateInjectableChain(
    coreProblem: string,
    principles: string[],
    components: Component[],
    criticalPath: string[],
    risks: Risk[],
    verification: VerificationStep[]
  ): string {
    // Generate injectable reasoning chain for Execution Brain
    return `TASK: ${coreProblem}
    
PRINCIPLES (${principles.length}):
${principles.map((p, i) => `${i + 1}. ${p}`).join('\n')}

COMPONENTS (${components.length}):
${components.map(c => `- ${c.name}: ${c.description}`).join('\n')}

CRITICAL PATH:
${criticalPath.join(' → ')}

RISKS:
${risks.map(r => `- ${r.name}: ${r.mitigation}`).join('\n')}

VERIFICATION:
${verification.map(v => `- ${v.component}: ${v.method}`).join('\n')}

EXECUTE ACCORDING TO THIS REASONING CHAIN.`;
  }
}
```

### Gate Transition Requirements

| From | To | Requires |
|------|-----|----------|
| START | GATE 1 | Task received |
| GATE 1 | GATE 2 | 3+ first principles, 1+ core problem statement, 1+ success criteria |
| GATE 2 | GATE 3 | 5+ components, 3+ risks, verification per component |
| GATE 3 | COMPLETE | Injectable chain generated, Execution Brain acknowledged |

---

## SYSTEM BRAIN — Code Review Integration

### Current State (V2.0 Two-Layer Guardian)
```typescript
// V2.0 only has runtime enforcement
'tool.execute.before': (input) => { /* pattern matching */ },
'chat.message': (input) => { /* message matching */ }
```

### Target State (Trident-Enhanced)
```typescript
class SystemBrain {
  private codeReviewMode: CodeReviewMode;
  private twoLayerGuardian: TwoLayerGuardian;
  private preValidationComplete: boolean = false;
  
  async preExecutionValidation(bundlePath: string): Promise<CodeReviewOutput> {
    // Run Code Review Mode BEFORE any task execution
    const result = await this.codeReviewMode.run({
      target: bundlePath,
      depth: 5,
      category: 'all'
    });
    
    this.preValidationComplete = result.passed;
    
    if (!result.passed) {
      // BLOCKER detected - cannot proceed
      console.error('[SystemBrain] PRE-VALIDATION FAILED:', result.blockers);
      throw new Error(`PRE_EXECUTION_BLOCKED: ${result.blockers.map(b => b.message).join(', ')}`);
    }
    
    return result;
  }
  
  async checkTool(tool: string, args: Record<string, unknown>): Promise<void> {
    // Runtime enforcement via Two-Layer Guardian
    this.twoLayerGuardian.checkTool(tool, args);
  }
  
  async checkMessage(message: string): Promise<void> {
    // Runtime enforcement via Two-Layer Guardian
    this.twoLayerGuardian.checkMessage(message);
  }
}
```

### Code Review Layer Integration

| Layer | Purpose | Blockers That Stop Execution |
|-------|---------|------------------------------|
| L1: Structure Map | Bundle health | Suspicious size reduction |
| L2: Execution Verification | Catch fake execution | SimulatedExecutionDetector, PlaceholderCommentDetector, DeadCodeDetector |
| L3: Security Analysis | Vulnerability scan | SQL injection, command injection, hardcoded secrets |
| L4: Architecture Analysis | Isolation check | Hook spillover, agent isolation failure, global state |
| L5: Quality Analysis | Resource health | Memory leak, token bloat, empty catch |

### Pre-Validation Flow
```
Before Planning Brain processes task:
  → System Brain runs Code Review Mode
  → All 5 layers evaluated
  → If ANY Layer 2 blocker (SIMULATED EXECUTION):
      → ABORT
      → Report to Planning Brain
      → Planning Brain re-generates via Deep Planning
  → If Layer 4 blocker (HOOK SPILLOVER):
      → ABORT
      → Fix hook registration
  → If all pass:
      → System Brain ready for runtime enforcement
```

---

## EXECUTION BRAIN — Problem Solving Integration

### Current State (V2.0 Fire-and-Forget)
```typescript
// V2.0 Execution Brain
async executeTask(task: Task): Promise<Result> {
  const result = await this.delegationEngine.delegate(task);
  if (result.success) {
    this.markComplete(task.id);  // Bypasses OutputVerifier!
  }
  return result;
}
```

### Target State (Trident-Enhanced)
```typescript
class ExecutionBrain {
  private currentGate: 1 | 2 | 3 | 4 | 5 | 6 = 1;
  private assumption: string = '';
  private prediction: string = '';
  private outputVerifier: OutputVerifier;
  
  async executeTask(task: Task): Promise<ExecutionResult> {
    // ===== GATE 1: ASSUMPTION =====
    this.assumption = this.formAssumption(task);
    if (!this.assumptionValid(this.assumption)) {
      throw new Error('GATE_1_ASSUMPTION_INVALID');
    }
    
    // ===== GATE 2: ACTION =====
    const declaredOutputs = this.declareOutputs(task);
    this.outputVerifier.registerOutputs(task.id, declaredOutputs);
    
    const prediction = this.predictOutcome(task);
    this.prediction = prediction;
    
    // ===== EXECUTE =====
    const result = await this.delegationEngine.delegate(task);
    
    // ===== GATE 3: OBSERVATION =====
    const evidence = this.collectEvidence(task, declaredOutputs);
    if (!this.evidenceValid(evidence)) {
      // Gap analysis time
      return this.performGapAnalysis(task, evidence);
    }
    
    // ===== GATE 4: GAP ANALYSIS (if needed) =====
    // If evidence invalid, analyze why
    
    // ===== GATE 5: META-REFLECTION =====
    this.reflectOnProcess(task, evidence);
    
    // ===== GATE 6: VERIFICATION =====
    await this.outputVerifier.claimRetrieved(
      task.id,
      declaredOutputs.map(o => o.hostPath)
    );
    
    const canComplete = this.outputVerifier.canComplete(task.id);
    if (!canComplete) {
      throw new Error('GATE_6_VERIFICATION_FAILED: outputs not retrieved');
    }
    
    return { success: true, verified: true, evidence };
  }
  
  private formAssumption(task: Task): string {
    return `Task ${task.id} will complete and outputs will be retrievable at: ${task.expectedOutputs.join(', ')}`;
  }
  
  private collectEvidence(task: Task, outputs: OutputDeclaration[]): Evidence[] {
    return outputs.map(out => ({
      path: out.hostPath,
      exists: fs.existsSync(out.hostPath),
      verifiedAt: new Date()
    }));
  }
  
  private evidenceValid(evidence: Evidence[]): boolean {
    return evidence.every(e => e.exists);
  }
}
```

### 6-Gate State Machine

```
G1: ASSUMPTION
└── state: { assumption: string, valid: boolean }
└── advance: G1 → G2 (assumption documented)

G2: ACTION
└── state: { prediction: string, outputsDeclared: OutputDeclaration[] }
└── advance: G2 → G3 (outputs registered to verifier)

G3: OBSERVATION
└── state: { evidence: Evidence[], rawOutput: string }
└── advance: G3 → G4 (evidence collected) OR G3 → G4 (gap found)

G4: GAP ANALYSIS
└── state: { gap: string, adjustedHypothesis: string }
└── advance: G4 → G5 (gap analyzed)

G5: META-REFLECTION
└── state: { patterns: string[], systemicIssues: string[] }
└── advance: G5 → G6 (reflection complete)

G6: VERIFICATION
└── state: { verified: boolean, checkpoints: string[] }
└── advance: G6 → COMPLETE (verified) OR G1 (retry needed)
```

---

## Output Verification Integration

### Mechanical Verification Flow
```typescript
class OutputVerifier {
  private checkpoints: Map<string, OutputCheckpoint[]> = new Map();
  
  registerOutputs(taskId: string, outputs: OutputDeclaration[]): void {
    const checkpoints = outputs.map(out => ({
      taskId,
      containerPath: out.containerPath,
      hostPath: out.hostPath,
      verified: false
    }));
    this.checkpoints.set(taskId, checkpoints);
  }
  
  async claimRetrieved(taskId: string, hostPaths: string[]): Promise<void> {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) throw new Error('NO_CHECKPOINTS');
    
    for (const path of hostPaths) {
      const cp = checkpoints.find(c => c.hostPath === path);
      if (!cp) throw new Error(`OUTPUT_NOT_DECLARED: ${path}`);
      
      // MECHANICAL VERIFICATION
      if (!fs.existsSync(path)) {
        throw new Error(`OUTPUT_NOT_RETRIEVED: ${cp.containerPath} → ${path}`);
      }
      
      cp.verified = true;
      cp.verifiedAt = new Date();
    }
  }
  
  canComplete(taskId: string): boolean {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) return false;
    return checkpoints.every(cp => cp.verified);
  }
}
```

### Integration with Problem Solving Gates
```
G2 (Action): registerOutputs() ← MUST happen before delegate()
G3 (Observation): evidence = fs.existsSync() for each
G6 (Verification): claimRetrieved() ← MUST prove mechanically
```

---

## State Management

```typescript
interface BrainState {
  planning: {
    gate: 'INITIAL_PLAN' | 'BUILD_WORKFLOW' | 'CONTEXT_LIBRARY';
    injectableChain: string;
    acknowledgedByExecution: boolean;
  };
  system: {
    codeReviewPassed: boolean;
    preValidationResult: CodeReviewOutput | null;
    guardianActive: boolean;
  };
  execution: {
    gate: 1 | 2 | 3 | 4 | 5 | 6;
    assumption: string;
    evidence: Evidence[];
    checkpointsVerified: boolean;
  };
}
```