/**
 * Skills index — exports skill definitions
 * 
 * In production, skills are loaded from the bundled skills directory.
 * This file serves as a reference for available skills.
 */

export const SKILL_NAMES = [
  "autopilot",
  "brainstorm", 
  "debug",
  "grill",
  "health",
  "plan",
  "recall",
  "remember",
  "tdd",
  "verify",
] as const;

export type SkillName = typeof SKILL_NAMES[number];
