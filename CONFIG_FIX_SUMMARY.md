# OpenCode Config Fix - Quick Reference

## Problem Solved
**Sisyphus mode was missing** from fresh OpenCode sessions after v1.3.4 update.

## Quick Fix (Already Applied)
```bash
# 1. Move config files
mv ~/.config/opencode/opencode/opencode.json ~/.config/opencode/
mv ~/.config/opencode/opencode/opencode-ultra.json ~/.config/opencode/
mv ~/.config/opencode/opencode/skills ~/.config/opencode/

# 2. Update dependencies
echo '{
  "dependencies": {
    "@opencode-ai/plugin": "1.3.4",
    "opencode-ultra": "0.9.9"
  }
}' > ~/.config/opencode/package.json

# 3. Install plugin
cd ~/.config/opencode && bun install

# 4. Clean up
rm -rf ~/.config/opencode/opencode/
```

## Verification Commands
```bash
# Check plugin loading
opencode debug config | grep -A2 '"plugin"'

# Check default agent
opencode debug config | grep '"default_agent"'

# Test sisyphus
opencode run --agent sisyphus "Test"
```

## Current Status
✅ **FIXED** - Sisyphus mode restored  
✅ **Config migrated** to v1.3.4 structure  
✅ **All ultra plugin agents available**  
✅ **Backup preserved** at `~/.config/opencode.backup.before-fix-20260329-0544/`

## Prevention for Future Updates
```bash
# Before updating OpenCode:
cp -r ~/.config/opencode ~/.config/opencode.backup-$(date +%Y%m%d)

# After updating:
opencode debug config --print-logs
```

## Documentation
- Full analysis: `OPENCODE_CONFIG_MIGRATION_BUG_20260329.md`
- Issue log: `ISSUE_LOG.md`

---
*Fix applied: 2026-03-29 05:46 UTC*  
*OpenCode v1.3.4, opencode-ultra@0.9.9*