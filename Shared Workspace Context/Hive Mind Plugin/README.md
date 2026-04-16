# Hive Mind Plugin — Context Library

**Location:** `/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Hive Mind Integration/`  
**Plugin:** `hive-mind-plugin.ts` (1,487 lines TypeScript)  
**Status:** Deployed | Critical bugs fixed (2026-04-02) | Integration tests MISSING  
**Build:** Spider Agent → Leviathan pressure test → fixes applied  

---

## Quick Access

| Document | Purpose |
|----------|---------|
| `00-CATALOG.md` | Master index — start here |
| `HIVE-MIND-001-SUMMARY.md` | Executive summary |
| `HIVE-MIND-003-STATUS.md` | Current status + blockers |
| `api-reference/HIVE-MIND-020-OV-API.md` | **CRITICAL: API quirks** |
| `failure-logs/VERIFICATION-THEATER-CATALOG.md` | Anti-pattern catalog |
| `indexes/HIVE-MIND-060-QUICKREF.md` | Ops quick reference |

---

## Directory Structure

```
Hive Mind Integration/
├── README.md                        ← This file
├── 00-CATALOG.md                   ← Master index
├── HIVE-MIND-001-SUMMARY.md        ← Executive summary
├── HIVE-MIND-002-FEATURES.md       ← Feature breakdown
├── HIVE-MIND-003-STATUS.md         ← Current status + blockers
├── ARCHITECTURE.md                  ← Original architecture doc
├── BUILD_PLAN.md                    ← Original build plan
├── HIVE-MIND-PLUGIN-FAILURE-LOG.md ← Spider Agent's failures
├── architecture/
│   ├── HIVE-MIND-010-DATA-FLOW.md  ← Data flow diagrams
│   ├── HIVE-MIND-011-STORAGE.md    ← Storage locations
│   └── HIVE-MIND-012-PATTERNS.md   ← Detection patterns
├── api-reference/
│   ├── HIVE-MIND-020-OV-API.md     ← **CRITICAL: API quirks**
│   ├── HIVE-MIND-021-TOOLS.md      ← Tool reference
│   └── HIVE-MIND-022-HOOKS.md      ← Hook handlers
├── operations/
│   ├── HIVE-MIND-030-DEPLOYMENT.md ← Deployment runbook
│   ├── HIVE-MIND-031-HEALTH.md     ← Health checks
│   └── HIVE-MIND-032-TROUBLESHOOTING.md ← Common issues
├── testing/
│   ├── HIVE-MIND-040-TEST-PLAN.md  ← Deployment test plan
│   └── HIVE-MIND-041-UNIT-TESTS.md ← Unit test analysis
├── failure-logs/
│   ├── HIVE-MIND-052-AUDIT-LOG.md  ← Leviathan pressure test
│   └── VERIFICATION-THEATER-CATALOG.md ← Anti-pattern catalog
└── indexes/
    ├── HIVE-MIND-060-QUICKREF.md   ← Ops quick reference
    └── HIVE-MIND-061-ANTISLOP.md   ← Guardrails
```

**25 documents, 252KB total**

---

## Critical Findings

**Verification Theater:** 41 unit tests passed but 3 critical API bugs found.

| Bug | Impact |
|-----|--------|
| `temp_file_id` → `path` | All uploads failed with 422 |
| `result.resources` vs `result.memories` | All searches returned empty |
| Hardcoded threshold `2` vs `3` | Inconsistent breakthrough detection |

---

## Key OpenViking API Quirks

1. `temp_upload` returns `temp_path` (not `temp_file_id`)
2. `resources/commit` expects `path` field (not `temp_file_id`)
3. Search returns `result.resources[]` not `memories[]`

See: `api-reference/HIVE-MIND-020-OV-API.md`

---

## Current Blockers

| Priority | Blocker |
|----------|---------|
| P0 | Integration tests missing |
| P0 | Live plugin loading unverified |
| P1 | Experimental hooks unverified |

---

## Related Documentation

- **Plugin code:** `/home/leviathan/.config/opencode/plugins/hive-mind-plugin.ts`
- **Tests:** `/home/leviathan/.config/opencode/plugins/tests/hive-mind-plugin.test.ts`
- **Full context library:** `/home/leviathan/hermes-workspace/context/builds/hive-mind/`
- **Critical failures:** `/home/leviathan/hermes-workspace/shared/critical-failure-logs/`
- **OpenViking knowledge:** `/home/leviathan/openviking_workspace/viking/default/resources/hive-mind/shared/knowledge/build/hive-mind-plugin/`

---

*Context Library v1.0 — Leviathan Agent — 2026-04-02*
