/**
 * V4 Agent Factory
 *
 * Creates agents from scratch, templates, or overrides.
 * Key rule: extend() UNIONS tools, never replaces them.
 */

import type {
  AgentDefinition,
  AgentTemplate,
  AgentOverride,
  ValidationResult,
} from './types.js';

export class AgentFactory {
  private templates: Map<string, AgentTemplate> = new Map();

  // ── Template Management ──────────────────────────────────

  registerTemplate(template: AgentTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): AgentTemplate | undefined {
    return this.templates.get(id);
  }

  listTemplates(): AgentTemplate[] {
    return Array.from(this.templates.values());
  }

  // ── Agent Creation ───────────────────────────────────────

  createAgent(id: string, config: Partial<AgentDefinition>): AgentDefinition {
    if (!id || typeof id !== 'string') {
      throw new Error('AgentFactory.createAgent: id is required and must be a string');
    }

    return {
      id,
      name: config.name ?? id,
      mode: config.mode ?? 'generic',
      description: config.description ?? '',
      cluster: config.cluster,
      capabilities: config.capabilities ?? [],
      allowedTools: config.allowedTools ?? [],
      maxConcurrentTasks: config.maxConcurrentTasks ?? 1,
      prompt: config.prompt,
      model: config.model,
      temperature: config.temperature,
      brain: config.brain,
    };
  }

  createFromTemplate(
    templateId: string,
    agentId: string,
    overrides?: AgentOverride,
  ): AgentDefinition {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(
        `AgentFactory.createFromTemplate: template "${templateId}" not found. Available: ${Array.from(this.templates.keys()).join(', ')}`,
      );
    }

    const agent = this.createAgent(agentId, {
      name: template.id,
      mode: templateId,
      description: template.description,
      capabilities: [...template.capabilities],
      allowedTools: [...template.tools],
      prompt: template.prompt,
      model: template.defaultModel,
      temperature: template.defaultTemperature,
      maxConcurrentTasks: 1,
    });

    if (overrides) {
      return this.extend(agent, overrides);
    }

    return agent;
  }

  /**
   * Merge overrides into an existing agent.
   * CRITICAL: tools are UNIONED, not replaced.
   */
  extend(agent: AgentDefinition, overrides: AgentOverride): AgentDefinition {
    const extended: AgentDefinition = {
      ...agent,
    };

    if (overrides.prompt !== undefined) extended.prompt = overrides.prompt;
    if (overrides.model !== undefined) extended.model = overrides.model;
    if (overrides.temperature !== undefined) extended.temperature = overrides.temperature;
    if (overrides.maxConcurrentTasks !== undefined)
      extended.maxConcurrentTasks = overrides.maxConcurrentTasks;

    // Tools are UNIONED, not replaced
    if (overrides.tools !== undefined) {
      const existingSet = new Set(agent.allowedTools);
      for (const tool of overrides.tools) {
        existingSet.add(tool);
      }
      extended.allowedTools = Array.from(existingSet);
    }

    return extended;
  }

  /**
   * Process architecture agents config, resolving template references.
   * String values are treated as template IDs.
   */
  createAgents(
    agents: Record<string, AgentDefinition | string>,
    templates?: Map<string, AgentTemplate>,
  ): Map<string, AgentDefinition> {
    const result = new Map<string, AgentDefinition>();
    const templateMap = templates ?? this.templates;

    for (const [id, value] of Object.entries(agents)) {
      if (typeof value === 'string') {
        // String = template reference
        const template = templateMap.get(value);
        if (!template) {
          throw new Error(
            `AgentFactory.createAgents: template "${value}" referenced by agent "${id}" not found`,
          );
        }
        result.set(id, this.createFromTemplate(value, id));
      } else {
        // Already an AgentDefinition
        result.set(id, value);
      }
    }

    return result;
  }

  validate(agent: AgentDefinition): ValidationResult {
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

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
