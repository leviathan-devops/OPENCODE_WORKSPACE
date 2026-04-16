import { getOrchestrationEngine } from "../services/orchestration-engine.js";
import { getSkillRegistry, type SkillDefinition } from "../services/skill-registry.js";

export const orchestrationInvoke = {
  name: "orchestration_invoke",
  description: "Invoke an orchestration skill by name",
  args: {
    skillName: { type: "string", description: "Name of the orchestration skill to invoke" },
    trigger: { type: "string", description: "Trigger message or goal for the orchestration" },
  },
  execute: async (args: { skillName: string; trigger: string }, _context: any) => {
    const engine = getOrchestrationEngine();
    try {
      const output = await engine.invoke(args.skillName, {
        trigger: args.trigger,
        context: {},
      });
      return {
        skillName: args.skillName,
        status: "completed",
        output,
      };
    } catch (error: any) {
      return {
        skillName: args.skillName,
        status: "error",
        error: error.message,
      };
    }
  },
};

export const skillRegister = {
  name: "skill_register",
  description: "Register a new orchestration skill",
  args: {
    name: { type: "string", description: "Skill name" },
    type: { type: "string", description: "Skill type: action, interactive, or orchestration" },
    description: { type: "string", description: "Skill description" },
    executionMode: {
      type: "string",
      description: "Execution mode: thread, fork, or teammate",
      required: false,
    },
    chain: {
      type: "array",
      description: "Orchestration chain (for orchestration skills)",
      required: false,
    },
  },
  execute: async (
    args: {
      name: string;
      type: string;
      description: string;
      executionMode?: string;
      chain?: Array<{
        skill: string;
        mode: string;
        inputTemplate: string;
        condition?: string;
        captureOutput: boolean;
        timeout?: number;
      }>;
    },
    _context: any
  ) => {
    const registry = getSkillRegistry();

    const skill: SkillDefinition = {
      name: args.name,
      type: args.type as "action" | "interactive" | "orchestration",
      description: args.description,
      executionMode: (args.executionMode as "thread" | "fork" | "teammate") || "thread",
      contextScope: "isolated",
      instructions: "",
    };

    if (args.chain) {
      skill.chain = args.chain;
    }

    registry.registerSkill(skill);

    return {
      status: "registered",
      skillName: args.name,
    };
  },
};

export const orchestrationStatus = {
  name: "orchestration_status",
  description: "Get the status of an orchestration chain",
  args: {
    chainId: { type: "string", description: "Chain ID to check status for", required: false },
  },
  execute: async (args: { chainId?: string }, _context: any) => {
    const engine = getOrchestrationEngine();
    return {
      status: "operational",
      message: "Orchestration engine is running",
    };
  },
};

export const skillList = {
  name: "skill_list",
  description: "List all registered skills",
  args: {},
  execute: async (_args: Record<string, never>, _context: any) => {
    const registry = getSkillRegistry();
    const skills = registry.getAllSkills();
    return {
      count: skills.length,
      skills: skills.map((s) => ({
        name: s.name,
        type: s.type,
        description: s.description,
        executionMode: s.executionMode,
        hasChain: !!s.chain?.length,
      })),
    };
  },
};
