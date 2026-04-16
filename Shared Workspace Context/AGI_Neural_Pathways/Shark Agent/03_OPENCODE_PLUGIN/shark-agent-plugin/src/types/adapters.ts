export interface BrainAdapter {
  execute(prompt: string, options?: any): Promise<any>;
  isConfigured(): boolean;
}

export interface SafetyAdapter {
  checkOperation(operation: string, data: any): Promise<{ allowed: boolean; reason?: string }>;
  getStats(): any;
}

export interface ToolAdapter {
  execute(toolCall: any): Promise<any>;
}

export interface CoordinatorAdapter {
  execute(task: string, options?: any): Promise<any>;
  quickExecute(task: string, options?: any): Promise<string>;
  getConfigStatus(): any;
}

export interface PluginAdapter {
  execute(task: string, options?: any): Promise<any>;
  quickExecute(task: string, options?: any): Promise<string>;
  switchMode(mode: string): void;
  getPluginInfo(): any;
}
