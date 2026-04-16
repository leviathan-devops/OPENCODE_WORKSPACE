/**
 * Exercise 8: Integration Test
 * 
 * Purpose: Full workflow - all systems working together
 */

import { 
  setCurrentAgent, 
  getCurrentAgent,
  createChatMessageHook,
  createToolGuardianHook,
  createToolSummarizerHook,
  createEventHook,
  createSystemBrain
} from '../../dist/index.js';

export async function runTests() {
  const results = [];
  
  // 1. Initialize
  const eventHook = createEventHook();
  const chatHook = createChatMessageHook();
  const toolHook = createToolGuardianHook();
  const summarizerHook = createToolSummarizerHook();
  
  // Initialize brain
  const systemBrain = createSystemBrain();
  systemBrain.initialize();
  
  // Test 1: session.created initializes
  await eventHook({ event: { type: 'session.created' } }, {});
  results.push({ 
    name: 'integration-session-created', 
    pass: systemBrain.isInitialized() 
  });
  
  // 2. Agent identity set via chat.message
  await chatHook({ message: 'test', agent: 'kraken' }, {});
  results.push({
    name: 'integration-agent-set',
    pass: getCurrentAgent() === 'kraken',
    actual: getCurrentAgent()
  });
  
  // 3. Tool guardian works
  try {
    await toolHook({ tool: 'grep', args: {} }, { args: {} });
    results.push({ name: 'integration-tool-guardian', pass: true });
  } catch (e) {
    results.push({ name: 'integration-tool-guardian', pass: false, error: e.message });
  }
  
  // 4. Summarizer works
  const output = { output: Array(100).fill('line').join('\n') };
  await summarizerHook({ tool: 'Bash' }, { output });
  results.push({
    name: 'integration-output-summarized',
    pass: typeof output.output === 'string' && output.output.length < 500,
    newLength: output.output.length
  });
  
  // 5. Can record and retrieve decisions
  systemBrain.recordDecision({ description: 'Integration test decision', type: 'test', contextFiles: [] });
  const decisions = systemBrain.getRecentDecisionPoints();
  results.push({
    name: 'integration-decision-tracking',
    pass: decisions.length > 0,
    decisionCount: decisions.length
  });
  
  // 6. Cleanup works
  await eventHook({ event: { type: 'session.ended' } }, {});
  results.push({
    name: 'integration-cleanup',
    pass: getCurrentAgent() === undefined,
    actual: getCurrentAgent()
  });
  
  // 7. Identity wall after cleanup
  try {
    await toolHook({ tool: 'terminal', args: {} }, { args: {} });
    results.push({ name: 'integration-identity-wall-after-cleanup', pass: true });
  } catch (e) {
    results.push({ name: 'integration-identity-wall-after-cleanup', pass: false });
  }
  
  return results;
}
