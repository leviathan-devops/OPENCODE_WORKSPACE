/**
 * V4 Workflow Factory
 * 
 * Creates workflow instances from configuration.
 */

import type { WorkflowConfig, WorkflowPhase, WorkflowGate } from '../types/architecture';

export class WorkflowFactory {
  private workflowRegistry: Map<string, WorkflowConstructor> = new Map();
  
  constructor() {
    this.registerDefaultWorkflows();
  }

  /**
   * Register a workflow constructor
   */
  registerWorkflow(type: string, constructor: WorkflowConstructor): void {
    this.workflowRegistry.set(type, constructor);
  }

  /**
   * Create a workflow instance from configuration
   */
  createWorkflow(config: WorkflowConfig, context: any = {}): WorkflowInstance {
    // Use generic workflow constructor if no specific type registered
    const constructor = this.workflowRegistry.get(config.id) || this.createGenericWorkflow;
    
    const instance = constructor(config, context);
    
    return {
      id: config.id,
      config,
      instance
    };
  }

  /**
   * Generic workflow constructor
   */
  private createGenericWorkflow(config: WorkflowConfig, context: any): any {
    return {
      id: config.id,
      name: config.name,
      phases: config.phases,
      gates: config.gates,
      managedBy: config.managedBy,
      config: config.config,
      
      // Workflow methods
      start: () => {
        return {
          started: true,
          workflowId: config.id,
          currentPhase: config.phases[0]?.id || null,
          timestamp: Date.now()
        };
      },
      
      advanceToPhase: (phaseId: string) => {
        const phase = config.phases.find(p => p.id === phaseId);
        if (!phase) {
          throw new Error(`Phase ${phaseId} not found in workflow ${config.id}`);
        }
        
        return {
          advanced: true,
          phaseId,
          phaseName: phase.name,
          timestamp: Date.now()
        };
      },
      
      evaluateGate: (gateId: string, evidence: any) => {
        const gate = config.gates.find(g => g.id === gateId);
        if (!gate) {
          throw new Error(`Gate ${gateId} not found in workflow ${config.id}`);
        }
        
        // Simple gate evaluation
        const passed = this.evaluateGateCriteria(gate.criteria, evidence);
        
        return {
          gateId,
          passed,
          requiredCriteria: gate.criteria.map(c => c.required),
          timestamp: Date.now()
        };
      },
      
      getCurrentPhase: () => {
        return {
          phase: config.phases[0] || null,
          index: 0
        };
      },
      
      getNextPhase: (currentPhaseId: string) => {
        const currentIndex = config.phases.findIndex(p => p.id === currentPhaseId);
        if (currentIndex === -1) {
          return { phase: null, index: -1 };
        }
        
        const nextIndex = currentIndex + 1;
        if (nextIndex >= config.phases.length) {
          return { phase: null, index: -1 };
        }
        
        return {
          phase: config.phases[nextIndex],
          index: nextIndex
        };
      },
      
      canSkipPhase: (phaseId: string) => {
        const phase = config.phases.find(p => p.id === phaseId);
        if (!phase) return false;
        
        return phase.config?.optional === true;
      },
      
      getPhaseParticipants: (phaseId: string) => {
        const phase = config.phases.find(p => p.id === phaseId);
        if (!phase) return [];
        
        return phase.participatingAgents;
      }
    };
  }

  /**
   * Evaluate gate criteria
   */
  private evaluateGateCriteria(criteria: any[], evidence: any): boolean {
    for (const criterion of criteria) {
      const required = criterion.required || [];
      
      for (const req of required) {
        if (!evidence[req]) {
          return false; // Missing required evidence
        }
      }
    }
    
    return true;
  }

  /**
   * Register default workflow types
   */
  private registerDefaultWorkflows(): void {
    // Spider workflow (simple hub-spoke)
    this.registerWorkflow('spider-workflow', (config, context) => {
      const generic = this.createGenericWorkflow(config, context);
      
      return {
        ...generic,
        type: 'spider',
        
        // Spider-specific methods
        spiderCoordinate: () => {
          return {
            coordinated: true,
            style: 'hub-spoke',
            agents: config.phases.flatMap(p => p.participatingAgents)
          };
        },
        
        spiderDelegate: (task: any) => {
          return {
            delegated: true,
            taskType: task.type,
            target: 'appropriate-agent'
          };
        }
      };
    });

    // Hermes workflow (6-phase pipeline)
    this.registerWorkflow('hermes-workflow', (config, context) => {
      const generic = this.createGenericWorkflow(config, context);
      
      return {
        ...generic,
        type: 'hermes',
        
        // Hermes-specific methods
        hermesAnalyze: () => {
          return {
            analyzed: true,
            phase: 'analysis',
            depth: 'deep'
          };
        },
        
        hermesPlan: () => {
          return {
            planned: true,
            phase: 'planning',
            detail: 'comprehensive'
          };
        },
        
        hermesBuild: () => {
          return {
            building: true,
            phase: 'building',
            quality: 'high'
          };
        },
        
        hermesReview: () => {
          return {
            reviewing: true,
            phase: 'review',
            rigor: 'strict'
          };
        }
      };
    });

    // Shark workflow (triple-brain)
    this.registerWorkflow('shark-workflow', (config, context) => {
      const generic = this.createGenericWorkflow(config, context);
      
      return {
        ...generic,
        type: 'shark',
        
        // Shark-specific methods
        sharkHunt: () => {
          return {
            hunting: true,
            mode: 'aggressive',
            focus: 'target'
          };
        },
        
        sharkCoordinateBrains: () => {
          return {
            coordinated: true,
            brainCount: 3,
            hierarchy: 'triple'
          };
        },
        
        sharkExecute: () => {
          return {
            executing: true,
            speed: 'fast',
            precision: 'high'
          };
        }
      };
    });
  }

  /**
   * Get available workflow types
   */
  getAvailableWorkflowTypes(): string[] {
    return Array.from(this.workflowRegistry.keys());
  }
}

/**
 * Workflow constructor type
 */
type WorkflowConstructor = (config: WorkflowConfig, context: any) => any;

/**
 * Workflow instance interface
 */
export interface WorkflowInstance {
  id: string;
  config: WorkflowConfig;
  instance: any;
}