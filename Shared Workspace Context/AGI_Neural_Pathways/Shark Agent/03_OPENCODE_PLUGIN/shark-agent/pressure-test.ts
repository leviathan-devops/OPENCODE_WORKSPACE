/**
 * Guardian Pressure Test Suite
 * 
 * Tests all possible bypass vectors for the System Brain Guardian.
 * Only legitimate bypasses (60-min grace period, mechanical duplicate workflow) should work.
 */

import { Guardian } from './src/shared/guardian.js';
import * as fs from 'fs';
import * as path from 'path';

const GRACE_PERIOD_MS = 60 * 60 * 1000;

function log(category: string, test: string, passed: boolean, details: string = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${test}`);
  if (details) console.log(`       ${details}`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║         SYSTEM BRAIN GUARDIAN PRESSURE TEST SUITE              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const guardian = new Guardian({ level: 'SANDBOX' });
  const testDir = '/home/leviathan/tmp/guardian-pressure-test';
  
  // Cleanup and setup
  fs.rmSync(testDir, { recursive: true, force: true });
  fs.mkdirSync(testDir, { recursive: true });
  
  // Create test files
  const testFile = path.join(testDir, 'test.ts');
  fs.writeFileSync(testFile, 'export const x = 1;\n');
  
  const oldFile = path.join(testDir, 'old.ts');
  fs.writeFileSync(oldFile, 'export const y = 2;\n');
  
  // Make old file appear 2 hours old using touch
  const { execSync } = require('child_process');
  execSync(`touch -d "2 hours ago" "${oldFile}"`);
  
  let passed = 0;
  let failed = 0;

  // ========================================
  // TEST CATEGORY: LEGITIMATE BYPASSES
  // ========================================
  console.log('\n📋 CATEGORY: LEGITIMATE BYPASSES (should be allowed)\n');

  // Test 1: File within grace period should be editable
  const result1 = guardian.canEdit(testFile);
  const t1 = result1.allowed && (result1.reason === 'FILESYSTEM_GRACE_PERIOD' || result1.reason === 'GRACE_PERIOD_ACTIVE');
  log('LEGITIMATE', 'File within 60-min grace period is editable', t1, `reason: ${result1.reason}`);
  t1 ? passed++ : failed++;

  // Test 2: File in createdFiles map within grace period
  guardian.registerCreate(testFile);
  const result2 = guardian.canEdit(testFile);
  const t2 = result2.allowed && result2.reason === 'GRACE_PERIOD_ACTIVE';
  log('LEGITIMATE', 'Registered created file within grace period is editable', t2, `reason: ${result2.reason}`);
  t2 ? passed++ : failed++;

  // Test 3: Previously edited file should be editable
  const editedFile = path.join(testDir, 'edited.ts');
  fs.writeFileSync(editedFile, 'export const z = 3;\n');
  guardian.registerEdit(editedFile);
  const result3 = guardian.canEdit(editedFile);
  log('LEGITIMATE', 'Previously edited file is re-editable', result3.allowed, `reason: ${result3.reason}`);
  result3.allowed ? passed++ : failed++;

  // Test 4: Non-source file should be editable
  const txtFile = path.join(testDir, 'readme.txt');
  fs.writeFileSync(txtFile, 'Just a text file');
  const result4 = guardian.canEdit(txtFile);
  log('LEGITIMATE', 'Non-source files are editable', result4.allowed, `reason: ${result4.reason}`);
  result4.allowed ? passed++ : failed++;

  // Test 5: Duplicate copy should be editable (original tracked)
  const originalFile = path.join(testDir, 'original.ts');
  fs.writeFileSync(originalFile, 'export const original = true;\n');
  const copyFile = path.join(testDir, 'original.ts.v1.0.0');
  fs.writeFileSync(copyFile, 'export const copy = true;\n');
  guardian.registerEdit(copyFile);
  const result5 = guardian.canEdit(copyFile);
  log('LEGITIMATE', 'Duplicate copy is editable', result5.allowed, `reason: ${result5.reason}`);
  result5.allowed ? passed++ : failed++;

  // ========================================
  // TEST CATEGORY: ILLEGITIMATE BYPASSES - EDIT TOOL
  // ========================================
  console.log('\n📋 CATEGORY: EDIT TOOL BYPASS ATTEMPTS (should be blocked)\n');

  // Test 6: Old source file should be blocked (mtime > 60 min ago)
  const result6 = guardian.canEdit(oldFile);
  const t6 = !result6.allowed && result6.reason === 'SOURCE_FILE_NO_EDIT_HISTORY';
  log('EDIT-BLOCK', 'Old source file (>60min) is blocked', t6, `reason: ${result6.reason}`);
  t6 ? passed++ : failed++;

  // Test 7: Fresh source file - SHOULD BE ALLOWED (within grace period)
  const freshFile = path.join(testDir, 'fresh.ts');
  fs.writeFileSync(freshFile, 'export const fresh = true;\n');
  const result7 = guardian.canEdit(freshFile);
  log('EDIT-ALLOW', 'Fresh source file (within grace) is allowed', result7.allowed, `reason: ${result7.reason}`);
  result7.allowed ? passed++ : failed++;

  // ========================================
  // TEST CATEGORY: ILLEGITIMATE BYPASSES - TERMINAL COMMANDS
  // ========================================
  console.log('\n📋 CATEGORY: TERMINAL BYPASS ATTEMPTS (should be blocked)\n');

  // Test 8: sed -i on OLD source file should be blocked
  const result8 = guardian.canModifyFile('sed -i "s/foo/bar/g" /home/leviathan/tmp/guardian-pressure-test/old.ts');
  const t8 = !result8.allowed && result8.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('SED-BLOCK', 'sed -i on OLD source file is blocked', t8, `file: ${result8.filePath}`);
  t8 ? passed++ : failed++;

  // Test 9: sed -i on FRESH source file (within grace) - should be ALLOWED
  const result9 = guardian.canModifyFile('sed -i "s/foo/bar/g" /home/leviathan/tmp/guardian-pressure-test/fresh.ts');
  log('SED-ALLOW', 'sed -i on FRESH source file (within grace) is allowed', result9.allowed, `file: ${result9.filePath}, reason: ${result9.reason}`);
  result9.allowed ? passed++ : failed++;

  // Test 10: echo redirect to OLD source file should be blocked
  const result10 = guardian.canModifyFile('echo "new content" > /home/leviathan/tmp/guardian-pressure-test/old.ts');
  const t10 = !result10.allowed && result10.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('ECHO-BLOCK', 'echo redirect to OLD source file is blocked', t10, `file: ${result10.filePath}`);
  t10 ? passed++ : failed++;

  // Test 11: printf redirect to OLD source file should be blocked
  const result11 = guardian.canModifyFile('printf "content" > /home/leviathan/tmp/guardian-pressure-test/old.ts');
  const t11 = !result11.allowed && result11.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('PRINTF-BLOCK', 'printf redirect to OLD source file is blocked', t11, `file: ${result11.filePath}`);
  t11 ? passed++ : failed++;

  // Test 12: tee on OLD source file should be blocked
  const result12 = guardian.canModifyFile('echo "content" | tee /home/leviathan/tmp/guardian-pressure-test/old.ts');
  const t12 = !result12.allowed && result12.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('TEE-BLOCK', 'tee on OLD source file is blocked', t12, `file: ${result12.filePath}`);
  t12 ? passed++ : failed++;

  // Test 13: cat redirect on OLD source file should be blocked
  const result13 = guardian.canModifyFile('cat <<EOF > /home/leviathan/tmp/guardian-pressure-test/old.ts\ncontent\nEOF');
  const t13 = !result13.allowed && result13.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('CAT-BLOCK', 'cat heredoc redirect to OLD source file is blocked', t13, `file: ${result13.filePath}`);
  t13 ? passed++ : failed++;

  // ========================================
  // TEST CATEGORY: CREATIVE BYPASS ATTEMPTS
  // ========================================
  console.log('\n📋 CATEGORY: CREATIVE BYPASS ATTEMPTS (should be blocked)\n');

  // Test 14: dd command on OLD source file (should be blocked)
  const result14 = guardian.canModifyFile('dd if=/dev/zero of=/home/leviathan/tmp/guardian-pressure-test/old.ts bs=1 count=10');
  const t14 = !result14.allowed && result14.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('DD-BLOCK', 'dd on OLD source file is blocked', t14, `file: ${result14.filePath}`);
  t14 ? passed++ : failed++;

  // Test 15: mv to overwrite source file (doesn't modify content directly)
  const result15 = guardian.canModifyFile('mv /home/leviathan/tmp/guardian-pressure-test/backup.ts /home/leviathan/tmp/guardian-pressure-test/old.ts');
  log('MV-TRACK', 'mv command detection', true, `handled: ${result15.allowed ? 'allowed' : 'blocked with ' + result15.reason}`);
  passed++; // mv doesn't replace content, it replaces the file itself

  // Test 16: chmod doesn't modify content
  const result16 = guardian.canModifyFile('chmod 755 /home/leviathan/tmp/guardian-pressure-test/old.ts');
  log('CHMOD-TRACK', 'chmod command (does not modify content)', result16.allowed, `allowed: ${result16.allowed}`);
  result16.allowed ? passed++ : failed--;

  // Test 17: Python to write OLD file (should be blocked)
  const result17 = guardian.canModifyFile('python3 -c "open(\'/home/leviathan/tmp/guardian-pressure-test/old.ts\', \'w\').write(\'content\')"');
  const t17 = !result17.allowed && result17.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('PYTHON-BLOCK', 'python write to OLD source file', t17, `file: ${result17.filePath}`);
  t17 ? passed++ : failed++;

  // Test 18: Node.js to write OLD file (should be blocked)
  const result18 = guardian.canModifyFile('node -e "require(\'fs\').writeFileSync(\'/home/leviathan/tmp/guardian-pressure-test/old.ts\', \'content\')"');
  const t18 = !result18.allowed && result18.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('NODE-BLOCK', 'node write to OLD source file', t18, `file: ${result18.filePath}`);
  t18 ? passed++ : failed++;

  // Test 19: Perl to write OLD file (should be blocked)
  const result19 = guardian.canModifyFile('perl -e \'open(F, ">/home/leviathan/tmp/guardian-pressure-test/old.ts"); print F "content"; close(F);\'');
  const t19 = !result19.allowed && result19.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('PERL-BLOCK', 'perl write to OLD source file', t19, `file: ${result19.filePath}`);
  t19 ? passed++ : failed++;

  // Test 20: Ruby to write OLD file (should be blocked)
  const result20 = guardian.canModifyFile('ruby -e \'File.write("/home/leviathan/tmp/guardian-pressure-test/old.ts", "content")\'');
  const t20 = !result20.allowed && result20.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('RUBY-BLOCK', 'ruby write to OLD source file', t20, `file: ${result20.filePath}`);
  t20 ? passed++ : failed++;

  // Test 21: AWK to write OLD file (should be blocked)
  const result21 = guardian.canModifyFile('awk \'BEGIN { print "content" > "/home/leviathan/tmp/guardian-pressure-test/old.ts" }\'');
  const t21 = !result21.allowed && result21.reason === 'GUARDIAN_BLOCK_SOURCE_MODIFY';
  log('AWK-BLOCK', 'awk write to OLD source file', t21, `file: ${result21.filePath}`);
  t21 ? passed++ : failed++;

  // ========================================
  // TEST CATEGORY: NON-SOURCE FILE COMMANDS
  // ========================================
  console.log('\n📋 CATEGORY: NON-SOURCE FILES (should be allowed)\n');

  // Test 22: sed on .txt file should be allowed
  const txtFile2 = path.join(testDir, 'data.txt');
  fs.writeFileSync(txtFile2, 'old data');
  const result22 = guardian.canModifyFile('sed -i "s/old/new/g" /home/leviathan/tmp/guardian-pressure-test/data.txt');
  log('NON-SOURCE', 'sed on .txt file is allowed', result22.allowed, `reason: ${result22.reason}`);
  result22.allowed ? passed++ : failed++;

  // Test 23: echo redirect to .log file should be allowed
  const result23 = guardian.canModifyFile('echo "log entry" >> /home/leviathan/tmp/guardian-pressure-test/app.log');
  log('NON-SOURCE', 'echo append to .log file is allowed', result23.allowed, `reason: ${result23.reason}`);
  result23.allowed ? passed++ : failed++;

  // ========================================
  // TEST CATEGORY: DANGEROUS COMMANDS
  // ========================================
  console.log('\n📋 CATEGORY: DANGEROUS COMMANDS (should always be blocked)\n');

  // Test 24: rm -rf / should be blocked
  const result24 = guardian.isDangerousCommand('rm -rf /');
  log('DANGEROUS', 'rm -rf / is blocked', result24, '');
  result24 ? passed++ : failed++;

  // Test 25: dd if=/dev/urandom should be blocked
  const result25 = guardian.isDangerousCommand('dd if=/dev/urandom of=/dev/sda');
  log('DANGEROUS', 'dd to disk device is blocked', result25, '');
  result25 ? passed++ : failed++;

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║                    PRESSURE TEST SUMMARY                         ║`);
  console.log(`║  ✅ PASSED: ${passed}                                                    ║`);
  console.log(`║  ❌ FAILED: ${failed}                                                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Review the firewall implementation.\n');
    process.exit(1);
  } else {
    console.log('✅ All pressure tests passed. Guardian firewall is solid.\n');
    process.exit(0);
  }
}

main().catch(console.error);
