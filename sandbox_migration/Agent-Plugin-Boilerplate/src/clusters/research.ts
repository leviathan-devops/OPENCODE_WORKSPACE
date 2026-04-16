/**
 * src/clusters/research.ts
 * 
 * Research cluster - handles research and consulting tasks.
 */

import type { ClusterDefinition } from '../coordination/types.js';

export const researchCluster: ClusterDefinition = {
  id: 'research',
  name: 'Research Cluster',
  description: 'Handles research and consulting - SME, explorer',
  agents: ['sme', 'explorer'],
};
