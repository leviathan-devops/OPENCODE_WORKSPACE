/**
 * src/coordination/registry.ts
 * 
 * Agent Registry - manages agent definitions and queries.
 */

import type {
  AgentDefinition,
  AgentMode,
  AgentRegistry,
  ClusterDefinition,
} from './types.js';

export type { AgentRegistry } from './types.js';

export function createAgentRegistry(
  agents: Record<string, AgentDefinition>,
  _clusters?: Record<string, ClusterDefinition>
): AgentRegistry {
  const agentMap = new Map<string, AgentDefinition>();
  const agentsByMode = new Map<AgentMode, AgentDefinition[]>();
  const agentsByCluster = new Map<string, AgentDefinition[]>();
  
  // Initialize registry
  for (const agent of Object.values(agents)) {
    agentMap.set(agent.id, agent);
    
    // Index by mode
    const modeAgents = agentsByMode.get(agent.mode) || [];
    modeAgents.push(agent);
    agentsByMode.set(agent.mode, modeAgents);
    
    // Index by cluster
    if (agent.cluster) {
      const clusterAgents = agentsByCluster.get(agent.cluster) || [];
      clusterAgents.push(agent);
      agentsByCluster.set(agent.cluster, clusterAgents);
    }
  }
  
  return {
    getAgent(agentId: string): AgentDefinition | null {
      return agentMap.get(agentId) || null;
    },
    
    getAgentsByMode(mode: AgentMode): AgentDefinition[] {
      return agentsByMode.get(mode) || [];
    },
    
    getAgentsByCluster(clusterId: string): AgentDefinition[] {
      return agentsByCluster.get(clusterId) || [];
    },
    
    isAgentAllowedTool(agentId: string, toolName: string): boolean {
      const agent = agentMap.get(agentId);
      if (!agent) return false;
      
      // Empty array means no tools allowed
      if (agent.allowedTools.length === 0) return false;
      
      // "*" means all tools allowed
      if (agent.allowedTools.includes('*')) return true;
      
      return agent.allowedTools.includes(toolName);
    },
    
    listAgents(): AgentDefinition[] {
      return Array.from(agentMap.values());
    },
  };
}

export function getDefaultAgents(): Record<string, AgentDefinition> {
  return {
    architect: {
      id: 'architect',
      name: 'Architect',
      mode: 'architect',
      description: 'Orchestrator of the multi-agent system',
      capabilities: ['planning', 'coordination', 'delegation', 'review'],
      allowedTools: ['*'],
      maxConcurrentTasks: 1,
    },
    coder: {
      id: 'coder',
      name: 'Coder',
      mode: 'coder',
      description: 'Implementation specialist',
      cluster: 'execution',
      capabilities: ['coding', 'refactoring', 'debugging'],
      allowedTools: ['*'],
      maxConcurrentTasks: 3,
    },
    reviewer: {
      id: 'reviewer',
      name: 'Reviewer',
      mode: 'reviewer',
      description: 'Code review specialist',
      cluster: 'qa',
      capabilities: ['review', 'security', 'quality'],
      allowedTools: ['*'],
      maxConcurrentTasks: 2,
    },
    'test-engineer': {
      id: 'test-engineer',
      name: 'Test Engineer',
      mode: 'test-engineer',
      description: 'Testing and validation specialist',
      cluster: 'qa',
      capabilities: ['testing', 'verification', 'coverage'],
      allowedTools: ['*'],
      maxConcurrentTasks: 2,
    },
    sme: {
      id: 'sme',
      name: 'Subject Matter Expert',
      mode: 'sme',
      description: 'Domain expertise provider',
      cluster: 'research',
      capabilities: ['consulting', 'research', 'analysis'],
      allowedTools: ['*'],
      maxConcurrentTasks: 5,
    },
  };
}

export function getDefaultClusters(): Record<string, ClusterDefinition> {
  return {
    execution: {
      id: 'execution',
      name: 'Execution Cluster',
      description: 'Handles implementation tasks',
      agents: ['coder'],
    },
    qa: {
      id: 'qa',
      name: 'QA Cluster',
      description: 'Handles quality assurance tasks',
      agents: ['reviewer', 'test-engineer'],
    },
    research: {
      id: 'research',
      name: 'Research Cluster',
      description: 'Handles research and consulting',
      agents: ['sme', 'explorer'],
    },
  };
}
