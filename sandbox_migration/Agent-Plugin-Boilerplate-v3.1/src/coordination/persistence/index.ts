/**
 * src/coordination/persistence/index.ts
 * 
 * Persistence layer exports.
 */

export { createPluginStateManager, type PluginStateManager } from './plugin-state.js';
export { createPlanStore, type PlanStore } from './plan-store.js';
export { createEvidenceStore, type EvidenceStore, generateEvidenceSignature } from './evidence-store.js';
export { createCheckpointStore, type CheckpointStore } from './checkpoint-store.js';
