// @bun
// src/v4.1/config/constants.ts
var HOOK_EXECUTION_TIMEOUT_MS = 30000;
var MAX_FALLBACK_FILE_SIZE = 10 * 1024 * 1024;

// src/v4.1/context/hook-context.ts
var VANILLA_AGENTS = new Set(["plan", "build", "general", "explore"]);
function createHookContext(input, awareness, sessionGetter, logger) {
  const sessionID = input?.sessionID ?? input?.session?.sessionId ?? "unknown";
  const agentName = input?.session?.agentName ?? input?.agent ?? undefined;
  const phase = input?.phase ?? undefined;
  return {
    sessionID,
    agentName,
    phase,
    isMyAgent: (agent) => awareness.isMyAgent(agent ?? agentName),
    isMyOrchestrator: (agent) => awareness.isMyOrchestrator(agent ?? agentName),
    isVanillaAgent: (agent) => awareness.isVanillaAgent(agent ?? agentName),
    isOtherPluginAgent: (agent) => awareness.isOtherPluginAgent(agent ?? agentName),
    getPhase: () => phase,
    getSessionState: () => sessionGetter(sessionID),
    log: logger
  };
}

// src/v4.1/state/session-state.ts
var sessionStates = new Map;
function getSessionState(sessionId) {
  let state = sessionStates.get(sessionId);
  if (!state) {
    state = {
      sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    sessionStates.set(sessionId, state);
  }
  state.lastActivity = Date.now();
  return state;
}

// src/v4.1/utils/logger.ts
var LOG_PREFIX = "[v4.1]";
function createLogger(pluginName) {
  const prefix = `${LOG_PREFIX}[${pluginName}]`;
  return {
    debug(message, meta) {
      console.debug(`${prefix} ${message}`, meta ?? {});
    },
    info(message, meta) {
      console.info(`${prefix} ${message}`, meta ?? {});
    },
    warn(message, meta) {
      console.warn(`${prefix} ${message}`, meta ?? {});
    },
    error(message, meta) {
      console.error(`${prefix} ${message}`, meta ?? {});
    }
  };
}

// src/v4.1/hooks/safe-hook.ts
var DEFAULT_PLUGIN_NAME = "v4-boilerplate";
function safeHook(handler, options = {}) {
  const {
    agentFilter = [],
    requiredPhase = null,
    timeout = HOOK_EXECUTION_TIMEOUT_MS,
    pluginName = DEFAULT_PLUGIN_NAME,
    managedAgents = new Set,
    agentPrefix = "",
    orchestratorName = ""
  } = options;
  const logger = createLogger(pluginName);
  const awareness = {
    isMyAgent(agentName) {
      if (!agentName)
        return false;
      if (managedAgents.has(agentName))
        return true;
      if (agentName.startsWith(agentPrefix))
        return true;
      if (agentName === orchestratorName)
        return true;
      return false;
    },
    isMyOrchestrator(agentName) {
      return agentName === orchestratorName;
    },
    isVanillaAgent(agentName) {
      return ["plan", "build", "general", "explore"].includes(agentName ?? "");
    },
    isOtherPluginAgent(agentName) {
      if (!agentName)
        return false;
      return !["plan", "build", "general", "explore"].includes(agentName) && !managedAgents.has(agentName) && !agentName.startsWith(agentPrefix) && agentName !== orchestratorName;
    }
  };
  return async (input, output) => {
    const ctx = createHookContext(input, awareness, getSessionState, logger);
    if (agentFilter !== null && agentFilter.length > 0) {
      if (!ctx.isMyAgent()) {
        return;
      }
      if (!agentFilter.includes(ctx.agentName ?? "")) {
        return;
      }
    }
    if (requiredPhase !== null && ctx.phase !== requiredPhase) {
      return;
    }
    const sessionState = getSessionState(ctx.sessionID);
    ctx.getSessionState = () => sessionState;
    const startTime = Date.now();
    try {
      await Promise.race([
        handler(input, output, ctx),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Hook timeout after ${timeout}ms`)), timeout))
      ]);
    } catch (err) {
      ctx.log.error(`Hook error in ${handler.name ?? "anonymous"}`, {
        error: err instanceof Error ? err.message : String(err),
        duration: Date.now() - startTime,
        sessionID: ctx.sessionID,
        agentName: ctx.agentName
      });
    }
  };
}
// src/v4.1/context/agent-awareness.ts
var VANILLA_AGENTS2 = new Set(["plan", "build", "general", "explore"]);
function createAgentAwareness(managedAgents, agentPrefix, orchestratorName) {
  return {
    isMyAgent(agentName) {
      if (!agentName)
        return false;
      if (managedAgents.has(agentName))
        return true;
      if (agentName.startsWith(agentPrefix))
        return true;
      if (agentName === orchestratorName)
        return true;
      return false;
    },
    isMyOrchestrator(agentName) {
      return agentName === orchestratorName;
    },
    isVanillaAgent(agentName) {
      return VANILLA_AGENTS2.has(agentName ?? "");
    },
    isOtherPluginAgent(agentName) {
      if (!agentName)
        return false;
      return !VANILLA_AGENTS2.has(agentName) && !managedAgents.has(agentName) && !agentName.startsWith(agentPrefix) && agentName !== orchestratorName;
    }
  };
}
var DEFAULT_AWARENESS = createAgentAwareness(new Set(["FIXME_SetYourAgentsHere"]), "FIXME_", "FIXME_orchestrator");
// src/factory/AgentFactory.ts
class AgentFactory {
  templates;
  constructor(templates = []) {
    this.templates = new Map(templates.map((t) => [t.id, t]));
  }
  registerTemplate(template) {
    this.templates.set(template.id, template);
  }
  createAgent(id, templateId, overrides) {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`[AgentFactory] Template "${templateId}" not found`);
      return null;
    }
    return {
      id,
      name: id,
      mode: "subagent",
      description: template.description,
      capabilities: [...template.capabilities],
      allowedTools: [...template.tools],
      maxConcurrentTasks: overrides?.maxConcurrentTasks ?? 1,
      prompt: overrides?.prompt ?? template.prompt,
      model: overrides?.model ?? template.defaultModel,
      temperature: overrides?.temperature ?? template.defaultTemperature
    };
  }
  createFromConfig(id, config) {
    return {
      id,
      name: config.name ?? id,
      mode: config.mode ?? "subagent",
      description: config.description ?? "",
      capabilities: config.capabilities ?? [],
      allowedTools: config.allowedTools ?? [],
      maxConcurrentTasks: config.maxConcurrentTasks ?? 1,
      prompt: config.prompt,
      model: config.model,
      temperature: config.temperature
    };
  }
  listTemplates() {
    return Array.from(this.templates.values());
  }
  getTemplate(id) {
    return this.templates.get(id);
  }
}
// src/factory/BrainFactory.ts
class BrainFactory {
  createBrain(config) {
    switch (config.type) {
      case "single":
        return this.createSingleBrain(config);
      case "dual":
        return this.createDualBrain(config);
      case "trio":
        return this.createTrioBrain(config);
      case "custom":
        return this.createCustomBrain(config);
      default:
        console.error(`[BrainFactory] Unknown brain type: ${config.type}`);
        return null;
    }
  }
  createSingleBrain(config) {
    const singleConfig = config;
    return {
      type: "single",
      primary: singleConfig.orchestrator,
      all: [singleConfig.orchestrator],
      hierarchy: {
        level: 0,
        children: []
      }
    };
  }
  createDualBrain(config) {
    const dualConfig = config;
    const orchestratorAgents = Object.values(dualConfig.orchestrators);
    const childInstances = orchestratorAgents.map((agentId) => ({
      type: "single",
      primary: agentId,
      all: [agentId],
      hierarchy: {
        level: 1,
        children: [],
        parent: "dual-brain"
      }
    }));
    return {
      type: "dual",
      primary: orchestratorAgents[0],
      all: orchestratorAgents,
      hierarchy: {
        level: 0,
        children: childInstances
      },
      workflows: dualConfig.workflows,
      syncMode: dualConfig.syncMode
    };
  }
  createTrioBrain(config) {
    const trioConfig = config;
    const orchestratorAgents = Object.values(trioConfig.orchestrators);
    const childInstances = orchestratorAgents.map((agentId) => ({
      type: "single",
      primary: agentId,
      all: [agentId],
      hierarchy: {
        level: 1,
        children: [],
        parent: "trio-brain"
      }
    }));
    return {
      type: "trio",
      primary: orchestratorAgents[0],
      all: orchestratorAgents,
      hierarchy: {
        level: 0,
        children: childInstances
      },
      workflows: trioConfig.workflows,
      syncMode: trioConfig.syncMode
    };
  }
  createCustomBrain(config) {
    return {
      type: "custom",
      primary: config.name,
      all: [config.name],
      hierarchy: {
        level: 0,
        children: []
      }
    };
  }
  getBrainType(config) {
    return config.type;
  }
  isParallel(config) {
    return config.type === "dual" || config.type === "trio";
  }
}
// src/factory/ClusterFactory.ts
class ClusterFactory {
  createCluster(config, agents) {
    const clusterAgents = [];
    for (const agentId of config.agents) {
      const agent = agents.get(agentId);
      if (!agent) {
        console.error(`[ClusterFactory] Agent "${agentId}" not found`);
        return null;
      }
      clusterAgents.push(agent);
    }
    const subOrchestrator = config.subOrchestrator ? agents.get(config.subOrchestrator) ?? undefined : undefined;
    return {
      config,
      agents: clusterAgents,
      subOrchestrator
    };
  }
  validateClusterConfig(config) {
    const errors = [];
    if (!config.id)
      errors.push("Cluster ID is required");
    if (!config.name)
      errors.push("Cluster name is required");
    if (!config.agents || config.agents.length === 0) {
      errors.push("Cluster must have at least one agent");
    }
    return { valid: errors.length === 0, errors };
  }
  getClusterAgents(cluster) {
    return cluster.agents;
  }
  getPrimaryAgent(cluster) {
    return cluster.subOrchestrator ?? cluster.agents[0];
  }
}
// src/factory/validators.ts
function validateRequiredFields(config) {
  const errors = [];
  const warnings = [];
  if (!config.name)
    errors.push("Architecture name is required");
  if (!config.version)
    errors.push("Architecture version is required");
  if (!config.brain)
    errors.push("Brain configuration is required");
  if (!config.agents || Object.keys(config.agents).length === 0) {
    errors.push("At least one agent is required");
  }
  return { valid: errors.length === 0, errors, warnings };
}
function validateBrainReferences(config) {
  const errors = [];
  const warnings = [];
  const agentIds = new Set(Object.keys(config.agents));
  if (config.brain.type === "single") {
    const orchestrator = config.brain.orchestrator;
    if (!agentIds.has(orchestrator)) {
      errors.push(`Orchestrator "${orchestrator}" not found in agents`);
    }
  }
  if (config.brain.type === "dual" || config.brain.type === "trio") {
    const orchestrators = config.brain.orchestrators;
    for (const [id, agentId] of Object.entries(orchestrators)) {
      if (!agentIds.has(agentId)) {
        errors.push(`Orchestrator "${id}" references agent "${agentId}" not found`);
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
function validateAgentReferences(config) {
  const errors = [];
  const warnings = [];
  for (const [agentId, agentDef] of Object.entries(config.agents)) {
    if (typeof agentDef === "string")
      continue;
    if (agentDef.cluster && !config.clusters.find((c) => c.id === agentDef.cluster)) {
      errors.push(`Agent "${agentId}" references cluster "${agentDef.cluster}" not found`);
    }
    if (agentDef.brain && !config.brain) {
      errors.push(`Agent "${agentId}" references brain "${agentDef.brain}" not found`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
function validateClusterIntegrity(config) {
  const errors = [];
  const warnings = [];
  const agentIds = new Set(Object.keys(config.agents));
  for (const cluster of config.clusters) {
    for (const agentId of cluster.agents) {
      if (!agentIds.has(agentId)) {
        errors.push(`Cluster "${cluster.id}" references agent "${agentId}" not found`);
      }
    }
    if (cluster.subOrchestrator && !agentIds.has(cluster.subOrchestrator)) {
      errors.push(`Cluster "${cluster.id}" references subOrchestrator "${cluster.subOrchestrator}" not found`);
    }
    if (cluster.parentCluster && !config.clusters.find((c) => c.id === cluster.parentCluster)) {
      errors.push(`Cluster "${cluster.id}" references parentCluster "${cluster.parentCluster}" not found`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
function validateToolPermissions(config) {
  const errors = [];
  const warnings = [];
  for (const [agentId, agentDef] of Object.entries(config.agents)) {
    if (typeof agentDef === "string")
      continue;
    const dangerousCombos = [
      { tools: ["write", "bash"], reason: "write + bash can execute arbitrary code" }
    ];
    for (const combo of dangerousCombos) {
      const hasAll = combo.tools.every((t) => agentDef.allowedTools.includes(t));
      if (hasAll) {
        warnings.push(`Agent "${agentId}" has ${combo.tools.join(" + ")}: ${combo.reason}`);
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
function validateStateOwnership(config) {
  const errors = [];
  const warnings = [];
  return { valid: errors.length === 0, errors, warnings };
}
function validateWorkflowGates(config) {
  const errors = [];
  const warnings = [];
  if (config.brain.type === "dual" || config.brain.type === "trio") {
    const workflows = config.brain.workflows;
    for (const [orchestratorId, workflow] of Object.entries(workflows)) {
      for (const delegateId of workflow.delegatesTo) {
        if (!Object.keys(config.agents).includes(delegateId)) {
          errors.push(`Workflow "${orchestratorId}" delegates to "${delegateId}" not found`);
        }
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
function runValidators(config) {
  const allErrors = [];
  const allWarnings = [];
  const validators = [
    validateRequiredFields,
    validateBrainReferences,
    validateAgentReferences,
    validateClusterIntegrity,
    validateToolPermissions,
    validateStateOwnership,
    validateWorkflowGates
  ];
  for (const validator of validators) {
    const result = validator(config);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

// src/factory/ArchitectureFactory.ts
class ArchitectureFactory {
  agentFactory;
  brainFactory;
  clusterFactory;
  constructor() {
    this.agentFactory = new AgentFactory;
    this.brainFactory = new BrainFactory;
    this.clusterFactory = new ClusterFactory;
  }
  registerAgentTemplate(template) {
    this.agentFactory.registerTemplate(template);
  }
  createArchitecture(config) {
    const validation = runValidators(config);
    if (!validation.valid) {
      console.error("[ArchitectureFactory] Validation failed:", validation.errors);
      return null;
    }
    const agents = new Map;
    for (const [id, agentDef] of Object.entries(config.agents)) {
      if (typeof agentDef === "string") {
        const agent = this.agentFactory.createAgent(id, agentDef);
        if (!agent) {
          console.error(`[ArchitectureFactory] Failed to create agent "${id}" from template`);
          return null;
        }
        agents.set(id, agent);
      } else {
        const agent = this.agentFactory.createFromConfig(id, agentDef);
        agents.set(id, agent);
      }
    }
    const brain = this.brainFactory.createBrain(config.brain);
    if (!brain) {
      console.error("[ArchitectureFactory] Failed to create brain");
      return null;
    }
    const clusters = new Map;
    for (const clusterConfig of config.clusters) {
      clusters.set(clusterConfig.id, clusterConfig);
    }
    const coordination = this.createCoordination(agents, config);
    const stateStore = createStateStore();
    const messenger = createBrainMessenger();
    return {
      config,
      agents,
      clusters,
      brains: {
        type: brain.type,
        primary: brain.primary,
        all: brain.all,
        workflows: brain.workflows,
        syncMode: brain.syncMode
      },
      coordination,
      stateStore,
      messenger
    };
  }
  createCoordination(agents, _config) {
    const registry = {
      getAgent: (agentId) => agents.get(agentId) ?? null,
      getAgentsByMode: (mode) => Array.from(agents.values()).filter((a) => a.mode === mode),
      getAgentsByCluster: (clusterId) => Array.from(agents.values()).filter((a) => a.cluster === clusterId),
      isAgentAllowedTool: (agentId, toolName) => {
        const agent = agents.get(agentId);
        return agent?.allowedTools.includes(toolName) ?? false;
      },
      listAgents: () => Array.from(agents.values())
    };
    const delegation = {
      delegate: async (request) => {
        console.log("[DelegationEngine] Delegating:", request);
        return { success: true, taskId: `task_${Date.now()}` };
      },
      canDelegate: (fromAgent, toAgent) => {
        const from = agents.get(fromAgent);
        const to = agents.get(toAgent);
        if (!from || !to)
          return false;
        return from.capabilities.includes("delegate");
      },
      getClusterAgents: (clusterId) => Array.from(agents.values()).filter((a) => a.cluster === clusterId),
      enforceGate: (request) => ({ allowed: true })
    };
    const taskStore = new Map;
    const stateMachine = {
      createTask: (input) => {
        const task = {
          id: input.id,
          status: "pending",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          assignedAgent: input.assignedAgent,
          context: input.context
        };
        taskStore.set(input.id, task);
        return task;
      },
      transition: (taskId, to) => {
        const task = taskStore.get(taskId);
        if (!task)
          return null;
        task.status = to;
        task.updatedAt = Date.now();
        return task;
      },
      getTask: (taskId) => taskStore.get(taskId) ?? null,
      getTasksByState: (state) => Array.from(taskStore.values()).filter((t) => t.status === state),
      getTasksByAgent: (agentId) => Array.from(taskStore.values()).filter((t) => t.assignedAgent === agentId),
      canTransition: (taskId, _to) => {
        const task = taskStore.get(taskId);
        return task !== undefined;
      }
    };
    return { registry, delegation, stateMachine };
  }
  getAgentFactory() {
    return this.agentFactory;
  }
  getBrainFactory() {
    return this.brainFactory;
  }
  getClusterFactory() {
    return this.clusterFactory;
  }
}
function createArchitectureFactory() {
  return new ArchitectureFactory;
}
// src/factory/StateStore.ts
var DOMAIN_OWNERSHIP = {
  "plan-state": ["architect"],
  "execution-state": ["executor"],
  "quality-state": ["guardian", "executor"]
};
function createStateStore() {
  const data = new Map;
  const versions = new Map;
  const watchers = new Map;
  function getKey(key, domain) {
    return domain ? `${domain}:${key}` : key;
  }
  return {
    get(key, domain) {
      const fullKey = getKey(key, domain);
      return data.get(fullKey);
    },
    set(key, value, domain, ownerBrain) {
      const fullKey = getKey(key, domain);
      if (ownerBrain) {
        const owners = DOMAIN_OWNERSHIP[domain];
        if (owners && !owners.includes(ownerBrain)) {
          return {
            success: false,
            version: versions.get(fullKey) ?? 0,
            error: `Brain "${ownerBrain}" does not own domain "${domain}". Owners: ${owners.join(", ")}`
          };
        }
      }
      const currentVersion = versions.get(fullKey) ?? 0;
      const newVersion = currentVersion + 1;
      data.set(fullKey, value);
      versions.set(fullKey, newVersion);
      const watchersForKey = watchers.get(fullKey);
      if (watchersForKey) {
        for (const callback of watchersForKey) {
          try {
            callback(value, newVersion);
          } catch {}
        }
      }
      return { success: true, version: newVersion };
    },
    watch(key, callback) {
      const allKeys = [key];
      for (const domain of Object.keys(DOMAIN_OWNERSHIP)) {
        allKeys.push(`${domain}:${key}`);
      }
      for (const fullKey of allKeys) {
        if (!watchers.has(fullKey)) {
          watchers.set(fullKey, []);
        }
        watchers.get(fullKey).push(callback);
      }
      return () => {
        for (const fullKey of allKeys) {
          const list = watchers.get(fullKey);
          if (list) {
            const idx = list.indexOf(callback);
            if (idx !== -1)
              list.splice(idx, 1);
          }
        }
      };
    },
    snapshot() {
      const snapshotData = {};
      const snapshotVersions = {};
      for (const [key, value] of data.entries()) {
        snapshotData[key] = value;
      }
      for (const [key, version] of versions.entries()) {
        snapshotVersions[key] = version;
      }
      return {
        data: snapshotData,
        versions: snapshotVersions,
        timestamp: Date.now()
      };
    },
    restore(snapshot) {
      data.clear();
      versions.clear();
      for (const [key, value] of Object.entries(snapshot.data)) {
        data.set(key, value);
      }
      for (const [key, version] of Object.entries(snapshot.versions)) {
        versions.set(key, version);
      }
    }
  };
}
// src/factory/BrainMessenger.ts
var PRIORITY_ORDER = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3
};
function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
function createBrainMessenger() {
  const queues = new Map;
  const pendingAcks = new Map;
  const receivedAcks = new Set;
  function getQueue(brainId) {
    if (!queues.has(brainId)) {
      queues.set(brainId, []);
    }
    return queues.get(brainId);
  }
  function sortQueue(queue) {
    queue.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }
  return {
    send(message) {
      const msg = {
        id: message.id || generateId(),
        from: message.from,
        to: message.to,
        type: message.type,
        priority: message.priority,
        payload: message.payload,
        timestamp: message.timestamp || Date.now(),
        requiresAck: message.requiresAck ?? false
      };
      const queue = getQueue(msg.to);
      queue.push(msg);
      sortQueue(queue);
      if (msg.type === "ack") {
        if (pendingAcks.has(msg.id)) {
          const pending = pendingAcks.get(msg.id);
          if (!pending.resolved) {
            pending.resolved = true;
            clearTimeout(pending.timer);
            pending.resolve(true);
          }
        } else {
          receivedAcks.add(msg.id);
        }
      }
    },
    receive(brainId) {
      const queue = getQueue(brainId);
      const messages = [...queue];
      queue.length = 0;
      return messages;
    },
    waitForAck(messageId, timeoutMs) {
      if (receivedAcks.has(messageId)) {
        receivedAcks.delete(messageId);
        return Promise.resolve(true);
      }
      return new Promise((resolve, _reject) => {
        const timer = setTimeout(() => {
          if (!pendingAcks.has(messageId) || !pendingAcks.get(messageId).resolved) {
            resolve(false);
          }
        }, timeoutMs);
        pendingAcks.set(messageId, { resolved: false, resolve, reject: () => {}, timer });
      });
    }
  };
}
// src/v4.1/state/global-state.ts
var toolMetrics = new Map;
// src/v4.1/config/identity.ts
var PLUGIN_IDENTITY = {
  name: "FIXME",
  prefix: "FIXME_",
  orchestrator: "FIXME",
  agents: new Set([
    "FIXME-architect",
    "FIXME-coder",
    "FIXME-reviewer",
    "FIXME-tester"
  ]),
  primaryAgents: new Set([
    "FIXME-architect"
  ]),
  subagents: new Set([
    "FIXME-coder",
    "FIXME-reviewer",
    "FIXME-tester"
  ])
};
// src/index.ts
var MY_PLUGIN_IDENTITY = {
  name: "my-plugin",
  prefix: "my_",
  orchestrator: "my-architect",
  agents: new Set([
    "my-architect",
    "my-coder",
    "my-reviewer"
  ]),
  primaryAgents: new Set(["my-architect"]),
  subagents: new Set(["my-coder", "my-reviewer"])
};
var awareness = createAgentAwareness(MY_PLUGIN_IDENTITY.agents, MY_PLUGIN_IDENTITY.prefix, MY_PLUGIN_IDENTITY.orchestrator);
var myAgents = new Map([
  ["my-architect", {
    description: "My Plugin Architect \u2014 plans and coordinates",
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
- Use the my-reviewer for code reviews`
  }],
  ["my-coder", {
    description: "My Plugin Coder \u2014 writes code",
    instructions: `You are the coder agent for My Plugin.

Your role:
- Implement features exactly as specified by the architect
- Write clean, working code
- Run tests to verify your work

You receive tasks from: my-architect
You report to: my-architect

Rules:
- Do NOT design \u2014 only execute
- Always run tests after writing code
- Report completion to my-architect`
  }],
  ["my-reviewer", {
    description: "My Plugin Reviewer \u2014 reviews code quality",
    instructions: `You are the reviewer agent for My Plugin.

Your role:
- Review code for bugs and quality issues
- Verify code meets specifications
- Check test coverage

You review work from: my-coder
You report to: my-architect`
  }]
]);
var logger = createLogger(MY_PLUGIN_IDENTITY.name);
var systemEnhancerHook = safeHook(async (input, output, ctx) => {
  if (!ctx.isMyAgent())
    return;
  output.system = output.system || [];
  output.system.push(`[${ctx.agentName}] Operating in ${ctx.phase ?? "unknown"} phase.`);
  logger.debug("System enhancer fired", { agent: ctx.agentName });
}, {
  agentFilter: Array.from(MY_PLUGIN_IDENTITY.agents),
  pluginName: MY_PLUGIN_IDENTITY.name,
  managedAgents: MY_PLUGIN_IDENTITY.agents,
  agentPrefix: MY_PLUGIN_IDENTITY.prefix,
  orchestratorName: MY_PLUGIN_IDENTITY.orchestrator
});
var toolBeforeHook = safeHook(async (input, output, ctx) => {
  if (!ctx.isMyAgent())
    return;
  logger.debug("Tool call", { tool: input.tool, agent: ctx.agentName });
}, {
  agentFilter: Array.from(MY_PLUGIN_IDENTITY.agents),
  pluginName: MY_PLUGIN_IDENTITY.name,
  managedAgents: MY_PLUGIN_IDENTITY.agents,
  agentPrefix: MY_PLUGIN_IDENTITY.prefix,
  orchestratorName: MY_PLUGIN_IDENTITY.orchestrator
});
var chatMessageHook = safeHook(async (input, output, ctx) => {
  if (!ctx.isMyAgent())
    return;
  const sessionState = ctx.getSessionState();
  sessionState.activeAgent = ctx.agentName;
  logger.debug("Chat message", { agent: ctx.agentName });
}, {
  agentFilter: Array.from(MY_PLUGIN_IDENTITY.agents),
  pluginName: MY_PLUGIN_IDENTITY.name,
  managedAgents: MY_PLUGIN_IDENTITY.agents,
  agentPrefix: MY_PLUGIN_IDENTITY.prefix,
  orchestratorName: MY_PLUGIN_IDENTITY.orchestrator
});
async function MyPlugin(input) {
  const logger2 = createLogger(MY_PLUGIN_IDENTITY.name);
  logger2.info("Initializing My Plugin", {
    agents: Array.from(MY_PLUGIN_IDENTITY.agents)
  });
  const factory = createArchitectureFactory();
  const stateStore = createStateStore();
  const messenger = createBrainMessenger();
  return {
    name: MY_PLUGIN_IDENTITY.name,
    tool: {},
    config: async (opencodeConfig) => {
      const sdkConfigs = {};
      for (const [id, agent] of myAgents) {
        const isPrimary2 = MY_PLUGIN_IDENTITY.primaryAgents.has(id);
        sdkConfigs[id] = {
          name: id,
          description: agent.description,
          instructions: agent.instructions,
          mode: isPrimary2 ? "primary" : "subagent",
          permission: { task: "allow" },
          tools: {}
        };
        if (!isPrimary2 && id === "my-coder") {}
      }
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...sdkConfigs };
      } else {
        Object.assign(opencodeConfig.agent, sdkConfigs);
      }
      logger2.info("Agents registered", {
        count: Object.keys(sdkConfigs).length,
        primary: Array.from(MY_PLUGIN_IDENTITY.primaryAgents)
      });
    },
    "experimental.chat.system.transform": systemEnhancerHook,
    "tool.execute.before": toolBeforeHook,
    "chat.message": chatMessageHook
  };
}
export {
  MyPlugin as default
};
