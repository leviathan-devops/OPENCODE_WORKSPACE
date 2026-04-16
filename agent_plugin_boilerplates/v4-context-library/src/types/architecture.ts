/**
 * V4 Architecture Types
 * 
 * Meta-configurable architecture schema for defining custom agent architectures
 * through configuration files, not code.
 */

// ============================================================
// CORE ARCHITECTURE TYPES
// ============================================================

export interface ArchitectureConfig {
  /** Unique identifier for this architecture (e.g., 'spider', 'hermes', 'shark') */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of the architecture pattern */
  description: string;
  
  /** Version of the architecture schema */
  version: 'v4';
  
  /** Brains (orchestrators) in this architecture */
  brains: BrainConfig[];
  
  /** Clusters (agent groups) in this architecture */
  clusters: ClusterConfig[];
  
  /** Agent definitions */
  agents: AgentConfig[];
  
  /** Workflow definitions (phases, gates, etc.) */
  workflows: WorkflowConfig[];
  
  /** Coordination layer configuration */
  coordination: CoordinationConfig;
  
  /** Optional metadata */
  metadata?: {
    author?: string;
    createdAt?: string;
    tags?: string[];
    [key: string]: any;
  };
}

// ============================================================
// BRAIN TYPES
// ============================================================

export interface BrainConfig {
  /** Unique brain identifier */
  id: string;
  
  /** Brain type (orchestrator, supervisor, monitor, etc.) */
  type: 'orchestrator' | 'supervisor' | 'monitor' | 'coordinator' | string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of brain's role */
  description: string;
  
  /** Which clusters this brain coordinates */
  coordinatesClusters: string[];
  
  /** Which agents this brain can directly delegate to */
  canDelegateTo: string[];
  
  /** Brain-specific configuration */
  config: {
    /** Decision-making style (centralized, distributed, hybrid) */
    decisionStyle: 'centralized' | 'distributed' | 'hybrid';
    
    /** Whether this brain can override other brains */
    canOverride?: boolean;
    
    /** Priority level (higher = more authoritative) */
    priority?: number;
    
    /** Brain-specific parameters */
    [key: string]: any;
  };
}

// ============================================================
// CLUSTER TYPES
// ============================================================

export interface ClusterConfig {
  /** Unique cluster identifier */
  id: string;
  
  /** Cluster type (execution, qa, research, planning, etc.) */
  type: 'execution' | 'qa' | 'research' | 'planning' | 'review' | string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of cluster's purpose */
  description: string;
  
  /** Agents belonging to this cluster */
  agentIds: string[];
  
  /** Parent cluster (for hierarchical structures) */
  parentClusterId?: string;
  
  /** Which brain coordinates this cluster */
  coordinatedBy: string;
  
  /** Cluster-specific configuration */
  config: {
    /** Communication style within cluster (sync, async, broadcast) */
    communicationStyle: 'sync' | 'async' | 'broadcast';
    
    /** Whether agents in this cluster can communicate cross-cluster */
    allowCrossCluster?: boolean;
    
    /** Maximum concurrent tasks for the cluster */
    maxConcurrentTasks?: number;
    
    /** Cluster-specific parameters */
    [key: string]: any;
  };
}

// ============================================================
// AGENT TYPES
// ============================================================

export interface AgentConfig {
  /** Unique agent identifier */
  id: string;
  
  /** Agent type/role (architect, coder, reviewer, etc.) */
  type: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of agent's role */
  description: string;
  
  /** Which cluster this agent belongs to */
  clusterId: string;
  
  /** Agent capabilities */
  capabilities: string[];
  
  /** Allowed tools for this agent */
  allowedTools: string[];
  
  /** Maximum concurrent tasks */
  maxConcurrentTasks: number;
  
  /** Agent prompt template (can be file path or inline) */
  promptTemplate: string | {
    /** Template content */
    content: string;
    
    /** Template variables */
    variables?: string[];
  };
  
  /** Agent-specific configuration */
  config: {
    /** Agent behavior style */
    style?: 'aggressive' | 'conservative' | 'balanced';
    
    /** Quality vs speed preference (0-1) */
    qualityBias?: number;
    
    /** Creativity vs precision preference (0-1) */
    creativityBias?: number;
    
    /** Agent-specific parameters */
    [key: string]: any;
  };
}

// ============================================================
// WORKFLOW TYPES
// ============================================================

export interface WorkflowConfig {
  /** Unique workflow identifier */
  id: string;
  
  /** Workflow name */
  name: string;
  
  /** Description of workflow */
  description: string;
  
  /** Phases in this workflow */
  phases: WorkflowPhase[];
  
  /** Gates between phases */
  gates: WorkflowGate[];
  
  /** Which brain manages this workflow */
  managedBy: string;
  
  /** Workflow-specific configuration */
  config: {
    /** Whether workflow can be parallelized */
    allowParallel?: boolean;
    
    /** Whether phases can be skipped */
    allowSkip?: boolean;
    
    /** Whether workflow can be restarted from middle */
    allowRestart?: boolean;
    
    /** Workflow-specific parameters */
    [key: string]: any;
  };
}

export interface WorkflowPhase {
  /** Phase identifier */
  id: string;
  
  /** Phase name */
  name: string;
  
  /** Description of phase */
  description: string;
  
  /** Which agents participate in this phase */
  participatingAgents: string[];
  
  /** Which clusters are involved */
  involvedClusters: string[];
  
  /** Phase-specific configuration */
  config: {
    /** Timeout for phase (in ms) */
    timeout?: number;
    
    /** Whether phase is optional */
    optional?: boolean;
    
    /** Phase-specific parameters */
    [key: string]: any;
  };
}

export interface WorkflowGate {
  /** Gate identifier */
  id: string;
  
  /** Gate name */
  name: string;
  
  /** Description of gate */
  description: string;
  
  /** Which phase this gate follows */
  afterPhase: string;
  
  /** Which phase this gate precedes */
  beforePhase: string;
  
  /** Gate criteria */
  criteria: GateCriteria[];
  
  /** Which brain evaluates this gate */
  evaluatedBy: string;
}

export interface GateCriteria {
  /** Criteria type */
  type: 'evidence' | 'test' | 'review' | 'approval' | 'custom';
  
  /** Criteria description */
  description: string;
  
  /** Required evidence/conditions */
  required: string[];
  
  /** Optional evidence/conditions */
  optional?: string[];
}

// ============================================================
// COORDINATION TYPES
// ============================================================

export interface CoordinationConfig {
  /** Coordination style */
  style: 'hub-spoke' | 'mesh' | 'hierarchical' | 'federated';
  
  /** Communication protocol */
  protocol: 'direct' | 'broadcast' | 'delegated';
  
  /** State management */
  stateManagement: {
    /** Where state is stored */
    storage: 'memory' | 'persistent' | 'distributed';
    
    /** State persistence configuration */
    persistence?: {
      /** Storage backend */
      backend: 'file' | 'database' | 'redis';
      
      /** Storage configuration */
      config: Record<string, any>;
    };
  };
  
  /** Error handling */
  errorHandling: {
    /** Retry policy */
    retryPolicy: {
      maxRetries: number;
      backoff: 'linear' | 'exponential' | 'fixed';
      backoffMs: number;
    };
    
    /** Fallback strategies */
    fallbacks: string[];
  };
  
  /** Coordination-specific configuration */
  config: {
    /** Maximum delegation depth */
    maxDelegationDepth?: number;
    
    /** Whether to allow circular delegation */
    allowCircularDelegation?: boolean;
    
    /** Coordination-specific parameters */
    [key: string]: any;
  };
}

// ============================================================
// FACTORY TYPES
// ============================================================

export interface ArchitectureFactoryOptions {
  /** Base directory for architecture files */
  baseDir?: string;
  
  /** Whether to validate schema */
  validate?: boolean;
  
  /** Custom validators */
  validators?: ((config: ArchitectureConfig) => boolean | string)[];
  
  /** Factory-specific configuration */
  [key: string]: any;
}

export interface CreateArchitectureOptions {
  /** Architecture configuration (file path or object) */
  config: string | ArchitectureConfig;
  
  /** Runtime context */
  context?: any;
  
  /** Whether to initialize coordination layer */
  initializeCoordination?: boolean;
  
  /** Creation-specific options */
  [key: string]: any;
}