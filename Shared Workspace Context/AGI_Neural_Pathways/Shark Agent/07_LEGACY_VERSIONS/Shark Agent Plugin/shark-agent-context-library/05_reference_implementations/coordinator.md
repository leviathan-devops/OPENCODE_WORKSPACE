# DualBrainCoordinator Reference

From `shark-frankenstein/src/orchestrator/DualBrainCoordinator.ts`.

## DualBrainCoordinator

```typescript
import type { BrainMessenger, BrainMessage } from '../../v4-integration/BrainMessenger.js';

export type OrchestratorRole = 'architect' | 'executor';
export type HandoffPriority = 'critical' | 'high' | 'normal' | 'low';

export interface HandoffRequest {
  from: OrchestratorRole;
  to: OrchestratorRole;
  task: string;
  claims?: Claim[];
  plan?: string;
  phase?: string;
  priority?: HandoffPriority;
}

export interface CoordinationState {
  architectActive: boolean;
  executorActive: boolean;
  currentPhase: string;
  pendingHandoffs: number;
  lastHandoffAt: number | null;
}

const PHASE_ORDER = ['PLAN', 'BUILD', 'TEST', 'VERIFY', 'SHIP'];

export class DualBrainCoordinator {
  private messenger: BrainMessenger;
  private architectCallbacks: Map<string, (msg: BrainMessage) => void> = new Map();
  private executorCallbacks: Map<string, (msg: BrainMessage) => void> = new Map();
  private state: CoordinationState = {
    architectActive: true,
    executorActive: false,
    currentPhase: 'PLAN',
    pendingHandoffs: 0,
    lastHandoffAt: null,
  };

  constructor(messenger: BrainMessenger) {
    this.messenger = messenger;
  }

  // ── State Accessors ───────────────────────────────────────

  getState(): CoordinationState {
    return { ...this.state };
  }

  isArchitectActive(): boolean {
    return this.state.architectActive;
  }

  isExecutorActive(): boolean {
    return this.state.executorActive;
  }

  // ── Handoff: Architect → Executor ─────────────────────────

  handOffToExecutor(request: HandoffRequest): string {
    const msgId = `handoff_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    this.messenger.send({
      id: msgId,
      from: 'shark-architect',
      to: 'shark-orchestrator',
      type: 'handoff',
      priority: request.priority ?? 'high',
      payload: {
        task: request.task,
        claims: request.claims,
        plan: request.plan,
        phase: request.phase,
      },
      requiresAck: true,
      timestamp: Date.now(),
    });

    this.state.executorActive = true;
    this.state.architectActive = false;
    this.state.pendingHandoffs++;
    this.state.lastHandoffAt = Date.now();

    return msgId;
  }

  // ── Handoff: Executor → Architect ─────────────────────────

  handOffToArchitect(reason: string, context: Record<string, unknown>): string {
    const msgId = `handoff_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    this.messenger.send({
      id: msgId,
      from: 'shark-orchestrator',
      to: 'shark-architect',
      type: 'handoff',
      priority: 'high',
      payload: {
        reason,
        context,
        phase: this.state.currentPhase,
      },
      requiresAck: true,
      timestamp: Date.now(),
    });

    this.state.architectActive = true;
    this.state.executorActive = false;
    this.state.pendingHandoffs++;
    this.state.lastHandoffAt = Date.now();

    return msgId;
  }

  // ── Phase Handoffs ────────────────────────────────────────

  /**
   * Called when VERIFY fails and architect needs to replan.
   * Triggers architect re-engagement with failure context.
   */
  escalateToArchitect(verificationFailures: VerificationFailures): string {
    return this.handOffToArchitect('verification_failed', {
      failures: verificationFailures,
      loopCount: verificationFailures.loopCount,
    });
  }

  /**
   * Called when BUILD is complete and executor needs TEST to run.
   * Executor stays active during TEST phase.
   */
  initiateTestPhase(): string {
    return this.handOffToExecutor({
      from: 'architect',
      to: 'executor',
      task: 'run_tests',
      phase: 'TEST',
      priority: 'critical',
    });
  }

  /**
   * Called when TEST is complete. Hands off to architect for VERIFY.
   * This is the architect's primary engagement point.
   */
  initiateVerifyPhase(testResults: TestResults): string {
    return this.handOffToArchitect('tests_complete', {
      results: testResults,
      phase: 'VERIFY',
    });
  }

  /**
   * Called when VERIFY passes. Hands off to executor for SHIP.
   */
  initiateShipPhase(): string {
    return this.handOffToExecutor({
      from: 'architect',
      to: 'executor',
      task: 'deliver',
      phase: 'SHIP',
      priority: 'critical',
    });
  }

  // ── Message Handling ─────────────────────────────────────

  /**
   * Process messages for a specific brain.
   * Returns messages that were handled by callbacks.
   */
  processMessages(brainId: 'shark-architect' | 'shark-orchestrator'): BrainMessage[] {
    const messages = this.messenger.receive(brainId);
    const callbacks = brainId === 'shark-architect' ? this.architectCallbacks : this.executorCallbacks;

    for (const msg of messages) {
      const callback = callbacks.get(msg.type);
      if (callback) {
        callback(msg);
      }

      // Handle ack messages
      if (msg.type === 'ack') {
        this.state.pendingHandoffs = Math.max(0, this.state.pendingHandoffs - 1);
      }
    }

    return messages;
  }

  // ── Callback Registration ─────────────────────────────────

  onArchitectHandoff(type: string, callback: (msg: BrainMessage) => void): void {
    this.architectCallbacks.set(type, callback);
  }

  onExecutorHandoff(type: string, callback: (msg: BrainMessage) => void): void {
    this.executorCallbacks.set(type, callback);
  }

  // ── Phase Management ─────────────────────────────────────

  setPhase(phase: string): void {
    const idx = PHASE_ORDER.indexOf(phase);
    const currentIdx = PHASE_ORDER.indexOf(this.state.currentPhase);
    this.state.currentPhase = phase;

    // Activate appropriate brain based on phase
    if (phase === 'PLAN' || phase === 'VERIFY') {
      this.state.architectActive = true;
    } else {
      this.state.executorActive = true;
    }
  }

  // ── Coordination Rules ───────────────────────────────────

  /**
   * Check if a phase transition is valid.
   */
  canTransition(from: string, to: string): boolean {
    const fromIdx = PHASE_ORDER.indexOf(from);
    const toIdx = PHASE_ORDER.indexOf(to);
    return toIdx === fromIdx + 1 || (from === 'VERIFY' && to === 'BUILD' && this.state.pendingHandoffs === 0);
  }

  /**
   * Check if architect should be active for this phase.
   */
  shouldArchitectBeActive(phase: string): boolean {
    return phase === 'PLAN' || phase === 'VERIFY';
  }

  /**
   * Check if executor should be active for this phase.
   */
  shouldExecutorBeActive(phase: string): boolean {
    return ['BUILD', 'TEST', 'SHIP'].includes(phase);
  }
}

interface Claim {
  id: string;
  description: string;
  testFile: string;
}

interface VerificationFailures {
  gate: string;
  details: string[];
  loopCount: number;
}

interface TestResults {
  stage1: object;
  stage2: object;
  passed: boolean;
}
```
