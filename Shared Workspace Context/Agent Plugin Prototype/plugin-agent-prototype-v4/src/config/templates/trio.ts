/**
 * Trio Architecture — Three Parallel Orchestrators
 *
 * 3 parallel orchestrators: Architect (planning) + Executor (execution) + Guardian (quality/knowledge).
 * 4 clusters: research-pool, execution-pool, qa-pool, knowledge-pool.
 * Shared-state sync model with guardian oversight.
 */

import type { ArchitectureConfig } from '../../factory/types.js';

export const trioConfig: ArchitectureConfig = {
  name: 'trio',
  version: '1.0.0',
  description: 'Trio parallel orchestrator: Architect (planning) + Executor (execution) + Guardian (quality/knowledge) — full parallel coordination',

  brain: {
    type: 'trio',
    name: 'trio-brain',
    syncMode: 'shared-state',
    orchestrators: {
      architect: 'architect',
      executor: 'executor',
      guardian: 'guardian',
    },
    workflows: {
      architect: {
        name: 'The Architect',
        description: 'Long-term planning, architecture, phase sequencing',
        owns: ['planning', 'phase-sequencing', 'architecture'],
        delegatesTo: ['research-pool'],
        readOnly: ['execution-state', 'quality-state'],
        gates: ['plan-gate'],
      },
      executor: {
        name: 'The Executor',
        description: 'Execution tracking, QA gate enforcement',
        owns: ['execution', 'qa-gates', 'completion'],
        delegatesTo: ['execution-pool', 'qa-pool'],
        readOnly: ['plan-state', 'quality-state'],
        gates: ['qa-gate', 'test-gate', 'review-gate'],
      },
      guardian: {
        name: 'The Guardian',
        description: 'Context, knowledge, quality oversight',
        owns: ['context', 'knowledge', 'quality'],
        delegatesTo: ['knowledge-pool'],
        readOnly: ['plan-state', 'execution-state'],
        gates: ['quality-gate', 'knowledge-gate'],
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
    {
      id: 'knowledge-pool',
      name: 'Knowledge Pool',
      description: 'Context management and documentation',
      agents: ['critic', 'docs'],
      intraClusterDelegation: true,
      interClusterDelegation: true,
      sharedContext: true,
    },
  ],

  agents: {
    architect: 'architect',
    executor: 'executor',
    guardian: {
      id: 'guardian',
      name: 'The Guardian',
      mode: 'critic',
      description: 'Quality and knowledge keeper — monitors system health, maintains context',
      capabilities: ['quality-monitoring', 'knowledge-management', 'context-preservation', 'standards-enforcement'],
      allowedTools: ['read', 'grep', 'knowledgeRecall', 'knowledge_query', 'gemma', 'complexity_hotspots', 'lint'],
      maxConcurrentTasks: 2,
      prompt: `You are the Guardian — the quality and knowledge keeper of this multi-agent system.

## Your Role
- Maintain context and knowledge base
- Enforce quality standards
- Monitor system health
- Delegate to knowledge-pool

## Parallel Execution Model
You work IN PARALLEL with both The Architect and The Executor. While they focus on
planning and execution respectively, you ensure QUALITY and KNOWLEDGE integrity.

## Your Focus
- "Is the work meeting quality standards?"
- "What context is missing?"
- "Are there knowledge gaps?"`,
    },
    coder: 'coder',
    reviewer: 'reviewer',
    'test-engineer': 'test-engineer',
    explorer: 'explorer',
    sme: 'sme',
    critic: 'critic',
    docs: 'docs',
  },

  delegation: {
    allowCrossCluster: true,
    requireGateApproval: true,
    maxHops: 2,
  },
};
