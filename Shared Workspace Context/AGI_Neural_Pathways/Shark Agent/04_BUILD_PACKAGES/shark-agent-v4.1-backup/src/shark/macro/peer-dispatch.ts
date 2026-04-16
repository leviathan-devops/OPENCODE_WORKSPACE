/**
 * Shark Macro — Peer Dispatch Coordinator
 * 
 * Manages the triple-brain parallel race.
 * All three brains start simultaneously.
 * Synchronize only at gates.
 */

import type { StateStore } from '../shared/state-store.js';
import type { BrainMessenger } from '../shared/messenger.js';
import { GateManager } from '../shared/gates.js';

export type MacroBrain = 'execution' | 'reasoning' | 'system' | 'plan';

export interface MacroState {
  activeBrains: MacroBrain[];
  currentGate: string;
  executionProgress: number;
  reasoningContext: unknown;
  systemAlerts: unknown[];
  currentIteration: string;
}

export class MacroPeerDispatch {
  private stateStore: StateStore;
  private messenger: BrainMessenger;
  private gateManager: GateManager;
  private state: MacroState;
  private running: boolean = false;

  constructor(
    stateStore: StateStore,
    messenger: BrainMessenger,
    gateManager: GateManager,
  ) {
    this.stateStore = stateStore;
    this.messenger = messenger;
    this.gateManager = gateManager;

    this.state = {
      activeBrains: ['execution', 'reasoning', 'system'],
      currentGate: 'plan',
      executionProgress: 0,
      reasoningContext: null,
      systemAlerts: [],
      currentIteration: 'V1.0',
    };

    this.stateStore.set('macro-state', this.state, 'workflow-state', 'system-brain');
  }

  async startRace(): Promise<void> {
    if (this.running) return;
    this.running = true;

    const brains: MacroBrain[] = ['execution', 'reasoning', 'system', 'plan'];

    for (const brain of brains) {
      this.messenger.send({
        from: 'coordinator',
        to: `${brain}-brain`,
        type: 'handoff',
        priority: 'high',
        payload: { trigger: 'start-race', iteration: this.state.currentIteration },
        requiresAck: true,
      });
    }
  }

  stopRace(): void {
    this.running = false;

    this.messenger.send({
      from: 'coordinator',
      to: 'all',
      type: 'alert',
      priority: 'critical',
      payload: { trigger: 'stop-race' },
      requiresAck: false,
    });
  }

  isRunning(): boolean {
    return this.running;
  }

  signalGateComplete(gate: string): void {
    this.messenger.send({
      from: 'coordinator',
      to: 'all',
      type: 'alert',
      priority: 'high',
      payload: { trigger: 'gate-complete', gate },
      requiresAck: false,
    });
  }

  handleVerifyFailure(): { action: 'loop' | 'escalate'; iteration: string } {
    const result = this.gateManager.handleVerifyFailure();
    
    if (result.action === 'escalate') {
      this.state.currentIteration = result.iteration;
      this.state.executionProgress = 0;
      this.state.reasoningContext = null;
      
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

    return result;
  }

  getState(): MacroState {
    return { ...this.state };
  }

  getMessagesForBrain(brain: MacroBrain): ReturnType<BrainMessenger['receive']> {
    return this.messenger.receive(`${brain}-brain`);
  }

  updateExecutionProgress(progress: number): void {
    this.state.executionProgress = progress;
    this.stateStore.set('macro-state', this.state, 'workflow-state', 'system-brain');
  }

  injectContext(context: unknown): void {
    this.state.reasoningContext = context;
    this.stateStore.set('macro-state', this.state, 'workflow-state', 'system-brain');

    this.messenger.send({
      from: 'reasoning-brain',
      to: 'execution-brain',
      type: 'context-inject',
      priority: 'normal',
      payload: { context },
      requiresAck: false,
    });
  }

  alertExecution(alert: unknown): void {
    this.state.systemAlerts.push(alert as any);
    this.stateStore.set('macro-state', this.state, 'workflow-state', 'system-brain');

    this.messenger.send({
      from: 'system-brain',
      to: 'execution-brain',
      type: 'alert',
      priority: 'high',
      payload: alert,
      requiresAck: true,
    });
  }
}
