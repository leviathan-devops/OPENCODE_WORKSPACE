/**
 * src/index.ts
 * 
 * V4 Boilerplate Plugin Factory — Main Entry Point
 * 
 * This is a TEMPLATE. Copy and customize for your plugin.
 * 
 * This file demonstrates how to:
 * 1. Register agents for tab toggles
 * 2. Wire hooks with agent awareness
 * 3. Initialize the architecture factory
 */

import type { Plugin, PluginInput } from '@opencode-ai/plugin';

// Import v4.1 guardrail infrastructure
import {
  safeHook,
  createLogger,
  createAgentAwareness,
  type HookContext,
} from './v4.1/index.js';

// Import factory components
import {
  createArchitectureFactory,
  createStateStore,
  createBrainMessenger,
} from './factory/index.js';

// ============================================================
// STEP 1: CONFIGURE YOUR PLUGIN IDENTITY
// ============================================================

// Override the template identity with your plugin's actual identity
// This is REQUIRED — the boilerplate will not work without this
const MY_PLUGIN_IDENTITY = {
  name: 'my-plugin',           // Unique plugin identifier
  prefix: 'my_',              // Agent name prefix (e.g., 'my_coder')
  orchestrator: 'my-architect', // Orchestrator agent name

  agents: new Set([
    'my-architect',            // Primary (visible in tab toggle)
    'my-coder',               // Subagent (hidden)
    'my-reviewer',            // Subagent (hidden)
  ]),

  primaryAgents: new Set(['my-architect']),
  subagents: new Set(['my-coder', 'my-reviewer']),
};

// Create agent awareness for this plugin
const awareness = createAgentAwareness(
  MY_PLUGIN_IDENTITY.agents,
  MY_PLUGIN_IDENTITY.prefix,
  MY_PLUGIN_IDENTITY.orchestrator
);

// ============================================================
// STEP 2: DEFINE YOUR AGENTS
// ============================================================

const myAgents = new Map([
  ['my-architect', {
    description: 'My Plugin Architect — plans and coordinates',
    instructions: `You are the architect agent for My Plugin.

Your role:
- Analyze user requirements
- Create implementation plans
- Delegate tasks to sub-agents
- Review sub-agent outputs

You work with:
- my-coder: Executes implementation
- my-reviewer: Reviews code quality

Always:
- Start with a plan before coding
- Verify implementations against specs
- Use the my-reviewer for code reviews`,
  }],
  ['my-coder', {
    description: 'My Plugin Coder — writes code',
    instructions: `You are the coder agent for My Plugin.

Your role:
- Implement features exactly as specified by the architect
- Write clean, working code
- Run tests to verify your work

You receive tasks from: my-architect
You report to: my-architect

Rules:
- Do NOT design — only execute
- Always run tests after writing code
- Report completion to my-architect`,
  }],
  ['my-reviewer', {
    description: 'My Plugin Reviewer — reviews code quality',
    instructions: `You are the reviewer agent for My Plugin.

Your role:
- Review code for bugs and quality issues
- Verify code meets specifications
- Check test coverage

You review work from: my-coder
You report to: my-architect`,
  }],
]);

// ============================================================
// STEP 3: DEFINE YOUR HOOKS (All Using safeHook)
// ============================================================

const logger = createLogger(MY_PLUGIN_IDENTITY.name);

// Example: System transform hook (MUST check agent identity)
const systemEnhancerHook = safeHook(
  async (input, output: any, ctx) => {
    // MANDATORY: First check — is this our agent?
    if (!ctx.isMyAgent()) return;

    // Add plugin context to system prompt
    output.system = output.system || [];
    output.system.push(`[${ctx.agentName}] Operating in ${ctx.phase ?? 'unknown'} phase.`);
    logger.debug('System enhancer fired', { agent: ctx.agentName });
  },
  { 
    agentFilter: Array.from(MY_PLUGIN_IDENTITY.agents),
    pluginName: MY_PLUGIN_IDENTITY.name,
    managedAgents: MY_PLUGIN_IDENTITY.agents,
    agentPrefix: MY_PLUGIN_IDENTITY.prefix,
    orchestratorName: MY_PLUGIN_IDENTITY.orchestrator,
  }
);

// Example: Tool before hook
const toolBeforeHook = safeHook(
  async (input, output, ctx) => {
    if (!ctx.isMyAgent()) return;

    // Log tool calls
    logger.debug('Tool call', { tool: (input as any).tool, agent: ctx.agentName });
  },
  { 
    agentFilter: Array.from(MY_PLUGIN_IDENTITY.agents),
    pluginName: MY_PLUGIN_IDENTITY.name,
    managedAgents: MY_PLUGIN_IDENTITY.agents,
    agentPrefix: MY_PLUGIN_IDENTITY.prefix,
    orchestratorName: MY_PLUGIN_IDENTITY.orchestrator,
  }
);

// Example: Chat message hook
const chatMessageHook = safeHook(
  async (input, output, ctx) => {
    if (!ctx.isMyAgent()) return;

    // Track active agent in session state
    const sessionState = ctx.getSessionState();
    sessionState.activeAgent = ctx.agentName;

    logger.debug('Chat message', { agent: ctx.agentName });
  },
  { 
    agentFilter: Array.from(MY_PLUGIN_IDENTITY.agents),
    pluginName: MY_PLUGIN_IDENTITY.name,
    managedAgents: MY_PLUGIN_IDENTITY.agents,
    agentPrefix: MY_PLUGIN_IDENTITY.prefix,
    orchestratorName: MY_PLUGIN_IDENTITY.orchestrator,
  }
);

// ============================================================
// STEP 4: CREATE THE PLUGIN
// ============================================================

export default async function MyPlugin(input: PluginInput) {
  const logger = createLogger(MY_PLUGIN_IDENTITY.name);
  
  logger.info('Initializing My Plugin', {
    agents: Array.from(MY_PLUGIN_IDENTITY.agents),
  });

  // Initialize factory
  const factory = createArchitectureFactory();
  const stateStore = createStateStore();
  const messenger = createBrainMessenger();

  // ============================================================
  // RETURN THE PLUGIN HOOKS
  // ============================================================

  return {
    // Plugin name (optional)
    name: MY_PLUGIN_IDENTITY.name,

    // Register tools here
    tool: {},

    // Register agents via config callback (REQUIRED for tab toggles)
    config: async (opencodeConfig: Record<string, any>) => {
      // Use the correct pattern: Object.assign to opencodeConfig.agent
      const sdkConfigs: Record<string, any> = {};
      
      for (const [id, agent] of myAgents) {
        const isPrimary = MY_PLUGIN_IDENTITY.primaryAgents.has(id);
        
        sdkConfigs[id] = {
          name: id,
          description: agent.description,
          instructions: agent.instructions,
          mode: isPrimary ? 'primary' : 'subagent',
          permission: { task: 'allow' },
          tools: {},
        };

        // PRIMARY AGENTS: Do NOT set model — let OpenCode resolve it
        if (!isPrimary && id === 'my-coder') {
          // Subagents can optionally have explicit models
          // sdkConfigs[id].model = 'claude-3-5-sonnet';
        }
      }

      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...sdkConfigs };
      } else {
        Object.assign(opencodeConfig.agent, sdkConfigs);
      }

      logger.info('Agents registered', { 
        count: Object.keys(sdkConfigs).length,
        primary: Array.from(MY_PLUGIN_IDENTITY.primaryAgents),
      });
    },

    // Wire hooks
    'experimental.chat.system.transform': systemEnhancerHook,
    'tool.execute.before': toolBeforeHook,
    'chat.message': chatMessageHook,
  };
}
