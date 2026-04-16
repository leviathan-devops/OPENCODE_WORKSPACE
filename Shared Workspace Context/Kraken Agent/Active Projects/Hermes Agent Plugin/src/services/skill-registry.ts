import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { generateId } from "../utils/id.js";

export type SkillType = "action" | "interactive" | "orchestration";
export type SkillExecutionMode = "thread" | "fork" | "teammate";

export interface OrchestrationStep {
  skill: string;
  mode: "thread" | "fork";
  inputTemplate: string;
  condition?: string;
  captureOutput: boolean;
  timeout?: number;
}

export interface SkillDefinition {
  name: string;
  type: SkillType;
  description: string;
  executionMode: SkillExecutionMode;
  triggerPatterns?: string[];
  chain?: OrchestrationStep[];
  episodeTimeout?: number;
  contextScope: "isolated" | "shared";
  outputTemplate?: string;
  instructions: string;
}

let skillRegistry: SkillRegistry | null = null;

export function getSkillRegistry(): SkillRegistry {
  if (!skillRegistry) {
    skillRegistry = new SkillRegistry();
  }
  return skillRegistry;
}

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();

  loadSkillsFromDirectory(dirPath: string): void {
    let files: string[];
    try {
      files = readdirSync(dirPath).filter((f) => f.endsWith(".md"));
    } catch {
      return;
    }

    for (const file of files) {
      try {
        const content = readFileSync(join(dirPath, file), "utf-8");
        const skill = this.parseSkillFile(content, file.replace(".md", ""));
        this.skills.set(skill.name, skill);
      } catch (e) {
        console.error(`Failed to load skill ${file}:`, e);
      }
    }
  }

  parseSkillFile(content: string, defaultName: string): SkillDefinition {
    const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

    if (!match) {
      return {
        name: defaultName,
        type: "action",
        description: "",
        executionMode: "thread",
        contextScope: "isolated",
        instructions: content.trim(),
      };
    }

    const frontmatterStr = match[1];
    const body = match[2].trim();

    const frontmatter = this.parseFrontmatter(frontmatterStr);

    return {
      name: frontmatter.name || defaultName,
      type: (frontmatter.type as SkillType) || "action",
      description: frontmatter.description || "",
      executionMode: (frontmatter.executionMode as SkillExecutionMode) || "thread",
      triggerPatterns: frontmatter.triggerPatterns || [],
      chain: frontmatter.chain || undefined,
      episodeTimeout: frontmatter.episodeTimeout
        ? Number(frontmatter.episodeTimeout)
        : undefined,
      contextScope:
        (frontmatter.contextScope as "isolated" | "shared") || "isolated",
      outputTemplate: frontmatter.outputTemplate,
      instructions: body,
    };
  }

  private parseFrontmatter(str: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const line of str.split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();

        if (value.startsWith("[") && value.endsWith("]")) {
          result[key] = value
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        } else if (value === "true") {
          result[key] = true;
        } else if (value === "false") {
          result[key] = false;
        } else if (!isNaN(Number(value)) && value !== "") {
          result[key] = Number(value);
        } else {
          result[key] = value;
        }
      }
    }

    return result;
  }

  getSkill(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }

  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  registerSkill(skill: SkillDefinition): void {
    this.skills.set(skill.name, skill);
  }

  getTriggeredSkills(message: string): SkillDefinition[] {
    const triggered: SkillDefinition[] = [];

    for (const skill of this.skills.values()) {
      if (skill.triggerPatterns?.length) {
        for (const pattern of skill.triggerPatterns) {
          try {
            const regex = new RegExp(pattern, "i");
            if (regex.test(message)) {
              triggered.push(skill);
              break;
            }
          } catch {
            if (message.toLowerCase().includes(pattern.toLowerCase())) {
              triggered.push(skill);
              break;
            }
          }
        }
      }
    }

    return triggered;
  }

  reset(): void {
    this.skills.clear();
  }
}

export function routeToExecutionMode(
  skill: SkillDefinition
): SkillExecutionMode {
  if (skill.executionMode) return skill.executionMode;

  switch (skill.type) {
    case "interactive":
      return "fork";
    case "orchestration":
      return "fork";
    default:
      return "thread";
  }
}
