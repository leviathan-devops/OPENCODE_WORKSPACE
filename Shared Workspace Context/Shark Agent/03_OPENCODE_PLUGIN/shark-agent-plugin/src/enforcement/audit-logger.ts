import * as fs from 'fs';
import * as path from 'path';

export interface AuditLogEntry {
  timestamp?: string;
  sessionId?: string;
  action?: string;
  tool?: string;
  args?: any;
  result?: { allowed: boolean; reason?: string };
  auditId?: string;
  firewall?: string;
  reason?: string;
  severity?: string;
  duration?: number;
}

export class AuditLogger {
  private sessionId: string;
  private logs: AuditLogEntry[] = [];
  private auditId: string;
  private logsDir: string;

  constructor(sessionId: string, logsDir: string = '/tmp/opencode-audit') {
    this.sessionId = sessionId;
    this.logsDir = logsDir;
    this.auditId = `audit_${Date.now()}-${Math.random().toString(36).substring(2, 16)}`;
    
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  log(entry: AuditLogEntry): void {
    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      auditId: this.auditId,
      sessionId: this.sessionId
    };
    
    this.logs.push(logEntry);
    
    const logFile = path.join(this.logsDir, 'audit.json');
    try {
      const existingLogs = fs.existsSync(logFile) 
        ? JSON.parse(fs.readFileSync(logFile, 'utf8'))
        : [];
      existingLogs.push(logEntry);
      fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
    } catch (error: any) {
      console.error(`Failed to write audit log: ${error.message}`);
    }
  }

  getId(): string {
    return this.auditId;
  }

  getLogs(): AuditLogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }
}
