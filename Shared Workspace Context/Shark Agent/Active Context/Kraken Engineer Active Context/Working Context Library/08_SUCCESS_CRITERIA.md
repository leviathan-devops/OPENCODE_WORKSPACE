# Success Criteria — Ship Gate Requirements

## Ship Gate Definition

The delivery phase requires ALL previous gates to be passed plus:
1. Evidence archived
2. Checkpoint created
3. **Container test suite passed**

## Evidence Requirements by Gate

### Plan Gate
```
Required:
- SPEC.md (project specification)
- GuardianConfig.json (scope boundaries)

Blocking Criteria:
- Clear requirements defined
- SPEC.md generated
- Scope boundaries defined
- Acceptance criteria defined
```

### Build Gate
```
Required:
- FileManifest.json (list of created files)
- GitDiff.txt (changes made)

Blocking Criteria:
- Files created per SPEC.md
- No scope violations
- Implementation matches spec
```

### Test Gate
```
Required:
- TestResults.xml
- CoverageReport.json (coverage >= 80%)

Blocking Criteria:
- Tests pass
- Coverage >= 80%
- No weak assertions (toBeTruthy banned)
```

### Verify Gate
```
Required:
- VerificationReport.json

Blocking Criteria:
- SPEC.md alignment verified
- Integration tests pass
- Edge cases handled
- No theatrical code
- Error handling complete
```

### Audit Gate
```
Required:
- SASTReport.json (0 critical/high)
- SecretsScan.json (no secrets)
- AuditReport.json

Blocking Criteria:
- SAST clean (0 critical/high)
- No secrets detected
- Dependencies audited (no critical CVEs)
```

### Delivery Gate (SHIP)
```
Required:
- EvidenceArchive.zip
- DeliverySummary.md
- ContainerTestResult.json (passRate >= 0.96)

Blocking Criteria:
- All previous gates passed
- Evidence archived
- Checkpoint created
- Container test suite passed
```

## Mechanical Evidence Check

For L5.2 (Success Claim) and L5.4 (Mock/Stub), the firewall requires:

```typescript
function hasContainerTestEvidence(): boolean {
  const path = '.shark/evidence/delivery/ContainerTestResult.json';
  if (!fs.existsSync(path)) return false;
  
  const result = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return result.overallPassed && result.passRate >= 0.96;
}
```

## Container Test Result Schema

```json
{
  "suite": "shark-agent-v4",
  "timestamp": 1712860800000,
  "buildId": "shark-v4.7-2026-04-11T12:00:00",
  "tests": [
    {
      "name": "build-succeeds",
      "passed": true,
      "output": "Build successful"
    },
    {
      "name": "brain-initialization",
      "passed": true,
      "output": "Brain: shark"
    }
  ],
  "overallPassed": true,
  "totalTests": 5,
  "passedTests": 5,
  "failedTests": 0,
  "passRate": 1.0
}
```

## Checkpoint Requirements

Checkpoints must be:
1. **Self-contained** in their checkpoint folder
2. **Read-only** after ship (marked with `.shipped` file)
3. **Easily locatable** via clear naming

### Checkpoint Structure
```
.checkpoints/
├── v4.8.3-checkpoint-1/     # Working copy (read-write)
│   ├── src/
│   └── .checkpoint-meta.json
├── v4.8.3-checkpoint-2/      # Brain init working (read-write)
│   ├── src/
│   └── .checkpoint-meta.json
├── v4.8.3-SHIPPED/           # Passed ship gate (READ-ONLY)
│   ├── src/
│   ├── .shipped              # READ-ONLY marker
│   └── .ship-package/
│       ├── evidence/
│       └── changelog.md
```

## Ship Gate Test Sequence

1. **Host test** — verify basic functionality
   ```bash
   opencode run "shark-status" --agent shark
   ```

2. **Container test** — verify isolated environment
   ```bash
   docker run --rm -v "$HOME/.config/opencode:/root/.config/opencode" \
     opencode-test:1.4.3 --entrypoint /bin/bash -c \
     "cd /root && opencode run 'shark-status' --agent shark"
   ```

3. **Full test suite** — verify all components
   ```bash
   opencode run "shark-test-runner" --agent shark
   ```

4. **Evidence check** — verify all files present
   ```bash
   cat .shark/evidence/delivery/ContainerTestResult.json
   ```

5. **Checkpoint** — create snapshot
   ```bash
   checkpoint create v4.8.3-final
   ```

## Ship Failure Conditions

Ship gate will FAIL if:
1. Container test does not pass
2. Evidence file missing or invalid schema
3. passRate < 0.96
4. Checkpoint creation fails
5. Any previous gate evidence missing

## Ship Success Conditions

Ship gate will PASS if:
1. All previous gates passed
2. Container test returns `overallPassed: true`
3. Container test has `passRate >= 0.96`
4. Evidence files exist and valid
5. Checkpoint created with `.shipped` marker

## Verification Checklist

- [ ] Host test passes
- [ ] Container test passes
- [ ] shark-test-runner passes with passRate >= 0.96
- [ ] ContainerTestResult.json exists at `.shark/evidence/delivery/`
- [ ] All gate evidence files present
- [ ] Checkpoint created
- [ ] Checkpoint marked as shipped
