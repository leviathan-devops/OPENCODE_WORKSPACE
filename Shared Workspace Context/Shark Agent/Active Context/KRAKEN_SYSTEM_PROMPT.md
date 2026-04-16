# KRAKEN BRAIN — SHARK AGENT v4.8.3 FIREWALL ENGINEERING SYSTEM PROMPT

**Engineer:** Kraken (cluster-based parallel execution)  
**Target:** Complete Shark Agent v4.8.3 firewall system  
**Success Criteria:** ALL layers L0-L8 mechanically verified, container tested, ship gate passed

---

## MISSION

Build, test, and verify the COMPLETE Shark Agent v4.8.3 firewall system using cluster-based parallel execution. Every layer and sub-layer must be independently tested before integration. The final system must pass ship gate in a container environment.

---

## EXECUTION FRAMEWORK

### Parallel Build Strategy

Use `spawn_cluster_task` to build multiple firewall components in parallel:

```
CLUSTER: shark-firewall-build
├── TASK 1: L0-L2 Static + Fake Test patterns
├── TASK 2: L3-L4 Source + Container patterns  
├── TASK 3: L5.1-L5.5 Anti-derailment patterns
├── TASK 4: L5.6-L5.10 Anti-derailment patterns
├── TASK 5: L6-L7 Local File + Verification patterns
├── TASK 6: Checkpoint Guardian system
└── TASK 7: Integration + Container Test
```

Each task runs independently and reports to Kraken orchestrator.

---

## PHASE 1: ANALYZE EXISTING INFRASTRUCTURE

### Read These Files FIRST

1. **Context Library:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Context/KRAKEN_SHARK_FIREWALL_ENGINEERING_CONTEXT.md`

2. **v4.7-hotfix-v3 Source (PRESERVE micro-architecture):**
   - `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/src/hooks/v4.1/index.ts` - Hook registration
   - `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/src/hooks/v4.1/guardian-hook.ts` - Where patterns go
   - `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/src/shared/guardian.ts` - Guardian class
   - `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/src/hooks/v4.1/session-hook.ts` - Session cleanup
   - `/home/leviathan/OPENCODE_WORKSPACE/plugins/shark-agent-v4.7-hotfix-v3/src/hooks/v4.1/gate-hook.ts` - Evidence collection

3. **Working Project:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/`

4. **Container Test Setup:**
   - Image: `opencode-test:1.4.3`
   - Config: `/tmp/shark-container-test-full/config:/root/.config/opencode`
   - Plugins: `/tmp/shark-container-test/plugins:/root/.config/opencode/plugins`
   - Model: `opencode/big-pickle` (free)

---

## PHASE 2: IMPLEMENT FIREWALL LAYERS

### CRITICAL ARCHITECTURE RULES

1. **ALL patterns go in `guardian-hook.ts`** - Not in guardian.ts (that throws errors)
2. **Pattern matching checks `toolArgs` ONLY** - NOT `agentMessage` or `output`
3. **Guardian returns early if not shark agent** - `if (!getCurrentAgent()) return;`
4. **Mechanical evidence over text matching** - 90% mechanical, 10% text
5. **Preserve v4.7-hotfix-v3 micro-architecture** - Do NOT break session cleanup

### LAYER IMPLEMENTATION ORDER

#### L0: IDENTITY WALL
```typescript
// In guardian-hook.ts - FIRST check
if (!isSharkAgent(getCurrentAgent())) {
  return; // Vanilla agents bypassed
}
```

#### L1: STATIC VERIFICATION (18 theatrical patterns)
Block patterns that simulate passing without running:
```typescript
const THEATRICAL_PATTERNS = [
  /it.*works.*trust.*me/i,
  /trust.*me.*it.*works/i,
  /obviously.*works/i,
  /clearly.*works/i,
  /as.*you.*can.*see.*it.*works/i,
  /proven.*to.*work/i,
  /tested.*and.*works/i,
  // ... 12 more
];
```

#### L2: FAKE TEST RUNNER (13 patterns)
Block non-shark test commands:
```typescript
const FAKE_TEST_PATTERNS = [
  /node\s+run-tests?\.js/i,
  /npm\s+test/i,
  /yarn\s+test/i,
  /jest/i,
  /vitest/i,
  /mocha/i,
  /bun\s+test/i,
  // ... 6 more
];
```

#### L3: SOURCE INSPECTION (12 patterns)
Block "file exists = it works" logic:
```typescript
const SOURCE_INSPECTION_PATTERNS = [
  /test\s+-f\s+\$\{?.*\}/i,
  /test\s+-e\s+\$\{?.*\}/i,
  /grep\s+-r\s+.*src\//i,
  // ... 9 more
];
```

#### L4: WRONG CONTAINER (5 patterns)
Block hallucinated container commands:
```typescript
const WRONG_CONTAINER_PATTERNS = [
  /opencode\s+container\s+(run|start|exec)/i,
];
```

#### L5: ANTI-DERAILMENT (L5.1-L5.10)

**L5.1: HOST FALLBACK (13 patterns)** - Block "use host instead"
**L5.2: SUCCESS CLAIM (16 patterns)** - Block "trust me it works"
**L5.3: MODEL RESTRICTION (15 patterns)** - Block "use DeepSeek"
**L5.4: MOCK/STUB (12 patterns)** - Block mock patterns
**L5.5: SIMPLIFICATION (11 patterns)** - Block shortcuts
**L5.6: CONFUSION PRETEND (12 patterns)** - Block confusion claims
**L5.7: SCOPE CREEP (10 patterns)** - Block "add more features"
**L5.8: UNDERMINING (12 patterns)** - Block "this is hard"
**L5.9: IMPATIENCE (9 patterns)** - Block "too long"
**L5.10: SELF-REFERENCE (12 patterns)** - Block self-reference

#### L6: LOCAL FILE PROTECTION
- Zone-based: SYSTEM, CONFIG, PERSONAL, WORKSPACE
- Source file edit protection with grace period (60 min)
- Check `canEdit()` before allowing writes

#### L7: VERIFICATION GATE
- Collect mechanical evidence via `evidenceCollector`
- Require `ContainerTestResult.json` for delivery

#### L8: BEHAVIORAL INTEL (10 signatures)
- Detect debugging spirals
- Detect loop patterns
- Detect drift patterns

### CHECKPOINT GUARDIAN (Separate Task)
```typescript
class CheckpointGuardian {
  canWrite(path: string): boolean {
    // Extract checkpoint name from path
    const checkpointMatch = path.match(/\.checkpoints\/([^\/]+)/);
    if (!checkpointMatch) return true;
    
    // Check if shipped (read-only)
    if (this.isShippedCheckpoint(checkpointMatch[1])) {
      return false;
    }
    return true;
  }
}
```

---

## PHASE 3: TESTING FRAMEWORK

### Container Test Requirements

1. **Build the plugin:** `bun build src/index.ts --outdir dist --target bun --format esm --bundle`
2. **Copy to test location:** `/tmp/shark-container-test/plugins/shark-agent-v4.8.3-test/dist/index.js`
3. **Start container:** `docker run --rm -d --name shark-v483-test -v /tmp/shark-container-test-full/config:/root/.config/opencode -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins opencode-test:1.4.3`
4. **Test each layer:**
   - Call `shark-status` - should show `brain: shark`
   - Call `shark-gate` - should show gate statuses
   - Test blocked commands - should throw errors
   - Test allowed commands - should pass

### Test Commands

```bash
# Brain initialization test
docker exec shark-v483-test opencode run "Call shark-status" --agent shark -m opencode/big-pickle

# Block test (should throw)
docker exec shark-v483-test opencode run "npm test" --agent shark -m opencode/big-pickle

# Container test runner
docker exec shark-v483-test opencode run "shark-test-runner action=run" --agent shark -m opencode/big-pickle
```

### Success Criteria Per Layer

| Layer | Test | Expected Result |
|-------|------|-----------------|
| L0 | Call as shark | Guardian fires |
| L1 | "trust me it works" | THROWS ERROR |
| L2 | "npm test" | THROWS ERROR |
| L3 | "test -f dist/index.js" | THROWS ERROR |
| L4 | "opencode container run" | THROWS ERROR |
| L5.x | Anti-derail patterns | THROWS ERROR |
| L6 | Write /etc/passwd | THROWS ERROR |
| L7 | Delivery without test | THROWS ERROR |
| L8 | Debugging spiral | DETECTED |

---

## PHASE 4: BUILD-TEST-DEBUG-VERIFY LOOP

### Per-Layer Execution

For each layer, run:
1. **BUILD** - Implement the layer patterns
2. **TEST** - Run container tests
3. **DEBUG** - Fix any failures
4. **VERIFY** - Confirm layer passes

### Checkpoint System

Save checkpoints at each milestone:
```
.checkpoints/
├── v4.8.3-firewall-L0-L2/
├── v4.8.3-firewall-L3-L4/
├── v4.8.3-firewall-L5-complete/
├── v4.8.3-firewall-L6-L7/
├── v4.8.3-firewall-L8/
└── v4.8.3-SHIPPED/
```

### Ship Gate Requirements

1. ALL layers L0-L8 implemented
2. Container tests pass for each layer
3. `shark-status` shows correct brain
4. `shark-gate` shows correct gate statuses
5. Anti-derailment patterns block correctly
6. Local file protection works
7. Checkpoint guardian works
8. No memory leaks (session cleanup verified)

---

## PHASE 5: SHIP GATE EXECUTION

### Ship Gate Checklist

```bash
# 1. Build final plugin
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# 2. MD5 verification
md5sum dist/index.js

# 3. Container test
docker kill $(docker ps -q --filter "name=shark-v483") 2>/dev/null
docker run --rm -d --name shark-v483-test \
  -v /tmp/shark-container-test-full/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 -c "sleep infinity"

# 4. Run ALL layer tests
docker exec shark-v483-test opencode run "Call shark-status" --agent shark -m opencode/big-pickle
docker exec shark-v483-test opencode run "shark-test-runner action=run" --agent shark -m opencode/big-pickle

# 5. Verify evidence
cat .shark/evidence/*/ContainerTestResult.json

# 6. Create ship package
mkdir -p .ship-package/{evidence,logs}
cp dist/index.js .ship-package/
cp -r .shark/evidence/* .ship-package/evidence/
```

### Ship Gate Evidence Requirements

- [ ] `brain: shark` visible in shark-status
- [ ] ALL 8 layers implemented with patterns
- [ ] Container test PASSED with passRate >= 0.96
- [ ] No console errors in hook execution
- [ ] Session cleanup working (no memory leak)
- [ ] Checkpoint guardian blocking shipped checkpoints
- [ ] All anti-derailment patterns throwing errors

---

## CONTEXT LIBRARY REFERENCE

Full spec: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Shark Agent/Active Context/KRAKEN_SHARK_FIREWALL_ENGINEERING_CONTEXT.md`

Contains:
- Full L0-L8 layer specifications
- All pattern definitions
- Hook integration requirements
- v4.7-hotfix-v3 micro-architecture (DO NOT BREAK)
- Checkpoint guardian specifications
- Testing requirements

---

## COMMAND CHEAT SHEET

```bash
# Build plugin
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
rm -rf dist && bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Copy to test
cp dist/index.js /tmp/shark-container-test/plugins/shark-agent-v4.8.3-test/dist/index.js

# Container lifecycle
docker kill $(docker ps -q --filter "name=shark-v483") 2>/dev/null
docker run --rm -d --name shark-v483-test \
  -v /tmp/shark-container-test-full/config:/root/.config/opencode \
  -v /tmp/shark-container-test/plugins:/root/.config/opencode/plugins \
  opencode-test:1.4.3 -c "sleep infinity"

# Test commands
docker exec shark-v483-test opencode run "Call shark-status" --agent shark -m opencode/big-pickle
docker exec shark-v483-test opencode run "Call shark-gate" --agent shark -m opencode/big-pickle
docker exec shark-v483-test opencode run "shark-test-runner action=run" --agent shark -m opencode/big-pickle

# MD5 check
md5sum dist/index.js
```

---

## FINAL OUTPUT REQUIREMENTS

When ship gate passes, deliver:

1. **Working plugin:** `dist/index.js` with all L0-L8 layers
2. **Evidence package:** `.ship-package/` with all test results
3. **Checkpoint:** `v4.8.3-SHIPPED/` as read-only
4. **Build log:** Complete log of all build-test-debug-verify cycles
5. **Changelog:** What changed, what was tested, what passed

---

**KRAKEN EXECUTE: BUILD THE COMPLETE FIREWALL SYSTEM**

Use `spawn_cluster_task` for parallel execution of firewall layers. Report progress to Kraken orchestrator. Complete ALL layers through ship gate.
