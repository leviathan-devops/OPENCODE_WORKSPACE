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
export declare const REQUIREMENT_PATTERNS: {
    readonly FEATURE: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Explicit feature declaration";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "User expectation statement";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Stated user need";
    }, {
        readonly regex: RegExp;
        readonly severity: "LOW";
        readonly note: "User desire";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "User story format";
    }];
    readonly CONSTRAINT: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Hard constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Negative constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Negative constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Scope constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Time constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Budget constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Scale constraint";
    }];
    readonly DELIVERABLE: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Explicit deliverable";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Outcome statement";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Production statement";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Generation statement";
    }, {
        readonly regex: RegExp;
        readonly severity: "LOW";
        readonly note: "Creation statement";
    }];
};
export declare const DEPENDENCY_PATTERNS: {
    readonly FILE_DEP: readonly [{
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "Explicit file dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "ES6 import statement";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "CommonJS import";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "CommonJS require statement";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Python import";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "C/C++ include";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Class inheritance";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Interface implementation";
    }];
    readonly API_DEP: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Named API dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "API call statement";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "API reference";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Endpoint reference";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "HTTP method endpoint";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Base URL config";
    }];
    readonly SERVICE_DEP: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Named service dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Service usage";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Service connection";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Database dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Queue dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Cache dependency";
    }];
    readonly HUMAN_DEP: readonly [{
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Human dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Coordination needed";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Approval dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Team dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Input provider";
    }];
};
export declare const RISK_PATTERNS: {
    readonly FAILURE_MODE: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Stated failure possibility";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Stated failure possibility";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "Concurrency risk";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "Critical concurrency risk";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Resource leak risk";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "Critical resource risk";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Null reference risk";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Timeout risk";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "Critical data risk";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "Critical data risk";
    }];
    readonly BLOCKER: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Stated blocker";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Named blocker";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Pending dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "Critical circular dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "CRITICAL";
        readonly note: "Critical cyclic dependency";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Circular dependency reference";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Proceed blocker";
    }];
    readonly UNCERTAINTY: readonly [{
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Uncertainty flagged";
    }, {
        readonly regex: RegExp;
        readonly severity: "LOW";
        readonly note: "Minor uncertainty";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Potential requirement";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Potential requirement";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Unclear requirement";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Unresolved item";
    }, {
        readonly regex: RegExp;
        readonly severity: "LOW";
        readonly note: "TODO marker";
    }];
};
export declare const CHECKPOINT_PATTERNS: {
    readonly MILESTONE: readonly [{
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Explicit step header";
    }, {
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Timed substep";
    }, {
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Named item with description";
    }, {
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Checkpoint marker";
    }];
    readonly DELIVERABLE: readonly [{
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Unchecked deliverable";
    }, {
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Completed deliverable";
    }, {
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Alternate unchecked";
    }];
    readonly TIMELINE: readonly [{
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Hour estimate";
    }, {
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Day estimate";
    }, {
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Week reference";
    }, {
        readonly regex: RegExp;
        readonly severity: "INFO";
        readonly note: "Phase marker";
    }];
};
export declare const CONSTRAINT_PATTERNS: {
    readonly TIME: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Explicit deadline";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Due date statement";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Completion timeframe";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Within timeframe";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Time limit";
    }];
    readonly SCOPE: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Explicit scope";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "In-scope items";
    }, {
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Out-of-scope items";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Excluded items";
    }];
    readonly RESOURCE: readonly [{
        readonly regex: RegExp;
        readonly severity: "HIGH";
        readonly note: "Budget constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Resource constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Team size constraint";
    }, {
        readonly regex: RegExp;
        readonly severity: "MEDIUM";
        readonly note: "Scale constraint";
    }];
};
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
export declare function scanWithPatterns(content: string, patterns: readonly {
    regex: RegExp;
    severity: string;
    note?: string;
}[], category: string, options?: ScanOptions): Finding[];
export declare function scanRequirements(content: string, options?: ScanOptions): Finding[];
export declare function scanConstraints(content: string, options?: ScanOptions): Finding[];
export declare function scanDeliverables(content: string, options?: ScanOptions): Finding[];
export declare function scanFileDependencies(content: string, options?: ScanOptions): Finding[];
export declare function scanAPIDependencies(content: string, options?: ScanOptions): Finding[];
export declare function scanServiceDependencies(content: string, options?: ScanOptions): Finding[];
export declare function scanHumanDependencies(content: string, options?: ScanOptions): Finding[];
export declare function scanRisks(content: string, options?: ScanOptions): Finding[];
export declare function scanCheckpoints(content: string, options?: ScanOptions): Finding[];
export declare function scanTimeConstraints(content: string, options?: ScanOptions): Finding[];
export declare function scanScopeConstraints(content: string, options?: ScanOptions): Finding[];
/**
 * Full scan - all pattern categories
 */
export declare function fullScan(content: string, options?: ScanOptions): Finding[];
//# sourceMappingURL=patterns.d.ts.map