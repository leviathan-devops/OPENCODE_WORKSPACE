/**
 * Spider Architecture — Single Brain (Hub-and-Spoke)
 *
 * 1 orchestrator (architect), 3 clusters, 6 agents.
 * Sequential phase execution with central coordination.
 */

import type { ArchitectureConfig } from '../../factory/types.js';

export const spiderConfig: ArchitectureConfig = {
  name: 'spider',
  version: '1.0.0',
  description: 'Single-brain hub-and-spoke (Spider model) — sequential phase execution with central coordination',

  brain: {
    type: 'single',
    name: 'spider-brain',
    orchestrator: 'architect',
  },

  clusters: [
    {
      id: 'execution',
      name: 'Execution',
      description: 'Code implementation agents',
      agents: ['coder'],
      intraClusterDelegation: false,
      interClusterDelegation: false,
      sharedContext: true,
    },
    {
      id: 'qa',
      name: 'QA',
      description: 'Quality assurance agents',
      agents: ['reviewer', 'test-engineer'],
      intraClusterDelegation: false,
      interClusterDelegation: true,
      sharedContext: true,
    },
    {
      id: 'research',
      name: 'Research',
      description: 'Research and analysis agents',
      agents: ['explorer', 'sme'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
      sharedContext: true,
    },
  ],

  agents: {
    architect: 'architect',
    coder: 'coder',
    reviewer: 'reviewer',
    'test-engineer': 'test-engineer',
    explorer: 'explorer',
    sme: 'sme',
  },

  delegation: {
    allowCrossCluster: true,
    requireGateApproval: true,
    maxHops: 3,
  },
};
