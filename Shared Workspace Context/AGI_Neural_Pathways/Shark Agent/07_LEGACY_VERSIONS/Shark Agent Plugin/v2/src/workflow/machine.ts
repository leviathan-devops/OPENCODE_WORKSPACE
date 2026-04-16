import { WorkflowStep, STEP_NAMES } from '../types/coordinator-types';

interface WorkflowState {
  currentStep: WorkflowStep;
  completedSteps: Set<WorkflowStep>;
  blockers: string[];
  artifacts: Record<string, any>;
  commandHistory: Array<{ command: string; exitCode: number; timestamp: number }>;
}

export class WorkflowMachine {
  private state: WorkflowState;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.state = {
      currentStep: WorkflowStep.PLAN,
      completedSteps: new Set(),
      blockers: [],
      artifacts: {},
      commandHistory: [],
    };
  }

  getCurrentStep(): WorkflowStep {
    return this.state.currentStep;
  }

  getState(): WorkflowState & { completedSteps: number } {
    return {
      ...this.state,
      completedSteps: this.state.completedSteps.size,
    };
  }

  getProgress(): { current: string; completed: number; total: number; percentage: number } {
    const total = 5;
    const completed = this.state.completedSteps.size;
    return {
      current: STEP_NAMES[this.state.currentStep],
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  }

  nextStep(): WorkflowStep | null {
    const current = this.state.currentStep;
    this.state.blockers = [];

    if (current === WorkflowStep.PLAN) {
      if (!this.canAdvanceTo(WorkflowStep.BUILD)) {
        this.state.blockers.push('PLAN not complete: missing .shark/plan.md or .shark/claims.json');
        return null;
      }
      this.state.completedSteps.add(WorkflowStep.PLAN);
      this.state.currentStep = WorkflowStep.BUILD;
      return WorkflowStep.BUILD;
    }

    if (current === WorkflowStep.BUILD) {
      if (!this.canAdvanceTo(WorkflowStep.TEST)) {
        this.state.blockers.push('BUILD not complete: missing .shark/build-manifest.json');
        return null;
      }
      this.state.completedSteps.add(WorkflowStep.BUILD);
      this.state.currentStep = WorkflowStep.TEST;
      return WorkflowStep.TEST;
    }

    if (current === WorkflowStep.TEST) {
      if (!this.canAdvanceTo(WorkflowStep.VERIFY)) {
        this.state.blockers.push('TEST not complete: missing test results');
        return null;
      }
      this.state.completedSteps.add(WorkflowStep.TEST);
      this.state.currentStep = WorkflowStep.VERIFY;
      return WorkflowStep.VERIFY;
    }

    if (current === WorkflowStep.VERIFY) {
      if (!this.canAdvanceTo(WorkflowStep.SHIP)) {
        this.state.blockers.push('VERIFY not complete: gates not passed');
        return null;
      }
      this.state.completedSteps.add(WorkflowStep.VERIFY);
      this.state.currentStep = WorkflowStep.SHIP;
      return WorkflowStep.SHIP;
    }

    if (current === WorkflowStep.SHIP) {
      this.state.completedSteps.add(WorkflowStep.SHIP);
      return null;
    }

    return null;
  }

  canAdvanceTo(step: WorkflowStep): boolean {
    switch (step) {
      case WorkflowStep.BUILD:
        return !!this.state.artifacts['plan'] && !!this.state.artifacts['claims'];
      case WorkflowStep.TEST:
        return !!this.state.artifacts['buildManifest'];
      case WorkflowStep.VERIFY:
        return !!this.state.artifacts['testResults'];
      case WorkflowStep.SHIP:
        const gates = this.state.artifacts['verifyGates'];
        return !!gates && gates.functional === true && gates.intent === true && gates.security === true;
      default:
        return false;
    }
  }

  checkStepRestriction(tool: string, step: WorkflowStep): { allowed: boolean; reason?: string } {
    const restrictions: Record<WorkflowStep, string[]> = {
      [WorkflowStep.PLAN]: ['run_command', 'bash'],
      [WorkflowStep.BUILD]: [],
      [WorkflowStep.TEST]: ['write_file', 'edit_file'],
      [WorkflowStep.VERIFY]: ['write_file', 'edit_file', 'run_command', 'bash'],
      [WorkflowStep.SHIP]: ['write_file', 'edit_file'],
    };

    const blocked = restrictions[step] || [];
    if (blocked.includes(tool)) {
      return { allowed: false, reason: `Tool '${tool}' not allowed in ${STEP_NAMES[step]} step` };
    }
    return { allowed: true };
  }

  setArtifact(name: string, data: any): void {
    this.state.artifacts[name] = { ...data, timestamp: Date.now() };
  }

  getArtifact(name: string): any {
    return this.state.artifacts[name];
  }

  recordCommandExecution(command: string, exitCode: number): void {
    this.state.commandHistory.push({ command, exitCode, timestamp: Date.now() });
  }

  getCommandHistory() {
    return [...this.state.commandHistory];
  }

  getRequiredArtifacts(step: WorkflowStep): string[] {
    switch (step) {
      case WorkflowStep.PLAN:
        return ['.shark/plan.md', '.shark/claims.json'];
      case WorkflowStep.BUILD:
        return ['.shark/build-manifest.json'];
      case WorkflowStep.TEST:
        return ['.shark/test-results/stage1.json', '.shark/test-results/stage2.json'];
      case WorkflowStep.VERIFY:
        return ['.shark/verify-gates.json'];
      case WorkflowStep.SHIP:
        return ['.shark/SHIP_REPORT.md'];
      default:
        return [];
    }
  }

  reset(): void {
    this.state = {
      currentStep: WorkflowStep.PLAN,
      completedSteps: new Set(),
      blockers: [],
      artifacts: {},
      commandHistory: [],
    };
  }
}

export default WorkflowMachine;
