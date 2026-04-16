/**
 * tests/unit/persistence/plugin-state.test.ts
 * 
 * Plugin state manager tests.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createPluginStateManager } from '../../../src/coordination/persistence/plugin-state.js';
import { randomId } from '../../../src/coordination/utils.js';
import { rm } from 'fs/promises';

describe('PluginStateManager', () => {
  const testDir = '/tmp/plugin-state-test';
  
  beforeEach(async () => {
    // Clean up before each test to ensure fresh state
    await rm(testDir, { recursive: true, force: true });
  });
  
  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });
  
  describe('Plan operations', () => {
    it('should return null when no plan is loaded', async () => {
      const pluginState = createPluginStateManager(testDir);
      const plan = await pluginState.loadPlan();
      expect(plan).toBeNull();
    });
    
    it('should save and load a plan', async () => {
      const pluginState = createPluginStateManager(testDir);
      const plan = {
        id: randomId('plan'),
        title: 'Test Plan',
        spiderId: 'test',
        phases: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await pluginState.savePlan(plan);
      
      const loaded = await pluginState.loadPlan();
      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(plan.id);
      expect(loaded?.title).toBe('Test Plan');
    });
    
    it('should sync a plan and update timestamp', async () => {
      const pluginState = createPluginStateManager(testDir);
      const plan = {
        id: randomId('plan'),
        title: 'Test Plan',
        spiderId: 'test',
        phases: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const originalTime = plan.updatedAt;
      const synced = await pluginState.syncPlan(plan);
      
      expect(synced.updatedAt).toBeGreaterThanOrEqual(originalTime);
    });
  });
  
  describe('generatePlanMarkdown', () => {
    it('should generate markdown for a plan', async () => {
      const pluginState = createPluginStateManager(testDir);
      const plan = {
        id: randomId('plan'),
        title: 'Test Plan',
        spiderId: 'test',
        phases: [
          {
            id: 1,
            name: 'Phase 1',
            status: 'in_progress' as const,
            tasks: [
              {
                id: '1.1',
                description: 'Test task',
                status: 'pending' as const,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await pluginState.savePlan(plan);
      const markdown = await pluginState.generatePlanMarkdown();
      
      expect(markdown).toContain('# Test Plan');
      expect(markdown).toContain('Phase 1');
      expect(markdown).toContain('Test task');
    });
  });
});
