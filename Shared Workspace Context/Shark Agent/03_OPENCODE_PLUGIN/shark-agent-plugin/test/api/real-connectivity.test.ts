#!/usr/bin/env bun
/**
 * Real API Connectivity Test
 * Tests actual API calls to DeepSeek and GLM
 */

import { DeepSeekClient } from '../../src/shark-core/brain/deepseek';
import { GLMClient } from '../../src/shark-core/brain/glm';

console.log('\n🦈 Testing Real API Connectivity...\n');

// Set environment variables
process.env.DEEPSEEK_API_KEY = '<REDACTED_SET_VIA_ENV>';
process.env.GLM_API_KEY = '<REDACTED_SET_VIA_ENV>';

async function testDeepSeek() {
  console.log('1. Testing DeepSeek API...');
  const client = new DeepSeekClient();
  
  if (!client.isConfigured()) {
    console.log('   ❌ DeepSeek: Not configured');
    return false;
  }
  
  console.log('   ✅ DeepSeek: Client configured');
  
  try {
    const result = await client.plan('Say "test" in 3 words or less');
    console.log('   ✅ DeepSeek API call successful');
    console.log('   Response:', result.content.substring(0, 100));
    return true;
  } catch (e: any) {
    console.log('   ❌ DeepSeek API call failed:', e.message);
    return false;
  }
}

async function testGLM() {
  console.log('\n2. Testing GLM API...');
  const client = new GLMClient();
  
  if (!client.isConfigured()) {
    console.log('   ❌ GLM: Not configured');
    return false;
  }
  
  console.log('   ✅ GLM: Client configured');
  console.log('   Endpoint: https://open.bigmodel.cn/api/paas/v4/coding-plan');
  
  try {
    const result = await client.execute('Say "test" in 3 words or less');
    console.log('   ✅ GLM API call successful');
    console.log('   Response:', result.content.substring(0, 100));
    return true;
  } catch (e: any) {
    console.log('   ❌ GLM API call failed:', e.message);
    return false;
  }
}

async function main() {
  const deepseekResult = await testDeepSeek();
  const glmResult = await testGLM();
  
  console.log('\n' + '='.repeat(50));
  console.log('RESULTS:');
  console.log('  DeepSeek:', deepseekResult ? '✅ PASS' : '❌ FAIL');
  console.log('  GLM:', glmResult ? '✅ PASS' : '❌ FAIL');
  console.log('='.repeat(50));
  
  if (deepseekResult && glmResult) {
    console.log('\n🦈 All API connectivity tests PASSED!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some API tests failed - check keys and endpoints\n');
    process.exit(1);
  }
}

main();
