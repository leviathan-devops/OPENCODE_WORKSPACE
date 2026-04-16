/**
 * V4.1 Architecture Elicitation Wizard — Types
 *
 * Stateless types for the natural-language architecture elicitation flow.
 * The wizard interviews the user, extracts requirements, and produces
 * an ArchitectureConfig that flows through the V4 factory.
 */

import type { ArchitectureConfig } from '../factory/types.js';

// ============================================================
// ELICITATION STATE
// ============================================================

export interface ElicitationState {
  /** Unique session ID for this elicitation */
  sessionId: string;
  /** Where we are in the elicitation flow */
  phase: ElicitationPhase;
  /** What we've extracted so far */
  extracted: Partial<ExtractedArchitecture>;
  /** Questions pending user answer */
  pendingQuestions: Question[];
  /** Chat history for context */
  messages: ChatMessage[];
  /** User's original raw idea */
  originalIdea: string;
  /** Timestamp when started */
  startedAt: number;
  /** Last activity timestamp */
  lastActivityAt: number;
}

export type ElicitationPhase =
  | 'idea_capture'      // Initial idea received
  | 'clarification'     // Asking clarifying questions
  | 'synthesis'         // Building the config from extracted data
  | 'review'            // Presenting config to user for review
  | 'iterating'         // User wants changes
  | 'complete';         // Config finalized, ready for factory

// ============================================================
// EXTRACTED ARCHITECTURE DATA
// ============================================================

export interface ExtractedArchitecture {
  /** Name of the system */
  name: string;
  /** High-level description */
  description: string;
  /** Brain type: single, dual, trio, or custom */
  brainType: BrainTypeSuggestion;
  /** List of orchestrator roles */
  orchestrators: OrchestratorSpec[];
  /** Workflow clusters */
  clusters: ClusterSpec[];
  /** Agent roles needed */
  agentRoles: AgentRoleSpec[];
  /** Delegation rules */
  delegation: DelegationSpec;
  /** Sync mechanism */
  syncMode: SyncMode;
  /** Domain ownership */
  domainOwnership: DomainOwnershipSpec;
  /** Any special requirements */
  specialRequirements: string[];
}

export type BrainTypeSuggestion = 'single' | 'dual' | 'trio' | 'custom';

export interface OrchestratorSpec {
  id: string;
  name: string;
  role: OrchestratorRole;
  description: string;
  owns: string[];         // State domains this orchestrator writes
  delegatesTo: string[];  // Cluster IDs it can delegate to
  readOnly: string[];      // State domains it reads but doesn't write
  gates: string[];        // Quality gates it enforces
}

export type OrchestratorRole =
  | 'architect'      // Planning, long-term thinking
  | 'executor'       // Execution, tracking, QA
  | 'guardian'       // Quality, knowledge, context
  | 'coordinator'    // General coordination
  | 'strategist';     // High-level strategy

export interface ClusterSpec {
  id: string;
  name: string;
  description: string;
  agentIds: string[];
  intraClusterDelegation: boolean;
  interClusterDelegation: boolean;
  sharedContext: boolean;
}

export interface AgentRoleSpec {
  id: string;
  name: string;
  description: string;
  mode: string;
  cluster: string;
  capabilities: string[];
  suggestedTools: string[];
  maxConcurrentTasks: number;
}

export interface DelegationSpec {
  allowCrossCluster: boolean;
  requireGateApproval: boolean;
  maxHops: number;
}

export interface SyncMode {
  type: 'shared-state' | 'direct' | 'hybrid' | 'none';
  description?: string;
}

export interface DomainOwnershipSpec {
  planState: string;      // Who owns plan-state
  executionState: string; // Who owns execution-state
  qualityState: string;   // Who owns quality-state
}

// ============================================================
// QUESTION SYSTEM
// ============================================================

export interface Question {
  id: string;
  /** Which extraction target this question feeds into */
  targets: (keyof ExtractedArchitecture | string)[];
  /** The question text */
  text: string;
  /** Optional context about why we're asking */
  rationale?: string;
  /** Question type */
  type: QuestionType;
  /** For multiple choice */
  options?: QuestionOption[];
  /** Follow-up questions to ask after this one */
  followUps?: Question[];
  /** Priority: higher = asked first */
  priority: number;
  /** Asked at timestamp */
  askedAt?: number;
  /** Answered at timestamp */
  answeredAt?: number;
  /** User's answer */
  answer?: string;
}

export type QuestionType =
  | 'free_text'      // Arbitrary text answer
  | 'single_choice'  // Pick one from options
  | 'multi_choice'   // Pick multiple from options
  | 'yes_no'         // Yes or no
  | 'scale'          // 1-5 scale
  | 'list';          // Comma-separated list

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
  /** Auto-selected implications */
  implies?: Partial<ExtractedArchitecture>;
}

// ============================================================
// CHAT MESSAGES
// ============================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  /** If this message answers a question */
  answersQuestion?: string;
}

// ============================================================
// WIZARD OUTPUT
// ============================================================

export interface WizardResult {
  /** Final architecture config ready for factory */
  config: ArchitectureConfig;
  /** Summary of what was extracted */
  summary: ExtractedArchitecture;
  /** Any warnings from validation */
  warnings: string[];
  /** Session ID for potential resume */
  sessionId: string;
}

export interface WizardOptions {
  /** Initial idea from user */
  idea: string;
  /** Optional: resume from existing session */
  sessionId?: string;
  /** Optional: saved state to resume */
  savedState?: ElicitationState;
  /** Brain type preference override */
  preferredBrain?: BrainTypeSuggestion;
  /** Callbacks */
  onQuestion?: (q: Question) => void;
  onStateChange?: (state: ElicitationState) => void;
  onConfigGenerated?: (config: ArchitectureConfig) => void;
  onComplete?: (result: WizardResult) => void;
}

// ============================================================
// QUESTION BANK — Pre-built questions for common elicitation
// ============================================================

export const QUESTION_BANK: QuestionTemplate[] = [
  {
    id: 'brain_type',
    text: 'How many orchestrators should this system have?',
    type: 'single_choice',
    targets: ['brainType', 'orchestrators'],
    options: [
      { value: 'single', label: 'One (Simple)', description: 'Single orchestrator handles everything — like a Spider' },
      { value: 'dual', label: 'Two (Parallel)', description: 'One plans, one executes — like a Shark' },
      { value: 'trio', label: 'Three (Full)', description: 'Planner + Executor + Guardian — most robust' },
    ],
    priority: 10,
  },
  {
    id: 'orchestrator_names',
    text: 'What should we call your orchestrator(s)? Give them names or roles.',
    type: 'free_text',
    targets: ['orchestrators'],
    priority: 9,
  },
  {
    id: 'workflow_clusters',
    text: 'What kinds of work will this system do? (e.g., research, coding, testing, docs)',
    type: 'list',
    targets: ['clusters'],
    priority: 8,
  },
  {
    id: 'agents_per_cluster',
    text: 'For each workflow area, what specialized agents do you need?',
    type: 'free_text',
    targets: ['agentRoles'],
    priority: 7,
  },
  {
    id: 'delegation_pattern',
    text: 'Should agents be able to hand work to agents in OTHER teams/clusters?',
    type: 'yes_no',
    targets: ['delegation'],
    priority: 6,
  },
  {
    id: 'quality_gates',
    text: 'Do you want formal quality gates — where work must be approved before moving forward?',
    type: 'yes_no',
    targets: ['delegation', 'orchestrators'],
    priority: 5,
  },
  {
    id: 'parallel_execution',
    text: 'Should planning and execution happen simultaneously (in parallel)?',
    type: 'yes_no',
    targets: ['syncMode', 'orchestrators'],
    priority: 4,
  },
  {
    id: 'context_sharing',
    text: 'Should agents in different teams share context with each other?',
    type: 'yes_no',
    targets: ['clusters'],
    priority: 3,
  },
  {
    id: 'special_requirements',
    text: 'Any special requirements? (e.g., "must support long conversations", "needs code review", "no internet access")',
    type: 'list',
    targets: ['specialRequirements'],
    priority: 2,
  },
];

export interface QuestionTemplate {
  id: string;
  text: string;
  type: QuestionType;
  targets: string[];
  options?: QuestionOption[];
  priority: number;
}
