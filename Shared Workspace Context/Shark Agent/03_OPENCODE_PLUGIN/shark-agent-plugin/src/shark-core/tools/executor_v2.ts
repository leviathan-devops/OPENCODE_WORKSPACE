/**
 * 🦈 SHARK CLI - Tool Executor with Guardian Integration
 * 
 * This module ACTUALLY EXECUTES the tool calls from AI models.
 * All operations are protected by Guardian.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Guardian, ModificationDecision } from '../guardian/index.js';
import { WorkflowBlocker } from '../workflow/blocker.js';
import { ToolCall } from '../brain/types.js';
import { FirewallAudit } from './audit.js';
import { FirewallMesh, FirewallResult } from './firewall-mesh_v2.js';
import { StagnationDetector, StagnationAlert } from './stagnation-detector_v2.js';
import { StateIntegrity } from './state-integrity.js';
import { AutoDebugEngine, DetectedError } from '../debug/autodebug.js';
import { modelLogger } from '../logging/model-logger.js';
import { MechanicalValidator } from '../anti-hallucination/mechanical-validator.js';
import { EvidenceChecker } from '../anti-hallucination/evidence-checker.js';
import { DebugInjector } from '../surgical-debug/injector.js';

export interface ToolResult {
  toolCallId: string;
  name: string;
  success: boolean;
  result: string;
  guardianBlocked?: boolean;
  guardianReason?: string;
}

export interface ToolExecutorConfig {
  guardian: Guardian;
  workflowBlocker: WorkflowBlocker | null;
  workspacePath: string;
  verbose?: boolean;
  skipFirewalls?: boolean;
  getWorkflowStep?: () => string;
}

/**
 * Tool Executor - Executes AI tool calls with Guardian protection
 * 
 * This is the MISSING LINK between AI tool definitions and actual execution.
 */
export class ToolExecutor {
  private guardian: Guardian;
  private workflowBlocker: WorkflowBlocker | null;
  private audit: FirewallAudit;
  private firewallMesh: FirewallMesh;
  private stagnationDetector: StagnationDetector;
  private stateIntegrity: StateIntegrity;
  private autoDebug: AutoDebugEngine;
  private mechanicalValidator: MechanicalValidator;
  private evidenceChecker: EvidenceChecker;
  private debugInjector: DebugInjector;
  private workspacePath: string;
  private verbose: boolean;
  private skipFirewalls: boolean;
  private recentAlerts: StagnationAlert[] = [];
  private getWorkflowStep?: () => string;

  constructor(config: ToolExecutorConfig) {
    this.guardian = config.guardian;
    this.workflowBlocker = config.workflowBlocker;
    this.workspacePath = config.workspacePath;
    this.verbose = config.verbose ?? false;
    this.skipFirewalls = config.skipFirewalls ?? false;
    this.getWorkflowStep = config.getWorkflowStep;
    
    this.audit = new FirewallAudit(this.workspacePath);
    
    this.firewallMesh = new FirewallMesh(
      this.guardian,
      this.workflowBlocker,
      this.audit,
      this.skipFirewalls
    );

    this.stagnationDetector = new StagnationDetector(this.workspacePath);
    this.stateIntegrity = new StateIntegrity(this.workspacePath);
    this.autoDebug = new AutoDebugEngine();
    this.debugInjector = this.autoDebug.getDebugInjector();
    this.mechanicalValidator = new MechanicalValidator();
    this.evidenceChecker = new EvidenceChecker();
  }

  /**
   * Execute a single tool call with Guardian protection
   */
  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      // Existing logic
      const result = await modelLogger.logAsyncOperation(
        `executeTool:${toolCall.name}`,
        'ToolExecutor',
        async () => {
          this.log(`Executing tool: ${toolCall.name}`);

          const workflowStep = this.getWorkflowStep ? this.getWorkflowStep() : 'UNKNOWN';

          const meshResult = await this.firewallMesh.checkToolCall(
            toolCall,
            workflowStep,
            this.skipFirewalls
          );

          this.audit.logToolCall(
            toolCall,
            meshResult.auditEntry.decision,
            meshResult.auditEntry.reason,
            workflowStep,
            meshResult.auditEntry.bypassed
          );

          if (meshResult.warnings.length > 0 && this.verbose) {
            meshResult.warnings.forEach(warning => {
              this.log(`⚠️  ${warning}`);
            });
          }

          if (!meshResult.allowed) {
            return {
              toolCallId: toolCall.id,
              name: toolCall.name,
              success: false,
              result: `${meshResult.blockedBy} blocked: ${meshResult.reason}`,
              guardianBlocked: true,
              guardianReason: meshResult.reason,
            };
          }

           // Anti-hallucination check for plan/design operations
           if (toolCall.name.includes('plan') || toolCall.name.includes('design')) {
             const argumentsString = JSON.stringify(toolCall.arguments);
             const theatrical = this.mechanicalValidator.detectTheatrical(argumentsString);
             if (!theatrical.allowed) {
               return {
                 toolCallId: toolCall.id,
                 name: toolCall.name,
                 success: false,
                 result: `❌ Anti-hallucination check failed: ${theatrical.reason}`,
                 guardianBlocked: false,
                 guardianReason: undefined
               };
             }
           }


          switch (toolCall.name) {
            case 'write_file':
              return this.executeWriteFile(toolCall);
            case 'read_file':
              return this.executeReadFile(toolCall);
            case 'run_command':
              return this.executeRunCommand(toolCall);
            case 'search':
              return this.executeSearch(toolCall);
            default:
              return {
                toolCallId: toolCall.id,
                name: toolCall.name,
                success: false,
                result: `Unknown tool: ${toolCall.name}`,
              };
          }
        }
      );
      
      const latencyMs = Date.now() - startTime;
      
      // Log successful tool execution
      modelLogger.logModelInteraction({
        model: 'tool-executor',
        operation: toolCall.name,
        latencyMs,
        success: true,
        metadata: {
          toolCallId: toolCall.id,
          arguments: toolCall.arguments
        }
      });
      
      return result;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      
      modelLogger.logModelInteraction({
        model: 'tool-executor',
        operation: toolCall.name,
        latencyMs,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          toolCallId: toolCall.id,
          arguments: toolCall.arguments
        }
      });
      
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: false,
        result: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute all tool calls in sequence with Guardian protection
   */
  async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeTool(toolCall);
      results.push(result);

      // Stop if Guardian blocked an operation
      if (result.guardianBlocked) {
        this.log(`Guardian blocked operation, stopping tool execution`);
        break;
      }
    }

    return results;
  }

  /**
   * Write file - actual execution (firewalls already checked in executeTool)
   */
  private async executeWriteFile(toolCall: ToolCall): Promise<ToolResult> {
    const filePath = this.resolvePath(toolCall.arguments.file_path as string);
    const content = toolCall.arguments.content as string;

    try {
      let actualPath = filePath;
      const decision = this.guardian.checkPermission(filePath, 'write');
      if (decision === ModificationDecision.SANDBOX_REDIRECT) {
        actualPath = this.guardian.getSandboxPath(filePath);
        this.log(`Redirecting write to sandbox: ${actualPath}`);
      }

      const dir = path.dirname(actualPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(actualPath, content, 'utf-8');

      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: true,
        result: `Successfully wrote ${content.length} bytes to ${actualPath}`,
      };
    } catch (error: any) {
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: false,
        result: `Failed to write file: ${error.message}`,
      };
    }
  }

  /**
   * Read file - actual execution (firewalls already checked in executeTool)
   */
  private async executeReadFile(toolCall: ToolCall): Promise<ToolResult> {
    const filePath = this.resolvePath(toolCall.arguments.file_path as string);

    try {
      if (!fs.existsSync(filePath)) {
        return {
          toolCallId: toolCall.id,
          name: toolCall.name,
          success: false,
          result: `File not found: ${filePath}`,
        };
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: true,
        result: content,
      };
    } catch (error: any) {
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: false,
        result: `Failed to read file: ${error.message}`,
      };
    }
  }

  /**
   * Run command with basic safety checks
   */
  private async executeRunCommand(toolCall: ToolCall): Promise<ToolResult> {
    const command = toolCall.arguments.command as string;
    const cwd = toolCall.arguments.cwd as string || this.workspacePath;

    const dangerousPatterns = [
      /rm\s+-rf\s+\//,
      />\s*\/dev\/[a-z]+/,
      /mkfs|mkfs\.*/,
      /dd\s+if=.*\/dev\//,
      /: \(\) \{ : \|: & \} ; :/,
      /\/bin\/rm\s+-rf\s+\//,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        return {
          toolCallId: toolCall.id,
          name: toolCall.name,
          success: false,
          result: `Command blocked: dangerous pattern detected`,
          guardianBlocked: true,
          guardianReason: 'Dangerous command pattern',
        };
      }
    }

    try {
      const output = execSync(command, {
        cwd,
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      });

      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: true,
        result: output,
      };
    } catch (error: any) {
      const output = (error.stdout || '') + (error.stderr || '');
      const errorMessage = output || error.message;

      const stagnationAlert = this.stagnationDetector.recordFailure(
        toolCall,
        errorMessage
      );

      if (stagnationAlert) {
        this.recentAlerts.push(stagnationAlert);
        this.log(`⚠️  Stagnation detected: ${stagnationAlert.message}`);
        
        if (stagnationAlert.type === 'escalation') {
          this.log(`🚨 ESCALATION REQUIRED: ${stagnationAlert.suggestions.join('; ')}`);
          
          // SURGICAL DEBUG INJECTION - Connect tool failures to debug protocol
          try {
            const injectionResult = await this.debugInjector.injectDebugger(
              `tool-executor-${toolCall.name}`,
              {
                lastError: errorMessage,
                stagnationReason: 'command-failure-loop',
                recentProgress: [toolCall.name, command.substring(0, 100)]
              }
            );
            
            if (injectionResult.success && this.verbose) {
              this.log(`🔧 Surgical debug injected: ${injectionResult.debugAgentId}`);
              this.log(`   Agent type: ${injectionResult.debugAgentType}`);
            }
          } catch (error) {
            this.log(`Failed to inject surgical debug: ${error}`);
          }
        }
      }

      const detectedErrors = this.autoDebug.analyze(errorMessage);
      
      if (detectedErrors.length > 0 && this.verbose) {
        const report = this.autoDebug.generateQuickFixReport(detectedErrors);
        this.log(report);
      }

      const autoFixableErrors = detectedErrors.filter(e => e.error.autoFixable);
      if (autoFixableErrors.length > 0) {
        this.log(`🔧 ${autoFixableErrors.length} auto-fixable error(s) detected`);
        
        return {
          toolCallId: toolCall.id,
          name: toolCall.name,
          success: false,
          result: errorMessage + '\n\n' + this.autoDebug.generateQuickFixReport(detectedErrors),
          guardianBlocked: false,
        };
      }

      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: false,
        result: errorMessage,
      };
    }
  }

  /**
   * Search files/content
   */
  private async executeSearch(toolCall: ToolCall): Promise<ToolResult> {
    const query = toolCall.arguments.query as string;
    const type = toolCall.arguments.type as string || 'content';

    try {
      if (type === 'file') {
        // Search for files matching pattern
        const files = this.findFiles(query);
        return {
          toolCallId: toolCall.id,
          name: toolCall.name,
          success: true,
          result: files.join('\n'),
        };
      } else {
        // Search content using grep-like approach
        const results = this.searchContent(query);
        return {
          toolCallId: toolCall.id,
          name: toolCall.name,
          success: true,
          result: results.join('\n'),
        };
      }
    } catch (error: any) {
      return {
        toolCallId: toolCall.id,
        name: toolCall.name,
        success: false,
        result: `Search failed: ${error.message}`,
      };
    }
  }

  /**
   * Resolve path relative to workspace
   */
  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.workspacePath, filePath);
  }

  /**
   * Find files matching pattern
   */
  private findFiles(pattern: string): string[] {
    const results: string[] = [];
    
    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip hidden and node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.name.includes(pattern) || entry.name.match(pattern)) {
            results.push(fullPath);
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    walk(this.workspacePath);
    return results.slice(0, 50); // Limit results
  }

  /**
   * Search content in files
   */
  private searchContent(query: string): string[] {
    const results: string[] = [];
    
    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip hidden and node_modules
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile() && !entry.name.endsWith('.json') && !entry.name.endsWith('.lock')) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              if (content.includes(query)) {
                // Find line numbers
                const lines = content.split('\n');
                const matches = lines
                  .map((line, i) => line.includes(query) ? `${fullPath}:${i + 1}` : null)
                  .filter(Boolean) as string[];
                results.push(...matches.slice(0, 5));
              }
            } catch {
              // Skip files we can't read
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    walk(this.workspacePath);
    return results.slice(0, 50); // Limit results
  }

  getStagnationStats() {
    return this.stagnationDetector.getStats();
  }

  getAuditStats() {
    return this.audit.getStats();
  }

  getRecentAlerts(): StagnationAlert[] {
    return this.recentAlerts;
  }

  clearStagnationHistory(): void {
    this.stagnationDetector.clearHistory();
    this.recentAlerts = [];
  }

  verifyStateIntegrity(state: Record<string, any>, step: string) {
    return this.stateIntegrity.verify(state, step);
  }

  recordStateIntegrity(state: Record<string, any>, step: string) {
    return this.stateIntegrity.recordState(state, step);
  }

  private log(message: string): void {
    if (this.verbose) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      console.log(`[${timestamp}] [ToolExecutor] ${message}`);
    }
  }
}

export default ToolExecutor;
