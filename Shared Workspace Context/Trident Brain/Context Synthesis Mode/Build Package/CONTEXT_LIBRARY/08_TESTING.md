# Testing Strategy - Context Synthesis Mode

## Unit Tests

### Layer 1 Tests
- [ ] All 4 sources checked (T1, T2, T3, T4)
- [ ] Unavailable sources noted
- [ ] Collection complete flag set correctly

### Layer 2 Tests
- [ ] All context items scored
- [ ] Final score = (Urgency × 0.6) + (Importance × 0.4)
- [ ] Ranking correct (highest first)

### Layer 3 Tests
- [ ] Token count <2,000
- [ ] Decision points preserved
- [ ] Redundant information deduplicated

### Layer 4 Tests
- [ ] T0-ready format
- [ ] All required sections present
- [ ] Total tokens accurate

## Integration Tests

- [ ] Trigger detection works for all 5 types
- [ ] Layer progression correct
- [ ] Output is injectable