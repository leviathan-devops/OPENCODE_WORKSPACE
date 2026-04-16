# Lessons Learned: Guardian Debug

**Date:** 2026-04  
**Version:** v2.x  

---

## Debug Session

Investigated Guardian firewall blocks on Hermes operations.

---

## Findings

1. Fork blocker was too aggressive
2. Missing cooperative check pattern
3. Cross-agent context pollution

---

## Fixes Applied

1. Implemented `ForkManager.isActive()` cooperative check
2. Added `.hermes/` directory guard
3. Separated brainstorm gate from tool blocking

---

## References

- `GUARDIAN_FIREWALL_BUG_HANDOVER.md` in original location
- `GUARDIAN_FIREWALL_FAILURE_LOG.md` in original location