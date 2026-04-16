# INITIAL PLAN: Building Problem Solving Mode

## Surface Understanding

Problem Solving Mode needs to force evidence-based debugging through 6 mechanical gates. It should prevent the 14 categories of derailment that cause debugging to fail: Host Fallback, Success Claims Without Proof, Mock/Stub, etc.

## First Principles

1. **No Evidence = No Claim** - Cannot claim success without showing raw proof
2. **Each Failure Is Information** - Gap analysis must inform next action
3. **External Verification Required** - Cannot verify with self-created JSON

## Constraints

- Must use only write/read tools for artifacts
- External evidence must come from actual execution
- Cannot skip layers or merge iterations
- Must prevent self-referencing proofs

## Success Criteria

1. Layer 1 requires explicit assumption + reasoning chain
2. Layer 3 requires raw evidence, not descriptions
3. Layer 6 requires target environment verification
4. Anti-derailment catches Host Fallback, Mock/Stub, Success Claims

## Open Questions

1. How to prevent Layer 3 from accepting self-created JSON as evidence?
2. Should gap analysis be structured (Expected/Actual/Therefore) or freeform?
3. How to detect "syntax works, behavior doesn't" failures?

## Direction

Following Code Review Mode's anti-derailment pattern:
1. Each layer has explicit anti-derailment checks
2. Evidence must be EXTERNAL (logs, execution output)
3. Gap analysis forces learning, not retry
4. Layer 6 requires target environment execution