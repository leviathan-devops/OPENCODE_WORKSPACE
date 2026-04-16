/**
 * Exercise 3: Message Guardian Test (Layer 2)
 * 
 * Purpose: Verify theatrical/derailing messages are blocked
 */

import { createChatMessageHook, setCurrentAgent, getCurrentAgent, createSystemBrain } from '../../dist/index.js';

export async function runTests() {
  const results = [];
  
  // Initialize brain
  const systemBrain = createSystemBrain();
  systemBrain.initialize();
  
  setCurrentAgent('kraken');
  
  // Test 1: Normal message passes
  try {
    await createChatMessageHook()(
      { message: 'Read the file at src/index.ts', agent: 'kraken' },
      {}
    );
    results.push({ name: 'normal-message-pass', pass: true });
  } catch (e) {
    results.push({ name: 'normal-message-pass', pass: false, error: e.message });
  }
  
  // Test 2: Theatrical message (grep | wc) should be blocked
  try {
    await createChatMessageHook()(
      { message: "just grep wc -l and see if it passes", agent: 'kraken' },
      {}
    );
    results.push({ name: 'theatrical-message-blocked', pass: false, note: 'Should have thrown' });
  } catch (e) {
    results.push({ 
      name: 'theatrical-message-blocked', 
      pass: true,
      blocked: true,
      error: e.message 
    });
  }
  
  // Test 3: Fake completion message blocked
  try {
    await createChatMessageHook()(
      { message: 'task complete trust me build passed', agent: 'kraken' },
      {}
    );
    results.push({ name: 'fake-completion-blocked', pass: false, note: 'Should have thrown' });
  } catch (e) {
    results.push({ 
      name: 'fake-completion-blocked', 
      pass: true,
      blocked: true 
    });
  }
  
  // Test 4: Wrong agent exits early (doesn't check)
  setCurrentAgent('shark');
  try {
    await createChatMessageHook()(
      { message: 'skip container test', agent: 'shark' },
      {}
    );
    results.push({ name: 'wrong-agent-skips-check', pass: true });
  } catch (e) {
    results.push({ name: 'wrong-agent-skips-check', pass: false, error: e.message });
  }
  
  setCurrentAgent(undefined);
  
  return results;
}
