export enum SharkMode {
  MICRO = 'micro',
  MACRO = 'macro'
}

export interface SharkConfig {
  mode: SharkMode;
  workspacePath: string;
  apiKeys: {
    deepseek?: string;
    glm?: string;
  };
  options: {
    autoApprove?: boolean;
    verbose?: boolean;
    skipFirewalls?: boolean;
    maxIterations?: number;
  };
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  iterations: number;
  executionTime: number;
  tokensUsed?: number;
  errors?: string[];
}

export interface CoordinatorAdapter {
  execute(task: string, options?: any): Promise<ExecutionResult>;
  quickExecute(task: string, options?: any): Promise<string>;
  getConfigStatus(): any;
}
