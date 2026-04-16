import { StagnationDetector, StagnationState } from './stagnation-detector';
import { DebugAgentFactory, DebugAgent, DebugContext, DebugAgentType } from './debug-agents';

export interface InjectionResult {
  success: boolean;
  debugAgentId: string;
  targetAgentId: string;
  fixApplied: boolean;
  fixDescription?: string;
  timestamp: Date;
  debugAgentType: DebugAgentType;
}

export interface CoordinationResult {
  fixed: boolean;
  solution: string;
  confidence: number;
  suggestedActions: string[];
}

export class DebugInjector {
  private detector: StagnationDetector;
  private factory: DebugAgentFactory;
  private activeInjections: Map<string, InjectionResult> = new Map();
  private debugSessionCounter: number = 0;

  constructor() {
    this.detector = new StagnationDetector();
    this.factory = new DebugAgentFactory();
  }

  async injectDebugger(
    agentId: string,
    context: Partial<DebugContext>
  ): Promise<InjectionResult> {
    const state = this.detector.checkStagnation(agentId);
    
    if (!state.stuck) {
      return {
        success: false,
        debugAgentId: '',
        targetAgentId: agentId,
        fixApplied: false,
        timestamp: new Date(),
        debugAgentType: 'fresh-glm',
      };
    }

    const debugAgentType = this.factory.selectBestAgent(
      state.reason,
      state.lastError ? [state.lastError] : []
    );

    const debugAgent = this.createDebugAgent(debugAgentType, state);
    const debugAgentId = this.generateDebugAgentId();

    const result: InjectionResult = {
      success: true,
      debugAgentId,
      targetAgentId: agentId,
      fixApplied: false,
      timestamp: new Date(),
      debugAgentType,
    };

    this.activeInjections.set(debugAgentId, result);

    const fullContext: DebugContext = {
      originalAgentId: agentId,
      stagnationReason: state.reason,
      lastError: state.lastError,
      recentProgress: this.detector.getAgentHistory(agentId)
        .slice(-5)
        .map(e => e.message),
      ...context,
    };

    const debugPrompt = this.factory.generateDebugPrompt(
      state.lastError || 'Unknown error',
      fullContext
    );

    result.fixDescription = debugPrompt;

    return result;
  }

  async coordinateFix(
    originalAgentId: string,
    debugOutput: string
  ): Promise<CoordinationResult> {
    const fixApplied = this.parseFixStatus(debugOutput);
    const solution = this.extractSolution(debugOutput);
    const confidence = this.calculateConfidence(debugOutput);
    const suggestedActions = this.extractActions(debugOutput);

    if (fixApplied) {
      this.detector.recordSuccess(originalAgentId, solution);
    }

    return {
      fixed: fixApplied,
      solution,
      confidence,
      suggestedActions,
    };
  }

  mergeResults(originalAgentId: string, debugResult: string): void {
    const solution = this.extractSolution(debugResult);
    this.detector.recordProgress(originalAgentId, `Debug merge: ${solution}`);
  }

  shouldExitDebug(agentId: string): boolean {
    const state = this.detector.checkStagnation(agentId);
    return !state.stuck || state.failureCount === 0;
  }

  getActiveInjections(): InjectionResult[] {
    return Array.from(this.activeInjections.values());
  }

  clearInjection(debugAgentId: string): void {
    this.activeInjections.delete(debugAgentId);
  }

  getDetector(): StagnationDetector {
    return this.detector;
  }

  private createDebugAgent(type: DebugAgentType, state: StagnationState): DebugAgent {
    const errorPatterns = state.lastError ? [state.lastError] : [];

    switch (type) {
      case 'fresh-glm':
        return this.factory.createFreshGLM();
      case 'specialized-debugger':
        return this.factory.createSpecializedDebugger(errorPatterns);
      case 'deepseek-chat':
        return this.factory.createDeepSeekAdvisor();
      case 'code-reviewer':
        return this.factory.createCodeReviewer();
      default:
        return this.factory.createFreshGLM();
    }
  }

  private generateDebugAgentId(): string {
    this.debugSessionCounter++;
    return `debug-session-${Date.now()}-${this.debugSessionCounter}`;
  }

  private parseFixStatus(output: string): boolean {
    const statusMatch = output.match(/STATUS:\s*(FIX APPLIED|FIXED|RESOLVED)/i);
    return statusMatch !== null;
  }

  private extractSolution(output: string): string {
    const fixMatch = output.match(/FIX:\s*([\s\S]*?)(?=VERIFICATION:|STATUS:|$)/i);
    return fixMatch ? fixMatch[1].trim() : 'No solution extracted';
  }

  private calculateConfidence(output: string): number {
    let confidence = 0.5;

    if (output.includes('ROOT_CAUSE:')) confidence += 0.2;
    if (output.includes('FIX:')) confidence += 0.2;
    if (output.includes('VERIFICATION:')) confidence += 0.1;
    if (/STATUS:\s*(FIX APPLIED|FIXED)/i.test(output)) confidence += 0.2;

    return Math.min(confidence, 1.0);
  }

  private extractActions(output: string): string[] {
    const actions: string[] = [];
    
    const suggestedMatch = output.match(/SUGGESTED[:\s]+([\s\S]*?)(?=STATUS:|$)/i);
    if (suggestedMatch) {
      actions.push(suggestedMatch[1].trim());
    }

    const actionLines = output.match(/[-*]\s+.+/g) || [];
    actions.push(...actionLines.map(l => l.replace(/^[-*]\s+/, '')));

    return actions;
  }
}
