# Testing Workflows — Shark Agent v4.8.3

## Testing Philosophy

Shark Agent requires **mechanical proof** not text matching. Testing must verify:
1. Code actually runs (not just "syntax checks")
2. Output matches expected behavior
3. Evidence files are generated and valid

## Container Testing (REQUIRED for Ship Gate)

### Correct Container Test Command

```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && /usr/local/lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode run 'shark-status' --agent shark"
```

### What Container Test Verifies

1. Plugin loads correctly in isolated environment
2. Brain initialization works (`brain: shark`)
3. Guardian hooks fire properly
4. No local file leakage

### Expected Output

```
[Agent State] BRAIN INITIALIZED: setCurrentAgent("shark")
**Brain** | execution, reasoning, system |
**Current Gate** | plan |
```

## Host Testing (Limited)

Host testing can verify basic functionality but CANNOT substitute for container testing:
- Host = local machine with local files
- Container = isolated environment
- **Host passing ≠ Container passing**

## shark-test-runner Tool

Location: `src/tools/shark-runner.ts`

### Test Suite Structure

```typescript
interface TestResult {
  name: string;
  passed: boolean;
  output?: string;
  error?: string;
}

interface TestSuiteResult {
  suite: string;
  timestamp: number;
  buildId: string;
  tests: TestResult[];
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;  // CRITICAL: L5.2/L5.4 require >= 0.96
}
```

### Evidence File Schema

```json
{
  "suite": "shark-agent-v4",
  "timestamp": 1712860800000,
  "buildId": "shark-v4.7-2026-04-11T12:00:00",
  "tests": [...],
  "overallPassed": true,
  "totalTests": 5,
  "passedTests": 5,
  "failedTests": 0,
  "passRate": 1.0
}
```

**Path:** `.shark/evidence/delivery/ContainerTestResult.json`

## Gate Evidence Requirements

| Gate | Evidence Required |
|------|-------------------|
| plan | SPEC.md, GuardianConfig.json |
| build | FileManifest.json, GitDiff.txt |
| test | TestResults.xml, CoverageReport.json |
| verify | VerificationReport.json |
| audit | SASTReport.json, SecretsScan.json, AuditReport.json |
| delivery | EvidenceArchive.zip, DeliverySummary.md, **ContainerTestResult.json** |

## Evidence Collection Hook

Located in `gate-hook.ts`, the `tool.execute.after` hook collects evidence:

```typescript
if (tool === 'shark-test-runner') {
  const testResult = parseTestRunnerResult(result);
  if (testResult) {
    const evidencePath = path.join(
      process.cwd(),
      '.shark',
      'evidence',
      currentGate,
      CONTAINER_TEST_RESULT_FILE
    );
    // Write evidence file
  }
}
```

## L5.2/L5.4 Evidence Gating

These layers require mechanical evidence before allowing claims:

```typescript
// L5.2: If agent claims "it works", require evidence
if (SUCCESS_CLAIM_PATTERNS.some(p => p.test(textToCheck))) {
  if (!hasContainerTestEvidence()) {
    throw new Error(`[L5.2] Success claim without mechanical proof.`);
  }
}

// L5.4: If agent tries to use mock/stub, require evidence  
if (MOCK_STUB_PATTERNS.some(p => p.test(textToCheck))) {
  if (!hasContainerTestEvidence()) {
    throw new Error(`[L5.4] Mock/stub without mechanical proof.`);
  }
}
```

## Testing Workflow (Step by Step)

### 1. Build the Plugin
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

### 2. Deploy to OpenCode Plugins
```bash
cp dist/index.js ~/.config/opencode/plugins/shark-agent-v4/dist/
```

### 3. Run Host Test
```bash
opencode run "shark-status" --agent shark
```

### 4. Run Container Test
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'shark-status' --agent shark"
```

### 5. Run Full Test Suite
```bash
opencode run "shark-test-runner" --agent shark
```

### 6. Check Evidence Collection
```bash
cat .shark/evidence/delivery/ContainerTestResult.json
```

## Testing Anti-Patterns (BLOCKED)

1. **Counting theater:** `grep -r pattern src/ | wc -l`
2. **File existence:** `test -f dist/index.js`
3. **Syntax only:** `node --check file.js`
4. **Mock verification:** "The file looks valid to me"

## Test Coverage Requirements

- **Minimum pass rate:** 96% (0.96)
- **Required evidence:** ContainerTestResult.json with valid schema
- **No weak assertions:** `toBeTruthy()` banned in tests

## Version Compatibility Note

**⚠️ KNOWN ISSUE:** Container `ghcr.io/anomalyco/opencode:latest` is version **1.3.17**, local is **1.4.2**
- Container `run` command is broken in 1.3.17
- Container opencode is NOT on npm registry
- Must use local installation for testing
