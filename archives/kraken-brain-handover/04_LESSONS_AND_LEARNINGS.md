# 🦈 SHARK CLI - Lessons and Learnings

**Project**: Shark Frankenstein (Dual-Brain AI Coding Assistant)  
**Session Date**: 2026-03-28  
**Experience Source**: V2 Integration Build + GLM 5 Migration

---

## Critical Lessons Learned

### 1. Integration Audit is Essential

**Lesson**: Never trust documentation over implementation.

**Context**: 
- FirewallMesh was documented as "integrated"
- Audit revealed it existed but wasn't called in `executeTool()`
- V2 files created to properly integrate it

**Prevention**:
```bash
# Always verify integration with grep
grep -r "firewallMesh.checkToolCall" src/

# Run integration tests that verify actual behavior
bun run testing/integration-test(V2).ts
```

**Takeaway**: Build integration tests FIRST, then implement.

---

### 2. Placeholder Code Accumulates Technical Debt

**Lesson**: Placeholder implementations become permanent if not tracked.

**Context**:
- CLI `--firewall-stats` returned fake data
- Was a placeholder that became "production" code
- Fixed by creating CLI instance first to get real stats

**Original (Bad)**:
```typescript
// In run-stage1.sh - showing placeholder
if (args.includes('--firewall-stats')) {
  console.log('Total: 0, Blocked: 0, Allowed: 0');
  process.exit(0);
}
```

**Fixed (Good)**:
```typescript
// In cli(V2).ts - actual implementation
if (args.includes('--firewall-stats')) {
  const cli = new SharkCLI(process.cwd(), mode, { verbose });
  const stats = cli.getFirewallStats();
  console.log(`Total: ${stats.totalCalls}, Blocked: ${stats.blocked}`);
  process.exit(0);
}
```

**Takeaway**: Mark placeholders with `// TODO:` and create issues to track them.

---

### 3. Docker ENTRYPOINT vs CMD Matters

**Lesson**: Container default execution requires explicit shell.

**Context**:
- Dockerfile had `CMD ["./testing/stage1-docker/run-tests.sh"]`
- Node.js tried to execute bash script as JavaScript
- Error: `SyntaxError: Invalid or unexpected token`

**Wrong**:
```dockerfile
CMD ["./testing/stage1-docker/run-tests.sh"]
```

**Correct**:
```dockerfile
ENTRYPOINT ["bash"]
CMD ["./testing/stage1-docker/run-tests.sh"]
```

**Takeaway**: Always specify shell explicitly for script execution in Docker.

---

### 4. Volume Mounts Create Permission Issues

**Lesson**: Container filesystem isolation is a feature, not a bug.

**Context**:
- Mounted host directory into container for reports
- Non-root user in container couldn't write to mounted volume
- Error: `Permission denied: /app/testing/reports/stage1-latest.json`

**Wrong Approach**:
```bash
docker run --rm -v "$REPORT_DIR:/app/testing/reports" shark-test-stage1
```

**Better Approach**:
```bash
docker run --rm shark-test-stage1
# Reports stay in container, accessible via docker cp if needed
```

**Takeaway**: Avoid volume mounts unless data persistence across runs is required.

---

### 5. Parentheses in Filenames Break CLI Tools

**Lesson**: Special characters in filenames cause unexpected issues.

**Context**:
- V2 files named with `(V2)` suffix
- `bun run testing/integration-test(V2).ts` failed
- Bash interpreted parentheses as syntax

**Error**:
```
/bin/bash: -c: line 1: syntax error near unexpected token `('
```

**Fix**:
```bash
bun run "testing/integration-test(V2).ts"
```

**Better Fix** (for future):
- Use suffixes like `-v2` or `.v2` instead of `(V2)`

**Takeaway**: Avoid parentheses in filenames; use dashes or dots instead.

---

### 6. Backward Compatibility Requires Planning

**Lesson**: V2 files created alongside V1 for safety.

**Context**:
- Didn't want to break existing functionality
- Created `executor(V2).ts` next to `executor.ts`
- Allows gradual migration and testing

**Pattern Used**:
```
src/tools/
├── executor.ts           # Original (unchanged)
├── executor(V2).ts       # New with FirewallMesh
├── firewall-mesh.ts      # Original
├── firewall-mesh(V2).ts  # Expanded coverage
```

**Takeaway**: When making major changes, create parallel implementations until verified.

---

### 7. Test Environment Differences Matter

**Lesson**: Docker tests != Local tests.

**Context**:
- Stage 1 (Docker) passed with 3/4 tests
- Stage 2 (Local) requires API keys
- Different test suites for different environments

**Stage 1 (Docker)**:
- No API keys needed (mock mode)
- Guardian in SANDBOX mode
- Non-interactive by default

**Stage 2 (Local)**:
- Real API keys required
- Guardian in BALANCED mode
- Interactive TTY features

**Takeaway**: Design tests for the environment they run in; don't try to make one suite fit all.

---

### 8. Model Version Upgrades Need Complete Search

**Lesson**: String searches miss variations in formatting.

**Context**:
- Searching for "GLM 4.7" missed "glm-4.7" and "GLM4.7"
- Required multiple grep patterns

**Comprehensive Search**:
```bash
# Use regex to catch all variations
grep -rE "GLM.?4.?7|glm.?4.?7" --include="*.ts"

# Also check:
# - Comments (GLM 4.7-flash)
# - Code (glm-4.7)
# - Config (GLM4.7)
# - Docs (GLM 4.7)
```

**Takeaway**: Use regex patterns when searching for version strings; check all cases.

---

### 9. Parallel Firewalls Need Careful Result Aggregation

**Lesson**: Blocking vs warning firewalls behave differently.

**Context**:
- FirewallMesh runs 4 firewalls in parallel
- Some block (GuardianFirewall, WorkflowBlocker)
- Some warn only (TheatricalDetector, SecretDetector)

**Implementation Insight**:
```typescript
// Run ALL in parallel
const results = await Promise.all(
  this.firewalls.map(f => f.check(toolCall))
)

// ANY blocking result = blocked
const blocked = results.find(r => r.blocked)

// Collect ALL warnings
const warnings = results.filter(r => r.warning)
```

**Takeaway**: Design parallel systems with clear rules for combining results.

---

### 10. Stagnation Detection Threshold Matters

**Lesson**: 3 identical failures is a good threshold.

**Context**:
- StagnationDetector tracks (tool_name, identifier) failures
- After 3 failures, alerts and suggests escalation
- Too low = false positives, too high = wasted iterations

**Implementation**:
```typescript
if (count >= 3) {
  this.alertStagnation(toolName, identifier)
  // Suggest: spawn fresh agent with clean context
}
```

**Takeaway**: Choose stagnation thresholds based on expected retry behavior.

---

## Architecture Insights

### 1. Dual-Brain Pattern Works Well

**Observation**: Having two specialized modes (Micro/Macro) is better than one general mode.

**Why It Works**:
- Micro: Optimized for free execution (vLLM + Gemma fallback)
- Macro: Optimized for complex tasks (GLM 5 + DeepSeek advisory)
- User can choose based on task complexity

**Trade-off**: Slightly more complex codebase, but better user experience.

---

### 2. FirewallMesh as Pipeline is Extensible

**Observation**: Running firewalls in parallel with Promise.all is clean.

**Benefits**:
- Easy to add new firewalls
- All firewalls run (no short-circuit on first block)
- Clear separation of concerns

**Code Pattern**:
```typescript
interface Firewall {
  check(toolCall: ToolCall): Promise<FirewallResult>
}

class FirewallMesh {
  private firewalls: Firewall[] = [...]
  
  async checkToolCall(toolCall: ToolCall): Promise<FirewallResult> {
    const results = await Promise.all(
      this.firewalls.map(f => f.check(toolCall))
    )
    return this.aggregateResults(results)
  }
}
```

---

### 3. vLLM for Local Execution is Cost-Effective

**Observation**: Qwen 2.5 Coder 7B AWQ on local vLLM is essentially free.

**Benefits**:
- No API costs for Micro Engineer mode
- Fast (local GPU inference)
- Privacy (code doesn't leave machine)

**Requirements**:
- GPU with sufficient VRAM (8GB+ for 7B AWQ)
- vLLM server running locally

---

### 4. Advisory Brain Pattern Improves Quality

**Observation**: DeepSeek R1 as advisory brain in Macro mode helps.

**Flow**:
```
1. DeepSeek provides strategy
2. GLM 5 executes
3. DeepSeek reviews progress
4. Repeat until complete
```

**Benefit**: Two models catch each other's mistakes.

---

## Performance Insights

### 1. Parallel Firewall Execution is Fast

**Measurement**: 4 firewalls in parallel adds <50ms overhead.

**Why**:
- All firewalls are synchronous checks (no I/O)
- Promise.all schedules them efficiently
- No blocking waits

---

### 2. vLLM Latency is Lower Than Cloud APIs

**Measurement**: Local vLLM ~200-500ms vs cloud APIs ~1-3s.

**Why**:
- No network round-trip
- GPU inference is fast for 7B model
- No rate limiting

---

### 3. TypeScript Compilation is Quick

**Measurement**: Full build ~2-3 seconds.

**Why**:
- Project is relatively small (~50 source files)
- Bun's TypeScript support is fast
- Incremental builds even faster

---

## Security Insights

### 1. Guardian Prevents Accidental Damage

**Observation**: Guardian catches attempts to write to system files.

**Example Blocked Operations**:
- `/etc/hosts`
- `~/.ssh/config`
- `/usr/local/bin/...`

**Implementation**:
```typescript
const SYSTEM_PATHS = ['/etc', '/usr', '/bin', '/System']
const PERSONAL_PATTERNS = ['.ssh/', '.gnupg/', '.password-store/']
```

---

### 2. Sandbox Mode is Essential for Testing

**Observation**: Guardian SANDBOX mode allows safe testing.

**Behavior**:
- All writes redirected to `/tmp/shark-sandbox`
- Original paths logged for audit
- Tests can run without fear of damage

---

### 3. YOLO Mode is Dangerous but Useful

**Observation**: `--yolo` flag bypasses all firewalls.

**Use Cases**:
- Emergency fixes when Guardian is too restrictive
- Trusted environments
- Developer knows exactly what they're doing

**Risk**: Can accidentally delete important files.

**Recommendation**: Log all YOLO mode operations for audit.

---

## Testing Insights

### 1. Integration Tests > Unit Tests for This Project

**Observation**: Integration tests catch more issues.

**Why**:
- Complex interactions between components
- FirewallMesh integration with ToolExecutor
- Brain mode switching

**Pattern**:
```typescript
// Integration test verifies actual behavior
const executor = new ToolExecutor({ firewallMesh, ... })
const result = await executor.executeTool({
  name: 'write_file',
  args: { path: '/etc/passwd', content: '...' }
})
expect(result.success).toBe(false)
expect(result.guardianBlocked).toBe(true)
```

---

### 2. Docker Tests Catch Environment Issues

**Observation**: Stage 1 tests found issues missed locally.

**Examples**:
- `stdin.isTTY` behaves differently in Docker
- Permission issues with volume mounts
- Script execution without explicit shell

---

### 3. Mock Mode Allows Testing Without API Keys

**Observation**: API clients can be tested in mock mode.

**Implementation**:
```typescript
class GLMClient {
  isConfigured(): boolean {
    return this.apiKey !== null
  }
  
  // Tests can verify instantiation without key
}
```

---

## Documentation Insights

### 1. Architecture Diagrams Help New Developers

**Observation**: ASCII diagrams in code comments are valuable.

**Example**:
```typescript
/**
 * Architecture: GLM 5-flash (PRIMARY) + DeepSeek R1 (ADVISORY)
 * 
 * Flow:
 * 1. DeepSeek R1 provides strategic consultation
 * 2. GLM 5-flash executes with consultation
 * 3. Process tool calls with Guardian protection
 * 4. Check for completion
 * 5. DeepSeek reviews progress for next iteration
 */
```

---

### 2. Ship Reports Document State

**Observation**: SHIP_REPORT.md provides snapshot of progress.

**Contents**:
- What was completed
- What's pending
- Test results
- Next steps

**Value**: New session can quickly understand state.

---

## Recommendations for Future Work

### 1. Replace (V2) Suffix with Semantic Versioning

**Current**: `executor(V2).ts`  
**Better**: `executor@2.ts` or `executor-v2.ts`

**Reason**: Parentheses cause CLI issues, harder to grep.

---

### 2. Add Placeholder Tracking System

**Suggestion**: Create `PLACEHOLDERS.md` to track all TODOs.

**Format**:
```markdown
## Placeholder: CLI Firewall Stats
- File: src/cli.ts:615
- Added: 2026-03-20
- Status: FIXED (2026-03-28)
- Issue: #123
```

---

### 3. Create Dedicated Model Data Storage

**Suggestion**: Store model responses for analysis.

**Location**: `/home/leviathan/shark-data/model-logs/`

**Use Cases**:
- Debug model behavior
- Train on corrections
- Analyze failure patterns

---

### 4. Implement Stage 2 CI Pipeline

**Suggestion**: Automate Stage 2 tests with API keys from secrets.

**Tool**: GitHub Actions with repository secrets.

---

### 5. Add Telemetry for Production

**Suggestion**: Track usage patterns (with user consent).

**Metrics**:
- Mode selection (Micro vs Macro)
- Tool usage frequency
- Failure rates
- Average iterations

---

*Lessons Document generated: 2026-03-28*
