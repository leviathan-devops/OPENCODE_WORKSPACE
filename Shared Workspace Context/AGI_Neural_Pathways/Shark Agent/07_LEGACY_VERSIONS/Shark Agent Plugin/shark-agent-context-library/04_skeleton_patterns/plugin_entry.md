# Plugin Entry Skeleton

## Minimal Working `src/index.ts`

```typescript
// src/index.ts
// Shark Agent — OpenCode Plugin Entry Point

import type { OpenCodePlugin } from '@opencode-ai/plugin';
import { createGuardianGateHook } from './shark/hooks/guardian-gate.js';
import { createPhaseGateHook } from './shark/hooks/phase-gate.js';
import { createTddEnforcerHook } from './shark/hooks/tdd-enforcer.js';
import { createScopeGuardHook } from './shark/hooks/scope-guard.js';
import { createBuildManifestHook } from './shark/hooks/build-manifest.js';
import { createClaimTrackerHook } from './shark/hooks/claim-tracker.js';
import { createQualityGateHook } from './shark/hooks/quality-gate.js';
import { createAntiHallucinationHook } from './shark/hooks/anti-hallucination.js';
import { createSharkBrainInjectHook } from './shark/hooks/shark-brain-inject.js';
import { createClaimContextHook } from './shark/hooks/claim-context.js';
// Tools
import { phase_status } from './shark/tools/phase-status.js';
import { advance_phase } from './shark/tools/advance-phase.js';
import { extract_claims } from './shark/tools/extract-claims.js';
import { update_manifest } from './shark/tools/update-manifest.js';
import { guardian_classify } from './shark/tools/guardian-classify.js';
import { run_verification } from './shark/tools/run-verification.js';
import { auto_debug } from './shark/tools/auto-debug.js';
import { shark_health } from './shark/tools/shark-health.js';
import { capture_context } from './shark/tools/capture-context.js';
import { reset_workflow } from './shark/tools/reset-workflow.js';
// Quality + session tools (from v2.1)
import { lint, diff, build_check, syntax_check } from './tools/quality.js';
import { test_runner, placeholder_scan, secretScan, sast_scan } from './tools/security.js';
import { checkpoint, list_sessions, load_session, fork_session, create_snapshot } from './tools/sessions.js';
import { phase_complete, save_plan } from './tools/workflow.js';
import { sharkRecall, sharkRemember, sharkContext } from './tools/memory.js';

const SHARK_TOOLS = [
  // Phase/state machine tools
  'phase_status', 'advance_phase', 'extract_claims', 'update_manifest',
  'shark_health', 'capture_context', 'reset_workflow',
  // Guardian tools
  'guardian_classify', 'run_verification',
  // Debug
  'auto_debug',
  // Quality
  'lint', 'diff', 'build_check', 'syntax_check', 'test_runner',
  'placeholder_scan', 'secret_scan', 'sast_scan',
  // Session
  'checkpoint', 'list_sessions', 'load_session', 'fork_session', 'create_snapshot',
  'phase_complete', 'save_plan',
  // Memory
  'shark_recall', 'shark_remember', 'shark_context',
];

const plugin: OpenCodePlugin = (api) => {
  // 1. Register Shark agent tab
  api.registerAgent({
    id: 'shark',
    name: 'Shark',
    description: 'Autonomous DevOps Engineer — mechanically enforced, anti-hallucination',
    color: '#1DA0C3',
    tools: SHARK_TOOLS,
  });

  // 2. Register all tools
  const allTools = [
    phase_status, advance_phase, extract_claims, update_manifest,
    guardian_classify, run_verification, auto_debug, shark_health,
    capture_context, reset_workflow,
    lint, diff, build_check, syntax_check,
    test_runner, placeholder_scan, secretScan, sast_scan,
    checkpoint, list_sessions, load_session, fork_session, create_snapshot,
    phase_complete, save_plan,
    sharkRecall, sharkRemember, sharkContext,
  ];

  for (const tool of allTools) {
    api.registerTool(tool.definition, tool.execute);
  }

  // 3. Register tool.execute.before hooks (ORDER MATTERS — first = first to run)
  api.registerHook('tool.execute.before', createGuardianGateHook({ protectionLevel: 'STRICT' }));
  api.registerHook('tool.execute.before', createPhaseGateHook());
  api.registerHook('tool.execute.before', createTddEnforcerHook());
  api.registerHook('tool.execute.before', createScopeGuardHook());

  // 4. Register tool.execute.after hooks
  api.registerHook('tool.execute.after', createBuildManifestHook());
  api.registerHook('tool.execute.after', createClaimTrackerHook());
  api.registerHook('tool.execute.after', createQualityGateHook());
  api.registerHook('tool.execute.after', createAntiHallucinationHook());

  // 5. Register chat hooks
  api.registerHook('experimental.chat.system.transform', createSharkBrainInjectHook());
  api.registerHook('experimental.chat.system.transform', createClaimContextHook());
};

export default plugin;
```

## Tool Definition Pattern

Every tool exported from `src/tools/` or `src/shark/tools/` follows this pattern:

```typescript
// Pattern for tool.ts
import { tool } from '@opencode-ai/plugin';

export const my_tool = tool({
  definition: {
    name: 'my_tool',
    description: 'What this tool does',
    schema: {
      type: 'object',
      properties: {
        param1: { type: 'string', description: 'Description' },
        optional: { type: 'boolean', default: false },
      },
      required: ['param1'],
    },
  },
  execute: async (args, context) => {
    // args is already validated against schema
    // context.directory is the project directory
    // context.agent.id is the active agent ID
    return 'result string or JSON string';
  },
});
```

Or split:

```typescript
// Separate definition and execute
export const myToolDef = {
  name: 'my_tool',
  description: 'What this tool does',
  schema: { /* ... */ },
};

export async function myToolExecute(args: any, context: any): Promise<string> {
  return 'result';
}

// In index.ts:
api.registerTool(myToolDef, myToolExecute);
```
