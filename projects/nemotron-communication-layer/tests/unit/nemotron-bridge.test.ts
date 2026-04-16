import { describe, it, expect, beforeEach } from 'vitest';
import { NemotronBridge } from '../../src/nemotron-bridge';
import { Priority, Message } from '../../src/types';

describe('NemotronBridge', () => {
  let bridge: NemotronBridge;

  beforeEach(() => {
    bridge = new NemotronBridge();
    bridge.registerAgent('hephaestus-1', 'hephaestus');
    bridge.registerAgent('hephaestus-2', 'hephaestus');
  });

  describe('processMessage', () => {
    it('processes and returns compacted message', () => {
      const msg: Message = {
        id: 'msg-1',
        from: 'orchestrator',
        to: 'hephaestus-1',
        content: 'Build the authentication module',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const result = bridge.processMessage(msg);
      expect(result.originalId).toBe('msg-1');
      expect(result.content).toBeDefined();
    });

    it('stores message in context store', () => {
      const msg: Message = {
        id: 'msg-2',
        from: 'orchestrator',
        to: 'hephaestus-1',
        content: 'Important context about the project',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      bridge.processMessage(msg);
      const contextTokens = bridge.getFullContextTokens();
      expect(contextTokens.current).toBeGreaterThan(0);
    });
  });

  describe('handleMoreContextRequest', () => {
    it('returns relevant context from store', () => {
      // Store some context first
      bridge.processMessage({
        id: 'ctx-1',
        from: 'hephaestus-1',
        to: 'orchestrator',
        content: 'Authentication module uses OAuth2 with JWT tokens',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      });

      bridge.processMessage({
        id: 'ctx-2',
        from: 'hephaestus-2',
        to: 'orchestrator',
        content: 'Database schema includes users table',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      });

      const request: Message = {
        id: 'req-1',
        from: 'orchestrator',
        to: 'hephaestus-1',
        content: 'more context about authentication',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const result = bridge.handleMoreContextRequest(request);
      expect(result).toContain('Authentication');
    });

    it('returns up to 72k tokens', () => {
      // Store lots of context
      for (let i = 0; i < 100; i++) {
        bridge.processMessage({
          id: `ctx-${i}`,
          from: 'hephaestus-1',
          to: 'orchestrator',
          content: 'x'.repeat(1000),
          timestamp: new Date(),
          priority: Priority.MEDIUM,
        });
      }

      const request: Message = {
        id: 'req-2',
        from: 'orchestrator',
        to: 'hephaestus-1',
        content: 'more context',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const result = bridge.handleMoreContextRequest(request);
      const estimatedTokens = Math.ceil(result.length / 4);
      expect(estimatedTokens).toBeLessThanOrEqual(72000);
    });
  });

  describe('getMetrics', () => {
    it('tracks message metrics', () => {
      bridge.processMessage({
        id: 'msg-3',
        from: 'hephaestus-1',
        to: 'orchestrator',
        content: 'Done',
        timestamp: new Date(),
        priority: Priority.LOW,
      });

      bridge.processMessage({
        id: 'msg-4',
        from: 'hephaestus-2',
        to: 'orchestrator',
        content: 'Working on it',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      });

      const metrics = bridge.getMetrics();
      expect(metrics.messagesByClass['2k']).toBe(2);
    });
  });

  describe('getFullContextTokens', () => {
    it('tracks context utilization', () => {
      bridge.processMessage({
        id: 'msg-5',
        from: 'hephaestus-1',
        to: 'orchestrator',
        content: 'x'.repeat(4000),
        timestamp: new Date(),
        priority: Priority.LOW,
      });

      const context = bridge.getFullContextTokens();
      expect(context.current).toBe(1000); // 4000 chars / 4
      expect(context.max).toBe(1000000);
      expect(context.utilization).toBeGreaterThan(0);
    });
  });

  describe('registerAgent', () => {
    it('registers new agent types', () => {
      bridge.registerAgent('oracle-1', 'oracle');
      bridge.registerAgent('momus-1', 'momus');
      bridge.registerAgent('explore-1', 'explore');
      bridge.registerAgent('librarian-1', 'librarian');
    });
  });
});
