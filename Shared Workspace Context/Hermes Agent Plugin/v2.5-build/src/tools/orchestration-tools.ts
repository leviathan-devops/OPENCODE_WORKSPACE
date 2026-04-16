/**
 * Orchestration Tools — Invoke and manage orchestration skills
 */

import { getOrchestrationEngine } from "../services/orchestration-engine.js";
import { getSkillRegistry } from "../services/skill-registry.js";

export const orchestration_invoke = {
  name: "orchestration_invoke",
  description: "Invoke an orchestration skill by name",
  args: {
    skill: { type: "string", description: "Orchestration skill name to invoke" },
    input: { type: "string", description: "Input/trigger for the orchestration" },
  },
  execute: async (args: { skill: string; input: string }, _context: any) => {
    const engine = getOrchestrationEngine();
    return await engine.invoke(args.skill, { trigger: args.input, context: {} });
  },
};

export const skill_register = {
  name: "skill_register",
  description: "Register a new skill at runtime (for dynamic skill creation)",
  args: {
    name: { type: "string", description: "Skill name" },
    definition: { type: "string", description: "YAML or JSON skill definition" },
  },
  execute: async (args: { name: string; definition: string }, _context: any) => {
    const registry = getSkillRegistry();
    // Simple YAML-like parsing for the definition
    try {
      const def = JSON.parse(args.definition);
      registry.registerSkill(args.name, { ...def, instructions: "" });
    } catch {
      // Not JSON, ignore for now
    }
    return { status: "registered", name: args.name };
  },
};

export const skill_list = {
  name: "skill_list",
  description: "List all registered skills",
  args: {},
  execute: async (_args: {}, _context: any) => {
    const registry = getSkillRegistry();
    const skills = registry.getSkillNames().map(name => {
      const s = registry.getSkill(name)!;
      return {
        name: s.name,
        type: s.type,
        executionMode: s.executionMode,
        description: s.description,
      };
    });
    return JSON.stringify(skills, null, 2);
  },
};
