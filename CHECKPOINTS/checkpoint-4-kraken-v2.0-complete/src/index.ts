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

import type { Plugin, Hooks, PluginInput } from '@opencode-ai/plugin';
import {
  createEventHook,
  createChatMessageHook,
  createToolGuardianHook,
  createToolSummarizerHook,
  createGateHook,
  createCompactionHook,
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
      'tool.execute.after': [createToolSummarizerHook(), createGateHook()],  // Array for multiple hooks
      'experimental.session.compacting': createCompactionHook(),
    };
  }
  
  private createSessionEndedHook(): Hooks['session.ended'] {
    return async () => {
      console.log('[Kraken] Session ended, cleaning up...');
      
      // Get instances and cleanup if needed
      const systemBrain = getSystemBrain();
      const executionBrain = getExecutionBrain();
      const planningBrain = getPlanningBrain();
      
      // Note: In real implementation, call cleanup methods on each brain
      
      console.log('[Kraken] Cleanup complete');
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

export default async function KrakenV2Plugin(input: PluginInput): Promise<Hooks> {
  kraken.initialize();
  console.log('[Kraken V2.0] Plugin loaded');
  
  return {
    name: 'kraken-agent-v2.0',
    version: '2.0.0',
    
    // Agent registration for tab toggle
    config: async (opencodeConfig: Record<string, unknown>) => {
      console.log('[Kraken V2.0] Registering agents for tab toggle...');
      
      const agents = {
        'kraken': {
          name: 'kraken',
          description: 'Kraken V2.0 - Multi-brain orchestrator with 5-brain architecture',
          instructions: `You are Kraken V2.0, a multi-brain orchestrator plugin for OpenCode.

Key Features:
1. Two-Layer Firewall - Tool enforcement + Message enforcement
2. Mechanical Output Verification - fs.existsSync() checkpoints, not trust
3. Structured Override Commands - Typed schema, not natural language
4. Explicit Gate Criteria - Each brain declares satisfied criteria
5. Dynamic Context Management - Four-tier compaction system

Brains:
- System Brain: Gate management, guardian enforcement
- Execution Brain: Tool execution, output verification
- Planning Brain: Workflow planning, context compaction
- Council Brain: Roundtable decision making

Use the kraken-status tool to check current state.`,
          mode: 'primary',  // REQUIRED for tab toggle visibility
          permission: { task: 'allow' },
          tools: kraken.createTools(),
        },
      };
      
      // Register agents using Object.assign (OBJECT, not array)
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agents };
      } else {
        Object.assign(opencodeConfig.agent, agents);
      }
      
      console.log('[Kraken V2.0] Agents registered:', Object.keys(agents));
    },
    
    // Hooks
    ...kraken.createHooks(),
    
    // Tools
    tool: kraken.createTools(),
  };
}
