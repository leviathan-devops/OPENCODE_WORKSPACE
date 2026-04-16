/**
 * Shark Agent V4 — OpenCode Plugin
 * 
 * Production-grade software engineering orchestrator with mechanical enforcement.
 * Two variants:
 * - Shark Micro: Dual-brain sequential (Plan ↔ Build)
 * - Shark Macro: Triple-brain parallel (Execution + Reasoning + System)
 */

import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';

// Shared components
import { createStateStore } from './shark/shared/state-store.js';
import { createBrainMessenger } from './shark/shared/messenger.js';
import { Guardian } from './shark/shared/guardian.js';
import { GateManager } from './shark/shared/gates.js';
import { EvidenceCollector } from './shark/shared/evidence.js';

// Micro components
import { MicroCoordinator } from './shark/micro/coordinator.js';
import { PLAN_BRAIN_T1, BUILD_BRAIN_T1, COORDINATOR_T1 } from './shark/micro/brains.js';

// Macro components
import { MacroPeerDispatch } from './shark/macro/peer-dispatch.js';
import { 
  EXECUTION_BRAIN_T1, 
  REASONING_BRAIN_T1, 
  SYSTEM_BRAIN_T1, 
  PLAN_BRAIN_MACRO_T1 
} from './shark/macro/brains.js';

// Tools
import { createSharkStatusTool } from './tools/shark-status.js';
import { createSharkGateTool } from './tools/shark-gate.js';
import { createSharkEvidenceTool } from './tools/shark-evidence.js';

// State management
const stateStore = createStateStore();
const messenger = createBrainMessenger();
const guardian = new Guardian({ level: 'SANDBOX' });
const gateManager = new GateManager('.shark');
const evidenceCollector = new EvidenceCollector('.shark');

// Coordinators (initialized on first use)
let microCoordinator: MicroCoordinator | null = null;
let macroDispatcher: MacroPeerDispatch | null = null;

function getMicroCoordinator(): MicroCoordinator {
  if (!microCoordinator) {
    microCoordinator = new MicroCoordinator(stateStore, messenger, gateManager);
  }
  return microCoordinator;
}

function getMacroDispatcher(): MacroPeerDispatch {
  if (!macroDispatcher) {
    macroDispatcher = new MacroPeerDispatch(stateStore, messenger, gateManager);
  }
  return macroDispatcher;
}

export default async function SharkAgentV4(input: PluginInput): Promise<Hooks> {
  const { directory } = input;

  // Initialize gate manager with correct path
  const gm = new GateManager(directory);
  const ec = new EvidenceCollector(directory);

  // Create tools
  const statusToolMicro = createSharkStatusTool(stateStore, gateManager, 'micro');
  const statusToolMacro = createSharkStatusTool(stateStore, gateManager, 'macro');
  const gateTool = createSharkGateTool(gm, guardian);
  const evidenceTool = createSharkEvidenceTool(ec);

  return {
    // Tools available to all agents
    tool: {
      'shark-status': statusToolMicro,
      'shark-status-micro': statusToolMicro,
      'shark-status-macro': statusToolMacro,
      'shark-gate': gateTool,
      'shark-evidence': evidenceTool,
    },

    // Agent registration via config callback
    config: async (opencodeConfig: any) => {
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = {};
      }

      Object.assign(opencodeConfig.agent, {
        'shark-micro': {
          name: 'shark-micro',
          description: 'Shark Agent V4 — Dual-brain sequential (Plan ↔ Build)',
          instructions: `${PLAN_BRAIN_T1}\n\n${COORDINATOR_T1}`,
          mode: 'primary',
          permission: { task: 'allow' },
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
          },
        },
        'shark-macro': {
          name: 'shark-macro',
          description: 'Shark Agent V4 — Triple-brain parallel (Execution + Reasoning + System)',
          instructions: `${EXECUTION_BRAIN_T1}\n\n${REASONING_BRAIN_T1}\n\n${SYSTEM_BRAIN_T1}\n\n${PLAN_BRAIN_MACRO_T1}`,
          mode: 'primary',
          permission: { task: 'allow' },
          tools: {
            'shark-status': true,
            'shark-gate': true,
            'shark-evidence': true,
          },
        },
      });
    },
  };
}
