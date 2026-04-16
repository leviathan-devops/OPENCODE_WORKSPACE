import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ProtectionLevel, ModificationDecision, ZoneType } from '../types/safety-types';

interface AuditEntry {
  timestamp: Date;
  operation: 'read' | 'write' | 'delete' | 'execute';
  path: string;
  decision: ModificationDecision;
  reason: string;
  success: boolean;
}

const CRITICAL_SYSTEM_PATHS = [
  '/bin', '/sbin', '/usr/bin', '/usr/sbin',
  '/lib', '/lib64', '/usr/lib', '/usr/lib64',
  '/etc', '/var', '/proc', '/sys', '/dev',
  '/boot', '/root', '/srv', '/usr/share', '/usr/include',
  '/var/lib/dpkg', '/var/lib/rpm', '/var/lib/pacman',
  '/etc/systemd', '/lib/systemd',
];

const PERSONAL_PATHS = [
  '.ssh', '.gnupg', '.password-store', '.aws', '.azure', '.gcloud',
  '.kube', '.env', 'credentials', 'secrets',
  'Documents/Financial', 'Documents/Taxes',
];

const DEV_DIRECTORIES = [
  'projects', 'code', 'workspace', 'src', 'Source', 'development',
  'repos', 'dev', 'Dev',
];

export class Guardian {
  private config: { enabled: boolean; level: ProtectionLevel; workspacePath: string; sandboxPath: string };
  private auditLog: AuditEntry[] = [];

  constructor(workspacePath: string, level: ProtectionLevel = ProtectionLevel.BALANCED) {
    this.config = {
      enabled: true,
      level,
      workspacePath: path.resolve(workspacePath),
      sandboxPath: path.join(os.tmpdir(), 'shark-sandbox'),
    };
  }

  classifyPath(filePath: string): { zone: ZoneType; reason: string } {
    const absolutePath = path.resolve(filePath);
    const normalized = absolutePath.toLowerCase();
    const workspaceNormalized = this.config.workspacePath.toLowerCase();

    if (normalized.startsWith(workspaceNormalized)) {
      return { zone: ZoneType.WORKSPACE, reason: 'Within designated workspace' };
    }

    const sandboxNormalized = this.config.sandboxPath.toLowerCase();
    if (normalized.startsWith(sandboxNormalized)) {
      return { zone: ZoneType.SANDBOX, reason: 'Within sandbox environment' };
    }

    for (const sysPath of CRITICAL_SYSTEM_PATHS) {
      if (normalized.startsWith(sysPath.toLowerCase())) {
        return { zone: ZoneType.SYSTEM, reason: `Critical system path: ${sysPath}` };
      }
    }

    const homeDir = os.homedir().toLowerCase();
    if (normalized.startsWith(homeDir)) {
      const relative = normalized.slice(homeDir.length);
      for (const personalPath of PERSONAL_PATHS) {
        if (relative.includes(personalPath.toLowerCase())) {
          return { zone: ZoneType.PERSONAL, reason: `Personal/sensitive path: ${personalPath}` };
        }
      }
      for (const devPath of DEV_DIRECTORIES) {
        if (relative.includes(devPath.toLowerCase())) {
          return { zone: ZoneType.DEVELOPMENT, reason: `Development directory: ${devPath}` };
        }
      }
    }

    return { zone: ZoneType.PERSONAL, reason: 'Outside workspace - requires permission' };
  }

  checkPermission(filePath: string, operation: 'read' | 'write' | 'delete' = 'write'): ModificationDecision {
    if (!this.config.enabled) {
      return ModificationDecision.ALLOW;
    }

    const { zone, reason } = this.classifyPath(filePath);

    if (zone === ZoneType.SYSTEM) {
      this.logAudit({ operation, path: filePath, decision: ModificationDecision.DENY, success: false, reason });
      return ModificationDecision.DENY;
    }

    if (zone === ZoneType.PERSONAL) {
      this.logAudit({ operation, path: filePath, decision: ModificationDecision.DENY, success: false, reason });
      return ModificationDecision.DENY;
    }

    if (this.config.level === ProtectionLevel.BALANCED) {
      if (zone === ZoneType.WORKSPACE || zone === ZoneType.SANDBOX || zone === ZoneType.DEVELOPMENT) {
        this.logAudit({ operation, path: filePath, decision: ModificationDecision.ALLOW, success: true, reason });
        return ModificationDecision.ALLOW;
      }
    }

    if (this.config.level === ProtectionLevel.PERMISSIVE) {
      this.logAudit({ operation, path: filePath, decision: ModificationDecision.ALLOW, success: true, reason });
      return ModificationDecision.ALLOW;
    }

    this.logAudit({ operation, path: filePath, decision: ModificationDecision.DENY, success: false, reason });
    return ModificationDecision.DENY;
  }

  checkWrite(filePath: string): { allowed: boolean; reason?: string } {
    const decision = this.checkPermission(filePath, 'write');
    if (decision === ModificationDecision.DENY) {
      return { allowed: false, reason: 'Guardian: Write denied - protected zone' };
    }
    return { allowed: true };
  }

  checkRead(filePath: string): { allowed: boolean; reason?: string } {
    const { zone } = this.classifyPath(filePath);
    if (zone === ZoneType.SYSTEM) {
      return { allowed: false, reason: 'Guardian: Read denied - system zone' };
    }
    if (zone === ZoneType.PERSONAL) {
      return { allowed: false, reason: 'Guardian: Read denied - personal zone' };
    }
    return { allowed: true };
  }

  private logAudit(entry: { operation: string; path: string; decision: ModificationDecision; success: boolean; reason: string }): void {
    this.auditLog.push({
      timestamp: new Date(),
      ...entry,
    } as AuditEntry);
  }

  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  getWorkspacePath(): string {
    return this.config.workspacePath;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  disable(): void {
    this.config.enabled = false;
  }

  enable(): void {
    this.config.enabled = true;
  }

  getLevel(): ProtectionLevel {
    return this.config.level;
  }
}

export default Guardian;
