import type { Plugin, PluginInput } from "@opencode-ai/plugin";

import { createSystemEnhancerHook } from "./hooks/system-enhancer.js";
import { createBrainstormGateHook } from "./hooks/brainstorm-gate.js";
import { createPlanValidatorHook } from "./hooks/plan-validator.js";
import { createTddEnforcerHook } from "./hooks/tdd-enforcer.js";
import { createDelegationGateHook } from "./hooks/delegation-gate.js";
import { createPhaseMonitorHook } from "./hooks/phase-monitor.js";
import { createStrictWriteDisciplineHook } from "./hooks/strict-write-discipline.js";
import { createAdversarialCheckHook } from "./hooks/adversarial-check.js";
import { createAntiRationalizationHook } from "./hooks/anti-rationalization.js";
import { createKnowledgeInjectorHook } from "./hooks/knowledge-injector.js";
import { createCompactionHook } from "./hooks/compaction.js";
import { createGuardrailsHook } from "./hooks/guardrails.js";
import { createScopeGuardHook } from "./hooks/scope-guard.js";
import { createActivityHook } from "./hooks/activity.js";
import { createDelegationLedgerHook } from "./hooks/delegation-ledger.js";
import { createSelfReviewHook } from "./hooks/self-review.js";
import { createKnowledgeCuratorHook } from "./hooks/knowledge-curator.js";
import { createSnapshotWriterHook } from "./hooks/snapshot-writer.js";
import { createDebuggingSpiralHook } from "./hooks/debugging-spiral.js";
import { createAdversarialDetectorHook } from "./hooks/adversarial-detector.js";
import { createRippleCheckHook } from "./hooks/ripple-check.js";
import { createSupervisorIngestHook } from "./hooks/supervisor-ingest.js";
import { createComplexityRoutingHook } from "./hooks/complexity-routing.js";
import { createFrameworkPackHook } from "./hooks/framework-pack.js";
import { createIntentMarkerHook } from "./hooks/intent-marker.js";
import { createDriftVerifierHook } from "./hooks/drift-verifier-hook.js";
import { createContextBudgetHook } from "./hooks/context-budget.js";

import { loadHermesConfig } from "./config/loader.js";

import { HERMES_PROMPT } from "./agents/hermes.js";
import { ANALYST_PROMPT } from "./agents/analyst.js";
import { BUILDER_PROMPT } from "./agents/builder.js";
import { PLANNER_PROMPT } from "./agents/planner.js";
import { TDD_PROMPT } from "./agents/tdd.js";
import { REVIEWER_PROMPT } from "./agents/reviewer.js";
import { QUALITY_REVIEWER_PROMPT } from "./agents/quality-reviewer.js";
import { GRILL_PROMPT } from "./agents/grill.js";
import { RIPPLE_PROMPT } from "./agents/ripple.js";
import { DRIFT_VERIFIER_PROMPT } from "./agents/drift-verifier.js";
import { EXPLORER_PROMPT } from "./agents/explorer.js";
import { ARCHITECT_PROMPT } from "./agents/architect.js";
import { DEBUGGER_PROMPT } from "./agents/debugger.js";
import { SUPERVISOR_PROMPT } from "./agents/supervisor.js";
import { SME_PROMPT } from "./agents/sme.js";
import { TEST_ENGINEER_PROMPT } from "./agents/test-engineer.js";
import { DOCS_PROMPT } from "./agents/docs.js";
import { CRITIC_PROMPT } from "./agents/critic.js";
import { MEMORY_PROMPT } from "./agents/memory.js";

import { checkpoint } from "./tools/checkpoint.js";
import { phaseComplete } from "./tools/phase-complete.js";
import { savePlan } from "./tools/save-plan.js";
import { hermesRecall } from "./tools/hermes-recall.js";
import { hermesRemember } from "./tools/hermes-remember.js";
import { hermesContext } from "./tools/hermes-context.js";

import { lint, diff, buildCheck, syntaxCheck } from "./tools/quality.js";
import { testRunner, placeholderScan, sastScan, secretScan } from "./tools/security.js";
import { complexityHotspots, detectDomains, extractCodeBlocks, imports, symbols } from "./tools/analysis.js";
import { grill, verify, health, evidenceCheck, retrieveSummary } from "./tools/verification.js";
import { listSessions, loadSession, forkSession, createSnapshot } from "./tools/session-tools.js";

function composeHandlers<T>(
  handlers: Array<(input: any, output: any) => Promise<void>>
) {
  return async (input: any, output: any) => {
    for (const handler of handlers) {
      await handler(input, output);
    }
  };
}

const hermesPlugin: Plugin = async (input: PluginInput) => {
  const config = loadHermesConfig();

  const messageTransform = composeHandlers([
    createBrainstormGateHook(),
    createPlanValidatorHook(),
    createStrictWriteDisciplineHook(),
    createAdversarialCheckHook(),
    createAdversarialDetectorHook(),
    createAntiRationalizationHook(),
    createIntentMarkerHook(),
    createContextBudgetHook(),
    createKnowledgeInjectorHook(),
  ]);

  const toolBefore = composeHandlers([
    createTddEnforcerHook(),
    createDelegationGateHook(),
    createGuardrailsHook(),
    createScopeGuardHook(),
  ]);

  const toolAfter = composeHandlers([
    createPhaseMonitorHook(),
    createActivityHook(),
    createDelegationLedgerHook(),
    createKnowledgeCuratorHook(),
    createSnapshotWriterHook(),
    createDebuggingSpiralHook(),
    createRippleCheckHook(),
    createSupervisorIngestHook(),
    createDriftVerifierHook(),
  ]);

  // Build agent configs as an object keyed by agent name - MATCHING SPIDER PATTERN
  const agentConfigs = {
    hermes: {
      name: "hermes",
      description: "Leviathan's persistent 2nd-brain orchestrator",
      color: "#D35400",
      config: {
        prompt: HERMES_PROMPT,
      },
      mode: "primary",
      permission: { edit: "allow", bash: {}, webfetch: "allow", doom_loop: "allow", external_directory: "allow" },
      tools: {},
    },
    analyst: {
      name: "analyst",
      description: "Requirements → technical specs",
      color: "#D35400",
      config: {
        prompt: ANALYST_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    builder: {
      name: "builder",
      description: "One task at a time implementation with TDD",
      color: "#D35400",
      config: {
        prompt: BUILDER_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    planner: {
      name: "planner",
      description: "No-placeholder adaptive planning",
      color: "#D35400",
      config: {
        prompt: PLANNER_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    tdd: {
      name: "tdd",
      description: "RED-GREEN-REFACTOR executor",
      color: "#D35400",
      config: {
        prompt: TDD_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    reviewer: {
      name: "reviewer",
      description: "Security + performance + patterns review",
      color: "#D35400",
      config: {
        prompt: REVIEWER_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    "quality-reviewer": {
      name: "quality-reviewer",
      description: "Spec compliance + readability",
      color: "#D35400",
      config: {
        prompt: QUALITY_REVIEWER_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    grill: {
      name: "grill",
      description: "Adversarial attack testing",
      color: "#D35400",
      config: {
        prompt: GRILL_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    ripple: {
      name: "ripple",
      description: "Cascading change analysis",
      color: "#D35400",
      config: {
        prompt: RIPPLE_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    "drift-verifier": {
      name: "drift-verifier",
      description: "Phase completion verification",
      color: "#D35400",
      config: {
        prompt: DRIFT_VERIFIER_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    explorer: {
      name: "explorer",
      description: "Codebase context mapping",
      color: "#D35400",
      config: {
        prompt: EXPLORER_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    architect: {
      name: "architect",
      description: "Clean Architecture / DDD advocacy",
      color: "#D35400",
      config: {
        prompt: ARCHITECT_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    debugger: {
      name: "debugger",
      description: "4-phase systematic debugging",
      color: "#D35400",
      config: {
        prompt: DEBUGGER_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    supervisor: {
      name: "supervisor",
      description: "Graeme's self-improving loop",
      color: "#D35400",
      config: {
        prompt: SUPERVISOR_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    sme: {
      name: "sme",
      description: "Subject matter expert for domain research",
      color: "#D35400",
      config: {
        prompt: SME_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    "test-engineer": {
      name: "test-engineer",
      description: "Test strategy and coverage analysis",
      color: "#D35400",
      config: {
        prompt: TEST_ENGINEER_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    docs: {
      name: "docs",
      description: "Documentation updates",
      color: "#D35400",
      config: {
        prompt: DOCS_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    critic: {
      name: "critic",
      description: "Plan critique before implementation",
      color: "#D35400",
      config: {
        prompt: CRITIC_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
    memory: {
      name: "memory",
      description: "Cross-session decision persistence",
      color: "#D35400",
      config: {
        prompt: MEMORY_PROMPT,
      },
      mode: "subagent",
      tools: {},
    },
  };

  return {
    name: "hermes-agent",
    agent: agentConfigs,  // DIRECT property - this is what SDK reads at init time for tab toggle!
    config: async (opencodeConfig: any) => {
      // Merge agent configs into opencodeConfig.agent (which is an object, not array)
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agentConfigs };
      } else {
        Object.assign(opencodeConfig.agent, agentConfigs);
      }
      // Add Hermes management command
      opencodeConfig.command = {
        ...opencodeConfig.command || {},
        Hermes: {
          template: "/Hermes $ARGUMENTS",
          description: "Hermes management commands - view status, manage agents, check memory",
        },
      };
    },
    tool: {
      checkpoint,
      phase_complete: phaseComplete,
      save_plan: savePlan,
      hermes_recall: hermesRecall,
      hermes_remember: hermesRemember,
      hermes_context: hermesContext,
      lint,
      diff,
      build_check: buildCheck,
      syntax_check: syntaxCheck,
      test_runner: testRunner,
      placeholder_scan: placeholderScan,
      sast_scan: sastScan,
      secret_scan: secretScan,
      complexity_hotspots: complexityHotspots,
      detect_domains: detectDomains,
      extract_code_blocks: extractCodeBlocks,
      imports,
      symbols,
      grill,
      verify,
      health,
      evidence_check: evidenceCheck,
      retrieve_summary: retrieveSummary,
      list_sessions: listSessions,
      load_session: loadSession,
      fork_session: forkSession,
      create_snapshot: createSnapshot,
    },
    "experimental.chat.system.transform": composeHandlers([
      createSystemEnhancerHook(),
      createFrameworkPackHook(),
    ]),
    "experimental.chat.messages.transform": messageTransform,
    "tool.execute.before": toolBefore,
    "tool.execute.after": toolAfter,
    "experimental.session.compacting": createCompactionHook(),
    "chat.params": createComplexityRoutingHook(),
  };
};

export default hermesPlugin;
