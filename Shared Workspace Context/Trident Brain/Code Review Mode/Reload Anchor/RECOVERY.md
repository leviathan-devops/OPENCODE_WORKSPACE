# TRIDENT BRAIN v3.0.1 - RELOAD ANCHOR & RECOVERY GUIDE
## Self-Contained Restoration Package

**Version:** 3.0.1
**Status:** SHIP READY ✅
**Date:** 2026-04-16

---

## PURPOSE

This folder is the **UNIVERSAL RELOAD ANCHOR** for Trident Brain v3.0.1.

If the working plugin becomes corrupted, broken, or fails to load:
1. Point any agent at this folder
2. Say "restore trident brain from this folder"
3. The plugin will be fully restored

---

## FOLDER STRUCTURE

```
Reload Anchor/ (THIS FOLDER)
├── src/                    # TypeScript source
│   ├── index.ts           # Plugin entry, hooks, commands (768 lines)
│   └── algorithmic-core.ts # Patterns, scanners, engines (1699 lines)
├── dist/                   # Built plugin (READY TO DEPLOY)
│   ├── index.js           # Entry point (674 lines)
│   └── algorithmic-core.js # Core logic (1304 lines)
├── pkg/                    # Package files
│   ├── package.json       # v3.0.1
│   └── tsconfig.json
├── docs/                   # Full documentation (14 files)
├── scripts/               # Recovery scripts
│   ├── build.sh          # Build from source
│   ├── deploy.sh         # Deploy to OpenCode
│   └── recover.sh        # FULL RESTORATION
├── INDEX.md               # Quick reference
├── RECOVERY.md           # This file
└── VERSION_HISTORY.md    # Full changelog
```

---

## QUICK RECOVERY (30 seconds)

### Option 1: Run Recovery Script
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/scripts"
./recover.sh
```

### Option 2: Manual Restore
```bash
# Copy dist to OpenCode plugins
cp -r "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor/dist/"* \
  ~/.config/opencode/plugins/trident-brain/
```

### Option 3: Rebuild from Source
```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor"
npm install
npm run build
```

---

## BUILD FROM SOURCE

```bash
cd "/home/leviathan/OPENCODE_WORKSPACE/Shared Workspace Context/Trident Brain/Code Review Mode/Reload Anchor"
npm install
npm run build
```

Output: `dist/` (ready to deploy)

---

## DEPLOY TO OPENCODE

```bash
# Copy dist to plugins
cp -r dist/* ~/.config/opencode/plugins/trident-brain/

# Add to opencode.json if not present:
# "file:///home/leviathan/.config/opencode/plugins/trident-brain/index.js"
```

---

## ROOT CAUSE: Why Agent Ran Forever (v2.x)

The `tool.execute.before` hook blocked ALL edit/bash tools. When Trident started an audit:

1. Hook fires → blocks bash/edit
2. Blocked tools return error
3. Audit logic retried → got blocked again → infinite loop

**Fix in v3.0.1**: Path parsing bug was causing the audit to fail silently. The regex `/[\/\.\~\w-]+\/?/` matched "audit" in "audit /path" because `\w` matches word characters. Fixed to only match paths starting with `/`, `.`, or `~`.

---

## VERIFICATION

**Container Tests (Docker):** 7/7 PASSED

| Test | Result |
|------|--------|
| status command | ✅ |
| help command | ✅ |
| audit /path | ✅ |
| verify command | ✅ |
| Block edit/bash | ✅ |
| Allow test scripts | ✅ |

---

## WORKING PROJECT LOCATION

For development work:
```
/home/leviathan/OPENCODE_WORKSPACE/projects/trident-brain-v3.0/
```

This is where active development happens. The Reload Anchor is for recovery only.

---

*Last Updated: 2026-04-16*