# coordinator-micro.ts

Micro Engineer coordinator - Manages plan/build brain switching for precision coding tasks.

## Architecture

**DeepSeek R1 (THINKS) → Gemma 3 4B (DOES)**

## Key Features

- Automatic plan/build toggle
- DeepSeek R1 generates strategic plans
- Gemma 3 4B executes plans (FREE tier, 14k RPD)
- Optional DeepSeek review for code quality
- Refinement loop for iterative improvement

## Use Case

Linear tasks, single-file operations, syntax fixing, unit tests

## Source Code

```typescript
/**
 * 🦈 SHARK CLI - Micro Coordinator
 * 
 * Micro Engineer coordinator - Manages plan/build brain switching for precision coding tasks.
 * 
 * ARCHITECTURE: DeepSeek R1 (THINKS) → Gemma 3 4B (DOES)
 * 
 * Key Features:
 * - Automatic plan/build toggle
 * - DeepSeek R1 generates strategic plans
 * - Gemma 3 4B executes plans (FREE tier, 14k RPD)
 * - Optional DeepSeek review for code quality
 * - Refinement loop for iterative improvement
 * 
 * Use case: Linear tasks, single-file operations, syntax fixing, unit tests
 */

import { GemmaClient } from './gemma';
import {
  BrainType,
  CoordinationResult,
  ConversationEntry,
  BrainExecutionOptions,
} from './types';
import { BaseCoordinator, BaseCoordinatorConfig } from './coordinator-base';

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
  protected executionBrain: GemmaClient;
  protected gemmaRegion: 'us' | 'sea';
  protected useGemmaProxy: boolean;

  constructor(config: MicroCoordinatorConfig) {
    super(config);
    this.gemmaRegion = config.gemmaRegion || 'sea';
    this.useGemmaProxy = config.useGemmaProxy ?? false;

    // Initialize Gemma execution brain
    this.executionBrain = new GemmaClient({
      region: this.gemmaRegion,
      useProxy: this.useGemmaProxy,
    });
    this.log('Micro Coordinator: Using Gemma 3 4B as execution brain (14k RPD free tier)');
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
    this.log('Architecture: DeepSeek R1 (THINKS) → Gemma 3 4B (DOES)');

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

    // Step 2: Execute with Execution Brain (Gemma 3 4B)
    this.log('Step 2: Gemma 3 4B executing plan...');

    const executionPrompt = `Execute this plan precisely:

${plan}

Original Task: ${task}

Output clean, working code. Follow the plan step by step.`;

    const executionResult = await this.executionBrain.execute(executionPrompt, options);
    
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
      executionModel: 'Gemma 3 4B',
    };
  }
}

export default MicroCoordinator;
```
