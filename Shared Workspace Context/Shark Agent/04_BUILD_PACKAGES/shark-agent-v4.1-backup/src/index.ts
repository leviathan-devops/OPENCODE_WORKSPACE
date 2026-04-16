/**
 * Shark Agent V4 — OpenCode Plugin (V4.1)
 * 
 * V4.1 changes from V4.0:
 * - Added OpenCode hook integration (tool.execute.before/after, session.*, chat.system.transform)
 * - Evidence path uses process.cwd() instead of plugin directory
 * - shark-evidence tool uses tool.arg.enum() instead of zod
 * - shark-macro uses single primary T1 prompt (EXECUTION_BRAIN_T1)
 */

import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import * as path from 'node:path';

// Shared components
import { createStateStore } from './shark/shared/state-store.js';
import { createBrainMessenger } from './shark/shared/messenger.js';
import { Guardian } from './shark/shared/guardian.js';
import { GateManager } from './shark/shared/gates.js';
import { EvidenceCollector } from './shark/shared/evidence.js';

// V4.1: Import hooks
import { createSharkHooks } from './hooks/v4.1/index.js';

// Micro components
import { MicroCoordinator } from './shark/micro/coordinator.js';
import { PLAN_BRAIN_T1, BUILD_BRAIN_T1, COORDINATOR_T1 } from './shark/micro/brains.js';

// Macro components
import { MacroPeerDispatch } from './shark/macro/peer-dispatch.js';
import { EXECUTION_BRAIN_T1 } from './shark/macro/brains.js';

// Tools
import { createSharkStatusTool } from './tools/shark-status.js';
import { createSharkGateTool } from './tools/shark-gate.js';
import { createSharkEvidenceTool } from './tools/shark-evidence.js';

// State management
const stateStore = createStateStore();
const messenger = createBrainMessenger();
const guardian = new Guardian({ level: 'SANDBOX' });

// V4.1: Coordinators not yet fully wired to hooks
// let microCoordinator: MicroCoordinator | null = null;
// let macroDispatcher: MacroPeerDispatch | null = null;

function getMicroCoordinator(): MicroCoordinator {
  throw new Error('Coordinator not yet wired to hooks');
}

function getMacroDispatcher(): MacroPeerDispatch {
  throw new Error('Dispatcher not yet wired to hooks');
}

export default async function SharkAgentV4(input: PluginInput): Promise<Hooks> {
  const { directory } = input;

  // V4.1 FIX: Use workspace path, not plugin directory
  const workspacePath = process.cwd();
  const gm = new GateManager(path.join(workspacePath, '.shark'));
  const ec = new EvidenceCollector(path.join(workspacePath, '.shark'));

  // Create tools
  const statusToolMicro = createSharkStatusTool(stateStore, gm, 'micro');
  const statusToolMacro = createSharkStatusTool(stateStore, gm, 'macro');
  const gateTool = createSharkGateTool(gm, guardian);
  const evidenceTool = createSharkEvidenceTool(ec);

  // V4.1: Create wired hooks
  const hooks = createSharkHooks(guardian, gm, ec);

  return {
    // V4.1: Spread hooks (critical integration)
    ...hooks,

    // Tools
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
          // V4.1 FIX: Use only Execution Brain as primary (single-agent mode)
          // Triple-brain racing requires multi-process; macro V4.1 is honest single-agent
          description: 'Shark Agent V4 — Single primary brain (Execution Mode)',
          instructions: `${EXECUTION_BRAIN_T1}`,
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
