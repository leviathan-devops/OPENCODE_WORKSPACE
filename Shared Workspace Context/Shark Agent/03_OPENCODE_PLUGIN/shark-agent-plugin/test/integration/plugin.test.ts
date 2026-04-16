import { describe, it, expect, beforeAll } from 'bun:test';
import sharkAgentPlugin from '../../dist/index.js';

describe('Shark Agent Plugin Integration Tests', () => {
  let mockInput: any;

  beforeAll(() => {
    mockInput = {
      client: {
        question: {
          reply: async () => {
            return { answers: ['Micro Engineer'] };
          }
        }
      },
      directory: process.cwd(),
      serverUrl: new URL('http://localhost:3000'),
      project: {
        id: 'test',
        worktree: 'test',
        name: 'Test Project'
      },
      $: {}
    };
  });

  it('should load without errors', async () => {
    const hooks = await sharkAgentPlugin(mockInput);
    expect(hooks).toBeDefined();
    expect(hooks['chat.message']).toBeDefined();
    expect(hooks['tool.execute.before']).toBeDefined();
    expect(hooks['chat.params']).toBeDefined();
    expect(hooks.tool).toBeDefined();
  });

  it('should configure API keys', () => {
    expect(process.env.DEEPSEEK_API_KEY).toBe('sk-e8e93e31b582423e9fdaa4ab8e9347e2');
    expect(process.env.GLM_API_KEY).toBe('71cda1864f0f4e15b076b0f24d56753e.4SwmFVzcRiWmT3r1');
  });

  it('should process plugin initialization completely', async () => {
    const startTime = Date.now();
    const hooks = await sharkAgentPlugin(mockInput);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(5000);
    expect(hooks).toBeDefined();
  });

  it('should have working chat.message hook', async () => {
    const hooks = await sharkAgentPlugin(mockInput);
    try {
      await hooks['chat.message']({ sessionID: 'test-session', agent: 'test', model: { providerID: 'test', modelID: 'test' }, messageID: 'test-msg', variant: 'test' }, { message: { role: 'user', parts: [] }, parts: [] });
      expect(true).toBe(true);
    } catch (error: any) {
      throw new Error(`chat.message hook failed: ${error.message}`);
    }
  });

  it('should have working tool.execute.before hook', async () => {
    const hooks = await sharkAgentPlugin(mockInput);
    try {
      await hooks['tool.execute.before']({ tool: 'write_file', callID: 'test1', sessionID: 'session1' }, { args: {} });
      expect(true).toBe(true);
    } catch (error: any) {
      throw new Error(`tool.execute.before hook failed: ${error.message}`);
    }
  });

  it('should have working chat.params hook', async () => {
    const hooks = await sharkAgentPlugin(mockInput);
    try {
      await hooks['chat.params']({ sessionID: 'test', agent: 'test-agent', model: { providerID: 'test', modelID: 'test-model' }, provider: { source: 'env', info: { name: 'test' }, options: {} }, message: { role: 'user', parts: [] } }, { temperature: 0.7, topP: 0.9, topK: 40, options: {} });
      expect(true).toBe(true);
    } catch (error: any) {
      throw new Error(`chat.params hook failed: ${error.message}`);
    }
  });
});
