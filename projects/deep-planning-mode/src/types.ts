/**
 * DEEP PLANNING MODE - Types
 * 
 * Shared type definitions used across the plugin.
 */

export const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO',
} as const;

export type Severity = typeof SEVERITY[keyof typeof SEVERITY];

export interface Finding {
  pattern: string;
  category: string;
  match: string;
  line: number;
  column: number;
  severity: Severity;
  note?: string;
  evidence: string;
}

export interface ScanOptions {
  maxMatches?: number;
  maxLineLength?: number;
}

export interface PlanData {
  task: string;
  requirements: string[];
  constraints: Constraint[];
  dependencies: Dependency[];
  risks: Risk[];
  checkpoints: Checkpoint[];
  steps: Step[];
}

export interface Constraint {
  type: 'time' | 'scope' | 'resource' | 'budget';
  value: string;
  hard: boolean;
}

export interface Dependency {
  id: string;
  name: string;
  type: 'file' | 'api' | 'service' | 'human';
  dependsOn: string[];
  blockedBy?: string[];
}

export interface Risk {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  criteria: string[];
  time: string;
  owner: string;
}

export interface Step {
  id: string;
  name: string;
  description: string;
  time: string;
  owner: 'agent' | 'human' | 'system';
  criteria: string[];
  rollback: string;
  dependencies: string[];
}

export interface CommandResult {
  success: boolean;
  output: string;
  state: ModeState;
}

export interface ModeState {
  mode: 'idle' | 'planning' | 'analyzing' | 'validating';
  currentPlan: PlanData | null;
  context: string;
  lastError?: string;
  lastFindings: Finding[];
}

export interface Lesson {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  problem: string;
  symptom: string;
  rootCause: string;
  fix: string;
  codeExample: {
    bad: string;
    good: string;
  };
  detection?: string;
  prevention?: string;
}

export interface PlanTemplate {
  name: string;
  description: string;
  sections: string[];
  generate: (data: PlanData) => string;
}
