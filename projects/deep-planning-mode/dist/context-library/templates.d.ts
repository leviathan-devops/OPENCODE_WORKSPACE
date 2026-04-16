/**
 * DEEP PLANNING MODE - Templates
 *
 * Reusable templates for plan generation, dependency graphs,
 * risk registers, and checkpoint timelines.
 */
export interface PlanTemplate {
    name: string;
    description: string;
    sections: string[];
    generate: (data: PlanData) => string;
}
export interface PlanData {
    task: string;
    requirements: string[];
    constraints: Constraint[];
    dependencies: Dependency[];
    risks: Risk[];
    checkpoints: Checkpoint[];
    steps: Step[];
}
export interface Constraint {
    type: 'time' | 'scope' | 'resource' | 'budget';
    value: string;
    hard: boolean;
}
export interface Dependency {
    id: string;
    name: string;
    type: 'file' | 'api' | 'service' | 'human';
    dependsOn: string[];
    blockedBy?: string[];
}
export interface Risk {
    id: string;
    description: string;
    probability: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    mitigation: string;
}
export interface Checkpoint {
    id: string;
    name: string;
    criteria: string[];
    time: string;
    owner: string;
}
export interface Step {
    id: string;
    name: string;
    description: string;
    time: string;
    owner: 'agent' | 'human' | 'system';
    criteria: string[];
    rollback: string;
    dependencies: string[];
}
export declare const PLAN_TEMPLATES: Record<string, PlanTemplate>;
export declare function getDefaultPlanData(task: string): PlanData;
export declare function createCheckpoint(id: string, name: string, criteria: string[], time: string, owner?: string): Checkpoint;
export declare function createStep(id: string, name: string, description: string, time: string, criteria: string[], rollback: string, dependencies?: string[], owner?: 'agent' | 'human' | 'system'): Step;
export declare function createRisk(description: string, probability: 'low' | 'medium' | 'high', impact: 'low' | 'medium' | 'high', mitigation: string): Risk;
export declare function createDependency(id: string, name: string, type: 'file' | 'api' | 'service' | 'human', dependsOn?: string[]): Dependency;
export declare function createConstraint(type: 'time' | 'scope' | 'resource' | 'budget', value: string, hard?: boolean): Constraint;
//# sourceMappingURL=templates.d.ts.map