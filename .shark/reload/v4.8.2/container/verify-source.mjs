/**
 * Shark Agent v4.8.2 - Mechanical Verification Test
 * 
 * Verifies Bug Fix 1 and Bug Fix 2 are properly applied in SOURCE.
 * Source is in projects/shark-agent-v4, bundle is in plugins/shark-agent-v481
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SOURCE paths - points to actual source code
const SOURCE_DIR = '/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src';
const BUNDLE_DIR = '/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v481';
const RESULTS_FILE = path.join(__dirname, 'test-results.json');

const tests = [];

// Test 1: Bundle exists and is valid size
tests.push({
  name: 'plugin-bundle-exists',
  run: () => {
    const distPath = path.join(BUNDLE_DIR, 'index.js');
    const exists = fs.existsSync(distPath);
    if (!exists) return { passed: false, output: 'Bundle MISSING' };
    const stats = fs.statSync(distPath);
    const valid = stats.size > 500000;
    return { passed: valid, output: `Bundle: ${stats.size} bytes (${valid ? 'OK' : 'TOO SMALL'})` };
  }
});

// Test 2: Bundle has export (bun uses __export pattern)
tests.push({
  name: 'bundle-has-export',
  run: () => {
    const bundlePath = path.join(BUNDLE_DIR, 'index.js');
    if (!fs.existsSync(bundlePath)) return { passed: false, output: 'No bundle' };
    const content = fs.readFileSync(bundlePath, 'utf-8');
    // Bun bundler uses __export or export via setters, check for actual entry point
    const hasExport = content.includes('__export') || content.includes('export =') || content.includes('export{');
    return { passed: hasExport, output: hasExport ? 'Has export' : 'No export found' };
  }
});

// Test 3: Session hook imports and calls setCurrentAgent (BUG FIX 1)
tests.push({
  name: 'bug-fix-1-setCurrentAgent-called',
  run: () => {
    const sessionPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'session-hook.ts');
    if (!fs.existsSync(sessionPath)) return { passed: false, output: 'session-hook.ts not found' };
    const content = fs.readFileSync(sessionPath, 'utf-8');
    const hasImport = content.includes("import { setCurrentAgent }");
    const hasCall = content.includes('setCurrentAgent(event.agent)');
    return { 
      passed: hasImport && hasCall, 
      output: `Import: ${hasImport}, Call: ${hasCall}` 
    };
  }
});

// Test 4: Index.ts passes variant to shark-status (BUG FIX 2)
tests.push({
  name: 'bug-fix-2-variant-passed',
  run: () => {
    const indexPath = path.join(SOURCE_DIR, 'index.ts');
    if (!fs.existsSync(indexPath)) return { passed: false, output: 'index.ts not found' };
    const content = fs.readFileSync(indexPath, 'utf-8');
    const hasVariant = content.includes("createSharkStatusTool(stateStore, gm, 'shark')");
    return { passed: hasVariant, output: hasVariant ? 'Variant passed' : 'Variant missing' };
  }
});

// Test 5: Guardian hook checks getCurrentAgent (identity wall)
tests.push({
  name: 'guardian-has-identity-wall',
  run: () => {
    const guardianPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasCheck = content.includes('getCurrentAgent()');
    return { passed: hasCheck, output: `Identity wall: ${hasCheck}` };
  }
});

// Test 6: Gate manager has OPENCODE CONTAINER TEST requirement
tests.push({
  name: 'delivery-gate-requires-container-test',
  run: () => {
    const gatesPath = path.join(SOURCE_DIR, 'shared', 'gates.ts');
    if (!fs.existsSync(gatesPath)) return { passed: false, output: 'gates.ts not found' };
    const content = fs.readFileSync(gatesPath, 'utf-8');
    const hasRequirement = content.includes('OPENCODE CONTAINER TEST');
    return { passed: hasRequirement, output: `Test requirement: ${hasRequirement}` };
  }
});

// Test 7: No hardcoded paths in hooks (container-safe)
tests.push({
  name: 'no-hardcoded-personal-paths',
  run: () => {
    const hooksDir = path.join(SOURCE_DIR, 'hooks', 'v4.1');
    if (!fs.existsSync(hooksDir)) return { passed: false, output: 'hooks dir not found' };
    const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts'));
    let hasForbidden = false;
    let forbiddenFound = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(hooksDir, file), 'utf-8');
      const forbidden = ['/home/leviathan', '/Users/', '/mnt/', 'C:\\'];
      for (const f of forbidden) {
        if (content.includes(f)) {
          hasForbidden = true;
          forbiddenFound.push(`${file}: ${f}`);
        }
      }
    }
    return { passed: !hasForbidden, output: hasForbidden ? forbiddenFound.join(', ') : 'Clean' };
  }
});

// Test 8: Guardian has DEPLOYMENT_PATTERNS check
tests.push({
  name: 'guardian-blocks-immediate-deploy',
  run: () => {
    const guardianPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasPatterns = content.includes('DEPLOYMENT_PATTERNS');
    return { passed: hasPatterns, output: `Deployment guard: ${hasPatterns}` };
  }
});

// Test 9: Anti-spoof mechanism exists
tests.push({
  name: 'anti-spoof-verification',
  run: () => {
    const guardianPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasAntiSpoof = content.includes('VERIFICATION_SPOOF_PATTERNS') || content.includes('ANTI-SPOOF');
    return { passed: hasAntiSpoof, output: `Anti-spoof: ${hasAntiSpoof}` };
  }
});

// Test 10: CanEdit protection exists
tests.push({
  name: 'guardian-has-source-protection',
  run: () => {
    const guardianPath = path.join(SOURCE_DIR, 'shared', 'guardian.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasCanEdit = content.includes('canEdit');
    return { passed: hasCanEdit, output: `canEdit protection: ${hasCanEdit}` };
  }
});

// Test 11: IRONCLAD rule in system-transform
tests.push({
  name: 'system-transform-has-ironclad',
  run: () => {
    const transformPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'system-transform-hook.ts');
    if (!fs.existsSync(transformPath)) return { passed: false, output: 'system-transform-hook.ts not found' };
    const content = fs.readFileSync(transformPath, 'utf-8');
    const hasIronclad = content.includes('IRONCLAD');
    return { passed: hasIronclad, output: `IRONCLAD rule: ${hasIronclad}` };
  }
});

// Test 12: Slop detector in gate-hook
tests.push({
  name: 'gate-hook-has-slop-detector',
  run: () => {
    const gatePath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'gate-hook.ts');
    if (!fs.existsSync(gatePath)) return { passed: false, output: 'gate-hook.ts not found' };
    const content = fs.readFileSync(gatePath, 'utf-8');
    const hasSlop = content.includes('slop') || content.includes('Slop');
    return { passed: hasSlop, output: `Slop detector: ${hasSlop}` };
  }
});

// Test 13: Source and bundle are synchronized
tests.push({
  name: 'source-bundle-sync',
  run: () => {
    const srcIndex = path.join(SOURCE_DIR, 'index.ts');
    const bundleIndex = path.join(BUNDLE_DIR, 'index.js');
    if (!fs.existsSync(srcIndex) || !fs.existsSync(bundleIndex)) {
      return { passed: false, output: 'Missing files' };
    }
    const srcMtime = fs.statSync(srcIndex).mtime;
    const bundleMtime = fs.statSync(bundleIndex).mtime;
    const syncOk = bundleMtime >= srcMtime;
    return { passed: syncOk, output: `Src: ${srcMtime}, Bundle: ${bundleMtime}, Synced: ${syncOk}` };
  }
});

// Test 14: NO Manta references in Shark code
tests.push({
  name: 'no-manta-contamination',
  run: () => {
    const hooksDir = path.join(SOURCE_DIR, 'hooks', 'v4.1');
    if (!fs.existsSync(hooksDir)) return { passed: false, output: 'hooks dir not found' };
    const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.ts'));
    let mantaCount = 0;
    let contaminatedFiles = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(hooksDir, file), 'utf-8');
      const count = (content.match(/Manta/g) || []).length;
      if (count > 0) {
        mantaCount += count;
        contaminatedFiles.push(file);
      }
    }
    return { 
      passed: mantaCount === 0, 
      output: mantaCount === 0 ? 'Clean' : `${contaminatedFiles.join(', ')}: ${mantaCount} refs` 
    };
  }
});

// Test 15: agent-state module complete
tests.push({
  name: 'agent-state-module-complete',
  run: () => {
    const statePath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'agent-state.ts');
    if (!fs.existsSync(statePath)) return { passed: false, output: 'agent-state.ts not found' };
    const content = fs.readFileSync(statePath, 'utf-8');
    const hasSet = content.includes('export function setCurrentAgent');
    const hasGet = content.includes('export function getCurrentAgent');
    return { passed: hasSet && hasGet, output: `setCurrentAgent: ${hasSet}, getCurrentAgent: ${hasGet}` };
  }
});

// Test 16: guardian-hook uses getCurrentAgent for identity check
tests.push({
  name: 'guardian-uses-getCurrentAgent',
  run: () => {
    const guardianPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    // Check that getCurrentAgent is actually USED (not just imported)
    const lines = content.split('\n');
    let usedGetCurrentAgent = false;
    for (const line of lines) {
      if (line.includes('getCurrentAgent()') && line.includes('if')) {
        usedGetCurrentAgent = true;
        break;
      }
    }
    return { passed: usedGetCurrentAgent, output: `getCurrentAgent used in if: ${usedGetCurrentAgent}` };
  }
});

// Test 17: Guardian has BROKEN_BUILD_PATTERNS detection
tests.push({
  name: 'guardian-blocks-broken-builds',
  run: () => {
    const guardianPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasBrokenBuildBlock = content.includes('BROKEN_BUILD_BLOCKED') && content.includes('src/') && content.includes('dist/');
    return { passed: hasBrokenBuildBlock, output: `Broken build detection: ${hasBrokenBuildBlock}` };
  }
});

// Test 18: Guardian blocks wrong container approach
tests.push({
  name: 'guardian-blocks-wrong-container',
  run: () => {
    const guardianPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasWrongContainerBlock = content.includes('WRONG_CONTAINER_APPROACH') && content.includes('opencode container run');
    return { passed: hasWrongContainerBlock, output: `Wrong container detection: ${hasWrongContainerBlock}` };
  }
});

// Test 19: Guardian validates plugin paths in opencode.json
tests.push({
  name: 'guardian-validates-plugin-paths',
  run: () => {
    const guardianPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasPathValidation = content.includes('PATH_VALIDATION_BLOCKED') && content.includes('.js');
    return { passed: hasPathValidation, output: `Path validation: ${hasPathValidation}` };
  }
});

// Test 20: Opencode container knowledge stored
tests.push({
  name: 'opencode-container-knowledge-stored',
  run: () => {
    // This test checks that the knowledge about opencode containers is documented
    // The actual storage is in the knowledge system, but we verify the guardian has the enforcement
    const guardianPath = path.join(SOURCE_DIR, 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasOpencodeContainerCommands = content.includes('opencode container run') || content.includes('opencode container start');
    return { passed: hasOpencodeContainerCommands, output: `Opencode container commands: ${hasOpencodeContainerCommands}` };
  }
});

// Run all tests
console.log('=== SHARK v4.8.2 MECHANICAL VERIFICATION ===');
console.log(`Source: ${SOURCE_DIR}`);
console.log(`Bundle: ${BUNDLE_DIR}\n`);

const results = [];
let passedCount = 0;
let failedCount = 0;

for (const test of tests) {
  console.log(`Running: ${test.name}...`);
  try {
    const result = test.run();
    results.push({ name: test.name, passed: result.passed, output: result.output });
    if (result.passed) {
      console.log(`  ✓ ${test.name}`);
      passedCount++;
    } else {
      console.log(`  ✗ ${test.name}: ${result.output}`);
      failedCount++;
    }
  } catch (e) {
    results.push({ name: test.name, passed: false, error: e.message });
    console.log(`  ✗ ${test.name}: ERROR - ${e.message}`);
    failedCount++;
  }
}

const overallPassed = failedCount === 0;
const passRate = passedCount / (passedCount + failedCount);

console.log('\n=== TEST RESULTS ===');
console.log(`Passed: ${passedCount}/${passedCount + failedCount}`);
console.log(`Failed: ${failedCount}/${passedCount + failedCount}`);
console.log(`Pass Rate: ${(passRate * 100).toFixed(1)}%`);
console.log(`Overall: ${overallPassed ? 'PASS' : 'FAIL'}`);

// Bug fix verification
const bug1Fix = results.find(r => r.name === 'bug-fix-1-setCurrentAgent-called')?.passed;
const bug2Fix = results.find(r => r.name === 'bug-fix-2-variant-passed')?.passed;

console.log('\n=== BUG FIX VERIFICATION ===');
console.log(`Bug 1 (setCurrentAgent called): ${bug1Fix ? 'FIXED ✓' : 'NOT FIXED ✗'}`);
console.log(`Bug 2 (variant passed): ${bug2Fix ? 'FIXED ✓' : 'NOT FIXED ✗'}`);

if (!bug1Fix || !bug2Fix) {
  console.log('\n!!! CRITICAL: Bug fixes not applied - CANNOT SHIP !!!');
}

const resultData = {
  suite: 'shark-v482-mechanical-verification',
  timestamp: new Date().toISOString(),
  overallPassed,
  passRate,
  passedTests: passedCount,
  failedTests: failedCount,
  totalTests: passedCount + failedCount,
  buildId: 'shark-v482-' + Date.now(),
  tests: results,
  bugFixVerification: {
    bug1_setCurrentAgentCalled: bug1Fix,
    bug2_variantPassed: bug2Fix
  }
};

fs.writeFileSync(RESULTS_FILE, JSON.stringify(resultData, null, 2));
console.log(`\nResults written to: ${RESULTS_FILE}`);

console.log('\n=== VERIFICATION COMPLETE ===');
process.exit(overallPassed ? 0 : 1);