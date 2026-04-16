/**
 * DEEP PLANNING MODE - Planning Core
 *
 * Core planning logic including dependency graph analysis,
 * risk calculation, and plan verification.
 */
import { Finding, Dependency, Risk, PlanData } from '../context-library/types';
export interface DependencyNode {
    id: string;
    name: string;
    type: string;
    dependsOn: string[];
    dependents: string[];
    depth: number;
    isCircular: boolean;
}
export interface CycleInfo {
    nodes: string[];
    type: 'direct' | 'indirect';
}
export interface RiskScore {
    risk: Risk;
    score: number;
    rating: 'low' | 'medium' | 'high' | 'critical';
}
export declare class DependencyGraph {
    private nodes;
    private cycles;
    constructor(dependencies: Dependency[]);
    private buildGraph;
    private calculateDepths;
    private detectCycles;
    getNodes(): DependencyNode[];
    getCycles(): CycleInfo[];
    hasCycles(): boolean;
    getMaxDepth(): number;
    getRootNodes(): DependencyNode[];
    getLeafNodes(): DependencyNode[];
    topologicalSort(): string[] | null;
}
export declare function calculateRiskScore(risk: Risk): RiskScore;
export declare function sortRisksByScore(risks: Risk[]): RiskScore[];
export declare function validatePlanCompleteness(plan: PlanData): {
    valid: boolean;
    issues: string[];
};
export declare function estimatePlanHours(plan: PlanData): number;
export declare function extractContextFromFindings(findings: Finding[]): string;
export declare function buildContextFromUserMessage(message: string): {
    requirements: string[];
    constraints: string[];
    risks: string[];
    dependencies: string[];
};
//# sourceMappingURL=planning-core.d.ts.map