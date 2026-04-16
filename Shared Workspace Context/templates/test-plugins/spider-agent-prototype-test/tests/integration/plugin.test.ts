import { describe, it, expect, beforeAll } from 'bun:test';
import { resolve } from 'path';

const PLUGIN_PATH = resolve(__dirname, '../../dist/index.js');

describe('Plugin Integration Tests', () => {
  let plugin: any;
  
  beforeAll(async () => {
    // Try to load the plugin
    try {
      const mod = await import(PLUGIN_PATH);
      plugin = mod.default;
    } catch (err) {
      console.error('Failed to load plugin:', err);
    }
  });
  
  describe('Plugin Loading', () => {
    it('should have dist file', () => {
      const { existsSync } = require('fs');
      expect(existsSync(PLUGIN_PATH)).toBe(true);
    });
    
    it('should export a function', () => {
      expect(typeof plugin).toBe('function');
    });
    
    it('should return hooks when called', async () => {
      if (!plugin) {
        console.warn('Plugin not loaded, skipping hook test');
        return;
      }
      
      const hooks = await plugin();
      expect(hooks).toBeDefined();
      expect(typeof hooks).toBe('object');
    });
    
    it('should have event hook', async () => {
      if (!plugin) {
        console.warn('Plugin not loaded, skipping event hook test');
        return;
      }
      
      const hooks = await plugin();
      expect(hooks.event).toBeDefined();
      expect(typeof hooks.event).toBe('function');
    });
    
    it('should have tool hooks', async () => {
      if (!plugin) {
        console.warn('Plugin not loaded, skipping tool hook test');
        return;
      }
      
      const hooks = await plugin();
      expect(hooks.tool).toBeDefined();
      expect(typeof hooks.tool).toBe('object');
      
      // Should have our tools
      expect(hooks.tool.spider_agent_task).toBeDefined();
      expect(hooks.tool.spider_health_check).toBeDefined();
    });
    
    it('should have experimental hooks', async () => {
      if (!plugin) {
        console.warn('Plugin not loaded, skipping experimental hook test');
        return;
      }
      
      const hooks = await plugin();
      expect(hooks['experimental.chat.messages.transform']).toBeDefined();
      expect(hooks['experimental.chat.system.transform']).toBeDefined();
      expect(hooks['experimental.session.compacting']).toBeDefined();
    });
    
    it('should have command hook', async () => {
      if (!plugin) {
        console.warn('Plugin not loaded, skipping command hook test');
        return;
      }
      
      const hooks = await plugin();
      expect(hooks['command.execute.before']).toBeDefined();
    });
  });
  
  describe('Tool Execution', () => {
    it('should execute status action', async () => {
      if (!plugin) {
        console.warn('Plugin not loaded, skipping tool execution test');
        return;
      }
      
      const hooks = await plugin();
      const tool = hooks.tool.spider_agent_task;
      
      const result = await tool.execute({ 
        action: 'status', 
        taskId: undefined, 
        query: undefined 
      }, {
        sessionID: 'test-session',
        messageID: 'test-message',
        agent: 'test',
        directory: '/tmp',
        worktree: '/tmp',
        abort: new AbortController().signal,
        metadata: () => {},
        ask: async () => {},
      });
      
      const parsed = JSON.parse(result);
      expect(parsed.plugin).toBe('SpiderAgentPrototype');
      expect(parsed.version).toBe('0.1.0');
    });
    
    it('should execute health check', async () => {
      if (!plugin) {
        console.warn('Plugin not loaded, skipping health check test');
        return;
      }
      
      const hooks = await plugin();
      const tool = hooks.tool.spider_health_check;
      
      const result = await tool.execute({ 
        force: false
      }, {
        sessionID: 'test-session',
        messageID: 'test-message',
        agent: 'test',
        directory: '/tmp',
        worktree: '/tmp',
        abort: new AbortController().signal,
        metadata: () => {},
        ask: async () => {},
      });
      
      const parsed = JSON.parse(result);
      expect(parsed.endpoint).toBeDefined();
      expect(typeof parsed.latencyMs).toBe('number');
    });
  });
});
