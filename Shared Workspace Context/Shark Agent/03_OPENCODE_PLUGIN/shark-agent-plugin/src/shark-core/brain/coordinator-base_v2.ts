/**
 * 🦈 SHARK CLI - Base Coordinator
 * 
 * Abstract base class for coordination logic shared by both Micro and Macro coordinators.
 * 
 * Common functionality extracted from DualBrainCoordinator:
 * - Guardian protection for file operations
 * - Tool execution with permission checking
 * - DeepSeek R1 as planning brain (shared by both modes)
 * - Logging, tool processing, completion detection
 * 
 * This class ensures DRY (Don't Repeat Yourself) while maintaining
 * clear separation between Micro and Macro execution architectures.
 */

import { DeepSeekClient } from './deepseek.js';
import {
  BrainType,
  CoordinationResult,
  ConversationEntry,
  BrainExecutionOptions,
  ToolCall,
} from './types.js';
import { Guardian, createProductionGuardian } from '../guardian/index.js';
import { ToolExecutor, ToolResult } from '../tools/executor_v2.js';
import { WorkflowBlocker } from '../workflow/blocker.js';

/**
 * Base configuration for all coordinators
 */
export interface BaseCoordinatorConfig {
  /** Maximum iterations for coordination loop */
  maxIterations?: number;
  
  /** Auto-approve mode (skip user prompts) */
  autoApprove?: boolean;
  
  /** Verbose logging */
  verbose?: boolean;
  
  /** Workspace path for Guardian */
  workspacePath?: string;
  
  /** Skip all firewalls (YOLO mode) */
  skipFirewalls?: boolean;
}

/**
 * Abstract base coordinator class
 * 
 * Provides common functionality for both Micro and Macro coordinators:
 * - Guardian initialization and access
 * - ToolExecutor initialization
 * - DeepSeek planning brain
 * - Tool call processing
 * - Completion detection
 * - Logging
 */
export abstract class BaseCoordinator {
  protected planningBrain: DeepSeekClient;
  protected guardian: Guardian;
  protected toolExecutor: ToolExecutor;
  protected workflowBlocker: WorkflowBlocker | null;
  protected skipFirewalls: boolean;
  protected maxIterations: number;
  protected autoApprove: boolean;
  protected verbose: boolean;
  protected workspacePath: string;

  constructor(config: BaseCoordinatorConfig) {
    this.maxIterations = config.maxIterations || 10;
    this.autoApprove = config.autoApprove ?? false;
    this.verbose = config.verbose ?? false;
    this.workspacePath = config.workspacePath || process.cwd();
    this.skipFirewalls = config.skipFirewalls ?? 
                        process.env.SHARK_SKIP_FIREWALLS === 'true';

    // Initialize Guardian
    this.guardian = createProductionGuardian(this.workspacePath);
    this.log('🛡️  Guardian initialized for coordinator');

    // Initialize WorkflowBlocker (unless bypassed)
    if (!this.skipFirewalls) {
      this.workflowBlocker = new WorkflowBlocker(this.workspacePath);
      this.log('🧱 WorkflowBlocker initialized');
    } else {
      this.workflowBlocker = null;
      this.log('⚠️  Firewalls bypassed (YOLO mode)');
    }

    this.toolExecutor = new ToolExecutor({
      guardian: this.guardian,
      workflowBlocker: this.workflowBlocker,
      workspacePath: this.workspacePath,
      verbose: this.verbose,
      skipFirewalls: this.skipFirewalls,
      getWorkflowStep: () => this.getCurrentWorkflowStep(),
    });
    this.log('🔧 ToolExecutor initialized');

    // Initialize planning brain (shared by both Micro and Macro)
    this.planningBrain = new DeepSeekClient();
  }

  /**
   * Abstract execute method - must be implemented by derived classes
   */
  abstract execute(task: string, options?: BrainExecutionOptions): Promise<CoordinationResult>;

  /**
   * Get configuration status for display (abstract - must implement in derived classes)
   */
  abstract getConfigStatus(): { planning: boolean; execution: boolean; executionModel: string };

  /**
   * Get Guardian instance
   */
  getGuardian(): Guardian {
    return this.guardian;
  }

  getFirewallStats() {
    return this.toolExecutor.getAuditStats();
  }

  getStagnationStats() {
    return this.toolExecutor.getStagnationStats();
  }

  protected getCurrentWorkflowStep(): string {
    return 'UNKNOWN';
  }

  isConfigured(): boolean {
    return this.planningBrain.isConfigured();
  }

  /**
   * Process tool calls with Guardian protection
   */
  protected async processToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      this.log(`Executing tool: ${toolCall.name}`);
      
      const result = await this.toolExecutor.executeTool(toolCall);
      results.push(result);

      if (result.guardianBlocked) {
        this.log(`⚠️  Guardian blocked: ${toolCall.name} - ${result.guardianReason}`);
      } else if (result.success) {
        this.log(`✅ Tool executed: ${toolCall.name}`);
      } else {
        this.log(`❌ Tool failed: ${toolCall.name} - ${result.result}`);
      }
    }

    return results;
  }

  /**
   * Check if a result indicates completion
   */
  protected isComplete(content: string): boolean {
    const completionIndicators = [
      'task complete',
      'successfully implemented',
      'all changes applied',
      'implementation finished',
      'done',
      'complete',
    ];
    
    const lowerContent = content.toLowerCase();
    return completionIndicators.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Log message if verbose mode is enabled
   */
  protected log(message: string): void {
    if (this.verbose) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.log(`[${timestamp}] ${message}`);
    }
  }

  /**
   * Quick execution without planning (for simple tasks)
   * Must be implemented by derived classes
   */
  abstract quickExecute(task: string, options?: BrainExecutionOptions): Promise<string>;
}

export default BaseCoordinator;
