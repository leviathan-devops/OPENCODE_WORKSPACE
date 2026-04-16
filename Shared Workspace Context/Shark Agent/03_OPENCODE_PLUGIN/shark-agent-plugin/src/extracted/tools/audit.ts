/**
 * 🦈 SHARK CLI - Firewall Audit Trail
 * 
 * Constitutional logging of ALL tool decisions.
 * Even bypassed operations are logged (marked as bypassed).
 */
import * as fs from 'fs';
import * as path from 'path';
import { ToolCall } from '../brain/types';

export interface AuditEntry {
  timestamp: string;
  tool: string;
  agent: string;
  workflowStep: string;
  decision: 'ALLOW' | 'BLOCK' | 'BYPASS';
  reason: string;
  filePath?: string;
  command?: string;
  bypassed: boolean;
}

export class FirewallAudit {
  private auditPath: string;
  private entries: AuditEntry[] = [];

  constructor(workspacePath: string) {
    this.auditPath = path.join(workspacePath, '.shark', 'firewall-audit.jsonl');
    this.ensureAuditDirectory();
  }

  private ensureAuditDirectory(): void {
    const dir = path.dirname(this.auditPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  logToolCall(
    toolCall: ToolCall,
    decision: 'ALLOW' | 'BLOCK' | 'BYPASS',
    reason: string,
    workflowStep: string,
    bypassed: boolean = false
  ): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      tool: toolCall.name,
      agent: 'unknown',
      workflowStep,
      decision,
      reason,
      bypassed,
      filePath: toolCall.arguments.file_path as string,
      command: toolCall.arguments.command as string,
    };

    this.entries.push(entry);
    
    // Append to JSONL file
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.auditPath, line, 'utf8');
  }

  getStats(): {
    totalCalls: number;
    blocked: number;
    allowed: number;
    bypassed: number;
    topViolations: Array<{tool: string; count: number}>;
  } {
    const totalCalls = this.entries.length;
    const blocked = this.entries.filter(e => e.decision === 'BLOCK').length;
    const allowed = this.entries.filter(e => e.decision === 'ALLOW').length;
    const bypassed = this.entries.filter(e => e.bypassed).length;

    // Count violations by tool
    const toolCounts = new Map<string, number>();
    this.entries
      .filter(e => e.decision === 'BLOCK')
      .forEach(e => {
        const count = toolCounts.get(e.tool) || 0;
        toolCounts.set(e.tool, count + 1);
      });

    const topViolations = Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCalls,
      blocked,
      allowed,
      bypassed,
      topViolations,
    };
  }

  clear(): void {
    this.entries = [];
    if (fs.existsSync(this.auditPath)) {
      fs.unlinkSync(this.auditPath);
    }
  }
}

export default FirewallAudit;
