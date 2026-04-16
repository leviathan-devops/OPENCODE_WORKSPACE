import { describe, it, expect } from 'bun:test';
import { createStateStore, DOMAIN_OWNERSHIP } from '../../../src/factory/StateStore.js';
import type { StateDomain } from '../../../src/factory/types.js';

describe('StateStore', () => {
  describe('get and set', () => {
    it('stores and retrieves values', () => {
      const store = createStateStore();

      store.set('key1', 'value1', 'plan-state', 'architect');
      const result = store.get<string>('key1', 'plan-state');

      expect(result).toBe('value1');
    });

    it('tracks versions', () => {
      const store = createStateStore();

      const r1 = store.set('key1', 'v1', 'plan-state', 'architect');
      expect(r1.version).toBe(1);

      const r2 = store.set('key1', 'v2', 'plan-state', 'architect');
      expect(r2.version).toBe(2);

      const r3 = store.set('key1', 'v3', 'plan-state', 'architect');
      expect(r3.version).toBe(3);
    });
  });

  describe('domain ownership', () => {
    it('allows owner brain to write to its domain', () => {
      const store = createStateStore();

      const result = store.set('plan', { phases: [] }, 'plan-state', 'architect');
      expect(result.success).toBe(true);
    });

    it('rejects non-owner brain writing to a domain', () => {
      const store = createStateStore();

      const result = store.set('plan', { phases: [] }, 'plan-state', 'executor');
      expect(result.success).toBe(false);
      expect(result.error).toContain('does not own domain');
    });

    it('allows shared domain owners', () => {
      const store = createStateStore();

      // quality-state is owned by both 'guardian' and 'executor'
      const r1 = store.set('quality', { score: 0.9 }, 'quality-state', 'guardian');
      expect(r1.success).toBe(true);

      const r2 = store.set('quality', { score: 0.95 }, 'quality-state', 'executor');
      expect(r2.success).toBe(true);

      // But 'architect' should be rejected
      const r3 = store.set('quality', { score: 0.5 }, 'quality-state', 'architect');
      expect(r3.success).toBe(false);
    });

    it('allows writes without owner check when ownerBrain is not provided', () => {
      const store = createStateStore();

      // Without ownerBrain, no ownership check is performed
      const result = store.set('any-key', 'any-value', 'plan-state');
      expect(result.success).toBe(true);
    });
  });

  describe('watch', () => {
    it('notifies watchers on set', () => {
      const store = createStateStore();
      const values: any[] = [];
      const versions: number[] = [];

      store.watch('key1', (value, version) => {
        values.push(value);
        versions.push(version);
      });

      store.set('key1', 'v1', 'plan-state', 'architect');
      store.set('key1', 'v2', 'plan-state', 'architect');

      expect(values).toEqual(['v1', 'v2']);
      expect(versions).toEqual([1, 2]);
    });

    it('unsubscribe stops notifications', () => {
      const store = createStateStore();
      const values: any[] = [];

      const unsub = store.watch('key1', (value) => {
        values.push(value);
      });

      store.set('key1', 'v1', 'plan-state', 'architect');
      expect(values).toEqual(['v1']);

      unsub();

      store.set('key1', 'v2', 'plan-state', 'architect');
      expect(values).toEqual(['v1']); // No new value after unsubscribe
    });
  });

  describe('snapshot and restore', () => {
    it('captures full state in snapshot', () => {
      const store = createStateStore();

      store.set('key1', 'value1', 'plan-state', 'architect');
      store.set('key2', 42, 'execution-state', 'executor');

      const snapshot = store.snapshot();

      expect(snapshot.data['plan-state:key1']).toBe('value1');
      expect(snapshot.data['execution-state:key2']).toBe(42);
      expect(snapshot.versions['plan-state:key1']).toBe(1);
      expect(snapshot.versions['execution-state:key2']).toBe(1);
      expect(snapshot.timestamp).toBeDefined();
    });

    it('restores state from snapshot', () => {
      const store = createStateStore();

      store.set('key1', 'value1', 'plan-state', 'architect');
      const snapshot = store.snapshot();

      // Modify state
      store.set('key1', 'modified', 'plan-state', 'architect');
      expect(store.get('key1', 'plan-state')).toBe('modified');

      // Restore
      store.restore(snapshot);
      expect(store.get('key1', 'plan-state')).toBe('value1');
    });
  });
});
