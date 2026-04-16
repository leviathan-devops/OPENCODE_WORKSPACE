/**
 * Skill Router Hook — Determine execution mode for a skill
 */

import { getSkillRegistry } from "../services/skill-registry.js";
import type { SkillExecutionMode } from "../services/skill-registry.js";

export function createSkillRouterHook() {
  return async (
    input: { skillName: string; userMessage: string },
    output: { mode: SkillExecutionMode; reason: string }
  ) => {
    const registry = getSkillRegistry();
    const skill = registry.getSkill(input.skillName);
    
    if (!skill) {
      output.mode = "thread";
      output.reason = "unknown skill, default to thread";
      return;
    }
    
    // Check trigger patterns first
    const triggered = registry.getTriggeredSkills(input.userMessage);
    if (triggered.length > 0) {
      output.mode = triggered[0].executionMode;
      output.reason = `triggered by pattern: ${triggered[0].name}`;
      return;
    }
    
    // Default routing based on skill type
    output.mode = skill.executionMode;
    output.reason = `default for ${skill.type}`;
  };
}

export function routeToExecutionMode(skill: { type?: string; executionMode?: SkillExecutionMode }): SkillExecutionMode {
  if (skill.executionMode) return skill.executionMode;
  
  switch (skill.type) {
    case "interactive": return "fork";
    case "orchestration": return "fork";
    default: return "thread";
  }
}
