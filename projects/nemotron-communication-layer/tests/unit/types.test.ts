import { describe, it, expect } from 'vitest';
import { MessageClass, Priority } from '../../src/types';

describe('Types', () => {
  it('MessageClass enum has correct token mappings', () => {
    expect(MessageClass.SIMPLE_ACK).toBe('2k');
    expect(MessageClass.STATUS_UPDATE).toBe('2k');
    expect(MessageClass.PROGRESS_REPORT).toBe('4k');
    expect(MessageClass.DEPENDENCY_UPDATE).toBe('4k');
    expect(MessageClass.QUESTION).toBe('4k');
    expect(MessageClass.BUILD_PROMPT).toBe('6k');
    expect(MessageClass.ARCHITECTURE_DECISION).toBe('6k');
    expect(MessageClass.CODE_REVIEW).toBe('6k');
    expect(MessageClass.INTEGRATION_COMPLEX).toBe('8k');
    expect(MessageClass.DEBUGGING_SESSION).toBe('8k');
    expect(MessageClass.ESCALATION).toBe('8k');
  });

  it('Priority enum has correct values', () => {
    expect(Priority.CRITICAL).toBe('CRITICAL');
    expect(Priority.HIGH).toBe('HIGH');
    expect(Priority.MEDIUM).toBe('MEDIUM');
    expect(Priority.LOW).toBe('LOW');
  });

  it('Message interface compiles with all fields', () => {
    const msg = {
      id: 'test',
      from: 'agent',
      to: 'orchestrator',
      content: 'test',
      timestamp: new Date(),
      priority: Priority.MEDIUM,
      overrideRequest: {
        requestedTokens: 50000,
        reason: 'Need more context',
      },
    };
    expect(msg.id).toBe('test');
  });

  it('ComplexityScore interface compiles', () => {
    const score = {
      tokenCount: 100,
      messagePriority: Priority.HIGH,
      recipientCount: 2,
      codeBlocks: 1,
      dependencies: ['agent-1'],
      urgency: 7,
    };
    expect(score.urgency).toBe(7);
  });

  it('CompactedMessage interface compiles', () => {
    const compacted = {
      originalId: 'test',
      targetTokens: 4000,
      actualTokens: 3500,
      content: 'compressed',
      metadata: {
        compressionRatio: 1.5,
        originalTokens: 5250,
        priority: Priority.HIGH,
        classification: MessageClass.PROGRESS_REPORT,
        usedFullBudget: true,
      },
    };
    expect(compacted.metadata.compressionRatio).toBe(1.5);
  });
});
