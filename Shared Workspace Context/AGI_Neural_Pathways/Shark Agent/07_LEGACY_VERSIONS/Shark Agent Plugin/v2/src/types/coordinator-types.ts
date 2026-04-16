export enum SharkMode {
  MICRO = 'micro',
  MACRO = 'macro',
}

export enum WorkflowStep {
  PLAN = 0,
  BUILD = 1,
  TEST = 2,
  VERIFY = 3,
  SHIP = 4,
}

export const STEP_NAMES: Record<WorkflowStep, string> = {
  [WorkflowStep.PLAN]: 'PLAN',
  [WorkflowStep.BUILD]: 'BUILD',
  [WorkflowStep.TEST]: 'TEST',
  [WorkflowStep.VERIFY]: 'VERIFY',
  [WorkflowStep.SHIP]: 'SHIP',
};

export interface SharkConfig {
  mode: SharkMode;
  workspacePath: string;
  apiKeys: {
    deepseek?: string;
    glm?: string;
  };
  options: {
    autoApprove: boolean;
    verbose: boolean;
    skipFirewalls: boolean;
    maxIterations: number;
  };
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  iterations: number;
  executionTimeMs: number;
  totalTokens: number;
  errors: string[];
}

export interface CoordinatorAdapter {
  initialize(mode: SharkMode, workspacePath: string): Promise<void>;
  execute(task: string, options?: any): Promise<ExecutionResult>;
  quickExecute(task: string, options?: any): Promise<string>;
  toggle(): Promise<SharkMode>;
  getMode(): SharkMode;
  getConfigStatus(): any;
}

export default SharkMode;
