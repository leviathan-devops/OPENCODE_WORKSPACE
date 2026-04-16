import { SharkMode } from '../types/coordinator-types';

export class SharkWizard {
  private launchedSessions: Set<string> = new Set();

  shouldLaunch(sessionID: string): boolean {
    return !this.launchedSessions.has(sessionID);
  }

  async launch(sessionID: string): Promise<SharkMode> {
    if (this.launchedSessions.has(sessionID)) {
      throw new Error('Wizard already launched for this session');
    }

    this.launchedSessions.add(sessionID);

    const mode = SharkMode.MICRO;
    return mode;
  }
}
