# ITERATION PROTOCOL — How to Handle File Iterations

**Core Rule: NEVER OVERWRITE. ALWAYS COPY → ITERATE → SWAP.**

---

## Why This Protocol Exists

Every iteration (V1.0 → V1.1 → V1.2...) must produce a new set of files. The original V1.0 files must remain intact and restorable at all times. If a build breaks something, restoring V1.0 must be possible by renaming files — no git needed, no "let me check what changed" needed.

---

## The Four States of a File

### State 1: ACTIVE (current working version)
```
src/index.ts
```
The file the build agent is currently editing.

### State 2: ITERATED (new version, not yet active)
```
src/index.v1.1.0.ts
```
The new version. Ready to test. Original still intact.

### State 3: ARCHIVED (previous version, preserved)
```
src/index.v1.0.ts
```
Original V1.0. Can be restored by renaming back to `index.ts`.

### State 4: BACKUP (off-site copy)
```
../shark-agent-v1.0-backup/src/index.ts
```
Full directory backup. Used only if both active and archived versions are lost/corrupted.

---

## Iteration Flow

### Step 1: Before Any Edit — Create Backup

```bash
# Before starting V1.1 work, backup everything
mkdir -p ../shark-agent-v1.0-backup
cp -r src ../shark-agent-v1.0-backup/
```

### Step 2: Create New Version (Never Edit Original)

```bash
# WRONG (violates protocol):
vim src/index.ts  # DO NOT DO THIS

# CORRECT:
cp src/index.ts src/index.v1.1.0.ts   # Copy first
vim src/index.v1.1.0.ts               # Edit the copy
```

### Step 3: Verify Before Swap

Run all pre-build checks from `REFERENCE/VERIFICATION.md`.

**STOP if checks fail.** Keep original intact. Debug the new version.

### Step 4: Swap (Original Becomes Archived)

```bash
# After verification passes:
mv src/index.ts src/index.v1.0.ts       # Original → archived
mv src/index.v1.1.0.ts src/index.ts    # New → active
```

### Step 5: Build and Post-Verify

```bash
bun build ...
# Run post-build checks
```

### Step 6: If Build Fails

```bash
# Restore from archived:
mv src/index.v1.0.ts src/index.ts       # Restore original
# Fix bugs in src/index.v1.1.0.ts
# Repeat verification
```

### Step 7: If Archive Also Corrupted

```bash
# Restore from backup directory:
rm -rf src
cp -r ../shark-agent-v1.0-backup/src .
```

---

## File Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Plugin entry | `index.v{N}.{N}.{N}.ts` | `index.v1.1.0.ts` |
| Tool files | `name.v{N}.{N}.{N}.ts` | `shark-evidence.v1.1.0.ts` |
| Hook directories | `hooks/v{N}.{N}.{N}/` | `hooks/v1.1.0/` |
| Hook files | No version suffix (within versioned dir) | `hooks/v1.1.0/index.ts` |
| Backups | `../shark-agent-v{N}.{N}-backup/` | `../shark-agent-v1.0-backup/` |

---

## Hook File Exception

Hook files live in versioned directories (`src/hooks/v1.1.0/`). They do NOT get version suffixes on individual files within the directory. The directory IS the version marker.

```
src/hooks/v1.1.0/index.ts          ← V1.1.0 hooks (no suffix on file)
src/hooks/v1.2.0/index.ts          ← V1.2.0 hooks (new directory)
src/hooks/v1.1.0/guardian-hook.ts ← V1.1.0 guardian hook (no suffix)
```

When upgrading from V1.1.0 to V1.2.0:
1. Create `src/hooks/v1.2.0/` directory
2. Copy `src/hooks/v1.1.0/` files to `src/hooks/v1.2.0/`
3. Edit files in `src/hooks/v1.2.0/` only
4. Update `src/index.ts` to import from `v1.2.0`

---

## Critical Files That Must Never Be Overwritten

| File | Why |
|------|-----|
| `src/index.ts` (original) | Becomes `src/index.v1.0.ts` — your restore point |
| `src/tools/shark-evidence.ts` (original) | Becomes `src/tools/shark-evidence.v1.0.ts` |
| `src/shark/shared/guardian.ts` | Copied from boilerplate, not modified |
| `src/shark/shared/gates.ts` | Copied from boilerplate, not modified |
| `src/shark/shared/evidence.ts` | Copied from boilerplate, not modified |

Only `src/index.ts` and tool files that need fixing get versioned copies. Shared components (`src/shark/shared/`) are NOT modified — they are V1.0 artifacts that V1.1.0 hooks INTO, not edits.

---

## Session and Compacting State Protocol

State persistence files go into the workspace:

```
{workspace}/.shark/
├── sessions/
│   └── {sessionID}/
│       └── gate-state.json    ← Snapshotted on session.compacting
├── evidence/
│   └── {gate}/
│       └── {timestamp}/
├── shark-context/             ← Deployed context library
└── gate-manager.json          ← Current gate state (if persisted)
```

**Protocol:**
- `session.created` → initialize fresh state, ensure `.shark/` exists
- `session.compacting` → snapshot to `{workspace}/.shark/sessions/{sessionID}/gate-state.json`
- On restart → check for `gate-state.json` and `restore()` if found

---

## Restoration Checklist

If V1.1 breaks and you need to restore V1.0:

```bash
cd /home/leviathan/OPENCODE_WORKSPACE/projects/shark-agent-v4

# Step 1: Stop using V1.1
mv src/index.ts src/index.v1.1.0.ts        # Keep V1.1 as archive
mv src/index.v1.0.ts src/index.ts          # Restore V1.0

# Step 2: Restore original tools
mv src/tools/shark-evidence.ts src/tools/shark-evidence.v1.1.0.ts
mv src/tools/shark-evidence.v1.0.ts src/tools/shark-evidence.ts

# Step 3: Rebuild
bun build src/index.ts --outdir dist --target bun --format esm --bundle

# Step 4: Verify
opencode --reload-plugins
opencode --agent shark-micro "help"
```

---

## Version Bump Protocol

| Event | Action |
|-------|--------|
| 3 VERIFY failures in a row | V1.0 → V1.1 (iteration, not plugin version) |
| Hook integration fix | V1.0.0 → V1.1.0 (plugin version bump) |
| New enforcement feature | V1.1.0 → V1.2.0 (plugin version bump) |
| Breaking hook API change | V1.N.0 → V2.0.0 (major version bump) |

**Note:** Shark's "V1.N" iteration version (V1.0, V1.1, V1.2...) tracks the build iteration loop — how many times VERIFY has failed and escalated to PLAN. This is independent of the plugin's semantic version.

---

*Iteration Protocol: Never overwrite, always archive, restore by rename.*
