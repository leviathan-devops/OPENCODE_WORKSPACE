# Kraken Ultra Integration - Integration Points

## File Locations & Code References

### 📁 SHARK FRANKENSTEIN PROJECT
**Root**: `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-frankenstein/`

### 1. ToolExecutor Integration Points
**File**: `src/tools/executor_v2.ts`

#### Current Integration (Lines 20-22)
```typescript
import { AutoDebugEngine, DetectedError } from '../debug/autodebug';
import { modelLogger } from '../logging/model-logger';
import { MechanicalValidator } from '../anti-hallucination/mechanical-validator';
import { EvidenceChecker } from '../anti-hallucination/evidence-checker';
import { DebugInjector } from '../surgical-debug/injector';  // ADDED
```

#### Constructor (Lines 55-56, 82-85)
```typescript
private debugInjector: DebugInjector;

constructor(config: ToolExecutorConfig) {
  // ... existing code ...
  this.autoDebug = new AutoDebugEngine();
  this.debugInjector = this.autoDebug.getDebugInjector();  // ADDED
  this.mechanicalValidator = new MechanicalValidator();
  this.evidenceChecker = new EvidenceChecker();
}
```

#### executeRunCommand() Method (Lines 346-382)
**Current flow analysis**:
- Line 350-353: `stagnationDetector.recordFailure()` - Tool failure tracking
- Line 355-362: Stagnation alert handling (warning/critical/escalation)
- Line 364-369: AutoDebug analysis and quick fix report
- Line 371-382: Auto-fixable error handling

**Missing integration point**:
```typescript
// AFTER line 362 (stagnationAlert handling)
if (stagnationAlert && stagnationAlert.type === 'escalation') {
  const injectionResult = await this.debugInjector.injectDebugger(
    `tool-executor-${toolCall.id}`,
    {
      lastError: errorMessage,
      stagnationReason: 'command-failure-loop',
      recentProgress: [toolCall.name, command.substring(0, 100)]
    }
  );
  
  if (injectionResult.success && this.verbose) {
    this.log(`🔧 Surgical debug injected: ${injectionResult.debugAgentId}`);
  }
}
```

### 2. AutoDebugEngine Integration
**File**: `src/debug/autodebug.ts`

#### DebugInjector Integration (Lines 17, 553, 562)
```typescript
import { DebugInjector } from '../surgical-debug/injector';  // Line 17

export class AutoDebugEngine {
  private patternIndex: Array<{ pattern: RegExp; error: KnownError }>;
  private debugInjector: DebugInjector;  // Line 553

  constructor() {
    // ... pattern index initialization ...
    this.debugInjector = new DebugInjector();  // Line 562
  }
  
  getDebugInjector(): DebugInjector {  // ADDED method
    return this.debugInjector;
  }
}
```

### 3. Anti-hallucination Validators Integration
**Files Copied**: `src/anti-hallucination/`
- `evidence-checker.ts`
- `mechanical-validator.ts` 
- `patterns.ts`
- `validator-hook.ts`

#### ToolExecutor Integration (Lines 133-147)
```typescript
// Anti-hallucination check for plan/design operations
if (toolCall.name.includes('plan') || toolCall.name.includes('design')) {
  const argumentsString = JSON.stringify(toolCall.arguments);
  const theatricalPatterns = this.mechanicalValidator.detectTheatrical(argumentsString);
  if (theatricalPatterns.length > 0) {
    return {
      toolCallId: toolCall.id,
      name: toolCall.name,
      success: false,
      result: `❌ Anti-hallucination check failed: Theatrical patterns detected: ${theatricalPatterns.join(', ')}`,
      guardianBlocked: false,
      guardianReason: undefined
    };
  }
}
```

### 4. Surgical Debug Protocol Files
**Files Copied**: `src/surgical-debug/`
- `debug-agents.ts` - Debug agent definitions and factory
- `injector.ts` - DebugInjector class (main integration point)
- `stagnation-detector.ts` - Agent stagnation detection
- `ultra-connector.ts` - Kraken Ultra connectivity

#### Key Classes & Interfaces
**DebugInjector** (`injector.ts`):
- `injectDebugger(agentId, context)` - Main injection method
- `coordinateFix(originalAgentId, debugOutput)` - Fix coordination
- `mergeResults(originalAgentId, debugResult)` - Result merging

**DebugAgentFactory** (`debug-agents.ts`):
- `createFreshGLM()` - Fresh GLM agent for general debugging
- `createSpecializedDebugger(errorPatterns)` - Specialized debugger
- `createDeepSeekAdvisor()` - DeepSeek advisory agent
- `createCodeReviewer()` - Code review agent

### 5. Nemotron Service Integration Points
**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/`

#### Files to Copy (7 files):
1. `compression.ts` - Context filtering pipeline
2. `message-classifier.ts` - Token sizing logic (2k/4k/6k/8k)
3. `nemotron-bridge.ts` - Main orchestrator
4. `routing.ts` - Agent routing system
5. `service.ts` - Nemotron service implementation
6. `types.ts` - TypeScript interfaces
7. `index.ts` - Main export

#### Destination: `src/nemotron-service/`

#### Key Integration Points:
**DualBrainCoordinator** (needs to be located/created):
```typescript
import { NemotronEventBus } from '../nemotron-service/event-bus';

export class DualBrainCoordinator {
  private eventBus: NemotronEventBus;
  
  constructor() {
    this.eventBus = new NemotronEventBus();
  }
  
  async processTask(task: Task) {
    // Emit task started event
    this.eventBus.emit('task:started', {
      taskId: task.id,
      description: task.description,
      timestamp: new Date().toISOString()
    });
    
    // Task processing logic...
    
    // Emit task completed event
    this.eventBus.emit('task:completed', {
      taskId: task.id,
      success: result.success,
      durationMs: result.durationMs,
      timestamp: new Date().toISOString()
    });
  }
}
```

### 6. Stagnation Detector Coordination
**Two separate detectors need coordination**:

#### Tool Stagnation Detector (`tools/stagnation-detector.ts`)
**Interface**:
```typescript
recordFailure(toolCall: ToolCall, failureReason: string): StagnationAlert | null
getStats(): { totalFailures: number, uniqueTools: number, ... }
```

#### Agent Stagnation Detector (`surgical-debug/stagnation-detector.ts`)
**Interface**:
```typescript
checkStagnation(agentId: string): StagnationState
recordFailure(agentId: string, error: string, details?: any): void
recordSuccess(agentId: string, message: string): void
```

#### Coordination Strategy:
**Option A**: Adapter pattern
```typescript
class ToolToAgentStagnationAdapter {
  constructor(
    private toolDetector: StagnationDetector,
    private agentDetector: StagnationDetector
  ) {}
  
  recordToolFailure(toolCall: ToolCall, error: string) {
    const alert = this.toolDetector.recordFailure(toolCall, error);
    if (alert && alert.type === 'escalation') {
      this.agentDetector.recordFailure(
        `tool-${toolCall.name}`,
        error,
        { toolCall, alert }
      );
    }
  }
}
```

**Option B**: Unified interface (refactor)

### 7. Import Path Updates Required
After copying files, update relative imports:

**Current pattern** (in copied files):
```typescript
from '../../some/path'
```

**Required pattern** (for shark-frankenstein):
```typescript
from '../some/path'
```

**Update command**:
```bash
find src/nemotron-service -name "*.ts" -exec sed -i "s@from '\\.\\./@from '../@g" {} \;
```

## Summary of Critical Integration Points

| Integration Point | Status | Action Required |
|------------------|--------|-----------------|
| ToolExecutor → DebugInjector | ⚠️ Partial | Add call in executeRunCommand() |
| Tool Stagnation → Agent Stagnation | ❌ Missing | Create coordination/adapter |
| AutoDebugEngine → DebugInjector | ✅ Complete | Already integrated |
| Anti-hallucination → ToolExecutor | ✅ Complete | Already integrated |
| Nemotron Service → Project | ❌ Missing | Copy files and integrate |
| DualBrainCoordinator → EventBus | ❌ Missing | Import and use NemotronEventBus |

---
**Last Updated**: March 30, 2026  
**Context Version**: 1.0  
**Next Focus**: ToolExecutor → DebugInjector connection