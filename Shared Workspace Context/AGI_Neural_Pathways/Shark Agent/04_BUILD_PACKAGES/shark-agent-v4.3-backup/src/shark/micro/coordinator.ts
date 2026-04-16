/**
 * Shark Micro — Coordinator
 * 
 * Mechanical Plan ↔ Build brain switch.
 * NOT agent-driven — hard enforcement.
 */

import type { StateStore } from '../shared/state-store.js';
import type { BrainMessenger } from '../shared/messenger.js';
import { GateManager } from '../shared/gates.js';

export type MicroBrain = 'plan' | 'build';

export interface MicroState {
  currentBrain: MicroBrain;
  specComplete: boolean;
  buildComplete: boolean;
  currentIteration: string;
}

export class MicroCoordinator {
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private gateManager: GateManager;
  private failureCount: Map<string, number> = new Map();
  private state: MicroState;

  constructor(
    stateStore: StateStore,
    messenger: BrainMessenger,
    gateManager: GateManager,
  ) {
    this.stateStore = stateStore;
    this.messenger = messenger;
    this.gateManager = gateManager;

    this.state = {
      currentBrain: 'plan',
      specComplete: false,
      buildComplete: false,
      currentIteration: 'V1.0',
    };

    this.stateStore.set('micro-state', this.state, 'workflow-state', 'coordinator');
  }

  getCurrentBrain(): MicroBrain {
    return this.state.currentBrain;
  }

  getState(): MicroState {
    return { ...this.state };
  }

  signalSpecComplete(): void {
    this.state.specComplete = true;
    this.stateStore.set('micro-state', this.state, 'workflow-state', 'coordinator');
    this.switchBrain('build');

    this.messenger.send({
      from: 'coordinator',
      to: 'build-brain',
      type: 'handoff',
      priority: 'high',
      payload: { trigger: 'spec-complete', iteration: this.state.currentIteration },
      requiresAck: true,
    });
  }

  signalBuildComplete(): void {
    this.state.buildComplete = true;
    this.stateStore.set('micro-state', this.state, 'workflow-state', 'coordinator');
    this.switchBrain('plan');

    this.messenger.send({
      from: 'coordinator',
      to: 'plan-brain',
      type: 'handoff',
      priority: 'normal',
      payload: { trigger: 'build-complete' },
      requiresAck: false,
    });
  }

  signalGateFailure(gate: string): void {
    const count = (this.failureCount.get(gate) || 0) + 1;
    this.failureCount.set(gate, count);

    if (count >= 3) {
      this.escalateToPlan();
    } else {
      this.switchBrain('build');
      this.messenger.send({
        from: 'coordinator',
        to: 'build-brain',
        type: 'alert',
        priority: 'high',
        payload: { trigger: 'gate-failure', gate, attempt: count },
        requiresAck: true,
      });
    }
  }

  private escalateToPlan(): void {
    const escalation = this.gateManager.handleVerifyFailure();
    this.state.currentIteration = escalation.iteration;
    this.state.buildComplete = false;
    this.state.specComplete = false;
    this.failureCount.clear();
    this.switchBrain('plan');

    this.messenger.send({
      from: 'coordinator',
      to: 'plan-brain',
      type: 'alert',
      priority: 'critical',
      payload: { 
        trigger: 'escalation', 
        iteration: this.state.currentIteration,
        reason: 'VERIFY failed 3 times'
      },
      requiresAck: true,
    });
  }

  private switchBrain(brain: MicroBrain): void {
    this.state.currentBrain = brain;
    this.stateStore.set('micro-state', this.state, 'workflow-state', 'coordinator');

    this.messenger.send({
      from: 'coordinator',
      to: brain === 'plan' ? 'build-brain' : 'plan-brain',
      type: 'alert',
      priority: 'normal',
      payload: { trigger: 'brain-switch', to: brain },
      requiresAck: false,
    });
  }

  isInBuildMode(): boolean {
    return this.state.currentBrain === 'build';
  }

  isInPlanMode(): boolean {
    return this.state.currentBrain === 'plan';
  }
}
