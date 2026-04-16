# FIX PACKAGE INDEX — Shark Agent V4.3

**Base:** Shark Agent V4.2
**Target:** Shark Agent V4.3
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4`
**Purpose:** Fix 2 documentation issues from V4.2 audit

---

## EXECUTION ORDER

Apply fixes in order. Do not skip.

```
00_INDEX.md                           ← This file
01_FIX_STATUS_TABLE.md                ← Fix V4.3 unauthorized commitment
02_FIX_VERIFICATION_OUTPUT.md         ← Fix self-certifying verification
verify.sh                             ← Run after all fixes
```

---

## FIX MANIFEST

| # | Fix | Severity | Files Changed |
|---|-----|----------|---------------|
| 1 | Status table V4.3 commitment | LOW | `shark-agent-v4.2-build-report-2026-04-06.md` |
| 2 | Verification shows actual output | LOW | `shark-agent-v4.2-build-report-2026-04-06.md` |

---

## BEFORE STARTING

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Verify V4.2 source is present
test -f src/index.ts
test -f src/hooks/v4.1/guardian-hook.ts

# Backup the report before editing
cp /home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4.2-build-report-2026-04-06.md \
   /home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4.2-build-report-2026-04-06.md.bak
```

---

## VERIFICATION PROTOCOL

After applying ALL fixes:

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bash /home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4.2-v4.3-fix-package/FIX_PACKAGE/verify.sh
```

**EXIT 0** = all checks pass, ready to build V4.3
**EXIT 1** = one or more checks failed, do not proceed

---

## FAILURE PROTOCOL

If ANY verification fails:
1. STOP — do not apply more fixes
2. IDENTIFY — which fix, which step, expected vs actual
3. REPORT — "Fix N failed at verification: [step]"
4. AWAIT — human instruction before retrying

---

*Fix package index. Execute fixes in order.*
