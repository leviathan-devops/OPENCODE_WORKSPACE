/**
 * Exercise 7: Gate Evaluation Test
 * 
 * Purpose: Verify gate criteria are evaluated correctly
 */

import { createGateHook, setCurrentAgent, createSystemBrain } from '../../dist/index.js';

export async function runTests() {
  const results = [];
  
  // Initialize brain
  const systemBrain = createSystemBrain();
  systemBrain.initialize();
  
  setCurrentAgent('kraken');
  
  const gateHook = createGateHook();
  
  // Test 1: Gate hook does not throw
  try {
    await gateHook(
      { tool: 'Bash', args: { command: 'echo test' } },
      { output: 'test output' }
    );
    results.push({ name: 'gate-hook-no-throw', pass: true });
  } catch (e) {
    results.push({ name: 'gate-hook-no-throw', pass: false, error: e.message });
  }
  
  // Test 2: Can get current gate
  const currentGate = systemBrain.getCurrentGate();
  results.push({
    name: 'has-current-gate',
    pass: currentGate !== undefined && currentGate !== null,
    gate: currentGate
  });
  
  // Test 3: Can evaluate gate entry criteria
  const gateResult = systemBrain.evaluateGateEntry(currentGate);
  results.push({
    name: 'gate-evaluation-returns-result',
    pass: gateResult !== undefined,
    gate: currentGate,
    hasAllPassed: 'allPassed' in gateResult
  });
  
  // Test 4: Gate result has expected structure
  if (gateResult) {
    results.push({
      name: 'gate-result-has-allpassed',
      pass: 'allPassed' in gateResult,
      hasAllPassed: 'allPassed' in gateResult
    });
  }
  
  setCurrentAgent(undefined);
  
  return results;
}
