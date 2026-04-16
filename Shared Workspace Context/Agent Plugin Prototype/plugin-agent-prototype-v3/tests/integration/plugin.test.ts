/**
 * tests/integration/plugin.test.ts
 * 
 * Plugin integration tests - verify the plugin loads and works.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync } from 'fs';
import { resolve } from 'path';

const PLUGIN_PATH = resolve(__dirname, '../../dist/index.js');

describe('Plugin Integration Tests', () => {
  describe('Plugin Loading', () => {
    it('should have compiled dist file', () => {
      const distExists = existsSync(PLUGIN_PATH);
      expect(distExists).toBe(true);
    });
  });
});
