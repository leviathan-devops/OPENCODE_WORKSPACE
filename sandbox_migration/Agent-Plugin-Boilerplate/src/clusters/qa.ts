/**
 * src/clusters/qa.ts
 * 
 * QA cluster - handles quality assurance tasks.
 */

import type { ClusterDefinition } from '../coordination/types.js';

export const qaCluster: ClusterDefinition = {
  id: 'qa',
  name: 'QA Cluster',
  description: 'Handles quality assurance - reviews, tests, security',
  agents: ['reviewer', 'test-engineer'],
};
