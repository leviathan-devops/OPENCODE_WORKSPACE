"use strict";
/**
 * DEEP PLANNING MODE - Lessons Learned
 *
 * Incorporates lessons from Trident Brain v3.0 development
 * to prevent repeat bugs and architectural violations.
 *
 * These lessons are MANDATORY for building modes following
 * the Trident v3.0 proven process.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LESSONS = exports.LESSON_CATEGORIES = void 0;
exports.getLessonsByCategory = getLessonsByCategory;
exports.getLessonsBySeverity = getLessonsBySeverity;
exports.getCriticalLessons = getCriticalLessons;
exports.formatLessonChecklist = formatLessonChecklist;
const types_1 = require("./types");
// ============================================================
// LESSON CATEGORIES
// ============================================================
exports.LESSON_CATEGORIES = {
    REGEX_BUGS: 'Regex Bugs',
    LOOP_SAFETY: 'Loop Safety',
    UI_CLEANLINESS: 'UI Cleanliness',
    ARCHITECTURE: 'Architecture',
    TESTING: 'Testing',
    DEPLOYMENT: 'Deployment',
};
// ============================================================
// LESSONS FROM TRIDENT v3.0 DEVELOPMENT
// ============================================================
exports.LESSONS = [
    // ------------------------------------------------------------
    // REGEX BUGS
    // ------------------------------------------------------------
    {
        id: 'REGEX-001',
        category: exports.LESSON_CATEGORIES.REGEX_BUGS,
        severity: types_1.SEVERITY.CRITICAL,
        title: 'Non-Global regex.exec() Returns Same Match Forever',
        problem: 'Non-global regex.exec() returns the same match on every call because lastIndex stays at 0.',
        symptom: '3 actual matches → 300 findings (100x duplication). UI freezes or crashes.',
        rootCause: 'Removing the global flag causes exec() to always match from position 0.',
        fix: 'NEVER remove global flag. Instead, ensure it\'s always present:',
        codeExample: {
            bad: `// WRONG: Removing global flag causes infinite duplicates
const flags = pattern.regex.flags.replace('g', '');
const regex = new RegExp(pattern.regex.source, flags);`,
            good: `// CORRECT: Force global flag to be present
const flags = pattern.regex.flags.includes('g') 
  ? pattern.regex.flags 
  : pattern.regex.flags + 'g';
const regex = new RegExp(pattern.regex.source, flags);`,
        },
        detection: 'Run test with 3 known matches. If findings.length > 10, bug exists.',
        prevention: 'Unit test ALL regex patterns for exact match count.',
    },
    {
        id: 'REGEX-002',
        category: exports.LESSON_CATEGORIES.REGEX_BUGS,
        severity: types_1.SEVERITY.HIGH,
        title: 'Empty Match Causes Infinite Loop',
        problem: 'regex.exec() can match empty string "", causing infinite loop even with safetyCount.',
        symptom: 'Plugin hangs on certain inputs, CPU at 100%.',
        rootCause: 'Empty match doesn\'t advance lastIndex, causing infinite loop.',
        fix: 'Manually advance lastIndex when match is empty:',
        codeExample: {
            bad: `// Hangs on empty matches
while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
  safetyCount++;
  processMatch(match);
}`,
            good: `// Safe: advances past empty matches
while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
  safetyCount++;
  processMatch(match);
  
  if (match[0].length === 0) {
    regex.lastIndex++;
  }
}`,
        },
        detection: 'Test with content that might match empty (like "a\\nb\\nc").',
        prevention: 'Always check match[0].length === 0 inside loop.',
    },
    {
        id: 'REGEX-003',
        category: exports.LESSON_CATEGORIES.REGEX_BUGS,
        severity: types_1.SEVERITY.MEDIUM,
        title: 'Regex Patterns Must Match Test Data',
        problem: 'Patterns may not match real code if they\'re too strict or too loose.',
        symptom: 'Expected 5 findings, got 0.',
        rootCause: 'Pattern requires context that doesn\'t exist in test data.',
        fix: 'Patterns must match actual code patterns in the domain:',
        codeExample: {
            bad: `// Pattern too strict: requires 'function' keyword
const STUB_PATTERN = /function\\s+\\w+\\s*\\(\\)\\s*\\{\\s*return\\s+null\\s*\\}/;

// Test data: 'return null;' alone won't match
const test = 'function x() { return null; }'; // This matches
const test2 = 'return null;'; // This does NOT match`,
            good: `// Test data MUST match what real code looks like
const test = 'function x() { return null; }';
const pattern = /function\\s+\\w+\\s*\\(\\)\\s*\\{\\s*return\\s+null\\s*\\}/;

// Verify by running: pattern.test(test) === true`,
        },
        detection: 'Run pattern.test() against real-world code samples.',
        prevention: 'Build pattern library against actual code corpus.',
    },
    // ------------------------------------------------------------
    // LOOP SAFETY
    // ------------------------------------------------------------
    {
        id: 'LOOP-001',
        category: exports.LESSON_CATEGORIES.LOOP_SAFETY,
        severity: types_1.SEVERITY.CRITICAL,
        title: 'Every While Loop Needs SafetyCount',
        problem: 'Loops without explicit safety limits can hang on large inputs.',
        symptom: 'Plugin hangs on files >1000 lines.',
        rootCause: 'No upper bound on iterations.',
        fix: 'Every while loop with regex.exec() needs safetyCount:',
        codeExample: {
            bad: `// DANGEROUS: No safety limit
while ((match = regex.exec(content)) !== null) {
  processMatch(match);
}`,
            good: `// SAFE: Has safety limit
let safetyCount = 0;
const maxMatches = 100;
while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
  safetyCount++;
  processMatch(match);
}`,
        },
        detection: 'Feed 10MB file. If completes in <5s, loop is safe.',
        prevention: 'Code review checklist: every while has safetyCount.',
    },
    {
        id: 'LOOP-002',
        category: exports.LESSON_CATEGORIES.LOOP_SAFETY,
        severity: types_1.SEVERITY.HIGH,
        title: 'Nested Loops Multiply Complexity',
        problem: 'O(n²) complexity when scanning multiple patterns over large content.',
        symptom: 'Slow performance on large files (>5000 lines).',
        rootCause: 'Pattern loop × content loop × match loop.',
        fix: 'Single-pass scanning where possible, or limit pattern count:',
        codeExample: {
            bad: `// O(n × m × k) complexity
for (const pattern of patterns) {
  while ((match = pattern.regex.exec(content)) !== null) {
    // process
  }
}`,
            good: `// O(n × max(k, m)) - still has to scan content once per pattern
// but can limit patterns to most important ones
const importantPatterns = patterns.slice(0, 20);
for (const pattern of importantPatterns) {
  // with safetyCount and early termination
}`,
        },
        detection: 'Benchmark: 5000 lines should complete in <2s.',
        prevention: 'Performance budget: max 20 patterns per scan.',
    },
    // ------------------------------------------------------------
    // UI CLEANLINESS
    // ------------------------------------------------------------
    {
        id: 'UI-001',
        category: exports.LESSON_CATEGORIES.UI_CLEANLINESS,
        severity: types_1.SEVERITY.CRITICAL,
        title: 'Console.log in Hooks Causes UI Spillover',
        problem: 'Any console.log in hooks appears in OpenCode UI, polluting output.',
        symptom: 'Extra lines in UI output, confusing users.',
        rootCause: 'Hooks share stdout with OpenCode UI.',
        fix: 'Remove ALL console.log from hooks. Use output.blockReason instead:',
        codeExample: {
            bad: `// WRONG: Appears in UI
console.log('Tool blocked');
console.error('Error occurred');
console.warn('Warning');`,
            good: `// CORRECT: Use output properties
output.blockReason = '[MODE] Tool blocked - read-only mode';

// For errors that need user visibility, return in response
return { error: 'Detailed error message for user' };`,
        },
        detection: 'Enable debug mode in OpenCode, check for stray output.',
        prevention: 'grep -r "console\\." src/ before ship.',
    },
    {
        id: 'UI-002',
        category: exports.LESSON_CATEGORIES.UI_CLEANLINESS,
        severity: types_1.SEVERITY.MEDIUM,
        title: 'Error Messages Must Be User-Friendly',
        problem: 'Technical errors confuse users.',
        symptom: 'Users see "TypeError: Cannot read property..."',
        rootCause: 'Exposing internal errors directly.',
        fix: 'Wrap errors in user-friendly messages:',
        codeExample: {
            bad: `// WRONG: Technical error exposed
throw new Error('Cannot read property \\'foo\\' of undefined');`,
            good: `// CORRECT: User-friendly message
throw new Error('[PLANNING] Unable to parse requirements. Please check input format.');`,
        },
        detection: 'Test all error paths, verify message clarity.',
        prevention: 'Error message review in code review.',
    },
    // ------------------------------------------------------------
    // ARCHITECTURE
    // ------------------------------------------------------------
    {
        id: 'ARCH-001',
        category: exports.LESSON_CATEGORIES.ARCHITECTURE,
        severity: types_1.SEVERITY.CRITICAL,
        title: 'Hardcoded Agent Names Break Portability',
        problem: 'Patterns or logic hardcoded to "shark" or "manta" prevents reuse.',
        symptom: 'Code only works for specific agent types.',
        rootCause: 'Embedding agent-specific assumptions.',
        fix: 'Use universal patterns and configurable agent names:',
        codeExample: {
            bad: `// WRONG: Hardcoded agent name
if (clusterId.startsWith('shark-') || clusterId.startsWith('manta-')) {
  // do something
}`,
            good: `// CORRECT: Universal validation
const isValidClusterId = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(clusterId);

// Or configurable:
const ALLOWED_PREFIXES = process.env.ALLOWED_AGENT_PREFIXES?.split(',') || ['shark', 'manta', 'kraken'];
const isAllowed = ALLOWED_PREFIXES.some(p => clusterId.startsWith(p));`,
        },
        detection: 'grep -r "shark\\|manta" src/ shows hardcoded names.',
        prevention: 'Make names configurable via environment or params.',
    },
    {
        id: 'ARCH-002',
        category: exports.LESSON_CATEGORIES.ARCHITECTURE,
        severity: types_1.SEVERITY.HIGH,
        title: 'Modes Must Not Edit Source Code',
        problem: 'Editing code can break projects, violates safety principle.',
        symptom: 'Users report code was modified unexpectedly.',
        rootCause: 'Tool enforcement not active or bypassed.',
        fix: 'Block edit/write/bash tools, only document findings:',
        codeExample: {
            bad: `// WRONG: Editing code directly
async function fixIssue(file: string, issue: Issue) {
  const content = await readFile(file);
  const fixed = applyFix(content, issue);
  await writeFile(file, fixed); // DANGER!
}`,
            good: `// CORRECT: Document fix, don't apply
async function documentFix(file: string, issue: Issue) {
  return \`## FIX DOCUMENTATION
  
> This is DOCUMENTATION ONLY.
  
**File:** \${file}
**Issue:** \${issue.description}
**Line:** \${issue.line}
  
**HOW TO FIX:**
\${issue.fixInstructions}
  
**VERIFICATION:**
1. Make the change
2. Run tests
3. Verify fix\`;
}`,
        },
        detection: 'grep -r "writeFile\\|edit\\|applyFix" src/.',
        prevention: 'Tool enforcement hook MUST block edit/write/bash.',
    },
    {
        id: 'ARCH-003',
        category: exports.LESSON_CATEGORIES.ARCHITECTURE,
        severity: types_1.SEVERITY.HIGH,
        title: 'Plugin Must Be Self-Contained',
        problem: 'Plugin that depends on external files breaks on copy.',
        symptom: 'Plugin works in dev but fails after deployment.',
        rootCause: 'Hardcoded paths or external dependencies.',
        fix: 'Use __dirname relative paths, bundle everything:',
        codeExample: {
            bad: `// WRONG: Absolute path
const config = JSON.parse(readFileSync('/home/user/config.json'));

// WRONG: Parent-relative path
const data = readFileSync('../data/patterns.json');`,
            good: `// CORRECT: Plugin-dir-relative
import path from 'path';
const PLUGIN_DIR = __dirname;
const configPath = path.join(PLUGIN_DIR, 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

// CORRECT: Relative to current file
import { readFileSync } from 'fs';
const patterns = JSON.parse(readFileSync('./patterns.json', 'utf-8'));`,
        },
        detection: 'Copy dist/ to fresh location, run tests.',
        prevention: 'Test deployment in clean environment.',
    },
    // ------------------------------------------------------------
    // TESTING
    // ------------------------------------------------------------
    {
        id: 'TEST-001',
        category: exports.LESSON_CATEGORIES.TESTING,
        severity: types_1.SEVERITY.HIGH,
        title: 'Test Data Must Match Real Code Patterns',
        problem: 'Tests pass but real usage fails because test data is artificial.',
        symptom: 'Unit tests pass, integration fails.',
        rootCause: 'Test data doesn\'t represent real input distribution.',
        fix: 'Use real code samples in tests, not synthetic data:',
        codeExample: {
            bad: `// FAKE test data
const fakeCode = 'function foo() { return null; }';

// REAL test data should be:
const realCode = await readFile('test/fixtures/real-world-example.ts', 'utf-8');`,
            good: `// Use actual code from open source projects
const testCases = [
  { file: 'express/lib/application.js', expected: 5 },
  { file: 'lodash/index.js', expected: 12 },
  // ...
];`,
        },
        detection: 'Coverage report shows pattern × real-code matrix.',
        prevention: 'Test against multiple real codebases.',
    },
    {
        id: 'TEST-002',
        category: exports.LESSON_CATEGORIES.TESTING,
        severity: types_1.SEVERITY.MEDIUM,
        title: 'Mechanical Tests Catch Regression',
        problem: 'Manual testing misses bugs that mechanical tests catch.',
        symptom: 'Same bug reappears after fix.',
        rootCause: 'No regression test suite.',
        fix: 'Always add mechanical test when fixing bugs:',
        codeExample: {
            bad: `// No test for bug fix
function fixNonGlobalRegex(pattern) {
  // Fixed the bug
  return new RegExp(pattern.regex.source, pattern.regex.flags + 'g');
}
// No test added!`,
            good: `// Test added alongside fix
it('should NOT duplicate findings for non-global regex', () => {
  const pattern = { regex: /return null;/, flags: '' };
  const content = 'return null; return null; return null;';
  
  const findings = scanWithPatterns(content, [pattern], 'test');
  
  expect(findings.length).toBe(3); // NOT 300!
});`,
        },
        detection: 'Test suite should run in CI.',
        prevention: 'Require tests for all bug fixes.',
    },
    // ------------------------------------------------------------
    // DEPLOYMENT
    // ------------------------------------------------------------
    {
        id: 'DEPLOY-001',
        category: exports.LESSON_CATEGORIES.DEPLOYMENT,
        severity: types_1.SEVERITY.HIGH,
        title: 'Build Must Complete Clean',
        problem: 'Build warnings become errors in production.',
        symptom: 'Plugin loads but behaves oddly.',
        rootCause: 'TypeScript errors ignored or warnings unfixed.',
        fix: 'Treat warnings as errors, fix before ship:',
        codeExample: {
            bad: `# Ignoring warnings
tsc --noEmit false`,
            good: `# Strict mode
tsc --noEmit
# or with tsconfig
npx tsc --strict --noUnusedLocals --noImplicitReturns`,
        },
        detection: 'npm run build must exit 0 with no warnings.',
        prevention: 'CI gate: build must pass.',
    },
    {
        id: 'DEPLOY-002',
        category: exports.LESSON_CATEGORIES.DEPLOYMENT,
        severity: types_1.SEVERITY.HIGH,
        title: 'Version Number Must Match Package',
        problem: 'Version mismatch causes confusion and deployment issues.',
        symptom: 'v1.0.0 deployed but package.json says v0.9.0.',
        rootCause: 'Manual version update forgotten.',
        fix: 'Automated version bump in build script:',
        codeExample: {
            bad: `# Manual - easy to forget
npm version 1.0.0
npm run build`,
            good: `# Automated in build script
#!/bin/bash
VERSION=$(node -p "require('./package.json').version")
echo "Building version $VERSION"
npm run build
# version already in package.json, build uses it`,
        },
        detection: 'diff -r deployed/ package.json version matches.',
        prevention: 'Single source of truth: package.json version.',
    },
];
// ============================================================
// LESSON UTILITIES
// ============================================================
function getLessonsByCategory(category) {
    return exports.LESSONS.filter(l => l.category === category);
}
function getLessonsBySeverity(severity) {
    return exports.LESSONS.filter(l => l.severity === severity);
}
function getCriticalLessons() {
    return exports.LESSONS.filter(l => l.severity === types_1.SEVERITY.CRITICAL);
}
function formatLessonChecklist() {
    const critical = getCriticalLessons();
    let output = '# Pre-Ship Checklist (from Lessons Learned)\n\n';
    output += '## CRITICAL Issues (Must Fix)\n';
    for (const lesson of critical) {
        output += `- [ ] ${lesson.id}: ${lesson.title}\n`;
        output += `  - Detection: ${lesson.detection || 'N/A'}\n`;
    }
    return output;
}
//# sourceMappingURL=lessons.js.map