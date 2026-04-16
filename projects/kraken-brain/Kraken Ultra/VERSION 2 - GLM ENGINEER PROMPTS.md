# VERSION 2 - GLM ENGINEER PROMPTS (Nemotron-Aware)

**Version**: v2-NemotronProtocol
**Use Case**: Integration with Nemotron Communication Layer active
**Created**: Mar 26 2026

---

## Engineer #1 - Guardian Module v2-NemotronProtocol

```javascript
spawn_agent({
  agents: [{
    agent: "hephaestus",
    model: "0-glm-coding/glm-4.7",
    prompt: `INTEGRATION TASK: Guardian Module into Opencode

SOURCE: /home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/guardian/index.ts (~800 lines)
TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/packages/opencode/src/

REQUIREMENTS:
1. Port Guardian system to Opencode TypeScript architecture.
2. Wrap ALL file system operations with permission checks.
3. Implement system file blocking (/.ssh, /etc/passwd, etc.).
4. Add audit logging for all protected operations.
5. Configurable protection levels: STRICT, BALANCED, PERMISSIVE, SANDBOX.
6. Integrate with Opencode's permission system (packages/opencode/src/permission/index.ts).
7. DO NOT remove or replace existing Opencode code – only enhance.

COMMUNICATION PROTOCOL:
- All outputs route through Nemotron Communication Layer
- Default message size: 2-8k tokens (auto-sized based on complexity)
- Use clear headers: ## Progress, ## Blockers, ## Dependencies, ## Next Steps
- Tag dependencies: @engineer-1, @engineer-2, etc.
- Priority flags: [CRITICAL], [HIGH], [MEDIUM], [LOW]
- Override token limit: Include [TOKEN_OVERRIDE: 8k] if needed
- Simple updates stay under 2k tokens
- Complex issues escalate to 6-8k automatically
- Messages use ONLY tokens needed (not forced to max)

REFERENCE: FIXED-cli.ts in shark-frankenstein/GLM Engineer Shared Workspace/

DELIVERABLE: Guardian fully operational in Opencode fork.`,
    description: "Guardian module v2-NemotronProtocol"
  }]
})
```

---

## Engineer #2 - Workflow State Machine v2-NemotronProtocol

```javascript
spawn_agent({
  agents: [{
    agent: "hephaestus",
    model: "0-glm-coding/glm-4.7",
    prompt: `INTEGRATION TASK: Workflow State Machine into Opencode

SOURCE: /home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/workflow/state-machine.ts (~862 lines)
TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/packages/opencode/src/session/processor.ts

REQUIREMENTS:
1. Port WorkflowMachine to Opencode.
2. Hook into command execution pipeline (processor.ts).
3. Enforce 5-step workflow: PLAN → BUILD → TEST → VERIFY → SHIP.
4. Step validation via mechanical evidence checking.
5. Block invalid state transitions.
6. 3-failure reset mechanism (resets to PLAN with full context capture).
7. Integrate with Opencode's plan/build toggle system.

COMMUNICATION PROTOCOL:
- All outputs route through Nemotron Communication Layer
- Default message size: 2-8k tokens (auto-sized based on complexity)
- Use clear headers: ## Progress, ## Blockers, ## Dependencies, ## Next Steps
- Tag dependencies: @engineer-1, @engineer-2, etc.
- Priority flags: [CRITICAL], [HIGH], [MEDIUM], [LOW]
- Override token limit: Include [TOKEN_OVERRIDE: 8k] if needed
- Simple updates stay under 2k tokens
- Complex issues escalate to 6-8k automatically
- Messages use ONLY tokens needed (not forced to max)

REFERENCE: FIXED-cli.ts shows WorkflowMachine initialization.

DELIVERABLE: Workflow enforcement operational in Opencode CLI.`,
    description: "Workflow State Machine v2-NemotronProtocol"
  }]
})
```

---

## Engineer #3 - AutoDebug Module v2-NemotronProtocol

```javascript
spawn_agent({
  agents: [{
    agent: "hephaestus",
    model: "0-glm-coding/glm-4.7",
    prompt: `INTEGRATION TASK: AutoDebug Module into Opencode

SOURCE: /home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/debug/autodebug.ts (~530 lines)
TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/packages/opencode/src/session/status.ts

REQUIREMENTS:
1. Port AutoDebug engine to Opencode.
2. Integrate into error handling pipeline (status.ts).
3. Load 47+ common error patterns.
4. Pattern-based error detection and fixing.
5. Mechanical fix generation for Docker/npm errors.
6. Replace error display with mechanical violation detection.
7. Anti-hallucination validation.

COMMUNICATION PROTOCOL:
- All outputs route through Nemotron Communication Layer
- Default message size: 2-8k tokens (auto-sized based on complexity)
- Use clear headers: ## Progress, ## Blockers, ## Dependencies, ## Next Steps
- Tag dependencies: @engineer-1, @engineer-2, etc.
- Priority flags: [CRITICAL], [HIGH], [MEDIUM], [LOW]
- Override token limit: Include [TOKEN_OVERRIDE: 8k] if needed
- Simple updates stay under 2k tokens
- Complex issues escalate to 6-8k automatically
- Messages use ONLY tokens needed (not forced to max)

REFERENCE: FIXED-cli.ts shows AutoDebug initialization.

DELIVERABLE: AutoDebug operational for pattern-based error fixing.`,
    description: "AutoDebug module v2-NemotronProtocol"
  }]
})
```

---

## Engineer #4 - DualBrain Coordinator v2-NemotronProtocol

```javascript
spawn_agent({
  agents: [{
    agent: "hephaestus",
    model: "0-glm-coding/glm-4.7",
    prompt: `INTEGRATION TASK: DualBrain Coordinator into Opencode

SOURCE: /home/leviathan/OPENCODE_WORKSPACE/shark-frankenstein/src/brain/coordinator.ts
TARGET: /home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/packages/opencode/src/agent/agent.ts

REQUIREMENTS:
1. Port DualBrainCoordinator to Opencode.
2. Implement automatic mode switching (Micro/Macro ↔ Plan/Build).
3. Map Opencode plan/build modes to Shark's Micro/Macro modes.
4. Auto-switch on: task analysis, user intent, tool requirements.
5. Preserve manual toggle alongside auto-switch.
6. Micro Engineer: Gemma 3 OR Qwen 2.5 Coder (vLLM local) for execution.
7. Macro Engineer: GLM-5 OR GLM-4.7 for complex planning.

COMMUNICATION PROTOCOL:
- All outputs route through Nemotron Communication Layer
- Default message size: 2-8k tokens (auto-sized based on complexity)
- Use clear headers: ## Progress, ## Blockers, ## Dependencies, ## Next Steps
- Tag dependencies: @engineer-1, @engineer-2, etc.
- Priority flags: [CRITICAL], [HIGH], [MEDIUM], [LOW]
- Override token limit: Include [TOKEN_OVERRIDE: 8k] if needed
- Simple updates stay under 2k tokens
- Complex issues escalate to 6-8k automatically
- Messages use ONLY tokens needed (not forced to max)

REFERENCE: Auto-switch demonstration (Mar 24 2026) in SHARK_AUTO_SWITCH_DEMONSTRATION.md.

DELIVERABLE: Dual-brain architecture functioning with auto-switching.`,
    description: "DualBrain Coordinator v2-NemotronProtocol"
  }]
})
```

---

## Engineer #5 - Integration Testing v2-NemotronProtocol

```javascript
spawn_agent({
  agents: [{
    agent: "hephaestus",
    model: "0-glm-coding/glm-4.7",
    prompt: `INTEGRATION TASK: Comprehensive Testing & Verification

TARGET: Entire /home/leviathan/OPENCODE_WORKSPACE/shark-opencode-integration/ repository

REQUIREMENTS:
1. Create integration tests for all 4 Shark systems.
2. Implement anti-hallucination validation.
3. Mechanical compile-from-scratch verification.
4. Cross-module validation (Guardian ↔ Workflow ↔ AutoDebug ↔ DualBrain).
5. Test 5-step workflow enforcement.
6. Verify no theatrical code (fake tests, simulated completion).
7. Ensure Ship validation requires actual mechanical proof.

COMMUNICATION PROTOCOL:
- All outputs route through Nemotron Communication Layer
- Default message size: 2-8k tokens (auto-sized based on complexity)
- Use clear headers: ## Progress, ## Blockers, ## Dependencies, ## Next Steps
- Tag dependencies: @engineer-1, @engineer-2, etc.
- Priority flags: [CRITICAL], [HIGH], [MEDIUM], [LOW]
- Override token limit: Include [TOKEN_OVERRIDE: 8k] if needed
- Simple updates stay under 2k tokens
- Complex issues escalate to 6-8k automatically
- Messages use ONLY tokens needed (not forced to max)

DELIVERABLE: All integration tests pass, ready for user approval.`,
    description: "Integration testing v2-NemotronProtocol"
  }]
})
```

---

**USAGE**: Use VERSION 2 prompts when Nemotron Communication Layer is active and token-efficient communication is required. Ideal for production deployment with multiple engineers.
