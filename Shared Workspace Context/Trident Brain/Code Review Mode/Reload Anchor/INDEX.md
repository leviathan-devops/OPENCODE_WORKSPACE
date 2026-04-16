# TRIDENT BRAIN v3.0.1 - RELOAD ANCHOR
## Universal Recovery Point - SELF-CONTAINED

**Version:** 3.0.1
**Status:** SHIP READY ✅
**Date:** 2026-04-16

---

## QUICK RECOVERY (30 seconds)

### Option 1: Run Recovery Script
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/scripts"
./recover.sh
```

### Option 2: Manual Deploy
```bash
cp -r "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/dist/"* \
  ~/.config/opencode/plugins/trident-brain/
```

### Option 3: Add to OpenCode
Add to `~/.config/opencode/opencode.json` under "plugin":
```json
"file:///home/leviathan/.config/opencode/plugins/trident-brain/index.js"
```

---

## FOLDER STRUCTURE

| Folder | Contents |
|--------|----------|
| `src/` | TypeScript source (index.ts + algorithmic-core.ts) |
| `dist/` | Built plugin (READY TO DEPLOY) |
| `pkg/` | package.json, tsconfig.json |
| `docs/` | 14 documentation files |
| `scripts/` | build.sh, deploy.sh, recover.sh |

---

## VERSION HISTORY

| Version | Date | Status |
|---------|------|--------|
| 3.0.1 | 2026-04-16 | **CURRENT** - Path parsing fix, container tested |
| 3.0.0 | 2026-04-15 | Initial consolidated release |

---

## FIXES IN v3.0.1

| Issue | Fix |
|-------|-----|
| Path parsing regex | Fixed to only match `/`, `.`, `~` paths |
| Memory limits | 20MB per file, 100MB total |
| Binary files | UTF-8 validation |
| Infinite loops | safetyCount + maxMatches on all regex |
| Tool enforcement | tool.execute.before blocks edit/bash |

---

## CONTAINER TESTED (Docker)

All commands verified working:
- ✅ status
- ✅ help
- ✅ audit /path
- ✅ verify
- ✅ tool hook blocks edit/bash
- ✅ tool hook allows test scripts

---

## BUILD FROM SOURCE

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor"
npm install
npm run build
```

---

*Universal reload point - restore from here if Trident breaks*