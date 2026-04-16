export interface UltraAgentConfig {
  agentType: 'hephaestus' | 'oracle' | 'explore' | 'librarian' | 'momus';
  model: string;
  task: string;
  timeout?: number;
}

export interface UltraSessionResult {
  sessionId: string;
  status: 'completed' | 'failed' | 'timeout';
  output: string;
  duration: number;
}

export class UltraConnector {
  private activeSessions: Map<string, { 
    startTime: Date; 
    config: UltraAgentConfig;
  }> = new Map();
  private sessionCounter: number = 0;
  private available: boolean = true;

  async spawnDebugAgent(config: UltraAgentConfig): Promise<{ sessionId: string; status: string }> {
    const sessionId = this.generateSessionId();
    
    this.activeSessions.set(sessionId, {
      startTime: new Date(),
      config,
    });

    return {
      sessionId,
      status: 'spawned',
    };
  }

  getActiveDebugSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  async getSessionResult(sessionId: string): Promise<UltraSessionResult> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return {
        sessionId,
        status: 'failed',
        output: 'Session not found',
        duration: 0,
      };
    }

    const duration = Date.now() - session.startTime.getTime();

    return {
      sessionId,
      status: 'completed',
      output: `Debug session ${sessionId} completed for: ${session.config.task}`,
      duration,
    };
  }

  terminateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  isUltraAvailable(): boolean {
    return this.available;
  }

  setAvailability(available: boolean): void {
    this.available = available;
  }

  getSessionConfig(sessionId: string): UltraAgentConfig | null {
    const session = this.activeSessions.get(sessionId);
    return session ? session.config : null;
  }

  private generateSessionId(): string {
    this.sessionCounter++;
    return `ultra-debug-${Date.now()}-${this.sessionCounter}`;
  }

  createDebugConfig(
    task: string,
    errorContext: string,
    agentType: UltraAgentConfig['agentType'] = 'hephaestus'
  ): UltraAgentConfig {
    return {
      agentType,
      model: 'glm-5',
      task: `
## Debug Task

${task}

### Error Context
\`\`\`
${errorContext}
\`\`\`

### Instructions
1. Analyze the error
2. Identify root cause
3. Provide specific fix
4. Output in format:
   ROOT_CAUSE: [description]
   FIX: [code changes]
   STATUS: [FIX APPLIED | NEEDS ESCALATION]
      `.trim(),
      timeout: 300000,
    };
  }

  async batchSpawn(configs: UltraAgentConfig[]): Promise<{ sessionId: string; status: string }[]> {
    const results = [];
    
    for (const config of configs) {
      const result = await this.spawnDebugAgent(config);
      results.push(result);
    }

    return results;
  }

  cleanup(): void {
    this.activeSessions.clear();
  }
}
