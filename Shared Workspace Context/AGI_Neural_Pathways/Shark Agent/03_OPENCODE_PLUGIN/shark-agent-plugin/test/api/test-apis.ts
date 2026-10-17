#!/usr/bin/env bun
/**
 * Real API Connectivity Test - Direct execution
 */

import { DeepSeekClient } from '../../src/shark-core/brain/deepseek';
import { GLMClient } from '../../src/shark-core/brain/glm';

console.log('\n🦈 Testing Real API Connectivity...\n');

// Set environment variables
process.env.DEEPSEEK_API_KEY = '<REDACTED_SET_VIA_ENV>';
process.env.GLM_API_KEY = '<REDACTED_SET_VIA_ENV>';

console.log('1. Testing DeepSeek API...');
const deepseekClient = new DeepSeekClient();

if (!deepseekClient.isConfigured()) {
  console.log('   ❌ DeepSeek: Not configured');
} else {
  console.log('   ✅ DeepSeek: Client configured');
  
  try {
    const result = await deepseekClient.plan('Say "test" in 3 words or less');
    console.log('   ✅ DeepSeek API call successful');
    console.log('   Response:', result.content?.substring(0, 100) || 'No content');
  } catch (e: any) {
    console.log('   ❌ DeepSeek API call failed:', e.message);
  }
}

console.log('\n2. Testing GLM API...');
const glmClient = new GLMClient();

if (!glmClient.isConfigured()) {
  console.log('   ❌ GLM: Not configured');
} else {
  console.log('   ✅ GLM: Client configured');
  console.log('   Endpoint: https://api.z.ai/api/coding/paas/v4/chat/completions');
  
  try {
    const result = await glmClient.execute('Say "test" in 3 words or less');
    console.log('   ✅ GLM API call successful');
    console.log('   Response:', result.content?.substring(0, 100) || 'No content');
  } catch (e: any) {
    console.log('   ❌ GLM API call failed:', e.message);
  }
}

console.log('\n✅ API connectivity test complete\n');
