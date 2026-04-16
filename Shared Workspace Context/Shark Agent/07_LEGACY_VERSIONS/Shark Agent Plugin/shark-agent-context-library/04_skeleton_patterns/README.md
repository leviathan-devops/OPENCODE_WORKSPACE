# Skeleton Patterns — Copy-Paste Scaffolds

## How to Use These

Copy the pattern, replace `shark` with the agent ID, replace tool names, adjust the logic. Each skeleton is a minimal working example.

## Pattern 1: Plugin Entry

```typescript
// src/index.ts — Minimal working plugin entry
import type { OpenCodePlugin } from '@opencode-ai/plugin';

const plugin: OpenCodePlugin = (api) => {
  // 1. Register the agent tab
  api.registerAgent({
    id: 'shark',
    name: 'Shark',
    description: 'Autonomous DevOps Engineer — mechanical enforcement, no hallucinations',
    color: '#1DA0C3',
    tools: [
      'phase_status', 'advance_phase', 'extract_claims',
      'guardian_classify', 'run_verification', 'shark_health',
    ],
  });

  // 2. Register Shark tools
  api.registerTool(
    {
      name: 'phase_status',
      description: 'Get current phase, blockers, and available actions',
      schema: { type: 'object', properties: {}, additionalProperties: false },
    },
    async (_args, context) => {
      const workflow = readWorkflow(context.directory);
      return formatPhaseStatus(workflow);
    },
  );

  api.registerTool(
    {
      name: 'advance_phase',
      description: 'Attempt to advance to the next phase',
      schema: {
        type: 'object',
        properties: { target: { type: 'string', enum: ['BUILD', 'TEST', 'VERIFY', 'SHIP'] } },
        required: ['target'],
      },
    },
    async (args, context) => {
      const machine = new WorkflowMachine(context.directory);
      const result = machine.advance(args.target);
      return result.success ? `Advanced to ${args.target}` : `Blocked: ${result.error}`;
    },
  );

  // 3. Register hooks
  api.registerHook('tool.execute.before', createGuardianGateHook({ protectionLevel: 'STRICT' }));
  api.registerHook('tool.execute.before', createPhaseGateHook());
  api.registerHook('tool.execute.after', createBuildManifestHook());
  api.registerHook('experimental.chat.system.transform', createSharkBrainInjectHook());
};

export default plugin;
```

## Pattern 2: Hook Skeleton

```typescript
// src/shark/hooks/example-hook.ts
import type { ToolContext } from '@opencode-ai/plugin';

// Check if this is a Shark agent
function isSharkAgent(context: ToolContext): boolean {
  return context.agent?.id === 'shark';
}

export function createExampleHook() {
  return async (
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<Record<string, unknown>> => {
    // Guard: only run for Shark agents
    if (!isSharkAgent(context)) return input;

    // Hook logic here
    // Return input unchanged to let tool execute
    // Throw to block the tool
    // Return modified input to change tool behavior

    return input;
  };
}
```

## Pattern 3: Tool Skeleton

```typescript
// src/shark/tools/example-tool.ts
import { tool } from '@opencode-ai/plugin';

export const exampleTool = tool({
  description: 'One-line description of what this tool does',
  args: {
    param1: tool.schema.string().describe('Description of param1'),
    param2: tool.schema.boolean().optional().default(false).describe('Optional flag'),
  },
  execute: async (args, context) => {
    // Implementation
    // Use context.directory for file operations
    // Use context.agent for agent identity
    // Return a string (human-readable) or JSON string (structured)
    return JSON.stringify({ status: 'ok', param1: args.param1 });
  },
});
```

## Pattern 4: Hook Chain Registration

```typescript
// src/shark/hooks/index.ts — Export all hooks in execution order

import { createGuardianGateHook } from './guardian-gate.js';
import { createPhaseGateHook } from './phase-gate.js';
import { createTddEnforcerHook } from './tdd-enforcer.js';
import { createScopeGuardHook } from './scope-guard.js';
import { createBuildManifestHook } from './build-manifest.js';
import { createClaimTrackerHook } from './claim-tracker.js';
import { createQualityGateHook } from './quality-gate.js';
import { createAntiHallucinationHook } from './anti-hallucination.js';
import { createSharkBrainInjectHook } from './shark-brain-inject.js';
import { createClaimContextHook } from './claim-context.js';
import { createIntentMarkerHook } from './intent-marker.js';
import { createAntiRationalizationHook } from './anti-rationalization.js';
import { createContextBudgetHook } from './context-budget.js';

// tool.execute.before hooks — FIRST = first to run
export const beforeHooks = [
  createGuardianGateHook({ protectionLevel: 'STRICT' }),   // 1. Path protection
  createPhaseGateHook(),                                    // 2. Phase enforcement
  createTddEnforcerHook(),                                  // 3. TDD enforcement
  createScopeGuardHook(),                                  // 4. Dangerous commands
];

// tool.execute.after hooks — FIRST = first to run
export const afterHooks = [
  createBuildManifestHook(),        // 1. Track file writes
  createClaimTrackerHook(),         // 2. Update claim status
  createQualityGateHook(),          // 3. Quality enforcement
  createAntiHallucinationHook(),    // 4. Scan for hallucinations
];

// Chat hooks
export const chatSystemHooks = [
  createSharkBrainInjectHook(),
  createClaimContextHook(),
  createIntentMarkerHook(),
  createAntiRationalizationHook(),
  createContextBudgetHook(),
];
```

## Pattern 5: State Store Access

```typescript
// src/shark/state-machine/store.ts
import { createStateStore } from '../../v4-integration/StateStore.js';

const stateStore = createStateStore();

// Architect writes claims
function saveClaims(claims: Claim[], ownerBrain: string) {
  const result = stateStore.set('claims', claims, 'plan-state', ownerBrain);
  if (!result.success) {
    throw new Error(`Failed to save claims: ${result.error}`);
  }
}

// Executor reads claims
function loadClaims(): Claim[] {
  return stateStore.get<Claim[]>('claims', 'plan-state') ?? [];
}

// Watch for changes
function watchClaims(callback: (claims: Claim[], version: number) => void) {
  return stateStore.watch('claims', callback, 'plan-state');
}
```

## Pattern 6: Brain Messenger Handoff

```typescript
// src/shark/brain/coordinator.ts
import { createBrainMessenger } from '../../v4-integration/BrainMessenger.js';

const messenger = createBrainMessenger();

// Architect sends task to executor
function handOffToExecutor(claims: Claim[], plan: string) {
  messenger.send({
    from: 'shark-architect',
    to: 'shark-orchestrator',
    type: 'handoff',
    priority: 'high',
    payload: { claims, plan, phase: 'BUILD' },
    requiresAck: true,
    timestamp: Date.now(),
  });
}

// Executor polls for messages
function receiveExecutorMessages(): BrainMessage[] {
  return messenger.receive('shark-orchestrator');
}

// Executor acknowledges
function ackHandoff(messageId: string) {
  messenger.send({
    id: messageId,
    from: 'shark-orchestrator',
    to: 'shark-architect',
    type: 'ack',
    priority: 'normal',
    payload: {},
    requiresAck: false,
    timestamp: Date.now(),
  });
}
```
