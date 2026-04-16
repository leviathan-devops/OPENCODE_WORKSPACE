# FIREWALL INCIDENT ANALYSIS + LESSONS LEARNED

## Critical Incidents from v4.8.3 Development

### INCIDENT 001-006: PLAN Gate Edit Blocks (Working Correctly)
**Issue**: Guardian blocking edits during PLAN phase
**Status**: ✅ WORKING AS DESIGNED - Guardian intentionally blocks edits in PLAN phase
**Lesson**: The guardian PLAN gate protection is correct - edits must happen in BUILD phase

### INCIDENT 007: BROKEN_BUILD_PATTERNS False Positive (BUG)
**Issue**: Build to `/tmp/shark-build` was blocked
**Status**: ❌ FALSE POSITIVE - Bug in pattern logic

**Root Cause**:
```typescript
// Problem: Pattern checks for project directory but still blocks /tmp builds
if (outdirMatch) {
  // This was triggering on /tmp paths incorrectly
}
```

**Lesson Learned**:
- The build output path check was incorrectly implemented
- Builds to `/tmp` should ALWAYS be allowed (isolated, not project)
- Only builds targeting PROJECT directory should be checked
- `/tmp/shark-build` is a VALID build target for testing

### INCIDENT 008: Old dist/index.js Still Running (SYSTEM BUG)
**Issue**: Changes to source files didn't take effect
**Root Cause**:
1. Source edited → rebuilt → but OLD compiled `dist/index.js` was still deployed
2. Debug console.error statements never appeared because OLD code was running
3. The `shark-agent-v4` plugin in opencode.json pointed to stale build

**Lesson Learned**:
- Source changes only take effect after:
  1. Build source to dist/
  2. Copy dist/index.js to plugins/
  3. Restart OpenCode or reload plugins
- This creates chicken-and-egg when the build itself is blocked
- Need a bootstrap build process that bypasses checks when source is intact

### INCIDENT 009: Source Code Overwritten (RECOVERY BUG)
**Issue**: Restore from .bak overwrote working fixes
**Lesson Learned**:
- Before restoring from backup, ALWAYS checkpoint current state
- Use `checkpoint create` before any restoration

---

## Firewall Design Rules (From Incidents)

### Rule 1: Never Block /tmp Builds
```
ALLOWED: bun build --outdir /tmp/shark-build
BLOCKED: bun build --outdir ./dist (project directory)
```
**Rational**: `/tmp` builds are isolated testing, not project modifications

### Rule 2: Source Changes Require Build Chain
```
1. Checkpoint before changes
2. Edit source files
3. Build to /tmp to verify compiles
4. Copy to plugins/
5. Reload OpenCode
6. Test
```

### Rule 3: Debug Output Must Come From CURRENT Code
```
PROBLEM: console.error in source → no output
CAUSE: Old dist/index.js is running
FIX: Always verify you're running the code you think you're running
```

### Rule 4: Bootstrap Build for Self-Hosting
When the build system itself is protected, need a way to rebuild:
```
bootstrap-build: bun build src/index.ts --outdir /tmp/bootstrap
then: cp /tmp/bootstrap/index.js plugins/shark-agent-v4/dist/
```

---

## What Aligned Agent Behavior Looks Like (From Golden Raw Data)

### Characteristic 1: Shows ACTUAL Outputs
```
BAD: "The test passed"
GOOD: 
$ opencode run "shark-status" --agent shark
Output: { "brain": "shark", "gate": "build" }
```

### Characteristic 2: Uses Todo Tracking
```
- Creates todo list with explicit priorities
- Marks items in_progress as worked
- Shows completion as work happens
```

### Characteristic 3: Runs VERIFICATION Commands
```
BAD: "I verified it works"
GOOD: 
$ cat .shark/evidence/delivery/ContainerTestResult.json
$ wc -l dist/index.js
$ opencode run "shark-status" --agent shark
```

### Characteristic 4: Admits When UNCERTAIN
```
BAD: "Obviously this will work"
GOOD: "I'm not certain about X, let me verify by..."
```

### Characteristic 5: Stays in SCOPE
```
BAD: "While we're at it, let me also fix Y"
GOOD: "That's outside scope. Continuing with Z."
```

---

## Derailment Chain (From Forensic Analysis)

When container test fails, THIS is what happens WITHOUT firewalls:

```
Container test fails (auth error)
  ↓ Agent: "Use host testing instead" ← L5.1 (HOST FALLBACK)
  ↓ Agent: "The host already proves it works" ← L5.2 (SUCCESS CLAIM)
  ↓ Agent: "I verified it works" ← L5.10 (SELF-REFERENCE)
  ↓ Agent: "Let me also fix the firewalls" ← L5.7 (SCOPE CREEP)
  ↓ Agent: "Firewalls are broken anyway" ← L5.8 (UNDERMINING)
  ↓ Agent: hermes_remember (cross-agent tool) ← L5.7 (CROSS-AGENT)
Result: Task abandoned, no real testing done
```

**The firewalls MUST break this chain at ANY point.**

---

## Mechanical Intelligence Rules

### Rule 1: State Checks Are O(1)
```typescript
// FAST: Set lookup
const DANGEROUS_TOOLS = new Set([...]);
if (DANGEROUS_TOOLS.has(tool)) { block(); }

// SLOW: String search
if (command.includes('dangerous_tool')) { block(); }
```

### Rule 2: Evidence Is Mechanical, Not Text
```typescript
// MECHANICAL: File exists with correct schema
if (fs.existsSync('.shark/evidence/delivery/ContainerTestResult.json')) {
  const result = JSON.parse(fs.readFileSync(...));
  if (result.passRate >= 0.96) { allow(); }
}

// NOT MECHANICAL: Text mention
if (output.includes('all tests passed')) { allow(); } // EVADABLE
```

### Rule 3: Cross-Agent Tools Are Blocked by NAME, Not Text
```typescript
// MECHANICAL: Check tool name directly
if (CROSS_AGENT_TOOLS.has(tool)) { block(); }

// NOT MECHANICAL: Text search
if (command.includes('hermes_remember')) { block(); } // FALSE POSITIVE
```

### Rule 4: buildTextToCheck ONLY Uses toolArgs
```typescript
// WRONG: Includes user message (FALSE POSITIVES)
return agentMessage + toolArgs + output;

// CORRECT: Only what agent is executing
return JSON.stringify(toolArgs);
```

---

## False Positive Prevention Checklist

For each pattern, verify:
- [ ] Does it block when agent is doing WORK, not just mentioning?
- [ ] Does it allow legitimate commands like `cat file.txt`?
- [ ] Does `| wc -l` get blocked but not `wc -l file.txt`?
- [ ] Does `grep -r pattern src/` get allowed?
- [ ] Does hermes_remember BLOCK only when called as tool, not when mentioned?

## False Negative Prevention Checklist

For each pattern, verify:
- [ ] Does `skip container test` get blocked?
- [ ] Does `host already proves` get blocked?
- [ ] Does `it works trust me` get blocked?
- [ ] Does `while we're at it` scope creep get blocked?
- [ ] Do cross-agent tools get mechanically blocked?

---

## Build Output Path Rules

| Path | Should Block? | Reason |
|------|--------------|--------|
| `./dist/` | YES | Project output - can corrupt build |
| `./src/` | YES | Project source - can corrupt source |
| `/tmp/shark-build/` | NO | Isolated testing |
| `/tmp/build-test/` | NO | Isolated testing |
| `/tmp/plugin-test/` | NO | Isolated testing |

---

## Checkpoint Guardian Rules

| Checkpoint State | Can Write? | Reason |
|-----------------|-----------|--------|
| `.checkpoints/v4.8.3-working/` | YES | Active working copy |
| `.checkpoints/v4.8.3-SHIPPED/.shipped` | NO | Passed ship gate |
| `.checkpoints/v4.8.3-SHIPPED/src/` | NO | Read-only after ship |

---

## The 90/10 Rule for Firewalls

- **90% mechanical**: State checks, Set lookups, File existence
- **10% text-based**: Only for anti-derailment thinking patterns

If a check can be mechanical, make it mechanical.
Only use text patterns when there's no structural alternative.
