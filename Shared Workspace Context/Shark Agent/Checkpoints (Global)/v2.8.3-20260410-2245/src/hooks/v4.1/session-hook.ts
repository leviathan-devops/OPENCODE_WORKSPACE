/**
 * Session Hook — shark session lifecycle
 * 
 * Handles session lifecycle for shark agents.
 * 
 * CRITICAL: This hook is the entry point for system brain initialization.
 * Without setCurrentAgent being called, ALL guardian hooks will exit early
 * because they check getCurrentAgent() first.
 * 
 * MECHANICAL SYSTEM: This hook MUST be invoked on every session.created event
 * for shark agents. If setCurrentAgent is not called, the system brain fails.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import { EvidenceCollector } from '../shared/evidence.js';
import type { SharkPeerDispatch } from '../shark/macro/peer-dispatch.js';
import { isSharkAgent } from '../../shared/agent-identity';
import { setCurrentAgent, getCurrentAgent } from './agent-state.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

interface SessionEvent {
  type: string;
  agent?: string;
  sessionId?: string;
  properties?: {
    info?: {
      id?: string;
      agent?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function extractAgentFromEvent(event: SessionEvent): string | undefined {
  if (typeof event.agent === 'string') {
    return event.agent;
  }
  if (event.properties?.info?.agent) {
    return event.properties.info.agent as string;
  }
  return undefined;
}

function extractSessionId(event: SessionEvent): string {
  if (typeof event.sessionId === 'string') {
    return event.sessionId;
  }
  if (event.properties?.info?.id) {
    return event.properties.info.id as string;
  }
  return 'unknown';
}

export function createSessionHook(
  gateManager: GateManager,
  _evidenceCollector: EvidenceCollector,
  peerDispatch?: SharkPeerDispatch
): Hooks['event'] {
  return async (input) => {
    const rawEvent = input.event;
    const event = rawEvent as SessionEvent;
    
    if (!event?.type) return;

    const eventType = event.type;
    
    // Only handle session lifecycle events
    if (eventType !== 'session.created' && eventType !== 'session.started') {
      return;
    }

    // Try multiple sources to find the agent name
    let agentName = extractAgentFromEvent(event);
    
    // If we still don't have an agent name, check environment
    if (!agentName) {
      console.log('[Shark Session Hook] WARNING: No agent found in event, checking environment...');
      
      // Check for SHARK_AGENT env var (set by orchestrator when spawning shark)
      const envAgent = process.env.SHARK_AGENT;
      if (envAgent) {
        agentName = envAgent;
        console.log(`[Shark Session Hook] Found agent from environment: ${agentName}`);
      }
    }

    // CRITICAL: We must have an agent to proceed
    if (!agentName) {
      console.error('[Shark Session Hook] CRITICAL: No agent found in session event!');
      console.error('[Shark Session Hook] Event structure:', JSON.stringify(event, null, 2));
      // Continue anyway - we need to track this failure
    } else {
      // Only set current agent if it's a shark agent
      if (isSharkAgent(agentName)) {
        setCurrentAgent(agentName);
        console.log(`[Shark Session Hook] setCurrentAgent(${agentName}) called, getCurrentAgent()=${getCurrentAgent()}`);
      } else {
        console.log(`[Shark Session Hook] Agent ${agentName} is not a shark agent, skipping`);
        return;
      }
    }

    switch (eventType) {
      case 'session.created':
        // Initialize brain with default shark agent for new sessions
        // This ensures guardian enforcement is active even before agent is determined
        setCurrentAgent('shark');
        console.log(`[Shark Session Hook] Initialized brain for new session: getCurrentAgent()=${getCurrentAgent()}`);
        await handleSessionCreated(extractSessionId(event), gateManager, peerDispatch);
        break;
      case 'session.started':
        break;
    }
  };
}

async function handleSessionCreated(
  sessionID: string,
  gateManager: GateManager,
  peerDispatch?: SharkPeerDispatch
): Promise<void> {
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

  // Initialize ONLY shark peer dispatch
  if (peerDispatch) {
    peerDispatch.initialize();
  }

  // Ensure .shark directory exists
  const sharkDir = path.join(process.cwd(), '.shark');
  try {
    await fs.promises.mkdir(sharkDir, { recursive: true });
    await fs.promises.mkdir(path.join(sharkDir, 'evidence'), { recursive: true });
    await fs.promises.mkdir(path.join(sharkDir, 'checkpoints'), { recursive: true });
  } catch (err) {
    console.error(`[Shark] Failed to create .shark directory: ${err}`);
  }
}