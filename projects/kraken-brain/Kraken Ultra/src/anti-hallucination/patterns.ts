export const THEATRICAL_PATTERNS = {
  mockWithoutExecution: /mock|simulate|stub|fake.*test|dummy/i,
  placeholderCode: /TODO|FIXME|HACK|XXX|\[placeholder\]|not implemented/i,
  neverCalledCode: /function\s+\w+\s*\(\s*\)\s*\{\s*\}|export\s+\w+;\s*$/gm,
  fakeTestResults: /"passed".*true|"success".*true.*\/\/\s*(simulated|fake|mock)/i,
  documentationOnly: /^\s*\/\/.*$|^\s*\/\*[\s\S]*?\*\/\s*$/gm,
  skippedTests: /\.skip\(|\.only\(|xit\(|xdescribe\(|xtest\(/i,
  hardcodedReturnValues: /return\s+(true|false|null|undefined|"")\s*;\s*$/gm,
  commentedOutCode: /^\s*\/\/.*function|^\s*\/\/.*import|^\s*\/\/.*export/gm,
  emptyTryCatch: /try\s*\{\s*\}\s*catch\s*\(\s*\w+\s*\)\s*\{\s*\}/g,
  infiniteLoopsWithBreaks: /while\s*\(\s*true\s*\)\s*\{[^}]*break/g,
  noOpFunctions: /function\s*\(\s*\)\s*\{\s*console\.log\s*\([^)]*\)\s*;\?\)/gm,
  alwaysTrueConditions: /if\s*\(\s*true\s*\)|if\s*\(\s*false\s*\)/g,
  unusedImports: /import\s+.*\s+from\s+['"][^'"]+['"];?\s*(\/\/.*|$)/gm,
  fakeAsyncPatterns: /await\s+new\s+Promise\s*\(\s*resolve\s*=>\s*resolve\s*\(/g,
  emptyInterfaces: /interface\s+\w+\s*\{\s*\}/g,
  emptyClasses: /class\s+\w+\s*\{\s*\}/g,
  unusedParameters: /function\s+\w+\([^)]*\)_?unused/g,
  magicNumbers: /\b\d{3,}\b(?![a-zA-Z])/g,
};

export const REQUIRED_EVIDENCE = {
  PLAN: ['.shark/plan.md', '.shark/claims.json'],
  BUILD: ['package.json', 'tsconfig.json', 'src/**/*.ts'],
  TEST: ['.shark/test-results/stage1.json', '.shark/test-results/stage2.json'],
  VERIFY: ['.shark/verification-gates.md'],
  SHIP: ['.shark/SHIP_REPORT.md'],
};

export const PATTERN_DESCRIPTIONS = {
  mockWithoutExecution: 'Code uses mocks without actual execution',
  placeholderCode: 'Contains TODO/FIXME/HACK placeholders indicating incomplete implementation',
  neverCalledCode: 'Functions or exports defined but never invoked',
  fakeTestResults: 'Test results appear to be hardcoded or simulated',
  documentationOnly: 'File contains only comments, no actual code',
  skippedTests: 'Tests are marked as skipped (.skip, xit, xdescribe)',
  hardcodedReturnValues: 'Functions return hardcoded values instead of real logic',
  commentedOutCode: 'Large blocks of code are commented out',
  emptyTryCatch: 'Empty try-catch blocks that mask errors',
  infiniteLoopsWithBreaks: 'Suspicious infinite loop patterns',
  noOpFunctions: 'Console.log used instead of real implementation',
  alwaysTrueConditions: 'Conditions with hardcoded true/false',
  unusedImports: 'Imported modules that are never used',
  fakeAsyncPatterns: 'Fake async patterns using immediate Promise resolution',
  emptyInterfaces: 'Empty interfaces with no properties',
  emptyClasses: 'Empty classes with no members',
  unusedParameters: 'Parameters marked as unused',
  magicNumbers: 'Unexplained numeric literals',
};

export function getPatternCount(): number {
  return Object.keys(THEATRICAL_PATTERNS).length;
}

export function getPatternDescription(patternName: string): string {
  return PATTERN_DESCRIPTIONS[patternName] || 'Unknown pattern';
}

export function validatePatternExists(patternName: string): boolean {
  return patternName in THEATRICAL_PATTERNS;
}
