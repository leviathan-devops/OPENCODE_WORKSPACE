# Pod 4: Swarm Coordination Engine - Executable Build Process

## Mission
Build production-grade swarm coordination engine for parallel execution of agent build tasks across Shark agent specialists. Implement task decomposition, resource allocation, progress tracking, error recovery, and coordination system with Redis-based queues, dynamic agent pool management, and real-time monitoring.

## Success Criteria
- ✅ Task decomposer converts agent specifications into executable task graphs
- ✅ Resource allocator assigns tasks to appropriate Shark agents with optimal load balancing
- ✅ Redis-based priority queue system with job scheduling and persistence
- ✅ Real-time progress tracking with WebSocket updates to frontend
- ✅ Automated error recovery with rollback and retry mechanisms
- ✅ Dependency graph management ensuring correct execution order
- ✅ Checkpoint system for incremental progress persistence
- ✅ Dynamic agent pool scaling based on workload
- ✅ Comprehensive monitoring with Prometheus metrics
- ✅ Integration with Pod 1 API Gateway and Pod 3 Orchestrator

## Pre-flight Checks
1. **Verify development environment**:
   ```bash
   cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab
   node --version
   python --version
   docker --version
   redis-cli --version
   ```

2. **Check infrastructure availability**:
   ```bash
   docker-compose ps | grep redis
   redis-cli ping
   docker-compose ps | grep postgres
   pg_isready -h localhost -p 5432
   ```

3. **Verify Shark CLI availability**:
   ```bash
   which shark
   shark --help
   which opencode
   opencode --version
   ```

4. **Check API Gateway connectivity**:
   ```bash
   curl -s http://localhost:3000/health | grep "status"
   wscat -c ws://localhost:3000/ws
   ```

## Phase 1: Task Queue Infrastructure

### Step 1: Project Structure Setup
```bash
# Create swarm-engine package
cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab
mkdir -p packages/swarm-engine/src/{core,services,models,workers,monitoring,utils}

# Initialize package.json
cat > packages/swarm-engine/package.json << 'EOF'
{
  "name": "@agent-lab/swarm-engine",
  "version": "0.1.0",
  "description": "Swarm Coordination Engine for Agent Lab",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts",
    "worker:task": "tsx src/workers/task-worker.ts",
    "worker:monitor": "tsx src/workers/monitor-worker.ts",
    "worker:recovery": "tsx src/workers/recovery-worker.ts"
  },
  "dependencies": {
    "bull": "^4.11.0",
    "ioredis": "^5.3.0",
    "pg": "^8.11.0",
    "graphlib": "^2.1.8",
    "axios": "^1.6.0",
    "ws": "^8.14.0",
    "zod": "^3.22.0",
    "winston": "^3.10.0",
    "prom-client": "^14.0.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "rate-limiter-flexible": "^2.4.0",
    "eventemitter2": "^6.4.7",
    "p-limit": "^4.0.0",
    "uuid": "^9.0.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@types/uuid": "^9.0.0",
    "@types/graphlib": "^2.1.9",
    "typescript": "^5.0.0",
    "tsx": "^3.12.0",
    "vitest": "^0.34.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "@types/bull": "^4.10.0",
    "@types/ioredis": "^5.0.0"
  }
}
EOF

# Create TypeScript configuration
cat > packages/swarm-engine/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOF

# Create Redis configuration
cat > packages/swarm-engine/src/config/redis.ts << 'EOF'
import IORedis from 'ioredis'

export interface RedisConfig {
  host: string
  port: number
  password?: string
  db: number
  keyPrefix: string
  retryStrategy: (times: number) => number | null
}

export const redisConfig: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: 'swarm:',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  }
}

export function createRedisConnection(): IORedis {
  return new IORedis({
    ...redisConfig,
    lazyConnect: true,
    maxRetriesPerRequest: 3
  })
}

export function createRedisSubscriber(): IORedis {
  return new IORedis({
    ...redisConfig,
    lazyConnect: true,
    maxRetriesPerRequest: null // Allow unlimited retries for subscriptions
  })
}
EOF

# Create Bull queue configuration
cat > packages/swarm-engine/src/core/queues.ts << 'EOF'
import Bull from 'bull'
import { createRedisConnection } from '@/config/redis'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'

export enum QueueName {
  TASK_DECOMPOSITION = 'task-decomposition',
  TASK_EXECUTION = 'task-execution',
  TASK_MONITORING = 'task-monitoring',
  ERROR_RECOVERY = 'error-recovery',
  AGENT_POOL_MANAGEMENT = 'agent-pool-management'
}

export interface QueueConfig {
  name: QueueName
  concurrency: number
  attempts: number
  backoff: Bull.BackoffOpts
  removeOnComplete: boolean | number
  removeOnFail: boolean | number
}

export const queueConfigs: Record<QueueName, QueueConfig> = {
  [QueueName.TASK_DECOMPOSITION]: {
    name: QueueName.TASK_DECOMPOSITION,
    concurrency: 2,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50 // Keep last 50 failed jobs
  },
  [QueueName.TASK_EXECUTION]: {
    name: QueueName.TASK_EXECUTION,
    concurrency: 10,
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 2000
    },
    removeOnComplete: 1000,
    removeOnFail: 100
  },
  [QueueName.TASK_MONITORING]: {
    name: QueueName.TASK_MONITORING,
    concurrency: 5,
    attempts: 1,
    backoff: {
      type: 'fixed',
      delay: 5000
    },
    removeOnComplete: false, // Never remove monitoring jobs
    removeOnFail: false
  },
  [QueueName.ERROR_RECOVERY]: {
    name: QueueName.ERROR_RECOVERY,
    concurrency: 3,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 50,
    removeOnFail: 20
  },
  [QueueName.AGENT_POOL_MANAGEMENT]: {
    name: QueueName.AGENT_POOL_MANAGEMENT,
    concurrency: 1,
    attempts: 1,
    backoff: {
      type: 'fixed',
      delay: 10000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
}

export class QueueManager {
  private logger: Logger
  private queues: Map<QueueName, Bull.Queue>
  private redis: IORedis

  constructor() {
    this.logger = createLogger('queue-manager')
    this.queues = new Map()
    this.redis = createRedisConnection()
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing queue manager')
    
    try {
      await this.redis.connect()
      this.logger.info('Redis connection established')
      
      // Initialize all queues
      for (const [name, config] of Object.entries(queueConfigs)) {
        await this.createQueue(name as QueueName, config)
      }
      
      this.logger.info('All queues initialized')
    } catch (error) {
      this.logger.error('Failed to initialize queue manager', { error })
      throw error
    }
  }

  private async createQueue(name: QueueName, config: QueueConfig): Promise<Bull.Queue> {
    const queue = new Bull(name, {
      redis: {
        host: this.redis.options.host,
        port: this.redis.options.port,
        password: this.redis.options.password,
        db: this.redis.options.db
      },
      defaultJobOptions: {
        attempts: config.attempts,
        backoff: config.backoff,
        removeOnComplete: config.removeOnComplete,
        removeOnFail: config.removeOnFail,
        timeout: 300000 // 5 minutes default timeout
      },
      settings: {
        stalledInterval: 30000, // Check for stalled jobs every 30s
        maxStalledCount: 2,
        guardInterval: 5000,
        retryProcessDelay: 5000
      }
    })

    // Set up event listeners
    queue.on('error', (error) => {
      this.logger.error(`Queue ${name} error`, { error })
    })

    queue.on('waiting', (jobId) => {
      this.logger.debug(`Job ${jobId} waiting in queue ${name}`)
    })

    queue.on('active', (job) => {
      this.logger.debug(`Job ${job.id} active in queue ${name}`)
    })

    queue.on('completed', (job, result) => {
      this.logger.info(`Job ${job.id} completed in queue ${name}`, { result })
    })

    queue.on('failed', (job, error) => {
      this.logger.error(`Job ${job?.id || 'unknown'} failed in queue ${name}`, { error })
    })

    this.queues.set(name, queue)
    this.logger.info(`Queue ${name} created with concurrency ${config.concurrency}`)
    
    return queue
  }

  getQueue(name: QueueName): Bull.Queue {
    const queue = this.queues.get(name)
    if (!queue) {
      throw new Error(`Queue ${name} not found`)
    }
    return queue
  }

  async addJob<T = any>(
    queueName: QueueName,
    data: T,
    options?: Bull.JobOptions
  ): Promise<Bull.Job<T>> {
    const queue = this.getQueue(queueName)
    return queue.add(data, options)
  }

  async getJob(queueName: QueueName, jobId: string): Promise<Bull.Job | null> {
    const queue = this.getQueue(queueName)
    return queue.getJob(jobId)
  }

  async getJobCounts(queueName: QueueName): Promise<Bull.JobCounts> {
    const queue = this.getQueue(queueName)
    return queue.getJobCounts()
  }

  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName)
    await queue.pause()
  }

  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName)
    await queue.resume()
  }

  async drainQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName)
    await queue.drain()
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up queue manager')
    
    // Close all queues
    for (const [name, queue] of this.queues.entries()) {
      try {
        await queue.close()
        this.logger.info(`Queue ${name} closed`)
      } catch (error) {
        this.logger.error(`Failed to close queue ${name}`, { error })
      }
    }
    
    // Close Redis connection
    await this.redis.quit()
    
    this.logger.info('Queue manager cleaned up')
  }
}
EOF

echo "Phase 1 queue infrastructure setup complete."
```

### Step 2: Task Decomposition Service
```bash
# Create task decomposer service
cat > packages/swarm-engine/src/services/task-decomposer.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { QueueManager, QueueName } from '@/core/queues'
import { AgentSpecification, TaskGraph, TaskNode, TaskDependency } from '@/models/types'
import { Graph } from 'graphlib'
import { CapabilityRegistry } from './capability-registry'
import { SharkAgentRegistry } from './shark-agent-registry'

export class TaskDecomposer {
  private logger: Logger
  private queueManager: QueueManager
  private capabilityRegistry: CapabilityRegistry
  private sharkAgentRegistry: SharkAgentRegistry
  private maxParallelTasks = 10
  private maxRetries = 3

  constructor() {
    this.logger = createLogger('task-decomposer')
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing task decomposer')
    this.queueManager = new QueueManager()
    this.capabilityRegistry = new CapabilityRegistry()
    this.sharkAgentRegistry = new SharkAgentRegistry()
    
    await Promise.all([
      this.queueManager.initialize(),
      this.capabilityRegistry.initialize(),
      this.sharkAgentRegistry.initialize()
    ])
    
    // Set up queue processor
    await this.setupQueueProcessor()
    
    this.logger.info('Task decomposer initialized')
  }

  async decomposeSpecification(
    specification: AgentSpecification,
    buildId: string
  ): Promise<TaskGraph> {
    this.logger.info('Decomposing specification', { 
      specName: specification.name,
      buildId 
    })

    // Step 1: Create task nodes from capabilities
    const taskNodes = await this.createTaskNodes(specification.capabilities, buildId)
    
    // Step 2: Determine dependencies
    const dependencies = this.calculateDependencies(taskNodes, specification.workflow)
    
    // Step 3: Create task graph
    const taskGraph = this.buildTaskGraph(taskNodes, dependencies)
    
    // Step 4: Validate graph is acyclic
    this.validateTaskGraph(taskGraph)
    
    // Step 5: Assign Shark agents to tasks
    await this.assignAgentsToTasks(taskNodes)
    
    // Step 6: Create execution plan
    const executionPlan = this.createExecutionPlan(taskGraph)
    
    const result: TaskGraph = {
      id: `graph_${buildId}`,
      buildId,
      specificationId: specification.metadata?.id || 'unknown',
      nodes: taskNodes,
      dependencies,
      executionPlan,
      status: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        totalTasks: taskNodes.length,
        estimatedDuration: this.estimateDuration(taskNodes),
        complexity: specification.metadata?.complexity || 'moderate'
      }
    }

    // Step 7: Queue tasks for execution
    await this.queueTasksForExecution(result)
    
    this.logger.info('Specification decomposed', { 
      buildId, 
      taskCount: taskNodes.length,
      dependencyCount: dependencies.length 
    })
    
    return result
  }

  private async createTaskNodes(
    capabilities: any[],
    buildId: string
  ): Promise<TaskNode[]> {
    const taskNodes: TaskNode[] = []
    
    for (const [index, capability] of capabilities.entries()) {
      const taskId = `task_${buildId}_${index}`
      
      // Get capability details
      const capabilityDetails = await this.capabilityRegistry.getById(capability.id)
      if (!capabilityDetails) {
        this.logger.warn('Capability not found, skipping', { capabilityId: capability.id })
        continue
      }
      
      // Create task node
      const taskNode: TaskNode = {
        id: taskId,
        buildId,
        capabilityId: capability.id,
        capabilityName: capabilityDetails.name,
        config: capability.config || {},
        status: 'pending',
        priority: this.calculatePriority(capabilityDetails),
        estimatedDuration: capabilityDetails.estimatedDuration || 30000, // 30 seconds default
        maxRetries: this.maxRetries,
        assignedAgentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          index,
          capabilityCategory: capabilityDetails.category,
          requiresResources: capabilityDetails.requiresResources || []
        }
      }
      
      taskNodes.push(taskNode)
    }
    
    return taskNodes
  }

  private calculateDependencies(
    taskNodes: TaskNode[],
    workflow: any[]
  ): TaskDependency[] {
    const dependencies: TaskDependency[] = []
    
    // Add dependencies from workflow specification
    for (const connection of workflow) {
      const sourceTask = taskNodes.find(t => t.capabilityId === connection.from)
      const targetTask = taskNodes.find(t => t.capabilityId === connection.to)
      
      if (sourceTask && targetTask) {
        dependencies.push({
          id: `dep_${sourceTask.id}_${targetTask.id}`,
          sourceTaskId: sourceTask.id,
          targetTaskId: targetTask.id,
          type: 'execution_order',
          condition: connection.condition || 'always'
        })
      }
    }
    
    // Add implicit dependencies based on capability requirements
    for (const task of taskNodes) {
      const capability = this.capabilityRegistry.getFromCache(task.capabilityId)
      if (capability?.dependencies) {
        for (const depId of capability.dependencies) {
          const depTask = taskNodes.find(t => t.capabilityId === depId)
          if (depTask && depTask.id !== task.id) {
            // Check if dependency already exists
            const exists = dependencies.some(d => 
              d.sourceTaskId === depTask.id && d.targetTaskId === task.id
            )
            
            if (!exists) {
              dependencies.push({
                id: `dep_${depTask.id}_${task.id}`,
                sourceTaskId: depTask.id,
                targetTaskId: task.id,
                type: 'capability_requirement',
                condition: 'always'
              })
            }
          }
        }
      }
    }
    
    return dependencies
  }

  private buildTaskGraph(
    nodes: TaskNode[],
    dependencies: TaskDependency[]
  ): Graph {
    const graph = new Graph({ directed: true, compound: false })
    
    // Add nodes
    for (const node of nodes) {
      graph.setNode(node.id, node)
    }
    
    // Add edges
    for (const dep of dependencies) {
      graph.setEdge(dep.sourceTaskId, dep.targetTaskId, dep)
    }
    
    return graph
  }

  private validateTaskGraph(graph: Graph): void {
    // Check for cycles
    if (!graphlib.alg.isAcyclic(graph)) {
      const cycles = graphlib.alg.findCycles(graph)
      this.logger.error('Task graph contains cycles', { cycles })
      throw new Error(`Task graph contains ${cycles.length} cycles`)
    }
    
    // Check for orphaned nodes (no connections)
    const nodes = graph.nodes()
    const orphanedNodes = nodes.filter(node => {
      const predecessors = graph.predecessors(node)
      const successors = graph.successors(node)
      return predecessors.length === 0 && successors.length === 0
    })
    
    if (orphanedNodes.length > 0) {
      this.logger.warn('Task graph contains orphaned nodes', { orphanedNodes })
    }
  }

  private async assignAgentsToTasks(taskNodes: TaskNode[]): Promise<void> {
    const availableAgents = await this.sharkAgentRegistry.getAvailableAgents()
    
    if (availableAgents.length === 0) {
      this.logger.warn('No Shark agents available for task assignment')
      return
    }
    
    // Simple round-robin assignment for now
    // In production, would use more sophisticated algorithm considering:
    // - Agent capabilities
    // - Current load
    // - Task priorities
    // - Resource requirements
    
    let agentIndex = 0
    for (const task of taskNodes) {
      const agent = availableAgents[agentIndex % availableAgents.length]
      task.assignedAgentId = agent.id
      task.metadata.assignedAgentType = agent.type
      
      agentIndex++
    }
    
    this.logger.info('Assigned agents to tasks', { 
      taskCount: taskNodes.length,
      agentCount: availableAgents.length 
    })
  }

  private createExecutionPlan(taskGraph: Graph): any {
    // Generate topological order for execution
    const topologicalOrder = graphlib.alg.topsort(taskGraph)
    
    // Group tasks by execution level (parallelizable tasks)
    const executionLevels: string[][] = []
    const visited = new Set<string>()
    
    for (const nodeId of topologicalOrder) {
      if (visited.has(nodeId)) continue
      
      const level: string[] = [nodeId]
      visited.add(nodeId)
      
      // Find tasks that can run in parallel (no dependencies between them)
      const remaining = topologicalOrder.filter(id => !visited.has(id))
      for (const otherId of remaining) {
        const hasPath = graphlib.alg.hasPath(taskGraph, nodeId, otherId) ||
                       graphlib.alg.hasPath(taskGraph, otherId, nodeId)
        
        if (!hasPath) {
          level.push(otherId)
          visited.add(otherId)
        }
      }
      
      executionLevels.push(level)
    }
    
    // Limit parallel tasks per level
    const limitedLevels = executionLevels.map(level => {
      if (level.length > this.maxParallelTasks) {
        this.logger.warn(`Limiting parallel tasks from ${level.length} to ${this.maxParallelTasks}`)
        return level.slice(0, this.maxParallelTasks)
      }
      return level
    })
    
    return {
      topologicalOrder,
      executionLevels: limitedLevels,
      estimatedTotalLevels: limitedLevels.length,
      maxParallelTasks: this.maxParallelTasks
    }
  }

  private async queueTasksForExecution(taskGraph: TaskGraph): Promise<void> {
    const executionPlan = taskGraph.executionPlan
    
    for (const [levelIndex, levelTasks] of executionPlan.executionLevels.entries()) {
      for (const taskId of levelTasks) {
        const taskNode = taskGraph.nodes.find(t => t.id === taskId)
        if (!taskNode) continue
        
        // Create job data
        const jobData = {
          taskId: taskNode.id,
          buildId: taskGraph.buildId,
          capabilityId: taskNode.capabilityId,
          config: taskNode.config,
          assignedAgentId: taskNode.assignedAgentId,
          priority: taskNode.priority,
          metadata: {
            level: levelIndex,
            totalLevels: executionPlan.estimatedTotalLevels,
            ...taskNode.metadata
          }
        }
        
        // Add to task execution queue
        await this.queueManager.addJob(QueueName.TASK_EXECUTION, jobData, {
          jobId: taskNode.id,
          priority: taskNode.priority,
          delay: levelIndex * 1000 // Stagger execution by level
        })
        
        this.logger.debug('Task queued for execution', { 
          taskId: taskNode.id,
          level: levelIndex 
        })
      }
    }
    
    // Add monitoring job for the entire build
    await this.queueManager.addJob(QueueName.TASK_MONITORING, {
      buildId: taskGraph.buildId,
      taskCount: taskGraph.nodes.length,
      graphId: taskGraph.id
    }, {
      repeat: { every: 30000 } // Check every 30 seconds
    })
    
    this.logger.info('All tasks queued for execution', { 
      buildId: taskGraph.buildId,
      totalTasks: taskGraph.nodes.length,
      totalLevels: executionPlan.estimatedTotalLevels 
    })
  }

  private calculatePriority(capability: any): number {
    // Priority based on category and estimated duration
    const categoryWeights = {
      'input': 1,
      'processing': 3,
      'output': 2,
      'utility': 2
    }
    
    const categoryWeight = categoryWeights[capability.category] || 2
    const durationWeight = Math.min(capability.estimatedDuration / 60000, 5) // Cap at 5
    
    return Math.round(categoryWeight + durationWeight)
  }

  private estimateDuration(taskNodes: TaskNode[]): number {
    // Simple sum of estimated durations
    // In production, would consider parallel execution and dependencies
    return taskNodes.reduce((total, task) => total + task.estimatedDuration, 0)
  }

  private async setupQueueProcessor(): Promise<void> {
    const queue = this.queueManager.getQueue(QueueName.TASK_DECOMPOSITION)
    
    queue.process(async (job) => {
      this.logger.info('Processing task decomposition job', { jobId: job.id })
      
      try {
        const { specification, buildId } = job.data
        
        // Decompose specification
        const taskGraph = await this.decomposeSpecification(specification, buildId)
        
        // Update job progress
        job.progress(100)
        
        return {
          success: true,
          taskGraphId: taskGraph.id,
          taskCount: taskGraph.nodes.length,
          estimatedDuration: taskGraph.metadata.estimatedDuration
        }
      } catch (error) {
        this.logger.error('Task decomposition failed', { 
          jobId: job.id,
          error: error.message 
        })
        throw error
      }
    })
    
    this.logger.info('Task decomposition queue processor setup complete')
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.queueManager.cleanup(),
      this.capabilityRegistry.cleanup(),
      this.sharkAgentRegistry.cleanup()
    ])
    this.logger.info('Task decomposer cleaned up')
  }
}
EOF

echo "Task decomposer service created."
```

## Phase 2: Task Execution System

### Step 3: Shark Agent Integration
```bash
# Create Shark agent registry
cat > packages/swarm-engine/src/services/shark-agent-registry.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { EventEmitter2 } from 'eventemitter2'
import { RedisCache } from './redis-cache'
import { Database } from './database'

export interface SharkAgent {
  id: string
  name: string
  type: 'shark' | 'opencode' | 'custom'
  capabilities: string[]
  status: 'available' | 'busy' | 'offline' | 'error'
  load: number // 0-100
  lastHeartbeat: string
  metadata: {
    version?: string
    host?: string
    pid?: number
    maxConcurrentTasks?: number
    currentTasks?: number
  }
}

export interface TaskAssignment {
  taskId: string
  agentId: string
  assignedAt: string
  completedAt?: string
  result?: any
  error?: string
}

export class SharkAgentRegistry extends EventEmitter2 {
  private logger: Logger
  private cache: RedisCache
  private database: Database
  private agents: Map<string, SharkAgent>
  private heartbeatInterval = 30000 // 30 seconds
  private cleanupInterval = 60000 // 1 minute
  private maxAgentLoad = 80 // Maximum load percentage before considered busy

  constructor() {
    super()
    this.logger = createLogger('shark-agent-registry')
    this.agents = new Map()
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Shark agent registry')
    this.cache = new RedisCache()
    this.database = new Database()
    
    await Promise.all([
      this.cache.initialize(),
      this.database.initialize()
    ])
    
    // Load agents from cache/database
    await this.loadAgents()
    
    // Start heartbeat monitoring
    this.startHeartbeatMonitoring()
    
    // Start cleanup job
    this.startCleanupJob()
    
    this.logger.info('Shark agent registry initialized')
  }

  async registerAgent(agent: Omit<SharkAgent, 'status' | 'lastHeartbeat'>): Promise<SharkAgent> {
    const now = new Date().toISOString()
    const fullAgent: SharkAgent = {
      ...agent,
      status: 'available',
      lastHeartbeat: now,
      metadata: {
        ...agent.metadata,
        currentTasks: 0
      }
    }

    this.agents.set(agent.id, fullAgent)
    
    // Persist to cache and database
    await Promise.all([
      this.cache.set(`agent:${agent.id}`, fullAgent, 300), // 5 minute TTL
      this.database.upsert('shark_agents', agent.id, fullAgent)
    ])
    
    this.emit('agent:registered', { agent: fullAgent })
    this.logger.info('Agent registered', { agentId: agent.id, type: agent.type })
    
    return fullAgent
  }

  async updateAgentHeartbeat(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    agent.lastHeartbeat = new Date().toISOString()
    agent.status = agent.load < this.maxAgentLoad ? 'available' : 'busy'
    
    // Update cache
    await this.cache.set(`agent:${agentId}`, agent, 300)
    
    this.emit('agent:heartbeat', { agentId, load: agent.load })
  }

  async updateAgentLoad(agentId: string, taskCount: number): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    const maxTasks = agent.metadata.maxConcurrentTasks || 5
    agent.load = Math.min(100, (taskCount / maxTasks) * 100)
    agent.metadata.currentTasks = taskCount
    
    // Update status based on load
    agent.status = agent.load < this.maxAgentLoad ? 'available' : 'busy'
    
    // Update cache
    await this.cache.set(`agent:${agentId}`, agent, 300)
    
    this.emit('agent:load_updated', { agentId, load: agent.load, taskCount })
  }

  async getAvailableAgents(): Promise<SharkAgent[]> {
    const now = new Date()
    const availableAgents: SharkAgent[] = []
    
    for (const agent of this.agents.values()) {
      const lastHeartbeat = new Date(agent.lastHeartbeat)
      const secondsSinceHeartbeat = (now.getTime() - lastHeartbeat.getTime()) / 1000
      
      // Agent is available if:
      // 1. Status is 'available'
      // 2. Has had a heartbeat in the last 2 minutes
      // 3. Load is below threshold
      if (
        agent.status === 'available' &&
        secondsSinceHeartbeat < 120 &&
        agent.load < this.maxAgentLoad
      ) {
        availableAgents.push(agent)
      }
    }
    
    // Sort by load (least loaded first)
    availableAgents.sort((a, b) => a.load - b.load)
    
    return availableAgents
  }

  async getAgentByCapability(capabilityId: string): Promise<SharkAgent | null> {
    const availableAgents = await this.getAvailableAgents()
    
    // Find agents that have the required capability
    const capableAgents = availableAgents.filter(agent =>
      agent.capabilities.includes(capabilityId)
    )
    
    if (capableAgents.length === 0) {
      return null
    }
    
    // Return the least loaded capable agent
    return capableAgents.reduce((prev, current) =>
      prev.load < current.load ? prev : current
    )
  }

  async assignTask(agentId: string, taskId: string): Promise<TaskAssignment> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    const assignment: TaskAssignment = {
      taskId,
      agentId,
      assignedAt: new Date().toISOString()
    }

    // Update agent load
    const currentTasks = (agent.metadata.currentTasks || 0) + 1
    await this.updateAgentLoad(agentId, currentTasks)
    
    // Store assignment
    await this.database.insert('task_assignments', {
      ...assignment,
      id: `${taskId}_${agentId}`
    })
    
    this.emit('task:assigned', { taskId, agentId, assignment })
    this.logger.info('Task assigned to agent', { taskId, agentId })
    
    return assignment
  }

  async completeTask(agentId: string, taskId: string, result: any): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    // Update assignment
    await this.database.update('task_assignments', `${taskId}_${agentId}`, {
      completedAt: new Date().toISOString(),
      result
    })
    
    // Update agent load
    const currentTasks = Math.max(0, (agent.metadata.currentTasks || 1) - 1)
    await this.updateAgentLoad(agentId, currentTasks)
    
    this.emit('task:completed', { taskId, agentId, result })
    this.logger.info('Task completed by agent', { taskId, agentId })
  }

  async failTask(agentId: string, taskId: string, error: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }

    // Update assignment
    await this.database.update('task_assignments', `${taskId}_${agentId}`, {
      completedAt: new Date().toISOString(),
      error
    })
    
    // Update agent load
    const currentTasks = Math.max(0, (agent.metadata.currentTasks || 1) - 1)
    await this.updateAgentLoad(agentId, currentTasks)
    
    // Update agent status if too many failures
    const failures = await this.getAgentFailureCount(agentId)
    if (failures > 3) {
      agent.status = 'error'
      await this.cache.set(`agent:${agentId}`, agent, 300)
      this.logger.warn('Agent marked as error due to multiple failures', { agentId, failures })
    }
    
    this.emit('task:failed', { taskId, agentId, error })
    this.logger.error('Task failed by agent', { taskId, agentId, error })
  }

  private async loadAgents(): Promise<void> {
    try {
      // Try cache first
      const cachedAgentIds = await this.cache.keys('agent:*')
      
      for (const key of cachedAgentIds) {
        const agent = await this.cache.get<SharkAgent>(key)
        if (agent) {
          this.agents.set(agent.id, agent)
        }
      }
      
      // If no agents in cache, load from database
      if (this.agents.size === 0) {
        const dbAgents = await this.database.getAll('shark_agents')
        for (const agent of dbAgents) {
          this.agents.set(agent.id, agent)
          // Cache for future use
          await this.cache.set(`agent:${agent.id}`, agent, 300)
        }
      }
      
      this.logger.info(`Loaded ${this.agents.size} agents from storage`)
    } catch (error) {
      this.logger.error('Failed to load agents', { error })
    }
  }

  private startHeartbeatMonitoring(): void {
    setInterval(async () => {
      const now = new Date()
      
      for (const [agentId, agent] of this.agents.entries()) {
        const lastHeartbeat = new Date(agent.lastHeartbeat)
        const minutesSinceHeartbeat = (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60)
        
        // Mark agent as offline if no heartbeat in 5 minutes
        if (minutesSinceHeartbeat > 5 && agent.status !== 'offline') {
          agent.status = 'offline'
          this.agents.set(agentId, agent)
          
          await this.cache.set(`agent:${agentId}`, agent, 300)
          this.emit('agent:offline', { agentId, lastHeartbeat: agent.lastHeartbeat })
          
          this.logger.warn('Agent marked as offline', { 
            agentId, 
            minutesSinceHeartbeat: Math.round(minutesSinceHeartbeat) 
          })
        }
      }
    }, this.heartbeatInterval)
  }

  private startCleanupJob(): void {
    setInterval(async () => {
      try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        
        // Remove old offline agents
        for (const [agentId, agent] of this.agents.entries()) {
          const lastHeartbeat = new Date(agent.lastHeartbeat)
          
          if (agent.status === 'offline' && lastHeartbeat < cutoff) {
            this.agents.delete(agentId)
            await this.cache.delete(`agent:${agentId}`)
            this.logger.info('Removed old offline agent', { agentId, lastHeartbeat })
          }
        }
      } catch (error) {
        this.logger.error('Cleanup job failed', { error })
      }
    }, this.cleanupInterval)
  }

  private async getAgentFailureCount(agentId: string): Promise<number> {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000)
    
    const failures = await this.database.query(
      'task_assignments',
      {
        agentId,
        error: { $exists: true },
        completedAt: { $gte: lastHour.toISOString() }
      },
      { limit: 10 }
    )
    
    return failures.length
  }

  async cleanup(): Promise<void> {
    // Clear intervals
    // Note: In production, would use proper interval cleanup
    
    await Promise.all([
      this.cache.cleanup(),
      this.database.cleanup()
    ])
    
    this.logger.info('Shark agent registry cleaned up')
  }
}
EOF

echo "Shark agent registry created."
```

### Step 4: Task Execution Worker
```bash
# Create task execution worker
cat > packages/swarm-engine/src/workers/task-worker.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { QueueManager, QueueName } from '@/core/queues'
import { SharkAgentRegistry } from '@/services/shark-agent-registry'
import { TaskTracker } from '@/services/task-tracker'
import { spawn } from 'child_process'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

export interface TaskExecutionResult {
  success: boolean
  output?: string
  error?: string
  duration: number
  metadata?: Record<string, any>
}

export class TaskWorker {
  private logger: Logger
  private queueManager: QueueManager
  private agentRegistry: SharkAgentRegistry
  private taskTracker: TaskTracker
  private maxExecutionTime = 300000 // 5 minutes

  constructor() {
    this.logger = createLogger('task-worker')
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing task worker')
    this.queueManager = new QueueManager()
    this.agentRegistry = new SharkAgentRegistry()
    this.taskTracker = new TaskTracker()
    
    await Promise.all([
      this.queueManager.initialize(),
      this.agentRegistry.initialize(),
      this.taskTracker.initialize()
    ])
    
    // Set up queue processor
    await this.setupQueueProcessor()
    
    this.logger.info('Task worker initialized')
  }

  private async setupQueueProcessor(): Promise<void> {
    const queue = this.queueManager.getQueue(QueueName.TASK_EXECUTION)
    
    queue.process(async (job) => {
      const startTime = Date.now()
      const { taskId, buildId, capabilityId, config, assignedAgentId } = job.data
      
      this.logger.info('Processing task execution job', { 
        jobId: job.id,
        taskId,
        capabilityId 
      })
      
      try {
        // Update task status
        await this.taskTracker.updateTaskStatus(taskId, 'running')
        
        // Execute task
        const result = await this.executeTask({
          taskId,
          capabilityId,
          config,
          assignedAgentId
        })
        
        const duration = Date.now() - startTime
        
        if (result.success) {
          // Task completed successfully
          await this.taskTracker.completeTask(taskId, {
            output: result.output,
            duration,
            metadata: result.metadata
          })
          
          // Update agent registry
          await this.agentRegistry.completeTask(assignedAgentId!, taskId, result)
          
          job.progress(100)
          
          this.logger.info('Task execution completed', { 
            taskId,
            duration,
            agentId: assignedAgentId 
          })
          
          return {
            success: true,
            taskId,
            duration,
            output: result.output?.substring(0, 1000) // Limit output size
          }
        } else {
          // Task failed
          await this.taskTracker.failTask(taskId, {
            error: result.error,
            duration,
            metadata: result.metadata
          })
          
          // Update agent registry
          await this.agentRegistry.failTask(assignedAgentId!, taskId, result.error || 'Unknown error')
          
          // Check if retry is needed
          const shouldRetry = await this.shouldRetryTask(taskId, job.attemptsMade)
          
          if (shouldRetry) {
            this.logger.warn('Task execution failed, will retry', { 
              taskId,
              attempt: job.attemptsMade,
              error: result.error 
            })
            
            throw new Error(result.error || 'Task execution failed')
          } else {
            // Mark as permanently failed
            await this.taskTracker.updateTaskStatus(taskId, 'failed')
            
            // Queue error recovery
            await this.queueManager.addJob(QueueName.ERROR_RECOVERY, {
              taskId,
              buildId,
              error: result.error,
              attempt: job.attemptsMade
            })
            
            this.logger.error('Task execution failed permanently', { 
              taskId,
              attempts: job.attemptsMade,
              error: result.error 
            })
            
            return {
              success: false,
              taskId,
              error: result.error,
              duration
            }
          }
        }
      } catch (error) {
        const duration = Date.now() - startTime
        
        await this.taskTracker.failTask(taskId, {
          error: error.message,
          duration,
          metadata: { unexpectedError: true }
        })
        
        this.logger.error('Task execution threw unexpected error', { 
          taskId,
          error: error.message,
          duration 
        })
        
        throw error
      }
    })
    
    this.logger.info('Task execution queue processor setup complete')
  }

  private async executeTask(params: {
    taskId: string
    capabilityId: string
    config: Record<string, any>
    assignedAgentId?: string
  }): Promise<TaskExecutionResult> {
    const { taskId, capabilityId, config, assignedAgentId } = params
    const startTime = Date.now()
    
    try {
      // Get capability-specific execution command
      const command = this.buildExecutionCommand(capabilityId, config)
      
      this.logger.debug('Executing task command', { 
        taskId,
        command: command.substring(0, 200) // Log truncated command
      })
      
      // Execute command
      const result = await this.executeCommand(command, this.maxExecutionTime)
      
      const duration = Date.now() - startTime
      
      return {
        success: true,
        output: result.stdout,
        duration,
        metadata: {
          exitCode: 0,
          command: command.substring(0, 500),
          agentId: assignedAgentId
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      
      return {
        success: false,
        error: error.message,
        duration,
        metadata: {
          exitCode: error.code || 1,
          stderr: error.stderr?.substring(0, 1000),
          agentId: assignedAgentId
        }
      }
    }
  }

  private buildExecutionCommand(capabilityId: string, config: Record<string, any>): string {
    // Map capability IDs to Shark CLI commands
    const commandMap: Record<string, (config: any) => string> = {
      'text-input': () => 'shark process-text-input',
      'llm-processor': (config) => `shark run-llm --model ${config.model || 'default'} --prompt "${config.prompt || ''}"`,
      'code-generator': (config) => `shark generate-code --language ${config.language || 'python'} --requirements "${config.requirements || ''}"`,
      'api-caller': (config) => `shark call-api --method ${config.method || 'GET'} --url "${config.url || ''}"`,
      'file-upload': () => 'shark process-file-upload',
      'data-transformer': (config) => `shark transform-data --input-format ${config.inputFormat || 'json'} --output-format ${config.outputFormat || 'json'}`,
      'conditional-logic': () => 'shark evaluate-conditions',
      'loop-processor': (config) => `shark run-loop --iterations ${config.maxIterations || 10}`
    }
    
    const commandBuilder = commandMap[capabilityId]
    if (!commandBuilder) {
      // Default command for unknown capabilities
      return `shark execute --capability ${capabilityId} --config '${JSON.stringify(config)}'`
    }
    
    return commandBuilder(config)
  }

  private async executeCommand(
    command: string, 
    timeout: number
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout
      })
      
      let stdout = ''
      let stderr = ''
      
      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr })
        } else {
          const error = new Error(`Command failed with exit code ${code}`)
          ;(error as any).code = code
          ;(error as any).stderr = stderr
          reject(error)
        }
      })
      
      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  private async shouldRetryTask(taskId: string, attemptsMade: number): Promise<boolean> {
    // Get task details
    const task = await this.taskTracker.getTask(taskId)
    if (!task) {
      return false
    }
    
    // Check if task has retries left
    if (attemptsMade >= task.maxRetries) {
      return false
    }
    
    // Check error type to determine if retry is appropriate
    const lastError = task.metadata?.lastError
    if (lastError?.includes('timeout') || lastError?.includes('network')) {
      // Retry timeout and network errors
      return true
    }
    
    if (lastError?.includes('permission') || lastError?.includes('validation')) {
      // Don't retry permission or validation errors
      return false
    }
    
    // Default: retry based on attempts
    return attemptsMade < 3
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.queueManager.cleanup(),
      this.agentRegistry.cleanup(),
      this.taskTracker.cleanup()
    ])
    this.logger.info('Task worker cleaned up')
  }
}

// Main execution
if (require.main === module) {
  const worker = new TaskWorker()
  
  worker.initialize().catch((error) => {
    console.error('Failed to initialize task worker:', error)
    process.exit(1)
  })
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down task worker...')
    await worker.cleanup()
    process.exit(0)
  })
  
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down task worker...')
    await worker.cleanup()
    process.exit(0)
  })
}
EOF

echo "Task execution worker created."
```

## Phase 3: Progress Tracking & Monitoring

### Step 5: Task Tracker Service
```bash
# Create task tracker service
cat > packages/swarm-engine/src/services/task-tracker.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { EventEmitter2 } from 'eventemitter2'
import { RedisCache } from './redis-cache'
import { Database } from './database'
import { WebSocketServer } from './websocket-server'

export interface TaskStatus {
  taskId: string
  buildId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  startedAt?: string
  completedAt?: string
  duration?: number
  output?: string
  error?: string
  metadata?: Record<string, any>
}

export interface BuildStatus {
  buildId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  totalTasks: number
  completedTasks: number
  failedTasks: number
  runningTasks: number
  progress: number // 0-100
  startedAt: string
  completedAt?: string
  estimatedCompletion?: string
  metadata?: Record<string, any>
}

export class TaskTracker extends EventEmitter2 {
  private logger: Logger
  private cache: RedisCache
  private database: Database
  private websocketServer: WebSocketServer
  private updateInterval = 5000 // 5 seconds

  constructor() {
    super()
    this.logger = createLogger('task-tracker')
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing task tracker')
    this.cache = new RedisCache()
    this.database = new Database()
    this.websocketServer = new WebSocketServer()
    
    await Promise.all([
      this.cache.initialize(),
      this.database.initialize(),
      this.websocketServer.initialize()
    ])
    
    // Start periodic status updates
    this.startStatusUpdates()
    
    this.logger.info('Task tracker initialized')
  }

  async createTask(task: {
    id: string
    buildId: string
    capabilityId: string
    capabilityName: string
    config: Record<string, any>
    priority: number
    estimatedDuration: number
    maxRetries: number
    metadata?: Record<string, any>
  }): Promise<void> {
    const taskStatus: TaskStatus = {
      taskId: task.id,
      buildId: task.buildId,
      status: 'pending',
      progress: 0,
      metadata: {
        ...task.metadata,
        capabilityId: task.capabilityId,
        capabilityName: task.capabilityName,
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        maxRetries: task.maxRetries,
        config: task.config
      }
    }

    // Store in cache
    await this.cache.set(`task:${task.id}`, taskStatus, 86400) // 24 hours
    
    // Store in database
    await this.database.insert('task_status', {
      ...taskStatus,
      id: task.id
    })
    
    // Update build status
    await this.updateBuildStatus(task.buildId)
    
    this.emit('task:created', { taskId: task.id, buildId: task.buildId })
    this.logger.debug('Task created', { taskId: task.id, buildId: task.buildId })
  }

  async updateTaskStatus(
    taskId: string, 
    status: TaskStatus['status'],
    progress?: number
  ): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    const updates: Partial<TaskStatus> = {
      status,
      updatedAt: new Date().toISOString()
    }

    if (progress !== undefined) {
      updates.progress = progress
    }

    if (status === 'running' && !task.startedAt) {
      updates.startedAt = new Date().toISOString()
    }

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      updates.completedAt = new Date().toISOString()
      if (task.startedAt) {
        const duration = new Date().getTime() - new Date(task.startedAt).getTime()
        updates.duration = duration
      }
      updates.progress = 100
    }

    // Update cache
    const updatedTask = { ...task, ...updates }
    await this.cache.set(`task:${taskId}`, updatedTask, 86400)
    
    // Update database
    await this.database.update('task_status', taskId, updates)
    
    // Update build status
    await this.updateBuildStatus(task.buildId)
    
    // Broadcast update via WebSocket
    await this.broadcastTaskUpdate(updatedTask)
    
    this.emit('task:status_updated', { taskId, status, progress })
    this.logger.debug('Task status updated', { taskId, status, progress })
  }

  async updateTaskProgress(taskId: string, progress: number): Promise<void> {
    await this.updateTaskStatus(taskId, 'running', progress)
  }

  async completeTask(
    taskId: string, 
    result: { output?: string; duration?: number; metadata?: Record<string, any> }
  ): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    const updates: Partial<TaskStatus> = {
      status: 'completed',
      progress: 100,
      completedAt: new Date().toISOString(),
      output: result.output,
      duration: result.duration
    }

    if (result.metadata) {
      updates.metadata = { ...task.metadata, ...result.metadata }
    }

    // Update cache
    const updatedTask = { ...task, ...updates }
    await this.cache.set(`task:${taskId}`, updatedTask, 86400)
    
    // Update database
    await this.database.update('task_status', taskId, updates)
    
    // Update build status
    await this.updateBuildStatus(task.buildId)
    
    // Broadcast update
    await this.broadcastTaskUpdate(updatedTask)
    
    this.emit('task:completed', { taskId, result })
    this.logger.info('Task completed', { taskId, duration: result.duration })
  }

  async failTask(
    taskId: string,
    error: { error?: string; duration?: number; metadata?: Record<string, any> }
  ): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    const updates: Partial<TaskStatus> = {
      status: 'failed',
      progress: 100,
      completedAt: new Date().toISOString(),
      error: error.error,
      duration: error.duration
    }

    if (error.metadata) {
      updates.metadata = { 
        ...task.metadata, 
        ...error.metadata,
        lastError: error.error,
        lastErrorAt: new Date().toISOString()
      }
    }

    // Update cache
    const updatedTask = { ...task, ...updates }
    await this.cache.set(`task:${taskId}`, updatedTask, 86400)
    
    // Update database
    await this.database.update('task_status', taskId, updates)
    
    // Update build status
    await this.updateBuildStatus(task.buildId)
    
    // Broadcast update
    await this.broadcastTaskUpdate(updatedTask)
    
    this.emit('task:failed', { taskId, error })
    this.logger.error('Task failed', { taskId, error: error.error })
  }

  async getTask(taskId: string): Promise<TaskStatus | null> {
    // Try cache first
    const cached = await this.cache.get<TaskStatus>(`task:${taskId}`)
    if (cached) {
      return cached
    }

    // Fall back to database
    const fromDb = await this.database.get('task_status', taskId)
    if (fromDb) {
      // Cache for future use
      await this.cache.set(`task:${taskId}`, fromDb, 86400)
      return fromDb
    }

    return null
  }

  async getBuildTasks(buildId: string): Promise<TaskStatus[]> {
    const tasks = await this.database.query(
      'task_status',
      { buildId },
      { sort: { createdAt: 1 } }
    )
    
    return tasks
  }

  async getBuildStatus(buildId: string): Promise<BuildStatus> {
    const tasks = await this.getBuildTasks(buildId)
    
    if (tasks.length === 0) {
      throw new Error(`Build ${buildId} not found`)
    }

    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const failedTasks = tasks.filter(t => t.status === 'failed').length
    const runningTasks = tasks.filter(t => t.status === 'running').length
    
    const progress = tasks.length > 0 
      ? Math.round((completedTasks + failedTasks) / tasks.length * 100)
      : 0
    
    // Determine overall build status
    let status: BuildStatus['status'] = 'pending'
    if (runningTasks > 0) {
      status = 'running'
    } else if (completedTasks === tasks.length) {
      status = 'completed'
    } else if (failedTasks > 0) {
      status = 'failed'
    }
    
    // Calculate estimated completion
    let estimatedCompletion: string | undefined
    if (status === 'running') {
      const runningTask = tasks.find(t => t.status === 'running')
      if (runningTask?.startedAt && runningTask.metadata?.estimatedDuration) {
        const estimatedEnd = new Date(
          new Date(runningTask.startedAt).getTime() + runningTask.metadata.estimatedDuration
        )
        estimatedCompletion = estimatedEnd.toISOString()
      }
    }
    
    const buildStatus: BuildStatus = {
      buildId,
      status,
      totalTasks: tasks.length,
      completedTasks,
      failedTasks,
      runningTasks,
      progress,
      startedAt: tasks[0]?.createdAt || new Date().toISOString(),
      completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : undefined,
      estimatedCompletion,
      metadata: {
        taskIds: tasks.map(t => t.taskId),
        lastUpdated: new Date().toISOString()
      }
    }

    // Cache build status
    await this.cache.set(`build:${buildId}`, buildStatus, 300) // 5 minutes
    
    return buildStatus
  }

  async subscribeToBuild(buildId: string, clientId: string): Promise<void> {
    await this.websocketServer.subscribe(clientId, `build:${buildId}`)
    this.logger.debug('Client subscribed to build updates', { clientId, buildId })
  }

  async unsubscribeFromBuild(buildId: string, clientId: string): Promise<void> {
    await this.websocketServer.unsubscribe(clientId, `build:${buildId}`)
    this.logger.debug('Client unsubscribed from build updates', { clientId, buildId })
  }

  private async updateBuildStatus(buildId: string): Promise<void> {
    try {
      const buildStatus = await this.getBuildStatus(buildId)
      
      // Broadcast to subscribed clients
      await this.websocketServer.broadcast(`build:${buildId}`, {
        type: 'build:status_updated',
        data: buildStatus,
        timestamp: new Date().toISOString()
      })
      
      this.emit('build:status_updated', { buildId, status: buildStatus })
    } catch (error) {
      this.logger.error('Failed to update build status', { buildId, error })
    }
  }

  private async broadcastTaskUpdate(task: TaskStatus): Promise<void> {
    await this.websocketServer.broadcast(`task:${task.taskId}`, {
      type: 'task:status_updated',
      data: task,
      timestamp: new Date().toISOString()
    })
    
    // Also broadcast to build channel
    await this.websocketServer.broadcast(`build:${task.buildId}`, {
      type: 'task:status_updated',
      data: {
        taskId: task.taskId,
        status: task.status,
        progress: task.progress,
        buildId: task.buildId
      },
      timestamp: new Date().toISOString()
    })
  }

  private startStatusUpdates(): void {
    setInterval(async () => {
      try {
        // Get all active builds (builds with running tasks)
        const activeBuilds = await this.database.query(
          'task_status',
          { status: 'running' },
          { distinct: 'buildId' }
        )
        
        for (const task of activeBuilds) {
          await this.updateBuildStatus(task.buildId)
        }
      } catch (error) {
        this.logger.error('Periodic status update failed', { error })
      }
    }, this.updateInterval)
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.cache.cleanup(),
      this.database.cleanup(),
      this.websocketServer.cleanup()
    ])
    this.logger.info('Task tracker cleaned up')
  }
}
EOF

echo "Task tracker service created."
```

## Phase 4: Error Recovery & Monitoring

### Step 6: Error Recovery System
```bash
# Create error recovery service
cat > packages/swarm-engine/src/services/error-recovery.ts << 'EOF'
import { Logger } from 'winston'
import { createLogger } from '@/utils/logger'
import { QueueManager, QueueName } from '@/core/queues'
import { TaskTracker } from './task-tracker'
import { SharkAgentRegistry } from './shark-agent-registry'
import { TaskDecomposer } from './task-decomposer'

export interface RecoveryStrategy {
  type: 'retry' | 'reassign' | 'skip' | 'rollback' | 'manual'
  priority: number
  conditions: RecoveryCondition[]
  action: (context: RecoveryContext) => Promise<RecoveryResult>
}

export interface RecoveryCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'matches'
  value: any
}

export interface RecoveryContext {
  taskId: string
  buildId: string
  error: string
  attempt: number
  agentId?: string
  taskStatus?: any
  buildStatus?: any
}

export interface RecoveryResult {
  success: boolean
  action: string
  message: string
  metadata?: Record<string, any>
}

export class ErrorRecoveryService {
  private logger: Logger
  private queueManager: QueueManager
  private taskTracker: TaskTracker
  private agentRegistry: SharkAgentRegistry
  private taskDecomposer: TaskDecomposer
  private strategies: RecoveryStrategy[]

  constructor() {
    this.logger = createLogger('error-recovery')
    this.strategies = this.initializeStrategies()
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing error recovery service')
    this.queueManager = new QueueManager()
    this.taskTracker = new TaskTracker()
    this.agentRegistry = new SharkAgentRegistry()
    this.taskDecomposer = new TaskDecomposer()
    
    await Promise.all([
      this.queueManager.initialize(),
      this.taskTracker.initialize(),
      this.agentRegistry.initialize(),
      this.taskDecomposer.initialize()
    ])
    
    // Set up queue processor
    await this.setupQueueProcessor()
    
    this.logger.info('Error recovery service initialized')
  }

  private initializeStrategies(): RecoveryStrategy[] {
    return [
      {
        type: 'retry',
        priority: 1,
        conditions: [
          { field: 'error', operator: 'contains', value: 'timeout' },
          { field: 'attempt', operator: 'less_than', value: 3 }
        ],
        action: async (context) => this.retryStrategy(context)
      },
      {
        type: 'reassign',
        priority: 2,
        conditions: [
          { field: 'error', operator: 'contains', value: 'agent' },
          { field: 'attempt', operator: 'greater_than', value: 1 }
        ],
        action: async (context) => this.reassignStrategy(context)
      },
      {
        type: 'skip',
        priority: 3,
        conditions: [
          { field: 'error', operator: 'contains', value: 'optional' },
          { field: 'attempt', operator: 'greater_than', value: 2 }
        ],
        action: async (context) => this.skipStrategy(context)
      },
      {
        type: 'rollback',
        priority: 4,
        conditions: [
          { field: 'error', operator: 'contains', value: 'critical' },
          { field: 'buildStatus.progress', operator: 'greater_than', value: 50 }
        ],
        action: async (context) => this.rollbackStrategy(context)
      },
      {
        type: 'manual',
        priority: 5,
        conditions: [
          { field: 'attempt', operator: 'greater_than', value: 3 }
        ],
        action: async (context) => this.manualInterventionStrategy(context)
      }
    ]
  }

  async recoverTask(context: RecoveryContext): Promise<RecoveryResult> {
    this.logger.info('Attempting error recovery', context)
    
    // Get additional context
    const taskStatus = await this.taskTracker.getTask(context.taskId)
    const buildStatus = await this.taskTracker.getBuildStatus(context.buildId)
    
    const fullContext: RecoveryContext = {
      ...context,
      taskStatus,
      buildStatus
    }
    
    // Find applicable strategies
    const applicableStrategies = this.findApplicableStrategies(fullContext)
    
    if (applicableStrategies.length === 0) {
      this.logger.warn('No recovery strategies applicable', { context })
      return {
        success: false,
        action: 'none',
        message: 'No recovery strategies applicable'
      }
    }
    
    // Sort by priority (lower number = higher priority)
    applicableStrategies.sort((a, b) => a.priority - b.priority)
    
    // Try strategies in order
    for (const strategy of applicableStrategies) {
      try {
        this.logger.info('Trying recovery strategy', { 
          strategy: strategy.type,
          priority: strategy.priority 
        })
        
        const result = await strategy.action(fullContext)
        
        if (result.success) {
          this.logger.info('Recovery strategy succeeded', { 
            strategy: strategy.type,
            result 
          })
          return result
        }
        
        this.logger.warn('Recovery strategy failed', { 
          strategy: strategy.type,
          result 
        })
      } catch (error) {
        this.logger.error('Recovery strategy threw error', { 
          strategy: strategy.type,
          error: error.message 
        })
      }
    }
    
    // All strategies failed
    return {
      success: false,
      action: 'failed',
      message: 'All recovery strategies failed'
    }
  }

  private findApplicableStrategies(context: RecoveryContext): RecoveryStrategy[] {
    return this.strategies.filter(strategy => {
      return strategy.conditions.every(condition => {
        const fieldValue = this.getFieldValue(context, condition.field)
        return this.evaluateCondition(fieldValue, condition)
      })
    })
  }

  private getFieldValue(context: any, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let value = context
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }
    
    return value
  }

  private evaluateCondition(value: any, condition: RecoveryCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value)
      case 'greater_than':
        return typeof value === 'number' && value > condition.value
      case 'less_than':
        return typeof value === 'number' && value < condition.value
      case 'matches':
        return typeof value === 'string' && new RegExp(condition.value).test(value)
      default:
        return false
    }
  }

  private async retryStrategy(context: RecoveryContext): Promise<RecoveryResult> {
    const { taskId, buildId, attempt } = context
    
    // Calculate delay based on attempt number (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
    
    // Requeue task with delay
    await this.queueManager.addJob(
      QueueName.TASK_EXECUTION,
      { taskId, buildId, retryAttempt: attempt + 1 },
      {
        delay,
        priority: 1 // Higher priority for retries
      }
    )
    
    return {
      success: true,
      action: 'requeued',
      message: `Task requeued for retry with ${delay}ms delay`,
      metadata: { delay, attempt: attempt + 1 }
    }
  }

  private async reassignStrategy(context: RecoveryContext): Promise<RecoveryResult> {
    const { taskId, buildId, taskStatus } = context
    
    if (!taskStatus) {
      return {
        success: false,
        action: 'reassign_failed',
        message: 'Task status not available'
      }
    }
    
    // Get current agent
    const currentAgentId = taskStatus.metadata?.assignedAgentId
    if (!currentAgentId) {
      return {
        success: false,
        action: 'reassign_failed',
        message: 'No agent assigned to task'
      }
    }
    
    // Find alternative agent with same capability
    const capabilityId = taskStatus.metadata?.capabilityId
    const alternativeAgent = await this.agentRegistry.getAgentByCapability(capabilityId)
    
    if (!alternativeAgent || alternativeAgent.id === currentAgentId) {
      return {
        success: false,
        action: 'reassign_failed',
        message: 'No alternative agent available'
      }
    }
    
    // Update task with new agent
    const updatedTask = {
      ...taskStatus,
      metadata: {
        ...taskStatus.metadata,
        assignedAgentId: alternativeAgent.id,
        previousAgentId: currentAgentId,
        reassignedAt: new Date().toISOString()
      }
    }
    
    await this.taskTracker.updateTaskStatus(taskId, 'pending')
    
    // Requeue task with new agent
    await this.queueManager.addJob(
      QueueName.TASK_EXECUTION,
      {
        taskId,
        buildId,
        assignedAgentId: alternativeAgent.id,
        config: taskStatus.metadata?.config || {},
        capabilityId,
        reassigned: true
      },
      { priority: 2 }
    )
    
    return {
      success: true,
      action: 'reassigned',
      message: `Task reassigned from agent ${currentAgentId} to ${alternativeAgent.id}`,
      metadata: {
        fromAgent: currentAgentId,
        toAgent: alternativeAgent.id,
        capabilityId
      }
    }
  }

  private async skipStrategy(context: RecoveryContext): Promise<RecoveryResult> {
    const { taskId, buildId, taskStatus } = context
    
    if (!taskStatus) {
      return {
        success: false,
        action: 'skip_failed',
        message: 'Task status not available'
      }
    }
    
    // Mark task as completed with skipped status
    await this.taskTracker.completeTask(taskId, {
      output: 'Task skipped due to non-critical error',
      metadata: {
        skipped: true,
        skipReason: context.error,
        originalError: context.error
      }
    })
    
    // Check if this affects downstream tasks
    const buildTasks = await this.taskTracker.getBuildTasks(buildId)
    const downstreamTasks = this.findDownstreamTasks(taskId, buildTasks)
    
    if (downstreamTasks.length > 0) {
      this.logger.warn('Skipping task with downstream dependencies', {
        taskId,
        downstreamCount: downstreamTasks.length
      })
      
      // Mark downstream tasks as needing review
      for (const downstreamTask of downstreamTasks) {
        await this.taskTracker.updateTaskStatus(downstreamTask.taskId, 'pending')
        
        // Add metadata about skipped dependency
        const currentMetadata = downstreamTask.metadata || {}
        await this.taskTracker.updateTaskStatus(downstreamTask.taskId, 'pending', {
          ...currentMetadata,
          skippedDependency: taskId,
          requiresReview: true
        })
      }
    }
    
    return {
      success: true,
      action: 'skipped',
      message: 'Task marked as skipped',
      metadata: {
        downstreamAffected: downstreamTasks.length,
        taskId
      }
    }
  }

  private async rollbackStrategy(context: RecoveryContext): Promise<RecoveryResult> {
    const { buildId, taskStatus } = context
    
    if (!taskStatus) {
      return {
        success: false,
        action: 'rollback_failed',
        message: 'Task status not available'
      }
    }
    
    // Get all completed tasks in this build
    const buildTasks = await this.taskTracker.getBuildTasks(buildId)
    const completedTasks = buildTasks.filter(t => 
      t.status === 'completed' && t.taskId !== taskStatus.taskId
    )
    
    if (completedTasks.length === 0) {
      return {
        success: false,
        action: 'rollback_failed',
        message: 'No completed tasks to rollback'
      }
    }
    
    this.logger.warn('Initiating rollback for build', {
      buildId,
      completedTaskCount: completedTasks.length,
      failedTask: taskStatus.taskId
    })
    
    // Mark all completed tasks as pending for re-execution
    for (const task of completedTasks) {
      await this.taskTracker.updateTaskStatus(task.taskId, 'pending')
      
      // Add rollback metadata
      const currentMetadata = task.metadata || {}
      await this.taskTracker.updateTaskStatus(task.taskId, 'pending', {
        ...currentMetadata,
        rollback: true,
        rollbackReason: `Due to failure of task ${taskStatus.taskId}`,
        rollbackAt: new Date().toISOString()
      })
    }
    
    // Mark failed task as pending
    await this.taskTracker.updateTaskStatus(taskStatus.taskId, 'pending')
    
    // Requeue all tasks
    for (const task of [...completedTasks, taskStatus]) {
      await this.queueManager.addJob(
        QueueName.TASK_EXECUTION,
        {
          taskId: task.taskId,
          buildId,
          config: task.metadata?.config || {},
          capabilityId: task.metadata?.capabilityId,
          rollback: true
        },
        { priority: 0 } // Highest priority for rollback
      )
    }
    
    return {
      success: true,
      action: 'rollback_initiated',
      message: `Rollback initiated for ${completedTasks.length + 1} tasks`,
      metadata: {
        rolledBackTasks: completedTasks.length,
        failedTask: taskStatus.taskId,
        totalTasks: completedTasks.length + 1
      }
    }
  }

  private async manualInterventionStrategy(context: RecoveryContext): Promise<RecoveryResult> {
    const { taskId, buildId, error } = context
    
    // Mark task as requiring manual intervention
    await this.taskTracker.updateTaskStatus(taskId, 'cancelled', {
      requiresManualIntervention: true,
      interventionReason: error,
      interventionRequestedAt: new Date().toISOString()
    })
    
    // Notify administrators via WebSocket or other means
    await this.queueManager.addJob(
      QueueName.AGENT_POOL_MANAGEMENT,
      {
        type: 'manual_intervention_required',
        taskId,
        buildId,
        error,
        timestamp: new Date().toISOString()
      }
    )
    
    return {
      success: true,
      action: 'manual_intervention_requested',
      message: 'Manual intervention requested for task',
      metadata: {
        taskId,
        buildId,
        error
      }
    }
  }

  private findDownstreamTasks(taskId: string, allTasks: any[]): any[] {
    // Simplified downstream detection
    // In production, would use proper dependency graph
    const downstream: any[] = []
    
    // Look for tasks that might depend on this one
    // This is a heuristic - proper implementation would use the task graph
    for (const task of allTasks) {
      if (task.taskId === taskId) continue
      
      const metadata = task.metadata || {}
      if (
        metadata.dependsOn === taskId ||
        metadata.requiredBy === taskId ||
        (metadata.dependencies && metadata.dependencies.includes(taskId))
      ) {
        downstream.push(task)
      }
    }
    
    return downstream
  }

  private async setupQueueProcessor(): Promise<void> {
    const queue = this.queueManager.getQueue(QueueName.ERROR_RECOVERY)
    
    queue.process(async (job) => {
      this.logger.info('Processing error recovery job', { jobId: job.id })
      
      try {
        const { taskId, buildId, error, attempt } = job.data
        
        const result = await this.recoverTask({
          taskId,
          buildId,
          error,
          attempt: attempt || 1
        })
        
        job.progress(100)
        
        return {
          success: result.success,
          recoveryAction: result.action,
          message: result.message,
          metadata: result.metadata
        }
      } catch (error) {
        this.logger.error('Error recovery failed', { 
          jobId: job.id,
          error: error.message 
        })
        throw error
      }
    })
    
    this.logger.info('Error recovery queue processor setup complete')
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.queueManager.cleanup(),
      this.taskTracker.cleanup(),
      this.agentRegistry.cleanup(),
      this.taskDecomposer.cleanup()
    ])
    this.logger.info('Error recovery service cleaned up')
  }
}
EOF

echo "Error recovery service created."
```

## Phase 5: API & Monitoring Integration

### Step 7: REST API & WebSocket Server
```bash
# Create main API server
cat > packages/swarm-engine/src/index.ts << 'EOF'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { TaskDecomposer } from './services/task-decomposer'
import { TaskTracker } from './services/task-tracker'
import { SharkAgentRegistry } from './services/shark-agent-registry'
import { ErrorRecoveryService } from './services/error-recovery'
import { createLogger } from './utils/logger'
import { config } from './config'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: config.allowedOrigins,
    credentials: true
  }
})

const logger = createLogger('swarm-api')
const taskDecomposer = new TaskDecomposer()
const taskTracker = new TaskTracker()
const agentRegistry = new SharkAgentRegistry()
const errorRecovery = new ErrorRecoveryService()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'swarm-engine'
  })
})

// REST API Routes

// Build management
app.post('/api/builds', async (req, res) => {
  try {
    const { specification, userId } = req.body
    const buildId = `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Decompose specification into tasks
    const taskGraph = await taskDecomposer.decomposeSpecification(specification, buildId)
    
    res.json({
      success: true,
      data: {
        buildId,
        taskGraphId: taskGraph.id,
        totalTasks: taskGraph.nodes.length,
        estimatedDuration: taskGraph.metadata.estimatedDuration,
        status: 'pending'
      }
    })
  } catch (error) {
    logger.error('Failed to create build', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to create build'
    })
  }
})

app.get('/api/builds/:buildId', async (req, res) => {
  try {
    const { buildId } = req.params
    const buildStatus = await taskTracker.getBuildStatus(buildId)
    
    res.json({
      success: true,
      data: buildStatus
    })
  } catch (error) {
    logger.error('Failed to get build status', { error })
    res.status(404).json({
      success: false,
      error: 'Build not found'
    })
  }
})

app.get('/api/builds/:buildId/tasks', async (req, res) => {
  try {
    const { buildId } = req.params
    const tasks = await taskTracker.getBuildTasks(buildId)
    
    res.json({
      success: true,
      data: tasks
    })
  } catch (error) {
    logger.error('Failed to get build tasks', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to get build tasks'
    })
  }
})

// Agent management
app.get('/api/agents', async (req, res) => {
  try {
    const availableAgents = await agentRegistry.getAvailableAgents()
    
    res.json({
      success: true,
      data: Array.from(availableAgents)
    })
  } catch (error) {
    logger.error('Failed to get agents', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to get agents'
    })
  }
})

app.post('/api/agents/register', async (req, res) => {
  try {
    const agent = req.body
    const registeredAgent = await agentRegistry.registerAgent(agent)
    
    res.json({
      success: true,
      data: registeredAgent
    })
  } catch (error) {
    logger.error('Failed to register agent', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to register agent'
    })
  }
})

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id })
  
  socket.on('subscribe:build', async (data) => {
    const { buildId } = data
    
    try {
      await taskTracker.subscribeToBuild(buildId, socket.id)
      socket.join(`build:${buildId}`)
      socket.emit('subscribed', { buildId })
      
      // Send current status
      const buildStatus = await taskTracker.getBuildStatus(buildId)
      socket.emit('build:status', buildStatus)
      
      logger.info('Client subscribed to build', { socketId: socket.id, buildId })
    } catch (error) {
      socket.emit('error', { message: 'Failed to subscribe to build' })
      logger.error('Failed to subscribe client to build', { error, socketId: socket.id, buildId })
    }
  })
  
  socket.on('unsubscribe:build', async (data) => {
    const { buildId } = data
    
    try {
      await taskTracker.unsubscribeFromBuild(buildId, socket.id)
      socket.leave(`build:${buildId}`)
      socket.emit('unsubscribed', { buildId })
      
      logger.info('Client unsubscribed from build', { socketId: socket.id, buildId })
    } catch (error) {
      logger.error('Failed to unsubscribe client from build', { error, socketId: socket.id, buildId })
    }
  })
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id })
  })
})

// Initialize and start server
async function startServer() {
  try {
    await Promise.all([
      taskDecomposer.initialize(),
      taskTracker.initialize(),
      agentRegistry.initialize(),
      errorRecovery.initialize()
    ])
    
    httpServer.listen(config.port, () => {
      logger.info(`Swarm Engine API server running on port ${config.port}`)
      logger.info(`WebSocket server available at ws://localhost:${config.port}`)
    })
  } catch (error) {
    logger.error('Failed to start server', { error })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully')
  
  await Promise.all([
    taskDecomposer.cleanup(),
    taskTracker.cleanup(),
    agentRegistry.cleanup(),
    errorRecovery.cleanup()
  ])
  
  httpServer.close(() => {
    logger.info('Server shut down gracefully')
    process.exit(0)
  })
})

startServer()
EOF

echo "API server created."
```

## Phase 6: Docker Deployment

### Step 8: Docker Configuration
```bash
# Create Dockerfile for swarm engine
cat > packages/swarm-engine/Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request('http://localhost:3002/health', {timeout: 2000}, (res) => {process.exit(res.statusCode === 200 ? 0 : 1)}); req.on('error', () => process.exit(1)); req.end()"

# Start the application
CMD ["node", "dist/index.js"]
EOF

# Create docker-compose.yml
cat > packages/swarm-engine/docker-compose.yml << 'EOF'
version: '3.8'

services:
  swarm-engine:
    build: .
    ports:
      - "3002:3002"
      - "9229:9229" # Node.js debug port
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/swarm_engine
      - ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
      - MAX_PARALLEL_TASKS=10
      - TASK_TIMEOUT=300000
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  swarm-worker:
    build: .
    command: ["node", "dist/workers/task-worker.js"]
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/swarm_engine
      - WORKER_TYPE=task
      - WORKER_CONCURRENCY=5
    depends_on:
      - postgres
      - redis
      - swarm-engine
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    scale: 3

  swarm-monitor:
    build: .
    command: ["node", "dist/workers/monitor-worker.js"]
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/swarm_engine
      - WORKER_TYPE=monitor
    depends_on:
      - postgres
      - redis
      - swarm-engine
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  swarm-recovery:
    build: .
    command: ["node", "dist/workers/recovery-worker.js"]
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/swarm_engine
      - WORKER_TYPE=recovery
    depends_on:
      - postgres
      - redis
      - swarm-engine
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=swarm_engine
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
EOF

echo "Docker configuration complete."
```

## Final Verification

### Step 9: Run Complete System
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/agent-lab/packages/swarm-engine

# Install dependencies
pnpm install

# Start development environment
docker-compose up -d postgres redis
pnpm dev

# Run workers in separate terminals
pnpm worker:task
pnpm worker:monitor
pnpm worker:recovery

# Run tests
pnpm test
pnpm test:coverage

# Build for production
pnpm build

# Start production environment
docker-compose up -d
```

### Step 10: Integration Checklist
1. ✅ Task decomposer converts specifications into executable task graphs
2. ✅ Redis-based queue system handles task scheduling and prioritization
3. ✅ Shark agent registry manages agent pool with load balancing
4. ✅ Task execution workers process tasks using Shark CLI
5. ✅ Task tracker provides real-time progress monitoring
6. ✅ Error recovery system handles failures with multiple strategies
7. ✅ WebSocket server broadcasts updates to frontend
8. ✅ REST API provides build and agent management
9. ✅ All tests pass with >80% coverage
10. ✅ Docker containers build and run successfully

## Next Steps for Pod 4

1. **Advanced Scheduling Algorithms**: Implement machine learning-based scheduling for optimal resource allocation
2. **Dynamic Scaling**: Auto-scale agent pool based on workload predictions
3. **Cost Optimization**: Minimize computational costs while meeting performance targets
4. **Cross-Agent Communication**: Enable direct communication between Shark agents during execution
5. **Checkpoint/Restart**: Save execution state for long-running tasks
6. **Predictive Failure Detection**: Use ML to predict and prevent failures before they occur
7. **Multi-Cloud Support**: Distribute tasks across multiple cloud providers
8. **Energy Efficiency**: Optimize for energy consumption in large deployments
9. **Compliance & Audit**: Add comprehensive logging for regulatory compliance
10. **Integration with External Systems**: Connect to CI/CD pipelines, monitoring tools, etc.

## Cross-Pod Integration Points

**With Pod 1 (API Gateway)**:
- REST API endpoints for build management
- WebSocket connection for real-time updates
- Authentication and rate limiting integration

**With Pod 2 (Visual Builder)**:
- Real-time progress visualization in 3D interface
- Interactive task control from visual builder
- Visual representation of swarm execution

**With Pod 3 (Conversational AI)**:
- Natural language status queries and updates
- Voice-controlled task management
- AI-driven optimization suggestions

**With Pod 5 (Testing & Deployment)**:
- Automated testing of swarm coordination
- Performance benchmarking and optimization
- Deployment pipeline integration

---

**Pod 4 Complete**: The swarm coordination engine is ready for development with comprehensive task decomposition, execution, monitoring, and recovery systems established. Proceed to Pod 5: Testing & Deployment Infrastructure.