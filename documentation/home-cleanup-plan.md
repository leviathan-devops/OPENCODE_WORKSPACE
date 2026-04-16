# Home Directory Cleanup Plan for OpenCode Workspace

## Executive Summary
**Primary workspace**: `/home/leviathan/OPENCODE_WORKSPACE/` (495MB)  
**Total recoverable space**: ~1.5GB (excluding 9.6GB models)  
**Safe deletion categories**: Backup directories, caches, test files, duplicates

## 🎯 Default Workspace Configuration

### ✅ **OpenCode Default Workspace Set**
- **Active config**: `~/.config/opencode/opencode.json`
- **Workspace location**: `/home/leviathan/OPENCODE_WORKSPACE/`
- **Status**: Configured and verified
- **Migration complete**: All path references updated

## 🗑️ Safe Deletion Categories

### Category 1: Backup Directories (SAFE - 1.5GB)
```bash
# OpenCode config backups
rm -rf ~/.config/opencode.backup.20260326-020049
rm -rf ~/.config/opencode.backup.20260329-010242
rm -rf ~/.config/opencode.backup.before-fix-20260329-054410
rm -rf ~/.config/opencode.old

# Migration archives
rm -rf ~/.migration-archive-20260329-055256
rm -rf ~/.migration-backup-20260329-054520

# OpenFang backups (5 versions)
rm -rf ~/.openfang.backup-1773685923
rm -rf ~/.openfang.backup-1773686174
rm -rf ~/.openfang.backup-1773686302
rm -rf ~/.openfang.backup-1773686644
rm -rf ~/.openfang.backup-1773686738

# Qwen config backups (5 versions)
rm -rf ~/.qwen.backup
rm -rf ~/.qwen.backup.1773972587
rm -rf ~/.qwen.backup.1773972619
rm -rf ~/.qwen.backup.1773972656
rm -rf ~/.qwen.backup.1773972943
```

### Category 2: Cache Directories (SAFE - 500MB+)
```bash
# System caches (can be cleared)
rm -rf ~/.cache/*
rm -rf ~/.npm/_cacache
rm -rf ~/.npm/_logs
rm -rf ~/.ruff_cache
rm -rf ~/.triton/cache
rm -rf ~/.cargo/.global-cache
rm -rf ~/.cargo/.package-cache*
rm -rf ~/.factory/cache
rm -rf ~/.factory/logs
rm -rf ~/.factory/temp
rm -rf ~/.hermes/logs
rm -rf ~/.qwen/tmp
rm -rf ~/.qwen.backup*/tmp
```

### Category 3: Test & Debug Files (SAFE - 100+ files)
```bash
# Python test files
rm -f ~/test_*.py
rm -f ~/fix_*.py
rm -f ~/debug_*.py
rm -f ~/ask_*.py
rm -f ~/final_*.py
rm -f ~/working_*.py
rm -f ~/simple_*.py
rm -f ~/real_*.py
rm -f ~/stealth_*.py
rm -f ~/prove_*.py
rm -f ~/brain_*.py
rm -f ~/auth_*.py
rm -f ~/google_*.py
rm -f ~/zai_*.py

# Shell test scripts
rm -f ~/test-*.sh
rm -f ~/fix-*.sh
rm -f ~/debug-*.sh
rm -f ~/final-*.sh
rm -f ~/working-*.sh
rm -f ~/simple-*.sh
rm -f ~/start-*.sh
rm -f ~/setup-*.sh
rm -f ~/apply-*.sh
rm -f ~/verify-*.sh
rm -f ~/qwen-*.sh

# Old logs
rm -f ~/vllm-*.log
rm -f ~/agent-800*.log
rm -f ~/final-verification-test.log
rm -f ~/vllm-error-diagnosis.log
```

### Category 4: Duplicate Projects (SAFE - 5.2MB)
```bash
# Remove duplicate symlink target (full project in workspace)
rm -rf ~/shark-frankenstein
```

### Category 5: Old Virtual Environments (SAFE - 50MB+)
```bash
rm -rf ~/venv
rm -rf ~/projects/brain-bridge/venv
```

## ⚠️ Caution Items (Review Before Deleting)

### Active Services & Logs
```bash
# Check if these are active before deleting:
# ~/.pm2/logs/openviking-*.log
# ~/.pm2/pids/openviking-4.pid
# ~/.openviking/data/.openviking.pid
# ~/openviking_workspace/.openviking.pid
# ~/vllm.log (if vLLM is running)
# ~/projects/openfang.log
# ~/projects/openviking.log
```

### Configuration Files
```bash
# Review these configs before deletion:
# ~/.env
# ~/.aider/.env
# ~/.hermes/.env
# ~/.openfang/.env
# ~/nofx/.env
```

## 🚫 DO NOT DELETE (Critical)

### OpenCode System
```
~/.config/opencode/              # ACTIVE OpenCode configuration
~/.cache/opencode/               # OpenCode cache (models.json)
~/.npm-global/lib/node_modules/opencode-ai/  # OpenCode installation
~/.local/share/opencode/         # OpenCode data storage
```

### Workspace & AI Models
```
~/OPENCODE_WORKSPACE/            # PRIMARY workspace (495MB)
~/models/                        # AI models (9.6GB - CRITICAL)
```

### System & User Files
```
~/.bashrc, ~/.bash_profile, ~/.profile
~/.ssh/
~/.gnupg/
~/Documents/, ~/Downloads/, ~/Pictures/
~/snap/
~/Applications/
~/Desktop/, ~/Music/, ~/Videos/, ~/Templates/
```

## 🛡️ Safety Protocol

### 1. Create Backup
```bash
# Create timestamped backup
BACKUP_DIR="/tmp/home-cleanup-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup caution items
cp -r ~/.env "$BACKUP_DIR/" 2>/dev/null || true
cp -r ~/.aider/.env "$BACKUP_DIR/aider.env" 2>/dev/null || true
cp -r ~/.hermes/.env "$BACKUP_DIR/hermes.env" 2>/dev/null || true
cp -r ~/.openfang/.env "$BACKUP_DIR/openfang.env" 2>/dev/null || true
cp -r ~/nofx/.env "$BACKUP_DIR/nofx.env" 2>/dev/null || true

echo "Backup created at: $BACKUP_DIR"
```

### 2. Test OpenCode Functionality
```bash
# Verify OpenCode works before cleanup
/home/leviathan/.npm-global/lib/node_modules/opencode-ai/bin/opencode debug config > /dev/null && echo "✅ OpenCode config valid"
```

### 3. Gradual Cleanup Script
```bash
#!/bin/bash
# gradual-cleanup.sh
set -e

echo "Starting gradual cleanup..."
echo "Step 1: Backup directories"
# Add commands from Category 1

echo "Step 2: Cache directories"
# Add commands from Category 2

echo "Step 3: Test files"
# Add commands from Category 3

echo "Step 4: Verify OpenCode still works"
/home/leviathan/.npm-global/lib/node_modules/opencode-ai/bin/opencode debug config > /dev/null && echo "✅ OpenCode still functional"

echo "Cleanup complete!"
```

## 📊 Space Recovery Summary

| Category | Estimated Space | Safety Level |
|----------|----------------|--------------|
| Backup directories | 1.5GB | ✅ SAFE |
| Cache directories | 500MB+ | ✅ SAFE |
| Test/debug files | 100+ files | ✅ SAFE |
| Duplicate projects | 5.2MB | ✅ SAFE |
| Old virtual envs | 50MB+ | ✅ SAFE |
| **Total recoverable** | **~2.1GB** | **✅ SAFE** |

## 🎯 Post-Cleanup Verification

1. **OpenCode functionality**: Run test command
2. **Workspace integrity**: Check `~/OPENCODE_WORKSPACE/` structure
3. **Model accessibility**: Verify `~/models/` still accessible
4. **Active services**: Check PM2, vLLM, OpenViking still running

## 📍 Default Workspace Confirmation

**All new OpenCode sessions will use**: `/home/leviathan/OPENCODE_WORKSPACE/`

**Verification**: 
```bash
cd /home/leviathan/OPENCODE_WORKSPACE
/home/leviathan/.npm-global/lib/node_modules/opencode-ai/bin/opencode run "Test workspace"
```

**Result**: OpenCode will operate from the consolidated workspace with all projects, configs, and tools in one location.