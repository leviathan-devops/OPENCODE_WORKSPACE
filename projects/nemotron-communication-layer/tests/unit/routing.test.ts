import { describe, it, expect, beforeEach } from 'vitest';
import { AgentRouter } from '../../src/routing';
import { Message, CompactedMessage, Priority } from '../../src/types';

describe('AgentRouter', () => {
  let router: AgentRouter;

  beforeEach(() => {
    router = new AgentRouter();
  });

  describe('registerAgent', () => {
    it('registers agents with correct type', () => {
      router.registerAgent('hephaestus-1', 'hephaestus');
      router.registerAgent('oracle-1', 'oracle');

      const agents = router.getAllAgents();
      expect(agents['hephaestus-1'].type).toBe('hephaestus');
      expect(agents['oracle-1'].type).toBe('oracle');
    });

    it('sets initial status to idle', () => {
      router.registerAgent('hephaestus-1', 'hephaestus');
      expect(router.getAgentStatus('hephaestus-1')?.status).toBe('idle');
    });
  });

  describe('updateAgentStatus', () => {
    it('updates agent status', () => {
      router.registerAgent('hephaestus-1', 'hephaestus');
      router.updateAgentStatus('hephaestus-1', 'active', 'task-123');

      const status = router.getAgentStatus('hephaestus-1');
      expect(status?.status).toBe('active');
      expect(status?.currentTask).toBe('task-123');
    });
  });

  describe('route', () => {
    it('routes to single recipient', () => {
      router.registerAgent('hephaestus-1', 'hephaestus');

      const msg: Message = {
        id: 'msg-1',
        from: 'orchestrator',
        to: 'hephaestus-1',
        content: 'Build this feature',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const compacted: CompactedMessage = {
        originalId: 'msg-1',
        targetTokens: 6000,
        actualTokens: 100,
        content: 'Build this feature',
        metadata: {
          compressionRatio: 1,
          originalTokens: 100,
          priority: Priority.HIGH,
          classification: '6k' as any,
          usedFullBudget: false,
        },
      };

      const result = router.route(msg, compacted);
      expect(result.success).toBe(true);
      expect(result.delivered).toHaveLength(1);
      expect(result.delivered[0].recipient).toBe('hephaestus-1');
    });

    it('routes to multiple recipients', () => {
      router.registerAgent('hephaestus-1', 'hephaestus');
      router.registerAgent('hephaestus-2', 'hephaestus');

      const msg: Message = {
        id: 'msg-2',
        from: 'orchestrator',
        to: ['hephaestus-1', 'hephaestus-2'],
        content: 'Build this feature',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const compacted: CompactedMessage = {
        originalId: 'msg-2',
        targetTokens: 6000,
        actualTokens: 100,
        content: 'Build this feature',
        metadata: {
          compressionRatio: 1,
          originalTokens: 100,
          priority: Priority.HIGH,
          classification: '6k' as any,
          usedFullBudget: false,
        },
      };

      const result = router.route(msg, compacted);
      expect(result.success).toBe(true);
      expect(result.delivered).toHaveLength(2);
    });

    it('routes to orchestrator without registration', () => {
      const msg: Message = {
        id: 'msg-3',
        from: 'hephaestus-1',
        to: 'orchestrator',
        content: 'Done',
        timestamp: new Date(),
        priority: Priority.LOW,
      };

      const compacted: CompactedMessage = {
        originalId: 'msg-3',
        targetTokens: 2000,
        actualTokens: 10,
        content: 'Done',
        metadata: {
          compressionRatio: 1,
          originalTokens: 10,
          priority: Priority.LOW,
          classification: '2k' as any,
          usedFullBudget: false,
        },
      };

      const result = router.route(msg, compacted);
      expect(result.success).toBe(true);
      expect(result.delivered[0].recipient).toBe('orchestrator');
    });

    it('fails for unknown recipient', () => {
      const msg: Message = {
        id: 'msg-4',
        from: 'orchestrator',
        to: 'unknown-agent',
        content: 'Hello',
        timestamp: new Date(),
        priority: Priority.LOW,
      };

      const compacted: CompactedMessage = {
        originalId: 'msg-4',
        targetTokens: 2000,
        actualTokens: 10,
        content: 'Hello',
        metadata: {
          compressionRatio: 1,
          originalTokens: 10,
          priority: Priority.LOW,
          classification: '2k' as any,
          usedFullBudget: false,
        },
      };

      const result = router.route(msg, compacted);
      expect(result.success).toBe(false);
      expect(result.error).toBe('No valid recipients');
    });
  });

  describe('getActiveAgents', () => {
    it('returns only active agents', () => {
      router.registerAgent('hephaestus-1', 'hephaestus');
      router.registerAgent('hephaestus-2', 'hephaestus');
      router.registerAgent('hephaestus-3', 'hephaestus');

      router.updateAgentStatus('hephaestus-1', 'active');
      router.updateAgentStatus('hephaestus-3', 'active');

      const active = router.getActiveAgents();
      expect(active).toHaveLength(2);
      expect(active).toContain('hephaestus-1');
      expect(active).toContain('hephaestus-3');
    });
  });
});
