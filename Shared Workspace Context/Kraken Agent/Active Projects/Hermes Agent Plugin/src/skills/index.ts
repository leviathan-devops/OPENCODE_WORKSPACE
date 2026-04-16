import { getSkillRegistry } from "../services/skill-registry.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadSkills(): void {
  const registry = getSkillRegistry();
  registry.loadSkillsFromDirectory(join(__dirname));
}

export { getSkillRegistry };
