/**
 * DEEP PLANNING MODE - Pattern Library
 * 
 * Contains all regex patterns for requirement extraction,
 * dependency mapping, risk analysis, and checkpoint detection.
 * 
 * Each pattern follows the format:
 * { regex: RegExp, severity: SEVERITY, note?: string }
 */

import { SEVERITY, Severity } from './types';

export { SEVERITY };
export type { Severity };

// ============================================================
// REQUIREMENT PATTERNS
// Extract requirements, constraints, and deliverables from text
// ============================================================

export const REQUIREMENT_PATTERNS = {
  FEATURE: [
    {
      regex: /feature:\s*(.+)/gi,
      severity: SEVERITY.HIGH,
      note: 'Explicit feature declaration'
    },
    {
      regex: /should\s+([^\n]+?)(?=\s+should|\.|$|\n)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'User expectation statement'
    },
    {
      regex: /needs?\s+([^\n]+?)(?=\.|$|\s+should|\s+need)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Stated user need'
    },
    {
      regex: /want\s+([^\n]+?)(?:\.|$)/gi,
      severity: SEVERITY.LOW,
      note: 'User desire'
    },
    {
      regex: /as\s+a\s+(?:\w+),?\s+I\s+(?:want|need|should)\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'User story format'
    },
  ],
  
  CONSTRAINT: [
    {
      regex: /must\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Hard constraint'
    },
    {
      regex: /can't\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Negative constraint'
    },
    {
      regex: /cannot\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Negative constraint'
    },
    {
      regex: /only\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Scope constraint'
    },
    {
      regex: /within\s+(\d+)\s*(hour|day|week|month)s?/gi,
      severity: SEVERITY.HIGH,
      note: 'Time constraint'
    },
    {
      regex: /budget\s+(?:is\s+)?(\d+)\s*(?:dollars|usd|\$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Budget constraint'
    },
    {
      regex: /limited\s+to\s+(\d+)\s*(?:users?|requests?|items?)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Scale constraint'
    },
  ],
  
  DELIVERABLE: [
    {
      regex: /deliverable:\s*(.+)/gi,
      severity: SEVERITY.HIGH,
      note: 'Explicit deliverable'
    },
    {
      regex: /end\s+result\s+is\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Outcome statement'
    },
    {
      regex: /produce\s+(?:a\s+)?(.+?)(?:\.|$)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Production statement'
    },
    {
      regex: /generate\s+(?:a\s+)?(.+?)(?:\.|$)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Generation statement'
    },
    {
      regex: /create\s+(?:a\s+)?(.+?)(?:\.|$)/gi,
      severity: SEVERITY.LOW,
      note: 'Creation statement'
    },
  ],
} as const;

// ============================================================
// DEPENDENCY PATTERNS
// Map file, API, service, and human dependencies
// ============================================================

export const DEPENDENCY_PATTERNS = {
  FILE_DEP: [
    {
      regex: /depends?\s+on\s+[`'"]?([\w./-]+)[`'"]?/gi,
      severity: SEVERITY.CRITICAL,
      note: 'Explicit file dependency'
    },
    {
      regex: /import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|[A-Z]\w*)\s+from\s+[`'"]?([\w./-]+)[`'"]?/gi,
      severity: SEVERITY.HIGH,
      note: 'ES6 import statement'
    },
    {
      regex: /import\s+[`'"]?([\w./-]+)[`'"]?/gi,
      severity: SEVERITY.HIGH,
      note: 'CommonJS import'
    },
    {
      regex: /require\s*\(\s*[`'"]?([\w./-]+)[`'"]?\s*\)/gi,
      severity: SEVERITY.HIGH,
      note: 'CommonJS require statement'
    },
    {
      regex: /from\s+[`'"]?([\w./-]+)[`'"]?\s+import/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Python import'
    },
    {
      regex: /#include\s*[<"]([^\">]+)[>"]/gi,
      severity: SEVERITY.HIGH,
      note: 'C/C++ include'
    },
    {
      regex: /extends\s+([A-Z]\w*)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Class inheritance'
    },
    {
      regex: /implements\s+([A-Z]\w*)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Interface implementation'
    },
  ],
  
  API_DEP: [
    {
      regex: /api:\s*(\w+)/gi,
      severity: SEVERITY.HIGH,
      note: 'Named API dependency'
    },
    {
      regex: /calls?\s+(?:the\s+)?(\w+)\s*API/gi,
      severity: SEVERITY.HIGH,
      note: 'API call statement'
    },
    {
      regex: /(\w+)\s+API/gi,
      severity: SEVERITY.MEDIUM,
      note: 'API reference'
    },
    {
      regex: /endpoint:\s*(\/\S+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Endpoint reference'
    },
    {
      regex: /GET|POST|PUT|DELETE|PATCH\s+(\/\S+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'HTTP method endpoint'
    },
    {
      regex: /base[_\s]?url:\s*(\S+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Base URL config'
    },
  ],
  
  SERVICE_DEP: [
    {
      regex: /service:\s*(\w+)/gi,
      severity: SEVERITY.HIGH,
      note: 'Named service dependency'
    },
    {
      regex: /uses?\s+(?:the\s+)?(\w+)\s+service/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Service usage'
    },
    {
      regex: /connects?\s+to\s+(\w+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Service connection'
    },
    {
      regex: /(\w+)\s+database/gi,
      severity: SEVERITY.HIGH,
      note: 'Database dependency'
    },
    {
      regex: /queue:\s*(\w+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Queue dependency'
    },
    {
      regex: /cache:\s*(\w+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Cache dependency'
    },
  ],
  
  HUMAN_DEP: [
    {
      regex: /needs?\s+(?:\w+\s+)?to\s+(?:contact|ask|coordinate|check\s+with)\s+(\w+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Human dependency'
    },
    {
      regex: /coordinate\s+with\s+(\w+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Coordination needed'
    },
    {
      regex: /approval\s+from\s+(\w+)/gi,
      severity: SEVERITY.HIGH,
      note: 'Approval dependency'
    },
    {
      regex: /depends?\s+on\s+(\w+)\s+team/gi,
      severity: SEVERITY.HIGH,
      note: 'Team dependency'
    },
    {
      regex: /input\s+from\s+(\w+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Input provider'
    },
  ],
} as const;

// ============================================================
// RISK PATTERNS
// Identify failure modes, blockers, and uncertainties
// ============================================================

export const RISK_PATTERNS = {
  FAILURE_MODE: [
    {
      regex: /might\s+(?:fail|break|crash|error)/gi,
      severity: SEVERITY.HIGH,
      note: 'Stated failure possibility'
    },
    {
      regex: /could\s+(?:fail|break|crash|error)/gi,
      severity: SEVERITY.HIGH,
      note: 'Stated failure possibility'
    },
    {
      regex: /race\s+condition/gi,
      severity: SEVERITY.CRITICAL,
      note: 'Concurrency risk'
    },
    {
      regex: /deadlock/gi,
      severity: SEVERITY.CRITICAL,
      note: 'Critical concurrency risk'
    },
    {
      regex: /memory\s+leak/gi,
      severity: SEVERITY.HIGH,
      note: 'Resource leak risk'
    },
    {
      regex: /stack\s+overflow/gi,
      severity: SEVERITY.CRITICAL,
      note: 'Critical resource risk'
    },
    {
      regex: /null\s+pointer|null\s+reference|npe/gi,
      severity: SEVERITY.HIGH,
      note: 'Null reference risk'
    },
    {
      regex: /timeout/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Timeout risk'
    },
    {
      regex: /data\s+loss/gi,
      severity: SEVERITY.CRITICAL,
      note: 'Critical data risk'
    },
    {
      regex: /data\s+corruption/gi,
      severity: SEVERITY.CRITICAL,
      note: 'Critical data risk'
    },
  ],
  
  BLOCKER: [
    {
      regex: /blocked\s+by\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Stated blocker'
    },
    {
      regex: /blocker:\s*(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Named blocker'
    },
    {
      regex: /waiting\s+on\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Pending dependency'
    },
    {
      regex: /circular\s+dependency|circular\s+dep/gi,
      severity: SEVERITY.CRITICAL,
      note: 'Critical circular dependency'
    },
    {
      regex: /cyclic\s+dependency/gi,
      severity: SEVERITY.CRITICAL,
      note: 'Critical cyclic dependency'
    },
    {
      regex: /chicken\s+and\s+egg/gi,
      severity: SEVERITY.HIGH,
      note: 'Circular dependency reference'
    },
    {
      regex: /can't\s+proceed\s+until/gi,
      severity: SEVERITY.HIGH,
      note: 'Proceed blocker'
    },
  ],
  
  UNCERTAINTY: [
    {
      regex: /unknown\s+(?:if|whether)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Uncertainty flagged'
    },
    {
      regex: /not\s+sure\s+(?:if|whether|about)/gi,
      severity: SEVERITY.LOW,
      note: 'Minor uncertainty'
    },
    {
      regex: /might\s+need\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Potential requirement'
    },
    {
      regex: /may\s+(?:need|require|have)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Potential requirement'
    },
    {
      regex: /unclear\s+(?:if|whether|what)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Unclear requirement'
    },
    {
      regex: /tbd|to\s+be\s+determined/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Unresolved item'
    },
    {
      regex: /todo|fixme|xxx/gi,
      severity: SEVERITY.LOW,
      note: 'TODO marker'
    },
  ],
} as const;

// ============================================================
// CHECKPOINT PATTERNS
// Detect milestones, deliverables, and timeline markers
// ============================================================

export const CHECKPOINT_PATTERNS = {
  MILESTONE: [
    {
      regex: /^##\s*Step\s+(\d+):\s*(.+)/gm,
      severity: SEVERITY.INFO,
      note: 'Explicit step header'
    },
    {
      regex: /^###\s*(.+?)\s*(?:\((\d+)h?\))?\s*$/gm,
      severity: SEVERITY.INFO,
      note: 'Timed substep'
    },
    {
      regex: /^\s*-\s*\*\*([^*]+)\*\*:\s*(.+)/gm,
      severity: SEVERITY.INFO,
      note: 'Named item with description'
    },
    {
      regex: /^####?\s*(?:checkpoint|cp|milestone):\s*(.+)/gim,
      severity: SEVERITY.INFO,
      note: 'Checkpoint marker'
    },
  ],
  
  DELIVERABLE: [
    {
      regex: /^\s*-\s*\[\s*\]\s*(.+)/gm,
      severity: SEVERITY.INFO,
      note: 'Unchecked deliverable'
    },
    {
      regex: /^\s*-\s*\[x\]\s*(.+)/gim,
      severity: SEVERITY.INFO,
      note: 'Completed deliverable'
    },
    {
      regex: /^\s*\*\s*\[\s*\]\s*(.+)/gm,
      severity: SEVERITY.INFO,
      note: 'Alternate unchecked'
    },
  ],
  
  TIMELINE: [
    {
      regex: /(\d+)\s*(?:hour|hr|h)\s*(?:work|effort)/gi,
      severity: SEVERITY.INFO,
      note: 'Hour estimate'
    },
    {
      regex: /(\d+)\s*(?:day|dy|d)\s*(?:work|effort)/gi,
      severity: SEVERITY.INFO,
      note: 'Day estimate'
    },
    {
      regex: /week\s+(\d+)/gi,
      severity: SEVERITY.INFO,
      note: 'Week reference'
    },
    {
      regex: /phase\s*(\d+)/gi,
      severity: SEVERITY.INFO,
      note: 'Phase marker'
    },
  ],
} as const;

// ============================================================
// CONSTRAINT PATTERNS
// Extract time, scope, and resource constraints
// ============================================================

export const CONSTRAINT_PATTERNS = {
  TIME: [
    {
      regex: /deadline:\s*(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Explicit deadline'
    },
    {
      regex: /due\s+(?:by|in|on)\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Due date statement'
    },
    {
      regex: /complete\s+(?:by|within|in)\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Completion timeframe'
    },
    {
      regex: /within\s+(\d+)\s*(hour|day|week|month)s?/gi,
      severity: SEVERITY.HIGH,
      note: 'Within timeframe'
    },
    {
      regex: /(\d+)\s*(?:hour|day|week|month)s?\s*(?:time|timeframe|limit)/gi,
      severity: SEVERITY.HIGH,
      note: 'Time limit'
    },
  ],
  
  SCOPE: [
    {
      regex: /scope:\s*(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Explicit scope'
    },
    {
      regex: /in\s+scope:\s*(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'In-scope items'
    },
    {
      regex: /out\s+of\s+scope:\s*(.+?)(?:\.|$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Out-of-scope items'
    },
    {
      regex: /exclude[sd]?\s+(.+?)(?:\.|$)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Excluded items'
    },
  ],
  
  RESOURCE: [
    {
      regex: /budget:\s*(\d+)\s*(?:dollars|usd|\$)/gi,
      severity: SEVERITY.HIGH,
      note: 'Budget constraint'
    },
    {
      regex: /resources?:\s*(.+?)(?:\.|$)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Resource constraint'
    },
    {
      regex: /team\s+size:\s*(\d+)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Team size constraint'
    },
    {
      regex: /max\s+(\d+)\s*(?:users?|requests?|items?)/gi,
      severity: SEVERITY.MEDIUM,
      note: 'Scale constraint'
    },
  ],
} as const;

// ============================================================
// SCANNER FUNCTION
// Core scanning engine with safety limits
// ============================================================

export interface Finding {
  pattern: string;
  category: string;
  match: string;
  line: number;
  column: number;
  severity: Severity;
  note?: string;
  evidence: string;
}

export interface ScanOptions {
  maxMatches?: number;
  maxLineLength?: number;
}

/**
 * Scan content with a pattern category, ensuring global flag
 * and safety count to prevent infinite loops.
 */
export function scanWithPatterns(
  content: string,
  patterns: readonly { regex: RegExp; severity: string; note?: string }[],
  category: string,
  options: ScanOptions = {}
): Finding[] {
  const { maxMatches = 100, maxLineLength = 2000 } = options;
  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (const pattern of patterns) {
    // Ensure global flag for exec() to advance
    let flags = pattern.regex.flags;
    if (!flags.includes('g')) {
      flags = flags + 'g';
    }
    const regex = new RegExp(pattern.regex.source, flags);

    let safetyCount = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
      safetyCount++;

      // Calculate line and column
      const matchPos = match.index;
      let lineNum = 1;
      let lineStart = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const lineEnd = lineStart + lines[i].length + 1; // +1 for newline
        if (matchPos < lineEnd) {
          lineNum = i + 1;
          break;
        }
        lineStart = lineEnd;
      }
      
      const col = matchPos - lineStart + 1;

      // Truncate evidence if too long
      let evidence = match[0];
      if (evidence.length > maxLineLength) {
        evidence = evidence.substring(0, maxLineLength) + '...[truncated]';
      }

      findings.push({
        pattern: pattern.regex.source,
        category,
        match: match[0],
        line: lineNum,
        column: col,
        severity: pattern.severity as Severity,
        note: pattern.note,
        evidence,
      });

      // Prevent infinite loop if match is empty
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }
  }

  return findings;
}

// ============================================================
// CONVENIENCE SCANNERS
// ============================================================

export function scanRequirements(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, REQUIREMENT_PATTERNS.FEATURE, 'REQUIREMENT', options);
}

export function scanConstraints(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, REQUIREMENT_PATTERNS.CONSTRAINT, 'CONSTRAINT', options);
}

export function scanDeliverables(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, REQUIREMENT_PATTERNS.DELIVERABLE, 'DELIVERABLE', options);
}

export function scanFileDependencies(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, DEPENDENCY_PATTERNS.FILE_DEP, 'FILE_DEP', options);
}

export function scanAPIDependencies(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, DEPENDENCY_PATTERNS.API_DEP, 'API_DEP', options);
}

export function scanServiceDependencies(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, DEPENDENCY_PATTERNS.SERVICE_DEP, 'SERVICE_DEP', options);
}

export function scanHumanDependencies(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, DEPENDENCY_PATTERNS.HUMAN_DEP, 'HUMAN_DEP', options);
}

export function scanRisks(content: string, options?: ScanOptions): Finding[] {
  return [
    ...scanWithPatterns(content, RISK_PATTERNS.FAILURE_MODE, 'FAILURE_MODE', options),
    ...scanWithPatterns(content, RISK_PATTERNS.BLOCKER, 'BLOCKER', options),
    ...scanWithPatterns(content, RISK_PATTERNS.UNCERTAINTY, 'UNCERTAINTY', options),
  ];
}

export function scanCheckpoints(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, CHECKPOINT_PATTERNS.MILESTONE, 'MILESTONE', options);
}

export function scanTimeConstraints(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, CONSTRAINT_PATTERNS.TIME, 'TIME', options);
}

export function scanScopeConstraints(content: string, options?: ScanOptions): Finding[] {
  return scanWithPatterns(content, CONSTRAINT_PATTERNS.SCOPE, 'SCOPE', options);
}

/**
 * Full scan - all pattern categories
 */
export function fullScan(content: string, options?: ScanOptions): Finding[] {
  return [
    ...scanRequirements(content, options),
    ...scanConstraints(content, options),
    ...scanDeliverables(content, options),
    ...scanFileDependencies(content, options),
    ...scanAPIDependencies(content, options),
    ...scanServiceDependencies(content, options),
    ...scanHumanDependencies(content, options),
    ...scanRisks(content, options),
    ...scanCheckpoints(content, options),
    ...scanTimeConstraints(content, options),
    ...scanScopeConstraints(content, options),
  ];
}
