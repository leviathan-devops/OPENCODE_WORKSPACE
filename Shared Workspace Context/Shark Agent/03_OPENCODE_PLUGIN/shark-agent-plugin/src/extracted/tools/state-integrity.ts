/**
 * 🦈 SHARK CLI - State Integrity Protection
 *
 * Checksum verification on workflow state to detect tampering.
 * Auto-recovery to PLAN step on corruption detected.
 *
 * DESIGN PRINCIPLE: Detect catastrophic state corruption, recover gracefully.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface StateChecksum {
  step: string;
  timestamp: string;
  checksum: string;
  dataHash: string;
  metadata?: Record<string, any>;
}

export interface IntegrityResult {
  valid: boolean;
  corrupted?: {
    field: string;
    expected: string;
    actual: string;
  };
  lastValidStep?: string;
  recoveryAction?: 'restore_backup' | 'reset_to_plan' | 'manual_intervention';
  message: string;
}

export interface StateIntegrityConfig {
  algorithm: 'sha256' | 'md5';
  backupRetention: number;
  autoRecover: boolean;
  logTampering: boolean;
}

const DEFAULT_CONFIG: StateIntegrityConfig = {
  algorithm: 'sha256',
  backupRetention: 5,
  autoRecover: true,
  logTampering: true,
};

export class StateIntegrity {
  private config: StateIntegrityConfig;
  private workspacePath: string;
  private statePath: string;
  private checksumPath: string;
  private backupDir: string;
  private tamperLogPath: string;

  constructor(workspacePath: string, config: Partial<StateIntegrityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.workspacePath = workspacePath;
    this.statePath = path.join(workspacePath, '.shark', 'workflow-state.json');
    this.checksumPath = path.join(workspacePath, '.shark', 'state-checksums.json');
    this.backupDir = path.join(workspacePath, '.shark', 'backups');
    this.tamperLogPath = path.join(workspacePath, '.shark', 'tamper-log.jsonl');
    this.ensureDirectories();
  }

  recordState(state: Record<string, any>, step: string): StateChecksum {
    const timestamp = new Date().toISOString();
    const stateData = JSON.stringify(state, null, 2);
    const dataHash = this.hash(stateData);
    
    const checksumEntry: StateChecksum = {
      step,
      timestamp,
      checksum: this.generateChecksum(state, step, timestamp),
      dataHash,
      metadata: {
        stateSize: stateData.length,
        keysCount: Object.keys(state).length,
      },
    };

    this.saveChecksum(checksumEntry);
    this.createBackup(state, step);

    return checksumEntry;
  }

  verify(state: Record<string, any>, step: string): IntegrityResult {
    const checksums = this.loadChecksums();
    const entry = checksums.find(c => c.step === step);

    if (!entry) {
      return {
        valid: false,
        recoveryAction: 'reset_to_plan',
        message: `No checksum found for step: ${step}`,
      };
    }

    const stateData = JSON.stringify(state, null, 2);
    const currentDataHash = this.hash(stateData);
    const currentChecksum = this.generateChecksum(state, step, entry.timestamp);

    if (currentDataHash !== entry.dataHash) {
      if (this.config.logTampering) {
        this.logTampering(step, 'dataHash', entry.dataHash, currentDataHash);
      }

      const recovery = this.config.autoRecover
        ? this.attemptRecovery(step, entry)
        : 'manual_intervention';

      return {
        valid: false,
        corrupted: {
          field: 'stateData',
          expected: entry.dataHash,
          actual: currentDataHash,
        },
        lastValidStep: this.findLastValidStep(checksums, step),
        recoveryAction: recovery,
        message: `State data tampering detected for step: ${step}`,
      };
    }

    if (currentChecksum !== entry.checksum) {
      if (this.config.logTampering) {
        this.logTampering(step, 'checksum', entry.checksum, currentChecksum);
      }

      return {
        valid: false,
        corrupted: {
          field: 'checksum',
          expected: entry.checksum,
          actual: currentChecksum,
        },
        lastValidStep: this.findLastValidStep(checksums, step),
        recoveryAction: 'reset_to_plan',
        message: `State checksum mismatch for step: ${step}`,
      };
    }

    return {
      valid: true,
      message: 'State integrity verified',
    };
  }

  recover(step: string): Record<string, any> | null {
    const backupPath = path.join(this.backupDir, `state-${step}.json`);
    
    if (fs.existsSync(backupPath)) {
      try {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
        return backupData;
      } catch {
        return null;
      }
    }

    return null;
  }

  getChecksumHistory(): StateChecksum[] {
    return this.loadChecksums();
  }

  clearHistory(): void {
    if (fs.existsSync(this.checksumPath)) {
      fs.unlinkSync(this.checksumPath);
    }
    if (fs.existsSync(this.tamperLogPath)) {
      fs.unlinkSync(this.tamperLogPath);
    }
  }

  private generateChecksum(
    state: Record<string, any>,
    step: string,
    timestamp: string
  ): string {
    const payload = JSON.stringify({
      step,
      timestamp,
      stateKeys: Object.keys(state).sort(),
      statePreview: JSON.stringify(state).slice(0, 500),
    });
    
    return this.hash(payload);
  }

  private hash(data: string): string {
    return crypto
      .createHash(this.config.algorithm)
      .update(data)
      .digest('hex');
  }

  private saveChecksum(entry: StateChecksum): void {
    const checksums = this.loadChecksums();
    const existingIndex = checksums.findIndex(c => c.step === entry.step);
    
    if (existingIndex >= 0) {
      checksums[existingIndex] = entry;
    } else {
      checksums.push(entry);
    }

    fs.writeFileSync(this.checksumPath, JSON.stringify(checksums, null, 2));
  }

  private loadChecksums(): StateChecksum[] {
    try {
      if (fs.existsSync(this.checksumPath)) {
        return JSON.parse(fs.readFileSync(this.checksumPath, 'utf-8'));
      }
    } catch {
      // Return empty if corrupt
    }
    return [];
  }

  private createBackup(state: Record<string, any>, step: string): void {
    const backupPath = path.join(this.backupDir, `state-${step}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(state, null, 2));
    this.pruneBackups();
  }

  private pruneBackups(): void {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('state-'))
        .map(f => ({
          name: f,
          time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > this.config.backupRetention) {
        files.slice(this.config.backupRetention).forEach(f => {
          fs.unlinkSync(path.join(this.backupDir, f.name));
        });
      }
    } catch {
      // Fail silently
    }
  }

  private attemptRecovery(
    step: string,
    validEntry: StateChecksum
  ): 'restore_backup' | 'reset_to_plan' | 'manual_intervention' {
    const backup = this.recover(step);
    if (backup) {
      return 'restore_backup';
    }
    return 'reset_to_plan';
  }

  private findLastValidStep(
    checksums: StateChecksum[],
    currentStep: string
  ): string | undefined {
    const currentIndex = checksums.findIndex(c => c.step === currentStep);
    if (currentIndex > 0) {
      return checksums[currentIndex - 1].step;
    }
    return undefined;
  }

  private logTampering(
    step: string,
    field: string,
    expected: string,
    actual: string
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      step,
      field,
      expected,
      actual,
    };

    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.tamperLogPath, line, 'utf8');
  }

  private ensureDirectories(): void {
    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
}

export default StateIntegrity;
