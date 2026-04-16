import { BaseCoordinator, BaseCoordinatorConfig } from '../shark-core/brain/coordinator-base_v2';
import { MicroCoordinator, MicroCoordinatorConfig } from '../shark-core/brain/coordinator-micro_v2';
import { MacroCoordinator, MacroCoordinatorConfig } from '../shark-core/brain/coordinator-macro_v2';
import { ExecutionResult, SharkMode, CoordinatorAdapter } from '../types/coordinator-types';

export class CoordinatorManager implements CoordinatorAdapter {
  private microCoordinator: MicroCoordinator | null = null;
  private macroCoordinator: MacroCoordinator | null = null;
  private currentMode: SharkMode | null = null;
  private sessionCoordinators: Map<string, MicroCoordinator | MacroCoordinator> = new Map();
  private workspacePath: string;
  private config: any;

  constructor(config: any) {
    this.workspacePath = config.workspacePath;
    this.config = config;
  }

  async initialize(mode: SharkMode, sessionID: string): Promise<void> {
    this.currentMode = mode;

    const baseConfig: BaseCoordinatorConfig = {
      maxIterations: this.config.options?.maxIterations || 10,
      autoApprove: this.config.options?.autoApprove || false,
      verbose: this.config.options?.verbose || false,
      workspacePath: this.workspacePath,
      skipFirewalls: this.config.options?.skipFirewalls || false
    };

    if (mode === SharkMode.MICRO) {
      const microConfig: MicroCoordinatorConfig = {
        ...baseConfig
      };
      this.microCoordinator = new MicroCoordinator(microConfig);
      this.sessionCoordinators.set(sessionID, this.microCoordinator);
    } else {
      const macroConfig: MacroCoordinatorConfig = {
        ...baseConfig
      };
      this.macroCoordinator = new MacroCoordinator(macroConfig);
      this.sessionCoordinators.set(sessionID, this.macroCoordinator);
    }
  }

  adjustModelParams(input: any, output: any): any {
    const coordinator = this.currentMode === SharkMode.MICRO
      ? this.microCoordinator : this.macroCoordinator;

    if (coordinator) {
      const status = coordinator.getConfigStatus();
      output.options = output.options || {};
      output.options.brain = status?.executionModel || 'unknown';
    }
    return output;
  }

  async toggle(): Promise<SharkMode> {
    if (!this.currentMode) {
      throw new Error('No mode initialized');
    }

    this.currentMode = this.currentMode === SharkMode.MICRO ? SharkMode.MACRO : SharkMode.MICRO;

    const baseConfig: BaseCoordinatorConfig = {
      maxIterations: this.config.options?.maxIterations || 10,
      autoApprove: this.config.options?.autoApprove || false,
      verbose: this.config.options?.verbose || false,
      workspacePath: this.workspacePath,
      skipFirewalls: this.config.options?.skipFirewalls || false
    };

    if (this.currentMode === SharkMode.MICRO) {
      const microConfig: MicroCoordinatorConfig = {
        ...baseConfig
      };
      this.microCoordinator = new MicroCoordinator(microConfig);
    } else {
      const macroConfig: MacroCoordinatorConfig = {
        ...baseConfig
      };
      this.macroCoordinator = new MacroCoordinator(macroConfig);
    }

    return this.currentMode;
  }

  async execute(task: string, options?: any): Promise<ExecutionResult> {
    const coordinator = this.currentMode === SharkMode.MICRO
      ? this.microCoordinator : this.macroCoordinator;

    if (!coordinator) {
      throw new Error('Coordinator not initialized');
    }

    try {
      const result = await coordinator.execute(task, options);
      return {
        success: true,
        output: result.finalOutput,
        iterations: result.iterations,
        executionTime: result.executionTimeMs,
        tokensUsed: result.totalTokens,
        errors: []
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        iterations: 0,
        executionTime: 0,
        errors: [error.message]
      };
    }
  }

  async quickExecute(task: string, options?: any): Promise<string> {
    const coordinator = this.currentMode === SharkMode.MICRO
      ? this.microCoordinator : this.macroCoordinator;

    if (!coordinator) {
      throw new Error('Coordinator not initialized');
    }

    return await coordinator.quickExecute(task, options);
  }

  getConfigStatus(): any {
    const coordinator = this.currentMode === SharkMode.MICRO
      ? this.microCoordinator : this.macroCoordinator;

    if (!coordinator) {
      return { planning: false, execution: false, executionModel: 'None' };
    }

    return coordinator.getConfigStatus();
  }

  getCoordinator(): BaseCoordinator | null {
    return this.currentMode === SharkMode.MICRO ? this.microCoordinator : this.macroCoordinator;
  }

  getMode(): SharkMode {
    return this.currentMode || SharkMode.MICRO;
  }
}
