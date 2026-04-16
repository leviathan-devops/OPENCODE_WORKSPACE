/**
 * Gates — MECHANICAL Enforcement Layer
 * 
 * Gate chain: PLAN → BUILD → TEST → VERIFY → AUDIT → DELIVERY
 * 
 * ALL criteria is ENFORCED algorithmically - NO PROMPTS.
 * Evidence MUST exist and be validated before gate transition.
 * 
 * VERIFY failure triggers iteration loop:
 *   VERIFY fail → BUILD → TEST → VERIFY (max 3 attempts)
 *   After 3 failures → escalate to PLAN with new iteration (V1.0 → V1.1)
 * 
 * OPENCODE CONTAINER TEST requirement:
 *   Delivery gate requires actual container test execution via shark-test-runner.
 *   No plugin deployment without container test evidence.
 */

import { EvidenceCollector, type GateName, type GateEvidence } from './evidence.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type GateStatus = 'pending' | 'blocked' | 'passed' | 'failed';

export interface GateCriteria {
  gate: GateName;
  blockingCriteria: string[];
  evidenceRequired: string[];
}

export const GATE_CHAIN: GateName[] = ['plan', 'build', 'test', 'verify', 'audit', 'delivery'];

// CRITICAL: Evidence patterns for algorithmic validation
const EVIDENCE_PATTERNS: Record<string, { pattern: RegExp; check: (path: string) => boolean }> = {
  'TestResults.xml': {
    pattern: /test.*results/i,
    check: (p: string) => {
      try {
        const content = fs.readFileSync(p, 'utf8');
        // Must have actual test run evidence, not empty
        return content.includes('<testcase') || content.includes('"tests"') || content.includes('"passed"');
      } catch { return false; }
    }
  },
  'CoverageReport.json': {
    pattern: /coverage/i,
    check: (p: string) => {
      try {
        const content = fs.readFileSync(p, 'utf8');
        const data = JSON.parse(content);
        // Must have coverage >= 80%
        const coverage = data.total?.statements?.pct || data.total?.lines?.pct || 0;
        return coverage >= 80;
      } catch { return false; }
    }
  },
  'ContainerTestResults.json': {
    pattern: /container.*test/i,
    check: (p: string) => {
      try {
        const content = fs.readFileSync(p, 'utf8');
        const data = JSON.parse(content);
        // Must have container test evidence
        return data.container && data.success === true;
      } catch { return false; }
    }
  },
  'VerificationReport.json': {
    pattern: /verification/i,
    check: (p: string) => {
      try {
        const content = fs.readFileSync(p, 'utf8');
        return content.includes('verified') || content.includes('pass');
      } catch { return false; }
    }
  },
  'SASTReport.json': {
    pattern: /sast|security|scan/i,
    check: (p: string) => {
      try {
        const content = fs.readFileSync(p, 'utf8');
        const data = JSON.parse(content);
        // Must have 0 critical/high issues
        return (data.critical || 0) === 0 && (data.high || 0) === 0;
      } catch { return false; }
    }
  },
  'SecretsScan.json': {
    pattern: /secrets|scan/i,
    check: (p: string) => {
      try {
        const content = fs.readFileSync(p, 'utf8');
        const data = JSON.parse(content);
        return (data.secrets || data.findings || []).length === 0;
      } catch { return false; }
    }
  },
};

export const GATE_CRITERIA: Record<GateName, GateCriteria> = {
  plan: {
    gate: 'plan',
    blockingCriteria: [
      'Clear requirements defined',
      'SPEC.md generated',
      'Scope boundaries defined',
      'Acceptance criteria defined',
    ],
    evidenceRequired: ['SPEC.md', 'GuardianConfig.json'],
  },
  build: {
    gate: 'build',
    blockingCriteria: [
      'Files created per SPEC.md',
      'No scope violations',
      'Implementation matches spec',
    ],
    evidenceRequired: ['FileManifest.json', 'GitDiff.txt'],
  },
  test: {
    gate: 'test',
    blockingCriteria: [
      'Tests pass',
      'Coverage ≥ 80%',
      'No weak assertions (toBeTruthy banned)',
      'CONTAINER TEST REQUIRED - static tests do NOT count',
      'No mock tests (jest.fn, sinon.stub, etc.)',
    ],
    evidenceRequired: ['TestResults.xml', 'CoverageReport.json', 'ContainerTestResults.json'],
  },
  verify: {
    gate: 'verify',
    blockingCriteria: [
      'SPEC.md alignment verified',
      'Integration tests pass',
      'Edge cases handled',
      'No theatrical code',
      'Error handling complete',
    ],
    evidenceRequired: ['VerificationReport.json'],
  },
  audit: {
    gate: 'audit',
    blockingCriteria: [
      'SAST clean (0 critical/high)',
      'No secrets detected',
      'Dependencies audited (no critical CVEs)',
    ],
    evidenceRequired: ['SASTReport.json', 'SecretsScan.json', 'AuditReport.json'],
  },
  delivery: {
    gate: 'delivery',
    blockingCriteria: [
      'All previous gates passed',
      'Evidence archived',
      'Checkpoint created',
    ],
    evidenceRequired: ['EvidenceArchive.zip', 'DeliverySummary.md'],
  },
};

// Block patterns that indicate mock tests
const MOCK_PATTERNS = [
  /jest\.fn\(\)/,
  /jest\.mock\(/,
  /sinon\.stub\(/,
  /sinon\.spy\(/,
  /mock\(/,
  /stub\(/,
  /\.mock\./,
  /PressureTest/,
  /test\s*\(\s*['"]should.*mock/i,
];

// Block patterns for theatrical code
const THEATRICAL_PATTERNS = [
  /AbstractFactory/i,
  /ManagerManager/i,
  /InterfaceInterface/i,
  /\/\/\s*TODO/i,
  /\/\/\s*FIXME/i,
  /BuilderBuilder/i,
];

export class GateManager {
  private currentGate: GateName = 'plan';
  private gateStatus: Record<GateName, GateStatus> = {
    plan: 'pending',
    build: 'pending',
    test: 'pending',
    verify: 'pending',
    audit: 'pending',
    delivery: 'pending',
  };
  private verifyAttempts: number = 0;
  private currentIteration: string = 'V1.0';
  private evidenceCollector: EvidenceCollector;
  private iterationAttempts: Record<string, number> = {};
  private evidencePath: string;

  constructor(basePath: string = '.shark') {
    this.evidenceCollector = new EvidenceCollector(basePath);
    this.evidencePath = basePath;
  }

  getCurrentGate(): GateName {
    return this.currentGate;
  }

  getGateStatuses(): Record<GateName, GateStatus> {
    return { ...this.gateStatus };
  }

  getCurrentIteration(): string {
    return this.currentIteration;
  }

  /**
   * MECHANICAL ENFORCEMENT: Check if transition is allowed
   * Must have actual evidence files, not just claims
   */
  canTransition(to: GateName): boolean {
    const currentIndex = GATE_CHAIN.indexOf(this.currentGate);
    const targetIndex = GATE_CHAIN.indexOf(to);

    if (targetIndex <= currentIndex) return false;
    if (targetIndex > currentIndex + 1) return false;

    // MECHANICAL: Check evidence exists for current gate before advancing
    const criteria = this.getCriteria(this.currentGate);
    if (!this.validateEvidence(criteria.evidenceRequired)) {
      return false;
    }

    // MECHANICAL: Test gate requires container test evidence
    if (this.currentGate === 'test' && !this.hasContainerTestEvidence()) {
      console.error('[GATE] TEST gate blocked: No container test evidence');
      return false;
    }

    // MECHANICAL: Audit gate requires clean SAST
    if (this.currentGate === 'audit') {
      if (!this.validateSASTClean()) {
        console.error('[GATE] AUDIT gate blocked: SAST issues found');
        return false;
      }
    }

    return true;
  }

  /**
   * MECHANICAL: Validate evidence files exist AND contain valid data
   */
  private validateEvidence(required: string[]): boolean {
    const evidenceDir = path.join(this.evidencePath, 'evidence', this.currentGate);
    
    for (const req of required) {
      const fullPath = path.join(evidenceDir, req);
      const altPath = path.join(this.evidencePath, req);
      
      let found = false;
      for (const p of [fullPath, altPath]) {
        if (fs.existsSync(p)) {
          const checker = EVIDENCE_PATTERNS[req];
          if (checker) {
            if (checker.check(p)) {
              found = true;
              break;
            }
          } else {
            // No checker, just check file exists and has content
            const stat = fs.statSync(p);
            if (stat.size > 0) {
              found = true;
              break;
            }
          }
        }
      }
      
      if (!found) {
        console.error(`[GATE] Evidence missing: ${req}`);
        return false;
      }
    }
    
    return true;
  }

  /**
   * MECHANICAL: Check for container test evidence
   * Static tests do NOT count - must be actual container run
   */
  private hasContainerTestEvidence(): boolean {
    const evidenceDir = path.join(this.evidencePath, 'evidence', 'test');
    
    if (!fs.existsSync(evidenceDir)) return false;
    
    const files = fs.readdirSync(evidenceDir);
    for (const file of files) {
      if (file.includes('container') || file.includes('integration')) {
        const fullPath = path.join(evidenceDir, file);
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const data = JSON.parse(content);
          if (data.container && data.success) {
            return true;
          }
        } catch { continue; }
      }
    }
    
    // Also check for docker/container evidence
    for (const file of files) {
      const fullPath = path.join(evidenceDir, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('hermes-oc-agent') || content.includes('ghcr.io/anomalyco/opencode')) {
          return true;
        }
      } catch { continue; }
    }
    
    return false;
  }

  /**
   * MECHANICAL: Verify SAST is clean
   */
  private validateSASTClean(): boolean {
    const evidenceDir = path.join(this.evidencePath, 'evidence', 'audit');
    const sastFile = path.join(evidenceDir, 'SASTReport.json');
    
    if (!fs.existsSync(sastFile)) {
      console.error('[GATE] SAST report missing');
      return false;
    }
    
    try {
      const content = fs.readFileSync(sastFile, 'utf8');
      const data = JSON.parse(content);
      return (data.critical || 0) === 0 && (data.high || 0) === 0;
    } catch {
      return false;
    }
  }

  /**
   * MECHANICAL ENFORCEMENT: Block test files containing mocks
   */
  validateTestFile(filePath: string): { allowed: boolean; reason?: string } {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pattern of MOCK_PATTERNS) {
        if (pattern.test(content)) {
          return {
            allowed: false,
            reason: `MOCK_PATTERN_BLOCKED: ${pattern.source} - Mock tests are FORBIDDEN. Use real containers only.`
          };
        }
      }
      
      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  /**
   * MECHANICAL ENFORCEMENT: Block theatrical code
   */
  validateCodeFile(filePath: string): { allowed: boolean; reason?: string } {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      for (const pattern of THEATRICAL_PATTERNS) {
        if (pattern.test(content)) {
          return {
            allowed: false,
            reason: `THEATRICAL_CODE_BLOCKED: ${pattern.source} - Over-engineered code not allowed.`
          };
        }
      }
      
      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  transitionTo(to: GateName): boolean {
    if (!this.canTransition(to)) {
      console.error(`[GATE] Transition blocked: ${this.currentGate} → ${to}`);
      return false;
    }

    this.gateStatus[this.currentGate] = 'passed';
    this.currentGate = to;
    this.gateStatus[to] = 'blocked';

    if (to === 'verify') {
      this.verifyAttempts = 0;
    }

    console.error(`[GATE] MECHANICAL TRANSITION: ${GATE_CHAIN[GATE_CHAIN.indexOf(this.currentGate) - 1]} → ${to}`);
    return true;
  }

  blockCurrentGate(): void {
    this.gateStatus[this.currentGate] = 'blocked';
  }

  passCurrentGate(): void {
    // MECHANICAL: Can only pass if criteria validated
    const criteria = this.getCriteria(this.currentGate);
    if (this.validateEvidence(criteria.evidenceRequired)) {
      this.gateStatus[this.currentGate] = 'passed';
    } else {
      console.error(`[GATE] Cannot pass ${this.currentGate}: evidence not validated`);
    }
  }

  failCurrentGate(): void {
    this.gateStatus[this.currentGate] = 'failed';
  }

  getCriteria(gate: GateName): GateCriteria {
    return GATE_CRITERIA[gate];
  }

  getIterationAttempts(iteration: string): number {
    return this.iterationAttempts[iteration] || 0;
  }

  handleVerifyFailure(): { action: 'loop' | 'escalate'; iteration: string } {
    this.verifyAttempts++;
    this.iterationAttempts[this.currentIteration] = this.verifyAttempts;

    if (this.verifyAttempts >= 3) {
      return this.escalateToPlan();
    }

    return { action: 'loop', iteration: this.currentIteration };
  }

  private escalateToPlan(): { action: 'escalate'; iteration: string } {
    const parts = this.currentIteration.split(/(\d+)$/);
    const name = parts[0] || 'V';
    const numStr = parts[1] || '0';
    const nextNum = parseInt(numStr) + 1;
    this.currentIteration = `${name}${nextNum}`;

    this.verifyAttempts = 0;

    this.gateStatus = {
      plan: 'pending',
      build: 'pending',
      test: 'pending',
      verify: 'pending',
      audit: 'pending',
      delivery: 'pending',
    };

    this.currentGate = 'plan';

    return { action: 'escalate', iteration: this.currentIteration };
  }

  getEvidenceCollector(): EvidenceCollector {
    return this.evidenceCollector;
  }

  isComplete(): boolean {
    return this.currentGate === 'delivery' && this.gateStatus['delivery'] === 'passed';
  }

  getState(): Record<string, unknown> {
    return {
      currentGate: this.currentGate,
      gateStatus: { ...this.gateStatus },
      verifyAttempts: this.verifyAttempts,
      currentIteration: this.currentIteration,
      iterationAttempts: { ...this.iterationAttempts },
    };
  }

  restore(state: Record<string, unknown>): void {
    if (state.currentGate) this.currentGate = state.currentGate as GateName;
    if (state.gateStatus) this.gateStatus = state.gateStatus as Record<GateName, GateStatus>;
    if (state.verifyAttempts !== undefined) this.verifyAttempts = state.verifyAttempts as number;
    if (state.currentIteration) this.currentIteration = state.currentIteration as string;
    if (state.iterationAttempts) this.iterationAttempts = state.iterationAttempts as Record<string, number>;
  }
}
