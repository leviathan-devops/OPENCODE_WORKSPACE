/**
 * 🦈 SHARK CLI - Parallel Firewall Mesh
 * 
 * Runs all firewalls concurrently for performance.
 * First BLOCKING decision wins, WARNINGS collected.
 */
import { ToolCall } from '../brain/types';
import { Guardian, ModificationDecision } from '../guardian';
import { WorkflowBlocker } from '../workflow/blocker';
import { FirewallAudit } from './audit';

export interface FirewallCheck {
  name: string;
  check: (toolCall: ToolCall) => Promise<{
    blocked: boolean;
    reason?: string;
    warning?: string;
  }>;
  priority: number;
}

export interface FirewallResult {
  allowed: boolean;
  blockedBy?: string;
  reason?: string;
  warnings: string[];
  auditEntry: {
    decision: 'ALLOW' | 'BLOCK' | 'BYPASS';
    reason: string;
    blockedBy?: string;
    bypassed: boolean;
  };
}

export class FirewallMesh {
  private firewalls: FirewallCheck[] = [];
  private audit: FirewallAudit;

  constructor(
    guardian: Guardian,
    workflowBlocker: WorkflowBlocker | null,
    audit: FirewallAudit,
    skipFirewalls: boolean = false
  ) {
    this.audit = audit;

    if (!skipFirewalls) {
      // Guardian firewall (priority 1)
      this.firewalls.push({
        name: 'Guardian',
        priority: 1,
        check: async (toolCall: ToolCall) => {
          if (toolCall.name === 'write_file') {
            const filePath = toolCall.arguments.file_path as string;
            const decision = guardian.checkPermission(filePath, 'write');
            return {
              blocked: decision === ModificationDecision.DENY,
              reason: decision === ModificationDecision.DENY 
                ? 'Guardian denied write permission' 
                : undefined,
            };
          }
          return { blocked: false };
        },
      });

      // WorkflowBlocker firewall (priority 2)
      if (workflowBlocker) {
        this.firewalls.push({
          name: 'WorkflowBlocker',
          priority: 2,
          check: async (toolCall: ToolCall) => {
            if (toolCall.name === 'write_file') {
              const filePath = toolCall.arguments.file_path as string;
              const blockResult = workflowBlocker.blockWrite(filePath);
              return {
                blocked: blockResult.blocked,
                reason: blockResult.reason,
              };
            }
            return { blocked: false };
          },
        });
      }

      // Theatrical detection (priority 3 - warning only)
      this.firewalls.push({
        name: 'TheatricalDetector',
        priority: 3,
        check: async (toolCall: ToolCall) => {
          let warning: string | undefined;
          
          if (toolCall.name === 'run_command') {
            const command = toolCall.arguments.command as string;
            const theatricalPatterns = [
              /mock.*mode/i,
              /simulat/i,
              /stub.*test/i,
              /fake.*test/i,
              /TODO.*implement/i,
              /FIXME/i,
              /HACK/i,
              /XXX/i,
            ];
            
            const matches = theatricalPatterns
              .filter(pattern => pattern.test(command))
              .map(pattern => pattern.source);
              
            if (matches.length > 0) {
              warning = `Theatrical patterns detected in command: ${matches.join(', ')}`;
            }
          }
          
          if (toolCall.name === 'write_file') {
            const content = toolCall.arguments.content as string;
            const theatricalPatterns = [
              /\/\/.*TODO/i,
              /\/\/.*FIXME/i,
              /\/\/.*HACK/i,
              /\/\/.*XXX/i,
              /mock.*mode/i,
              /simulat/i,
              /stub.*test/i,
              /fake.*test/i,
            ];
            
            const matches = theatricalPatterns
              .filter(pattern => pattern.test(content))
              .map(pattern => pattern.source);
              
            if (matches.length > 0) {
              warning = `Theatrical patterns detected in file content: ${matches.join(', ')}`;
            }
          }
          
          return {
            blocked: false,
            warning,
          };
        },
      });

      // Secret detection (priority 4 - warning only)
      this.firewalls.push({
        name: 'SecretDetector',
        priority: 4,
        check: async (toolCall: ToolCall) => {
          let warning: string | undefined;
          
          if (toolCall.name === 'write_file') {
            const content = toolCall.arguments.content as string;
            const secretPatterns = [
              /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/i,
              /secret[_-]?key\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/i,
              /password\s*[=:]\s*['"][^'"]{8,}['"]/i,
              /token\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/i,
              /aws[_-]?access[_-]?key[_-]?id\s*[=:]\s*['"][A-Z0-9]{20}['"]/i,
              /aws[_-]?secret[_-]?access[_-]?key\s*[=:]\s*['"][a-zA-Z0-9/+=]{40}['"]/i,
            ];
            
            const matches = secretPatterns
              .filter(pattern => pattern.test(content))
              .map(pattern => pattern.source);
              
            if (matches.length > 0) {
              warning = `Potential hardcoded secrets detected: ${matches.join(', ')}. Consider using environment variables.`;
            }
          }
          
          return {
            blocked: false,
            warning,
          };
        },
      });
    }

    // Sort by priority
    this.firewalls.sort((a, b) => a.priority - b.priority);
  }

  async checkToolCall(
    toolCall: ToolCall,
    workflowStep: string,
    bypassed: boolean = false
  ): Promise<FirewallResult> {
    if (bypassed) {
      return {
        allowed: true,
        warnings: [],
        auditEntry: {
          decision: 'BYPASS',
          reason: 'YOLO mode enabled',
          bypassed: true,
        },
      };
    }

    const warnings: string[] = [];
    
    // Run all firewalls in parallel
    const checks = await Promise.all(
      this.firewalls.map(async firewall => {
        try {
          return await firewall.check(toolCall);
        } catch (error) {
          warnings.push(`Firewall ${firewall.name} failed: ${error}`);
          return { blocked: false };
        }
      })
    );

    // Find first blocking decision
    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      if (check.blocked) {
        return {
          allowed: false,
          blockedBy: this.firewalls[i].name,
          reason: check.reason,
          warnings,
          auditEntry: {
            decision: 'BLOCK',
            reason: check.reason || 'No reason provided',
            blockedBy: this.firewalls[i].name,
            bypassed: false,
          },
        };
      }
      if (check.warning) {
        warnings.push(check.warning);
      }
    }

    // No blocks found
    return {
      allowed: true,
      warnings,
      auditEntry: {
        decision: 'ALLOW',
        reason: 'All firewalls passed',
        bypassed: false,
      },
    };
  }

  getFirewallCount(): number {
    return this.firewalls.length;
  }

  getFirewallNames(): string[] {
    return this.firewalls.map(f => f.name);
  }
}

export default FirewallMesh;
