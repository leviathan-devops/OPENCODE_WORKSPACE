/**
 * Exercise 1: Agent Identity Wall Test
 * 
 * Purpose: Verify setCurrentAgent/getCurrentAgent work correctly
 */

import { setCurrentAgent, getCurrentAgent } from '../../dist/index.js';

function isKrakenAgent(agent) {
  return agent === 'kraken' || (agent && agent.startsWith('kraken')) || false;
}

export async function runTests() {
  const results = [];
  
  // Test 1: Initial state is undefined
  setCurrentAgent(undefined);
  results.push({
    name: 'initial-state-undefined',
    pass: getCurrentAgent() === undefined,
    expected: undefined,
    actual: getCurrentAgent()
  });
  
  // Test 2: setCurrentAgent sets value
  setCurrentAgent('kraken');
  results.push({
    name: 'set-agent-kraken',
    pass: getCurrentAgent() === 'kraken',
    expected: 'kraken',
    actual: getCurrentAgent()
  });
  
  // Test 3: isKrakenAgent recognizes kraken
  results.push({
    name: 'is-kraken-agent-kraken',
    pass: isKrakenAgent('kraken') === true,
    expected: true,
    actual: isKrakenAgent('kraken')
  });
  
  // Test 4: isKrakenAgent recognizes kraken-micro
  results.push({
    name: 'is-kraken-agent-kraken-micro',
    pass: isKrakenAgent('kraken-micro') === true,
    expected: true,
    actual: isKrakenAgent('kraken-micro')
  });
  
  // Test 5: isKrakenAgent rejects shark
  results.push({
    name: 'is-kraken-agent-shark',
    pass: isKrakenAgent('shark') === false,
    expected: false,
    actual: isKrakenAgent('shark')
  });
  
  // Test 6: isKrakenAgent rejects manta
  results.push({
    name: 'is-kraken-agent-manta',
    pass: isKrakenAgent('manta') === false,
    expected: false,
    actual: isKrakenAgent('manta')
  });
  
  // Test 7: isKrakenAgent rejects undefined
  results.push({
    name: 'is-kraken-agent-undefined',
    pass: isKrakenAgent(undefined) === false,
    expected: false,
    actual: isKrakenAgent(undefined)
  });
  
  // Test 8: Cleanup resets
  setCurrentAgent(undefined);
  results.push({
    name: 'cleanup-resets',
    pass: getCurrentAgent() === undefined,
    expected: undefined,
    actual: getCurrentAgent()
  });
  
  return results;
}
