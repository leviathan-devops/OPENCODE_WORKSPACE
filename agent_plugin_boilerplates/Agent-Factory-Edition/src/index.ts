/**
 * V4 Agent Plugin — Main Entry Point
 *
 * Config-driven multi-brain agent architecture.
 * Supports Spider (single), Shark (dual), and Trio (triple) parallel orchestrator models.
 */

import type { Hooks, PluginInput, PluginOptions } from '@opencode-ai/plugin';
import { createArchitectureFactory } from './factory/index.js';
import {
  architectTemplate,
  executorTemplate,
  coderTemplate,
  reviewerTemplate,
  testEngineerTemplate,
  smeTemplate,
  explorerTemplate,
  criticTemplate,
  docsTemplate,
  designerTemplate,
} from './factory/templates/agent/index.js';
import { spiderConfig } from './config/templates/spider.js';
import { sharkConfig } from './config/templates/shark.js';
import { trioConfig } from './config/templates/trio.js';
import type { ArchitectureConfig, ArchitectureInstance } from './factory/types.js';
import { loadArchitectureWithFallback } from './config/loader.js';

// Re-export V3 coordination types for consumers
export type {
  AgentDefinition,
  AgentMode,
  ClusterDefinition,
  DelegationRequest,
  DelegationResult,
  GateResult,
  Task,
  TaskStatus,
  Plan,
  Phase,
  Evidence,
  Checkpoint,
  SwarmState,
  CoordinationConfig,
  AgentRegistry,
  DelegationEngine,
  StateMachine,
} from './coordination/types.js';

// Re-export V4 factory types
export type {
  ArchitectureConfig,
  ArchitectureInstance,
  BrainType,
  BrainConfig,
  SingleBrainConfig,
  DualBrainConfig,
  TrioBrainConfig,
  AgentTemplate,
  AgentOverride,
  ClusterConfig,
  ValidationResult,
  StateStore,
  BrainMessenger,
  BrainMessage,
  StateDomain,
} from './factory/types.js';

// Re-export factories
export {
  ArchitectureFactory,
  createArchitectureFactory,
  AgentFactory,
  BrainFactory,
  ClusterFactory,
  createStateStore,
  createBrainMessenger,
  runValidators,
  architectureValidators,
} from './factory/index.js';

// Re-export pre-built configs
export { spiderConfig, sharkConfig, trioConfig } from './config/templates/index.js';
export { loadArchitectureConfig, loadArchitectureWithFallback } from './config/loader.js';

// ============================================================
// PLUGIN OPTIONS
// ============================================================

export interface V4PluginOptions {
  /** Architecture preset: 'spider', 'shark', 'trio', or 'custom' */
  architecture?: 'spider' | 'shark' | 'trio' | 'custom';
  /** Path to custom architecture config file (.ts or .json) */
  configPath?: string;
  /** Custom architecture config (overrides architecture and configPath) */
  customConfig?: ArchitectureConfig;
}

// ============================================================
// BUILT-IN CONFIGS
// ============================================================

const BUILTIN_CONFIGS: Record<string, ArchitectureConfig> = {
  spider: spiderConfig,
  shark: sharkConfig,
  trio: trioConfig,
};

// ============================================================
// PLUGIN CREATION
// ============================================================

/**
 * Create an ArchitectureInstance from options (for programmatic use).
 */
export async function createV4Instance(
  options: V4PluginOptions = {},
): Promise<ArchitectureInstance> {
  const factory = createArchitectureFactory();

  // Register all agent templates
  factory.registerTemplate(architectTemplate);
  factory.registerTemplate(executorTemplate);
  factory.registerTemplate(coderTemplate);
  factory.registerTemplate(reviewerTemplate);
  factory.registerTemplate(testEngineerTemplate);
  factory.registerTemplate(smeTemplate);
  factory.registerTemplate(explorerTemplate);
  factory.registerTemplate(criticTemplate);
  factory.registerTemplate(docsTemplate);
  factory.registerTemplate(designerTemplate);

  // Resolve architecture config
  let config: ArchitectureConfig;

  if (options.customConfig) {
    config = options.customConfig;
  } else if (options.configPath) {
    config = await loadArchitectureWithFallback(options.configPath, BUILTIN_CONFIGS);
  } else {
    const preset = options.architecture || 'spider';
    config = BUILTIN_CONFIGS[preset];
    if (!config) {
      throw new Error(
        `createV4Instance: unknown architecture preset "${preset}". Available: ${Object.keys(BUILTIN_CONFIGS).join(', ')}`,
      );
    }
  }

  return factory.create(config);
}

/**
 * V4 Plugin — OpenCode plugin entry point.
 * Returns Hooks that wire the V4 architecture into OpenCode.
 */
export default async function V4AgentPlugin(
  _input: PluginInput,
  options?: PluginOptions,
): Promise<Hooks> {
  const pluginOptions = (options ?? {}) as V4PluginOptions;

  const instance = await createV4Instance(pluginOptions);

  // Log initialization
  console.log(
    `[V4 Agent Plugin] Initialized "${instance.config.name}" architecture — ` +
    `${instance.brains.type} brain, ${instance.agents.size} agents, ${instance.clusters.size} clusters`,
  );

  // Return hooks — the architecture instance is available via closure
  // for coordination hooks to use
  return {
    event: async ({ event }) => {
      if (event.type === 'session.created') {
        const sessionEvent = event as any;
        console.log(`[V4 Agent Plugin] Session created: ${sessionEvent.sessionId ?? 'unknown'}`);
      }
    },

    'tool.execute.before': async ({ tool, sessionID }) => {
      // Log tool execution for observability
      console.log(`[V4 Agent Plugin] Tool "${tool}" called in session ${sessionID}`);
    },

    'experimental.chat.system.transform': async (_input, output) => {
      // Inject architecture-specific system context
      const brainContext = `Architecture: ${instance.config.name} (${instance.brains.type} brain). ` +
        `Active orchestrators: ${instance.brains.all.join(', ')}.`;
      output.system.push(brainContext);
    },
  };
}
