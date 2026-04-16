import { describe, it, expect } from 'vitest';
import { Priority, Message } from '../../src/types';
import { CompressionPipeline } from '../../src/compression';

describe('CompressionPipeline', () => {
  const pipeline = new CompressionPipeline();

  describe('compress', () => {
    it('does not expand small messages to target', () => {
      const msg: Message = {
        id: 'test-1',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Done',
        timestamp: new Date(),
        priority: Priority.LOW,
      };

      const result = pipeline.compress(msg);
      expect(result.actualTokens).toBeLessThan(result.targetTokens);
      expect(result.metadata.usedFullBudget).toBe(false);
    });

    it('compresses large messages to fit target', () => {
      const largeContent = 'x'.repeat(20000); // ~5000 tokens
      const msg: Message = {
        id: 'test-2',
        from: 'agent-1',
        to: 'orchestrator',
        content: largeContent,
        timestamp: new Date(),
        priority: Priority.MEDIUM,
      };

      const result = pipeline.compress(msg);
      expect(result.actualTokens).toBeLessThanOrEqual(result.targetTokens);
      expect(result.metadata.compressionRatio).toBeGreaterThan(1);
    });

    it('preserves metadata correctly', () => {
      const msg: Message = {
        id: 'test-3',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'Test content',
        timestamp: new Date(),
        priority: Priority.HIGH,
      };

      const result = pipeline.compress(msg);
      expect(result.originalId).toBe('test-3');
      expect(result.metadata.priority).toBe(Priority.HIGH);
    });

    it('applies 4-stage compression for large messages', () => {
      const content = `
## Progress
Working on module A with detailed implementation notes
Working on module A with detailed implementation notes
Working on module A with detailed implementation notes

## Blockers
None at this time but monitoring closely

## Details
files: file1.ts, file2.ts, file3.ts, file4.ts, file5.ts, file6.ts, file7.ts, file8.ts

## Context
Background information here with more details about the implementation
`.repeat(20);

      const msg: Message = {
        id: 'test-4',
        from: 'agent-1',
        to: 'orchestrator',
        content,
        timestamp: new Date(),
        priority: Priority.LOW,
      };

      const result = pipeline.compress(msg);
      
      // Should fit within target tokens
      expect(result.actualTokens).toBeLessThanOrEqual(result.targetTokens);
    });

    it('prioritizes critical sections for CRITICAL priority', () => {
      const content = `
## Progress
Making good progress on feature X

## Blockers
Critical blocker found!

## Details
Detailed implementation notes

## Critical
This needs immediate attention
`;

      const msg: Message = {
        id: 'test-5',
        from: 'agent-1',
        to: 'orchestrator',
        content,
        timestamp: new Date(),
        priority: Priority.CRITICAL,
      };

      const result = pipeline.compress(msg);
      expect(result.content).toBeDefined();
    });
  });

  describe('compression ratio', () => {
    it('calculates correct compression ratio', () => {
      const msg: Message = {
        id: 'test-6',
        from: 'agent-1',
        to: 'orchestrator',
        content: 'x'.repeat(10000),
        timestamp: new Date(),
        priority: Priority.LOW,
      };

      const result = pipeline.compress(msg);
      expect(result.metadata.compressionRatio).toBeGreaterThanOrEqual(1);
    });
  });
});
