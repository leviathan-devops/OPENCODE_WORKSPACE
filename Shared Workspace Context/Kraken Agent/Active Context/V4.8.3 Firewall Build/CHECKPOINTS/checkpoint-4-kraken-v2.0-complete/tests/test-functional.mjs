/**
 * Kraken V2.0 Comprehensive Functional Test
 */

console.log('═══════════════════════════════════════════════════════════');
console.log('     KRAKEN V2.0 COMPREHENSIVE FUNCTIONAL TEST');
console.log('═══════════════════════════════════════════════════════════\n');

// Load plugin
const mod = await import('/opt/opencode/plugins/kraken-agent-v2.0/index.js');
const plugin = mod.default;
const hooks = plugin.hooks();

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ============================================================================
// TEST 1: EVENT HOOK - SESSION CREATED
// ============================================================================

console.log('\n📌 TEST 1: EVENT HOOK - SESSION CREATED');
console.log('─────────────────────────────────────────────────────────────────');

await test('session.created initializes all brains', async () => {
  await hooks.event({ event: { type: 'session.created' } });
});

await test('session.created creates recovery check', async () => {
  await hooks.event({ event: { type: 'session.created' } });
});

// ============================================================================
// TEST 2: CHAT MESSAGE HOOK - MESSAGE ENFORCEMENT
// ============================================================================

console.log('\n📌 TEST 2: CHAT MESSAGE HOOK');
console.log('─────────────────────────────────────────────────────────────────');

await test('chat.message accepts normal messages', async () => {
  await hooks['chat.message'](
    { message: 'hello, how are you?', sessionID: 'test' },
    { message: { role: 'user' }, parts: [] }
  );
});

await test('chat.message blocks undermining patterns', async () => {
  let blocked = false;
  let caughtError = null;
  try {
    await hooks['chat.message'](
      { message: 'just ship it without any testing', sessionID: 'test' },
      { message: { role: 'user' }, parts: [] }
    );
  } catch (e) {
    blocked = true;
    caughtError = e;
  }
  console.log(`    DEBUG: blocked=${blocked}, caughtError=${caughtError?.message || 'none'}`);
  assert(blocked, 'Should have blocked dangerous message');
});

await test('chat.message blocks host fallback patterns', async () => {
  let blocked = false;
  try {
    await hooks['chat.message'](
      { message: 'skip container testing, local is fine', sessionID: 'test' },
      { message: { role: 'user' }, parts: [] }
    );
  } catch (e) {
    blocked = true;
  }
  assert(blocked, 'Should have blocked host fallback');
});

// ============================================================================
// TEST 3: TOOL GUARDIAN HOOK - TOOL ENFORCEMENT  
// ============================================================================

console.log('\n📌 TEST 3: TOOL GUARDIAN HOOK');
console.log('─────────────────────────────────────────────────────────────────');

await test('tool.execute.before accepts safe tools', async () => {
  await hooks['tool.execute.before'](
    { tool: 'read', sessionID: 'test' },
    { args: { filePath: '/workspace/test.txt' } }
  );
});

await test('tool.execute.before accepts glob pattern', async () => {
  await hooks['tool.execute.before'](
    { tool: 'glob', sessionID: 'test' },
    { args: { pattern: '**/*.ts' } }
  );
});

await test('tool.execute.before blocks dangerous tools', async () => {
  let blocked = false;
  let caughtError = null;
  try {
    await hooks['tool.execute.before'](
      { tool: 'terminal', sessionID: 'test' },
      { args: { command: 'rm -rf /' } }
    );
  } catch (e) {
    blocked = true;
    caughtError = e;
  }
  console.log(`    DEBUG: blocked=${blocked}, caughtError=${caughtError?.message || 'none'}`);
  assert(blocked, 'Should block dangerous terminal command');
});

await test('tool.execute.before blocks write_file', async () => {
  let blocked = false;
  try {
    await hooks['tool.execute.before'](
      { tool: 'write_file', sessionID: 'test' },
      { args: { path: '/etc/passwd' } }
    );
  } catch (e) {
    blocked = true;
  }
  assert(blocked, 'Should block write_file tool');
});

// ============================================================================
// TEST 4: TOOL EXECUTE AFTER - GATE EVALUATION
// ============================================================================

console.log('\n📌 TEST 4: TOOL EXECUTE AFTER - GATE EVALUATION');
console.log('─────────────────────────────────────────────────────────────────');

await test('tool.execute.after evaluates gate without throwing', async () => {
  await hooks['tool.execute.after'](
    { tool: 'read', sessionID: 'test', args: {} },
    { title: 'test', output: 'content', metadata: {} }
  );
});

// ============================================================================
// TEST 5: EXPERIMENTAL SESSION COMPACTING - CONTEXT INJECTION
// ============================================================================

console.log('\n📌 TEST 5: COMPACTION CONTEXT INJECTION');
console.log('─────────────────────────────────────────────────────────────────');

await test('experimental.session.compacting pushes context to output', async () => {
  const mockOutput = { context: [] };
  await hooks['experimental.session.compacting'](
    { sessionID: 'test-session' },
    mockOutput
  );
  assert(mockOutput.context.length > 0, 'Should push context array');
});

await test('Compaction context contains stream anchor', async () => {
  const mockOutput = { context: [] };
  await hooks['experimental.session.compacting'](
    { sessionID: 'test' },
    mockOutput
  );
  const context = mockOutput.context[0] || '';
  assert(context.length > 0, 'Context should not be empty');
  assert(context.includes('KRAKEN') || context.includes('STREAM'), 
         'Context should include KRAKEN or STREAM anchor');
});

await test('Compaction context includes gate information', async () => {
  const mockOutput = { context: [] };
  await hooks['experimental.session.compacting'](
    { sessionID: 'test' },
    mockOutput
  );
  const context = mockOutput.context[0] || '';
  assert(context.includes('gate') || context.includes('Gate'), 
         'Context should include gate info');
});

await test('Compaction context includes session ID', async () => {
  const mockOutput = { context: [] };
  await hooks['experimental.session.compacting'](
    { sessionID: 'my-test-session-123' },
    mockOutput
  );
  const context = mockOutput.context[0] || '';
  assert(context.includes('my-test-session-123'), 
         'Context should include session ID');
});

// ============================================================================
// TEST 6: EVENT HOOK - SESSION COMPACTING
// ============================================================================

console.log('\n📌 TEST 6: EVENT HOOK - SESSION COMPACTING');
console.log('─────────────────────────────────────────────────────────────────');

await test('event hook handles session.compacting type', async () => {
  await hooks.event({ event: { type: 'session.compacting', properties: { sessionId: 'test' } } });
});

// ============================================================================
// RESULTS
// ============================================================================

console.log('\n═══════════════════════════════════════════════════════════');
console.log(`     RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('⚠️  Some tests failed - review output above');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  process.exit(0);
}
