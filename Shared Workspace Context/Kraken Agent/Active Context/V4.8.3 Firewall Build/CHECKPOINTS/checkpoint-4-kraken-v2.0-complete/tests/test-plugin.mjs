console.log('Testing Kraken V2.0 Plugin Hooks...');

const mod = await import('/opt/opencode/plugins/kraken-agent-v2.0/index.js');
const plugin = mod.default;

console.log('Plugin:', plugin.name, plugin.version);

// Initialize hooks
console.log('\nInitializing hooks...');
const hooks = plugin.hooks();

console.log('Hooks registered:', Object.keys(hooks));

// Check for required hooks
const requiredHooks = [
  'event',
  'chat.message', 
  'tool.execute.before',
  'tool.execute.after',
  'experimental.session.compacting'
];

console.log('\nHook verification:');
for (const hook of requiredHooks) {
  if (hooks[hook]) {
    console.log(`  ✓ ${hook} - REGISTERED`);
    
    // Test hook can be called
    try {
      if (hook === 'event') {
        // Test event hook structure
        const result = hooks[hook]({ event: { type: 'session.created' } });
        console.log(`    → returns: ${typeof result}`);
      } else if (hook === 'chat.message') {
        // Test chat.message hook
        const result = hooks[hook]({ message: 'test', sessionID: 'test' }, { message: {}, parts: [] });
        console.log(`    → returns: ${typeof result}`);
      } else if (hook === 'tool.execute.before') {
        // Test tool hook
        const result = hooks[hook]({ tool: 'test', sessionID: 'test' }, { args: {} });
        console.log(`    → returns: ${typeof result}`);
      } else if (hook === 'experimental.session.compacting') {
        // Test compaction hook
        const mockOutput = { context: [] };
        hooks[hook]({ sessionID: 'test' }, mockOutput);
        console.log(`    → output.context pushed: ${mockOutput.context.length > 0}`);
      } else {
        console.log(`    → callable`);
      }
    } catch (e) {
      console.log(`    → error: ${e.message}`);
    }
  } else {
    console.log(`  ✗ ${hook} - MISSING`);
  }
}

console.log('\n✓ Plugin hooks test complete');
