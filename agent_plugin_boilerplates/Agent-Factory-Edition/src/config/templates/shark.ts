/**
 * Shark Architecture — Dual Parallel Orchestrators
 *
 * 2 parallel orchestrators: Architect (planning) + Executor (execution).
 * 3 clusters: research-pool, execution-pool, qa-pool.
 * Shared-state sync model for cross-brain coordination.
 */

import type { ArchitectureConfig } from '../../factory/types.js';

export const sharkConfig: ArchitectureConfig = {
  name: 'shark',
  version: '1.0.0',
  description: 'Dual parallel orchestrator: Architect (planning) + Executor (execution) — concurrent workflow execution',

  brain: {
    type: 'dual',
    name: 'shark-brain',
    syncMode: 'shared-state',
    orchestrators: {
      architect: 'architect',
      executor: 'executor',
    },
    workflows: {
      architect: {
        name: 'The Architect',
        description: 'Long-term planning, architecture, phase sequencing',
        owns: ['planning', 'phase-sequencing', 'architecture'],
        delegatesTo: ['research-pool'],
        readOnly: ['execution-state'],
        gates: ['plan-gate'],
      },
      executor: {
        name: 'The Executor',
        description: 'Execution tracking, QA gate enforcement',
        owns: ['execution', 'qa-gates', 'completion'],
        delegatesTo: ['execution-pool', 'qa-pool'],
        readOnly: ['plan-state'],
        gates: ['qa-gate', 'test-gate', 'review-gate'],
      },
    },
  },

  clusters: [
    {
      id: 'research-pool',
      name: 'Research Pool',
      description: 'Research and analysis for planning',
      agents: ['explorer', 'sme'],
      intraClusterDelegation: true,
      interClusterDelegation: false,
      sharedContext: true,
    },
    {
      id: 'execution-pool',
      name: 'Execution Pool',
      description: 'Code implementation',
      agents: ['coder'],
      intraClusterDelegation: true,
      interClusterDelegation: false,
      sharedContext: true,
    },
    {
      id: 'qa-pool',
      name: 'QA Pool',
      description: 'Quality assurance and testing',
      agents: ['reviewer', 'test-engineer'],
      intraClusterDelegation: false,
      interClusterDelegation: true,
      sharedContext: true,
    },
  ],

  agents: {
    architect: 'architect',
    executor: 'executor',
    coder: 'coder',
    reviewer: 'reviewer',
    'test-engineer': 'test-engineer',
    explorer: 'explorer',
    sme: 'sme',
  },

  delegation: {
    allowCrossCluster: true,
    requireGateApproval: true,
    maxHops: 2,
  },
};
