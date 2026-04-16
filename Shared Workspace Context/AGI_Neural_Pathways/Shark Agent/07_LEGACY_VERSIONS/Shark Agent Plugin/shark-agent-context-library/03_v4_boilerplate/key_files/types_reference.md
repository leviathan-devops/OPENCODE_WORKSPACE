# V4 Boilerplate Types Reference

## Core Types from `factory/types.ts`

```typescript
// ── Agent Types ───────────────────────────────────────────

type AgentMode = 'architect' | 'coder' | 'reviewer' | 'test-engineer' | 'sme' | 'explorer' | 'critic' | 'generic';

interface AgentDefinition {
  id: string;
  name: string;
  mode: AgentMode;
  description: string;
  cluster?: string;
  capabilities: string[];
  allowedTools: string[];
  maxConcurrentTasks: number;
  prompt?: string;
  model?: string;
  temperature?: number;
  brain?: string;
}

interface AgentTemplate {
  id: string;
  description: string;
  capabilities: string[];
  tools: string[];
  prompt: string;
  defaultModel?: string;
  defaultTemperature?: number;
}

interface AgentOverride {
  prompt?: string;
  model?: string;
  temperature?: number;
  maxConcurrentTasks?: number;
  tools?: string[];
}

// ── Brain Types ──────────────────────────────────────────

type BrainType = 'single' | 'dual' | 'trio';

interface BrainConfig {
  type: BrainType;
  name: string;
  syncMode?: 'shared-state' | 'message-passing';
  orchestrator?: string;
  orchestrators?: Record<string, string>;
  workflows?: Record<string, WorkflowConfig>;
}

interface WorkflowConfig {
  name: string;
  description: string;
  owns?: string[];       // State domains this workflow owns
  delegatesTo?: string[]; // Clusters this workflow can delegate to
  gates?: string[];      // Gates this workflow enforces
}

interface BrainInstance {
  type: BrainType;
  name: string;
  primary: OrchestratorInstance;
  all: OrchestratorInstance[];
  workflows: Record<string, WorkflowConfig>;
  syncMode: 'shared-state' | 'message-passing';
}

interface OrchestratorInstance {
  agentId: string;
  workflows: string[];
}

// ── Cluster Types ────────────────────────────────────────

interface ClusterConfig {
  id: string;
  name: string;
  description?: string;
  agents: string[];
  parentCluster?: string;
  subOrchestrator?: string;
}

interface ClusterInstance {
  config: ClusterConfig;
  agents: AgentDefinition[];
  subOrchestrator?: AgentDefinition;
}

// ── Architecture Types ───────────────────────────────────

interface ArchitectureConfig {
  name: string;
  version: string;
  description?: string;
  brain: BrainConfig;
  clusters: ClusterConfig[];
  agents: Record<string, AgentDefinition | string>; // string = template reference
  delegation?: {
    allowCrossCluster?: boolean;
    requireGateApproval?: boolean;
    maxHops?: number;
  };
}

interface ArchitectureInstance {
  config: ArchitectureConfig;
  agents: Map<string, AgentDefinition>;
  clusters: Map<string, ClusterConfig>;
  brains: BrainInstance & {
    workflows: Record<string, WorkflowConfig>;
    syncMode: 'shared-state' | 'message-passing';
  };
  coordination: {
    registry: AgentRegistry;
    delegation: DelegationEngine;
    stateMachine: StateMachine;
  };
  stateStore: StateStore;
  messenger: BrainMessenger;
}

// ── Validation Types ────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

type Validator<T> = (config: T) => ValidationResult;

// ── State Store Types ────────────────────────────────────

type StateDomain = 'plan-state' | 'execution-state' | 'quality-state';

interface WriteResult {
  success: boolean;
  version: number;
  error?: string;
}

interface StateSnapshot {
  data: Record<string, any>;
  versions: Record<string, number>;
  timestamp: number;
}

interface Unsubscribe {
  (): void;
}

interface StateStore {
  get<T>(key: string, domain?: StateDomain): T | undefined;
  set<T>(key: string, value: T, domain: StateDomain, ownerBrain?: string): WriteResult;
  watch(key: string, callback: (value: any, version: number) => void, domain?: StateDomain): Unsubscribe;
  snapshot(): StateSnapshot;
  restore(snapshot: StateSnapshot): void;
}

// ── Brain Messenger Types ─────────────────────────────────

type MessagePriority = 'critical' | 'high' | 'normal' | 'low';
type MessageType = 'handoff' | 'ack' | 'escalation' | 'info';

interface BrainMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  priority: MessagePriority;
  payload: Record<string, any>;
  timestamp: number;
  requiresAck?: boolean;
}

interface BrainMessenger {
  send(message: BrainMessage): void;
  receive(brainId: string): BrainMessage[];
  waitForAck(messageId: string, timeoutMs: number): Promise<boolean>;
}
```

## V3 Coordination Types from `coordination/types.ts`

```typescript
// Agent coordination types (V3 bridge)
type AgentMode = 'architect' | 'coder' | 'reviewer' | 'test-engineer' | 'sme' | 'explorer' | 'critic';

interface AgentDefinition {
  id: string; name: string; mode: AgentMode; description: string;
  cluster?: string; capabilities: string[]; allowedTools: string[];
  maxConcurrentTasks: number; agentPrefix?: string;
}

interface DelegationTarget {
  agentId: string; agentMode: AgentMode; cluster?: string;
}

interface DelegationRequest {
  taskId: string; target: DelegationTarget; task: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  context?: Record<string, unknown>;
}

interface DelegationResult {
  success: boolean; taskId: string; delegatedTo?: string; reason?: string; gateResult?: GateResult;
}

type GateDecision = 'APPROVED' | 'REJECTED' | 'WARNING' | 'BLOCKED';
type GatePolicy = 'strict' | 'advisory' | 'off';

interface GateResult {
  decision: GateDecision; gateName: string; reason: string;
  details?: Record<string, unknown>; consecutiveRejections?: number;
}

interface AgentRegistry {
  getAgent(agentId: string): AgentDefinition | null;
  getAgentsByMode(mode: AgentMode): AgentDefinition[];
  getAgentsByCluster(clusterId: string): AgentDefinition[];
  isAgentAllowedTool(agentId: string, toolName: string): boolean;
  listAgents(): AgentDefinition[];
}

interface DelegationEngine {
  delegate(request: DelegationRequest): Promise<DelegationResult>;
  canDelegate(fromAgent: string, toAgent: string): boolean;
  getClusterAgents(clusterId: string): AgentDefinition[];
  enforceGate(request: DelegationRequest): GateResult;
}

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked' | 'cancelled';

interface Task {
  id: string; description: string; status: TaskStatus; assignedAgent?: string;
  depends?: string[]; createdAt: number; updatedAt: number;
  phase?: string; acceptance?: string; size?: string;
}

interface StateMachine {
  createTask(input: CreateTaskInput): Task;
  transition(taskId: string, to: TaskStatus): Task | null;
  getTask(taskId: string): Task | null;
  getTasksByState(state: TaskStatus): Task[];
  getTasksByAgent(agentId: string): Task[];
  canTransition(taskId: string, to: TaskStatus): boolean;
}
```
