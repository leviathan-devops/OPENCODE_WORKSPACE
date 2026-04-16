import { MechanicalValidator, ValidationResult } from './mechanical-validator';
import { EvidenceChecker, EvidenceResult } from './evidence-checker';

interface NemotronService {
  ingest(agentId: string, output: string): void;
  reportError(agentId: string, error: string): void;
}

export class ValidatorHook {
  private validator: MechanicalValidator;
  private checker: EvidenceChecker;
  private enabled: boolean;

  constructor(sandboxDir?: string) {
    this.validator = new MechanicalValidator(sandboxDir);
    this.checker = new EvidenceChecker();
    this.enabled = true;
  }

  interceptOutput(agentId: string, output: string): { valid: boolean; blocked: boolean; reason?: string } {
    if (!this.enabled) {
      return { valid: true, blocked: false };
    }

    const patterns = this.validator.detectTheatrical(output);

    if (patterns.length > 0) {
      return {
        valid: false,
        blocked: true,
        reason: `Theatrical patterns detected: ${patterns.join(', ')}`
      };
    }

    return { valid: true, blocked: false };
  }

  blockTheatrical(agentId: string, patterns: string[]): void {
    const error = `BLOCKED: Theatrical code detected in agent ${agentId}. Patterns: ${patterns.join(', ')}`;
    console.error(error);
    
    const service = this.getNemotronService();
    if (service) {
      service.reportError(agentId, error);
    }
  }

  register(service: NemotronService): void {
    const originalIngest = service.ingest.bind(service);
    
    service.ingest = (agentId: string, output: string) => {
      const result = this.interceptOutput(agentId, output);
      
      if (result.blocked) {
        this.blockTheatrical(agentId, this.validator.detectTheatrical(output));
        return;
      }
      
      originalIngest(agentId, output);
    };
  }

  validateAgentOutput(agentId: string, output: string, evidencePath?: string): ValidationResult {
    let result: ValidationResult = {
      passed: false,
      theatricalDetected: false,
      theatricalPatterns: [],
      actualCompilation: false,
      testsActuallyRun: false,
      codeIntegration: false
    };

    if (evidencePath) {
      result = this.validator.validateWorkflowStep('BUILD', evidencePath);
    }

    const outputPatterns = this.validator.detectTheatrical(output);
    if (outputPatterns.length > 0) {
      result.theatricalDetected = true;
      result.theatricalPatterns = [...result.theatricalPatterns, ...outputPatterns];
      result.passed = false;
    }

    return result;
  }

  validateEvidence(step: string, evidencePath: string): EvidenceResult {
    switch (step.toUpperCase()) {
      case 'PLAN':
        return this.checker.verifyPlanEvidence(evidencePath);
      case 'BUILD':
        return this.checker.verifyBuildEvidence(evidencePath);
      case 'TEST':
        return this.checker.verifyTestEvidence(evidencePath);
      case 'VERIFY':
        return this.checker.verifyVerifyEvidence(evidencePath);
      case 'SHIP':
        return this.checker.verifyShipEvidence(evidencePath);
      default:
        return {
          valid: false,
          step: 'PLAN',
          evidencePath,
          checks: {
            exists: false,
            hasContent: false,
            parseable: false,
            hasRequiredFields: false
          },
          issues: [`Unknown step: ${step}`]
        };
    }
  }

  validateWorkflow(workspaceDir: string): { step: string; result: EvidenceResult | ValidationResult; valid: boolean }[] {
    const results = [];

    const steps = [
      { name: 'PLAN', evidence: '.shark/plan.md', type: 'evidence' },
      { name: 'BUILD', evidence: 'package.json', type: 'evidence' },
      { name: 'TEST', evidence: '.shark/test-results', type: 'validator' },
      { name: 'VERIFY', evidence: '.shark/verification-gates.md', type: 'evidence' },
      { name: 'SHIP', evidence: '.shark/SHIP_REPORT.md', type: 'evidence' }
    ];

    for (const step of steps) {
      const fullPath = `${workspaceDir}/${step.evidence}`;
      let result: any;
      let valid = false;

      if (step.type === 'evidence') {
        result = this.validateEvidence(step.name, fullPath);
        valid = result.valid;
      } else {
        result = this.validator.validateDirectory(fullPath, step.name);
        valid = result.passed;
      }

      results.push({ step: step.name, result, valid });
    }

    return results;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private getNemotronService(): NemotronService | null {
    try {
      const { NemotronService } = require('../../../OPENCODE WORKSPACE/Nemotron Communication Layer/src/service');
      return new NemotronService();
    } catch {
      return null;
    }
  }

  getValidator(): MechanicalValidator {
    return this.validator;
  }

  getChecker(): EvidenceChecker {
    return this.checker;
  }
}
