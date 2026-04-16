# FIX PACKAGE INDEX — Shark Agent V4.2

**Base:** Shark Agent V4.1
**Target:** Shark Agent V4.2
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4`
**Purpose:** Fix 4 unresolved issues from V4.1 audit

---

## EXECUTION ORDER

Apply fixes in this order. Do not skip. Do not parallelize.

```
01_INDEX.md                          ← This file
02_INDEX.md                          ← Per-fix manifest
03_FIX_GUARDIAN_BLOCKING.md
04_FIX_COORDINATORS.md
05_FIX_TYPESCRIPT.md
06_FIX_GATENAME_IMPORT.md
verify.sh                            ← Run after all fixes
```

---

## FIX MANIFEST

| # | Fix | Severity | Files Changed |
|---|-----|----------|---------------|
| 1 | Guardian cannot block | HIGH | `src/hooks/v4.1/guardian-hook.md` (doc), `src/index.ts` |
| 2 | Coordinators unreachable | HIGH | `src/index.ts`, `src/hooks/v4.1/index.ts` |
| 3 | TypeScript unchecked | MEDIUM | Build verification step |
| 4 | GateName import | LOW | `src/hooks/v4.1/gate-hook.ts` |

---

## BEFORE STARTING

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Verify V4.1 source is present
test -f src/index.ts
test -f src/hooks/v4.1/index.ts
test -f src/hooks/v4.1/guardian-hook.ts

# Create backup
mkdir -p ../shark-agent-v4.1-backup
cp -r src ../shark-agent-v4.1-backup/
```

---

## VERIFICATION PROTOCOL

After applying ALL fixes:

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bash ../shark-agent-v4.1-v4.2-fix-package/FIX_PACKAGE/verify.sh
```

**EXIT 0** = all checks pass, ready to build V4.2
**EXIT 1** = one or more checks failed, do not proceed

---

## FAILURE PROTOCOL

If ANY verification fails:
1. STOP — do not apply more fixes
2. IDENTIFY — which fix, which step, expected vs actual
3. REPORT — "Fix N failed at verification: [step]"
4. AWAIT — human instruction before retrying

Do NOT allow:
- Applying multiple fixes when one fails
- Skipping failing verifications
- Proceeding with known failures
- Marking complete with open issues

---

*Fix package index. Execute fixes in order.*
