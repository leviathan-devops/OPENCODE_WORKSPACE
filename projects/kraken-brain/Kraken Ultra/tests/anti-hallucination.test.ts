import { describe, it, expect } from 'vitest';
import { EvidenceChecker, EvidenceResult } from '../src/anti-hallucination/evidence-checker';
import { MechanicalValidator, ValidationResult } from '../src/anti-hallucination/mechanical-validator';
import { ValidatorHook } from '../src/anti-hallucination/validator-hook';
import { THEATRICAL_PATTERNS } from '../src/anti-hallucination/patterns';
import * as fs from 'fs';
import * as path from 'path';

describe('Anti-Hallucination Validator', () => {
  const testDir = path.join(__dirname, '.test-data');
  const validator = new MechanicalValidator(testDir);
  const checker = new EvidenceChecker();
  const hook = new ValidatorHook(testDir);

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Theatrical Code Detection', () => {
    it('should detect mock without execution', () => {
      const code = `
        const mockTest = () => {
          const result = mock.success();
          return true;
        };
      `;
      const patterns = validator.detectTheatrical(code);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.includes('Mock') || p.includes('mock'))).toBe(true);
    });

    it('should detect TODO placeholders', () => {
      const code = `
        function processData(data: any) {
          // TODO: implement actual processing
          return null;
        }
      `;
      const patterns = validator.detectTheatrical(code);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should detect never called code', () => {
      const code = `
        function unusedFunction() {}
        export const unusedConstant;
      `;
      const patterns = validator.detectTheatrical(code);
      expect(patterns.some(p => p.includes('never') || p.includes('Never'))).toBe(true);
    });

    it('should detect fake test results', () => {
      const code = `
        const testResults = {
          "passed": true  // simulated results
        };
      `;
      const patterns = validator.detectTheatrical(code);
      expect(patterns.some(p => p.includes('fake') || p.includes('Fake'))).toBe(true);
    });

    it('should detect skipped tests', () => {
      const code = `
        describe.skip('skipped test', () => {
          it('should not run', () => {
            expect(true).toBe(true);
          });
        });
      `;
      const patterns = validator.detectTheatrical(code);
      expect(patterns.some(p => p.includes('skipped') || p.includes('Skipped'))).toBe(true);
    });

    it('should detect at least 10 theatrical patterns', () => {
      const patternCount = Object.keys(THEATRICAL_PATTERNS).length;
      expect(patternCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Valid Code Should Pass', () => {
    it('should pass valid code with real tests', () => {
      const code = `
        function add(a: number, b: number): number {
          return a + b;
        }

        describe('add function', () => {
          it('should add two numbers', () => {
            expect(add(2, 3)).toBe(5);
          });

          it('should handle negative numbers', () => {
            expect(add(-1, 1)).toBe(0);
          });
        });
      `;
      const patterns = validator.detectTheatrical(code);
      expect(patterns.length).toBe(0);
    });

    it('should pass code with actual implementation', () => {
      const code = `
        export class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }

          subtract(a: number, b: number): number {
            return a - b;
          }

          multiply(a: number, b: number): number {
            return a * b;
          }
        }
      `;
      const patterns = validator.detectTheatrical(code);
      expect(patterns.length).toBe(0);
    });
  });

  describe('Evidence Checker Validation', () => {
    it('should validate PLAN evidence', () => {
      const planPath = path.join(testDir, 'plan.md');
      fs.writeFileSync(planPath, `
# Project Plan

## Description
Build a test system.

## Steps
1. Create structure
2. Implement code
      `);

      const result = checker.verifyPlanEvidence(planPath);
      expect(result.step).toBe('PLAN');
      expect(result.checks.exists).toBe(true);
      expect(result.checks.hasContent).toBe(true);
    });

    it('should validate BUILD evidence', () => {
      const packagePath = path.join(testDir, 'package.json');
      fs.writeFileSync(packagePath, JSON.stringify({
        name: 'test-project',
        version: '1.0.0'
      }, null, 2));

      const result = checker.verifyBuildEvidence(packagePath);
      expect(result.step).toBe('BUILD');
      expect(result.checks.exists).toBe(true);
      expect(result.checks.parseable).toBe(true);
    });

    it('should validate TEST evidence', () => {
      const testLogPath = path.join(testDir, 'test-results.json');
      fs.writeFileSync(testLogPath, JSON.stringify({
        tests: 10,
        passed: 9,
        failed: 1,
        duration: 1234
      }, null, 2));

      const result = checker.verifyTestEvidence(testLogPath);
      expect(result.step).toBe('TEST');
      expect(result.checks.exists).toBe(true);
      expect(result.checks.parseable).toBe(true);
    });

    it('should validate VERIFY evidence', () => {
      const verifyPath = path.join(testDir, 'verification-gates.md');
      fs.writeFileSync(verifyPath, `
# Verification Gates

## Gates
- Code review: PASSED
- Tests: PASSED
      `);

      const result = checker.verifyVerifyEvidence(verifyPath);
      expect(result.step).toBe('VERIFY');
      expect(result.checks.exists).toBe(true);
      expect(result.checks.hasContent).toBe(true);
    });

    it('should validate SHIP evidence', () => {
      const shipPath = path.join(testDir, 'SHIP_REPORT.md');
      fs.writeFileSync(shipPath, `
# Ship Report

## Version 1.0.0

## Artifacts
- Docker image: v1.0.0
- NPM package: v1.0.0

## Deployed
Production: true
      `);

      const result = checker.verifyShipEvidence(shipPath);
      expect(result.step).toBe('SHIP');
      expect(result.checks.exists).toBe(true);
      expect(result.checks.hasContent).toBe(true);
    });

    it('should handle missing files', () => {
      const result = checker.verifyPlanEvidence('/nonexistent/path.md');
      expect(result.valid).toBe(false);
      expect(result.checks.exists).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle empty files', () => {
      const emptyPath = path.join(testDir, 'empty.md');
      fs.writeFileSync(emptyPath, '');

      const result = checker.verifyPlanEvidence(emptyPath);
      expect(result.valid).toBe(false);
      expect(result.checks.hasContent).toBe(false);
    });
  });

  describe('Mechanical Validator', () => {
    it('should detect theatrical patterns in code', () => {
      const theatricalCode = `
        // Mock implementation
        function mockTest() {
          return true; // TODO: implement
        }
      `;
      const patterns = validator.detectTheatrical(theatricalCode);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should validate workflow step BUILD', () => {
      const codePath = path.join(testDir, 'code.ts');
      fs.writeFileSync(codePath, `
        export function calculate(x: number): number {
          return x * 2;
        }
      `);

      const result = validator.validateWorkflowStep('BUILD', codePath);
      expect(result.passed).toBe(true);
      expect(result.theatricalDetected).toBe(false);
    });

    it('should detect theatrical in workflow step', () => {
      const codePath = path.join(testDir, 'theatrical.ts');
      fs.writeFileSync(codePath, `
        // FIXME: needs implementation
        export function placeholder() {
          return null;
        }
      `);

      const result = validator.validateWorkflowStep('BUILD', codePath);
      expect(result.theatricalDetected).toBe(true);
      expect(result.theatricalPatterns.length).toBeGreaterThan(0);
    });

    it('should cross-validate claims with evidence', () => {
      const claim = 'System processes data efficiently';
      const evidence = ['Data processing module completes in 100ms', 'Efficient algorithms used'];
      
      const result = validator.crossValidate(claim, evidence);
      expect(result).toBe(true);
    });

    it('should fail cross-validation with mismatched evidence', () => {
      const claim = 'System processes data efficiently';
      const evidence = ['UI looks good', 'Colors are nice'];
      
      const result = validator.crossValidate(claim, evidence);
      expect(result).toBe(false);
    });
  });

  describe('Validator Hook', () => {
    it('should intercept and block theatrical output', () => {
      const theatricalOutput = `
        // Mock implementation
        const mockResult = { success: true };
      `;
      
      const result = hook.interceptOutput('agent-1', theatricalOutput);
      expect(result.valid).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it('should allow valid output', () => {
      const validOutput = `
        function processData(data: string): string {
          return data.toUpperCase();
        }
      `;
      
      const result = hook.interceptOutput('agent-1', validOutput);
      expect(result.valid).toBe(true);
      expect(result.blocked).toBe(false);
    });

    it('should validate agent output', () => {
      const output = `
        function calculate(x: number): number {
          return x * 2;
        }
      `;
      
      const result = hook.validateAgentOutput('agent-1', output);
      expect(result.theatricalDetected).toBe(false);
      expect(result.theatricalPatterns.length).toBe(0);
    });

    it('should detect theatrical in agent output', () => {
      const output = `
        // TODO: implement this
        function placeholder() {
          return null;
        }
      `;
      
      const result = hook.validateAgentOutput('agent-1', output);
      expect(result.theatricalDetected).toBe(true);
      expect(result.theatricalPatterns.length).toBeGreaterThan(0);
    });

    it('should enable and disable', () => {
      hook.disable();
      expect(hook.isEnabled()).toBe(false);
      
      hook.enable();
      expect(hook.isEnabled()).toBe(true);
    });

    it('should return validator and checker instances', () => {
      expect(hook.getValidator()).toBeInstanceOf(MechanicalValidator);
      expect(hook.getChecker()).toBeInstanceOf(EvidenceChecker);
    });
  });

  describe('Integration Tests', () => {
    it('should detect multiple theatrical patterns', () => {
      const code = `
        // Mock implementation
        export function stubTest() {
          return true; // TODO: implement
        }
        
        // FIXME: fix this
        const dummy = () => {};
      `;
      
      const patterns = validator.detectTheatrical(code);
      expect(patterns.length).toBeGreaterThanOrEqual(2);
    });

    it('should validate all 5 workflow steps', () => {
      const files = {
        plan: path.join(testDir, 'plan.md'),
        build: path.join(testDir, 'package.json'),
        test: path.join(testDir, 'test-results.json'),
        verify: path.join(testDir, 'verification-gates.md'),
        ship: path.join(testDir, 'SHIP_REPORT.md')
      };

      fs.writeFileSync(files.plan, '# Plan\n## Description\nTest plan\n## Steps\n1. Step 1');
      fs.writeFileSync(files.build, JSON.stringify({ name: 'test', version: '1.0.0' }));
      fs.writeFileSync(files.test, JSON.stringify({ tests: 5, passed: 5, failed: 0, duration: 100 }));
      fs.writeFileSync(files.verify, '# Verification\n## Gates\nPassed');
      fs.writeFileSync(files.ship, '# Ship\n## Version\n1.0.0\n## Deployed\ntrue');

      const results = [
        checker.verifyPlanEvidence(files.plan),
        checker.verifyBuildEvidence(files.build),
        checker.verifyTestEvidence(files.test),
        checker.verifyVerifyEvidence(files.verify),
        checker.verifyShipEvidence(files.ship)
      ];

      results.forEach((result, index) => {
        expect(result.step).toBe(['PLAN', 'BUILD', 'TEST', 'VERIFY', 'SHIP'][index]);
        expect(result.checks.exists).toBe(true);
        expect(result.checks.hasContent).toBe(true);
      });
    });

    it('should detect code that is never imported', () => {
      const code = `
        function internalHelper() {
          return 'helper';
        }

        export const PUBLIC_API = 'api';
      `;
      
      const patterns = validator.detectTheatrical(code);
      expect(patterns.length).toBe(0);
    });

    it('should detect function with only comments', () => {
      const code = `
        // This is a function
        function commentOnly() {
          // TODO: implement later
        }
      `;
      
      const patterns = validator.detectTheatrical(code);
      expect(patterns.some(p => p.toLowerCase().includes('placeholder') || p.toLowerCase().includes('todo'))).toBe(true);
    });
  });
});
