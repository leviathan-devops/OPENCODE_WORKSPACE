import { GuardianTestSuite } from './guardian-test-module';
import * as path from 'path';
import * as fs from 'fs';

async function runTests() {
  const workspacePath = __dirname;
  const testSuite = new GuardianTestSuite(workspacePath);

  console.log('='.repeat(60));
  console.log('Guardian Test Module - Test Execution');
  console.log('='.repeat(60));
  console.log(`Workspace: ${workspacePath}\n`);

  const results = await testSuite.runAllTests();

  console.log(testSuite.generateReport());

console.log('\n' + '='.repeat(60));
console.log('Audit Log:');
console.log('='.repeat(60));
const auditLog = testSuite['guardian'].getAuditLog();
auditLog.forEach((entry, index) => {
  console.log(`${index + 1}. [${entry.timestamp}] ${entry.operation.toUpperCase()} ${entry.path} - ${entry.decision}`);
});

const reportPath = path.join(__dirname, 'test-results.md');
fs.writeFileSync(reportPath, testSuite.generateReport() + '\n\n## Audit Log\n\n' + 
  auditLog.map((e, i) => `${i + 1}. [${e.timestamp}] ${e.operation.toUpperCase()} ${e.path} - ${e.decision}`).join('\n'));

console.log(`\nTest report saved to: ${reportPath}`);
}

runTests().catch(console.error);
