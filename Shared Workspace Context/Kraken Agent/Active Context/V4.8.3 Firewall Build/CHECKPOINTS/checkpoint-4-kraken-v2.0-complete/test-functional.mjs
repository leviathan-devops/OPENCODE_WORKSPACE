#!/usr/bin/env node
/**
 * Kraken V2.0 Functional Test
 * Tests plugin structure without needing TUI
 */

import { readFileSync, statSync } from 'fs';

const PLUGIN_PATH = '/home/leviathan/.config/opencode/plugins/kraken-agent-v2.0/dist/index.js';

console.log('=== Kraken V2.0 Functional Test ===\n');

// Test 1: Bundle exists and valid size
console.log('Test 1: Bundle exists');
try {
  const stats = statSync(PLUGIN_PATH);
  console.log(`  Size: ${stats.size} bytes`);
  if (stats.size > 50000) {
    console.log('  ✓ Bundle valid (>50KB)');
  } else {
    console.log('  ✗ Bundle too small');
  }
} catch (e) {
  console.log('  ✗ Bundle not found:', e.message);
  process.exit(1);
}

// Test 2: Has correct export format
console.log('\nTest 2: Plugin export format');
const content = readFileSync(PLUGIN_PATH, 'utf-8');
if (content.includes('export default') || content.includes('module.exports')) {
  console.log('  ✓ Has export');
} else {
  console.log('  ✗ No export found');
}

// Test 3: Identity wall functions present
console.log('\nTest 3: Identity wall functions');
if (content.includes('isKrakenAgent')) {
  console.log('  ✓ isKrakenAgent defined');
} else {
  console.log('  ✗ isKrakenAgent missing');
}
if (content.includes('setCurrentAgent')) {
  console.log('  ✓ setCurrentAgent defined');
} else {
  console.log('  ✗ setCurrentAgent missing');
}
if (content.includes('getCurrentAgent')) {
  console.log('  ✓ getCurrentAgent defined');
} else {
  console.log('  ✗ getCurrentAgent missing');
}

// Test 4: Tool summarization present
console.log('\nTest 4: Tool summarization');
if (content.includes('summarizeGrep')) {
  console.log('  ✓ summarizeGrep defined');
} else {
  console.log('  ✗ summarizeGrep missing');
}
if (content.includes('MAX_GREP_LINES')) {
  console.log('  ✓ MAX_GREP_LINES defined');
} else {
  console.log('  ✗ MAX_GREP_LINES missing');
}

// Test 5: Compaction writes to file (not context)
console.log('\nTest 5: Compaction (file only)');
if (content.includes('INJECTION.md')) {
  console.log('  ✓ Writes INJECTION.md');
} else {
  console.log('  ✗ Missing INJECTION.md write');
}
// Check it does NOT push to output.context (the bug)
const compactMatch = content.match(/session\.compacting[^}]+output\.context\.push/);
if (compactMatch) {
  console.log('  ✗ STILL pushing to output.context (BUG)');
} else {
  console.log('  ✓ Does NOT push to output.context (correct)');
}

// Test 6: Session cleanup
console.log('\nTest 6: Session cleanup');
if (content.includes('session.ended')) {
  console.log('  ✓ Handles session.ended');
} else {
  console.log('  ✗ Missing session.ended handler');
}

// Test 7: Hook array format
console.log('\nTest 7: Hook array format');
if (content.includes("'tool.execute.after': [")) {
  console.log('  ✓ tool.execute.after is array');
} else {
  console.log('  ✗ tool.execute.after not array');
}

console.log('\n=== Test Complete ===');
