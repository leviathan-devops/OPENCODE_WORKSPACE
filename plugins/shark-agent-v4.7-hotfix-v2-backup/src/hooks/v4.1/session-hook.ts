/**
 * Session Hook — shark session lifecycle
 * 
 * ONLY fires for shark agent sessions.
 * OPTIMIZED: Silent operations, no console logs.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity';
import { setCurrentAgent, clearCurrentAgent } from './agent-state.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

let dirCreationAttempted = false;

export function createSessionHook(
  gateManager: GateManager,
  _evidenceCollector: EvidenceCollector,
  peerDispatch?: SharkPeerDispatch
): Hooks['event'] {
  return async (input) => {
    const event = input.event as { type?: string; sessionId?: string; agent?: string };
    
    if (!event?.type) return;

    if (!isSharkAgent(event.agent)) {
      setCurrentAgent(undefined);
      return;
    }

    setCurrentAgent(event.agent);

    switch (event.type) {
      case 'session.created':
        handleSessionCreated(gateManager, peerDispatch);
        break;
      case 'session.ended':
        handleSessionEnded();
        break;
    }
  };
}

function handleSessionCreated(
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): void {
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

  if (peerDispatch) {
    peerDispatch.initialize();
  }

  if (!dirCreationAttempted) {
    dirCreationAttempted = true;
    const sharkDir = path.join(process.cwd(), '.shark');
    fs.mkdirSync(sharkDir, { recursive: true });
    fs.mkdirSync(path.join(sharkDir, 'evidence'), { recursive: true });
    fs.mkdirSync(path.join(sharkDir, 'checkpoints'), { recursive: true });
  }
}

function handleSessionEnded(): void {
  setCurrentAgent(undefined);
  clearCurrentAgent();
}