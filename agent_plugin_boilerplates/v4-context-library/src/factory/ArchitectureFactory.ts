/**
 * V4 Architecture Factory
 * 
 * Creates runtime architectures from configuration files.
 */

import type { ArchitectureConfig, ArchitectureFactoryOptions, CreateArchitectureOptions } from '../types/architecture';
import { BrainFactory } from './BrainFactory';
import { ClusterFactory } from './ClusterFactory';
import { AgentFactory } from './AgentFactory';
import { WorkflowFactory } from './WorkflowFactory';
import { CoordinationFactory } from './CoordinationFactory';

export class ArchitectureFactory {
  private options: ArchitectureFactoryOptions;
  private brainFactory: BrainFactory;
  private clusterFactory: ClusterFactory;
  private agentFactory: AgentFactory;
  private workflowFactory: WorkflowFactory;
  private coordinationFactory: CoordinationFactory;

  constructor(options: ArchitectureFactoryOptions = {}) {
    this.options = {
      baseDir: process.cwd(),
      validate: true,
      ...options
    };

    this.brainFactory = new BrainFactory();
    this.clusterFactory = new ClusterFactory();
    this.agentFactory = new AgentFactory();
    this.workflowFactory = new WorkflowFactory();
    this.coordinationFactory = new CoordinationFactory();
  }

  /**
   * Create a complete architecture from configuration
   */
  async createArchitecture(options: CreateArchitectureOptions): Promise<ArchitectureInstance> {
    const { config, context = {}, initializeCoordination = true } = options;
    
    // Load configuration
    const architectureConfig = await this.loadConfig(config);
    
    // Validate configuration
    if (this.options.validate) {
      const validationResult = this.validateConfig(architectureConfig);
      if (validationResult !== true) {
        throw new Error(`Architecture validation failed: ${validationResult}`);
      }
    }
    
    // Create architecture instance
    const instance: ArchitectureInstance = {
      id: architectureConfig.id,
      name: architectureConfig.name,
      config: architectureConfig,
      brains: [],
      clusters: [],
      agents: [],
      workflows: [],
      coordination: null,
      context
    };

    // Create brains
    for (const brainConfig of architectureConfig.brains) {
      const brain = this.brainFactory.createBrain(brainConfig, context);
      instance.brains.push(brain);
    }

    // Create clusters
    for (const clusterConfig of architectureConfig.clusters) {
      const cluster = this.clusterFactory.createCluster(clusterConfig, context);
      instance.clusters.push(cluster);
    }

    // Create agents
    for (const agentConfig of architectureConfig.agents) {
      const agent = this.agentFactory.createAgent(agentConfig, context);
      instance.agents.push(agent);
    }

    // Create workflows
    for (const workflowConfig of architectureConfig.workflows) {
      const workflow = this.workflowFactory.createWorkflow(workflowConfig, context);
      instance.workflows.push(workflow);
    }

    // Create coordination layer
    if (initializeCoordination) {
      instance.coordination = this.coordinationFactory.createCoordination(
        architectureConfig.coordination,
        {
          brains: instance.brains,
          clusters: instance.clusters,
          agents: instance.agents,
          workflows: instance.workflows,
          context
        }
      );
    }

    return instance;
  }

  /**
   * Load configuration from file or object
   */
  private async loadConfig(config: string | ArchitectureConfig): Promise<ArchitectureConfig> {
    if (typeof config === 'string') {
      // Load from file
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const configPath = path.isAbsolute(config) 
        ? config 
        : path.join(this.options.baseDir!, config);
      
      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Validate version
      if (parsed.version !== 'v4') {
        throw new Error(`Invalid architecture version: ${parsed.version}. Expected 'v4'`);
      }
      
      return parsed as ArchitectureConfig;
    } else {
      // Use provided object
      if (config.version !== 'v4') {
        throw new Error(`Invalid architecture version: ${config.version}. Expected 'v4'`);
      }
      return config;
    }
  }

  /**
   * Validate architecture configuration
   */
  private validateConfig(config: ArchitectureConfig): true | string {
    // Basic validation
    if (!config.id || typeof config.id !== 'string') {
      return 'Architecture must have a string id';
    }
    
    if (!config.name || typeof config.name !== 'string') {
      return 'Architecture must have a string name';
    }
    
    if (!config.brains || !Array.isArray(config.brains)) {
      return 'Architecture must have a brains array';
    }
    
    if (!config.clusters || !Array.isArray(config.clusters)) {
      return 'Architecture must have a clusters array';
    }
    
    if (!config.agents || !Array.isArray(config.agents)) {
      return 'Architecture must have an agents array';
    }
    
    if (!config.workflows || !Array.isArray(config.workflows)) {
      return 'Architecture must have a workflows array';
    }
    
    if (!config.coordination || typeof config.coordination !== 'object') {
      return 'Architecture must have a coordination configuration';
    }
    
    // Validate brain references
    const brainIds = new Set(config.brains.map(b => b.id));
    for (const cluster of config.clusters) {
      if (!brainIds.has(cluster.coordinatedBy)) {
        return `Cluster ${cluster.id} references non-existent brain ${cluster.coordinatedBy}`;
      }
    }
    
    for (const workflow of config.workflows) {
      if (!brainIds.has(workflow.managedBy)) {
        return `Workflow ${workflow.id} references non-existent brain ${workflow.managedBy}`;
      }
      
      for (const gate of workflow.gates) {
        if (!brainIds.has(gate.evaluatedBy)) {
          return `Gate ${gate.id} references non-existent brain ${gate.evaluatedBy}`;
        }
      }
    }
    
    // Validate cluster references
    const clusterIds = new Set(config.clusters.map(c => c.id));
    for (const agent of config.agents) {
      if (!clusterIds.has(agent.clusterId)) {
        return `Agent ${agent.id} references non-existent cluster ${agent.clusterId}`;
      }
    }
    
    for (const cluster of config.clusters) {
      if (cluster.parentClusterId && !clusterIds.has(cluster.parentClusterId)) {
        return `Cluster ${cluster.id} references non-existent parent cluster ${cluster.parentClusterId}`;
      }
    }
    
    // Validate agent references
    const agentIds = new Set(config.agents.map(a => a.id));
    for (const cluster of config.clusters) {
      for (const agentId of cluster.agentIds) {
        if (!agentIds.has(agentId)) {
          return `Cluster ${cluster.id} references non-existent agent ${agentId}`;
        }
      }
    }
    
    for (const workflow of config.workflows) {
      for (const phase of workflow.phases) {
        for (const agentId of phase.participatingAgents) {
          if (!agentIds.has(agentId)) {
            return `Workflow phase ${phase.id} references non-existent agent ${agentId}`;
          }
        }
      }
    }
    
    // Run custom validators
    if (this.options.validators) {
      for (const validator of this.options.validators) {
        const result = validator(config);
        if (result !== true) {
          return `Custom validator failed: ${result}`;
        }
      }
    }
    
    return true;
  }

  /**
   * Get factory for specific component type
   */
  getBrainFactory(): BrainFactory {
    return this.brainFactory;
  }

  getClusterFactory(): ClusterFactory {
    return this.clusterFactory;
  }

  getAgentFactory(): AgentFactory {
    return this.agentFactory;
  }

  getWorkflowFactory(): WorkflowFactory {
    return this.workflowFactory;
  }

  getCoordinationFactory(): CoordinationFactory {
    return this.coordinationFactory;
  }
}

/**
 * Runtime architecture instance
 */
export interface ArchitectureInstance {
  id: string;
  name: string;
  config: ArchitectureConfig;
  brains: BrainInstance[];
  clusters: ClusterInstance[];
  agents: AgentInstance[];
  workflows: WorkflowInstance[];
  coordination: CoordinationInstance | null;
  context: any;
}

export interface BrainInstance {
  id: string;
  config: any;
  instance: any;
}

export interface ClusterInstance {
  id: string;
  config: any;
  instance: any;
}

export interface AgentInstance {
  id: string;
  config: any;
  instance: any;
}

export interface WorkflowInstance {
  id: string;
  config: any;
  instance: any;
}

export interface CoordinationInstance {
  config: any;
  instance: any;
}