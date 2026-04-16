# AUDIT PACKAGE MANIFEST
**Audit ID**: v2.3.5-audit-2026-0407
**Package**: Hermes Agent Plugin v2.3.5 Build Audit
**Date**: 2026-04-07

---

## CONTENTS

| File | Description |
|------|-------------|
| `BUILD_AUDIT_REPORT.md` | Main audit document — full technical details |
| `EVIDENCE_DIST_CHECK.txt` | grep verification of fixes in dist/index.js |
| `EVIDENCE_BUILD_OUTPUT.txt` | Build command output |
| `EVIDENCE_TEST_RESULTS.txt` | E2E test output |
| `EVIDENCE_FIX_VERIFICATION.txt` | Mechanical fix verification output |

---

## QUICK SUMMARY

**Build**: v2.3.5
**Status**: READY FOR AUDIT
**Critical Issue Fixed**: dist/index.js was stale (never rebuilt in v2.3.3)

**Before**: dist/index.js contained v2.3.2 code (broken tools)
**After**: dist/index.js contains v2.3.5 code (fixed tools)

**E2E Tests**: 144/147 (98.0%) — no regressions

**Fixes Verified**:
- lint ESLint config fallback (combined stdout+stderr)
- grill directory scanning
- complexity_hotspots O(n²) detection
- symbols Python file support
- /Hermes CLI command routing
- Path traversal security

---

## KEY EVIDENCE

1. **dist/index.js timestamp**: 2026-04-07 22:33:40 (freshly rebuilt)
2. **dist/index.js size**: 562,059 bytes
3. **combinedOutput at line 15145**: Confirms lint fix in dist
4. **scanForVulnerabilities at line 15325**: Confirms grill fix in dist
5. **nested loop pattern at line 15350**: Confirms complexity fix in dist
6. **ext === "py" at line 15519**: Confirms symbols fix in dist
7. **createHermesCommandHook at line 16089**: Confirms CLI fix in dist

---

## AUDITOR CHECKLIST

- [ ] Review BUILD_AUDIT_REPORT.md
- [ ] Verify dist/index.js timestamp is recent
- [ ] Run grep commands in EVIDENCE_DIST_CHECK.txt
- [ ] Run `bun build.ts` to confirm clean build
- [ ] Run `npx tsx test-e2e.ts` to confirm 144/147
- [ ] Run `bun test-final.ts` to verify fixes
- [ ] Sign off or request changes

---

## CONTACT

Build performed by: Shark Agent (opencode-agent)
Date: 2026-04-07
Build workspace: `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hermes Agent Plugin/v2.3.5-build/`
