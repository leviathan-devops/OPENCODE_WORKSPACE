/**
 * src/coordination/index.ts
 * 
 * Main coordination layer factory.
 */

import type { CoordinationConfig } from './types.js';
import { createAgentRegistry, getDefaultAgents } from './registry.js';
import { createDelegationEngine } from './delegation.js';
import { createStateMachine } from './state-machine.js';
import { createPluginStateManager } from './persistence/plugin-state.js';
import {
  createDelegationGateHook,
  createGuardrailHook,
  createSlopDetectorHook,
  createBrainstormGateHook,
  createCoordinationHooks,
} from './hooks/index.js';
import { createCoordinationTools } from './tools/index.js';
import { createCommandRegistry, createDefaultCommands } from './commands/index.js';
import { getClusters } from '../clusters/index.js';

export interface CoordinationLayer {
  config: CoordinationConfig;
  registry: ReturnType<typeof createAgentRegistry>;
  delegationEngine: ReturnType<typeof createDelegationEngine>;
  stateMachine: ReturnType<typeof createStateMachine>;
  pluginStateManager: ReturnType<typeof createPluginStateManager>;
  hooks: ReturnType<typeof createCoordinationHooks>;
  tools: ReturnType<typeof createCoordinationTools>;
  commands: ReturnType<typeof createCommandRegistry>;
}

export function createCoordinationLayer(config: CoordinationConfig): CoordinationLayer {
  // Use default agents if not provided
  const agents = config.agents || getDefaultAgents();
  const clusters = config.clusters || getClusters();
  
  // Create core components
  const registry = createAgentRegistry(agents, clusters);
  const delegationEngine = createDelegationEngine(registry, config.gates);
  const stateMachine = createStateMachine();
  const pluginStateManager = createPluginStateManager(config.storage?.baseDir || '.plugin');
  
  // Create enforcement hooks
  const gateHook = createDelegationGateHook();
  const guardrailHook = createGuardrailHook(config.guardrails);
  const slopDetectorHook = createSlopDetectorHook();
  const brainstormGateHook = createBrainstormGateHook();
  
  const hooks = createCoordinationHooks(
    gateHook,
    guardrailHook,
    slopDetectorHook,
    brainstormGateHook
  );
  
  // Create tools
  const tools = createCoordinationTools(
    delegationEngine,
    stateMachine,
    pluginStateManager,
    registry
  );
  
  // Create commands
  const commandRegistry = createCommandRegistry();
  const defaultCommands = createDefaultCommands(pluginStateManager, stateMachine, registry);
  for (const cmd of defaultCommands) {
    commandRegistry.register(cmd);
  }
  
  return {
    config,
    registry,
    delegationEngine,
    stateMachine,
    pluginStateManager,
    hooks,
    tools,
    commands: commandRegistry,
  };
}

export { getDefaultAgents, getDefaultClusters } from './registry.js';
export { createAgentRegistry } from './registry.js';
export { createDelegationEngine } from './delegation.js';
export { createStateMachine } from './state-machine.js';
export { createPluginStateManager } from './persistence/index.js';
export { createCoordinationHooks } from './hooks/index.js';
export { createCoordinationTools } from './tools/index.js';
export { createCommandRegistry } from './commands/index.js';
export * from './types.js';
