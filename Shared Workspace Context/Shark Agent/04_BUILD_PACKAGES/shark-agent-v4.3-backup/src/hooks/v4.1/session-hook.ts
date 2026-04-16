/**
 * Session Hook — event hook integration
 * 
 * Handles session lifecycle events (created, started).
 * Initializes fresh gate state for new sessions.
 */

import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shark/shared/gates.js';
import { EvidenceCollector } from '../../shark/shared/evidence.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createSessionHook(
  gateManager: GateManager,
  _evidenceCollector: EvidenceCollector
): Hooks['event'] {
  return async (input) => {
    const event = input.event as { type?: string; sessionId?: string };
    
    if (!event?.type) return;

    switch (event.type) {
      case 'session.created':
        await handleSessionCreated(event.sessionId || 'unknown', gateManager);
        break;
      case 'session.started':
        console.log(`[Shark] Session started: ${event.sessionId || 'unknown'}`);
        break;
    }
  };
}

async function handleSessionCreated(sessionID: string, gateManager: GateManager): Promise<void> {
  console.log(`[Shark] Session created: ${sessionID}`);

  // Initialize fresh gate state
  gateManager.restore({
    currentGate: 'plan',
    gateStatus: {
      plan: 'pending',
      build: 'pending',
      test: 'pending',
      verify: 'pending',
      audit: 'pending',
      delivery: 'pending',
    },
    verifyAttempts: 0,
    currentIteration: 'V1.0',
    iterationAttempts: {},
  });

  // Ensure .shark directory exists in workspace
  const sharkDir = path.join(process.cwd(), '.shark');
  try {
    await fs.promises.mkdir(sharkDir, { recursive: true });
    await fs.promises.mkdir(path.join(sharkDir, 'evidence'), { recursive: true });
    await fs.promises.mkdir(path.join(sharkDir, 'sessions'), { recursive: true });
    console.log(`[Shark] .shark directory initialized at ${sharkDir}`);
  } catch (err) {
    console.error(`[Shark] Failed to create .shark directory: ${err}`);
  }
}
