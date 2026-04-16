/**
 * Session Compacting Hook — truncate history, not inject
 * 
 * CRITICAL: Only fires for shark agents.
 * FIXED: Do NOT add to context. Help OpenCode truncate.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { isSharkAgent } from '../../shared/agent-identity';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createCompactingHook(
  gateManager: GateManager
): Hooks['experimental.session.compacting'] {
  return async (input, output) => {
    const { sessionID, agent } = input;
    
    if (!isSharkAgent(agent)) return;
    
    const state = gateManager.getState();
    const sessionDir = path.join(process.cwd(), '.shark', 'sessions', sessionID);

    try {
      await fs.promises.mkdir(sessionDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(sessionDir, 'gate-state.json'),
        JSON.stringify(state, null, 2)
      );
    } catch (err) {
      console.error(`[Shark] Failed to snapshot state: ${err}`);
    }
  };
}