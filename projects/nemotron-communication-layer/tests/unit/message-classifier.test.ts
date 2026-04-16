import { describe, it, expect } from 'vitest';
import { MessageClass, Priority, Message } from '../../src/types';
import { MessageClassifier } from '../../src/message-classifier';

describe('MessageClassifier', () => {
  const classifier = new MessageClassifier();

  describe('classifyMessage', () => {
    it('classifies simple acknowledgments as 2k', () => {
      const messages = [
        'Understood',
        'Done',
        'Working on it',
        'ack',
        'got it',
        'on it',
      ];

      messages.forEach(content => {
        const msg: Message = {
          id: 'test-1',
          from: 'agent-1',
          to: 'orchestrator',
          content,
          timestamp: new Date(),
          priority: Priority.MEDIUM,
        };
        expect(classifier.classifyMessage(msg)).toBe(MessageClass.SIMPLE_ACK);
      });
    });

    it('classifies status updates as 2k', () => {
      const msg: Message = {
        id: 'test-2',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Status: 75% complete',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      };
      expect(classifier.classifyMessage(msg)).toBe(MessageClass.STATUS_UPDATE);
    });

    it('classifies dependency requests as 4k', () => {
      const msg: Message = {
        id: 'test-3',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Need @engineer-2 API by tomorrow for the authentication module integration work to continue successfully',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };
      expect(classifier.classifyMessage(msg)).toBe(MessageClass.DEPENDENCY_UPDATE);
    });

    it('classifies questions as 4k', () => {
      const msg: Message = {
        id: 'test-4',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'What is the expected behavior for this edge case with the authentication module and database integration?',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      };
      expect(classifier.classifyMessage(msg)).toBe(MessageClass.QUESTION);
    });

    it('classifies build prompts as 6k', () => {
      const msg: Message = {
        id: 'test-5',
        from: 'orchestrator',
        to: 'agent-1',
        content: 'Build Prompt: Create authentication module with OAuth2 support for the production deployment environment configuration',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };
      expect(classifier.classifyMessage(msg)).toBe(MessageClass.BUILD_PROMPT);
    });

    it('classifies messages with large code blocks as 6k', () => {
      const codeBlock = '```typescript\n' + 'const x = 1;\n'.repeat(30) + '```';
      const msg: Message = {
        id: 'test-6',
        from: 'agent-1',
        to: 'orchestrator',
        content: `Code review feedback:\n${codeBlock}`,
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      };
      expect(classifier.classifyMessage(msg)).toBe(MessageClass.CODE_REVIEW);
    });

    it('classifies debugging sessions as 8k', () => {
      const msg: Message = {
        id: 'test-7',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Error: Cannot read property of undefined. Stack trace: TypeError at line 42 in module.ts with full debug context included here',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };
      expect(classifier.classifyMessage(msg)).toBe(MessageClass.DEBUGGING_SESSION);
    });

    it('classifies escalations as 8k', () => {
      const msg: Message = {
        id: 'test-8',
        from: 'agent-1',
        to: 'orchestrator',
        content: '[escalation] Critical issue: cannot proceed without clarification from the team regarding the implementation',
        timestamp: new Date(),
        priority: Priority.CRITICAL,
      };
      expect(classifier.classifyMessage(msg)).toBe(MessageClass.ESCALATION);
    });
  });

  describe('determineTokenTarget', () => {
    it('returns 2k for simple messages', () => {
      const msg: Message = {
        id: 'test-9',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Done',
        timestamp: new Date(),
        priority: Priority.LOW,
      };
      expect(classifier.determineTokenTarget(msg)).toBe(2000);
    });

    it('returns 4k for progress reports', () => {
      const msg: Message = {
        id: 'test-10',
        from: 'agent-1',
        to: 'orchestrator',
        content: '## Progress\nCompleted module setup with all dependencies installed and tests passing successfully in the staging environment today.',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      };
      expect(classifier.determineTokenTarget(msg)).toBe(4000);
    });

    it('doubles tokens for CRITICAL priority', () => {
      const msg: Message = {
        id: 'test-11',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Done',
        timestamp: new Date(),
        priority: Priority.CRITICAL,
      };
      expect(classifier.determineTokenTarget(msg)).toBe(4000); // 2k * 2
    });

    it('returns 24k for orchestrator "more context" requests', () => {
      const msg: Message = {
        id: 'test-12',
        from: 'orchestrator',
        to: 'agent-1',
        content: 'I need more context about the authentication module',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };
      expect(classifier.determineTokenTarget(msg)).toBe(24000);
    });

    it('respects override request up to 72k max', () => {
      const msg: Message = {
        id: 'test-13',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Done',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
        overrideRequest: {
          requestedTokens: 50000,
          reason: 'Need full context for debugging',
        },
      };
      expect(classifier.determineTokenTarget(msg)).toBe(50000);
    });

    it('caps override at 72k', () => {
      const msg: Message = {
        id: 'test-14',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Done',
        timestamp: new Date(),
        priority: Priority.MEDIUM,
        overrideRequest: {
          requestedTokens: 100000,
          reason: 'Need everything',
        },
      };
      expect(classifier.determineTokenTarget(msg)).toBe(72000);
    });
  });

  describe('estimateTokens', () => {
    it('estimates ~250 tokens for 1000 char string', () => {
      const content = 'x'.repeat(1000);
      expect(classifier.estimateTokens(content)).toBe(250);
    });
  });

  describe('calculateComplexity', () => {
    it('calculates complexity score correctly', () => {
      const msg: Message = {
        id: 'test-15',
        from: 'agent-1',
        to: ['agent-2', 'agent-3'],
        content: 'Need @agent-4 help with this ```code```',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const complexity = classifier.calculateComplexity(msg);
      expect(complexity.recipientCount).toBe(2);
      expect(complexity.codeBlocks).toBe(1);
      expect(complexity.dependencies).toContain('agent-4');
    });
  });
});
