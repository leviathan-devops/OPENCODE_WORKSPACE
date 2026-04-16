# Shark Agent V4.5 — Critical Fix Package

**Base:** V4.4 (FAILED)
**Target:** V4.5
**Source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4`
**Severity:** CRITICAL
**Purpose:** Fix V4.4's 3 critical failures so the plugin actually builds and runs

---

## WHY THIS IS CRITICAL

V4.4 FAILED its own build verification:
- TypeScript exits 2 (not 0) due to ghost file
- Iteration escalation doesn't immediately reach the agent
- Version comment in index.ts wasn't updated

The V4.4 agent made real code changes but left the build broken. This is worse than V4.3's documentation-only release.

---

## EXECUTION ORDER

```
00_INDEX.md           ← This file
01_FIX_GHOST_FILE.md  ← Remove stale backup causing TS failure
02_FIX_ESCALATION.md  ← Make iteration escalation reach agent immediately
03_FIX_VERSION.md     ← Update index.ts version comment to V4.4
verify.sh             ← Run after all fixes
```

---

## FIX MANIFEST

| # | Issue | Severity | Fix Type |
|---|-------|----------|----------|
| A | Ghost file `index.v4.0.ts` | CRITICAL | File deletion |
| B | Iteration escalation broken | CRITICAL | Hook logic fix |
| C | Version comment stale | MINOR | Documentation |

---

## BEFORE STARTING

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Verify V4.4 state (should show broken build)
test -f src/index.ts
test -f src/hooks/v4.1/gate-hook.ts

# Confirm ghost file exists
test -f src/index.v4.0.ts && echo "Ghost file present (expected)"
```

---

## VERIFICATION PROTOCOL

After applying ALL fixes:

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4
bash /home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4-CRITICAL-AUDIT-V4.4/FIX_PACKAGE/verify.sh
```

**EXIT 0** = all checks pass, ready to build V4.5
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