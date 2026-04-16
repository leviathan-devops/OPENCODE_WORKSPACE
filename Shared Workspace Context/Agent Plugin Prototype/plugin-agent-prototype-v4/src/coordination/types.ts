/**
 * src/coordination/types.ts
 * 
 * Shared types for the Agent Coordination Layer.
 */

import type { ToolContext } from '@opencode-ai/plugin';

// ============================================================
// AGENT TYPES
// ============================================================

export type AgentMode = 'architect' | 'coder' | 'reviewer' | 'test-engineer' | 'sme' | 'explorer' | 'critic';

export interface AgentDefinition {
  id: string;
  name: string;
  mode: AgentMode;
  description: string;
  cluster?: string;
  capabilities: string[];
  allowedTools: string[];
  maxConcurrentTasks: number;
  agentPrefix?: string;
}

// ============================================================
// CLUSTER TYPES
// ============================================================

export interface ClusterDefinition {
  id: string;
  name: string;
  description: string;
  agents: string[];
  parentCluster?: string;
}

// ============================================================
// DELEGATION TYPES
// ============================================================

export interface DelegationTarget {
  agentId: string;
  agentMode: AgentMode;
  cluster?: string;
}

export interface DelegationRequest {
  taskId: string;
  target: DelegationTarget;
  task: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  context?: Record<string, unknown>;
}

export interface DelegationResult {
  success: boolean;
  taskId: string;
  delegatedTo?: string;
  reason?: string;
  gateResult?: GateResult;
}

// ============================================================
// GATE TYPES
// ============================================================

export type GateDecision = 'APPROVED' | 'REJECTED' | 'WARNING' | 'BLOCKED';

export type GatePolicy = 'strict' | 'advisory' | 'off';

export interface GateResult {
  decision: GateDecision;
  gateName: string;
  reason: string;
  details?: Record<string, unknown>;
  consecutiveRejections?: number;
}

export interface GateConfig {
  policy: GatePolicy;
  maxRejections?: number;
  warningThreshold?: number;
}

// ============================================================
// STATE MACHINE TYPES
// ============================================================

export type TaskStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export interface StateTransition {
  from: TaskStatus;
  to: TaskStatus;
  guard?: (task: Task) => boolean;
  label?: string;
}

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  assignedAgent?: string;
  depends?: string[];
  createdAt: number;
  updatedAt: number;
  phase?: string;
  acceptance?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface StateMachine {
  createTask(input: CreateTaskInput): Task;
  transition(taskId: string, to: TaskStatus): Task | null;
  getTask(taskId: string): Task | null;
  getTasksByState(state: TaskStatus): Task[];
  getTasksByAgent(agentId: string): Task[];
  canTransition(taskId: string, to: TaskStatus): boolean;
  getStats(): { totalTasks: number; byStatus: Partial<Record<TaskStatus, number>> };
}

export interface CreateTaskInput {
  id: string;
  description: string;
  assignedAgent?: string;
  depends?: string[];
  phase?: string;
  acceptance?: string;
  size?: 'small' | 'medium' | 'large';
}

// ============================================================
// PERSISTENCE TYPES
// ============================================================

export interface Plan {
  id: string;
  title: string;
  spiderId: string;
  phases: Phase[];
  createdAt: number;
  updatedAt: number;
  currentPhase?: string;
}

export interface Phase {
  id: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  tasks: Task[];
}

export interface Evidence {
  id: string;
  taskId: string;
  phase: number;
  type: string;
  verdict: 'pass' | 'fail' | 'partial';
  agent: string;
  timestamp: number;
  data: Record<string, unknown>;
  signature?: string;
}

export interface Checkpoint {
  id: string;
  label: string;
  planId: string;
  createdAt: number;
  snapshot: Plan;
  metadata?: Record<string, unknown>;
}

export interface SwarmState {
  plan: Plan | null;
  tasks: Map<string, Task>;
  evidence: Evidence[];
  checkpoints: Checkpoint[];
}

// ============================================================
// COORDINATION CONFIG TYPES
// ============================================================

export interface CoordinationConfig {
  enabled: boolean;
  swarmId: string;
  swarmName: string;
  agents: Record<string, AgentDefinition>;
  clusters?: Record<string, ClusterDefinition>;
  gates?: {
    delegation?: GateConfig;
    qa?: GateConfig;
    brainstorm?: GateConfig;
  };
  guardrails?: {
    maxDuration?: number;
    idleTimeout?: number;
    errorThreshold?: number;
  };
  storage?: {
    baseDir: string;
    autoSave?: boolean;
  };
}

// ============================================================
// TOOL CONTEXT TYPES (OpenCode-specific)
// ============================================================

export interface CoordinationToolContext extends ToolContext {
  coordination: {
    getState(): SwarmState;
    getPlan(): Plan | null;
    getTask(taskId: string): Task | null;
    getEvidence(taskId: string): Evidence[];
  };
}

// ============================================================
// REGISTRY TYPES
// ============================================================

export interface AgentRegistry {
  getAgent(agentId: string): AgentDefinition | null;
  getAgentsByMode(mode: AgentMode): AgentDefinition[];
  getAgentsByCluster(clusterId: string): AgentDefinition[];
  isAgentAllowedTool(agentId: string, toolName: string): boolean;
  listAgents(): AgentDefinition[];
}

export interface DelegationEngine {
  delegate(request: DelegationRequest): Promise<DelegationResult>;
  canDelegate(fromAgent: string, toAgent: string): boolean;
  getClusterAgents(clusterId: string): AgentDefinition[];
  enforceGate(request: DelegationRequest): GateResult;
}

// ============================================================
// HOOK TYPES
// ============================================================

export type CoordinationHookName =
  | 'delegation.before'
  | 'delegation.after'
  | 'task.created'
  | 'task.transition'
  | 'gate.evaluated'
  | 'evidence.added'
  | 'checkpoint.created';

export interface CoordinationHooks {
  [key: string]: Array<(...args: any[]) => Promise<void> | void> | undefined;
}

// ============================================================
// COMMAND TYPES
// ============================================================

export interface CommandDefinition {
  name: string;
  description: string;
  handler: (context: ToolContext, args: string[]) => Promise<void>;
}

export interface CommandRegistry {
  register(command: CommandDefinition): void;
  unregister(name: string): boolean;
  get(name: string): CommandDefinition | null;
  list(): CommandDefinition[];
}
