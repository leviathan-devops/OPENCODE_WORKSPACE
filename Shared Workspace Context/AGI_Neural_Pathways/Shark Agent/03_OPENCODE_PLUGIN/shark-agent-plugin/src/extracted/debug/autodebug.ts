export interface DetectedError {
  error: {
    autoFixable: boolean;
    message: string;
  };
  suggestion: string;
}

export class AutoDebugEngine {
  analyze(errorMessage: string): DetectedError[] {
    return [];
  }

  generateQuickFixReport(errors: DetectedError[]): string {
    return '';
  }

  getDebugInjector() {
    return {
      injectDebugger: async (id: string, data: any) => {
        return { success: false, debugAgentId: id, debugAgentType: 'none' };
      }
    };
  }
}
