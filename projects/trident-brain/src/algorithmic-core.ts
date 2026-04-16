/**
 * TRIDENT BRAIN - ALGORITHMIC CORE
 * 
 * Algorithmic-First Architecture:
 * - Model is ONLY used to READ code
 * - ALL intelligence is ALGORITHMIC (regex, state machines, classifiers)
 * - No behavioral prompts that can derail
 * - Rigid state machine for layer transitions
 * 
 * Core Principle: If a human can write a rule for it, write the rule.
 */

import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

// ============================================================================
// ALGORITHMIC CLASSIFIERS (Model-free pattern detection)
// ============================================================================

export const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO'
} as const;

export type Severity = typeof SEVERITY[keyof typeof SEVERITY];

export interface Finding {
  id?: string;
  severity: Severity;
  layer: number;
  detector: string;
  category: string;
  title: string;
  file: string;
  line?: number;
  evidence: string;
  remediation: string;
  evidenceType: 'STATIC' | 'EXECUTION' | 'CONTAINER';
  commandExecuted?: string;
  commandOutput?: string;
}

// ============================================================================
// PATTERN LIBRARY - Algorithmic Classifiers
// All intelligence is in REGEX + RULES, not prompts
// ============================================================================

export const PATTERNS = {
  // SIMULATED EXECUTION - CRITICAL
  SIMULATED_EXECUTION: [
    { regex: /setTimeout\s*\(\s*\(\s*\)\s*=>\s*resolve\s*\(\s*\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{?\s*resolve\s*\(\s*true\s*\)/i, severity: SEVERITY.CRITICAL },
    { regex: /return\s+Promise\.resolve\s*\(\s*\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /return\s+await\s+Promise\.resolve\s*\(\s*\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /async\s+function.*\{\s*return\s+\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /function\s+\w+\s*\([^)]*\)\s*\{\s*return\s+\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /setTimeout.*100\s*\)/i, severity: SEVERITY.CRITICAL, note: '100ms theatrical delay' },
    { regex: /delay.*100.*ms/i, severity: SEVERITY.CRITICAL },
    { regex: /sleep.*100/i, severity: SEVERITY.CRITICAL },
    { regex: /return\s+\{[^}]*success\s*:\s*true[^}]*\}.*100/ms, severity: SEVERITY.CRITICAL },
  ],
  
  // THEATRICAL CODE - HIGH
  THEATRICAL_CODE: [
    { regex: /\/\/\s*TODO.*full\s*implementation/i, severity: SEVERITY.HIGH },
    { regex: /\/\/\s*TODO.*real/i, severity: SEVERITY.HIGH },
    { regex: /\/\/\s*in\s*v\d+.*we\s+just\s+return/i, severity: SEVERITY.HIGH },
    { regex: /\/\/\s*Full\s+implementation\s+would/i, severity: SEVERITY.HIGH },
    { regex: /\/\/\s*mock\s+data/i, severity: SEVERITY.HIGH },
    { regex: /\/\/\s*fake\s+/i, severity: SEVERITY.HIGH },
    { regex: /\/\/\s*simulate/i, severity: SEVERITY.HIGH },
    { regex: /\/\*[\s\S]*?fake[\s\S]*?\*\//i, severity: SEVERITY.HIGH },
    { regex: /\/\/\s*theatrical/i, severity: SEVERITY.HIGH },
  ],
  
  // STUB FUNCTIONS - HIGH
  STUB_CODE: [
    { regex: /function\s+\w+\s*\([^)]*\)\s*\{\s*return\s+null\s*;?\s*\}/i, severity: SEVERITY.HIGH },
    { regex: /function\s+\w+\s*\([^)]*\)\s*\{\s*return\s+undefined\s*;?\s*\}/i, severity: SEVERITY.HIGH },
    { regex: /:\s*\w+\s*=>\s*null/, severity: SEVERITY.HIGH },
    { regex: /:\s*\w+\s*=>\s*undefined/, severity: SEVERITY.HIGH },
    { regex: /async\s+function\s+\w+\([^)]*\)\s*\{\s*\}/i, severity: SEVERITY.HIGH },
  ],
  
  // SQL INJECTION - CRITICAL
  SQL_INJECTION: [
    { regex: /`[^`]*\$\{[^}]+\}[^`]*`(?:query|select|insert|update|delete|where)/i, severity: SEVERITY.CRITICAL },
    { regex: /string\.format.*(?:query|select|insert|update|delete|where)/i, severity: SEVERITY.CRITICAL },
    { regex: /"\s*\+\s*\w+\s*\+\s*"\s*(?:query|select|insert|update|delete|where)/i, severity: SEVERITY.CRITICAL },
  ],
  
  // XSS - HIGH
  XSS: [
    { regex: /innerHTML\s*=/, severity: SEVERITY.HIGH },
    { regex: /dangerouslySetInnerHTML/, severity: SEVERITY.HIGH },
    { regex: /document\.write\s*\(/, severity: SEVERITY.HIGH },
    { regex: /\.html\s*\(/, severity: SEVERITY.MEDIUM },
  ],
  
  // SECRET EXPOSURE - CRITICAL
  SECRET_EXPOSURE: [
    { regex: /api[_-]?key\s*=\s*["'][a-zA-Z0-9]{20,}/i, severity: SEVERITY.CRITICAL },
    { regex: /secret\s*=\s*["'][a-zA-Z0-9]{20,}/i, severity: SEVERITY.CRITICAL },
    { regex: /password\s*=\s*["'][a-zA-Z0-9]{20,}/i, severity: SEVERITY.CRITICAL },
    { regex: /token\s*=\s*["'][a-zA-Z0-9]{20,}/i, severity: SEVERITY.CRITICAL },
    { regex: /sk-[a-zA-Z0-9]{32,}/, severity: SEVERITY.CRITICAL },
    { regex: /ghp_[a-zA-Z0-9]{36,}/, severity: SEVERITY.CRITICAL },
    { regex: /["']ghu_[a-zA-Z0-9]{36,}["']/, severity: SEVERITY.CRITICAL },
  ],
  
  // AUTH BYPASS - CRITICAL
  AUTH_BYPASS: [
    { regex: /if\s*\(\s*true\s*\)\s*\{\s*return\s+true/i, severity: SEVERITY.CRITICAL },
    { regex: /always\s*=\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /bypass\s*=\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /skipAuth\s*=\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /auth\s*=\s*true\s*;\s*return/i, severity: SEVERITY.CRITICAL },
  ],
  
  // EMPTY CATCH - MEDIUM
  EMPTY_CATCH: [
    { regex: /catch\s*\([^)]*\)\s*\{\s*\}/, severity: SEVERITY.MEDIUM },
    { regex: /catch\s*\([^)]*\)\s*\{\s*\/\*\s*\*\/\s*\}/, severity: SEVERITY.MEDIUM },
  ],
  
  // HOOK SPILLOVER - HIGH
  HOOK_SPILLOVER: [
    { regex: /is\w+Agent\s*\(\s*\)\s*===?\s*false/i, severity: SEVERITY.HIGH },
    { regex: /if\s*\(\s*!\s*agent\s*\)\s*\{/i, severity: SEVERITY.HIGH },
    { regex: /agent\s*===\s*undefined/i, severity: SEVERITY.HIGH },
    { regex: /_currentPhase/g, severity: SEVERITY.HIGH },
  ],
  
  // GLOBAL STATE - MEDIUM
  GLOBAL_STATE: [
    { regex: /^global\.\w+/m, severity: SEVERITY.MEDIUM },
    { regex: /^globalThis\.\w+/m, severity: SEVERITY.MEDIUM },
    { regex: /^(?:let|const|var)\s+_\w+\s*=/m, severity: SEVERITY.LOW },
  ],
  
  // COMPLEXITY HOTSPOT - MEDIUM
  COMPLEXITY: [
    { regex: /if\s*\(/g, threshold: 10, severity: SEVERITY.MEDIUM },
    { regex: /for\s*\(/g, threshold: 5, severity: SEVERITY.MEDIUM },
    { regex: /while\s*\(/g, threshold: 3, severity: SEVERITY.MEDIUM },
  ],
  
  // RESOURCE LEAK - MEDIUM
  RESOURCE_LEAK: [
    { regex: /addEventListener\s*\(/g, severity: SEVERITY.MEDIUM },
    { regex: /setInterval\s*\(/g, severity: SEVERITY.MEDIUM },
  ],
} as const;

// ============================================================================
// ALGORITHMIC SCANNER - Pure deterministic code analysis
// ============================================================================

export class AlgorithmicScanner {
  private findingId = 1;
  private findings: Finding[] = [];
  
  reset(): void {
    this.findings = [];
    this.findingId = 1;
  }
  
  scanFile(filePath: string, content: string): Finding[] {
    const lines = content.split('\n');
    const fileFindings: Finding[] = [];
    
    // SCAN: Simulated Execution (Layer 0)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.SIMULATED_EXECUTION, 0, 'SIMULATED EXECUTION'));
    
    // SCAN: Theatrical Code (Layer 0)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.THEATRICAL_CODE, 0, 'VERIFICATION THEATER'));
    
    // SCAN: Stub Code (Layer 2)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.STUB_CODE, 2, 'STUB CODE'));
    
    // SCAN: SQL Injection (Layer 3)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.SQL_INJECTION, 3, 'SQL INJECTION'));
    
    // SCAN: XSS (Layer 3)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.XSS, 3, 'XSS'));
    
    // SCAN: Secret Exposure (Layer 3)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.SECRET_EXPOSURE, 3, 'SECRET EXPOSURE'));
    
    // SCAN: Auth Bypass (Layer 3)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.AUTH_BYPASS, 3, 'AUTH BYPASS'));
    
    // SCAN: Empty Catch (Layer 5)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.EMPTY_CATCH, 5, 'SILENT ERROR SWALLOWING'));
    
    // SCAN: Hook Spillover (Layer 4)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.HOOK_SPILLOVER, 4, 'HOOK SPILLOVER'));
    
    // SCAN: Global State (Layer 4)
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.GLOBAL_STATE, 4, 'ISOLATION VIOLATION'));
    
    // SCAN: Complexity Hotspots (Layer 5)
    fileFindings.push(...this.scanComplexity(filePath, lines, 5));
    
    // SCAN: Resource Leaks (Layer 5)
    fileFindings.push(...this.scanResourceLeaks(filePath, content, 5));
    
    // SCAN: Bundle Size Anomaly (Layer 1)
    if (content.length < 50 && (filePath.endsWith('.ts') || filePath.endsWith('.js'))) {
      fileFindings.push(this.createFinding(SEVERITY.MEDIUM, 1, 'BundleSizeAnomaly', 'ARCHITECTURAL DECAY', 
        'Suspiciously small file', filePath, `Size: ${content.length} bytes`, 
        'Verify this file contains real implementation', 'STATIC'));
    }
    
    return fileFindings;
  }
  
  private scanPatterns(
    filePath: string, 
    content: string, 
    lines: string[],
    patterns: readonly { regex: RegExp; severity: Severity; note?: string }[],
    layer: number,
    category: string
  ): Finding[] {
    const findings: Finding[] = [];
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        findings.push(this.createFinding(
          pattern.severity,
          layer,
          this.getDetectorName(category),
          category,
          this.generateTitle(category, pattern.note),
          filePath,
          match[0].substring(0, 100),
          this.generateRemediation(category),
          'STATIC',
          undefined,
          undefined,
          lineNum
        ));
      }
    }
    
    return findings;
  }
  
  private scanComplexity(filePath: string, lines: string[], layer: number): Finding[] {
    const findings: Finding[] = [];
    let ifCount = 0;
    let forCount = 0;
    let whileCount = 0;
    
    for (const line of lines) {
      if (/\bif\s*\(/.test(line)) ifCount++;
      if (/\bfor\s*\(/.test(line)) forCount++;
      if (/\bwhile\s*\(/.test(line)) whileCount++;
    }
    
    const totalConditionals = ifCount + forCount + whileCount;
    const lineCount = lines.length;
    
    if (totalConditionals > 10 && lineCount > 100) {
      findings.push(this.createFinding(SEVERITY.MEDIUM, layer, 'ComplexityHotspot', 'COMPLEXITY',
        `High cyclomatic complexity (${totalConditionals} conditionals)`,
        filePath,
        `Conditionals: ${ifCount} if, ${forCount} for, ${whileCount} while in ${lineCount} lines`,
        'Simplify by extracting functions or using early returns',
        'STATIC'
      ));
    }
    
    return findings;
  }
  
  private scanResourceLeaks(filePath: string, content: string, layer: number): Finding[] {
    const findings: Finding[] = [];
    
    const addListeners = (content.match(/addEventListener\s*\(/g) || []).length;
    const removeListeners = (content.match(/removeEventListener\s*\(/g) || []).length;
    
    if (addListeners > removeListeners) {
      findings.push(this.createFinding(SEVERITY.MEDIUM, layer, 'MemoryLeak', 'RESOURCE LEAK',
        `Potential event listener leak: ${addListeners} add vs ${removeListeners} remove`,
        filePath,
        `${addListeners} addEventListener, ${removeListeners} removeEventListener`,
        'Ensure all addEventListener has corresponding removeEventListener',
        'STATIC'
      ));
    }
    
    return findings;
  }
  
  private createFinding(
    severity: Severity,
    layer: number,
    detector: string,
    category: string,
    title: string,
    file: string,
    evidence: string,
    remediation: string,
    evidenceType: 'STATIC' | 'EXECUTION' | 'CONTAINER',
    commandExecuted?: string,
    commandOutput?: string,
    line?: number
  ): Finding {
    return {
      id: `AUDIT-${this.findingId++}`,
      severity,
      layer,
      detector,
      category,
      title,
      file,
      evidence,
      remediation,
      evidenceType,
      commandExecuted,
      commandOutput,
      line
    };
  }
  
  private getDetectorName(category: string): string {
    const map: Record<string, string> = {
      'SIMULATED EXECUTION': 'SimulatedExecution',
      'VERIFICATION THEATER': 'PlaceholderComment',
      'STUB CODE': 'StubFunction',
      'SQL INJECTION': 'SQLInjection',
      'XSS': 'XSSDetector',
      'SECRET EXPOSURE': 'SecretExposure',
      'AUTH BYPASS': 'AuthBypass',
      'SILENT ERROR SWALLOWING': 'EmptyCatch',
      'HOOK SPILLOVER': 'HookSpillover',
      'ISOLATION VIOLATION': 'IsolationViolation',
      'COMPLEXITY': 'ComplexityHotspot',
      'RESOURCE LEAK': 'MemoryLeak',
    };
    return map[category] || 'Unknown';
  }
  
  private generateTitle(category: string, note?: string): string {
    const titles: Record<string, string> = {
      'SIMULATED EXECUTION': 'Potential theatrical/simulated execution detected',
      'VERIFICATION THEATER': 'Placeholder or TODO comment - may indicate incomplete code',
      'STUB CODE': 'Stub function detected - returns null/undefined',
      'SQL INJECTION': 'Potential SQL injection vulnerability',
      'XSS': 'Potential XSS vulnerability - unsafe DOM manipulation',
      'SECRET EXPOSURE': 'Hardcoded secret/API key detected',
      'AUTH BYPASS': 'Potential authentication bypass',
      'SILENT ERROR SWALLOWING': 'Empty catch block - error is silently ignored',
      'HOOK SPILLOVER': 'Potential hook spillover pattern',
      'ISOLATION VIOLATION': 'Global state access detected',
      'COMPLEXITY': 'High cyclomatic complexity detected',
      'RESOURCE LEAK': 'Potential resource leak detected',
    };
    return titles[category] || category;
  }
  
  private generateRemediation(category: string): string {
    const remediations: Record<string, string> = {
      'SIMULATED EXECUTION': 'Replace with actual implementation that performs real work. No fake delays or simulated success.',
      'VERIFICATION THEATER': 'Replace TODO/placeholder comments with actual implementation or remove.',
      'STUB CODE': 'Replace stub with actual implementation that performs real work.',
      'SQL INJECTION': 'Use parameterized queries or an ORM. Never concatenate user input into SQL strings.',
      'XSS': 'Sanitize user input. Use safe DOM methods or a sanitization library.',
      'SECRET EXPOSURE': 'Move secrets to environment variables. Use a secrets manager in production.',
      'AUTH BYPASS': 'Remove hardcoded auth bypass. Implement proper authentication checks.',
      'SILENT ERROR SWALLOWING': 'Add error logging or handling to catch block.',
      'HOOK SPILLOVER': 'Ensure hooks only fire for intended agents.',
      'ISOLATION VIOLATION': 'Avoid global state. Use dependency injection.',
      'COMPLEXITY': 'Simplify by extracting functions, using early returns, or breaking into modules.',
      'RESOURCE LEAK': 'Ensure all event listeners and intervals have corresponding cleanup.',
    };
    return remediations[category] || 'Review and fix.';
  }
  
  getFindings(): Finding[] {
    return [...this.findings];
  }
  
  addFinding(finding: Finding): void {
    if (!finding.id) {
      finding.id = `AUDIT-${this.findingId++}`;
    }
    this.findings.push(finding);
  }
  
  addFindings(findings: Finding[]): void {
    this.findings.push(...findings);
  }
}

// ============================================================================
// AUDIT ENGINE - Pure algorithmic state machine
// ============================================================================

export interface AuditConfig {
  targetPath: string;
  depth: number;
  containerImage?: string;
  buildCommand?: string;
  testCommand?: string;
}

export interface AuditState {
  config: AuditConfig;
  currentLayer: number;
  completedLayers: number[];
  startedAt: Date;
  status: 'IDLE' | 'SCANNING' | 'EXECUTING' | 'COMPLETE';
}

export class AuditEngine {
  private state: AuditState;
  private scanner: AlgorithmicScanner;
  
  constructor() {
    this.scanner = new AlgorithmicScanner();
    this.state = this.createInitialState();
  }
  
  private createInitialState(): AuditState {
    return {
      config: {
        targetPath: '',
        depth: 7,
        containerImage: 'opencode-python3:latest',
        buildCommand: 'npm run build 2>&1',
        testCommand: 'npm test 2>&1'
      },
      currentLayer: 0,
      completedLayers: [],
      startedAt: new Date(),
      status: 'IDLE'
    };
  }
  
  getState(): AuditState {
    return { ...this.state };
  }
  
  getScanner(): AlgorithmicScanner {
    return this.scanner;
  }
  
  startAudit(config: AuditConfig): void {
    this.state.config = { ...this.state.config, ...config };
    this.state.currentLayer = 0;
    this.state.completedLayers = [];
    this.state.startedAt = new Date();
    this.state.status = 'SCANNING';
    this.scanner.reset();
    console.log(`[Trident Audit] Starting algorithmic audit of ${config.targetPath}`);
  }
  
  async scanDirectory(targetPath: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    
    try {
      const { stdout } = await execAsync(
        `find "${targetPath}" -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.json" \\) 2>/dev/null | head -200`,
        { timeout: 30000 }
      );
      
      const filePaths = stdout.split('\n').filter(p => p.trim());
      
      for (const filePath of filePaths.slice(0, 100)) {
        try {
          const content = await readFile(filePath, 'utf-8');
          files.set(filePath, content);
        } catch (e) {
          // Skip unreadable files
        }
      }
    } catch (e) {
      console.log('[Trident Audit] Directory scan error:', e);
    }
    
    return files;
  }
  
  async runBuildTest(targetPath: string): Promise<{ success: boolean; output: string }> {
    const command = this.state.config.buildCommand || 'npm run build 2>&1';
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: targetPath,
        timeout: 120000
      });
      
      return { success: true, output: stdout + '\n' + stderr };
    } catch (e: any) {
      return { success: false, output: e.message || String(e) };
    }
  }
  
  async runTestSuite(targetPath: string): Promise<{ success: boolean; output: string; passing?: number; failing?: number }> {
    const command = this.state.config.testCommand || 'npm test 2>&1';
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: targetPath,
        timeout: 180000
      });
      
      const output = stdout + '\n' + stderr;
      
      const passMatch = output.match(/(\d+)\s+passing/);
      const failMatch = output.match(/(\d+)\s+fail/);
      
      return {
        success: !output.includes('error') && !output.includes('FAIL'),
        output,
        passing: passMatch ? parseInt(passMatch[1]) : 0,
        failing: failMatch ? parseInt(failMatch[1]) : 0
      };
    } catch (e: any) {
      return { success: false, output: e.message || String(e) };
    }
  }
  
  completeLayer(layer: number): void {
    if (!this.state.completedLayers.includes(layer)) {
      this.state.completedLayers.push(layer);
    }
    this.state.currentLayer = layer + 1;
    console.log(`[Trident Audit] Layer ${layer} complete. Findings: ${this.scanner.getFindings().length}`);
  }
  
  complete(): void {
    this.state.status = 'COMPLETE';
  }
}

// ============================================================================
// REPORT GENERATOR - Template-based (algorithmic output)
// ============================================================================

export class ReportGenerator {
  generate(findingId: (layer: number) => string, getFindingsByLayer: (layer: number) => Finding[], state: AuditState): string {
    const allFindings = this.collectAllFindings(state);
    
    const critical = allFindings.filter(f => f.severity === 'CRITICAL').length;
    const high = allFindings.filter(f => f.severity === 'HIGH').length;
    const medium = allFindings.filter(f => f.severity === 'MEDIUM').length;
    const low = allFindings.filter(f => f.severity === 'LOW').length;
    const info = allFindings.filter(f => f.severity === 'INFO').length;
    
    const passStatus = critical === 0 && high === 0 ? '✅ PASSED' : '❌ FAILED';
    const duration = Date.now() - state.startedAt.getTime();
    
    let report = `# TRIDENT CODE REVIEW — AUDIT REPORT

**Target:** ${state.config.targetPath}
**Date:** ${state.startedAt.toISOString()}
**Duration:** ${Math.round(duration / 1000)}s
**Status:** ${passStatus}

---

## EXECUTIVE SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | ${critical} | ${critical > 0 ? '🚨' : '✅'} |
| HIGH | ${high} | ${high > 0 ? '⚠️' : '✅'} |
| MEDIUM | ${medium} | ${medium > 0 ? '⚡' : '✅'} |
| LOW | ${low} | ${low > 0 ? '📝' : '✅'} |
| INFO | ${info} | ℹ️ |

---

## FINDINGS BY LAYER

`;
    
    for (let layer = 0; layer <= 6; layer++) {
      const layerFindings = getFindingsByLayer(layer);
      if (layerFindings.length === 0) continue;
      
      const layerNames: Record<number, string> = {
        0: 'Behavioral Detection',
        1: 'Structure Analysis',
        2: 'Execution Verification',
        3: 'Security Analysis',
        4: 'Architecture Analysis',
        5: 'Quality Analysis',
        6: 'Integration Verification'
      };
      
      report += `### Layer ${layer}: ${layerNames[layer] || 'Unknown'}\n\n`;
      
      for (const f of layerFindings) {
        const icon = { CRITICAL: '🚨', HIGH: '⚠️', MEDIUM: '⚡', LOW: '📝', INFO: 'ℹ️' }[f.severity];
        
        report += `#### ${icon} [${f.severity}] ${f.title}\n`;
        report += `**File:** ${f.file}${f.line ? `:${f.line}` : ''}\n`;
        report += `**Category:** ${f.category}\n`;
        report += `**Evidence:** \`${f.evidence}\`\n`;
        report += `**Fix:** ${f.remediation}\n\n`;
      }
    }
    
    report += `

---

## SYSTEM PROMPT FOR FIXING

Copy this to fix the issues:

\`\`\`
TARGET: ${state.config.targetPath}
CRITICAL: ${critical}
HIGH: ${high}

RULES:
1. Fix CRITICAL immediately
2. Fix HIGH before deployment
3. Run tests after each fix

ISSUES:
${allFindings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').map((f, i) => 
`${i + 1}. [${f.severity}] ${f.file}${f.line ? `:${f.line}` : ''}
   ${f.title}
   Fix: ${f.remediation}`
).join('\n')}
\`\`\`

---

*Generated by Trident Brain — Algorithmic Core*
`;
    
    return report;
  }
  
  private collectAllFindings(state: AuditState): Finding[] {
    // This is populated by the engine
    return [];
  }
}

// ============================================================================
// COMMAND PARSER - Algorithmic command detection
// ============================================================================

export interface ParsedCommand {
  command: 'audit' | 'status' | 'report' | 'fix' | 'reset' | 'unknown';
  target?: string;
  depth?: number;
  severity?: string;
  format?: string;
}

export class CommandParser {
  private static readonly AUDIT_PATTERNS = [
    /^\/audit$/i,
    /^\/audit\s+this$/i,
    /^\/audit\s+(\S+)/i,
    /^\/audit\s+(\S+)\s+--depth=(\d+)/i,
    /^\/audit\s+--depth=(\d+)/i,
  ];
  
  private static readonly TRIDENT_REVIEW_PATTERNS = [
    /^\/trident\s+review$/i,
    /^\/trident\s+review\s+(\S+)/i,
    /^\/trident\s+review\s+(\S+)\s+--depth=(\d+)/i,
  ];
  
  parse(message: string): ParsedCommand {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();
    
    // Check /audit commands
    for (const pattern of CommandParser.AUDIT_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        const result: ParsedCommand = { command: 'audit' };
        
        if (match[1] && !match[1].startsWith('--')) {
          result.target = match[1];
        }
        if (match[2]) {
          result.depth = parseInt(match[2]);
        } else if (lower.includes('--depth=')) {
          const depthMatch = lower.match(/--depth=(\d+)/);
          if (depthMatch) result.depth = parseInt(depthMatch[1]);
        }
        
        return result;
      }
    }
    
    // Check /trident review commands
    for (const pattern of CommandParser.TRIDENT_REVIEW_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        const result: ParsedCommand = { command: 'audit' };
        if (match[1]) result.target = match[1];
        if (match[2]) result.depth = parseInt(match[2]);
        return result;
      }
    }
    
    // Check other commands
    if (lower === '/trident' || lower === '/trident status') {
      return { command: 'status' };
    }
    
    if (lower.startsWith('/trident report')) {
      const result: ParsedCommand = { command: 'report' };
      if (lower.includes('--format=json')) result.format = 'json';
      return result;
    }
    
    if (lower.startsWith('/trident fix')) {
      const result: ParsedCommand = { command: 'fix' };
      const sevMatch = lower.match(/--severity=(\w+)/);
      if (sevMatch) result.severity = sevMatch[1];
      return result;
    }
    
    if (lower === '/trident reset') {
      return { command: 'reset' };
    }
    
    return { command: 'unknown' };
  }
}

// ============================================================================
// EXPORT DEFAULT ENGINE
// ============================================================================

export const auditEngine = new AuditEngine();
export const reportGenerator = new ReportGenerator();
export const commandParser = new CommandParser();
