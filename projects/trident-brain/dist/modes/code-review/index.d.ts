/**
 * Code Review Mode - AUDIT MODE
 *
 * 7-layer execution-capable code audit.
 */
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export interface Finding {
    id: string;
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
export interface AuditConfig {
    target: string;
    depth: number;
    iteration: string;
    containerImage?: string;
    testCommand?: string;
    buildCommand?: string;
    entryPoint?: string;
}
export interface AuditState {
    config: AuditConfig;
    currentLayer: number;
    startedAt: Date;
    completedLayers: number[];
    allFindings: Finding[];
    reportGenerated: boolean;
    reportPath: string;
}
export declare class CodeReviewMode {
    name: string;
    version: string;
    private state;
    private findings;
    private findingIdCounter;
    constructor();
    private createInitialState;
    getLayerName(layer: number): string;
    getAllLayers(): number[];
    startAudit(config: AuditConfig): void;
    getState(): AuditState;
    getConfig(): AuditConfig;
    addFinding(finding: Omit<Finding, 'id'>): Finding;
    getAllFindings(): Finding[];
    getFindingsBySeverity(severity: Severity): Finding[];
    getFindingsByLayer(layer: number): Finding[];
    getCriticalCount(): number;
    getHighCount(): number;
    getMediumCount(): number;
    getLowCount(): number;
    getInfoCount(): number;
    markLayerComplete(layer: number): void;
    isLayerComplete(layer: number): boolean;
    canAdvanceToLayer(layer: number): boolean;
    generateReport(): string;
    getReportPath(): string;
    reset(): void;
}
export default CodeReviewMode;
