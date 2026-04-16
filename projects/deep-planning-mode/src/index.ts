/**
 * DEEP PLANNING MODE - Plugin Entry
 * 
 * Natural language parsing, command handlers, and hooks.
 * Follows Trident v3.0 architecture pattern.
 */

import { 
  scanRequirements, 
  scanConstraints, 
  scanDeliverables,
  scanFileDependencies,
  scanAPIDependencies,
  scanServiceDependencies,
  scanHumanDependencies,
  scanRisks,
  scanCheckpoints,
  scanTimeConstraints,
  scanScopeConstraints,
  fullScan,
  Finding,
} from '../context-library/patterns';

import {
  PlanData,
  PlanTemplate,
  PLAN_TEMPLATES,
  createCheckpoint,
  createStep,
  createRisk,
  createDependency,
  createConstraint,
  getDefaultPlanData,
} from '../context-library/templates';

// ============================================================
// TYPES
// ============================================================

export interface ModeState {
  mode: 'idle' | 'planning' | 'analyzing' | 'validating';
  currentPlan: PlanData | null;
  context: string;
  lastError?: string;
  lastFindings: Finding[];
}

export interface CommandResult {
  success: boolean;
  output: string;
  state: ModeState;
}

// ============================================================
// STATE
// ============================================================

const state: ModeState = {
  mode: 'idle',
  currentPlan: null,
  context: '',
  lastFindings: [],
};

// ============================================================
// NATURAL LANGUAGE PARSER
// ============================================================

const TRIGGERS = {
  DEEP_PLAN: ['deep plan', 'plan this', 'create a plan', 'make a plan', 'develop a plan'],
  ANALYZE_DEPS: ['analyze deps', 'analyze dependencies', 'map dependencies', 'dependency analysis'],
  RISK_ANALYSIS: ['what could go wrong', 'risk analysis', 'identify risks', 'risky'],
  CHECKPOINT: ['checkpoint', 'create checkpoint', 'add milestone', 'milestone'],
  VALIDATE_PLAN: ['validate plan', 'verify plan', 'check plan', 'plan validation'],
  SHOW_CONSTRAINTS: ['constraints', 'show constraints', 'constraint analysis'],
  SHOW_DEPENDENCIES: ['dependencies', 'show dependencies', 'dependency graph'],
};

const COMMAND_PATTERNS = {
  PLAN_THIS: /^plan\s+this$/i,
  DEEP_PLAN: /^deep\s+plan\s+(.+)$/i,
  ANALYZE_DEPS: /^analyze\s+(?:deps|dependencies)$/i,
  RISK_ANALYSIS: /^(?:what\s+could\s+go\s+wrong|risk\s+analysis|identify\s+risks?)$/i,
  CHECKPOINT: /^checkpoint$/i,
  VALIDATE_PLAN: /^(?:validate|verify|check)\s+(?:the\s+)?plan$/i,
  CONSTRAINTS: /^constraints$/i,
  DEPENDENCIES: /^dependencies$/i,
};

function parseNaturalLanguage(message: string): { action: string; payload?: string } | null {
  const msg = message.toLowerCase().trim();
  
  for (const trigger of TRIGGERS.DEEP_PLAN) {
    if (msg.includes(trigger)) {
      return { action: 'deep_plan', payload: msg };
    }
  }
  
  for (const trigger of TRIGGERS.ANALYZE_DEPS) {
    if (msg.includes(trigger)) {
      return { action: 'analyze_deps' };
    }
  }
  
  for (const trigger of TRIGGERS.RISK_ANALYSIS) {
    if (msg.includes(trigger)) {
      return { action: 'risk_analysis' };
    }
  }
  
  for (const trigger of TRIGGERS.CHECKPOINT) {
    if (msg.includes(trigger)) {
      return { action: 'checkpoint' };
    }
  }
  
  for (const trigger of TRIGGERS.VALIDATE_PLAN) {
    if (msg.includes(trigger)) {
      return { action: 'validate_plan' };
    }
  }
  
  for (const trigger of TRIGGERS.SHOW_CONSTRAINTS) {
    if (msg.includes(trigger)) {
      return { action: 'show_constraints' };
    }
  }
  
  for (const trigger of TRIGGERS.SHOW_DEPENDENCIES) {
    if (msg.includes(trigger)) {
      return { action: 'show_dependencies' };
    }
  }
  
  return null;
}

// ============================================================
// COMMAND HANDLERS
// ============================================================

async function handleDeepPlan(context: string): Promise<CommandResult> {
  try {
    state.mode = 'planning';
    
    const planData = getDefaultPlanData('Planning Task');
    
    const requirementsFindings = [
      ...scanRequirements(context),
      ...scanDeliverables(context),
    ];
    planData.requirements = requirementsFindings.map(f => f.match);
    
    const constraintFindings = [
      ...scanConstraints(context),
      ...scanTimeConstraints(context),
      ...scanScopeConstraints(context),
    ];
    planData.constraints = constraintFindings.map(f => 
      createConstraint('scope', f.match, f.severity === 'CRITICAL' || f.severity === 'HIGH')
    );
    
    const depFindings = [
      ...scanFileDependencies(context),
      ...scanAPIDependencies(context),
      ...scanServiceDependencies(context),
      ...scanHumanDependencies(context),
    ];
    planData.dependencies = depFindings.map((f, i) => 
      createDependency(`DEP-${i + 1}`, f.match, f.category.replace('_DEP', '').toLowerCase() as any)
    );
    
    const riskFindings = scanRisks(context);
    planData.risks = riskFindings.map((f, i) => 
      createRisk(f.match, 'medium', f.severity === 'CRITICAL' ? 'high' : 'medium', 'Monitor and address if triggered')
    );
    
    if (planData.requirements.length > 0) {
      const cp1 = createCheckpoint(
        'CP1',
        'Requirements Validated',
        planData.requirements.slice(0, 3).map(r => `Validate: ${r}`),
        '30min'
      );
      planData.checkpoints.push(cp1);
    }
    
    if (planData.dependencies.length > 0) {
      const cp2 = createCheckpoint(
        'CP2',
        'Dependencies Resolved',
        ['All dependencies confirmed', 'No circular dependencies'],
        '1h'
      );
      planData.checkpoints.push(cp2);
    }
    
    if (planData.steps.length === 0) {
      const step1 = createStep(
        'STEP-1',
        'Analyze Requirements',
        'Extract and validate requirements from input',
        '1h',
        ['Requirements documented', 'Ambiguities resolved'],
        'N/A - initial step'
      );
      planData.steps.push(step1);
      
      const step2 = createStep(
        'STEP-2',
        'Map Dependencies',
        'Build dependency graph and identify blockers',
        '2h',
        ['Dependency graph complete', 'No circular deps'],
        'Remove added dependencies'
      );
      planData.steps.push(step2);
      
      const step3 = createStep(
        'STEP-3',
        'Risk Assessment',
        'Identify risks and define mitigations',
        '1h',
        ['Risk register complete', 'Mitigations defined'],
        'Remove added risk entries'
      );
      planData.steps.push(step3);
      
      const step4 = createStep(
        'STEP-4',
        'Create Execution Plan',
        'Generate step-by-step execution plan',
        '30min',
        ['Plan generated', 'Rollback defined'],
        'N/A - planning step'
      );
      planData.steps.push(step4);
    }
    
    state.currentPlan = planData;
    
    const template = PLAN_TEMPLATES.standard;
    const output = template.generate(planData);
    
    return {
      success: true,
      output,
      state: { ...state },
    };
  } catch (error) {
    state.mode = 'idle';
    state.lastError = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      output: `[PLANNING] Error creating plan: ${state.lastError}`,
      state: { ...state },
    };
  }
}

async function handleAnalyzeDependencies(context: string): Promise<CommandResult> {
  try {
    state.mode = 'analyzing';
    
    const depFindings = [
      ...scanFileDependencies(context),
      ...scanAPIDependencies(context),
      ...scanServiceDependencies(context),
      ...scanHumanDependencies(context),
    ];
    
    state.lastFindings = depFindings;
    
    let output = '## Dependency Analysis\n\n';
    
    const byType = groupFindingsByCategory(depFindings);
    
    for (const [type, findings] of Object.entries(byType)) {
      output += `### ${type.replace('_DEP', '')} Dependencies\n`;
      for (const finding of findings) {
        output += `- **Line ${finding.line}**: ${finding.match}\n`;
        if (finding.note) {
          output += `  - *${finding.note}*\n`;
        }
      }
      output += '\n';
    }
    
    output += `**Total dependencies found:** ${depFindings.length}\n`;
    
    const circularDeps = detectCircularDeps(depFindings);
    if (circularDeps.length > 0) {
      output += '\n⚠️  **CIRCULAR DEPENDENCIES DETECTED:**\n';
      for (const cycle of circularDeps) {
        output += `- ${cycle.join(' → ')}\n`;
      }
    }
    
    return {
      success: true,
      output,
      state: { ...state },
    };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      output: `[ANALYSIS] Error: ${state.lastError}`,
      state: { ...state },
    };
  }
}

async function handleRiskAnalysis(context: string): Promise<CommandResult> {
  try {
    state.mode = 'analyzing';
    
    const riskFindings = scanRisks(context);
    state.lastFindings = riskFindings;
    
    let output = '## Risk Analysis\n\n';
    
    if (riskFindings.length === 0) {
      output += '*No explicit risks detected in input.*\n\n';
      output += 'Consider checking for:\n';
      output += '- Unknown dependencies\n';
      output += '- Potential failure modes\n';
      output += '- Blocker conditions\n';
      return { success: true, output, state: { ...state } };
    }
    
    output += `**Risks identified:** ${riskFindings.length}\n\n`;
    
    const byCategory = groupFindingsByCategory(riskFindings);
    
    for (const [category, findings] of Object.entries(byCategory)) {
      output += `### ${category.replace('_', ' ')}\n`;
      for (const finding of findings) {
        const severity = finding.severity === 'CRITICAL' ? '🔴' : 
                        finding.severity === 'HIGH' ? '🟠' : 
                        finding.severity === 'MEDIUM' ? '🟡' : '⚪';
        output += `- ${severity} **Line ${finding.line}**: ${finding.match}\n`;
        if (finding.note) {
          output += `  - *${finding.note}*\n`;
        }
      }
      output += '\n';
    }
    
    const criticalRisks = riskFindings.filter(f => f.severity === 'CRITICAL');
    if (criticalRisks.length > 0) {
      output += '### ⚠️ Critical Risks (Must Address)\n';
      for (const risk of criticalRisks) {
        output += `- **${risk.match}** at line ${risk.line}\n`;
      }
      output += '\n*These risks must be resolved before proceeding.*\n';
    }
    
    return {
      success: true,
      output,
      state: { ...state },
    };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      output: `[RISK ANALYSIS] Error: ${state.lastError}`,
      state: { ...state },
    };
  }
}

async function handleCheckpoint(): Promise<CommandResult> {
  try {
    if (!state.currentPlan) {
      return {
        success: false,
        output: '[CHECKPOINT] No active plan. Use "deep plan this" first.',
        state: { ...state },
      };
    }
    
    const cpNum = state.currentPlan.checkpoints.length + 1;
    const newCp = createCheckpoint(
      `CP${cpNum}`,
      `Checkpoint ${cpNum}`,
      ['Criteria to be defined'],
      'TBD'
    );
    
    state.currentPlan.checkpoints.push(newCp);
    
    const output = `### ✓ Checkpoint Added\n\n**${newCp.id}: ${newCp.name}**\n- Time: ${newCp.time}\n- Owner: ${newCp.owner}\n- Criteria: ${newCp.criteria.join(', ')}\n\n*Use "validate plan" to see full plan with updated checkpoints.*`;
    
    return {
      success: true,
      output,
      state: { ...state },
    };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      output: `[CHECKPOINT] Error: ${state.lastError}`,
      state: { ...state },
    };
  }
}

async function handleValidatePlan(): Promise<CommandResult> {
  try {
    state.mode = 'validating';
    
    if (!state.currentPlan) {
      return {
        success: false,
        output: '[VALIDATE] No active plan. Use "deep plan this" first.',
        state: { ...state },
      };
    }
    
    const plan = state.currentPlan;
    let output = '## Plan Validation\n\n';
    
    const checks: { name: string; pass: boolean; detail: string }[] = [];
    
    checks.push({
      name: 'Requirements',
      pass: plan.requirements.length > 0,
      detail: `${plan.requirements.length} requirements defined`,
    });
    
    checks.push({
      name: 'Dependencies',
      pass: plan.dependencies.length > 0,
      detail: `${plan.dependencies.length} dependencies mapped`,
    });
    
    const hasCircular = plan.dependencies.some(d => d.dependsOn.includes(d.id));
    checks.push({
      name: 'No Circular Dependencies',
      pass: !hasCircular,
      detail: hasCircular ? '⚠️ Circular deps detected!' : 'No circular dependencies',
    });
    
    checks.push({
      name: 'Risks Identified',
      pass: plan.risks.length > 0,
      detail: `${plan.risks.length} risks in register`,
    });
    
    checks.push({
      name: 'Checkpoints',
      pass: plan.checkpoints.length > 0,
      detail: `${plan.checkpoints.length} milestones`,
    });
    
    checks.push({
      name: 'Execution Steps',
      pass: plan.steps.length > 0 && plan.steps.length <= 10,
      detail: `${plan.steps.length} steps (${plan.steps.length <= 10 ? '✓' : '⚠️ Too many'})`,
    });
    
    checks.push({
      name: 'Time Estimates',
      pass: plan.steps.every(s => s.time !== 'TBD'),
      detail: plan.steps.every(s => s.time !== 'TBD') ? 'All steps timed' : 'Some steps missing time',
    });
    
    output += '| Check | Status | Detail |\n';
    output += '|-------|--------|--------|\n';
    
    for (const check of checks) {
      const status = check.pass ? '✅' : '❌';
      output += `| ${check.name} | ${status} | ${check.detail} |\n`;
    }
    
    output += '\n';
    
    const passedCount = checks.filter(c => c.pass).length;
    if (passedCount === checks.length) {
      output += '*Plan is valid and ready for execution.*\n';
    } else if (passedCount >= checks.length / 2) {
      output += `*Plan has ${checks.length - passedCount} issues that should be addressed.*\n`;
    } else {
      output += `*Plan needs significant work: ${checks.length - passedCount} issues.*\n`;
    }
    
    return {
      success: true,
      output,
      state: { ...state },
    };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      output: `[VALIDATE] Error: ${state.lastError}`,
      state: { ...state },
    };
  }
}

async function handleShowConstraints(): Promise<CommandResult> {
  try {
    if (!state.currentPlan) {
      return {
        success: false,
        output: '[CONSTRAINTS] No active plan. Use "deep plan this" first.',
        state: { ...state },
      };
    }
    
    let output = '## Constraints\n\n';
    
    if (state.currentPlan.constraints.length === 0) {
      output += '*No constraints identified.*\n';
      return { success: true, output, state: { ...state } };
    }
    
    for (const constraint of state.currentPlan.constraints) {
      const hard = constraint.hard ? '🔴 HARD' : '🟡 SOFT';
      output += `- **${constraint.type}**: ${constraint.value} [${hard}]\n`;
    }
    
    return {
      success: true,
      output,
      state: { ...state },
    };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      output: `[CONSTRAINTS] Error: ${state.lastError}`,
      state: { ...state },
    };
  }
}

async function handleShowDependencies(): Promise<CommandResult> {
  try {
    if (!state.currentPlan) {
      return {
        success: false,
        output: '[DEPENDENCIES] No active plan. Use "deep plan this" first.',
        state: { ...state },
      };
    }
    
    let output = '## Dependency Graph\n\n';
    
    if (state.currentPlan.dependencies.length === 0) {
      output += '*No dependencies identified.*\n';
      return { success: true, output, state: { ...state } };
    }
    
    output += '```\n';
    
    for (const dep of state.currentPlan.dependencies) {
      const deps = dep.dependsOn.length > 0 ? ` <- ${dep.dependsOn.join(', ')}` : '';
      output += `[${dep.id}] ${dep.name} (${dep.type})${deps}\n`;
    }
    
    output += '```\n';
    
    return {
      success: true,
      output,
      state: { ...state },
    };
  } catch (error) {
    state.lastError = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      output: `[DEPENDENCIES] Error: ${state.lastError}`,
      state: { ...state },
    };
  }
}

// ============================================================
// UTILITIES
// ============================================================

function groupFindingsByCategory(findings: Finding[]): Record<string, Finding[]> {
  return findings.reduce((acc, finding) => {
    if (!acc[finding.category]) {
      acc[finding.category] = [];
    }
    acc[finding.category].push(finding);
    return acc;
  }, {} as Record<string, Finding[]>);
}

function detectCircularDeps(findings: Finding[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  
  function hasCycle(node: string, path: string[]): boolean {
    if (path.includes(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push([...path.slice(cycleStart), node]);
      return true;
    }
    if (visited.has(node)) return false;
    
    visited.add(node);
    path.push(node);
    return false;
  }
  
  return cycles;
}

// ============================================================
// COMMAND ROUTER
// ============================================================

export async function routeCommand(message: string, context: string = ''): Promise<CommandResult> {
  const parsed = parseNaturalLanguage(message);
  
  if (!parsed) {
    return {
      success: false,
      output: `[DEEP PLANNING] Unknown command. Try: "plan this", "analyze deps", "what could go wrong", "checkpoint", or "validate plan"`,
      state: { ...state },
    };
  }
  
  state.context = context;
  
  switch (parsed.action) {
    case 'deep_plan':
      return handleDeepPlan(context || parsed.payload || message);
    
    case 'analyze_deps':
      return handleAnalyzeDependencies(context || message);
    
    case 'risk_analysis':
      return handleRiskAnalysis(context || message);
    
    case 'checkpoint':
      return handleCheckpoint();
    
    case 'validate_plan':
      return handleValidatePlan();
    
    case 'show_constraints':
      return handleShowConstraints();
    
    case 'show_dependencies':
      return handleShowDependencies();
    
    default:
      return {
        success: false,
        output: `[DEEP PLANNING] Unhandled action: ${parsed.action}`,
        state: { ...state },
      };
  }
}

// ============================================================
// HOOKS
// ============================================================

export function getToolBlockingHook() {
  return {
    name: 'tool.execute.before',
    handler: async (input: any, output: any) => {
      const toolName = input.tool as string;
      
      const BLOCKED_TOOLS = ['edit', 'write', 'write_file', 'bash', 'shell', 'exec'];
      const isBlocked = BLOCKED_TOOLS.some(t => toolName === t);
      
      if (isBlocked && state.mode === 'planning') {
        output.blocked = true;
        output.blockReason = '[DEEP PLANNING] Tools blocked during planning mode. Complete planning first, then use "validate plan" to unlock.';
      }
    },
  };
}

export function getChatHook() {
  return {
    name: 'chat.message',
    handler: async (input: any, output: any) => {
      // Extract context from chat for planning
      if (input.message && typeof input.message === 'string') {
        state.context = input.message;
      }
    },
  };
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

export function getState(): ModeState {
  return { ...state };
}

export function resetState(): void {
  state.mode = 'idle';
  state.currentPlan = null;
  state.context = '';
  state.lastError = undefined;
  state.lastFindings = [];
}

export function setPlan(plan: PlanData): void {
  state.currentPlan = plan;
  state.mode = 'planning';
}

// ============================================================
// PLUGIN REGISTRATION
// ============================================================

export const plugin = {
  name: 'deep-planning-mode',
  version: '1.0.0',
  description: 'Comprehensive multi-phase planning for complex engineering tasks',
  
  commands: {
    'deep-plan': (message: string, context?: string) => routeCommand(message, context),
    'analyze-deps': (context: string) => handleAnalyzeDependencies(context),
    'risk-analysis': (context: string) => handleRiskAnalysis(context),
    'checkpoint': () => handleCheckpoint(),
    'validate-plan': () => handleValidatePlan(),
    'show-constraints': () => handleShowConstraints(),
    'show-dependencies': () => handleShowDependencies(),
  },
  
  hooks: [
    getToolBlockingHook(),
    getChatHook(),
  ],
};

export default plugin;
