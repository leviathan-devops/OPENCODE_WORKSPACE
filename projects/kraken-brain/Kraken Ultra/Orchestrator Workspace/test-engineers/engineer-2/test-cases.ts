import { AutoDebugEngine, analyzeError } from './autodebug-test';

const engine = new AutoDebugEngine();

console.log('='.repeat(60));
console.log('🦈 AutoDebug Module - Test Cases');
console.log('='.repeat(60));
console.log('');

function runTest(name: string, errorOutput: string) {
  console.log(`📋 Test: ${name}`);
  console.log('─'.repeat(60));
  console.log('Input Error:');
  console.log(errorOutput);
  console.log('');
  
  const detected = engine.analyze(errorOutput);
  
  if (detected.length === 0) {
    console.log('❌ No known errors detected');
  } else {
    console.log(engine.generateQuickFixReport(detected));
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('');
}

const testCases = [
  {
    name: 'Docker Volume Permission Error',
    output: 'Error: EACCES: permission denied, open \'/container/path/.guardian/protected/config.json\'',
  },
  {
    name: 'npm EACCES Error',
    output: 'npm ERR! code EACCES\nnpm ERR! errno -13\nnpm ERR! EACCES: permission denied, mkdir \'/app/node_modules\'',
  },
  {
    name: 'Docker Compose Version Obsolete',
    output: 'The attribute `version` is obsolete, it will be ignored, please remove it from your docker-compose.yml file',
  },
  {
    name: 'Missing npm Dependency',
    output: 'Error: Cannot find module \'@types/node\'\nRequire stack:\n- /app/src/cli.ts',
  },
  {
    name: 'npm Peer Dependency Conflict',
    output: 'npm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! peer dep missing: eslint@^8.0.0',
  },
  {
    name: 'ts-node Not Found',
    output: '/bin/sh: ts-node: not found\n/usr/local/bin/ts-node: No such file or directory',
  },
  {
    name: 'TypeScript Compiler Not Found',
    output: '/bin/sh: tsc: not found\nError: tsc command not found in PATH',
  },
  {
    name: 'TypeScript Compilation Error',
    output: 'error TS2345: Argument of type \'string\' is not assignable to parameter of type \'number\'.\nerror TS2304: Cannot find name \'process\'',
  },
  {
    name: 'Unknown Error',
    output: 'Some random error that is not in the database',
  },
  {
    name: 'Multiple Errors',
    output: 'npm ERR! code EACCES\nError: Cannot find module \'typescript\'\nerror TS2304: Cannot find name \'process\'',
  },
];

testCases.forEach(test => runTest(test.name, test.output));

console.log('📊 Prevention Tips by Category');
console.log('='.repeat(60));
console.log('');
console.log('Docker Tips:');
engine.getPreventionTips('docker').forEach(tip => console.log(`  → ${tip}`));
console.log('');
console.log('npm Tips:');
engine.getPreventionTips('npm').forEach(tip => console.log(`  → ${tip}`));
console.log('');
console.log('TypeScript Tips:');
engine.getPreventionTips('typescript').forEach(tip => console.log(`  → ${tip}`));
console.log('');
console.log('='.repeat(60));
