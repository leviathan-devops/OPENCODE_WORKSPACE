// src/hooks/index.ts
import * as fs4 from "fs";
import * as path2 from "path";

// src/brains/system/two-layer-guardian.ts
var DANGEROUS_TOOLS = /* @__PURE__ */ new Set([
  "terminal",
  "mcp_terminal",
  "write_file",
  "mcp_write_file",
  "patch",
  "mcp_patch",
  "edit",
  "mcp_edit",
  "delete_file",
  "mcp_delete_file"
]);
var THEATRICAL_PATTERNS = [
  /\|.*wc\s+-l/i,
  /wc\s+-l.*\|/i,
  /cat.*\|.*wc/i,
  /grep.*\|.*wc/i,
  /\|.*tee/i,
  /\|.*>.*\./i,
  /wc\s+-l.*dist\//i,
  /wc\s+-l.*src\//i,
  /wc\s+-l.*build\//i
];
var LEGITIMATE_PATTERNS = [
  /mkdir\s+-p/i,
  /cp\s+-r/i,
  /mv\s+/i,
  /cat\s+[^\|>]+$/i,
  /head\s+-[0-9]+\s+/i,
  /tail\s+-[0-9]+\s+/i,
  /grep\s+-[rEn]+.*[^\|]$/i,
  /find\s+.*-name/i,
  /test\s+-d/i,
  /test\s+-x/i
];
var FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /node\s+verify.*\.mjs/i,
  /npm\s+test/i,
  /yarn\s+test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /jasmine/i,
  /bun\s+test/i
];
var WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+run/i,
  /opencode\s+container\s+start/i,
  /opencode\s+container\s+exec/i
];
var THEATRICAL_MESSAGE_PATTERNS = [
  /just\s+grep/i,
  /grep.*\|.*wc/i,
  /count.*lines/i,
  /wc\s+-l/i,
  /I'll.*count/i,
  /let.*me.*grep.*wc/i
];
var FAKE_COMPLETION_MESSAGE_PATTERNS = [
  /task.*complete/i,
  /done.*already/i,
  /finished.*it/i,
  /build.*passed/i,
  /tests.*pass/i,
  /no.*issues/i,
  /all.*good/i,
  /it.*works.*trust.*me/i
];
var HOST_FALLBACK_MESSAGE_PATTERNS = [
  /host.*works/i,
  /skip.*container/i,
  /don't.*need.*container/i,
  /local.*fine/i,
  /already.*tested.*locally/i,
  /container.*not.*necessary/i
];
var SUCCESS_CLAIM_MESSAGE_PATTERNS = [
  /it's.*working/i,
  /trust.*me/i,
  /believe.*me/i,
  /works.*fine/i,
  /no.*problem/i,
  /should.*be.*good/i,
  /obviously.*correct/i
];
var IMPATIENCE_MESSAGE_PATTERNS = [
  /just.*ship.*it/i,
  /let's.*move.*on/i,
  /good.*enough/i,
  /close.*enough/i,
  /ship.*it/i,
  /fuck.*it/i
];
function isTheatrical(command) {
  return THEATRICAL_PATTERNS.some((p) => p.test(command)) && !LEGITIMATE_PATTERNS.some((p) => p.test(command));
}
function classifyMessageIntent(message) {
  const matchedPatterns = [];
  const patterns = [
    { name: "THEATRICAL", patterns: THEATRICAL_MESSAGE_PATTERNS },
    { name: "FAKE_COMPLETION", patterns: FAKE_COMPLETION_MESSAGE_PATTERNS },
    { name: "HOST_FALLBACK", patterns: HOST_FALLBACK_MESSAGE_PATTERNS },
    { name: "SUCCESS_CLAIM", patterns: SUCCESS_CLAIM_MESSAGE_PATTERNS },
    { name: "IMPATIENCE", patterns: IMPATIENCE_MESSAGE_PATTERNS }
  ];
  for (const { name, patterns: pts } of patterns) {
    for (const p of pts) {
      if (p.test(message)) {
        matchedPatterns.push(`${name}: ${p}`);
      }
    }
  }
  const shouldBlock = matchedPatterns.length > 0;
  return {
    category: shouldBlock ? "DERAILMENT" : "LEGITIMATE",
    confidence: matchedPatterns.length > 0 ? 1 : 0,
    shouldBlock,
    matchedPatterns
  };
}
function checkToolLayer(tool, args) {
  if (DANGEROUS_TOOLS.has(tool)) {
    return {
      blocked: true,
      layer: "TOOL",
      reason: `L0: Dangerous tool '${tool}' blocked - requires explicit override`,
      pattern: "DANGEROUS_TOOLS"
    };
  }
  const command = extractCommand(args);
  if (command && tool === "terminal") {
    if (isTheatrical(command)) {
      return {
        blocked: true,
        layer: "TOOL",
        reason: "L1: Theatrical verification - counting theater blocked",
        pattern: "grep | wc pattern"
      };
    }
  }
  if (command && FAKE_TEST_PATTERNS.some((p) => p.test(command))) {
    return {
      blocked: true,
      layer: "TOOL",
      reason: "L2: Fake test runner - test frameworks must run through OpenCode",
      pattern: "jest/vitest/npm test"
    };
  }
  if (command && WRONG_CONTAINER_PATTERNS.some((p) => p.test(command))) {
    return {
      blocked: true,
      layer: "TOOL",
      reason: "L4: Wrong container - hallucinated opencode container commands",
      pattern: "opencode container"
    };
  }
  return { blocked: false, layer: "TOOL" };
}
function checkMessageLayer(message) {
  const intent = classifyMessageIntent(message);
  if (intent.shouldBlock) {
    return {
      blocked: true,
      layer: "MESSAGE",
      reason: `L8: Message derailment detected (${intent.category})`,
      pattern: `confidence: ${intent.confidence.toFixed(2)}`
    };
  }
  return { blocked: false, layer: "MESSAGE" };
}
function extractCommand(args) {
  if (typeof args.command === "string") return args.command;
  if (typeof args.cmd === "string") return args.cmd;
  return null;
}
var TwoLayerGuardian = class {
  initialized = false;
  initialize() {
    this.initialized = true;
  }
  isInitialized() {
    return this.initialized;
  }
  checkTool(tool, args) {
    if (!this.initialized) {
      return { blocked: false, layer: "TOOL" };
    }
    return checkToolLayer(tool, args);
  }
  checkMessage(message) {
    if (!this.initialized) {
      return { blocked: false, layer: "MESSAGE" };
    }
    return checkMessageLayer(message);
  }
  check(input) {
    if (input.message !== void 0) {
      return this.checkMessage(input.message);
    }
    if (input.tool !== void 0) {
      return this.checkTool(input.tool, input.args || {});
    }
    return { blocked: false, layer: "TOOL" };
  }
};
function createToolGuardianHook(guardian) {
  return async (input) => {
    const { tool } = input;
    const args = input.args || {};
    const result = guardian.checkTool(tool, args);
    if (result.blocked) {
      throw new Error(`[TWO-LAYER-GUARDIAN] ${result.reason}`);
    }
  };
}
function createMessageGuardianHook(guardian) {
  return async (input) => {
    const { message } = input;
    const result = guardian.checkMessage(message);
    if (result.blocked) {
      throw new Error(`[TWO-LAYER-GUARDIAN] ${result.reason}`);
    }
  };
}

// src/brains/system/gate-manager.ts
import * as fs from "fs";
var GATE_DEFINITIONS = {
  PLAN: {
    gateId: "PLAN",
    description: "Planning complete, ready to build",
    planningBrain: {
      completed: ["T2_master_loaded", "T1_generated", "tasks_decomposed", "domain_designated"],
      evidence: [
        { path: "SPEC.md", type: "file" },
        { path: "plan.md", type: "file" }
      ]
    },
    executionBrain: {
      completed: ["containers_ready", "clusters_available"],
      evidence: []
    },
    systemBrain: {
      completed: ["firewall_initialized", "gate_manager_ready"],
      evidence: []
    }
  },
  BUILD: {
    gateId: "BUILD",
    description: "Build execution in progress",
    planningBrain: {
      completed: ["context_injected"],
      evidence: []
    },
    executionBrain: {
      completed: ["tasks_spawned", "alpha_build_started", "progress_tracked"],
      evidence: []
    },
    systemBrain: {
      completed: ["orchestration_theater_blocked", "false_completion_blocked"],
      evidence: []
    }
  },
  TEST: {
    gateId: "TEST",
    description: "Testing phase - container tests required",
    planningBrain: {
      completed: ["test_plan_generated"],
      evidence: []
    },
    executionBrain: {
      completed: ["build_complete", "outputs_retrieved", "test_task_spawned"],
      evidence: [
        { path: "dist/index.js", type: "file" }
      ]
    },
    systemBrain: {
      completed: ["container_test_required", "test_verification_active"],
      evidence: [
        {
          path: "ContainerTestResult.json",
          type: "file",
          check: "passRate >= 0.96"
        }
      ]
    }
  },
  VERIFY: {
    gateId: "VERIFY",
    description: "Verification phase - integration tests",
    planningBrain: {
      completed: ["verification_plan_generated"],
      evidence: []
    },
    executionBrain: {
      completed: ["integration_tests_spawned"],
      evidence: []
    },
    systemBrain: {
      completed: ["verification_patterns_active"],
      evidence: [
        { path: "IntegrationTestResult.json", type: "file" }
      ]
    }
  },
  AUDIT: {
    gateId: "AUDIT",
    description: "Code review and audit",
    planningBrain: {
      completed: ["audit_criteria_defined"],
      evidence: []
    },
    executionBrain: {
      completed: ["all_outputs_merged"],
      evidence: []
    },
    systemBrain: {
      completed: ["security_scan_passed", "linter_passed"],
      evidence: [
        { path: "AuditReport.json", type: "file" }
      ]
    }
  },
  DELIVERY: {
    gateId: "DELIVERY",
    description: "Final delivery - ship package",
    planningBrain: {
      completed: ["delivery_package_prepared"],
      evidence: [
        { path: "ship-package/", type: "directory" }
      ]
    },
    executionBrain: {
      completed: ["all_tasks_complete", "outputs_verified"],
      evidence: []
    },
    systemBrain: {
      completed: ["all_gates_passed", "ship_package_verified"],
      evidence: [
        { path: ".shark/evidence/ship/ContainerTestResult.json", type: "file" }
      ]
    }
  }
};
var GateManager = class {
  currentGate = "PLAN";
  brainStates = /* @__PURE__ */ new Map();
  getCurrentGate() {
    return this.currentGate;
  }
  setCurrentGate(gate) {
    this.currentGate = gate;
  }
  registerCompletion(brainId, criterion) {
    if (!this.brainStates.has(brainId)) {
      this.brainStates.set(brainId, /* @__PURE__ */ new Set());
    }
    this.brainStates.get(brainId).add(criterion);
  }
  getCompleted(brainId) {
    return Array.from(this.brainStates.get(brainId) || []);
  }
  evaluateGateEntry(gateId) {
    const criteria = GATE_DEFINITIONS[gateId];
    const planningResult = this.evaluateBrainCriteria(
      "planning",
      criteria.planningBrain
    );
    const executionResult = this.evaluateBrainCriteria(
      "execution",
      criteria.executionBrain
    );
    const systemResult = this.evaluateBrainCriteria(
      "system",
      criteria.systemBrain
    );
    const allPassed = planningResult.passed && executionResult.passed && systemResult.passed;
    return {
      gateId,
      allPassed,
      details: {
        planning: planningResult,
        execution: executionResult,
        system: systemResult
      },
      blockers: this.getBlockers(criteria, planningResult, executionResult, systemResult)
    };
  }
  evaluateBrainCriteria(brainId, criteria) {
    const state = this.brainStates.get(brainId) || /* @__PURE__ */ new Set();
    const completed = criteria.completed.filter((c) => state.has(c));
    const missing = criteria.completed.filter((c) => !state.has(c));
    const evidenceResults = criteria.evidence.map((e) => ({
      path: e.path,
      exists: fs.existsSync(e.path),
      checkPassed: e.check ? this.evaluateCheck(e.path, e.check) : true
    }));
    const evidencePassed = evidenceResults.every((e) => e.exists && e.checkPassed);
    return {
      brainId,
      passed: missing.length === 0 && evidencePassed,
      completed,
      missing,
      evidenceResults
    };
  }
  evaluateCheck(filePath, check) {
    if (!fs.existsSync(filePath)) return false;
    if (check.includes("passRate")) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);
        const passRate = data.passRate ?? 0;
        const match = check.match(/passRate\s*>=\s*([\d.]+)/);
        if (match) {
          return passRate >= parseFloat(match[1]);
        }
      } catch {
        return false;
      }
    }
    return true;
  }
  getBlockers(criteria, planning, execution, system) {
    const blockers = [];
    for (const m of planning.missing) {
      blockers.push(`planning: ${m} not complete`);
    }
    for (const e of planning.evidenceResults.filter((e2) => !e2.checkPassed)) {
      blockers.push(`planning: evidence ${e.path} failed check`);
    }
    for (const m of execution.missing) {
      blockers.push(`execution: ${m} not complete`);
    }
    for (const e of execution.evidenceResults.filter((e2) => !e2.checkPassed)) {
      blockers.push(`execution: evidence ${e.path} failed check`);
    }
    for (const m of system.missing) {
      blockers.push(`system: ${m} not complete`);
    }
    for (const e of system.evidenceResults.filter((e2) => !e2.checkPassed)) {
      blockers.push(`system: evidence ${e.path} failed check`);
    }
    return blockers;
  }
  async advanceGate(gateId) {
    const result = this.evaluateGateEntry(gateId);
    if (!result.allPassed) {
      console.log(`Gate ${gateId} blocked:`);
      for (const blocker of result.blockers) {
        console.log(`  - ${blocker}`);
      }
      return false;
    }
    const gateOrder = ["PLAN", "BUILD", "TEST", "VERIFY", "AUDIT", "DELIVERY"];
    const currentIndex = gateOrder.indexOf(gateId);
    if (currentIndex < gateOrder.length - 1) {
      this.currentGate = gateOrder[currentIndex + 1];
    }
    return true;
  }
};

// src/brains/system/compaction-manager.ts
import * as fs2 from "fs";
import * as path from "path";
var TokenBudgetMonitor = class {
  budget;
  contextPriority = /* @__PURE__ */ new Map();
  criticalContext = /* @__PURE__ */ new Set();
  lowPriorityContext = /* @__PURE__ */ new Set();
  constructor(maxTokens = 1e5) {
    this.budget = {
      maxTokens,
      currentTokens: 0,
      // OPENCODE AUTO-COMPACTION FIRES AT 85%
      // We want to clean up BEFORE this happens
      warningThreshold: 0.65,
      // 65% - Start proactive cleanup
      preCompactionThreshold: 0.75,
      // 75% - Pre-compaction export
      compactionAnchor: 0.85
      // 85% - AUTO-COMPACTION (THE ANCHOR)
    };
  }
  updateTokens(tokens) {
    this.budget.currentTokens = tokens;
  }
  getTokenRatio() {
    return this.budget.currentTokens / this.budget.maxTokens;
  }
  shouldWarn() {
    return this.getTokenRatio() >= this.budget.warningThreshold;
  }
  shouldPreCompaction() {
    return this.getTokenRatio() >= this.budget.preCompactionThreshold;
  }
  shouldAutoCompact() {
    return this.getTokenRatio() >= this.budget.compactionAnchor;
  }
  registerContext(id, priority) {
    this.contextPriority.set(
      id,
      priority === "critical" ? 4 : priority === "high" ? 3 : priority === "medium" ? 2 : 1
    );
    if (priority === "critical") {
      this.criticalContext.add(id);
    }
    if (priority === "low") {
      this.lowPriorityContext.add(id);
    }
  }
  getContextToRemove(targetRatio = 0.6) {
    const toRemove = [];
    const targetTokens = this.budget.maxTokens * targetRatio;
    let current = this.budget.currentTokens;
    if (current <= targetTokens) return toRemove;
    const sorted = Array.from(this.contextPriority.entries()).filter(([id]) => !this.criticalContext.has(id)).sort((a, b) => a[1] - b[1]);
    for (const [id] of sorted) {
      if (current <= targetTokens) break;
      toRemove.push(id);
      current -= 1e3;
    }
    return toRemove;
  }
};
var PreCompactionExporter = class {
  exportDir;
  lastExport = null;
  constructor(exportDir = "/tmp/kraken-compaction") {
    this.exportDir = exportDir;
    this.ensureDir();
  }
  ensureDir() {
    if (!fs2.existsSync(this.exportDir)) {
      fs2.mkdirSync(this.exportDir, { recursive: true });
    }
  }
  async export(event) {
    const exportId = `pre-compaction-${Date.now()}`;
    const exportPath = path.join(this.exportDir, exportId);
    fs2.mkdirSync(exportPath, { recursive: true });
    this.lastExport = event;
    const lastLines = event.chatContent.split("\n").slice(-100).join("\n");
    const compactionExport = {
      exportId,
      exportPath,
      timestamp: event.timestamp,
      chatExport: {
        lines: event.chatHistoryLines,
        content: event.chatContent,
        lastLines
      },
      contextExport: {
        files: {},
        activeFiles: [],
        priorityFiles: []
      },
      decisionsExport: {
        count: event.decisionPoints.length,
        points: event.decisionPoints,
        latestOutcome: event.decisionPoints[0]?.outcome
      },
      brainStateExport: {
        currentGate: event.brainState["currentGate"] || "UNKNOWN",
        completedTasks: event.brainState["completedTasks"] || [],
        activeTask: event.brainState["activeTask"],
        injectedContext: [],
        nextSteps: event.brainState["nextSteps"] || ""
      }
    };
    fs2.writeFileSync(
      path.join(exportPath, "manifest.json"),
      JSON.stringify(compactionExport, null, 2)
    );
    fs2.writeFileSync(
      path.join(exportPath, "chat-export.txt"),
      event.chatContent
    );
    fs2.writeFileSync(
      path.join(exportPath, "INJECTION.md"),
      this.renderInjectionFile(compactionExport)
    );
    return compactionExport;
  }
  hasRecentExport() {
    if (!this.lastExport) return false;
    const age = Date.now() - this.lastExport.timestamp.getTime();
    return age < 6e4;
  }
  getLastExport() {
    return this.lastExport;
  }
  getPreCompactionData() {
    if (!this.lastExport) return null;
    return {
      chatContent: this.lastExport.chatContent,
      phase: this.lastExport.currentPhase,
      decisions: this.lastExport.decisionPoints,
      state: this.lastExport.brainState
    };
  }
  renderInjectionFile(comp) {
    return `---
# KRAKEN V2.0 \u2014 COMPACTION RECOVERY INJECTION
---

## STREAM ANCHOR

**Last active phase:** ${comp.brainStateExport.currentGate}
**Last decision:** ${comp.decisionsExport.points[0]?.description || "N/A"}
**Time of compaction:** ${comp.timestamp.toISOString()}

---

## SITUATION SUMMARY

**Phase:** ${comp.decisionsExport.points[0]?.type || "Unknown"}

**Recent Decisions:**
${comp.decisionsExport.points.slice(0, 5).map(
      (p, i) => `${i + 1}. [${p.type}] ${p.description}`
    ).join("\n")}

**Last Outcome:** ${comp.decisionsExport.latestOutcome || "In progress"}

---

## NEXT ACTION

**Current gate:** ${comp.brainStateExport.currentGate}
**Active task:** ${comp.brainStateExport.activeTask || "None"}

**Immediate next:** ${comp.brainStateExport.nextSteps || "Continue from where we left off"}

---

## RECENT CHAT (LAST 100 LINES)

${comp.chatExport.lastLines}

---

*Generated by Kraken V2.0 Compaction Manager*
`;
  }
};
var PostCompactionSynthesizer = class {
  async synthesize(preExport, currentContextFiles) {
    const decisions = preExport.decisionsExport;
    const brainState = preExport.brainStateExport;
    const criticalFiles = [];
    for (const filePath of preExport.contextExport.priorityFiles || []) {
      if (currentContextFiles.has(filePath)) {
        criticalFiles.push({
          path: filePath,
          content: currentContextFiles.get(filePath),
          reason: "priority_file"
        });
      }
    }
    const injection = {
      version: "2.0",
      synthesizedAt: /* @__PURE__ */ new Date(),
      preCompactionExportId: preExport.exportId,
      streamAnchor: this.buildStreamAnchor(decisions, brainState),
      situationSummary: this.buildSituationSummary(preExport),
      criticalFiles,
      recentChat: preExport.chatExport.lastLines,
      decisionContext: this.buildDecisionContext(decisions),
      nextSteps: this.buildNextSteps(brainState),
      brainState
    };
    return injection;
  }
  buildStreamAnchor(decisions, state) {
    const lastDecision = decisions.points[0];
    return `
================================================================================
STREAM OF CONSCIOUSNESS ANCHOR \u2014 COMPACTION RECOVERY
================================================================================

Last active phase: ${state.currentGate}
Last decision: ${lastDecision?.description || "N/A"}
Time of compaction: ${(/* @__PURE__ */ new Date()).toISOString()}

To resume execution: Continue from the next step below.
Review the critical files and decision chain for context.

================================================================================
`;
  }
  buildSituationSummary(comp) {
    return `
## WHERE WE WERE

**Phase:** ${comp.decisionsExport.points[0]?.type || "Unknown"}

**Recent Decisions:**
${comp.decisionsExport.points.slice(0, 5).map(
      (p, i) => `${i + 1}. [${p.type}] ${p.description}`
    ).join("\n")}

**Last Outcome:** ${comp.decisionsExport.latestOutcome || "In progress"}
`;
  }
  buildDecisionContext(decisions) {
    if (decisions.points.length === 0) {
      return "No significant decisions captured.";
    }
    return `
## DECISION CHAIN

${decisions.points.map((p, i) => `
### Decision ${i + 1}: ${p.type.toUpperCase()}
**What:** ${p.description}
**Files:** ${p.contextFiles.join(", ") || "None"}
${p.outcome ? `**Outcome:** ${p.outcome}` : "**Status:** In progress"}
`).join("\n")}
`;
  }
  buildNextSteps(state) {
    return `
## NEXT ACTION

**Current gate:** ${state.currentGate}
**Active task:** ${state.activeTask || "None"}

**Immediate next:** ${state.nextSteps || "Continue from where we left off"}
`;
  }
};
var CompactionManager = class {
  tokenMonitor;
  preExporter;
  synthesizer;
  lastCompactionProcessed = 0;
  constructor() {
    this.tokenMonitor = new TokenBudgetMonitor();
    this.preExporter = new PreCompactionExporter();
    this.synthesizer = new PostCompactionSynthesizer();
  }
  updateTokens(tokens) {
    this.tokenMonitor.updateTokens(tokens);
  }
  shouldTriggerPreCompaction() {
    return this.tokenMonitor.shouldPreCompaction() && !this.preExporter.hasRecentExport();
  }
  shouldProcessPostCompaction() {
    const now = Date.now();
    return now - this.lastCompactionProcessed > 6e4;
  }
  async triggerPreCompaction(chatHistoryLines, phase, decisionPoints, brainState, chatContent = "") {
    const event = {
      timestamp: /* @__PURE__ */ new Date(),
      trigger: "token_threshold",
      chatHistoryLines,
      chatContent,
      currentPhase: phase,
      decisionPoints,
      brainState
    };
    return this.preExporter.export(event);
  }
  getPreCompactionData() {
    return this.preExporter.getPreCompactionData();
  }
  async synthesizeRecovery(recoveryData, currentContextFiles) {
    const comp = {
      exportId: `recovery-${Date.now()}`,
      exportPath: "",
      timestamp: /* @__PURE__ */ new Date(),
      chatExport: {
        lines: recoveryData.chatContent.split("\n").length,
        content: recoveryData.chatContent,
        lastLines: recoveryData.chatContent.split("\n").slice(-100).join("\n")
      },
      contextExport: {
        files: Object.fromEntries(currentContextFiles),
        activeFiles: [],
        priorityFiles: []
      },
      decisionsExport: {
        count: recoveryData.decisions.length,
        points: recoveryData.decisions,
        latestOutcome: recoveryData.decisions[0]?.outcome
      },
      brainStateExport: {
        currentGate: recoveryData.state["currentGate"] || "UNKNOWN",
        completedTasks: recoveryData.state["completedTasks"] || [],
        activeTask: recoveryData.state["activeTask"] || "",
        injectedContext: [],
        nextSteps: recoveryData.state["nextSteps"] || ""
      }
    };
    return this.synthesizer.synthesize(comp, currentContextFiles);
  }
  async synthesizePostCompaction(currentContextFiles) {
    const lastExport = this.preExporter.getLastExport();
    if (!lastExport) return null;
    this.lastCompactionProcessed = Date.now();
    const comp = {
      exportId: `recovery-${Date.now()}`,
      exportPath: "",
      timestamp: /* @__PURE__ */ new Date(),
      chatExport: {
        lines: lastExport.chatHistoryLines,
        content: "",
        lastLines: ""
      },
      contextExport: {
        files: Object.fromEntries(currentContextFiles),
        activeFiles: [],
        priorityFiles: []
      },
      decisionsExport: {
        count: lastExport.decisionPoints.length,
        points: lastExport.decisionPoints
      },
      brainStateExport: {
        currentGate: lastExport.brainState["currentGate"] || "UNKNOWN",
        completedTasks: lastExport.brainState["completedTasks"] || [],
        activeTask: lastExport.brainState["activeTask"],
        injectedContext: [],
        nextSteps: lastExport.brainState["nextSteps"] || ""
      }
    };
    return this.synthesizer.synthesize(comp, currentContextFiles);
  }
  registerContext(id, priority) {
    this.tokenMonitor.registerContext(id, priority);
  }
  getContextToRemove() {
    return this.tokenMonitor.getContextToRemove();
  }
};

// src/brains/system/system-brain.ts
var SystemBrain = class {
  initialized = false;
  guardian;
  gateManager;
  compactionManager;
  recentDecisionPoints = [];
  completedTasks = [];
  activeTask = "";
  constructor() {
    this.guardian = new TwoLayerGuardian();
    this.gateManager = new GateManager();
    this.compactionManager = new CompactionManager();
  }
  initialize() {
    this.guardian.initialize();
    this.initialized = true;
    console.log("[SystemBrain] Initialized with Two-Layer Guardian + Compaction Manager");
  }
  isInitialized() {
    return this.initialized;
  }
  // =========================================================================
  // DECISION & TASK TRACKING
  // =========================================================================
  recordDecision(decision) {
    this.recentDecisionPoints.unshift(decision);
    if (this.recentDecisionPoints.length > 20) {
      this.recentDecisionPoints.pop();
    }
  }
  getRecentDecisionPoints() {
    return [...this.recentDecisionPoints];
  }
  recordTaskStart(taskId) {
    this.activeTask = taskId;
  }
  recordTaskComplete(taskId) {
    this.completedTasks.push(taskId);
    if (this.activeTask === taskId) {
      this.activeTask = "";
    }
  }
  getCompletedTasks() {
    return [...this.completedTasks];
  }
  getActiveTask() {
    return this.activeTask;
  }
  // =========================================================================
  // TWO-LAYER GUARDIAN
  // =========================================================================
  checkTool(tool, args) {
    const result = this.guardian.checkTool(tool, args);
    if (result.blocked) {
      throw new Error(`[SystemBrain] ${result.reason}`);
    }
  }
  checkMessage(message) {
    const result = this.guardian.checkMessage(message);
    if (result.blocked) {
      throw new Error(`[SystemBrain] ${result.reason}`);
    }
  }
  // =========================================================================
  // GATE MANAGEMENT
  // =========================================================================
  getCurrentGate() {
    return this.gateManager.getCurrentGate();
  }
  registerBrainCompletion(brainId, criterion) {
    this.gateManager.registerCompletion(brainId, criterion);
  }
  evaluateGateEntry(gateId) {
    return this.gateManager.evaluateGateEntry(gateId);
  }
  tryAdvanceGate(gateId) {
    return this.gateManager.advanceGate(gateId);
  }
  // =========================================================================
  // COMPACTION MANAGEMENT
  // =========================================================================
  updateTokenCount(tokens) {
    this.compactionManager.updateTokens(tokens);
  }
  shouldTriggerPreCompaction() {
    return this.compactionManager.shouldTriggerPreCompaction();
  }
  async triggerPreCompaction(chatContent, phase, decisionPoints, brainState) {
    const lines = chatContent.split("\n").length;
    await this.compactionManager.triggerPreCompaction(
      lines,
      phase,
      decisionPoints,
      brainState
    );
  }
  checkForRecoveryData() {
    return this.compactionManager.getPreCompactionData();
  }
  async synthesizeRecovery(recoveryData, currentFiles) {
    return this.compactionManager.synthesizeRecovery(recoveryData, currentFiles);
  }
  async synthesizePostCompaction(contextFiles) {
    const injection = await this.compactionManager.synthesizePostCompaction(contextFiles);
    return injection ? { injection } : null;
  }
  registerContextForCompaction(id, priority) {
    this.compactionManager.registerContext(id, priority);
  }
  // =========================================================================
  // HOOKS
  // =========================================================================
  createHooks() {
    return {
      "tool.execute.before": createToolGuardianHook(this.guardian),
      "chat.message": createMessageGuardianHook(this.guardian)
    };
  }
};
var systemBrainInstance = null;
function getSystemBrain() {
  if (!systemBrainInstance) {
    systemBrainInstance = new SystemBrain();
  }
  return systemBrainInstance;
}
function createSystemBrain() {
  const brain = new SystemBrain();
  systemBrainInstance = brain;
  return brain;
}

// src/shared/output-verifier.ts
import * as fs3 from "fs";
var OutputVerifier = class {
  checkpoints = /* @__PURE__ */ new Map();
  registerOutputs(taskId, outputs) {
    const checkpoints = outputs.map((out) => ({
      taskId,
      containerPath: out.containerPath,
      hostPath: out.hostPath,
      type: out.type,
      required: out.required,
      retrieved: false,
      verified: false
    }));
    this.checkpoints.set(taskId, checkpoints);
  }
  getCheckpoints(taskId) {
    return this.checkpoints.get(taskId) ?? [];
  }
  async claimRetrieved(taskId, hostPaths) {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) {
      throw new Error(`No checkpoints registered for task ${taskId}`);
    }
    for (const hostPath of hostPaths) {
      const checkpoint = checkpoints.find((c) => c.hostPath === hostPath);
      if (!checkpoint) {
        throw new Error(
          `L2_OUTPUT_NOT_DECLARED: ${hostPath} not in checkpoint registry`
        );
      }
      if (!fs3.existsSync(hostPath)) {
        throw new Error(
          `L2_OUTPUT_NOT_RETRIEVED: ${checkpoint.containerPath} \u2192 ${hostPath}`
        );
      }
      checkpoint.retrieved = true;
      checkpoint.verified = true;
      checkpoint.verifiedAt = /* @__PURE__ */ new Date();
    }
  }
  canComplete(taskId) {
    const checkpoints = this.checkpoints.get(taskId);
    if (!checkpoints) return false;
    return checkpoints.filter((c) => c.required).every((c) => c.verified);
  }
  collectEvidence(taskId) {
    const checkpoints = this.checkpoints.get(taskId) ?? [];
    return {
      taskId,
      checkpointCount: checkpoints.length,
      verifiedCount: checkpoints.filter((c) => c.verified).length,
      checkpoints: checkpoints.map((c) => ({
        containerPath: c.containerPath,
        hostPath: c.hostPath,
        verified: c.verified,
        verifiedAt: c.verifiedAt?.toISOString()
      })),
      canComplete: this.canComplete(taskId)
    };
  }
  clearTask(taskId) {
    this.checkpoints.delete(taskId);
  }
};

// src/brains/execution/override-handler.ts
var OverrideHandler = class {
  pendingCommands = /* @__PURE__ */ new Map();
  outputVerifier;
  constructor(outputVerifier) {
    this.outputVerifier = outputVerifier;
  }
  // =========================================================================
  // COMMAND CREATION (for Execution Brain to send)
  // =========================================================================
  createAbortCommand(taskId, reason, priority = "critical") {
    return {
      id: this.generateId(),
      type: "OVERRIDE",
      action: "ABORT",
      target: { taskId },
      payload: { reason },
      priority,
      requiresAck: true,
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  createClaimCompleteCommand(taskId, evidence, verifyOutputs = true) {
    return {
      id: this.generateId(),
      type: "OVERRIDE",
      action: "CLAIM_COMPLETE",
      target: { taskId },
      payload: { evidence, verifyOutputs },
      constraints: {
        requiresEvidence: evidence,
        evidenceCheck: "passRate >= 0.96"
      },
      priority: "critical",
      requiresAck: true,
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  createRetrieveOutputsCommand(taskId, timeout = 3e4) {
    return {
      id: this.generateId(),
      type: "OVERRIDE",
      action: "RETRIEVE_OUTPUTS",
      target: { taskId },
      payload: {},
      constraints: { timeout },
      priority: "high",
      requiresAck: true,
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  createReassignCommand(taskId, targetCluster, reason) {
    return {
      id: this.generateId(),
      type: "OVERRIDE",
      action: "REASSIGN",
      target: { taskId },
      payload: { targetCluster, reassignReason: reason },
      priority: "high",
      requiresAck: true,
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  // =========================================================================
  // COMMAND EXECUTION (for Subagent-Manager to handle)
  // =========================================================================
  async executeCommand(command) {
    this.pendingCommands.set(command.id, command);
    try {
      if (!this.validateCommand(command)) {
        return this.createErrorResponse(
          command.id,
          "INVALID_COMMAND",
          "Malformed command structure",
          false
        );
      }
      if (command.constraints?.requiresEvidence) {
        for (const path3 of command.constraints.requiresEvidence) {
          if (!this.checkEvidenceExists(path3)) {
            return this.createErrorResponse(
              command.id,
              "CONSTRAINT_NOT_MET",
              `Required evidence not found: ${path3}`,
              true
            );
          }
        }
      }
      let result;
      switch (command.action) {
        case "ABORT":
          result = await this.executeAbort(command);
          break;
        case "CLAIM_COMPLETE":
          result = await this.executeClaimComplete(command);
          break;
        case "RETRIEVE_OUTPUTS":
          result = await this.executeRetrieveOutputs(command);
          break;
        case "REASSIGN":
          result = await this.executeReassign(command);
          break;
        default:
          return this.createErrorResponse(
            command.id,
            "UNKNOWN_ACTION",
            `Unknown action: ${command.action}`,
            false
          );
      }
      return {
        commandId: command.id,
        status: "completed",
        result,
        respondedAt: /* @__PURE__ */ new Date()
      };
    } catch (error) {
      return this.createErrorResponse(
        command.id,
        "EXECUTION_FAILED",
        error instanceof Error ? error.message : "Unknown error",
        true
      );
    } finally {
      this.pendingCommands.delete(command.id);
    }
  }
  validateCommand(command) {
    if (!command.id || !command.type || !command.action) return false;
    if (command.type !== "OVERRIDE") return false;
    if (!command.target || !command.target.taskId && !command.target.brainId) return false;
    return true;
  }
  checkEvidenceExists(path3) {
    return path3.length > 0;
  }
  // =========================================================================
  // ACTION EXECUTORS
  // =========================================================================
  async executeAbort(command) {
    const { taskId } = command.target;
    const { reason, force } = command.payload;
    console.log(`[OverrideHandler] ABORT task ${taskId}: ${reason}`);
    return { action: "ABORT" };
  }
  async executeClaimComplete(command) {
    const { taskId } = command.target;
    const { evidence, verifyOutputs } = command.payload;
    if (verifyOutputs) {
      if (!this.outputVerifier.canComplete(taskId)) {
        throw new Error("CONSTRAINT_NOT_MET: Not all outputs verified");
      }
    }
    return {
      action: "CLAIM_COMPLETE",
      evidence: evidence?.map((e) => ({ path: e }))
    };
  }
  async executeRetrieveOutputs(command) {
    const { taskId } = command.target;
    const checkpoints = this.outputVerifier.getCheckpoints(taskId);
    const hostPaths = checkpoints.map((c) => c.hostPath);
    console.log(`[OverrideHandler] RETRIEVE_OUTPUTS for ${taskId}: ${hostPaths.length} files`);
    return {
      action: "RETRIEVE_OUTPUTS",
      outputs: hostPaths
    };
  }
  async executeReassign(command) {
    const { taskId } = command.target;
    const { targetCluster, reassignReason } = command.payload;
    console.log(`[OverrideHandler] REASSIGN ${taskId} to ${targetCluster}: ${reassignReason}`);
    return {
      action: "REASSIGN",
      reassignedTo: targetCluster
    };
  }
  // =========================================================================
  // RESPONSE HELPERS
  // =========================================================================
  createErrorResponse(commandId, code, message, canRetry) {
    return {
      commandId,
      status: "failed",
      error: { code, message, canRetry },
      respondedAt: /* @__PURE__ */ new Date()
    };
  }
  generateId() {
    return `ovr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
};

// src/brains/execution/execution-brain.ts
var ExecutionBrain = class {
  initialized = false;
  outputVerifier;
  overrideHandler;
  activeTasks = /* @__PURE__ */ new Map();
  constructor() {
    this.outputVerifier = new OutputVerifier();
    this.overrideHandler = new OverrideHandler(this.outputVerifier);
  }
  initialize() {
    this.initialized = true;
    console.log("[ExecutionBrain] Initialized with Override Handler + Output Verifier");
  }
  isInitialized() {
    return this.initialized;
  }
  // =========================================================================
  // OUTPUT VERIFICATION (V2.0 KEY FEATURE)
  // =========================================================================
  registerTaskOutputs(taskId, outputs) {
    this.outputVerifier.registerOutputs(taskId, outputs);
    console.log(`[ExecutionBrain] Registered ${outputs.length} outputs for task ${taskId}`);
  }
  async claimOutputsRetrieved(taskId, hostPaths) {
    await this.outputVerifier.claimRetrieved(taskId, hostPaths);
    console.log(`[ExecutionBrain] Verified ${hostPaths.length} outputs for task ${taskId}`);
  }
  canCompleteTask(taskId) {
    return this.outputVerifier.canComplete(taskId);
  }
  getOutputEvidence(taskId) {
    return this.outputVerifier.collectEvidence(taskId);
  }
  // =========================================================================
  // OVERRIDE COMMANDS (V2.0 KEY FEATURE)
  // =========================================================================
  sendOverride(params) {
    const command = this.overrideHandler.createAbortCommand(
      params.target.taskId || "unknown",
      params.payload?.reason || "Override command"
    );
    return command;
  }
  async abortTask(taskId, reason) {
    const command = this.overrideHandler.createAbortCommand(taskId, reason);
    const response = await this.overrideHandler.executeCommand(command);
    if (response.status === "failed") {
      throw new Error(`Abort failed: ${response.error?.message}`);
    }
    this.activeTasks.delete(taskId);
  }
  async enforceOutputRetrieval(taskId) {
    const command = this.overrideHandler.createRetrieveOutputsCommand(taskId);
    const response = await this.overrideHandler.executeCommand(command);
    if (response.status === "failed") {
      throw new Error(`Output retrieval failed: ${response.error?.message}`);
    }
  }
  async verifyCompletion(taskId, evidencePaths) {
    const command = this.overrideHandler.createClaimCompleteCommand(
      taskId,
      evidencePaths,
      true
    );
    const response = await this.overrideHandler.executeCommand(command);
    if (response.status === "failed") {
      throw new Error(`Completion verification failed: ${response.error?.message}`);
    }
  }
  // =========================================================================
  // TASK MANAGEMENT
  // =========================================================================
  registerTask(taskId, cluster) {
    this.activeTasks.set(taskId, { cluster, status: "running" });
  }
  getTaskStatus(taskId) {
    return this.activeTasks.get(taskId);
  }
  completeTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = "completed";
    }
  }
  // =========================================================================
  // SUPERVISION
  // =========================================================================
  async superviseTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;
    if (task.status === "completed" && !this.canCompleteTask(taskId)) {
      await this.enforceOutputRetrieval(taskId);
    }
  }
};
var executionBrainInstance = null;
function createExecutionBrain() {
  if (!executionBrainInstance) {
    executionBrainInstance = new ExecutionBrain();
  }
  return executionBrainInstance;
}
function getExecutionBrain() {
  if (!executionBrainInstance) {
    executionBrainInstance = new ExecutionBrain();
  }
  return executionBrainInstance;
}

// src/brains/planning/planning-brain.ts
var PlanningBrain = class {
  initialized = false;
  t2MasterLoaded = false;
  t1Generated = false;
  tasksDecomposed = false;
  domainsDesignated = false;
  initialize() {
    this.initialized = true;
    console.log("[PlanningBrain] Initialized");
  }
  isInitialized() {
    return this.initialized;
  }
  // =========================================================================
  // T2 MASTER CONTEXT
  // =========================================================================
  async loadT2Master() {
    console.log("[PlanningBrain] Loading T2 Master context...");
    await this.delay(100);
    this.t2MasterLoaded = true;
    console.log("[PlanningBrain] T2 Master loaded");
  }
  isT2MasterLoaded() {
    return this.t2MasterLoaded;
  }
  // =========================================================================
  // T1 DYNAMIC GENERATION
  // =========================================================================
  async generateT1(specPath = "SPEC.md") {
    if (!this.t2MasterLoaded) {
      throw new Error("T2 Master must be loaded before T1 generation");
    }
    console.log("[PlanningBrain] Generating T1 from SPEC.md...");
    const t1 = {
      tasks: [],
      context: {
        specPath,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        phases: ["PLAN", "BUILD", "TEST", "VERIFY", "AUDIT", "DELIVERY"]
      }
    };
    this.t1Generated = true;
    console.log("[PlanningBrain] T1 generated");
    return t1;
  }
  isT1Generated() {
    return this.t1Generated;
  }
  // =========================================================================
  // TASK DECOMPOSITION
  // =========================================================================
  async decomposeTasks(t1) {
    console.log("[PlanningBrain] Decomposing tasks for cluster assignment...");
    const decomposed = t1.tasks.map((task) => ({
      ...task,
      // V2.0: Output declarations are REQUIRED
      outputs: task.outputs || [],
      cluster: this.designateCluster(task.type)
    }));
    this.tasksDecomposed = true;
    console.log("[PlanningBrain] Tasks decomposed");
    return decomposed;
  }
  isTasksDecomposed() {
    return this.tasksDecomposed;
  }
  // =========================================================================
  // DOMAIN DESIGNATION
  // =========================================================================
  /**
   * Designate cluster based on task type
   * V2.0: Mechanical - no guesswork
   */
  designateCluster(taskType) {
    const designations = {
      "build": "alpha",
      "feature": "alpha",
      "implement": "alpha",
      "from-scratch": "alpha",
      "debug": "beta",
      "fix": "beta",
      "refactor": "beta",
      "patch": "beta",
      "analyze": "beta",
      "test": "gamma",
      "verify": "gamma",
      "audit": "gamma",
      "integration": "gamma"
    };
    const cluster = designations[taskType.toLowerCase()] || "alpha";
    console.log(`[PlanningBrain] Task type "${taskType}" \u2192 Cluster ${cluster}`);
    return cluster;
  }
  isDomainsDesignated() {
    return this.domainsDesignated;
  }
  // =========================================================================
  // WORKFLOW
  // =========================================================================
  async doPlanning() {
    await this.loadT2Master();
    const t1 = await this.generateT1();
    await this.decomposeTasks(t1);
    this.domainsDesignated = true;
    return {
      t2Loaded: this.t2MasterLoaded,
      t1Generated: this.t1Generated,
      tasksDecomposed: this.tasksDecomposed,
      domainsDesignated: this.domainsDesignated
    };
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};
var planningBrainInstance = null;
function createPlanningBrain() {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain();
  }
  return planningBrainInstance;
}
function getPlanningBrain() {
  if (!planningBrainInstance) {
    planningBrainInstance = new PlanningBrain();
  }
  return planningBrainInstance;
}

// src/brains/council/roundtable-council.ts
var AlphaBrain = class {
  cluster = "alpha";
  lead = "execution";
  focus = ["build", "feature", "implement", "from-scratch"];
  ready = false;
  initialize() {
    this.ready = true;
    console.log("[AlphaBrain] Initialized - Steamroll focus");
  }
  isReady() {
    return this.ready;
  }
  async executeBuild(task) {
    console.log(`[AlphaBrain] Executing build: ${task.description}`);
  }
};
var BetaBrain = class {
  cluster = "beta";
  lead = "reasoning";
  focus = ["debug", "fix", "refactor", "patch", "analyze"];
  ready = false;
  initialize() {
    this.ready = true;
    console.log("[BetaBrain] Initialized - Precision focus");
  }
  isReady() {
    return this.ready;
  }
  async executeDebug(task) {
    console.log(`[BetaBrain] Executing debug: ${task.description}`);
  }
};
var GammaBrain = class {
  cluster = "gamma";
  lead = "system";
  focus = ["test", "verify", "audit", "integration"];
  ready = false;
  initialize() {
    this.ready = true;
    console.log("[GammaBrain] Initialized - Testing focus");
  }
  isReady() {
    return this.ready;
  }
  async executeTest(task) {
    console.log(`[GammaBrain] Executing test: ${task.description}`);
    return true;
  }
};
var CouncilCoordinator = class {
  alpha;
  beta;
  gamma;
  initialized = false;
  constructor() {
    this.alpha = new AlphaBrain();
    this.beta = new BetaBrain();
    this.gamma = new GammaBrain();
  }
  initialize() {
    this.alpha.initialize();
    this.beta.initialize();
    this.gamma.initialize();
    this.initialized = true;
    console.log("[CouncilCoordinator] All clusters initialized");
  }
  isInitialized() {
    return this.initialized;
  }
  getCluster(cluster) {
    switch (cluster) {
      case "alpha":
        return this.alpha;
      case "beta":
        return this.beta;
      case "gamma":
        return this.gamma;
    }
  }
  getAllClusters() {
    return [this.alpha, this.beta, this.gamma];
  }
  /**
   * Route task to appropriate cluster based on domain designation
   */
  async routeTask(task) {
    const clusterBrain = this.getCluster(task.cluster);
    console.log(`[CouncilCoordinator] Routing task ${task.taskId} to ${task.cluster} cluster`);
    switch (task.cluster) {
      case "alpha":
        await this.alpha.executeBuild(task);
        break;
      case "beta":
        await this.beta.executeDebug(task);
        break;
      case "gamma":
        await this.gamma.executeTest(task);
        break;
    }
  }
  /**
   * Check if all clusters are ready
   */
  areAllReady() {
    return this.alpha.isReady() && this.beta.isReady() && this.gamma.isReady();
  }
};

// src/hooks/index.ts
var LAUNCHPAD_PATH = "/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md";
var COMPACTION_CONTEXT_DIR = "/tmp/kraken-compaction";
var council = null;
var currentAgentName = void 0;
function setCurrentAgent(agent) {
  currentAgentName = agent;
  if (agent) {
    console.log(`[Kraken] Agent identity set: ${agent}`);
  }
}
function getCurrentAgent() {
  return currentAgentName;
}
function isKrakenAgent(agent) {
  return agent === "kraken" || agent && agent.startsWith("kraken") || false;
}
function getCouncil() {
  if (!council) {
    council = new CouncilCoordinator();
  }
  return council;
}
function createEventHook() {
  return async ({ event }) => {
    if (event.type === "session.created") {
      console.log("[Kraken] Session created, initializing brains...");
      const systemBrain = createSystemBrain();
      systemBrain.initialize();
      const executionBrain = createExecutionBrain();
      executionBrain.initialize();
      const planningBrain = createPlanningBrain();
      planningBrain.initialize();
      const c = getCouncil();
      c.initialize();
      console.log("[Kraken] All brains initialized");
      const recoveryPath = path2.join(COMPACTION_CONTEXT_DIR, "LATEST", "INJECTION.md");
      if (fs4.existsSync(recoveryPath)) {
        const recoveryContent = fs4.readFileSync(recoveryPath, "utf-8");
        console.log("[Kraken] Compaction recovery file found, context restored");
        console.log(`[Kraken] Recovery file size: ${recoveryContent.length} chars`);
      }
      return;
    }
    if (event.type === "session.ended") {
      console.log("[Kraken] Session ended, cleaning up brains...");
      const systemBrain = getSystemBrain();
      if (systemBrain?.cleanup) {
        systemBrain.cleanup();
      }
      council = null;
      console.log("[Kraken] Brain cleanup complete");
      return;
    }
    if (event.type === "session.compacting") {
      console.log("[Kraken] Session compacting, preparing context...");
      const systemBrain = getSystemBrain();
      if (!systemBrain.isInitialized()) {
        console.log("[Kraken] SystemBrain not initialized, skipping");
        return;
      }
      let launchpadContent = "";
      if (fs4.existsSync(LAUNCHPAD_PATH)) {
        launchpadContent = fs4.readFileSync(LAUNCHPAD_PATH, "utf-8");
        console.log(`[Kraken] Launchpad loaded: ${launchpadContent.length} chars`);
      }
      const recentDecisions = systemBrain.getRecentDecisionPoints();
      const currentGate = systemBrain.getCurrentGate();
      const completedTasks = systemBrain.getCompletedTasks();
      const activeTask = systemBrain.getActiveTask();
      const compactionContext = buildCompactionContext({
        launchpadContent,
        recentDecisions,
        currentGate,
        completedTasks,
        activeTask,
        sessionId: event.properties?.sessionId || "unknown"
      });
      const sessionId = event.properties?.sessionId || "unknown";
      const contextDir = path2.join(COMPACTION_CONTEXT_DIR, sessionId);
      fs4.mkdirSync(contextDir, { recursive: true });
      fs4.writeFileSync(path2.join(contextDir, "INJECTION.md"), compactionContext);
      console.log("[Kraken] Compaction context saved to file for recovery");
      console.log(`[Kraken] Decisions captured: ${recentDecisions.length}, gate=${currentGate}`);
      return;
    }
  };
}
function buildCompactionContext(params) {
  const { launchpadContent, recentDecisions, currentGate, completedTasks, activeTask, sessionId } = params;
  return `
================================================================================
KRAKEN V2.0 \u2014 COMPACTION CONTEXT INJECTION
================================================================================

**Session:** ${sessionId}
**Timestamp:** ${(/* @__PURE__ */ new Date()).toISOString()}
**Gate:** ${currentGate}

---

## CURRENT MISSION

${launchpadContent.split("## CURRENT MISSION")[1]?.split("---")[0]?.trim() || "Building Kraken V2.0 multi-brain orchestrator"}

---

## RECENT DECISIONS (${recentDecisions.length})

${recentDecisions.slice(0, 10).map(
    (d, i) => `${i + 1}. [${d.type}] ${d.description}`
  ).join("\n")}

---

## TASK STATE

**Active Task:** ${activeTask || "None"}
**Completed Tasks:** ${completedTasks.length > 0 ? completedTasks.join(", ") : "None"}

---

## STREAM ANCHOR

Current phase: BUILD
Current gate: ${currentGate}
Active task: ${activeTask || "None"}

**Next immediate action:** Continue from where we left off in the Kraken V2.0 build.
Read the LAUNCHPAD.md file for full context.

================================================================================
`;
}
function createChatMessageHook() {
  return async (input, output) => {
    const { message, agent } = input;
    if (isKrakenAgent(agent)) {
      setCurrentAgent(agent);
    }
    if (!isKrakenAgent(getCurrentAgent())) return;
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    try {
      systemBrain.checkMessage(message);
    } catch (error) {
      console.error(`[Kraken] Message blocked: ${error}`);
      throw error;
    }
  };
}
function createToolGuardianHook2() {
  return async (input, output) => {
    if (!isKrakenAgent(getCurrentAgent())) return;
    const { tool } = input;
    const args = output?.args || {};
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    try {
      systemBrain.checkTool(tool, args);
    } catch (error) {
      console.error(`[Kraken] Tool blocked: ${error}`);
      throw error;
    }
  };
}
function createGateHook() {
  return async (input, output) => {
    if (!isKrakenAgent(getCurrentAgent())) return;
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    const currentGate = systemBrain.getCurrentGate();
    const result = systemBrain.evaluateGateEntry(currentGate);
    if (result.allPassed) {
      console.log(`[Kraken] Gate ${currentGate} criteria met, ready to advance`);
    }
  };
}
function createCompactionHook() {
  return async (input, output) => {
    if (!isKrakenAgent(getCurrentAgent())) return;
    const { sessionID } = input;
    console.log("[Kraken] Compaction hook fired for session:", sessionID);
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) {
      console.log("[Kraken] SystemBrain not initialized");
      return;
    }
    const recentDecisions = systemBrain.getRecentDecisionPoints();
    const currentGate = systemBrain.getCurrentGate();
    const completedTasks = systemBrain.getCompletedTasks();
    const activeTask = systemBrain.getActiveTask();
    let launchpadContent = "";
    if (fs4.existsSync(LAUNCHPAD_PATH)) {
      launchpadContent = fs4.readFileSync(LAUNCHPAD_PATH, "utf-8");
    }
    const contextStr = buildCompactionContext({
      launchpadContent,
      recentDecisions,
      currentGate,
      completedTasks,
      activeTask,
      sessionId: sessionID
    });
    const contextDir = path2.join(COMPACTION_CONTEXT_DIR, sessionID);
    fs4.mkdirSync(contextDir, { recursive: true });
    fs4.writeFileSync(path2.join(contextDir, "INJECTION.md"), contextStr);
    const latestDir = path2.join(COMPACTION_CONTEXT_DIR, "LATEST");
    fs4.mkdirSync(latestDir, { recursive: true });
    fs4.writeFileSync(path2.join(latestDir, "INJECTION.md"), contextStr);
    console.log("[Kraken] Compaction context saved to file for recovery");
    console.log(`[Kraken] Decisions captured: ${recentDecisions.length}`);
  };
}

// src/index.ts
var KrakenOrchestrator = class {
  initialized = false;
  initialize() {
    if (this.initialized) return;
    console.log("[Kraken V2.0] Initializing multi-brain orchestrator...");
    console.log("[Kraken V2.0] Features:");
    console.log("  - Two-Layer Guardian (Tool + Message enforcement)");
    console.log("  - Mechanical Output Verification");
    console.log("  - Structured Override Commands");
    console.log("  - Explicit Gate Criteria");
    console.log("  - Four-Tier Compaction Management");
    this.initialized = true;
  }
  createHooks() {
    return {
      event: createEventHook(),
      "chat.message": createChatMessageHook(),
      "tool.execute.before": createToolGuardianHook2(),
      "tool.execute.after": [createToolSummarizerHook(), createGateHook()],
      // Array for multiple hooks
      "experimental.session.compacting": createCompactionHook()
    };
  }
  createSessionEndedHook() {
    return async () => {
      console.log("[Kraken] Session ended, cleaning up...");
      const systemBrain = getSystemBrain();
      const executionBrain = getExecutionBrain();
      const planningBrain = getPlanningBrain();
      console.log("[Kraken] Cleanup complete");
    };
  }
  // Tools
  createTools() {
    return {
      "kraken-status": {
        description: "Show Kraken V2.0 status",
        execute: async () => {
          const systemBrain = getSystemBrain();
          const executionBrain = getExecutionBrain();
          const planningBrain = getPlanningBrain();
          const council2 = getCouncil();
          return {
            version: "2.0.0",
            initialized: this.initialized,
            systemBrain: systemBrain.isInitialized(),
            executionBrain: executionBrain.isInitialized(),
            planningBrain: planningBrain.isInitialized(),
            councilReady: council2.isInitialized(),
            currentGate: systemBrain.getCurrentGate()
          };
        }
      },
      "kraken-gate-status": {
        description: "Show current gate criteria status",
        execute: async () => {
          const systemBrain = getSystemBrain();
          const currentGate = systemBrain.getCurrentGate();
          const result = systemBrain.evaluateGateEntry(currentGate);
          return {
            gate: currentGate,
            allPassed: result.allPassed,
            blockers: result.blockers,
            details: result.details
          };
        }
      }
    };
  }
};
var kraken = new KrakenOrchestrator();
async function KrakenV2Plugin(input) {
  kraken.initialize();
  console.log("[Kraken V2.0] Plugin loaded");
  return {
    name: "kraken-agent-v2.0",
    version: "2.0.0",
    // Agent registration for tab toggle
    config: async (opencodeConfig) => {
      console.log("[Kraken V2.0] Registering agents for tab toggle...");
      const agents = {
        "kraken": {
          name: "kraken",
          description: "Kraken V2.0 - Multi-brain orchestrator with 5-brain architecture",
          instructions: `You are Kraken V2.0, a multi-brain orchestrator plugin for OpenCode.

Key Features:
1. Two-Layer Firewall - Tool enforcement + Message enforcement
2. Mechanical Output Verification - fs.existsSync() checkpoints, not trust
3. Structured Override Commands - Typed schema, not natural language
4. Explicit Gate Criteria - Each brain declares satisfied criteria
5. Dynamic Context Management - Four-tier compaction system

Brains:
- System Brain: Gate management, guardian enforcement
- Execution Brain: Tool execution, output verification
- Planning Brain: Workflow planning, context compaction
- Council Brain: Roundtable decision making

Use the kraken-status tool to check current state.`,
          mode: "primary",
          // REQUIRED for tab toggle visibility
          permission: { task: "allow" },
          tools: kraken.createTools()
        }
      };
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agents };
      } else {
        Object.assign(opencodeConfig.agent, agents);
      }
      console.log("[Kraken V2.0] Agents registered:", Object.keys(agents));
    },
    // Hooks
    ...kraken.createHooks(),
    // Tools
    tool: kraken.createTools()
  };
}
export {
  KrakenV2Plugin as default
};
