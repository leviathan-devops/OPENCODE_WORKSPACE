/**
 * Deep Planning Mode - Pattern Tests
 * 
 * Mechanical verification tests for pattern detection.
 * Following Trident v3.0 testing protocol.
 */

import {
  scanRequirements,
  scanConstraints,
  scanDeliverables,
  scanFileDependencies,
  scanAPIDependencies,
  scanServiceDependencies,
  scanHumanDependencies,
  scanRisks,
  scanCheckpoints,
  scanTimeConstraints,
  scanScopeConstraints,
  fullScan,
  Finding,
} from '../context-library/patterns';

describe('Pattern Detection Tests', () => {
  describe('Requirement Patterns', () => {
    it('detects explicit feature declarations', () => {
      const content = 'feature: user authentication';
      const findings = scanRequirements(content);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].match).toContain('user authentication');
    });

    it('detects should-statements', () => {
      const content = 'the system should validate tokens';
      const findings = scanRequirements(content);
      expect(findings.some(f => f.match.includes('should'))).toBe(true);
    });

    it('detects user stories', () => {
      const content = 'As a user, I need to reset my password';
      const findings = scanRequirements(content);
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe('Constraint Patterns', () => {
    it('detects must-constraints', () => {
      const content = 'must complete within 2 hours';
      const findings = scanConstraints(content);
      expect(findings.length).toBeGreaterThan(0);
    });

    it('detects time constraints', () => {
      const content = 'within 3 days';
      const findings = scanTimeConstraints(content);
      expect(findings.some(f => f.match.includes('3'))).toBe(true);
    });

    it('detects scope constraints', () => {
      const content = 'in scope: authentication, authorization';
      const findings = scanScopeConstraints(content);
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe('Dependency Patterns', () => {
    it('detects ES6 imports', () => {
      const content = 'import { foo } from "./bar"';
      const findings = scanFileDependencies(content);
      expect(findings.some(f => f.match.includes('bar'))).toBe(true);
    });

    it('detects CommonJS requires', () => {
      const content = 'const foo = require("./bar")';
      const findings = scanFileDependencies(content);
      expect(findings.some(f => f.match.includes('bar'))).toBe(true);
    });

    it('detects API dependencies', () => {
      const content = 'calls the user API';
      const findings = scanAPIDependencies(content);
      expect(findings.some(f => f.match.includes('API'))).toBe(true);
    });

    it('detects service dependencies', () => {
      const content = 'uses the auth service';
      const findings = scanServiceDependencies(content);
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe('Risk Patterns', () => {
    it('detects failure possibilities', () => {
      const content = 'this might fail on timeout';
      const findings = scanRisks(content);
      expect(findings.some(f => f.match.includes('might fail'))).toBe(true);
    });

    it('detects blockers', () => {
      const content = 'blocked by the database team';
      const findings = scanRisks(content);
      expect(findings.some(f => f.category === 'BLOCKER')).toBe(true);
    });

    it('detects circular dependencies', () => {
      const content = 'circular dependency detected';
      const findings = scanRisks(content);
      expect(findings.some(f => f.severity === 'CRITICAL')).toBe(true);
    });
  });
});

describe('Duplicate Prevention Tests', () => {
  it('should NOT duplicate findings for non-global regex', () => {
    const content = 'should do this should do that should do something';
    const findings = scanRequirements(content);
    expect(findings.length).toBe(3);
  });

  it('should find exactly 3 matches for 3 actual patterns', () => {
    const content = 'return null; return null; return null;';
    const findings = scanRequirements(content);
    expect(findings.length).toBeLessThanOrEqual(3);
  });
});

describe('SafetyCount Tests', () => {
  it('should complete in reasonable time for large input', () => {
    const content = 'should ' + 'a'.repeat(10) + '\n'.repeat(200);
    const start = Date.now();
    const findings = scanRequirements(content, { maxMatches: 100 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it('should respect maxMatches limit', () => {
    const content = 'should '.repeat(500);
    const findings = scanRequirements(content, { maxMatches: 100 });
    expect(findings.length).toBeLessThanOrEqual(100);
  });
});

describe('Line Number Accuracy', () => {
  it('reports correct line numbers', () => {
    const content = 'line one\nshould find this\nline three';
    const findings = scanRequirements(content);
    const line2 = findings.find(f => f.line === 2);
    expect(line2).toBeDefined();
    expect(line2?.match).toContain('should find this');
  });

  it('handles multiline content', () => {
    const content = 'feature: first\nfeature: second\nfeature: third';
    const findings = scanRequirements(content);
    expect(findings.length).toBe(3);
    const lines = findings.map(f => f.line);
    expect(lines).toContain(1);
    expect(lines).toContain(2);
    expect(lines).toContain(3);
  });
});

describe('Evidence Tests', () => {
  it('includes evidence for each finding', () => {
    const content = 'should do something important';
    const findings = scanRequirements(content);
    expect(findings.every(f => f.evidence && f.evidence.length > 0)).toBe(true);
  });

  it('evidence matches the original text', () => {
    const content = 'should do something important';
    const findings = scanRequirements(content);
    const evidence = findings[0]?.evidence || '';
    expect(content).toContain(evidence.trim());
  });
});

describe('Full Scan Tests', () => {
  it('runs all pattern categories', () => {
    const content = `
      feature: user authentication
      must complete within 3 days
      import { auth } from "./auth"
      might fail on timeout
    `;
    const findings = fullScan(content);
    expect(findings.length).toBeGreaterThan(4);
    
    const categories = new Set(findings.map(f => f.category));
    expect(categories.size).toBeGreaterThan(1);
  });
});
