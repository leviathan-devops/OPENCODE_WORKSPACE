/**
 * Exercise 4: Tool Summarizer Test (Token Reduction)
 * 
 * Purpose: Verify large outputs are truncated to reduce tokens
 */

import { createToolSummarizerHook, setCurrentAgent, createSystemBrain } from '../../dist/index.js';

export async function runTests() {
  const results = [];
  
  // Initialize brain
  const systemBrain = createSystemBrain();
  systemBrain.initialize();
  
  setCurrentAgent('kraken');
  
  const summarizer = createToolSummarizerHook();
  
  // Test 1: Large grep output (500 lines) should be truncated
  const largeGrepOutput = Array(500).fill('src/file.ts:100:const foo = 1;').join('\n');
  const output1 = { output: largeGrepOutput };
  await summarizer(
    { tool: 'Bash' },
    { output: output1 }
  );
  
  const output1Str = typeof output1.output === 'string' ? output1.output : JSON.stringify(output1.output);
  results.push({
    name: 'large-grep-truncated',
    pass: output1Str.length < largeGrepOutput.length,
    originalLength: largeGrepOutput.length,
    newLength: output1Str.length,
    ratio: (output1Str.length / largeGrepOutput.length).toFixed(3)
  });
  
  // Test 2: Small grep output (5 lines) should be unchanged
  const smallGrepOutput = 'src/file.ts:10:const x = 1;\nsrc/file.ts:11:const y = 2;\nsrc/file.ts:12:const z = 3;';
  const output2 = { output: smallGrepOutput };
  await summarizer(
    { tool: 'Bash' },
    { output: output2 }
  );
  
  results.push({
    name: 'small-grep-unchanged',
    pass: output2.output === smallGrepOutput,
    note: 'Under 20 lines, no truncation needed'
  });
  
  // Test 3: Large read (200 lines) should be truncated
  const largeReadOutput = Array(200).fill('line of code').join('\n');
  const output3 = { output: largeReadOutput };
  await summarizer(
    { tool: 'Read' },
    { output: output3 }
  );
  
  const output3Str = typeof output3.output === 'string' ? output3.output : JSON.stringify(output3.output);
  results.push({
    name: 'large-read-truncated',
    pass: output3Str.length < largeReadOutput.length && output3Str.includes('truncated'),
    originalLength: largeReadOutput.length,
    newLength: output3Str.length
  });
  
  // Test 4: ls with many entries (100) should show count
  const largeLsOutput = Array(100).fill('-rw-r--r--  1 user  staff  100 Apr 12 file.txt').join('\n');
  const output4 = { output: largeLsOutput };
  await summarizer(
    { tool: 'Bash' },
    { output: output4 }
  );
  
  const output4Str = typeof output4.output === 'string' ? output4.output : JSON.stringify(output4.output);
  results.push({
    name: 'large-ls-truncated',
    pass: output4Str.includes('100 entries') && output4Str.length < largeLsOutput.length,
    showsCount: output4Str.includes('100 entries'),
    originalLength: largeLsOutput.length,
    newLength: output4Str.length
  });
  
  // Test 5: Token savings estimate
  const savedChars = largeGrepOutput.length - output1Str.length;
  const estimatedTokens = Math.ceil(savedChars / 4); // ~4 chars per token
  results.push({
    name: 'token-savings-estimate',
    pass: estimatedTokens > 1000,
    charsSaved: savedChars,
    tokensSaved: estimatedTokens,
    note: 'Large grep saved ~' + estimatedTokens + ' tokens'
  });
  
  setCurrentAgent(undefined);
  
  return results;
}
