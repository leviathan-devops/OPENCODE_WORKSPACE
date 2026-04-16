import { getSkillRegistry } from "../services/skill-registry.js";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadSkills(): void {
  const registry = getSkillRegistry();
  
  const possiblePaths = [
    __dirname,
    join(__dirname, "../skills"),
    resolve(__dirname, "../../src/skills"),
    resolve(process.cwd(), "src/skills"),
  ];
  
  for (const dirPath of possiblePaths) {
    if (existsSync(dirPath) && existsSync(join(dirPath, "IMPLEMENT.md"))) {
      registry.loadSkillsFromDirectory(dirPath);
      return;
    }
  }
  
  console.warn(`[Hermes] Could not find skills directory. Searched: ${possiblePaths.join(", ")}`);
}

export { getSkillRegistry };
