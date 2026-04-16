# CRITICAL HOTFIX PACKAGE — Shark Agent V4.4

**Base:** Shark Agent V4.3
**Target:** Shark Agent V4.4
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4`
**Severity:** CRITICAL
**Purpose:** Fix 3 critical issues that were documented but never actually fixed

---

## WHY THIS IS CRITICAL

V4.3 is a documentation-only release after 4 iterations. The actual code has never had:
1. Guardian blocking (it logs, then dangerous commands execute)
2. Coordinators wired (they are dead code)
3. Iteration loop wired (VERFIY failure → escalation is fictional)

**This is not acceptable. V4.4 fixes the code, not the reports.**

---

## EXECUTION ORDER

Apply all fixes. No documentation changes. No report formatting.

```
00_INDEX.md                 ← This file
01_FIX_GUARDIAN_BLOCKING.md ← CRITICAL-1: Agent T1 self-rejection
02_FIX_COORDINATORS.md     ← CRITICAL-2: Wire or remove
03_FIX_ITERATION_LOOP.md   ← CRITICAL-3: VERIFY failure → escalation
verify.sh                  ← Run after all fixes
```

---

## FIX MANIFEST

| # | Issue | Severity | Fix Type |
|---|-------|----------|----------|
| 1 | Guardian cannot block — agent must self-reject | CRITICAL | Agent T1 prompt update |
| 2 | Coordinators dead code | CRITICAL | Wire to hooks OR remove |
| 3 | Iteration loop fictional | CRITICAL | Wire to tool.execute.after |

---

## BEFORE STARTING

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Backup V4.3 state
mkdir -p ../shark-agent-v4.3-backup
cp -r src ../shark-agent-v4.3-backup/

# Verify V4.3 source
test -f src/index.ts
test -f src/hooks/v4.1/index.ts
```

---

## VERIFICATION PROTOCOL

After applying ALL fixes:

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bash /home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4-CRITICAL-HOTFIX/FIX_PACKAGE/verify.sh
```

**EXIT 0** = all checks pass, ready to build V4.4
**EXIT 1** = one or more checks failed, do not proceed

---

## FAILURE PROTOCOL (HARD)

If ANY verification fails:
1. STOP immediately
2. Report which fix failed
3. Do NOT proceed to next fix
4. Do NOT mark complete with open issues

---

*Hotfix package. Critical code fixes only.*
