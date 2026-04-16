# Error Handling - Context Synthesis Mode

## Error Types

| Type | Cause | Response |
|------|-------|----------|
| **Context Overflow** | Total context >2k after compression | Prioritize by score, truncate lowest |
| **Missing Source** | T1/T2/T3/T4 unavailable | Note unavailability, proceed with available |
| **No Decision Points** | Nothing scored high enough | Widen scoring, include lower priority |
| **Stale Context** | Old context worse than no context | Explicit timestamp, flag staleness |

## Failure Modes

### Failure Mode 1: Token Overflow

- **Probability:** High (complex sessions)
- **Impact:** Context too large to inject
- **Detection:** Layer 3 token count >2k
- **Mitigation:** Score-based truncation, preserve decision points

### Failure Mode 2: Missing Critical Context

- **Probability:** Medium (T2 sometimes unavailable)
- **Impact:** Synthesis incomplete
- **Detection:** Layer 1 marks source unavailable
- **Mitigation:** Note unavailability, continue with available

### Failure Mode 3: Incoherent Synthesis

- **Probability:** Low (proper scoring prevents)
- **Impact:** Context doesn't make sense
- **Detection:** Layer 4 validation
- **Mitigation:** Scoring ensures priority, compression deduplicates