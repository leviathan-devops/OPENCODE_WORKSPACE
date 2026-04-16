# Tasks: Manta Agent Gate Fixes

## Completed Tasks

- [x] Fix BUILD→TEST premature transition (require impl file + code content)
- [x] Fix TEST→VERIFY premature transition (specific verification commands only)
- [x] Fix AUDIT→DELIVERY weak transition (clean scan output required)
- [x] Fix VERIFY failure false positive (specific error patterns)
- [x] Sync fixes to workspace source
- [x] Run reproduction tests (repro_breaks.ts) — 13/13 PASS
- [x] Run regression suite (bun test) — 55 pass, 0 fail

## Remaining Tasks

- [ ] Run end-to-end agent test to verify full gate chain works correctly in actual agent session
- [ ] Verify evidence collection at each gate in actual agent execution
- [ ] Document remaining edge cases (if any)
