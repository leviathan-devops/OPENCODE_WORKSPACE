# Error Handling - Problem Solving Mode

## Error Types

| Type | Cause | Response |
|------|-------|----------|
| **Host Fallback** | "host testing proves it works" | BLOCKER - requires external evidence |
| **Success Claim Without Proof** | "assessment shows it works" | BLOCKER - requires raw output |
| **Mock/Stub Suggestion** | "use mock approach" | WARNING - requires real environment |
| **Blind Retry** | Same action after failure | BLOCKER - gap analysis required |
| **Self-Referencing Proof** | JSON created = evidence | BLOCKER - external evidence only |

## Failure Modes

### Failure Mode 1: Evidence-Free Claims
- **Probability:** High
- **Impact:** False positive resolution
- **Detection:** Layer 3 requires raw evidence
- **Mitigation:** Gate blocks advancement without copied output

### Failure Mode 2: Intuition-Based Assumptions
- **Probability:** Medium
- **Impact:** Wrong root cause
- **Detection:** Layer 1 requires reasoning chain
- **Mitigation:** Gate requires explicit reasoning

### Failure Mode 3: Repetitive Failure
- **Probability:** High (without gap analysis)
- **Impact:** Wasted iterations
- **Detection:** Layer 4 requires gap analysis
- **Mitigation:** Each failure must add information

### Failure Mode 4: Syntax-Only Verification
- **Probability:** Medium
- **Impact:** Behavior mismatch
- **Detection:** Layer 6 requires target environment
- **Mitigation:** Gate requires actual execution