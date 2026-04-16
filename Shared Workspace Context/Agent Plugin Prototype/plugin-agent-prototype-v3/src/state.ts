/**
 * src/state.ts
 * 
 * Zero-imports singleton state - Spider Agent pattern.
 * This is the single source of truth for all plugin runtime state.
 * 
 * CUSTOMIZE: Add your own state fields to PluginState interface.
 * All state MUST be serializable for potential persistence.
 */

export interface SessionData {
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  messages: number;
  tools: number;
  // CUSTOMIZE: Add session-specific fields
  agentDelegation?: string;
  contextSnapshot?: string;
}

export interface AgentDelegation {
  taskId: string;
  agentType: 'architect' | 'coder' | 'reviewer' | 'test_engineer' | 'sme';
  startedAt: number;
  completedAt?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  output?: string;
}

export interface ToolMetrics {
  calls: number;
  failures: number;
  totalDuration: number;
  avgDuration: number;
}

export interface PluginState {
  // Core state
  initialized: boolean;
  configHash: string;
  
  // Session tracking
  sessions: Map<string, SessionData>;
  
  // Agent delegation tracking
  delegations: Map<string, AgentDelegation>;
  
  // Tool metrics
  toolMetrics: Map<string, ToolMetrics>;
  
  // Health tracking
  primaryStorageHealthy: boolean;
  lastHealthCheck: number;
  
  // Event hooks fired (for debugging)
  hooksFired: Map<string, number>;
  
  // CUSTOMIZE: Add your own state fields below
  // Example:
  // breakthroughCount: number;
  // errorPatterns: string[];
}

const state: PluginState = {
  initialized: false,
  configHash: '',
  sessions: new Map(),
  delegations: new Map(),
  toolMetrics: new Map(),
  primaryStorageHealthy: false,
  lastHealthCheck: 0,
  hooksFired: new Map(),
};

export function getState(): PluginState {
  return state;
}

export function resetState(): void {
  state.initialized = false;
  state.configHash = '';
  state.sessions.clear();
  state.delegations.clear();
  state.primaryStorageHealthy = false;
  state.lastHealthCheck = 0;
  state.hooksFired.clear();
  // Note: We don't clear toolMetrics as those are cumulative
}

export function getOrCreateSession(sessionId: string): SessionData {
  let session = state.sessions.get(sessionId);
  if (!session) {
    session = {
      sessionId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messages: 0,
      tools: 0,
    };
    state.sessions.set(sessionId, session);
  }
  session.lastActivity = Date.now();
  return session;
}

export function incrementHookFired(hookName: string): void {
  const count = state.hooksFired.get(hookName) ?? 0;
  state.hooksFired.set(hookName, count + 1);
}

export function recordToolMetric(toolName: string, durationMs: number, success: boolean): void {
  let metrics = state.toolMetrics.get(toolName);
  if (!metrics) {
    metrics = { calls: 0, failures: 0, totalDuration: 0, avgDuration: 0 };
    state.toolMetrics.set(toolName, metrics);
  }
  metrics.calls++;
  if (!success) metrics.failures++;
  metrics.totalDuration += durationMs;
  metrics.avgDuration = Math.round(metrics.totalDuration / metrics.calls);
}
