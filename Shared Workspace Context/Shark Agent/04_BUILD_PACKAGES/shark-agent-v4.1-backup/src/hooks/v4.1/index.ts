/**
 * Shark V4 Hooks — V4.1
 * 
 * Master hook aggregator. Creates a complete Hooks object wired to:
 * - Guardian (tool.execute.before — logs dangerous commands)
 * - GateManager (tool.execute.after — collects evidence, advances gates)
 * - Session lifecycle (event hook — session.created/init)
 * - State persistence (experimental.session.compacting — snapshot state)
 * - System prompt (experimental.chat.system.transform — injects enforcement context)
 */

import type { Hooks } from '@opencode-ai/plugin';
import { Guardian } from '../../shark/shared/guardian.js';
import { GateManager } from '../../shark/shared/gates.js';
import { EvidenceCollector } from '../../shark/shared/evidence.js';
import { createGuardianHook } from './guardian-hook.js';
import { createGateHook } from './gate-hook.js';
import { createSessionHook } from './session-hook.js';
import { createCompactingHook } from './compacting-hook.js';
import { createSystemTransformHook } from './system-transform-hook.js';

export function createSharkHooks(
  guardian: Guardian,
  gateManager: GateManager,
  evidenceCollector: EvidenceCollector
): Hooks {
  return {
    event: createSessionHook(gateManager, evidenceCollector),
    'tool.execute.before': createGuardianHook(guardian),
    'tool.execute.after': createGateHook(gateManager, evidenceCollector),
    'experimental.session.compacting': createCompactingHook(gateManager),
    'experimental.chat.system.transform': createSystemTransformHook(gateManager),
  };
}
