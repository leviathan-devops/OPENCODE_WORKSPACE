/**
 * OrchestrationEngine — Executes skill chains with conditional branching
 */

import type { EpisodeInput, EpisodeOutput } from "./episode-store.js";
import type { SkillDefinition, OrchestrationStep } from "./skill-registry.js";
import { getSkillRegistry } from "./skill-registry.js";
import { getEpisodeStore } from "./episode-store.js";
import { getForkManager } from "./fork-manager.js";
import { generateId } from "../utils/id.js";

export class OrchestrationEngine {
  private registry = getSkillRegistry();
  private episodeStore = getEpisodeStore();
  private forkManager = getForkManager();
  
  /**
   * Invoke an orchestration skill by name
   */
  async invoke(skillName: string, input: EpisodeInput): Promise<EpisodeOutput> {
    const skill = this.registry.getSkill(skillName);
    if (!skill) throw new Error(`Skill not found: ${skillName}`);
    if (skill.type !== "orchestration") throw new Error(`Not an orchestration skill: ${skillName}`);
    if (!skill.chain?.length) throw new Error(`Orchestration skill ${skillName} has no chain`);
    
    const chainId = generateId();
    let previousOutput: EpisodeOutput | null = null;
    const allOutputs: EpisodeOutput[] = [];
    
    for (let i = 0; i < skill.chain.length; i++) {
      const step = skill.chain[i];
      
      // Evaluate condition if present
      if (step.condition && !this.evaluateCondition(step.condition, previousOutput)) {
        continue; // Skip this step
      }
      
      // Build input for this step
      const stepInput = this.buildStepInput(step, previousOutput, input);
      
      // Execute the step
      const stepOutput = await this.executeStep(step, stepInput, chainId, i);
      
      if (step.captureOutput) {
        allOutputs.push(stepOutput);
        previousOutput = stepOutput;
      }
      
      // Early termination on verify failure
      if (step.skill === "verify" && stepOutput.blockers?.length) {
        break;
      }
    }
    
    return this.combineOutputs(skill, allOutputs);
  }
  
  /**
   * Execute a single orchestration step (Thread or Fork)
   */
  private async executeStep(
    step: OrchestrationStep,
    input: EpisodeInput,
    chainId: string,
    position: number
  ): Promise<EpisodeOutput> {
    // Start episode tracking
    const episode = this.episodeStore.startEpisode(step.skill, input, step.mode, chainId);
    episode.chainPosition = position;
    
    if (step.mode === "fork") {
      // FORK: blocking — wait for completion
      const fork = this.forkManager.startFork(step.skill, input, step.timeout);
      
      return new Promise<EpisodeOutput>((resolve) => {
        const check = setInterval(() => {
          if (!this.forkManager.isActive() || this.forkManager.getActiveFork()?.id !== fork.id) {
            clearInterval(check);
            const history = this.forkManager.getForkHistory();
            const completed = history.find(f => f.id === fork.id);
            const output = completed?.partialOutput ?? {
              summary: "Fork completed",
              artifacts: [],
              decisions: [],
              blockers: [],
            };
            this.episodeStore.completeEpisode(episode.id, output);
            resolve(output);
          }
        }, 100); // Poll frequently for responsiveness
      });
    } else {
      // THREAD: non-blocking — dispatch and return placeholder
      // In a real implementation, dispatchThread would be called here
      // For now, return a placeholder
      setTimeout(() => {
        // Would dispatch thread here
      }, 0);
      
      return {
        summary: `[Thread dispatched: ${step.skill}]`,
        artifacts: [],
        decisions: [],
        blockers: [],
      };
    }
  }
  
  /**
   * Build input for a step from template
   */
  private buildStepInput(
    step: OrchestrationStep,
    previousOutput: EpisodeOutput | null,
    originalInput: EpisodeInput
  ): EpisodeInput {
    let resolved = step.inputTemplate
      .replace(/\{user_request\}/g, originalInput.trigger)
      .replace(/\{previous\}/g, previousOutput?.summary ?? "")
      .replace(/\{previous\.summary\}/g, previousOutput?.summary ?? "")
      .replace(/\{previous\.artifacts\}/g, previousOutput?.artifacts?.join("\n") ?? "");
    
    // Handle {context.key} references
    resolved = resolved.replace(/\{context\.(\w+)\}/g, (_, k) => {
      return originalInput.context?.[k]?.toString() ?? "";
    });
    
    return { trigger: resolved, context: { previousOutput } };
  }
  
  /**
   * Evaluate a JavaScript condition expression
   */
  private evaluateCondition(condition: string, previousOutput: EpisodeOutput | null): boolean {
    try {
      const context = { previousOutput };
      return new Function("context", `with(context) { return ${condition}; }`)(context);
    } catch {
      return false;
    }
  }
  
  /**
   * Combine outputs from a chain using the output template
   */
  private combineOutputs(skill: SkillDefinition, outputs: EpisodeOutput[]): EpisodeOutput {
    if (!skill.outputTemplate) {
      // Default: concatenate summaries
      return {
        summary: outputs.map(o => o.summary).join("\n---\n"),
        artifacts: outputs.flatMap(o => o.artifacts),
        decisions: outputs.flatMap(o => o.decisions),
        blockers: outputs.flatMap(o => o.blockers),
      };
    }
    
    // Template substitution
    let result = skill.outputTemplate;
    
    for (let i = 0; i < outputs.length; i++) {
      const stepKey = i === 0 ? "verify" : skill.chain[i - 1]?.skill ?? `step${i}`;
      result = result.replace(new RegExp(`\\{${stepKey}\\.output\\.summary\\}`, "g"), outputs[i].summary);
      result = result.replace(new RegExp(`\\{${stepKey}\\.artifacts\\}`, "g"), outputs[i].artifacts.join("\n"));
      result = result.replace(new RegExp(`\\{${stepKey}\\.output\\.blockers\\}`, "g"), 
        outputs[i].blockers.map(b => `- ${b.description}`).join("\n"));
    }
    
    result = result.replace(/\{user_request\}/g, outputs[0]?.summary ?? "");
    
    return {
      summary: result,
      artifacts: outputs.flatMap(o => o.artifacts),
      decisions: outputs.flatMap(o => o.decisions),
      blockers: outputs.flatMap(o => o.blockers),
    };
  }
}

// Singleton instance
let engineInstance: OrchestrationEngine | null = null;

export function getOrchestrationEngine(): OrchestrationEngine {
  if (!engineInstance) {
    engineInstance = new OrchestrationEngine();
  }
  return engineInstance;
}


