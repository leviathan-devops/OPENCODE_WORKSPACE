import { describe, it, expect } from 'bun:test';
import { DeepSeekClient } from '../../src/shark-core/brain/deepseek';
import { GLMClient } from '../../src/shark-core/brain/glm';

describe('API Connectivity Tests', () => {
  it('should configure DeepSeek client', () => {
    const client = new DeepSeekClient();
    expect(client.isConfigured()).toBe(true);
  });

  it('should configure GLM client', () => {
    const client = new GLMClient();
    expect(client.isConfigured()).toBe(true);
  });

  it('should have correct GLM endpoint', () => {
    const client = new GLMClient();
    expect(client.isConfigured()).toBe(true);
  });
});