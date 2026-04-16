/**
 * tests/unit/persistence/swarm-state.test.ts
 * 
 * Swarm state manager tests.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createSwarmStateManager } from '../../../src/coordination/persistence/swarm-state.js';
import { randomId } from '../../../src/coordination/utils.js';
import { rm } from 'fs/promises';

describe('SwarmStateManager', () => {
  const testDir = '/tmp/swarm-state-test';
  
  beforeEach(async () => {
    // Clean up before each test to ensure fresh state
    await rm(testDir, { recursive: true, force: true });
  });
  
  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });
  
  describe('Plan operations', () => {
    it('should return null when no plan is loaded', async () => {
      const swarmState = createSwarmStateManager(testDir);
      const plan = await swarmState.loadPlan();
      expect(plan).toBeNull();
    });
    
    it('should save and load a plan', async () => {
      const swarmState = createSwarmStateManager(testDir);
      const plan = {
        id: randomId('plan'),
        title: 'Test Plan',
        spiderId: 'test',
        phases: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      await swarmState.savePlan(plan);
      
      const loaded = await swarmState.loadPlan();
      expect(loaded).not.toBeNull();
      expect(loaded?.id).toBe(plan.id);
      expect(loaded?.title).toBe('Test Plan');
    });
    
    it('should sync a plan and update timestamp', async () => {
      const swarmState = createSwarmStateManager(testDir);
      const plan = {
        id: randomId('plan'),
        title: 'Test Plan',
        spiderId: 'test',
        phases: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const originalTime = plan.updatedAt;
      const synced = await swarmState.syncPlan(plan);
      
      expect(synced.updatedAt).toBeGreaterThanOrEqual(originalTime);
    });
  });
  
  describe('generatePlanMarkdown', () => {
    it('should generate markdown for a plan', async () => {
      const swarmState = createSwarmStateManager(testDir);
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
      
      await swarmState.savePlan(plan);
      const markdown = await swarmState.generatePlanMarkdown();
      
      expect(markdown).toContain('# Test Plan');
      expect(markdown).toContain('Phase 1');
      expect(markdown).toContain('Test task');
    });
  });
});
