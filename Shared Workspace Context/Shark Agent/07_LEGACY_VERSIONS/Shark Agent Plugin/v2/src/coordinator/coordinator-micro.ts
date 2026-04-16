import { SharkMode, WorkflowStep, ExecutionResult, CoordinatorAdapter } from '../types/coordinator-types';
import { WorkflowMachine } from '../workflow/machine';
import { Guardian } from '../guardian';
import { SafetyEnforcer } from '../safety/safety-enforcer';

export interface BaseCoordinatorConfig {
  maxIterations: number;
  autoApprove: boolean;
  verbose: boolean;
  workspacePath: string;
  skipFirewalls: boolean;
}

export class MicroCoordinator implements CoordinatorAdapter {
  private config: BaseCoordinatorConfig;
  private workflow: WorkflowMachine;
  private guardian: Guardian;
  private safety: SafetyEnforcer;
  private currentMode: SharkMode = SharkMode.MICRO;
  private planningBrain: string = '0-minimax/MiniMax-M2.7';
  private executionBrain: string = '0-glm-coding/glm-5';

  constructor(config: BaseCoordinatorConfig) {
    this.config = config;
    this.workflow = new WorkflowMachine(config.workspacePath);
    this.guardian = new Guardian(config.workspacePath);
    this.safety = new SafetyEnforcer(this.guardian);
  }

  async initialize(mode: SharkMode, workspacePath: string): Promise<void> {
    this.currentMode = mode;
  }

  async execute(task: string, options?: any): Promise<ExecutionResult> {
    const step = this.workflow.getCurrentStep();
    let iterations = 0;
    const startTime = Date.now();

    while (iterations < this.config.maxIterations) {
      iterations++;
      const currentStep = this.workflow.getCurrentStep();

      if (currentStep === WorkflowStep.PLAN) {
        console.log('[SHARK Micro] Executing PLAN step with MiniMax M2.7');
      } else if (currentStep === WorkflowStep.BUILD) {
        console.log('[SHARK Micro] Executing BUILD step with GLM 5');
      } else if (currentStep === WorkflowStep.TEST) {
        console.log('[SHARK Micro] Executing TEST step');
      } else if (currentStep === WorkflowStep.VERIFY) {
        console.log('[SHARK Micro] Executing VERIFY step');
      } else if (currentStep === WorkflowStep.SHIP) {
        console.log('[SHARK Micro] Executing SHIP step');
        break;
      }

      const next = this.workflow.nextStep();
      if (next === null && currentStep === WorkflowStep.SHIP) {
        break;
      }
    }

    return {
      success: true,
      output: `SHARK Micro execution complete: ${iterations} iterations`,
      iterations,
      executionTimeMs: Date.now() - startTime,
      totalTokens: 0,
      errors: [],
    };
  }

  async quickExecute(task: string, options?: any): Promise<string> {
    const result = await this.execute(task, options);
    return result.output;
  }

  async toggle(): Promise<SharkMode> {
    this.currentMode = this.currentMode === SharkMode.MICRO ? SharkMode.MACRO : SharkMode.MICRO;
    return this.currentMode;
  }

  getMode(): SharkMode {
    return this.currentMode;
  }

  getConfigStatus(): any {
    const step = this.workflow.getCurrentStep();
    const progress = this.workflow.getProgress();
    return {
      mode: 'MICRO',
      planning: this.planningBrain,
      execution: this.executionBrain,
      currentStep: step,
      progress,
      workflowState: this.workflow.getState(),
    };
  }

  getWorkflow(): WorkflowMachine {
    return this.workflow;
  }

  getGuardian(): Guardian {
    return this.guardian;
  }

  getSafety(): SafetyEnforcer {
    return this.safety;
  }

  getModelForStep(step: WorkflowStep): string {
    if (step === WorkflowStep.PLAN || step === WorkflowStep.VERIFY || step === WorkflowStep.TEST) {
      return this.planningBrain;
    }
    return this.executionBrain;
  }
}

export class MacroCoordinator implements CoordinatorAdapter {
  private config: BaseCoordinatorConfig;
  private workflow: WorkflowMachine;
  private guardian: Guardian;
  private currentMode: SharkMode = SharkMode.MACRO;
  private planningBrain: string = '0-minimax/MiniMax-M2.7';
  private executionBrain: string = '0-glm-coding/glm-5';

  constructor(config: BaseCoordinatorConfig) {
    this.config = config;
    this.workflow = new WorkflowMachine(config.workspacePath);
    this.guardian = new Guardian(config.workspacePath);
  }

  async initialize(mode: SharkMode, workspacePath: string): Promise<void> {
    this.currentMode = mode;
  }

  async execute(task: string, options?: any): Promise<ExecutionResult> {
    return {
      success: true,
      output: 'SHARK Macro execution placeholder',
      iterations: 0,
      executionTimeMs: 0,
      totalTokens: 0,
      errors: [],
    };
  }

  async quickExecute(task: string, options?: any): Promise<string> {
    const result = await this.execute(task, options);
    return result.output;
  }

  async toggle(): Promise<SharkMode> {
    this.currentMode = this.currentMode === SharkMode.MACRO ? SharkMode.MICRO : SharkMode.MACRO;
    return this.currentMode;
  }

  getMode(): SharkMode {
    return this.currentMode;
  }

  getConfigStatus(): any {
    return {
      mode: 'MACRO',
      planning: this.planningBrain,
      execution: this.executionBrain,
      currentStep: this.workflow.getCurrentStep(),
    };
  }

  getWorkflow(): WorkflowMachine {
    return this.workflow;
  }
}

export default MicroCoordinator;
