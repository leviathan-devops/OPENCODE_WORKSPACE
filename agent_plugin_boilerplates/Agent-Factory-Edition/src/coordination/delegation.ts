/**
 * src/coordination/delegation.ts
 * 
 * Delegation Engine - handles task delegation between agents with gate enforcement.
 */

import type {
  AgentDefinition,
  DelegationEngine,
  DelegationRequest,
  DelegationResult,
  GateConfig,
  GateResult,
} from './types.js';
import type { AgentRegistry } from './registry.js';

export function createDelegationEngine(
  registry: AgentRegistry,
  gateConfig?: {
    delegation?: GateConfig;
    qa?: GateConfig;
    brainstorm?: GateConfig;
  }
): DelegationEngine {
  const consecutiveRejections = new Map<string, number>();
  
  function evaluateGate(request: DelegationRequest): GateResult {
    const { target, taskId } = request;
    
    // Check if target agent exists
    const agent = registry.getAgent(target.agentId);
    if (!agent) {
      return {
        decision: 'REJECTED',
        gateName: 'agent.exists',
        reason: `Agent ${target.agentId} not found in registry`,
      };
    }
    
    // Check if agent mode matches target mode
    if (agent.mode !== target.agentMode) {
      return {
        decision: 'REJECTED',
        gateName: 'agent.mode',
        reason: `Agent ${target.agentId} has mode ${agent.mode}, expected ${target.agentMode}`,
      };
    }
    
    // Check for consecutive rejections (loop detection)
    const currentRejections = consecutiveRejections.get(taskId) || 0;
    const maxRejections = gateConfig?.delegation?.maxRejections || 3;
    
    if (currentRejections >= maxRejections) {
      return {
        decision: 'BLOCKED',
        gateName: 'delegation.loop',
        reason: `Task ${taskId} has been rejected ${currentRejections} times, blocking further delegation`,
        consecutiveRejections: currentRejections,
      };
    }
    
    // All checks passed
    return {
      decision: 'APPROVED',
      gateName: 'delegation.check',
      reason: 'Delegation approved',
    };
  }
  
  return {
    async delegate(request: DelegationRequest): Promise<DelegationResult> {
      const gateResult = evaluateGate(request);
      
      if (gateResult.decision === 'BLOCKED') {
        return {
          success: false,
          taskId: request.taskId,
          reason: gateResult.reason,
          gateResult,
        };
      }
      
      if (gateResult.decision === 'REJECTED') {
        const currentRejections = consecutiveRejections.get(request.taskId) || 0;
        consecutiveRejections.set(request.taskId, currentRejections + 1);
        
        return {
          success: false,
          taskId: request.taskId,
          reason: gateResult.reason,
          gateResult,
        };
      }
      
      // Clear rejection counter on success
      consecutiveRejections.delete(request.taskId);
      
      return {
        success: true,
        taskId: request.taskId,
        delegatedTo: request.target.agentId,
        reason: `Delegated to ${request.target.agentId}`,
        gateResult,
      };
    },
    
    canDelegate(fromAgent: string, toAgent: string): boolean {
      const from = registry.getAgent(fromAgent);
      const to = registry.getAgent(toAgent);
      
      if (!from || !to) return false;
      
      // Architects can delegate to anyone
      if (from.mode === 'architect') return true;
      
      // Agents can only delegate back to architect
      if (from.mode === 'coder' && to.mode === 'architect') return true;
      if (from.mode === 'reviewer' && to.mode === 'architect') return true;
      
      // SME can delegate to any research cluster agent
      if (from.mode === 'sme' && to.cluster === 'research') return true;
      
      return false;
    },
    
    getClusterAgents(clusterId: string): AgentDefinition[] {
      return registry.getAgentsByCluster(clusterId);
    },
    
    enforceGate(request: DelegationRequest): GateResult {
      return evaluateGate(request);
    },
  };
}
