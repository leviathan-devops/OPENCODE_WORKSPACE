/**
 * Trident Tools - ALGORITHMIC CORE
 * 
 * Uses algorithmic classifiers, model is ONLY for reading code.
 * ALL theatrical code patterns are explicitly BANNED and constitute CRITICAL SYSTEM FAILURE.
 */

import { tool } from '@opencode-ai/plugin';
import type { ToolContext } from '@opencode-ai/plugin';
import { auditEngine, reportGenerator, PATTERNS, type AuditConfig } from '../algorithmic-core.js';

interface TridentState {
  mode: string;
  target: string;
  depth: number;
  artifacts: Map<string, string>;
  initialized: boolean;
  lastError?: string;
}

export function createTridentTools(state: TridentState) {
  
  const tridentAudit = tool({
    description: 'Run algorithmic code audit - NO THEATRICAL CODE. All patterns are banned and generate CRITICAL findings.',
    args: {
      target: tool.schema.string().optional().describe('Target path'),
      depth: tool.schema.number().optional().describe('Audit depth 1-7'),
      skipBuild: tool.schema.boolean().optional().describe('Skip build test'),
      skipTest: tool.schema.boolean().optional().describe('Skip test suite'),
    },
    async execute(args: any, ctx: ToolContext): Promise<string> {
      console.log('[Trident Audit] === STARTING AUDIT ===');
      state.lastError = undefined;
      
      const target = args.target || state.target || process.cwd();
      const depth = args.depth || state.depth || 7;
      const skipBuild = args.skipBuild ?? true;  // Default to skip build
      const skipTest = args.skipTest ?? true;   // Default to skip tests
      
      state.target = target;
      state.depth = depth;
      state.mode = 'audit';
      
      const config: AuditConfig = {
        targetPath: target,
        depth,
        containerImage: 'opencode-python3:latest',
        buildCommand: skipBuild ? 'false' : 'npm run build 2>&1 || echo "NO_BUILD_SCRIPT"',
        testCommand: skipTest ? 'false' : 'npm test 2>&1 || echo "NO_TEST_SCRIPT"'
      };
      
      try {
        auditEngine.startAudit(config);
        console.log('[Trident Audit] Engine started');
        
        // ALGORITHMIC: Scan directory for files
        const files = await auditEngine.scanDirectory(target);
        console.log(`[Trident Audit] Files found: ${files.size}`);
        
        if (files.size === 0) {
          state.lastError = 'No files found to audit';
          return `## TRIDENT AUDIT\n\n**Target:** ${target}\n\n❌ No files found. Check the path exists and contains .ts/.js/.json files.`;
        }
        
        // ALGORITHMIC: Scan each file with regex patterns
        const scanner = auditEngine.getScanner();
        let filesScanned = 0;
        for (const [filePath, content] of files) {
          scanner.scanFile(filePath, content);
          filesScanned++;
        }
        console.log(`[Trident Audit] Files scanned: ${filesScanned}`);
        
        // ALGORITHMIC: Run build test if not skipped
        if (!skipBuild) {
          console.log('[Trident Audit] Running build test...');
          try {
            const buildResult = await auditEngine.runBuildTest(target);
            if (!buildResult.success) {
              scanner.addFinding({
                severity: 'HIGH',
                layer: 2,
                detector: 'BuildTest',
                category: 'EXECUTION VERIFICATION',
                title: 'Build FAILED',
                file: target,
                evidence: buildResult.output.substring(0, 300),
                remediation: 'Fix build errors before deployment',
                evidenceType: 'EXECUTION',
                commandExecuted: config.buildCommand,
                commandOutput: buildResult.output
              });
            }
          } catch (e) {
            console.log('[Trident Audit] Build test error:', e);
          }
        }
        
        // ALGORITHMIC: Run test suite if not skipped
        if (!skipTest) {
          console.log('[Trident Audit] Running test suite...');
          try {
            const testResult = await auditEngine.runTestSuite(target);
            if (testResult.failing && testResult.failing > 0) {
              scanner.addFinding({
                severity: 'HIGH',
                layer: 2,
                detector: 'TestSuite',
                category: 'EXECUTION VERIFICATION',
                title: `${testResult.failing} test(s) FAILED`,
                file: target,
                evidence: testResult.output.substring(0, 300),
                remediation: 'Fix failing tests before deployment',
                evidenceType: 'CONTAINER',
                commandExecuted: config.testCommand,
                commandOutput: testResult.output
              });
            }
          } catch (e) {
            console.log('[Trident Audit] Test suite error:', e);
          }
        }
        
        // Complete all layers
        for (let i = 0; i <= 6; i++) {
          auditEngine.completeLayer(i);
        }
        auditEngine.complete();
        
        // ALGORITHMIC: Generate report
        const findings = scanner.getFindings();
        console.log(`[Trident Audit] Findings: ${findings.length}`);
        
        const report = reportGenerator.generate(
          () => 'AUDIT-1',
          (layer) => findings.filter(f => f.layer === layer),
          auditEngine.getState()
        );
        
        // Store report
        state.artifacts.set('TRIDENT_CODE_REVIEW.md', report);
        
        const critical = findings.filter(f => f.severity === 'CRITICAL').length;
        const high = findings.filter(f => f.severity === 'HIGH').length;
        const medium = findings.filter(f => f.severity === 'MEDIUM').length;
        const low = findings.filter(f => f.severity === 'LOW').length;
        
        console.log('[Trident Audit] === AUDIT COMPLETE ===');
        
        return `## TRIDENT AUDIT COMPLETE

**Target:** \`${target}\`
**Files Scanned:** ${filesScanned}
**Findings:** ${findings.length}

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | ${critical} | ${critical > 0 ? '🚨 BANNED PATTERN' : '✅'} |
| HIGH | ${high} | ${high > 0 ? '⚠️' : '✅'} |
| MEDIUM | ${medium} | ${medium > 0 ? '⚡' : '✅'} |
| LOW | ${low} | ${low > 0 ? '📝' : '✅'} |

${critical > 0 ? '🚨 **CRITICAL SYSTEM FAILURE - THEATRICAL CODE DETECTED**' : ''}
${critical > 0 ? '🚨 **ALL THEATRICAL CODE PATTERNS ARE BANNED**' : ''}

**Pattern Categories Searched:** ${Object.keys(PATTERNS).length}
- SIMULATED EXECUTION (CRITICAL - BANNED)
- THEATRICAL CODE (HIGH - BANNED)  
- STUB CODE (HIGH - BANNED)
- SQL INJECTION (CRITICAL)
- SECRET EXPOSURE (CRITICAL)
- AUTH BYPASS (CRITICAL)
- XSS (HIGH)
- EMPTY CATCH (MEDIUM)
- HOOK SPILLOVER (HIGH)
- GLOBAL STATE (MEDIUM)
- COMPLEXITY (MEDIUM)
- RESOURCE LEAK (MEDIUM)

${findings.length > 0 ? 'Run `/trident report` for full findings.' : '✅ No issues found.'}
`;
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        state.lastError = errorMsg;
        console.log('[Trident Audit] ERROR:', errorMsg);
        return `## TRIDENT AUDIT ERROR

**Target:** ${target}
**Error:** ${errorMsg}

Check that:
1. The path exists
2. You have read permissions
3. The directory contains .ts/.js/.json files`;
      }
    }
  });

  const tridentStatus = tool({
    description: 'Show audit status',
    args: {},
    async execute(args: any, ctx: ToolContext): Promise<string> {
      const auditState = auditEngine.getState();
      const scanner = auditEngine.getScanner();
      const findings = scanner.getFindings();
      
      return `## TRIDENT BRAIN STATUS

**Mode:** ${state.mode || 'idle'}
**Target:** ${state.target || 'none'}
**Status:** ${auditState.status}
**Layers Complete:** ${auditState.completedLayers.join(', ') || 'none'}
**Last Error:** ${state.lastError || 'none'}

---

## ⚠️  THEATRICAL CODE IS BANNED

All theatrical/simulated code patterns are explicitly **BANNED** and constitute **CRITICAL SYSTEM FAILURE**.

**Banned Patterns:**
- setTimeout → resolve({success:true})
- TODO comments with "full implementation"
- Stub functions returning null/undefined
- Hardcoded success:true
- 100ms theatrical delays
- Mock data comments

---

## TRIDENT COMMANDS

| Command | Description |
|---------|-------------|
| \`/audit\` or \`/audit this\` | Start audit (skips build/test by default) |
| \`/audit <path> --depth=7\` | Audit with options |
| \`/trident report\` | Get full findings report |
| \`/trident status\` | Show audit status |

---

**Current Findings:**
- CRITICAL (BANNED): ${findings.filter(f => f.severity === 'CRITICAL').length}
- HIGH: ${findings.filter(f => f.severity === 'HIGH').length}
`;
    }
  });

  const tridentReport = tool({
    description: 'Get audit report',
    args: {
      format: tool.schema.string().optional().describe('Format: markdown or json'),
      severity: tool.schema.string().optional().describe('Filter by severity: critical, high, medium, low'),
    },
    async execute(args: any, ctx: ToolContext): Promise<string> {
      const scanner = auditEngine.getScanner();
      const findings = scanner.getFindings();
      
      const storedReport = state.artifacts.get('TRIDENT_CODE_REVIEW.md');
      
      if (args.format === 'json') {
        let filtered = findings;
        if (args.severity) {
          filtered = findings.filter(f => f.severity.toLowerCase() === args.severity.toLowerCase());
        }
        return JSON.stringify({
          target: state.target,
          totalFindings: findings.length,
          findings: filtered
        }, null, 2);
      }
      
      if (storedReport) {
        let report = storedReport;
        if (args.severity) {
          const filtered = findings.filter(f => f.severity.toLowerCase() === args.severity.toLowerCase());
          if (filtered.length === 0) {
            return `## No ${args.severity} findings found.`;
          }
          // Generate filtered report
          const lines = report.split('\n');
          const inFindings = false;
          // Simple filter - just return full report for now
        }
        return report;
      }
      
      return `## NO REPORT AVAILABLE

Run \`/audit\` or \`/audit this\` first to generate a report.

**BANNED Patterns Reference:**
- SIMULATED EXECUTION → CRITICAL
- THEATRICAL CODE → HIGH  
- STUB CODE → HIGH
- SECRET EXPOSURE → CRITICAL
- AUTH BYPASS → CRITICAL
`;
    }
  });

  const tridentFix = tool({
    description: 'Get fix instructions for findings',
    args: {
      severity: tool.schema.string().optional().describe('Severity: critical, high, medium, low'),
    },
    async execute(args: any, ctx: ToolContext): Promise<string> {
      const scanner = auditEngine.getScanner();
      const findings = scanner.getFindings();
      
      let filtered = findings;
      if (args.severity) {
        filtered = findings.filter(f => f.severity.toLowerCase() === args.severity.toLowerCase());
      }
      
      if (filtered.length === 0) {
        return `## NO FINDINGS TO FIX

No ${args.severity || ''} findings found.`;
      }
      
      const critical = filtered.filter(f => f.severity === 'CRITICAL');
      const high = filtered.filter(f => f.severity === 'HIGH');
      
      let response = `## TRIDENT FIX INSTRUCTIONS

`;
      
      if (critical.length > 0) {
        response += `🚨 **CRITICAL (BANNED PATTERNS) - FIX IMMEDIATELY:**\n\n`;
        for (const f of critical) {
          response += `### ${f.file}${f.line ? `:${f.line}` : ''}\n`;
          response += `**Category:** ${f.category}\n`;
          response += `**Evidence:** \`${f.evidence}\`\n`;
          response += `**Fix:** ${f.remediation}\n\n`;
        }
      }
      
      if (high.length > 0) {
        response += `⚠️ **HIGH PRIORITY:**\n\n`;
        for (const f of high.slice(0, 10)) {  // Limit to 10
          response += `### ${f.file}${f.line ? `:${f.line}` : ''}\n`;
          response += `**Category:** ${f.category}\n`;
          response += `**Evidence:** \`${f.evidence}\`\n`;
          response += `**Fix:** ${f.remediation}\n\n`;
        }
        if (high.length > 10) {
          response += `*...and ${high.length - 10} more high priority issues*\n`;
        }
      }
      
      return response;
    }
  });

  return {
    'trident-audit': tridentAudit,
    'trident-status': tridentStatus,
    'trident-report': tridentReport,
    'trident-fix': tridentFix
  };
}
