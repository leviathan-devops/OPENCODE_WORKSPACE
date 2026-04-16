# TRIDENT BRAIN v3.0 - RELOAD ANCHOR
## Master Index

**Version:** 3.0.0  
**Status:** SHIP READY ✅  
**Type:** SELF-CONTAINED RECOVERY PACKAGE  
**Date:** 2026-04-14

---

## FOR RECOVERY

**START HERE:** `RECOVERY.md` - Complete restoration guide

**QUICK RESTORE:**
```bash
cp -r dist/* ~/.config/opencode/plugins/trident-brain/
```

**FULL RESTORE:**
```bash
cd scripts && ./recover.sh
```

---

## FOLDER STRUCTURE

| Folder | Contents |
|--------|----------|
| `src/` | TypeScript source (2,082 lines) |
| `dist/` | Built plugin (READY TO DEPLOY) |
| `pkg/` | package.json, tsconfig.json |
| `docs/` | 14 documentation files |
| `scripts/` | build.sh, deploy.sh, recover.sh |

---

## KEY FILES

| File | Purpose |
|------|---------|
| `RECOVERY.md` | Full restoration guide |
| `scripts/recover.sh` | One-command full restore |
| `scripts/deploy.sh` | Deploy to OpenCode |
| `src/index.ts` | Plugin entry point |
| `src/algorithmic-core.ts` | Core logic & patterns |
| `docs/SHIP_PACKAGE.md` | Complete ship documentation |

---

## CAPABILITIES

| Feature | Status |
|---------|--------|
| Pattern Detection | ✅ 100+ patterns |
| Real-Time Firewall | ✅ safetyCount protected |
| Tool Enforcement | ✅ Blocks edit/write/bash |
| document_fix | ✅ WHY/HOW explanations |
| Proof Verification | ✅ Filesystem checks |
| Hook Analysis | ✅ Cross-plugin detection |
| No Duplicate Bug | ✅ Fixed |
| Universal Patterns | ✅ Not agent-specific |

---

## VERIFICATION

**Mechanical Tests: 7/7 PASSED**

```
TEST 1: Pattern Matching     ✅
TEST 2: No Duplicate Bug     ✅
TEST 3: SafetyCount Limit    ✅
TEST 4: Line Numbers         ✅
TEST 5: Evidence is Real     ✅
TEST 6: Audit Engine        ✅
TEST 7: Multi-Category      ✅
```

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Plugin not loading | Check config path ends in `/dist` |
| Build fails | Run `npm install` first |
| Audit hangs | Fixed in v3.0 - run recovery if persists |
| "fix" doesn't work | Use `show fix documentation` |

---

## DOCUMENTATION (docs/)

| File | Lines | Purpose |
|------|-------|---------|
| `INDEX.md` | This | Navigation |
| `RECOVERY.md` | 250+ | Restoration guide |
| `SHIP_PACKAGE.md` | 234 | Complete ship guide |
| `FINAL_SHIP_REPORT.md` | 133 | Verification results |
| `MECHANICAL_TEST_SUITE.md` | 406 | 20 test prompts |
| `00_INDEX.md` - `06_BUG_FIX.md` | ~800 | History & fixes |
| `PATTERNS.md` | 131 | Pattern reference |
| `ARCHITECTURAL_VIOLATION_REPORT.md` | 427 | Design spec |

---

## BUILD & DEPLOY

```bash
# Build from source
cd pkg && npm install && npm run build

# Deploy
cp -r dist/* ~/.config/opencode/plugins/trident-brain/

# Verify
ls ~/.config/opencode/plugins/trident-brain/
```

---

## GIT

```
Tag: v3.0.0
Commit: cf88c56
Status: SHIP READY
```

---

## EMERGENCY SINGLE COMMAND

```bash
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Trident\ Brain/Code\ Review\ Mode/dist/* ~/.config/opencode/plugins/trident-brain/ && echo "RESTORED"
```

---

*Reload Anchor v3.0 - Last Verified: 2026-04-14*