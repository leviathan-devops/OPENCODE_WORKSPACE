# TRIDENT BRAIN — DETAILED BUILD STEPS
## How to Build a Properly Working Code Review Plugin

---

## PHASE 1: FIX & CONSOLIDATE (Day 1)

### Step 1.1: Merge Debug Version Into Main
```bash
# The trident-code-review-debug has the tool enforcement hook
# Copy the working tool.execute.before hook from debug version

# Source: projects/trident-code-review-debug/src/index.ts (lines 589-623)
# Target: projects/trident-brain-code-review/src/index.ts
```

### Step 1.2: Fix Integration Test
```bash
# Option A: Rename to .cjs
mv test-integration.js test-integration.cjs

# Option B: Convert to ES imports
# Change:
#   const { AuditEngine, reportGenerator } = require('./dist/algorithmic-core.js');
# To:
#   import { AuditEngine, reportGenerator } from './dist/algorithmic-core.js';
```

### Step 1.3: Verify Build
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review
npm run build
# Should succeed without errors
```

### Step 1.4: Run Integration Test
```bash
node test-integration.cjs  # if renamed
# OR
node test-integration.js  # if converted to ES
```

---

## PHASE 2: DEPLOY & SMOKE TEST (Day 1)

### Step 2.1: Deploy to OpenCode Plugins
```bash
# Create plugin directory
mkdir -p ~/.config/opencode/plugins/trident-brain

# Copy built plugin
cp -r /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/dist/* \
  ~/.config/opencode/plugins/trident-brain/

# Verify files copied
ls -la ~/.config/opencode/plugins/trident-brain/
```

### Step 2.2: Smoke Test in OpenCode TUI
1. Start OpenCode: `opencode` (or `opencode tui`)
2. Select "trident" agent from dropdown
3. Send: `"status"`
4. Verify: Response shows TRIDENT BRAIN v3.0
5. Send: `"help"`
6. Verify: Commands list appears

---

## PHASE 3: MECHANICAL TESTING (Day 1-2)

### Step 3.1: Run 20 Mechanical Tests

From MECHANICAL_TEST_SUITE.md, execute each test:

```bash
# TEST 1: SIMULATED_EXECUTION
Create /tmp/test_simulated_execution.js:
```javascript
function fakeSuccess() {
  return Promise.resolve({success: true});
}
async function stubOperation() {
  return {success: true};
}
```

Say: "audit /tmp/test_simulated_execution.js"
EXPECTED: CRITICAL SIMULATED_EXECUTION findings >= 2

# TEST 2: THEATRICAL_CODE
Create /tmp/test_theatrical.js:
```javascript
// TODO: full implementation would go here
// This is mock data for testing
async function placeholder() {
  // TODO: implement actual logic
  return null;
}
```

Say: "audit /tmp/test_theatrical.js"
EXPECTED: CRITICAL THEATRICAL_CODE findings >= 3

# [Continue for all 20 tests...]
```

### Step 3.2: Tool Enforcement Verification
After pattern tests, verify tool blocking:

```bash
# While in trident agent context:
Say: "edit /tmp/test.js"
EXPECTED: Blocked with reason "[Trident] TOOL BLOCKED"

Say: "write /tmp/test.js"
EXPECTED: Blocked with reason "[Trident] TOOL BLOCKED"

Say: "bash rm -rf /"
EXPECTED: Blocked (except /tmp/*.sh test scripts)
```

---

## PHASE 4: CONTAINER VERIFICATION (Day 2)

### Step 4.1: Build Container Image
Follow: https://docs.docker.com/ai/sandboxes/agents/opencode/

```bash
# Build custom container for TUI testing
docker build -t trident-test:latest -f Dockerfile.opencode .
```

### Step 4.2: Run Container Tests
```bash
# Start container
docker run -it trident-test:latest

# Inside container:
opencode tui
# [Run mechanical test suite]

# Exit and capture results
exit
```

### Step 4.3: Evidence Collection
Save container test evidence to:
```
/home/leviathan/OPENCODE_WORKSPACE/DEBUG LOGS/trident-container-test-{date}.json
```

---

## PHASE 5: REAL-WORLD AUDIT (Day 2-3)

### Step 5.1: Audit Active Project
```bash
# Pick a real project to audit
Say: "audit /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4/src"
```

### Step 5.2: Verify Documentation Output
Expected: `TRIDENT_CODE_REVIEW.md` file created in target directory
- Contains detailed findings
- NO direct edits to source files

### Step 5.3: Fix Verification
If findings show theatrical code:
1. Read TRIDENT_CODE_REVIEW.md
2. Apply fixes manually (as user)
3. Re-audit to verify fixes worked

---

## PHASE 6: SHIP GATE (Day 3)

### Step 6.1: Ship Gate Checklist

| Requirement | Verification |
|-------------|--------------|
| Plugin builds clean | `npm run build` succeeds |
| No console.log in output | TUI output clean |
| Tool enforcement works | Write tools blocked |
| Pattern detection accurate | 7/7 mechanical tests pass |
| No crashes in session | 1 hour continuous use |
| Container test passed | Docker verification complete |
| Documentation created | TRIDENT_CODE_REVIEW.md generated |

### Step 6.2: Create Ship Package
```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review

# Commit all changes
git add -A
git commit -m "v3.0.1: Add tool enforcement, crash fixes, container ready"

# Tag release
git tag v3.0.1
git push origin master --tags
```

### Step 6.3: Update Reload Anchor
```bash
# Copy current working version to Reload Anchor
cp -r src/* "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/src/"
cp -r dist/* "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/dist/"
cp -r docs/* "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/docs/"

# Update RECOVERY.md with new version
# Update SHIP_PACKAGE.md with verification results
```

---

## EXECUTION ORDER

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: FIX & CONSOLIDATE                                      │
│ ├─ 1.1 Merge tool enforcement hook                             │
│ ├─ 1.2 Fix integration test                                    │
│ ├─ 1.3 Verify build                                            │
│ └─ 1.4 Run integration test                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: DEPLOY & SMOKE TEST                                    │
│ ├─ 2.1 Deploy to OpenCode plugins                              │
│ └─ 2.2 Smoke test in TUI                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: MECHANICAL TESTING                                    │
│ ├─ 3.1 Run 20 mechanical tests                                 │
│ └─ 3.2 Verify tool enforcement                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: CONTAINER VERIFICATION                                 │
│ ├─ 4.1 Build container image                                   │
│ ├─ 4.2 Run container tests                                      │
│ └─ 4.3 Collect evidence                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: REAL-WORLD AUDIT                                       │
│ ├─ 5.1 Audit active project                                    │
│ ├─ 5.2 Verify documentation output                             │
│ └─ 5.3 Fix verification                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: SHIP GATE                                              │
│ ├─ 6.1 Ship gate checklist                                      │
│ ├─ 6.2 Create ship package                                     │
│ └─ 6.3 Update reload anchor                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## ESTIMATED TIME

| Phase | Time | Total |
|-------|------|-------|
| Phase 1 | 1-2 hours | 1-2 hours |
| Phase 2 | 30 minutes | 1.5-2.5 hours |
| Phase 3 | 2-3 hours | 3.5-5.5 hours |
| Phase 4 | 2-3 hours | 5.5-8.5 hours |
| Phase 5 | 2-4 hours | 7.5-12.5 hours |
| Phase 6 | 1-2 hours | 8.5-14.5 hours |

**Total: 1-2 days of focused work**

---

## CHECKPOINT SCHEDULE

Create checkpoints at:
1. **After Phase 1** (consolidation complete)
2. **After Phase 2** (smoke test passes)
3. **After Phase 3** (mechanical tests pass)
4. **After Phase 4** (container verified)
5. **After Phase 5** (real-world audit works)
6. **After Phase 6** (ship gate passed)

Each checkpoint saves to:
```
/home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-code-review/.checkpoints/
```

---

## RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tool enforcement hook crashes plugin | HIGH | Test incrementally, check hook returns |
| Pattern false positives | MEDIUM | Run mechanical tests, refine regex |
| Memory exhaustion on large codebase | MEDIUM | Already has 50MB limit |
| Session crash during audit | LOW | Already has timeout handling |
| Container test infrastructure missing | HIGH | Use existing Docker sandbox docs |

---

## SUCCESS CRITERIA

**Trident Brain v3.0 is complete when:**

1. [ ] Plugin loads without crashing
2. [ ] `audit` command scans directories and finds patterns
3. [ ] Tool enforcement blocks write/edit tools
4. [ ] No theatrical code in output (no console.log)
5. [ ] 20 mechanical tests pass in TUI
6. [ ] Container test confirms runtime behavior
7. [ ] Documentation file created (TRIDENT_CODE_REVIEW.md)
8. [ ] No direct edits to source files during audit
9. [ ] Real-world audit completes without crash
10. [ ] Reload anchor updated with ship-ready package

---

**Document Created:** 2026-04-15T22:36:00Z
**Version:** 1.0
**Status:** Ready for execution
