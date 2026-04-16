# Error Handling - Deep Planning Mode

## Error Types

| Type | Cause | Response |
|------|-------|----------|
| **Shallow Reasoning** | Layer output doesn't meet structural requirements | Reject advancement, return specific gaps |
| **Template Mismatch** | Output doesn't match template structure | Flag non-compliant sections |
| **Iteration Overflow** | Too many failed attempts | Suggest escalation or manual review |
| **State Corruption** | Serialized state doesn't match expected schema | Reinitialize with warning |

## Failure Modes

### Failure Mode 1: Premature Layer Advancement
- **Probability:** High (tempting to skip)
- **Impact:** Shallow output that doesn't enforce thinking
- **Detection:** Gate validator catches missing requirements
- **Mitigation:** Mechanical gates block advancement

### Failure Mode 2: Quantitative Instead of Structural
- **Probability:** Medium (easy to add chars, hard to add depth)
- **Impact:** Passes gate but still shallow reasoning
- **Detection:** Gate validator checks structure, not length
- **Mitigation:** Templates enforce structural requirements

### Failure Mode 3: Iteration Skipping
- **Probability:** Medium (pressure to move fast)
- **Impact:** V1.0 → V2.0 skipping depth
- **Detection:** State machine enforces V1.0 → V1.1 → V1.2
- **Mitigation:** Iteration is per-layer, not per-mode

## Recovery Strategies

1. **Shallow output:** Return to same iteration with specific gaps
2. **State loss:** Restore from last valid checkpoint
3. **Template mismatch:** Highlight specific non-compliant sections