export interface StagnationState {
  agentId: string;
  stuck: boolean;
  reason: 'no-progress' | 'build-failure-loop' | 'test-failure-loop' | 'timeout' | 'error-loop';
  duration: number;
  lastProgress: Date;
  failureCount: number;
  lastError?: string;
}

export interface ProgressEvent {
  agentId: string;
  type: 'progress' | 'failure' | 'success' | 'timeout';
  timestamp: Date;
  message: string;
  details?: any;
}

export class StagnationDetector {
  private agentStates: Map<string, StagnationState> = new Map();
  private progressHistory: Map<string, ProgressEvent[]> = new Map();
  
  readonly NO_PROGRESS_THRESHOLD = 30;
  readonly FAILURE_COUNT_THRESHOLD = 3;
  readonly BUILD_TIMEOUT_THRESHOLD = 30;
  readonly MAX_HISTORY_SIZE = 100;

  checkStagnation(agentId: string): StagnationState {
    const state = this.agentStates.get(agentId);
    
    if (!state) {
      return this.createInitialState(agentId);
    }

    this.updateStagnationStatus(agentId);
    return { ...state };
  }

  recordProgress(agentId: string, progress: string): void {
    this.addEvent(agentId, {
      agentId,
      type: 'progress',
      timestamp: new Date(),
      message: progress,
    });

    const state = this.agentStates.get(agentId);
    if (state) {
      state.lastProgress = new Date();
      state.stuck = false;
      state.reason = 'no-progress';
    } else {
      this.agentStates.set(agentId, this.createInitialState(agentId));
    }
  }

  recordFailure(agentId: string, error: string, details?: any): void {
    this.addEvent(agentId, {
      agentId,
      type: 'failure',
      timestamp: new Date(),
      message: error,
      details,
    });

    let state = this.agentStates.get(agentId);
    if (!state) {
      state = this.createInitialState(agentId);
      this.agentStates.set(agentId, state);
    }

    state.failureCount++;
    state.lastError = error;

    if (state.failureCount >= this.FAILURE_COUNT_THRESHOLD) {
      state.stuck = true;
      state.reason = this.determineFailureReason(error);
    }
  }

  recordSuccess(agentId: string, message: string): void {
    this.addEvent(agentId, {
      agentId,
      type: 'success',
      timestamp: new Date(),
      message,
    });

    const state = this.agentStates.get(agentId);
    if (state) {
      state.failureCount = 0;
      state.stuck = false;
      state.lastError = undefined;
    }
  }

  recordTimeout(agentId: string, duration: number): void {
    this.addEvent(agentId, {
      agentId,
      type: 'timeout',
      timestamp: new Date(),
      message: `Timeout after ${duration}ms`,
      details: { duration },
    });

    const state = this.agentStates.get(agentId);
    if (state) {
      state.stuck = true;
      state.reason = 'timeout';
    }
  }

  getStuckAgents(): StagnationState[] {
    const stuck: StagnationState[] = [];
    
    for (const [agentId] of this.agentStates) {
      const state = this.checkStagnation(agentId);
      if (state.stuck) {
        stuck.push(state);
      }
    }

    return stuck;
  }

  getAgentHistory(agentId: string): ProgressEvent[] {
    return this.progressHistory.get(agentId) || [];
  }

  clearAgentState(agentId: string): void {
    this.agentStates.delete(agentId);
    this.progressHistory.delete(agentId);
  }

  setThresholds(thresholds: {
    noProgress?: number;
    failureCount?: number;
    buildTimeout?: number;
  }): void {
    if (thresholds.noProgress !== undefined) {
      (this as any).NO_PROGRESS_THRESHOLD = thresholds.noProgress;
    }
    if (thresholds.failureCount !== undefined) {
      (this as any).FAILURE_COUNT_THRESHOLD = thresholds.failureCount;
    }
    if (thresholds.buildTimeout !== undefined) {
      (this as any).BUILD_TIMEOUT_THRESHOLD = thresholds.buildTimeout;
    }
  }

  private createInitialState(agentId: string): StagnationState {
    const state: StagnationState = {
      agentId,
      stuck: false,
      reason: 'no-progress',
      duration: 0,
      lastProgress: new Date(),
      failureCount: 0,
    };
    this.agentStates.set(agentId, state);
    return state;
  }

  private updateStagnationStatus(agentId: string): void {
    const state = this.agentStates.get(agentId);
    if (!state) return;

    const now = new Date();
    const minutesSinceProgress = (now.getTime() - state.lastProgress.getTime()) / 60000;
    state.duration = minutesSinceProgress;

    if (minutesSinceProgress >= this.NO_PROGRESS_THRESHOLD && !state.stuck) {
      state.stuck = true;
      state.reason = 'no-progress';
    }
  }

  private determineFailureReason(error: string): StagnationState['reason'] {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('build') || errorLower.includes('compile')) {
      return 'build-failure-loop';
    }
    if (errorLower.includes('test') || errorLower.includes('assert')) {
      return 'test-failure-loop';
    }
    return 'error-loop';
  }

  private addEvent(agentId: string, event: ProgressEvent): void {
    if (!this.progressHistory.has(agentId)) {
      this.progressHistory.set(agentId, []);
    }

    const history = this.progressHistory.get(agentId)!;
    history.push(event);

    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }
  }
}
