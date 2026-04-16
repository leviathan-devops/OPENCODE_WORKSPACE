/**
 * Hermes Agent Plugin v2.5
 * 
 * Thread/Fork/Orchestration Skills Architecture
 * 
 * Key new primitives:
 * - Thread: async, non-blocking subagent dispatch
 * - Fork: synchronous, blocking subagent (takes over UI)
 * - Orchestration: skill chains with conditional branching
 */

import { getForkManager } from "./services/fork-manager.js";
import { getEpisodeStore } from "./services/episode-store.js";
import { getSkillRegistry } from "./services/skill-registry.js";
import { getOrchestrationEngine } from "./services/orchestration-engine.js";
import { createForkBlockerHook } from "./hooks/fork-blocker-hook.js";
import { createSkillRouterHook } from "./hooks/skill-router.js";
import { createOutputChainerHook } from "./hooks/output-chainer.js";
import { createEpisodeTrackerHook } from "./hooks/episode-tracker.js";
import { fork_create, fork_complete, fork_feedback } from "./tools/fork-tools.js";
import { episode_list, episode_output } from "./tools/episode-tools.js";
import { orchestration_invoke, skill_register, skill_list } from "./tools/orchestration-tools.js";

export interface HermesConfig {
  // v2.5 config options
}

export default async function hermesPlugin(config: HermesConfig = {}) {
  // Initialize services
  const forkManager = getForkManager();
  const episodeStore = getEpisodeStore();
  const skillRegistry = getSkillRegistry();
  const orchestrationEngine = getOrchestrationEngine();
  
  // Load skills from src/skills/ directory
  // In production, this would be the bundled skills directory
  // skillRegistry.loadSkillsFromDirectory(...);
  
  return {
    name: "hermes-agent-v25",
    version: "2.5.0",
    description: "Hermes Agent Plugin v2.5 — Thread/Fork/Orchestration Skills",
    
    // Tools (v2.5 new tools added)
    tools: {
      // Fork management
      fork_create,
      fork_complete,
      fork_feedback,
      
      // Episode tracking
      episode_list,
      episode_output,
      
      // Orchestration
      orchestration_invoke,
      skill_register,
      skill_list,
    },
    
    // Hooks composition
    hooks: {
      "tool.execute.before": [
        createForkBlockerHook(),
        createEpisodeTrackerHook().toolBefore,
      ],
      
      "tool.execute.after": [
        createEpisodeTrackerHook().toolAfter,
      ],
      
      "skill.route": createSkillRouterHook(),
      "output.chain": createOutputChainerHook(),
    },
    
    // Service access for external use
    services: {
      forkManager,
      episodeStore,
      skillRegistry,
      orchestrationEngine,
    },
  };
}

// Export types for external use
export type { Episode, EpisodeInput, EpisodeOutput } from "./services/episode-store.js";
export type { SkillDefinition, OrchestrationStep, SkillType, SkillExecutionMode } from "./services/skill-registry.js";
export type { ForkContext, ForkState } from "./services/fork-manager.js";
