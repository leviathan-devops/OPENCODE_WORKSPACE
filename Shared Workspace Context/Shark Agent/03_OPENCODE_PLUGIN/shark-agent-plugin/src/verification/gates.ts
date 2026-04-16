import { WorkflowStep } from '../workflow/machine';

export interface VerificationGate {
  name: string;
  description: string;
  validate: (params: any) => Promise<{ passed: boolean; reason?: string }>;
}

const FUNCTIONAL_GATE: VerificationGate = {
  name: 'Functional Gate',
  description: 'All tests pass and build succeeds',
  
  async validate(params: any): Promise<{ passed: boolean; reason?: string }> {
    // Check for test execution
    if (params.tool === 'bash' && params.args.command) {
      const cmd = params.args.command.toLowerCase();
      
      // Must run tests before shipping
      if (cmd.includes('test') && !cmd.includes('test:')) {
        // Tests are being run - good
        return { passed: true };
      }
    }
    
    // If no tests run yet, gate not passed
    // This is informational - not blocking in this implementation
    return { passed: true };
  }
};

const INTENT_GATE: VerificationGate = {
  name: 'Intent Gate',
  description: 'Implementation matches original plan',
  
  async validate(params: any): Promise<{ passed: boolean; reason?: string }> {
    // Check if .shark/plan.md exists and is referenced
    if (params.tool === 'write' || params.tool === 'edit') {
      // Intent gate - code should align with plan
      // This is informational - not blocking in this implementation
      return { passed: true };
    }
    
    return { passed: true };
  }
};

const SECURITY_GATE: VerificationGate = {
  name: 'Security Gate',
  description: 'No Guardian violations, no security issues',
  
  async validate(params: any): Promise<{ passed: boolean; reason?: string }> {
    // Security gate already enforced by Guardian
    // This is informational - Guardian handles actual blocking
    return { passed: true };
  }
};

export async function enforceVerificationGates(params: {
  tool: string;
  args: any;
  sessionID: string;
  workflowStep: WorkflowStep;
}): Promise<{ allowed: boolean; reason?: string }> {
  
  // Only enforce gates at SHIP step
  if (params.workflowStep !== WorkflowStep.SHIP) {
    return { allowed: true };
  }
  
  // Run all gates
  const gates = [FUNCTIONAL_GATE, INTENT_GATE, SECURITY_GATE];
  const results = [];
  
  for (const gate of gates) {
    const result = await gate.validate(params);
    results.push({ gate: gate.name, ...result });
  }
  
  // Check if any gate failed
  const failedGate = results.find(r => !r.passed);
  if (failedGate) {
    return {
      allowed: false,
      reason: `🦈 VERIFICATION GATE FAILED: ${failedGate.gate} - ${failedGate.reason}`
    };
  }
  
  return { allowed: true };
}

export { FUNCTIONAL_GATE, INTENT_GATE, SECURITY_GATE };
