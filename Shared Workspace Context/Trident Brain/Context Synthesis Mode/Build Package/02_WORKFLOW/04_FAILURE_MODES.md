# FAILURE MODE ANALYSIS - Building Context Synthesis Mode

## Failure Mode 1: Context Overflow

- **Probability:** High (complex sessions)
- **Impact:** >2k tokens, can't inject
- **Detection:** Layer 3 token count
- **Mitigation:** Score-based truncation

## Failure Mode 2: Empty Synthesis

- **Probability:** Low (all sources usually have something)
- **Impact:** Nothing to inject
- **Detection:** Layer 1 collection
- **Mitigation:** Note empty, include what exists

## Failure Mode 3: Wrong Priority

- **Probability:** Medium (scoring formula issues)
- **Impact:** Important context dropped
- **Detection:** Layer 2 scoring
- **Mitigation:** Tune urgency/importance weights