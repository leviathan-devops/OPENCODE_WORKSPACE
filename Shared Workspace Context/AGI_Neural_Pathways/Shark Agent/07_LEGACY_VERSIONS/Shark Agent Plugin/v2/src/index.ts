import { tool, type Plugin, type PluginInput, type Hooks } from '@opencode-ai/plugin';
import { SharkMode, WorkflowStep, STEP_NAMES } from './types/coordinator-types';
import { CoordinatorManager } from './coordinator/coordinator-manager';
import { Guardian } from './guardian';
import { SafetyEnforcer } from './safety/safety-enforcer';
import { WorkflowMachine } from './workflow/machine';

const SHARK_SYSTEM_PROMPT = `You are operating as SHARK AGENT v2 - a mechanically enforced software build system.

## YOUR ARCHITECTURE

**Executive Brain (MiniMax M2.7)**: Handles all planning, reasoning, orchestration, and complex problem-solving.
**Mechanical Executor (GLM 5/4.7)**: Handles dumb-coding mechanical tasks - file I/O, running commands, test execution.

## THE 5-STEP WORKFLOW (BRICK WALL - CANNOT BYPASS)

STEP 1: PLAN (MiniMax M2.7)
  → Create .shark/plan.md with implementation plan
  → Create .shark/claims.json with extracted claims
  → Each claim MUST have a test file path

STEP 2: BUILD (GLM 5/4.7)
  → Write ACTUAL code (not descriptions)
  → Create .shark/build-manifest.json
  → GLM executor handles mechanical code writing

STEP 3: TEST (MiniMax M2.7)
  Stage 1: Run tests, capture exit code, verify results exist
  Stage 2: Local verification, capture exit code, verify results

STEP 4: VERIFY (MiniMax M2.7)
  Gate 1: FUNCTIONAL - Tests pass?
  Gate 2: INTENT - Code matches plan?
  Gate 3: SECURITY - Guardian scan passed?

STEP 5: SHIP (GLM 5/4.7)
  → Generate .shark/SHIP_REPORT.md
  → Only after ALL previous steps complete

## GUARDIAN PROTECTION RULES

Zone Classification:
- WORKSPACE: Project directory → ALLOWED
- SANDBOX: Isolated test → ALLOWED
- DEVELOPMENT: ~/projects, ~/code → ALLOWED (with caution)
- SYSTEM: /etc, /usr, /bin → NEVER
- PERSONAL: ~/.ssh, ~/.aws → NEVER

## EXECUTION RULES

1. Execute, don't simulate
2. Verify, don't assume
3. Show exit codes for EVERY command
4. Document every step
5. Claims require evidence
6. No theatrical code (mock, stub, fake tests)
7. No hardcoded secrets

## MODE SWITCHING

**PLAN MODE**: Use MiniMax M2.7 for reasoning, planning, strategy
**BUILD MODE**: Use GLM 5 for mechanical coding tasks
**AUTO MODE**: System auto-switches based on workflow step

When in SHARK mode, you MUST follow the 5-step workflow.`;

class SharkAgentV2 {
  private static instance: SharkAgentV2;
  private coordinator: CoordinatorManager | null = null;
  private guardian: Guardian | null = null;
  private safety: SafetyEnforcer | null = null;
  private workflow: WorkflowMachine | null = null;
  private isActive: boolean = false;
  private workspacePath: string = '';
  private sessionID: string = '';

  private constructor() {}

  static getInstance(): SharkAgentV2 {
    if (!SharkAgentV2.instance) {
      SharkAgentV2.instance = new SharkAgentV2();
    }
    return SharkAgentV2.instance;
  }

  initialize(input: PluginInput): void {
    this.workspacePath = input.directory;
    this.guardian = new Guardian(input.directory);
    this.safety = new SafetyEnforcer(this.guardian);
    this.workflow = new WorkflowMachine(input.directory);
    this.coordinator = new CoordinatorManager({
      workspacePath: input.directory,
      options: {
        autoApprove: false,
        verbose: true,
        skipFirewalls: false,
        maxIterations: 10,
      },
    });
    console.log('[SHARK v2] Initialized at:', input.directory);
  }

  activate(): string {
    if (!this.workflow || !this.coordinator) {
      throw new Error('Shark not initialized');
    }
    this.isActive = true;
    this.workflow.reset();
    console.log('[SHARK v2] ACTIVATED - Micro Engineer Mode');
    return `🦈 SHARK MODE ACTIVATED
Executive Brain: MiniMax M2.7
Mechanical Executor: GLM 5/4.7
Workflow: 5-Step PLAN→BUILD→TEST→VERIFY→SHIP`;
  }

  deactivate(): string {
    this.isActive = false;
    console.log('[SHARK v2] DEACTIVATED');
    return '🦈 SHARK MODE DEACTIVATED - Standard Mode';
  }

  getStatus(): string {
    if (!this.workflow) {
      return '🦈 SHARK NOT INITIALIZED';
    }

    const progress = this.workflow.getProgress();
    const state = this.workflow.getState();
    const blockers = state.blockers.length > 0 ? `\nBlockers: ${state.blockers.join(', ')}` : '';
    const currentModel = this.getModelForCurrentStep();

    return `🦈 SHARK STATUS
Mode: ${this.isActive ? 'ACTIVE (Micro Engineer)' : 'INACTIVE'}
Step: ${progress.current}
Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)
${blockers}
Executive: MiniMax M2.7
Executor: GLM 5/4.7
Current Model: ${currentModel}`;
  }

  getModelForCurrentStep(): string {
    if (!this.workflow) return 'unknown';
    const step = this.workflow.getCurrentStep();
    return this.getModelForStep(step);
  }

  getModelForStep(step: WorkflowStep): string {
    if (step === WorkflowStep.PLAN || step === WorkflowStep.VERIFY || step === WorkflowStep.TEST) {
      return '0-minimax/MiniMax-M2.7';
    }
    return '0-glm-coding/glm-5';
  }

  advanceStep(): string {
    if (!this.workflow) {
      return 'Error: Shark not initialized';
    }
    const next = this.workflow.nextStep();
    if (next === null) {
      return '🦈 WORKFLOW COMPLETE - All steps finished';
    }
    return `🦈 Advanced to: ${STEP_NAMES[next]}`;
  }

  resetWorkflow(): string {
    if (!this.workflow) {
      return 'Error: Shark not initialized';
    }
    this.workflow.reset();
    return '🦈 Workflow reset to PLAN';
  }

  checkTool(toolName: string, args: any): { allowed: boolean; reason?: string } {
    if (!this.isActive || !this.safety) {
      return { allowed: true };
    }
    const result = this.safety.checkTool(toolName, args);
    return { allowed: !result.blocked, reason: result.reason };
  }

  checkWorkflowRestriction(toolName: string): { allowed: boolean; reason?: string } {
    if (!this.isActive || !this.workflow) {
      return { allowed: true };
    }
    return this.workflow.checkStepRestriction(toolName, this.workflow.getCurrentStep());
  }

  setSessionID(sessionID: string): void {
    this.sessionID = sessionID;
  }

  isSharkActive(): boolean {
    return this.isActive;
  }

  getCurrentStep(): WorkflowStep {
    return this.workflow?.getCurrentStep() ?? WorkflowStep.PLAN;
  }

  setArtifact(name: string, data: any): void {
    this.workflow?.setArtifact(name, data);
  }

  recordCommand(command: string, exitCode: number): void {
    this.workflow?.recordCommandExecution(command, exitCode);
  }

  getWorkflow(): WorkflowMachine | null {
    return this.workflow;
  }
}

const shark = SharkAgentV2.getInstance();

const AUTOACTIVATE_PATTERNS = [
  /build\s+(a?|the|this|some)/i,
  /create\s+(a?|the|this|some)/i,
  /implement\s+(a?|the|this|some)/i,
  /make\s+(a?|the|this|some)/i,
  /develop\s+(a?|the|this|some)/i,
  /write\s+(a?|the|this|some)/i,
  /code\s+(a?|the|this|some)/i,
  /ship\s+(a?|the|this|some)/i,
  /shark/i,
];

const AUTOACTIVATED_MESSAGES = [
  "Activating SHARK MODE for this build task. Following 5-step workflow: PLAN → BUILD → TEST → VERIFY → SHIP",
  "🦈 SHARK MODE ACTIVATED - Mechanical enforcement engaged. Follow the workflow.",
  "🦈 Build detected. Activating Shark Agent with full enforcement.",
];

function shouldAutoActivate(message: string): boolean {
  return AUTOACTIVATE_PATTERNS.some(pattern => pattern.test(message));
}

export const createPlugin = (input: PluginInput): Plugin => {
  shark.initialize(input);

  return {
    name: 'shark-agent-v2',
    version: '2.0.0',

    async 'chat.start'(event: any) {
      shark.setSessionID(event.sessionID);
      console.log('[SHARK v2] Session started:', event.sessionID);
    },

    async 'chat.message'(eventInput: any, eventOutput: any): Promise<void> {
      const message = eventInput?.message || eventInput?.text || '';
      
      if (!shark.isSharkActive() && shouldAutoActivate(message)) {
        console.log('[SHARK v2] Auto-activating on message:', message.substring(0, 50));
        shark.activate();
        
        const response = AUTOACTIVATED_MESSAGES[Math.floor(Math.random() * AUTOACTIVATED_MESSAGES.length)];
        if (eventOutput?.suggestions) {
          eventOutput.suggestions.push(response);
        }
      }
    },

    async 'chat.params'(input: any, output: any) {
      if (!shark.isSharkActive()) {
        return output;
      }

      output.systemPrompt = output.systemPrompt || '';
      output.systemPrompt += `\n\n${SHARK_SYSTEM_PROMPT}`;

      const step = shark.getCurrentStep();
      output.systemPrompt += `\n\nCurrent Workflow Step: ${STEP_NAMES[step]}`;
      output.systemPrompt += `\nRequired artifacts: ${shark.getWorkflow()?.getRequiredArtifacts(step).join(', ') || 'none'}`;

      const model = shark.getModelForCurrentStep();
      output.model = model;
      console.log('[SHARK v2] Model:', model, 'Step:', STEP_NAMES[step]);

      return output;
    },

    async 'chat.params'(input: any, output: any) {
      if (!shark.isSharkActive()) {
        return output;
      }

      output.systemPrompt = output.systemPrompt || '';
      output.systemPrompt += `\n\n${SHARK_SYSTEM_PROMPT}`;

      const step = shark.getCurrentStep();
      output.systemPrompt += `\n\nCurrent Workflow Step: ${STEP_NAMES[step]}`;
      output.systemPrompt += `\nRequired artifacts: ${shark.getWorkflow()?.getRequiredArtifacts(step).join(', ') || 'none'}`;

      const model = shark.getModelForCurrentStep();
      output.model = model;
      console.log('[SHARK v2] Model:', model, 'Step:', STEP_NAMES[step]);

      return output;
    },

    async 'tool.execute.before'(input: any, output: any) {
      if (!shark.isSharkActive()) {
        return;
      }

      const toolName = input.tool || 'unknown';
      console.log('[SHARK v2] Tool check:', toolName);

      const safetyCheck = shark.checkTool(toolName, input.args);
      if (!safetyCheck.allowed) {
        throw new Error(`[SHARK GUARDIAN] ${safetyCheck.reason}`);
      }

      const workflowCheck = shark.checkWorkflowRestriction(toolName);
      if (!workflowCheck.allowed) {
        throw new Error(`[SHARK WORKFLOW] ${workflowCheck.reason}`);
      }
    },

    async 'tool.execute.after'(input: any, output: any, result: any) {
      if (!shark.isSharkActive()) {
        return;
      }

      const toolName = input.tool || 'unknown';

      if (toolName === 'run_command' || toolName === 'bash') {
        const command = input.args?.command || '';
        const exitCode = result?.exitCode ?? (result?.error ? 1 : 0);
        shark.recordCommand(command, exitCode);
      }
    },

    tools: {
      shark_toggle: tool({
        description: 'Toggle Shark Mode on/off or check status',
        args: {
          action: 'string as "on" | "off" | "status"',
        },
        execute: async (args: any) => {
          const action = args?.action || 'status';
          if (action === 'on') {
            return shark.activate();
          } else if (action === 'off') {
            return shark.deactivate();
          }
          return shark.getStatus();
        },
      }),

      shark_status: tool({
        description: 'Get current Shark workflow status',
        args: {},
        execute: async () => {
          return shark.getStatus();
        },
      }),

      shark_step: tool({
        description: 'Advance or query workflow step',
        args: {
          action: 'string as "advance" | "reset"',
        },
        execute: async (args: any) => {
          const action = args?.action || 'status';
          if (action === 'advance') {
            return shark.advanceStep();
          } else if (action === 'reset') {
            return shark.resetWorkflow();
          }
          return shark.getStatus();
        },
      }),

      shark_plan: tool({
        description: 'Create Shark plan artifact (.shark/plan.md and .shark/claims.json)',
        args: {
          plan: 'string - implementation plan content',
          claims: 'array - list of claims with test file paths',
        },
        execute: async (args: any) => {
          if (!shark.isSharkActive()) {
            return 'Shark mode not active';
          }
          shark.setArtifact('plan', { path: '.shark/plan.md', content: args.plan });
          shark.setArtifact('claims', { path: '.shark/claims.json', claims: args.claims });
          return '🦈 Plan and claims recorded';
        },
      }),

      shark_build: tool({
        description: 'Record build manifest (.shark/build-manifest.json)',
        args: {
          files: 'array - list of created files',
          completed: 'boolean - whether build is complete',
        },
        execute: async (args: any) => {
          if (!shark.isSharkActive()) {
            return 'Shark mode not active';
          }
          shark.setArtifact('buildManifest', {
            path: '.shark/build-manifest.json',
            files: args.files || [],
            completed: args.completed || false,
          });
          return '🦈 Build manifest recorded';
        },
      }),

      shark_test: tool({
        description: 'Record test results',
        args: {
          stage: 'number - 1 or 2',
          results: 'object - test results with success boolean',
        },
        execute: async (args: any) => {
          if (!shark.isSharkActive()) {
            return 'Shark mode not active';
          }
          const stageKey = args.stage === 1 ? 'stage1' : 'stage2';
          shark.setArtifact('testResults', { [stageKey]: args.results });
          return `🦈 Test results (Stage ${args.stage}) recorded`;
        },
      }),

      shark_verify: tool({
        description: 'Record verification gates',
        args: {
          functional: 'boolean',
          intent: 'boolean',
          security: 'boolean',
        },
        execute: async (args: any) => {
          if (!shark.isSharkActive()) {
            return 'Shark mode not active';
          }
          shark.setArtifact('verifyGates', {
            functional: args.functional,
            intent: args.intent,
            security: args.security,
          });
          return '🦈 Verification gates recorded';
        },
      }),

      shark_ship: tool({
        description: 'Record ship report',
        args: {
          report: 'string - ship report content',
        },
        execute: async (args: any) => {
          if (!shark.isSharkActive()) {
            return 'Shark mode not active';
          }
          shark.setArtifact('shipReport', { path: '.shark/SHIP_REPORT.md', content: args.report });
          return '🦈 Ship report recorded';
        },
      }),
    },
  };
};

export default createPlugin;
