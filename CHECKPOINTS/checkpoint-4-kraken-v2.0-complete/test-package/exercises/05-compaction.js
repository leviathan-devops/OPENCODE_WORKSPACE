/**
 * Exercise 5: Compaction Recovery Test
 * 
 * Purpose: Verify compaction writes to file, NOT output.context
 */

import * as fs from 'fs';
import * as path from 'path';
import { createCompactionHook, setCurrentAgent, createSystemBrain } from '../../dist/index.js';

const COMPACTION_TEST_DIR = '/tmp/kraken-test-compaction';

export async function runTests() {
  const results = [];
  
  // Clean up test dir
  if (fs.existsSync(COMPACTION_TEST_DIR)) {
    fs.rmSync(COMPACTION_TEST_DIR, { recursive: true });
  }
  fs.mkdirSync(COMPACTION_TEST_DIR, { recursive: true });
  
  // Initialize brain
  const systemBrain = createSystemBrain();
  systemBrain.initialize();
  systemBrain.recordDecision({ description: 'Test compaction decision', type: 'test', contextFiles: ['test.ts'] });
  systemBrain.recordDecision({ description: 'Second decision', type: 'debug', contextFiles: [] });
  
  setCurrentAgent('kraken');
  
  const compaction = createCompactionHook();
  
  // Test 1: Hook does NOT push to output.context
  const output1 = { context: [] };
  await compaction(
    { sessionID: 'test-session-001' },
    output1
  );
  
  results.push({
    name: 'does-not-push-to-context',
    pass: output1.context.length === 0,
    contextLength: output1.context.length,
    expected: 0
  });
  
  // Test 2: Writes to session-specific file
  const sessionFile = path.join(COMPACTION_TEST_DIR, 'test-session-001', 'INJECTION.md');
  results.push({
    name: 'writes-to-session-file',
    pass: fs.existsSync(sessionFile),
    filePath: sessionFile
  });
  
  // Test 3: Writes to LATEST file
  const latestFile = path.join(COMPACTION_TEST_DIR, 'LATEST', 'INJECTION.md');
  results.push({
    name: 'writes-to-latest',
    pass: fs.existsSync(latestFile),
    filePath: latestFile
  });
  
  // Test 4: File contains decisions
  if (fs.existsSync(sessionFile)) {
    const content = fs.readFileSync(sessionFile, 'utf-8');
    results.push({
      name: 'file-contains-decisions',
      pass: content.includes('Test compaction decision'),
      foundDecision: content.includes('Test compaction decision')
    });
    
    results.push({
      name: 'file-contains-timestamp',
      pass: content.includes('Timestamp'),
      hasTimestamp: content.includes('Timestamp')
    });
    
    results.push({
      name: 'file-contains-session-id',
      pass: content.includes('test-session-001'),
      hasSessionId: content.includes('test-session-001')
    });
    
    results.push({
      name: 'file-has-kraken-header',
      pass: content.includes('KRAKEN V2.0'),
      hasHeader: content.includes('KRAKEN V2.0')
    });
  } else {
    results.push({ name: 'file-contains-decisions', pass: false, reason: 'File not found' });
  }
  
  // Test 5: Multiple sessions write separate files
  await compaction(
    { sessionID: 'test-session-002' },
    { context: [] }
  );
  
  const session2File = path.join(COMPACTION_TEST_DIR, 'test-session-002', 'INJECTION.md');
  results.push({
    name: 'multiple-sessions-separate-files',
    pass: fs.existsSync(session2File) && fs.existsSync(sessionFile),
    session1Exists: fs.existsSync(sessionFile),
    session2Exists: fs.existsSync(session2File)
  });
  
  // Cleanup
  setCurrentAgent(undefined);
  if (fs.existsSync(COMPACTION_TEST_DIR)) {
    fs.rmSync(COMPACTION_TEST_DIR, { recursive: true });
  }
  
  return results;
}
