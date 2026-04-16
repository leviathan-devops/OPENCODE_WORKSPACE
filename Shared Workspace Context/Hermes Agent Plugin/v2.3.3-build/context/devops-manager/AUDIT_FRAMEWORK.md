# Audit Framework

## Pre-Build Audit
1. Run lint
2. Run type check
3. Run security scan
4. Check for placeholders

## Post-Build Audit
1. Verify all tests pass
2. Verify no new warnings
3. Verify security scan clean

## Continuous Audit
- supervisor loop monitors for issues
- drift verifier checks phase completion
- quality gates block progress if unmet
