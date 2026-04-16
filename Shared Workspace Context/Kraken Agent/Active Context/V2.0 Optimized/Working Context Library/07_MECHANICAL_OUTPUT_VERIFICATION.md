# MECHANICAL OUTPUT VERIFICATION — V2.0

**File:** `src/subagent-manager/output-verifier.ts`

---

## Core Problem (From First-Hand Experience)

From building the Shark Agent v4.8.3:

```
spawn_shark_agent → task.success = true → MOVE ON
                    ↑
            Outputs trapped in container!
```

**Discovery:** Parallel tasks completed successfully but outputs stayed in container filesystems. Orchestrator must explicitly retrieve and merge outputs. **Task completion ≠ outputs on host.**

---

## V1.2 Trust-Based Model (PROBLEM)

```typescript
// V1.2: Trust-based completion
class SubagentManager {
  handleTaskComplete(taskId: string) {
    const status = this.tasks.get(taskId);
    
    // TRUST-BASED: Just believe the subagent
    if (status.success) {
      this.markComplete(taskId); // ❌ Outputs might not be on host!
    }
  }
}
```

**Problem:** If subagent claims success but outputs are in container, build appears complete but files are missing.

---

## V2.0 Mechanical Verification Model

```typescript
// V2.0: Mechanical verification
interface OutputCheckpoint {
  taskId: string;
  containerPath: string;
  hostPath: string;
  retrieved: boolean;
  verified: boolean;
  verifiedAt?: Date;
}

class OutputVerifier {
  private checkpoints: Map<string, OutputCheckpoint[]> = new Map();
  
  // Register expected outputs BEFORE task starts
  registerOutputs(taskId: string, outputs: OutputDeclaration[]): void {
    const checkpoints: OutputCheckpoint[] = outputs.map(out => ({
      taskId,
      containerPath: out.containerPath,
      hostPath: out.hostPath,
      retrieved: false,
      verified: false,
    }));
    
    this.checkpoints.set(taskId, checkpoints);
  }
  
  // Claim outputs retrieved — MUST verify mechanically
  async claimRetrieved(taskId: string, retrievedPaths: string[]): Promise<void> {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) {
      throw new Error(`No checkpoints registered for task ${taskId}`);
    }
    
    // Verify EACH output exists on host
    for (const path of retrievedPaths) {
      const checkpoint = checkpoints.find(c => c.hostPath === path);
      
      if (!checkpoint) {
        throw new Error(
          `L2_OUTPUT_NOT_DECLARED: ${path} not in checkpoint registry`
        );
      }
      
      if (!fs.existsSync(path)) {
        throw new Error(
          `L2_OUTPUT_NOT_RETRIEVED: ${checkpoint.containerPath} → ${path}`
        );
      }
      
      checkpoint.retrieved = true;
      checkpoint.verified = true;
      checkpoint.verifiedAt = new Date();
    }
  }
  
  // Check if task can be marked complete
  canComplete(taskId: string): boolean {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) return false;
    
    // ALL checkpoints must be verified
    return checkpoints.every(c => c.verified);
  }
}
```

---

## Output Declaration Schema

```typescript
interface OutputDeclaration {
  containerPath: string;  // Where output is in container
  hostPath: string;       // Where it should be on host
  type: 'file' | 'directory';
  required: boolean;
  size?: number;          // Optional size check
}

interface TaskSpec {
  taskId: string;
  command: string;
  outputs: OutputDeclaration[];  // REQUIRED in V2.0
  cluster: 'alpha' | 'beta' | 'gamma';
  focus: string;
}
```

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OUTPUT VERIFICATION WORKFLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. TASK SUBMITTED                                                   │
│     └─ Planning Brain decomposes task                               │
│         └─ outputs declared with containerPath + hostPath           │
│             └─ OutputVerifier.registerOutputs()                    │
│                                                                      │
│  2. TASK EXECUTING                                                   │
│     └─ SubagentManager.spawn()                                      │
│         └─ Container runs task                                       │
│             └─ Outputs placed in container                           │
│                                                                      │
│  3. TASK COMPLETES                                                   │
│     └─ Subagent claims: "outputs ready"                             │
│         └─ OutputVerifier.claimRetrieved(paths)                     │
│             └─ fs.existsSync() check for EACH path                 │
│                 └─ THROW if any missing                            │
│                                                                      │
│  4. VERIFICATION                                                     │
│     └─ OutputVerifier.canComplete(taskId)                            │
│         └─ ALL checkpoints.verified === true                        │
│             └─ Only then markComplete()                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Code Examples

### Task Submission with Outputs

```typescript
// Planning Brain submits task with output declarations
const taskSpec: TaskSpec = {
  taskId: 'build-001',
  command: 'npm run build',
  outputs: [
    {
      containerPath: '/app/dist/index.js',
      hostPath: '/home/user/project/dist/index.js',
      type: 'file',
      required: true
    },
    {
      containerPath: '/app/dist/manifest.json',
      hostPath: '/home/user/project/dist/manifest.json',
      type: 'file',
      required: true
    }
  ],
  cluster: 'alpha',
  focus: 'frontend-build'
};

await subagentManager.spawn(taskSpec);
```

### Output Retrieval with Verification

```typescript
// Subagent reports outputs retrieved
async function retrieveOutputs(taskId: string, containerPaths: string[]): Promise<void> {
  const hostPaths = containerPaths.map(c => convertContainerToHost(c));
  
  // THIS IS THE MECHANICAL CHECK
  await outputVerifier.claimRetrieved(taskId, hostPaths);
  
  // If we reach here, all outputs verified
  console.log(`✅ All outputs verified for ${taskId}`);
}

// If outputs not on host, throws:
throw new Error(
  `L2_OUTPUT_NOT_RETRIEVED: /app/dist/index.js → /home/user/project/dist/index.js`
);
```

### Task Completion Check

```typescript
// Before marking task complete
if (!outputVerifier.canComplete(taskId)) {
  throw new Error(
    `L2_INCOMPLETE_OUTPUT: Cannot complete ${taskId} - outputs not verified`
  );
}

await subagentManager.markComplete(taskId);
```

---

## Evidence Collection

```typescript
interface OutputEvidence {
  taskId: string;
  checkpointCount: number;
  verifiedCount: number;
  checkpoints: {
    containerPath: string;
    hostPath: string;
    verified: boolean;
    verifiedAt?: string;
  }[];
  canComplete: boolean;
}

function collectEvidence(taskId: string): OutputEvidence {
  const checkpoints = outputVerifier.getCheckpoints(taskId);
  
  return {
    taskId,
    checkpointCount: checkpoints.length,
    verifiedCount: checkpoints.filter(c => c.verified).length,
    checkpoints: checkpoints.map(c => ({
      containerPath: c.containerPath,
      hostPath: c.hostPath,
      verified: c.verified,
      verifiedAt: c.verifiedAt?.toISOString(),
    })),
    canComplete: outputVerifier.canComplete(taskId),
  };
}
```

---

## Error Types

| Error Code | Description | Recovery |
|------------|-------------|----------|
| L2_OUTPUT_NOT_DECLARED | Output claimed but not in spec | Add to task spec |
| L2_OUTPUT_NOT_RETRIEVED | File doesn't exist on host | Re-retrieve from container |
| L2_OUTPUT_INCOMPLETE | Some outputs missing | Re-retrieve missing |
| L2_VERIFICATION_FAILED | fs.existsSync() returned false | Check container state |

---

## Integration with Other Systems

### With Execution Brain

```typescript
// Execution Brain monitors output retrieval
class ExecutionBrain {
  async superviseTask(taskId: string) {
    const status = await this.getTaskStatus(taskId);
    
    if (status.success && !outputVerifier.canComplete(taskId)) {
      // Override: retrieve outputs
      await this.sendOverride({
        type: 'OVERRIDE',
        action: 'RETRIEVE_OUTPUTS',
        target: { taskId },
        priority: 'critical',
      });
    }
  }
}
```

### With System Brain (L2 Pattern)

```typescript
// System Brain enforces output verification
class SystemBrain {
  checkL2FalseCompletion(taskId: string, status: TaskStatus): void {
    if (status.success && !outputVerifier.canComplete(taskId)) {
      throw new Error(
        `[L2_FALSE_COMPLETION] Task ${taskId} claims success but outputs not verified`
      );
    }
  }
}
```

### With Roundtable Council

```typescript
// Gamma monitors output verification
class GammaBrain {
  async verifyTaskOutputs(taskId: string): Promise<boolean> {
    const evidence = collectEvidence(taskId);
    
    if (!evidence.canComplete) {
      await this.reportToCouncil({
        type: 'GATE_FAILURE',
        gate: 'output-retrieval-gate',
        evidence,
      });
      return false;
    }
    
    return true;
  }
}
```

---

## Test Cases

```typescript
const tests = [
  {
    name: 'All outputs verified → can complete',
    setup: async () => {
      outputVerifier.registerOutputs('task-1', [
        { containerPath: '/app/out.js', hostPath: '/host/out.js', type: 'file' }
      ]);
      fs.writeFileSync('/host/out.js', 'content');
      await outputVerifier.claimRetrieved('task-1', ['/host/out.js']);
    },
    expect: outputVerifier.canComplete('task-1') === true
  },
  {
    name: 'Output not on host → throws',
    setup: async () => {
      outputVerifier.registerOutputs('task-2', [
        { containerPath: '/app/out.js', hostPath: '/host/out.js', type: 'file' }
      ]);
      // NOT writing file to host
    },
    expect: async () => {
      try {
        await outputVerifier.claimRetrieved('task-2', ['/host/out.js']);
        return false; // Should have thrown
      } catch (e) {
        return e.message.includes('L2_OUTPUT_NOT_RETRIEVED');
      }
    }
  },
  {
    name: 'Undeclared output → throws',
    setup: async () => {
      outputVerifier.registerOutputs('task-3', []);
    },
    expect: async () => {
      try {
        await outputVerifier.claimRetrieved('task-3', ['/host/out.js']);
        return false;
      } catch (e) {
        return e.message.includes('L2_OUTPUT_NOT_DECLARED');
      }
    }
  }
];
```

---

## Summary

**V1.2:** Trust-based, `if (status.success) markComplete()`

**V2.0:** Mechanical, `if (all checkpoints.verified) markComplete()`

Every output must:
1. Be declared in task spec
2. Exist at declared hostPath (fs.existsSync)
3. Be marked verified after retrieval

No trust, only proof.

---

*End of Mechanical Output Verification Spec*