import { MicroCoordinator, BaseCoordinatorConfig } from './coordinator-micro';
import { MacroCoordinator } from './coordinator-micro';
import { SharkMode, ExecutionResult } from '../types/coordinator-types';
import { WorkflowMachine } from '../workflow/machine';

export class CoordinatorManager {
  private microCoordinator: MicroCoordinator | null = null;
  private macroCoordinator: MacroCoordinator | null = null;
  private currentMode: SharkMode = SharkMode.MICRO;
  private workspacePath: string;
  private config: any;

  constructor(config: any) {
    this.workspacePath = config.workspacePath;
    this.config = config;
  }

  async initialize(mode: SharkMode, workspacePath: string): Promise<void> {
    this.currentMode = mode;

    const baseConfig: BaseCoordinatorConfig = {
      maxIterations: this.config.options?.maxIterations || 10,
      autoApprove: this.config.options?.autoApprove || false,
      verbose: this.config.options?.verbose || false,
      workspacePath: this.workspacePath,
      skipFirewalls: this.config.options?.skipFirewalls || false,
    };

    if (mode === SharkMode.MICRO) {
      this.microCoordinator = new MicroCoordinator(baseConfig);
    } else {
      this.macroCoordinator = new MacroCoordinator(baseConfig);
    }
  }

  async execute(task: string, options?: any): Promise<ExecutionResult> {
    const coordinator = this.getActiveCoordinator();
    if (!coordinator) {
      throw new Error('No coordinator initialized');
    }
    return coordinator.execute(task, options);
  }

  async quickExecute(task: string, options?: any): Promise<string> {
    const coordinator = this.getActiveCoordinator();
    if (!coordinator) {
      throw new Error('No coordinator initialized');
    }
    return coordinator.quickExecute(task, options);
  }

  async toggle(): Promise<SharkMode> {
    if (!this.microCoordinator || !this.macroCoordinator) {
      throw new Error('Coordinators not initialized');
    }
    this.currentMode = this.currentMode === SharkMode.MICRO ? SharkMode.MACRO : SharkMode.MICRO;
    return this.currentMode;
  }

  getMode(): SharkMode {
    return this.currentMode;
  }

  getActiveCoordinator(): MicroCoordinator | MacroCoordinator | null {
    if (this.currentMode === SharkMode.MICRO) {
      return this.microCoordinator;
    }
    return this.macroCoordinator;
  }

  getConfigStatus(): any {
    const coordinator = this.getActiveCoordinator();
    if (!coordinator) {
      return { planning: false, execution: false, executionModel: 'None' };
    }
    return coordinator.getConfigStatus();
  }

  getWorkflow(): WorkflowMachine | null {
    const coordinator = this.getActiveCoordinator();
    return coordinator?.getWorkflow() || null;
  }
}

export default CoordinatorManager;
