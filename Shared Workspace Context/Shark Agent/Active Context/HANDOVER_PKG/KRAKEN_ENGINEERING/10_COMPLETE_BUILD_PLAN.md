# COMPLETE BUILD PLAN — System Brain Firewall L0-L8

## Build Philosophy

> *"Algorithmic-First: If a human can write a rule, write the rule. Reserve models for what rules literally cannot do."*

Every layer follows this pattern:
1. **Define problem mechanically** — Can I write a rule?
2. **Implement as pure algorithm** — Regex, state checks, evidence files
3. **Test with specific cases** — Not "seems right" but exact matches

---

## PHASE 0: Preparation

### 0.1: Read Context Files
- [ ] `00_INDEX.md` — Entry point
- [ ] `01_ARCHITECTURE_OVERVIEW.md` — System structure
- [ ] `02_CURRENT_STATE.md` — What works, what's missing
- [ ] `03_PATTERNS_REFERENCE.md` — All 170+ patterns
- [ ] `04_IMPLEMENTATION_GUIDE.md` — Code patterns
- [ ] `05_TESTING_WORKFLOWS.md` — How to test
- [ ] `06_V4.7_HOTFIX_INTEGRATION.md` — Preserve memory optimizations
- [ ] `08_SUCCESS_CRITERIA.md` — Ship requirements
- [ ] `09_FULL_LAYER_BUILD_SPEC.md` — Complete layer specifications

### 0.2: Source Files to Read
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/hooks/v4.1/guardian-hook.ts` — Current state
- `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/src/hooks/v4.1/guardian-hook.ts` — Reference
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/shared/guardian.ts` — Guardian class
- `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src/tools/shark-test-runner.ts` — Test runner

### 0.3: Build Environment
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

---

## PHASE 1: L0 Identity Wall

### 1.1: Understand Current State
L0 already exists in `guardian-hook.ts`:
```typescript
if (!getCurrentAgent()) {
  return; // Vanilla agents bypassed
}
```

### 1.2: Implementation
Verify it works, add BRAIN_FAILURE_BLOCK for dangerous tools:
```typescript
function checkL0IdentityWall(tool: string): void {
  const DANGEROUS_TOOLS = new Set([
    'terminal', 'mcp_terminal',
    'write_file', 'mcp_write_file',
    'patch', 'mcp_patch',
    'edit', 'mcp_edit',
  ]);

  if (!DANGEROUS_TOOLS.has(tool)) return;

  if (!getCurrentAgent()) {
    throw new Error(
      `[BRAIN_FAILURE_BLOCK] Cannot execute "${tool}" when system brain is uninitialized. ` +
      `Current state: undefined. Required: shark.`
    );
  }
}
```

### 1.3: Test Commands
```bash
# Should BLOCK (brain undefined)
opencode run "terminal" --agent vanilla
opencode run "write_file" --agent vanilla

# Should ALLOW (brain set)
opencode run "shark-status" --agent shark
```

### 1.4: Acceptance Criteria
- [ ] Terminal blocked when brain undefined
- [ ] write_file blocked when brain undefined
- [ ] read_file allowed when brain undefined
- [ ] shark-status allowed when brain undefined
- [ ] shark tools allowed when brain set to shark

---

## PHASE 2: L1 Theatrical Verification

### 2.1: Implementation
Add 18 THEATRICAL_PATTERNS + LEGITIMATE_PATTERNS to guardian-hook.ts.

### 2.2: Test Commands
```bash
# BLOCK (counting theater)
opencode run "grep pattern src/ | wc -l" --agent shark
opencode run "cat file.txt | grep test" --agent shark
opencode run "wc -l dist/index.js" --agent shark

# ALLOW (legitimate operations)
opencode run "grep -r pattern src/" --agent shark
opencode run "cat src/file.ts" --agent shark
opencode run "mkdir -p src/components" --agent shark
```

### 2.3: Acceptance Criteria
- [ ] Pipe to wc blocked
- [ ] cat | grep blocked
- [ ] wc -l dist/ blocked
- [ ] grep -r allowed
- [ ] cat file.txt (no pipe) allowed
- [ ] mkdir allowed

---

## PHASE 3: L2 Fake Test Runner

### 3.1: Implementation
Add 13 FAKE_TEST_PATTERNS + LEGITIMATE_TEST to guardian-hook.ts.

### 3.2: Test Commands
```bash
# BLOCK (fake test runners)
opencode run "npm test" --agent shark
opencode run "jest" --agent shark
opencode run "pytest" --agent shark

# ALLOW (shark's own test runner)
opencode run "shark-test-runner" --agent shark
```

### 3.3: Acceptance Criteria
- [ ] npm test blocked
- [ ] jest blocked
- [ ] pytest blocked
- [ ] shark-test-runner allowed

---

## PHASE 4: L3 Source Inspection

### 4.1: Implementation
Add 12 SOURCE_INSPECTION_PATTERNS + LEGITIMATE_SOURCE_OPS.

### 4.2: Test Commands
```bash
# BLOCK (file existence as proof)
opencode run "test -f dist/index.js" --agent shark
opencode run "if [ -f file ]; then echo yes; fi" --agent shark
opencode run "ls dist/" --agent shark

# ALLOW (actual operations)
opencode run "tsc --noEmit" --agent shark
opencode run "cat src/file.ts" --agent shark
```

### 4.3: Acceptance Criteria
- [ ] test -f blocked
- [ ] if [ -f ] blocked
- [ ] ls dist/ blocked
- [ ] tsc --noEmit allowed
- [ ] cat src/file.ts allowed

---

## PHASE 5: L4 Wrong Container

### 5.1: Implementation
Add 5 WRONG_CONTAINER_PATTERNS.

### 5.2: Test Commands
```bash
# BLOCK (hallucinated commands)
opencode run "opencode container run" --agent shark
opencode run "opencode container start" --agent shark

# ALLOW (correct docker usage)
docker run --rm -v "$HOME/.config/opencode:/root/.config/opencode" opencode-test:1.4.3 \
  --entrypoint /bin/bash -c "cd /root && opencode run 'shark-status' --agent shark"
```

### 5.3: Acceptance Criteria
- [ ] opencode container run blocked
- [ ] opencode container start blocked
- [ ] docker run ... opencode allowed

---

## PHASE 6: L5.1-L5.2 Host Fallback + Success Claim

### 6.1: Implementation
Add 13 HOST_FALLBACK_PATTERNS + 16 SUCCESS_CLAIM_PATTERNS + evidence gating.

### 6.2: Evidence Function
```typescript
function hasContainerTestEvidence(): boolean {
  const path = '.shark/evidence/delivery/ContainerTestResult.json';
  if (!fs.existsSync(path)) return false;
  const result = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return result.overallPassed && result.passRate >= 0.96;
}
```

### 6.3: Test Commands
```bash
# BLOCK (host fallback, no evidence)
opencode run "skip container test" --agent shark

# BLOCK (success claim, no evidence)
opencode run "it works trust me" --agent shark

# ALLOW (success claim, WITH evidence)
# First: create evidence file
cat > .shark/evidence/delivery/ContainerTestResult.json << 'EOF'
{
  "suite": "shark-agent-v4",
  "overallPassed": true,
  "passRate": 1.0
}
EOF
opencode run "it works trust me" --agent shark
```

### 6.4: Acceptance Criteria
- [ ] Host fallback blocked without evidence
- [ ] Success claim blocked without evidence
- [ ] Success claim allowed WITH evidence file

---

## PHASE 7: L5.3-L5.5 Model Restriction + Mock/Stub + Simplification

### 7.1: Implementation
Add 15 BANNED_MODEL_PATTERNS, 12 MOCK_STUB_PATTERNS, 11 SIMPLIFICATION_PATTERNS.

### 7.2: Test Commands
```bash
# BLOCK (model restriction)
opencode run "use GLM instead" --agent shark

# BLOCK (mock/stub, no evidence)
opencode run "just verify syntax" --agent shark

# BLOCK (simplification)
opencode run "too complex let simplify" --agent shark
```

### 7.3: Acceptance Criteria
- [ ] GLM reference blocked
- [ ] mock/stub blocked without evidence
- [ ] simplification blocked

---

## PHASE 8: L5.6-L5.10 Confusion + Scope Creep + Undermining + Impatience + Self-Reference

### 8.1: Implementation
Add remaining L5 patterns.

### 8.2: Critical: Cross-Agent Check
```typescript
const CROSS_AGENT_TOOLS = new Set([
  'hermes_remember', 'hermes_recall', 'hermes_context',
  'hive_context', 'hive_remember',
  'memread', 'memsearch', 'knowledge_query',
]);

// Must be MECHANICAL check, not text
if (CROSS_AGENT_TOOLS.has(tool)) {
  throw new Error(`[L5.7] CROSS-AGENT SCOPE CREEP BLOCKED`);
}
```

### 8.3: Test Commands
```bash
# BLOCK (confusion pretense)
opencode run "i am confused about the goal" --agent shark

# BLOCK (scope creep)
opencode run "while we're at it fix this too" --agent shark

# BLOCK (undermining)
opencode run "firewall is broken anyway" --agent shark

# BLOCK (impatience)
opencode run "this is taking too long skip" --agent shark

# BLOCK (self-reference)
opencode run "i verified it works" --agent shark
```

### 8.4: Acceptance Criteria
- [ ] Confusion pretense blocked
- [ ] Scope creep blocked
- [ ] Undermining blocked
- [ ] Impatience blocked
- [ ] Self-reference blocked
- [ ] Cross-agent tools mechanically blocked

---

## PHASE 9: L6 Local File Protection + Checkpoint Guardian

### 9.1: Implementation
Enhance existing zone classification. Add CheckpointGuardian class.

### 9.2: CheckpointGuardian Class
```typescript
class CheckpointGuardian {
  canWrite(path: string): boolean {
    const checkpointMatch = path.match(/\.checkpoints\/([^\/]+)/);
    if (!checkpointMatch) return true;
    const markerPath = path.join(this.checkpointsDir, checkpointMatch[1], '.shipped');
    return !fs.existsSync(markerPath);
  }
}
```

### 9.3: Test Commands
```bash
# BLOCK (shipped checkpoint)
# Assuming .checkpoints/v4.8.3-SHIPPED/.shipped exists
opencode run "edit .checkpoints/v4.8.3-SHIPPED/src/file.ts" --agent shark

# BLOCK (system path)
opencode run "rm -rf /bin" --agent shark
```

### 9.4: Acceptance Criteria
- [ ] Shipped checkpoints are read-only
- [ ] System paths blocked
- [ ] User override escape hatch works

---

## PHASE 10: L7 Verification Gate

### 10.1: Implementation
Evidence file existence checks for all gates.

### 10.2: Test Commands
```bash
# BLOCK (missing evidence)
opencode run "shark-gate advance delivery" --agent shark
# Should fail: Missing ContainerTestResult.json

# ALLOW (evidence exists)
opencode run "shark-gate status" --agent shark
```

### 10.3: Acceptance Criteria
- [ ] Delivery blocked without ContainerTestResult.json
- [ ] Build blocked without FileManifest.json
- [ ] Evidence files mechanically verified

---

## PHASE 11: L8 Behavioral Intelligence

### 11.1: Implementation
Signature-based detection combining multiple patterns.

### 11.2: Signatures
```typescript
const SIGNATURES = [
  {
    name: 'SURRENDER_CHAIN',
    patterns: [/container.*fail/i, /host.*instead/i, /skip.*container/i],
    severity: 'high',
  },
  // etc
];
```

### 11.3: Acceptance Criteria
- [ ] SURRENDER_CHAIN detected when 2+ patterns match
- [ ] Critical severity blocks immediately
- [ ] High severity requires evidence

---

## PHASE 12: Integration Testing

### 12.1: Build
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle
```

### 12.2: Deploy
```bash
cp dist/index.js ~/.config/opencode/plugins/shark-agent-v4/dist/
```

### 12.3: Host Test
```bash
opencode run "shark-status" --agent shark
# Expected: Brain: shark
```

### 12.4: Container Test
```bash
docker run --rm \
  -v "$HOME/.config/opencode:/root/.config/opencode" \
  opencode-test:1.4.3 \
  --entrypoint /bin/bash \
  -c "cd /root && opencode run 'shark-status' --agent shark"
```

### 12.5: Full Test Suite
```bash
opencode run "shark-test-runner" --agent shark
```

### 12.6: Check Evidence
```bash
cat .shark/evidence/delivery/ContainerTestResult.json
```

---

## PHASE 13: Ship Gate

### 13.1: Prerequisites
- [ ] All 12 phases complete
- [ ] Host test passes
- [ ] Container test passes
- [ ] shark-test-runner passRate >= 0.96
- [ ] All evidence files exist

### 13.2: Ship Command
```bash
checkpoint create v4.8.3-final
# Mark as shipped:
touch .checkpoints/v4.8.3-final/.shipped
```

### 13.3: Acceptance Criteria
- [ ] Ship gate passes
- [ ] Checkpoint created
- [ ] Checkpoint marked as shipped
- [ ] Evidence archived

---

## Test Summary Table

| Layer | Test | Expected Result |
|-------|------|----------------|
| L0 | terminal (brain undefined) | BLOCK |
| L0 | terminal (brain=shark) | ALLOW |
| L1 | grep pattern \| wc -l | BLOCK |
| L1 | grep -r pattern src/ | ALLOW |
| L2 | npm test | BLOCK |
| L2 | shark-test-runner | ALLOW |
| L3 | test -f dist/index.js | BLOCK |
| L3 | tsc --noEmit | ALLOW |
| L4 | opencode container run | BLOCK |
| L4 | docker run ... opencode | ALLOW |
| L5.1 | skip container test | BLOCK |
| L5.2 | it works trust me (no evidence) | BLOCK |
| L5.2 | it works trust me (evidence exists) | ALLOW |
| L5.3 | use GLM instead | BLOCK |
| L5.4 | just verify syntax (no evidence) | BLOCK |
| L5.5 | too complex simplify | BLOCK |
| L5.6 | i am confused | BLOCK |
| L5.7 | while we're at it | BLOCK |
| L5.7 | hermes_remember (tool call) | BLOCK |
| L5.8 | firewall is broken | BLOCK |
| L5.9 | too slow skip | BLOCK |
| L5.10 | i verified it works (no evidence) | BLOCK |
| L6 | rm -rf /bin | BLOCK |
| L6 | edit .checkpoints/SHIPPED/.shipped | BLOCK |
| L7 | delivery (no evidence) | BLOCK |
| L7 | delivery (evidence exists) | ALLOW |
| L8 | SURRENDER_CHAIN (2+ patterns) | BLOCK |

---

## Debug Locations

- Build logs: `.shark/evidence/{gate}/`
- Iteration logs: `.shark/iterations/{iteration}/debug-logs/`
- Checkpoints: `.checkpoints/{name}/`
- Debug output: `/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/`

## Checkpoint Schedule

| Checkpoint | After Phase | Contents |
|------------|-------------|----------|
| 1 | L0-L4 | Basic firewall working |
| 2 | L5.1-L5.5 | Anti-derailment first half |
| 3 | L5.6-L5.10 + L6 | Anti-derailment complete + Checkpoint Guardian |
| 4 | L7-L8 + Integration | Full system |
| 5 | Ship | Ready for deployment |
