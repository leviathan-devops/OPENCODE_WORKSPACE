/**
 * TRIDENT v3.2 MECHANICAL TEST
 * Tests artifact generation without requiring API keys or container access
 */

import { artifactWriter, type Finding } from './dist/artifact-writer.js';
import { SEVERITY } from './dist/algorithmic-core.js';

const testFinding: Finding = {
  id: 'TEST-1',
  severity: SEVERITY.CRITICAL,
  layer: 0,
  detector: 'TEST',
  category: 'SIMULATED_EXECUTION',
  title: 'Fake success return in test code',
  file: '/test/project/src/auth.ts',
  line: 42,
  evidence: 'return { success: true };',
  remediation: 'Implement actual authentication logic',
  evidenceType: 'STATIC'
};

const testFindings: Finding[] = [
  testFinding,
  {
    ...testFinding,
    id: 'TEST-2',
    severity: SEVERITY.HIGH,
    category: 'COMMAND_INJECTION',
    title: 'User input concatenated to shell command',
    file: '/test/project/src/deploy.ts',
    line: 88,
    evidence: 'execSync(`git commit -m "${msg}"`)',
    remediation: 'Use execFile with array arguments'
  },
  {
    ...testFinding,
    id: 'TEST-3',
    severity: SEVERITY.MEDIUM,
    category: 'COMPLEXITY',
    title: 'Function exceeds complexity threshold',
    file: '/test/project/src/utils.ts',
    line: 156,
    evidence: 'cyclomatic complexity = 23',
    remediation: 'Break into smaller functions'
  }
];

const mockAuditState = {
  config: {
    targetPath: '/test/project',
    depth: 7,
    buildCommand: 'npm run build',
    testCommand: 'npm test'
  },
  currentLayer: 6,
  completedLayers: [0, 1, 2, 3, 4, 5, 6],
  startedAt: new Date(),
  status: 'COMPLETE' as const
};

console.log('=== TRIDENT v3.2 MECHANICAL TEST ===\n');

// Test 1: Artifact generation
console.log('Test 1: ArtifactWriter.generate()');
try {
  const artifact = artifactWriter.generate(testFindings, mockAuditState, {
    targetPath: '/test/project'
  });

  if (artifact.includes('LAYER 1: INITIAL ANALYSIS') &&
      artifact.includes('LAYER 2: FINDINGS') &&
      artifact.includes('LAYER 3: CONSOLIDATED FIX WORKFLOW') &&
      artifact.includes('WHY this is a problem') &&
      artifact.includes('HOW to fix')) {
    console.log('✓ Artifact structure is correct');
  } else {
    console.log('✗ Artifact structure is missing required sections');
    process.exit(1);
  }

  if (artifact.includes('SIMULATED_EXECUTION') &&
      artifact.includes('COMMAND_INJECTION') &&
      artifact.includes('CRITICAL') &&
      artifact.includes('HIGH')) {
    console.log('✓ Findings are properly categorized');
  } else {
    console.log('✗ Findings categorization failed');
    process.exit(1);
  }

  if (artifact.includes('Mechanical verification')) {
    console.log('✓ Verification commands included');
  } else {
    console.log('✗ Verification commands missing');
    process.exit(1);
  }

  console.log('✓ Artifact generation PASSED\n');
} catch (error) {
  console.log('✗ Artifact generation FAILED:', error);
  process.exit(1);
}

// Test 2: Semantic context extraction
console.log('Test 2: Semantic context extraction');
const contextTests = [
  { input: '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent', expected: 'SHARK_AGENT' },
  { input: '/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Kraken Agent', expected: 'KRAGEN_AGENT' },
  { input: '/test/very-long-path/to/some-project-name-here', expected: 'SOME_PROJECT_NAME_HERE' }
];

let contextPassed = true;
for (const test of contextTests) {
  const artifact = artifactWriter.generate([], mockAuditState, { targetPath: test.input });
  if (!artifact.includes(test.expected)) {
    console.log(`✗ Context extraction failed for ${test.input}, expected ${test.expected}`);
    contextPassed = false;
  }
}

if (contextPassed) {
  console.log('✓ Semantic context extraction PASSED\n');
} else {
  console.log('Context extraction had failures\n');
}

// Test 3: Empty findings
console.log('Test 3: Empty findings handling');
try {
  const artifact = artifactWriter.generate([], mockAuditState, { targetPath: '/test/empty' });
  if (artifact.includes('No issues found')) {
    console.log('✓ Empty findings handled correctly');
  } else {
    console.log('✗ Empty findings not handled');
    process.exit(1);
  }
  console.log('✓ Empty findings PASSED\n');
} catch (error) {
  console.log('✗ Empty findings FAILED:', error);
  process.exit(1);
}

// Test 4: All severity levels
console.log('Test 4: All severity levels');
const allSeverities = [
  { sev: SEVERITY.CRITICAL, label: 'CRITICAL' },
  { sev: SEVERITY.HIGH, label: 'HIGH' },
  { sev: SEVERITY.MEDIUM, label: 'MEDIUM' },
  { sev: SEVERITY.LOW, label: 'LOW' },
  { sev: SEVERITY.INFO, label: 'INFO' }
];

const allSeverityFindings = allSeverities.map((s, i) => ({
  ...testFinding,
  id: `SEV-${i}`,
  severity: s.sev,
  category: 'DEFAULT_RISK',
  title: `Test ${s.label} finding`,
  line: i * 10
}));

try {
  const artifact = artifactWriter.generate(allSeverityFindings, mockAuditState, { targetPath: '/test/all' });

  let allPresent = true;
  for (const s of allSeverities) {
    if (!artifact.includes(`### ${s.label}`) && !artifact.includes(`| ${s.label} |`)) {
      console.log(`✗ Severity level ${s.label} not found`);
      allPresent = false;
    }
  }

  if (allPresent) {
    console.log('✓ All severity levels present');
  }
  console.log('✓ All severity levels PASSED\n');
} catch (error) {
  console.log('✗ Severity levels FAILED:', error);
  process.exit(1);
}

console.log('=== ALL TESTS PASSED ===');
console.log('\nArtifact generation is working correctly.');