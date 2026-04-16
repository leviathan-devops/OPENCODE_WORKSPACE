import { createSystemEnhancerHook } from "./hooks/system-enhancer.js";
import { createBrainstormGateHook } from "./hooks/brainstorm-gate.js";
import { createPlanValidatorHook } from "./hooks/plan-validator.js";
import { createTddEnforcerHook } from "./hooks/tdd-enforcer.js";
import { createDelegationGateHook } from "./hooks/delegation-gate.js";
import { createPhaseMonitorHook } from "./hooks/phase-monitor.js";
import { createStrictWriteDisciplineHook } from "./hooks/strict-write-discipline.js";
import { createAdversarialCheckHook } from "./hooks/adversarial-check.js";
import { createAntiRationalizationHook } from "./hooks/anti-rationalization.js";
import { createCompactionHook } from "./hooks/compaction.js";
import { createGuardrailsHook } from "./hooks/guardrails.js";
import { createScopeGuardHook } from "./hooks/scope-guard.js";
import { createActivityHook } from "./hooks/activity.js";
import { createDelegationLedgerHook } from "./hooks/delegation-ledger.js";
import { createKnowledgeCuratorHook } from "./hooks/knowledge-curator.js";
import { createSnapshotWriterHook } from "./hooks/snapshot-writer.js";
import { createDebuggingSpiralHook } from "./hooks/debugging-spiral.js";
import { createAdversarialDetectorHook } from "./hooks/adversarial-detector.js";
import { createRippleCheckHook } from "./hooks/ripple-check.js";
import { createSupervisorIngestHook } from "./hooks/supervisor-ingest.js";
import { createComplexityRoutingHook } from "./hooks/complexity-routing.js";
import { createIntentMarkerHook } from "./hooks/intent-marker.js";
import { createDriftVerifierHook } from "./hooks/drift-verifier-hook.js";
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
function composeHandlers(handlers) {
    return async (input, output) => {
        for (const handler of handlers) {
            await handler(input, output);
        }
    };
}
const hermesPlugin = async (input) => {
    const config = loadHermesConfig();
    const messageTransform = composeHandlers([
        createBrainstormGateHook(),
        createPlanValidatorHook(),
        createStrictWriteDisciplineHook(),
        createAdversarialCheckHook(),
        createAdversarialDetectorHook(),
        createAntiRationalizationHook(),
        createIntentMarkerHook(),
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
    return {
        name: "hermes-agent",
        agent: [
            {
                name: "hermes",
                description: "Leviathan's persistent 2nd-brain orchestrator",
                instructions: HERMES_PROMPT,
            },
            {
                name: "analyst",
                description: "Requirements → technical specs",
                instructions: ANALYST_PROMPT,
            },
            {
                name: "builder",
                description: "One task at a time implementation with TDD",
                instructions: BUILDER_PROMPT,
            },
            {
                name: "planner",
                description: "No-placeholder adaptive planning",
                instructions: PLANNER_PROMPT,
            },
            {
                name: "tdd",
                description: "RED-GREEN-REFACTOR executor",
                instructions: TDD_PROMPT,
            },
            {
                name: "reviewer",
                description: "Security + performance + patterns review",
                instructions: REVIEWER_PROMPT,
            },
            {
                name: "quality-reviewer",
                description: "Spec compliance + readability",
                instructions: QUALITY_REVIEWER_PROMPT,
            },
            {
                name: "grill",
                description: "Adversarial attack testing",
                instructions: GRILL_PROMPT,
            },
            {
                name: "ripple",
                description: "Cascading change analysis",
                instructions: RIPPLE_PROMPT,
            },
            {
                name: "drift-verifier",
                description: "Phase completion verification",
                instructions: DRIFT_VERIFIER_PROMPT,
            },
            {
                name: "explorer",
                description: "Codebase context mapping",
                instructions: EXPLORER_PROMPT,
            },
            {
                name: "architect",
                description: "Clean Architecture / DDD advocacy",
                instructions: ARCHITECT_PROMPT,
            },
            {
                name: "debugger",
                description: "4-phase systematic debugging",
                instructions: DEBUGGER_PROMPT,
            },
            {
                name: "supervisor",
                description: "Graeme's self-improving loop",
                instructions: SUPERVISOR_PROMPT,
            },
            {
                name: "sme",
                description: "Subject matter expert for domain research",
                instructions: SME_PROMPT,
            },
            {
                name: "test-engineer",
                description: "Test strategy and coverage analysis",
                instructions: TEST_ENGINEER_PROMPT,
            },
            {
                name: "docs",
                description: "Documentation updates",
                instructions: DOCS_PROMPT,
            },
            {
                name: "critic",
                description: "Plan critique before implementation",
                instructions: CRITIC_PROMPT,
            },
            {
                name: "memory",
                description: "Cross-session decision persistence",
                instructions: MEMORY_PROMPT,
            },
        ],
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
        "experimental.chat.system.transform": createSystemEnhancerHook(),
        "experimental.chat.messages.transform": messageTransform,
        "tool.execute.before": toolBefore,
        "tool.execute.after": toolAfter,
        "experimental.session.compacting": createCompactionHook(),
        "chat.params": createComplexityRoutingHook(),
    };
};
export default hermesPlugin;
