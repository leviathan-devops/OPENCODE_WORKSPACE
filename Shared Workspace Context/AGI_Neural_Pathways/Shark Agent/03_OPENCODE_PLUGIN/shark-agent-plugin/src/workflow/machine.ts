export enum WorkflowStep {
  PLAN = 'plan',
  BUILD = 'build',
  TEST = 'test',
  VERIFY = 'verify',
  SHIP = 'ship'
}

export interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: WorkflowStep[];
  artifacts: {
    plan: boolean;
    buildManifest: boolean;
    testResults: boolean;
    verificationReport: boolean;
  };
  blocked: boolean;
  blockReason?: string;
}

export class WorkflowMachine {
  private state: Map<string, WorkflowState> = new Map();

  getState(sessionID: string): WorkflowState {
    if (!this.state.has(sessionID)) {
      this.state.set(sessionID, {
        currentStep: WorkflowStep.PLAN,
        completedSteps: [],
        artifacts: {
          plan: false,
          buildManifest: false,
          testResults: false,
          verificationReport: false
        },
        blocked: false
      });
    }
    return this.state.get(sessionID)!;
  }

  canAdvanceTo(sessionID: string, targetStep: WorkflowStep): { allowed: boolean; reason?: string } {
    const state = this.getState(sessionID);

    // Define step order
    const stepOrder = [
      WorkflowStep.PLAN,
      WorkflowStep.BUILD,
      WorkflowStep.TEST,
      WorkflowStep.VERIFY,
      WorkflowStep.SHIP
    ];

    const currentIndex = stepOrder.indexOf(state.currentStep);
    const targetIndex = stepOrder.indexOf(targetStep);

    // Can't go backwards
    if (targetIndex < currentIndex) {
      return { allowed: false, reason: 'Cannot go backwards in workflow' };
    }

    // Can only advance one step at a time
    if (targetIndex > currentIndex + 1) {
      return { 
        allowed: false, 
        reason: `Must complete ${stepOrder[currentIndex + 1]} step before ${targetStep}` 
      };
    }

    // Check step-specific requirements
    switch (targetStep) {
      case WorkflowStep.BUILD:
        if (!state.artifacts.plan) {
          return { allowed: false, reason: 'Cannot enter BUILD without plan.md' };
        }
        break;

      case WorkflowStep.TEST:
        if (!state.artifacts.buildManifest) {
          return { allowed: false, reason: 'Cannot enter TEST without build-manifest.json' };
        }
        break;

      case WorkflowStep.VERIFY:
        if (!state.artifacts.testResults) {
          return { allowed: false, reason: 'Cannot enter VERIFY without test-results/' };
        }
        break;

      case WorkflowStep.SHIP:
        if (!state.artifacts.verificationReport) {
          return { allowed: false, reason: 'Cannot SHIP without verification-report.md' };
        }
        break;
    }

    return { allowed: true };
  }

  advanceTo(sessionID: string, step: WorkflowStep): void {
    const state = this.getState(sessionID);
    const check = this.canAdvanceTo(sessionID, step);
    
    if (!check.allowed) {
      state.blocked = true;
      state.blockReason = check.reason;
      return;
    }

    if (!state.completedSteps.includes(state.currentStep)) {
      state.completedSteps.push(state.currentStep);
    }
    state.currentStep = step;
    state.blocked = false;
    state.blockReason = undefined;
  }

  markArtifactComplete(sessionID: string, artifact: keyof WorkflowState['artifacts']): void {
    const state = this.getState(sessionID);
    state.artifacts[artifact] = true;
  }

  reset(sessionID: string): void {
    this.state.delete(sessionID);
  }
}

export const workflowMachine = new WorkflowMachine();
