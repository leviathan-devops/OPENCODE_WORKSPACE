import { GateManager } from './src/shared/gates.js';
import { EvidenceCollector } from './src/shared/evidence.js';
import { createGateHook } from './src/hooks/v4.1/gate-hook.js';

async function testIteration(name: string, startAttempts: number, expectedAttempts: number, expectedIteration: string) {
  const gm = new GateManager('.manta-debug-iter');
  const ec = new EvidenceCollector('.manta-debug-iter');
  gm.restore({ 
    currentGate: 'verify', 
    gateStatus: {plan:'pending',build:'pending',test:'pending',verify:'pending',audit:'pending',delivery:'pending'}, 
    verifyAttempts: startAttempts, 
    currentIteration: 'V1.0', 
    iterationAttempts: {} 
  });
  const hook = createGateHook(gm, ec);
  
  const result = { output: '{"error": "Command failed"}' };
  console.log('Input result:', JSON.stringify(result));
  console.log('result.output:', result.output);
  
  await hook({ tool: 'terminal', args: {command: 'npm test'}, sessionID: 'test', agent: 'manta' } as any, result as any);
  
  const state = gm.getState() as any;
  console.log('After hook - verifyAttempts:', state.verifyAttempts, 'currentIteration:', state.currentIteration);
  
  const passed = state.verifyAttempts === expectedAttempts && state.currentIteration === expectedIteration;
  console.log(name, '- Expected:', expectedAttempts, '/', expectedIteration, '- Got:', state.verifyAttempts, '/', state.currentIteration, '- PASS:', passed);
  return passed;
}

testIteration("Debug test", 0, 1, "V1.0");
