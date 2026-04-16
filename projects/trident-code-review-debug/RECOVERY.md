# TRIDENT BRAIN v3.0 - RELOAD ANCHOR & RECOVERY GUIDE
## Self-Contained Restoration Package

**Version:** 3.0.0  
**Status:** SHIP READY  
**Date:** 2026-04-14

---

## PURPOSE

This folder is the **RELOAD ANCHOR** for Trident Brain v3.0.

If the working plugin becomes corrupted, broken, or fails to load:
1. Point any agent at this folder
2. Say "restore trident brain from this folder"
3. The plugin will be fully restored

---

## FOLDER STRUCTURE

```
Code Review Mode/ (THIS FOLDER - RELOAD ANCHOR)
├── src/                    # Source code (TypeScript)
│   ├── index.ts           # Plugin entry, hooks, commands
│   └── algorithmic-core.ts # Patterns, scanners, engines
├── dist/                   # Built plugin (READY TO DEPLOY)
│   ├── index.js           # Entry point
│   └── algorithmic-core.js # Core logic
├── pkg/                    # Package files
│   ├── package.json      # Version 3.0.0
│   ├── package-lock.json
│   └── tsconfig.json
├── docs/                   # Full documentation (14 files)
│   ├── INDEX.md           # Master navigation
│   ├── SHIP_PACKAGE.md   # Complete ship guide
│   ├── FINAL_SHIP_REPORT.md # Verification results
│   ├── MECHANICAL_TEST_SUITE.md # 20 test prompts
│   ├── 00_INDEX.md - 06_BUG_FIX.md # History & fixes
│   ├── PATTERNS.md       # Detection patterns
│   └── ARCHITECTURAL_VIOLATION_REPORT.md
├── scripts/               # Recovery scripts
│   ├── build.sh          # Build from source
│   ├── deploy.sh         # Deploy to OpenCode
│   └── recover.sh        # FULL RESTORATION
└── RECOVERY.md           # This file

TOTAL: ~2,300 lines documentation + 2,082 lines source
```

---

## QUICK RECOVERY (30 seconds)

### Option 1: Run Recovery Script
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/scripts"
./recover.sh
```

### Option 2: Manual Restore
```bash
# Copy to working project
cp -r src/* ~/OPENCODE_WORKSPACE/projects/trident-brain-code-review/src/
cp -r dist/* ~/.config/opencode/plugins/trident-brain/
cp -r docs/* ~/OPENCODE_WORKSPACE/projects/trident-brain-code-review/docs/
cp pkg/* ~/OPENCODE_WORKSPACE/projects/trident-brain-code-review/
```

---

## BUILD FROM SOURCE

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/pkg"
npm install
npm run build
```

Output: `../dist/` (ready to deploy)

---

## DEPLOY TO OPENCODE

```bash
# Copy dist to plugins
cp -r dist/* ~/.config/opencode/plugins/trident-brain/

# OR use deploy script
cd scripts
./deploy.sh
```

---

## VERIFY INSTALLATION

```bash
# Check deployed files
ls ~/.config/opencode/plugins/trident-brain/

# Should show:
# index.js
# algorithmic-core.js
# *.d.ts (type definitions)
```

---

## TROUBLESHOOTING

### Plugin not loading?
1. Check config: `~/.config/opencode/opencode.json`
2. Verify path ends in `/dist`
3. Restart OpenCode completely

### Build fails?
1. Check Node.js version: `node --version` (need 18+)
2. Run: `npm install` in pkg/
3. Check for TypeScript errors

### Audit hangs?
- Fixed in v3.0 (safetyCount protection)
- If still hangs, run recovery script

### "fix" command doesn't work?
- v3.0 uses `show fix documentation`
- NOT `fix` (blocked for safety)

---

## VERSION INFO

| Item | Version |
|------|---------|
| Plugin | 3.0.0 |
| Source | index.ts (678 lines), algorithmic-core.ts (1404 lines) |
| Pattern Library | 100+ patterns across 12 categories |
| Git Tag | v3.0.0 |
| Build Date | 2026-04-14 |

---

## WHAT'S INCLUDED

### Source Code (Fully Functional)
- `src/index.ts` - Plugin entry with tool enforcement
- `src/algorithmic-core.ts` - All scanners, engines, patterns

### Built Plugin (Ready to Deploy)
- `dist/index.js` - 26KB
- `dist/algorithmic-core.js` - 49KB
- All type definitions and source maps

### Documentation (Complete)
- Architecture specs
- Bug history & fixes
- Mechanical test suite
- Ship reports
- Pattern reference

### Recovery Scripts
- `build.sh` - Build from source
- `deploy.sh` - Deploy to OpenCode
- `recover.sh` - Full restoration

---

## CAPABILITIES (v3.0)

| Feature | Status |
|---------|--------|
| Pattern Detection | ✅ 100+ patterns |
| Real-Time Firewall | ✅ With safetyCount |
| Tool Enforcement | ✅ Blocks edit/write/bash |
| document_fix | ✅ WHY/HOW explanations |
| Proof Verification | ✅ Filesystem checks |
| Hook Analysis | ✅ Cross-plugin detection |
| Resource Estimation | ✅ Memory/token analysis |
| No Duplicates | ✅ Fixed |
| Universal Patterns | ✅ Not agent-specific |

---

## RESTORATION CHECKLIST

After running recovery, verify:

- [ ] Plugin loads in OpenCode
- [ ] "trident" agent appears in dropdown
- [ ] "audit this" works
- [ ] No console errors
- [ ] Findings are accurate (no 100x duplicates)
- [ ] Tool blocking active

---

## AGENT PROMPT FOR RECOVERY

If you need to restore Trident Brain from this folder:

```
Restore the Trident Brain plugin from this directory:
/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/

Steps:
1. Copy src/ files to ~/OPENCODE_WORKSPACE/projects/trident-brain-code-review/src/
2. Copy dist/ files to ~/.config/opencode/plugins/trident-brain/
3. Copy pkg/package.json to ~/OPENCODE_WORKSPACE/projects/trident-brain-code-review/
4. Run: cd ~/OPENCODE_WORKSPACE/projects/trident-brain-code-review && npm install && npm run build
5. Deploy: cp -r dist/* ~/.config/opencode/plugins/trident-brain/
6. Verify: ls ~/.config/opencode/plugins/trident-brain/
```

---

## EMERGENCY RESTORE (Single Command)

```bash
cp -r /home/leviathan/OPENCODE_WORKSPACE/Shared\ Workspace\ Context/Trident\ Brain/Code\ Review\ Mode/dist/* ~/.config/opencode/plugins/trident-brain/ && echo "EMERGENCY RESTORE COMPLETE"
```

This single command restores the built plugin from anchor without rebuilding.

---

## CONTACT / ISSUES

If restoration fails:
1. Check `docs/03_CRASH_ANALYSIS.md` for known issues
2. Check `docs/06_BUG_FIX.md` for bug fixes
3. Run `docs/MECHANICAL_TEST_SUITE.md` tests after restore

---

*RELOAD ANCHOR v3.0 - Last Verified: 2026-04-14*