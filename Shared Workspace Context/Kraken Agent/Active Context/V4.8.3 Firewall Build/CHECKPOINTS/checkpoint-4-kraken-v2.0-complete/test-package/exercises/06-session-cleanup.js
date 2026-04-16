/**
 * Exercise 6: Session Cleanup Test
 * 
 * Purpose: Verify session.ended cleans up state
 */

import { createEventHook, setCurrentAgent, getCurrentAgent } from '../../dist/index.js';

export async function runTests() {
  const results = [];
  
  const eventHook = createEventHook();
  
  // Test 1: Initial state is undefined
  setCurrentAgent(undefined);
  results.push({
    name: 'initial-state-undefined',
    pass: getCurrentAgent() === undefined,
    actual: getCurrentAgent()
  });
  
  // Test 2: Set agent then fire session.ended
  setCurrentAgent('kraken');
  await eventHook(
    { event: { type: 'session.ended' } },
    {}
  );
  
  results.push({
    name: 'session-ended-clears-agent',
    pass: getCurrentAgent() === undefined,
    actual: getCurrentAgent(),
    expected: undefined
  });
  
  // Test 3: Other state is also cleaned
  setCurrentAgent('kraken-test');
  await eventHook(
    { event: { type: 'session.ended' } },
    {}
  );
  
  results.push({
    name: 'cleanup-works-with-any-agent',
    pass: getCurrentAgent() === undefined,
    actual: getCurrentAgent()
  });
  
  return results;
}
