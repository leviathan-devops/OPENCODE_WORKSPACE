export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
}

export class MechanicalValidator {
  private readonly THEATRICAL_PATTERNS = [
    /class.*Abstract.*Factory/i,
    /class.*Manager.*Manager/i,
    /interface.*Interface/i,
    /function.*wrapper.*wrapper/i,
    /\/\/ TODO/i,
    /\/\/ FIXME/i,
    /\/\/ HACK/i,
    /\/\/ NOTE:/i,
    /export interface.*Options.*Options/i,
    /class.*Builder.*Builder.*Builder/i,
    /\/\/ This is a/i,
    /\/\/ The purpose of/i,
    /\/\/ In order to/i,
    /\/\/ As part of/i
  ];

  detectTheatrical(text: string): ValidationResult {
    for (const pattern of this.THEATRICAL_PATTERNS) {
      if (pattern.test(text)) {
        return {
          allowed: false,
          reason: `🦈 THEATRICAL CODE DETECTED: Pattern "${pattern.source}" found. Write actual working code, not theatrical abstractions.`,
          severity: 'high'
        };
      }
    }
    return { allowed: true, severity: 'none' };
  }

  validateComplexity(text: string): ValidationResult {
    const lines = text.split('\\n');
    
    // File Size Check
    if (text.length > 50000) {
      return {
        allowed: false,
        reason: `🦈 COMPLEXITY BLOCK: File size ${text.length} bytes exceeds maximum 50KB. Break into smaller modules.`,
        severity: 'medium'
      };
    }

    // Function Length Check
    let functionStart = -1;
    let functionLines = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^\\s*(export\\s+)?(async\\s+)?function\\s+/)) {
        if (functionStart >= 0 && functionLines > 100) {
          return {
            allowed: false,
            reason: `🦈 COMPLEXITY BLOCK: Function at line ${functionStart + 1} has ${functionLines} lines (max 100).`,
            severity: 'medium'
          };
        }
        functionStart = i;
        functionLines = 0;
      } else if (functionStart >= 0) {
        functionLines++;
      }
    }

    // Nesting Depth Check
    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.endsWith('{') || trimmed.endsWith('(')) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      if (trimmed.startsWith('}') || trimmed.startsWith(')')) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }
    if (maxNesting > 4) {
      return {
        allowed: false,
        reason: `🦈 COMPLEXITY BLOCK: Nesting depth ${maxNesting} exceeds maximum 4.`,
        severity: 'medium'
      };
    }

    return { allowed: true, severity: 'none' };
  }

  validatePrecision(text: string, diff?: string): ValidationResult {
    const lines = text.split('\\n');
    
    // Comment Ratio Check
    if (text.length > 500) {
      const commentMatches = text.match(/\/\/|\/\*|\*/g) || [];
      const commentRatio = commentMatches.length / Math.max(text.length, 1);
      if (commentRatio < 0.1) {
        return {
          allowed: false,
          reason: `🦈 PRECISION BLOCK: Low comment ratio (${(commentRatio * 100).toFixed(1)}%). Code is too "naked".`,
          severity: 'low'
        };
      }
    }

    // Diff Size Check
    if (diff && diff.length > 1000) {
      return {
        allowed: false,
        reason: `🦈 PRECISION BLOCK: Diff size ${diff.length} chars exceeds maximum 1000 for a single operation.`,
        severity: 'medium'
      };
    }

    // Repetition Check
    const classMatches = text.match(/\\bclass\\s+\\w+/g) || [];
    const uniqueClasses = new Set(classMatches);
    if (classMatches.length > 6 && uniqueClasses.size < classMatches.length / 2) {
      return {
        allowed: false,
        reason: `🦈 PRECISION BLOCK: High class repetition detected. Possible copy-paste slop.`,
        severity: 'high'
      };
    }

    return { allowed: true, severity: 'none' };
  }

  validateObservability(text: string): ValidationResult {
    // Detect bare catch blocks: catch { ... } or catch(e) { ... } without logging
    const catchRegex = /catch\s*\(?.*?\)?\s*\{([^{}]*)\}/g;
    let match;
    while ((match = catchRegex.exec(text)) !== null) {
      const body = match[1];
      if (!/log|console\.error|throw/i.test(body)) {
        return {
          allowed: false,
          reason: `🦈 OBSERVABILITY BLOCK: Silent catch block detected. Every exception MUST be logged or re-thrown.`,
          severity: 'high'
        };
      }
    }
    return { allowed: true, severity: 'none' };
  }

  validateIntegration(text: string): ValidationResult {
    // Block mock-only tests in integration directories (heuristic)
    if (text.includes('test') && text.includes('mock') && !text.includes('api') && !text.includes('http')) {
      return {
        allowed: false,
        reason: `🦈 INTEGRATION BLOCK: Potential mock-trap detected. Integration tests must use real services.`,
        severity: 'high'
      };
    }
    return { allowed: true, severity: 'none' };
  }
}

export class EvidenceChecker {
  check(text: string, expectedPattern: RegExp): boolean {
    return expectedPattern.test(text);
  }
}
