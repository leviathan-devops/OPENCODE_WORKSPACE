/**
 * Kraken V2.0 - Multi-Brain Orchestrator with Dynamic Context Management
 * 
 * Key V2.0 Features:
 * 1. Two-Layer Firewall (Tool + Message enforcement)
 * 2. Mechanical Output Verification (fs.existsSync checkpoints)
 * 3. Structured Override Commands (Typed schema)
 * 4. Explicit Gate Criteria (Per-brain requirements)
 * 5. Four-Tier Compaction Management (65%→75%→85%)
 */

import type { Plugin, Hooks } from '@opencode-ai/plugin';
import {
  createEventHook,
  createChatMessageHook,
  createToolGuardianHook,
  createGateHook,
  getSystemBrain,
  getExecutionBrain,
  getPlanningBrain,
  getCouncil,
} from './hooks/index.js';

// ============================================================================
// KRAKEN ORCHESTRATOR
// ============================================================================

class KrakenOrchestrator {
  private initialized = false;
  
  initialize(): void {
    if (this.initialized) return;
    
    console.log('[Kraken V2.0] Initializing multi-brain orchestrator...');
    console.log('[Kraken V2.0] Features:');
    console.log('  - Two-Layer Guardian (Tool + Message enforcement)');
    console.log('  - Mechanical Output Verification');
    console.log('  - Structured Override Commands');
    console.log('  - Explicit Gate Criteria');
    console.log('  - Four-Tier Compaction Management');
    
    this.initialized = true;
  }
  
  createHooks(): Hooks {
    return {
      event: createEventHook(),
      'chat.message': createChatMessageHook(),
      'tool.execute.before': createToolGuardianHook(),
      'tool.execute.after': createGateHook(),
    };
  }
  
  // Tools
  createTools() {
    return {
      'kraken-status': {
        description: 'Show Kraken V2.0 status',
        execute: async () => {
          const systemBrain = getSystemBrain();
          const executionBrain = getExecutionBrain();
          const planningBrain = getPlanningBrain();
          const council = getCouncil();
          
          return {
            version: '2.0.0',
            initialized: this.initialized,
            systemBrain: systemBrain.isInitialized(),
            executionBrain: executionBrain.isInitialized(),
            planningBrain: planningBrain.isInitialized(),
            councilReady: council.isInitialized(),
            currentGate: systemBrain.getCurrentGate(),
          };
        },
      },
      
      'kraken-gate-status': {
        description: 'Show current gate criteria status',
        execute: async () => {
          const systemBrain = getSystemBrain();
          const currentGate = systemBrain.getCurrentGate();
          const result = systemBrain.evaluateGateEntry(currentGate);
          
          return {
            gate: currentGate,
            allPassed: result.allPassed,
            blockers: result.blockers,
            details: result.details,
          };
        },
      },
    };
  }
}

// ============================================================================
// PLUGIN EXPORT
// ============================================================================

const kraken = new KrakenOrchestrator();

export default {
  name: 'kraken-agent-v2.0',
  version: '2.0.0',
  
  onLoad: () => {
    kraken.initialize();
    console.log('[Kraken V2.0] Plugin loaded');
  },
  
  hooks: () => kraken.createHooks(),
  
  tools: () => kraken.createTools(),
} satisfies Plugin;
