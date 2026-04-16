# Lessons Learned: Firewall Bugs

**Date:** 2026-04  
**Version:** v2.x  

---

## Issue

Guardian firewall was blocking legitimate Hermes operations.

---

## Root Cause

Overzealous blocking rules that didn't account for Hermes fork/blocker pattern.

---

## Resolution

1. Identified exact conditions causing blocks
2. Added `.hermes/` directory guard
3. Refined fork blocker to be cooperative rather than aggressive

---

## Prevention

- Test fork blocking in isolation first
- Verify `.hermes/` guard works in all scenarios
- Check cross-plugin interactions

See [GUARDIAN_DEBUG.md](./GUARDIAN_DEBUG.md) for detailed debug log.