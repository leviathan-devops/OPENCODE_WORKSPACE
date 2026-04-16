import { GateManager } from './src/shared/gates.js';
import { EvidenceCollector } from './src/shared/evidence.js';
import { createGateHook } from './src/hooks/v4.1/gate-hook.js';

async function runTest(name: string, currentGate: any, tool: string, args: any, result: any, expectedGate: any) {
  console.log(`\n--- Test: ${name} ---`);
  console.log(`Current Gate: ${currentGate}`);
  console.log(`Tool: ${tool}, Args: ${JSON.stringify(args)}`);

  const gm = new GateManager('.manta-test-e2e');
  const ec = new EvidenceCollector('.manta-test-e2e');
  
  gm.restore({
    currentGate: currentGate,
    gateStatus: {
      plan: 'pending',
      build: 'pending',
      test: 'pending',
      verify: 'pending',
      audit: 'pending',
      delivery: 'pending',
    },
    verifyAttempts: 0,
    currentIteration: 'V1.0',
    iterationAttempts: {},
  });

  const hook = createGateHook(gm, ec);
  await hook({ tool, args, sessionID: 'test-session', agent: 'manta' } as any, { output: result } as any);

  const actualGate = gm.getCurrentGate();
  console.log(`Expected Gate: ${expectedGate}`);
  console.log(`Actual Gate:   ${actualGate}`);

  if (actualGate === expectedGate) {
    console.log('✅ PASS');
    return true;
  } else {
    console.log('❌ FAIL');
    return false;
  }
}

async function runIterationTest(name: string, currentGate: any, tool: string, args: any, result: any, startAttempts: number, expectedAttempts: number, expectedIteration: string) {
  console.log(`\n--- Iteration Test: ${name} ---`);
  console.log(`Current Gate: ${currentGate}`);
  console.log(`Tool: ${tool}, Args: ${JSON.stringify(args)}`);

  const gm = new GateManager('.manta-test-iter');
  const ec = new EvidenceCollector('.manta-test-iter');
  
  gm.restore({
    currentGate: currentGate,
    gateStatus: {
      plan: 'pending',
      build: 'pending',
      test: 'pending',
      verify: 'pending',
      audit: 'pending',
      delivery: 'pending',
    },
    verifyAttempts: startAttempts,
    currentIteration: 'V1.0',
    iterationAttempts: {},
  });

  const hook = createGateHook(gm, ec);
  await hook({ tool, args, sessionID: 'test-session', agent: 'manta' } as any, { output: result } as any);

  const state = gm.getState() as { verifyAttempts: number; currentIteration: string };
  console.log(`Expected Attempts: ${expectedAttempts}, Actual: ${state.verifyAttempts}`);
  console.log(`Expected Iteration: ${expectedIteration}, Actual: ${state.currentIteration}`);

  if (state.verifyAttempts === expectedAttempts && state.currentIteration === expectedIteration) {
    console.log('✅ PASS');
    return true;
  } else {
    console.log('❌ FAIL');
    return false;
  }
}

async function main() {
  let allPassed = true;
  console.log('='.repeat(60));
  console.log('FULL GATE CHAIN TESTS');
  console.log('='.repeat(60));

  // PLAN → BUILD
  allPassed &= await runTest(
    'PLAN → BUILD (SPEC.md written)',
    'plan',
    'write_file',
    { path: 'SPEC.md', content: '# Spec\n- Feature 1' },
    { output: 'success' },
    'build'
  );

  // BUILD → TEST (implementation file)
  allPassed &= await runTest(
    'BUILD → TEST (index.html with code)',
    'build',
    'write_file',
    { path: 'index.html', content: '<!DOCTYPE html>\n<html>\nfunction test() {}' },
    { output: 'success' },
    'test'
  );

  // BUILD → TEST (config.json should NOT advance)
  allPassed &= await runTest(
    'BUILD → TEST blocked (config.json)',
    'build',
    'write_file',
    { path: 'config.json', content: '{}' },
    { output: 'success' },
    'build'
  );

  // TEST → VERIFY (curl URL fetch)
  allPassed &= await runTest(
    'TEST → VERIFY (curl URL)',
    'test',
    'terminal',
    { command: 'curl https://example.com' },
    { output: 'HTTP/2 200' },
    'verify'
  );

  // TEST → VERIFY (npm audit)
  allPassed &= await runTest(
    'TEST → VERIFY (npm audit)',
    'test',
    'terminal',
    { command: 'npm audit' },
    { output: 'found 0 vulnerabilities' },
    'verify'
  );

  // TEST → VERIFY (ls should NOT advance)
  allPassed &= await runTest(
    'TEST → VERIFY blocked (ls)',
    'test',
    'terminal',
    { command: 'ls -la' },
    { output: 'file1.txt\nfile2.txt' },
    'test'
  );

  // VERIFY → AUDIT (SPEC.md read)
  allPassed &= await runTest(
    'VERIFY → AUDIT (SPEC.md read)',
    'verify',
    'read',
    { path: 'SPEC.md' },
    { output: '# Spec\n- Feature 1' },
    'audit'
  );

  // VERIFY → AUDIT (npm audit command)
  allPassed &= await runTest(
    'VERIFY → AUDIT (npm audit command)',
    'verify',
    'terminal',
    { command: 'npm audit' },
    { output: 'running npm audit...' },
    'audit'
  );

  // AUDIT → DELIVERY (clean npm audit)
  allPassed &= await runTest(
    'AUDIT → DELIVERY (npm audit 0 vulnerabilities)',
    'audit',
    'terminal',
    { command: 'npm audit' },
    { output: 'found 0 vulnerabilities' },
    'delivery'
  );

  // AUDIT → DELIVERY (cat should NOT advance)
  allPassed &= await runTest(
    'AUDIT → DELIVERY blocked (cat README)',
    'audit',
    'terminal',
    { command: 'cat README.md' },
    { output: 'some readme content' },
    'audit'
  );

  console.log('\n' + '='.repeat(60));
  console.log('ITERATION LOOP TESTS');
  console.log('='.repeat(60));

  // Iteration test: verify failure increments attempts
  // Attempt 1: start at 0, expect 1
  allPassed &= await runIterationTest(
    'VERIFY failure (attempt 1, starting from 0)',
    'verify',
    'terminal',
    { command: 'npm run test' },
    { output: '{"error": "Command failed"}' },
    0, 1, 'V1.0'
  );

  // Attempt 2: start at 1, expect 2
  allPassed &= await runIterationTest(
    'VERIFY failure (attempt 2, starting from 1)',
    'verify',
    'terminal',
    { command: 'npm run test' },
    { output: '{"error": "Command failed"}' },
    1, 2, 'V1.0'
  );

  // Attempt 3: start at 2, expect escalation to V1.1 and reset to 0
  allPassed &= await runIterationTest(
    'VERIFY failure (attempt 3 - should escalate to V1.1)',
    'verify',
    'terminal',
    { command: 'npm run test' },
    { output: '{"error": "Command failed"}' },
    2, 0, 'V1.1'  // After escalation, attempts reset to 0 and iteration becomes V1.1
  );

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED');
  } else {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

main().catch(console.error);
