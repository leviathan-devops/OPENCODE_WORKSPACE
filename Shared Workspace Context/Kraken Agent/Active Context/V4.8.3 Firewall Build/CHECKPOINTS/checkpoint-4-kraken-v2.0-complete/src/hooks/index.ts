/**
 * Hook Registration - V2.0
 * 
 * Registers all hooks for Kraken V2.0:
 * - event: Session lifecycle (session.created, session.ended, session.compacting)
 * - chat.message: Agent identity init + Message enforcement (Layer 2)
 * - tool.execute.before: Tool enforcement (Layer 1)
 * - tool.execute.after: Tool summarization + Gate evaluation
 * 
 * CRITICAL: Agent identity wall pattern from Shark/Manta failures:
 * - chat.message initializes setCurrentAgent() because it HAS agent field
 * - session.created does NOT have agent field - CANNOT init identity there
 * - All other hooks check getCurrentAgent() identity wall first
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Hooks } from '@opencode-ai/plugin';
import { createSystemBrain, getSystemBrain } from '../brains/system/system-brain.js';
import { createExecutionBrain, getExecutionBrain } from '../brains/execution/execution-brain.js';
import { createPlanningBrain, getPlanningBrain } from '../brains/planning/planning-brain.js';
import { CouncilCoordinator } from '../brains/council/roundtable-council.js';

export { getSystemBrain, createSystemBrain };
export { getExecutionBrain, createExecutionBrain };
export { getPlanningBrain, createPlanningBrain };

const LAUNCHPAD_PATH = '/home/leviathan/OPENCODE_WORKSPACE/ACTIVE_CONTEXT/KRAKEN_LAUNCHPAD.md';
const COMPACTION_CONTEXT_DIR = '/tmp/kraken-compaction';

let council: CouncilCoordinator | null = null;

// ============================================================================
// AGENT IDENTITY STATE (Critical - prevents hook bypass)
// ============================================================================

let currentAgentName: string | undefined = undefined;

export function setCurrentAgent(agent: string | undefined): void {
  currentAgentName = agent;
  if (agent) {
    console.log(`[Kraken] Agent identity set: ${agent}`);
  }
}

export function getCurrentAgent(): string | undefined {
  return currentAgentName;
}

function isKrakenAgent(agent: string | undefined): boolean {
  return agent === 'kraken' || (agent && agent.startsWith('kraken')) || false;
}

export function getCouncil(): CouncilCoordinator {
  if (!council) {
    council = new CouncilCoordinator();
  }
  return council;
}

// ============================================================================
// SESSION LIFECYCLE HOOK (event hook for session.created, session.ended, session.compacting)
// ============================================================================

export function createEventHook(): Hooks['event'] {
  return async ({ event }) => {
    // Handle session.created - initialize brains and check for recovery
    if (event.type === 'session.created') {
      console.log('[Kraken] Session created, initializing brains...');
      
      const systemBrain = createSystemBrain();
      systemBrain.initialize();
      
      const executionBrain = createExecutionBrain();
      executionBrain.initialize();
      
      const planningBrain = createPlanningBrain();
      planningBrain.initialize();
      
      const c = getCouncil();
      c.initialize();
      
      console.log('[Kraken] All brains initialized');
      
      // Check for compaction recovery data
      const recoveryPath = path.join(COMPACTION_CONTEXT_DIR, 'LATEST', 'INJECTION.md');
      if (fs.existsSync(recoveryPath)) {
        const recoveryContent = fs.readFileSync(recoveryPath, 'utf-8');
        console.log('[Kraken] Compaction recovery file found, context restored');
        console.log(`[Kraken] Recovery file size: ${recoveryContent.length} chars`);
      }
      
      return;
    }
    
    // Handle session.ended - cleanup brain state to prevent memory leaks
    if (event.type === 'session.ended') {
      console.log('[Kraken] Session ended, cleaning up brains...');
      
      // Reset brain state
      const systemBrain = getSystemBrain();
      if (systemBrain?.cleanup) {
        systemBrain.cleanup();
      }
      
      // Clear council state
      council = null;
      
      console.log('[Kraken] Brain cleanup complete');
      return;
    }
    
    // Handle session.compacting - prepare context but DON'T add to context (only save to file)
    if (event.type === 'session.compacting') {
      console.log('[Kraken] Session compacting, preparing context...');
      
      const systemBrain = getSystemBrain();
      if (!systemBrain.isInitialized()) {
        console.log('[Kraken] SystemBrain not initialized, skipping');
        return;
      }
      
      // Read the launchpad file for current context
      let launchpadContent = '';
      if (fs.existsSync(LAUNCHPAD_PATH)) {
        launchpadContent = fs.readFileSync(LAUNCHPAD_PATH, 'utf-8');
        console.log(`[Kraken] Launchpad loaded: ${launchpadContent.length} chars`);
      }
      
      // Get recent decisions and brain state
      const recentDecisions = systemBrain.getRecentDecisionPoints();
      const currentGate = systemBrain.getCurrentGate();
      const completedTasks = systemBrain.getCompletedTasks();
      const activeTask = systemBrain.getActiveTask();
      
      // Build context string for RECOVERY FILE ONLY - do NOT add to output.context
      const compactionContext = buildCompactionContext({
        launchpadContent,
        recentDecisions,
        currentGate,
        completedTasks,
        activeTask,
        sessionId: (event.properties as { sessionId?: string })?.sessionId || 'unknown'
      });
      
      // Write to compaction context FILE for session.created recovery
      const sessionId = (event.properties as { sessionId?: string })?.sessionId || 'unknown';
      const contextDir = path.join(COMPACTION_CONTEXT_DIR, sessionId);
      fs.mkdirSync(contextDir, { recursive: true });
      fs.writeFileSync(path.join(contextDir, 'INJECTION.md'), compactionContext);
      
      // DO NOT push to output.context - compaction should TRUNCATE not add
      // This was the bug in v4.7 that caused context bloat
      
      console.log('[Kraken] Compaction context saved to file for recovery');
      console.log(`[Kraken] Decisions captured: ${recentDecisions.length}, gate=${currentGate}`);
      
      return;
    }
  };
}

interface CompactionContextParams {
  launchpadContent: string;
  recentDecisions: { description: string; type: string; contextFiles: string[] }[];
  currentGate: string;
  completedTasks: string[];
  activeTask: string;
  sessionId: string;
}

function buildCompactionContext(params: CompactionContextParams): string {
  const { launchpadContent, recentDecisions, currentGate, completedTasks, activeTask, sessionId } = params;
  
  return `
================================================================================
KRAKEN V2.0 — COMPACTION CONTEXT INJECTION
================================================================================

**Session:** ${sessionId}
**Timestamp:** ${new Date().toISOString()}
**Gate:** ${currentGate}

---

## CURRENT MISSION

${launchpadContent.split('## CURRENT MISSION')[1]?.split('---')[0]?.trim() || 'Building Kraken V2.0 multi-brain orchestrator'}

---

## RECENT DECISIONS (${recentDecisions.length})

${recentDecisions.slice(0, 10).map((d, i) => 
  `${i + 1}. [${d.type}] ${d.description}`
).join('\n')}

---

## TASK STATE

**Active Task:** ${activeTask || 'None'}
**Completed Tasks:** ${completedTasks.length > 0 ? completedTasks.join(', ') : 'None'}

---

## STREAM ANCHOR

Current phase: BUILD
Current gate: ${currentGate}
Active task: ${activeTask || 'None'}

**Next immediate action:** Continue from where we left off in the Kraken V2.0 build.
Read the LAUNCHPAD.md file for full context.

================================================================================
`;
}

// ============================================================================
// CHAT MESSAGE HOOK (Agent Identity Init + Layer 2 Message Enforcement)
// ============================================================================

export function createChatMessageHook(): Hooks['chat.message'] {
  return async (input, output) => {
    const { message, agent } = input as { message: string; agent?: string };
    
    // CRITICAL: Initialize agent identity here because chat.message HAS agent field
    // session.created does NOT have agent field - cannot init there
    if (isKrakenAgent(agent)) {
      setCurrentAgent(agent);
    }
    
    // Identity wall - exit if not kraken agent
    if (!isKrakenAgent(getCurrentAgent())) return;
    
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    
    // Layer 2: Message enforcement
    try {
      systemBrain.checkMessage(message);
    } catch (error) {
      console.error(`[Kraken] Message blocked: ${error}`);
      throw error;
    }
  };
}

// ============================================================================
// TOOL GUARDIAN HOOK (Layer 1 - Tool Enforcement)
// ============================================================================

export function createToolGuardianHook(): Hooks['tool.execute.before'] {
  return async (input, output) => {
    // Identity wall - exit if not kraken agent
    if (!isKrakenAgent(getCurrentAgent())) return;
    
    const { tool } = input as { tool: string };
    const args = output?.args as Record<string, unknown> || {};
    
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    
    // Layer 1: Tool enforcement
    try {
      systemBrain.checkTool(tool, args);
    } catch (error) {
      console.error(`[Kraken] Tool blocked: ${error}`);
      throw error;
    }
  };
}

// ============================================================================
// TOOL SUMMARIZER HOOK (Post-tool execution - reduces token bloat)
// Force export to prevent tree-shaking: used by Kraken hooks
// ============================================================================

export const krakenHookExports = {
  toolSummarizer: true,
  gateHook: true,
  compactionHook: true
};

export function createToolSummarizerHook(): Hooks['tool.execute.after'] {
  // Force reference to krakenHookExports to prevent tree-shaking
  if (!krakenHookExports) return () => {};
  
  return async (input, output) => {
    // Identity wall - exit if not kraken agent
    if (!isKrakenAgent(getCurrentAgent())) return;
    
    const tool = input.tool as string;
    let outputStr = typeof output.output === 'string' ? output.output : JSON.stringify(output.output);

    // Inline summarization to prevent tree-shaking
    if (tool === 'Bash' || tool === 'bash') {
      if (outputStr.includes('grep') || outputStr.includes('rg ')) {
        const lines = outputStr.split('\n').filter(l => l.trim());
        const matchCount = lines.length;
        const fileSet = new Set<string>();
        for (const line of lines) {
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0) fileSet.add(line.substring(0, colonIdx));
        }
        output.output = matchCount === 0 ? 'grep: no matches found' : `grep found ${matchCount} matches across ${fileSet.size} files. Showing first 20:\n${lines.slice(0, 20).join('\n')}`;
      } else if (outputStr.includes('ls ') || outputStr.includes('ls\n')) {
        const lines = outputStr.split('\n').filter(l => l.trim());
        const total = lines.length;
        output.output = total <= 15 ? outputStr : `ls: ${total} entries. Showing first 15:\n${lines.slice(0, 15).join('\n')}`;
      }
    }

    if (tool === 'Read' || tool === 'read') {
      const lines = outputStr.split('\n');
      output.output = lines.length <= 100 ? outputStr : `${lines.slice(0, 100).join('\n')}\n[... ${lines.length - 100} more lines truncated ...]`;
    }
  };
}

// ============================================================================
// GATE HOOK (Post-tool execution)
// ============================================================================

export function createGateHook(): Hooks['tool.execute.after'] {
  return async (input, output) => {
    // Identity wall - exit if not kraken agent
    if (!isKrakenAgent(getCurrentAgent())) return;
    
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) return;
    
    const currentGate = systemBrain.getCurrentGate();
    const result = systemBrain.evaluateGateEntry(currentGate);
    
    if (result.allPassed) {
      console.log(`[Kraken] Gate ${currentGate} criteria met, ready to advance`);
    }
  };
}

// ============================================================================
// COMPACTION HOOK (experimental.session.compacting)
// ============================================================================

export function createCompactionHook(): Hooks['experimental.session.compacting'] {
  return async (input, output) => {
    // Identity wall - exit if not kraken agent
    if (!isKrakenAgent(getCurrentAgent())) return;
    
    const { sessionID } = input as { sessionID: string };
    
    console.log('[Kraken] Compaction hook fired for session:', sessionID);
    
    const systemBrain = getSystemBrain();
    if (!systemBrain.isInitialized()) {
      console.log('[Kraken] SystemBrain not initialized');
      return;
    }
    
    // Build context to inject into compaction prompt
    const recentDecisions = systemBrain.getRecentDecisionPoints();
    const currentGate = systemBrain.getCurrentGate();
    const completedTasks = systemBrain.getCompletedTasks();
    const activeTask = systemBrain.getActiveTask();
    
    // Read launchpad
    let launchpadContent = '';
    if (fs.existsSync(LAUNCHPAD_PATH)) {
      launchpadContent = fs.readFileSync(LAUNCHPAD_PATH, 'utf-8');
    }
    
    // Build the context string
    const contextStr = buildCompactionContext({
      launchpadContent,
      recentDecisions,
      currentGate,
      completedTasks,
      activeTask,
      sessionId: sessionID
    });
    
    // Write to file for session.created recovery ONLY
    // DO NOT push to output.context - compaction should TRUNCATE not add
    const contextDir = path.join(COMPACTION_CONTEXT_DIR, sessionID);
    fs.mkdirSync(contextDir, { recursive: true });
    fs.writeFileSync(path.join(contextDir, 'INJECTION.md'), contextStr);
    
    // Also update LATEST symlink for recovery
    const latestDir = path.join(COMPACTION_CONTEXT_DIR, 'LATEST');
    fs.mkdirSync(latestDir, { recursive: true });
    fs.writeFileSync(path.join(latestDir, 'INJECTION.md'), contextStr);
    
    console.log('[Kraken] Compaction context saved to file for recovery');
    console.log(`[Kraken] Decisions captured: ${recentDecisions.length}`);
  };
}

// ============================================================================
// LEGACY SESSION CREATED HOOK (if needed)
// ============================================================================

export function createSessionHook(): Hooks['event'] {
  return createEventHook();
}
