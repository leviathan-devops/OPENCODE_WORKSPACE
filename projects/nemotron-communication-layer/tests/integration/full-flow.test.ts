import { describe, it, expect, beforeEach } from 'vitest';
import { NemotronBridge } from '../../src/nemotron-bridge';
import { MessageClassifier } from '../../src/message-classifier';
import { CompressionPipeline } from '../../src/compression';
import { AgentRouter } from '../../src/routing';
import { Priority, Message, MessageClass } from '../../src/types';

describe('Integration: Full Message Flow', () => {
  let bridge: NemotronBridge;
  let classifier: MessageClassifier;
  let compression: CompressionPipeline;
  let router: AgentRouter;

  beforeEach(() => {
    bridge = new NemotronBridge();
    classifier = new MessageClassifier();
    compression = new CompressionPipeline();
    router = new AgentRouter();

    router.registerAgent('hephaestus-1', 'hephaestus');
    router.registerAgent('hephaestus-2', 'hephaestus');
    router.registerAgent('oracle-1', 'oracle');
    router.registerAgent('momus-1', 'momus');
  });

  describe('classify → compress → route flow', () => {
    it('processes simple ack through full pipeline', () => {
      const msg: Message = {
        id: 'int-1',
        from: 'hephaestus-1',
        to: 'orchestrator',
        content: 'Understood',
        timestamp: new Date(),
        priority: Priority.LOW,
      };

      const classification = classifier.classifyMessage(msg);
      expect(classification).toBe(MessageClass.SIMPLE_ACK);

      const compacted = compression.compress(msg);
      expect(compacted.actualTokens).toBeLessThanOrEqual(2000);

      const routed = router.route(msg, compacted);
      expect(routed.success).toBe(true);
      expect(routed.delivered[0].tokens).toBe(compacted.actualTokens);
    });

    it('processes build prompt through full pipeline', () => {
      const msg: Message = {
        id: 'int-2',
        from: 'orchestrator',
        to: 'hephaestus-1',
        content: `Build Prompt: Create authentication module
        
Requirements:
- OAuth2 support
- JWT token management
- Session handling
- Rate limiting`,
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const classification = classifier.classifyMessage(msg);
      expect(classification).toBe(MessageClass.BUILD_PROMPT);

      const compacted = compression.compress(msg);
      expect(compacted.targetTokens).toBe(6000);

      const routed = router.route(msg, compacted);
      expect(routed.success).toBe(true);
    });

    it('processes escalation through full pipeline', () => {
      const msg: Message = {
        id: 'int-3',
        from: 'hephaestus-1',
        to: 'orchestrator',
        content: `[escalation] Critical blocker: Stuck and cannot proceed - blocked on external API specification for authentication module`,
        timestamp: new Date(),
        priority: Priority.CRITICAL,
      };

      const classification = classifier.classifyMessage(msg);
      expect(classification).toBe(MessageClass.ESCALATION);

      const tokenTarget = classifier.determineTokenTarget(msg);
      expect(tokenTarget).toBe(8000); // 8k base for escalation

      const compacted = compression.compress(msg);
      expect(compacted.metadata.priority).toBe(Priority.CRITICAL);
    });
  });

  describe('multi-recipient routing', () => {
    it('routes to multiple agents simultaneously', () => {
      router.updateAgentStatus('hephaestus-1', 'active');
      router.updateAgentStatus('hephaestus-2', 'active');

      const msg: Message = {
        id: 'int-4',
        from: 'orchestrator',
        to: ['hephaestus-1', 'hephaestus-2'],
        content: 'Parallel task: Both work on independent modules',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const compacted = compression.compress(msg);
      const routed = router.route(msg, compacted);

      expect(routed.success).toBe(true);
      expect(routed.delivered).toHaveLength(2);
    });
  });

  describe('token budget enforcement', () => {
    it('never exceeds token budget for any class', () => {
      const largeContent = 'x'.repeat(50000);

      const messages: Message[] = [
        { id: 't1', from: 'a', to: 'b', content: 'Understood', timestamp: new Date(), priority: Priority.LOW },
        { id: 't2', from: 'a', to: 'b', content: 'Status: 50%', timestamp: new Date(), priority: Priority.LOW },
        { id: 't3', from: 'a', to: 'b', content: '## Progress\n' + largeContent, timestamp: new Date(), priority: Priority.MEDIUM },
        { id: 't4', from: 'a', to: 'b', content: 'Build Prompt: ' + largeContent, timestamp: new Date(), priority: Priority.HIGH },
        { id: 't5', from: 'a', to: 'b', content: '[ESCALATION] ' + largeContent, timestamp: new Date(), priority: Priority.CRITICAL },
      ];

      const limits = [2000, 2000, 4000, 6000, 8000];

      messages.forEach((msg, i) => {
        const compacted = compression.compress(msg);
        expect(compacted.actualTokens).toBeLessThanOrEqual(limits[i] * 1.1); // 10% tolerance
      });
    });
  });
});

describe('Integration: More Context Override (24-72k)', () => {
  let bridge: NemotronBridge;

  beforeEach(() => {
    bridge = new NemotronBridge();
  });

  it('orchestrator can request 24k context', () => {
    const classifier = new MessageClassifier();

    const msg: Message = {
      id: 'ctx-1',
      from: 'orchestrator',
      to: 'hephaestus-1',
      content: 'I need more context about the authentication implementation',
      timestamp: new Date(),
      priority: Priority.HIGH,
    };

    const target = classifier.determineTokenTarget(msg);
    expect(target).toBe(24000);
  });

  it('override request can get up to 72k tokens', () => {
    const classifier = new MessageClassifier();

    const msg: Message = {
      id: 'ctx-2',
      from: 'orchestrator',
      to: 'hephaestus-1',
      content: 'Deep dive needed',
      timestamp: new Date(),
      priority: Priority.HIGH,
      overrideRequest: {
        requestedTokens: 72000,
        reason: 'Full context required for debugging',
      },
    };

    const target = classifier.determineTokenTarget(msg);
    expect(target).toBe(72000);
  });

  it('bridge returns relevant stored context', () => {
    bridge.processMessage({
      id: 'stored-1',
      from: 'hephaestus-1',
      to: 'orchestrator',
      content: 'Authentication uses JWT with RS256 signing',
      timestamp: new Date(),
      priority: Priority.MEDIUM,
    });

    bridge.processMessage({
      id: 'stored-2',
      from: 'hephaestus-2',
      to: 'orchestrator',
      content: 'Database uses PostgreSQL with connection pooling',
      timestamp: new Date(),
      priority: Priority.MEDIUM,
    });

    const result = bridge.handleMoreContextRequest({
      id: 'req-1',
      from: 'orchestrator',
      to: 'hephaestus-1',
      content: 'more context about authentication',
      timestamp: new Date(),
      priority: Priority.HIGH,
    });

    expect(result).toContain('JWT');
    expect(result).not.toContain('PostgreSQL');
  });
});

describe('Integration: Bidirectional Communication', () => {
  let bridge: NemotronBridge;

  beforeEach(() => {
    bridge = new NemotronBridge();
    bridge.registerAgent('hephaestus-1', 'hephaestus');
    bridge.registerAgent('oracle-1', 'oracle');
  });

  it('supports orchestrator → agent communication', () => {
    const msg: Message = {
      id: 'bid-1',
      from: 'orchestrator',
      to: 'hephaestus-1',
      content: 'Build Prompt: Create user service',
      timestamp: new Date(),
      priority: Priority.HIGH,
    };

    const result = bridge.processMessage(msg);
    expect(result.content).toBeDefined();
  });

  it('supports agent → orchestrator communication', () => {
    const msg: Message = {
      id: 'bid-2',
      from: 'hephaestus-1',
      to: 'orchestrator',
      content: 'Status: 75% complete',
      timestamp: new Date(),
      priority: Priority.MEDIUM,
    };

    const result = bridge.processMessage(msg);
    expect(result.actualTokens).toBeLessThanOrEqual(2000);
  });

  it('supports agent → agent communication', () => {
    const msg: Message = {
      id: 'bid-3',
      from: 'hephaestus-1',
      to: 'oracle-1',
      content: 'Need @oracle-1 review on architecture decision',
      timestamp: new Date(),
      priority: Priority.HIGH,
    };

    const result = bridge.processMessage(msg);
    expect(result).toBeDefined();
  });
});

describe('Integration: Metrics Tracking', () => {
  let bridge: NemotronBridge;

  beforeEach(() => {
    bridge = new NemotronBridge();
    bridge.registerAgent('hephaestus-1', 'hephaestus');
  });

  it('tracks messages by class correctly', () => {
    // Send 2k messages
    for (let i = 0; i < 5; i++) {
      bridge.processMessage({
        id: `2k-${i}`,
        from: 'hephaestus-1',
        to: 'orchestrator',
        content: 'Done',
        timestamp: new Date(),
        priority: Priority.LOW,
      });
    }

    // Send 4k messages (need > 100 chars to avoid status update classification)
    for (let i = 0; i < 3; i++) {
      bridge.processMessage({
        id: `4k-${i}`,
        from: 'hephaestus-1',
        to: 'orchestrator',
        content: '## Progress\nCompleted module with all features implemented and tested successfully in the staging environment',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      });
    }

    const metrics = bridge.getMetrics();
    expect(metrics.messagesByClass['2k']).toBe(5);
    expect(metrics.messagesByClass['4k']).toBe(3);
  });

  it('calculates overall compression ratio', () => {
    const largeContent = 'x'.repeat(10000);

    bridge.processMessage({
      id: 'comp-1',
      from: 'hephaestus-1',
      to: 'orchestrator',
      content: largeContent,
      timestamp: new Date(),
      priority: Priority.LOW,
    });

    const metrics = bridge.getMetrics();
    expect(metrics.compressionRatio).toBeGreaterThanOrEqual(1);
  });
});
