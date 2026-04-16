# CRITICAL HOTFIX — Shark Agent V4.4

**Audit source:** Shark Agent V4 build history (V4.0-V4.3)
**Build source:** `/home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4`
**Hotfix package:** `/home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4-CRITICAL-HOTFIX/`

---

## Why This Is Critical

After 4 build iterations, the Shark Agent V4 has:
- Hooks wired ✅
- Guardian advisory-only (logs, cannot block) ⚠️
- Gate advancement via heuristic ⚠️
- Evidence collection ⚠️
- **Coordinators completely unwired — dead code** ❌
- **Iteration loop fictional** ❌

The V4.3 release was a documentation-only release. The build was spending iterations fixing documentation while critical code issues remained unfixed.

**V4.4 fixes the code. Not the reports.**

---

## What V4.4 Fixes

| Fix | Issue | Impact |
|-----|-------|--------|
| 01 | Guardian advisory — agent has no self-rejection | Dangerous commands execute after Guardian logs them |
| 02 | Coordinators dead code | Mechanical brain switching is fictional |
| 03 | Iteration loop unwired | 3 VERIFY failures → escalation never fires |

---

## File Structure

```
shark-agent-v4-CRITICAL-HOTFIX/
├── AUDIT.md                    ← Critical audit (why we are here)
└── FIX_PACKAGE/
    ├── 00_INDEX.md           ← Execution order + manifest
    ├── 01_FIX_GUARDIAN_AGENT_SELF_REJECTION.md  ← CRITICAL-1
    ├── 02_FIX_COORDINATORS.md  ← CRITICAL-2
    ├── 03_FIX_ITERATION_LOOP.md ← CRITICAL-3
    ├── verify.sh              ← Mechanical verification
    └── README.md             ← This file
```

---

## Before Building V4.4

```bash
bash /home/leviathan/OPENCODE_WORKSPACE/documentation/build-reports/shark-agent-v4-CRITICAL-HOTFIX/FIX_PACKAGE/verify.sh
```

**EXIT 0 required before proceeding.**

---

## How to Use

1. Read `AUDIT.md` to understand the critical failure
2. Read `FIX_PACKAGE/00_INDEX.md` for execution order
3. Apply Fix-01, Fix-02, Fix-03 in order
4. Run `verify.sh` — EXIT 0 = ready to build V4.4
