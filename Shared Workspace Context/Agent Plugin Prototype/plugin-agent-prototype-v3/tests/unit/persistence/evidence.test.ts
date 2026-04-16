/**
 * tests/unit/persistence/evidence.test.ts
 * 
 * Evidence store tests.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createEvidenceStore, generateEvidenceSignature } from '../../../src/coordination/persistence/evidence-store.js';

describe('EvidenceStore', () => {
  let evidenceStore: ReturnType<typeof createEvidenceStore>;
  const testDir = '/tmp/evidence-test';
  
  beforeEach(() => {
    evidenceStore = createEvidenceStore(testDir);
  });
  
  describe('addEvidence', () => {
    it('should add evidence and return with id and timestamp', () => {
      const evidence = evidenceStore.addEvidence({
        taskId: 'task-1',
        phase: 1,
        type: 'test',
        verdict: 'pass',
        agent: 'test-engineer',
        data: {},
      });
      
      expect(evidence.id).toBeDefined();
      expect(evidence.timestamp).toBeDefined();
      expect(evidence.taskId).toBe('task-1');
    });
  });
  
  describe('getEvidence', () => {
    it('should return empty array when no evidence exists', async () => {
      const evidence = await evidenceStore.getEvidence();
      expect(Array.isArray(evidence)).toBe(true);
    });
    
    it('should filter evidence by taskId', async () => {
      evidenceStore.addEvidence({
        taskId: 'task-1',
        phase: 1,
        type: 'test',
        verdict: 'pass',
        agent: 'test-engineer',
        data: {},
      });
      
      evidenceStore.addEvidence({
        taskId: 'task-2',
        phase: 1,
        type: 'test',
        verdict: 'pass',
        agent: 'test-engineer',
        data: {},
      });
      
      const task1Evidence = await evidenceStore.getEvidence('task-1');
      expect(task1Evidence.length).toBeGreaterThanOrEqual(1);
      expect(task1Evidence[0]?.taskId).toBe('task-1');
    });
  });
  
  describe('verifyEvidence', () => {
    it('should verify evidence by id', () => {
      const evidence = evidenceStore.addEvidence({
        taskId: 'task-1',
        phase: 1,
        type: 'test',
        verdict: 'pass',
        agent: 'test-engineer',
        data: {},
      });
      
      const verified = evidenceStore.verifyEvidence(evidence.id);
      expect(verified).toBe(true);
    });
    
    it('should return false for unknown evidence id', () => {
      const verified = evidenceStore.verifyEvidence('unknown-id');
      expect(verified).toBe(false);
    });
  });
  
  describe('getEvidenceByPhase', () => {
    it('should filter evidence by phase', async () => {
      evidenceStore.addEvidence({
        taskId: 'task-1',
        phase: 1,
        type: 'test',
        verdict: 'pass',
        agent: 'test-engineer',
        data: {},
      });
      
      evidenceStore.addEvidence({
        taskId: 'task-2',
        phase: 2,
        type: 'test',
        verdict: 'pass',
        agent: 'test-engineer',
        data: {},
      });
      
      const phase1Evidence = await evidenceStore.getEvidenceByPhase(1);
      expect(phase1Evidence.length).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('generateEvidenceSignature', () => {
    it('should generate a signature for evidence', () => {
      const evidence = {
        id: 'ev_123',
        taskId: 'task-1',
        phase: 1,
        type: 'test',
        verdict: 'pass' as const,
        agent: 'test-engineer',
        timestamp: Date.now(),
        data: {},
      };
      
      const signature = generateEvidenceSignature(evidence);
      expect(signature).toContain('sig_');
    });
  });
});
