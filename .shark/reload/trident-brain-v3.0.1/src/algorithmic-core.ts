/**
 * TRIDENT BRAIN - ALGORITHMIC CORE v2.0
 * 
 * Algorithmic-First Architecture:
 * - Model is ONLY used to READ code
 * - ALL intelligence is ALGORITHMIC (regex, state machines, classifiers)
 * - No behavioral prompts that can derail
 * - Rigid state machine for layer transitions
 * 
 * CORE PRINCIPLE: If a human can write a rule for it, write the rule.
 * 
 * NEW v2.0 CAPABILITIES:
 * 1. Proof-Based Verification - filesystem verification of claims
 * 2. Real-Time Firewall - throw+halt on banned patterns
 * 3. Hook Isolation Analyzer - detect cross-plugin contamination
 * 4. Resource Footprint Estimator - memory/token bloat detection
 * 5. Cross-Reference Verifier - validate imports/cluster IDs/tools
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, readdir, stat, access } from 'fs/promises';
import { join, basename, dirname } from 'path';
import { constants } from 'fs';

const execAsync = promisify(exec);

// ============================================================================
// CONSTANTS
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
  evidenceType: 'STATIC' | 'EXECUTION' | 'CONTAINER' | 'PROOF';
  commandExecuted?: string;
  commandOutput?: string;
  proofVerified?: boolean;
}

// ============================================================================
// PATTERN LIBRARY - Algorithmic Classifiers
// ALL intelligence is in REGEX + RULES, not prompts
// THEATRICAL CODE PATTERNS ARE BANNED - CRITICAL SYSTEM FAILURE
// ============================================================================

export const PATTERNS = {
  // 🚫 BANNED PATTERNS - CRITICAL SYSTEM FAILURE
  SIMULATED_EXECUTION: [
    { regex: /setTimeout\s*\(\s*\(\s*\)\s*=>\s*resolve\s*\(\s*\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{?\s*resolve\s*\(\s*true\s*\)/i, severity: SEVERITY.CRITICAL },
    { regex: /return\s+Promise\.resolve\s*\(\s*\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /return\s+await\s+Promise\.resolve\s*\(\s*\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /async\s+function.*\{\s*return\s+\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /function\s+\w+\s*\([^)]*\)\s*\{\s*return\s+\{\s*success\s*:\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /setTimeout.*100\s*\)/i, severity: SEVERITY.CRITICAL },
    { regex: /delay.*100.*ms/i, severity: SEVERITY.CRITICAL },
    { regex: /sleep.*100/i, severity: SEVERITY.CRITICAL },
    { regex: /return\s+\{[^}]*success\s*:\s*true[^}]*\}.*100/ms, severity: SEVERITY.CRITICAL },
    { regex: /return\s+\{\s*\n*\s*success\s*:\s*true\s*\n*\}/i, severity: SEVERITY.CRITICAL },
    { regex: /setTimeout.*success.*true/i, severity: SEVERITY.CRITICAL },
  ],
  
  THEATRICAL_CODE: [
    { regex: /\/\/\s*TODO.*full\s*implementation/i, severity: SEVERITY.CRITICAL },
    { regex: /\/\/\s*TODO.*real/i, severity: SEVERITY.CRITICAL },
    { regex: /\/\/\s*in\s*v\d+.*we\s+just\s+return/i, severity: SEVERITY.CRITICAL },
    { regex: /\/\/\s*Full\s+implementation\s+would/i, severity: SEVERITY.CRITICAL },
    { regex: /\/\/\s*mock\s+data/i, severity: SEVERITY.CRITICAL },
    { regex: /\/\/\s*fake\s+/i, severity: SEVERITY.CRITICAL },
    { regex: /\/\/\s*simulate/i, severity: SEVERITY.CRITICAL },
    { regex: /\/\*[\s\S]*?fake[\s\S]*?\*\//i, severity: SEVERITY.CRITICAL },
    { regex: /\/\/\s*theatrical/i, severity: SEVERITY.CRITICAL },
    { regex: /\/\/\s*placeholder/i, severity: SEVERITY.HIGH },
    { regex: /\/\/\s*stub/i, severity: SEVERITY.HIGH },
  ],
  
  STUB_CODE: [
    { regex: /function\s+\w+\s*\([^)]*\)\s*\{\s*return\s+null\s*;?\s*\}/i, severity: SEVERITY.CRITICAL },
    { regex: /function\s+\w+\s*\([^)]*\)\s*\{\s*return\s+undefined\s*;?\s*\}/i, severity: SEVERITY.CRITICAL },
    { regex: /:\s*\w+\s*=>\s*null/, severity: SEVERITY.HIGH },
    { regex: /:\s*\w+\s*=>\s*undefined/, severity: SEVERITY.HIGH },
    { regex: /async\s+function\s+\w+\([^)]*\)\s*\{\s*\}/i, severity: SEVERITY.CRITICAL },
    { regex: /function\s+\w+\s*\([^)]*\)\s*\{\s*\}/i, severity: SEVERITY.HIGH },
    { regex: /throw\s+new\s+Error\s*\(\s*['"]TODO/i, severity: SEVERITY.HIGH },
  ],
  
  // Security - CRITICAL
  SQL_INJECTION: [
    { regex: /`[^`]*\$\{[^}]+\}[^`]*`(?:query|select|insert|update|delete|where)/i, severity: SEVERITY.CRITICAL },
    { regex: /string\.format.*(?:query|select|insert|update|delete|where)/i, severity: SEVERITY.CRITICAL },
    { regex: /"\s*\+\s*\w+\s*\+\s*"\s*(?:query|select|insert|update|delete|where)/i, severity: SEVERITY.CRITICAL },
    { regex: /"\s*\+.*\+\s*"\s*(?:select|from|where)/i, severity: SEVERITY.CRITICAL },
  ],
  
  SECRET_EXPOSURE: [
    { regex: /api[_-]?key\s*=\s*["'][a-zA-Z0-9]{20,}/i, severity: SEVERITY.CRITICAL },
    { regex: /secret\s*=\s*["'][a-zA-Z0-9]{20,}/i, severity: SEVERITY.CRITICAL },
    { regex: /password\s*=\s*["'][a-zA-Z0-9]{20,}/i, severity: SEVERITY.CRITICAL },
    { regex: /token\s*=\s*["'][a-zA-Z0-9]{20,}/i, severity: SEVERITY.CRITICAL },
    { regex: /sk-[a-zA-Z0-9]{32,}/, severity: SEVERITY.CRITICAL },
    { regex: /ghp_[a-zA-Z0-9]{36,}/, severity: SEVERITY.CRITICAL },
    { regex: /["']ghu_[a-zA-Z0-9]{36,}["']/, severity: SEVERITY.CRITICAL },
  ],
  
  AUTH_BYPASS: [
    { regex: /if\s*\(\s*true\s*\)\s*\{\s*return\s+true/i, severity: SEVERITY.CRITICAL },
    { regex: /always\s*=\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /bypass\s*=\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /skipAuth\s*=\s*true/i, severity: SEVERITY.CRITICAL },
    { regex: /auth\s*=\s*true\s*;\s*return/i, severity: SEVERITY.CRITICAL },
    { regex: /return\s+true\s*;?\s*$/m, severity: SEVERITY.HIGH },
  ],
  
  // XSS - HIGH
  XSS: [
    { regex: /innerHTML\s*=/, severity: SEVERITY.HIGH },
    { regex: /dangerouslySetInnerHTML/, severity: SEVERITY.HIGH },
    { regex: /document\.write\s*\(/, severity: SEVERITY.HIGH },
    { regex: /\.html\s*\(/, severity: SEVERITY.MEDIUM },
  ],
  
  // Quality - MEDIUM/HIGH
  EMPTY_CATCH: [
    { regex: /catch\s*\([^)]*\)\s*\{\s*\}/, severity: SEVERITY.HIGH },
    { regex: /catch\s*\([^)]*\)\s*\{\s*\/\*\s*\*\/\s*\}/, severity: SEVERITY.HIGH },
  ],
  
  HOOK_SPILLOVER: [
    { regex: /is\w+Agent\s*\(\s*\)\s*===?\s*false/i, severity: SEVERITY.HIGH },
    { regex: /if\s*\(\s*!\s*agent\s*\)\s*\{/i, severity: SEVERITY.HIGH },
    { regex: /agent\s*===\s*undefined/i, severity: SEVERITY.HIGH },
    { regex: /_currentPhase/g, severity: SEVERITY.HIGH },
    { regex: /if\s*\(\s*agent\s*!==?\s*['"]\w+['"]\s*\)/i, severity: SEVERITY.MEDIUM },
  ],
  
  GLOBAL_STATE: [
    { regex: /^global\.\w+/m, severity: SEVERITY.MEDIUM },
    { regex: /^globalThis\.\w+/m, severity: SEVERITY.MEDIUM },
    { regex: /^(?:let|const|var)\s+_\w+\s*=/m, severity: SEVERITY.LOW },
  ],
  
  COMPLEXITY: [
    { regex: /if\s*\(/g, threshold: 10, severity: SEVERITY.MEDIUM },
    { regex: /for\s*\(/g, threshold: 5, severity: SEVERITY.MEDIUM },
    { regex: /while\s*\(/g, threshold: 3, severity: SEVERITY.MEDIUM },
  ],
  
  RESOURCE_LEAK: [
    { regex: /addEventListener\s*\(/g, severity: SEVERITY.MEDIUM },
    { regex: /setInterval\s*\(/g, severity: SEVERITY.MEDIUM },
  ],
};

// ============================================================================
// PROOF-BASED VERIFICATION ENGINE v2.0
// ============================================================================

export interface ProofClaim {
  type: 'file_exists' | 'test_results' | 'build_artifact' | 'custom';
  claim: string;
  verified: boolean;
  proof?: string;
  error?: string;
}

export interface VerificationResult {
  passed: boolean;
  claims: ProofClaim[];
  theaterDetected: boolean;
  findings: Finding[];
}

export class ProofVerifier {
  async verifyClaim(claim: string, cwd: string): Promise<ProofClaim> {
    const normalizedClaim = claim.toLowerCase().trim();
    
    // File existence claims
    const fileMatch = normalizedClaim.match(/(?:file|dist|index\.js|build|artifact)\s+(?:exists|found)|([\/\.\~\w-]+\.\w+)/);
    if (fileMatch && (normalizedClaim.includes('exists') || normalizedClaim.includes('found') || normalizedClaim.includes('file'))) {
      return this.verifyFileExistence(claim, cwd);
    }
    
    // Test results claims
    if (normalizedClaim.includes('test') && (normalizedClaim.includes('pass') || normalizedClaim.includes('fail') || normalizedClaim.includes('37'))) {
      return this.verifyTestResults(claim, cwd);
    }
    
    // Build artifact claims
    if (normalizedClaim.includes('build') || normalizedClaim.includes('dist')) {
      return this.verifyBuildArtifact(claim, cwd);
    }
    
    // Default: custom claim - require evidence
    return {
      type: 'custom',
      claim,
      verified: false,
      error: 'Cannot verify claim automatically. Requires filesystem evidence.'
    };
  }
  
  private async verifyFileExistence(claim: string, cwd: string): Promise<ProofClaim> {
    // Extract file path from claim
    const pathMatch = claim.match(/[\/\.\~\w-]+\.\w+/);
    if (!pathMatch) {
      return { type: 'file_exists', claim, verified: false, error: 'No file path detected in claim' };
    }
    
    const filePath = pathMatch[0];
    const fullPath = filePath.startsWith('/') ? filePath : join(cwd, filePath);
    
    try {
      await access(fullPath, constants.R_OK);
      return { type: 'file_exists', claim, verified: true, proof: `File found at ${fullPath}` };
    } catch {
      return { type: 'file_exists', claim, verified: false, error: `File NOT found at ${fullPath}` };
    }
  }
  
  private async verifyTestResults(claim: string, cwd: string): Promise<ProofClaim> {
    // Look for test output files
    const possiblePaths = [
      join(cwd, 'TEST_RESULTS.md'),
      join(cwd, 'test-results.json'),
      join(cwd, 'reports', 'junit.xml'),
      join(cwd, 'coverage', 'coverage-summary.json'),
    ];
    
    for (const testPath of possiblePaths) {
      try {
        const content = await readFile(testPath, 'utf-8');
        // Verify claim against actual results
        const normalizedContent = content.toLowerCase();
        
        // Extract numbers from claim
        const numbersMatch = claim.match(/(\d+)\s*\/\s*(\d+)/);
        if (numbersMatch) {
          const claimedPass = parseInt(numbersMatch[1]);
          const claimedTotal = parseInt(numbersMatch[2]);
          
          // Look for actual numbers in file
          const actualMatch = normalizedContent.match(/(\d+)\s+(?:passing|passed)/);
          if (actualMatch) {
            const actualPass = parseInt(actualMatch[1]);
            if (actualPass !== claimedPass) {
              return {
                type: 'test_results',
                claim,
                verified: false,
                error: `THEATER DETECTED: Claimed ${claimedPass}/${claimedTotal} passed but file shows ${actualPass} passed`
              };
            }
          }
        }
        
        return { type: 'test_results', claim, verified: true, proof: `Found test results at ${testPath}` };
      } catch {
        // File doesn't exist, continue
      }
    }
    
    return {
      type: 'test_results',
      claim,
      verified: false,
      error: 'No test results file found. Cannot verify test claims. THIS IS THEATER.'
    };
  }
  
  private async verifyBuildArtifact(claim: string, cwd: string): Promise<ProofClaim> {
    const distPath = join(cwd, 'dist');
    const buildPath = join(cwd, 'build');
    
    try {
      const distStat = await stat(distPath);
      if (distStat.isDirectory()) {
        const files = await readdir(distPath);
        if (files.length === 0) {
          return { type: 'build_artifact', claim, verified: false, error: 'dist/ exists but is EMPTY - possible theater' };
        }
        return { type: 'build_artifact', claim, verified: true, proof: `dist/ exists with ${files.length} files` };
      }
    } catch {
      // dist doesn't exist
    }
    
    try {
      const buildStat = await stat(buildPath);
      if (buildStat.isDirectory()) {
        return { type: 'build_artifact', claim, verified: true, proof: `build/ exists` };
      }
    } catch {
      // build doesn't exist either
    }
    
    return { type: 'build_artifact', claim, verified: false, error: 'No build artifact directory found' };
  }
  
  async verifyMultiple(claims: string[], cwd: string): Promise<VerificationResult> {
    const results: ProofClaim[] = [];
    let theaterDetected = false;
    const findings: Finding[] = [];
    
    for (const claim of claims) {
      const result = await this.verifyClaim(claim, cwd);
      results.push(result);
      
      if (!result.verified) {
        theaterDetected = true;
        findings.push({
          severity: SEVERITY.CRITICAL,
          layer: 0,
          detector: 'ProofVerifier',
          category: 'THEATER DETECTED',
          title: 'Claim cannot be verified - THEATRICAL CODE SUSPECTED',
          file: cwd,
          evidence: `${result.claim}: ${result.error}`,
          remediation: 'Do NOT claim work was done without proof. Provide actual file evidence.',
          evidenceType: 'PROOF',
          proofVerified: false
        });
      }
    }
    
    return { passed: results.every(r => r.verified), claims: results, theaterDetected, findings };
  }
}

// ============================================================================
// REAL-TIME FIREWALL v2.0
// ============================================================================

export interface FirewallConfig {
  throwOnBanned: boolean;
  throwOnSecurity: boolean;
  throwOnHookSpillover: boolean;
}

export class RealTimeFirewall {
  private config: FirewallConfig = {
    throwOnBanned: true,
    throwOnSecurity: true,
    throwOnHookSpillover: true
  };
  
  setConfig(config: Partial<FirewallConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * REAL-TIME SCAN: Throws and HALTS on banned patterns
   * Use this in tool.execute.before hook to BLOCK theatrical code
   */
  scanRealtime(code: string, filePath: string): void {
    const lines = code.split('\n');
    
    for (const [categoryName, patterns] of Object.entries(PATTERNS)) {
      for (const pattern of patterns as readonly { regex: RegExp; severity: string; note?: string }[]) {
        const flags = pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g';
        const regex = new RegExp(pattern.regex.source, flags);
        let match;
        let safetyCount = 0;
        const maxMatches = 100;
        
        while ((match = regex.exec(code)) !== null && safetyCount < maxMatches) {
          safetyCount++;
          const lineNum = code.substring(0, match.index).split('\n').length;
          const line = lines[lineNum - 1] || '';
          
          // Determine if this should throw
          const isBanned = categoryName === 'SIMULATED_EXECUTION' || 
                           categoryName === 'THEATRICAL_CODE' ||
                           categoryName === 'STUB_CODE';
          const isSecurity = categoryName === 'SQL_INJECTION' || 
                             categoryName === 'SECRET_EXPOSURE' || 
                             categoryName === 'AUTH_BYPASS';
          const isHookIssue = categoryName === 'HOOK_SPILLOVER';
          
          const shouldThrow = (isBanned && this.config.throwOnBanned) ||
                             (isSecurity && this.config.throwOnSecurity) ||
                             (isHookIssue && this.config.throwOnHookSpillover);
          
          if (shouldThrow) {
            const error = `
══════════════════════════════════════════════════════════════
🚫 TRIDENT REAL-TIME FIREWALL - BLOCKED
══════════════════════════════════════════════════════════════

FILE: ${filePath}:${lineNum}
CATEGORY: ${categoryName}
PATTERN: ${pattern.note || 'Detected'}

EVIDENCE:
${line.trim()}

MATCH: ${match[0].substring(0, 100)}

${isBanned ? '🚫 THIS PATTERN IS BANNED - CRITICAL SYSTEM FAILURE' : ''}
${isSecurity ? '⚠️ SECURITY VULNERABILITY DETECTED' : ''}
${isHookIssue ? '⚠️ HOOK SPILLOVER RISK - CROSS-PLUGIN CONTAMINATION' : ''}

TRIDENT FIREWALL: Blocking execution. Fix before proceeding.
═══════════════════════════════════════════════════════════════
`;
            throw new Error(error);
          }
        }
      }
    }
  }
  
  /**
   * SOFT SCAN: Returns findings without throwing
   * Use for non-blocking analysis
   */
  scanSoft(code: string, filePath: string): Finding[] {
    const findings: Finding[] = [];
    const lines = code.split('\n');
    
    for (const [categoryName, patterns] of Object.entries(PATTERNS)) {
      for (const pattern of patterns as readonly { regex: RegExp; severity: string; note?: string }[]) {
        const flags = pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g';
        const regex = new RegExp(pattern.regex.source, flags);
        let match;
        let safetyCount = 0;
        const maxMatches = 100;
        
        while ((match = regex.exec(code)) !== null && safetyCount < maxMatches) {
          safetyCount++;
          const lineNum = code.substring(0, match.index).split('\n').length;
          const line = lines[lineNum - 1] || '';
          
          findings.push({
            severity: pattern.severity as Severity,
            layer: 0,
            detector: 'RealTimeFirewall',
            category: categoryName,
            title: `[BLOCKED] ${pattern.note || 'Banned pattern detected'}`,
            file: filePath,
            line: lineNum,
            evidence: line.trim(),
            remediation: this.getRemediation(categoryName),
            evidenceType: 'STATIC'
          });
        }
      }
    }
    
    return findings;
  }
  
  private getRemediation(category: string): string {
    const map: Record<string, string> = {
      'SIMULATED_EXECUTION': 'REMOVE theatrical code. Do NOT simulate work. Execute real operations.',
      'THEATRICAL_CODE': 'REMOVE placeholder comments. Implement actual functionality or remove code.',
      'STUB_CODE': 'IMPLEMENT actual logic. Stubs return nothing - they are BANNED.',
      'SQL_INJECTION': 'Use parameterized queries. Never concatenate user input into SQL.',
      'SECRET_EXPOSURE': 'Use environment variables. Never hardcode secrets.',
      'AUTH_BYPASS': 'IMPLEMENT proper authentication. Never bypass auth.',
      'HOOK_SPILLOVER': 'ADD agent identity check before hook logic runs.'
    };
    return map[category] || 'Fix this issue before proceeding.';
  }
}

// ============================================================================
// HOOK ISOLATION ANALYZER v2.0
// ============================================================================

export interface HookInfo {
  name: string;
  file: string;
  line: number;
  hasAgentCheck: boolean;
  agentCheckPattern?: string;
  wouldFireInWrongContext: boolean;
  wrongContextImpact?: string;
}

export interface HookIsolationReport {
  plugin: string;
  hooks: HookInfo[];
  spilloverRisks: Finding[];
  summary: {
    totalHooks: number;
    unsafeHooks: number;
    safeHooks: number;
  };
}

export class HookIsolationAnalyzer {
  private agentCheckPatterns = [
    /if\s*\(\s*agent\s*!==?\s*['"][^'"]+['"]\s*\)/i,
    /if\s*\(\s*agent\s*===\s*['"][^'"]+['"]\s*\)/i,
    /is\w+Agent\s*\(\s*\)/i,
    /agent\s*===\s*undefined/i,
    /!agent\s*\|\|\s*agent\s*===/i,
    /switch\s*\(\s*agent\s*\)/i,
  ];
  
  analyzePlugin(pluginSource: string, pluginName: string): HookIsolationReport {
    const hooks: HookInfo[] = [];
    const spilloverRisks: Finding[] = [];
    
    // Find all hook registrations
    const hookRegex = /['"](chat\.message|tool\.execute\.before|tool\.execute\.after|session\.compacting|experimental\.[^'"]+)['"]\s*:/g;
    let match;
    let safetyCount = 0;
    const maxHooks = 50;
    
    while ((match = hookRegex.exec(pluginSource)) !== null && safetyCount < maxHooks) {
      safetyCount++;
      const hookName = match[1];
      const lineNum = pluginSource.substring(0, match.index).split('\n').length;
      
      // Find the function body after this hook registration
      const afterHook = pluginSource.substring(match.index);
      const funcMatch = afterHook.match(/(?:async\s+)?function\s*\([^)]*\)\s*\{[^}]*\}|\([^)]*\)\s*=>\s*\{[^}]*\}/);
      
      // Check for agent identity checks
      let hasAgentCheck = false;
      let agentCheckPattern: string | undefined;
      
      for (const pattern of this.agentCheckPatterns) {
        const checkMatch = pluginSource.match(pattern);
        if (checkMatch) {
          hasAgentCheck = true;
          agentCheckPattern = checkMatch[0];
          break;
        }
      }
      
      // Determine if would fire in wrong context
      const wouldFire = !hasAgentCheck;
      let wrongContextImpact: string | undefined;
      
      if (wouldFire) {
        wrongContextImpact = this.estimateCrossPluginImpact(hookName, pluginName);
        spilloverRisks.push({
          severity: SEVERITY.CRITICAL,
          layer: 4,
          detector: 'HookIsolationAnalyzer',
          category: 'HOOK SPILLOVER',
          title: `Hook '${hookName}' fires WITHOUT agent check`,
          file: pluginName,
          line: lineNum,
          evidence: `No agent identity check found before hook logic`,
          remediation: `ADD agent check: if (agent !== '${pluginName}') return;`,
          evidenceType: 'STATIC'
        });
      }
      
      hooks.push({
        name: hookName,
        file: pluginName,
        line: lineNum,
        hasAgentCheck,
        agentCheckPattern,
        wouldFireInWrongContext: wouldFire,
        wrongContextImpact
      });
    }
    
    return {
      plugin: pluginName,
      hooks,
      spilloverRisks,
      summary: {
        totalHooks: hooks.length,
        unsafeHooks: hooks.filter(h => h.wouldFireInWrongContext).length,
        safeHooks: hooks.filter(h => !h.wouldFireInWrongContext).length
      }
    };
  }
  
  private estimateCrossPluginImpact(hookName: string, sourcePlugin: string): string {
    const impacts: Record<string, string> = {
      'chat.message': `Would transform messages for ALL agents including vanilla 'plan', 'build'`,
      'tool.execute.before': `Would block tools for ALL agents`,
      'tool.execute.after': `Would modify outputs for ALL agents`,
      'session.compacting': `Would affect session cleanup for ALL agents`,
      'experimental.chat.messages.transform': `Would pollute cross-agent message context`
    };
    return impacts[hookName] || `Would affect other agents when they trigger ${hookName}`;
  }
  
  analyzeHookSource(hookSource: string, hookName: string, pluginName: string): HookInfo {
    let hasAgentCheck = false;
    let agentCheckPattern: string | undefined;
    
    for (const pattern of this.agentCheckPatterns) {
      const checkMatch = hookSource.match(pattern);
      if (checkMatch) {
        hasAgentCheck = true;
        agentCheckPattern = checkMatch[0];
        break;
      }
    }
    
    const lineNum = hookSource.split('\n').length;
    
    return {
      name: hookName,
      file: pluginName,
      line: lineNum,
      hasAgentCheck,
      agentCheckPattern,
      wouldFireInWrongContext: !hasAgentCheck,
      wrongContextImpact: !hasAgentCheck ? this.estimateCrossPluginImpact(hookName, pluginName) : undefined
    };
  }
}

// ============================================================================
// RESOURCE FOOTPRINT ESTIMATOR v2.0
// ============================================================================

export interface ResourceCost {
  memoryEstimate: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tokenEstimate: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  cleanupScore: number; // 0-100
  issues: string[];
  instantiations: {
    Map: number;
    Set: number;
    Array: number;
    contextPush: number;
    contextSplice: number;
  };
}

export class ResourceFootprintEstimator {
  estimate(code: string): ResourceCost {
    const instantiations = {
      Map: (code.match(/\bnew\s+Map\s*\(/g) || []).length,
      Set: (code.match(/\bnew\s+Set\s*\(/g) || []).length,
      Array: (code.match(/\[\]|\bArray\b/g) || []).length,
      contextPush: (code.match(/\.push\s*\(/g) || []).length,
      contextSplice: (code.match(/\.splice\s*\(/g) || []).length
    };
    
    const issues: string[] = [];
    
    // Check for context bloat
    const contextRatio = instantiations.contextPush > 0 && instantiations.contextSplice === 0
      ? instantiations.contextPush / Math.max(1, instantiations.contextSplice)
      : 0;
    
    if (contextRatio > 10) {
      issues.push(`CONTEXT BLOAT: ${instantiations.contextPush} pushes with ${instantiations.contextSplice} splices - ratio ${contextRatio.toFixed(1)}`);
    }
    
    // Memory estimation
    let memoryEstimate: ResourceCost['memoryEstimate'] = 'LOW';
    if (instantiations.Map > 20 || instantiations.Set > 20) {
      memoryEstimate = 'HIGH';
      issues.push(`EXCESSIVE COLLECTIONS: ${instantiations.Map} Maps, ${instantiations.Set} Sets`);
    } else if (instantiations.Map > 10 || instantiations.Set > 10) {
      memoryEstimate = 'MEDIUM';
    }
    
    // Token estimation (crude but algorithmic)
    const estimatedTokens = Math.ceil(code.length / 4); // ~1 token per 4 chars
    let tokenEstimate: ResourceCost['tokenEstimate'] = 'LOW';
    if (estimatedTokens > 100000) {
      tokenEstimate = 'CRITICAL';
      issues.push(`TOKEN BLOAT: Estimated ${estimatedTokens} tokens in context`);
    } else if (estimatedTokens > 50000) {
      tokenEstimate = 'HIGH';
    } else if (estimatedTokens > 20000) {
      tokenEstimate = 'MEDIUM';
    }
    
    // Cleanup score
    const cleanupScore = instantiations.contextSplice === 0 && instantiations.contextPush > 0
      ? Math.max(0, 100 - instantiations.contextPush * 5)
      : 100 - Math.abs(instantiations.contextPush - instantiations.contextSplice) * 10;
    
    return {
      memoryEstimate,
      tokenEstimate,
      cleanupScore: Math.max(0, Math.min(100, cleanupScore)),
      issues,
      instantiations
    };
  }
}

// ============================================================================
// CROSS-REFERENCE VERIFIER v2.0
// ============================================================================

export interface CrossReference {
  type: 'import' | 'cluster_id' | 'tool_name' | 'hook' | 'env_var';
  reference: string;
  file: string;
  line?: number;
  verified: boolean;
  resolution?: string;
  error?: string;
}

export interface CrossReferenceReport {
  projectRoot: string;
  references: CrossReference[];
  unverified: CrossReference[];
  findings: Finding[];
  summary: {
    total: number;
    verified: number;
    unverified: number;
  };
}

export class CrossReferenceVerifier {
  async verify(projectRoot: string, opencodeTools?: string[]): Promise<CrossReferenceReport> {
    const references: CrossReference[] = [];
    const findings: Finding[] = [];
    
    // Find all source files
    const files = await this.findSourceFiles(projectRoot);
    
    for (const file of files) {
      const content = await readFile(file, 'utf-8');
      
      // Check imports
      const importMatches = content.matchAll(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
      for (const m of importMatches) {
        const importPath = m[1];
        const resolved = await this.resolveImport(importPath, file, projectRoot);
        references.push({
          type: 'import',
          reference: importPath,
          file: basename(file),
          line: content.substring(0, m.index).split('\n').length,
          ...resolved
        });
      }
      
      // Check cluster IDs
      const clusterMatches = content.matchAll(/cluster[Ii]d|cluster_id|spawn_cluster_task.*['"]([^'"]+)['"]/gi);
      for (const m of clusterMatches) {
        const clusterId = m[1];
        const isValidFormat = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(clusterId);
        references.push({
          type: 'cluster_id',
          reference: clusterId,
          file: basename(file),
          line: content.substring(0, m.index).split('\n').length,
          verified: clusterId.length > 0 && isValidFormat,
          resolution: isValidFormat ? 'Valid format' : 'Invalid format'
        });
      }
      
      // Check tool names (generic pattern: word-word or word_word_word)
      const toolMatches = content.matchAll(/['"]([a-z][a-z0-9]*-[a-z][a-z0-9]*(?:-[a-z][a-z0-9]*)*)['"]/gi);
      for (const m of toolMatches) {
        const toolName = m[1];
        // Skip if it looks like a file path, URL, or version string
        if (toolName.includes('/') || toolName.includes('.') || /^\d/.test(toolName)) continue;
        const verified = !opencodeTools || opencodeTools.includes(toolName);
        references.push({
          type: 'tool_name',
          reference: toolName,
          file: basename(file),
          line: content.substring(0, m.index).split('\n').length,
          verified,
          resolution: verified ? 'Tool registered' : undefined,
          error: verified ? undefined : 'Tool not found in OpenCode API'
        });
        
        if (!verified) {
          findings.push({
            severity: SEVERITY.HIGH,
            layer: 6,
            detector: 'CrossReferenceVerifier',
            category: 'UNREGISTERED TOOL',
            title: `Tool '${toolName}' referenced but not registered`,
            file: basename(file),
            evidence: toolName,
            remediation: 'Register tool in plugin config or remove reference',
            evidenceType: 'STATIC'
          });
        }
      }
      
      // Check environment variables
      const envMatches = content.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g);
      for (const m of envMatches) {
        const envVar = m[1];
        references.push({
          type: 'env_var',
          reference: `process.env.${envVar}`,
          file: basename(file),
          line: content.substring(0, m.index).split('\n').length,
          verified: true, // Assume exists
          resolution: 'Environment variable reference'
        });
      }
    }
    
    const unverified = references.filter(r => !r.verified);
    
    return {
      projectRoot,
      references,
      unverified,
      findings,
      summary: {
        total: references.length,
        verified: references.filter(r => r.verified).length,
        unverified: unverified.length
      }
    };
  }
  
  private async findSourceFiles(root: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(root, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await this.findSourceFiles(join(root, entry.name));
          files.push(...subFiles);
        } else if (entry.isFile() && /\.(ts|js)$/.test(entry.name)) {
          files.push(join(root, entry.name));
        }
      }
    } catch {
      // Skip inaccessible directories
    }
    
    return files;
  }
  
  private async resolveImport(importPath: string, fromFile: string, projectRoot: string): Promise<{ verified: boolean; resolution?: string; error?: string }> {
    // Skip node_modules
    if (importPath.startsWith('@') || !importPath.startsWith('.')) {
      return { verified: true, resolution: 'External module' };
    }
    
    // Resolve relative import
    const baseDir = dirname(fromFile);
    const resolved = join(baseDir, importPath);
    
    // Try with extensions
    const extensions = ['', '.ts', '.js', '/index.ts', '/index.js'];
    
    for (const ext of extensions) {
      try {
        await access(resolved + ext, constants.R_OK);
        return { verified: true, resolution: `${resolved}${ext}` };
      } catch {
        // Try next
      }
    }
    
    return { verified: false, error: `Cannot resolve import '${importPath}'` };
  }
}

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
    
    // SCAN: Simulated Execution (Layer 0) - BANNED
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.SIMULATED_EXECUTION, 0, 'SIMULATED EXECUTION'));
    
    // SCAN: Theatrical Code (Layer 0) - BANNED
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.THEATRICAL_CODE, 0, 'THEATRICAL CODE'));
    
    // SCAN: Stub Code (Layer 0) - BANNED
    fileFindings.push(...this.scanPatterns(filePath, content, lines, PATTERNS.STUB_CODE, 0, 'STUB CODE'));
    
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
    patterns: readonly { regex: RegExp; severity: string; note?: string }[],
    layer: number,
    category: string
  ): Finding[] {
    const findings: Finding[] = [];
    
    for (const pattern of patterns) {
      try {
        const flags = pattern.regex.flags.includes('g') ? pattern.regex.flags : pattern.regex.flags + 'g';
        const regex = new RegExp(pattern.regex.source, flags);
        let match;
        let safetyCount = 0;
        const maxMatches = 100;
        
        while ((match = regex.exec(content)) !== null && safetyCount < maxMatches) {
          safetyCount++;
          const matchStr = match[0];
          const lineNum = content.substring(0, match.index).split('\n').length;
          findings.push(this.createFinding(
            pattern.severity as Severity,
            layer,
            this.getDetectorName(category),
            category,
            this.generateTitle(category, pattern.note),
            filePath,
            matchStr.substring(0, 100),
            this.generateRemediation(category),
            'STATIC',
            undefined,
            undefined,
            lineNum
          ));
        }
      } catch (e) {
        // Skip patterns that fail
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
    evidenceType: 'STATIC' | 'EXECUTION' | 'CONTAINER' | 'PROOF',
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
      'THEATRICAL CODE': 'TheatricalCode',
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
      'SIMULATED EXECUTION': '🚫 THEATRICAL CODE DETECTED - BANNED PATTERN',
      'THEATRICAL CODE': '🚫 PLACEHOLDER/TODO COMMENT - THEATRICAL CODE',
      'STUB CODE': '🚫 STUB FUNCTION - BANNED PATTERN',
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
      'SIMULATED EXECUTION': 'REMOVE theatrical code. Do NOT simulate work. Execute real operations.',
      'THEATRICAL CODE': 'REMOVE placeholder comments. Implement actual functionality or remove code.',
      'STUB CODE': 'IMPLEMENT actual logic. Stubs that return null/undefined are BANNED.',
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
  }
  
  async scanDirectory(targetPath: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    const MAX_FILE_SIZE = 1024 * 1024; // 1MB per file limit
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total limit
    let totalSize = 0;
    
    try {
      const { stdout } = await execAsync(
        `find "${targetPath}" -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.json" \\) 2>/dev/null | head -50`,
        { timeout: 15000 }
      );
      
      const filePaths = stdout.split('\n').filter(p => p.trim());
      
      for (const filePath of filePaths.slice(0, 50)) {
        if (totalSize >= MAX_TOTAL_SIZE) break;
        
        try {
          const stats = await Promise.race([
            stat(filePath),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('STAT_TIMEOUT')), 5000)
            )
          ]).catch(e => { throw e; });
          
          if (stats.size > MAX_FILE_SIZE) {
            continue;
          }
          
          const content = await Promise.race([
            readFile(filePath, 'utf-8'),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('READ_TIMEOUT')), 5000)
            )
          ]).catch(e => { throw e; });
          
          if (content.includes('\uFFFD') && content.length > 100) {
            continue;
          }
          
          totalSize += stats.size;
          files.set(filePath, content);
        } catch (e) {
          // Skip unreadable files silently
        }
      }
    } catch (e) {
      // Directory scan failed - return empty
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
    const allFindings: Finding[] = [];
    for (let i = 0; i <= 6; i++) {
      allFindings.push(...getFindingsByLayer(i));
    }
    
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
| CRITICAL (BANNED) | ${critical} | ${critical > 0 ? '🚨 IMMEDIATE FIX REQUIRED' : '✅'} |
| HIGH | ${high} | ${high > 0 ? '⚠️' : '✅'} |
| MEDIUM | ${medium} | ${medium > 0 ? '⚡' : '✅'} |
| LOW | ${low} | ${low > 0 ? '📝' : '✅'} |
| INFO | ${info} | ℹ️ |

${critical > 0 ? '\n🚨 **CRITICAL: THEATRICAL CODE DETECTED - ALL SUCH PATTERNS ARE BANNED**\n' : ''}

---

## FINDINGS BY LAYER

`;
    
    const layerNames: Record<number, string> = {
      0: '🚫 BANNED PATTERNS (Theatrical Code)',
      1: 'Structure Analysis',
      2: 'Execution Verification',
      3: 'Security Analysis',
      4: 'Architecture Analysis',
      5: 'Quality Analysis',
      6: 'Integration Verification'
    };
    
    for (let layer = 0; layer <= 6; layer++) {
      const layerFindings = getFindingsByLayer(layer);
      if (layerFindings.length === 0) continue;
      
      report += `### Layer ${layer}: ${layerNames[layer] || 'Unknown'}\n\n`;
      
      for (const f of layerFindings) {
        const icon = { CRITICAL: '🚫', HIGH: '⚠️', MEDIUM: '⚡', LOW: '📝', INFO: 'ℹ️' }[f.severity];
        
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
CRITICAL (BANNED): ${critical}
HIGH: ${high}

🚫 THEATRICAL CODE PATTERNS ARE BANNED - FIX IMMEDIATELY:
1. SIMULATED_EXECUTION - fake success responses
2. THEATRICAL_CODE - TODO placeholders, mock comments
3. STUB_CODE - null/undefined returns

RULES:
1. Fix CRITICAL immediately - theatrical code is BANNED
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

*Generated by Trident Brain v2.0 — Algorithmic Core*
`;
    
    return report;
  }
}

// ============================================================================
// SINGLETON EXPORTS
// ============================================================================

export const auditEngine = new AuditEngine();
export const reportGenerator = new ReportGenerator();
export const proofVerifier = new ProofVerifier();
export const realTimeFirewall = new RealTimeFirewall();
export const hookAnalyzer = new HookIsolationAnalyzer();
export const resourceEstimator = new ResourceFootprintEstimator();
export const crossRefVerifier = new CrossReferenceVerifier();
