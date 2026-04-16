/**
 * Code Review Detectors - EXECUTION CAPABLE
 *
 * Detectors that run ACTUAL container tests, not just static analysis.
 * Each detector can execute commands and analyze real output.
 */
import type { Finding } from './index.js';
export interface DetectorContext {
    targetPath: string;
    filePaths: string[];
    fileContents: Map<string, string>;
    containerImage: string;
    buildCommand: string;
    testCommand: string;
}
export interface DetectorResult {
    findings: Finding[];
    passed: boolean;
    executionOutput?: string;
}
export declare const DETECTOR_PATTERNS: {
    simulatedExecution: RegExp[];
    placeholderComments: RegExp[];
    emptyCatch: RegExp[];
    sqlInjection: RegExp[];
    xss: RegExp[];
    secretExposure: RegExp[];
    hookSpillover: RegExp[];
    theatricalDelays: RegExp[];
};
export declare const BehavioralDetectors: {
    SimulatedExecutionDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    PlaceholderCommentDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    TheatricalDelayDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    BundleSizeAnomalyDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    EmptyCatchBlockDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    ModuleGlobalStateDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
};
export declare const ExecutionDetectors: {
    BuildTestDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    ContainerTestDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    StubFunctionDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
};
export declare const SecurityDetectors: {
    SQLInjectionDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    XSSDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    SecretExposureDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    AuthBypassDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
};
export declare const ArchitectureDetectors: {
    CircularDependencyDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    HookSpilloverDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    IsolationViolationDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
};
export declare const QualityDetectors: {
    ComplexityHotspotDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    EmptyCatchDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    MemoryLeakDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
};
export declare const IntegrationDetectors: {
    MissingDependencyDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
    DockerContainerDetector: (ctx: DetectorContext) => Promise<DetectorResult>;
};
export declare const ALL_DETECTORS: {
    0: (((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>))[];
    1: never[];
    2: (((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>))[];
    3: (((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>))[];
    4: (((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>))[];
    5: (((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>))[];
    6: (((ctx: DetectorContext) => Promise<DetectorResult>) | ((ctx: DetectorContext) => Promise<DetectorResult>))[];
};
export declare function runDetectorsForLayer(layer: number, ctx: DetectorContext): Promise<Finding[]>;
export declare function resetFindingIdCounter(startFrom?: number): void;
