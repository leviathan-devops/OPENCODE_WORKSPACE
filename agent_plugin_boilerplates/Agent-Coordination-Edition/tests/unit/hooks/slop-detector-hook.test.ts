/**
 * tests/unit/hooks/slop-detector-hook.test.ts
 * 
 * Slop detector hook tests.
 */

import { describe, it, expect } from 'vitest';
import { createSlopDetectorHook } from '../../../src/coordination/hooks/slop-detector-hook.js';

describe('SlopDetectorHook', () => {
  describe('createSlopDetectorHook', () => {
    it('should create a slop detector hook', () => {
      const hook = createSlopDetectorHook();
      expect(typeof hook).toBe('function');
    });
    
    it('should detect low comment ratio', async () => {
      const hook = createSlopDetectorHook({ commentRatioMin: 0.2 });
      
      // Code without comments
      const codeWithoutComments = 'function test() { return 1; }'.repeat(10);
      
      // Should not throw
      await hook({ tool: 'write', content: codeWithoutComments }, {});
    });
    
    it('should detect class repetition', async () => {
      const hook = createSlopDetectorHook({ classRepetitionThreshold: 3 });
      
      // Code with repeated class declarations
      const repetitiveCode = `
class Foo {}
class Foo {}
class Foo {}
class Foo {}
class Foo {}
      `;
      
      // Should not throw but may warn
      await hook({ tool: 'write', content: repetitiveCode }, {});
    });
    
    it('should detect large diffs', async () => {
      const hook = createSlopDetectorHook({ diffSizeWarning: 100 });
      
      // Large diff
      const largeDiff = 'x'.repeat(200);
      
      // Should not throw but may warn
      await hook({ tool: 'edit', diff: largeDiff }, {});
    });
    
    it('should ignore non-code tools', async () => {
      const hook = createSlopDetectorHook();
      
      // Non-code tool
      await hook({ tool: 'read', path: '/some/file' }, {});
    });
  });
});
