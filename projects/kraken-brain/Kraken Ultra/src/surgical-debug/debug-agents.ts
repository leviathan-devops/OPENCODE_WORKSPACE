export type DebugAgentType = 'fresh-glm' | 'specialized-debugger' | 'deepseek-chat' | 'code-reviewer';

export interface DebugAgent {
  type: DebugAgentType;
  modelId: string;
  contextLimit: number;
  preloadedPatterns: string[];
  taskPrompt: string;
}

export interface DebugContext {
  originalAgentId: string;
  stagnationReason: string;
  lastError?: string;
  recentProgress: string[];
  codebaseContext?: string;
}

const AGENT_CONFIGS: Record<DebugAgentType, Omit<DebugAgent, 'taskPrompt'>> = {
  'fresh-glm': {
    type: 'fresh-glm',
    modelId: 'glm-5-flash',
    contextLimit: 32000,
    preloadedPatterns: [],
  },
  'specialized-debugger': {
    type: 'specialized-debugger',
    modelId: 'glm-5',
    contextLimit: 64000,
    preloadedPatterns: [
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'ENOENT',
      'EACCES',
      'npm ERR!',
      'docker',
      'timeout',
      'undefined is not',
      'Cannot read properties',
    ],
  },
  'deepseek-chat': {
    type: 'deepseek-chat',
    modelId: 'deepseek-chat',
    contextLimit: 64000,
    preloadedPatterns: [
      'logic error',
      'race condition',
      'memory leak',
      'infinite loop',
      'edge case',
    ],
  },
  'code-reviewer': {
    type: 'code-reviewer',
    modelId: 'glm-5',
    contextLimit: 32000,
    preloadedPatterns: [
      'code smell',
      'antipattern',
      'security issue',
      'performance',
      'maintainability',
    ],
  },
};

export class DebugAgentFactory {
  createFreshGLM(): DebugAgent {
    return {
      ...AGENT_CONFIGS['fresh-glm'],
      taskPrompt: this.getFreshGLMPrompt(),
    };
  }

  createSpecializedDebugger(errorPatterns: string[]): DebugAgent {
    const config = AGENT_CONFIGS['specialized-debugger'];
    return {
      ...config,
      preloadedPatterns: [...config.preloadedPatterns, ...errorPatterns],
      taskPrompt: this.getSpecializedDebuggerPrompt(errorPatterns),
    };
  }

  createDeepSeekAdvisor(): DebugAgent {
    return {
      ...AGENT_CONFIGS['deepseek-chat'],
      taskPrompt: this.getDeepSeekPrompt(),
    };
  }

  createCodeReviewer(): DebugAgent {
    return {
      ...AGENT_CONFIGS['code-reviewer'],
      taskPrompt: this.getCodeReviewerPrompt(),
    };
  }

  generateDebugPrompt(originalError: string, context: DebugContext): string {
    return `
## Debug Task

**Agent Stuck**: ${context.originalAgentId}
**Reason**: ${context.stagnationReason}
**Error**: ${context.lastError || originalError}

### Recent Progress
${context.recentProgress.map(p => `- ${p}`).join('\n')}

${context.codebaseContext ? `### Codebase Context\n\`\`\`\n${context.codebaseContext}\n\`\`\`` : ''}

### Your Task
1. Analyze the error and identify the root cause
2. Propose a specific fix with code changes
3. Verify the fix addresses the original issue
4. Report back with: FIX APPLIED or NEEDS ESCALATION

**Output Format**:
\`\`\`
ROOT_CAUSE: [description]
FIX: [specific code changes]
VERIFICATION: [how to verify]
STATUS: [FIX APPLIED | NEEDS ESCALATION]
\`\`\`
`.trim();
  }

  selectBestAgent(reason: string, errorPatterns: string[]): DebugAgentType {
    const reasonLower = reason.toLowerCase();

    if (reasonLower.includes('build') || reasonLower.includes('compile')) {
      return 'specialized-debugger';
    }

    if (reasonLower.includes('test') && errorPatterns.length >= 3) {
      return 'specialized-debugger';
    }

    if (reasonLower.includes('logic') || reasonLower.includes('race')) {
      return 'deepseek-chat';
    }

    if (reasonLower.includes('code') || reasonLower.includes('review')) {
      return 'code-reviewer';
    }

    return 'fresh-glm';
  }

  private getFreshGLMPrompt(): string {
    return `You are a fresh debugging agent with a clean context.
Analyze the provided error and code context to identify the root cause.
Propose a specific, testable fix.
Do not reference any previous conversations or context.`;
  }

  private getSpecializedDebuggerPrompt(patterns: string[]): string {
    return `You are a specialized debugging agent pre-loaded with error pattern knowledge.
Patterns you recognize: ${patterns.join(', ')}
Apply pattern matching to identify known error types.
Provide specific fixes based on pattern recognition.`;
  }

  private getDeepSeekPrompt(): string {
    return `You are a DeepSeek advisor providing alternative debugging perspective.
Focus on logic errors, race conditions, and architectural issues.
Provide a second opinion when primary debugging fails.`;
  }

  private getCodeReviewerPrompt(): string {
    return `You are a code review agent focused on code quality issues.
Look for code smells, antipatterns, and maintainability issues.
Suggest refactoring if code quality is the root cause.`;
  }
}
