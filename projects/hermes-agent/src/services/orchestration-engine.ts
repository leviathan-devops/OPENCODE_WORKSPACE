import { getSkillRegistry, type SkillDefinition, type OrchestrationStep } from "./skill-registry.js";
import { getEpisodeStore, type EpisodeInput, type EpisodeOutput } from "./episode-store.js";
import { getForkManager } from "./fork-manager.js";
import { generateId } from "../utils/id.js";

let orchestrationEngine: OrchestrationEngine | null = null;

export function getOrchestrationEngine(): OrchestrationEngine {
  if (!orchestrationEngine) {
    orchestrationEngine = new OrchestrationEngine();
  }
  return orchestrationEngine;
}

export class OrchestrationEngine {
  private registry = getSkillRegistry();
  private episodeStore = getEpisodeStore();
  private forkManager = getForkManager();

  async invoke(skillName: string, input: EpisodeInput): Promise<EpisodeOutput> {
    const skill = this.registry.getSkill(skillName);
    if (!skill) throw new Error(`Skill not found: ${skillName}`);
    if (skill.type !== "orchestration")
      throw new Error(`Not an orchestration skill: ${skillName}`);
    if (!skill.chain?.length)
      throw new Error(`Orchestration skill ${skillName} has no chain`);

    const chainId = generateId();
    let previousOutput: EpisodeOutput | null = null;
    const allOutputs: EpisodeOutput[] = [];

    for (let i = 0; i < skill.chain.length; i++) {
      const step = skill.chain[i];

      if (step.condition && !this.evaluateCondition(step.condition, previousOutput)) {
        continue;
      }

      const stepInput = this.buildStepInput(step, previousOutput, input);

      const stepOutput = await this.executeStep(step, stepInput, chainId, i);

      if (step.captureOutput) {
        allOutputs.push(stepOutput);
        previousOutput = stepOutput;
      }

      if (step.skill === "verify" && stepOutput.blockers?.length) {
        break;
      }
    }

    return this.combineOutputs(skill, allOutputs);
  }

  private evaluateCondition(
    condition: string,
    previousOutput: EpisodeOutput | null
  ): boolean {
    try {
      const fn = new Function(
        "previous",
        `with(previous) { return ${condition}; }`
      );
      return fn(previousOutput || { summary: "", artifacts: [], decisions: [], blockers: [] });
    } catch {
      return true;
    }
  }

  private buildStepInput(
    step: OrchestrationStep,
    previousOutput: EpisodeOutput | null,
    originalInput: EpisodeInput
  ): EpisodeInput {
    let inputStr = step.inputTemplate;

    inputStr = inputStr.replace(/\{user_request\}/g, originalInput.trigger);

    if (previousOutput) {
      inputStr = inputStr.replace(/\{previous\}/g, previousOutput.summary);
      inputStr = inputStr.replace(
        /\{previous\.summary\}/g,
        previousOutput.summary
      );
      inputStr = inputStr.replace(
        /\{previous\.artifacts\}/g,
        previousOutput.artifacts.join(", ")
      );
      inputStr = inputStr.replace(
        /\{previous\.decisions\}/g,
        previousOutput.decisions.map((d) => d.description).join(", ")
      );
      inputStr = inputStr.replace(
        /\{previous\.blockers\}/g,
        previousOutput.blockers.map((b) => b.description).join(", ")
      );
    } else {
      inputStr = inputStr.replace(/\{previous\}/g, "");
      inputStr = inputStr.replace(/\{previous\.summary\}/g, "");
      inputStr = inputStr.replace(/\{previous\.artifacts\}/g, "");
      inputStr = inputStr.replace(/\{previous\.decisions\}/g, "");
      inputStr = inputStr.replace(/\{previous\.blockers\}/g, "");
    }

    return {
      trigger: inputStr,
      context: originalInput.context,
    };
  }

  private async executeStep(
    step: OrchestrationStep,
    input: EpisodeInput,
    chainId: string,
    position: number
  ): Promise<EpisodeOutput> {
    const episode = this.episodeStore.startEpisode(
      step.skill,
      input,
      step.mode,
      chainId
    );
    episode.chainPosition = position;

    if (step.mode === "fork") {
      return this.executeForkStep(step, input, episode.id);
    } else {
      return this.executeThreadStep(step, input, episode.id);
    }
  }

  private async executeForkStep(
    step: OrchestrationStep,
    input: EpisodeInput,
    episodeId: string
  ): Promise<EpisodeOutput> {
    const fork = this.forkManager.startFork(step.skill, input, step.timeout);

    return new Promise<EpisodeOutput>((resolve) => {
      const check = setInterval(() => {
        if (
          !this.forkManager.isActive() ||
          this.forkManager.getActiveFork()?.id !== fork.id
        ) {
          clearInterval(check);
          const history = this.forkManager.getForkHistory();
          const completed = history.find((f) => f.id === fork.id);
          const output =
            completed?.partialOutput ??
            ({
              summary: "Fork completed",
              artifacts: [],
              decisions: [],
              blockers: [],
            } as EpisodeOutput);
          this.episodeStore.completeEpisode(episodeId, output);
          resolve(output);
        }
      }, 100);
    });
  }

  private async executeThreadStep(
    step: OrchestrationStep,
    input: EpisodeInput,
    episodeId: string
  ): Promise<EpisodeOutput> {
    setTimeout(() => {
      const output: EpisodeOutput = {
        summary: `Thread '${step.skill}' dispatched: ${input.trigger}`,
        artifacts: [],
        decisions: [],
        blockers: [],
      };
      this.episodeStore.completeEpisode(episodeId, output);
    }, 0);

    return {
      summary: `Thread '${step.skill}' dispatched: ${input.trigger}`,
      artifacts: [],
      decisions: [],
      blockers: [],
    };
  }

  private combineOutputs(
    skill: SkillDefinition,
    outputs: EpisodeOutput[]
  ): EpisodeOutput {
    if (!skill.outputTemplate) {
      return outputs[outputs.length - 1] || {
        summary: "No output",
        artifacts: [],
        decisions: [],
        blockers: [],
      };
    }

    let result = skill.outputTemplate;

    for (let i = 0; i < outputs.length; i++) {
      const output = outputs[i];
      const step = skill.chain?.[i];
      if (!step) continue;

      result = result.replace(
        new RegExp(`\\{${step.skill}\\.output\\.summary\\}`, "g"),
        output.summary
      );
      result = result.replace(
        new RegExp(`\\{${step.skill}\\.output\\.artifacts\\}`, "g"),
        output.artifacts.join(", ")
      );
      result = result.replace(
        new RegExp(`\\{${step.skill}\\.artifacts\\}`, "g"),
        output.artifacts.join(", ")
      );
    }

    return {
      summary: result,
      artifacts: outputs.flatMap((o) => o.artifacts),
      decisions: outputs.flatMap((o) => o.decisions),
      blockers: outputs.flatMap((o) => o.blockers),
    };
  }

  reset(): void {
    this.episodeStore.reset();
    this.forkManager.reset();
  }
}
