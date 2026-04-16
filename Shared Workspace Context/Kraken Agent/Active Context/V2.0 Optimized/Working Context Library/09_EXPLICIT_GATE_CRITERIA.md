# EXPLICIT GATE CRITERIA — V2.0

**File:** `src/brains/system/gate-criteria.ts`

---

## Core Problem (From First-Hand Experience)

From Shark Agent v4.8.3 build, discovered ambiguity in gate synchronization:

**V1.2 said:** "All 3 brains run concurrently, sync at gates only"

**Problem:** When is a gate actually "reached"?

```
Planning Brain: Generating T2 context...
Execution Brain: Supervising Alpha building...
System Brain: Evaluating L5 patterns...
                    ↓
           When is TEST gate reached?
                    ↓
        How does each brain know to sync?
```

**No explicit criteria.** Each brain had to guess.

---

## V1.2 Implicit Model (PROBLEM)

```typescript
// V1.2: Implicit gate sync
class GateManager {
  async advanceGate(gateId: string) {
    // Wait for all brains to seem "ready"
    await Promise.all([
      planningBrain.waitForReady(),
      executionBrain.waitForReady(),
      systemBrain.waitForReady(),
    ]);
    
    // Assume ready = at gate
    this.currentGate = gateId;
  }
}
```

**Problems:**
1. "Ready" is ambiguous
2. No verification of actual progress
3. Brain could be "ready" but not actually done
4. No evidence of what was completed

---

## V2.0 Explicit Criteria Model

```typescript
// V2.0: Explicit gate entry criteria
interface GateCriteria {
  gateId: GateId;
  description: string;
  
  // Criteria for each brain
  planningBrain: BrainCriteria;
  executionBrain: BrainCriteria;
  systemBrain: BrainCriteria;
}

interface BrainCriteria {
  // What must be completed for this gate
  completed: string[];         // e.g., ['T1_generated', 'tasks_decomposed']
  
  // What must exist as evidence
  evidence?: EvidenceRequirement[];
  
  // Optional: what must NOT exist
  forbidden?: string[];
}

interface EvidenceRequirement {
  path: string;
  type: 'file' | 'directory';
  check?: string;              // e.g., 'passRate >= 0.96'
}

// Gate IDs
type GateId = 'PLAN' | 'BUILD' | 'TEST' | 'VERIFY' | 'AUDIT' | 'DELIVERY';
```

---

## Gate Definitions

### PLAN Gate

```typescript
const PLAN_GATE_CRITERIA: GateCriteria = {
  gateId: 'PLAN',
  description: 'Planning complete, ready to build',
  
  planningBrain: {
    completed: [
      'T2_master_loaded',           // T2 context pre-loaded
      'T1_generated',               // T1 generated from SPEC.md
      'tasks_decomposed',           // Tasks decomposed for clusters
      'domain_designated',          // Tasks assigned to correct clusters
    ],
    evidence: [
      { path: 'SPEC.md', type: 'file' },
      { path: 'plan.md', type: 'file' },
      { path: 'task-manifest.json', type: 'file' },
    ],
  },
  
  executionBrain: {
    completed: [
      'containers_ready',            // Container pool initialized
      'clusters_available',         // Alpha, Beta, Gamma ready
    ],
    evidence: [],
  },
  
  systemBrain: {
    completed: [
      'firewall_initialized',        // L0-L8 patterns loaded
      'gate_manager_ready',          // Gate criteria defined
    ],
    evidence: [],
  },
};
```

### BUILD Gate

```typescript
const BUILD_GATE_CRITERIA: GateCriteria = {
  gateId: 'BUILD',
  description: 'Build execution in progress',
  
  planningBrain: {
    completed: [
      'context_injected',            // T1 context sent to execution
    ],
    evidence: [],
  },
  
  executionBrain: {
    completed: [
      'tasks_spawned',              // All tasks spawned
      'alpha_build_started',        // Alpha building
      'progress_tracked',           // Progress tracking active
    ],
    evidence: [],
  },
  
  systemBrain: {
    completed: [
      'orchestration_theater_blocked',  // L1 patterns active
      'false_completion_blocked',       // L2 patterns active
    ],
    evidence: [],
  },
};
```

### TEST Gate

```typescript
const TEST_GATE_CRITERIA: GateCriteria = {
  gateId: 'TEST',
  description: 'Testing phase - container tests required',
  
  planningBrain: {
    completed: [
      'test_plan_generated',        // T1 includes test plan
    ],
    evidence: [],
  },
  
  executionBrain: {
    completed: [
      'build_complete',             // Alpha reports build done
      'outputs_retrieved',          // All outputs on host
      'test_task_spawned',          // Gamma running tests
    ],
    evidence: [
      { path: 'dist/index.js', type: 'file' },  // Build output exists
    ],
  },
  
  systemBrain: {
    completed: [
      'container_test_required',     // L2.5 forces container tests
      'test_verification_active',    // Monitoring test results
    ],
    evidence: [
      { 
        path: 'ContainerTestResult.json', 
        type: 'file',
        check: 'passRate >= 0.96',  // MUST have 96%+ pass rate
      },
    ],
  },
};
```

### VERIFY Gate

```typescript
const VERIFY_GATE_CRITERIA: GateCriteria = {
  gateId: 'VERIFY',
  description: 'Verification phase - integration tests',
  
  planningBrain: {
    completed: [
      'verification_plan_generated',
    ],
    evidence: [],
  },
  
  executionBrain: {
    completed: [
      'integration_tests_spawned',
    ],
    evidence: [],
  },
  
  systemBrain: {
    completed: [
      'verification_patterns_active',
    ],
    evidence: [
      { path: 'IntegrationTestResult.json', type: 'file' },
    ],
  },
};
```

### AUDIT Gate

```typescript
const AUDIT_GATE_CRITERIA: GateCriteria = {
  gateId: 'AUDIT',
  description: 'Code review and audit',
  
  planningBrain: {
    completed: [
      'audit_criteria_defined',
    ],
    evidence: [],
  },
  
  executionBrain: {
    completed: [
      'all_outputs_merged',
    ],
    evidence: [],
  },
  
  systemBrain: {
    completed: [
      'security_scan_passed',
      'linter_passed',
    ],
    evidence: [
      { path: 'AuditReport.json', type: 'file' },
    ],
  },
};
```

### DELIVERY Gate

```typescript
const DELIVERY_GATE_CRITERIA: GateCriteria = {
  gateId: 'DELIVERY',
  description: 'Final delivery - ship package',
  
  planningBrain: {
    completed: [
      'delivery_package_prepared',
    ],
    evidence: [
      { path: 'ship-package/', type: 'directory' },
    ],
  },
  
  executionBrain: {
    completed: [
      'all_tasks_complete',
      'outputs_verified',
    ],
    evidence: [],
  },
  
  systemBrain: {
    completed: [
      'all_gates_passed',
      'ship_package_verified',
    ],
    evidence: [
      { path: '.shark/evidence/ship/ContainerTestResult.json', type: 'file' },
    ],
  },
};
```

---

## Gate Evaluation

```typescript
class GateManager {
  private currentGate: GateId = 'PLAN';
  private brainStates: Map<string, Set<string>> = new Map();
  
  // Brain registers completion
  registerCompletion(brainId: string, criterion: string): void {
    if (!this.brainStates.has(brainId)) {
      this.brainStates.set(brainId, new Set());
    }
    this.brainStates.get(brainId)!.add(criterion);
  }
  
  // Check if all criteria met for a gate
  evaluateGateEntry(gateId: GateId): GateEntryResult {
    const criteria = this.getCriteria(gateId);
    
    const planningResult = this.evaluateBrainCriteria(
      'planning', criteria.planningBrain
    );
    const executionResult = this.evaluateBrainCriteria(
      'execution', criteria.executionBrain
    );
    const systemResult = this.evaluateBrainCriteria(
      'system', criteria.systemBrain
    );
    
    const allPassed = planningResult.passed 
      && executionResult.passed 
      && systemResult.passed;
    
    return {
      gateId,
      allPassed,
      details: {
        planning: planningResult,
        execution: executionResult,
        system: systemResult,
      },
      blockers: this.getBlockers(criteria),
    };
  }
  
  private evaluateBrainCriteria(
    brainId: string, 
    criteria: BrainCriteria
  ): BrainCriteriaResult {
    const state = this.brainStates.get(brainId) || new Set();
    
    const completed = criteria.completed.filter(c => state.has(c));
    const missing = criteria.completed.filter(c => !state.has(c));
    
    // Check evidence
    const evidenceResults = (criteria.evidence || []).map(e => ({
      ...e,
      exists: fs.existsSync(e.path),
      checkPassed: e.check ? this.evaluateCheck(e.path, e.check) : true,
    }));
    
    const evidencePassed = evidenceResults.every(e => e.exists && e.checkPassed);
    
    return {
      brainId,
      passed: missing.length === 0 && evidencePassed,
      completed,
      missing,
      evidenceResults,
    };
  }
  
  private getBlockers(criteria: GateCriteria): string[] {
    const blockers: string[] = [];
    
    // Add blockers from each brain
    for (const [brain, crit] of Object.entries(criteria)) {
      for (const missing of crit.completed) {
        blockers.push(`${brain}: ${missing} not complete`);
      }
    }
    
    return blockers;
  }
}

interface GateEntryResult {
  gateId: GateId;
  allPassed: boolean;
  details: {
    planning: BrainCriteriaResult;
    execution: BrainCriteriaResult;
    system: BrainCriteriaResult;
  };
  blockers: string[];
}
```

---

## Gate Advancement

```typescript
// Attempt to advance gate
async function tryAdvanceGate(gateId: GateId): Promise<boolean> {
  const result = gateManager.evaluateGateEntry(gateId);
  
  if (!result.allPassed) {
    console.log(`Gate ${gateId} blocked:`);
    for (const blocker of result.blockers) {
      console.log(`  - ${blocker}`);
    }
    return false;
  }
  
  // All criteria met - advance gate
  await gateManager.advanceGate(gateId);
  
  // Notify all brains
  await notifyGateAdvanced(gateId);
  
  return true;
}

// In each brain - register completions
class PlanningBrain {
  async doWork() {
    // Do planning work
    await this.generateT2();
    await this.generateT1();
    await this.decomposeTasks();
    await this.designateDomains();
    
    // Register completions
    gateManager.registerCompletion('planning', 'T2_master_loaded');
    gateManager.registerCompletion('planning', 'T1_generated');
    gateManager.registerCompletion('planning', 'tasks_decomposed');
    gateManager.registerCompletion('planning', 'domain_designated');
    
    // Try to advance gate
    await tryAdvanceGate('PLAN');
  }
}
```

---

## Gate Hook

```typescript
// Gate hook monitors progress and evaluates
function createGateHook(gateManager: GateManager): Hooks['tool.execute.after'] {
  return async (input, output) => {
    // After any significant tool, re-evaluate gate
    const result = gateManager.evaluateGateEntry(gateManager.getCurrentGate());
    
    if (result.allPassed && result.gateId === gateManager.getCurrentGate()) {
      // Could advance - but don't auto-advance, let Council decide
      await council.notifyGateReadyToAdvance(result);
    }
  };
}
```

---

## Council Gate Coordination

```typescript
class RoundtableCouncil {
  async handleGateReady(result: GateEntryResult): Promise<void> {
    // All brains report their gate is ready
    // Council validates and triggers advancement
    
    const { planning, execution, system } = result.details;
    
    console.log(`Gate ${result.gateId} criteria met:`);
    console.log(`  Planning: ${planning.completed.join(', ')}`);
    console.log(`  Execution: ${execution.completed.join(', ')}`);
    console.log(`  System: ${system.completed.join(', ')}`);
    
    // If TEST gate, verify evidence
    if (result.gateId === 'TEST') {
      const testEvidence = system.evidenceResults.find(
        e => e.path === 'ContainerTestResult.json'
      );
      
      if (!testEvidence || !testEvidence.checkPassed) {
        throw new Error(
          `TEST gate blocked: ContainerTestResult.json passRate < 0.96`
        );
      }
    }
    
    // Advance gate
    await this.kraken.advanceGate(result.gateId);
  }
}
```

---

## Summary Table

| Gate | Planning | Execution | System | Evidence |
|------|----------|-----------|--------|----------|
| PLAN | T2 loaded, T1 generated, tasks decomposed | Containers ready, clusters available | Firewall init, gate manager ready | SPEC.md, plan.md |
| BUILD | Context injected | Tasks spawned, build started | L1/L2 patterns active | — |
| TEST | Test plan generated | Build complete, outputs retrieved | Container tests required | ContainerTestResult.json |
| VERIFY | Verification plan | Integration tests spawned | Verification patterns | IntegrationTestResult.json |
| AUDIT | Audit criteria | All outputs merged | Security/lint passed | AuditReport.json |
| DELIVERY | Package prepared | All tasks complete | All gates passed, ship verified | ship-package/ |

---

*End of Explicit Gate Criteria Spec*