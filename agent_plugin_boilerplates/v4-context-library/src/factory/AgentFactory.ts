/**
 * V4 Agent Factory
 * 
 * Creates agent instances from configuration.
 */

import type { AgentConfig } from '../types/architecture';

export class AgentFactory {
  private agentRegistry: Map<string, AgentConstructor> = new Map();
  
  constructor() {
    this.registerDefaultAgents();
  }

  /**
   * Register an agent constructor
   */
  registerAgent(type: string, constructor: AgentConstructor): void {
    this.agentRegistry.set(type, constructor);
  }

  /**
   * Create an agent instance from configuration
   */
  createAgent(config: AgentConfig, context: any = {}): AgentInstance {
    const constructor = this.agentRegistry.get(config.type);
    
    if (!constructor) {
      // Try to create a generic agent if type not found
      return this.createGenericAgent(config, context);
    }

    const instance = constructor(config, context);
    
    return {
      id: config.id,
      config,
      instance
    };
  }

  /**
   * Create a generic agent (fallback)
   */
  private createGenericAgent(config: AgentConfig, context: any): AgentInstance {
    const instance = {
      type: config.type,
      name: config.name,
      capabilities: config.capabilities,
      allowedTools: config.allowedTools,
      config: config.config,
      
      // Generic agent methods
      execute: (task: any) => {
        return {
          executed: true,
          taskId: task.id,
          result: `Generic agent ${config.name} executed task`,
          agentId: config.id
        };
      },
      
      getCapabilities: () => {
        return {
          capabilities: config.capabilities,
          tools: config.allowedTools
        };
      },
      
      canHandle: (taskType: string) => {
        return config.capabilities.some(cap => 
          cap.toLowerCase().includes(taskType.toLowerCase())
        );
      }
    };
    
    return {
      id: config.id,
      config,
      instance
    };
  }

  /**
   * Register default agent types
   */
  private registerDefaultAgents(): void {
    // Architect agent
    this.registerAgent('architect', (config, context) => {
      return {
        type: 'architect',
        name: config.name,
        capabilities: config.capabilities,
        allowedTools: config.allowedTools,
        config: config.config,
        
        // Architect methods
        designSystem: (requirements: any) => {
          return {
            design: {},
            architecture: {},
            components: []
          };
        },
        
        createBlueprint: (system: any) => {
          return {
            blueprint: {},
            specifications: []
          };
        },
        
        reviewArchitecture: (architecture: any) => {
          return {
            reviewed: true,
            issues: [],
            recommendations: []
          };
        }
      };
    });

    // Coder agent
    this.registerAgent('coder', (config, context) => {
      return {
        type: 'coder',
        name: config.name,
        capabilities: config.capabilities,
        allowedTools: config.allowedTools,
        config: config.config,
        
        // Coder methods
        writeCode: (spec: any) => {
          return {
            code: '// Implementation',
            files: [],
            tests: []
          };
        },
        
        refactor: (code: any) => {
          return {
            refactored: true,
            improvements: [],
            metrics: {}
          };
        },
        
        debug: (issue: any) => {
          return {
            debugged: true,
            fix: {},
            rootCause: 'Unknown'
          };
        }
      };
    });

    // Reviewer agent
    this.registerAgent('reviewer', (config, context) => {
      return {
        type: 'reviewer',
        name: config.name,
        capabilities: config.capabilities,
        allowedTools: config.allowedTools,
        config: config.config,
        
        // Reviewer methods
        reviewCode: (code: any) => {
          return {
            reviewed: true,
            issues: [],
            score: 0.95,
            feedback: 'Good code'
          };
        },
        
        checkStandards: (code: any) => {
          return {
            compliant: true,
            violations: [],
            score: 1.0
          };
        },
        
        provideFeedback: (work: any) => {
          return {
            feedback: 'Good work',
            actionable: true,
            priority: 'medium'
          };
        }
      };
    });

    // Test Engineer agent
    this.registerAgent('test-engineer', (config, context) => {
      return {
        type: 'test-engineer',
        name: config.name,
        capabilities: config.capabilities,
        allowedTools: config.allowedTools,
        config: config.config,
        
        // Test engineer methods
        writeTests: (code: any) => {
          return {
            tests: [],
            coverage: 0.85,
            scenarios: []
          };
        },
        
        runTests: (tests: any[]) => {
          return {
            run: true,
            passed: tests.length,
            failed: 0,
            coverage: 0.9
          };
        },
        
        analyzeCoverage: (code: any, tests: any[]) => {
          return {
            coverage: 0.88,
            gaps: [],
            recommendations: []
          };
        }
      };
    });

    // SME (Subject Matter Expert) agent
    this.registerAgent('sme', (config, context) => {
      return {
        type: 'sme',
        name: config.name,
        capabilities: config.capabilities,
        allowedTools: config.allowedTools,
        config: config.config,
        
        // SME methods
        provideExpertise: (topic: string) => {
          return {
            expertise: [],
            recommendations: [],
            resources: []
          };
        },
        
        answerQuestion: (question: string) => {
          return {
            answer: 'Expert answer',
            confidence: 0.9,
            sources: []
          };
        },
        
        validateApproach: (approach: any) => {
          return {
            valid: true,
            feedback: 'Valid approach',
            alternatives: []
          };
        }
      };
    });

    // Explorer agent
    this.registerAgent('explorer', (config, context) => {
      return {
        type: 'explorer',
        name: config.name,
        capabilities: config.capabilities,
        allowedTools: config.allowedTools,
        config: config.config,
        
        // Explorer methods
        exploreCodebase: (path: string) => {
          return {
            explored: true,
            structure: {},
            findings: []
          };
        },
        
        discoverPatterns: (code: any) => {
          return {
            patterns: [],
            insights: [],
            recommendations: []
          };
        },
        
        mapDependencies: (system: any) => {
          return {
            dependencies: {},
            relationships: [],
            complexity: 'medium'
          };
        }
      };
    });

    // Critic agent
    this.registerAgent('critic', (config, context) => {
      return {
        type: 'critic',
        name: config.name,
        capabilities: config.capabilities,
        allowedTools: config.allowedTools,
        config: config.config,
        
        // Critic methods
        critiqueWork: (work: any) => {
          return {
            critique: 'Constructive criticism',
            strengths: [],
            weaknesses: [],
            recommendations: []
          };
        },
        
        identifyRisks: (plan: any) => {
          return {
            risks: [],
            severity: 'medium',
            mitigation: []
          };
        },
        
        evaluateFeasibility: (proposal: any) => {
          return {
            feasible: true,
            challenges: [],
            requirements: []
          };
        }
      };
    });
  }

  /**
   * Get available agent types
   */
  getAvailableAgentTypes(): string[] {
    return Array.from(this.agentRegistry.keys());
  }

  /**
   * Load prompt template from file or inline content
   */
  async loadPromptTemplate(template: string | { content: string; variables?: string[] }): Promise<string> {
    if (typeof template === 'string') {
      // Check if it's a file path
      if (template.endsWith('.md') || template.endsWith('.txt')) {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        try {
          const content = await fs.readFile(template, 'utf-8');
          return content;
        } catch (error) {
          // If file doesn't exist, treat as inline template
          return template;
        }
      } else {
        // Treat as inline template
        return template;
      }
    } else {
      // Inline template object
      return template.content;
    }
  }
}

/**
 * Agent constructor type
 */
type AgentConstructor = (config: AgentConfig, context: any) => any;

/**
 * Agent instance interface
 */
export interface AgentInstance {
  id: string;
  config: AgentConfig;
  instance: any;
}