/**
 * Hermes Agent Plugin v2.5
 * Thread/Fork/Orchestration Skills
 * Built: 2026-04-02T14:02:34.689Z
 */

// src/utils/id.ts
function generateId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}

// src/services/fork-manager.ts
class ForkManager {
  activeFork = null;
  forkHistory = [];
  maxHistory = 5;
  startFork(skillName, input, timeoutMs = 300000) {
    if (this.activeFork) {
      this.autoCompleteStaleFork("New Fork requested");
    }
    const context = {
      id: generateId(),
      skillName,
      state: "active",
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
      input,
      accumulatedOutput: "",
      partialOutput: null,
      timeoutMs
    };
    this.activeFork = context;
    return context;
  }
  sendFeedback(forkId, feedback) {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }
    this.activeFork.accumulatedOutput += `
User: ${feedback}`;
    this.activeFork.lastActivityAt = Date.now();
  }
  completeFork(forkId, output) {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }
    this.activeFork.state = "completed";
    this.activeFork.partialOutput = output;
    const compressedSummary = this.compressOutput();
    const result = {
      summary: compressedSummary || output.summary,
      artifacts: output.artifacts ?? [],
      decisions: output.decisions ?? [],
      blockers: output.blockers ?? []
    };
    this.forkHistory.push({ ...this.activeFork });
    if (this.forkHistory.length > this.maxHistory) {
      this.forkHistory.shift();
    }
    this.activeFork = null;
    return result;
  }
  timeoutFork(forkId) {
    if (!this.activeFork || this.activeFork.id !== forkId) {
      throw new Error(`Fork ${forkId} is not active`);
    }
    const partial = {
      summary: `Fork timed out after ${this.activeFork.timeoutMs}ms`,
      artifacts: [],
      decisions: [],
      blockers: [{
        reason: "timeout",
        description: `Fork '${this.activeFork.skillName}' timed out after ${this.activeFork.timeoutMs}ms`
      }]
    };
    return this.completeFork(forkId, partial);
  }
  autoCompleteStaleFork(reason) {
    if (!this.activeFork)
      return;
    const partial = {
      summary: `Auto-completed: ${reason}`,
      artifacts: [],
      decisions: [],
      blockers: [{
        reason: "auto_complete",
        description: `Fork '${this.activeFork.skillName}' auto-completed due to: ${reason}`
      }]
    };
    this.completeFork(this.activeFork.id, partial);
  }
  isActive() {
    return this.activeFork !== null;
  }
  getActiveFork() {
    return this.activeFork;
  }
  getForkHistory() {
    return [...this.forkHistory];
  }
  compressOutput() {
    if (!this.activeFork)
      return "";
    const transcript = this.activeFork.accumulatedOutput;
    if (transcript.length > 2000) {
      return transcript.substring(0, 2000) + "... [truncated]";
    }
    return transcript;
  }
}
var forkManagerInstance = null;
function getForkManager() {
  if (!forkManagerInstance) {
    forkManagerInstance = new ForkManager;
  }
  return forkManagerInstance;
}

// src/services/episode-store.ts
class EpisodeStore {
  episodes = new Map;
  activeBySkill = new Map;
  maxHistory = 10;
  startEpisode(skillName, input, mode, chainId) {
    const existingId = this.activeBySkill.get(skillName);
    if (existingId) {
      this.timeoutEpisode(existingId, {
        summary: "Replaced by new episode",
        artifacts: [],
        decisions: [],
        blockers: [{ reason: "replaced", description: "Previous episode replaced" }]
      });
    }
    const episode = {
      id: generateId(),
      skillName,
      mode,
      parentChainId: chainId ?? null,
      status: "active",
      startedAt: Date.now(),
      endedAt: null,
      input,
      output: null,
      contextSnapshot: "",
      chainPosition: null
    };
    this.episodes.set(episode.id, episode);
    this.activeBySkill.set(skillName, episode.id);
    return episode;
  }
  completeEpisode(episodeId, output) {
    const episode = this.episodes.get(episodeId);
    if (!episode)
      throw new Error(`Episode ${episodeId} not found`);
    episode.status = "completed";
    episode.endedAt = Date.now();
    episode.output = output;
    episode.contextSnapshot = this.compressContext(output);
    this.activeBySkill.delete(episode.skillName);
    this.pruneOldEpisodes();
    return episode;
  }
  timeoutEpisode(episodeId, partialOutput) {
    const episode = this.episodes.get(episodeId);
    if (!episode)
      throw new Error(`Episode ${episodeId} not found`);
    episode.status = "timeout";
    episode.endedAt = Date.now();
    episode.output = partialOutput;
    this.activeBySkill.delete(episode.skillName);
    return episode;
  }
  errorEpisode(episodeId, errorOutput) {
    const episode = this.episodes.get(episodeId);
    if (!episode)
      throw new Error(`Episode ${episodeId} not found`);
    episode.status = "error";
    episode.endedAt = Date.now();
    episode.output = errorOutput;
    this.activeBySkill.delete(episode.skillName);
    return episode;
  }
  getActiveEpisode(skillName) {
    const id = this.activeBySkill.get(skillName);
    return id ? this.episodes.get(id) ?? null : null;
  }
  getEpisodeHistory(skillName, limit = 10) {
    return Array.from(this.episodes.values()).filter((e) => e.skillName === skillName).sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
  }
  getChainOutputs(chainId) {
    return Array.from(this.episodes.values()).filter((e) => e.parentChainId === chainId && e.output !== null).sort((a, b) => (a.chainPosition ?? 0) - (b.chainPosition ?? 0)).map((e) => e.output);
  }
  compressContext(output) {
    const summary = output.summary;
    const decisions = output.decisions.map((d) => d.description).join("; ");
    return `Summary: ${summary.substring(0, 500)}. Decisions: ${decisions.substring(0, 500)}`;
  }
  pruneOldEpisodes() {
    const bySkill = new Map;
    for (const ep of this.episodes.values()) {
      const list = bySkill.get(ep.skillName) ?? [];
      list.push(ep);
      bySkill.set(ep.skillName, list);
    }
    for (const [, eps] of bySkill) {
      if (eps.length > this.maxHistory) {
        const sorted = eps.sort((a, b) => b.startedAt - a.startedAt);
        for (const old of sorted.slice(this.maxHistory)) {
          this.episodes.delete(old.id);
        }
      }
    }
  }
  getAllEpisodes() {
    return new Map(this.episodes);
  }
}
var episodeStoreInstance = null;
function getEpisodeStore() {
  if (!episodeStoreInstance) {
    episodeStoreInstance = new EpisodeStore;
  }
  return episodeStoreInstance;
}

// src/services/skill-registry.ts
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

class SkillRegistry {
  skills = new Map;
  loadSkillsFromDirectory(dirPath) {
    let files;
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
  parseSkillFile(content, defaultName) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) {
      return {
        name: defaultName,
        type: "action",
        description: "",
        executionMode: "thread",
        contextScope: "isolated",
        instructions: content.trim()
      };
    }
    const frontmatterStr = match[1];
    const body = match[2].trim();
    let frontmatter = {};
    try {
      for (const line of frontmatterStr.split(`
`)) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim();
          if (value.startsWith("[") && value.endsWith("]")) {
            frontmatter[key] = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
          } else {
            frontmatter[key] = value;
          }
        }
      }
    } catch {}
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
      instructions: body
    };
  }
  defaultMode(type) {
    switch (type) {
      case "interactive":
        return "fork";
      case "orchestration":
        return "fork";
      default:
        return "thread";
    }
  }
  getSkill(name) {
    return this.skills.get(name);
  }
  getSkillsByType(type) {
    return Array.from(this.skills.values()).filter((s) => s.type === type);
  }
  getTriggeredSkills(message) {
    return Array.from(this.skills.values()).filter((skill) => {
      if (!skill.triggerPatterns?.length)
        return false;
      return skill.triggerPatterns.some((pattern) => {
        try {
          return new RegExp(pattern).test(message);
        } catch {
          return message.includes(pattern);
        }
      });
    });
  }
  registerSkill(name, definition) {
    this.skills.set(name, definition);
  }
  getSkillNames() {
    return Array.from(this.skills.keys());
  }
}
var registryInstance = null;
function getSkillRegistry() {
  if (!registryInstance) {
    registryInstance = new SkillRegistry;
  }
  return registryInstance;
}

// src/services/orchestration-engine.ts
class OrchestrationEngine {
  registry = getSkillRegistry();
  episodeStore = getEpisodeStore();
  forkManager = getForkManager();
  async invoke(skillName, input) {
    const skill = this.registry.getSkill(skillName);
    if (!skill)
      throw new Error(`Skill not found: ${skillName}`);
    if (skill.type !== "orchestration")
      throw new Error(`Not an orchestration skill: ${skillName}`);
    if (!skill.chain?.length)
      throw new Error(`Orchestration skill ${skillName} has no chain`);
    const chainId = generateId();
    let previousOutput = null;
    const allOutputs = [];
    for (let i = 0;i < skill.chain.length; i++) {
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
  async executeStep(step, input, chainId, position) {
    const episode = this.episodeStore.startEpisode(step.skill, input, step.mode, chainId);
    episode.chainPosition = position;
    if (step.mode === "fork") {
      const fork = this.forkManager.startFork(step.skill, input, step.timeout);
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (!this.forkManager.isActive() || this.forkManager.getActiveFork()?.id !== fork.id) {
            clearInterval(check);
            const history = this.forkManager.getForkHistory();
            const completed = history.find((f) => f.id === fork.id);
            const output = completed?.partialOutput ?? {
              summary: "Fork completed",
              artifacts: [],
              decisions: [],
              blockers: []
            };
            this.episodeStore.completeEpisode(episode.id, output);
            resolve(output);
          }
        }, 100);
      });
    } else {
      setTimeout(() => {}, 0);
      return {
        summary: `[Thread dispatched: ${step.skill}]`,
        artifacts: [],
        decisions: [],
        blockers: []
      };
    }
  }
  buildStepInput(step, previousOutput, originalInput) {
    let resolved = step.inputTemplate.replace(/\{user_request\}/g, originalInput.trigger).replace(/\{previous\}/g, previousOutput?.summary ?? "").replace(/\{previous\.summary\}/g, previousOutput?.summary ?? "").replace(/\{previous\.artifacts\}/g, previousOutput?.artifacts?.join(`
`) ?? "");
    resolved = resolved.replace(/\{context\.(\w+)\}/g, (_, k) => {
      return originalInput.context?.[k]?.toString() ?? "";
    });
    return { trigger: resolved, context: { previousOutput } };
  }
  evaluateCondition(condition, previousOutput) {
    try {
      const context = { previousOutput };
      return new Function("context", `with(context) { return ${condition}; }`)(context);
    } catch {
      return false;
    }
  }
  combineOutputs(skill, outputs) {
    if (!skill.outputTemplate) {
      return {
        summary: outputs.map((o) => o.summary).join(`
---
`),
        artifacts: outputs.flatMap((o) => o.artifacts),
        decisions: outputs.flatMap((o) => o.decisions),
        blockers: outputs.flatMap((o) => o.blockers)
      };
    }
    let result = skill.outputTemplate;
    for (let i = 0;i < outputs.length; i++) {
      const stepKey = i === 0 ? "verify" : skill.chain[i - 1]?.skill ?? `step${i}`;
      result = result.replace(new RegExp(`\\{${stepKey}\\.output\\.summary\\}`, "g"), outputs[i].summary);
      result = result.replace(new RegExp(`\\{${stepKey}\\.artifacts\\}`, "g"), outputs[i].artifacts.join(`
`));
      result = result.replace(new RegExp(`\\{${stepKey}\\.output\\.blockers\\}`, "g"), outputs[i].blockers.map((b) => `- ${b.description}`).join(`
`));
    }
    result = result.replace(/\{user_request\}/g, outputs[0]?.summary ?? "");
    return {
      summary: result,
      artifacts: outputs.flatMap((o) => o.artifacts),
      decisions: outputs.flatMap((o) => o.decisions),
      blockers: outputs.flatMap((o) => o.blockers)
    };
  }
}
var engineInstance = null;
function getOrchestrationEngine() {
  if (!engineInstance) {
    engineInstance = new OrchestrationEngine;
  }
  return engineInstance;
}

// src/hooks/fork-blocker-hook.ts
var FORK_ALLOWED_TOOLS = [
  "fork_create",
  "fork_complete",
  "fork_feedback",
  "episode_list",
  "episode_output",
  "delegate_task"
];
function createForkBlockerHook() {
  return async (input, _output) => {
    const fm = getForkManager();
    if (fm.isActive() && !FORK_ALLOWED_TOOLS.includes(input.tool)) {
      const activeFork = fm.getActiveFork();
      throw new Error(`FORK_BLOCKED: Fork '${activeFork?.skillName}' is active (${activeFork?.id}). ` + `Only ${FORK_ALLOWED_TOOLS.join(", ")} tools allowed during Fork. ` + `Use fork_feedback to send input.`);
    }
  };
}

// src/hooks/skill-router.ts
function createSkillRouterHook() {
  return async (input, output) => {
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
    output.mode = skill.executionMode;
    output.reason = `default for ${skill.type}`;
  };
}

// src/hooks/output-chainer.ts
function createOutputChainerHook() {
  return async (input, output) => {
    const prev = input.previousOutput;
    let chained = prev.summary;
    if (prev.artifacts?.length) {
      chained += `

Artifacts created:
${prev.artifacts.map((a) => `- ${a}`).join(`
`)}`;
    }
    if (prev.blockers?.length) {
      chained += `

Blockers (${prev.blockers.length}):
${prev.blockers.map((b) => `- ${b.description}`).join(`
`)}`;
    }
    if (prev.decisions?.length) {
      chained += `

Decisions:
${prev.decisions.map((d) => `- ${d.description}`).join(`
`)}`;
    }
    output.chainedInput = chained;
  };
}

// src/hooks/episode-tracker.ts
function createEpisodeTrackerHook() {
  const episodeStore = getEpisodeStore();
  return {
    toolBefore: async (_input, _output) => {},
    toolAfter: async (_input, output) => {}
  };
}

// src/tools/fork-tools.ts
var fork_create = {
  name: "fork_create",
  description: "Create a new Fork session (blocking subagent)",
  args: {
    skill: { type: "string", description: "Skill name to invoke as Fork" },
    input: { type: "string", description: "Input to pass to the skill" },
    timeout: { type: "number", description: "Timeout in ms (default: 300000)", required: false }
  },
  execute: async (args, _context) => {
    const fm = getForkManager();
    const fork = fm.startFork(args.skill, { trigger: args.input, context: {} }, args.timeout);
    return { forkId: fork.id, status: "active", skill: args.skill };
  }
};
var fork_complete = {
  name: "fork_complete",
  description: "Complete an active Fork and return its output",
  args: {
    forkId: { type: "string", description: "The Fork ID to complete" },
    summary: { type: "string", description: "Summary of what the Fork accomplished" },
    artifacts: { type: "array", items: { type: "string" }, required: false },
    decisions: { type: "array", items: { type: "string" }, required: false },
    blockers: { type: "array", items: { type: "string" }, required: false }
  },
  execute: async (args, _context) => {
    const fm = getForkManager();
    const output = {
      summary: args.summary,
      artifacts: args.artifacts ?? [],
      decisions: (args.decisions ?? []).map((d) => ({ description: d })),
      blockers: (args.blockers ?? []).map((b) => ({ reason: "manual", description: b }))
    };
    return fm.completeFork(args.forkId, output);
  }
};
var fork_feedback = {
  name: "fork_feedback",
  description: "Send user input to an active Fork",
  args: {
    forkId: { type: "string", description: "The Fork ID to send feedback to" },
    message: { type: "string", description: "User message to route to Fork" }
  },
  execute: async (args, _context) => {
    const fm = getForkManager();
    fm.sendFeedback(args.forkId, args.message);
    return { status: "feedback_sent", forkId: args.forkId };
  }
};

// src/tools/episode-tools.ts
var episode_list = {
  name: "episode_list",
  description: "List active and recent episodes",
  args: {
    skillName: { type: "string", required: false, description: "Filter by skill name" },
    limit: { type: "number", required: false, description: "Max results (default: 10)" }
  },
  execute: async (args, _context) => {
    const store = getEpisodeStore();
    const episodes = store.getEpisodeHistory(args.skillName ?? "", args.limit ?? 10);
    return JSON.stringify(episodes.map((e) => ({
      id: e.id,
      skillName: e.skillName,
      mode: e.mode,
      status: e.status,
      startedAt: new Date(e.startedAt).toISOString(),
      endedAt: e.endedAt ? new Date(e.endedAt).toISOString() : null,
      outputSummary: e.output?.summary?.substring(0, 100)
    })), null, 2);
  }
};
var episode_output = {
  name: "episode_output",
  description: "Get the full output from a completed episode",
  args: {
    episodeId: { type: "string", description: "Episode ID to retrieve" }
  },
  execute: async (args, _context) => {
    const store = getEpisodeStore();
    const episodes = Array.from(store.getAllEpisodes().values());
    const episode = episodes.find((e) => e.id === args.episodeId);
    if (!episode?.output) {
      return { error: "Episode not found or still active" };
    }
    return episode.output;
  }
};

// src/tools/orchestration-tools.ts
var orchestration_invoke = {
  name: "orchestration_invoke",
  description: "Invoke an orchestration skill by name",
  args: {
    skill: { type: "string", description: "Orchestration skill name to invoke" },
    input: { type: "string", description: "Input/trigger for the orchestration" }
  },
  execute: async (args, _context) => {
    const engine = getOrchestrationEngine();
    return await engine.invoke(args.skill, { trigger: args.input, context: {} });
  }
};
var skill_register = {
  name: "skill_register",
  description: "Register a new skill at runtime (for dynamic skill creation)",
  args: {
    name: { type: "string", description: "Skill name" },
    definition: { type: "string", description: "YAML or JSON skill definition" }
  },
  execute: async (args, _context) => {
    const registry = getSkillRegistry();
    try {
      const def = JSON.parse(args.definition);
      registry.registerSkill(args.name, { ...def, instructions: "" });
    } catch {}
    return { status: "registered", name: args.name };
  }
};
var skill_list = {
  name: "skill_list",
  description: "List all registered skills",
  args: {},
  execute: async (_args, _context) => {
    const registry = getSkillRegistry();
    const skills = registry.getSkillNames().map((name) => {
      const s = registry.getSkill(name);
      return {
        name: s.name,
        type: s.type,
        executionMode: s.executionMode,
        description: s.description
      };
    });
    return JSON.stringify(skills, null, 2);
  }
};

// src/index.ts
async function hermesPlugin(config = {}) {
  const forkManager = getForkManager();
  const episodeStore = getEpisodeStore();
  const skillRegistry = getSkillRegistry();
  const orchestrationEngine = getOrchestrationEngine();
  return {
    name: "hermes-agent-v25",
    version: "2.5.0",
    description: "Hermes Agent Plugin v2.5 — Thread/Fork/Orchestration Skills",
    tools: {
      fork_create,
      fork_complete,
      fork_feedback,
      episode_list,
      episode_output,
      orchestration_invoke,
      skill_register,
      skill_list
    },
    hooks: {
      "tool.execute.before": [
        createForkBlockerHook(),
        createEpisodeTrackerHook().toolBefore
      ],
      "tool.execute.after": [
        createEpisodeTrackerHook().toolAfter
      ],
      "skill.route": createSkillRouterHook(),
      "output.chain": createOutputChainerHook()
    },
    services: {
      forkManager,
      episodeStore,
      skillRegistry,
      orchestrationEngine
    }
  };
}
export {
  hermesPlugin as default
};

//# debugId=4881B1AAD609E02864756E2164756E21
//# sourceMappingURL=index.js.map
