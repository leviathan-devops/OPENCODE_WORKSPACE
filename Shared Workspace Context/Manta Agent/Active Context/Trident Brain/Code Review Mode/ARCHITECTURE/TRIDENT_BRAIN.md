# Code Review Mode — Architecture

**Layer:** Trident Brain Mode  
**Version:** 1.0.0  

---

## Design Philosophy

Code Review Mode follows the same mechanical gate enforcement as other Trident Brain modes but specializes in **static analysis without execution**. It detects patterns that indicate architectural flaws, security vulnerabilities, and quality issues.

## Trigger

```
/trident review <target> [--depth=5] [--category=all]
```

## Gate Chain

```
plan → review → verify → audit → delivery
```

## Layer Pipeline

### Layer 1: Structure Map
**Question:** "What is the architecture?"

**Outputs:**
- File tree with size/bundle info
- Dependency graph
- Version diff vs previous

**Detectors:**
- BundleSizeDetector
- DependencyGraphDetector
- EntryPointDetector
- FileSizeAnomalyDetector

---

### Layer 2: Execution Verification
**Question:** "Does the code actually execute?"

**Outputs:**
- Placeholder patterns found
- Simulated execution detection
- Dead code identification

**Detectors:**
- SimulatedExecutionDetector
- PlaceholderCommentDetector
- StubFunctionDetector
- DeadCodeDetector

---

### Layer 3: Security Analysis
**Question:** "What vulnerabilities exist?"

**Outputs:**
- Vulnerability list with severity
- Injection vectors
- Secret exposures

**Detectors:**
- SQLInjectionDetector
- XSSDetector
- CommandInjectionDetector
- EvalUsageDetector
- HardcodedSecretDetector
- PathTraversalDetector

---

### Layer 4: Architecture Analysis
**Question:** "How do components interact?"

**Outputs:**
- Coupling map
- Hook spillover risks
- Import cycles

**Detectors:**
- ImportCycleDetector
- HookSpilloverDetector
- GlobalStateDetector
- AgentIsolationDetector
- ContextLeakDetector

---

### Layer 5: Quality Analysis
**Question:** "What are the resource implications?"

**Outputs:**
- Memory leak risks
- Error swallowing patterns
- Complexity hotspots

**Detectors:**
- EmptyCatchBlockDetector
- SilentFailureDetector
- MemoryLeakDetector
- TokenBloatDetector
- ComplexityHotspotDetector
- TestCoverageDetector

---

## Detector Registry (25 Total)

| Layer | Detector | Purpose |
|-------|----------|---------|
| 1 | BundleSizeDetector | >80% size reduction = BLOCKER |
| 1 | DependencyGraphDetector | Import coupling mapping |
| 1 | EntryPointDetector | Main/entry file identification |
| 1 | FileSizeAnomalyDetector | God files >1000 lines |
| 2 | SimulatedExecutionDetector | setTimeout.*resolve.*success |
| 2 | PlaceholderCommentDetector | "In v1, we just..." |
| 2 | StubFunctionDetector | Empty implementations |
| 2 | DeadCodeDetector | Unused functions |
| 3 | SQLInjectionDetector | SQL concatenation |
| 3 | XSSDetector | innerHTML, dangerouslySetInnerHTML |
| 3 | CommandInjectionDetector | exec() with shell strings |
| 3 | EvalUsageDetector | eval(), Function() |
| 3 | HardcodedSecretDetector | API keys, passwords |
| 3 | PathTraversalDetector | User input in paths |
| 4 | ImportCycleDetector | Circular imports |
| 4 | HookSpilloverDetector | Missing isXxxAgent() checks |
| 4 | GlobalStateDetector | Module-level globals |
| 4 | AgentIsolationDetector | Wrong agent hook firing |
| 4 | ContextLeakDetector | Cross-plugin context bleed |
| 5 | EmptyCatchBlockDetector | catch {} without logging |
| 5 | SilentFailureDetector | Returns normally on error |
| 5 | MemoryLeakDetector | Uncleaned listeners/globals |
| 5 | TokenBloatDetector | Large tool outputs |
| 5 | ComplexityHotspotDetector | Cyclomatic >10 |
| 5 | TestCoverageDetector | Missing test coverage |

---

## Pattern Library

```typescript
// Layer 2: Execution Verification
const SIMULATED_EXECUTION_PATTERNS = [
  /setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?resolve\s*\(\s*\{[^}]*success[^}]*\}/,
  /return\s+new\s+Promise\s*\(\s*resolve\s*=>\s*setTimeout/,
  /\/\/\s*In\s+v\d+.*?(simulate|fake|placeholder)/i,
  /\/\/\s*Full\s+implementation\s+would/,
];

// Layer 3: Security
const SQL_INJECTION_PATTERNS = [
  /['"`].*?SELECT.*?\+.*?['"`]/i,
  /['"`].*?INSERT.*?\+.*?['"`]/i,
];

const XSS_PATTERNS = [
  /\.innerHTML\s*=/,
  /dangerouslySetInnerHTML/,
];

const SECRET_PATTERNS = [
  /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9]{20,}/i,
  /password\s*[=:]\s*['"][^'"]{8,}/,
];

// Layer 4: Architecture
const GLOBAL_STATE_PATTERNS = [
  /^const\s+_[A-Z]\w*\s*=/m,
  /^let\s+_[A-Z]\w*\s*=/m,
];

// Layer 5: Quality
const EMPTY_CATCH_PATTERNS = [
  /catch\s*\(\s*\)\s*\{\s*\}/,
  /catch\s*\{\s*\}/,
];
```

---

## Severity Classification

| Severity | Meaning | Action |
|----------|---------|--------|
| **BLOCKER** | Critical issue | Must fix before delivery |
| **WARNING** | Significant issue | Should fix |
| **SUGGESTION** | Improvement | Consider fixing |

---

## Artifact Output

```markdown
# CODE REVIEW REPORT: {target}
**Generated:** {timestamp}
**Trident Brain v1.0 | Code Review Mode**

---

## EXECUTIVE SUMMARY
| Metric | Count |
|--------|-------|
| BLOCKERS | {n} |
| WARNINGS | {n} |
| SUGGESTIONS | {n} |

---

## CRITICAL FINDINGS
### BLOCKERS
1. **[Simulated Execution]** {file}:{line} - {desc}

---

*Generated by Trident Brain - Code Review Mode*
```
