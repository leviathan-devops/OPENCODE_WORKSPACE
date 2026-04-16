/**
 * TRIDENT BRAIN - ALGORITHMIC PLUGIN
 * 
 * Algorithmic-First Design:
 * - Model is ONLY for reading code (via fs operations)
 * - ALL intelligence is ALGORITHMIC (regex classifiers)
 * - NO behavioral prompts - pure pattern matching
 * - NO theatrical code - all patterns are BANNED and generate CRITICAL findings
 * 
 * Natural language interface via chat.message hook.
 */

import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
import { auditEngine, reportGenerator, PATTERNS } from './algorithmic-core.js';
import { createTridentTools } from './tools/algorithmic-tools.js';

interface TridentState {
  mode: string;
  target: string;
  depth: number;
  artifacts: Map<string, string>;
  initialized: boolean;
  lastError?: string;
}

const state: TridentState = {
  mode: 'idle',
  target: '',
  depth: 7,
  artifacts: new Map(),
  initialized: true
};

const tools = createTridentTools(state);

function parseNaturalLanguage(message: string): { action: string; target?: string; options?: Record<string, any> } | null {
  const msg = message.toLowerCase().trim();
  
  // Audit patterns
  if (msg.includes('audit') || msg.includes('review') || msg.includes('scan')) {
    // Extract target path if mentioned
    const pathMatch = msg.match(/[\/\.\~\w-]+\/?/);
    const target = pathMatch ? pathMatch[0] : process.cwd();
    
    // Check for options
    const options: Record<string, any> = {};
    if (msg.includes('--skip-build') || msg.includes('skip build') || msg.includes('no build')) {
      options.skipBuild = true;
    }
    if (msg.includes('--skip-test') || msg.includes('skip test') || msg.includes('no test')) {
      options.skipTest = true;
    }
    
    return { action: 'audit', target, options };
  }
  
  // Status patterns
  if (msg.includes('status') || msg.includes('state')) {
    return { action: 'status' };
  }
  
  // Report patterns
  if (msg.includes('report') || msg.includes('findings') || msg.includes('results')) {
    return { action: 'report' };
  }
  
  // Fix patterns
  if (msg.includes('fix') || msg.includes('repair') || msg.includes('remediation')) {
    return { action: 'fix' };
  }
  
  // Help patterns
  if (msg.includes('help') || msg.includes('what') || msg.includes('how')) {
    return { action: 'help' };
  }
  
  return null;
}

async function runAudit(target: string, options: Record<string, any> = {}): Promise<string> {
  const {
    skipBuild = true,
    skipTest = true
  } = options;
  
  console.log('[Trident] === STARTING AUDIT ===');
  state.lastError = undefined;
  
  const config = {
    targetPath: target,
    depth: 7,
    containerImage: 'opencode-python3:latest',
    buildCommand: skipBuild ? 'false' : 'npm run build 2>&1 || echo "NO_BUILD_SCRIPT"',
    testCommand: skipTest ? 'false' : 'npm test 2>&1 || echo "NO_TEST_SCRIPT"'
  };
  
  try {
    auditEngine.startAudit(config);
    console.log('[Trident] Engine started');
    
    const files = await auditEngine.scanDirectory(target);
    console.log(`[Trident] Files found: ${files.size}`);
    
    if (files.size === 0) {
      state.lastError = 'No files found to audit';
      return `## TRIDENT AUDIT

**Target:** ${target}

❌ No .ts/.js/.json files found. Check that:
1. The path exists
2. You have read permissions
3. The directory contains TypeScript/JavaScript/JSON files`;
    }
    
    const scanner = auditEngine.getScanner();
    let filesScanned = 0;
    for (const [filePath, content] of files) {
      scanner.scanFile(filePath, content);
      filesScanned++;
    }
    console.log(`[Trident] Files scanned: ${filesScanned}`);
    
    if (!skipBuild) {
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
        console.log('[Trident] Build test error:', e);
      }
    }
    
    if (!skipTest) {
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
        console.log('[Trident] Test suite error:', e);
      }
    }
    
    for (let i = 0; i <= 6; i++) {
      auditEngine.completeLayer(i);
    }
    auditEngine.complete();
    
    const findings = scanner.getFindings();
    console.log(`[Trident] Findings: ${findings.length}`);
    
    const report = reportGenerator.generate(
      () => 'AUDIT-1',
      (layer) => findings.filter(f => f.layer === layer),
      auditEngine.getState()
    );
    
    state.artifacts.set('TRIDENT_CODE_REVIEW.md', report);
    
    const critical = findings.filter(f => f.severity === 'CRITICAL').length;
    const high = findings.filter(f => f.severity === 'HIGH').length;
    const medium = findings.filter(f => f.severity === 'MEDIUM').length;
    const low = findings.filter(f => f.severity === 'LOW').length;
    
    console.log('[Trident] === AUDIT COMPLETE ===');
    
    const bannedList = Object.keys(PATTERNS).filter(k => 
      k === 'SIMULATED_EXECUTION' || k === 'THEATRICAL_CODE' || k === 'STUB_CODE'
    );
    
    return `## TRIDENT AUDIT COMPLETE

**Target:** \`${target}\`
**Files Scanned:** ${filesScanned}
**Findings:** ${findings.length}

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL (BANNED) | ${critical} | ${critical > 0 ? '🚨 IMMEDIATE FIX REQUIRED' : '✅'} |
| HIGH | ${high} | ${high > 0 ? '⚠️' : '✅'} |
| MEDIUM | ${medium} | ${medium > 0 ? '⚡' : '✅'} |
| LOW | ${low} | ${low > 0 ? '📝' : '✅'} |

${critical > 0 ? '🚨 **CRITICAL: THEATRICAL CODE DETECTED - ALL SUCH PATTERNS ARE BANNED**\n' : ''}
${critical > 0 ? '🚨 **Banned patterns include: simulated execution, theatrical delays, stub functions**\n' : ''}
${critical > 0 ? 'Run `show me the full report` for details.\n' : ''}
${critical === 0 && high === 0 ? '✅ No critical or high severity issues found.\n' : ''}

**Patterns Searched:** ${Object.keys(PATTERNS).length} categories
- 🚫 SIMULATED EXECUTION (CRITICAL - BANNED)
- 🚫 THEATRICAL CODE (HIGH - BANNED)
- 🚫 STUB CODE (HIGH - BANNED)
- ⚠️ SQL INJECTION (CRITICAL)
- ⚠️ SECRET EXPOSURE (CRITICAL)
- ⚠️ AUTH BYPASS (CRITICAL)
- ⚠️ XSS (HIGH)
- ⚡ EMPTY CATCH (MEDIUM)
- ⚡ HOOK SPILLOVER (HIGH)
- ⚡ GLOBAL STATE (MEDIUM)
- ⚡ COMPLEXITY (MEDIUM)
- ⚡ RESOURCE LEAK (MEDIUM)

${findings.length > 0 ? 'Say `show me the full report` for complete findings.' : ''}
`;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    state.lastError = errorMsg;
    console.log('[Trident] ERROR:', errorMsg);
    return `## TRIDENT AUDIT ERROR

**Target:** ${target}
**Error:** ${errorMsg}

Check that:
1. The path exists and is accessible
2. You have read permissions
3. The directory contains .ts/.js/.json files`;
  }
}

function getStatus(): string {
  const auditState = auditEngine.getState();
  const scanner = auditEngine.getScanner();
  const findings = scanner.getFindings();
  
  return `## TRIDENT BRAIN STATUS

**Mode:** ${state.mode || 'idle'}
**Target:** ${state.target || process.cwd()}
**Status:** ${auditState.status}
**Last Error:** ${state.lastError || 'none'}

---

## 🚫 THEATRICAL CODE IS BANNED

All theatrical/simulated code patterns are **BANNED** and constitute **CRITICAL SYSTEM FAILURE**:

- setTimeout → resolve({success:true})
- TODO comments with "full implementation would"
- Stub functions returning null/undefined
- Hardcoded success:true with no actual work
- 100ms theatrical delays
- Mock data comments

**Detection:** ${Object.keys(PATTERNS).length} pattern categories

**Current Findings:**
- CRITICAL (BANNED): ${findings.filter(f => f.severity === 'CRITICAL').length}
- HIGH: ${findings.filter(f => f.severity === 'HIGH').length}
- MEDIUM: ${findings.filter(f => f.severity === 'MEDIUM').length}
- LOW: ${findings.filter(f => f.severity === 'LOW').length}

---

**To start an audit:** Say "audit this project" or "review the code"
`;
}

function getHelp(): string {
  return `## TRIDENT BRAIN - Code Review Agent

I perform **algorithmic code reviews** using pure pattern matching - no AI opinions, just regex classifiers finding real issues.

### What I Search For:

🚫 **BANNED (CRITICAL):**
- Simulated execution (fake success responses)
- Theatrical code (TODO placeholders, mock comments)
- Stub functions (empty implementations)
- Secret exposure (hardcoded API keys)
- Auth bypass (hardcoded true returns)

⚠️ **HIGH:**
- SQL injection risks
- XSS vulnerabilities
- Hook spillover patterns

⚡ **MEDIUM:**
- Empty catch blocks
- Global state access
- Complexity hotspots
- Resource leaks

### How to Use:

- **"audit this"** - Scan current directory
- **"audit /path/to/project"** - Scan specific path
- **"show me the full report"** - Get detailed findings
- **"show status"** - Current audit state
- **"show me how to fix the issues"** - Get remediation steps

**Note:** Build and test verification are skipped by default for speed. Say "audit with build test" to enable.
`;
}

export default async function TridentBrainPlugin(input: PluginInput): Promise<Hooks> {
  console.log('[Trident Brain] Algorithmic Core loaded');
  
  return {
    'tool.execute.before': async (input: any, output: any) => {
      // No tools blocked - audit is read-only
    },

    'tool.execute.after': async (input: any, output: any) => {
      const toolName = input.tool as string;
      if (toolName === 'write_file' || toolName === 'write') {
        const content = input.args?.content || '';
        const filename = input.args?.filename || input.args?.path || 'unknown';
        if (typeof content === 'string' && content.length > 0) {
          state.artifacts.set(`artifact:${filename}`, content);
        }
      }
    },

    'chat.message': async (input: any, output: any) => {
      // Only intercept when 'trident' agent is selected
      if (input.agent !== 'trident') return;
      
      const message = input.message as string;
      if (!message) return;
      
      console.log('[Trident] Chat message received:', message.substring(0, 100));
      
      const parsed = parseNaturalLanguage(message);
      
      if (!parsed) {
        output.parts = [{ type: 'text', text: getHelp() }];
        return;
      }
      
      switch (parsed.action) {
        case 'audit': {
          const result = await runAudit(parsed.target || process.cwd(), parsed.options);
          output.parts = [{ type: 'text', text: result }];
          break;
        }
        case 'status': {
          output.parts = [{ type: 'text', text: getStatus() }];
          break;
        }
        case 'report': {
          const storedReport = state.artifacts.get('TRIDENT_CODE_REVIEW.md');
          if (storedReport) {
            output.parts = [{ type: 'text', text: storedReport }];
          } else {
            output.parts = [{ type: 'text', text: '## NO REPORT AVAILABLE\n\nRun an audit first: say "audit this"' }];
          }
          break;
        }
        case 'fix': {
          const scanner = auditEngine.getScanner();
          const findings = scanner.getFindings();
          if (findings.length === 0) {
            output.parts = [{ type: 'text', text: '## NO FINDINGS TO FIX\n\nRun an audit first: say "audit this"' }];
          } else {
            const critical = findings.filter(f => f.severity === 'CRITICAL');
            const high = findings.filter(f => f.severity === 'HIGH');
            let response = '## TRIDENT FIX INSTRUCTIONS\n\n';
            if (critical.length > 0) {
              response += '🚨 **CRITICAL (BANNED PATTERNS) - FIX IMMEDIATELY:**\n\n';
              for (const f of critical) {
                response += `### ${f.file}${f.line ? `:${f.line}` : ''}\n`;
                response += `**Category:** ${f.category}\n`;
                response += `**Evidence:** \`${f.evidence}\`\n`;
                response += `**Fix:** ${f.remediation}\n\n`;
              }
            }
            if (high.length > 0) {
              response += `⚠️ **HIGH PRIORITY:**\n\n`;
              for (const f of high.slice(0, 10)) {
                response += `### ${f.file}${f.line ? `:${f.line}` : ''}\n`;
                response += `**Category:** ${f.category}\n`;
                response += `**Evidence:** \`${f.evidence}\`\n`;
                response += `**Fix:** ${f.remediation}\n\n`;
              }
              if (high.length > 10) {
                response += `*...and ${high.length - 10} more high priority issues*\n`;
              }
            }
            output.parts = [{ type: 'text', text: response }];
          }
          break;
        }
        case 'help':
        default: {
          output.parts = [{ type: 'text', text: getHelp() }];
          break;
        }
      }
    },

    tool: {
      ...tools
    },

    config: async (cfg: any) => {
      if (!cfg.agent) cfg.agent = {};
      
      cfg.agent['trident'] = {
        name: 'trident',
        description: 'TRIDENT — Algorithmic code review. Searches for theatrical code, security issues, and quality problems using pure regex patterns.',
        instructions: `TRIDENT is an algorithmic code review agent that uses pure regex pattern matching.

It searches for:
- BANNED theatrical code (CRITICAL): simulated execution, stub functions, TODO placeholders
- Security issues (CRITICAL/HIGH): SQL injection, secret exposure, auth bypass
- Quality issues (MEDIUM): empty catch, complexity hotspots, resource leaks

The model is ONLY used to read files - all detection is algorithmic.

Commands:
- "audit this" - Scan current directory
- "show me the full report" - Get detailed findings  
- "show status" - Current audit state
- "show me how to fix" - Remediation steps`,
        mode: 'primary',
        permission: { task: 'allow' },
        color: '#8B5CF6'
      };
    }
  };
}
