#!/usr/bin/env node
/**
 * Kraken V2.0 Pressure Test Runner
 * Runs all mechanical system tests and outputs results
 */

import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = '/home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-4-kraken-v2.0-complete/test-package';
const RESULTS_DIR = path.join(TEST_DIR, 'results');

const tests = [
  { name: 'Identity Wall', file: '01-identity-wall.js' },
  { name: 'Tool Guardian', file: '02-tool-guardian.js' },
  { name: 'Message Guardian', file: '03-message-guardian.js' },
  { name: 'Tool Summarizer', file: '04-tool-summarizer.js' },
  { name: 'Compaction', file: '05-compaction.js' },
  { name: 'Session Cleanup', file: '06-session-cleanup.js' },
  { name: 'Gate Evaluation', file: '07-gate-evaluation.js' },
  { name: 'Integration', file: '08-integration.js' },
];

async function runTests() {
  console.log('=== KRAKEN V2.0 PRESSURE TEST ===\n');
  console.log(`Test Directory: ${TEST_DIR}\n`);
  
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  
  const allResults = [];
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const test of tests) {
    const testPath = path.join(TEST_DIR, 'exercises', test.file);
    
    if (!fs.existsSync(testPath)) {
      console.log(`⚠️  ${test.name}: TEST FILE NOT FOUND (${testPath})\n`);
      continue;
    }
    
    console.log(`Running: ${test.name}...`);
    
    try {
      const module = await import(testPath);
      const results = await module.runTests();
      
      const passed = results.filter(r => r.pass).length;
      const failed = results.filter(r => !r.pass).length;
      
      totalPassed += passed;
      totalFailed += failed;
      
      allResults.push({ name: test.name, results, passed, failed });
      
      console.log(`  ✓ ${passed} passed, ✗ ${failed} failed`);
      
      for (const r of results) {
        if (!r.pass) {
          console.log(`    FAILED: ${r.name}`);
          if (r.error) console.log(`      Error: ${r.error}`);
        }
      }
      
      console.log('');
    } catch (e) {
      console.log(`  ✗ Test threw: ${e.message}\n`);
      totalFailed++;
      allResults.push({ name: test.name, error: e.message });
    }
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Total Tests: ${totalPassed + totalFailed}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  
  const successRate = totalPassed + totalFailed > 0 
    ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)
    : '0.0';
  console.log(`Success Rate: ${successRate}%`);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(RESULTS_DIR, `results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp,
    summary: { total: totalPassed + totalFailed, passed: totalPassed, failed: totalFailed },
    results: allResults
  }, null, 2));
  
  console.log(`\nResults saved to: ${resultsFile}`);
  
  const verdict = totalFailed === 0 
    ? '✅ ALL TESTS PASSED - READY TO SHIP'
    : totalFailed <= 3
      ? '⚠️  MINOR ISSUES - REVIEW FAILURES'
      : '❌ MAJOR ISSUES - DO NOT SHIP';
  
  console.log(`\n${verdict}`);
  
  return { passed: totalPassed, failed: totalFailed, results: allResults };
}

runTests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(e => {
  console.error('Runner failed:', e);
  process.exit(1);
});
