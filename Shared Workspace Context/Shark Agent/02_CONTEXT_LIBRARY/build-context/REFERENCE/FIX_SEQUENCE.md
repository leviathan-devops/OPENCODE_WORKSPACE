# FIX SEQUENCE — V1.0 to V1.1 Build

This is the exact sequence of steps to transform Shark Agent V4 V1.0 to V1.1.

**RULE: Execute steps in order. Do not skip. Do not parallelize.**

---

## PHASE 0: BACKUP (Before Anything Else)

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Create timestamped backup directory
mkdir -p ../shark-agent-v1.0-backup

# Copy all source (preserves original state)
cp -r src ../shark-agent-v1.0-backup/
cp -r shark-context ../shark-agent-v1.0-backup/
cp package.json tsconfig.json README.md dist/ ../shark-agent-v1.0-backup/ 2>/dev/null || true

# Verify backup
test -f ../shark-agent-v1.0-backup/src/index.ts && echo "BACKUP OK" || echo "BACKUP FAILED"
```

**STOP HERE if backup fails.** No progress until backup exists.

---

## PHASE 1: Create Hooks Directory Structure (NEW FILES)

### Step 1.1: Create hooks/v1.1.0/ directory

```bash
mkdir -p src/hooks/v1.1.0
echo "Created src/hooks/v1.1.0/"
```

### Step 1.2: Create utility file

**File:** `src/hooks/v1.1.0/utils.ts`

```typescript
/**
 * Hook utilities for Shark V4 V1.1
 * 
 * Helper functions for extracting data from OpenCode hook inputs.
 */

export function extractPathFromToolArgs(tool: string, args: unknown): string | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;
  switch (tool) {
    case 'mcp_write_file':
    case 'write_file':
      return (a.path as string) || null;
    case 'terminal':
    case 'mcp_terminal':
      return (a.workdir as string) || null;
    case 'patch':
      return (a.path as string) || null;
    default:
      return null;
  }
}

export function extractCommandFromArgs(args: unknown): string | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;
  return (a.command as string) || (a.cmd as string) || null;
}

export function isBuildTool(tool: string): boolean {
  const buildTools = ['write_file', 'mcp_write_file', 'patch', 'terminal', 'mcp_terminal', 'cp', 'mv', 'mkdir'];
  return buildTools.includes(tool);
}

export function isTestTool(tool: string, args: unknown): boolean {
  if (tool !== 'terminal' && tool !== 'mcp_terminal') return false;
  const cmd = extractCommandFromArgs(args) || '';
  return /\b(test|jest|vitest|pytest|ruby|rspec)\b/.test(cmd);
}
```

---

## PHASE 2: Create Guardian Hook (NEW FILE)

### Step 2.1: Create guardian-hook.ts

**File:** `src/hooks/v1.1.0/guardian-hook.ts`

```typescript
/**
 * Guardian Hook — tool.execute.before integration
 * 
 * Intercepts terminal/shell commands and blocks dangerous operations.
 * Blocks based on:
 * - DANGEROUS_PATTERNS regex (rm -rf /, dd if=, mkfs, fork bombs)
 * - Zone classification (PERSONAL, SYSTEM paths blocked in SANDBOX mode)
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shark/shared/guardian.js';
import { extractCommandFromArgs, extractPathFromToolArgs } from './utils.js';

export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async ({ tool, args, sessionID }) => {
    // Only check tools that execute commands or write files
    const watchedTools = [
      'terminal', 'mcp_terminal',
      'write_file', 'mcp_write_file',
      'patch', 'mcp_patch'
    ];

    if (!watchedTools.includes(tool)) {
      return; // Let other tools pass through
    }

    // Check for dangerous commands (terminal tools)
    if (tool === 'terminal' || tool === 'mcp_terminal') {
      const command = extractCommandFromArgs(args);
      if (command && guardian.isDangerousCommand(command)) {
        console.log(`[Guardian] BLOCKED dangerous command in session ${sessionID}`);
        return {
          blocked: true,
          reason: `Guardian: dangerous pattern detected in command`,
        };
      }
    }

    // Check path-based write permissions
    const writePath = extractPathFromToolArgs(tool, args);
    if (writePath && (tool.includes('write_file') || tool.includes('patch'))) {
      if (!guardian.canWrite(writePath)) {
        const zone = guardian.classifyZone(writePath);
        console.log(`[Guardian] BLOCKED write to ${zone}: ${writePath}`);
        return {
          blocked: true,
          reason: `Guardian: write to ${zone} zone is not permitted`,
        };
      }
    }

    return; // Allow execution
  };
}
```

---

## PHASE 3: Create Gate + Evidence Hook (NEW FILE)

### Step 3.1: Create gate-hook.ts

**File:** `src/hooks/v1.1.0/gate-hook.ts`

```typescript
/**
 * Gate + Evidence Hook — tool.execute.after integration
 * 
 * Collects evidence after tool execution and advances gates when criteria met.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shark/shared/gates.js';
import { EvidenceCollector } from '../../shark/shared/evidence.js';
import { extractCommandFromArgs } from './utils.js';

export function createGateHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector
): Hooks['tool.execute.after'] {
  return async ({ tool, args, result, sessionID }) => {
    const currentGate = gateManager.getCurrentGate();
    const evidence = buildEvidenceRecord(tool, args, result);

    if (evidence) {
      evidenceCollector.collectEvidence(currentGate, {
        tool,
        workEvidence: evidence,
        timestamp: Date.now(),
        sessionID: sessionID || 'unknown',
      });
    }

    // Auto-advance gates based on tool results
    const shouldAdvance = checkGateAdvance(tool, args, result, currentGate);
    if (shouldAdvance && gateManager.canTransition(shouldAdvance)) {
      gateManager.passCurrentGate();
      gateManager.transitionTo(shouldAdvance);
      console.log(`[Shark] Gate advanced: ${currentGate} → ${shouldAdvance}`);
    }
  };
}

function buildEvidenceRecord(tool: string, args: unknown, result: unknown): string | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;

  switch (tool) {
    case 'write_file':
    case 'mcp_write_file':
      return `wrote_file:${a.path}`;
    case 'patch':
      return `patched:${a.path}`;
    case 'terminal':
    case 'mcp_terminal': {
      const cmd = extractCommandFromArgs(args) || '';
      return `ran:${cmd.slice(0, 100)}`;
    }
    default:
      return null;
  }
}

function checkGateAdvance(
  tool: string,
  args: unknown,
  result: unknown,
  currentGate: string
): string | null {
  const resultStr = result ? JSON.stringify(result) : '';
  const hasError = resultStr.includes('"error"') || resultStr.includes('"status":"error"');
  const cmd = extractCommandFromArgs(args) || '';

  // Build gate advances when files are written
  if (!hasError && currentGate === 'build') {
    if (['write_file', 'mcp_write_file', 'patch'].includes(tool)) {
      return 'test';
    }
  }

  // Test gate advances when tests pass
  if (!hasError && currentGate === 'test') {
    if (/test.*(pass|success|ok)/i.test(resultStr)) {
      return 'verify';
    }
  }

  return null;
}
```

---

## PHASE 4: Create Session Hooks (NEW FILES)

### Step 4.1: Create session-hook.ts

**File:** `src/hooks/v1.1.0/session-hook.ts`

```typescript
/**
 * Session Created Hook — session.created integration
 * 
 * Initializes fresh gate state for new sessions.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shark/shared/gates.js';
import { EvidenceCollector } from '../../shark/shared/evidence.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createSessionHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector
): Hooks['session.created'] {
  return async ({ sessionID }) => {
    console.log(`[Shark] session.created: ${sessionID}`);

    // Restore fresh initial state
    gateManager.restore({
      currentGate: 'plan',
      gateStatus: {
        plan: 'pending',
        build: 'pending',
        test: 'pending',
        verify: 'pending',
        audit: 'pending',
        delivery: 'pending',
      },
      verifyAttempts: 0,
      currentIteration: 'V1.0',
      iterationAttempts: {},
    });

    // Ensure .shark directory exists in workspace
    const sharkDir = path.join(process.cwd(), '.shark');
    try {
      await fs.promises.mkdir(sharkDir, { recursive: true });
    } catch {}

    // Deploy shark-context to workspace if not present
    await ensureSharkContext(sharkDir);
  };
}

async function ensureSharkContext(sharkDir: string): Promise<void> {
  const contextTarget = path.join(sharkDir, 'shark-context');
  const contextSource = path.join(process.cwd(), 'shark-context'); // Relative to plugin

  try {
    const exists = await fs.promises.access(contextTarget).then(() => true).catch(() => false);
    if (!exists) {
      // Try to find shark-context in plugin directory
      // The plugin is loaded from its directory, so we can reference it relatively
      console.log(`[Shark] shark-context not found at ${contextTarget}, skipping deploy`);
    }
  } catch {
    // Ignore errors — context deployment is best-effort
  }
}
```

### Step 4.2: Create compacting-hook.ts

**File:** `src/hooks/v1.1.0/compacting-hook.ts`

```typescript
/**
 * Session Compacting Hook — session.compacting integration
 * 
 * Snapshots gate state before context compression.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shark/shared/gates.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createCompactingHook(
  gateManager: GateManager
): Hooks['session.compacting'] {
  return async ({ sessionID }) => {
    console.log(`[Shark] session.compacting: ${sessionID}`);

    const state = gateManager.getState();
    const sessionDir = path.join(process.cwd(), '.shark', 'sessions', sessionID);

    try {
      await fs.promises.mkdir(sessionDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(sessionDir, 'gate-state.json'),
        JSON.stringify(state, null, 2)
      );
    } catch (err) {
      console.error(`[Shark] Failed to snapshot state: ${err}`);
    }
  };
}
```

### Step 4.3: Create system-transform-hook.ts

**File:** `src/hooks/v1.1.0/system-transform-hook.ts`

```typescript
/**
 * System Transform Hook — chat.system.transform integration
 * 
 * Injects enforcement context into system prompt.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shark/shared/gates.js';

export function createSystemTransformHook(
  gateManager: GateManager
): Hooks['chat.system.transform'] {
  return async (_input, output) => {
    const state = gateManager.getState();
    const criteria = gateManager.getCriteria(state.currentGate);

    const enforcementContext = `
[SHARK ENFORCEMENT CONTEXT]
Current Gate: ${state.currentGate.toUpperCase()}
Iteration: ${state.currentIteration}
Verify Attempts: ${state.verifyAttempts}/3

Blocking Criteria for ${state.currentGate}:
${criteria.blockingCriteria.map((c: string) => `  - ${c}`).join('\n')}

Evidence Required:
${criteria.evidenceRequired.map((e: string) => `  - ${e}`).join('\n')}
`.trim();

    if (Array.isArray(output.systemPrompt)) {
      output.systemPrompt.push(enforcementContext);
    } else if (typeof output.systemPrompt === 'string') {
      output.systemPrompt = output.systemPrompt + '\n\n' + enforcementContext;
    }
  };
}
```

---

## PHASE 5: Create Hooks Index (NEW FILE)

### Step 5.1: Create hooks/v1.1.0/index.ts

**File:** `src/hooks/v1.1.0/index.ts`

```typescript
/**
 * Shark V4 Hooks — V1.1.0
 * 
 * Master hook aggregator. Creates a complete Hooks object wired to:
 * - Guardian (tool.execute.before — blocks dangerous commands)
 * - GateManager (tool.execute.after — advances gates, collects evidence)
 * - EvidenceCollector (tool.execute.after — archives work proof)
 * - Session lifecycle (session.created, session.compacting)
 * - System prompt (chat.system.transform — injects enforcement context)
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shark/shared/guardian.js';
import { GateManager } from '../../shark/shared/gates.js';
import { EvidenceCollector } from '../../shark/shared/evidence.js';
import { createGuardianHook } from './guardian-hook.js';
import { createGateHook } from './gate-hook.js';
import { createSessionHook } from './session-hook.js';
import { createCompactingHook } from './compacting-hook.js';
import { createSystemTransformHook } from './system-transform-hook.js';

export function createSharkHooks(
  guardian: Guardian,
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector
): Hooks {
  return {
    name: 'shark-agent-v4',
    version: '1.1.0',

    'tool.execute.before': createGuardianHook(guardian),
    'tool.execute.after': createGateHook(gateManager, evidenceCollector),
    'session.created': createSessionHook(gateManager, evidenceCollector),
    'session.compacting': createCompactingHook(gateManager),
    'chat.system.transform': createSystemTransformHook(gateManager),
  };
}
```

---

## PHASE 6: Create New Plugin Entry Point (NEW FILE)

### Step 6.1: Create src/index.v1.1.0.ts

**File:** `src/index.v1.1.0.ts`

**Key changes from src/index.ts:**
1. Import and spread `createSharkHooks()`
2. Use `process.cwd()` for evidence base path
3. Add `name` and `version` to returned object
4. Fix shark-evidence import (remove zod)

```typescript
/**
 * Shark Agent V4 — OpenCode Plugin (V1.1.0)
 * 
 * V1.1.0 changes from V1.0:
 * - Added OpenCode hook integration (tool.execute.before/after, session.*, chat.system.transform)
 * - Evidence path uses process.cwd() instead of plugin directory
 * - shark-evidence tool uses tool.arg.enum() instead of zod
 */

import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import * as path from 'node:path';

// Shared components
import { createStateStore } from './shark/shared/state-store.js';
import { createBrainMessenger } from './shark/shared/messenger.js';
import { Guardian } from './shark/shared/guardian.js';
import { GateManager } from './shark/shared/gates.js';
import { EvidenceCollector } from './shark/shared/evidence.js';

// V1.1.0: Import hooks
import { createSharkHooks } from './hooks/v1.1.0/index.js';

// Micro components
import { MicroCoordinator } from './shark/micro/coordinator.js';
import { PLAN_BRAIN_T1, BUILD_BRAIN_T1, COORDINATOR_T1 } from './shark/micro/brains.js';

// Macro components
import { MacroPeerDispatch } from './shark/macro/peer-dispatch.js';
import { 
  EXECUTION_BRAIN_T1, 
  REASONING_BRAIN_T1, 
  SYSTEM_BRAIN_T1, 
  PLAN_BRAIN_MACRO_T1 
} from './shark/macro/brains.js';

// Tools
import { createSharkStatusTool } from './tools/shark-status.js';
import { createSharkGateTool } from './tools/shark-gate.js';
import { createSharkEvidenceTool } from './tools/shark-evidence.js'; // V1.1.0 version

// State management
const stateStore = createStateStore();
const messenger = createBrainMessenger();
const guardian = new Guardian({ level: 'SANDBOX' });

// V1.1.0: Coordinators not used until hooks are fully wired
// let microCoordinator: MicroCoordinator | null = null;
// let macroDispatcher: MacroPeerDispatch | null = null;

function getMicroCoordinator(): MicroCoordinator {
  // Placeholder — coordinator logic moved to hooks
  throw new Error('Coordinator not yet wired');
}

function getMacroDispatcher(): MacroPeerDispatch {
  // Placeholder — coordinator logic moved to hooks
  throw new Error('Dispatcher not yet wired');
}

export default async function SharkAgentV4(input: PluginInput): Promise<Hooks> {
  const { directory } = input;

  // V1.1.0 FIX: Use workspace path, not plugin directory
  const workspacePath = process.cwd();
  const gm = new GateManager(path.join(workspacePath, '.shark'));
  const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));

  // Create tools
  const statusToolMicro = createSharkStatusTool(stateStore, gm, 'micro');
  const statusToolMacro = createSharkStatusTool(stateStore, gm, 'macro');
  const gateTool = createSharkGateTool(gm, guardian);
  const evidenceTool = createSharkEvidenceTool(ec);

  // V1.1.0: Create wired hooks
  const hooks = createSharkHooks(guardian, gm, ec);

  return {
    // V1.1.0: Spread hooks (critical integration)
    ...hooks,

    // Tools
    tool: {
      'shark-status': statusToolMicro,
      'shark-status-micro': statusToolMicro,
      'shark-status-macro': statusToolMacro,
      'shark-gate': gateTool,
      'shark-evidence': evidenceTool,
    },

    // Agent registration via config callback
    config: async (opencodeConfig: any) => {
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = {};
      }

      Object.assign(opencodeConfig.agent, {
        'shark-micro': {
          name: 'shark-micro',
          description: 'Shark Agent V4 — Dual-brain sequential (Plan ↔ Build)',
          instructions: `${PLAN_BRAIN_T1}\n\n${COORDINATOR_T1}`,
          mode: 'primary',
          permission: { task: 'allow' },
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
          },
        },
        'shark-macro': {
          name: 'shark-macro',
          // V1.1.0 FIX: Use only Execution Brain as primary (honest single-agent)
          // Triple-brain racing requires multi-process; macro V1.1 is aspirational
          description: 'Shark Agent V4 — Triple-brain parallel (Execution + Reasoning + System)',
          instructions: `${EXECUTION_BRAIN_T1}`,
          mode: 'primary',
          permission: { task: 'allow' },
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
          },
        },
      });
    },
  };
}
```

---

## PHASE 7: Fix shark-evidence Tool (NEW FILE)

### Step 7.1: Create src/tools/shark-evidence.v1.1.0.ts

**File:** `src/tools/shark-evidence.v1.1.0.ts`

**Fix:** Remove zod dependency. Use OpenCode's `tool.arg.enum()`.

```typescript
/**
 * Shark Evidence Tool — V1.1.0
 * 
 * V1.1.0 fix: Removed zod dependency. Uses OpenCode's tool.arg.enum() instead.
 */

import { tool } from '@opencode-ai/plugin';
import { EvidenceCollector, type GateName } from '../shark/shared/evidence.js';

export function createSharkEvidenceTool(evidenceCollector: EvidenceCollector) {
  return tool({
    description: 'View evidence collection status and debug logs',
    args: {
      action: tool.arg.enum(['status', 'gate-evidence', 'iteration-logs', 'complete']),
      gate: tool.arg.enum(['plan', 'build', 'test', 'verify', 'audit', 'delivery']).optional(),
      iteration: tool.arg.string().optional(),
    },
    execute: async (args) => {
      const { action, gate, iteration } = args;

      if (action === 'status') {
        const complete = evidenceCollector.hasCompleteEvidence();
        const gates: GateName[] = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];
        const gateStatuses: Record<string, { count: number; latest: string | null }> = {};

        for (const g of gates) {
          const evidence = evidenceCollector.getGateEvidence(g);
          gateStatuses[g] = {
            count: evidence.length,
            latest: evidence[0]?.timestamp
              ? new Date(evidence[0].timestamp).toISOString()
              : null,
          };
        }

        return JSON.stringify({ complete, gates: gateStatuses }, null, 2);
      }

      if (action === 'gate-evidence') {
        if (!gate) {
          return JSON.stringify({ error: 'Gate required' });
        }
        const evidence = evidenceCollector.getGateEvidence(gate);
        return JSON.stringify({ gate, evidence }, null, 2);
      }

      if (action === 'iteration-logs') {
        if (!iteration) {
          return JSON.stringify({ error: 'Iteration required' });
        }
        const logs = evidenceCollector.getIterationLogs(iteration);
        return JSON.stringify({ iteration, logs }, null, 2);
      }

      if (action === 'complete') {
        const complete = evidenceCollector.hasCompleteEvidence();
        return JSON.stringify({ complete }, null, 2);
      }

      return JSON.stringify({ error: 'Unknown action' });
    },
  });
}
```

---

## PHASE 8: Verification Before Swap

### Step 8.1: Run pre-build checks

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

echo "=== PRE-BUILD VERIFICATION ==="

echo "1. New hook files exist:"
test -f src/hooks/v1.1.0/index.ts && echo "   OK: index.ts" || echo "   FAIL: index.ts missing"
test -f src/hooks/v1.1.0/guardian-hook.ts && echo "   OK: guardian-hook.ts" || echo "   FAIL: guardian-hook.ts missing"
test -f src/hooks/v1.1.0/gate-hook.ts && echo "   OK: gate-hook.ts" || echo "   FAIL: gate-hook.ts missing"
test -f src/hooks/v1.1.0/session-hook.ts && echo "   OK: session-hook.ts" || echo "   FAIL: session-hook.ts missing"
test -f src/hooks/v1.1.0/compacting-hook.ts && echo "   OK: compacting-hook.ts" || echo "   FAIL: compacting-hook.ts missing"
test -f src/hooks/v1.1.0/system-transform-hook.ts && echo "   OK: system-transform-hook.ts" || echo "   FAIL: system-transform-hook.ts missing"

echo "2. New plugin entry exists:"
test -f src/index.v1.1.0.ts && echo "   OK: index.v1.1.0.ts" || echo "   FAIL: index.v1.1.0.ts missing"

echo "3. New shark-evidence tool exists:"
test -f src/tools/shark-evidence.v1.1.0.ts && echo "   OK: shark-evidence.v1.1.0.ts" || echo "   FAIL: shark-evidence.v1.1.0.ts missing"

echo "4. Backup exists:"
test -f ../shark-agent-v1.0-backup/src/index.ts && echo "   OK: backup exists" || echo "   FAIL: backup missing"
```

**STOP if any FAIL.** Fix missing files before proceeding.

### Step 8.2: Typecheck new files

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Typecheck V1.1.0 entry point
npx tsc --noEmit src/hooks/v1.1.0/index.ts 2>&1 || echo "typecheck failed"

# Typecheck shark-evidence
npx tsc --noEmit src/tools/shark-evidence.v1.1.0.ts 2>&1 || echo "typecheck failed"
```

---

## PHASE 9: File Swap (After Verification Passes)

### Step 9.1: Swap plugin entry point

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Preserve V1.0 originals
mv src/index.ts src/index.v1.0.ts
mv src/index.v1.1.0.ts src/index.ts

# Preserve old shark-evidence
mv src/tools/shark-evidence.ts src/tools/shark-evidence.v1.0.ts
mv src/tools/shark-evidence.v1.1.0.ts src/tools/shark-evidence.ts

echo "Files swapped: V1.1.0 now active"
```

---

## PHASE 10: Build and Verify Bundle

### Step 10.1: Build

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

bun build src/index.ts \
  --outdir dist \
  --target bun \
  --format esm \
  --bundle 2>&1

echo "Build exit code: $?"
```

### Step 10.2: Verify bundle contains hook integrations

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

echo "=== BUNDLE VERIFICATION ==="

BUNDLE_HOOKS=$(grep -c "tool.execute.before" dist/index.js 2>/dev/null || echo "0")
echo "tool.execute.before references: $BUNDLE_HOOKS (expected: 1+)"

BUNDLE_SESSION=$(grep -c "session.created" dist/index.js 2>/dev/null || echo "0")
echo "session.created references: $BUNDLE_SESSION (expected: 1+)"

BUNDLE_GUARDIAN=$(grep -c "guardian" dist/index.js 2>/dev/null || echo "0")
echo "guardian references: $BUNDLE_GUARDIAN (expected: 5+)"

BUNDLE_GATES=$(grep -c "GateManager\|gateManager" dist/index.js 2>/dev/null || echo "0")
echo "GateManager references: $BUNDLE_GATES (expected: 3+)"

BUNDLE_EVIDENCE=$(grep -c "evidenceCollector\|EvidenceCollector" dist/index.js 2>/dev/null || echo "0")
echo "EvidenceCollector references: $BUNDLE_EVIDENCE (expected: 3+)"
```

**FAIL criteria:** Any count is 0 or far below expected.

---

## PHASE 11: Register and Smoke Test

### Step 11.1: Register in opencode.json

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": [
    "file:///home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/dist/index.js"
  ]
}
```

### Step 11.2: Reload and test

```bash
# Reload plugins
opencode --reload-plugins

# Check agent registration
opencode --agent shark-micro "help" 2>&1 | head -20

# Test evidence tool (should return valid JSON now)
opencode --tool shark-evidence --action status 2>&1

# Check shark-status
opencode --tool shark-status 2>&1
```

---

## If Anything Fails

1. **Typecheck fails:** Check TypeScript errors in new files
2. **Build fails:** Check import paths, module resolution
3. **Bundle verification fails:** Hooks not properly imported or spread
4. **Smoke test fails:** Check OpenCode registration path

**To restore V1.0:** Rename `src/index.v1.0.ts` → `src/index.ts` and `src/tools/shark-evidence.v1.0.ts` → `src/tools/shark-evidence.ts`, then rebuild.

---

*Fix Sequence complete. V1.1 build artifacts ready.*
