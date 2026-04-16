/**
 * 🦈 SHARK CLI - Macro Coordinator
 * 
 * Macro Engineer coordinator - Manages GLM primary execution with DeepSeek advisory brain.
 * 
 * ARCHITECTURE: GLM 4.5-flash (PRIMARY) + DeepSeek R1 (ADVISORY)
 * 
 * Key Features:
 * - Multi-iteration autonomous execution (up to 15 iterations)
 * - GLM 4.5-flash leads execution with built-in tools
 * - DeepSeek R1 provides strategic consultation between iterations
 * - Self-detects completion, auto-refines output
 * - Tool execution with Guardian protection
 * 
 * Use case: Multi-file architecture, DevOps, CI/CD, complex systems engineering
 */

import { GLMClient } from './glm';
import {
  BrainType,
  CoordinationResult,
  ConversationEntry,
  BrainExecutionOptions,
} from './types';
import { BaseCoordinator, BaseCoordinatorConfig } from './coordinator-base';

/**
 * Macro Coordinator configuration
 * 
 * Specific to Macro Engineer - no mode field (already known)
 */
export interface MacroCoordinatorConfig extends BaseCoordinatorConfig {
  // No additional fields - uses base config only
}

/**
 * Macro Coordinator - Manages GLM primary execution with DeepSeek advisory brain
 * 
 * Architecture: GLM 4.5-flash (PRIMARY) + DeepSeek R1 (ADVISORY)
 * 
 * This coordinator implements strategic consultation:
 * 1. DeepSeek R1 provides strategic consultation
 * 2. GLM 4.5-flash executes with consultation
 * 3. Process tool calls with Guardian protection
 * 4. Check for completion
 * 5. DeepSeek reviews progress for next iteration
 * 6. Iterative refinement until complete
 */
export class MacroCoordinator extends BaseCoordinator {
  protected executionBrain: GLMClient;

  constructor(config: MacroCoordinatorConfig) {
    super(config);

    // Initialize GLM execution brain
    this.executionBrain = new GLMClient();
    this.log('Macro Coordinator: Using GLM 4.5-flash as primary brain');
  }

  /**
   * Execute task using GLM primary + DeepSeek advisory architecture
   * 
   * Flow:
   * 1. DeepSeek R1 provides strategic consultation
   * 2. GLM 4.5-flash executes with consultation
   * 3. Process tool calls with Guardian protection
   * 4. Check for completion
   * 5. DeepSeek reviews progress for next iteration
   * 6. Iterate until complete or max iterations reached
   */
  async execute(task: string, options?: BrainExecutionOptions): Promise<CoordinationResult> {
    const startTime = Date.now();
    const history: ConversationEntry[] = [];
    let iterations = 0;
    let currentTask = task;
    const allOutputs: string[] = [];

    this.log('🦈 Starting Macro Engineer execution...');
    this.log('Architecture: GLM 4.5-flash (PRIMARY) + DeepSeek R1 (ADVISORY)');

    while (iterations < this.maxIterations) {
      iterations++;
      this.log(`Iteration ${iterations}/${this.maxIterations}`);

      // Step 1: Get strategic consultation from DeepSeek (if configured)
      if (this.planningBrain.isConfigured()) {
        this.log('DeepSeek providing strategic consultation...');
        const strategy = await this.planningBrain.generatePlan(currentTask, options?.context);
        
        history.push({
          brain: BrainType.PLANNING,
          content: strategy,
          phase: `strategy_round_${iterations}`,
          timestamp: new Date(),
        });

        // Enhance task with strategy
        currentTask = `Strategic Plan:\n${strategy}\n\nTask: ${currentTask}`;
      }

      // Step 2: Execute with GLM 4.5-flash (primary brain)
      this.log('GLM 4.5-flash executing...');
      const result = await this.executionBrain.execute(currentTask, options);
      
      history.push({
        brain: BrainType.EXECUTION,
        content: result.content,
        phase: `execution_round_${iterations}`,
        timestamp: new Date(),
      });

      allOutputs.push(result.content);

      // Process tool calls if any
      if (result.toolCalls && result.toolCalls.length > 0) {
        this.log(`Processing ${result.toolCalls.length} tool calls...`);
        const toolResults = await this.processToolCalls(result.toolCalls);
        
        history.push({
          brain: BrainType.EXECUTION,
          content: `Tool Results:\n${toolResults.map(r => `${r.name}: ${r.success ? 'OK' : 'FAILED'}`).join('\n')}`,
          phase: `tool_execution_round_${iterations}`,
          timestamp: new Date(),
        });

        // Feed tool results back to GLM if needed
        const failedTools = toolResults.filter(r => !r.success && r.guardianBlocked);
        if (failedTools.length > 0) {
          this.log('Some tools were blocked by Guardian, informing GLM...');
          currentTask = `Previous work:\n${result.content}\n\nGuardian blocked these operations:\n${failedTools.map(t => `- ${t.name}: ${t.guardianReason}`).join('\n')}\n\nPlease revise your approach to avoid protected paths.`;
          continue;
        }
      }

      // Step 3: Check for completion
      if (this.isComplete(result.content)) {
        this.log('Task appears complete');
        break;
      }

      // Step 4: Get review for next iteration
      if (this.planningBrain.isConfigured() && iterations < this.maxIterations) {
        this.log('DeepSeek reviewing progress...');
        const review = await this.planningBrain.reviewExecution(task, result.content);
        
        history.push({
          brain: BrainType.PLANNING,
          content: review,
          phase: `review_round_${iterations}`,
          timestamp: new Date(),
        });

        if (review.toLowerCase().includes('complete') || 
            review.toLowerCase().includes('success') ||
            review.toLowerCase().includes('finished')) {
          this.log('DeepSeek confirmed task complete');
          break;
        }

        // Update for next iteration
        currentTask = `Previous work:\n${result.content}\n\nRemaining work:\n${review}`;
      } else {
        break;
      }
    }

    const totalTime = Date.now() - (startTime || Date.now());
    this.log(`Macro execution complete: ${iterations} iteration(s), ${totalTime}ms`);

    return {
      finalOutput: allOutputs.join('\n\n---\n\n'),
      conversationHistory: history,
      iterations,
      mode: 'macro' as any,
      totalTokens: undefined,
      executionTimeMs: totalTime,
    };
  }

  /**
   * Quick execution without planning (for simple tasks)
   */
  async quickExecute(task: string, options?: BrainExecutionOptions): Promise<string> {
    const result = await this.executionBrain.execute(task, options);
    
    // Process any tool calls
    if (result.toolCalls && result.toolCalls.length > 0) {
      await this.processToolCalls(result.toolCalls);
    }
    
    return result.content;
  }

  /**
   * Get configuration status for display
   */
  getConfigStatus(): { planning: boolean; execution: boolean; executionModel: string } {
    return {
      planning: this.planningBrain.isConfigured(),
      execution: this.executionBrain.isConfigured(),
      executionModel: 'GLM 4.5-flash',
    };
  }
}

export default MacroCoordinator;
