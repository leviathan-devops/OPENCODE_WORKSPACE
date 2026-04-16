# FAILURE MODE ANALYSIS - Building Problem Solving Mode

## Failure Mode 1: Host Fallback

- **Probability:** High
- **Impact:** "Host testing proves it works" bypasses evidence requirement
- **Detection:** Layer 3 anti-derailment check
- **Mitigation:** BLOCKER - requires external evidence

## Failure Mode 2: Self-Referencing Proof

- **Probability:** High
- **Impact:** Agent creates file, claims file existence as proof
- **Detection:** Layer 3 requires evidence from EXTERNAL system
- **Mitigation:** BLOCKER - JSON created by agent ≠ evidence

## Failure Mode 3: Blind Retry

- **Probability:** High
- **Impact:** Same action after failure, no new information
- **Detection:** Layer 4 requires gap analysis
- **Mitigation:** Cannot advance without "therefore Z"

## Failure Mode 4: Syntax-Only Verification

- **Probability:** Medium
- **Impact:** "Compiles" claimed as "works"
- **Detection:** Layer 6 requires target environment
- **Mitigation:** Must execute in target, not just build