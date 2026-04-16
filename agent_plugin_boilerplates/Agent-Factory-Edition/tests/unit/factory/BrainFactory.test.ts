import { describe, it, expect } from 'bun:test';
import { BrainFactory } from '../../../src/factory/BrainFactory.js';

describe('BrainFactory', () => {
  const factory = new BrainFactory();

  describe('createSingleBrain', () => {
    it('creates a single brain with correct structure', () => {
      const brain = factory.createSingleBrain({
        type: 'single',
        name: 'test-brain',
        orchestrator: 'architect',
      });

      expect(brain.type).toBe('single');
      expect(brain.primary).toBe('architect');
      expect(brain.all).toEqual(['architect']);
      expect(brain.syncMode).toBe('none');
      expect(brain.hierarchy.level).toBe(0);
    });

    it('throws if orchestrator is missing', () => {
      expect(() =>
        factory.createSingleBrain({
          type: 'single',
          name: 'bad-brain',
          orchestrator: '',
        }),
      ).toThrow();
    });
  });

  describe('createDualBrain', () => {
    it('creates a dual brain with 2 orchestrators', () => {
      const brain = factory.createDualBrain({
        type: 'dual',
        name: 'dual-brain',
        syncMode: 'shared-state',
        orchestrators: {
          architect: 'architect',
          executor: 'executor',
        },
        workflows: {
          architect: {
            name: 'Architect',
            description: 'Planning',
            owns: ['planning'],
            delegatesTo: ['research'],
          },
          executor: {
            name: 'Executor',
            description: 'Execution',
            owns: ['execution'],
            delegatesTo: ['coder'],
          },
        },
      });

      expect(brain.type).toBe('dual');
      expect(brain.primary).toBe('architect');
      expect(brain.all).toEqual(['architect', 'executor']);
      expect(brain.syncMode).toBe('shared-state');
      expect(brain.workflows).toBeDefined();
      expect(Object.keys(brain.workflows!)).toHaveLength(2);
    });

    it('throws if not exactly 2 orchestrators', () => {
      expect(() =>
        factory.createDualBrain({
          type: 'dual',
          name: 'bad-dual',
          syncMode: 'shared-state',
          orchestrators: {
            onlyOne: 'architect',
          },
          workflows: {},
        }),
      ).toThrow();
    });
  });

  describe('createTrioBrain', () => {
    it('creates a trio brain with 3 orchestrators', () => {
      const brain = factory.createTrioBrain({
        type: 'trio',
        name: 'trio-brain',
        syncMode: 'shared-state',
        orchestrators: {
          architect: 'architect',
          executor: 'executor',
          guardian: 'guardian',
        },
        workflows: {
          architect: {
            name: 'Architect',
            description: 'Planning',
            owns: ['planning'],
            delegatesTo: ['research'],
          },
          executor: {
            name: 'Executor',
            description: 'Execution',
            owns: ['execution'],
            delegatesTo: ['coder'],
          },
          guardian: {
            name: 'Guardian',
            description: 'Quality',
            owns: ['quality'],
            delegatesTo: ['reviewer'],
          },
        },
      });

      expect(brain.type).toBe('trio');
      expect(brain.primary).toBe('architect');
      expect(brain.all).toEqual(['architect', 'executor', 'guardian']);
      expect(brain.syncMode).toBe('shared-state');
      expect(Object.keys(brain.workflows!)).toHaveLength(3);
    });

    it('throws if not exactly 3 orchestrators', () => {
      expect(() =>
        factory.createTrioBrain({
          type: 'trio',
          name: 'bad-trio',
          syncMode: 'shared-state',
          orchestrators: {
            onlyTwo: 'architect',
            second: 'executor',
          },
          workflows: {},
        }),
      ).toThrow();
    });
  });

  describe('create (generic)', () => {
    it('dispatches to correct brain type', () => {
      const single = factory.create({
        type: 'single',
        name: 'single',
        orchestrator: 'architect',
      });
      expect(single.type).toBe('single');

      const dual = factory.create({
        type: 'dual',
        name: 'dual',
        syncMode: 'shared-state',
        orchestrators: { a: 'a', b: 'b' },
        workflows: {},
      });
      expect(dual.type).toBe('dual');

      const trio = factory.create({
        type: 'trio',
        name: 'trio',
        syncMode: 'shared-state',
        orchestrators: { a: 'a', b: 'b', c: 'c' },
        workflows: {},
      });
      expect(trio.type).toBe('trio');
    });

    it('throws for unknown brain type', () => {
      expect(() =>
        factory.create({
          type: 'custom' as any,
          name: 'custom',
        }),
      ).toThrow();
    });
  });

  describe('validate', () => {
    it('returns valid for correct single brain', () => {
      const result = factory.validate({
        type: 'single',
        name: 'valid',
        orchestrator: 'architect',
      });
      expect(result.valid).toBe(true);
    });

    it('returns errors for missing name', () => {
      const result = factory.validate({
        type: 'single',
        name: '',
        orchestrator: 'architect',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
