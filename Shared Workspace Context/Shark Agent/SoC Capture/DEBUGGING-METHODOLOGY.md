# Debugging Methodology: System-integration Failure Analysis

**Purpose:** Systematic approach to debugging system-integration failures where tests pass but real-world behavior is broken.

---

## The Core Problem: Verification Theater

When unit tests pass but the system doesn't work, the root cause is usually:

1. **Tests use mocks** — Mocks verify logic, not behavior
2. **Tests don't exercise infrastructure** — Database, network, queues, external services
3. **Tests don't verify integration points** — How components talk to each other

---

## Systematic Debugging Protocol

### Step 1: Observe, Don't Assume

**Rule:** Never assume the test results reflect reality. Always verify against running infrastructure.

```
Actions:
- Run integration tests manually
- Check service health endpoints
- Inspect queue states
- Verify network connectivity
```

### Step 2: Isolate the Failure Point

**Rule:** Pinpoint WHERE the failure occurs before asking WHY.

```
Questions:
- Does the service start?
- Does the health check pass?
- Does the first API call succeed?
- Where in the request pipeline does it fail?
```

### Step 3: Check Infrastructure Dependencies

**Rule:** External dependencies (databases, queues, embedding servers) are often the real failure point.

```
Checklist:
☐ Service process running?
☐ Health endpoint responding?
☐ Dependencies (DB, queue, cache) accessible?
☐ Version alignment between components?
☐ Recent deployment changed anything?
```

### Step 4: Test Components in Isolation

**Rule:** Verify each component works independently before testing integration.

```
Individual Tests:
- API endpoint: curl
- Database connection: simple query
- Queue processing: single item
- Network: telnet to port
```

### Step 5: Trace the Request Path

**Rule:** Follow the request through the entire system to find where it breaks.

```
Request Path:
1. HTTP endpoint receives request
2. Validation/parsing
3. Authentication/authorization
4. Business logic
5. Database/queue operations
6. External service calls
7. Response construction
```

### Step 6: Look for Silent Failures

**Rule:** Check if operations are silently failing or creating pseudo-state.

```
Silent Failure Patterns:
- Optional parameters used when required
- Fallback to defaults without warning
- "Helper" code that masks errors
- Pseudo-ID creation when real IDs unavailable
- Empty arrays returned as "success"
```

### Step 7: Check Context Isolation

**Rule:** Verify that context from one session/entity doesn't leak into another.

```
Isolation Tests:
- Session A's data visible to Session B?
- Request A's state affects Request B?
- Global state modified by scoped operation?
- Cache entries shared inappropriately?
```

---

## Common Failure Patterns

### 1. Mock-Based Testing
```
Symptom: Unit tests pass, integration fails
Cause: Mocks don't exercise real behavior
Fix: Add integration tests with real infrastructure
```

### 2. Version Mismatch
```
Symptom: Code doesn't match running service
Cause: Server not rebuilt/redeployed
Fix: Verify version alignment in CI
```

### 3. Silent Fallbacks
```
Symptom: Operation appears to work but uses degraded mode
Cause: Fallback paths taken without warning
Fix: Log all fallback activations explicitly
```

### 4. Missing Timeouts
```
Symptom: Operations hang forever
Cause: Blocking calls without timeout
Fix: Add timeouts to all external calls
```

### 5. Context Not Required
```
Symptom: Cross-session data leakage
Cause: Context ID optional instead of required
Fix: Make context ID REQUIRED, fail if missing
```

---

## Investigation Checklist

When debugging "tests pass but system broken":

- [ ] Run integration tests against real infrastructure
- [ ] Check all service health endpoints
- [ ] Verify infrastructure dependencies are running
- [ ] Check version alignment (server vs client vs source)
- [ ] Test API endpoints manually with curl
- [ ] Inspect queue/background job state
- [ ] Look for silent failures or fallback activations
- [ ] Verify context isolation between sessions
- [ ] Check if operations have proper timeouts
- [ ] Trace request path end-to-end

---

## OpenViking-Specific Findings

This debugging session revealed these OpenViking characteristics:

### Embedding Server Dependency
- OpenViking requires llama.cpp embedding server on port 8001
- If down, `wait:true` hangs indefinitely
- Health check shows server OK even if embedding server is down

### Queue Processing Bug
- `wait_complete()` loops until queue is empty
- If queue worker is stuck, wait never completes
- No automatic recovery mechanism observed

### Version Drift
- Installed server (pip) vs source code (git)
- Server not automatically rebuilt on source change
- Version check essential for debugging

---

## Related Documents

- [Hive Mind Plugin Debugging SoC](../Hive%20Mind%20Plugin/SoC%20Capture/HIVE-MIND-PLUGIN-DEBUGGING-SOC.md)
- [OpenViking Architecture](../Hive%20Mind%20Plugin/architecture/)

---

*Debugging Methodology — Leviathan Agent — 2026-04-08*
