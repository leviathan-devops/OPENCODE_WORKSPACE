# Qwen Code Config Protection System

## ✅ Implementation Complete

All guardrails are now active to protect against accidental config breaks while keeping YOLO mode enabled.

---

## Protection Layers Implemented

### Layer 1: File Locking (Immutable Flag) 🔒
```bash
# Config files are now LOCKED
sudo chattr +i ~/.qwen/settings.json ~/.qwen/config.json
```
**Effect:** Agents get "Operation not permitted" instead of silently breaking configs.

**To edit legitimately:**
```bash
sudo chattr -i ~/.qwen/settings.json  # Unlock
# Make your edit
sudo chattr +i ~/.qwen/settings.json  # Re-lock
```

---

### Layer 2: Auto-Backup System 📁
```bash
~/.qwen-backup-config
```
- Creates timestamped backups before any changes
- Keeps last 10 backups automatically
- Stored in: `~/.qwen/backups/`

---

### Layer 3: Config Validation 🔍
```bash
~/.qwen-validate-config
```
**Checks:**
- ✅ Files exist (not deleted)
- ✅ `selectedType: openai`
- ✅ Model: `glm-4.5-flash`
- ✅ Endpoint: `api.z.ai`
- ✅ Timeout: 900s
- ✅ API key present and valid format

**Run this:**
- Before editing configs (baseline check)
- After editing configs (verify it worked)
- When qwen stops working (diagnose)

---

### Layer 4: One-Command Restore 🚑
```bash
~/.qwen-restore-config
```
**What it does:**
1. Backs up broken config first
2. Restores known-working GLM API configuration
3. Tells you to restart terminal

**Run this when:** Config breaks and you need instant recovery

---

### Layer 5: Git Versioning 📜
```bash
# Initialize (done automatically)
qwen-config-git-init

# Save current config to git history
qwen-config-save

# View history
qwen-config-history

# Restore specific version
qwen-config-restore <commit-hash>
```

**Git repo location:** `~/.qwen/.git/`

---

### Layer 6: Agent Guidelines 📋
Location: `~/.qwen/QWEN.md`

**Rules for agents:**
1. READ config files before editing
2. VALIDATE before and after changes
3. BACKUP before any modification
4. NEVER delete config files
5. Edit minimally - don't rewrite entire files

---

## Quick Reference

| Problem | Solution |
|---------|----------|
| Config broken | `~/.qwen-restore-config` |
| Check if working | `~/.qwen-validate-config` |
| Before editing | `~/.qwen-backup-config` |
| Locked file error | `sudo chattr -i ~/.qwen/settings.json` |
| View git history | `qwen-config-history` |
| Restore from git | `qwen-config-restore <hash>` |

---

## Scripts Created

| Script | Purpose |
|--------|---------|
| `~/.qwen-restore-config` | Instant recovery to working state |
| `~/.qwen-validate-config` | Check config health |
| `~/.qwen-backup-config` | Create timestamped backup |
| `~/.qwen-config-git` | Git versioning functions |
| `~/.qwen/QWEN.md` | Agent guidelines |

---

## Directories Created

| Directory | Purpose |
|-----------|---------|
| `~/.qwen/backups/` | Timestamped config backups |
| `~/.qwen/.git/` | Git version history |

---

## Testing

```bash
# All should pass:
~/.qwen-validate-config
# ✅ VALIDATION PASSED: All checks OK

# Test restore (unlocks, restores, relocks):
~/.qwen-restore-config
# ✅ Config restored to working GLM API configuration

# Test backup:
~/.qwen-backup-config
# ✅ Backed up settings.json and config.json
```

---

## Bash Aliases Added

Added to `~/.bashrc`:
```bash
source ~/.qwen-config-git  # Provides qwen-config-* commands
```

**Available after restart:**
- `qwen-config-save` - Save config to git
- `qwen-config-history` - View git history
- `qwen-config-restore` - Restore from git

---

## What This Prevents

| Failure | Protection |
|---------|------------|
| Agent deletes config files | ❌ Blocked by chattr +i |
| Agent overwrites with wrong values | ❌ Blocked by chattr +i |
| Agent sets empty api_key | 🔍 Caught by validation |
| Agent changes endpoint | 🔍 Caught by validation |
| Multiple terminal conflicts | 📁 Backups + git history |
| No recovery path | 🚑 One-command restore |

---

## Maintenance

**Weekly (optional):**
```bash
# Clean up old backups (auto-keeps last 10)
~/.qwen-backup-config

# View git history
qwen-config-history

# Validate config
~/.qwen-validate-config
```

---

**Status:** ✅ All layers active  
**Last Updated:** 2026-03-21  
**Config Status:** ✅ VALIDATED + LOCKED + BACKED UP + GIT COMMITTED
