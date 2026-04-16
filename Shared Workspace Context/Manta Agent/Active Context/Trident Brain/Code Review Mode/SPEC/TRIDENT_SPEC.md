# Code Review Mode — Specification

**Version:** 1.0.0  
**Date:** 2026-04-13  

---

## 1. Functional Requirements

### 1.1 Trigger System
- MUST respond to `/trident review <target>` command
- MUST parse target path from command
- MUST initialize Layer 1 on trigger

### 1.2 Layer Progression
- MUST complete each layer before advancing
- MUST collect evidence for each layer
- MUST generate findings for each detector
- MUST NOT skip layers

### 1.3 Detection Engine
- MUST implement all 25 detectors
- MUST return structured Finding objects
- MUST categorize by severity (BLOCKER/WARNING/SUGGESTION)
- MUST include file, line, evidence, remediation

### 1.4 Artifact Generation
- MUST generate injectable markdown
- MUST include executive summary
- MUST include all findings by layer
- MUST include remediation roadmap

---

## 2. Non-Functional Requirements

### 2.1 Performance
- SHOULD complete 5-layer analysis in <60 seconds for 100 files
- MUST NOT read same file twice in one review
- SHOULD use cached dependency graph

### 2.2 Accuracy
- MUST have <5% false positive rate
- MUST detect all simulated execution patterns
- MUST detect all hook spillover risks

### 2.3 Maintainability
- MUST be self-contained (no external dependencies)
- MUST have documented detector patterns
- MUST have clear severity classification

---

## 3. Interface Definitions

### 3.1 Finding Interface
```typescript
interface Finding {
  severity: 'BLOCKER' | 'WARNING' | 'SUGGESTION';
  category: string;
  layer: 1 | 2 | 3 | 4 | 5;
  file: string;
  line?: number;
  pattern: string;
  evidence: string;
  remediation: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### 3.2 Detector Interface
```typescript
interface Detector {
  name: string;
  layer: 1 | 2 | 3 | 4 | 5;
  patterns: RegExp[];
  detect(context: CodeReviewContext): Finding[];
}
```

### 3.3 CodeReviewContext Interface
```typescript
interface CodeReviewContext {
  targetPath: string;
  fileTree: FileNode[];
  dependencyGraph: Map<string, string[]>;
  fileContents: Map<string, string>;
  previousVersion?: {
    bundleSize: number;
    fileSizes: Map<string, number>;
  };
}
```

---

## 4. Detector Specifications

### 4.1 Layer 1: Structure Map

| Detector | Patterns | Severity |
|----------|----------|----------|
| BundleSizeDetector | Size diff >50% = WARNING, >80% = BLOCKER | WARNING/BLOCKER |
| DependencyGraphDetector | >10 imports = WARNING | WARNING |
| EntryPointDetector | Missing main/package.json | WARNING |
| FileSizeAnomalyDetector | >1000 lines = WARNING, >2000 = BLOCKER | WARNING/BLOCKER |

### 4.2 Layer 2: Execution Verification

| Detector | Patterns | Severity |
|----------|----------|----------|
| SimulatedExecutionDetector | `setTimeout.*resolve.*success` | BLOCKER |
| PlaceholderCommentDetector | `In v1.*simulate`, `Full implementation would` | WARNING |
| StubFunctionDetector | `return new Promise.*setTimeout` | BLOCKER |
| DeadCodeDetector | Never imported, never called | SUGGESTION |

### 4.3 Layer 3: Security Analysis

| Detector | Patterns | Severity |
|----------|----------|----------|
| SQLInjectionDetector | String concat in SQL | BLOCKER |
| XSSDetector | innerHTML, dangerouslySetInnerHTML | BLOCKER |
| CommandInjectionDetector | exec/spawn with shell strings | BLOCKER |
| EvalUsageDetector | eval(), Function() with input | BLOCKER |
| HardcodedSecretDetector | API keys, passwords in code | BLOCKER |
| PathTraversalDetector | User input in paths without validation | WARNING |

### 4.4 Layer 4: Architecture Analysis

| Detector | Patterns | Severity |
|----------|----------|----------|
| ImportCycleDetector | A→B→A imports | BLOCKER |
| HookSpilloverDetector | Missing `isXxxAgent()` checks | BLOCKER |
| GlobalStateDetector | Module-level globals | WARNING |
| AgentIsolationDetector | Hook fires for wrong agent | BLOCKER |
| ContextLeakDetector | Cross-plugin context bleed | WARNING |

### 4.5 Layer 5: Quality Analysis

| Detector | Patterns | Severity |
|----------|----------|----------|
| EmptyCatchBlockDetector | `catch {}` without logging | WARNING |
| SilentFailureDetector | Returns normally on error | WARNING |
| MemoryLeakDetector | Global state, uncleaned listeners | WARNING |
| TokenBloatDetector | Large tool outputs | WARNING |
| ComplexityHotspotDetector | Cyclomatic >10 | SUGGESTION |
| TestCoverageDetector | Missing tests for critical paths | WARNING |

---

## 5. Acceptance Criteria

### Must Pass
- [ ] `/trident review <path>` triggers analysis
- [ ] All 5 layers complete sequentially
- [ ] All 25 detectors return findings
- [ ] BLOCKER findings prevent gate advancement
- [ ] Injectable markdown artifact generated

### Should Pass
- [ ] <5% false positive rate
- [ ] Completes in <60 seconds for 100 files
- [ ] Detects simulated execution patterns
- [ ] Detects hook spillover risks

### Can Pass (Future)
- [ ] Auto-fix suggestions
- [ ] Git diff integration
- [ ] Real-time monitoring mode
