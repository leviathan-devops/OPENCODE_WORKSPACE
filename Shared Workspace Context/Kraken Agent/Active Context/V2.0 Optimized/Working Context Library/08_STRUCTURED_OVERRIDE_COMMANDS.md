# STRUCTURED OVERRIDE COMMANDS — V2.0

**File:** `src/brains/execution/override-commands.ts`

---

## Core Problem (From First-Hand Experience)

From Shark Agent v4.8.3 build, discovered that natural language overrides can be misinterpreted:

**Scenario:**
1. Execution Brain sends override: "ABORT - you claimed success without outputs"
2. Subagent interprets: "User wants me to abort"
3. Subagent asks: "Can I abort?"
4. Execution Brain says: "YES"
5. But original intent was about OUTPUTS, not abort authority

The disconnect: Override message described a *reason*, not an *action*.

---

## V1.2 Natural Language Model (PROBLEM)

```typescript
// V1.2: Natural language override
interface OverrideMessage {
  reason: string;      // "you claimed success without outputs"
  action: string;      // "abort" (interpreted)
  from: string;
  to: string;
}

await brainMessenger.send({
  from: 'kraken-execution',
  to: 'subagent-manager',
  message: "ABORT - you claimed success without outputs"
});
```

**Problems:**
1. Ambiguous: "ABORT" could mean many things
2. Requires interpretation: What kind of abort?
3. Reason/action conflated: Is "ABORT" the action or the reason?
4. No structured response expected

---

## V2.0 Structured Command Model

```typescript
// V2.0: Structured override command
interface OverrideCommand {
  id: string;                    // Unique command ID
  type: 'OVERRIDE';              // Always 'OVERRIDE'
  action: OverrideAction;        // Typed action
  target: OverrideTarget;        // Who/what
  payload: OverridePayload;      // Action-specific data
  constraints?: OverrideConstraints;  // Conditions for execution
  priority: 'critical' | 'high';
  requiresAck: boolean;
  expiresAt?: Date;              // Optional timeout
  createdAt: Date;
}

type OverrideAction =
  | 'ABORT'              // Stop task entirely
  | 'CLAIM_COMPLETE'     // Verify completion conditions
  | 'REASSIGN'           // Move to different cluster
  | 'RETRIEVE_OUTPUTS'   // Mandatory output retrieval
  | 'RETRY'              // Retry failed operation
  | 'SUSPEND'           // Pause task
  | 'RESUME';            // Resume suspended task

interface OverrideTarget {
  brainId?: string;      // Target brain (optional if taskId given)
  taskId?: string;      // Target task
  clusterId?: string;   // Target cluster
}

interface OverridePayload {
  // For ABORT
  reason?: string;      // Why abort
  force?: boolean;      // Force abort even if risky
  
  // For CLAIM_COMPLETE
  evidence?: string[];  // Required evidence paths
  verifyOutputs?: boolean;  // Verify output retrieval
  
  // For REASSIGN
  targetCluster?: 'alpha' | 'beta' | 'gamma';
  reassignReason?: string;
}

interface OverrideConstraints {
  requiresEvidence?: string[];     // Files that must exist
  evidenceCheck?: string;          // e.g., 'passRate >= 0.96'
  maxRetries?: number;
  timeout?: number;                // ms
}
```

---

## Override Command Examples

### Example 1: ABORT

```typescript
const cmd: OverrideCommand = {
  id: 'ovr-001',
  type: 'OVERRIDE',
  action: 'ABORT',
  target: { taskId: 'task-123' },
  payload: {
    reason: 'Task claimed success but outputs not retrieved',
    force: false,
  },
  priority: 'critical',
  requiresAck: true,
  createdAt: new Date(),
};
```

### Example 2: CLAIM_COMPLETE with Constraints

```typescript
const cmd: OverrideCommand = {
  id: 'ovr-002',
  type: 'OVERRIDE',
  action: 'CLAIM_COMPLETE',
  target: { taskId: 'task-456' },
  payload: {
    evidence: ['ContainerTestResult.json'],
    verifyOutputs: true,
  },
  constraints: {
    requiresEvidence: ['ContainerTestResult.json'],
    evidenceCheck: 'passRate >= 0.96',
  },
  priority: 'critical',
  requiresAck: true,
};
```

### Example 3: RETRIEVE_OUTPUTS

```typescript
const cmd: OverrideCommand = {
  id: 'ovr-003',
  type: 'OVERRIDE',
  action: 'RETRIEVE_OUTPUTS',
  target: { taskId: 'task-789' },
  payload: {},
  constraints: {
    timeout: 30000,  // 30 seconds
  },
  priority: 'high',
  requiresAck: true,
};
```

### Example 4: REASSIGN

```typescript
const cmd: OverrideCommand = {
  id: 'ovr-004',
  type: 'OVERRIDE',
  action: 'REASSIGN',
  target: { taskId: 'task-101', clusterId: 'alpha' },
  payload: {
    targetCluster: 'beta',
    reassignReason: 'Debug task requires precision cluster',
  },
  priority: 'high',
  requiresAck: true,
};
```

---

## Override Response Schema

```typescript
interface OverrideResponse {
  commandId: string;           // Matches OverrideCommand.id
  status: 'acknowledged' | 'executing' | 'completed' | 'rejected' | 'failed';
  result?: OverrideResult;
  error?: OverrideError;
  respondedAt: Date;
}

interface OverrideResult {
  action: OverrideAction;       // What was done
  outputs?: string[];          // For RETRIEVE_OUTPUTS
  evidence?: EvidenceRef[];    // For CLAIM_COMPLETE
  reassignedTo?: string;       // For REASSIGN
}

interface OverrideError {
  code: string;                // e.g., 'CONSTRAINT_NOT_MET'
  message: string;
  constraintFailed?: string;    // Which constraint failed
  canRetry: boolean;
}
```

---

## Execution Brain Override Sender

```typescript
class ExecutionBrain {
  private commandId = 0;
  
  async sendOverride(params: {
    action: OverrideAction;
    target: OverrideTarget;
    payload?: OverridePayload;
    constraints?: OverrideConstraints;
    priority?: 'critical' | 'high';
  }): Promise<OverrideCommand> {
    const command: OverrideCommand = {
      id: `ovr-${++this.commandId}`,
      type: 'OVERRIDE',
      action: params.action,
      target: params.target,
      payload: params.payload || {},
      constraints: params.constraints,
      priority: params.priority || 'high',
      requiresAck: true,
      createdAt: new Date(),
    };
    
    await this.messenger.send(command);
    return command;
  }
  
  // Convenience methods
  async abortTask(taskId: string, reason: string): Promise<void> {
    await this.sendOverride({
      action: 'ABORT',
      target: { taskId },
      payload: { reason },
      priority: 'critical',
    });
  }
  
  async enforceOutputRetrieval(taskId: string): Promise<void> {
    await this.sendOverride({
      action: 'RETRIEVE_OUTPUTS',
      target: { taskId },
      payload: {},
      constraints: { timeout: 30000 },
      priority: 'critical',
    });
  }
  
  async verifyCompletion(taskId: string, evidencePaths: string[]): Promise<void> {
    await this.sendOverride({
      action: 'CLAIM_COMPLETE',
      target: { taskId },
      payload: { evidence: evidencePaths, verifyOutputs: true },
      constraints: {
        requiresEvidence: evidencePaths,
        evidenceCheck: 'passRate >= 0.96',
      },
      priority: 'critical',
    });
  }
}
```

---

## Subagent-Manager Override Handler

```typescript
class SubagentManager {
  private pendingCommands: Map<string, OverrideCommand> = new Map();
  
  // Receive and execute override command
  async handleOverride(command: OverrideCommand): Promise<OverrideResponse> {
    // Validate command
    if (!this.validateCommand(command)) {
      return {
        commandId: command.id,
        status: 'rejected',
        error: { code: 'INVALID_COMMAND', message: 'Malformed command', canRetry: false },
        respondedAt: new Date(),
      };
    }
    
    // Store pending
    this.pendingCommands.set(command.id, command);
    
    try {
      // Execute based on action
      const result = await this.executeOverride(command);
      
      return {
        commandId: command.id,
        status: 'completed',
        result,
        respondedAt: new Date(),
      };
    } catch (error) {
      return {
        commandId: command.id,
        status: 'failed',
        error: {
          code: 'EXECUTION_FAILED',
          message: error.message,
          canRetry: true,
        },
        respondedAt: new Date(),
      };
    }
  }
  
  private async executeOverride(command: OverrideCommand): Promise<OverrideResult> {
    switch (command.action) {
      case 'ABORT':
        return this.executeAbort(command);
      case 'CLAIM_COMPLETE':
        return this.executeClaimComplete(command);
      case 'RETRIEVE_OUTPUTS':
        return this.executeRetrieveOutputs(command);
      case 'REASSIGN':
        return this.executeReassign(command);
      default:
        throw new Error(`Unknown action: ${command.action}`);
    }
  }
  
  private async executeAbort(command: OverrideCommand): Promise<OverrideResult> {
    const { taskId } = command.target;
    const { reason, force } = command.payload;
    
    await this.abortTask(taskId, { reason, force });
    
    return { action: 'ABORT' };
  }
  
  private async executeClaimComplete(command: OverrideCommand): Promise<OverrideResult> {
    const { taskId } = command.target;
    const { evidence, verifyOutputs } = command.payload;
    
    // Check constraints
    if (command.constraints?.requiresEvidence) {
      for (const path of command.constraints.requiresEvidence) {
        if (!fs.existsSync(path)) {
          throw new Error(
            `CONSTRAINT_NOT_MET: ${path} does not exist`
          );
        }
      }
    }
    
    // Verify outputs if required
    if (verifyOutputs) {
      const outputs = this.outputVerifier.getCheckpoints(taskId);
      const allVerified = outputs.every(o => o.verified);
      if (!allVerified) {
        throw new Error('CONSTRAINT_NOT_MET: Not all outputs verified');
      }
    }
    
    return { 
      action: 'CLAIM_COMPLETE',
      evidence: evidence?.map(e => ({ path: e })),
    };
  }
  
  private async executeRetrieveOutputs(command: OverrideCommand): Promise<OverrideResult> {
    const { taskId } = command.target;
    
    const outputPaths = await this.retrieveTaskOutputs(taskId);
    
    return { 
      action: 'RETRIEVE_OUTPUTS',
      outputs: outputPaths,
    };
  }
  
  private async executeReassign(command: OverrideCommand): Promise<OverrideResult> {
    const { taskId, clusterId } = command.target;
    const { targetCluster, reassignReason } = command.payload;
    
    await this.moveTaskToCluster(taskId, targetCluster, { reason: reassignReason });
    
    return { 
      action: 'REASSIGN',
      reassignedTo: targetCluster,
    };
  }
}
```

---

## Integration with Brain Messenger

```typescript
// Brain Messenger handles structured commands
class BrainMessenger {
  async send(command: OverrideCommand): Promise<void> {
    // Structured command sent through message queue
    await this.queue.push({
      type: 'OVERRIDE',
      payload: command,
      priority: command.priority,
    });
    
    if (command.requiresAck) {
      await this.waitForAck(command.id, 30000);  // 30s timeout
    }
  }
}
```

---

## Override Triggers

### Trigger 1: Output Not Retrieved

```typescript
// When: Subagent claims success but outputs not verified
if (status.success && !outputVerifier.canComplete(taskId)) {
  await executionBrain.sendOverride({
    action: 'RETRIEVE_OUTPUTS',
    target: { taskId },
    payload: {},
    priority: 'critical',
  });
}
```

### Trigger 2: Completion Claim Without Evidence

```typescript
// When: Subagent claims complete but no evidence
if (subagent.claimsComplete(taskId) && !subagent.hasEvidence(taskId)) {
  await executionBrain.sendOverride({
    action: 'CLAIM_COMPLETE',
    target: { taskId },
    payload: { evidence: requiredEvidence, verifyOutputs: true },
    constraints: { requiresEvidence: requiredEvidence },
    priority: 'critical',
  });
}
```

### Trigger 3: Wrong Cluster Assignment

```typescript
// When: Task assigned to wrong cluster type
if (task.type === 'debug' && task.cluster !== 'beta') {
  await executionBrain.sendOverride({
    action: 'REASSIGN',
    target: { taskId: task.id, clusterId: task.cluster },
    payload: { 
      targetCluster: 'beta',
      reassignReason: 'Debug tasks require Beta precision cluster'
    },
    priority: 'high',
  });
}
```

---

## Error Handling

```typescript
// Subagent receives malformed command
const response = await subagent.handleOverride(command);

if (response.status === 'rejected') {
  // Command was malformed
  console.error(`Override ${command.id} rejected: ${response.error.message}`);
  // Execution Brain will need to resend corrected command
}

if (response.status === 'failed') {
  // Execution failed
  if (response.error.canRetry) {
    // Retry might help
    await subagent.handleRetry(command.id);
  } else {
    // Unrecoverable
    await executionBrain.notifyFailure(command.id, response.error);
  }
}
```

---

## Summary

| Aspect | V1.2 | V2.0 |
|--------|------|------|
| Format | Natural language | Typed schema |
| Actions | String ("abort") | Enum (ABORT, RETRIEVE_OUTPUTS...) |
| Validation | None | Schema validation |
| Constraints | None | Explicit constraints object |
| Response | Implicit | Structured OverrideResponse |
| Errors | Text | Error codes + canRetry flag |

---

*End of Structured Override Commands Spec*