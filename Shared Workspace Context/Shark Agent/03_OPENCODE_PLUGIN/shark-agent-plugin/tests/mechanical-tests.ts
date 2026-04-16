import { enforceSharkArchitecture } from '../src/enforcement/enforcer';
import { WorkflowStep, workflowMachine } from '../src/workflow/machine';

async function runTests() {
  console.log('🚀 Starting Shark Agent v4.8 Mechanical Enforcement Integration Simulation...');
  console.log('================================================================================');

  const sessionID = 'final-boss-session';
  const baseParams = {
    sessionID,
    workflowStep: WorkflowStep.PLAN,
    agent: 'shark',
    args: {}
  };

  const testCases = [
    {
      name: 'Plan Wall: Write impl in PLAN phase',
      params: { ...baseParams, tool: 'write', args: { path: 'src/index.ts', content: 'console.log("hello");' } },
      expected: '❌ BLOCKED',
      setup: () => { workflowMachine.reset(sessionID); }
    },
    {
      name: 'Theatrical Wall: AbstractFactory in BUILD phase',
      params: { ...baseParams, tool: 'write', args: { path: 'src/factory.ts', content: 'class AbstractFactory {}' } },
      expected: '❌ BLOCKED',
      setup: () => { 
        workflowMachine.reset(sessionID);
        const state = workflowMachine.getState(sessionID);
        state.currentStep = WorkflowStep.BUILD;
        state.artifacts.plan = true;
      }
    },
    {
      name: 'Shell-Guard: sed -i in BUILD phase',
      params: { ...baseParams, tool: 'bash', args: { command: 'sed -i "s/a/b/g" src/index.ts' } },
      expected: '❌ BLOCKED',
      setup: () => { 
        workflowMachine.reset(sessionID);
        const state = workflowMachine.getState(sessionID);
        state.currentStep = WorkflowStep.BUILD;
        state.artifacts.plan = true;
      }
    },
    {
      name: 'Observability Wall: Silent Catch',
      params: { ...baseParams, tool: 'write', args: { path: 'src/utils.ts', content: 'try { doWork(); } catch (e) {}' } },
      expected: '❌ BLOCKED',
      setup: () => { 
        workflowMachine.reset(sessionID);
        const state = workflowMachine.getState(sessionID);
        state.currentStep = WorkflowStep.BUILD;
        state.artifacts.plan = true;
      }
    },
    {
      name: 'Identity Wall: Vanilla Build Agent',
      params: { ...baseParams, agent: 'build', tool: 'write', args: { path: 'src/index.ts', content: 'console.log("hello");' } },
      expected: '✅ ALLOWED',
      setup: () => { workflowMachine.reset(sessionID); }
    },
    {
      name: 'Ship Gate: Pass Rate < 96% (Final Boss)',
      params: { ...baseParams, tool: 'ship', args: {} },
      expected: '❌ BLOCKED',
      setup: () => { 
        workflowMachine.reset(sessionID);
        const state = workflowMachine.getState(sessionID);
        state.currentStep = WorkflowStep.SHIP;
        state.artifacts.testResults = { passRate: 0.90 }; // 90% < 96%
        state.artifacts.verificationReport = true;
      }
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    process.stdout.write(`Testing ${tc.name}... `);
    tc.setup();
    const result = await enforceSharkArchitecture(tc.params);
    const status = result.allowed ? '✅ ALLOWED' : '❌ BLOCKED';
    
    if (status === tc.expected) {
      console.log(`PASS`);
      passed++;
    } else {
      console.log(`FAIL (Expected ${tc.expected}, got ${status}) - ${result.reason}`);
    }
  }

  console.log('\n================================================================================');
  console.log(`FINAL RESULT: ${passed}/${testCases.length} tests passed (${((passed/testCases.length)*100).toFixed(1)}%)`);
  
  if (passed === testCases.length) {
    console.log('🏆 SHIP GATE PASSED: Mechanical Intelligence Verified.');
  } else {
    console.log('🚨 SHIP GATE FAILED: Mechanical gaps detected.');
  }
  process.exit(passed === testCases.length ? 0 : 1);
}

runTests().catch(console.error);



