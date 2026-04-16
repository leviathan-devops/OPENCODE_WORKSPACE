/**
 * Guardian — Scope Containment
 * 
 * Zone-based path classification and access control.
 * Default: SANDBOX mode (everything allowed, but dangerous paths still blocked).
 * 
 * v4.8 Features:
 * - Source file edit protection (must duplicate first)
 * - 60-minute grace period for newly created files
 * - Dangerous terminal command blocking
 * - Anti-rationalization pattern blocking (from SHIPPABLE failure forensic)
 */

export type GuardianLevel = 'SANDBOX' | 'PERMISSIVE' | 'BALANCED' | 'STRICT';

export type Zone = 'SANDBOX' | 'WORKSPACE' | 'DEVELOPMENT' | 'PERSONAL' | 'CONFIG' | 'SYSTEM';

export interface GuardianConfig {
  level: GuardianLevel;
  workspacePath?: string;
  sandboxPath?: string;
}

export const GRACE_PERIOD_MS = 60 * 60 * 1000;

const RATIONALIZATION_PATTERNS = [
  /infrastructure.*separate.*from.*code/i,
  /embedding.*is.*infrastructure/i,
  /search.*is.*just.*an.*api.*call/i,
  /code.*is.*correct.*so.*shippable/i,
  /6\/7.*pass.*shippable/i,
  /partial.*success.*acceptable/i,
  /connection.*error.*dismiss/i,
  /mostly.*working/i,
  /shippable.*despite/i,
  /broken.*but.*working/i,
];

export function checkRationalization(content: string): { blocked: boolean; reason?: string } {
  for (const pattern of RATIONALIZATION_PATTERNS) {
    if (pattern.test(content)) {
      return {
        blocked: true,
        reason: `RATIONALIZATION_BLOCKED: "${pattern.source}" — Infrastructure failures ARE system failures. 6/7 pass = NOT shippable.`,
      };
    }
  }
  return { blocked: false };
}

const DANGEROUS_PATTERNS = [
  /^rm\s+-rf\s+\//,
  /^rm\s+-rf\s+\/bin/,
  /^rm\s+-rf\s+\/usr/,
  /^rm\s+-rf\s+\/sys/,
  /^rm\s+-rf\s+\/proc/,
  /^dd\s+if=/,
  /^mkfs/,
  /^:(){ :|:& };:/,
];

const INPLACE_MODIFY_PATTERNS = [
  /^sed\s+-i/,
  /^echo\s+[^>]*>/,
  /^tee\s+/,
  /^cat\s+[^>]*>/,
];

const SOURCE_EXTENSIONS = [
  '.ts', '.js', '.tsx', '.jsx', '.py', '.rs', '.go', '.java', '.cpp', '.c', '.h', '.hpp',
  '.cs', '.rb', '.php', '.swift', '.kt', '.scala', '.svelte', '.vue', '.html', '.css',
];

const PERSONAL_PATHS = [
  /\.ssh\//,
  /\.aws\//,
  /\/Documents\//,
  /\/Desktop\//,
  /\.config\/credentials/,
];

const SYSTEM_PATHS = [
  /^\/bin\//,
  /^\/usr\//,
  /^\/sbin\//,
  /^\/etc\//,
  /^\/System\//,
];

export class Guardian {
  private level: GuardianLevel;
  private workspacePath: string;
  private sandboxPath: string;
  private editHistory: Map<string, number> = new Map();
  private createdFiles: Map<string, number> = new Map();

  constructor(config: GuardianConfig = { level: 'SANDBOX' }) {
    this.level = config.level;
    this.workspacePath = config.workspacePath || './';
    this.sandboxPath = config.sandboxPath || './';
  }

  setLevel(level: GuardianLevel): void {
    this.level = level;
  }

  canRead(path: string): boolean {
    if (this.level === 'SANDBOX') return true;
    return this.checkPath(path, 'read');
  }

  canWrite(path: string): boolean {
    if (this.level === 'SANDBOX') {
      return !this.isDangerousCommand(path);
    }
    return this.checkPath(path, 'write');
  }

  /**
   * v4.8: Check if a source file can be edited directly.
   * Source files require either:
   * 1. Previous edit history (already worked on)
   * 2. Being within 60-minute grace period (newly created)
   */
  canEdit(path: string): { allowed: boolean; reason?: string } {
    const ext = path.substring(path.lastIndexOf('.'));
    const isSourceFile = SOURCE_EXTENSIONS.includes(ext);
    
    if (!isSourceFile) {
      return { allowed: true };
    }

    // Check grace period - newly created files can be edited
    if (this.isWithinGracePeriod(path)) {
      return { allowed: true };
    }

    // Check edit history
    if (this.editHistory.has(path)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'SOURCE_FILE_NO_EDIT_HISTORY - Must duplicate file first: cp ${path} ${path}.v1.0.0'
    };
  }

  /**
   * v4.8: Check if a terminal command can modify files in-place.
   * Commands like 'sed -i', 'echo >', etc. are blocked for source files.
   */
  canModifyFile(command: string): { allowed: boolean; filePath?: string; reason?: string } {
    // Check for dangerous commands first
    if (this.isDangerousCommand(command)) {
      return { allowed: false, reason: 'DANGEROUS_COMMAND_BLOCKED' };
    }

    // Check for in-place modification patterns
    for (const pattern of INPLACE_MODIFY_PATTERNS) {
      if (pattern.test(command.trim())) {
        // Extract potential file path
        const match = command.match(/\/[\w\-\.\/]+/);
        const filePath = match ? match[0] : 'unknown';
        const ext = filePath.substring(filePath.lastIndexOf('.'));
        
        if (SOURCE_EXTENSIONS.includes(ext)) {
          return {
            allowed: false,
            filePath,
            reason: 'INPLACE_MODIFY_BLOCKED - Use edit tool on duplicate instead'
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Register that a file was edited (adds to edit history)
   */
  registerEdit(path: string): void {
    this.editHistory.set(path, Date.now());
  }

  /**
   * Register that a file was created
   */
  registerCreate(path: string): void {
    this.createdFiles.set(path, Date.now());
  }

  private isWithinGracePeriod(path: string): boolean {
    const createdTime = this.createdFiles.get(path);
    if (!createdTime) {
      // File not created by us - check filesystem mtime if possible
      try {
        const fs = require('node:fs');
        const stats = fs.statSync(path);
        const mtime = stats.mtimeMs;
        return (Date.now() - mtime) < GRACE_PERIOD_MS;
      } catch {
        return false;
      }
    }
    return (Date.now() - createdTime) < GRACE_PERIOD_MS;
  }

  isDangerousCommand(command: string): boolean {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command.trim())) {
        return true;
      }
    }
    return false;
  }

  classifyZone(path: string): Zone {
    const expandedPath = path.replace(/^~/, process.env.HOME || '/home/user');

    for (const pattern of PERSONAL_PATHS) {
      if (pattern.test(expandedPath)) {
        return 'PERSONAL';
      }
    }

    for (const pattern of SYSTEM_PATHS) {
      if (pattern.test(expandedPath)) {
        return 'SYSTEM';
      }
    }

    if (expandedPath.startsWith(this.workspacePath)) {
      return 'WORKSPACE';
    }

    if (expandedPath.startsWith(this.sandboxPath)) {
      return 'SANDBOX';
    }

    return 'SANDBOX';
  }

  private checkPath(path: string, operation: 'read' | 'write'): boolean {
    const zone = this.classifyZone(path);

    switch (this.level) {
      case 'SANDBOX':
        return zone !== 'PERSONAL' && zone !== 'SYSTEM';
      case 'PERMISSIVE':
        return zone !== 'PERSONAL' && zone !== 'SYSTEM';
      case 'BALANCED':
        if (zone === 'PERSONAL' || zone === 'SYSTEM') return false;
        return true;
      case 'STRICT':
        if (zone !== 'WORKSPACE' && zone !== 'SANDBOX') return false;
        return true;
      default:
        return true;
    }
  }

  getLevel(): GuardianLevel {
    return this.level;
  }

  getZoneInfo(path: string): { zone: Zone; allowed: boolean } {
    const zone = this.classifyZone(path);
    return {
      zone,
      allowed: this.checkPath(path, 'write'),
    };
  }
}

let globalGuardian: Guardian | null = null;

export function getGuardian(): Guardian {
  if (!globalGuardian) {
    globalGuardian = new Guardian({ level: 'SANDBOX' });
  }
  return globalGuardian;
}

export function setGuardianLevel(level: GuardianLevel): void {
  getGuardian().setLevel(level);
}
