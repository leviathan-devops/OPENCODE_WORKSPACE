import { workflowMachine, WorkflowStep } from './machine';
import * as fs from 'fs';
import * as path from 'path';

async function generateDebugLog(sessionID: string, gate: string, failureReason: string, evidence: any) {
  const logDir = path.join(process.cwd(), '.shark', 'debug', sessionID);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logPath = path.join(logDir, `${gate}-failure.log`);
  const logContent = `
TIMESTAMP: ${new Date().toISOString()}
GATE: ${gate}
STATUS: FAILED
REASON: ${failureReason}
EVIDENCE: ${JSON.stringify(evidence, null, 2)}
ACTION: Kicked back to ${gate === 'SHIP' ? 'PLAN' : gate}
  `;
  fs.writeFileSync(logPath, logContent);
  return logPath;
}

export async function checkWorkflowEnforcement(params: {
  tool: string;
  args: any;
  sessionID: string;
  workflowStep: WorkflowStep;
  agent: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  
  const state = workflowMachine.getState(params.sessionID);
  console.log(`[DEBUG] checkWorkflowEnforcement: session=${params.sessionID}, currentStep=${state.currentStep}, tool=${params.tool}`);
  const restrictedTools = getRestrictedToolsForStep(state.currentStep);
  
  // Check if tool is restricted in current step
  if (restrictedTools.includes(params.tool)) {
    return {
      allowed: false,
      reason: `🦈 WORKFLOW BLOCKED: Tool '${params.tool}' not allowed in ${state.currentStep.toUpperCase()} step. Current step: ${state.currentStep.toUpperCase()}`
    };
  }
  
  // Special validation for specific steps
  switch (state.currentStep) {
    case WorkflowStep.PLAN:
      return validatePlanStep(params);
    
    case WorkflowStep.BUILD:
      return validateBuildStep(params, state);
    
    case WorkflowStep.TEST:
      return validateTestStep(params);
    
    case WorkflowStep.VERIFY:
      return validateVerifyStep(params);
    
    case WorkflowStep.SHIP:
      return validateShipStep(params, state);
    
    default:
      return { allowed: true };
  }
}

function getRestrictedToolsForStep(step: WorkflowStep): string[] {
  switch (step) {
    case WorkflowStep.PLAN:
      return ['bash']; // No bash execution during planning
    
    case WorkflowStep.BUILD:
      return []; // All tools allowed in build
    
    case WorkflowStep.TEST:
      return ['write', 'edit']; // No code changes during testing
    
    case WorkflowStep.VERIFY:
      return ['write', 'edit', 'bash']; // Read-only during verification
    
    case WorkflowStep.SHIP:
      return ['write', 'edit', 'bash', 'test']; // Read-only during ship
    
    default:
      return [];
  }
}

function validatePlanStep(params: any): { allowed: boolean; reason?: string } {
  console.log(`[DEBUG] validatePlanStep: tool=${params.tool}, path=${params.args?.path || params.args?.filePath}`);
  if (params.tool === 'write' || params.tool === 'edit' || params.tool === 'write_file') {
    const filePath = (params.args.path as string) || (params.args.filePath as string) || '';
    const isImplFile = /\.(html|ts|js|py|css|jsx|tsx|go|rs|java|cpp|c)$/i.test(filePath);
    const isPlanDoc = /SPEC\.md|spec\.md|plan\.md|design\.md/i.test(filePath);

    console.log(`[DEBUG] isImplFile=${isImplFile}, isPlanDoc=${isPlanDoc}`);

    if (isImplFile && !isPlanDoc) {
      return {
        allowed: false,
        reason: `🦈 MECHANICAL BLOCK: Implementation file '${filePath}' cannot be written during PLAN step. You must first complete the architectural specification in SPEC.md.`
      };
    }
  }
  return { allowed: true };
}

function validateBuildStep(params: any, state: any): { allowed: boolean; reason?: string } {
  if (!state.artifacts.plan) {
    return {
      allowed: false,
      reason: '🦈 WORKFLOW BLOCKED: Cannot enter BUILD step without completing PLAN. Create .shark/plan.md first.'
    };
  }
  return { allowed: true };
}

function validateTestStep(params: any): { allowed: boolean; reason?: string } {
  return { allowed: true };
}

function validateVerifyStep(params: any): { allowed: boolean; reason?: string } {
  return { allowed: true };
}

async function validateShipStep(params: any, state: any): Promise<{ allowed: boolean; reason?: string }> {
  const passRate = state.artifacts.testResults?.passRate || 0;
  
  if (passRate < 0.96) {
    const logPath = await generateDebugLog(
      state.sessionID, 
      'SHIP', 
      `Pass rate ${ (passRate * 100).toFixed(1) }% is below required 96%`, 
      state.artifacts.testResults
    );
    
    // FINAL BOSS: Kick all the way back to PLAN
    state.currentStep = WorkflowStep.PLAN;
    state.completedSteps = [];
    state.artifacts = {
      plan: false,
      buildManifest: false,
      testResults: false,
      verificationReport: false
    };
    
    return {
      allowed: false,
      reason: `🦈 FINAL BOSS FAILURE: Pass rate ${ (passRate * 100).toFixed(1) }% < 96%. Build reset to PLAN gate. Debug log: ${logPath}`
    };
  }
  
  return { allowed: true };
}

// Overriding the original validateShipStep to be async
(global as any).validateShipStep = validateShipStep;

// Export workflow machine for external use
export { workflowMachine };

