/**
 * V4.1 Architecture Elicitation Wizard — Core Engine
 *
 * Stateless engine that manages the elicitation state machine.
 * Takes user input, extracts requirements, generates questions,
 * and produces a finalized ArchitectureConfig.
 */

import type {
  ElicitationState,
  ExtractedArchitecture,
  Question,
  OrchestratorSpec,
  ClusterSpec,
  AgentRoleSpec,
  BrainTypeSuggestion,
  SyncMode,
  QuestionTemplate,
} from './types.js';
export { QUESTION_BANK } from './types.js';
import { QUESTION_BANK } from './types.js';
import type { ArchitectureConfig, ClusterConfig, AgentDefinition } from '../factory/types.js';

// ============================================================
// STATE FACTORY
// ============================================================

export function createInitialState(idea: string, sessionId?: string): ElicitationState {
  return {
    sessionId: sessionId ?? generateSessionId(),
    phase: 'idea_capture',
    extracted: {
      name: extractName(idea),
      description: idea,
    },
    pendingQuestions: [],
    messages: [
      {
        id: generateId(),
        role: 'user',
        content: idea,
        timestamp: Date.now(),
      },
    ],
    originalIdea: idea,
    startedAt: Date.now(),
    lastActivityAt: Date.now(),
  };
}

// ============================================================
// EXTRACTION ENGINE
// ============================================================

export function extractFromAnswer(
  state: ElicitationState,
  question: Question,
  answer: string,
): Partial<ExtractedArchitecture> {
  const extracted: Partial<ExtractedArchitecture> = {};

  switch (question.id) {
    case 'brain_type':
      extracted.brainType = answer as BrainTypeSuggestion;
      break;

    case 'orchestrator_names':
      extracted.orchestrators = parseOrchestratorNames(answer, state.extracted.brainType ?? 'single');
      break;

    case 'workflow_clusters':
      extracted.clusters = parseClusters(answer);
      break;

    case 'agents_per_cluster':
      extracted.agentRoles = parseAgentRoles(answer, state.extracted.clusters ?? []);
      break;

    case 'delegation_pattern':
      if (state.extracted.delegation) {
        state.extracted.delegation.allowCrossCluster = answer.toLowerCase().startsWith('y');
      } else {
        state.extracted.delegation = {
          allowCrossCluster: answer.toLowerCase().startsWith('y'),
          requireGateApproval: true,
          maxHops: 3,
        };
      }
      break;

    case 'quality_gates':
      if (state.extracted.delegation) {
        state.extracted.delegation.requireGateApproval = answer.toLowerCase().startsWith('y');
      } else {
        state.extracted.delegation = {
          allowCrossCluster: true,
          requireGateApproval: answer.toLowerCase().startsWith('y'),
          maxHops: 3,
        };
      }
      break;

    case 'parallel_execution':
      extracted.syncMode = parseSyncMode(answer);
      break;

    case 'context_sharing':
      if (state.extracted.clusters) {
        const share = answer.toLowerCase().startsWith('y');
        state.extracted.clusters = state.extracted.clusters.map((c) => ({
          ...c,
          sharedContext: share,
        }));
      }
      break;

    case 'special_requirements':
      extracted.specialRequirements = answer
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      break;
  }

  return { ...state.extracted, ...extracted };
}

// ============================================================
// QUESTION GENERATION
// ============================================================

export function generateNextQuestion(state: ElicitationState): Question | null {
  const answered = new Set(
    state.messages
      .filter((m) => m.answersQuestion)
      .map((m) => m.answersQuestion),
  );

  const pending = QUESTION_BANK.filter((q) => !answered.has(q.id) && q.priority > 0);

  if (pending.length === 0) {
    return null;
  }

  // Sort by priority descending
  pending.sort((a, b) => b.priority - a.priority);

  return buildQuestion(pending[0], state);
}

function buildQuestion(template: QuestionTemplate, state: ElicitationState): Question {
  const base: Question = {
    id: template.id,
    text: template.text,
    type: template.type,
    targets: template.targets,
    options: template.options,
    priority: template.priority,
  };

  // Inject context for dynamic questions
  if (template.id === 'orchestrator_names' && state.extracted.brainType) {
    const brainType = state.extracted.brainType;
    if (brainType === 'single') {
      base.text = "What should we call your main orchestrator? Describe its role in one sentence.";
    } else if (brainType === 'dual') {
      base.text = "What should we call your two orchestrators? E.g., 'Planner' and 'Executor', or 'Architect' and 'Builder'. Describe each briefly.";
    } else if (brainType === 'trio') {
      base.text = "What should we call your three orchestrators? E.g., 'Strategist', 'Executor', 'Guardian'. Describe each briefly.";
    }
  }

  return base;
}

// ============================================================
// ARCHITECTURE CONFIG GENERATOR
// ============================================================

export function generateConfig(state: ElicitationState): ArchitectureConfig {
  const { extracted } = state;
  const brainType = extracted.brainType ?? 'single';

  // Build brain config
  const brain = buildBrainConfig(extracted);

  // Build clusters
  const clusters = buildClusters(extracted);

  // Build agents
  const agents = buildAgents(extracted, brainType);

  // Build delegation
  const delegation = extracted.delegation ?? {
    allowCrossCluster: true,
    requireGateApproval: true,
    maxHops: 3,
  };

  return {
    name: extracted.name ?? 'custom-architecture',
    version: '1.0.0',
    description: extracted.description ?? '',
    brain,
    clusters,
    agents,
    delegation,
  };
}

function buildBrainConfig(extracted: Partial<ExtractedArchitecture>): ArchitectureConfig['brain'] {
  const brainType = extracted.brainType ?? 'single';
  const orchestrators = extracted.orchestrators ?? [];

  if (brainType === 'single') {
    return {
      type: 'single',
      name: `${extracted.name ?? 'custom'}-brain`,
      orchestrator: orchestrators[0]?.id ?? 'architect',
    };
  }

  if (brainType === 'dual' || brainType === 'trio') {
    const orchestratorMap: Record<string, string> = {};
    for (const orch of orchestrators) {
      orchestratorMap[orch.id] = orch.id;
    }

    const workflows: Record<string, OrchestratorSpec> = {};
    for (const orch of orchestrators) {
      workflows[orch.id] = orch;
    }

    return {
      type: brainType,
      name: `${extracted.name ?? 'custom'}-brain`,
      syncMode: (extracted.syncMode?.type as 'shared-state' | 'direct' | 'none') ?? 'shared-state',
      orchestrators: orchestratorMap,
      workflows,
    };
  }

  // Fallback
  return { type: 'single', name: 'fallback-brain', orchestrator: 'architect' };
}

function buildClusters(extracted: Partial<ExtractedArchitecture>): ClusterConfig[] {
  const specs: ClusterSpec[] = extracted.clusters ?? [];

  // If no clusters defined, create defaults based on brain type
  if (specs.length === 0) {
    const brainType = extracted.brainType ?? 'single';
    if (brainType === 'single') {
      return [
        { id: 'execution', name: 'Execution', description: 'Implementation', agents: ['coder'], intraClusterDelegation: false, interClusterDelegation: false, sharedContext: true },
        { id: 'qa', name: 'QA', description: 'Quality assurance', agents: ['reviewer'], intraClusterDelegation: false, interClusterDelegation: true, sharedContext: true },
      ];
    }
    return [
      { id: 'research-pool', name: 'Research', description: 'Research and analysis', agents: ['explorer', 'sme'], intraClusterDelegation: true, interClusterDelegation: false, sharedContext: true },
      { id: 'execution-pool', name: 'Execution', description: 'Implementation', agents: ['coder'], intraClusterDelegation: true, interClusterDelegation: false, sharedContext: true },
      { id: 'qa-pool', name: 'QA', description: 'Quality assurance', agents: ['reviewer', 'test-engineer'], intraClusterDelegation: false, interClusterDelegation: true, sharedContext: true },
    ];
  }

  // Convert ClusterSpec[] → ClusterConfig[]
  return specs.map((spec) => ({
    id: spec.id,
    name: spec.name,
    description: spec.description,
    agents: spec.agentIds,
    intraClusterDelegation: spec.intraClusterDelegation,
    interClusterDelegation: spec.interClusterDelegation,
    sharedContext: spec.sharedContext,
  }));
}

function buildAgents(extracted: Partial<ExtractedArchitecture>, brainType: BrainTypeSuggestion): Record<string, string | AgentDefinition> {
  const roles = extracted.agentRoles ?? [];
  const agents: Record<string, string | AgentDefinition> = {};

  // Add orchestrators as agents
  const orchestrators = extracted.orchestrators ?? [];
  for (const orch of orchestrators) {
    const agent: AgentDefinition = {
      id: orch.id,
      name: orch.name,
      mode: orch.role,
      description: orch.description,
      capabilities: orch.owns,
      allowedTools: ['*'],
      maxConcurrentTasks: 2,
    };
    agents[orch.id] = agent;
  }

  // Add worker agents
  for (const role of roles) {
    const agent: AgentDefinition = {
      id: role.id,
      name: role.name,
      mode: role.mode,
      description: role.description,
      cluster: role.cluster,
      capabilities: role.capabilities,
      allowedTools: role.suggestedTools,
      maxConcurrentTasks: role.maxConcurrentTasks,
    };
    agents[role.id] = agent;
  }

  // Ensure core agents exist if using preset brain types
  if (brainType === 'single' && !agents['architect']) {
    agents['architect'] = 'architect';
  }
  if ((brainType === 'dual' || brainType === 'trio') && !agents['executor']) {
    agents['executor'] = 'executor';
  }
  if (brainType === 'trio' && !agents['guardian']) {
    agents['guardian'] = 'guardian';
  }

  return agents;
}

// ============================================================
// VALIDATION
// ============================================================

export function validateExtracted(state: ElicitationState): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { extracted } = state;

  if (!extracted.name) warnings.push('No architecture name extracted');
  if (!extracted.brainType) warnings.push('No brain type specified — will default to single');
  if (!extracted.orchestrators || extracted.orchestrators.length === 0) {
    warnings.push('No orchestrators defined — will use defaults');
  }
  if (!extracted.clusters || extracted.clusters.length === 0) {
    warnings.push('No clusters defined — will use defaults');
  }
  if (!extracted.agentRoles || extracted.agentRoles.length === 0) {
    warnings.push('No agent roles defined — will use defaults');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function generateSessionId(): string {
  return `wiz_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function extractName(idea: string): string {
  // Try to extract a name from the idea
  // Look for patterns like "called X", "named X", "system X"
  const patterns = [
    /(?:called|named|called|for)\s+["']?([a-zA-Z][a-zA-Z0-9_-]+)["']?/i,
    /(?:system|project|architecture|agent)\s+["']?([a-zA-Z][a-zA-Z0-9_-]+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = idea.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Fallback: first 3 words capitalized
  const words = idea.split(' ').slice(0, 3);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

function parseOrchestratorNames(answer: string, brainType: BrainTypeSuggestion): OrchestratorSpec[] {
  const lines = answer.split('\n').filter(Boolean);

  if (brainType === 'single') {
    return [
      {
        id: 'architect',
        name: lines[0]?.split(/[,.]/)[0]?.trim() ?? 'Architect',
        role: 'architect',
        description: lines[0] ?? 'Main orchestrator',
        owns: ['planning', 'phase-sequencing', 'architecture'],
        delegatesTo: ['execution', 'research'],
        readOnly: ['execution-state'],
        gates: ['plan-gate'],
      },
    ];
  }

  if (brainType === 'dual') {
    const names = lines.map((l) => l.split(/[,.]/)[0]?.trim()).filter(Boolean);
    return [
      {
        id: names[0]?.toLowerCase().replace(/\s+/g, '-') ?? 'architect',
        name: names[0] ?? 'Architect',
        role: 'architect',
        description: lines[0] ?? 'Planner orchestrator',
        owns: ['planning', 'phase-sequencing', 'architecture'],
        delegatesTo: ['research-pool'],
        readOnly: ['execution-state'],
        gates: ['plan-gate'],
      },
      {
        id: names[1]?.toLowerCase().replace(/\s+/g, '-') ?? 'executor',
        name: names[1] ?? 'Executor',
        role: 'executor',
        description: lines[1] ?? 'Execution orchestrator',
        owns: ['execution', 'qa-gates', 'completion'],
        delegatesTo: ['execution-pool', 'qa-pool'],
        readOnly: ['plan-state'],
        gates: ['qa-gate', 'test-gate', 'review-gate'],
      },
    ];
  }

  if (brainType === 'trio') {
    const names = lines.map((l) => l.split(/[,.]/)[0]?.trim()).filter(Boolean);
    return [
      {
        id: names[0]?.toLowerCase().replace(/\s+/g, '-') ?? 'architect',
        name: names[0] ?? 'Architect',
        role: 'architect',
        description: lines[0] ?? 'Planner',
        owns: ['planning', 'phase-sequencing', 'architecture'],
        delegatesTo: ['research-pool'],
        readOnly: ['execution-state', 'quality-state'],
        gates: ['plan-gate'],
      },
      {
        id: names[1]?.toLowerCase().replace(/\s+/g, '-') ?? 'executor',
        name: names[1] ?? 'Executor',
        role: 'executor',
        description: lines[1] ?? 'Executor',
        owns: ['execution', 'qa-gates', 'completion'],
        delegatesTo: ['execution-pool', 'qa-pool'],
        readOnly: ['plan-state', 'quality-state'],
        gates: ['qa-gate', 'test-gate', 'review-gate'],
      },
      {
        id: names[2]?.toLowerCase().replace(/\s+/g, '-') ?? 'guardian',
        name: names[2] ?? 'Guardian',
        role: 'guardian',
        description: lines[2] ?? 'Guardian',
        owns: ['context', 'knowledge', 'quality'],
        delegatesTo: ['knowledge-pool'],
        readOnly: ['plan-state', 'execution-state'],
        gates: ['quality-gate', 'knowledge-gate'],
      },
    ];
  }

  return [];
}

function parseClusters(answer: string): ClusterSpec[] {
  const items = answer.split(',').map((s) => s.trim()).filter(Boolean);
  return items.map((item) => {
    const id = item.toLowerCase().replace(/\s+/g, '-');
    return {
      id,
      name: item,
      description: `${item} workflow`,
      agentIds: [],
      intraClusterDelegation: true,
      interClusterDelegation: false,
      sharedContext: true,
    };
  });
}

function parseAgentRoles(answer: string, clusters: ClusterSpec[]): AgentRoleSpec[] {
  const roles: AgentRoleSpec[] = [];
  const lines = answer.split('\n').filter(Boolean);

  for (const line of lines) {
    const parts = line.split(':');
    const roleName = parts[0]?.trim();
    const capabilities = parts[1]?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];

    if (roleName) {
      const id = roleName.toLowerCase().replace(/\s+/g, '-');
      const cluster = clusters.find((c) => c.id.includes(id)) ?? clusters[0];

      roles.push({
        id,
        name: roleName,
        description: `${roleName} agent`,
        mode: id,
        cluster: cluster?.id ?? 'default',
        capabilities,
        suggestedTools: capabilities.length > 0 ? ['*'] : ['read', 'write'],
        maxConcurrentTasks: 1,
      });
    }
  }

  return roles;
}

function parseSyncMode(answer: string): SyncMode {
  const yes = answer.toLowerCase().startsWith('y');
  return {
    type: yes ? 'shared-state' : 'direct',
    description: yes ? 'Parallel execution with shared state store' : 'Direct messaging between orchestrators',
  };
}
