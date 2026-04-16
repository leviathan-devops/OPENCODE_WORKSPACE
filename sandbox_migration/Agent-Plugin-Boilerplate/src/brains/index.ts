/**
 * src/brains/index.ts
 * 
 * Brain registry - orchestrator brain for coordination.
 */

export function createBrains() {
  return {
    orchestrator: {
      id: 'orchestrator',
      name: 'Orchestrator Brain',
      description: 'Default orchestrator - coordinates all agents',
      capabilities: ['planning', 'delegation', 'coordination'],
    },
  };
}
