# VERIFICATION STRATEGY - Building Context Synthesis Mode

## Collection Verification

- **Test Approach:** Mock all 4 sources, verify collection
- **Success Metric:** All sources checked, status accurate

## Scoring Verification

- **Test Approach:** Known context items with expected scores
- **Success Metric:** Score formula correct, ranking accurate

## Compression Verification

- **Test Approach:** Large context → verify <2k output
- **Success Metric:** Token count accurate, decisions preserved

## Injection Verification

- **Test Approach:** Verify T0 format is parseable
- **Success Metric:** Thought stream readable