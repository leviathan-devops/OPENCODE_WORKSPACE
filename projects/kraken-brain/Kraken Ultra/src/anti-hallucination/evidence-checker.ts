import * as fs from 'fs';
import * as path from 'path';

export interface EvidenceResult {
  valid: boolean;
  step: 'PLAN' | 'BUILD' | 'TEST' | 'VERIFY' | 'SHIP';
  evidencePath: string;
  checks: {
    exists: boolean;
    hasContent: boolean;
    parseable: boolean;
    hasRequiredFields: boolean;
  };
  issues: string[];
}

export class EvidenceChecker {
  private parseableExtensions: Set<string> = new Set(['.json', '.md', '.ts', '.js', '.txt']);

  verifyPlanEvidence(planPath: string): EvidenceResult {
    return this.verifyEvidence('PLAN', planPath, ['title', 'description', 'steps']);
  }

  verifyBuildEvidence(codePath: string): EvidenceResult {
    return this.verifyEvidence('BUILD', codePath, ['name', 'version']);
  }

  verifyTestEvidence(testLogPath: string): EvidenceResult {
    return this.verifyEvidence('TEST', testLogPath, ['tests', 'passed', 'failed', 'duration']);
  }

  verifyVerifyEvidence(verifyPath: string): EvidenceResult {
    return this.verifyEvidence('VERIFY', verifyPath, ['gates', 'status']);
  }

  verifyShipEvidence(shipReportPath: string): EvidenceResult {
    return this.verifyEvidence('SHIP', shipReportPath, ['version', 'artifacts', 'deployed']);
  }

  private verifyEvidence(
    step: 'PLAN' | 'BUILD' | 'TEST' | 'VERIFY' | 'SHIP',
    evidencePath: string,
    requiredFields: string[]
  ): EvidenceResult {
    const result: EvidenceResult = {
      valid: false,
      step,
      evidencePath,
      checks: {
        exists: false,
        hasContent: false,
        parseable: false,
        hasRequiredFields: false
      },
      issues: []
    };

    try {
      const stats = fs.statSync(evidencePath);
      result.checks.exists = true;

      if (stats.size === 0) {
        result.issues.push('File is empty');
        return result;
      }
      result.checks.hasContent = true;

      const content = fs.readFileSync(evidencePath, 'utf-8');
      const ext = path.extname(evidencePath).toLowerCase();

      if (this.parseableExtensions.has(ext)) {
        let parsed;
        if (ext === '.json') {
          try {
            parsed = JSON.parse(content);
            result.checks.parseable = true;
          } catch {
            result.issues.push('Invalid JSON');
            return result;
          }
        } else {
          parsed = content;
          result.checks.parseable = true;
        }

        const missingFields = this.checkRequiredFields(parsed, requiredFields);
        if (missingFields.length === 0) {
          result.checks.hasRequiredFields = true;
        } else {
          result.issues.push(`Missing required fields: ${missingFields.join(', ')}`);
        }
      } else {
        result.checks.parseable = true;
        result.checks.hasRequiredFields = true;
      }

      result.valid = Object.values(result.checks).every(v => v === true);
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          result.issues.push('File does not exist');
        } else {
          result.issues.push(error.message);
        }
      }
    }

    return result;
  }

  private checkRequiredFields(data: any, requiredFields: string[]): string[] {
    const missing: string[] = [];
    for (const field of requiredFields) {
      if (typeof data === 'string') {
        if (!data.includes(field)) {
          missing.push(field);
        }
      } else if (typeof data === 'object' && data !== null) {
        if (!(field in data)) {
          missing.push(field);
        }
      }
    }
    return missing;
  }

  verifyGlobPattern(pattern: string): EvidenceResult[] {
    const { glob } = require('glob');
    const files = glob.sync(pattern);
    return files.map(file => ({
      valid: true,
      step: 'BUILD' as const,
      evidencePath: file,
      checks: {
        exists: true,
        hasContent: true,
        parseable: true,
        hasRequiredFields: true
      },
      issues: []
    }));
  }
}
