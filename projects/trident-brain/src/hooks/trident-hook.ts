/**
 * Trident Brain Hooks - AUDIT MODE
 * 
 * Simplified hook system for Trident Code Review Mode.
 */

import type { Hooks } from '@opencode-ai/plugin';
import type { ModeCoordinator, ModeType } from '../shared/mode-coordinator.js';

export interface TridentState {
  currentMode: ModeType | null;
  currentLayer: number;
  iteration: string;
  target: string;
  depth: number;
  artifacts: Map<string, string>;
  auditActive: boolean;
}

export interface TridentHooksOptions {
  coordinator: ModeCoordinator;
  state: TridentState;
}

export function createTridentHooks(options: TridentHooksOptions): Partial<Hooks> {
  const { coordinator, state } = options;

  function parseAuditCommand(message: string): { target?: string; depth?: number } | null {
    const lowerMsg = message.toLowerCase();
    
    if (!lowerMsg.includes('/audit') && !lowerMsg.includes('audit this')) {
      return null;
    }
    
    const parts = message.split(' ');
    const targetIndex = parts.findIndex(p => p.toLowerCase() === 'audit');
    
    let target = '.';
    let depth = 7;
    
    if (targetIndex >= 0) {
      const nextPart = parts[targetIndex + 1];
      if (nextPart && !nextPart.startsWith('--') && !nextPart.startsWith('/')) {
        target = nextPart;
      }
    }
    
    const depthMatch = message.match(/--depth=(\d+)/);
    if (depthMatch) {
      depth = parseInt(depthMatch[1]);
    }
    
    return { target, depth };
  }

  return {
    'tool.execute.before': async (input: any, output: any) => {
      if (!state.currentMode) return;
      
      const toolName = input.tool as string;
      const validation = coordinator.validateTool(toolName, state.currentMode);
      
      if (!validation.valid) {
        console.log(`[Trident Brain] Tool blocked: ${toolName}`);
        output.blocked = true;
        output.blockReason = `[Trident Brain] ${validation.reason}`;
      }
    },

    'tool.execute.after': async (input: any, output: any) => {
      if (!state.currentMode) return;
      
      const toolName = input.tool as string;
      if (toolName === 'write_file' || toolName === 'write') {
        const content = input.args?.content || input.args?.text || '';
        const filename = input.args?.filename || input.args?.path || 'unknown';
        
        if (content && typeof content === 'string') {
          state.artifacts.set(`artifact:${filename}`, content);
          console.log(`[Trident Brain] Artifact noted: ${filename}`);
        }
      }
    }
  };
}

export function createTridentState(): TridentState {
  return {
    currentMode: null,
    currentLayer: 0,
    iteration: 'V1.0',
    target: '',
    depth: 7,
    artifacts: new Map(),
    auditActive: false
  };
}
