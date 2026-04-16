import { Guardian, createProductionGuardian } from '../shark-core/guardian/index';
import { FirewallMesh, FirewallResult } from '../shark-core/tools/firewall-mesh_v2';
import { FirewallAudit } from '../shark-core/tools/audit';
import { WorkflowBlocker } from '../shark-core/workflow/blocker';
import { StagnationDetector } from '../shark-core/tools/stagnation-detector_v2';
import { SafetyCheck, FirewallStats, StagnationStats, SafetyAdapter } from '../types/safety-types';
import { enforceSharkArchitecture, EnforcementParams } from '../enforcement/enforcer';
import { workflowMachine, WorkflowStep } from '../workflow/machine';

export class SafetyStack implements SafetyAdapter {
  private guardian: Guardian;
  private firewallMesh: FirewallMesh;
  private workflowBlocker: WorkflowBlocker;
  private stagnationDetector: StagnationDetector;
  private workspacePath: string;
  private skipFirewalls: boolean;
  private currentAgent: string = 'shark';
  private currentSessionID: string = 'default-session';

  constructor(workspacePath: string, skipFirewalls: boolean = false) {
    if (!workspacePath || typeof workspacePath !== 'string') {
      throw new Error(`Invalid workspacePath: ${workspacePath}`);
    }
    this.workspacePath = workspacePath;
    this.skipFirewalls = skipFirewalls;

    this.guardian = createProductionGuardian(workspacePath);
    this.workflowBlocker = new WorkflowBlocker(workspacePath);
    const audit = new FirewallAudit(workspacePath);
    
    // Create a custom firewall check for enforceSharkArchitecture
    const self = this;
    const sharkArchitectureFirewall = {
      name: 'SharkArchitectureEnforcer',
      priority: 0, // Highest priority to run first
      check: async (toolCall: any) => {
        const sessionID = self.currentSessionID;
        const state = workflowMachine.getState(sessionID);

        const params: EnforcementParams = {
          tool: toolCall.name,
          args: toolCall.arguments,
          sessionID: sessionID,
          workflowStep: state.currentStep,
          agent: self.currentAgent
        };
        const result = await enforceSharkArchitecture(params);
        return {
          blocked: !result.allowed,
          reason: result.reason,
          warning: result.severity === 'low' ? result.reason : undefined
        };
      },
    };

    this.firewallMesh = new FirewallMesh(
      this.guardian,
      this.workflowBlocker,
      audit,
      skipFirewalls,
      [sharkArchitectureFirewall] // Add our custom firewall
    );
    this.stagnationDetector = new StagnationDetector(workspacePath);
  }

  async checkTool(tool: string, args: any, sessionID?: string, agent?: string): Promise<{ allowed: boolean; reason?: string }> {
    if (this.skipFirewalls) {
      return { allowed: true };
    }

    if (sessionID) this.currentSessionID = sessionID;
    if (agent) this.currentAgent = agent;

    const toolCall = {
      name: tool,
      arguments: args,
      id: '1'
    };

    try {
      const result: FirewallResult = await this.firewallMesh.checkToolCall(
        toolCall,
        this.currentSessionID,
        this.skipFirewalls,
        this.currentAgent
      );

      return {
        allowed: result.allowed,
        reason: result.reason
      };
    } catch (error: any) {
      console.error('Error checking tool:', error.message);
      return { allowed: false, reason: error.message };
    }
  }

  async checkOperation(operation: string, data: any): Promise<SafetyCheck> {
    if (this.skipFirewalls) {
      return { blocked: false, warnings: [] };
    }

    const toolCall = data.toolCall || { name: operation, arguments: data, id: '1' };
    const workflowStep = data.workflowStep || 'UNKNOWN';

    const result: FirewallResult = await this.firewallMesh.checkToolCall(
      toolCall,
      workflowStep,
      this.skipFirewalls
    );

    return {
      blocked: !result.allowed,
      reason: result.reason,
      warnings: result.warnings
    };
  }

  getStats(): { firewall: FirewallStats; stagnation: StagnationStats } {
    const firewallStats = {
      totalChecks: 0,
      blocked: 0,
      warnings: 0,
      allowed: 0
    };

    const stagnationStats = this.stagnationDetector.getStats();

    return {
      firewall: firewallStats,
      stagnation: {
        totalFailures: stagnationStats.totalFailures,
        uniqueTools: stagnationStats.uniqueTools,
        recentAlerts: stagnationStats.recentAlerts
      }
    };
  }

  getGuardian(): Guardian {
    return this.guardian;
  }

  getWorkflowBlocker(): WorkflowBlocker {
    return this.workflowBlocker;
  }

  getStagnationDetector(): StagnationDetector {
    return this.stagnationDetector;
  }
}
