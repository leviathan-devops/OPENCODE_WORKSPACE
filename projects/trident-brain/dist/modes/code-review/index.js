/**
 * Code Review Mode - AUDIT MODE
 *
 * 7-layer execution-capable code audit.
 */
export class CodeReviewMode {
    name = 'Code Review Mode - AUDIT';
    version = '3.0.0';
    state;
    findings = [];
    findingIdCounter = 1;
    constructor() {
        this.state = this.createInitialState();
    }
    createInitialState() {
        return {
            config: {
                target: '',
                depth: 7,
                iteration: 'V1.0',
                containerImage: 'opencode-python3:latest',
                testCommand: 'npm test',
                buildCommand: 'npm run build',
                entryPoint: './src'
            },
            currentLayer: 0,
            startedAt: new Date(),
            completedLayers: [],
            allFindings: [],
            reportGenerated: false,
            reportPath: 'TRIDENT_CODE_REVIEW.md'
        };
    }
    getLayerName(layer) {
        const layers = {
            0: 'Behavioral Detection (Derailment Check)',
            1: 'Structure Analysis',
            2: 'Execution Verification (Container Tests)',
            3: 'Security Analysis (SAST)',
            4: 'Architecture Analysis',
            5: 'Quality Analysis',
            6: 'Integration Verification (Docker Tests)'
        };
        return layers[layer] || 'Unknown';
    }
    getAllLayers() {
        return [0, 1, 2, 3, 4, 5, 6];
    }
    startAudit(config) {
        this.state.config = { ...this.state.config, ...config };
        this.state.currentLayer = 0;
        this.state.startedAt = new Date();
        this.state.completedLayers = [];
        this.state.allFindings = [];
        this.state.reportGenerated = false;
        this.findings = [];
        this.findingIdCounter = 1;
        console.log(`[Trident Audit] Starting audit of ${config.target}`);
        console.log(`[Trident Audit] Depth: ${config.depth}, Image: ${config.containerImage}`);
    }
    getState() {
        return { ...this.state };
    }
    getConfig() {
        return { ...this.state.config };
    }
    addFinding(finding) {
        const id = `AUDIT-${this.findingIdCounter++}`;
        const fullFinding = { id, ...finding };
        this.findings.push(fullFinding);
        this.state.allFindings.push(fullFinding);
        return fullFinding;
    }
    getAllFindings() {
        return [...this.findings];
    }
    getFindingsBySeverity(severity) {
        return this.findings.filter(f => f.severity === severity);
    }
    getFindingsByLayer(layer) {
        return this.findings.filter(f => f.layer === layer);
    }
    getCriticalCount() {
        return this.findings.filter(f => f.severity === 'CRITICAL').length;
    }
    getHighCount() {
        return this.findings.filter(f => f.severity === 'HIGH').length;
    }
    getMediumCount() {
        return this.findings.filter(f => f.severity === 'MEDIUM').length;
    }
    getLowCount() {
        return this.findings.filter(f => f.severity === 'LOW').length;
    }
    getInfoCount() {
        return this.findings.filter(f => f.severity === 'INFO').length;
    }
    markLayerComplete(layer) {
        if (!this.state.completedLayers.includes(layer)) {
            this.state.completedLayers.push(layer);
        }
        this.state.currentLayer = layer + 1;
        console.log(`[Trident Audit] Layer ${layer} complete. Total findings: ${this.findings.length}`);
    }
    isLayerComplete(layer) {
        return this.state.completedLayers.includes(layer);
    }
    canAdvanceToLayer(layer) {
        if (layer === 0)
            return true;
        for (let l = 0; l < layer; l++) {
            if (!this.isLayerComplete(l)) {
                return false;
            }
        }
        return true;
    }
    generateReport() {
        this.state.reportGenerated = true;
        const duration = Date.now() - this.state.startedAt.getTime();
        const durationStr = `${Math.round(duration / 1000)}s`;
        const critical = this.getCriticalCount();
        const high = this.getHighCount();
        const medium = this.getMediumCount();
        const low = this.getLowCount();
        const info = this.getInfoCount();
        const total = critical + high + medium + low + info;
        const passStatus = critical === 0 && high === 0 ? '✅ PASSED' : '❌ FAILED';
        let report = `# TRIDENT CODE REVIEW — AUDIT REPORT

**Target:** ${this.state.config.target}
**Date:** ${this.state.startedAt.toISOString()}
**Duration:** ${durationStr}
**Iteration:** ${this.state.config.iteration}
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
| **TOTAL** | **${total}** | |

**Container Image:** ${this.state.config.containerImage}
**Build Command:** ${this.state.config.buildCommand}
**Test Command:** ${this.state.config.testCommand}

---

## FINDINGS BY LAYER

`;
        for (const layer of this.getAllLayers()) {
            const layerFindings = this.getFindingsByLayer(layer);
            if (layerFindings.length === 0)
                continue;
            const layerName = this.getLayerName(layer);
            report += `### Layer ${layer}: ${layerName}\n\n`;
            for (const finding of layerFindings) {
                const severityIcon = {
                    'CRITICAL': '🚨',
                    'HIGH': '⚠️',
                    'MEDIUM': '⚡',
                    'LOW': '📝',
                    'INFO': 'ℹ️'
                };
                report += `#### ${severityIcon[finding.severity]} [${finding.id}] ${finding.title}\n`;
                report += `**Severity:** ${finding.severity}\n`;
                report += `**Category:** ${finding.category}\n`;
                report += `**Detector:** ${finding.detector}\n`;
                report += `**File:** ${finding.file}${finding.line ? `:${finding.line}` : ''}\n`;
                report += `**Evidence Type:** ${finding.evidenceType}\n`;
                if (finding.commandExecuted) {
                    report += `**Command Executed:**\n\`\`\`bash\n${finding.commandExecuted}\n\`\`\`\n`;
                    report += `**Command Output:**\n\`\`\`\n${finding.commandOutput || '(no output)'}\n\`\`\`\n`;
                }
                report += `**Evidence:** \`${finding.evidence}\`\n`;
                report += `**Remediation:**\n${finding.remediation}\n\n`;
                report += `---\n\n`;
            }
        }
        report += `

---

## DETAILED AUDIT CHAIN

### Layer 0: Behavioral Detection (Derailment Check)
${this.isLayerComplete(0) ? '✅ Complete' : '⏳ Pending'}
- Checks for: Simulated execution, placeholder code, theatrical delays
- Evidence: ${this.getFindingsByLayer(0).length} findings

### Layer 1: Structure Analysis
${this.isLayerComplete(1) ? '✅ Complete' : '⏳ Pending'}
- Checks for: Bundle size, entry points, dependency graph
- Evidence: ${this.getFindingsByLayer(1).length} findings

### Layer 2: Execution Verification (Container Tests)
${this.isLayerComplete(2) ? '✅ Complete' : '⏳ Pending'}
- Runs: Actual container tests to verify real execution
- Evidence: ${this.getFindingsByLayer(2).length} findings

### Layer 3: Security Analysis (SAST)
${this.isLayerComplete(3) ? '✅ Complete' : '⏳ Pending'}
- Checks for: SQL injection, XSS, secret exposure, auth bypass
- Evidence: ${this.getFindingsByLayer(3).length} findings

### Layer 4: Architecture Analysis
${this.isLayerComplete(4) ? '✅ Complete' : '⏳ Pending'}
- Checks for: Circular deps, hook spillover, isolation violations
- Evidence: ${this.getFindingsByLayer(4).length} findings

### Layer 5: Quality Analysis
${this.isLayerComplete(5) ? '✅ Complete' : '⏳ Pending'}
- Checks for: Complexity hotspots, empty catch blocks, resource leaks
- Evidence: ${this.getFindingsByLayer(5).length} findings

### Layer 6: Integration Verification (Docker Tests)
${this.isLayerComplete(6) ? '✅ Complete' : '⏳ Pending'}
- Runs: Docker-based integration tests
- Evidence: ${this.getFindingsByLayer(6).length} findings

---

## SYSTEM PROMPT FOR FIXING

Copy this system prompt to fix the issues:

\`\`\`
You are fixing code based on Trident Code Review findings.

TARGET: ${this.state.config.target}
CRITICAL ISSUES: ${critical}
HIGH ISSUES: ${high}

RULES:
1. Fix CRITICAL issues immediately
2. Fix HIGH issues before next deployment
3. Run tests after each fix
4. Do NOT skip any findings

STEPS:
${this.findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').map((f, i) => `${i + 1}. [${f.severity}] ${f.title}
   File: ${f.file}${f.line ? `:${f.line}` : ''}
   Fix: ${f.remediation}`).join('\n')}
\`\`\`

---

## DEBUG LOG

**Audit Started:** ${this.state.startedAt.toISOString()}
**Audit Duration:** ${durationStr}
**Container Image Used:** ${this.state.config.containerImage}
**Files Analyzed:** ${this.state.config.target}

**All Findings:**
${this.findings.map(f => `- [${f.severity}] ${f.id}: ${f.title} (${f.detector})`).join('\n')}

---

*Generated by Trident Brain — Code Review Mode v3.0.0*
*TRIDENT AUDIT — Mechanical Enforcement Layer*
`;
        return report;
    }
    getReportPath() {
        return this.state.reportPath;
    }
    reset() {
        this.state = this.createInitialState();
        this.findings = [];
        this.findingIdCounter = 1;
    }
}
export default CodeReviewMode;
