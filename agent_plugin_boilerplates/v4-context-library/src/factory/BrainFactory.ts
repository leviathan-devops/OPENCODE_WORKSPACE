/**
 * V4 Brain Factory
 * 
 * Creates brain/orchestrator instances from configuration.
 */

import type { BrainConfig } from '../types/architecture';

export class BrainFactory {
  private brainRegistry: Map<string, BrainConstructor> = new Map();
  
  constructor() {
    this.registerDefaultBrains();
  }

  /**
   * Register a brain constructor
   */
  registerBrain(type: string, constructor: BrainConstructor): void {
    this.brainRegistry.set(type, constructor);
  }

  /**
   * Create a brain instance from configuration
   */
  createBrain(config: BrainConfig, context: any = {}): BrainInstance {
    const constructor = this.brainRegistry.get(config.type);
    
    if (!constructor) {
      throw new Error(`Unknown brain type: ${config.type}. Available types: ${Array.from(this.brainRegistry.keys()).join(', ')}`);
    }

    const instance = constructor(config, context);
    
    return {
      id: config.id,
      config,
      instance
    };
  }

  /**
   * Register default brain types
   */
  private registerDefaultBrains(): void {
    // Orchestrator brain (central decision maker)
    this.registerBrain('orchestrator', (config, context) => {
      return {
        type: 'orchestrator',
        name: config.name,
        coordinatesClusters: config.coordinatesClusters,
        canDelegateTo: config.canDelegateTo,
        config: config.config,
        
        // Orchestrator methods
        makeDecision: (options: any) => {
          // Centralized decision making
          return {
            decision: 'proceed',
            reason: 'Orchestrator decision',
            timestamp: Date.now()
          };
        },
        
        delegateTask: (task: any, targetAgentId: string) => {
          // Delegation logic
          return {
            taskId: task.id,
            delegatedTo: targetAgentId,
            timestamp: Date.now()
          };
        },
        
        monitorProgress: () => {
          // Monitoring logic
          return {
            status: 'active',
            metrics: {}
          };
        }
      };
    });

    // Supervisor brain (oversight and quality control)
    this.registerBrain('supervisor', (config, context) => {
      return {
        type: 'supervisor',
        name: config.name,
        coordinatesClusters: config.coordinatesClusters,
        canDelegateTo: config.canDelegateTo,
        config: config.config,
        
        // Supervisor methods
        reviewWork: (work: any) => {
          // Quality review
          return {
            approved: true,
            feedback: 'Work meets quality standards',
            score: 0.95
          };
        },
        
        enforceStandards: () => {
          // Standards enforcement
          return {
            enforced: true,
            violations: []
          };
        },
        
        provideGuidance: (agentId: string, guidance: any) => {
          // Guidance provision
          return {
            guidanceProvided: true,
            agentId,
            timestamp: Date.now()
          };
        }
      };
    });

    // Monitor brain (observational only)
    this.registerBrain('monitor', (config, context) => {
      return {
        type: 'monitor',
        name: config.name,
        coordinatesClusters: config.coordinatesClusters,
        canDelegateTo: config.canDelegateTo,
        config: config.config,
        
        // Monitor methods
        observe: () => {
          // Observation logic
          return {
            observations: [],
            timestamp: Date.now()
          };
        },
        
        collectMetrics: () => {
          // Metrics collection
          return {
            metrics: {},
            timestamp: Date.now()
          };
        },
        
        generateReport: () => {
          // Report generation
          return {
            report: 'System status report',
            timestamp: Date.now()
          };
        }
      };
    });

    // Coordinator brain (task coordination)
    this.registerBrain('coordinator', (config, context) => {
      return {
        type: 'coordinator',
        name: config.name,
        coordinatesClusters: config.coordinatesClusters,
        canDelegateTo: config.canDelegateTo,
        config: config.config,
        
        // Coordinator methods
        coordinateTasks: (tasks: any[]) => {
          // Task coordination
          return {
            coordinated: true,
            taskCount: tasks.length,
            schedule: {}
          };
        },
        
        resolveConflicts: (conflicts: any[]) => {
          // Conflict resolution
          return {
            resolved: true,
            conflictCount: conflicts.length
          };
        },
        
        optimizeWorkflow: (workflow: any) => {
          // Workflow optimization
          return {
            optimized: true,
            improvements: []
          };
        }
      };
    });
  }

  /**
   * Get available brain types
   */
  getAvailableBrainTypes(): string[] {
    return Array.from(this.brainRegistry.keys());
  }
}

/**
 * Brain constructor type
 */
type BrainConstructor = (config: BrainConfig, context: any) => any;

/**
 * Brain instance interface
 */
export interface BrainInstance {
  id: string;
  config: BrainConfig;
  instance: any;
}