# Error Handling — Failure Recovery and Fallbacks

## Error Categories

### Category 1: Tool Execution Errors

**Pattern:** Tool called correctly but fails during execution.

| Tool | Failure Mode | Handling |
|------|-------------|----------|
| `lint` | ESLint config not found | Fallback to stdout+stderr combined check (v2.3.5 fix) |
| `sast_scan` | npm/npm executable not found | Switch to bundled local ESLint plugin |
| `imports` | File not found / path resolve fails | Try `context.directory` then `context.worktree` fallback |
| `symbols` | File not readable | Check permissions, return empty array with warning |
| `grill` | Target is directory without recursive flag | Detect isDirectory, recurse if directory |
| `build_check` | npm build fails | Return stderr output, don't throw |
| `test_runner` | npm test fails | Return exit code + output, don't throw |

### Category 2: Hook Guard Errors

**Pattern:** Hook guard condition not met — hook silently skips.

| Hook | Guard Condition | Silent Failure? |
|------|---------------|-----------------|
| `brainstorm-gate` | `.hermes/` directory exists | YES — if dir missing, hook skips entirely |
| `delegation-gate` | Agent is "coder" | YES — if different agent name, skips |
| `tdd-enforcer` | Tool is "write" and path starts with "src/" | YES — if different tool/path, skips |
| `self-review` | Agent approving own output | YES — if agent not self-approving, skips |

**Mitigation:** Add trace logging to every guard:
```typescript
if (!isCoder(agent)) {
  console.log(`[delegation-gate] SKIP: agent=${agent} is not coder`);
  return;
}
```

### Category 3: State Persistence Errors

**Pattern:** Disk write fails (permissions, disk full, etc.)

| Operation | Failure | Handling |
|----------|---------|----------|
| `phase_complete` write | Cannot write `.hermes/phase.json` | Return error, phase NOT advanced |
| `hermes_remember` write | Cannot write `~/.hermes/memory/` | Return `{ stored: false, error }` |
| `checkpoint` write | Cannot write `.hermes/checkpoints/` | Return `{ status: "failed", error }` |

### Category 4: Delegation Errors

**Pattern:** Delegation succeeds but subagent returns error.

| Error | Handling |
|-------|----------|
| Subagent timeout | Supervisor detects via debugging-spiral, logs issue |
| Subagent returns BLOCKED | Hermes escalates to architect |
| Subagent returns NEEDS_CONTEXT | Hermes provides more context, retries |
| Delegation chain broken | Hermès attempts direct execution as fallback |

---

## Fallback Chains

### Path Resolution Fallback
```typescript
function resolvePath(unsafe: string, context: ToolContext): string {
  // Always use fallback chain for worktree/directory
  const base = context.directory ?? context.worktree ?? process.cwd();
  if (isAbsolute(unsafe)) {
    return unsafe;
  }
  return resolve(base, unsafe);
}
```

### ESLint Fallback
```typescript
// ESLint 10 puts config errors in stdout, not stderr
const combinedOutput = (result.stdout || "") + (result.stderr || "");
if (combinedOutput.includes("Cannot find module") || 
    combinedOutput.includes("Failed to load config")) {
  // Fall back to basic syntax check
  return { stdout: "", stderr: "ESLint config issue", exitCode: 1, fixed: false };
}
```

### SAST Scan Fallback
```typescript
// Primary: bundled eslint-plugin-security
// Fallback 1: npx with explicit package
// Fallback 2: basic pattern scan
async function sastScan(target: string, context: ToolContext) {
  try {
    return await scanWithBundledPlugin(target);
  } catch (e) {
    console.log(`[sast_scan] bundled plugin failed: ${e.message}`);
    return await scanWithNpxPackage(target);
  }
}
```

---

## Illegal Transition Handling

```typescript
function advancePhase(newPhase: PhaseName, context: ToolContext): PhaseResult {
  const current = getCurrentPhase(context.directory);
  const allowed = PHASE_TRANSITIONS[current];
  
  if (!allowed.includes(newPhase)) {
    return {
      error: `Illegal transition: ${current} → ${newPhase}. Allowed: ${allowed.join(", ")}`,
      currentPhase: current,
      transitionAttempted: newPhase,
    };
  }
  
  // Proceed with transition...
}
```

---

## Debugging Spiral Detection

```typescript
const SPIRAL_THRESHOLD = 5;
const _failureLog: Map<string, { count: number; firstSeen: number }> = new Map();

function checkSpiral(args: string, toolName: string): "ok" | "spiral_detected" {
  const key = `${toolName}:${args}`;
  const entry = _failureLog.get(key) ?? { count: 0, firstSeen: Date.now() };
  
  // Reset if first failure was > 5 minutes ago
  if (Date.now() - entry.firstSeen > 5 * 60 * 1000) {
    _failureLog.delete(key);
    return "ok";
  }
  
  entry.count++;
  _failureLog.set(key, entry);
  
  if (entry.count >= SPIRAL_THRESHOLD) {
    return "spiral_detected";
  }
  return "ok";
}
```

---

## Recovery Procedures

### Phase State Corruption
```
Symptom: phase_complete returns wrong phase
Recovery:
1. Read .hermes/phase.json directly
2. If corrupted, restore from last session snapshot
3. If no snapshot, reset to "idle"
4. Log incident for supervisor review
```

### Memory Store Corruption
```
Symptom: hermes_recall returns garbled data
Recovery:
1. Verify JSON parse of target memory file
2. If parse fails, move to ~/.hermes/memory/corrupted/[hash].json
3. Continue with remaining valid memory entries
4. Log incident for supervisor review
```

### Hook Firing Order Violation
```
Symptom: Guardrail fires AFTER knowledge injector (wrong order)
Recovery:
1. Verify opencode.json hook order
2. If order wrong, fix opencode.json
3. If SDK orders hooks differently, add explicit ordering metadata
4. Escalate to architect if unresolved
```
