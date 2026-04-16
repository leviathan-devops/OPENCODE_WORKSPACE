/**
 * src/coordination/persistence/swarm-state.ts
 * 
 * Thin facade that composes plan, evidence, and checkpoint stores.
 * Does NOT contain file I/O logic - delegated to sub-modules.
 */

import type { Plan, Evidence, Checkpoint, SwarmState, Task } from '../types.js';
import { createPlanStore, type PlanStore } from './plan-store.js';
import { createEvidenceStore, type EvidenceStore } from './evidence-store.js';
import { createCheckpointStore, type CheckpointStore } from './checkpoint-store.js';

export interface SwarmStateManager extends SwarmState {
  // Plan operations
  loadPlan(): Promise<Plan | null>;
  savePlan(plan: Plan): Promise<void>;
  syncPlan(plan: Plan): Promise<Plan>;
  generatePlanMarkdown(): Promise<string>;
  
  // Evidence operations  
  addEvidence(evidence: Omit<Evidence, 'id' | 'timestamp'>): Evidence;
  getEvidence(taskId?: string): Promise<Evidence[]>;
  verifyEvidence(evidenceId: string): boolean;
  
  // Checkpoint operations
  createCheckpoint(label: string, metadata?: Record<string, unknown>): Promise<Checkpoint>;
  restoreCheckpoint(checkpointId: string): Promise<Plan | null>;
  listCheckpoints(): Promise<Checkpoint[]>;
}

export function createSwarmStateManager(baseDir: string): SwarmStateManager {
  // Sub-modules handle all file I/O
  const planStore: PlanStore = createPlanStore(baseDir);
  const evidenceStore: EvidenceStore = createEvidenceStore(baseDir);
  const checkpointStore: CheckpointStore = createCheckpointStore(baseDir);
  
  // In-memory state
  let currentPlan: Plan | null = null;
  const tasks = new Map<string, Task>();
  
  return {
    // SwarmState properties
    get plan() { return currentPlan; },
    get tasks() { return tasks; },
    get evidence() { return []; }, // Lazy loaded
    get checkpoints() { return []; }, // Lazy loaded
    
    // Plan operations
    async loadPlan(): Promise<Plan | null> {
      currentPlan = await planStore.loadPlan();
      return currentPlan;
    },
    
    async savePlan(plan: Plan): Promise<void> {
      currentPlan = plan;
      await planStore.savePlan(plan);
    },
    
    async syncPlan(plan: Plan): Promise<Plan> {
      currentPlan = await planStore.syncPlan(plan);
      return currentPlan;
    },
    
    async generatePlanMarkdown(): Promise<string> {
      if (!currentPlan) return '';
      return planStore.generatePlanMarkdown(currentPlan);
    },
    
    // Evidence operations
    addEvidence(input: Omit<Evidence, 'id' | 'timestamp'>): Evidence {
      return evidenceStore.addEvidence(input);
    },
    
    async getEvidence(taskId?: string): Promise<Evidence[]> {
      return evidenceStore.getEvidence(taskId);
    },
    
    verifyEvidence(evidenceId: string): boolean {
      return evidenceStore.verifyEvidence(evidenceId);
    },
    
    // Checkpoint operations
    async createCheckpoint(label: string, metadata?: Record<string, unknown>): Promise<Checkpoint> {
      if (!currentPlan) {
        throw new Error('No plan to checkpoint');
      }
      return checkpointStore.createCheckpoint(label, currentPlan, metadata);
    },
    
    async restoreCheckpoint(checkpointId: string): Promise<Plan | null> {
      const checkpoint = await checkpointStore.restoreCheckpoint(checkpointId);
      if (checkpoint) {
        currentPlan = checkpoint.snapshot;
        return currentPlan;
      }
      return null;
    },
    
    async listCheckpoints(): Promise<Checkpoint[]> {
      return checkpointStore.listCheckpoints();
    },
  };
}
