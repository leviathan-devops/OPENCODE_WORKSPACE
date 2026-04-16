/**
 * src/clusters/execution.ts
 * 
 * Execution cluster - handles implementation tasks.
 */

import type { ClusterDefinition } from '../coordination/types.js';

export const executionCluster: ClusterDefinition = {
  id: 'execution',
  name: 'Execution Cluster',
  description: 'Handles implementation tasks - coding, building, testing',
  agents: ['coder'],
};
