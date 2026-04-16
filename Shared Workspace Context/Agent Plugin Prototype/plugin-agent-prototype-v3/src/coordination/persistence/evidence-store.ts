/**
 * src/coordination/persistence/evidence-store.ts
 * 
 * Evidence collection with atomic write pattern.
 */

import { writeFile, readFile, mkdir, rename, open } from 'fs/promises';
import { join } from 'path';
import type { Evidence } from '../types.js';
import { randomId } from '../utils.js';

export interface EvidenceStore {
  addEvidence(evidence: Omit<Evidence, 'id' | 'timestamp'>): Evidence;
  getEvidence(taskId?: string): Promise<Evidence[]>;
  verifyEvidence(evidenceId: string): boolean;
  getEvidenceByPhase(phase: number): Promise<Evidence[]>;
}

export function createEvidenceStore(baseDir: string): EvidenceStore {
  const evidenceFile = join(baseDir, 'evidence.json');
  let evidence: Evidence[] = [];
  
  async function ensureDir(): Promise<void> {
    await mkdir(baseDir, { recursive: true });
  }
  
  async function load(): Promise<Evidence[]> {
    try {
      const content = await readFile(evidenceFile, 'utf-8');
      return JSON.parse(content) as Evidence[];
    } catch {
      return [];
    }
  }
  
  async function save(): Promise<void> {
    await ensureDir();
    
    // Atomic write pattern
    const tmpPath = `${evidenceFile}.tmp`;
    const content = JSON.stringify(evidence, null, 2);
    
    await writeFile(tmpPath, content, 'utf-8');
    
    // Sync to ensure written to disk
    const fd = await open(tmpPath, 'r+');
    await fd.sync();
    await fd.close();
    
    await rename(tmpPath, evidenceFile);
  }
  
  return {
    addEvidence(input: Omit<Evidence, 'id' | 'timestamp'>): Evidence {
      const newEvidence: Evidence = {
        ...input,
        id: randomId('ev'),
        timestamp: Date.now(),
      };
      
      evidence.push(newEvidence);
      
      // Fire and forget save - don't block on persistence
      save().catch(console.error);
      
      return newEvidence;
    },
    
    async getEvidence(taskId?: string): Promise<Evidence[]> {
      if (evidence.length === 0) {
        evidence = await load();
      }
      
      if (taskId) {
        return evidence.filter(e => e.taskId === taskId);
      }
      
      return [...evidence];
    },
    
    verifyEvidence(evidenceId: string): boolean {
      return evidence.some(e => e.id === evidenceId);
    },
    
    async getEvidenceByPhase(phase: number): Promise<Evidence[]> {
      if (evidence.length === 0) {
        evidence = await load();
      }
      
      return evidence.filter(e => e.phase === phase);
    },
  };
}

export function generateEvidenceSignature(evidence: Evidence): string {
  // Simple signature based on content
  const content = JSON.stringify({
    taskId: evidence.taskId,
    type: evidence.type,
    verdict: evidence.verdict,
    agent: evidence.agent,
    timestamp: evidence.timestamp,
  });
  
  // Simple hash for demo - in production use crypto
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `sig_${Math.abs(hash).toString(16)}`;
}
