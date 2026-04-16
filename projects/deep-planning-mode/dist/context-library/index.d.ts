/**
 * Deep Planning Mode - Context Library Index
 *
 * Central export point for patterns, lessons, and templates.
 */
export { SEVERITY, type Severity, type Finding, type ScanOptions, REQUIREMENT_PATTERNS, DEPENDENCY_PATTERNS, RISK_PATTERNS, CHECKPOINT_PATTERNS, CONSTRAINT_PATTERNS, scanWithPatterns, scanRequirements, scanConstraints, scanDeliverables, scanFileDependencies, scanAPIDependencies, scanServiceDependencies, scanHumanDependencies, scanRisks, scanCheckpoints, scanTimeConstraints, scanScopeConstraints, fullScan, } from './patterns';
export { LESSON_CATEGORIES, type LessonCategory, type Lesson, LESSONS, getLessonsByCategory, getLessonsBySeverity, getCriticalLessons, formatLessonChecklist, } from './lessons';
export { type PlanData, type Constraint, type Dependency, type Risk, type Checkpoint, type Step, type PlanTemplate, PLAN_TEMPLATES, getDefaultPlanData, createCheckpoint, createStep, createRisk, createDependency, createConstraint, } from './templates';
//# sourceMappingURL=index.d.ts.map