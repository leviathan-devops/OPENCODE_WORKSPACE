# Implementation Guide — guardian-hook.ts

## Target File

`/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/guardian-hook.ts`

## Pattern Matching Architecture

```typescript
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input;
    
    // L0: IDENTITY WALL - only process for shark agent
    if (!getCurrentAgent()) {
      return;
    }
    
    const args = (output as { args: unknown }).args;
    
    // L1-L4: Static pattern checks
    // L5: Anti-derailment
    // L6: Local file protection
    
    // ... implementation
  };
}
```

## buildTextToCheck Function

**CRITICAL:** Only check toolArgs, never agentMessage or output.

```typescript
function buildTextToCheck(context: {
  toolName: string;
  toolArgs: Record<string, unknown>;
}): string {
  return JSON.stringify(context.toolArgs);
}
```

## Evidence Check Function

For L5.2 and L5.4, require mechanical evidence:

```typescript
const CONTAINER_TEST_RESULT_FILE = 'ContainerTestResult.json';

function hasContainerTestEvidence(): boolean {
  const evidencePath = path.join(
    process.cwd(),
    '.shark',
    'evidence',
    'delivery',
    CONTAINER_TEST_RESULT_FILE
  );
  
  if (!fs.existsSync(evidencePath)) {
    return false;
  }
  
  try {
    const result = JSON.parse(fs.readFileSync(evidencePath, 'utf-8'));
    return result.overallPassed === true && result.passRate >= 0.96;
  } catch {
    return false;
  }
}
```

## L5.2/L5.4 Evidence-Gated Pattern Check

```typescript
function checkEvidenceGatedPattern(
  patterns: RegExp[],
  textToCheck: string,
  layer: string,
  errorMsg: string
): void {
  for (const pattern of patterns) {
    if (pattern.test(textToCheck)) {
      if (!hasContainerTestEvidence()) {
        throw new Error(`[${layer}] ${errorMsg} — MECHANICAL PROOF REQUIRED. Run container tests first.`);
      }
    }
  }
}
```

## Guardian Returns Early Pattern

```typescript
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input;
    
    // CRITICAL: Only process for shark agent sessions
    if (!getCurrentAgent()) {
      return;  // Vanilla agents bypassed entirely
    }
    
    // ... rest of implementation
  };
}
```

## Throw to Block Pattern

```typescript
// WRONG - advisory only
console.error('[GUARDIAN] DANGEROUS_COMMAND_BLOCKED');
return;

// CORRECT - actually blocks
if (dangerousPattern) {
  throw new Error(`[ANTI-DERAILMENT L5.1] HOST FALLBACK BLOCKED...`);
}
```

## Guardian Hook File Structure

```typescript
// 1. Imports
import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shared/guardian.js';
import { extractCommandFromArgs } from './utils.js';
import { getCurrentAgent } from './agent-state.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// 2. Pattern definitions (L1-L5)
const THEATRICAL_PATTERNS = [...];
const FAKE_TEST_PATTERNS = [...];
const SOURCE_INSPECTION_PATTERNS = [...];
const WRONG_CONTAINER_PATTERNS = [...];
const HOST_FALLBACK_PATTERNS = [...];
const SUCCESS_CLAIM_PATTERNS = [...];
// ... etc

// 3. Evidence check functions
function hasContainerTestEvidence(): boolean {...}

// 4. buildTextToCheck helper
function buildTextToCheck(toolArgs: Record<string, unknown>): string {
  return JSON.stringify(toolArgs);
}

// 5. Main hook factory
export function createGuardianHook(guardian: Guardian): Hooks['tool.execute.before'] {
  return async (input, output) => {
    const { tool } = input;
    
    // L0: Identity wall
    if (!getCurrentAgent()) return;
    
    const args = (output as { args: unknown }).args;
    const toolArgs = (args || {}) as Record<string, unknown>;
    const textToCheck = buildTextToCheck(toolArgs);
    
    // L1: Theatrical verification
    for (const pattern of THEATRICAL_PATTERNS) {
      if (pattern.test(textToCheck)) {
        throw new Error(`[ANTI-SLOP L1] Counting theater detected.`);
      }
    }
    
    // L2: Fake test runner
    for (const pattern of FAKE_TEST_PATTERNS) {
      if (pattern.test(textToCheck)) {
        throw new Error(`[ANTI-SLOP L2] Fake test runner detected.`);
      }
    }
    
    // L3: Source inspection
    // L4: Wrong container
    // L5: Anti-derailment with evidence gating
    // L6: Local file protection via guardian.canWrite()
    
    // ... rest of existing implementation
  };
}
```

## Key Implementation Notes

1. **All patterns go in guardian-hook.ts** — NOT guardian.ts
2. **Guardian returns early if not shark agent** — `if (!getCurrentAgent()) return;`
3. **MUST throw errors to block** — console.log is advisory
4. **Pattern matching checks toolArgs ONLY** — Not agentMessage or output
5. **Evidence gating for L5.2/L5.4** — Require ContainerTestResult.json

## Existing Code to Preserve

The current guardian-hook.ts has:
- Source file edit block (lines 32-45)
- Dangerous command block (lines 59-63)
- Source file modify block (lines 65-70)
- Zone violation block (lines 74-80)

These MUST be preserved and enhanced, not replaced.
