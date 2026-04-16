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

import { spawn } from 'child_process';
import * as path from 'path';

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
   * Uses direct spawn of Python wrapper which spawns Docker containers
   * 
   * NOTE: opencode-python3 image has Python 3.12.13, enabling direct spawn.
   */
  private async executeOnAgent(
    agent: ClusterAgentInstance,
    request: KrakenDelegationRequest
  ): Promise<KrakenDelegationResult> {
    const wrapperPath = path.join(
      process.cwd(),
      'subagent-manager',
      'wrappers',
      'opencode_agent.py'
    );

    const model = request.model || 'minimax/MiniMax-M2.7';
    const timeout = Math.floor((request.timeout || 120) * 1000);

    console.log(`[ClusterInstance] Spawning Python wrapper for agent ${agent.id}`);
    console.log(`[ClusterInstance] Task: ${request.task.substring(0, 100)}...`);
    console.log(`[ClusterInstance] Wrapper: ${wrapperPath}`);

    return new Promise((resolve) => {
      const proc = spawn('python3', [
        wrapperPath,
        '--task', request.task,
        '--model', model,
        '--workspace', process.cwd(),
        '--timeout', String(Math.floor((request.timeout || 120))),
        '--cleanup'
      ], {
        cwd: process.cwd(),
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGTERM');
        console.error(`[ClusterInstance] Task ${request.taskId} timeout`);
        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: 'Task execution timeout',
          completedAt: Date.now(),
        });
      }, timeout);

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code: number | null) => {
        clearTimeout(timer);

        if (timedOut) return;

        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
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
            console.error(`[ClusterInstance] stdout: ${stdout.substring(0, 500)}`);
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
        } else {
          console.error(`[ClusterInstance] Process exited with code ${code}`);
          console.error(`[ClusterInstance] stderr: ${stderr.substring(0, 500)}`);
          resolve({
            success: false,
            taskId: request.taskId,
            clusterId: this.config.id,
            agentId: agent.id,
            status: 'failed',
            error: stderr || `Exit code: ${code}`,
            completedAt: Date.now(),
          });
        }
      });

      proc.on('error', (error: Error) => {
        clearTimeout(timer);
        console.error(`[ClusterInstance] Spawn error: ${error.message}`);
        resolve({
          success: false,
          taskId: request.taskId,
          clusterId: this.config.id,
          agentId: agent.id,
          status: 'failed',
          error: `Spawn failed: ${error.message}`,
          completedAt: Date.now(),
        });
      });
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
