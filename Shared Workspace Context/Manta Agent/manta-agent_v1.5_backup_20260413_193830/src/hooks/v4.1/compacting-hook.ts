/**
 * Session Compacting Hook — experimental.session.compacting integration
 * 
 * Snapshots gate state before context compression.
 * 
 * V4.6: FIXED - isMantaAgent(agent) always returns false in CLI mode because
 * the agent field is not present in experimental.session.compacting hook input.
 * Hook is now ALWAYS ACTIVE - state snapshot saved for all sessions.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createCompactingHook(
  gateManager: GateManager
): Hooks['experimental.session.compacting'] {
  return async (input, output) => {
    const { sessionID } = input;
    
    // V4.6: Hook is always active since isMantaAgent() cannot work
    // without the agent field in hook inputs. State snapshot is harmless
    // for non-manta sessions and critical for manta continuity.
    
    console.log(`[Manta] Session compacting: ${sessionID}`);

    const state = gateManager.getState();
    const mantaDir = path.join(process.cwd(), '.manta');
    const sessionDir = path.join(mantaDir, 'sessions', sessionID);

    try {
      await fs.promises.mkdir(mantaDir, { recursive: true });
      await fs.promises.mkdir(sessionDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(sessionDir, 'gate-state.json'),
        JSON.stringify(state, null, 2)
      );
      console.log(`[Manta] State snapshot saved for session ${sessionID}`);
      
      // Add context to the compaction
      const contextOutput = output as { context: string[] };
      if (contextOutput.context) {
        contextOutput.context.push(`[Manta] Gate state snapshot saved: ${state.currentGate} gate, ${state.currentIteration}`);
      }
    } catch (err) {
      console.error(`[Manta] Failed to snapshot state: ${err}`);
    }
  };
}
