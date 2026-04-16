/**
 * 🦈 SHARK CLI - Micro Coordinator
 *
 * Micro Engineer coordinator - Manages plan/build brain switching for precision coding tasks.
 *
 * ARCHITECTURE: DeepSeek R1 (THINKS) → Qwen 2.5 Coder 7B AWQ via vLLM (DOES)
 *                                          ↓ (fallback if vLLM unavailable)
 *                                     Gemma 3 4B (BACKUP)
 *
 * Key Features:
 * - Automatic plan/build toggle
 * - DeepSeek R1 generates strategic plans
 * - Qwen 2.5 Coder 7B AWQ executes plans (FREE, unlimited local vLLM)
 * - Gemma 3 4B fallback (14k RPD free tier)
 * - Optional DeepSeek review for code quality
 * - Refinement loop for iterative improvement
 *
 * Use case: Linear tasks, single-file operations, syntax fixing, unit tests
 */

import { GemmaClient } from './gemma';
import { VLLMClient } from './vllm';
import {
  BrainType,
  CoordinationResult,
  ConversationEntry,
  BrainExecutionOptions,
} from './types';
import { BaseCoordinator, BaseCoordinatorConfig } from './coordinator-base(V2)';

/**
 * Micro Coordinator configuration
 * 
 * Specific to Micro Engineer - no mode field (already known)
 */
export interface MicroCoordinatorConfig extends BaseCoordinatorConfig {
  /** Gemma region (US or SEA only for free tier) */
  gemmaRegion?: 'us' | 'sea';
  
  /** Use Gemma proxy for EU region bypass */
  useGemmaProxy?: boolean;
}

/**
 * Micro Coordinator - Manages plan/build brain switching for Micro Engineer
 * 
 * Architecture: DeepSeek R1 (THINKS) → Gemma 3 4B (DOES)
 * 
 * This coordinator implements a plan/build auto-toggle:
 * 1. DeepSeek R1 generates a strategic plan
 * 2. Gemma 3 4B executes the plan
 * 3. Optional DeepSeek review for code quality
 * 4. Refinement loop for iterative improvement
 */
export class MicroCoordinator extends BaseCoordinator {
  protected executionBrain: VLLMClient;
  protected fallbackBrain: GemmaClient;
  protected gemmaRegion: 'us' | 'sea';
  protected useGemmaProxy: boolean;

  constructor(config: MicroCoordinatorConfig) {
    super(config);
    this.gemmaRegion = config.gemmaRegion || 'sea';
    this.useGemmaProxy = config.useGemmaProxy ?? false;

    // Initialize vLLM execution brain (primary)
    this.executionBrain = new VLLMClient();
    
    // Initialize Gemma fallback brain
    this.fallbackBrain = new GemmaClient({
      region: this.gemmaRegion,
      useProxy: this.useGemmaProxy,
    });
    
    if (this.executionBrain.isConfigured()) {
      this.log('Micro Coordinator: Using Qwen 2.5 Coder via vLLM as primary execution brain (FREE, unlimited)');
    } else {
      this.log('Micro Coordinator: vLLM not available, using Gemma 3 4B as execution brain (14k RPD free tier)');
    }
  }

  /**
   * Execute task using plan/build architecture
   * 
   * Flow:
   * 1. DeepSeek R1 generates strategic plan
   * 2. Gemma 3 4B executes plan
   * 3. Process tool calls if any
   * 4. Optional DeepSeek review for quality
   * 5. Refinement if needed
   */
  async execute(task: string, options?: BrainExecutionOptions): Promise<CoordinationResult> {
    const startTime = Date.now();
    const history: ConversationEntry[] = [];
    let iterations = 0;

    this.log('🦈 Starting Micro Engineer execution...');
    this.log('Architecture: DeepSeek R1 (THINKS) → Qwen 2.5 Coder via vLLM (DOES) [fallback: Gemma 3 4B]');

    // Step 1: Get plan from Planning Brain (DeepSeek R1)
    let plan: string;
    if (this.planningBrain.isConfigured()) {
      this.log('Step 1: DeepSeek R1 generating plan...');
      plan = await this.planningBrain.generatePlan(task, options?.context);
      
      history.push({
        brain: BrainType.PLANNING,
        content: plan,
        phase: 'planning',
        timestamp: new Date(),
      });

      this.log(`Plan generated (${plan.length} chars)`);
    } else {
      plan = task;
      this.log('⚠️  Planning Brain not configured, using task directly as execution prompt');
      this.log('💡 Tip: Set DEEPSEEK_API_KEY to enable strategic planning');
    }

    // Step 2: Execute with Execution Brain (Qwen 2.5 Coder via vLLM, fallback to Gemma)
    let executionResult;
    
    if (this.executionBrain.isConfigured()) {
      this.log('Step 2: Qwen 2.5 Coder (vLLM) executing plan...');
    } else {
      this.log('Step 2: Gemma 3 4B executing plan (vLLM unavailable)...');
    }

    const executionPrompt = `Execute this plan precisely:

${plan}

Original Task: ${task}

Output clean, working code. Follow the plan step by step.`;

    try {
      // Try vLLM first
      executionResult = await this.executionBrain.execute(executionPrompt, options);
    } catch (error: any) {
      // Fallback to Gemma if vLLM fails
      this.log('⚠️  vLLM failed, falling back to Gemma 3 4B...');
      this.log(`Error: ${error.message}`);
      executionResult = await this.fallbackBrain.execute(executionPrompt, options);
    }
    
    history.push({
      brain: BrainType.EXECUTION,
      content: executionResult.content,
      phase: 'execution',
      timestamp: new Date(),
    });

    // Process tool calls if any
    if (executionResult.toolCalls && executionResult.toolCalls.length > 0) {
      this.log(`Processing ${executionResult.toolCalls.length} tool calls...`);
      const toolResults = await this.processToolCalls(executionResult.toolCalls);
      
      history.push({
        brain: BrainType.EXECUTION,
        content: `Tool Results:\n${toolResults.map(r => r.result).join('\n')}`,
        phase: 'tool_execution',
        timestamp: new Date(),
      });
    }

    iterations = 1;

    // Step 3: Optional review with Planning Brain
    if (this.planningBrain.isConfigured() && executionResult.hasCodeChanges && !this.autoApprove) {
      this.log('Step 3: DeepSeek reviewing execution...');
      const review = await this.planningBrain.reviewExecution(task, executionResult.content);
      
      history.push({
        brain: BrainType.PLANNING,
        content: review,
        phase: 'review',
        timestamp: new Date(),
      });

      // Check if refinement is needed
      const needsRefinement = 
        review.toLowerCase().includes('issue') || 
        review.toLowerCase().includes('improvement') ||
        review.toLowerCase().includes('error');

      if (needsRefinement && iterations < this.maxIterations) {
        this.log('Refining execution based on review...');
        iterations++;
        
        const refinedResult = await this.executionBrain.execute(
          `Fix the following issues:\n${review}\n\nPrevious execution:\n${executionResult.content}`,
          options
        );
        
        history.push({
          brain: BrainType.EXECUTION,
          content: refinedResult.content,
          phase: 'refinement',
          timestamp: new Date(),
        });
      }
    }

    const totalTime = Date.now() - (startTime || Date.now());
    this.log(`Micro execution complete: ${iterations} iteration(s), ${totalTime}ms`);

    return {
      finalOutput: executionResult.content,
      conversationHistory: history,
      iterations,
      mode: 'micro' as any,
      totalTokens: executionResult.tokensUsed?.totalTokens,
      executionTimeMs: totalTime,
    };
  }

  /**
   * Quick execution without planning (for simple tasks)
   */
  async quickExecute(task: string, options?: BrainExecutionOptions): Promise<string> {
    let result;
    if (this.executionBrain.isConfigured()) {
      // Try vLLM first
      result = await this.executionBrain.execute(task, options);
    } else {
      // Fallback to Gemma
      result = await this.fallbackBrain.execute(task, options);
    }
     
    // Process any tool calls
    if (result.toolCalls && result.toolCalls.length > 0) {
      this.log(`Processing ${result.toolCalls.length} tool calls...`);
      const toolResults = await this.processToolCalls(result.toolCalls);
      
      return result.content + '\n\nTool Results:\n' + toolResults.map(r => r.result).join('\n');
    }
    
    return result.content;
  }

  /**
   * Get configuration status for display
   */
  getConfigStatus(): { planning: boolean; execution: boolean; executionModel: string } {
    const vllmConfigured = this.executionBrain.isConfigured();
    const gemmaConfigured = this.fallbackBrain.isConfigured();
    
    return {
      planning: this.planningBrain.isConfigured(),
      execution: vllmConfigured || gemmaConfigured,
      executionModel: vllmConfigured ? 'Qwen 2.5 Coder (vLLM)' : 'Gemma 3 4B',
    };
  }
}

export default MicroCoordinator;
