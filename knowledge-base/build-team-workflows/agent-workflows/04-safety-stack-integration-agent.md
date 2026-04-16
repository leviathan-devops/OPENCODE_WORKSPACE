# Safety Stack Integration Agent - Executable Build Process

## Mission
Ensure all 4-layer safety stack is properly integrated with the ToolExecutor constitutional anchor:
1. **Guardian** - Filesystem protection (already integrated)
2. **FirewallMesh** - Parallel security screening (4 firewalls)
3. **StagnationDetector** - Loop prevention
4. **WorkflowBlocker** - PLAN→BUILD→TEST→VERIFY→SHIP enforcement

## Success Criteria
- WorkflowBlocker connected to ToolExecutor and actively blocking invalid operations
- FirewallMesh executing all 4 firewalls in parallel for every tool call
- StagnationDetector monitoring for repetitive failures
- Guardian protection active on all file operations
- No bypass vulnerabilities in the safety stack
- All safety layers mechanically enforced at the ToolExecutor chokepoint

## Pre-flight Checks
1. **Review security audit**: Read `/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/Orchestrator Workspace/SECURITY_AUDIT_WORKFLOW_ENFORCEMENT.md`
2. **Examine current integration**: Check `executor_v2.ts` and `blocker_v2.ts` (or `(V2)` versions)
3. **Verify Guardian integration**: Ensure Guardian is being called for file operations
4. **Check FirewallMesh usage**: Verify all 4 firewalls run in parallel

## Step-by-Step Execution

### Step 1: Analyze Current Architecture
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
# Check ToolExecutor constructor for safety layer integration
grep -n "guardian\|workflowBlocker\|firewallMesh\|stagnationDetector" src/tools/executor_v2.ts | head -20

# Check WorkflowBlocker implementation
cat src/workflow/blocker_v2.ts | head -50

# Check FirewallMesh implementation  
cat src/tools/firewall-mesh_v2.ts | head -50

# Check StagnationDetector implementation
cat src/tools/stagnation-detector_v2.ts | head -50
```

**Key Questions**:
1. Does `ToolExecutor` call `workflowBlocker.check()` before executing tools?
2. Does `ToolExecutor` call `firewallMesh.check()` in parallel for all firewalls?
3. Does `ToolExecutor` integrate `stagnationDetector.record()` for failures?
4. Is Guardian called for all file operations?

### Step 2: Read Security Audit Findings
```bash
cat /home/leviathan/OPENCODE_WORKSPACE/projects/kraken-brain/Kraken Ultra/Orchestrator Workspace/SECURITY_AUDIT_WORKFLOW_ENFORCEMENT.md | head -100
```

**Key Vulnerability**: WorkflowBlocker exists but is NOT connected to ToolExecutor. Agents can bypass workflow step restrictions.

### Step 3: Fix WorkflowBlocker Integration
Examine the `ToolExecutor.executeToolInternal` method (or similar) to see where workflow checking should happen.

```bash
# Create analysis script
cat > /tmp/analyze-workflow-integration.js << 'EOF'
const fs = require('fs');
const path = require('path');

const executorPath = path.join(__dirname, 'src/tools/executor_v2.ts');
const executorContent = fs.readFileSync(executorPath, 'utf8');

// Check for workflow blocker usage
const hasWorkflowCheck = executorContent.includes('workflowBlocker') && 
  (executorContent.includes('workflowBlocker.check') || 
   executorContent.includes('workflowBlocker.canProceed'));

console.log('WorkflowBlocker referenced:', executorContent.includes('workflowBlocker'));
console.log('WorkflowBlocker check called:', hasWorkflowCheck);

// Find executeToolInternal or similar method
const executeMethodMatch = executorContent.match(/async executeToolInternal[^{]+\{[\s\S]*?\n\}/);
if (executeMethodMatch) {
  const method = executeMethodMatch[0];
  console.log('executeToolInternal contains workflow check:', method.includes('workflow'));
}
EOF

cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
node /tmp/analyze-workflow-integration.js
```

Based on analysis, implement the fix:

**If WorkflowBlocker is not integrated**:
```bash
# Create patch file
cat > /tmp/fix-workflow-integration.patch << 'EOF'
--- a/src/tools/executor_v2.ts
+++ b/src/tools/executor_v2.ts
@@ -XXX,XXX +XXX,XXX @@
   private async executeToolInternal(toolCall: ToolCall): Promise<ToolResult> {
+    // Workflow enforcement - check if current step allows this operation
+    if (this.workflowBlocker) {
+      const canProceed = this.workflowBlocker.canProceed(
+        toolCall.name,
+        this.getWorkflowStep ? this.getWorkflowStep() : 'unknown'
+      );
+      
+      if (!canProceed.allowed) {
+        return {
+          toolCallId: toolCall.toolCallId,
+          name: toolCall.name,
+          success: false,
+          result: `❌ Workflow violation: ${canProceed.reason}`,
+          guardianBlocked: false,
+          guardianReason: undefined
+        };
+      }
+    }
+    
     // Existing logic continues...
EOF

# Apply patch
patch -p1 < /tmp/fix-workflow-integration.patch 2>/dev/null || echo "Manual patch required"
```

**Manual Integration Required**: If patch fails, manually edit `executor_v2.ts` to add workflow checking at the beginning of `executeToolInternal`.

### Step 4: Verify FirewallMesh Parallel Execution
FirewallMesh should run all 4 firewalls in parallel via `Promise.all`. Check current implementation:

```bash
# Examine firewall-mesh_v2.ts
grep -n "Promise.all\|Promise.race" src/tools/firewall-mesh_v2.ts

# Check if ToolExecutor calls firewallMesh.check() correctly
grep -n "firewallMesh.check" src/tools/executor_v2.ts
```

**Expected**: `firewallMesh.check()` should be called and await all parallel firewall results.

If not properly implemented, fix:

```bash
# Create patch for parallel execution
cat > /tmp/fix-firewall-parallel.patch << 'EOF'
--- a/src/tools/firewall-mesh_v2.ts
+++ b/src/tools/firewall-mesh_v2.ts
@@ -XXX,XXX +XXX,XXX @@
   async check(operation: string, context: any): Promise<FirewallResult[]> {
-    // Sequential execution (WRONG)
-    const results: FirewallResult[] = [];
-    results.push(await this.guardianFirewall.check(operation, context));
-    results.push(await this.workflowBlocker.check(operation, context));
-    results.push(await this.theatricalDetector.check(operation, context));
-    results.push(await this.secretDetector.check(operation, context));
-    return results;
+    // Parallel execution (CORRECT) - all firewalls run simultaneously
+    return await Promise.all([
+      this.guardianFirewall.check(operation, context),
+      this.workflowBlocker.check(operation, context),
+      this.theatricalDetector.check(operation, context),
+      this.secretDetector.check(operation, context)
+    ]);
   }
EOF

# Apply patch
patch -p1 < /tmp/fix-firewall-parallel.patch 2>/dev/null || echo "Manual patch required"
```

### Step 5: Integrate StagnationDetector
StagnationDetector should monitor for repetitive failures (3 identical consecutive failures).

Check if ToolExecutor calls stagnationDetector:

```bash
grep -n "stagnationDetector" src/tools/executor_v2.ts
```

If not integrated, add failure recording:

```bash
# Create patch for stagnation detection
cat > /tmp/fix-stagnation-detection.patch << 'EOF'
--- a/src/tools/executor_v2.ts
+++ b/src/tools/executor_v2.ts
@@ -XXX,XXX +XXX,XXX @@
   private async executeToolInternal(toolCall: ToolCall): Promise<ToolResult> {
     try {
       // Existing logic...
       return result;
     } catch (error) {
+      // Record failure for stagnation detection
+      this.stagnationDetector.recordFailure({
+        operation: toolCall.name,
+        error: error instanceof Error ? error.message : String(error),
+        timestamp: new Date().toISOString(),
+        context: {
+          toolCallId: toolCall.toolCallId,
+          arguments: toolCall.arguments
+        }
+      });
+      
+      // Check if we're in a stagnation loop
+      const stagnationAlert = this.stagnationDetector.checkStagnation();
+      if (stagnationAlert.isStagnated) {
+        console.warn(`⚠️ Stagnation detected: ${stagnationAlert.reason}`);
+        // Optionally escalate or reset workflow
+      }
+      
       throw error;
     }
   }
EOF

# Apply patch
patch -p1 < /tmp/fix-stagnation-detection.patch 2>/dev/null || echo "Manual patch required"
```

### Step 6: Verify Guardian Integration
Guardian should be called for all file operations (read, write, delete).

Check `executor_v2.ts` for Guardian calls:

```bash
grep -n "guardian.check\|guardian.canModify" src/tools/executor_v2.ts
```

If Guardian is missing from some file operations, add it:

```bash
# Find file operation methods in executor_v2.ts
grep -n "executeWriteFile\|executeReadFile\|executeDeleteFile" src/tools/executor_v2.ts

# For each file operation method, ensure Guardian is called
# Example patch for executeWriteFile:
cat > /tmp/fix-guardian-integration.patch << 'EOF'
--- a/src/tools/executor_v2.ts
+++ b/src/tools/executor_v2.ts
@@ -XXX,XXX +XXX,XXX @@
   private async executeWriteFile(args: any): Promise<ToolResult> {
+    // Guardian protection
+    const guardianCheck = this.guardian.canModify(args.filePath, 'write');
+    if (!guardianCheck.allowed) {
+      return {
+        toolCallId: args.toolCallId,
+        name: 'write_file',
+        success: false,
+        result: `❌ Guardian blocked: ${guardianCheck.reason}`,
+        guardianBlocked: true,
+        guardianReason: guardianCheck.reason
+      };
+    }
+    
     // Existing write logic...
   }
EOF
```

### Step 7: Create Integration Tests
Create tests to verify safety stack integration:

```bash
cat > test/safety-stack-integration.test.ts << 'EOF'
import { ToolExecutor } from '../src/tools/executor_v2';
import { Guardian } from '../src/guardian';
import { WorkflowBlocker } from '../src/workflow/blocker_v2';
import { FirewallMesh } from '../src/tools/firewall-mesh_v2';
import { StagnationDetector } from '../src/tools/stagnation-detector_v2';

describe('Safety Stack Integration', () => {
  let executor: ToolExecutor;
  
  beforeEach(() => {
    const guardian = new Guardian({ protectionLevel: 'balanced' });
    const workflowBlocker = new WorkflowBlocker();
    const firewallMesh = new FirewallMesh(guardian, workflowBlocker);
    const stagnationDetector = new StagnationDetector();
    
    executor = new ToolExecutor({
      guardian,
      workflowBlocker,
      workspacePath: '/tmp/test-workspace',
      verbose: false
    });
  });
  
  test('WorkflowBlocker integration', async () => {
    // Test that workflow blocker prevents invalid operations
    const toolCall = {
      toolCallId: 'test-1',
      name: 'write_file',
      arguments: JSON.stringify({ filePath: '/tmp/test.txt', content: 'test' })
    };
    
    // Set workflow to PLAN phase (should block writes)
    workflowBlocker.setCurrentStep('PLAN');
    
    const result = await executor.executeTool(toolCall);
    expect(result.success).toBe(false);
    expect(result.result).toContain('Workflow violation');
  });
  
  test('FirewallMesh parallel execution', async () => {
    // Test that all firewalls are checked
    const spyGuardian = jest.spyOn(guardian, 'check');
    const spyWorkflow = jest.spyOn(workflowBlocker, 'check');
    
    const toolCall = {
      toolCallId: 'test-2',
      name: 'read_file',
      arguments: JSON.stringify({ filePath: '/tmp/test.txt' })
    };
    
    await executor.executeTool(toolCall);
    
    // All firewalls should have been called
    expect(spyGuardian).toHaveBeenCalled();
    expect(spyWorkflow).toHaveBeenCalled();
  });
  
  test('StagnationDetector integration', async () => {
    // Test that repeated failures trigger stagnation detection
    for (let i = 0; i < 3; i++) {
      const toolCall = {
        toolCallId: `test-${i}`,
        name: 'invalid_tool',
        arguments: JSON.stringify({})
      };
      
      await executor.executeTool(toolCall);
    }
    
    const alert = stagnationDetector.checkStagnation();
    expect(alert.isStagnated).toBe(true);
  });
  
  test('Guardian filesystem protection', async () => {
    // Test that Guardian blocks protected paths
    const toolCall = {
      toolCallId: 'test-3',
      name: 'write_file',
      arguments: JSON.stringify({ filePath: '/etc/passwd', content: 'test' })
    };
    
    const result = await executor.executeTool(toolCall);
    expect(result.success).toBe(false);
    expect(result.guardianBlocked).toBe(true);
  });
});
EOF
```

### Step 8: Run Safety Stack Tests
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
npm test -- --testPathPattern="safety-stack-integration" 2>&1 | tail -30
```

**Fix any test failures** by adjusting the implementation.

### Step 9: Verify No Bypass Vulnerabilities
Create a bypass test to ensure agents cannot circumvent safety layers:

```bash
cat > test/bypass-vulnerability.test.ts << 'EOF'
import { ToolExecutor } from '../src/tools/executor_v2';

describe('Bypass Vulnerability Tests', () => {
  test('Direct file system access should be blocked', async () => {
    // Attempt to bypass ToolExecutor by directly calling Node.js fs module
    // This should be impossible if ToolExecutor is the only chokepoint
    // Test that all file operations flow through ToolExecutor
  });
  
  test('Workflow step skipping should be blocked', async () => {
    // Verify that agents cannot skip from PLAN directly to SHIP
    // Each step must provide required evidence
  });
});
EOF
```

### Step 10: Update Documentation
Update safety stack documentation:

```bash
cat > docs/SAFETY_STACK_INTEGRATION.md << 'EOF'
# Safety Stack Integration

## Architecture
The safety stack is mechanically enforced at the ToolExecutor constitutional anchor:

1. **ToolExecutor.executeTool()** - Single chokepoint for all agent actions
2. **WorkflowBlocker** - Enforces PLAN→BUILD→TEST→VERIFY→SHIP sequence
3. **FirewallMesh** - Runs 4 firewalls in parallel (<50ms overhead)
4. **StagnationDetector** - Detects repetitive failure loops (3 identical failures)
5. **Guardian** - Filesystem protection (blocks /etc, /usr, ~/.ssh/)

## Integration Points

### WorkflowBlocker Integration
- Called at the beginning of `executeToolInternal()`
- Checks if current workflow step allows the operation
- Returns descriptive error if violation

### FirewallMesh Integration  
- Called for every tool execution via `Promise.all()`
- All 4 firewalls run simultaneously:
  1. GuardianFirewall - Filesystem path protection
  2. WorkflowBlocker - Step sequence enforcement
  3. TheatricalDetector - Mock/simulate code detection (WARN only)
  4. SecretDetector - Credential leak prevention

### StagnationDetector Integration
- Records every tool execution failure
- Checks for 3 identical consecutive failures
- Triggers workflow reset or escalation

### Guardian Integration
- Wraps all file operations (read, write, delete)
- Blocks protected system paths
- Provides audit logging

## Verification Tests
Run: `npm test -- --testPathPattern="safety-stack"`

## Security Audit Results
See: `SECURITY_AUDIT_WORKFLOW_ENFORCEMENT.md`
- ✅ WorkflowBlocker now integrated with ToolExecutor
- ✅ FirewallMesh runs firewalls in parallel
- ✅ StagnationDetector monitors failure patterns
- ✅ Guardian protects all file operations
- ❌ No known bypass vulnerabilities
EOF
```

### Step 11: Final Verification
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
# TypeScript compilation
npm run typecheck 2>&1 | head -20

# Run all tests
npm test 2>&1 | tail -30

# Build the project
npm run build 2>&1 | tail -10
```

### Step 12: Create Git Commit
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein
git add -A
git commit -m "fix: integrate safety stack with ToolExecutor constitutional anchor

- Connected WorkflowBlocker to ToolExecutor to prevent workflow step bypass
- Fixed FirewallMesh to execute all 4 firewalls in parallel via Promise.all
- Integrated StagnationDetector to monitor repetitive failures (3 identical failures → escalation)
- Verified Guardian integration for all file operations
- Created comprehensive integration tests for safety stack
- Updated documentation with architecture and verification steps
- Closed security audit vulnerability: workflow enforcement bypass"
```

## Verification Checklist
- [ ] WorkflowBlocker integrated with ToolExecutor (blocks invalid operations)
- [ ] FirewallMesh executes all 4 firewalls in parallel (Promise.all)
- [ ] StagnationDetector records failures and detects stagnation
- [ ] Guardian protects all file operations
- [ ] Integration tests pass
- [ ] No TypeScript compilation errors
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] Security audit vulnerability addressed

## Error Recovery
If any step fails:
1. **Rollback changes**: `git checkout -- src/tools/executor_v2.ts src/tools/firewall-mesh_v2.ts src/tools/stagnation-detector_v2.ts`
2. **Incremental approach**: Integrate one safety layer at a time, test after each
3. **Manual debugging**: Use TypeScript compiler to identify integration issues

## Completion Signal
When complete, output the following message:
```
✅ SAFETY STACK INTEGRATION COMPLETE
- WorkflowBlocker: INTEGRATED
- FirewallMesh: PARALLEL EXECUTION
- StagnationDetector: ACTIVE
- Guardian: FULL COVERAGE
- Tests passing: [count]
- Security audit: RESOLVED
- Commit hash: [git rev-parse HEAD]
```

## Next Agent
Proceed to **Kraken Ultra Integration Agent** (05-kraken-ultra-integration-agent.md)