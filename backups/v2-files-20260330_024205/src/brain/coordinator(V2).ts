/**
 * 🦈 SHARK CLI - Dual-Brain Coordinator (Wrapper for Backward Compatibility)
 * 
 * This file now serves as a backward-compatible wrapper for the new split coordinator architecture.
 * 
 * NEW ARCHITECTURE:
 * - `BaseCoordinator`: Abstract base class with common functionality
 * - `MicroCoordinator`: Manages plan/build auto-toggle (DeepSeek R1 → Gemma 3 4B)
 * - `MacroCoordinator`: Manages GLM primary + DeepSeek advisory (GLM 5-flash + DeepSeek R1)
 * 
 * BACKWARD COMPATIBILITY:
 * - `DualBrainCoordinator` class unchanged in external API
 * - Same constructor interface (`CoordinatorConfig`)
 * - Same public methods
 * - Internally delegates to appropriate coordinator
 * 
 * This allows existing code to continue working while new code can use specific coordinators.
 */

import { BrainMode } from './types';
import { BaseCoordinator } from './coordinator-base(V2)';
import { MicroCoordinator, MicroCoordinatorConfig } from './coordinator-micro(V2)';
import { MacroCoordinator, MacroCoordinatorConfig } from './coordinator-macro(V2)';

/**
 * Coordinator configuration (unchanged for backward compatibility)
 */
export interface CoordinatorConfig {
  /** Brain mode (micro or macro) */
  mode: BrainMode;
  
  /** Maximum iterations for coordination loop */
  maxIterations?: number;
  
  /** Auto-approve mode (skip user prompts) */
  autoApprove?: boolean;
  
  /** Verbose logging */
  verbose?: boolean;
  
  /** Gemma region (US or SEA only for free tier) */
  gemmaRegion?: 'us' | 'sea';
  
  /** Workspace path for Guardian */
  workspacePath?: string;
  
  /** Use Gemma proxy for EU region bypass */
  useGemmaProxy?: boolean;
}

/**
 * Dual-Brain Coordinator (Wrapper for Backward Compatibility)
 * 
 * This class delegates to the appropriate coordinator based on mode:
 * - `micro` → `MicroCoordinator` (plan/build auto-toggle)
 * - `macro` → `MacroCoordinator` (GLM primary + DeepSeek advisory)
 * 
 * External API unchanged - maintains 100% backward compatibility.
 */
export class DualBrainCoordinator {
  private _coordinator: BaseCoordinator;
  private mode: BrainMode;

  constructor(config: CoordinatorConfig) {
    this.mode = config.mode;

    // Create appropriate coordinator based on mode
    switch (config.mode) {
      case BrainMode.MICRO:
        const microConfig: MicroCoordinatorConfig = {
          maxIterations: config.maxIterations || 10,
          autoApprove: config.autoApprove ?? false,
          verbose: config.verbose ?? false,
          workspacePath: config.workspacePath || process.cwd(),
          gemmaRegion: config.gemmaRegion || 'sea',
          useGemmaProxy: config.useGemmaProxy,
        };
        this._coordinator = new MicroCoordinator(microConfig);
        break;

      case BrainMode.MACRO:
        const macroConfig: MacroCoordinatorConfig = {
          maxIterations: config.maxIterations || 15,
          autoApprove: config.autoApprove ?? false,
          verbose: config.verbose ?? false,
          workspacePath: config.workspacePath || process.cwd(),
        };
        this._coordinator = new MacroCoordinator(macroConfig);
        break;

      default:
        throw new Error(`Unknown brain mode: ${config.mode}`);
    }
  }

  /**
   * Get current brain mode
   */
  getMode(): BrainMode {
    return this.mode;
  }

  /**
   * Set brain mode (switches to appropriate coordinator)
   */
  setMode(mode: BrainMode): void {
    if (this.mode !== mode) {
      this.mode = mode;

      // Recreate coordinator with new mode
      const config: CoordinatorConfig = {
        mode,
        maxIterations: this._coordinator['maxIterations'],
        autoApprove: this._coordinator['autoApprove'],
        verbose: this._coordinator['verbose'],
        workspacePath: this._coordinator['workspacePath'],
      };

      switch (mode) {
        case BrainMode.MICRO:
          const microConfig: MicroCoordinatorConfig = {
            maxIterations: config.maxIterations || 10,
            autoApprove: config.autoApprove ?? false,
            verbose: config.verbose ?? false,
            workspacePath: config.workspacePath || process.cwd(),
            gemmaRegion: config.gemmaRegion || 'sea',
            useGemmaProxy: config.useGemmaProxy,
          };
          this._coordinator = new MicroCoordinator(microConfig);
          break;

        case BrainMode.MACRO:
          const macroConfig: MacroCoordinatorConfig = {
            maxIterations: config.maxIterations || 15,
            autoApprove: config.autoApprove ?? false,
            verbose: config.verbose ?? false,
            workspacePath: config.workspacePath || process.cwd(),
          };
          this._coordinator = new MacroCoordinator(macroConfig);
          break;

        default:
          throw new Error(`Unknown brain mode: ${mode}`);
      }
    }
  }

  /**
   * Check if required brains are configured
   */
  isConfigured(): boolean {
    return this._coordinator.isConfigured();
  }

  /**
   * Get configuration status for display
   */
  getConfigStatus(): { planning: boolean; execution: boolean; executionModel: string } {
    return this._coordinator.getConfigStatus();
  }

  /**
   * Get Guardian instance
   */
  getGuardian() {
    return this._coordinator.getGuardian();
  }

  getFirewallStats() {
    return this._coordinator.getFirewallStats();
  }

  getStagnationStats() {
    return this._coordinator.getStagnationStats();
  }

  async execute(task: string, options?: any): Promise<any> {
    return this._coordinator.execute(task, options);
  }

  /**
   * Quick execution without planning (for simple tasks)
   */
  async quickExecute(task: string, options?: any): Promise<string> {
    return this._coordinator.quickExecute(task, options);
  }
}

export default DualBrainCoordinator;
