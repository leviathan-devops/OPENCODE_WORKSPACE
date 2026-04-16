/**
 * 🦈 SHARK CLI - Reasoning Logger
 * 
 * Structured logging for reasoning-chain compliance to .shark/reasoning.log
 * Provides auditability for all coordinator outputs.
 */

import * as fs from 'fs';
import * as path from 'path';
import { BrainType } from './types';
import { ValidationResult } from './reasoning-validator';

export interface ReasoningLogEntry {
  timestamp: string;
  brainType: string;
  coordinatorMode: 'micro' | 'macro';
  validationResult: {
    valid: boolean;
    missingMarkers: string[];
    evidenceScore: number;
  };
  retryCount: number;
  diagnosis?: string;
  taskSummary?: string;
  executionTimeMs?: number;
}

const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

export class ReasoningLogger {
  private logPath: string;
  private workspacePath: string;

  constructor(workspacePath: string = process.cwd()) {
    this.workspacePath = workspacePath;
    this.logPath = path.join(workspacePath, '.shark', 'reasoning.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(entry: ReasoningLogEntry): void {
    this.rotateIfNeeded();
    
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logPath, logLine, 'utf-8');
  }

  logValidation(
    brainType: BrainType | string,
    coordinatorMode: 'micro' | 'macro',
    result: ValidationResult,
    retryCount: number,
    diagnosis?: string
  ): void {
    const entry: ReasoningLogEntry = {
      timestamp: new Date().toISOString(),
      brainType: typeof brainType === 'string' ? brainType : this.brainTypeToString(brainType),
      coordinatorMode,
      validationResult: {
        valid: result.valid,
        missingMarkers: result.missingMarkers,
        evidenceScore: result.evidenceScore,
      },
      retryCount,
      diagnosis,
    };

    this.log(entry);
  }

  logSuccess(
    brainType: BrainType | string,
    coordinatorMode: 'micro' | 'macro',
    evidenceScore: number,
    executionTimeMs: number
  ): void {
    const entry: ReasoningLogEntry = {
      timestamp: new Date().toISOString(),
      brainType: typeof brainType === 'string' ? brainType : this.brainTypeToString(brainType),
      coordinatorMode,
      validationResult: {
        valid: true,
        missingMarkers: [],
        evidenceScore,
      },
      retryCount: 0,
      executionTimeMs,
    };

    this.log(entry);
  }

  logRetry(
    brainType: BrainType | string,
    coordinatorMode: 'micro' | 'macro',
    result: ValidationResult,
    retryCount: number,
    diagnosis: string
  ): void {
    this.logValidation(brainType, coordinatorMode, result, retryCount, diagnosis);
  }

  private rotateIfNeeded(): void {
    if (!fs.existsSync(this.logPath)) {
      return;
    }

    const stats = fs.statSync(this.logPath);
    if (stats.size >= MAX_LOG_SIZE) {
      const backupPath = `${this.logPath}.${Date.now()}.bak`;
      fs.renameSync(this.logPath, backupPath);
    }
  }

  private brainTypeToString(brainType: BrainType): string {
    switch (brainType) {
      case BrainType.PLANNING:
        return 'planning';
      case BrainType.EXECUTION:
        return 'execution';
      default:
        return 'unknown';
    }
  }

  getLogPath(): string {
    return this.logPath;
  }

  readRecentEntries(count: number = 10): ReasoningLogEntry[] {
    if (!fs.existsSync(this.logPath)) {
      return [];
    }

    const content = fs.readFileSync(this.logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const recentLines = lines.slice(-count);

    return recentLines.map(line => {
      try {
        return JSON.parse(line) as ReasoningLogEntry;
      } catch {
        return null;
      }
    }).filter((entry): entry is ReasoningLogEntry => entry !== null);
  }

  getStats(): { totalEntries: number; validCount: number; invalidCount: number; avgEvidenceScore: number } {
    if (!fs.existsSync(this.logPath)) {
      return { totalEntries: 0, validCount: 0, invalidCount: 0, avgEvidenceScore: 0 };
    }

    const content = fs.readFileSync(this.logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    
    let validCount = 0;
    let invalidCount = 0;
    let totalEvidenceScore = 0;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as ReasoningLogEntry;
        if (entry.validationResult.valid) {
          validCount++;
        } else {
          invalidCount++;
        }
        totalEvidenceScore += entry.validationResult.evidenceScore;
      } catch {
        // Skip malformed entries
      }
    }

    return {
      totalEntries: lines.length,
      validCount,
      invalidCount,
      avgEvidenceScore: lines.length > 0 ? totalEvidenceScore / lines.length : 0,
    };
  }
}

export default ReasoningLogger;
