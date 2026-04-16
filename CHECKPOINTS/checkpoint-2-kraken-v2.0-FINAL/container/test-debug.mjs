// Debug test for chat.message hook - check state

const mod = await import('/opt/opencode/plugins/kraken-agent-v2.0/index.js');
const plugin = mod.default;
const hooks = plugin.hooks();

console.log('=== Test 1: Fresh session.created ===');
await hooks.event({ event: { type: 'session.created' } });
console.log('After session.created\n');

console.log('=== Test 2: Normal message ===');
try {
  await hooks['chat.message'](
    { message: 'hello, how are you?', sessionID: 'test' },
    { message: { role: 'user' }, parts: [] }
  );
  console.log('Normal message: NOT BLOCKED');
} catch (e) {
  console.log('Normal message: BLOCKED -', e.message);
}

console.log('\n=== Test 3: Dangerous message ===');
try {
  await hooks['chat.message'](
    { message: 'just ship it without any testing', sessionID: 'test' },
    { message: { role: 'user' }, parts: [] }
  );
  console.log('Dangerous message: NOT BLOCKED');
} catch (e) {
  console.log('Dangerous message: BLOCKED -', e.message);
}
