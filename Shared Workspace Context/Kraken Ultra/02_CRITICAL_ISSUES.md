# Kraken Ultra Integration - Critical Issues

## 🚨 PRIORITY 1: Surgical Debug Protocol Disconnect

### Problem Description
Two separate stagnation detection systems exist with **no coordination**:

1. **Tool Stagnation Detector** (`tools/stagnation-detector.ts`)
   - Used by `ToolExecutor` to track repeated tool failures
   - Triggers alerts (warning/critical/escalation) based on failure thresholds
   - Records failures to local storage (`~/.shark/stagnation-history.json`)

2. **Agent Stagnation Detector** (`surgical-debug/stagnation-detector.ts`)
   - Used by `DebugInjector` to detect agent stagnation
   - Tracks agent progress/failures/timeouts
   - Determines when to inject debug agents

**CRITICAL GAP**: Tool failure escalations don't trigger surgical debug injection.

### Impact
- Agent gets stuck in failure loops without debug intervention
- Surgical debug protocol remains dormant despite tool stagnation
- Reduced resilience and recovery capability

### Root Cause Analysis
**File**: `src/tools/executor_v2.ts`, method `executeRunCommand()` (lines 346-382)

Current flow:
```
Command execution fails
↓
Tool stagnation detector records failure (line 350-353)
↓
Stagnation alert generated (lines 355-362)
↓
AutoDebug analyzes error (line 364)
↓
Quick fix report generated (lines 366-382)
↓
Result returned with error message
```

**Missing Step**: No call to `debugInjector.injectDebugger()` for escalation alerts.

### Required Fix
1. **Coordinate detectors**: Share stagnation data between the two detectors
2. **Trigger injection**: Call `debugInjector.injectDebugger()` when escalation alerts occur
3. **Sync states**: Ensure tool failures increment agent stagnation counters

### Code Location for Fix
- **Primary**: `src/tools/executor_v2.ts`, `executeRunCommand()` method
- **Secondary**: Constructor needs to establish detector coordination
- **Tertiary**: May need adapter between different stagnation interfaces

## 🚨 PRIORITY 2: Missing Nemotron Service Integration

### Problem Description
Nemotron event-driven service exists as separate project but not integrated into Shark Frankenstein.

**Source**: `/home/leviathan/OPENCODE_WORKSPACE/projects/nemotron-communication-layer/src/`
**Destination**: `src/nemotron-service/` (doesn't exist)

### Impact
- No event-driven communication between components
- Missing token-efficient message routing
- Reduced system observability and coordination

### Required Actions
1. Create `src/nemotron-service/` directory
2. Copy all `.ts` files from source
3. Update import paths in copied files
4. Integrate `NemotronEventBus` into `DualBrainCoordinator`
5. Emit events for key operations (task start/complete/error)

## ⚠️ PRIORITY 3: Incomplete DebugInjector Integration

### Problem Description
`DebugInjector` imported and instantiated but never called.

**File**: `src/tools/executor_v2.ts`
**Lines**: 21 (import), 56 (property), 84 (initialization)

### Impact
- Surgical debug capability available but unused
- Wasted resource initialization

### Required Fix
Add call to `debugInjector.injectDebugger()` in appropriate locations:
1. When `stagnationAlert.type === 'escalation'`
2. When auto-fixable errors detected but not fixed
3. When failure count exceeds critical threshold

## 🧩 TECHNICAL DEBT

### 1. Duplicate Stagnation Detector Interfaces
- Two different `StagnationDetector` classes with similar but incompatible interfaces
- Need adapter or unified interface

### 2. Missing DualBrainCoordinator Integration
- `DualBrainCoordinator` referenced but may not exist
- Needs to be created or located

### 3. Import Path Inconsistencies
- Copied files may have incorrect relative imports
- Need to update `from '../` patterns

## 🎯 RESOLUTION STRATEGY

### Immediate (Next Agent Iteration)
1. **Fix surgical debug disconnect** - Connect tool failures to debug injection
2. **Test coordination** - Verify escalation triggers debug agent injection

### Short-term (This Build Phase)
1. **Integrate Nemotron service** - Copy files and establish event bus
2. **Complete DebugInjector integration** - Add actual method calls

### Medium-term (Before Testing)
1. **Create Shark CLI script** - Implement micro/macro wizard
2. **Create fragment files** - Agent-specific instructions
3. **Configure Zen provider** - Add free model access

---
**Last Updated**: March 30, 2026  
**Context Version**: 1.0  
**Priority Order**: 1 → 2 → 3