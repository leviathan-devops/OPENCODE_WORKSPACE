# Shark Agent V4 — Audit Hotfix 001

**Hotfix ID:** shark-agent-v4-audit-hotfix-001
**Date:** 2026-04-07
**Source Audit:** `shark-agent-v4-first-build-audit-2026-04-07.md`
**Status:** PENDING — Requires Implementation

---

## Summary

This hotfix addresses 5 critical gaps identified in the first build audit:
1. **GAP #1:** No `coordinator.ts` (micro coordinator class missing)
2. **GAP #2:** No `peer-dispatch.ts` (macro coordinator class missing)
3. **GAP #3:** Brain switching not wired — Micro has T1s but no switching mechanism
4. **GAP #4:** shark-macro is single-agent despite claiming "triple-brain parallel"
5. **GAP #5:** Tab UI color is not dark green — Spider uses red (#FF3B30), Shark needs dark green (#006400)

---

## FIX #1: Tab UI Color — Dark Green

**Problem:** Shark agent tab UI is not dark green. Spider agent uses `#FF3B30` (red).

**Reference (from Spider agent):**
```javascript
architect.config.color = "#FF3B30";
```

**Solution:** Add dark green color to shark-micro and shark-macro agent configs.

**File:** `src/index.ts`

**Current code (lines 80-107):**
```typescript
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
    description: 'Shark Agent V4 — Single primary brain (Execution Mode)',
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
```

**FIXED code:**
```typescript
// Shark agents use dark green (#006400) for tab UI
const sharkColor = '#006400';

Object.assign(opencodeConfig.agent, {
  'shark-micro': {
    name: 'shark-micro',
    description: 'Shark Agent V4 — Dual-brain sequential (Plan ↔ Build)',
    instructions: `${PLAN_BRAIN_T1}\n\n${COORDINATOR_T1}`,
    mode: 'primary',
    permission: { task: 'allow' },
    color: sharkColor,
    tools: {
      'shark-status': true,
      'shark-gate': true,
      'shark-evidence': true,
    },
  },
  'shark-macro': {
    name: 'shark-macro',
    description: 'Shark Agent V4 — Single primary brain (Execution Mode)',
    instructions: `${EXECUTION_BRAIN_T1}`,
    mode: 'primary',
    permission: { task: 'allow' },
    color: sharkColor,
    tools: {
      'shark-status': true,
      'shark-gate': true,
      'shark-evidence': true,
    },
  },
});
```

---

## FIX #2: Create MicroCoordinator Class

**Problem:** `src/shark/micro/coordinator.ts` does not exist. Brain switching cannot be mechanical.

**Solution:** Create `src/shark/micro/coordinator.ts` with mechanical Plan↔Build switching.

**New file:** `src/shark/micro/coordinator.ts`

```typescript
/**
 * MicroCoordinator — Mechanical Plan↔Build Brain Switcher
 * 
 * V4.5: Implements HARD mechanical brain switching between Plan and Build brains.
 * This is NOT agent-driven — the coordinator watches signals and flips the switch.
 * NO agent can override the Coordinator.
 */

import type { StateStore } from '../shared/state-store.js';
import type { BrainMessenger } from '../shared/messenger.js';
import type { GateManager } from '../shared/gates.js';

export type BrainType = 'plan' | 'build';

export interface MicroCoordinatorState {
  currentBrain: BrainType;
  switchReason: string;
  lastSwitchAt: number;
}

export interface CoordinatorConfig {
  stateStore: StateStore;
  messenger: BrainMessenger;
  gateManager: GateManager;
}

export class MicroCoordinator {
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private gateManager: GateManager;
  
  constructor(config: CoordinatorConfig) {
    this.stateStore = config.stateStore;
    this.messenger = config.messenger;
    this.gateManager = config.gateManager;
  }

  /**
   * Initialize coordinator state for a new session
   */
  initialize(): void {
    const state: MicroCoordinatorState = {
      currentBrain: 'plan',
      switchReason: 'session-start',
      lastSwitchAt: Date.now(),
    };
    this.stateStore.set('micro-state', state);
    console.log('[MicroCoordinator] Initialized with Plan Brain');
  }

  /**
   * Get current active brain
   */
  getCurrentBrain(): BrainType {
    const microState = this.stateStore.get<MicroCoordinatorState>('micro-state');
    return microState?.currentBrain || 'plan';
  }

  /**
   * Mechanical switch to Plan Brain
   * Called when: build-complete, gate-failed (3x)
   */
  switchToPlan(reason: string): void {
    const state: MicroCoordinatorState = {
      currentBrain: 'plan',
      switchReason: reason,
      lastSwitchAt: Date.now(),
    };
    this.stateStore.set('micro-state', state);
    console.log(`[MicroCoordinator] Switched to PLAN Brain: ${reason}`);
  }

  /**
   * Mechanical switch to Build Brain
   * Called when: spec-complete, plan-passed
   */
  switchToBuild(reason: string): void {
    const state: MicroCoordinatorState = {
      currentBrain: 'build',
      switchReason: reason,
      lastSwitchAt: Date.now(),
    };
    this.stateStore.set('micro-state', state);
    console.log(`[MicroCoordinator] Switched to BUILD Brain: ${reason}`);
  }

  /**
   * Check if switch is allowed (mechanical rules)
   */
  canSwitch(from: BrainType, to: BrainType): boolean {
    if (from === to) return false;
    
    // Plan → Build allowed when: spec-complete signal received
    if (from === 'plan' && to === 'build') {
      return true; // Controlled by signal receipt
    }
    
    // Build → Plan allowed when: build-complete or 3 failures
    if (from === 'build' && to === 'plan') {
      return true; // Always allowed (build done or forced)
    }
    
    return false;
  }

  /**
   * Handle build-complete signal → switch to Plan for review
   */
  onBuildComplete(): void {
    const current = this.getCurrentBrain();
    if (current === 'build' && this.canSwitch(current, 'plan')) {
      this.switchToBuild('build-complete');
      // Signal Plan Brain
      this.messenger.send('plan-brain', {
        type: 'build-complete',
        priority: 'high',
        payload: { timestamp: Date.now() },
      });
    }
  }

  /**
   * Handle spec-complete signal → switch to Build for execution
   */
  onSpecComplete(): void {
    const current = this.getCurrentBrain();
    if (current === 'plan' && this.canSwitch(current, 'build')) {
      this.switchToBuild('spec-complete');
      // Signal Build Brain
      this.messenger.send('build-brain', {
        type: 'spec-complete',
        priority: 'critical',
        payload: { timestamp: Date.now() },
      });
    }
  }

  /**
   * Handle gate-failed (3x) → force switch to Plan for re-spec
   */
  onGateFailed(gateName: string, attempts: number): void {
    if (attempts >= 3) {
      console.log(`[MicroCoordinator] 3 failures on ${gateName} — forcing escalation`);
      this.switchToPlan('escalation-3-failures');
      // Notify Plan Brain
      this.messenger.send('plan-brain', {
        type: 'escalation',
        priority: 'critical',
        payload: { gate: gateName, attempts, timestamp: Date.now() },
      });
    }
  }

  /**
   * Get active T1 prompt based on current brain
   */
  getActiveT1(planBrainT1: string, buildBrainT1: string): string {
    const current = this.getCurrentBrain();
    return current === 'plan' ? planBrainT1 : buildBrainT1;
  }
}
```

---

## FIX #3: Create MacroPeerDispatch Class

**Problem:** `src/shark/macro/peer-dispatch.ts` does not exist. Triple-brain racing cannot be mechanical.

**Solution:** Create `src/shark/macro/peer-dispatch.ts` with triple-brain coordination.

**New file:** `src/shark/macro/peer-dispatch.ts`

```typescript
/**
 * MacroPeerDispatch — Triple-Brain Race Coordinator
 * 
 * V4.5: Coordinates Execution + Reasoning + System brains in parallel race.
 * Synchronization only at gates. Context injection from Reasoning → Execution.
 * System Brain alerting and enforcement. Plan Brain background monitoring.
 */

import type { StateStore } from '../shared/state-store.js';
import type { BrainMessenger } from '../shared/messenger.js';
import type { GateManager } from '../shared/gates.js';

export type MacroBrain = 'execution' | 'reasoning' | 'system' | 'plan';

export interface MacroBrainState {
  activeBrains: MacroBrain[];
  primaryBrain: MacroBrain;
  phase: 'execution' | 'reasoning' | 'verification' | 'audit' | 'delivery';
  contextInjected: boolean;
  lastSyncAt: number;
}

export interface MacroDispatchConfig {
  stateStore: StateStore;
  messenger: BrainMessenger;
  gateManager: GateManager;
}

export class MacroPeerDispatch {
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private gateManager: GateManager;

  constructor(config: MacroDispatchConfig) {
    this.stateStore = config.stateStore;
    this.messenger = config.messenger;
    this.gateManager = config.gateManager;
  }

  /**
   * Initialize triple-brain state for a new session
   */
  initialize(): void {
    const state: MacroBrainState = {
      activeBrains: ['execution', 'reasoning', 'system'],
      primaryBrain: 'execution',
      phase: 'execution',
      contextInjected: false,
      lastSyncAt: Date.now(),
    };
    this.stateStore.set('macro-state', state);
    console.log('[MacroPeerDispatch] Triple-brain initialized: Execution + Reasoning + System');
  }

  /**
   * Get current macro state
   */
  getState(): MacroBrainState {
    return this.stateStore.get<MacroBrainState>('macro-state') || {
      activeBrains: [],
      primaryBrain: 'execution',
      phase: 'execution',
      contextInjected: false,
      lastSyncAt: 0,
    };
  }

  /**
   * Inject context from Reasoning Brain into Execution Brain
   */
  injectContext(context: any): void {
    const state = this.getState();
    this.stateStore.set('macro-state', {
      ...state,
      contextInjected: true,
      lastSyncAt: Date.now(),
    });
    this.messenger.send('execution-brain', {
      type: 'context-injection',
      priority: 'normal',
      payload: context,
    });
    console.log('[MacroPeerDispatch] Context injected from Reasoning → Execution');
  }

  /**
   * Handle gate transition — synchronize all brains
   */
  onGateTransition(fromGate: string, toGate: string): void {
    console.log(`[MacroPeerDispatch] Gate transition: ${fromGate} → ${toGate}`);
    
    const state = this.getState();
    
    // Update phase based on gate
    let newPhase: MacroBrainState['phase'] = 'execution';
    if (toGate === 'verify') newPhase = 'verification';
    else if (toGate === 'audit') newPhase = 'audit';
    else if (toGate === 'delivery') newPhase = 'delivery';
    
    this.stateStore.set('macro-state', {
      ...state,
      phase: newPhase,
      contextInjected: false,
      lastSyncAt: Date.now(),
    });

    // Notify all brains
    this.messenger.broadcast({
      type: 'gate-transition',
      priority: 'high',
      payload: { from: fromGate, to: toGate, phase: newPhase },
    });
  }

  /**
   * Handle verification failure — trigger Reasoning Brain auto-debug
   */
  onVerifyFailure(error: any): void {
    console.log('[MacroPeerDispatch] VERIFY failure — triggering auto-debug');
    this.messenger.send('reasoning-brain', {
      type: 'auto-debug-request',
      priority: 'critical',
      payload: { error, timestamp: Date.now() },
    });
  }

  /**
   * Handle 3 VERIFY failures — escalate to Plan Brain
   */
  onEscalation(gateName: string, attempts: number): void {
    console.log(`[MacroPeerDispatch] Escalation: ${attempts} failures on ${gateName}`);
    this.stateStore.set('macro-state', {
      ...this.getState(),
      phase: 'execution',
      contextInjected: false,
      lastSyncAt: Date.now(),
    });
    this.messenger.send('plan-brain', {
      type: 'escalation',
      priority: 'critical',
      payload: { gate: gateName, attempts, timestamp: Date.now() },
    });
  }

  /**
   * Get active T1 prompts for all brains
   */
  getActiveT1Prompts(
    executionT1: string,
    reasoningT1: string,
    systemT1: string,
    planT1: string
  ): Record<MacroBrain, string> {
    const state = this.getState();
    return {
      execution: executionT1,
      reasoning: reasoningT1,
      system: systemT1,
      plan: planT1,
    };
  }
}
```

---

## FIX #4: Wire Coordinator to Plugin

**Problem:** Coordinators exist but are not wired to the OpenCode plugin hooks.

**Solution:** Import and initialize coordinators in `src/index.ts`, wire to session lifecycle.

**File:** `src/index.ts`

**Changes needed:**

1. Add imports (after line 27):
```typescript
import { MicroCoordinator } from './shark/micro/coordinator.js';
import { MacroPeerDispatch } from './shark/macro/peer-dispatch.js';
```

2. Add coordinator initialization (after line 36):
```typescript
// Coordinators (V4.5: now wired)
const microCoordinator = new MicroCoordinator({
  stateStore,
  messenger,
  gateManager: gm,
});

const macroDispatch = new MacroPeerDispatch({
  stateStore,
  messenger,
  gateManager: gm,
});
```

3. Wire to session hook (in `handleSessionCreated`):
```typescript
// Initialize coordinators on new session
microCoordinator.initialize();
macroDispatch.initialize();
```

4. Wire brain switching to system transform hook (new file `src/hooks/v4.1/brain-switch-hook.ts`):
```typescript
/**
 * Brain Switch Hook — mechanical brain context injection
 */
import type { Hooks } from '@opencode-ai/plugin';
import { MicroCoordinator } from '../../shark/micro/coordinator.js';
import { MacroPeerDispatch } from '../../shark/macro/peer-dispatch.js';
import { PLAN_BRAIN_T1, BUILD_BRAIN_T1 } from '../../shark/micro/brains.js';
import { EXECUTION_BRAIN_T1, REASONING_BRAIN_T1, SYSTEM_BRAIN_T1, PLAN_BRAIN_MACRO_T1 } from '../../shark/macro/brains.js';

export function createBrainSwitchHook(
  microCoordinator: MicroCoordinator,
  macroDispatch: MacroPeerDispatch,
  variant: 'micro' | 'macro'
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    if (variant === 'micro') {
      const activeT1 = microCoordinator.getActiveT1(PLAN_BRAIN_T1, BUILD_BRAIN_T1);
      const systemOutput = output as { system: string[] };
      if (Array.isArray(systemOutput.system)) {
        systemOutput.system.push(`\n[SHARK BRAIN CONTEXT] Active Brain: ${microCoordinator.getCurrentBrain().toUpperCase()}\n${activeT1}`);
      }
    } else {
      // Macro: inject triple-brain state context
      const state = macroDispatch.getState();
      const systemOutput = output as { system: string[] };
      if (Array.isArray(systemOutput.system)) {
        systemOutput.system.push(`\n[SHARK BRAIN CONTEXT] Active Brains: ${state.activeBrains.join(', ')} | Phase: ${state.phase}\n${EXECUTION_BRAIN_T1}`);
      }
    }
  };
}
```

---

## FIX #5: Update shark-macro Description (Honest Architecture)

**Problem:** shark-macro description claims "Triple-brain parallel" but is single-agent.

**Solution:** Update description to match actual implementation until triple-brain is wired.

**File:** `src/index.ts`

**Current (line 97):**
```typescript
description: 'Shark Agent V4 — Single primary brain (Execution Mode)',
```

**FIXED:**
```typescript
description: 'Shark Agent V4 — Execution Brain (single-agent mode, triple-brain pending)',
```

---

## Implementation Order

1. **FIX #1 (Color):** Quick win — add `color: '#006400'` to both agent configs
2. **FIX #5 (Description):** Quick win — update shark-macro description
3. **FIX #2 (MicroCoordinator):** Create class file + wire to index.ts
4. **FIX #3 (MacroPeerDispatch):** Create class file + wire to index.ts
5. **FIX #4 (Brain switch hook):** Create hook + wire to hooks/index.ts

---

## Verification Steps

After implementing all fixes:

```bash
# 1. Rebuild plugin
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun run build

# 2. Reload plugins in OpenCode
opencode --reload-plugins

# 3. Check tab colors (should be dark green)
# Look for #006400 in agent tab UI

# 4. Test Micro brain switching
opencode --agent shark-micro "build a hello world"

# 5. Check coordinator initialization
opencode --print-logs --agent shark-micro "test"
# Should show: [MicroCoordinator] Initialized with Plan Brain

# 6. Test Macro state
opencode --agent shark-macro "build a hello world"
opencode --tool shark-status
# Should show: brain: "execution" (or triple-brain state once wired)
```

---

## Files to Create/Modify

| File | Action | Change |
|------|--------|--------|
| `src/index.ts` | MODIFY | Add color, imports, coordinator init |
| `src/shark/micro/coordinator.ts` | CREATE | MicroCoordinator class |
| `src/shark/macro/peer-dispatch.ts` | CREATE | MacroPeerDispatch class |
| `src/hooks/v4.1/brain-switch-hook.ts` | CREATE | Brain switch hook |
| `src/hooks/v4.1/index.ts` | MODIFY | Register brain-switch-hook |

---

## Rollback Plan

If hotfix causes issues:
1. Remove `color: sharkColor` from agent configs
2. Remove coordinator imports and instances from index.ts
3. Delete `src/shark/micro/coordinator.ts`
4. Delete `src/shark/macro/peer-dispatch.ts`
5. Rebuild: `bun run build`

---

*Hotfix Created: 2026-04-07*
*Source: shark-agent-v4-first-build-audit-2026-04-07.md*
