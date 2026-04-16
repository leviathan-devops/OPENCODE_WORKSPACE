# TRIDENT-KRAKEN INTEGRATION — COUNCIL RECONFIGURATION

**Version:** 1.0  
**Date:** 2026-04-13

---

## Current Council (V2.0)

**V2.0 Roundtable Council:**
```typescript
class RoundtableCouncil {
  alphaBrain: AlphaBrain;  // "Lead: Exec, Focus: Steamroll"
  betaBrain: BetaBrain;   // "Lead: Reason, Focus: Precision"
  gammaBrain: GammaBrain;  // "Lead: System, Focus: Testing"
}
```

**Problem:** Each brain operates generically. No specialized reasoning mode per brain.

---

## Trident-Enhanced Council

**Target State:**
```
Alpha Brain → Deep Planning Mode (steamroll focus)
Beta Brain → Problem Solving Mode (precision focus)
Gamma Brain → Context Synthesis Mode (testing focus)
```

---

## ALPHA BRAIN → Deep Planning Mode

### Role Change
| Aspect | V2.0 | Trident |
|--------|------|---------|
| Focus | Steamroll | Build fast with reasoning |
| Output | Task assignment | Injectable reasoning chain |
| Mode | Generic | Deep Planning Mode |

### Alpha Brain Implementation
```typescript
class AlphaBrain {
  private mode: 'deep_planning' = 'deep_planning';
  
  async processTask(task: Task): Promise<DeepPlanningOutput> {
    return deepPlanningMode.run({
      task: task.description,
      goal: task.goal,
      constraints: task.constraints
    });
  }
  
  // Deep Planning Mode gates
  async gate1_InitialPlan(task: Task): Promise<InitialPlanOutput> {
    const coreProblem = this.identifyCoreProblem(task);
    const principles = this.analyzeFirstPrinciples(task);
    const successCriteria = this.defineSuccessCriteria(task);
    
    return { coreProblem, principles, successCriteria };
  }
  
  async gate2_BuildWorkflow(initialPlan: InitialPlanOutput): Promise<BuildWorkflowOutput> {
    const components = this.decomposeComponents(initialPlan.coreProblem);
    const criticalPath = this.sequenceCriticalPath(components);
    const risks = this.identifyRisks(components);
    const verification = this.defineVerification(components);
    
    return { components, criticalPath, risks, verification };
  }
  
  async gate3_ContextLibrary(buildWorkflow: BuildWorkflowOutput): Promise<string> {
    return this.generateInjectableChain(buildWorkflow);
  }
}
```

### Alpha Brain Triggers
- **Activates when:** Task assigned to Alpha cluster
- **Outputs:** Injectable reasoning chain for cluster execution
- **Deactivates when:** Execution Brain acknowledges receipt

---

## BETA BRAIN → Problem Solving Mode

### Role Change
| Aspect | V2.0 | Trident |
|--------|------|---------|
| Focus | Precision | Evidence-based debugging |
| Output | Task execution | 6-gate verified execution |
| Mode | Generic | Problem Solving Mode |

### Beta Brain Implementation
```typescript
class BetaBrain {
  private mode: 'problem_solving' = 'problem_solving';
  
  async executeTask(task: Task): Promise<ProblemSolvingOutput> {
    // GATE 1: ASSUMPTION
    const assumption = this.formAssumption(task);
    
    // GATE 2: ACTION
    const prediction = this.predictOutcome(task);
    const declaredOutputs = this.declareOutputs(task);
    
    // GATE 3: OBSERVATION
    const evidence = this.collectEvidence(declaredOutputs);
    
    // GATE 4: GAP ANALYSIS
    if (!this.evidenceValid(evidence)) {
      const gapAnalysis = this.analyzeGap(evidence);
      return { assumption, prediction, evidence, gapAnalysis, verified: false };
    }
    
    // GATE 5: META-REFLECTION
    const reflection = this.reflect();
    
    // GATE 6: VERIFICATION
    const verified = await this.verifyOutputs(declaredOutputs);
    
    return { assumption, prediction, evidence, reflection, verified };
  }
}
```

### Beta Brain Triggers
- **Activates when:** Execution encounters failure or gap
- **Outputs:** Evidence-based failure analysis
- **Deactivates when:** Root cause identified + fix verified

---

## GAMMA BRAIN → Context Synthesis Mode

### Role Change
| Aspect | V2.0 | Trident |
|--------|------|---------|
| Focus | Testing | Context injection |
| Output | Test results | T0-ready stream |
| Mode | Generic | Context Synthesis Mode |

### Gamma Brain Implementation
```typescript
class GammaBrain {
  private mode: 'context_synthesis' = 'context_synthesis';
  
  async synthesizeContext(trigger: 'token_budget' | 'decision_point' | 'gate_transition'): Promise<ContextSynthesisOutput> {
    // LAYER 1: COLLECTION
    const sources = await this.collectSources();
    
    // LAYER 2: SCORING
    const scored = this.scoreContext(sources, trigger);
    
    // LAYER 3: COMPRESSION
    const compressed = this.compress(scored, { maxTokens: 2000 });
    
    // LAYER 4: INJECTION
    return {
      injection: this.formatForInjection(compressed, trigger),
      sources: sources.map(s => s.type),
      score: scored.totalScore,
      injectionType: trigger
    };
  }
  
  private async collectSources(): Promise<ContextSource[]> {
    return [
      { type: 'T1', content: this.getSessionState() },
      { type: 'T2', content: await this.getKnowledgeContext() },
      { type: 'T3', content: this.getRecentFiles() },
      { type: 'T4', content: this.getToolHistory() }
    ];
  }
  
  private scoreContext(sources: ContextSource[], trigger: string): ScoredContext {
    const scores = sources.map(s => ({
      source: s,
      urgency: this.calcUrgency(s, trigger),
      importance: this.calcImportance(s),
      final: (this.calcUrgency(s, trigger) * 0.6) + (this.calcImportance(s) * 0.4)
    }));
    
    return {
      items: scores.sort((a, b) => b.final - a.final),
      totalScore: scores.reduce((sum, s) => sum + s.final, 0)
    };
  }
}
```

### Gamma Brain Triggers
- **Activates when:** Token budget >65% OR decision point detected OR gate transition
- **Outputs:** T0-ready context injection
- **Deactivates when:** Injection delivered, token budget below threshold

---

## Council Communication

### Inter-Brain Messages (Structured Schema)
```typescript
interface CouncilMessage {
  from: 'alpha' | 'beta' | 'gamma';
  to: 'alpha' | 'beta' | 'gamma' | 'all';
  type: 'request' | 'response' | 'alert' | 'handoff';
  payload: {
    mode: 'deep_planning' | 'problem_solving' | 'context_synthesis';
    content: string;
    priority: 'critical' | 'high' | 'normal';
  };
}
```

### Alpha → Beta Handoff
```typescript
// Alpha has planning complete, hands off to Beta for execution
{
  from: 'alpha',
  to: 'beta',
  type: 'handoff',
  payload: {
    mode: 'deep_planning',
    content: `TASK: ${coreProblem}\nPRINCIPLES: ${principles}\nCOMPONENTS: ${components}\nCRITICAL PATH: ${criticalPath}`,
    priority: 'high'
  }
}
```

### Beta → Alpha Alert
```typescript
// Beta encounters failure, needs re-planning
{
  from: 'beta',
  to: 'alpha',
  type: 'alert',
  payload: {
    mode: 'problem_solving',
    content: `GAP ANALYSIS: ${gap}\nROOT CAUSE: ${rootCause}\nNEEDS: ${replanningNeeded}`,
    priority: 'critical'
  }
}
```

### Gamma → All Context Injection
```typescript
// Gamma provides context to all brains
{
  from: 'gamma',
  to: 'all',
  type: 'request',
  payload: {
    mode: 'context_synthesis',
    content: `[CURRENT_GATE: VERIFY]\n[ACTIVE_TASK: Verify outputs]\n[CONTEXT: Decision point - outputs not found, analyzing gap]`,
    priority: 'normal'
  }
}
```

---

## Council State Machine

```
IDLE → (task assigned to cluster)
  ↓
ALPHA_ACTIVE → (planning task received)
  ↓
Alpha runs Deep Planning Mode (G1→G2→G3)
  ↓
ALPHA_COMPLETE → (injectable chain generated)
  ↓
BETA_ACTIVE → (execution begins)
  ↓
Beta runs Problem Solving Mode (G1→G2→G3→G4→G5→G6)
  ↓
If gap detected:
  → BETA_PAUSED
  → ALPHA_REACTIVE → (re-planning needed)
  → Loop back to Alpha
  
If verified:
  → BETA_COMPLETE
  ↓
GAMMA_ACTIVE → (context injection triggered)
  ↓
Context injected
  ↓
COUNCIL_COMPLETE
```

---

## File Reference

This file is part of the TRIDENT_KRAKEN_INTEGRATION context library.
See `00_INDEX.md` for full file list.