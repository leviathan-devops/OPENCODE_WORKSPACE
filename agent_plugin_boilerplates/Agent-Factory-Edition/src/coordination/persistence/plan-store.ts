/**
 * src/coordination/persistence/plan-store.ts
 * 
 * Plan file operations with atomic write pattern.
 */

import { writeFile, readFile, mkdir, rename, open } from 'fs/promises';
import { join } from 'path';
import type { Plan } from '../types.js';
import { formatTimestamp } from '../utils.js';

export interface PlanStore {
  loadPlan(): Promise<Plan | null>;
  savePlan(plan: Plan): Promise<void>;
  syncPlan(plan: Plan): Promise<Plan>;
  generatePlanMarkdown(plan: Plan): string;
}

export function createPlanStore(baseDir: string): PlanStore {
  const planFile = join(baseDir, 'plan.json');
  
  async function ensureDir(): Promise<void> {
    await mkdir(baseDir, { recursive: true });
  }
  
  return {
    async loadPlan(): Promise<Plan | null> {
      try {
        const content = await readFile(planFile, 'utf-8');
        return JSON.parse(content) as Plan;
      } catch {
        // File doesn't exist yet - not an error
        return null;
      }
    },
    
    async savePlan(plan: Plan): Promise<void> {
      await ensureDir();
      
      // Atomic write pattern:
      // 1. Write to temp file
      // 2. fsync to ensure durability
      // 3. Rename to final location
      const tmpPath = `${planFile}.tmp`;
      const content = JSON.stringify(plan, null, 2);
      
      await writeFile(tmpPath, content, 'utf-8');
      
      // Sync the temp file to ensure it's written to disk
      const fd = await open(tmpPath, 'r+');
      await fd.sync();
      await fd.close();
      
      // Rename to final location (atomic on POSIX)
      await rename(tmpPath, planFile);
    },
    
    async syncPlan(plan: Plan): Promise<Plan> {
      // Update timestamps and save
      plan.updatedAt = Date.now();
      await this.savePlan(plan);
      return plan;
    },
    
    generatePlanMarkdown(plan: Plan): string {
      const lines: string[] = [
        `# ${plan.title}`,
        '',
        `**Spider ID**: ${plan.spiderId}`,
        `**Last Updated**: ${formatTimestamp(plan.updatedAt)}`,
        '',
        '## Phases',
        '',
      ];
      
      for (const phase of plan.phases) {
        const status = phase.status === 'completed' ? '✅' : 
                       phase.status === 'in_progress' ? '🔄' :
                       phase.status === 'blocked' ? '🚫' : '⏳';
        
        lines.push(`### ${status} Phase ${phase.id}: ${phase.name}`);
        lines.push('');
        
        for (const task of phase.tasks) {
          const taskStatus = task.status === 'completed' ? '[x]' :
                            task.status === 'in_progress' ? '[>]' :
                            task.status === 'blocked' ? '[!]' : '[ ]';
          
          const size = task.size ? ` [${task.size.toUpperCase()}]` : '';
          const depends = task.depends?.length ? ` *(depends: ${task.depends.join(', ')})*` : '';
          
          lines.push(`- ${taskStatus} ${task.id}: ${task.description}${size}${depends}`);
        }
        lines.push('');
      }
      
      return lines.join('\n');
    },
  };
}
