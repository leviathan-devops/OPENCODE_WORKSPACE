/**
 * Kraken V2.0 Bundle Verification Test
 * 
 * This test verifies the bundle contains the necessary components.
 * Full hook testing requires re-exports from the bundle.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const BUNDLE_PATH = '/home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-4-kraken-v2.0-complete/dist/index.js';

const results = [];

console.log('=== KRAKEN V2.0 BUNDLE VERIFICATION ===\n');

// Load bundle
let bundle;
try {
  bundle = readFileSync(BUNDLE_PATH, 'utf-8');
  results.push({ name: 'bundle-loads', pass: true });
} catch (e) {
  console.log('FAILED: Could not load bundle:', e.message);
  process.exit(1);
}

// Test 1: Bundle size
const size = bundle.length;
results.push({
  name: 'bundle-size-valid',
  pass: size > 50000,
  size,
  expected: '> 50KB'
});

// Test 2: Has plugin export
results.push({
  name: 'has-plugin-export',
  pass: bundle.includes('export default') || bundle.includes('export {'),
  found: bundle.includes('export default') ? 'default' : (bundle.includes('export {') ? 'named' : 'none')
});

// Test 3: Identity wall functions
const identityFunctions = [
  'setCurrentAgent',
  'getCurrentAgent',
  'isKrakenAgent'
];

for (const fn of identityFunctions) {
  results.push({
    name: `has-${fn}`,
    pass: bundle.includes(fn),
    found: bundle.includes(fn)
  });
}

// Test 4: Tool summarization
results.push({
  name: 'has-tool-summarizer',
  pass: bundle.includes('createToolSummarizerHook'),
  found: bundle.includes('createToolSummarizerHook')
});

// Test 5: Hook array format
results.push({
  name: 'has-hook-array',
  pass: bundle.includes('tool.execute.after') && bundle.includes('[createToolSummarizerHook'),
  found: bundle.includes('tool.execute.after')
});

// Test 6: Compaction writes to file
results.push({
  name: 'has-compaction-write',
  pass: bundle.includes('INJECTION.md'),
  found: bundle.includes('INJECTION.md')
});

// Test 7: Session cleanup
results.push({
  name: 'has-session-cleanup',
  pass: bundle.includes('session.ended'),
  found: bundle.includes('session.ended')
});

// Test 8: Gate evaluation
results.push({
  name: 'has-gate-evaluation',
  pass: bundle.includes('evaluateGateEntry'),
  found: bundle.includes('evaluateGateEntry')
});

// Test 9: Agent registration
results.push({
  name: 'has-agent-registration',
  pass: bundle.includes('name: "kraken"') && bundle.includes('mode: "primary"'),
  found: bundle.includes('name: "kraken"')
});

// Test 10: Tool Guardian
results.push({
  name: 'has-tool-guardian',
  pass: bundle.includes('DANGEROUS_TOOLS'),
  found: bundle.includes('DANGEROUS_TOOLS')
});

// Test 11: Message Guardian patterns
results.push({
  name: 'has-message-guardian',
  pass: bundle.includes('THEATRICAL_PATTERNS') || bundle.includes('classifyMessageIntent'),
  found: bundle.includes('THEATRICAL_PATTERNS')
});

// Test 12: No output.context.push in compaction
results.push({
  name: 'compaction-no-context-push',
  pass: !bundle.includes('output.context.push'),
  found: !bundle.includes('output.context.push'),
  note: 'Compaction should write to file, not context'
});

// Summary
console.log('Test Results:\n');
let passed = 0;
let failed = 0;

for (const r of results) {
  const status = r.pass ? '✓' : '✗';
  console.log(`${status} ${r.name}`);
  if (r.note) console.log(`  Note: ${r.note}`);
  if (r.pass) passed++; else failed++;
}

console.log(`\n=== SUMMARY ===`);
console.log(`Passed: ${passed}/${passed + failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log(`\n❌ VERIFICATION FAILED - ${failed} issues found`);
} else {
  console.log(`\n✅ ALL VERIFICATIONS PASSED`);
}

console.log('\n=== RECOMMENDATION ===');
if (failed === 0) {
  console.log('✅ Bundle looks good - ready to ship');
} else if (failed <= 3) {
  console.log('⚠️  Minor issues - review failures above');
} else {
  console.log('❌ Major issues - do not ship');
}
