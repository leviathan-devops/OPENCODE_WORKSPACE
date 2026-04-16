/**
 * TRIDENT BRAIN - ALGORITHMIC PLUGIN v3.0
 *
 * Clean implementation - no theatrical code
 *
 * v3.0 CHANGES:
 * - Removed THEATRICAL setTimeout simulation
 * - Hook returns immediately, audit runs async
 * - Clean async/await, no fake delays
 */
import { auditEngine, reportGenerator } from './algorithmic-core.js';
const state = {
    mode: 'idle',
    target: '',
    artifacts: new Map(),
    lastFindings: []
};
async function runAudit(target) {
    try {
        auditEngine.startAudit({
            targetPath: target,
            depth: 7
        });
        const files = await auditEngine.scanDirectory(target);
        if (files.size === 0) {
            return `No files found in ${target}`;
        }
        const scanner = auditEngine.getScanner();
        let scanned = 0;
        for (const [filePath, content] of files) {
            try {
                scanner.scanFile(filePath, content);
                scanned++;
            }
            catch (e) {
                // Skip failed files
            }
        }
        for (let i = 0; i <= 6; i++) {
            auditEngine.completeLayer(i);
        }
        auditEngine.complete();
        const findings = scanner.getFindings();
        state.lastFindings = findings;
        state.lastAuditTarget = target;
        const report = reportGenerator.generate(() => 'AUDIT-1', (layer) => findings.filter(f => f.layer === layer), auditEngine.getState());
        state.artifacts.set('TRIDENT_CODE_REVIEW.md', report);
        return `AUDIT COMPLETE\nFiles: ${scanned}\nFindings: ${findings.length}`;
    }
    catch (error) {
        return `AUDIT ERROR: ${error.message}`;
    }
}
export default async function TridentBrainPlugin(input) {
    return {
        'chat.message': async (input, output) => {
            if (input.agent !== 'trident')
                return;
            const message = input.message || '';
            if (message.includes('audit')) {
                const match = message.match(/\/[\/\.\~\w-]+/);
                const target = match ? match[0] : '/tmp';
                output.parts = [{ type: 'text', text: `AUDIT STARTED ${target}` }];
                runAudit(target).then(result => {
                    output.parts = [{ type: 'text', text: result }];
                });
                return;
            }
            output.parts = [{ type: 'text', text: 'TRIDENT OK' }];
        }
    };
}
//# sourceMappingURL=index.js.map