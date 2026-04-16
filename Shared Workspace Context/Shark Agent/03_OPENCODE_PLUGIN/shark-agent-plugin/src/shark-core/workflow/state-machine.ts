import * as fs from 'fs';
import * as path from 'path';
import { WorkflowStep } from './types.js';

export class WorkflowMachine {
  private statePath: string;
  private state: any;

  constructor(workspacePath: string) {
    this.statePath = path.join(workspacePath, '.shark', 'workflow.json');
    this.state = this.loadState();
  }

  private loadState(): any {
    try {
      if (fs.existsSync(this.statePath)) {
        const data = fs.readFileSync(this.statePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch {}
    
    return {
      currentStep: WorkflowStep.PLAN,
      blocked: false,
      verification: {
        functional: { status: 'pending' },
        intent: { status: 'pending' },
        security: { status: 'pending' },
        allPassed: false
      }
    };
  }

  getState(): any {
    return this.state;
  }
}
