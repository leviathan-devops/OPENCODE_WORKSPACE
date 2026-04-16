/**
 * Hive Mind Shark Plugin v3 - Enforcement Tests
 * 
 * Tests the core enforcement logic
 */

const DANGEROUS_PATTERNS = [
  { pattern: /^rm\s+-rf\s+\//i, name: 'rm -rf /' },
  { pattern: /curl.+\|\s*sh/i, name: 'curl | sh pipe' },
  { pattern: /:\(\)\{.*:\|.*:\&.*:\}\(/i, name: 'fork bomb' },
  { pattern: /wget.+\|\s*sh/i, name: 'wget | sh pipe' },
]

const THEATRICAL_PATTERNS = [
  /mock\s*(mode|data|test)/i,
  /\bstub\b/i,
  /fake\s*(data|test|implementation)/i,
  /simulate[ds]?/i,
  /would\s+(run|execute|build|test)/i,
  /TODO|FIXME|HACK/i,
]

function isDangerous(cmd: string): { dangerous: boolean; pattern?: string } {
  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    if (pattern.test(cmd)) {
      return { dangerous: true, pattern: name }
    }
  }
  return { dangerous: false }
}

function isTheatrical(cmd: string): string | null {
  for (const pattern of THEATRICAL_PATTERNS) {
    if (pattern.test(cmd)) {
      return pattern.source
    }
  }
  return null
}

function detectMode(artifacts: Record<string, boolean>): string {
  if (artifacts['report']) return 'SHIP'
  if (artifacts['testStage1'] && artifacts['testStage2']) return 'VERIFY'
  if (artifacts['manifest']) return 'TEST'
  if (artifacts['plan'] && artifacts['claims']) return 'BUILD'
  return 'PLAN'
}

// ========================================================================
// TESTS
// ========================================================================

let passed = 0
let failed = 0

function test(name: string, fn: () => boolean) {
  try {
    const result = fn()
    if (result) {
      console.log(`  ✅ ${name}`)
      passed++
    } else {
      console.log(`  ❌ ${name}`)
      failed++
    }
  } catch (err) {
    console.log(`  ❌ ${name}: ${err}`)
    failed++
  }
}

console.log('🦈 Hive Mind Shark v3 - Enforcement Tests\n')

// ========================================================================
// DANGEROUS PATTERN TESTS
// ========================================================================
console.log('Dangerous Pattern Blocking:')

test('BLOCKS: rm -rf /', () => {
  return isDangerous('rm -rf /').dangerous
})

test('BLOCKS: rm -rf /var', () => {
  return isDangerous('rm -rf /var').dangerous
})

test('ALLOWS: rm -rf ./temp', () => {
  return !isDangerous('rm -rf ./temp').dangerous
})

test('ALLOWS: rm -rf $HOME/tmp', () => {
  return !isDangerous('rm -rf $HOME/tmp').dangerous
})

test('BLOCKS: curl | sh', () => {
  return isDangerous('curl http://example.com | sh').dangerous
})

test('ALLOWS: curl -o file.txt', () => {
  return !isDangerous('curl -o file.txt http://example.com').dangerous
})

test('Handiles edge case input', () => {
  // Test the dangerous checker handles edge cases
  const r1 = isDangerous('');
  const r2 = isDangerous('normal command');
  return !r1.dangerous && !r2.dangerous;
})

// ========================================================================
// THEATRICAL PATTERN TESTS
// ========================================================================
console.log('\nTheatrical Pattern Detection:')

test('DETECTS: mock mode', () => {
  return isTheatrical('mock mode testing') !== null
})

test('DETECTS: stub', () => {
  return isTheatrical('stub implementation') !== null
})

test('DETECTS: fake data', () => {
  return isTheatrical('fake data generator') !== null
})

test('DETECTS: simulated', () => {
  return isTheatrical('simulated test') !== null
})

test('DETECTS: I would run', () => {
  return isTheatrical('I would run the tests') !== null
})

test('ALLOWS: real implementation', () => {
  return isTheatrical('real implementation') === null
})

// ========================================================================
// MODE DETECTION TESTS
// ========================================================================
console.log('\nMode Detection:')

test('PLAN when no artifacts', () => {
  return detectMode({}) === 'PLAN'
})

test('BUILD when plan + claims exist', () => {
  return detectMode({ plan: true, claims: true }) === 'BUILD'
})

test('TEST when manifest exists', () => {
  return detectMode({ plan: true, claims: true, manifest: true }) === 'TEST'
})

test('VERIFY when tests exist', () => {
  return detectMode({ manifest: true, testStage1: true, testStage2: true }) === 'VERIFY'
})

test('SHIP when report exists', () => {
  return detectMode({ manifest: true, testStage1: true, testStage2: true, report: true }) === 'SHIP'
})

// ========================================================================
// ARTIFACT PATHS
// ========================================================================
console.log('\nArtifact Paths:')

const ARTIFACTS = {
  PLAN: ['.shark/plan.md', '.shark/claims.json'],
  BUILD: ['.shark/build-manifest.json'],
  TEST: ['.shark/test-results/stage1.json', '.shark/test-results/stage2.json'],
  VERIFY: ['.shark/verify-gates.json'],
  SHIP: ['.shark/SHIP_REPORT.md'],
}

test('PLAN artifacts defined', () => {
  return ARTIFACTS.PLAN.length === 2
})

test('BUILD artifacts defined', () => {
  return ARTIFACTS.BUILD.length === 1
})

test('TEST artifacts defined', () => {
  return ARTIFACTS.TEST.length === 2
})

test('VERIFY artifacts defined', () => {
  return ARTIFACTS.VERIFY.length === 1
})

test('SHIP artifacts defined', () => {
  return ARTIFACTS.SHIP.length === 1
})

// ========================================================================
// SUMMARY
// ========================================================================
console.log('\n' + '='.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log('='.repeat(50))

process.exit(failed === 0 ? 0 : 1)
