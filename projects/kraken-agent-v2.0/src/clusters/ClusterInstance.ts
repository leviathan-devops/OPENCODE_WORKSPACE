/**
 * src/clusters/ClusterInstance.ts
 * 
 * Cluster Instance for Kraken
 * 
 * Individual cluster runtime with async task queue and parallel execution.
 * Each cluster processes tasks asynchronously with its pool of agents.
 */

import type { 
  ClusterConfig, 
  ClusterLoad,
  KrakenDelegationRequest, 
  KrakenDelegationResult,
  ClusterAgentInstance 
} from '../factory/kraken-types.js';

export class ClusterInstance {
  private config: ClusterConfig;
  private agents: Map<string, ClusterAgentInstance>;
  private taskQueue: Array<{
    request: KrakenDelegationRequest;
    resolve: (result: KrakenDelegationResult) => void;
    reject: (error: Error) => void;
  }>;
  private completedTasks: KrakenDelegationResult[];
  private failedTasks: KrakenDelegationResult[];
  private processing: boolean;
  private load: ClusterLoad;
  private shutdownFlag: boolean;

  constructor(config: ClusterConfig) {
    this.config = config;
    this.agents = new Map();
    this.taskQueue = [];
    this.completedTasks = [];
    this.failedTasks = [];
    this.processing = false;
    this.shutdownFlag = false;

    // Initialize load tracking
    this.load = {
      clusterId: config.id,
      activeTasks: 0,
      pendingTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      lastActivity: Date.now(),
    };

    // Initialize agents from config
    this.initializeAgents();

    // Start async processing
    this.startProcessing();
  }

  private initializeAgents(): void {
    for (const agentId of this.config.agents) {
      const agentType = agentId.startsWith('shark-') ? 'shark' : 'manta';
      this.agents.set(agentId, {
        id: agentId,
        agentType,
        busy: false,
        clusterId: this.config.id,
      });
    }
  }

  private startProcessing(): void {
    if (this.processing) return;
    this.processing = true;

    // Non-blocking async processing loop
    this.processLoop();
  }

  private async processLoop(): Promise<void> {
    const pendingOps: Promise<void>[] = [];

    while (!this.shutdownFlag) {
      // Find available agents and dequeue tasks
      const availableAgents = this.getAvailableAgents();
      const tasksToRun = Math.min(availableAgents.length, this.taskQueue.length);

      if (tasksToRun === 0 && pendingOps.length === 0) {
        // No work to do and no pending ops, wait before checking again
        await this.sleep(100);
        continue;
      }

      // Wait for any pending operations if queue is empty but ops are in flight
      if (tasksToRun === 0 && pendingOps.length > 0) {
        await Promise.all(pendingOps);
        pendingOps.length = 0;
        continue;
      }

      // Dequeue tasks and execute
      for (let i = 0; i < tasksToRun; i++) {
        const task = this.taskQueue.shift();
        if (!task) break;

        const agent = availableAgents[i];
        if (agent) {
          // Execute task and track the pending operation
          const op = this.executeTaskAsync(agent, task.request)
            .then(result => {
              task.resolve(result);
            })
            .catch(error => {
              task.reject(error instanceof Error ? error : new Error(String(error)));
            });
          pendingOps.push(op);
        }
      }
    }

    // Wait for all pending operations before exiting
    if (pendingOps.length > 0) {
      await Promise.all(pendingOps);
    }

    this.processing = false;
  }

  private async executeTaskAsync(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    // Mark agent as busy
    agent.busy = true;
    agent.currentTaskId = request.taskId;
    this.load.activeTasks++;
    this.load.pendingTasks = Math.max(0, this.load.pendingTasks - 1);
    this.load.lastActivity = Date.now();

    try {
      // REAL execution via Docker container spawning using subagent-manager
      const result = await this.executeOnAgent(agent, request);

      // Record result
      if (result.success) {
        this.completedTasks.push(result);
        this.load.completedTasks++;
      } else {
        this.failedTasks.push(result);
        this.load.failedTasks++;
      }

      return result;
    } catch (error) {
      const failedResult: KrakenDelegationResult = {
        success: false,
        taskId: request.taskId,
        clusterId: this.config.id,
        agentId: agent.id,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        completedAt: Date.now(),
      };
      this.failedTasks.push(failedResult);
      this.load.failedTasks++;
      return failedResult;
    } finally {
      // Mark agent as available
      agent.busy = false;
      agent.currentTaskId = undefined;
      this.load.activeTasks = Math.max(0, this.load.activeTasks - 1);
      this.load.lastActivity = Date.now();
    }
  }

  /**
   * Execute task on agent via REAL Docker container
   * Uses HTTP call to kraken-agent-wrapper daemon (which spawns Docker containers)
   * 
   * NOTE: The opencode container doesn't have python3, so we call the wrapper
   * daemon via HTTP instead of spawning python3 directly.
   */
  private async executeOnAgent(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    return new Promise((resolve) => {
      const http = require('http');

      // Wrapper daemon endpoint (runs on host at 127.0.0.1:18086)
      // With --network host, container's localhost IS host's localhost
      const wrapperHost = '127.0.0.1';
      const wrapperPort = 18086;
      const endpoint = '/execute';

      const postData = JSON.stringify({
        task: request.task,
        model: 'minimax/MiniMax-M2.7',
        timeout: 120,
        cleanup: true,
      });

      console.log(`[ClusterInstance] Delegating to wrapper daemon for agent ${agent.id}`);
      console.log(`[ClusterInstance] Task: ${request.task.substring(0, 100)}...`);

      const options = {
        hostname: wrapperHost,
        port: wrapperPort,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const timeout = setTimeout(() => {
        console.error(`[ClusterInstance] Task ${request.taskId} timeout`);
        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: 'Task execution timeout after 120 seconds',
          completedAt: Date.now(),
        });
      }, 120000);

      const req = http.request(options, (res: any) => {
        let data = '';

        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });

        res.on('end', () => {
          clearTimeout(timeout);

          try {
            const result = JSON.parse(data);

            console.log(`[ClusterInstance] Task ${request.taskId} completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);

            resolve({
              success: result.success !== false,
              taskId: request.taskId,
              clusterId: this.config.id,
              agentId: agent.id,
              status: result.success ? 'completed' : 'failed',
              error: result.error,
              completedAt: Date.now(),
            });
          } catch (parseError) {
            console.error(`[ClusterInstance] Parse error: ${parseError}`);
            console.error(`[ClusterInstance] Response data: ${data.substring(0, 500)}`);

            resolve({
              success: false,
              taskId: request.taskId,
              clusterId: this.config.id,
              agentId: agent.id,
              status: 'failed',
              error: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
              completedAt: Date.now(),
            });
          }
        });
      });

      req.on('error', (error: Error) => {
        clearTimeout(timeout);
        console.error(`[ClusterInstance] HTTP error: ${error.message}`);
        console.error(`[ClusterInstance] Is the kraken-agent-wrapper daemon running?`);
        console.error(`[ClusterInstance] Start it with: python3 kraken-agent-wrapper.py`);

        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: `Failed to connect to wrapper daemon: ${error.message}. Is kraken-agent-wrapper.py running on host?`,
          completedAt: Date.now(),
        });
      });

      req.write(postData);
      req.end();
    });
  }

  private getAvailableAgents(): ClusterAgentInstance[] {
    const available: ClusterAgentInstance[] = [];
    
    for (const agent of this.agents.values()) {
      if (!agent.busy) {
        available.push(agent);
      }
    }

    return available;
  }

  /**
   * Enqueue a task for async execution
   */
  enqueueTask(request: KrakenDelegationRequest): Promise<KrakenDelegationResult> {
    this.load.pendingTasks++;
    this.load.lastActivity = Date.now();

    return new Promise((resolve, reject) => {
      this.taskQueue.push({ request, resolve, reject });
    });
  }

  /**
   * Get current load
   */
  getLoad(): ClusterLoad {
    return {
      ...this.load,
      clusterId: this.config.id,
    };
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): ClusterAgentInstance | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents in this cluster
   */
  getAllAgents(): ClusterAgentInstance[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get cluster config
   */
  getConfig(): ClusterConfig {
    return this.config;
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): KrakenDelegationResult[] {
    return [...this.completedTasks];
  }

  /**
   * Get failed tasks
   */
  getFailedTasks(): KrakenDelegationResult[] {
    return [...this.failedTasks];
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.taskQueue.length;
  }

  /**
   * Shutdown the cluster gracefully
   */
  async shutdown(): Promise<void> {
    this.shutdownFlag = true;

    // Wait for active tasks to complete (with timeout)
    const startTime = Date.now();
    const timeout = 5000; // 5 second timeout

    while (this.load.activeTasks > 0 && Date.now() - startTime < timeout) {
      await this.sleep(100);
    }

    // Cancel remaining queued tasks
    for (const task of this.taskQueue) {
      task.reject(new Error('Cluster shutting down'));
    }
    this.taskQueue = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
