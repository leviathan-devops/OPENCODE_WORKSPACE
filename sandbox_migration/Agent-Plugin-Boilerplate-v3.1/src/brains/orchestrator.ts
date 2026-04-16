/**
 * src/brains/orchestrator.ts
 * 
 * Default orchestrator brain - coordinates all agents.
 */

export interface OrchestratorBrain {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
}

export const orchestratorBrain: OrchestratorBrain = {
  id: 'orchestrator',
  name: 'Orchestrator Brain',
  description: 'Default orchestrator - coordinates all agents in the plugin',
  capabilities: [
    'planning',
    'delegation',
    'coordination',
    'state-management',
    'evidence-collection',
  ],
};
