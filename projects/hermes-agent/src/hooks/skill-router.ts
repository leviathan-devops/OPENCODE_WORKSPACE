import { getSkillRegistry, routeToExecutionMode } from "../services/skill-registry.js";
import type { SkillExecutionMode } from "../services/skill-registry.js";
import { isHermesAgent } from "../config/agent-identity.js";
import { existsSync } from "fs";
import { join } from "path";

export function createSkillRouterHook() {
  return async (
    input: { skillName: string; userMessage: string; agent?: string; directory?: string },
    output: { mode: SkillExecutionMode; reason: string }
  ) => {
    if (!isHermesAgent(input.agent ?? "")) {
      return;
    }

    const baseDir = input.directory ?? process.cwd();
    if (!existsSync(join(baseDir, ".hermes"))) {
      return;
    }

    const registry = getSkillRegistry();
    const skill = registry.getSkill(input.skillName);

    if (!skill) {
      output.mode = "thread";
      output.reason = "unknown skill, default to thread";
      return;
    }

    const triggered = registry.getTriggeredSkills(input.userMessage);
    if (triggered.length > 0) {
      output.mode = triggered[0].executionMode;
      output.reason = `triggered by pattern: ${triggered[0].name}`;
      return;
    }

    output.mode = routeToExecutionMode(skill);
    output.reason = `default for ${skill.type}`;
  };
}
