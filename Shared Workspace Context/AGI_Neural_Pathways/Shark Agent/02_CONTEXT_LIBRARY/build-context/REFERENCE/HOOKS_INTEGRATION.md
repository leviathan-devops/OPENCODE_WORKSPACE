# HOOKS INTEGRATION — How to Wire Shark V4 Into OpenCode

This document tells the build agent exactly how to integrate Shark V4's enforcement primitives into OpenCode's hook system.

---

## What Is OpenCode's Hook System

OpenCode plugins can return a `Hooks` object alongside `tool` and `config`. Hooks fire at specific events during agent execution. Without hooks, a plugin has **no runtime interaction** with the agent's work.

**Source:** `@opencode-ai/plugin` TypeScript definitions (installed as peer dependency).

---

## The Hooks Interface

```typescript
// Simplified from @opencode-ai/plugin
interface Hooks {
  name?: string;
  version?: string;

  // Tool execution interception
  'tool.execute.before'?: (
    input: { tool: string; args: unknown; sessionID?: string; callID?: string },
    output: unknown
  ) => Promise<{ blocked?: boolean; reason?: string } | void>;

  'tool.execute.after'?: (
    input: { tool: string; args: unknown; result?: unknown; error?: unknown; sessionID?: string },
    output: unknown
  ) => Promise<void>;

  // Session lifecycle
  'session.created'?: (input: { sessionID: string }) => Promise<void>;
  'session.compacting'?: (input: { sessionID: string }) => Promise<void>;

  // System prompt injection
  'chat.system.transform'?: (
    input: { sessionID?: string },
    output: { systemPrompt?: string | string[] }
  ) => Promise<void>;

  // Generic event handler
  event?: (event: string, data: unknown) => Promise<void>;
}
```

---

## The Pattern From V4 Boilerplate

The V4 boilerplate (`Agent-Factory-Edition/src/hooks/`) shows the correct implementation pattern:

### tool-before-after.ts (reference)

```typescript
// Pattern for tool.execute.before
export const toolBeforeHook: AnyHookHandler = safeHook(
  async (input, _output) => {
    if (!input.sessionID || !input.tool) return;
    // Intercept tool call here
    // Return { blocked: true } to prevent execution
  },
  'tool.execute.before'
);

// Pattern for tool.execute.after
export const toolAfterHook: AnyHookHandler = safeHook(
  async (input, _output) => {
    if (!input.sessionID || !input.tool) return;
    // Collect evidence, advance gates here
  },
  'tool.execute.after'
);
```

### chat-system-transform.ts (reference)

```typescript
// Pattern for chat.system.transform
export const systemEnhancerHook: AnyHookHandler = safeHook(
  async (_input, _output) => {
    // Inject context into system prompt here
    // _output.systemPrompt = _output.systemPrompt + '\n\n[Enforcement Context]'
  },
  'experimental.chat.system.transform'
);
```

**Note:** The boilerplate wraps hooks in `safeHook()` which handles error isolation. Shark V4 should follow this pattern.

---

## How Guardian Must Integrate

Guardian must be called from `tool.execute.before` for any tool that executes shell commands or writes files.

### Implementation Required (NEW FILE: src/hooks/v1.1.0/guardian-hook.ts)

```typescript
import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shark/shared/guardian.js';

export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async ({ tool, args, sessionID }) => {
    // Only check terminal/shell tools
    if (tool !== 'terminal' && tool !== 'mcp_terminal') {
      return; // Let other tools pass
    }

    // Extract command from args
    const command = extractCommand(args);
    if (!command) return;

    // Block dangerous commands
    if (guardian.isDangerousCommand(command)) {
      console.log(`[Guardian] BLOCKED dangerous command: ${command.slice(0, 50)}...`);
      return { blocked: true, reason: `Guardian: dangerous command blocked` };
    }

    // Check path-based writes
    const writePath = extractWritePath(tool, args);
    if (writePath && !guardian.canWrite(writePath)) {
      const zone = guardian.classifyZone(writePath);
      console.log(`[Guardian] BLOCKED write to ${zone}: ${writePath}`);
      return { blocked: true, reason: `Guardian: write to ${zone} not allowed` };
    }

    return; // Allow
  };
}

function extractCommand(args: unknown): string | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;
  return (a.command as string) || (a.cmd as string) || null;
}

function extractWritePath(tool: string, args: unknown): string | null {
  if (!args) return null;
  const a = args as Record<string, unknown>;
  switch (tool) {
    case 'mcp_write_file':
    case 'write_file':
      return (a.path as string) || null;
    case 'terminal':
    case 'mcp_terminal':
      return (a.workdir as string) || null;
    default:
      return null;
  }
}
```

---

## How GateManager Must Integrate

GateManager must be called from `tool.execute.after` to track work done and advance gates when criteria are met.

### Implementation Required (NEW FILE: src/hooks/v1.1.0/gate-hook.ts)

```typescript
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shark/shared/gates.js';
import { EvidenceCollector } from '../../shark/shared/evidence.js';

export function createGateHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector
): Hooks['tool.execute.after'] {
  return async ({ tool, args, result, sessionID }) => {
    // Determine which gate this tool affects
    const gate = inferGate(tool, args, result);
    if (!gate) return;

    // Collect evidence for this tool's work product
    const workEvidence = collectWorkEvidence(tool, args, result);
    if (workEvidence) {
      evidenceCollector.collectEvidence(gate, {
        tool,
        workEvidence,
        timestamp: Date.now(),
        sessionID,
      });
    }

    // Check if gate criteria are met
    if (gateCriteriaMet(gate, tool, args, result)) {
      gateManager.passCurrentGate();
      const nextGate = getNextGate(gate);
      if (nextGate) {
        gateManager.transitionTo(nextGate);
      }
    }
  };
}

function inferGate(tool: string, args: unknown, result: unknown): string | null {
  // Map tools to gates based on what they produce
  const buildTools = ['write_file', 'mcp_write_file', 'patch', 'terminal'];
  const testTools = ['terminal']; // when running test commands

  if (buildTools.some(t => tool.includes(t))) return 'build';
  if (testTools.some(t => tool.includes(t))) {
    const cmd = (args as Record<string, unknown>)?.command as string;
    if (cmd?.includes('test')) return 'test';
  }
  return null;
}

function gateCriteriaMet(gate: string, tool: string, args: unknown, result: unknown): boolean {
  // This is a simplified heuristic
  // Real implementation needs actual criteria checking
  if (!result) return false;
  const resultStr = JSON.stringify(result);
  return !resultStr.includes('error') && !resultStr.includes('fail');
}

function getNextGate(current: string): string | null {
  const chain = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];
  const idx = chain.indexOf(current);
  return idx >= 0 && idx < chain.length - 1 ? chain[idx + 1] : null;
}

function collectWorkEvidence(tool: string, args: unknown, result: unknown): string | null {
  // Collect minimal evidence of what this tool produced
  if (!args) return null;
  const a = args as Record<string, unknown>;
  switch (tool) {
    case 'write_file':
    case 'mcp_write_file':
      return `wrote:${a.path}`;
    case 'terminal':
    case 'mcp_terminal':
      return `ran:${a.command}`;
    default:
      return null;
  }
}
```

---

## How EvidenceCollector Must Integrate

EvidenceCollector is called from `tool.execute.after` (already shown above in gate-hook.ts).

The evidence path fix is critical:

```typescript
// WRONG (V1.0):
const gm = new GateManager(directory);  // directory = plugin install path

// CORRECT (V1.1):
import * as path from 'node:path';
const workspacePath = process.cwd();    // OpenCode sets cwd = workspace
const gm = new GateManager(path.join(workspacePath, '.shark'));
const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));
```

---

## How session.created Must Integrate

```typescript
export function createSessionHook(
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector
): Hooks['session.created'] {
  return async ({ sessionID }) => {
    console.log(`[Shark] session.created: ${sessionID}`);

    // Initialize fresh gate state for new session
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

    // Deploy shark-context to workspace if not present
    ensureSharkContext(process.cwd(), getPluginPath());
  };
}
```

---

## How session.compacting Must Integrate

```typescript
export function createCompactingHook(
  gateManager: GateManager
): Hooks['session.compacting'] {
  return async ({ sessionID }) => {
    console.log(`[Shark] session.compacting: ${sessionID}`);

    // Snapshot gate state before context compression
    const state = gateManager.getState();
    const statePath = path.join(process.cwd(), '.shark', 'sessions', sessionID, 'gate-state.json');

    // Ensure directory exists
    await fs.promises.mkdir(path.dirname(statePath), { recursive: true });
    await fs.promises.writeFile(statePath, JSON.stringify(state, null, 2));
  };
}
```

---

## How chat.system.transform Must Integrate

```typescript
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

    // Append to system prompt
    if (Array.isArray(output.systemPrompt)) {
      output.systemPrompt.push(enforcementContext);
    } else if (typeof output.systemPrompt === 'string') {
      output.systemPrompt = output.systemPrompt + '\n\n' + enforcementContext;
    }
  };
}
```

---

## The Complete createSharkHooks() Function

This is the function that `src/index.v1.1.0.ts` must call:

```typescript
// File: src/hooks/v1.1.0/index.ts

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

## How src/index.ts Must Use createSharkHooks

```typescript
// File: src/index.v1.1.0.ts (NEW FILE — do not edit src/index.ts)

import type { Plugin, PluginInput } from '@opencode-ai/plugin';
import { createSharkHooks } from './hooks/v1.1.0/index.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

// ... existing imports ...

export default async function SharkAgentV4(input: PluginInput): Promise<Hooks> {
  const { directory } = input;

  // Use workspace path for evidence, not plugin directory
  const workspacePath = process.cwd();
  const gm = new GateManager(path.join(workspacePath, '.shark'));
  const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));

  // Create hooks wired to enforcement primitives
  const hooks = createSharkHooks(guardian, gm, ec);

  return {
    ...hooks,  // ← CRITICAL: spread hooks into returned object

    tool: { ... },
    config: async ...,
  };
}
```

---

*Reference: V4 Boilerplate hooks at /home/leviathan/OPENCODE_WORKSPACE/agent_plugin_boilerplates/Agent-Factory-Edition/src/hooks/*
