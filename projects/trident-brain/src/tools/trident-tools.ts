/**
 * Trident Tools - AUDIT CAPABLE
 * 
 * Tools for Trident Brain Code Review Mode.
 * - /audit or /audit this to trigger
 * - Container execution via shell
 * - Writes to TRIDENT_CODE_REVIEW.md
 */

import { tool } from '@opencode-ai/plugin';
import type { ToolContext } from '@opencode-ai/plugin';
import type { TridentState } from '../hooks/trident-hook.js';
import type { ModeCoordinator, ModeType } from '../shared/mode-coordinator.js';
import { CodeReviewMode, type Finding, type AuditConfig } from '../modes/code-review/index.js';
import { runDetectorsForLayer, type DetectorContext } from '../modes/code-review/detectors.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TridentToolsOptions {
  state: TridentState;
  coordinator: ModeCoordinator;
  codeReviewMode: CodeReviewMode;
}

export function createTridentTools(options: TridentToolsOptions) {
  const { state, coordinator, codeReviewMode } = options;

  const audit = tool({
    description: 'Start a comprehensive code audit. Use /audit or /audit this to trigger.',
    args: {
      target: tool.schema.string().optional().describe('Target path to audit'),
      depth: tool.schema.number().optional().describe('Audit depth 1-7 (default: 7 = full)'),
      container: tool.schema.string().optional().describe('Docker container image'),
      testCommand: tool.schema.string().optional().describe('Test command to run'),
      buildCommand: tool.schema.string().optional().describe('Build command to run'),
    },
    async execute(args: any, context: ToolContext): Promise<string> {
      const target = args.target || state.target || process.cwd();
      const depth = args.depth || 7;
      
      state.currentMode = 'code-review';
      state.target = target;
      state.depth = depth;
      
      const config: AuditConfig = {
        target,
        depth,
        iteration: 'V1.0',
        containerImage: args.container || 'opencode-python3:latest',
        testCommand: args.testCommand || 'npm test',
        buildCommand: args.buildCommand || 'npm run build',
        entryPoint: './src'
      };
      
      codeReviewMode.startAudit(config);
      
      const filePaths: string[] = [];
      const fileContents = new Map<string, string>();
      
      try {
        const { stdout } = await execAsync(`find "${target}" -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.md" \\) 2>/dev/null | head -200`, {
          timeout: 30000
        });
        filePaths.push(...stdout.split('\n').filter(p => p.trim()));
      } catch (e) {
        console.log('[Trident Audit] Find error:', e);
      }
      
      for (const filePath of filePaths.slice(0, 100)) {
        try {
          const { stdout } = await execAsync(`cat "${filePath}"`, { timeout: 10000 });
          fileContents.set(filePath, stdout);
        } catch (e) {
          // Skip unreadable files
        }
      }
      
      console.log(`[Trident Audit] Files loaded: ${fileContents.size}`);
      
      const ctx: DetectorContext = {
        targetPath: target,
        filePaths,
        fileContents,
        containerImage: config.containerImage || 'opencode-python3:latest',
        buildCommand: config.buildCommand || 'npm run build',
        testCommand: config.testCommand || 'npm test'
      };
      
      const startLayer = depth >= 7 ? 0 : 1;
      const endLayer = depth;
      
      for (let layer = startLayer; layer <= endLayer; layer++) {
        console.log(`[Trident Audit] Running layer ${layer}: ${codeReviewMode.getLayerName(layer)}`);
        
        const findings = await runDetectorsForLayer(layer, ctx);
        
        for (const finding of findings) {
          codeReviewMode.addFinding(finding);
        }
        
        codeReviewMode.markLayerComplete(layer);
        
        console.log(`[Trident Audit] Layer ${layer} complete. Findings so far: ${codeReviewMode.getAllFindings().length}`);
      }
      
      const report = codeReviewMode.generateReport();
      
      const reportPath = `${target}/TRIDENT_CODE_REVIEW.md`;
      
      try {
        await execAsync(`cat > "${reportPath}" << 'TRIDENT_EOF'\n${report}\nTRIDENT_EOF`);
        console.log(`[Trident Audit] Report written to: ${reportPath}`);
      } catch (e) {
        console.log('[Trident Audit] Failed to write report:', e);
        return `[Trident Audit] Audit complete but failed to write report: ${e}\n\n${report}`;
      }
      
      return `

## TRIDENT AUDIT COMPLETE

**Target:** ${target}
**Depth:** ${depth}
**Findings:** ${codeReviewMode.getAllFindings().length}

| Severity | Count |
|----------|-------|
| CRITICAL | ${codeReviewMode.getCriticalCount()} |
| HIGH | ${codeReviewMode.getHighCount()} |
| MEDIUM | ${codeReviewMode.getMediumCount()} |
| LOW | ${codeReviewMode.getLowCount()} |
| INFO | ${codeReviewMode.getInfoCount()} |

**Report:** ${reportPath}

${codeReviewMode.getCriticalCount() > 0 ? '⚠️ CRITICAL ISSUES FOUND - Fix before deployment' : '✅ No critical issues'}

Run \`trident-report\` to see full findings.
`;
    }
  });

  const tridentStatus = tool({
    description: 'Show current Trident Brain status',
    args: {},
    async execute(args: any, context: ToolContext): Promise<string> {
      const mode = state.currentMode as ModeType || 'planning';
      const modeDef = coordinator.getModeDefinition(mode);
      const auditState = codeReviewMode.getState();
      
      return `## TRIDENT BRAIN STATUS

**Mode:** ${mode}
**Layer:** ${state.currentLayer}${modeDef ? ` / ${modeDef.maxLayer}` : ''}
**Iteration:** ${state.iteration}
**Target:** ${state.target || 'none'}
**Depth:** ${state.depth}

---

## TRIDENT COMMANDS

| Command | Description |
|---------|-------------|
| \`/audit\` or \`/audit this\` | Start comprehensive code audit |
| \`/audit <path>\` | Audit specific path |
| \`/audit --depth=7\` | Full 7-layer audit |
| \`/audit --depth=3\` | Quick 3-layer audit |

---

## AUDIT STATUS

**Audit State:** ${auditState.config.target ? 'Active' : 'Not started'}
**Report Path:** ${auditState.reportPath}
**Completed Layers:** ${auditState.completedLayers.join(', ') || 'None'}

**Findings:**
- CRITICAL: ${codeReviewMode.getCriticalCount()}
- HIGH: ${codeReviewMode.getHighCount()}
- MEDIUM: ${codeReviewMode.getMediumCount()}
- LOW: ${codeReviewMode.getLowCount()}
- INFO: ${codeReviewMode.getInfoCount()}
`;
    }
  });

  const tridentReport = tool({
    description: 'Get the full audit report',
    args: {
      format: tool.schema.string().optional().describe('Format: markdown (default) or json'),
      save: tool.schema.boolean().optional().describe('Save report to file'),
    },
    async execute(args: any, context: ToolContext): Promise<string> {
      if (state.currentMode !== 'code-review') {
        return 'No audit active. Run /audit first.';
      }

      if (args.format === 'json') {
        const findings = codeReviewMode.getAllFindings();
        return JSON.stringify({
          mode: 'code-review',
          iteration: codeReviewMode.getState().config.iteration,
          target: codeReviewMode.getState().config.target,
          summary: {
            critical: codeReviewMode.getCriticalCount(),
            high: codeReviewMode.getHighCount(),
            medium: codeReviewMode.getMediumCount(),
            low: codeReviewMode.getLowCount(),
            info: codeReviewMode.getInfoCount(),
            total: findings.length
          },
          findings
        }, null, 2);
      }

      const report = codeReviewMode.generateReport();
      
      if (args.save) {
        const reportPath = `${codeReviewMode.getState().config.target}/TRIDENT_CODE_REVIEW.md`;
        try {
          await execAsync(`cat > "${reportPath}" << 'TRIDENT_EOF'\n${report}\nTRIDENT_EOF`);
          console.log(`[Trident Report] Saved to: ${reportPath}`);
        } catch (e) {
          console.log('[Trident Report] Save error:', e);
        }
      }

      return report;
    }
  });

  const tridentGate = tool({
    description: 'Evaluate gate progress for current mode',
    args: {
      action: tool.schema.string().optional().describe('Action: status or advance'),
    },
    async execute(args: any, context: ToolContext): Promise<string> {
      const mode = state.currentMode as ModeType || 'planning';
      
      const modeDef = coordinator.getModeDefinition(mode);
      if (!modeDef) {
        return `Unknown mode: ${mode}`;
      }

      const requirements = modeDef.requirements.get(state.currentLayer) || [];
      const results = requirements.map(req => {
        const has = state.artifacts.has(req.name);
        return { name: req.name, description: req.description, valid: has };
      });

      const passed = results.filter(r => r.valid).length;
      const total = results.length;

      return `## GATE: ${mode.toUpperCase()}

**Layer:** ${state.currentLayer} / ${modeDef.maxLayer}
**Name:** ${modeDef.layerNames[state.currentLayer - 1] || 'N/A'}
**Progress:** ${passed}/${total} requirements met

${results.map(r => `- [${r.valid ? '✅' : '❌'}] ${r.description}`).join('\n')}

---

**Audit Findings:**
- CRITICAL: ${codeReviewMode.getCriticalCount()}
- HIGH: ${codeReviewMode.getHighCount()}
- MEDIUM: ${codeReviewMode.getMediumCount()}
`;
    }
  });

  const tridentFix = tool({
    description: 'Generate fix instructions for audit findings',
    args: {
      severity: tool.schema.string().optional().describe('Filter by severity: critical, high, medium, all'),
      format: tool.schema.string().optional().describe('Output format: markdown (default) or system_prompt'),
    },
    async execute(args: any, context: ToolContext): Promise<string> {
      if (state.currentMode !== 'code-review') {
        return 'No audit active. Run /audit first.';
      }

      const findings = codeReviewMode.getAllFindings();
      
      let filteredFindings = findings;
      if (args.severity && args.severity !== 'all') {
        filteredFindings = findings.filter((f: Finding) => 
          f.severity.toLowerCase() === args.severity.toLowerCase()
        );
      }

      const byFile: Record<string, Finding[]> = {};
      for (const f of filteredFindings) {
        if (!byFile[f.file]) byFile[f.file] = [];
        byFile[f.file].push(f);
      }

      if (args.format === 'system_prompt') {
        let prompt = `# FIX SYSTEM PROMPT

You are fixing code based on Trident Code Review findings.

TARGET: ${codeReviewMode.getState().config.target}
TOTAL ISSUES: ${filteredFindings.length}

RULES:
1. Fix CRITICAL issues immediately (before anything else)
2. Fix HIGH issues before next deployment
3. Run tests after each fix
4. Do NOT skip any findings

`;

        const critical = filteredFindings.filter((f: Finding) => f.severity === 'CRITICAL');
        const high = filteredFindings.filter((f: Finding) => f.severity === 'HIGH');
        const others = filteredFindings.filter((f: Finding) => f.severity !== 'CRITICAL' && f.severity !== 'HIGH');

        if (critical.length > 0) {
          prompt += `## CRITICAL ISSUES (Fix FIRST)\n\n`;
          critical.forEach((f: Finding, i: number) => {
            prompt += `${i + 1}. [CRITICAL] ${f.title}\n   File: ${f.file}${f.line ? `:${f.line}` : ''}\n   Fix: ${f.remediation}\n\n`;
          });
        }

        if (high.length > 0) {
          prompt += `## HIGH ISSUES\n\n`;
          high.forEach((f: Finding, i: number) => {
            prompt += `${i + 1}. [HIGH] ${f.title}\n   File: ${f.file}${f.line ? `:${f.line}` : ''}\n   Fix: ${f.remediation}\n\n`;
          });
        }

        if (others.length > 0) {
          prompt += `## OTHER ISSUES\n\n`;
          others.forEach((f: Finding, i: number) => {
            prompt += `${i + 1}. [${f.severity}] ${f.title}\n   File: ${f.file}${f.line ? `:${f.line}` : ''}\n   Fix: ${f.remediation}\n\n`;
          });
        }

        return prompt;
      }

      let output = `# FIX INSTRUCTIONS\n\n`;
      output += `Target: ${codeReviewMode.getState().config.target}\n`;
      output += `Issues: ${filteredFindings.length}\n\n`;

      for (const [file, fileFindings] of Object.entries(byFile)) {
        output += `## ${file}\n\n`;
        for (const f of fileFindings) {
          output += `### [${f.severity}] ${f.title}\n`;
          output += `Line: ${f.line || 'N/A'}\n`;
          output += `Evidence: \`${f.evidence.substring(0, 100)}\`\n`;
          output += `**Fix:** ${f.remediation}\n\n`;
        }
      }

      return output;
    }
  });

  return {
    'trident-status': tridentStatus,
    'trident-audit': audit,
    'trident-report': tridentReport,
    'trident-gate': tridentGate,
    'trident-fix': tridentFix,
  };
}
