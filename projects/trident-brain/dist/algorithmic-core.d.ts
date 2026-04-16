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
export declare const SEVERITY: {
    readonly CRITICAL: "CRITICAL";
    readonly HIGH: "HIGH";
    readonly MEDIUM: "MEDIUM";
    readonly LOW: "LOW";
    readonly INFO: "INFO";
};
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
export declare const PATTERNS: {
    readonly SIMULATED_EXECUTION: readonly [{
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "100ms theatrical delay";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }];
    readonly THEATRICAL_CODE: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }];
    readonly STUB_CODE: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }];
    readonly SQL_INJECTION: readonly [{
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }];
    readonly XSS: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
    }];
    readonly SECRET_EXPOSURE: readonly [{
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }];
    readonly AUTH_BYPASS: readonly [{
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
    }];
    readonly EMPTY_CATCH: readonly [{
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
    }];
    readonly HOOK_SPILLOVER: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
    }];
    readonly GLOBAL_STATE: readonly [{
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
    }, {
        readonly regex: RegExp;
        readonly severity: "LOW";
    }];
    readonly COMPLEXITY: readonly [{
        readonly regex: RegExp;
        readonly threshold: 10;
        readonly severity: "MEDIUM";
    }, {
        readonly regex: RegExp;
        readonly threshold: 5;
        readonly severity: "MEDIUM";
    }, {
        readonly regex: RegExp;
        readonly threshold: 3;
        readonly severity: "MEDIUM";
    }];
    readonly RESOURCE_LEAK: readonly [{
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
    }];
};
export declare class AlgorithmicScanner {
    private findingId;
    private findings;
    reset(): void;
    scanFile(filePath: string, content: string): Finding[];
    private scanPatterns;
    private scanComplexity;
    private scanResourceLeaks;
    private createFinding;
    private getDetectorName;
    private generateTitle;
    private generateRemediation;
    getFindings(): Finding[];
    addFinding(finding: Finding): void;
    addFindings(findings: Finding[]): void;
}
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
export declare class AuditEngine {
    private state;
    private scanner;
    constructor();
    private createInitialState;
    getState(): AuditState;
    getScanner(): AlgorithmicScanner;
    startAudit(config: AuditConfig): void;
    scanDirectory(targetPath: string): Promise<Map<string, string>>;
    runBuildTest(targetPath: string): Promise<{
        success: boolean;
        output: string;
    }>;
    runTestSuite(targetPath: string): Promise<{
        success: boolean;
        output: string;
        passing?: number;
        failing?: number;
    }>;
    completeLayer(layer: number): void;
    complete(): void;
}
export declare class ReportGenerator {
    generate(findingId: (layer: number) => string, getFindingsByLayer: (layer: number) => Finding[], state: AuditState): string;
    private collectAllFindings;
}
export interface ParsedCommand {
    command: 'audit' | 'status' | 'report' | 'fix' | 'reset' | 'unknown';
    target?: string;
    depth?: number;
    severity?: string;
    format?: string;
}
export declare class CommandParser {
    private static readonly AUDIT_PATTERNS;
    private static readonly TRIDENT_REVIEW_PATTERNS;
    parse(message: string): ParsedCommand;
}
export declare const auditEngine: AuditEngine;
export declare const reportGenerator: ReportGenerator;
export declare const commandParser: CommandParser;
