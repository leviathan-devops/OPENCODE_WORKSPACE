/**
 * src/coordination/persistence/checkpoint-store.ts
 * 
 * Checkpoint management with atomic write pattern.
 */

import { writeFile, readFile, mkdir, rename, open } from 'fs/promises';
import { join } from 'path';
import type { Checkpoint, Plan } from '../types.js';
import { randomId } from '../utils.js';

export interface CheckpointStore {
  createCheckpoint(label: string, plan: Plan, metadata?: Record<string, unknown>): Promise<Checkpoint>;
  restoreCheckpoint(checkpointId: string): Promise<Checkpoint | null>;
  listCheckpoints(): Promise<Checkpoint[]>;
  deleteCheckpoint(checkpointId: string): Promise<boolean>;
}

export function createCheckpointStore(baseDir: string): CheckpointStore {
  const checkpointsDir = join(baseDir, 'checkpoints');
  const indexFile = join(baseDir, 'checkpoints-index.json');
  
  let index: Checkpoint[] = [];
  
  async function ensureDir(): Promise<void> {
    await mkdir(checkpointsDir, { recursive: true });
  }
  
  async function loadIndex(): Promise<Checkpoint[]> {
    try {
      const content = await readFile(indexFile, 'utf-8');
      return JSON.parse(content) as Checkpoint[];
    } catch {
      return [];
    }
  }
  
  async function saveIndex(): Promise<void> {
    await ensureDir();
    
    // Atomic write pattern
    const tmpPath = `${indexFile}.tmp`;
    const content = JSON.stringify(index, null, 2);
    
    await writeFile(tmpPath, content, 'utf-8');
    
    const fd = await open(tmpPath, 'r+');
    await fd.sync();
    await fd.close();
    
    await rename(tmpPath, indexFile);
  }
  
  return {
    async createCheckpoint(
      label: string,
      plan: Plan,
      metadata?: Record<string, unknown>
    ): Promise<Checkpoint> {
      await ensureDir();
      
      const checkpoint: Checkpoint = {
        id: randomId('cp'),
        label,
        planId: plan.id,
        createdAt: Date.now(),
        snapshot: JSON.parse(JSON.stringify(plan)), // Deep clone
        metadata,
      };
      
      // Save checkpoint data to individual file
      const checkpointFile = join(checkpointsDir, `${checkpoint.id}.json`);
      const tmpPath = `${checkpointFile}.tmp`;
      
      await writeFile(tmpPath, JSON.stringify(checkpoint, null, 2), 'utf-8');
      
      const fd = await open(tmpPath, 'r+');
      await fd.sync();
      await fd.close();
      
      await rename(tmpPath, checkpointFile);
      
      // Update index
      index = await loadIndex();
      index.push(checkpoint);
      await saveIndex();
      
      return checkpoint;
    },
    
    async restoreCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
      try {
        const checkpointFile = join(checkpointsDir, `${checkpointId}.json`);
        const content = await readFile(checkpointFile, 'utf-8');
        return JSON.parse(content) as Checkpoint;
      } catch {
        return null;
      }
    },
    
    async listCheckpoints(): Promise<Checkpoint[]> {
      if (index.length === 0) {
        index = await loadIndex();
      }
      return [...index].sort((a, b) => b.createdAt - a.createdAt);
    },
    
    async deleteCheckpoint(checkpointId: string): Promise<boolean> {
      index = await loadIndex();
      const idx = index.findIndex(cp => cp.id === checkpointId);
      
      if (idx === -1) return false;
      
      index.splice(idx, 1);
      await saveIndex();
      
      return true;
    },
  };
}
