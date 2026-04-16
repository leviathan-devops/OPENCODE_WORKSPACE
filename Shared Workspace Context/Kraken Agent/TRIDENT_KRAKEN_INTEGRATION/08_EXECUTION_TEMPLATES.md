# TRIDENT-KRAKEN INTEGRATION — EXECUTION TEMPLATES

**Version:** 1.0  
**Date:** 2026-04-13

---

## Problem Solving Mode Templates

### Template 1: Basic 6-Gate Execution

```typescript
async function executeTaskWithProblemSolving(
  task: Task,
  outputVerifier: OutputVerifier
): Promise<ExecutionResult> {
  
  // ===== GATE 1: ASSUMPTION =====
  const assumption = `Task ${task.id} will complete and outputs will be retrievable`;
  console.log(`[G1] Assumption: ${assumption}`);
  
  // Validate assumption exists
  if (!assumption || assumption.length < 10) {
    throw new Error('GATE_1_ASSUMPTION_INVALID');
  }
  
  // ===== GATE 2: ACTION =====
  const declaredOutputs = task.expectedOutputs.map(path => ({
    containerPath: `/container${path}`,
    hostPath: path,
    type: 'file' as const,
    required: true
  }));
  
  outputVerifier.registerOutputs(task.id, declaredOutputs);
  
  const prediction = `Outputs will exist at: ${declaredOutputs.map(o => o.hostPath).join(', ')}`;
  console.log(`[G2] Prediction: ${prediction}`);
  
  // ===== EXECUTE =====
  const result = await delegationEngine.delegate(task);
  
  // ===== GATE 3: OBSERVATION =====
  const evidence = declaredOutputs.map(out => ({
    path: out.hostPath,
    exists: fs.existsSync(out.hostPath),
    verifiedAt: new Date()
  }));
  
  console.log(`[G3] Evidence: ${evidence.map(e => `${e.path}:${e.exists}`).join(', ')}`);
  
  const evidenceValid = evidence.every(e => e.exists);
  
  if (!evidenceValid) {
    // ===== GATE 4: GAP ANALYSIS =====
    const missingOutputs = evidence.filter(e => !e.exists).map(e => e.path);
    console.log(`[G4] Gap Analysis: Missing outputs at ${missingOutput.join(', ')}`);
    
    const gapAnalysis = `Outputs missing: ${missingOutputs.join(', ')}. ` +
      `Possible causes: container didn't write, path wrong, permissions issue. ` +
      `Hypothesis: Fire-and-forget pattern bypassed retrieval.`;
    
    return { success: false, gate: 4, gapAnalysis, evidence };
  }
  
  // ===== GATE 5: META-REFLECTION =====
  const pattern = evidenceValid ? 
    'Evidence-based execution confirms outputs exist' :
    'Fire-and-forget pattern detected';
  
  console.log(`[G5] Reflection: ${pattern}`);
  
  // ===== GATE 6: VERIFICATION =====
  await outputVerifier.claimRetrieved(
    task.id,
    declaredOutputs.map(o => o.hostPath)
  );
  
  const canComplete = outputVerifier.canComplete(task.id);
  
  if (!canComplete) {
    throw new Error('GATE_6_VERIFICATION_FAILED: claimRetrieved() did not verify all outputs');
  }
  
  console.log(`[G6] Verification: ALL CHECKPOINTS VERIFIED`);
  
  return { success: true, verified: true, evidence };
}
```

---

### Template 2: Deep Planning Handoff

```typescript
async function executeWithInjectableChain(
  task: Task,
  planningOutput: DeepPlanningOutput
): Promise<ExecutionResult> {
  
  console.log('[PLANNING HANDOFF]');
  console.log(`Core Problem: ${planningOutput.coreProblem}`);
  console.log(`Principles: ${planningOutput.principles.join(', ')}`);
  console.log(`Components: ${planningOutput.components.length}`);
  console.log(`Critical Path: ${planningOutput.criticalPath.join(' → ')}`);
  
  // Verify planning output is valid
  if (!planningOutput.injectableChain || planningOutput.injectableChain.length < 50) {
    throw new Error('PLANNING_INVALID: injectable chain too short');
  }
  
  // Follow injectable chain during execution
  return executeTaskWithProblemSolving(task, outputVerifier);
}
```

---

### Template 3: Code Review Pre-Validation

```typescript
async function runPreValidation(bundlePath: string): Promise<CodeReviewOutput> {
  const detectors = {
    simulatedExecution: /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*resolve\s*\(\s*\{[^}]*success/i,
    placeholder: /\/\/\s*(In v1|Just returns success|Full implementation would)/i,
    deadCode: /function\s+\w+\s*\([^)]*\)\s*:\s*\w+\s*\{[\s\n]*\}/,
    stubFunction: /return\s+Promise\s*\.\s*resolve\s*\(\s*\{[\s\n]*\}/,
  };
  
  const issues: Issue[] = [];
  
  for (const [type, pattern] of Object.entries(detectors)) {
    if (pattern.test(bundleContent)) {
      issues.push({
        severity: type === 'simulatedExecution' || type === 'placeholder' ? 'BLOCKER' : 'WARNING',
        type,
        message: `Detected ${type} pattern`,
        file: extractFile(type)
      });
    }
  }
  
  return {
    passed: !issues.some(i => i.severity === 'BLOCKER'),
    blockers: issues.filter(i => i.severity === 'BLOCKER'),
    warnings: issues.filter(i => i.severity === 'WARNING'),
    suggestions: []
  };
}
```

---

### Template 4: Context Injection Request

```typescript
async function requestContextInjection(
  trigger: Trigger,
  currentGate: Gate,
  activeTask: string
): Promise<InjectionOutput> {
  
  // L1: COLLECTION
  const sources = await Promise.all([
    { type: 'T1', content: getSessionState() },
    { type: 'T2', content: await getKnowledgeContext() },
    { type: 'T3', content: getRecentFiles() },
    { type: 'T4', content: getToolHistory() }
  ]);
  
  // L2: SCORING
  const scored = sources.map(s => ({
    source: s,
    urgency: trigger === 'task_blocker' ? 10 : trigger === 'gate_transition' ? 8 : 6,
    importance: s.type === 'T1' ? 10 : s.type === 'T2' ? 8 : 7,
    final: (trigger === 'task_blocker' ? 10 : 8) * 0.6 + (s.type === 'T1' ? 10 : 8) * 0.4
  })).sort((a, b) => b.final - a.final);
  
  // L3: COMPRESSION
  let injection = '';
  for (const item of scored) {
    const candidate = `\n## ${item.source.type}\n${item.source.content}`;
    if ((injection + candidate).length > 8000) break; // ~2k tokens
    injection += candidate;
  }
  
  // L4: INJECTION FORMAT
  return {
    injection: `### CURRENT_GATE\n${currentGate}\n\n### ACTIVE_TASK\n${activeTask}\n\n### CONTEXT_HINTS\n${trigger}\n\n### RELEVANT_MEMORY\n${injection}`,
    trigger,
    tokenCount: injection.length / 4,
    sources: sources.map(s => s.type)
  };
}
```

---

### Template 5: Council Coordination

```typescript
async function councilCoordinate(task: Task): Promise<CouncilResult> {
  
  // ALPHA: Deep Planning
  const planningOutput = await alphaBrain.processTask(task);
  
  if (!planningOutput.injectableChain) {
    throw new Error('ALPHA_FAILED: no injectable chain generated');
  }
  
  // BETA: Problem Solving Execution
  const executionOutput = await betaBrain.executeTask(task, planningOutput.injectableChain);
  
  // If gap detected, loop back to Alpha
  if (executionOutput.gate === 4) {
    console.log('[COUNCIL] Gap detected, requesting Alpha re-planning');
    const replanning = await alphaBrain.replan(task, executionOutput.gapAnalysis);
    const retry = await betaBrain.executeTask(task, replanning.injectableChain);
    
    if (!retry.verified) {
      throw new Error('RETRY_FAILED: even with re-planning, execution not verified');
    }
    
    executionOutput = retry;
  }
  
  // GAMMA: Context injection if needed
  if (contextEngine.shouldTrigger('token_budget', getTokenRatio(), 1.0)) {
    await gammaBrain.synthesizeContext('token_budget');
  }
  
  return {
    planning: planningOutput,
    execution: executionOutput,
    context: gammaBrain.lastInjection
  };
}
```

---

## Gate State Machine

```
START → G1 (Assumption)
  ↓
G1: ASSUMPTION STATEMENT
  └── valid: assumption.length >= 10
  └── advance to G2
  
G2: ACTION WITH PREDICTION
  └── valid: outputs registered to verifier
  └── advance to G3
  
G3: OBSERVATION & EVIDENCE
  └── valid: fs.existsSync() for each output
  └── if invalid: advance to G4
  
G4: GAP ANALYSIS
  └── analyze why evidence invalid
  └── if gap fixable: retry G3
  └── if gap not fixable: advance to G5
  
G5: META-REFLECTION
  └── extract patterns
  └── identify systemic issues
  └── advance to G6
  
G6: VERIFICATION
  └── valid: claimRetrieved() + canComplete()
  └── if invalid: retry from G1
  └── if valid: COMPLETE
```

---

## Output Verifier Integration

```typescript
interface OutputDeclaration {
  containerPath: string;
  hostPath: string;
  type: 'file' | 'directory';
  required: boolean;
}

class OutputVerifier {
  private checkpoints: Map<string, OutputCheckpoint[]> = new Map();
  
  registerOutputs(taskId: string, outputs: OutputDeclaration[]): void {
    const checkpoints = outputs.map(out => ({
      taskId,
      containerPath: out.containerPath,
      hostPath: out.hostPath,
      type: out.type,
      required: out.required,
      verified: false
    }));
    this.checkpoints.set(taskId, checkpoints);
    console.log(`[OutputVerifier] Registered ${checkpoints.length} checkpoints for ${taskId}`);
  }
  
  async claimRetrieved(taskId: string, hostPaths: string[]): Promise<void> {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) throw new Error(`NO_CHECKPOINTS: ${taskId}`);
    
    for (const path of hostPaths) {
      const cp = checkpoints.find(c => c.hostPath === path);
      if (!cp) throw new Error(`OUTPUT_NOT_DECLARED: ${path}`);
      
      // MECHANICAL VERIFICATION
      if (!fs.existsSync(path)) {
        throw new Error(`OUTPUT_NOT_RETRIEVED: ${cp.containerPath} → ${path}`);
      }
      
      cp.verified = true;
      cp.verifiedAt = new Date();
      console.log(`[OutputVerifier] Checkpoint verified: ${path}`);
    }
  }
  
  canComplete(taskId: string): boolean {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) return false;
    
    const allVerified = checkpoints.filter(cp => cp.required).every(cp => cp.verified);
    console.log(`[OutputVerifier] canComplete(${taskId}): ${allVerified}`);
    
    return allVerified;
  }
}
```

---

## File Reference

This file is part of the TRIDENT_KRAKEN_INTEGRATION context library.
See `00_INDEX.md` for full file list.