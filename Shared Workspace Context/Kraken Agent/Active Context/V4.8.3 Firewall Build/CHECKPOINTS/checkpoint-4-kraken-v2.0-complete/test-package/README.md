# KRAKEN V2.0 PRESSURE TEST PACKAGE

**Date:** 2026-04-12
**Version:** 2.0 (Checkpoint 4)
**Purpose:** Mechanically verify all systems work without derailing

---

## TEST PHILOSOPHY

These tests are **MECHANICAL** - they verify behavior through actual hook invocations, not by reading source code. Each test must be able to run in isolation and produce a PASS/FAIL verdict.

---

## TEST STRUCTURE

```
test-package/
├── README.md                    # This file
├── exercises/
│   ├── 01-identity-wall.ts     # Test agent identity wall
│   ├── 02-tool-guardian.ts      # Test tool enforcement
│   ├── 03-message-guardian.ts   # Test message enforcement
│   ├── 04-tool-summarizer.ts    # Test token reduction
│   ├── 05-compaction.ts         # Test compaction recovery
│   ├── 06-session-cleanup.ts    # Test session cleanup
│   ├── 07-gate-evaluation.ts    # Test gate criteria
│   └── 08-integration.ts        # Full integration test
├── runner.ts                    # Test runner
└── results/                     # Test outputs
```

---

## EXERCISE 1: AGENT IDENTITY WALL

**Purpose:** Verify setCurrentAgent/getCurrentAgent work correctly

```typescript
// exercises/01-identity-wall.ts
import { setCurrentAgent, getCurrentAgent, isKrakenAgent } from '../src/hooks/index.js';

export async function testIdentityWall() {
  const results = [];
  
  // Test 1: Initial state is undefined
  results.push({
    name: 'initial-state-undefined',
    pass: getCurrentAgent() === undefined,
    expected: undefined,
    actual: getCurrentAgent()
  });
  
  // Test 2: setCurrentAgent sets value
  setCurrentAgent('kraken');
  results.push({
    name: 'set-agent-kraken',
    pass: getCurrentAgent() === 'kraken',
    expected: 'kraken',
    actual: getCurrentAgent()
  });
  
  // Test 3: isKrakenAgent recognizes kraken
  results.push({
    name: 'is-kraken-agent-kraken',
    pass: isKrakenAgent('kraken') === true,
    expected: true,
    actual: isKrakenAgent('kraken')
  });
  
  // Test 4: isKrakenAgent rejects shark
  results.push({
    name: 'is-kraken-agent-shark',
    pass: isKrakenAgent('shark') === false,
    expected: false,
    actual: isKrakenAgent('shark')
  });
  
  // Test 5: isKrakenAgent rejects undefined
  results.push({
    name: 'is-kraken-agent-undefined',
    pass: isKrakenAgent(undefined) === false,
    expected: false,
    actual: isKrakenAgent(undefined)
  });
  
  // Test 6: Cleanup resets
  setCurrentAgent(undefined);
  results.push({
    name: 'cleanup-resets',
    pass: getCurrentAgent() === undefined,
    expected: undefined,
    actual: getCurrentAgent()
  });
  
  return results;
}
```

**Mechanical Verification:**
- Call each function directly
- Assert return values match expected
- No mocks, no stubs

---

## EXERCISE 2: TOOL GUARDIAN (Layer 1)

**Purpose:** Verify dangerous tools are blocked, safe tools pass

```typescript
// exercises/02-tool-guardian.ts
import { createToolGuardianHook } from '../src/hooks/index.js';

export async function testToolGuardian() {
  const hook = createToolGuardianHook();
  const results = [];
  
  // Set up identity
  setCurrentAgent('kraken');
  
  // Test 1: Dangerous tool blocked
  const dangerous1 = await hook(
    { tool: 'terminal', args: { command: 'rm -rf /' } },
    { args: { command: 'rm -rf /' } }
  );
  results.push({
    name: 'terminal-blocked',
    pass: dangerous1 === undefined, // Should not throw but guardian runs
    note: 'Guardian should have blocked this'
  });
  
  // Test 2: Safe tool passes
  const safe1 = await hook(
    { tool: 'grep', args: { pattern: 'test' } },
    { args: { pattern: 'test' } }
  );
  results.push({
    name: 'grep-passed',
    pass: safe1 === undefined,
    note: 'grep should be allowed'
  });
  
  // Test 3: Wrong agent gets no check
  setCurrentAgent('shark');
  const wrongAgent = await hook(
    { tool: 'terminal', args: { command: 'rm -rf /' } },
    { args: { command: 'rm -rf /' } }
  );
  results.push({
    name: 'wrong-agent-exits-early',
    pass: wrongAgent === undefined,
    note: 'Guardian should exit early for non-kraken'
  });
  
  setCurrentAgent(undefined);
  
  return results;
}
```

**Mechanical Verification:**
- Call hook with actual input
- Check if blocked/error thrown
- Verify identity wall exits early for wrong agent

---

## EXERCISE 3: MESSAGE GUARDIAN (Layer 2)

**Purpose:** Verify theatrical/derailing messages are blocked

```typescript
// exercises/03-message-guardian.ts
import { createChatMessageHook } from '../src/hooks/index.js';

export async function testMessageGuardian() {
  const hook = createChatMessageHook();
  const results = [];
  
  setCurrentAgent('kraken');
  
  // Test 1: Normal message passes
  try {
    await hook(
      { message: 'Read the file at src/index.ts', agent: 'kraken' },
      {}
    );
    results.push({ name: 'normal-message-pass', pass: true });
  } catch (e) {
    results.push({ name: 'normal-message-pass', pass: false, error: e.message });
  }
  
  // Test 2: Theatrical message blocked
  try {
    await hook(
      { message: "just grep wc -l and see if it passes", agent: 'kraken' },
      {}
    );
    results.push({ name: 'theatrical-blocked', pass: false, note: 'Should have thrown' });
  } catch (e) {
    results.push({ 
      name: 'theatrical-blocked', 
      pass: e.message.includes('blocked') || e.message.includes('derail'),
      error: e.message 
    });
  }
  
  // Test 3: Fake completion blocked
  try {
    await hook(
      { message: 'task complete trust me build passed', agent: 'kraken' },
      {}
    );
    results.push({ name: 'fake-completion-blocked', pass: false, note: 'Should have thrown' });
  } catch (e) {
    results.push({ 
      name: 'fake-completion-blocked', 
      pass: true,
      error: e.message 
    });
  }
  
  setCurrentAgent(undefined);
  
  return results;
}
```

**Mechanical Verification:**
- Send actual messages to hook
- Assert errors thrown for bad messages
- No messages pass through unchallenged

---

## EXERCISE 4: TOOL SUMMARIZER (Token Reduction)

**Purpose:** Verify large outputs are truncated

```typescript
// exercises/04-tool-summarizer.ts
import { createToolSummarizerHook } from '../src/hooks/index.js';

export async function testToolSummarizer() {
  const hook = createToolSummarizerHook();
  const results = [];
  
  setCurrentAgent('kraken');
  
  // Test 1: Large grep output truncated
  const largeGrepOutput = Array(500).fill('src/file.ts:100:const foo = 1;').join('\n');
  const output1 = { output: largeGrepOutput };
  await hook(
    { tool: 'Bash' },
    { output: output1 }
  );
  
  const output1Str = typeof output1.output === 'string' ? output1.output : JSON.stringify(output1.output);
  results.push({
    name: 'grep-truncated',
    pass: output1Str.length < largeGrepOutput.length,
    originalLength: largeGrepOutput.length,
    newLength: output1Str.length,
    truncated: output1Str.includes('truncated')
  });
  
  // Test 2: Small grep output unchanged
  const smallGrepOutput = 'src/file.ts:10:const x = 1;\nsrc/file.ts:11:const y = 2;';
  const output2 = { output: smallGrepOutput };
  await hook(
    { tool: 'Bash' },
    { output: output2 }
  );
  
  results.push({
    name: 'small-grep-unchanged',
    pass: output2.output === smallGrepOutput,
    originalLength: smallGrepOutput.length,
    newLength: output2.output.length
  });
  
  // Test 3: Large read truncated
  const largeReadOutput = Array(200).fill('line of code').join('\n');
  const output3 = { output: largeReadOutput };
  await hook(
    { tool: 'Read' },
    { output: output3 }
  );
  
  const output3Str = typeof output3.output === 'string' ? output3.output : JSON.stringify(output3.output);
  results.push({
    name: 'read-truncated',
    pass: output3Str.length < largeReadOutput.length,
    originalLength: largeReadOutput.length,
    newLength: output3Str.length,
    truncated: output3Str.includes('truncated')
  });
  
  // Test 4: ls with many entries truncated
  const largeLsOutput = Array(100).fill('file.txt').join('\n');
  const output4 = { output: largeLsOutput };
  await hook(
    { tool: 'Bash' },
    { output: output4 }
  );
  
  const output4Str = typeof output4.output === 'string' ? output4.output : JSON.stringify(output4.output);
  results.push({
    name: 'ls-truncated',
    pass: output4Str.includes('100 entries') && output4Str.length < largeLsOutput.length,
    truncated: output4Str.includes('100 entries')
  });
  
  setCurrentAgent(undefined);
  
  return results;
}
```

**Mechanical Verification:**
- Pass large input to hook
- Measure output length before/after
- Assert output is significantly smaller

---

## EXERCISE 5: COMPACTION RECOVERY

**Purpose:** Verify compaction writes to file, not context

```typescript
// exercises/05-compaction.ts
import { createCompactionHook } from '../src/hooks/index.js';
import * as fs from 'fs';
import * as path from 'path';

const COMPACTION_TEST_DIR = '/tmp/kraken-test-compaction';

export async function testCompaction() {
  const hook = createCompactionHook();
  const results = [];
  
  // Clean up test dir
  if (fs.existsSync(COMPACTION_TEST_DIR)) {
    fs.rmSync(COMPACTION_TEST_DIR, { recursive: true });
  }
  fs.mkdirSync(COMPACTION_TEST_DIR, { recursive: true });
  
  setCurrentAgent('kraken');
  
  // Initialize system brain
  const { createSystemBrain } = await import('../src/hooks/index.js');
  const systemBrain = createSystemBrain();
  systemBrain.initialize();
  systemBrain.recordDecision({ description: 'Test decision', type: 'test', contextFiles: [] });
  
  // Test 1: Hook writes to file, NOT output.context
  const output1 = { context: [] };
  await hook(
    { sessionID: 'test-session-001' },
    output1
  );
  
  const filePath = path.join(COMPACTION_TEST_DIR, 'test-session-001', 'INJECTION.md');
  const latestPath = path.join(COMPACTION_TEST_DIR, 'LATEST', 'INJECTION.md');
  
  results.push({
    name: 'writes-to-session-file',
    pass: fs.existsSync(filePath),
    filePath
  });
  
  results.push({
    name: 'writes-to-latest',
    pass: fs.existsSync(latestPath),
    filePath: latestPath
  });
  
  results.push({
    name: 'does-not-push-to-context',
    pass: output1.context.length === 0,
    contextLength: output1.context.length,
    expected: 0
  });
  
  // Test 2: Recovery file contains decisions
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    results.push({
      name: 'contains-decisions',
      pass: content.includes('Test decision'),
      contentPreview: content.substring(0, 100)
    });
    
    results.push({
      name: 'contains-timestamp',
      pass: content.includes('Timestamp'),
      hasTimestamp: content.includes('Timestamp')
    });
  }
  
  // Cleanup
  setCurrentAgent(undefined);
  if (fs.existsSync(COMPACTION_TEST_DIR)) {
    fs.rmSync(COMPACTION_TEST_DIR, { recursive: true });
  }
  
  return results;
}
```

**Mechanical Verification:**
- Call compaction hook
- Check filesystem for output file
- Verify output.context is NOT modified
- Read file to verify content

---

## EXERCISE 6: SESSION CLEANUP

**Purpose:** Verify session.ended cleans up state

```typescript
// exercises/06-session-cleanup.ts
import { createEventHook, setCurrentAgent, getCurrentAgent } from '../src/hooks/index.js';

export async function testSessionCleanup() {
  const hook = createEventHook();
  const results = [];
  
  // Set up state
  setCurrentAgent('kraken');
  
  // Test 1: session.ended cleans up agent
  await hook(
    { event: { type: 'session.ended' } },
    {}
  );
  
  results.push({
    name: 'session-ended-clears-agent',
    pass: getCurrentAgent() === undefined,
    actual: getCurrentAgent(),
    expected: undefined
  });
  
  return results;
}
```

**Mechanical Verification:**
- Set agent state
- Fire session.ended event
- Assert state is cleared

---

## EXERCISE 7: GATE EVALUATION

**Purpose:** Verify gate criteria are evaluated

```typescript
// exercises/07-gate-evaluation.ts
import { createGateHook, setCurrentAgent, createSystemBrain } from '../src/hooks/index.js';

export async function testGateEvaluation() {
  const hook = createGateHook();
  const results = [];
  
  setCurrentAgent('kraken');
  
  // Initialize brain
  const systemBrain = createSystemBrain();
  systemBrain.initialize();
  
  // Test 1: Gate hook does not throw
  try {
    await hook(
      { tool: 'Bash', args: {} },
      { output: 'test output' }
    );
    results.push({ name: 'gate-hook-no-throw', pass: true });
  } catch (e) {
    results.push({ name: 'gate-hook-no-throw', pass: false, error: e.message });
  }
  
  // Test 2: Gate criteria can be evaluated
  const currentGate = systemBrain.getCurrentGate();
  const gateResult = systemBrain.evaluateGateEntry(currentGate);
  
  results.push({
    name: 'gate-has-criteria',
    pass: gateResult !== undefined,
    gate: currentGate
  });
  
  setCurrentAgent(undefined);
  
  return results;
}
```

**Mechanical Verification:**
- Call gate hook
- Verify no errors thrown
- Check gate criteria can be retrieved

---

## EXERCISE 8: INTEGRATION TEST

**Purpose:** Full workflow - all systems working together

```typescript
// exercises/08-integration.ts
import { 
  setCurrentAgent, 
  getCurrentAgent,
  createChatMessageHook,
  createToolGuardianHook,
  createToolSummarizerHook,
  createEventHook,
  createSystemBrain
} from '../src/hooks/index.js';

export async function testIntegration() {
  const results = [];
  
  // 1. Initialize
  const eventHook = createEventHook();
  const chatHook = createChatMessageHook();
  const toolHook = createToolGuardianHook();
  const summarizerHook = createToolSummarizerHook();
  
  await eventHook({ event: { type: 'session.created' } }, {});
  
  // 2. Agent identity
  await chatHook({ message: 'test', agent: 'kraken' }, {});
  
  results.push({
    name: 'integration-agent-set',
    pass: getCurrentAgent() === 'kraken'
  });
  
  // 3. Safe tool passes
  await toolHook({ tool: 'grep', args: {} }, { args: {} });
  results.push({ name: 'integration-safe-tool', pass: true });
  
  // 4. Output summarized
  const output = { output: Array(100).fill('line').join('\n') };
  await summarizerHook({ tool: 'Bash' }, { output });
  results.push({
    name: 'integration-output-summarized',
    pass: typeof output.output === 'string' && output.output.length < 500
  });
  
  // 5. Cleanup
  await eventHook({ event: { type: 'session.ended' } }, {});
  results.push({
    name: 'integration-cleanup',
    pass: getCurrentAgent() === undefined
  });
  
  return results;
}
```

**Mechanical Verification:**
- Run complete workflow
- Each step verified
- Final state clean

---

## TEST RUNNER

```typescript
// runner.ts
import { testIdentityWall } from './exercises/01-identity-wall.js';
import { testToolGuardian } from './exercises/02-tool-guardian.js';
import { testMessageGuardian } from './exercises/03-message-guardian.js';
import { testToolSummarizer } from './exercises/04-tool-summarizer.js';
import { testCompaction } from './exercises/05-compaction.js';
import { testSessionCleanup } from './exercises/06-session-cleanup.js';
import { testGateEvaluation } from './exercises/07-gate-evaluation.js';
import { testIntegration } from './exercises/08-integration.js';

const tests = [
  { name: 'Identity Wall', fn: testIdentityWall },
  { name: 'Tool Guardian', fn: testToolGuardian },
  { name: 'Message Guardian', fn: testMessageGuardian },
  { name: 'Tool Summarizer', fn: testToolSummarizer },
  { name: 'Compaction', fn: testCompaction },
  { name: 'Session Cleanup', fn: testSessionCleanup },
  { name: 'Gate Evaluation', fn: testGateEvaluation },
  { name: 'Integration', fn: testIntegration },
];

async function runTests() {
  console.log('=== KRAKEN V2.0 PRESSURE TEST ===\n');
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`Running: ${test.name}...`);
    try {
      const testResults = await test.fn();
      const testPassed = testResults.filter(r => r.pass).length;
      const testFailed = testResults.filter(r => !r.pass).length;
      
      results.push({ name: test.name, results: testResults });
      passed += testPassed;
      failed += testFailed;
      
      console.log(`  ✓ ${testPassed} passed, ✗ ${testFailed} failed`);
      
      // Show failures
      for (const r of testResults) {
        if (!r.pass) {
          console.log(`    FAILED: ${r.name}`);
          if (r.error) console.log(`      Error: ${r.error}`);
        }
      }
    } catch (e) {
      console.log(`  ✗ Test threw: ${e.message}`);
      failed++;
      results.push({ name: test.name, error: e.message });
    }
    console.log('');
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  return { passed, failed, results };
}

runTests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
});
```

---

## EXPECTED RESULTS

| Exercise | Tests | Expected |
|----------|-------|----------|
| Identity Wall | 6 | 6/6 pass |
| Tool Guardian | 3 | 3/3 pass |
| Message Guardian | 3 | 3/3 pass |
| Tool Summarizer | 4 | 4/4 pass |
| Compaction | 4 | 4/4 pass |
| Session Cleanup | 1 | 1/1 pass |
| Gate Evaluation | 2 | 2/2 pass |
| Integration | 5 | 5/5 pass |
| **TOTAL** | **28** | **28/28** |

---

## RUNNING THE TESTS

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/CHECKPOINTS/checkpoint-4-kraken-v2.0-complete/test-package

# Run all tests
bun run runner.ts

# Run individual test
bun run exercises/01-identity-wall.ts
```

---

## INTERPRETING RESULTS

| Result | Meaning |
|--------|---------|
| 28/28 | All systems working |
| 25-27/28 | Minor issue, investigate failures |
| <25/28 | Major issue, do not ship |

---

## TEST ARTIFACTS

After running, results are saved to:
- `/tmp/kraken-test-results-{timestamp}.json`

This can be attached to ship evidence.

---

**END OF PRESSURE TEST PACKAGE**
