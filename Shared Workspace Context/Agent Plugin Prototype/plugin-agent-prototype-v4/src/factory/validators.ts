/**
 * V4 Composable Validators
 *
 * Individual validators that can be composed into a pipeline.
 * Each validator returns { valid, errors[], warnings[] }.
 */

import type {
  Validator,
  ValidationResult,
  ArchitectureConfig,
  AgentDefinition,
  ClusterConfig,
  BrainConfig,
} from './types.js';

// ── Architecture Validators ────────────────────────────────

export const validateRequiredFields: Validator<ArchitectureConfig> = (config) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.name) errors.push('Architecture must have a name');
  if (!config.version) errors.push('Architecture must have a version');
  if (!config.brain) errors.push('Architecture must have a brain config');
  if (!config.clusters || config.clusters.length === 0)
    errors.push('Architecture must have at least one cluster');
  if (!config.agents || Object.keys(config.agents).length === 0)
    errors.push('Architecture must have at least one agent');

  if (!config.description)
    warnings.push('Architecture has no description');

  return { valid: errors.length === 0, errors, warnings };
};

export const validateBrainReferences: Validator<ArchitectureConfig> = (config) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const agentIds = Object.keys(config.agents);

  if (config.brain.type === 'single') {
    const orchestrator = (config.brain as any).orchestrator;
    if (orchestrator && !agentIds.includes(orchestrator)) {
      errors.push(`Brain references orchestrator "${orchestrator}" which is not defined in agents`);
    }
  } else if (config.brain.type === 'dual' || config.brain.type === 'trio') {
    const orchestrators = (config.brain as any).orchestrators || {};
    for (const [brainId, agentId] of Object.entries(orchestrators)) {
      if (!agentIds.includes(agentId as string)) {
        errors.push(`Brain "${brainId}" references agent "${agentId}" which is not defined`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const validateAgentReferences: Validator<ArchitectureConfig> = (config) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that all agent references in clusters exist
  for (const cluster of config.clusters) {
    for (const agentId of cluster.agents) {
      if (!(agentId in config.agents)) {
        errors.push(
          `Cluster "${cluster.id}" references agent "${agentId}" which is not defined`,
        );
      }
    }
    if (cluster.subOrchestrator && !(cluster.subOrchestrator in config.agents)) {
      errors.push(
        `Cluster "${cluster.id}" references subOrchestrator "${cluster.subOrchestrator}" which is not defined`,
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const validateClusterIntegrity: Validator<ArchitectureConfig> = (config) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const clusterIds = new Set(config.clusters.map((c) => c.id));

  for (const cluster of config.clusters) {
    if (!cluster.id) errors.push('Cluster must have an id');
    if (!cluster.name) errors.push('Cluster must have a name');
    if (cluster.agents.length === 0)
      warnings.push(`Cluster "${cluster.id}" has no agents`);

    if (cluster.parentCluster && !clusterIds.has(cluster.parentCluster)) {
      errors.push(
        `Cluster "${cluster.id}" references parent "${cluster.parentCluster}" which does not exist`,
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const validateToolPermissions: Validator<ArchitectureConfig> = (config) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [agentId, agentDef] of Object.entries(config.agents)) {
    if (typeof agentDef === 'object' && 'allowedTools' in agentDef) {
      const agent = agentDef as AgentDefinition;
      if (agent.allowedTools.length === 0) {
        warnings.push(`Agent "${agentId}" has no allowed tools`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const validateStateOwnership: Validator<ArchitectureConfig> = (config) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // For dual/trio brains, verify that workflow ownership is consistent
  if (config.brain.type === 'dual' || config.brain.type === 'trio') {
    const workflows = (config.brain as any).workflows || {};
    for (const [orchId, workflow] of Object.entries(workflows)) {
      const wf = workflow as { owns?: string[]; readOnly?: string[] };
      if (wf.owns && wf.readOnly) {
        const overlap = wf.owns.filter((o) => wf.readOnly!.includes(o));
        if (overlap.length > 0) {
          warnings.push(
            `Orchestrator "${orchId}" both owns and has read-only access to: ${overlap.join(', ')}`,
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const validateWorkflowGates: Validator<ArchitectureConfig> = (config) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (config.brain.type === 'dual' || config.brain.type === 'trio') {
    const workflows = (config.brain as any).workflows || {};
    for (const [orchId, workflow] of Object.entries(workflows)) {
      const wf = workflow as { gates?: string[]; delegatesTo?: string[] };
      if (wf.gates && wf.gates.length > 0) {
        // Gates should reference valid clusters
        for (const gate of wf.gates) {
          if (!gate || typeof gate !== 'string') {
            errors.push(`Orchestrator "${orchId}" has an invalid gate reference`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

// ── Agent Validators ───────────────────────────────────────

export const validateAgent: Validator<AgentDefinition> = (agent) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!agent.id) errors.push('Agent must have an id');
  if (!agent.name) errors.push('Agent must have a name');
  if (!agent.mode) errors.push('Agent must have a mode');
  if (!agent.description) warnings.push(`Agent "${agent.id}" has no description`);
  if (agent.allowedTools.length === 0)
    warnings.push(`Agent "${agent.id}" has no allowed tools`);
  if (agent.maxConcurrentTasks < 1)
    errors.push('Agent maxConcurrentTasks must be >= 1');

  return { valid: errors.length === 0, errors, warnings };
};

// ── Cluster Validators ─────────────────────────────────────

export const validateCluster: Validator<ClusterConfig> = (cluster) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!cluster.id) errors.push('Cluster must have an id');
  if (!cluster.name) errors.push('Cluster must have a name');
  if (cluster.agents.length === 0)
    warnings.push(`Cluster "${cluster.id}" has no agents`);

  return { valid: errors.length === 0, errors, warnings };
};

// ── Brain Validators ───────────────────────────────────────

export const validateBrain: Validator<BrainConfig> = (brain) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!brain.type) errors.push('Brain must have a type');
  if (!brain.name) errors.push('Brain must have a name');

  if (brain.type === 'single') {
    const single = brain as any;
    if (!single.orchestrator) errors.push('Single brain must have an orchestrator');
  }

  if (brain.type === 'dual') {
    const dual = brain as any;
    const count = dual.orchestrators ? Object.keys(dual.orchestrators).length : 0;
    if (count !== 2) errors.push(`Dual brain must have exactly 2 orchestrators, got ${count}`);
  }

  if (brain.type === 'trio') {
    const trio = brain as any;
    const count = trio.orchestrators ? Object.keys(trio.orchestrators).length : 0;
    if (count !== 3) errors.push(`Trio brain must have exactly 3 orchestrators, got ${count}`);
  }

  return { valid: errors.length === 0, errors, warnings };
};

// ── Validator Runner ───────────────────────────────────────

export function runValidators<T>(
  validators: Validator<T>[],
  config: T,
): ValidationResult {
  const results = validators.map((v) => v(config));
  return {
    valid: results.every((r) => r.valid),
    errors: results.flatMap((r) => r.errors),
    warnings: results.flatMap((r) => r.warnings),
  };
}

// ── Default Architecture Validator Pipeline ────────────────

export const architectureValidators: Validator<ArchitectureConfig>[] = [
  validateRequiredFields,
  validateBrainReferences,
  validateAgentReferences,
  validateClusterIntegrity,
  validateToolPermissions,
  validateStateOwnership,
  validateWorkflowGates,
];
