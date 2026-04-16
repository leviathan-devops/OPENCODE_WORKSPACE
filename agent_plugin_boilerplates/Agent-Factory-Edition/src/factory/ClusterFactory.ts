/**
 * V4 Cluster Factory
 *
 * Creates cluster instances from configuration with agent resolution.
 */

import type {
  ClusterConfig,
  ClusterInstance,
  AgentDefinition,
  ValidationResult,
} from './types.js';

export class ClusterFactory {
  create(
    config: ClusterConfig,
    agents: Map<string, AgentDefinition>,
  ): ClusterInstance {
    const agentIds = Array.from(agents.keys());
    const validation = this.validate(config, agentIds);
    if (!validation.valid) {
      throw new Error(
        `ClusterFactory.create: validation failed for "${config.id}" — ${validation.errors.join(', ')}`,
      );
    }

    const clusterAgents: AgentDefinition[] = [];
    for (const agentId of config.agents) {
      const agent = agents.get(agentId);
      if (agent) {
        clusterAgents.push(agent);
      }
    }

    const subOrchestrator = config.subOrchestrator
      ? agents.get(config.subOrchestrator)
      : undefined;

    return {
      config,
      agents: clusterAgents,
      subOrchestrator,
    };
  }

  createHierarchy(
    configs: ClusterConfig[],
    agents: Map<string, AgentDefinition>,
  ): ClusterInstance[] {
    return configs.map((config) => this.create(config, agents));
  }

  validate(config: ClusterConfig, agentIds: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.id) errors.push('Cluster must have an id');
    if (!config.name) errors.push('Cluster must have a name');

    if (config.agents.length === 0) {
      warnings.push(`Cluster "${config.id}" has no agents`);
    }

    for (const agentId of config.agents) {
      if (!agentIds.includes(agentId)) {
        errors.push(
          `Cluster "${config.id}" references agent "${agentId}" which does not exist`,
        );
      }
    }

    if (config.subOrchestrator && !agentIds.includes(config.subOrchestrator)) {
      errors.push(
        `Cluster "${config.id}" references subOrchestrator "${config.subOrchestrator}" which does not exist`,
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
