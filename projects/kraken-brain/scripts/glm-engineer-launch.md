# 🚀 GLM 4.7 Engineer Launch Commands

## **Plugin Integration Points Discovered**
- **opencode‑ultra plugin** provides `spawn_agent` tool for parallel agent execution.
- **Available agents**: `explore`, `librarian`, `oracle`, `metis`, `momus`, `atlas`, `hephaestus`, `multimodal‑looker`.
- **Concurrency pool** manages parallel execution with provider/model limits.
- **ThreadWeaver** system for multi‑agent orchestration and complexity routing.

## **5 GLM 4.7 Engineer Assignments**

### **Engineer #1 – Guardian Module Integration**
```javascript
spawn_agent({
  agents: [
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: `INTEGRATION TASK: Guardian Module into Opencode

SOURCE: /home/leviathan/OPENCODE_WORKSPACE/shark‑frankenstein/src/guardian/index.ts (~800 lines)
TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark‑opencode‑integration/packages/opencode/src/

REQUIREMENTS:
1. Port Guardian system to Opencode TypeScript architecture.
2. Wrap ALL file system operations with permission checks.
3. Implement system file blocking (/.ssh, /etc/passwd, etc.).
4. Add audit logging for all protected operations.
5. Configurable protection levels: STRICT, BALANCED, PERMISSIVE, SANDBOX.
6. Integrate with Opencode's permission system (packages/opencode/src/permission/index.ts).
7. DO NOT remove or replace existing Opencode code – only enhance.

REFERENCE: FIXED‑cli.ts in shark‑frankenstein/GLM Engineer Shared Workspace/

DELIVERABLE: Guardian fully operational in Opencode fork.`,
      description: "Guardian module integration"
    }
  ]
})
```

### **Engineer #2 – Workflow State Machine Integration**
```javascript
spawn_agent({
  agents: [
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: `INTEGRATION TASK: Workflow State Machine into Opencode

SOURCE: /home/leviathan/OPENCODE_WORKSPACE/shark‑frankenstein/src/workflow/state‑machine.ts (~862 lines)
TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark‑opencode‑integration/packages/opencode/src/session/processor.ts

REQUIREMENTS:
1. Port WorkflowMachine to Opencode.
2. Hook into command execution pipeline (processor.ts).
3. Enforce 5‑step workflow: PLAN → BUILD → TEST → VERIFY → SHIP.
4. Step validation via mechanical evidence checking.
5. Block invalid state transitions.
6. 3‑failure reset mechanism (resets to PLAN with full context capture).
7. Integrate with Opencode's plan/build toggle system.

REFERENCE: FIXED‑cli.ts shows WorkflowMachine initialization.

DELIVERABLE: Workflow enforcement operational in Opencode CLI.`,
      description: "Workflow State Machine integration"
    }
  ]
})
```

### **Engineer #3 – AutoDebug Module Integration**
```javascript
spawn_agent({
  agents: [
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: `INTEGRATION TASK: AutoDebug Module into Opencode

SOURCE: /home/leviathan/OPENCODE_WORKSPACE/shark‑frankenstein/src/debug/autodebug.ts (~530 lines)
TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark‑opencode‑integration/packages/opencode/src/session/status.ts

REQUIREMENTS:
1. Port AutoDebug engine to Opencode.
2. Integrate into error handling pipeline (status.ts).
3. Load 47+ common error patterns.
4. Pattern‑based error detection and fixing.
5. Mechanical fix generation for Docker/npm errors.
6. Replace error display with mechanical violation detection.
7. Anti‑hallucination validation.

REFERENCE: FIXED‑cli.ts shows AutoDebug initialization.

DELIVERABLE: AutoDebug operational for pattern‑based error fixing.`,
      description: "AutoDebug module integration"
    }
  ]
})
```

### **Engineer #4 – DualBrain Coordinator Integration**
```javascript
spawn_agent({
  agents: [
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: `INTEGRATION TASK: DualBrain Coordinator into Opencode

SOURCE: /home/leviathan/OPENCODE_WORKSPACE/shark‑frankenstein/src/brain/coordinator.ts
TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark‑opencode‑integration/packages/opencode/src/agent/agent.ts

REQUIREMENTS:
1. Port DualBrainCoordinator to Opencode.
2. Implement automatic mode switching (Micro/Macro ↔ Plan/Build).
3. Map Opencode plan/build modes to Shark's Micro/Macro modes.
4. Auto‑switch on: task analysis, user intent, tool requirements.
5. Preserve manual toggle alongside auto‑switch.
6. Micro Engineer: DeepSeek R1 (THINKS) → Gemma 3 4B (DOES).
7. Macro Engineer: GLM 4.5‑flash (PRIMARY) + DeepSeek R1 (ADVISORY).

REFERENCE: Auto‑switch demonstration (Mar 24 2026) in SHARK_AUTO_SWITCH_DEMONSTRATION.md.

DELIVERABLE: Dual‑brain architecture functioning with auto‑switching.`,
      description: "DualBrain Coordinator integration"
    }
  ]
})
```

### **Engineer #5 – Integration Testing & Verification**
```javascript
spawn_agent({
  agents: [
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: `INTEGRATION TASK: Comprehensive Testing & Verification

TARGET: Entire /home/leviathan/OPENCODE_WORKSPACE/shark‑opencode‑integration/ repository

REQUIREMENTS:
1. Create integration tests for all 4 Shark systems.
2. Implement anti‑hallucination validation.
3. Mechanical compile‑from‑scratch verification.
4. Cross‑module validation (Guardian ↔ Workflow ↔ AutoDebug ↔ DualBrain).
5. Test 5‑step workflow enforcement.
6. Verify no theatrical code (fake tests, simulated completion).
7. Ensure Ship validation requires actual mechanical proof.

DELIVERABLE: All integration tests pass, ready for user approval.`,
      description: "Integration testing & verification"
    }
  ]
})
```

## **Parallel Launch Command**
```javascript
// Launch all 5 engineers in parallel
spawn_agent({
  agents: [
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: "[Engineer #1 prompt above]",
      description: "Guardian module"
    },
    {
      agent: "hephaestus", 
      model: "GLM-4.7",
      prompt: "[Engineer #2 prompt above]",
      description: "Workflow State Machine"
    },
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: "[Engineer #3 prompt above]",
      description: "AutoDebug module"
    },
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: "[Engineer #4 prompt above]",
      description: "DualBrain Coordinator"
    },
    {
      agent: "hephaestus",
      model: "GLM-4.7",
      prompt: "[Engineer #5 prompt above]",
      description: "Integration testing"
    }
  ]
})
```

## **Nemotron Bridge Extension Blueprint**

### **Plugin Hook Points Identified**
1. **`tool.execute.after`** – Monitor GLM engineer outputs.
2. **`experimental.session.compacting`** – Context compaction events.
3. **Event system** – Session lifecycle management.

### **Nemotron Bridge Module Structure**
```typescript
// nemotron‑bridge.ts
interface NemotronConfig {
  maxTokensToKraken: number; // 2000
  compactionThreshold: number; // 0.85
  snapshotInterval: number; // 24 hours
}

class NemotronBridge {
  private context: Map<string, EngineerContext>; // 1M+ token capacity
  private filters: FilterPipeline;
  
  ingest(engineerId: string, output: AgentOutput): void;
  compact(): CompactedUpdate; // → 2K tokens max
  distribute(command: KrakenCommand): TaskAssignment[];
  takeSnapshot(): void;
}

// Integration with opencode‑ultra
export function createNemotronBridgePlugin(config: NemotronConfig) {
  return {
    hooks: {
      "tool.execute.after": (input, output) => {
        if (output.agent === "hephaestus") {
          nemotron.ingest(input.sessionId, output);
        }
      },
      "experimental.session.compacting": async (input, output) => {
        const update = nemotron.compact();
        // Send to Kraken Brain via side‑channel
      }
    }
  };
}
```

## **Deployment Sequence**

### **1. Start Auto‑Context Background Process**
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Kraken Brain/scripts"
./start-background.sh
```

### **2. Launch GLM Engineers (After User Approval)**
```javascript
// Present plan to user, wait for "go/proceed"
// Then execute spawn_agent with 5 parallel engineers
```

### **3. Monitor & Adjust**
- Check `auto‑context.log` for token usage updates.
- Verify summaries rotating in `ACTIVE_CONTEXT.md`.
- Monitor integration progress via Nemotron snapshots.

## **Success Criteria**
- ✅ 5 GLM engineers building in parallel.
- ✅ Auto‑context updates at 85% token usage.
- ✅ Nemotron bridge filtering GLM outputs → 2K tokens to Kraken Brain.
- ✅ All Shark modules integrated into Opencode fork.
- ✅ Mechanical validation operational (no theatrical code).
- ✅ Ready for Stage 3 user endpoint validation.

---

**Status**: Launch commands prepared. Await user approval to execute `spawn_agent` with 5 parallel GLM‑4.7 engineers.