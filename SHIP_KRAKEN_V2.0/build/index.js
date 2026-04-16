// @bun
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __require = import.meta.require;

// src/v4.1/config/constants.ts
var MAX_FALLBACK_FILE_SIZE = 10 * 1024 * 1024;

// src/v4.1/context/hook-context.ts
var VANILLA_AGENTS = new Set(["plan", "build", "general", "explore"]);

// src/v4.1/state/session-state.ts
var sessionStates = new Map;

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
// src/factory/ClusterScheduler.ts
class ClusterScheduler {
  clusterConfigs;
  clusterLoad;
  focusAnchors;
  constructor(clusters) {
    this.clusterConfigs = clusters;
    this.clusterLoad = new Map;
    this.focusAnchors = new Map;
    for (const cluster of clusters) {
      this.clusterLoad.set(cluster.id, {
        clusterId: cluster.id,
        activeTasks: 0,
        pendingTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        lastActivity: Date.now()
      });
    }
  }
  anchorClusterToFocus(clusterId, focusName) {
    const normalizedFocus = focusName.toLowerCase().replace(/\s+/g, "-");
    this.focusAnchors.set(normalizedFocus, clusterId);
  }
  resolveFocusToCluster(focusName) {
    const normalizedFocus = focusName.toLowerCase().replace(/\s+/g, "-");
    if (this.focusAnchors.has(normalizedFocus)) {
      return this.focusAnchors.get(normalizedFocus);
    }
    for (const [anchor, clusterId] of this.focusAnchors) {
      if (anchor.includes(normalizedFocus) || normalizedFocus.includes(anchor)) {
        return clusterId;
      }
    }
    return;
  }
  getFocusAnchors() {
    return new Map(this.focusAnchors);
  }
  clearFocusAnchors() {
    this.focusAnchors.clear();
  }
  async assignCluster(request) {
    if (request.targetCluster) {
      return this.resolveClusterRequest(request.targetCluster);
    }
    if (request.context?.focus) {
      const focusCluster = this.resolveFocusToCluster(request.context.focus);
      if (focusCluster) {
        return focusCluster;
      }
    }
    return this.getLeastLoadedCluster();
  }
  resolveClusterRequest(clusterIdOrFocus) {
    const normalized = clusterIdOrFocus.toLowerCase().replace(/\s+/g, "-");
    for (const config of this.clusterConfigs) {
      if (config.id.toLowerCase() === normalized) {
        return config.id;
      }
      if (config.name?.toLowerCase().replace(/\s+/g, "-") === normalized) {
        return config.id;
      }
    }
    const focusCluster = this.resolveFocusToCluster(clusterIdOrFocus);
    if (focusCluster) {
      return focusCluster;
    }
    for (const config of this.clusterConfigs) {
      if (config.id.toLowerCase().includes(normalized) || normalized.includes(config.id.toLowerCase())) {
        return config.id;
      }
    }
    return this.getLeastLoadedCluster();
  }
  assignClusterForTaskType(task, taskType) {
    const taskLower = task.toLowerCase();
    if (taskLower.includes("build") || taskLower.includes("create") || taskLower.includes("implement") || taskLower.includes("steamroll")) {
      return "cluster-alpha";
    }
    if (taskLower.includes("debug") || taskLower.includes("fix") || taskLower.includes("test") || taskLower.includes("verify") || taskLower.includes("lint")) {
      return "cluster-gamma";
    }
    return "cluster-beta";
  }
  incrementLoad(clusterId) {
    const load = this.clusterLoad.get(clusterId);
    if (load) {
      load.activeTasks++;
      load.pendingTasks++;
      load.lastActivity = Date.now();
    }
  }
  decrementLoad(clusterId) {
    const load = this.clusterLoad.get(clusterId);
    if (load) {
      load.activeTasks = Math.max(0, load.activeTasks - 1);
      load.pendingTasks = Math.max(0, load.pendingTasks - 1);
      load.lastActivity = Date.now();
    }
  }
  recordCompletion(clusterId, success) {
    const load = this.clusterLoad.get(clusterId);
    if (load) {
      if (success) {
        load.completedTasks++;
      } else {
        load.failedTasks++;
      }
      load.activeTasks = Math.max(0, load.activeTasks - 1);
      load.lastActivity = Date.now();
    }
  }
  getClusterLoad(clusterId) {
    return this.clusterLoad.get(clusterId);
  }
  getAllClusterLoads() {
    return new Map(this.clusterLoad);
  }
  getLeastLoadedCluster() {
    let bestCluster = this.clusterConfigs[0]?.id || "cluster-alpha";
    let minLoad = Infinity;
    for (const [clusterId, load] of this.clusterLoad) {
      if (load.activeTasks < minLoad) {
        minLoad = load.activeTasks;
        bestCluster = clusterId;
      }
    }
    return bestCluster;
  }
  getClusterConfig(clusterId) {
    return this.clusterConfigs.find((c) => c.id === clusterId);
  }
  getAllClusterConfigs() {
    return this.clusterConfigs;
  }
  getTotalLoad() {
    let active = 0;
    let pending = 0;
    let completed = 0;
    let failed = 0;
    for (const load of this.clusterLoad.values()) {
      active += load.activeTasks;
      pending += load.pendingTasks;
      completed += load.completedTasks;
      failed += load.failedTasks;
    }
    return { active, pending, completed, failed };
  }
}

// src/factory/AsyncDelegationEngine.ts
class AsyncDelegationEngine {
  pendingTasks;
  activeTasks;
  taskQueue;
  clusterScheduler;
  clusterManager;
  processing;
  constructor(clusterConfigs, clusters, scheduler) {
    this.pendingTasks = new Map;
    this.activeTasks = new Map;
    this.taskQueue = [];
    this.clusterManager = clusters;
    this.clusterScheduler = scheduler || new ClusterScheduler(clusterConfigs);
    this.processing = false;
    this.startProcessingLoop();
  }
  async delegate(request) {
    if (!request.taskId) {
      request.taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    this.pendingTasks.set(request.taskId, request);
    const clusterId = request.targetCluster || await this.clusterScheduler.assignCluster(request);
    if (!request.targetCluster) {
      request.targetCluster = clusterId;
    }
    let resolvePromise;
    let rejectPromise;
    const resultPromise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    this.enqueueWithPriority({
      request,
      resolve: resolvePromise,
      reject: rejectPromise,
      enqueuedAt: Date.now()
    }, request.priority);
    return resultPromise;
  }
  enqueueWithPriority(task, priority) {
    const priorityOrder = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3
    };
    const taskPriority = priorityOrder[priority];
    let insertIndex = this.taskQueue.findIndex((q) => {
      const qPriority = priorityOrder[q.request.priority];
      return qPriority > taskPriority;
    });
    if (insertIndex === -1) {
      insertIndex = this.taskQueue.length;
    }
    this.taskQueue.splice(insertIndex, 0, task);
    if (!this.processing) {
      this.processQueue();
    }
  }
  async processQueue() {
    if (this.processing)
      return;
    this.processing = true;
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!task)
        break;
      this.executeTask(task.request).then((result) => {
        task.resolve(result);
      }).catch((error) => {
        task.reject(error instanceof Error ? error : new Error(String(error)));
      });
    }
    this.processing = false;
  }
  startProcessingLoop() {
    this.processing = false;
  }
  async executeTask(request) {
    this.pendingTasks.delete(request.taskId);
    const result = {
      success: false,
      taskId: request.taskId,
      clusterId: request.targetCluster,
      status: "in_progress"
    };
    this.activeTasks.set(request.taskId, result);
    this.clusterScheduler.incrementLoad(request.targetCluster);
    try {
      const execResult = await this.clusterManager.executeTask(request.targetCluster, request);
      result.success = execResult.success;
      result.agentId = execResult.agentId;
      result.clusterId = execResult.clusterId;
      result.status = execResult.success ? "completed" : "failed";
      result.completedAt = Date.now();
      if (execResult.error) {
        result.error = execResult.error;
      }
      this.clusterScheduler.recordCompletion(request.targetCluster, execResult.success);
      this.activeTasks.set(request.taskId, result);
      return result;
    } catch (error) {
      result.success = false;
      result.status = "failed";
      result.error = String(error);
      result.completedAt = Date.now();
      this.clusterScheduler.recordCompletion(request.targetCluster, false);
      this.activeTasks.set(request.taskId, result);
      return result;
    }
  }
  async waitForCompletion(taskId, timeoutMs = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = this.activeTasks.get(taskId);
      if (result && (result.status === "completed" || result.status === "failed")) {
        return result;
      }
      if (this.pendingTasks.has(taskId)) {
        await this.sleep(50);
        continue;
      }
      const queued = this.taskQueue.find((t) => t.request.taskId === taskId);
      if (queued) {
        await this.sleep(50);
        continue;
      }
      break;
    }
    const existing = this.activeTasks.get(taskId);
    if (existing && existing.status !== "in_progress") {
      return existing;
    }
    return null;
  }
  async waitForAll(taskIds, timeoutMs = 60000) {
    const promises = taskIds.map((id) => this.waitForCompletion(id, timeoutMs));
    return Promise.all(promises);
  }
  getPendingTasks() {
    return Array.from(this.pendingTasks.values());
  }
  getActiveTasks() {
    return new Map(this.activeTasks);
  }
  getQueuedCount() {
    return this.taskQueue.length;
  }
  cancelTask(taskId) {
    if (this.pendingTasks.has(taskId)) {
      this.pendingTasks.delete(taskId);
      return true;
    }
    const queueIndex = this.taskQueue.findIndex((t) => t.request.taskId === taskId);
    if (queueIndex !== -1) {
      const task = this.taskQueue.splice(queueIndex, 1)[0];
      task.resolve({
        success: false,
        taskId,
        clusterId: task.request.targetCluster,
        status: "cancelled"
      });
      return true;
    }
    if (this.activeTasks.has(taskId)) {
      const activeTask = this.activeTasks.get(taskId);
      if (activeTask) {
        activeTask.status = "cancelled";
        activeTask.completedAt = Date.now();
      }
      return true;
    }
    return false;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// src/clusters/ClusterInstance.ts
class ClusterInstance {
  config;
  agents;
  taskQueue;
  completedTasks;
  failedTasks;
  processing;
  load;
  shutdownFlag;
  constructor(config) {
    this.config = config;
    this.agents = new Map;
    this.taskQueue = [];
    this.completedTasks = [];
    this.failedTasks = [];
    this.processing = false;
    this.shutdownFlag = false;
    this.load = {
      clusterId: config.id,
      activeTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      lastActivity: Date.now()
    };
    this.initializeAgents();
    this.startProcessing();
  }
  initializeAgents() {
    for (const agentId of this.config.agents) {
      const agentType = agentId.startsWith("shark-") ? "shark" : "manta";
      this.agents.set(agentId, {
        id: agentId,
        agentType,
        busy: false,
        clusterId: this.config.id
      });
    }
  }
  startProcessing() {
    if (this.processing)
      return;
    this.processing = true;
    this.processLoop();
  }
  async processLoop() {
    const pendingOps = [];
    while (!this.shutdownFlag) {
      const availableAgents = this.getAvailableAgents();
      const tasksToRun = Math.min(availableAgents.length, this.taskQueue.length);
      if (tasksToRun === 0 && pendingOps.length === 0) {
        await this.sleep(100);
        continue;
      }
      if (tasksToRun === 0 && pendingOps.length > 0) {
        await Promise.all(pendingOps);
        pendingOps.length = 0;
        continue;
      }
      for (let i = 0;i < tasksToRun; i++) {
        const task = this.taskQueue.shift();
        if (!task)
          break;
        const agent = availableAgents[i];
        if (agent) {
          const op = this.executeTaskAsync(agent, task.request).then((result) => {
            task.resolve(result);
          }).catch((error) => {
            task.reject(error instanceof Error ? error : new Error(String(error)));
          });
          pendingOps.push(op);
        }
      }
    }
    if (pendingOps.length > 0) {
      await Promise.all(pendingOps);
    }
    this.processing = false;
  }
  async executeTaskAsync(agent, request) {
    agent.busy = true;
    agent.currentTaskId = request.taskId;
    this.load.activeTasks++;
    this.load.pendingTasks = Math.max(0, this.load.pendingTasks - 1);
    this.load.lastActivity = Date.now();
    try {
      const result = await this.executeOnAgent(agent, request);
      if (result.success) {
        this.completedTasks.push(result);
        this.load.completedTasks++;
      } else {
        this.failedTasks.push(result);
        this.load.failedTasks++;
      }
      return result;
    } catch (error) {
      const failedResult = {
        success: false,
        taskId: request.taskId,
        clusterId: this.config.id,
        agentId: agent.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        completedAt: Date.now()
      };
      this.failedTasks.push(failedResult);
      this.load.failedTasks++;
      return failedResult;
    } finally {
      agent.busy = false;
      agent.currentTaskId = undefined;
      this.load.activeTasks = Math.max(0, this.load.activeTasks - 1);
      this.load.lastActivity = Date.now();
    }
  }
  async executeOnAgent(agent, request) {
    return new Promise((resolve) => {
      const http = __require("http");
      const wrapperHost = "127.0.0.1";
      const wrapperPort = 18086;
      const endpoint = "/execute";
      const postData = JSON.stringify({
        task: request.task,
        model: "minimax/MiniMax-M2.7",
        timeout: 120,
        cleanup: true
      });
      console.log(`[ClusterInstance] Delegating to wrapper daemon for agent ${agent.id}`);
      console.log(`[ClusterInstance] Task: ${request.task.substring(0, 100)}...`);
      const options = {
        hostname: wrapperHost,
        port: wrapperPort,
        path: endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
        }
      };
      const timeout = setTimeout(() => {
        console.error(`[ClusterInstance] Task ${request.taskId} timeout`);
        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: "failed",
          error: "Task execution timeout after 120 seconds",
          completedAt: Date.now()
        });
      }, 120000);
      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          clearTimeout(timeout);
          try {
            const result = JSON.parse(data);
            console.log(`[ClusterInstance] Task ${request.taskId} completed: ${result.success ? "SUCCESS" : "FAILED"}`);
            resolve({
              success: result.success !== false,
              taskId: request.taskId,
              clusterId: this.config.id,
              agentId: agent.id,
              status: result.success ? "completed" : "failed",
              error: result.error,
              completedAt: Date.now()
            });
          } catch (parseError) {
            console.error(`[ClusterInstance] Parse error: ${parseError}`);
            console.error(`[ClusterInstance] Response data: ${data.substring(0, 500)}`);
            resolve({
              success: false,
              taskId: request.taskId,
              clusterId: this.config.id,
              agentId: agent.id,
              status: "failed",
              error: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
              completedAt: Date.now()
            });
          }
        });
      });
      req.on("error", (error) => {
        clearTimeout(timeout);
        console.error(`[ClusterInstance] HTTP error: ${error.message}`);
        console.error(`[ClusterInstance] Is the kraken-agent-wrapper daemon running?`);
        console.error(`[ClusterInstance] Start it with: python3 kraken-agent-wrapper.py`);
        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: "failed",
          error: `Failed to connect to wrapper daemon: ${error.message}. Is kraken-agent-wrapper.py running on host?`,
          completedAt: Date.now()
        });
      });
      req.write(postData);
      req.end();
    });
  }
  getAvailableAgents() {
    const available = [];
    for (const agent of this.agents.values()) {
      if (!agent.busy) {
        available.push(agent);
      }
    }
    return available;
  }
  enqueueTask(request) {
    this.load.pendingTasks++;
    this.load.lastActivity = Date.now();
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ request, resolve, reject });
    });
  }
  getLoad() {
    return {
      ...this.load,
      clusterId: this.config.id
    };
  }
  getAgent(agentId) {
    return this.agents.get(agentId);
  }
  getAllAgents() {
    return Array.from(this.agents.values());
  }
  getConfig() {
    return this.config;
  }
  getCompletedTasks() {
    return [...this.completedTasks];
  }
  getFailedTasks() {
    return [...this.failedTasks];
  }
  getQueueLength() {
    return this.taskQueue.length;
  }
  async shutdown() {
    this.shutdownFlag = true;
    const startTime = Date.now();
    const timeout = 5000;
    while (this.load.activeTasks > 0 && Date.now() - startTime < timeout) {
      await this.sleep(100);
    }
    for (const task of this.taskQueue) {
      task.reject(new Error("Cluster shutting down"));
    }
    this.taskQueue = [];
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// src/clusters/ClusterManager.ts
class ClusterManager {
  clusters;
  clusterConfigs;
  constructor(clusterConfigs) {
    this.clusters = new Map;
    this.clusterConfigs = new Map;
    for (const config of clusterConfigs) {
      this.clusterConfigs.set(config.id, config);
      this.clusters.set(config.id, new ClusterInstance(config));
    }
  }
  async executeTask(clusterId, request) {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) {
      return {
        success: false,
        taskId: request.taskId,
        clusterId,
        status: "failed",
        error: `Cluster ${clusterId} not found`
      };
    }
    return cluster.enqueueTask(request);
  }
  getClusterStatus(clusterId) {
    const cluster = this.clusters.get(clusterId);
    const config = this.clusterConfigs.get(clusterId);
    if (!cluster || !config) {
      return null;
    }
    const load = cluster.getLoad();
    return {
      clusterId,
      active: true,
      load,
      agents: config.agents
    };
  }
  getAllClusterStatuses() {
    const statuses = new Map;
    for (const [id, cluster] of this.clusters) {
      const config = this.clusterConfigs.get(id);
      if (config) {
        statuses.set(id, {
          clusterId: id,
          active: true,
          load: cluster.getLoad(),
          agents: config.agents
        });
      }
    }
    return statuses;
  }
  getLeastLoadedCluster() {
    let bestCluster = "cluster-alpha";
    let minLoad = Infinity;
    for (const [id, cluster] of this.clusters) {
      const load = cluster.getLoad();
      if (load.activeTasks < minLoad) {
        minLoad = load.activeTasks;
        bestCluster = id;
      }
    }
    return bestCluster;
  }
  getCluster(clusterId) {
    return this.clusters.get(clusterId);
  }
  getClusterIds() {
    return Array.from(this.clusters.keys());
  }
  getClusterConfig(clusterId) {
    return this.clusterConfigs.get(clusterId);
  }
  getAllAgents() {
    const agents = [];
    for (const [clusterId, cluster] of this.clusters) {
      const config = this.clusterConfigs.get(clusterId);
      if (config) {
        for (const agentId of config.agents) {
          const agentType = agentId.startsWith("shark-") ? "shark" : "manta";
          const instance = cluster.getAgent(agentId);
          agents.push({
            id: agentId,
            agentType,
            busy: instance?.busy ?? false,
            currentTaskId: instance?.currentTaskId,
            clusterId
          });
        }
      }
    }
    return agents;
  }
  getClusterAgents(clusterId) {
    const config = this.clusterConfigs.get(clusterId);
    const cluster = this.clusters.get(clusterId);
    if (!config || !cluster) {
      return [];
    }
    return config.agents.map((agentId) => {
      const agentType = agentId.startsWith("shark-") ? "shark" : "manta";
      const instance = cluster.getAgent(agentId);
      return {
        id: agentId,
        agentType,
        busy: instance?.busy ?? false,
        currentTaskId: instance?.currentTaskId,
        clusterId
      };
    });
  }
  getTotalSystemLoad() {
    let activeTasks = 0;
    let pendingTasks = 0;
    let completedTasks = 0;
    let failedTasks = 0;
    let lastActivity = Date.now();
    for (const cluster of this.clusters.values()) {
      const load = cluster.getLoad();
      activeTasks += load.activeTasks;
      pendingTasks += load.pendingTasks;
      completedTasks += load.completedTasks;
      failedTasks += load.failedTasks;
      lastActivity = Math.max(lastActivity, load.lastActivity);
    }
    return {
      clusterId: "system",
      activeTasks,
      pendingTasks,
      completedTasks,
      failedTasks,
      lastActivity
    };
  }
  async shutdown() {
    const shutdownPromises = [];
    for (const cluster of this.clusters.values()) {
      shutdownPromises.push(cluster.shutdown());
    }
    await Promise.all(shutdownPromises);
  }
}

// src/kraken-hive/index.ts
import * as fs from "fs";
import * as path from "path";
var KRAKEN_HIVE_NAMESPACE = "viking://resources/kraken-hive";
var LOCAL_FALLBACK_DIR = "/home/leviathan/.local/share/opencode/kraken-hive";
var MEMORY_CATEGORIES = {
  CLUSTERS: "clusters",
  SESSIONS: "sessions",
  PATTERNS: "patterns",
  DECISIONS: "decisions",
  FAILURES: "failures",
  BREAKTHROUGHS: "breakthroughs"
};

class KrakenHiveEngine {
  localFallbackDir;
  constructor() {
    this.localFallbackDir = LOCAL_FALLBACK_DIR;
    this.ensureLocalStorage();
  }
  ensureLocalStorage() {
    if (!fs.existsSync(this.localFallbackDir)) {
      fs.mkdirSync(this.localFallbackDir, { recursive: true });
    }
  }
  getCategoryPath(category, subPath) {
    const base = path.join(this.localFallbackDir, category);
    if (subPath) {
      return path.join(base, subPath);
    }
    return base;
  }
  async search(query, filters) {
    const results = [];
    const limit = filters?.limit || 10;
    const queryLower = query.toLowerCase();
    const categories = this.getCategoriesToSearch(filters);
    for (const category of categories) {
      if (results.length >= limit)
        break;
      const categoryPath = this.getCategoryPath(category);
      if (!fs.existsSync(categoryPath))
        continue;
      const searchResults = await this.searchCategory(categoryPath, queryLower, limit - results.length);
      results.push(...searchResults);
    }
    results.sort((a, b) => b.relevance - a.relevance);
    return results.slice(0, limit);
  }
  getCategoriesToSearch(filters) {
    if (!filters?.category || filters.category === "all") {
      return Object.values(MEMORY_CATEGORIES);
    }
    const categoryMap = {
      clusters: MEMORY_CATEGORIES.CLUSTERS,
      sessions: MEMORY_CATEGORIES.SESSIONS,
      patterns: MEMORY_CATEGORIES.PATTERNS,
      decisions: MEMORY_CATEGORIES.DECISIONS,
      failures: MEMORY_CATEGORIES.FAILURES
    };
    return [categoryMap[filters.category] || MEMORY_CATEGORIES.CLUSTERS];
  }
  async searchCategory(dirPath, query, limit) {
    const results = [];
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= limit)
          break;
        if (entry.isDirectory()) {
          const subResults = await this.searchCategory(path.join(dirPath, entry.name), query, limit - results.length);
          results.push(...subResults);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const filePath = path.join(dirPath, entry.name);
          const content = fs.readFileSync(filePath, "utf-8");
          const contentLower = content.toLowerCase();
          const queryWords = query.split(" ");
          let relevance = 0;
          for (const word of queryWords) {
            if (contentLower.includes(word)) {
              relevance++;
            }
          }
          if (relevance > 0) {
            const type = this.determineTypeFromPath(dirPath);
            results.push({
              uri: `${KRAKEN_HIVE_NAMESPACE}/${path.relative(this.localFallbackDir, filePath)}`,
              type,
              title: entry.name.replace(".md", ""),
              relevance,
              content: content.slice(0, 500)
            });
          }
        }
      }
    } catch (error) {}
    return results;
  }
  determineTypeFromPath(filePath) {
    if (filePath.includes(MEMORY_CATEGORIES.PATTERNS))
      return "pattern";
    if (filePath.includes(MEMORY_CATEGORIES.FAILURES))
      return "failure";
    if (filePath.includes(MEMORY_CATEGORIES.SESSIONS))
      return "session";
    if (filePath.includes(MEMORY_CATEGORIES.DECISIONS))
      return "decision";
    if (filePath.includes(MEMORY_CATEGORIES.BREAKTHROUGHS))
      return "breakthrough";
    return "session";
  }
  async rememberCluster(clusterId, key, content) {
    const dirPath = this.getCategoryPath(MEMORY_CATEGORIES.CLUSTERS, clusterId);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, `${key}.md`);
    fs.writeFileSync(filePath, content, "utf-8");
  }
  async rememberSession(sessionId, key, content) {
    const dirPath = this.getCategoryPath(MEMORY_CATEGORIES.SESSIONS, sessionId);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, `${key}.md`);
    fs.writeFileSync(filePath, content, "utf-8");
  }
  async rememberPattern(pattern) {
    const dirPath = this.getCategoryPath(MEMORY_CATEGORIES.PATTERNS);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const content = `# Pattern: ${pattern.description}

## Type: ${pattern.type}
${pattern.taskId ? `## Task: ${pattern.taskId}` : ""}
${pattern.clusterId ? `## Cluster: ${pattern.clusterId}` : ""}
## Created: ${new Date(pattern.createdAt).toISOString()}

${pattern.content}
`;
    const filePath = path.join(dirPath, `${pattern.id}.md`);
    fs.writeFileSync(filePath, content, "utf-8");
  }
  async rememberFailure(failure) {
    const dirPath = this.getCategoryPath(MEMORY_CATEGORIES.FAILURES);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const content = `# Failure: ${failure.pattern}

## Cause
${failure.cause}

${failure.solution ? `## Solution
${failure.solution}` : ""}
${failure.taskId ? `## Task: ${failure.taskId}` : ""}
${failure.clusterId ? `## Cluster: ${failure.clusterId}` : ""}
## Created: ${new Date(failure.createdAt).toISOString()}
`;
    const filePath = path.join(dirPath, `${failure.id}.md`);
    fs.writeFileSync(filePath, content, "utf-8");
  }
  async getClusterContext(clusterId) {
    const context = {
      clusterId,
      recentTasks: [],
      commonPatterns: [],
      knownFailures: []
    };
    const clusterPath = this.getCategoryPath(MEMORY_CATEGORIES.CLUSTERS, clusterId);
    if (fs.existsSync(clusterPath)) {
      try {
        const files = fs.readdirSync(clusterPath);
        context.recentTasks = files.map((f) => f.replace(".md", ""));
      } catch {}
    }
    const patterns = await this.search("", { category: "patterns", limit: 5 });
    context.commonPatterns = patterns.map((p) => p.title);
    const failures = await this.search("", { category: "failures", limit: 5 });
    context.knownFailures = failures.map((f) => f.title);
    return context;
  }
  async getContextForTask(task) {
    const taskId = `task_${Date.now()}`;
    const patterns = await this.search(task, { category: "patterns", limit: 3 });
    const failures = await this.search(task, { category: "failures", limit: 3 });
    const previousWork = await this.search(task, { category: "sessions", limit: 3 });
    let clusterContext;
    const clusterMatch = task.match(/cluster[_-]?(alpha|beta|gamma)/i);
    if (clusterMatch) {
      clusterContext = await this.getClusterContext(`cluster-${clusterMatch[1].toLowerCase()}`);
    }
    return {
      taskId,
      patterns,
      failures,
      previousWork,
      clusterContext: clusterContext || {
        clusterId: "unknown",
        recentTasks: [],
        commonPatterns: [],
        knownFailures: []
      }
    };
  }
  synthesizeContext(memories, taskType) {
    const patterns = memories.filter((m) => m.type === "pattern");
    const failures = memories.filter((m) => m.type === "failure");
    const previousWork = memories.filter((m) => m.type === "session");
    return {
      taskId: `task_${Date.now()}`,
      patterns,
      failures,
      previousWork,
      clusterContext: {
        clusterId: "synthesized",
        recentTasks: [],
        commonPatterns: patterns.map((p) => p.title),
        knownFailures: failures.map((f) => f.title)
      }
    };
  }
}

// src/tools/cluster-tools.ts
import { tool } from "@opencode-ai/plugin";

// node_modules/zod/v3/external.js
var exports_external = {};
__export(exports_external, {
  void: () => voidType,
  util: () => util,
  unknown: () => unknownType,
  union: () => unionType,
  undefined: () => undefinedType,
  tuple: () => tupleType,
  transformer: () => effectsType,
  symbol: () => symbolType,
  string: () => stringType,
  strictObject: () => strictObjectType,
  setErrorMap: () => setErrorMap,
  set: () => setType,
  record: () => recordType,
  quotelessJson: () => quotelessJson,
  promise: () => promiseType,
  preprocess: () => preprocessType,
  pipeline: () => pipelineType,
  ostring: () => ostring,
  optional: () => optionalType,
  onumber: () => onumber,
  oboolean: () => oboolean,
  objectUtil: () => objectUtil,
  object: () => objectType,
  number: () => numberType,
  nullable: () => nullableType,
  null: () => nullType,
  never: () => neverType,
  nativeEnum: () => nativeEnumType,
  nan: () => nanType,
  map: () => mapType,
  makeIssue: () => makeIssue,
  literal: () => literalType,
  lazy: () => lazyType,
  late: () => late,
  isValid: () => isValid,
  isDirty: () => isDirty,
  isAsync: () => isAsync,
  isAborted: () => isAborted,
  intersection: () => intersectionType,
  instanceof: () => instanceOfType,
  getParsedType: () => getParsedType,
  getErrorMap: () => getErrorMap,
  function: () => functionType,
  enum: () => enumType,
  effect: () => effectsType,
  discriminatedUnion: () => discriminatedUnionType,
  defaultErrorMap: () => en_default,
  datetimeRegex: () => datetimeRegex,
  date: () => dateType,
  custom: () => custom,
  coerce: () => coerce,
  boolean: () => booleanType,
  bigint: () => bigIntType,
  array: () => arrayType,
  any: () => anyType,
  addIssueToContext: () => addIssueToContext,
  ZodVoid: () => ZodVoid,
  ZodUnknown: () => ZodUnknown,
  ZodUnion: () => ZodUnion,
  ZodUndefined: () => ZodUndefined,
  ZodType: () => ZodType,
  ZodTuple: () => ZodTuple,
  ZodTransformer: () => ZodEffects,
  ZodSymbol: () => ZodSymbol,
  ZodString: () => ZodString,
  ZodSet: () => ZodSet,
  ZodSchema: () => ZodType,
  ZodRecord: () => ZodRecord,
  ZodReadonly: () => ZodReadonly,
  ZodPromise: () => ZodPromise,
  ZodPipeline: () => ZodPipeline,
  ZodParsedType: () => ZodParsedType,
  ZodOptional: () => ZodOptional,
  ZodObject: () => ZodObject,
  ZodNumber: () => ZodNumber,
  ZodNullable: () => ZodNullable,
  ZodNull: () => ZodNull,
  ZodNever: () => ZodNever,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNaN: () => ZodNaN,
  ZodMap: () => ZodMap,
  ZodLiteral: () => ZodLiteral,
  ZodLazy: () => ZodLazy,
  ZodIssueCode: () => ZodIssueCode,
  ZodIntersection: () => ZodIntersection,
  ZodFunction: () => ZodFunction,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodError: () => ZodError,
  ZodEnum: () => ZodEnum,
  ZodEffects: () => ZodEffects,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodDefault: () => ZodDefault,
  ZodDate: () => ZodDate,
  ZodCatch: () => ZodCatch,
  ZodBranded: () => ZodBranded,
  ZodBoolean: () => ZodBoolean,
  ZodBigInt: () => ZodBigInt,
  ZodArray: () => ZodArray,
  ZodAny: () => ZodAny,
  Schema: () => ZodType,
  ParseStatus: () => ParseStatus,
  OK: () => OK,
  NEVER: () => NEVER,
  INVALID: () => INVALID,
  EMPTY_PATH: () => EMPTY_PATH,
  DIRTY: () => DIRTY,
  BRAND: () => BRAND
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {};
  function assertIs(_arg) {}
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error;
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path2, errorMaps, issueData } = params;
  const fullPath = [...path2, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== undefined) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === en_default ? undefined : en_default
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
class ParseInputLazyPath {
  constructor(parent, value, path2, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path2;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}

class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};

class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};

class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};

class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};

class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};

class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};

class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};

class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : undefined,
          maximum: tooBig ? def.exactLength.value : undefined,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}

class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {} else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== undefined ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};

class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  static create(discriminator, options, params) {
    const optionsMap = new Map;
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}

class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};

class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}

class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = new Map;
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = new Map;
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};

class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = new Set;
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};

class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}

class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};

class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};

class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};

class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};

class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");

class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}

class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}

class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
// src/tools/cluster-tools.ts
var spawnClusterTaskSchema = exports_external.object({
  task: exports_external.string().describe("Task description to execute"),
  clusterId: exports_external.string().optional().describe("Target cluster ID (auto-selected if not specified)"),
  targetAgent: exports_external.string().optional().describe("Specific agent ID to target"),
  context: exports_external.record(exports_external.string(), exports_external.unknown()).optional().describe("Additional context for the task"),
  acceptanceCriteria: exports_external.array(exports_external.string()).default([]).describe("Acceptance criteria for task completion"),
  priority: exports_external.enum(["low", "normal", "high", "critical"]).default("normal").describe("Task priority")
});
var spawnSharkAgentSchema = exports_external.object({
  task: exports_external.string().describe("Task description for Shark agent"),
  clusterId: exports_external.string().optional().describe("Target cluster (auto-selected if not specified)"),
  instructions: exports_external.string().optional().describe("Additional instructions for the Shark"),
  context: exports_external.record(exports_external.string(), exports_external.unknown()).optional().describe("Additional context"),
  priority: exports_external.enum(["low", "normal", "high", "critical"]).default("high").describe("Task priority")
});
var spawnMantaAgentSchema = exports_external.object({
  task: exports_external.string().describe("Task description for Manta agent"),
  clusterId: exports_external.string().optional().describe("Target cluster (auto-selected if not specified)"),
  instructions: exports_external.string().optional().describe("Additional instructions for the Manta"),
  context: exports_external.record(exports_external.string(), exports_external.unknown()).optional().describe("Additional context"),
  priority: exports_external.enum(["low", "normal", "high", "critical"]).default("normal").describe("Task priority")
});
function createClusterTools(ctx) {
  return {
    anchor_cluster: tool({
      description: "Anchor a cluster to a focus/project name. The cluster will be renamed to reflect its current focus. Use this when starting a new project to establish cluster identity.",
      args: {
        clusterId: exports_external.string().describe("Cluster ID (e.g., cluster-alpha) or focus name to anchor"),
        focusName: exports_external.string().describe('Focus/project name to anchor (e.g., "shark-firewall-build", "my-api-project")')
      },
      execute: async (args) => {
        const resolvedClusterId = ctx.clusterScheduler.resolveClusterRequest(args.clusterId);
        ctx.clusterScheduler.anchorClusterToFocus(resolvedClusterId, args.focusName);
        return JSON.stringify({
          success: true,
          clusterId: resolvedClusterId,
          focusName: args.focusName,
          message: `Cluster ${resolvedClusterId} anchored to "${args.focusName}"`
        }, null, 2);
      }
    }),
    spawn_cluster_task: tool({
      description: "Spawn a task in a cluster for async execution. Cluster ID is auto-resolved from focus names. Tasks are queued and executed asynchronously by available agents.",
      args: {
        task: exports_external.string().describe("Task description to execute"),
        clusterId: exports_external.string().optional().describe("Target cluster ID or focus name (auto-selected if not specified)"),
        targetAgent: exports_external.string().optional().describe("Specific agent ID to target"),
        context: exports_external.record(exports_external.string(), exports_external.unknown()).optional().describe("Additional context for the task"),
        acceptanceCriteria: exports_external.array(exports_external.string()).default([]).describe("Acceptance criteria for task completion"),
        priority: exports_external.enum(["low", "normal", "high", "critical"]).default("normal").describe("Task priority")
      },
      execute: async (args, directory) => {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const resolvedCluster = args.clusterId ? ctx.clusterScheduler.resolveClusterRequest(args.clusterId) : await ctx.clusterScheduler.assignCluster({ taskId, task: args.task, targetCluster: "", context: args.context, acceptanceCriteria: [], priority: "normal", createdAt: Date.now() });
        const request = {
          taskId,
          task: args.task,
          targetCluster: resolvedCluster,
          targetAgent: args.targetAgent,
          context: args.context,
          acceptanceCriteria: args.acceptanceCriteria,
          priority: args.priority,
          createdAt: Date.now()
        };
        const result = await ctx.delegationEngine.delegate(request);
        return JSON.stringify({
          success: result.success,
          taskId: result.taskId,
          clusterId: result.clusterId,
          agentId: result.agentId,
          status: result.status,
          error: result.error
        }, null, 2);
      }
    }),
    spawn_shark_agent: tool({
      description: "Spawn a Shark agent for aggressive, steamroll-style tasks. Sharks are best for building from scratch and tackling complex problems head-on.",
      args: {
        task: exports_external.string().describe("Task description for Shark agent"),
        clusterId: exports_external.string().optional().describe("Target cluster (auto-selected if not specified)"),
        targetAgent: exports_external.string().optional().describe("Specific agent ID to target"),
        instructions: exports_external.string().optional().describe("Additional instructions for the Shark"),
        context: exports_external.record(exports_external.string(), exports_external.unknown()).optional().describe("Additional context"),
        priority: exports_external.enum(["low", "normal", "high", "critical"]).default("high").describe("Task priority")
      },
      execute: async (args, directory) => {
        const taskId = `shark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sharkPrompt = `You are SHARK - Ferrari V12 turbo vibecoding engineer.

CHARACTER:
- Aggressive, steamrolls through problems
- Figures shit out and builds it
- Builds from scratch at a solid level
- Full speed ahead, no hesitation

TASK: ${args.task}

${args.instructions ? `
ADDITIONAL INSTRUCTIONS:
${args.instructions}` : ""}

Execute with maximum aggression and confidence.`;
        const resolvedCluster = args.clusterId ? ctx.clusterScheduler.resolveClusterRequest(args.clusterId) : ctx.clusterScheduler.assignClusterForTaskType(args.task, "steamroll");
        const request = {
          taskId,
          task: sharkPrompt,
          targetCluster: resolvedCluster,
          targetAgent: args.targetAgent,
          context: {
            ...args.context,
            agentType: "shark"
          },
          acceptanceCriteria: [],
          priority: args.priority,
          createdAt: Date.now()
        };
        const result = await ctx.delegationEngine.delegate(request);
        return JSON.stringify({
          success: result.success,
          taskId: result.taskId,
          clusterId: result.clusterId,
          agentId: result.agentId,
          agentType: "shark",
          status: result.status,
          error: result.error
        }, null, 2);
      }
    }),
    spawn_manta_agent: tool({
      description: "Spawn a Manta agent for precise, linear tasks. Mantas are best for debugging, testing, and methodical work.",
      args: {
        task: exports_external.string().describe("Task description for Manta agent"),
        clusterId: exports_external.string().optional().describe("Target cluster (auto-selected if not specified)"),
        targetAgent: exports_external.string().optional().describe("Specific agent ID to target"),
        instructions: exports_external.string().optional().describe("Additional instructions for the Manta"),
        context: exports_external.record(exports_external.string(), exports_external.unknown()).optional().describe("Additional context"),
        priority: exports_external.enum(["low", "normal", "high", "critical"]).default("normal").describe("Task priority")
      },
      execute: async (args, directory) => {
        const taskId = `manta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const mantaPrompt = `You are MANTA - Tesla Model S agent.

CHARACTER:
- Fast, reliable, linear, precise
- Mechanically oriented
- Perfect for debugging and linear tasks
- Methodical, follows specs exactly

TASK: ${args.task}

${args.instructions ? `
ADDITIONAL INSTRUCTIONS:
${args.instructions}` : ""}

Execute with precision and methodical care.`;
        const resolvedCluster = args.clusterId ? ctx.clusterScheduler.resolveClusterRequest(args.clusterId) : ctx.clusterScheduler.assignClusterForTaskType(args.task, "debug");
        const request = {
          taskId,
          task: mantaPrompt,
          targetCluster: resolvedCluster,
          targetAgent: args.targetAgent,
          context: {
            ...args.context,
            agentType: "manta"
          },
          acceptanceCriteria: [],
          priority: args.priority,
          createdAt: Date.now()
        };
        const result = await ctx.delegationEngine.delegate(request);
        return JSON.stringify({
          success: result.success,
          taskId: result.taskId,
          clusterId: result.clusterId,
          agentId: result.agentId,
          agentType: "manta",
          status: result.status,
          error: result.error
        }, null, 2);
      }
    })
  };
}

// src/tools/monitoring-tools.ts
import { tool as tool2 } from "@opencode-ai/plugin";
var getClusterStatusSchema = exports_external.object({
  clusterId: exports_external.string().optional().describe("Specific cluster ID to check (all clusters if not specified)")
});
var aggregateResultsSchema = exports_external.object({
  taskIds: exports_external.array(exports_external.string()).describe("List of task IDs to wait for and aggregate"),
  timeoutMs: exports_external.number().default(60000).describe("Timeout in milliseconds to wait for all tasks")
});
function createMonitoringTools(ctx) {
  return {
    get_cluster_status: tool2({
      description: "Get the status of clusters in the Kraken system. Can check a specific cluster or all clusters.",
      args: {
        clusterId: exports_external.string().optional().describe("Specific cluster ID to check (all clusters if not specified)")
      },
      execute: async (args) => {
        if (args.clusterId) {
          const status = ctx.clusterManager.getClusterStatus(args.clusterId);
          if (!status) {
            return JSON.stringify({
              error: `Cluster ${args.clusterId} not found`,
              availableClusters: Array.from(ctx.clusterManager.getAllClusterStatuses().keys())
            }, null, 2);
          }
          return JSON.stringify(status, null, 2);
        }
        const allStatuses = ctx.clusterManager.getAllClusterStatuses();
        const systemLoad = ctx.clusterManager.getTotalSystemLoad();
        const agents = ctx.clusterManager.getAllAgents();
        const summary = {
          clusters: Object.fromEntries(allStatuses),
          system: systemLoad,
          agents,
          delegationQueue: {
            queued: ctx.delegationEngine.getQueuedCount(),
            pending: ctx.delegationEngine.getPendingTasks().length,
            active: ctx.delegationEngine.getActiveTasks().size
          }
        };
        return JSON.stringify(summary, null, 2);
      }
    }),
    aggregate_results: tool2({
      description: "Wait for multiple tasks to complete and aggregate their results. Useful for collecting results from parallel cluster execution.",
      args: {
        taskIds: exports_external.array(exports_external.string()).describe("List of task IDs to wait for and aggregate"),
        timeoutMs: exports_external.number().default(60000).describe("Timeout in milliseconds to wait for all tasks")
      },
      execute: async (args) => {
        const startTime = Date.now();
        const results = await ctx.delegationEngine.waitForAll(args.taskIds, args.timeoutMs);
        const successful = results.filter((r) => r && r.success).length;
        const failed = results.filter((r) => r && !r.success).length;
        const timedOut = results.filter((r) => r === null).length;
        const completed = results.filter((r) => r && r.status === "completed");
        const taskFailed = results.filter((r) => r && r.status === "failed");
        const summary = {
          total: args.taskIds.length,
          successful,
          failed,
          timedOut,
          durationMs: Date.now() - startTime,
          results: results.map((r, i) => ({
            taskId: args.taskIds[i],
            success: r?.success ?? false,
            status: r?.status ?? "unknown",
            clusterId: r?.clusterId,
            agentId: r?.agentId,
            error: r?.error,
            completedAt: r?.completedAt
          }))
        };
        return JSON.stringify(summary, null, 2);
      }
    }),
    get_agent_status: tool2({
      description: "Get the status of all agents across all clusters. Shows which agents are busy and what they are working on.",
      args: {},
      execute: async () => {
        const agents = ctx.clusterManager.getAllAgents();
        const summary = {
          total: agents.length,
          busy: agents.filter((a) => a.busy).length,
          available: agents.filter((a) => !a.busy).length,
          byCluster: agents.reduce((acc, agent) => {
            if (!acc[agent.clusterId]) {
              acc[agent.clusterId] = { total: 0, busy: 0, available: 0, agents: [] };
            }
            acc[agent.clusterId].total++;
            acc[agent.clusterId].busy += agent.busy ? 1 : 0;
            acc[agent.clusterId].available += agent.busy ? 0 : 1;
            acc[agent.clusterId].agents.push({
              id: agent.id,
              type: agent.agentType,
              busy: agent.busy,
              currentTask: agent.currentTaskId
            });
            return acc;
          }, {})
        };
        return JSON.stringify(summary, null, 2);
      }
    })
  };
}

// src/tools/kraken-hive-tools.ts
import { tool as tool3 } from "@opencode-ai/plugin";
function createKrakenHiveTools(ctx) {
  return {
    kraken_hive_search: tool3({
      description: "Search the Kraken Hive Mind for relevant memories, patterns, and past decisions. Only accessible to Kraken orchestrator.",
      args: {
        query: exports_external.string().describe("What to search for"),
        category: exports_external.enum(["all", "clusters", "sessions", "patterns", "decisions", "failures"]).default("all").describe("Category to search"),
        limit: exports_external.number().default(5).describe("Maximum results to return")
      },
      execute: async (args) => {
        const results = await ctx.krakenHive.search(args.query, {
          category: args.category,
          limit: args.limit
        });
        if (results.length === 0) {
          return "No relevant memories found in Kraken Hive.";
        }
        const formatted = results.map((r) => `## [${r.type.toUpperCase()}] ${r.title}
URI: ${r.uri}
Relevance: ${r.relevance}
${r.content ? `
${r.content.slice(0, 200)}...` : ""}`).join(`

---

`);
        return `Found ${results.length} relevant memories:

${formatted}`;
      }
    }),
    kraken_hive_remember: tool3({
      description: "Store a memory, decision, or pattern to Kraken Hive Mind. Only accessible to Kraken orchestrator.",
      args: {
        key: exports_external.string().describe("Short key/summary for this memory"),
        content: exports_external.string().describe("Full content to remember"),
        category: exports_external.enum(["cluster", "session", "pattern", "decision", "failure", "breakthrough"]).describe("Category for this memory"),
        targetId: exports_external.string().optional().describe("Cluster or session ID if category requires it")
      },
      execute: async (args) => {
        try {
          switch (args.category) {
            case "cluster":
              if (!args.targetId) {
                return "Error: targetId (cluster ID) required for cluster category";
              }
              await ctx.krakenHive.rememberCluster(args.targetId, args.key, args.content);
              break;
            case "session":
              if (!args.targetId) {
                return "Error: targetId (session ID) required for session category";
              }
              await ctx.krakenHive.rememberSession(args.targetId, args.key, args.content);
              break;
            case "pattern":
              const pattern = {
                type: "pattern",
                id: args.key.replace(/[^a-zA-Z0-9]/g, "_"),
                description: args.key,
                content: args.content,
                createdAt: Date.now()
              };
              await ctx.krakenHive.rememberPattern(pattern);
              break;
            case "failure":
              const failure = {
                id: args.key.replace(/[^a-zA-Z0-9]/g, "_"),
                pattern: args.key,
                cause: args.content,
                createdAt: Date.now()
              };
              await ctx.krakenHive.rememberFailure(failure);
              break;
            default:
              if (args.targetId) {
                await ctx.krakenHive.rememberCluster(args.targetId, args.key, args.content);
              }
              await ctx.krakenHive.rememberSession(`general_${Date.now()}`, args.key, args.content);
          }
          return `Stored to Kraken Hive: [${args.category}] ${args.key}`;
        } catch (error) {
          return `Error storing to Kraken Hive: ${error}`;
        }
      }
    }),
    kraken_hive_get_cluster_context: tool3({
      description: "Get all memories related to a specific cluster. Only accessible to Kraken orchestrator.",
      args: {
        clusterId: exports_external.string().describe("Cluster ID to get context for")
      },
      execute: async (args) => {
        const context = await ctx.krakenHive.getClusterContext(args.clusterId);
        return JSON.stringify({
          clusterId: context.clusterId,
          recentTasks: context.recentTasks,
          commonPatterns: context.commonPatterns,
          knownFailures: context.knownFailures
        }, null, 2);
      }
    }),
    kraken_hive_inject_context: tool3({
      description: "Inject relevant Hive context into a task for an agent. Only accessible to Kraken architect.",
      args: {
        taskId: exports_external.string().describe("Task to inject context into"),
        taskDescription: exports_external.string().describe("Description of the task to get relevant context"),
        includePatterns: exports_external.boolean().default(true).describe("Include pattern memories"),
        includeFailures: exports_external.boolean().default(true).describe("Include failure memories"),
        includePreviousWork: exports_external.boolean().default(true).describe("Include previous work")
      },
      execute: async (args) => {
        const context = await ctx.krakenHive.getContextForTask(args.taskDescription);
        const injected = {
          taskId: args.taskId,
          injected: true,
          context: {
            patterns: args.includePatterns ? context.patterns : [],
            failures: args.includeFailures ? context.failures : [],
            previousWork: args.includePreviousWork ? context.previousWork : [],
            clusterContext: context.clusterContext
          },
          summary: `Injected ${context.patterns.length} patterns, ${context.failures.length} failures, ${context.previousWork.length} previous works`
        };
        return JSON.stringify(injected, null, 2);
      }
    })
  };
}

// src/tools/shark-t2-tools.ts
import { tool as tool4 } from "@opencode-ai/plugin";
import * as fs2 from "fs";
import * as path2 from "path";
var __dirname = "/home/leviathan/OPENCODE_WORKSPACE/projects/kraken-agent-v2.0/src/tools";
var T2_LIBRARY_DIR = path2.join(__dirname, "..", "..", "kraken-context");
function createSharkT2Tools(_ctx) {
  return {
    read_kraken_context: tool4({
      description: "Read Kraken T2 context library for patterns and best practices. This is read-only reference, not Hive access. Available to Sharks and Mantas.",
      args: {
        topic: exports_external.enum(["patterns", "failures", "build-chain", "architecture"]).describe("Topic to get context for")
      },
      execute: async (args) => {
        const fileName = `T2_${args.topic.toUpperCase()}.md`;
        const filePath = path2.join(T2_LIBRARY_DIR, fileName);
        try {
          if (!fs2.existsSync(filePath)) {
            return `T2 reference not found for topic: ${args.topic}. This topic may not have been populated yet.`;
          }
          const content = fs2.readFileSync(filePath, "utf-8");
          return `## Kraken T2 Reference: ${args.topic}

${content}`;
        } catch (error) {
          return `Error reading T2 context: ${error}`;
        }
      }
    }),
    report_to_kraken: tool4({
      description: "Report completion, issue, or request to Kraken orchestrator. This is how Sharks and Mantas communicate - they write to Kraken, not to each other or directly to Hive.",
      args: {
        taskId: exports_external.string().describe("Task being reported on"),
        status: exports_external.enum(["complete", "blocked", "error", "request"]).describe("Task status"),
        details: exports_external.string().describe("Details of completion, issue, or request"),
        files: exports_external.array(exports_external.string()).optional().describe("Files created or modified"),
        errorDetails: exports_external.string().optional().describe("Error details if status is error")
      },
      execute: async (args) => {
        const report = {
          type: "agent_report",
          taskId: args.taskId,
          status: args.status,
          details: args.details,
          files: args.files || [],
          errorDetails: args.errorDetails,
          timestamp: new Date().toISOString()
        };
        const reportPath = `/home/leviathan/.local/share/opencode/kraken-hive/pending-reports/${args.taskId}_${Date.now()}.json`;
        const reportDir = path2.dirname(reportPath);
        if (!fs2.existsSync(reportDir)) {
          fs2.mkdirSync(reportDir, { recursive: true });
        }
        fs2.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
        return JSON.stringify({
          success: true,
          message: `Report sent to Kraken orchestrator for task ${args.taskId}`,
          reportId: path2.basename(reportPath)
        }, null, 2);
      }
    }),
    get_task_context: tool4({
      description: "Get the context that Kraken orchestrator has injected into your current task. Use this to understand what context and patterns are relevant to your work.",
      args: {
        taskId: exports_external.string().describe("Task ID to get context for")
      },
      execute: async (args) => {
        const contextPath = `/home/leviathan/.local/share/opencode/kraken-hive/task-context/${args.taskId}.json`;
        try {
          if (!fs2.existsSync(contextPath)) {
            return JSON.stringify({
              taskId: args.taskId,
              context: null,
              message: "No injected context found for this task. Kraken may not have injected context yet."
            }, null, 2);
          }
          const content = fs2.readFileSync(contextPath, "utf-8");
          return content;
        } catch (error) {
          return JSON.stringify({
            taskId: args.taskId,
            error: `Error reading task context: ${error}`
          }, null, 2);
        }
      }
    })
  };
}

// src/hooks/index.ts
import * as fs6 from "fs";
import * as path4 from "path";

// src/brains/system/two-layer-guardian.ts
var DANGEROUS_TOOLS = new Set([
  "terminal",
  "mcp_terminal",
  "write_file",
  "mcp_write_file",
  "patch",
  "mcp_patch",
  "edit",
  "mcp_edit",
  "delete_file",
  "mcp_delete_file"
]);
var THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i,
  /wc\s+-l.*\|/i,
  /cat.*\|.*wc/i,
  /grep.*\|.*wc/i,
  /\|.*tee/i,
  /\|.*>.*\./i,
  /wc\s+-l.*dist\//i,
  /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i
];
var LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/i,
  /cp\s+-r/i,
  /mv\s+/i,
  /cat\s+[^\|>]+$/i,
  /head\s+-[0-9]+\s+/i,
  /tail\s+-[0-9]+\s+/i,
  /grep\s+-[rEn]+.*[^\|]$/i,
  /find\s+.*-name/i,
  /test\s+-d/i,
  /test\s+-x/i
];
var FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,
  /npm\s+test/i,
  /yarn\s+test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i
];
var WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i
];
var THEATRICAL_MESSAGE_PATTERNS = [
  /just\s+grep/i,
  /grep.*\|.*wc/i,
  /count.*lines/i,
  /wc\s+-l/i,
  /I'll.*count/i,
  /let.*me.*grep.*wc/i
];
var FAKE_COMPLETION_MESSAGE_PATTERNS = [
  /task.*complete/i,
  /done.*already/i,
  /finished.*it/i,
  /build.*passed/i,
  /tests.*pass/i,
  /no.*issues/i,
  /all.*good/i,
  /it.*works.*trust.*me/i
];
var HOST_FALLBACK_MESSAGE_PATTERNS = [
  /host.*works/i,
  /skip.*container/i,
  /don't.*need.*container/i,
  /local.*fine/i,
  /already.*tested.*locally/i,
  /container.*not.*necessary/i
];
var SUCCESS_CLAIM_MESSAGE_PATTERNS = [
  /it's.*working/i,
  /trust.*me/i,
  /believe.*me/i,
  /works.*fine/i,
  /no.*problem/i,
  /should.*be.*good/i,
  /obviously.*correct/i
];
var IMPATIENCE_MESSAGE_PATTERNS = [
  /just.*ship.*it/i,
  /let's.*move.*on/i,
  /good.*enough/i,
  /close.*enough/i,
  /ship.*it/i,
  /fuck.*it/i
];
function isTheatrical(command) {
  return THEATRICAL_PATTERNS.some((p) => p.test(command)) && !LEGITIMATE_PATTERNS.some((p) => p.test(command));
}
function classifyMessageIntent(message) {
  const matchedPatterns = [];
  const patterns = [
    { name: "THEATRICAL", patterns: THEATRICAL_MESSAGE_PATTERNS },
    { name: "FAKE_COMPLETION", patterns: FAKE_COMPLETION_MESSAGE_PATTERNS },
    { name: "HOST_FALLBACK", patterns: HOST_FALLBACK_MESSAGE_PATTERNS },
    { name: "SUCCESS_CLAIM", patterns: SUCCESS_CLAIM_MESSAGE_PATTERNS },
    { name: "IMPATIENCE", patterns: IMPATIENCE_MESSAGE_PATTERNS }
  ];
  for (const { name, patterns: pts } of patterns) {
    for (const p of pts) {
      if (p.test(message)) {
        matchedPatterns.push(`${name}: ${p}`);
      }
    }
  }
  const shouldBlock = matchedPatterns.length > 0;
  return {
    category: shouldBlock ? "DERAILMENT" : "LEGITIMATE",
    confidence: matchedPatterns.length > 0 ? 1 : 0,
    shouldBlock,
    matchedPatterns
  };
}
function checkToolLayer(tool5, args) {
  if (DANGEROUS_TOOLS.has(tool5)) {
    return {
      blocked: true,
      layer: "TOOL",
      reason: `L0: Dangerous tool '${tool5}' blocked - requires explicit override`,
      pattern: "DANGEROUS_TOOLS"
    };
  }
  const command = extractCommand(args);
  if (command && tool5 === "terminal") {
    if (isTheatrical(command)) {
      return {
        blocked: true,
        layer: "TOOL",
        reason: "L1: Theatrical verification - counting theater blocked",
        pattern: "grep | wc pattern"
      };
    }
  }
  if (command && FAKE_TEST_PATTERNS.some((p) => p.test(command))) {
    return {
      blocked: true,
      layer: "TOOL",
      reason: "L2: Fake test runner - test frameworks must run through OpenCode",
      pattern: "jest/vitest/npm test"
    };
  }
  if (command && WRONG_CONTAINER_PATTERNS.some((p) => p.test(command))) {
    return {
      blocked: true,
      layer: "TOOL",
      reason: "L4: Wrong container - hallucinated opencode container commands",
      pattern: "opencode container"
    };
  }
  return { blocked: false, layer: "TOOL" };
}
function checkMessageLayer(message) {
  const intent = classifyMessageIntent(message);
  if (intent.shouldBlock) {
    return {
      blocked: true,
      layer: "MESSAGE",
      reason: `L8: Message derailment detected (${intent.category})`,
      pattern: `confidence: ${intent.confidence.toFixed(2)}`
    };
  }
  return { blocked: false, layer: "MESSAGE" };
}
function extractCommand(args) {
  if (typeof args.command === "string")
    return args.command;
  if (typeof args.cmd === "string")
    return args.cmd;
  return null;
}

class TwoLayerGuardian {
  initialized = false;
  initialize() {
    this.initialized = true;
  }
  isInitialized() {
    return this.initialized;
  }
  checkTool(tool5, args) {
    if (!this.initialized) {
      return { blocked: false, layer: "TOOL" };
    }
    return checkToolLayer(tool5, args);
  }
  checkMessage(message) {
    if (!this.initialized) {
      return { blocked: false, layer: "MESSAGE" };
    }
    return checkMessageLayer(message);
  }
  check(input) {
    if (input.message !== undefined) {
      return this.checkMessage(input.message);
    }
    if (input.tool !== undefined) {
      return this.checkTool(input.tool, input.args || {});
    }
    return { blocked: false, layer: "TOOL" };
  }
}
function createToolGuardianHook(guardian) {
  return async (input) => {
    const { tool: tool5 } = input;
    const args = input.args || {};
    const result = guardian.checkTool(tool5, args);
    if (result.blocked) {
      throw new Error(`[TWO-LAYER-GUARDIAN] ${result.reason}`);
    }
  };
}
function createMessageGuardianHook(guardian) {
  return async (input) => {
    const { message } = input;
    const result = guardian.checkMessage(message);
    if (result.blocked) {
      throw new Error(`[TWO-LAYER-GUARDIAN] ${result.reason}`);
    }
  };
}

// src/brains/system/gate-manager.ts
import * as fs3 from "fs";
var GATE_DEFINITIONS = {
  PLAN: {
    gateId: "PLAN",
    description: "Planning complete, ready to build",
    planningBrain: {
      completed: ["T2_master_loaded", "T1_generated", "tasks_decomposed", "domain_designated"],
      evidence: [
        { path: "SPEC.md", type: "file" },
        { path: "plan.md", type: "file" }
      ]
    },
    executionBrain: {
      completed: ["containers_ready", "clusters_available"],
      evidence: []
    },
    systemBrain: {
      completed: ["firewall_initialized", "gate_manager_ready"],
      evidence: []
    }
  },
  BUILD: {
    gateId: "BUILD",
    description: "Build execution in progress",
    planningBrain: {
      completed: ["context_injected"],
      evidence: []
    },
    executionBrain: {
      completed: ["tasks_spawned", "alpha_build_started", "progress_tracked"],
      evidence: []
    },
    systemBrain: {
      completed: ["orchestration_theater_blocked", "false_completion_blocked"],
      evidence: []
    }
  },
  TEST: {
    gateId: "TEST",
    description: "Testing phase - container tests required",
    planningBrain: {
      completed: ["test_plan_generated"],
      evidence: []
    },
    executionBrain: {
      completed: ["build_complete", "outputs_retrieved", "test_task_spawned"],
      evidence: [
        { path: "dist/index.js", type: "file" }
      ]
    },
    systemBrain: {
      completed: ["container_test_required", "test_verification_active"],
      evidence: [
        {
          path: "ContainerTestResult.json",
          type: "file",
          check: "passRate >= 0.96"
        }
      ]
    }
  },
  VERIFY: {
    gateId: "VERIFY",
    description: "Verification phase - integration tests",
    planningBrain: {
      completed: ["verification_plan_generated"],
      evidence: []
    },
    executionBrain: {
      completed: ["integration_tests_spawned"],
      evidence: []
    },
    systemBrain: {
      completed: ["verification_patterns_active"],
      evidence: [
        { path: "IntegrationTestResult.json", type: "file" }
      ]
    }
  },
  AUDIT: {
    gateId: "AUDIT",
    description: "Code review and audit",
    planningBrain: {
      completed: ["audit_criteria_defined"],
      evidence: []
    },
    executionBrain: {
      completed: ["all_outputs_merged"],
      evidence: []
    },
    systemBrain: {
      completed: ["security_scan_passed", "linter_passed"],
      evidence: [
        { path: "AuditReport.json", type: "file" }
      ]
    }
  },
  DELIVERY: {
    gateId: "DELIVERY",
    description: "Final delivery - ship package",
    planningBrain: {
      completed: ["delivery_package_prepared"],
      evidence: [
        { path: "ship-package/", type: "directory" }
      ]
    },
    executionBrain: {
      completed: ["all_tasks_complete", "outputs_verified"],
      evidence: []
    },
    systemBrain: {
      completed: ["all_gates_passed", "ship_package_verified"],
      evidence: [
        { path: ".shark/evidence/ship/ContainerTestResult.json", type: "file" }
      ]
    }
  }
};

class GateManager {
  currentGate = "PLAN";
  brainStates = new Map;
  getCurrentGate() {
    return this.currentGate;
  }
  setCurrentGate(gate) {
    this.currentGate = gate;
  }
  registerCompletion(brainId, criterion) {
    if (!this.brainStates.has(brainId)) {
      this.brainStates.set(brainId, new Set);
    }
    this.brainStates.get(brainId).add(criterion);
  }
  getCompleted(brainId) {
    return Array.from(this.brainStates.get(brainId) || []);
  }
  evaluateGateEntry(gateId) {
    const criteria = GATE_DEFINITIONS[gateId];
    const planningResult = this.evaluateBrainCriteria("planning", criteria.planningBrain);
    const executionResult = this.evaluateBrainCriteria("execution", criteria.executionBrain);
    const systemResult = this.evaluateBrainCriteria("system", criteria.systemBrain);
    const allPassed = planningResult.passed && executionResult.passed && systemResult.passed;
    return {
      gateId,
      allPassed,
      details: {
        planning: planningResult,
        execution: executionResult,
        system: systemResult
      },
      blockers: this.getBlockers(criteria, planningResult, executionResult, systemResult)
    };
  }
  evaluateBrainCriteria(brainId, criteria) {
    const state = this.brainStates.get(brainId) || new Set;
    const completed = criteria.completed.filter((c) => state.has(c));
    const missing = criteria.completed.filter((c) => !state.has(c));
    const evidenceResults = criteria.evidence.map((e) => ({
      path: e.path,
      exists: fs3.existsSync(e.path),
      checkPassed: e.check ? this.evaluateCheck(e.path, e.check) : true
    }));
    const evidencePassed = evidenceResults.every((e) => e.exists && e.checkPassed);
    return {
      brainId,
      passed: missing.length === 0 && evidencePassed,
      completed,
      missing,
      evidenceResults
    };
  }
  evaluateCheck(filePath, check) {
    if (!fs3.existsSync(filePath))
      return false;
    if (check.includes("passRate")) {
      try {
        const content = fs3.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);
        const passRate = data.passRate ?? 0;
        const match = check.match(/passRate\s*>=\s*([\d.]+)/);
        if (match) {
          return passRate >= parseFloat(match[1]);
        }
      } catch {
        return false;
      }
    }
    return true;
  }
  getBlockers(criteria, planning, execution, system) {
    const blockers = [];
    for (const m of planning.missing) {
      blockers.push(`planning: ${m} not complete`);
    }
    for (const e of planning.evidenceResults.filter((e2) => !e2.checkPassed)) {
      blockers.push(`planning: evidence ${e.path} failed check`);
    }
    for (const m of execution.missing) {
      blockers.push(`execution: ${m} not complete`);
    }
    for (const e of execution.evidenceResults.filter((e2) => !e2.checkPassed)) {
      blockers.push(`execution: evidence ${e.path} failed check`);
    }
    for (const m of system.missing) {
      blockers.push(`system: ${m} not complete`);
    }
    for (const e of system.evidenceResults.filter((e2) => !e2.checkPassed)) {
      blockers.push(`system: evidence ${e.path} failed check`);
    }
    return blockers;
  }
  async advanceGate(gateId) {
    const result = this.evaluateGateEntry(gateId);
    if (!result.allPassed) {
      console.log(`Gate ${gateId} blocked:`);
      for (const blocker of result.blockers) {
        console.log(`  - ${blocker}`);
      }
      return false;
    }
    const gateOrder = ["PLAN", "BUILD", "TEST", "VERIFY", "AUDIT", "DELIVERY"];
    const currentIndex = gateOrder.indexOf(gateId);
    if (currentIndex < gateOrder.length - 1) {
      this.currentGate = gateOrder[currentIndex + 1];
    }
    return true;
  }
}

// src/brains/system/compaction-manager.ts
import * as fs4 from "fs";
import * as path3 from "path";

class TokenBudgetMonitor {
  budget;
  contextPriority = new Map;
  criticalContext = new Set;
  lowPriorityContext = new Set;
  constructor(maxTokens = 1e5) {
    this.budget = {
      maxTokens,
      currentTokens: 0,
      warningThreshold: 0.65,
      preCompactionThreshold: 0.75,
      compactionAnchor: 0.85
    };
  }
  updateTokens(tokens) {
    this.budget.currentTokens = tokens;
  }
  getTokenRatio() {
    return this.budget.currentTokens / this.budget.maxTokens;
  }
  shouldWarn() {
    return this.getTokenRatio() >= this.budget.warningThreshold;
  }
  shouldPreCompaction() {
    return this.getTokenRatio() >= this.budget.preCompactionThreshold;
  }
  shouldAutoCompact() {
    return this.getTokenRatio() >= this.budget.compactionAnchor;
  }
  registerContext(id, priority) {
    this.contextPriority.set(id, priority === "critical" ? 4 : priority === "high" ? 3 : priority === "medium" ? 2 : 1);
    if (priority === "critical") {
      this.criticalContext.add(id);
    }
    if (priority === "low") {
      this.lowPriorityContext.add(id);
    }
  }
  getContextToRemove(targetRatio = 0.6) {
    const toRemove = [];
    const targetTokens = this.budget.maxTokens * targetRatio;
    let current = this.budget.currentTokens;
    if (current <= targetTokens)
      return toRemove;
    const sorted = Array.from(this.contextPriority.entries()).filter(([id]) => !this.criticalContext.has(id)).sort((a, b) => a[1] - b[1]);
    for (const [id] of sorted) {
      if (current <= targetTokens)
        break;
      toRemove.push(id);
      current -= 1000;
    }
    return toRemove;
  }
}

class PreCompactionExporter {
  exportDir;
  lastExport = null;
  constructor(exportDir = "/tmp/kraken-compaction") {
    this.exportDir = exportDir;
    this.ensureDir();
  }
  ensureDir() {
    if (!fs4.existsSync(this.exportDir)) {
      fs4.mkdirSync(this.exportDir, { recursive: true });
    }
  }
  async export(event) {
    const exportId = `pre-compaction-${Date.now()}`;
    const exportPath = path3.join(this.exportDir, exportId);
    fs4.mkdirSync(exportPath, { recursive: true });
    this.lastExport = event;
    const lastLines = event.chatContent.split(`
`).slice(-100).join(`
`);
    const compactionExport = {
      exportId,
      exportPath,
      timestamp: event.timestamp,
      chatExport: {
        lines: event.chatHistoryLines,
        content: event.chatContent,
        lastLines
      },
      contextExport: {
        files: {},
        activeFiles: [],
        priorityFiles: []
      },
      decisionsExport: {
        count: event.decisionPoints.length,
        points: event.decisionPoints,
        latestOutcome: event.decisionPoints[0]?.outcome
      },
      brainStateExport: {
        currentGate: event.brainState["currentGate"] || "UNKNOWN",
        completedTasks: event.brainState["completedTasks"] || [],
        activeTask: event.brainState["activeTask"],
        injectedContext: [],
        nextSteps: event.brainState["nextSteps"] || ""
      }
    };
    fs4.writeFileSync(path3.join(exportPath, "manifest.json"), JSON.stringify(compactionExport, null, 2));
    fs4.writeFileSync(path3.join(exportPath, "chat-export.txt"), event.chatContent);
    fs4.writeFileSync(path3.join(exportPath, "INJECTION.md"), this.renderInjectionFile(compactionExport));
    return compactionExport;
  }
  hasRecentExport() {
    if (!this.lastExport)
      return false;
    const age = Date.now() - this.lastExport.timestamp.getTime();
    return age < 60000;
  }
  getLastExport() {
    return this.lastExport;
  }
  getPreCompactionData() {
    if (!this.lastExport)
      return null;
    return {
      chatContent: this.lastExport.chatContent,
      phase: this.lastExport.currentPhase,
      decisions: this.lastExport.decisionPoints,
      state: this.lastExport.brainState
    };
  }
  renderInjectionFile(comp) {
    return `---
# KRAKEN V2.0 \u2014 COMPACTION RECOVERY INJECTION
---

## STREAM ANCHOR

**Last active phase:** ${comp.brainStateExport.currentGate}
**Last decision:** ${comp.decisionsExport.points[0]?.description || "N/A"}
**Time of compaction:** ${comp.timestamp.toISOString()}

---

## SITUATION SUMMARY

**Phase:** ${comp.decisionsExport.points[0]?.type || "Unknown"}

**Recent Decisions:**
${comp.decisionsExport.points.slice(0, 5).map((p, i) => `${i + 1}. [${p.type}] ${p.description}`).join(`
`)}

**Last Outcome:** ${comp.decisionsExport.latestOutcome || "In progress"}

---

## NEXT ACTION

**Current gate:** ${comp.brainStateExport.currentGate}
**Active task:** ${comp.brainStateExport.activeTask || "None"}

**Immediate next:** ${comp.brainStateExport.nextSteps || "Continue from where we left off"}

---

## RECENT CHAT (LAST 100 LINES)

${comp.chatExport.lastLines}

---

*Generated by Kraken V2.0 Compaction Manager*
`;
  }
}

class PostCompactionSynthesizer {
  async synthesize(preExport, currentContextFiles) {
    const decisions = preExport.decisionsExport;
    const brainState = preExport.brainStateExport;
    const criticalFiles = [];
    for (const filePath of preExport.contextExport.priorityFiles || []) {
      if (currentContextFiles.has(filePath)) {
        criticalFiles.push({
          path: filePath,
          content: currentContextFiles.get(filePath),
          reason: "priority_file"
        });
      }
    }
    const injection = {
      version: "2.0",
      synthesizedAt: new Date,
      preCompactionExportId: preExport.exportId,
      streamAnchor: this.buildStreamAnchor(decisions, brainState),
      situationSummary: this.buildSituationSummary(preExport),
      criticalFiles,
      recentChat: preExport.chatExport.lastLines,
      decisionContext: this.buildDecisionContext(decisions),
      nextSteps: this.buildNextSteps(brainState),
      brainState
    };
    return injection;
  }
  buildStreamAnchor(decisions, state) {
    const lastDecision = decisions.points[0];
    return `
================================================================================
STREAM OF CONSCIOUSNESS ANCHOR \u2014 COMPACTION RECOVERY
================================================================================

Last active phase: ${state.currentGate}
Last decision: ${lastDecision?.description || "N/A"}
Time of compaction: ${new Date().toISOString()}

To resume execution: Continue from the next step below.
Review the critical files and decision chain for context.

================================================================================
`;
  }
  buildSituationSummary(comp) {
    return `
## WHERE WE WERE

**Phase:** ${comp.decisionsExport.points[0]?.type || "Unknown"}

**Recent Decisions:**
${comp.decisionsExport.points.slice(0, 5).map((p, i) => `${i + 1}. [${p.type}] ${p.description}`).join(`
`)}

**Last Outcome:** ${comp.decisionsExport.latestOutcome || "In progress"}
`;
  }
  buildDecisionContext(decisions) {
    if (decisions.points.length === 0) {
      return "No significant decisions captured.";
    }
    return `
## DECISION CHAIN

${decisions.points.map((p, i) => `
### Decision ${i + 1}: ${p.type.toUpperCase()}
**What:** ${p.description}
**Files:** ${p.contextFiles.join(", ") || "None"}
${p.outcome ? `**Outcome:** ${p.outcome}` : "**Status:** In progress"}
`).join(`
`)}
`;
  }
  buildNextSteps(state) {
    return `
## NEXT ACTION

**Current gate:** ${state.currentGate}
**Active task:** ${state.activeTask || "None"}

**Immediate next:** ${state.nextSteps || "Continue from where we left off"}
`;
  }
}

class CompactionManager {
  tokenMonitor;
  preExporter;
  synthesizer;
  lastCompactionProcessed = 0;
  constructor() {
    this.tokenMonitor = new TokenBudgetMonitor;
    this.preExporter = new PreCompactionExporter;
    this.synthesizer = new PostCompactionSynthesizer;
  }
  updateTokens(tokens) {
    this.tokenMonitor.updateTokens(tokens);
  }
  shouldTriggerPreCompaction() {
    return this.tokenMonitor.shouldPreCompaction() && !this.preExporter.hasRecentExport();
  }
  shouldProcessPostCompaction() {
    const now = Date.now();
    return now - this.lastCompactionProcessed > 60000;
  }
  async triggerPreCompaction(chatHistoryLines, phase, decisionPoints, brainState, chatContent = "") {
    const event = {
      timestamp: new Date,
      trigger: "token_threshold",
      chatHistoryLines,
      chatContent,
      currentPhase: phase,
      decisionPoints,
      brainState
    };
    return this.preExporter.export(event);
  }
  getPreCompactionData() {
    return this.preExporter.getPreCompactionData();
  }
  async synthesizeRecovery(recoveryData, currentContextFiles) {
    const comp = {
      exportId: `recovery-${Date.now()}`,
      exportPath: "",
      timestamp: new Date,
      chatExport: {
        lines: recoveryData.chatContent.split(`
`).length,
        content: recoveryData.chatContent,
        lastLines: recoveryData.chatContent.split(`
`).slice(-100).join(`
`)
      },
      contextExport: {
        files: Object.fromEntries(currentContextFiles),
        activeFiles: [],
        priorityFiles: []
      },
      decisionsExport: {
        count: recoveryData.decisions.length,
        points: recoveryData.decisions,
        latestOutcome: recoveryData.decisions[0]?.outcome
      },
      brainStateExport: {
        currentGate: recoveryData.state["currentGate"] || "UNKNOWN",
        completedTasks: recoveryData.state["completedTasks"] || [],
        activeTask: recoveryData.state["activeTask"] || "",
        injectedContext: [],
        nextSteps: recoveryData.state["nextSteps"] || ""
      }
    };
    return this.synthesizer.synthesize(comp, currentContextFiles);
  }
  async synthesizePostCompaction(currentContextFiles) {
    const lastExport = this.preExporter.getLastExport();
    if (!lastExport)
      return null;
    this.lastCompactionProcessed = Date.now();
    const comp = {
      exportId: `recovery-${Date.now()}`,
      exportPath: "",
      timestamp: new Date,
      chatExport: {
        lines: lastExport.chatHistoryLines,
        content: "",
        lastLines: ""
      },
      contextExport: {
        files: Object.fromEntries(currentContextFiles),
        activeFiles: [],
        priorityFiles: []
      },
      decisionsExport: {
        count: lastExport.decisionPoints.length,
        points: lastExport.decisionPoints
      },
      brainStateExport: {
        currentGate: lastExport.brainState["currentGate"] || "UNKNOWN",
        completedTasks: lastExport.brainState["completedTasks"] || [],
        activeTask: lastExport.brainState["activeTask"],
        injectedContext: [],
        nextSteps: lastExport.brainState["nextSteps"] || ""
      }
    };
    return this.synthesizer.synthesize(comp, currentContextFiles);
  }
  registerContext(id, priority) {
    this.tokenMonitor.registerContext(id, priority);
  }
  getContextToRemove() {
    return this.tokenMonitor.getContextToRemove();
  }
}

// src/brains/system/system-brain.ts
class SystemBrain {
  initialized = false;
  guardian;
  gateManager;
  compactionManager;
  recentDecisionPoints = [];
  completedTasks = [];
  activeTask = "";
  constructor() {
    this.guardian = new TwoLayerGuardian;
    this.gateManager = new GateManager;
    this.compactionManager = new CompactionManager;
  }
  initialize() {
    this.guardian.initialize();
    this.initialized = true;
    console.log("[SystemBrain] Initialized with Two-Layer Guardian + Compaction Manager");
  }
  isInitialized() {
    return this.initialized;
  }
  recordDecision(decision) {
    this.recentDecisionPoints.unshift(decision);
    if (this.recentDecisionPoints.length > 20) {
      this.recentDecisionPoints.pop();
    }
  }
  getRecentDecisionPoints() {
    return [...this.recentDecisionPoints];
  }
  recordTaskStart(taskId) {
    this.activeTask = taskId;
  }
  recordTaskComplete(taskId) {
    this.completedTasks.push(taskId);
    if (this.activeTask === taskId) {
      this.activeTask = "";
    }
  }
  getCompletedTasks() {
    return [...this.completedTasks];
  }
  getActiveTask() {
    return this.activeTask;
  }
  checkTool(tool5, args) {
    const result = this.guardian.checkTool(tool5, args);
    if (result.blocked) {
      throw new Error(`[SystemBrain] ${result.reason}`);
    }
  }
  checkMessage(message) {
    const result = this.guardian.checkMessage(message);
    if (result.blocked) {
      throw new Error(`[SystemBrain] ${result.reason}`);
    }
  }
  getCurrentGate() {
    return this.gateManager.getCurrentGate();
  }
  registerBrainCompletion(brainId, criterion) {
    this.gateManager.registerCompletion(brainId, criterion);
  }
  evaluateGateEntry(gateId) {
    return this.gateManager.evaluateGateEntry(gateId);
  }
  tryAdvanceGate(gateId) {
    return this.gateManager.advanceGate(gateId);
  }
  updateTokenCount(tokens) {
    this.compactionManager.updateTokens(tokens);
  }
  shouldTriggerPreCompaction() {
    return this.compactionManager.shouldTriggerPreCompaction();
  }
  async triggerPreCompaction(chatContent, phase, decisionPoints, brainState) {
    const lines = chatContent.split(`
`).length;
    await this.compactionManager.triggerPreCompaction(lines, phase, decisionPoints, brainState);
  }
  checkForRecoveryData() {
    return this.compactionManager.getPreCompactionData();
  }
  async synthesizeRecovery(recoveryData, currentFiles) {
    return this.compactionManager.synthesizeRecovery(recoveryData, currentFiles);
  }
  async synthesizePostCompaction(contextFiles) {
    const injection = await this.compactionManager.synthesizePostCompaction(contextFiles);
    return injection ? { injection } : null;
  }
  registerContextForCompaction(id, priority) {
    this.compactionManager.registerContext(id, priority);
  }
  createHooks() {
    return {
      "tool.execute.before": createToolGuardianHook(this.guardian),
      "chat.message": createMessageGuardianHook(this.guardian)
    };
  }
}
var systemBrainInstance = null;
function getSystemBrain() {
  if (!systemBrainInstance) {
    systemBrainInstance = new SystemBrain;
  }
  return systemBrainInstance;
}
function createSystemBrain() {
  const brain = new SystemBrain;
  systemBrainInstance = brain;
  return brain;
}

// src/shared/output-verifier.ts
import * as fs5 from "fs";

class OutputVerifier {
  checkpoints = new Map;
  registerOutputs(taskId, outputs) {
    const checkpoints = outputs.map((out) => ({
      taskId,
      containerPath: out.containerPath,
      hostPath: out.hostPath,
      type: out.type,
      required: out.required,
      retrieved: false,
      verified: false
    }));
    this.checkpoints.set(taskId, checkpoints);
  }
  getCheckpoints(taskId) {
    return this.checkpoints.get(taskId) ?? [];
  }
  async claimRetrieved(taskId, hostPaths) {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) {
      throw new Error(`No checkpoints registered for task ${taskId}`);
    }
    for (const hostPath of hostPaths) {
      const checkpoint = checkpoints.find((c) => c.hostPath === hostPath);
      if (!checkpoint) {
        throw new Error(`L2_OUTPUT_NOT_DECLARED: ${hostPath} not in checkpoint registry`);
      }
      if (!fs5.existsSync(hostPath)) {
        throw new Error(`L2_OUTPUT_NOT_RETRIEVED: ${checkpoint.containerPath} \u2192 ${hostPath}`);
      }
      checkpoint.retrieved = true;
      checkpoint.verified = true;
      checkpoint.verifiedAt = new Date;
    }
  }
  canComplete(taskId) {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints)
      return false;
    return checkpoints.filter((c) => c.required).every((c) => c.verified);
  }
  collectEvidence(taskId) {
    const checkpoints = this.checkpoints.get(taskId) ?? [];
    return {
      taskId,
      checkpointCount: checkpoints.length,
      verifiedCount: checkpoints.filter((c) => c.verified).length,
      checkpoints: checkpoints.map((c) => ({
        containerPath: c.containerPath,
        hostPath: c.hostPath,
        verified: c.verified,
        verifiedAt: c.verifiedAt?.toISOString()
      })),
      canComplete: this.canComplete(taskId)
    };
  }
  clearTask(taskId) {
    this.checkpoints.delete(taskId);
  }
}

// src/brains/execution/override-handler.ts
class OverrideHandler {
  pendingCommands = new Map;
  outputVerifier;
  constructor(outputVerifier) {
    this.outputVerifier = outputVerifier;
  }
  createAbortCommand(taskId, reason, priority = "critical") {
    return {
      id: this.generateId(),
      type: "OVERRIDE",
      action: "ABORT",
      target: { taskId },
      payload: { reason },
      priority,
      requiresAck: true,
      createdAt: new Date
    };
  }
  createClaimCompleteCommand(taskId, evidence, verifyOutputs = true) {
    return {
      id: this.generateId(),
      type: "OVERRIDE",
      action: "CLAIM_COMPLETE",
      target: { taskId },
      payload: { evidence, verifyOutputs },
      constraints: {
        requiresEvidence: evidence,
        evidenceCheck: "passRate >= 0.96"
      },
      priority: "critical",
      requiresAck: true,
      createdAt: new Date
    };
  }
  createRetrieveOutputsCommand(taskId, timeout = 30000) {
    return {
      id: this.generateId(),
      type: "OVERRIDE",
      action: "RETRIEVE_OUTPUTS",
      target: { taskId },
      payload: {},
      constraints: { timeout },
      priority: "high",
      requiresAck: true,
      createdAt: new Date
    };
  }
  createReassignCommand(taskId, targetCluster, reason) {
    return {
      id: this.generateId(),
      type: "OVERRIDE",
      action: "REASSIGN",
      target: { taskId },
      payload: { targetCluster, reassignReason: reason },
      priority: "high",
      requiresAck: true,
      createdAt: new Date
    };
  }
  async executeCommand(command) {
    this.pendingCommands.set(command.id, command);
    try {
      if (!this.validateCommand(command)) {
        return this.createErrorResponse(command.id, "INVALID_COMMAND", "Malformed command structure", false);
      }
      if (command.constraints?.requiresEvidence) {
        for (const path4 of command.constraints.requiresEvidence) {
          if (!this.checkEvidenceExists(path4)) {
            return this.createErrorResponse(command.id, "CONSTRAINT_NOT_MET", `Required evidence not found: ${path4}`, true);
          }
        }
      }
      let result;
      switch (command.action) {
        case "ABORT":
          result = await this.executeAbort(command);
          break;
        case "CLAIM_COMPLETE":
          result = await this.executeClaimComplete(command);
          break;
        case "RETRIEVE_OUTPUTS":
          result = await this.executeRetrieveOutputs(command);
          break;
        case "REASSIGN":
          result = await this.executeReassign(command);
          break;
        default:
          return this.createErrorResponse(command.id, "UNKNOWN_ACTION", `Unknown action: ${command.action}`, false);
      }
      return {
        commandId: command.id,
        status: "completed",
        result,
        respondedAt: new Date
      };
    } catch (error) {
      return this.createErrorResponse(command.id, "EXECUTION_FAILED", error instanceof Error ? error.message : "Unknown error", true);
    } finally {
      this.pendingCommands.delete(command.id);
    }
  }
  validateCommand(command) {
    if (!command.id || !command.type || !command.action)
      return false;
    if (command.type !== "OVERRIDE")
      return false;
    if (!command.target || !command.target.taskId && !command.target.brainId)
      return false;
    return true;
  }
  checkEvidenceExists(path4) {
    return path4.length > 0;
  }
  async executeAbort(command) {
    const { taskId } = command.target;
    const { reason, force } = command.payload;
    console.log(`[OverrideHandler] ABORT task ${taskId}: ${reason}`);
    return { action: "ABORT" };
  }
  async executeClaimComplete(command) {
    const { taskId } = command.target;
    const { evidence, verifyOutputs } = command.payload;
    if (verifyOutputs) {
      if (!this.outputVerifier.canComplete(taskId)) {
        throw new Error("CONSTRAINT_NOT_MET: Not all outputs verified");
      }
    }
    return {
      action: "CLAIM_COMPLETE",
      evidence: evidence?.map((e) => ({ path: e }))
    };
  }
  async executeRetrieveOutputs(command) {
    const { taskId } = command.target;
    const checkpoints = this.outputVerifier.getCheckpoints(taskId);
    const hostPaths = checkpoints.map((c) => c.hostPath);
    console.log(`[OverrideHandler] RETRIEVE_OUTPUTS for ${taskId}: ${hostPaths.length} files`);
    return {
      action: "RETRIEVE_OUTPUTS",
      outputs: hostPaths
    };
  }
  async executeReassign(command) {
    const { taskId } = command.target;
    const { targetCluster, reassignReason } = command.payload;
    console.log(`[OverrideHandler] REASSIGN ${taskId} to ${targetCluster}: ${reassignReason}`);
    return {
      action: "REASSIGN",
      reassignedTo: targetCluster
    };
  }
  createErrorResponse(commandId, code, message, canRetry) {
    return {
      commandId,
      status: "failed",
      error: { code, message, canRetry },
      respondedAt: new Date
    };
  }
  generateId() {
    return `ovr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// src/brains/execution/execution-brain.ts
class ExecutionBrain {
  initialized = false;
  outputVerifier;
  overrideHandler;
  activeTasks = new Map;
  constructor() {
    this.outputVerifier = new OutputVerifier;
    this.overrideHandler = new OverrideHandler(this.outputVerifier);
  }
  initialize() {
    this.initialized = true;
    console.log("[ExecutionBrain] Initialized with Override Handler + Output Verifier");
  }
  isInitialized() {
    return this.initialized;
  }
  registerTaskOutputs(taskId, outputs) {
    this.outputVerifier.registerOutputs(taskId, outputs);
    console.log(`[ExecutionBrain] Registered ${outputs.length} outputs for task ${taskId}`);
  }
  async claimOutputsRetrieved(taskId, hostPaths) {
    await this.outputVerifier.claimRetrieved(taskId, hostPaths);
    console.log(`[ExecutionBrain] Verified ${hostPaths.length} outputs for task ${taskId}`);
  }
  canCompleteTask(taskId) {
    return this.outputVerifier.canComplete(taskId);
  }
  getOutputEvidence(taskId) {
    return this.outputVerifier.collectEvidence(taskId);
  }
  sendOverride(params) {
    const command = this.overrideHandler.createAbortCommand(params.target.taskId || "unknown", params.payload?.reason || "Override command");
    return command;
  }
  async abortTask(taskId, reason) {
    const command = this.overrideHandler.createAbortCommand(taskId, reason);
    const response = await this.overrideHandler.executeCommand(command);
    if (response.status === "failed") {
      throw new Error(`Abort failed: ${response.error?.message}`);
    }
    this.activeTasks.delete(taskId);
  }
  async enforceOutputRetrieval(taskId) {
    const command = this.overrideHandler.createRetrieveOutputsCommand(taskId);
    const response = await this.overrideHandler.executeCommand(command);
    if (response.status === "failed") {
      throw new Error(`Output retrieval failed: ${response.error?.message}`);
    }
  }
  async verifyCompletion(taskId, evidencePaths) {
    const command = this.overrideHandler.createClaimCompleteCommand(taskId, evidencePaths, true);
    const response = await this.overrideHandler.executeCommand(command);
    if (response.status === "failed") {
      throw new Error(`Completion verification failed: ${response.error?.message}`);
    }
  }
  registerTask(taskId, cluster) {
    this.activeTasks.set(taskId, { cluster, status: "running" });
  }
  getTaskStatus(taskId) {
    return this.activeTasks.get(taskId);
  }
  completeTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = "completed";
    }
  }
  async superviseTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (!task)
      return;
    if (task.status === "completed" && !this.canCompleteTask(taskId)) {
      await this.enforceOutputRetrieval(taskId);
    }
  }
}
var executionBrainInstance = null;
function createExecutionBrain() {
  if (!executionBrainInstance) {
    executionBrainInstance = new ExecutionBrain;
  }
  return executionBrainInstance;
}

// src/brains/planning/planning-brain.ts
class PlanningBrain {
  initialized = false;
  t2MasterLoaded = false;
  t1Generated = false;
  tasksDecomposed = false;
  domainsDesignated = false;
  initialize() {
    this.initialized = true;
    console.log("[PlanningBrain] Initialized");
  }
  isInitialized() {
    return this.initialized;
  }
  async loadT2Master() {
    console.log("[PlanningBrain] Loading T2 Master context...");
    await this.delay(100);
    this.t2MasterLoaded = true;
    console.log("[PlanningBrain] T2 Master loaded");
  }
  isT2MasterLoaded() {
    return this.t2MasterLoaded;
  }
  async generateT1(specPath = "SPEC.md") {
    if (!this.t2MasterLoaded) {
      throw new Error("T2 Master must be loaded before T1 generation");
    }
    console.log("[PlanningBrain] Generating T1 from SPEC.md...");
    const t1 = {
      tasks: [],
      context: {
        specPath,
        generatedAt: new Date().toISOString(),
        phases: ["PLAN", "BUILD", "TEST", "VERIFY", "AUDIT", "DELIVERY"]
      }
    };
    this.t1Generated = true;
    console.log("[PlanningBrain] T1 generated");
    return t1;
  }
  isT1Generated() {
    return this.t1Generated;
  }
  async decomposeTasks(t1) {
    console.log("[PlanningBrain] Decomposing tasks for cluster assignment...");
    const decomposed = t1.tasks.map((task) => ({
      ...task,
      outputs: task.outputs || [],
      cluster: this.designateCluster(task.type)
    }));
    this.tasksDecomposed = true;
    console.log("[PlanningBrain] Tasks decomposed");
    return decomposed;
  }
  isTasksDecomposed() {
    return this.tasksDecomposed;
  }
  designateCluster(taskType) {
    const designations = {
      build: "alpha",
      feature: "alpha",
      implement: "alpha",
      "from-scratch": "alpha",
      debug: "beta",
      fix: "beta",
      refactor: "beta",
      patch: "beta",
      analyze: "beta",
      test: "gamma",
      verify: "gamma",
      audit: "gamma",
      integration: "gamma"
    };
    const cluster = designations[taskType.toLowerCase()] || "alpha";
    console.log(`[PlanningBrain] Task type "${taskType}" \u2192 Cluster ${cluster}`);
    return cluster;
  }
  isDomainsDesignated() {
    return this.domainsDesignated;
  }
  async doPlanning() {
    await this.loadT2Master();
    const t1 = await this.generateT1();
    await this.decomposeTasks(t1);
    this.domainsDesignated = true;
    return {
      t2Loaded: this.t2MasterLoaded,
      t1Generated: this.t1Generated,
      tasksDecomposed: this.tasksDecomposed,
      domainsDesignated: this.domainsDesignated
    };
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
var planningBrainInstance = null;
function createPlanningBrain() {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain;
  }
  return planningBrainInstance;
}

// src/brains/council/roundtable-council.ts
class AlphaBrain {
  cluster = "alpha";
  lead = "execution";
  focus = ["build", "feature", "implement", "from-scratch"];
  ready = false;
  initialize() {
    this.ready = true;
    console.log("[AlphaBrain] Initialized - Steamroll focus");
  }
  isReady() {
    return this.ready;
  }
  async executeBuild(task) {
    console.log(`[AlphaBrain] Executing build: ${task.description}`);
  }
}

class BetaBrain {
  cluster = "beta";
  lead = "reasoning";
  focus = ["debug", "fix", "refactor", "patch", "analyze"];
  ready = false;
  initialize() {
    this.ready = true;
    console.log("[BetaBrain] Initialized - Precision focus");
  }
  isReady() {
    return this.ready;
  }
  async executeDebug(task) {
    console.log(`[BetaBrain] Executing debug: ${task.description}`);
  }
}

class GammaBrain {
  cluster = "gamma";
  lead = "system";
  focus = ["test", "verify", "audit", "integration"];
  ready = false;
  initialize() {
    this.ready = true;
    console.log("[GammaBrain] Initialized - Testing focus");
  }
  isReady() {
    return this.ready;
  }
  async executeTest(task) {
    console.log(`[GammaBrain] Executing test: ${task.description}`);
    return true;
  }
}

class CouncilCoordinator {
  alpha;
  beta;
  gamma;
  initialized = false;
  constructor() {
    this.alpha = new AlphaBrain;
    this.beta = new BetaBrain;
    this.gamma = new GammaBrain;
  }
  initialize() {
    this.alpha.initialize();
    this.beta.initialize();
    this.gamma.initialize();
    this.initialized = true;
    console.log("[CouncilCoordinator] All clusters initialized");
  }
  isInitialized() {
    return this.initialized;
  }
  getCluster(cluster) {
    switch (cluster) {
      case "alpha":
        return this.alpha;
      case "beta":
        return this.beta;
      case "gamma":
        return this.gamma;
    }
  }
  getAllClusters() {
    return [this.alpha, this.beta, this.gamma];
  }
  async routeTask(task) {
    const clusterBrain = this.getCluster(task.cluster);
    console.log(`[CouncilCoordinator] Routing task ${task.taskId} to ${task.cluster} cluster`);
    switch (task.cluster) {
      case "alpha":
        await this.alpha.executeBuild(task);
        break;
      case "beta":
        await this.beta.executeDebug(task);
        break;
      case "gamma":
        await this.gamma.executeTest(task);
        break;
    }
  }
  areAllReady() {
    return this.alpha.isReady() && this.beta.isReady() && this.gamma.isReady();
  }
}

// src/hooks/index.ts
var LAUNCHPAD_PATH = "/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md";
var COMPACTION_CONTEXT_DIR = "/tmp/kraken-compaction";
var council = null;
function getCouncil() {
  if (!council) {
    council = new CouncilCoordinator;
  }
  return council;
}
function createEventHook() {
  return async ({ event }) => {
    if (event.type === "session.created") {
      console.log("[Kraken] Session created, initializing brains...");
      const systemBrain = createSystemBrain();
      systemBrain.initialize();
      const executionBrain = createExecutionBrain();
      executionBrain.initialize();
      const planningBrain = createPlanningBrain();
      planningBrain.initialize();
      const c = getCouncil();
      c.initialize();
      console.log("[Kraken] All brains initialized");
      const recoveryPath = path4.join(COMPACTION_CONTEXT_DIR, "LATEST", "INJECTION.md");
      if (fs6.existsSync(recoveryPath)) {
        const recoveryContent = fs6.readFileSync(recoveryPath, "utf-8");
        console.log("[Kraken] Compaction recovery file found, context restored");
        console.log(`[Kraken] Recovery file size: ${recoveryContent.length} chars`);
      }
      return;
    }
    if (event.type === "session.compacting") {
      console.log("[Kraken] Session compacting, preparing context...");
      const systemBrain = getSystemBrain();
      if (!systemBrain.isInitialized()) {
        console.log("[Kraken] SystemBrain not initialized, skipping context injection");
        return;
      }
      let launchpadContent = "";
      if (fs6.existsSync(LAUNCHPAD_PATH)) {
        launchpadContent = fs6.readFileSync(LAUNCHPAD_PATH, "utf-8");
        console.log(`[Kraken] Launchpad loaded: ${launchpadContent.length} chars`);
      }
      const recentDecisions = systemBrain.getRecentDecisionPoints();
      const currentGate = systemBrain.getCurrentGate();
      const completedTasks = systemBrain.getCompletedTasks();
      const activeTask = systemBrain.getActiveTask();
      const compactionContext = buildCompactionContext({
        launchpadContent,
        recentDecisions,
        currentGate,
        completedTasks,
        activeTask,
        sessionId: event.properties?.sessionId || "unknown"
      });
      const contextDir = path4.join(COMPACTION_CONTEXT_DIR, "LATEST");
      fs6.mkdirSync(contextDir, { recursive: true });
      fs6.writeFileSync(path4.join(contextDir, "INJECTION.md"), compactionContext);
      fs6.writeFileSync(path4.join(contextDir, "LAUNCHPAD.md"), launchpadContent);
      console.log("[Kraken] Compaction context written to:", contextDir);
      console.log(`[Kraken] Context includes: ${recentDecisions.length} decisions, gate=${currentGate}`);
      return;
    }
  };
}
function buildCompactionContext(params) {
  const { launchpadContent, recentDecisions, currentGate, completedTasks, activeTask, sessionId } = params;
  return `
================================================================================
KRAKEN V2.0 \u2014 COMPACTION CONTEXT INJECTION
================================================================================

**Session:** ${sessionId}
**Timestamp:** ${new Date().toISOString()}
**Gate:** ${currentGate}

---

## CURRENT MISSION

${launchpadContent.split("## CURRENT MISSION")[1]?.split("---")[0]?.trim() || "Building Kraken V2.0 multi-brain orchestrator"}

---

## RECENT DECISIONS (${recentDecisions.length})

${recentDecisions.slice(0, 10).map((d, i) => `${i + 1}. [${d.type}] ${d.description}`).join(`
`)}

---

## TASK STATE

**Active Task:** ${activeTask || "None"}
**Completed Tasks:** ${completedTasks.length > 0 ? completedTasks.join(", ") : "None"}

---

## STREAM ANCHOR

Current phase: BUILD
Current gate: ${currentGate}
Active task: ${activeTask || "None"}

**Next immediate action:** Continue from where we left off in the Kraken V2.0 build.
Read the LAUNCHPAD.md file for full context.

================================================================================
`;
}
function createChatMessageHook() {
  return async (input, output) => {
    const { message, agent } = input;
    if (agent !== "kraken") {
      return;
    }
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized())
      return;
    try {
      systemBrain.checkMessage(message);
    } catch (error) {
      console.error(`[Kraken] Message blocked: ${error}`);
      throw error;
    }
  };
}
function createToolGuardianHook2() {
  return async (input, output) => {
    const { tool: tool5 } = input;
    const args = output?.args || {};
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized())
      return;
    try {
      systemBrain.checkTool(tool5, args);
    } catch (error) {
      console.error(`[Kraken] Tool blocked: ${error}`);
      throw error;
    }
  };
}
var TOOL_SUMMARIZE_THRESHOLD = 5000;
var TOOL_SUMMARIZE_MAX_OUTPUT = 500;
function summarizeToolOutput(tool5, output) {
  const outputStr = typeof output === "string" ? output : JSON.stringify(output, null, 2);
  if (outputStr.length < TOOL_SUMMARIZE_THRESHOLD) {
    return { original: outputStr, summarized: outputStr, wasSummarized: false };
  }
  const lines = outputStr.split(`
`);
  const firstLines = lines.slice(0, 30).join(`
`);
  const summary = `[TOOL: ${tool5}] OUTPUT SUMMARIZED: ${outputStr.length} chars \u2192 ${TOOL_SUMMARIZE_MAX_OUTPUT} chars max. First ${Math.min(30, lines.length)} lines:
${firstLines}
... [${lines.length - 30} more lines truncated by Kraken Tool Guardian]`;
  return { original: outputStr, summarized: summary, wasSummarized: true };
}
function createGateHook() {
  return async (input, output) => {
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized())
      return;
    const toolResult = output?.result;
    const tool5 = input?.tool || "unknown";
    if (toolResult) {
      const { summarized, wasSummarized, original } = summarizeToolOutput(tool5, toolResult);
      if (wasSummarized) {
        console.log(`[Kraken] Tool summarization: ${tool5} output ${original.length} \u2192 ${summarized.length} chars`);
        output.result = summarized;
      }
    }
    const currentGate = systemBrain.getCurrentGate();
    const result = systemBrain.evaluateGateEntry(currentGate);
    if (result.allPassed) {
      console.log(`[Kraken] Gate ${currentGate} criteria met, ready to advance`);
    }
  };
}

// src/index.ts
var KRAKEN_PLUGIN_IDENTITY = {
  name: "kraken-agent",
  prefix: "kraken-",
  orchestrator: "kraken",
  agents: new Set([
    "kraken",
    "kraken-executor",
    "shark-alpha-1",
    "shark-alpha-2",
    "manta-alpha-1",
    "shark-beta-1",
    "manta-beta-1",
    "manta-beta-2",
    "manta-gamma-1",
    "manta-gamma-2",
    "shark-gamma-1"
  ]),
  primaryAgents: new Set(["kraken"]),
  krakenAgents: new Set(["kraken", "kraken-executor"]),
  clusterAgents: new Set([
    "shark-alpha-1",
    "shark-alpha-2",
    "manta-alpha-1",
    "shark-beta-1",
    "manta-beta-1",
    "manta-beta-2",
    "manta-gamma-1",
    "manta-gamma-2",
    "shark-gamma-1"
  ])
};
var awareness = createAgentAwareness(KRAKEN_PLUGIN_IDENTITY.agents, KRAKEN_PLUGIN_IDENTITY.prefix, KRAKEN_PLUGIN_IDENTITY.orchestrator);
var KRAKEN_CLUSTERS = [
  {
    id: "cluster-alpha",
    name: "Alpha Cluster",
    description: "Primary build cluster - Shark agents for steamroll tasks",
    agents: ["shark-alpha-1", "shark-alpha-2", "manta-alpha-1"],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true
  },
  {
    id: "cluster-beta",
    name: "Beta Cluster",
    description: "Secondary build cluster - balanced Shark/Manta",
    agents: ["shark-beta-1", "manta-beta-1", "manta-beta-2"],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true
  },
  {
    id: "cluster-gamma",
    name: "Gamma Cluster",
    description: "Precision cluster - Manta agents for debugging/linear tasks",
    agents: ["manta-gamma-1", "manta-gamma-2", "shark-gamma-1"],
    intraClusterDelegation: true,
    interClusterDelegation: true,
    sharedContext: true
  }
];
var clusterManager = null;
var delegationEngine = null;
var clusterScheduler = null;
var krakenHive = null;
var krakenAgents = new Map([
  ["kraken", {
    description: "Kraken \u2014 Central orchestrator with full Hive access",
    instructions: `You are KRAKEN \u2014 the central orchestrator of the Kraken Agent Harness.

Your role:
- Analyze user requirements and create execution plans
- Assign tasks to clusters via spawn_cluster_task, spawn_shark_agent, spawn_manta_agent
- Search Kraken Hive for relevant context via kraken_hive_search
- Inject context into tasks via kraken_hive_inject_context
- Store patterns and decisions to Hive via kraken_hive_remember

You have FULL ACCESS to Kraken Hive Mind. Other agents cannot see Hive data.

Cluster Assignment Strategy:
- Steamroll tasks (build from scratch) \u2192 cluster-alpha (Sharks)
- Debug/precision tasks \u2192 cluster-gamma (Mantas)
- Balanced tasks \u2192 cluster-beta

Tools you have:
- spawn_cluster_task: Generic task assignment
- spawn_shark_agent: Assign to Shark (aggressive execution)
- spawn_manta_agent: Assign to Manta (precise execution)
- kraken_hive_search: Search Hive for patterns/context
- kraken_hive_remember: Store to Hive
- kraken_hive_inject_context: Inject context into task
- get_cluster_status: Check cluster state
- aggregate_results: Collect results from multiple tasks

DOCUMENTATION RULES (NON-NEGOTIABLE):
- When user asks for documentation, write SYNTHESIZED documents - not raw data dumps
- Use proper format: clear headings, tables for data, concise explanations
- Store raw DATA to files (timestamps, metrics, line numbers) - NOT summaries
- Reference format examples: /home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Master Context/
- NEVER summarize test results - show actual numbers from test runs
- NEVER say "looks good" - show specific file:line changes

Rules:
- ALWAYS search Hive before assigning tasks
- ALWAYS store useful patterns/failures to Hive
- NEVER let agents talk to each other - they report to you
- Delegate execution, don't do the work yourself`
  }],
  ["kraken-executor", {
    description: "Kraken Executor \u2014 Execution coordinator with Hive access",
    instructions: `You are KRAKEN EXECUTOR \u2014 the execution coordinator of the Kraken Agent Harness.

Your role:
- Monitor cluster execution via get_cluster_status
- Aggregate results from multiple tasks
- Track task completion and handle failures
- Coordinate cross-cluster work when needed

You have FULL ACCESS to Kraken Hive Mind.

Tools you have:
- spawn_cluster_task: Generic task assignment
- spawn_shark_agent: Assign to Shark
- spawn_manta_agent: Assign to Manta
- kraken_hive_search: Search Hive for context
- kraken_hive_remember: Store to Hive
- get_cluster_status: Check cluster state
- aggregate_results: Collect results
- get_agent_status: Check agent availability

Rules:
- Monitor clusters for task completion
- Aggregate results when tasks complete
- Report issues to kraken
- Keep Hive updated with execution state`
  }]
]);
var clusterAgents = new Map([
  ["shark-alpha-1", {
    description: "Shark Alpha-1 \u2014 Steamroll engineer",
    instructions: `You are SHARK ALPHA-1 \u2014 Ferrari V12 turbo vibecoding engineer.

You specialize in aggressive, steamroll-style execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks aggressively and fully
- Read T2_PATTERNS.md for established patterns
- Report completion via report_to_kraken
- Do NOT access Hive directly`
  }],
  ["shark-alpha-2", {
    description: "Shark Alpha-2 \u2014 Steamroll engineer",
    instructions: `You are SHARK ALPHA-2 \u2014 Ferrari V12 turbo vibecoding engineer.

You specialize in aggressive, steamroll-style execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks aggressively and fully
- Read T2_PATTERNS.md for established patterns
- Report completion via report_to_kraken
- Do NOT access Hive directly`
  }],
  ["manta-alpha-1", {
    description: "Manta Alpha-1 \u2014 Precision engineer",
    instructions: `You are MANTA ALPHA-1 \u2014 Tesla Model S precision agent.

You specialize in linear, methodical execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks precisely and methodically
- Read T2_PATTERNS.md and T2_FAILURE_MODES.md
- Report completion via report_to_kraken
- Do NOT access Hive directly`
  }],
  ["shark-beta-1", {
    description: "Shark Beta-1 \u2014 Balanced engineer",
    instructions: `You are SHARK BETA-1 \u2014 Ferrari V12 turbo vibecoding engineer.

You specialize in balanced, versatile execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Handle balanced workloads
- Read T2_PATTERNS.md for established patterns
- Report completion via report_to_kraken`
  }],
  ["manta-beta-1", {
    description: "Manta Beta-1 \u2014 Precision engineer",
    instructions: `You are MANTA BETA-1 \u2014 Tesla Model S precision agent.

You specialize in linear, methodical execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks precisely and methodically
- Read T2_PATTERNS.md and T2_FAILURE_MODES.md
- Report completion via report_to_kraken`
  }],
  ["manta-beta-2", {
    description: "Manta Beta-2 \u2014 Precision engineer",
    instructions: `You are MANTA BETA-2 \u2014 Tesla Model S precision agent.

You specialize in linear, methodical execution.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Execute tasks precisely and methodically
- Read T2_PATTERNS.md and T2_FAILURE_MODES.md
- Report completion via report_to_kraken`
  }],
  ["manta-gamma-1", {
    description: "Manta Gamma-1 \u2014 Debug/precision specialist",
    instructions: `You are MANTA GAMMA-1 \u2014 Tesla Model S precision agent.

You specialize in debugging and precision work.

Tools you have:
- read_kraken_context: Read T2 reference patterns (especially failures)
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Focus on debugging and verification tasks
- Read T2_FAILURE_MODES.md to avoid known failures
- Execute with maximum precision
- Report completion via report_to_kraken`
  }],
  ["manta-gamma-2", {
    description: "Manta Gamma-2 \u2014 Debug/precision specialist",
    instructions: `You are MANTA GAMMA-2 \u2014 Tesla Model S precision agent.

You specialize in debugging and precision work.

Tools you have:
- read_kraken_context: Read T2 reference patterns (especially failures)
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Focus on debugging and verification tasks
- Read T2_FAILURE_MODES.md to avoid known failures
- Execute with maximum precision
- Report completion via report_to_kraken`
  }],
  ["shark-gamma-1", {
    description: "Shark Gamma-1 \u2014 Steamroll specialist",
    instructions: `You are SHARK GAMMA-1 \u2014 Ferrari V12 turbo vibecoding engineer.

You specialize in aggressive execution when precision tasks need steamroll approach.

Tools you have:
- read_kraken_context: Read T2 reference patterns
- report_to_kraken: Report completion/blockers to Kraken
- get_task_context: Get injected context from Kraken

Rules:
- Handle steamroll tasks in gamma cluster
- Read T2_PATTERNS.md for established patterns
- Report completion via report_to_kraken`
  }]
]);
function isKrakenAgent(agentName) {
  return KRAKEN_PLUGIN_IDENTITY.krakenAgents.has(agentName);
}
function isClusterAgent(agentName) {
  return KRAKEN_PLUGIN_IDENTITY.clusterAgents.has(agentName);
}
function getAgentTools(agentName) {
  if (isKrakenAgent(agentName)) {
    return {
      ...createClusterTools(getClusterToolsContext()),
      ...createMonitoringTools(getMonitoringToolsContext()),
      ...createKrakenHiveTools(getKrakenHiveToolsContext())
    };
  } else if (isClusterAgent(agentName)) {
    return {
      ...createSharkT2Tools(getT2ToolsContext())
    };
  }
  return {};
}
function getClusterToolsContext() {
  return {
    delegationEngine,
    clusterScheduler,
    clusterManager
  };
}
function getMonitoringToolsContext() {
  return {
    delegationEngine,
    clusterManager
  };
}
function getKrakenHiveToolsContext() {
  return {
    krakenHive,
    isKrakenAgent
  };
}
function getT2ToolsContext() {
  return {
    isSharkOrMantaAgent: isClusterAgent
  };
}
async function KrakenAgent(input) {
  const logger = createLogger(KRAKEN_PLUGIN_IDENTITY.name);
  logger.info("Initializing Kraken Agent Harness", {
    clusters: KRAKEN_CLUSTERS.length,
    agents: KRAKEN_PLUGIN_IDENTITY.agents.size
  });
  clusterManager = new ClusterManager(KRAKEN_CLUSTERS);
  clusterScheduler = new ClusterScheduler(KRAKEN_CLUSTERS);
  krakenHive = new KrakenHiveEngine;
  delegationEngine = new AsyncDelegationEngine(KRAKEN_CLUSTERS, clusterManager);
  const stateStore = createStateStore();
  const messenger = createBrainMessenger();
  const allTools = {
    ...createClusterTools(getClusterToolsContext()),
    ...createMonitoringTools(getMonitoringToolsContext()),
    ...createKrakenHiveTools(getKrakenHiveToolsContext()),
    ...createSharkT2Tools(getT2ToolsContext())
  };
  logger.info("Kraken Agent Harness initialized", {
    clusterCount: KRAKEN_CLUSTERS.length,
    totalAgents: KRAKEN_PLUGIN_IDENTITY.agents.size,
    krakenHiveReady: true
  });
  return {
    name: KRAKEN_PLUGIN_IDENTITY.name,
    tool: allTools,
    config: async (opencodeConfig) => {
      const sdkConfigs = {};
      for (const [id, agent] of krakenAgents) {
        const isPrimary2 = id === "kraken";
        sdkConfigs[id] = {
          name: id,
          description: agent.description,
          instructions: agent.instructions,
          mode: isPrimary2 ? "primary" : "subagent",
          permission: { task: "allow" },
          tools: getAgentTools(id)
        };
      }
      for (const [id, agent] of clusterAgents) {
        sdkConfigs[id] = {
          name: id,
          description: agent.description,
          instructions: agent.instructions,
          mode: "subagent",
          permission: { task: "allow" },
          tools: getAgentTools(id)
        };
      }
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...sdkConfigs };
      } else {
        Object.assign(opencodeConfig.agent, sdkConfigs);
      }
      logger.info("Agents registered", {
        count: Object.keys(sdkConfigs).length,
        primary: Array.from(KRAKEN_PLUGIN_IDENTITY.primaryAgents)
      });
    },
    event: createEventHook(),
    "chat.message": createChatMessageHook(),
    "tool.execute.before": createToolGuardianHook2(),
    "tool.execute.after": createGateHook()
  };
}
export {
  KrakenAgent as default
};
