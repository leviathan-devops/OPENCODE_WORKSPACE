# TRIDENT-KRAKEN INTEGRATION — IMPLEMENTATION PHASES

**Version:** 1.0  
**Date:** 2026-04-13

---

## Phase Overview

| Phase | Priority | Description | Risk |
|-------|----------|-------------|------|
| **1** | CRITICAL | System Brain Code Review Mode | Low |
| **2** | HIGH | Execution Brain Problem Solving Mode | Medium |
| **3** | HIGH | Planning Brain Deep Planning Mode | Medium |
| **4** | MEDIUM | Context Engine Synthesis Mode | Low |
| **5** | MEDIUM | Council Reconfiguration | Low |

---

## PHASE 1: System Brain Code Review Mode (CRITICAL)

**Why CRITICAL:** This fixes the fake execution problem that broke V2.0. Without this, any new build will have the same 100ms timeout fake execution.

### Tasks:
1. [ ] Create CodeReviewMode class with 5 layers
2. [ ] Implement SimulatedExecutionDetector
3. [ ] Implement PlaceholderCommentDetector
4. [ ] Implement BundleSizeDetector
5. [ ] Implement DeadCodeDetector
6. [ ] Integrate into System Brain pre-execution validation
7. [ ] Add Block/Allow decision logic
8. [ ] Write pre-validation tests

### Implementation:
```typescript
// src/brains/system/code-review-mode.ts
class CodeReviewMode {
  async run(target: string): Promise<CodeReviewOutput> {
    const layers = [
      this.runLayer1_StructureMap(target),
      this.runLayer2_ExecutionVerification(target),  // PRIORITY
      this.runLayer3_SecurityAnalysis(target),
      this.runLayer4_ArchitectureAnalysis(target),
      this.runLayer5_QualityAnalysis(target)
    ];
    
    return this.aggregateResults(layers);
  }
  
  private runLayer2_ExecutionVerification(target: string): LayerResult {
    const files = this.readSourceFiles(target);
    const issues: Issue[] = [];
    
    for (const file of files) {
      // Detect simulated execution
      if (/\bsetTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*resolve\s*\(\s*\{[^}]*success[^}]*\)/.test(file.content)) {
        issues.push({
          severity: 'BLOCKER',
          type: 'SIMULATED_EXECUTION',
          file: file.path,
          message: 'setTimeout with resolve(success) detected - fake execution'
        });
      }
      
      // Detect placeholder comments
      if (/\/\/\s*(In v1|Just returns success|Full implementation would)/.test(file.content)) {
        issues.push({
          severity: 'BLOCKER',
          type: 'PLACEHOLDER',
          file: file.path,
          message: 'Placeholder comment detected'
        });
      }
    }
    
    return { layer: 2, issues, passed: issues.length === 0 };
  }
}
```

### Success Criteria:
- [ ] SimulatedExecutionDetector catches V2.0's 100ms timeout
- [ ] No false positives on real execution code
- [ ] Pre-validation runs before any task execution

---

## PHASE 2: Execution Brain Problem Solving Mode (HIGH)

**Why HIGH:** Fixes fire-and-forget pattern. Execution Brain must use 6-gate evidence loop.

### Tasks:
1. [ ] Refactor Execution Brain with 6-gate state machine
2. [ ] Integrate OutputVerifier into G2/G3/G6
3. [ ] Implement G1: Assumption statement
4. [ ] Implement G3: Evidence collection (fs.existsSync)
5. [ ] Implement G4: Gap analysis
6. [ ] Implement G5: Meta-reflection
7. [ ] Implement G6: Verification with OutputVerifier
8. [ ] Write 6-gate execution tests

### Implementation:
```typescript
// src/brains/execution/problem-solving-execution.ts
class ProblemSolvingExecution {
  private gate: 1 | 2 | 3 | 4 | 5 | 6 = 1;
  
  async executeTask(task: Task): Promise<ExecutionResult> {
    switch (this.gate) {
      case 1: return this.gate1_Assumption(task);
      case 2: return this.gate2_Action(task);
      case 3: return this.gate3_Observation(task);
      case 4: return this.gate4_GapAnalysis(task);
      case 5: return this.gate5_MetaReflection(task);
      case 6: return this.gate6_Verification(task);
    }
  }
  
  private async gate1_Assumption(task: Task): Promise<ExecutionResult> {
    const assumption = `Task ${task.id} will complete and outputs will be retrievable at: ${task.expectedOutputs.join(', ')}`;
    
    // Cannot advance without explicit assumption
    if (!assumption || assumption.length < 10) {
      throw new Error('GATE_1_ASSUMPTION_INVALID: must document explicit assumption');
    }
    
    this.state.assumption = assumption;
    this.gate = 2;
    return { gateAdvanced: true, currentGate: 2 };
  }
  
  private async gate6_Verification(task: Task): Promise<ExecutionResult> {
    // MECHANICAL VERIFICATION
    await this.outputVerifier.claimRetrieved(
      task.id,
      this.state.declaredOutputs.map(o => o.hostPath)
    );
    
    const canComplete = this.outputVerifier.canComplete(task.id);
    if (!canComplete) {
      throw new Error('GATE_6_VERIFICATION_FAILED: outputs not retrieved');
    }
    
    return { success: true, verified: true, gate: 6 };
  }
}
```

### Success Criteria:
- [ ] G1 requires explicit assumption before any action
- [ ] G3 requires fs.existsSync() evidence
- [ ] G6 calls OutputVerifier.claimRetrieved() mechanically
- [ ] No fire-and-forget pattern possible

---

## PHASE 3: Planning Brain Deep Planning Mode (HIGH)

**Why HIGH:** Planning Brain must generate injectable reasoning, not just assign tasks.

### Tasks:
1. [ ] Refactor Planning Brain with 3-gate Deep Planning
2. [ ] Implement G1: Initial Plan (first principles, core problem)
3. [ ] Implement G2: Build Workflow (5+ components, risks, verification)
4. [ ] Implement G3: Context Library (injectable chain generation)
5. [ ] Integrate output into Execution Brain handoff
6. [ ] Write 3-gate planning tests

### Implementation:
```typescript
// src/brains/planning/deep-planning.ts
class DeepPlanningMode {
  async processTask(task: Task): Promise<DeepPlanningOutput> {
    // GATE 1: INITIAL PLAN
    const initialPlan = await this.gate1_InitialPlan(task);
    
    // GATE 2: BUILD WORKFLOW
    const buildWorkflow = await this.gate2_BuildWorkflow(initialPlan);
    
    // GATE 3: CONTEXT LIBRARY
    const injectableChain = await this.gate3_ContextLibrary(buildWorkflow);
    
    return {
      ...initialPlan,
      ...buildWorkflow,
      injectableChain
    };
  }
  
  private async gate3_ContextLibrary(workflow: BuildWorkflowOutput): Promise<string> {
    return `TASK: ${workflow.coreProblem}
    
PRINCIPLES (${workflow.principles.length}):
${workflow.principles.map((p, i) => `${i + 1}. ${p}`).join('\n')}

COMPONENTS (${workflow.components.length}):
${workflow.components.map(c => `- ${c.name}: ${c.description}`).join('\n')}

CRITICAL PATH:
${workflow.criticalPath.join(' → ')}

RISKS:
${workflow.risks.map(r => `- ${r.name}: ${r.mitigation}`).join('\n')}

VERIFICATION:
${workflow.verification.map(v => `- ${v.component}: ${v.method}`).join('\n')}

EXECUTE ACCORDING TO THIS REASONING CHAIN.`;
  }
}
```

### Success Criteria:
- [ ] G1 requires 3+ first principles, core problem statement
- [ ] G2 requires 5+ components, 3+ risks
- [ ] G3 generates injectable chain for Execution Brain
- [ ] Execution Brain can consume and follow reasoning

---

## PHASE 4: Context Engine Synthesis Mode (MEDIUM)

**Why MEDIUM:** Integrates context as active layer, not just survival.

### Tasks:
1. [ ] Refactor Context Engine with 4-layer synthesis
2. [ ] Implement L1: Collection (T1-T4 sources)
3. [ ] Implement L2: Scoring (urgency × 0.6 + importance × 0.4)
4. [ ] Implement L3: Compression (<2k tokens)
5. [ ] Implement L4: Injection format (T0-ready stream)
6. [ ] Integrate triggers (token budget, decision point, gate transition)
7. [ ] Write injection tests

### Implementation:
```typescript
// src/brains/system/context-synthesis.ts
class ContextSynthesisMode {
  async synthesize(trigger: Trigger): Promise<InjectionOutput> {
    // L1: COLLECTION
    const sources = await this.collectSources();
    
    // L2: SCORING
    const scored = this.scoreContext(sources, trigger);
    
    // L3: COMPRESSION
    const compressed = this.compress(scored, { maxTokens: 2000 });
    
    // L4: INJECTION
    return this.formatForInjection(compressed, trigger, this.getCurrentGate());
  }
  
  private async collectSources(): Promise<ContextSource[]> {
    return Promise.all([
      { type: 'T1', content: this.getSessionState() },
      { type: 'T2', content: await this.getKnowledgeContext() },
      { type: 'T3', content: this.getRecentFiles() },
      { type: 'T4', content: this.getToolHistory() }
    ]);
  }
}
```

### Success Criteria:
- [ ] Triggers on token budget >65%, decision point, gate transition
- [ ] Output is <2k tokens
- [ ] T0-ready format with [CURRENT_GATE] [ACTIVE_TASK] [CONTEXT_HINTS]
- [ ] Integrates with Problem Solving Mode during gap analysis

---

## PHASE 5: Council Reconfiguration (MEDIUM)

**Why MEDIUM:** Each council brain operates in its native Trident mode.

### Tasks:
1. [ ] Reconfigure Alpha Brain with Deep Planning Mode
2. [ ] Reconfigure Beta Brain with Problem Solving Mode
3. [ ] Reconfigure Gamma Brain with Context Synthesis Mode
4. [ ] Implement structured inter-brain messaging
5. [ ] Write council coordination tests

### Implementation:
```typescript
// src/brains/council/roundtable-council.ts
class RoundtableCouncil {
  alphaBrain: AlphaBrain;  // Deep Planning Mode
  betaBrain: BetaBrain;   // Problem Solving Mode
  gammaBrain: GammaBrain;  // Context Synthesis Mode
  
  async coordinate(task: Task): Promise<CouncilResult> {
    // Alpha generates injectable reasoning
    const planning = await this.alphaBrain.processTask(task);
    
    // Beta executes with evidence loop
    const execution = await this.betaBrain.executeTask(task, planning.injectableChain);
    
    // Gamma provides context as needed
    if (this.contextEngine.shouldTrigger('token_budget', this.getTokenRatio(), 1.0)) {
      await this.gammaBrain.synthesizeContext('token_budget');
    }
    
    return { planning, execution, context: this.lastContext };
  }
}
```

### Success Criteria:
- [ ] Alpha outputs injectable reasoning
- [ ] Beta uses 6-gate evidence loop
- [ ] Gamma provides T0-ready context injection
- [ ] Inter-brain messages are structured

---

## Implementation Order

```
PHASE 1 (CRITICAL)
    ↓
System Brain Code Review Mode
    ↓
PRE-VALIDATION BLOCKS ALL else until passed
    ↓
PHASE 2 (HIGH) → PHASE 3 (HIGH) [can parallel]
    ↓
Execution Brain Problem Solving Mode
Planning Brain Deep Planning Mode
    ↓
PHASE 4 (MEDIUM)
    ↓
Context Engine Synthesis Mode
    ↓
PHASE 5 (MEDIUM)
    ↓
Council Reconfiguration
```

---

## File Locations

```
kraken-agent/
├── src/
│   ├── brains/
│   │   ├── system/
│   │   │   ├── system-brain.ts
│   │   │   ├── code-review-mode.ts      # PHASE 1
│   │   │   └── context-synthesis.ts      # PHASE 4
│   │   ├── execution/
│   │   │   ├── execution-brain.ts
│   │   │   └── problem-solving-execution.ts  # PHASE 2
│   │   ├── planning/
│   │   │   ├── planning-brain.ts
│   │   │   └── deep-planning.ts          # PHASE 3
│   │   └── council/
│   │       └── roundtable-council.ts     # PHASE 5
│   └── shared/
│       └── output-verifier.ts
```

---

## Test Strategy

| Phase | Test | Success Criteria |
|-------|------|------------------|
| 1 | `simulateTaskExecution()` file | Code Review Mode blocks it |
| 2 | Fire-and-forget pattern | G6 fails, outputs not verified |
| 3 | Task assignment without planning | 3-gate required before execution |
| 4 | Token budget trigger | Context injected at 65% |
| 5 | Alpha→Beta→Gamma flow | All modes execute in sequence |

---

## Risk Mitigation

| Phase | Risk | Mitigation |
|-------|------|------------|
| 1 | Breaking existing System Brain | Add Code Review as PRE-validation, not replacing guardian |
| 2 | Execution slow due to 6 gates | Gates are state checks, not additional processing |
| 3 | Planning overhead | Deep Planning only on task assignment, not every action |
| 4 | Context injection too frequent | Threshold at 65%, not on every token |
| 5 | Council coordination complexity | Structured messages, not natural language |