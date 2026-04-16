/**
 * V4.1 Architecture Elicitation Wizard — Interactive CLI
 *
 * Agent-facing wizard that:
 * 1. Captures initial idea
 * 2. Asks clarifying questions in natural language
 * 3. Extracts architecture from answers
 * 4. Generates config and feeds it through the factory
 * 5. Returns ArchitectureInstance ready to use
 */

import * as readline from 'readline';
import type {
  ElicitationState,
  Question,
  WizardOptions,
  WizardResult,
  ExtractedArchitecture,
  ChatMessage,
  QuestionTemplate,
} from './types.js';
import {
  createInitialState,
  extractFromAnswer,
  generateNextQuestion,
  generateConfig,
  validateExtracted,
  QUESTION_BANK,
} from './engine.js';
import { createV4Instance } from '../index.js';
import type { ArchitectureConfig } from '../factory/types.js';

// ============================================================
// MAIN WIZARD
// ============================================================

export class ArchitectureWizard {
  private state: ElicitationState;
  private options: WizardOptions;
  private rl: readline.Interface | null = null;
  private configGenerated: boolean = false;

  constructor(options: WizardOptions) {
    this.options = options;
    this.state = options.savedState ?? createInitialState(options.idea, options.sessionId);
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Run the full wizard interactively (CLI mode)
   */
  async run(): Promise<WizardResult> {
    this.setupReadline();

    try {
      // Phase 1: Idea capture acknowledged
      await this.acknowledgeIdea();

      // Phase 2: Clarification loop
      await this.runClarificationLoop();

      // Phase 3: Generate and present config
      await this.generateAndPresentConfig();

      // Phase 4: Iteration loop (if user wants changes)
      await this.runIterationLoop();

      // Phase 5: Build the architecture
      return this.buildArchitecture();
    } finally {
      this.closeReadline();
    }
  }

  /**
   * Process a single user message (for non-CLI use)
   */
  processMessage(content: string): { state: ElicitationState; response: WizardResponse } {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    this.state.messages.push(message);
    this.state.lastActivityAt = Date.now();

    // If we have a pending question, answer it
    const pendingQuestion = this.state.pendingQuestions[0];
    if (pendingQuestion) {
      this.state.extracted = extractFromAnswer(this.state, pendingQuestion, content);
      message.answersQuestion = pendingQuestion.id;
      this.state.pendingQuestions = this.state.pendingQuestions.slice(1);
    }

    // Generate response
    const response = this.generateResponse();

    // Update phase
    this.updatePhase();

    return { state: this.state, response };
  }

  /**
   * Get current state (for inspection/resume)
   */
  getState(): ElicitationState {
    return this.state;
  }

  /**
   * Skip interactive mode and generate config directly from extracted data
   */
  generateConfigFromState(): WizardResult {
    const { warnings } = validateExtracted(this.state);
    const config = generateConfig(this.state);

    return {
      config,
      summary: this.state.extracted as ExtractedArchitecture,
      warnings,
      sessionId: this.state.sessionId,
    };
  }

  // ── Private Methods ────────────────────────────────────────

  private setupReadline(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private closeReadline(): void {
    this.rl?.close();
    this.rl = null;
  }

  private async askQuestion(question: Question): Promise<string> {
    return new Promise((resolve) => {
      if (!this.rl) {
        resolve('');
        return;
      }

      console.log('\n' + '─'.repeat(60));
      console.log(`\n${question.text}`);
      if (question.options) {
        for (const opt of question.options) {
          console.log(`  [${opt.value}] ${opt.label} — ${opt.description ?? ''}`);
        }
      }
      console.log();

      this.rl.question('> ', (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async acknowledgeIdea(): Promise<void> {
    console.log('\n' + '═'.repeat(60));
    console.log('  ARCHITECTURE ELICITATION WIZARD v4.1');
    console.log('═'.repeat(60));
    console.log('\nGot your idea:');
    console.log(`  "${this.state.originalIdea}"\n`);
    console.log('Let me ask a few questions to extract the right architecture...\n');
    await this.waitForEnter();
  }

  private async runClarificationLoop(): Promise<void> {
    let question = generateNextQuestion(this.state);

    while (question) {
      this.state.pendingQuestions.push(question);
      const answer = await this.askQuestion(question);

      // Record the exchange
      const message = {
        id: `msg_${Date.now()}`,
        role: 'user' as const,
        content: answer,
        timestamp: Date.now(),
        answersQuestion: question.id,
      };
      this.state.messages.push(message);

      // Extract and update
      this.state.extracted = extractFromAnswer(this.state, question, answer);
      this.state.pendingQuestions = this.state.pendingQuestions.filter((q) => q.id !== question!.id);
      this.state.lastActivityAt = Date.now();

      // Generate next question
      question = generateNextQuestion(this.state);

      // Callback
      this.options.onQuestion?.(question ?? { id: '', targets: [], text: 'Done', type: 'free_text', priority: 0 });
    }
  }

  private async generateAndPresentConfig(): Promise<void> {
    console.log('\n' + '═'.repeat(60));
    console.log('  GENERATED ARCHITECTURE CONFIG');
    console.log('═'.repeat(60));

    const { warnings } = validateExtracted(this.state);

    if (warnings.length > 0) {
      console.log('\nWarnings:');
      for (const w of warnings) {
        console.log(`  ⚠ ${w}`);
      }
    }

    const config = generateConfig(this.state);
    this.configGenerated = true;

    console.log('\n--- CONFIG PREVIEW ---');
    console.log(`Name: ${config.name}`);
    console.log(`Brain Type: ${config.brain.type}`);
    console.log(`Clusters: ${config.clusters.map((c) => c.id).join(', ')}`);
    console.log(`Agents: ${Object.keys(config.agents).join(', ')}`);
    console.log('------------------------\n');

    this.options.onConfigGenerated?.(config);

    await this.waitForEnter();
  }

  private async runIterationLoop(): Promise<void> {
    if (!this.rl) return;

    console.log('\nWould you like to:');
    console.log('  [b] Build this architecture (proceed)');
    console.log('  [c] Change something (specify what)');
    console.log('  [r] Start over with a new idea');

    const choice = await this.askSimpleQuestion('> ');

    if (choice.toLowerCase() === 'c') {
      console.log('\nWhat would you like to change?');
      const change = await this.askSimpleQuestion('> ');

      // Simple patch: reset to review phase with the change noted
      console.log(`\nNoted: "${change}"`);
      console.log('(In v4.2: natural language config patching)\n');

      this.state.phase = 'review';
      await this.waitForEnter();
    } else if (choice.toLowerCase() === 'r') {
      console.log('\nRestarting...');
      const newIdea = await this.askSimpleQuestion('Enter your new idea: ');
      this.state = createInitialState(newIdea);
      await this.runClarificationLoop();
      await this.generateAndPresentConfig();
    }
  }

  private async buildArchitecture(): Promise<WizardResult> {
    console.log('\n' + '═'.repeat(60));
    console.log('  BUILDING ARCHITECTURE INSTANCE');
    console.log('═'.repeat(60) + '\n');

    const { warnings } = validateExtracted(this.state);
    const config = generateConfig(this.state);

    // Feed through factory
    const instance = await createV4Instance({ customConfig: config });

    console.log(`✓ Architecture "${config.name}" created`);
    console.log(`  Type: ${instance.brains.type} brain`);
    console.log(`  Orchestrators: ${instance.brains.all.join(', ')}`);
    console.log(`  Agents: ${instance.agents.size}`);
    console.log(`  Clusters: ${instance.clusters.size}`);

    const result: WizardResult = {
      config,
      summary: this.state.extracted as ExtractedArchitecture,
      warnings,
      sessionId: this.state.sessionId,
    };

    this.options.onComplete?.(result);

    return result;
  }

  private generateResponse(): WizardResponse {
    const nextQuestion = this.state.pendingQuestions[0] ?? generateNextQuestion(this.state);

    if (nextQuestion) {
      return {
        type: 'question',
        question: nextQuestion,
        extracted: this.state.extracted,
        progress: this.getProgress(),
      };
    }

    if (!this.configGenerated) {
      this.configGenerated = true;
      return {
        type: 'config_ready',
        config: generateConfig(this.state),
        extracted: this.state.extracted,
        progress: this.getProgress(),
      };
    }

    return {
      type: 'complete',
      result: this.generateConfigFromState(),
      progress: this.getProgress(),
    };
  }

  private updatePhase(): void {
    if (this.state.pendingQuestions.length > 0) {
      this.state.phase = 'clarification';
    } else if (!this.configGenerated) {
      this.state.phase = 'synthesis';
    } else {
      this.state.phase = 'complete';
    }
  }

  private getProgress(): WizardProgress {
    const totalQuestions = 9; // QUESTION_BANK.length
    const answered = this.state.messages.filter((m) => m.answersQuestion).length;
    return {
      phase: this.state.phase,
      questionsAnswered: answered,
      totalQuestions,
      percentComplete: Math.round((answered / totalQuestions) * 100),
    };
  }

  private waitForEnter(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.rl) {
        resolve();
        return;
      }
      this.rl.question('\n[Press Enter to continue] ', () => resolve());
    });
  }

  private askSimpleQuestion(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      if (!this.rl) {
        resolve('');
        return;
      }
      this.rl.question(prompt, (answer) => resolve(answer.trim()));
    });
  }
}

// ============================================================
// RESPONSE TYPES
// ============================================================

export type WizardResponse =
  | { type: 'question'; question: Question; extracted: Partial<ExtractedArchitecture>; progress: WizardProgress }
  | { type: 'config_ready'; config: ReturnType<typeof generateConfig>; extracted: Partial<ExtractedArchitecture>; progress: WizardProgress }
  | { type: 'complete'; result: WizardResult; progress: WizardProgress };

export interface WizardProgress {
  phase: ElicitationState['phase'];
  questionsAnswered: number;
  totalQuestions: number;
  percentComplete: number;
}

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Run the wizard with just an idea string — returns result directly
 */
export async function elicitArchitecture(idea: string): Promise<WizardResult> {
  const wizard = new ArchitectureWizard({ idea });
  return wizard.run();
}

/**
 * Process-mode: extract architecture from a list of Q&A pairs
 * Useful when an agent has already collected the answers
 */
export function extractFromQandA(
  idea: string,
  qAndA: Array<{ questionId: string; answer: string }>,
): WizardResult {
  const state = createInitialState(idea);

  for (const { questionId, answer } of qAndA) {
    const template = QUESTION_BANK.find((q: QuestionTemplate) => q.id === questionId);
    if (template) {
      const question: Question = {
        id: template.id,
        text: template.text,
        type: template.type,
        targets: template.targets,
        options: template.options,
        priority: template.priority,
      };

      state.extracted = extractFromAnswer(state, question, answer);
      state.messages.push({
        id: `msg_${Date.now()}`,
        role: 'user',
        content: answer,
        timestamp: Date.now(),
        answersQuestion: questionId,
      });
    }
  }

  const { warnings } = validateExtracted(state);
  const config = generateConfig(state);

  return {
    config,
    summary: state.extracted as ExtractedArchitecture,
    warnings,
    sessionId: state.sessionId,
  };
}

/**
 * Generate a config directly from a structured spec
 * Bypasses the wizard — for when you already know what you want
 */
export function specToConfig(spec: Partial<ExtractedArchitecture>): ArchitectureConfig {
  const state = createInitialState(spec.description ?? 'custom');
  state.extracted = spec;
  return generateConfig(state);
}
