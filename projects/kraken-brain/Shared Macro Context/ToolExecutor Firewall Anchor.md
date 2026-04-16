# ToolExecutor Firewall Anchor - Build Instructions

**Purpose:** This document contains EXACT instructions for integrating existing firewalls into ToolExecutor. Follow these instructions precisely. Do not deviate.

---

## 1. CONTEXT - What We Are Doing

### The Problem

The `ToolExecutor` is THE single chokepoint through which ALL agent actions flow. Every tool call from every agent passes through this one file. This makes it the perfect anchor point for mechanical firewalls.

**Current State:** ToolExecutor has Guardian connected, but `WorkflowBlocker` exists and is NOT connected. Agents can bypass workflow step restrictions.

**The Gap:**
```
executeWriteFile()
  ├─ ✅ Guardian.checkPermission() - WORKS
  └─ ❌ WorkflowBlocker.blockWrite() - EXISTS BUT NOT CALLED
```

### The Solution

Connect existing systems into ToolExecutor:
1. **WorkflowBlocker** - Block writes outside current workflow step
2. **Theatrical Patterns** - Warn on mock/simulate code (don't block)
3. **AutoDebug** - Add hints when commands fail

### Philosophy

- **YOLO mode compatible** - Minimal restrictions, maximum flow
- **Anti-slop focus** - Catch theatrical code, not restrict commands
- **Connect, don't create** - Systems exist, just anchor them

---

## 2. AUDIT FINDINGS

### Files You May Read

**PRIMARY SOURCE:**
- `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/Orchestrator Workspace/KRAKEN_BUILD_LOG.md`

**FROM KRAKEN_BUILD_LOG.md, you may read these referenced files:**
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/tools/executor.ts` - The anchor point (381 lines)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/blocker.ts` - WorkflowBlocker (351 lines)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/state-machine.ts` - State machine (862 lines)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/guardian/index.ts` - Guardian (800 lines)
- `/home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/debug/autodebug.ts` - AutoDebug (719 lines)
- `/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/Kraken Ultra/src/anti-hallucination/patterns.ts` - Theatrical patterns (61 lines)

**DO NOT READ ANY OTHER FILES.**

### Current State of executor.ts

| Feature | Status | Line |
|---------|--------|------|
| Guardian Integration | ✅ Connected | 98, 151 |
| Dangerous Command Check | ⚠️ Over-restrictive | 199-219 |
| WorkflowBlocker | ❌ NOT Connected | - |
| Theatrical Detection | ❌ NOT Connected | - |
| AutoDebug | ❌ NOT Connected | - |

### The Bypass Vulnerability

**File:** `executor.ts` line 93-142

`executeWriteFile()` calls Guardian but NEVER calls `WorkflowBlocker.blockWrite()`.

The `blockWrite()` method exists in `blocker.ts:170-194` and works correctly. It just isn't called.

**Result:** Agent in PLAN step can write to `src/` directly, bypassing BUILD step.

---

## 3. EXACT IMPLEMENTATION STRUCTURE

### Change 1: Add Imports (Line 11)

**Current:**
```typescript
import { Guardian, ModificationDecision } from '../guardian';
import { ToolCall } from '../brain/types';
```

**Add after:**
```typescript
import { WorkflowBlocker } from '../workflow/blocker';
```

### Change 2: Add Property and Initialize (Line 34-43)

**Current:**
```typescript
export class ToolExecutor {
  private guardian: Guardian;
  private workspacePath: string;
  private verbose: boolean;

  constructor(config: ToolExecutorConfig) {
    this.guardian = config.guardian;
    this.workspacePath = config.workspacePath;
    this.verbose = config.verbose ?? false;
  }
```

**Change to:**
```typescript
export class ToolExecutor {
  private guardian: Guardian;
  private workflowBlocker: WorkflowBlocker;
  private workspacePath: string;
  private verbose: boolean;

  constructor(config: ToolExecutorConfig) {
    this.guardian = config.guardian;
    this.workspacePath = config.workspacePath;
    this.verbose = config.verbose ?? false;
    this.workflowBlocker = new WorkflowBlocker(this.workspacePath);
  }
```

### Change 3: Add Workflow Check in executeWriteFile() (After Line 98)

**Current (lines 93-109):**
```typescript
private async executeWriteFile(toolCall: ToolCall): Promise<ToolResult> {
  const filePath = this.resolvePath(toolCall.arguments.file_path as string);
  const content = toolCall.arguments.content as string;

  // Guardian check
  const decision = this.guardian.checkPermission(filePath, 'write');
  
  if (decision === ModificationDecision.DENY) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      success: false,
      result: `Guardian DENIED write to ${filePath}`,
      guardianBlocked: true,
      guardianReason: 'File in protected zone',
    };
  }
```

**Add AFTER Guardian check, BEFORE the try block:**
```typescript
  // Guardian check
  const decision = this.guardian.checkPermission(filePath, 'write');
  
  if (decision === ModificationDecision.DENY) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      success: false,
      result: `Guardian DENIED write to ${filePath}`,
      guardianBlocked: true,
      guardianReason: 'File in protected zone',
    };
  }

  // Workflow check - ensure write is allowed in current step
  const workflowCheck = this.workflowBlocker.blockWrite(filePath);
  if (workflowCheck.blocked) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      success: false,
      result: `Workflow blocked: ${workflowCheck.reason}`,
      guardianBlocked: true,
      guardianReason: workflowCheck.reason,
    };
  }
```

### Change 4: Remove Over-Restrictive Command Patterns (Lines 199-219)

**Current:**
```typescript
// Basic safety - block obviously dangerous commands
const dangerousPatterns = [
  /rm\s+-rf\s+\//,  // rm -rf /
  />\s*\/dev\/sda/, // overwrite disk
  /mkfs/,           // format
  /dd\s+if=/,       // disk dump
  /:(){ :|:& };:/,  // fork bomb
];

for (const pattern of dangerousPatterns) {
  if (pattern.test(command)) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      success: false,
      result: `Command blocked: dangerous pattern detected`,
      guardianBlocked: true,
      guardianReason: 'Dangerous command pattern',
    };
  }
}
```

**Replace with:**
```typescript
// Only block actual system destruction (not common dev commands)
const SYSTEM_DESTRUCTION_ONLY = [
  /^rm\s+-rf\s+\/$/,  // Only exact "rm -rf /" 
];

for (const pattern of SYSTEM_DESTRUCTION_ONLY) {
  if (pattern.test(command)) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      success: false,
      result: `Command blocked: system destruction pattern`,
      guardianBlocked: true,
      guardianReason: 'System destruction attempt',
    };
  }
}
```

### Change 5 (OPTIONAL): Add Theatrical Pattern Warning

**Add method at end of class (before the log method):**
```typescript
/**
 * Detect theatrical code patterns (mock, simulate, placeholder)
 * Returns array of detected pattern names - for logging only, not blocking
 */
private detectTheatricalPatterns(content: string): string[] {
  const patterns: { name: string; regex: RegExp }[] = [
    { name: 'mock_without_execution', regex: /mock.*mode|simulat|stub.*test|fake.*test/i },
    { name: 'placeholder_code', regex: /TODO|FIXME|HACK|XXX|not implemented/i },
    { name: 'skipped_tests', regex: /\.skip\(|\.only\(|xit\(|xdescribe\(/i },
  ];
  
  const detected: string[] = [];
  for (const { name, regex } of patterns) {
    if (regex.test(content)) {
      detected.push(name);
    }
  }
  return detected;
}
```

**Then in executeWriteFile(), after successful write (around line 126), add:**
```typescript
// Write the file
fs.writeFileSync(actualPath, content, 'utf-8');

// Warn on theatrical patterns (don't block, just log)
const theatricalPatterns = this.detectTheatricalPatterns(content);
if (theatricalPatterns.length > 0) {
  this.log(`⚠️  Theatrical patterns detected: ${theatricalPatterns.join(', ')}`);
}

return {
  toolCallId: toolCall.id,
  name: toolCall.name,
  success: true,
  result: `Successfully wrote ${content.length} bytes to ${actualPath}`,
};
```

---

## 4. VERIFICATION STEPS

After making changes:

1. **TypeScript compiles:**
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein
   npx tsc --noEmit
   ```

2. **Tests pass:**
   ```bash
   npm test
   ```

3. **Manual test:**
   - Start a workflow in PLAN step
   - Attempt to write to `src/test.ts`
   - Should be blocked with workflow message
   - Write to `.shark/plan.md` - should succeed

---

## 5. DO NOT

- DO NOT read any files not listed in Section 2
- DO NOT add new firewalls not mentioned here
- DO NOT block commands beyond `rm -rf /`
- DO NOT modify WorkflowBlocker, Guardian, or StateMachine
- DO NOT add new dependencies
- DO NOT change the public API of ToolExecutor

---

## 6. SUMMARY

| Change | File | Lines Changed | Purpose |
|--------|------|---------------|---------|
| 1 | executor.ts | ~11 | Add import |
| 2 | executor.ts | ~34-43 | Add property |
| 3 | executor.ts | ~99-109 | Connect WorkflowBlocker |
| 4 | executor.ts | ~199-219 | Remove over-restriction |
| 5 (opt) | executor.ts | ~126, end | Add theatrical warning |

**Total changes: ~30 lines of code**

**This connects existing systems. It does not create new ones.**

---

## 7. IF YOU GET STUCK

1. Re-read KRAKEN_BUILD_LOG.md sections 9-13 for context
2. Read the existing files listed in Section 2
3. The implementation is straightforward - if you're doing something complex, you've derailed
4. Ask for clarification rather than assume

---

*Document Version: 1.0*
*Created: 2026-03-27*
