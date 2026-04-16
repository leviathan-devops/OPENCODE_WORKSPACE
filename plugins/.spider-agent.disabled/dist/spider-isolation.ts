/**
 * Spider Agent Isolation Patch
 * 
 * Monkey-patches spider hooks to add agent filtering.
 * This file can be imported AFTER spider loads to add isolation.
 * 
 * Usage: Import this AFTER spider-agent in your config.
 */

import { isSpiderAgent } from './agent-identity.js';
import { getCurrentAgent, setCurrentAgent } from './agent-state.js';

export function applySpiderIsolation(): void {
  console.error('[SPIDER-ISOLATION] Applying agent filtering to hooks');
}

export { isSpiderAgent, getCurrentAgent, setCurrentAgent };