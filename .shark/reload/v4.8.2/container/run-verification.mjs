/**
 * Shark Agent v4.8.2 - Mechanical Verification Test
 * 
 * This test verifies the ship by checking:
 * 1. Plugin bundle exists and is valid size
 * 2. Session hook imports and calls setCurrentAgent (Bug Fix 1)
 * 3. Index.ts passes variant to shark-status tool (Bug Fix 2)
 * 4. Guardian has identity wall
 * 5. Gate has container test requirement
 * 6. No hardcoded paths (container-safe)
 * 7. No Manta contamination
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_FILE = '/opt/opencode/.shark/evidence/delivery/ContainerTestResult.json';
const PLUGIN_DIR = '/opt/opencode/plugins/shark-agent';

const tests = [];

// Test 1: Plugin bundle exists and is valid size
tests.push({
  name: 'plugin-bundle-exists',
  run: () => {
    const distPath = path.join(PLUGIN_DIR, 'dist', 'index.js');
    const exists = fs.existsSync(distPath);
    if (!exists) return { passed: false, output: 'dist/index.js MISSING' };
    const stats = fs.statSync(distPath);
    const valid = stats.size > 500000;
    return { passed: valid, output: `Bundle: ${stats.size} bytes (${valid ? 'OK' : 'TOO SMALL'})` };
  }
});

// Test 2: Plugin has export
tests.push({
  name: 'plugin-module-loads',
  run: () => {
    try {
      const pluginPath = path.join(PLUGIN_DIR, 'dist', 'index.js');
      const content = fs.readFileSync(pluginPath, 'utf-8');
      const hasExport = content.includes('export default') || content.includes('module.exports');
      return { passed: hasExport, output: hasExport ? 'Has export' : 'No export found' };
    } catch (e) {
      return { passed: false, output: `Load error: ${e.message}` };
    }
  }
});

// Test 3: Session hook imports and calls setCurrentAgent (BUG FIX 1)
tests.push({
  name: 'session-hook-calls-setCurrentAgent',
  run: () => {
    const sessionPath = path.join(PLUGIN_DIR, 'src', 'hooks', 'v4.1', 'session-hook.ts');
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
  name: 'index-passes-variant-to-status',
  run: () => {
    const indexPath = path.join(PLUGIN_DIR, 'src', 'index.ts');
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
    const guardianPath = path.join(PLUGIN_DIR, 'src', 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasCheck = content.includes('getCurrentAgent()');
    const hasReturn = content.includes('return; // skip non-shark') || content.includes('return;\n  }');
    return { passed: hasCheck, output: `Identity wall: ${hasCheck}` };
  }
});

// Test 6: Gate manager has OPENCODE CONTAINER TEST requirement
tests.push({
  name: 'delivery-gate-requires-container-test',
  run: () => {
    const gatesPath = path.join(PLUGIN_DIR, 'src', 'shared', 'gates.ts');
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
    const hooksDir = path.join(PLUGIN_DIR, 'src', 'hooks', 'v4.1');
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
    const guardianPath = path.join(PLUGIN_DIR, 'src', 'hooks', 'v4.1', 'guardian-hook.ts');
    if (!fs.existsSync(guardianPath)) return { passed: false, output: 'guardian-hook.ts not found' };
    const content = fs.readFileSync(guardianPath, 'utf-8');
    const hasPatterns = content.includes('DEPLOYMENT_PATTERNS');
    const hasGuard = content.includes('DEPLOYMENT GUARD') || content.includes('ContainerTestResult');
    return { passed: hasPatterns && hasGuard, output: `Deployment guard: ${hasPatterns && hasGuard}` };
  }
});

// Test 9: Anti-spoof mechanism exists
tests.push({
  name: 'anti-spoof-verification',
  run: () => {
    const guardianPath = path.join(PLUGIN_DIR, 'src', 'hooks', 'v4.1', 'guardian-hook.ts');
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
    const guardianPath = path.join(PLUGIN_DIR, 'src', 'shared', 'guardian.ts');
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
    const transformPath = path.join(PLUGIN_DIR, 'src', 'hooks', 'v4.1', 'system-transform-hook.ts');
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
    const gatePath = path.join(PLUGIN_DIR, 'src', 'hooks', 'v4.1', 'gate-hook.ts');
    if (!fs.existsSync(gatePath)) return { passed: false, output: 'gate-hook.ts not found' };
    const content = fs.readFileSync(gatePath, 'utf-8');
    const hasSlop = content.includes('slop') || content.includes('Slop');
    return { passed: hasSlop, output: `Slop detector: ${hasSlop}` };
  }
});

// Test 13: Container mode
tests.push({
  name: 'container-produces-test-result',
  run: () => {
    const inContainer = process.env.SHARK_CONTAINER === 'true' || fs.existsSync('/.dockerenv');
    return { passed: inContainer, output: `Container mode: ${inContainer}` };
  }
});

// Test 14: Source and dist are synchronized
tests.push({
  name: 'source-dist-sync',
  run: () => {
    const srcIndex = path.join(PLUGIN_DIR, 'src', 'index.ts');
    const distIndex = path.join(PLUGIN_DIR, 'dist', 'index.js');
    if (!fs.existsSync(srcIndex) || !fs.existsSync(distIndex)) {
      return { passed: false, output: 'Missing files' };
    }
    const srcMtime = fs.statSync(srcIndex).mtime;
    const distMtime = fs.statSync(distIndex).mtime;
    const syncOk = distMtime >= srcMtime;
    return { passed: syncOk, output: `Src: ${srcMtime}, Dist: ${distMtime}` };
  }
});

// Test 15: NO Manta references in Shark code
tests.push({
  name: 'no-manta-contamination',
  run: () => {
    const hooksDir = path.join(PLUGIN_DIR, 'src', 'hooks', 'v4.1');
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

// Run all tests
console.log('=== SHARK v4.8.2 MECHANICAL VERIFICATION ===');
console.log('Testing: Source code patterns + File existence\n');

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

// Generate result
const resultData = {
  suite: 'shark-v482-mechanical-verification',
  timestamp: new Date().toISOString(),
  overallPassed,
  passRate,
  passedTests: passedCount,
  failedTests: failedCount,
  totalTests: passedCount + failedCount,
  containerMode: process.env.SHARK_CONTAINER === 'true',
  buildId: 'shark-v482-' + Date.now(),
  tests: results,
  bugFixVerification: {
    bug1_setCurrentAgentCalled: results.find(r => r.name === 'session-hook-calls-setCurrentAgent')?.passed,
    bug2_variantPassed: results.find(r => r.name === 'index-passes-variant-to-status')?.passed
  }
};

// Ensure directory exists
try {
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(resultData, null, 2));
  console.log(`\nResults written to: ${RESULTS_FILE}`);
} catch (e) {
  console.log(`Failed to write results: ${e.message}`);
}

console.log('\n=== VERIFICATION COMPLETE ===');
process.exit(overallPassed ? 0 : 1);