# Testing Strategy - Deep Planning Mode

## Unit Tests

### Layer 1 Tests
- [ ] Generates surface understanding that isn't just restating user input
- [ ] Produces 3+ first principles that are fundamental truths
- [ ] Constraints are actual limits, not platitudes
- [ ] Success criteria are measurable
- [ ] Open questions identify actual gaps

### Layer 2 Tests
- [ ] Produces 5+ components with clear responsibilities
- [ ] Sequence shows true ordering constraints
- [ ] Dependencies are mechanical, not arbitrary
- [ ] Failure modes are real risks
- [ ] Verification defined per component

### Layer 3 Tests
- [ ] Context library is self-contained
- [ ] Another agent can execute from artifacts alone
- [ ] No ambiguous or missing pieces
- [ ] Mental model fits in one paragraph

### Gate Validator Tests
- [ ] Blocks advancement when requirements unmet
- [ ] Returns specific gap reasons
- [ ] Passes when structure correct

## Integration Tests

- [ ] Layer 1 → Layer 2 transition works
- [ ] Layer 2 → Layer 3 transition works
- [ ] Iteration deepens same layer
- [ ] State persists across transitions

## Verification Approach

Use problem-solving mode itself to verify:
1. Run Deep Planning on a known task
2. Have Problem Solving Mode analyze the output
3. Verify output is actionable by another agent