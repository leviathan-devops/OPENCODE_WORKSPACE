/**
 * SkillRegistry — Loads and manages skill definitions
 */

import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { EpisodeInput, EpisodeOutput } from "./episode-store.js";

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

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();
  
  /**
   * Load all skills from a directory (parses YAML frontmatter)
   */
  loadSkillsFromDirectory(dirPath: string): void {
    let files: string[];
    try {
      files = readdirSync(dirPath).filter(f => f.endsWith(".md"));
    } catch {
      return; // Directory doesn't exist yet
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
  
  /**
   * Parse a skill file with YAML frontmatter
   */
  parseSkillFile(content: string, defaultName: string): SkillDefinition {
    const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    
    if (!match) {
      // No frontmatter — treat entire file as instructions
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
    
    let frontmatter: Record<string, any> = {};
    try {
      // Simple YAML parser for basic key-value pairs
      for (const line of frontmatterStr.split("\n")) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim();
          if (value.startsWith("[") && value.endsWith("]")) {
            // Array
            frontmatter[key] = value
              .slice(1, -1)
              .split(",")
              .map(s => s.trim())
              .filter(Boolean);
          } else {
            frontmatter[key] = value;
          }
        }
      }
    } catch {
      // Fallback to no frontmatter parsing
    }
    
    return {
      name: frontmatter.name ?? defaultName,
      type: frontmatter.type ?? "action",
      description: frontmatter.description ?? "",
      executionMode: frontmatter.executionMode ?? this.defaultMode(frontmatter.type),
      triggerPatterns: frontmatter.triggerPatterns,
      chain: frontmatter.chain,
      episodeTimeout: frontmatter.episodeTimeout ? Number(frontmatter.episodeTimeout) : undefined,
      contextScope: frontmatter.contextScope ?? "isolated",
      outputTemplate: frontmatter.outputTemplate,
      instructions: body,
    };
  }
  
  private defaultMode(type?: string): SkillExecutionMode {
    switch (type) {
      case "interactive": return "fork";
      case "orchestration": return "fork";
      default: return "thread";
    }
  }
  
  /**
   * Get a skill by name
   */
  getSkill(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }
  
  /**
   * Get all skills of a specific type
   */
  getSkillsByType(type: SkillType): SkillDefinition[] {
    return Array.from(this.skills.values()).filter(s => s.type === type);
  }
  
  /**
   * Find skills triggered by a user message pattern
   */
  getTriggeredSkills(message: string): SkillDefinition[] {
    return Array.from(this.skills.values()).filter(skill => {
      if (!skill.triggerPatterns?.length) return false;
      return skill.triggerPatterns.some(pattern => {
        try {
          return new RegExp(pattern).test(message);
        } catch {
          return message.includes(pattern);
        }
      });
    });
  }
  
  /**
   * Register a skill at runtime
   */
  registerSkill(name: string, definition: SkillDefinition): void {
    this.skills.set(name, definition);
  }
  
  /**
   * Get all registered skill names
   */
  getSkillNames(): string[] {
    return Array.from(this.skills.keys());
  }
}

// Singleton instance
let registryInstance: SkillRegistry | null = null;

export function getSkillRegistry(): SkillRegistry {
  if (!registryInstance) {
    registryInstance = new SkillRegistry();
  }
  return registryInstance;
}


