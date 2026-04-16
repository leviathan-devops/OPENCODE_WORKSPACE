/**
 * src/clusters/index.ts
 * 
 * Cluster definitions - execution, qa, research clusters.
 */

import type { ClusterDefinition } from '../coordination/types.js';

export function createClusters(): Record<string, ClusterDefinition> {
  return {
    execution: {
      id: 'execution',
      name: 'Execution Cluster',
      description: 'Handles implementation tasks - coding, building, testing',
      agents: ['coder'],
    },
    qa: {
      id: 'qa',
      name: 'QA Cluster',
      description: 'Handles quality assurance - reviews, tests, security',
      agents: ['reviewer', 'test-engineer'],
    },
    research: {
      id: 'research',
      name: 'Research Cluster',
      description: 'Handles research and consulting - SME, explorer',
      agents: ['sme', 'explorer'],
    },
  };
}

export function getClusterAgents(clusterId: string): string[] {
  const clusters = createClusters();
  return clusters[clusterId]?.agents || [];
}

export const getClusters = createClusters;
